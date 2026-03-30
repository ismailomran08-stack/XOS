/* ================================================
   XOS — Customizable Dashboard Widget System
   Drag-and-drop, resizable, per-user layouts
   ================================================ */

// Widget catalog — all available widgets
const WIDGET_CATALOG = [
  { type: 'stat-active-projects', title: 'Active Projects', category: 'Overview', defaultSize: 'sm' },
  { type: 'stat-outstanding-invoices', title: 'Outstanding Invoices', category: 'Finance', defaultSize: 'sm' },
  { type: 'stat-open-estimates', title: 'Open Estimates', category: 'Finance', defaultSize: 'sm' },
  { type: 'stat-total-profit', title: 'Total Profit', category: 'Finance', defaultSize: 'sm' },
  { type: 'stat-total-expenses', title: 'Expenses', category: 'Finance', defaultSize: 'sm', needsConfig: true },
  { type: 'stat-sub-liability', title: 'Sub Liability', category: 'Subcontractors', defaultSize: 'sm' },
  { type: 'stat-team-tasks', title: 'Open Tasks', category: 'Operations', defaultSize: 'sm' },
  { type: 'stat-overdue', title: 'Overdue Items', category: 'Overview', defaultSize: 'sm' },
  { type: 'recent-activity', title: 'Recent Activity', category: 'Overview', defaultSize: 'md' },
  { type: 'active-projects-table', title: 'Active Projects', category: 'Overview', defaultSize: 'lg' },
  { type: 'outstanding-invoices-table', title: 'Outstanding Invoices', category: 'Finance', defaultSize: 'md' },
  { type: 'expense-summary', title: 'Expense Breakdown', category: 'Finance', defaultSize: 'md' },
  { type: 'profit-by-project', title: 'Profit by Project', category: 'Finance', defaultSize: 'lg' },
  { type: 'monthly-chart', title: 'Monthly Revenue', category: 'Finance', defaultSize: 'lg' },
  { type: 'sub-liability-list', title: 'Sub Payments Due', category: 'Subcontractors', defaultSize: 'md' },
  { type: 'recent-payments', title: 'Recent Payments', category: 'Finance', defaultSize: 'md' },
  { type: 'pipeline-summary', title: 'Pipeline Summary', category: 'Growth', defaultSize: 'md' },
  { type: 'tasks-list', title: 'My Tasks', category: 'Operations', defaultSize: 'md' },
  { type: 'receipt-capture', title: 'Quick Receipt Capture', category: 'Operations', defaultSize: 'sm' },
  { type: 'project-spotlight', title: 'Project Spotlight', category: 'Overview', defaultSize: 'md', needsConfig: true },
];

const WIDGET_SIZES = { sm: '3', md: '6', lg: '9', full: '12' };
// Grid is 12 columns. Widgets store colSpan (1-12) for free-form sizing.

// Default layout for new users
const DEFAULT_LAYOUT = [
  { type: 'stat-active-projects', size: 'sm', id: 'w1' },
  { type: 'stat-outstanding-invoices', size: 'sm', id: 'w2' },
  { type: 'stat-open-estimates', size: 'sm', id: 'w3' },
  { type: 'stat-total-profit', size: 'sm', id: 'w4' },
  { type: 'recent-activity', size: 'md', id: 'w5' },
  { type: 'outstanding-invoices-table', size: 'md', id: 'w6' },
  { type: 'active-projects-table', size: 'lg', id: 'w7' },
  { type: 'receipt-capture', size: 'sm', id: 'w8' },
];

let _dashboardEditMode = false;
let _dragWidget = null;

function getUserLayout() {
  var key = 'xos_dashboard_' + (currentUser ? currentUser.email : 'default');
  var stored = localStorage.getItem(key);
  if (stored) {
    try { return JSON.parse(stored); } catch(e) {}
  }
  return DEFAULT_LAYOUT.map(function(w) { return Object.assign({}, w); });
}

function saveUserLayout(layout) {
  var key = 'xos_dashboard_' + (currentUser ? currentUser.email : 'default');
  localStorage.setItem(key, JSON.stringify(layout));
}

// ---- Widget renderers ----
function renderWidgetContent(widget) {
  var t = widget.type;

  if (t === 'stat-active-projects') {
    var liveProjects = DEMO_PROJECTS.filter(function(p) { return p.status !== 'archived' && p.status !== 'lost'; });
    var count = liveProjects.filter(function(p) { return p.status === 'active'; }).length;
    return clickableWidget('projects', miniStatWidget('Active Projects', count, liveProjects.length + ' total', 'fas fa-hard-hat', 'var(--blue)'));
  }
  if (t === 'stat-outstanding-invoices') {
    var owing = DEMO_INVOICES.filter(function(i) { return i.status !== 'paid'; }).reduce(function(s, i) { return s + i.amount - i.amount_paid; }, 0);
    return clickableWidget('invoices', miniStatWidget('Outstanding', formatCAD(owing), DEMO_INVOICES.filter(function(i) { return i.status !== 'paid'; }).length + ' unpaid', 'fas fa-file-invoice-dollar', 'var(--orange)'));
  }
  if (t === 'stat-open-estimates') {
    var open = DEMO_ESTIMATES.filter(function(e) { return e.status === 'draft' || e.status === 'sent'; }).length;
    return clickableWidget('estimates', miniStatWidget('Open Estimates', open, DEMO_ESTIMATES.length + ' total', 'fas fa-file-invoice', 'var(--purple)'));
  }
  if (t === 'stat-total-profit') {
    var collected = DEMO_INVOICES.reduce(function(s, i) { return s + i.amount_paid; }, 0);
    var expenses = DEMO_EXPENSES.reduce(function(s, e) { return s + e.amount; }, 0);
    var subCosts = 0;
    Object.values(DEMO_SUB_ASSIGNMENTS).forEach(function(a) { a.forEach(function(x) { subCosts += x.amount_paid; }); });
    var profit = collected - expenses - subCosts;
    return clickableWidget('finances', miniStatWidget('Total Profit', formatCAD(profit), profit >= 0 ? 'Positive' : 'Negative', 'fas fa-chart-line', profit >= 0 ? 'var(--green)' : 'var(--red)'));
  }
  if (t === 'stat-total-expenses') {
    var filter = widget.config_expense_filter || 'all';
    var dateFrom = widget.config_date_from || '';
    var dateTo = widget.config_date_to || '';
    var filtered;
    var filterLabel;
    if (filter === 'all') {
      filtered = DEMO_EXPENSES;
      filterLabel = 'All';
    } else if (filter === 'trivex-corp') {
      filtered = DEMO_EXPENSES.filter(function(e) { return e.project_id === 'trivex-corp'; });
      filterLabel = 'Trivex Corp';
    } else {
      filtered = DEMO_EXPENSES.filter(function(e) { return e.project_id === filter; });
      var proj = DEMO_PROJECTS.find(function(p) { return p.id === filter; });
      filterLabel = proj ? proj.name.split('—')[0].trim() : filter;
    }
    // Date filter
    if (dateFrom) filtered = filtered.filter(function(e) { return e.expense_date >= dateFrom; });
    if (dateTo) filtered = filtered.filter(function(e) { return e.expense_date <= dateTo; });
    var dateLabel = '';
    if (dateFrom && dateTo) dateLabel = dateFrom.slice(5) + ' — ' + dateTo.slice(5);
    else if (dateFrom) dateLabel = 'From ' + dateFrom.slice(5);
    else if (dateTo) dateLabel = 'To ' + dateTo.slice(5);

    var total = filtered.reduce(function(s, e) { return s + e.amount; }, 0);
    return clickableWidget('expenses',
      miniStatWidget('Expenses', formatCAD(total), filtered.length + ' receipts · ' + filterLabel + (dateLabel ? ' · ' + dateLabel : ''), 'fas fa-receipt', 'var(--red)')
    );
  }
  if (t === 'stat-sub-liability') {
    var owing2 = 0;
    Object.values(DEMO_SUB_ASSIGNMENTS).forEach(function(a) { a.forEach(function(x) { owing2 += x.contract_amount - x.amount_paid; }); });
    return clickableWidget('subcontractors', miniStatWidget('Sub Liability', formatCAD(owing2), 'Owing to subs', 'fas fa-hard-hat', 'var(--orange)'));
  }
  if (t === 'stat-team-tasks') {
    var open2 = DEMO_TASKS.filter(function(t2) { return !t2.completed; }).length;
    return clickableWidget('schedule', miniStatWidget('Open Tasks', open2, DEMO_TASKS.filter(function(t2) { return !t2.completed && t2.due_date < '2026-03-28'; }).length + ' overdue', 'fas fa-tasks', 'var(--blue)'));
  }
  if (t === 'stat-overdue') {
    var overdueInv = DEMO_INVOICES.filter(function(i) { return i.status !== 'paid' && i.due_date < '2026-03-28'; }).length;
    var overdueTasks = DEMO_TASKS.filter(function(t2) { return !t2.completed && t2.due_date < '2026-03-28'; }).length;
    return clickableWidget('finances', miniStatWidget('Overdue', overdueInv + overdueTasks, overdueInv + ' invoices, ' + overdueTasks + ' tasks', 'fas fa-exclamation-triangle', 'var(--red)'));
  }

  if (t === 'recent-activity') {
    return clickableWidget(null,
      '<div style="padding:4px 0;">' +
      '<ul class="activity-list">' +
        activityItem('var(--green)', 'Saud submitted receipt — Home Depot $2,340.50', '2 hours ago') +
        activityItem('var(--blue)', 'Invoice INV-2026-002 partially paid — $80,000', '5 hours ago') +
        activityItem('var(--orange)', 'Popeyes Scarborough moved to Punch List', 'Yesterday') +
        activityItem('var(--purple)', 'New estimate created — Jersey Mikes Oakville', '2 days ago') +
        activityItem('var(--green)', 'Drawing approved — Tim Hortons Signage Package', '3 days ago') +
      '</ul></div>'
    );
  }

  if (t === 'receipt-capture') {
    return '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;text-align:center;height:100%;">' +
      '<button class="receipt-capture-btn" onclick="openReceiptCapture()" style="width:100%;padding:16px;font-size:14px;">' +
        '<i class="fas fa-camera"></i> Capture Receipt' +
      '</button>' +
    '</div>';
  }

  if (t === 'active-projects-table') {
    var projects = DEMO_PROJECTS.filter(function(p) { return p.status !== 'complete' && p.status !== 'archived' && p.status !== 'lost'; }).slice(0, 6);
    var html = '<div style="overflow-x:auto;"><table class="data-table"><thead><tr><th>Project</th><th>Client</th><th>Status</th><th>Progress</th></tr></thead><tbody>';
    projects.forEach(function(p) {
      html += '<tr style="cursor:pointer;" onclick="viewProject(\'' + p.id + '\')">' +
        '<td><strong>' + p.name + '</strong></td>' +
        '<td class="text-muted">' + p.client_brand + '</td>' +
        '<td><span class="status-badge status-' + p.status + '">' + formatStatus(p.status) + '</span></td>' +
        '<td><div style="display:flex;align-items:center;gap:6px;"><div class="progress-bar" style="flex:1;"><div class="progress-fill" style="width:' + p.completion_pct + '%;background:var(--orange);"></div></div><span style="font-size:12px;font-weight:600;">' + p.completion_pct + '%</span></div></td>' +
      '</tr>';
    });
    html += '</tbody></table></div>';
    return html;
  }

  if (t === 'outstanding-invoices-table') {
    var invs = DEMO_INVOICES.filter(function(i) { return i.status !== 'paid'; });
    var html2 = '<div style="overflow-x:auto;"><table class="data-table"><thead><tr><th>Invoice</th><th>Balance</th><th>Due</th><th>Status</th></tr></thead><tbody>';
    invs.forEach(function(inv) {
      var bal = inv.amount - inv.amount_paid;
      html2 += '<tr style="cursor:pointer;" onclick="viewInvoice(\'' + inv.id + '\')">' +
        '<td><strong>' + inv.invoice_number + '</strong></td>' +
        '<td style="font-weight:600;color:var(--red);">' + formatCAD(bal) + '</td>' +
        '<td>' + inv.due_date + '</td>' +
        '<td><span class="status-badge status-' + inv.status + '">' + formatStatus(inv.status) + '</span></td>' +
      '</tr>';
    });
    html2 += '</tbody></table></div>';
    return html2;
  }

  if (t === 'expense-summary') {
    var byCat = {};
    DEMO_EXPENSES.forEach(function(e) { byCat[e.category] = (byCat[e.category] || 0) + e.amount; });
    var totalExp = DEMO_EXPENSES.reduce(function(s, e) { return s + e.amount; }, 0);
    var html3 = '<div style="display:flex;flex-direction:column;gap:10px;">';
    Object.keys(byCat).sort(function(a, b) { return byCat[b] - byCat[a]; }).forEach(function(cat) {
      var pct = Math.round(byCat[cat] / totalExp * 100);
      html3 += '<div><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:3px;"><span>' + cat + '</span><span style="font-weight:600;">' + formatCAD(byCat[cat]) + '</span></div>' +
        '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%;background:var(--orange);"></div></div></div>';
    });
    html3 += '</div>';
    return html3;
  }

  if (t === 'monthly-chart') {
    var months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    var inv2 = [85, 120, 95, 207, 174, 180];
    var col = [85, 110, 95, 201, 174, 155];
    var maxV = 210;
    var html4 = '<div style="display:flex;gap:10px;align-items:flex-end;height:140px;padding:0 4px;">';
    months.forEach(function(m, i) {
      html4 += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;height:100%;">' +
        '<div style="flex:1;display:flex;align-items:flex-end;gap:2px;width:100%;">' +
          '<div style="flex:1;background:var(--blue);border-radius:3px 3px 0 0;height:' + Math.round(inv2[i]/maxV*100) + '%;opacity:0.7;" title="' + formatCAD(inv2[i]*1000) + '"></div>' +
          '<div style="flex:1;background:var(--green);border-radius:3px 3px 0 0;height:' + Math.round(col[i]/maxV*100) + '%;opacity:0.7;" title="' + formatCAD(col[i]*1000) + '"></div>' +
        '</div>' +
        '<div style="font-size:10px;color:var(--text-muted);">' + m + '</div>' +
      '</div>';
    });
    html4 += '</div>';
    html4 += '<div style="display:flex;justify-content:center;gap:16px;margin-top:8px;font-size:10px;"><div style="display:flex;align-items:center;gap:4px;"><span style="width:8px;height:8px;border-radius:2px;background:var(--blue);display:inline-block;opacity:0.7;"></span> Invoiced</div><div style="display:flex;align-items:center;gap:4px;"><span style="width:8px;height:8px;border-radius:2px;background:var(--green);display:inline-block;opacity:0.7;"></span> Collected</div></div>';
    return html4;
  }

  if (t === 'profit-by-project') {
    var html5 = '<div style="overflow-x:auto;"><table class="data-table"><thead><tr><th>Project</th><th>Collected</th><th>Costs</th><th>Profit</th></tr></thead><tbody>';
    DEMO_PROJECTS.filter(function(p) {
      return DEMO_INVOICES.some(function(i) { return i.project_id === p.id; });
    }).forEach(function(p) {
      var col2 = DEMO_INVOICES.filter(function(i) { return i.project_id === p.id; }).reduce(function(s, i) { return s + i.amount_paid; }, 0);
      var exp2 = DEMO_EXPENSES.filter(function(e) { return e.project_id === p.id; }).reduce(function(s, e) { return s + e.amount; }, 0);
      var sub2 = (DEMO_SUB_ASSIGNMENTS[p.id] || []).reduce(function(s, a) { return s + a.amount_paid; }, 0);
      var profit2 = col2 - exp2 - sub2;
      html5 += '<tr onclick="viewProject(\'' + p.id + '\')" style="cursor:pointer;"><td><strong>' + p.name.split('—')[0].trim() + '</strong></td><td style="color:var(--green);">' + formatCAD(col2) + '</td><td>' + formatCAD(exp2 + sub2) + '</td><td style="font-weight:700;color:' + (profit2 >= 0 ? 'var(--green)' : 'var(--red)') + ';">' + formatCAD(profit2) + '</td></tr>';
    });
    html5 += '</tbody></table></div>';
    return html5;
  }

  if (t === 'sub-liability-list') {
    var subs = DEMO_SUBS.map(function(sub) {
      var ow = 0;
      Object.values(DEMO_SUB_ASSIGNMENTS).forEach(function(a) { var x = a.find(function(y) { return y.sub_id === sub.id; }); if (x) ow += x.contract_amount - x.amount_paid; });
      return { name: sub.company, trade: sub.trade, owing: ow };
    }).filter(function(s) { return s.owing > 0; }).sort(function(a, b) { return b.owing - a.owing; });
    if (subs.length === 0) return '<div class="text-muted" style="text-align:center;padding:16px;">All subs paid.</div>';
    var html6 = '';
    subs.forEach(function(s) {
      html6 += '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(200,215,240,0.3);font-size:13px;"><span>' + s.name + ' <span class="tag">' + s.trade + '</span></span><span style="font-weight:600;color:var(--red);">' + formatCAD(s.owing) + '</span></div>';
    });
    return html6;
  }

  if (t === 'recent-payments') {
    var pays = DEMO_INVOICES.flatMap(function(inv) { return (inv.payments || []).map(function(p) { return { amount: p.amount, date: p.date, inv: inv.invoice_number }; }); }).sort(function(a, b) { return b.date.localeCompare(a.date); }).slice(0, 5);
    var html7 = '';
    pays.forEach(function(p) {
      html7 += '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(200,215,240,0.3);"><i class="fas fa-check-circle" style="color:var(--green);font-size:12px;"></i><div style="flex:1;font-size:13px;">' + formatCAD(p.amount) + '</div><div class="text-muted" style="font-size:11px;">' + p.inv + ' · ' + p.date + '</div></div>';
    });
    return html7 || '<div class="text-muted" style="text-align:center;padding:16px;">No payments.</div>';
  }

  if (t === 'pipeline-summary') {
    var stages = {};
    DEMO_PIPELINE.forEach(function(c) { stages[c.stage] = (stages[c.stage] || 0) + 1; });
    var labels = { researched: 'Researched', contacted: 'Contacted', followed_up: 'Followed Up', meeting_booked: 'Meeting', proposal_sent: 'Proposal', won: 'Won', lost: 'Lost' };
    var colors = { researched: '#6b7a9e', contacted: 'var(--blue)', followed_up: 'var(--purple)', meeting_booked: 'var(--orange)', proposal_sent: 'var(--yellow)', won: 'var(--green)', lost: 'var(--red)' };
    var html8 = '<div style="display:flex;flex-wrap:wrap;gap:8px;">';
    Object.keys(labels).forEach(function(s) {
      if (stages[s]) {
        html8 += '<div style="display:flex;align-items:center;gap:6px;padding:6px 10px;background:rgba(200,215,240,0.25);border-radius:8px;font-size:12px;"><span style="width:8px;height:8px;border-radius:50%;background:' + colors[s] + ';"></span>' + labels[s] + ' <strong>' + stages[s] + '</strong></div>';
      }
    });
    html8 += '</div>';
    return html8;
  }

  if (t === 'tasks-list') {
    var tasks = DEMO_TASKS.filter(function(tk) { return !tk.completed; }).sort(function(a, b) { var o = { high: 0, medium: 1, low: 2 }; return (o[a.priority]||1) - (o[b.priority]||1); }).slice(0, 5);
    var html9 = '';
    tasks.forEach(function(tk) {
      var proj = DEMO_PROJECTS.find(function(p) { return p.id === tk.project_id; });
      html9 += '<div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid rgba(200,215,240,0.3);">' +
        '<i class="far fa-square" style="color:var(--text-light);margin-top:3px;cursor:pointer;" onclick="toggleTask(\'' + tk.id + '\'); navigateTo(\'dashboard\');"></i>' +
        '<div style="flex:1;"><div style="font-size:13px;">' + tk.title + '</div><div class="text-muted" style="font-size:11px;">' + (proj ? proj.name.split('—')[0].trim() : '') + ' · ' + tk.due_date + '</div></div>' +
        '<span class="status-badge status-' + tk.priority + '" style="font-size:10px;">' + tk.priority + '</span></div>';
    });
    return html9 || '<div class="text-muted" style="text-align:center;padding:16px;">No open tasks.</div>';
  }

  if (t === 'project-spotlight') {
    var pids = widget.config_project_ids || (widget.config_project_id ? [widget.config_project_id] : [DEMO_PROJECTS[0].id]);
    var spotProjects = pids.map(function(id) { return DEMO_PROJECTS.find(function(p) { return p.id === id; }); }).filter(Boolean);
    if (spotProjects.length === 0) return '<div class="text-muted" style="text-align:center;padding:16px;">Select projects.</div>';
    return spotProjects.map(function(p2) {
      return '<div style="cursor:pointer;padding:10px 0;border-bottom:1px solid rgba(200,215,240,0.3);" onclick="viewProject(\'' + p2.id + '\')">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
          '<div style="font-size:14px;font-weight:700;">' + p2.name + '</div>' +
          '<span class="status-badge status-' + p2.status + '">' + formatStatus(p2.status) + '</span>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:8px;"><div class="progress-bar" style="flex:1;height:6px;"><div class="progress-fill" style="width:' + p2.completion_pct + '%;background:var(--orange);border-radius:3px;"></div></div><span style="font-size:13px;font-weight:700;">' + p2.completion_pct + '%</span></div>' +
        '<div class="text-muted" style="font-size:11px;margin-top:4px;">' + p2.client_brand + ' · ' + formatCAD(p2.budget) + ' · ' + (p2.target_handover || 'TBD') + '</div>' +
      '</div>';
    }).join('');
  }

  return '<div class="text-muted" style="text-align:center;padding:16px;">Widget not found.</div>';
}

function clickableWidget(page, content) {
  if (!page) return content;
  return '<div style="cursor:pointer;" onclick="navigateTo(\'' + page + '\')">' + content + '</div>';
}

function miniStatWidget(label, value, sub, icon, color) {
  return '<div style="display:flex;justify-content:space-between;align-items:flex-start;">' +
    '<div><div style="font-size:12px;color:var(--text-muted);font-weight:500;margin-bottom:6px;">' + label + '</div>' +
    '<div style="font-size:24px;font-weight:700;color:var(--navy);">' + value + '</div>' +
    (sub ? '<div style="font-size:11px;color:var(--text-muted);margin-top:4px;">' + sub + '</div>' : '') + '</div>' +
    '<div style="width:36px;height:36px;border-radius:10px;background:' + color + '15;display:flex;align-items:center;justify-content:center;"><i class="' + icon + '" style="color:' + color + ';font-size:15px;"></i></div>' +
  '</div>';
}

// ---- Render dashboard ----
function renderCustomDashboard() {
  var layout = getUserLayout();

  var html = '<div class="page-header"><div><h1>Dashboard</h1><p class="page-header-sub">Welcome back, ' + currentUser.full_name + '</p></div>' +
    '<div style="display:flex;gap:8px;">' +
      '<button class="btn ' + (_dashboardEditMode ? 'btn-accent' : 'btn-outline') + ' btn-sm" onclick="toggleDashboardEdit()"><i class="fas fa-' + (_dashboardEditMode ? 'check' : 'grip-vertical') + '"></i> ' + (_dashboardEditMode ? 'Done' : 'Customize') + '</button>' +
      (_dashboardEditMode ? '<button class="btn btn-outline btn-sm" onclick="addWidgetModal()"><i class="fas fa-plus"></i> Add Widget</button><button class="btn btn-outline btn-sm" onclick="resetDashboardLayout()"><i class="fas fa-undo"></i> Reset</button>' : '') +
    '</div></div>';

  html += '<div id="dashboard-grid" style="display:grid;grid-template-columns:repeat(12,1fr);gap:16px;">';

  layout.forEach(function(w, idx) {
    var cat = WIDGET_CATALOG.find(function(c) { return c.type === w.type; });
    // Support both old size format and new colSpan
    var colSpan = w.colSpan || parseInt(WIDGET_SIZES[w.size]) || 3;
    var title = cat ? cat.title : w.type;

    html += '<div class="stat-card" style="grid-column:span ' + colSpan + ';position:relative;overflow:hidden;' + (_dashboardEditMode ? 'cursor:grab;' : '') + '" ' +
      'draggable="' + _dashboardEditMode + '" ' +
      'ondragstart="widgetDragStart(event,' + idx + ')" ' +
      'ondragover="widgetDragOver(event)" ' +
      'ondrop="widgetDrop(event,' + idx + ')" ' +
      'data-idx="' + idx + '">';

    // Widget header
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">';
    html += '<div class="section-title" style="margin:0;font-size:13px;">' + title + '</div>';
    html += '<div style="display:flex;gap:4px;">';
    if (_dashboardEditMode) {
      if (w.type === 'project-spotlight') {
        html += '<button onclick="configProjectSpotlight(' + idx + ')" style="padding:2px 6px;font-size:10px;border:1px solid rgba(200,215,240,0.5);border-radius:4px;background:rgba(255,255,255,0.5);color:var(--text-muted);cursor:pointer;"><i class="fas fa-cog"></i></button>';
      }
      if (w.type === 'stat-total-expenses') {
        html += '<button onclick="configExpenseFilter(' + idx + ')" style="padding:2px 6px;font-size:10px;border:1px solid rgba(200,215,240,0.5);border-radius:4px;background:rgba(255,255,255,0.5);color:var(--text-muted);cursor:pointer;"><i class="fas fa-filter"></i></button>';
      }
      html += '<button onclick="removeWidget(' + idx + ')" style="padding:2px 6px;font-size:10px;border:1px solid rgba(224,82,82,0.3);border-radius:4px;background:rgba(224,82,82,0.1);color:var(--red);cursor:pointer;"><i class="fas fa-times"></i></button>';
    } else {
      // Expense filter dropdown in view mode
      if (w.type === 'stat-total-expenses') {
        var curFilter = w.config_expense_filter || 'all';
        html += '<select onchange="quickExpenseFilter(' + idx + ',this.value)" style="padding:1px 4px;font-size:10px;border:1px solid rgba(200,215,240,0.4);border-radius:4px;background:rgba(255,255,255,0.5);color:var(--text-muted);cursor:pointer;max-width:90px;">';
        html += '<option value="all" ' + (curFilter === 'all' ? 'selected' : '') + '>All</option>';
        html += '<option value="trivex-corp" ' + (curFilter === 'trivex-corp' ? 'selected' : '') + '>Trivex</option>';
        DEMO_PROJECTS.forEach(function(p) {
          html += '<option value="' + p.id + '" ' + (curFilter === p.id ? 'selected' : '') + '>' + p.name.split('—')[0].trim() + '</option>';
        });
        html += '</select>';
        html += '<input type="date" value="' + (w.config_date_from || '') + '" onchange="quickExpenseDate(' + idx + ',\'from\',this.value)" style="padding:1px 3px;font-size:9px;border:1px solid rgba(200,215,240,0.4);border-radius:4px;background:rgba(255,255,255,0.5);color:var(--text-muted);width:90px;" title="From date">';
        html += '<input type="date" value="' + (w.config_date_to || '') + '" onchange="quickExpenseDate(' + idx + ',\'to\',this.value)" style="padding:1px 3px;font-size:9px;border:1px solid rgba(200,215,240,0.4);border-radius:4px;background:rgba(255,255,255,0.5);color:var(--text-muted);width:90px;" title="To date">';
      }
      // View all link for non-edit mode
      var viewPage = { 'active-projects-table': 'projects', 'outstanding-invoices-table': 'invoices', 'expense-summary': 'expenses', 'profit-by-project': 'finances', 'monthly-chart': 'finances', 'sub-liability-list': 'subcontractors', 'recent-payments': 'finances', 'pipeline-summary': 'pipeline', 'tasks-list': 'schedule' };
      var targetPage = viewPage[w.type];
      if (targetPage) {
        html += '<span style="font-size:11px;color:var(--orange);cursor:pointer;font-weight:500;" onclick="navigateTo(\'' + targetPage + '\')">View all <i class="fas fa-arrow-right" style="font-size:9px;"></i></span>';
      }
    }
    html += '</div></div>';

    // Widget content
    html += renderWidgetContent(w);

    // Drag resize handle on right edge + bottom-right corner
    if (_dashboardEditMode) {
      html += '<div style="position:absolute;right:0;top:0;bottom:0;width:10px;cursor:ew-resize;background:transparent;" onmousedown="startWidgetResize(event,' + idx + ')" ontouchstart="startWidgetResizeTouch(event,' + idx + ')" title="Drag to resize"></div>';
      html += '<div style="position:absolute;right:3px;top:50%;transform:translateY(-50%);width:4px;height:28px;border-radius:2px;background:rgba(200,215,240,0.6);pointer-events:none;display:flex;flex-direction:column;gap:3px;align-items:center;justify-content:center;"><span style="width:4px;height:4px;background:rgba(100,130,180,0.4);border-radius:50%;"></span><span style="width:4px;height:4px;background:rgba(100,130,180,0.4);border-radius:50%;"></span><span style="width:4px;height:4px;background:rgba(100,130,180,0.4);border-radius:50%;"></span></div>';
    }

    html += '</div>';
  });

  html += '</div>';

  if (layout.length === 0) {
    html += '<div class="empty-state"><i class="fas fa-th-large"></i><h3>Empty dashboard</h3><p>Click "Customize" then "Add Widget" to build your dashboard.</p></div>';
  }

  return html;
}

// ---- Dashboard controls ----
function toggleDashboardEdit() {
  _dashboardEditMode = !_dashboardEditMode;
  navigateTo('dashboard');
}

function resetDashboardLayout() {
  if (!confirm('Reset your dashboard to the default layout?')) return;
  var key = 'xos_dashboard_' + (currentUser ? currentUser.email : 'default');
  localStorage.removeItem(key);
  navigateTo('dashboard');
}

function resizeWidget(idx, colSpan) {
  var layout = getUserLayout();
  if (layout[idx]) {
    layout[idx].colSpan = Math.max(2, Math.min(12, parseInt(colSpan) || 3));
    delete layout[idx].size; // Remove old format
    saveUserLayout(layout);
  }
}

function removeWidget(idx) {
  var layout = getUserLayout();
  layout.splice(idx, 1);
  saveUserLayout(layout);
  navigateTo('dashboard');
}

function addWidgetModal() {
  var layout = getUserLayout();
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'add-widget-modal';

  var categories = {};
  WIDGET_CATALOG.forEach(function(w) {
    if (!categories[w.category]) categories[w.category] = [];
    categories[w.category].push(w);
  });

  var html = '<div class="modal-card" style="max-width:560px;">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">';
  html += '<h3><i class="fas fa-plus-circle" style="color:var(--orange);margin-right:8px;"></i>Add Widget</h3>';
  html += '<button class="btn-icon" onclick="document.getElementById(\'add-widget-modal\').remove()" style="color:var(--text-muted);font-size:18px;"><i class="fas fa-times"></i></button>';
  html += '</div>';

  Object.keys(categories).forEach(function(cat) {
    html += '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin:12px 0 6px;">' + cat + '</div>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">';
    categories[cat].forEach(function(w) {
      var already = layout.some(function(l) { return l.type === w.type && w.type !== 'project-spotlight'; });
      html += '<div style="padding:10px 12px;border:1px solid ' + (already ? 'rgba(200,215,240,0.3)' : 'rgba(200,215,240,0.5)') + ';border-radius:10px;cursor:' + (already ? 'default' : 'pointer') + ';opacity:' + (already ? '0.4' : '1') + ';background:rgba(255,255,255,0.5);' + (!already ? 'transition:all 0.2s;' : '') + '" ' +
        (!already ? 'onclick="addWidget(\'' + w.type + '\')" onmouseover="this.style.borderColor=\'var(--orange)\'" onmouseout="this.style.borderColor=\'rgba(200,215,240,0.5)\'"' : '') + '>' +
        '<div style="font-size:13px;font-weight:600;">' + w.title + '</div>' +
        '<div style="font-size:11px;color:var(--text-muted);">Size: ' + w.defaultSize.toUpperCase() + (already ? ' · Already added' : '') + '</div>' +
      '</div>';
    });
    html += '</div>';
  });

  html += '</div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);
}

function addWidget(type) {
  var cat = WIDGET_CATALOG.find(function(c) { return c.type === type; });
  if (!cat) return;
  var layout = getUserLayout();
  var w = { type: type, size: cat.defaultSize, id: 'w' + Date.now() };

  if (type === 'project-spotlight') {
    w.config_project_id = DEMO_PROJECTS[0].id;
  }

  layout.push(w);
  saveUserLayout(layout);
  document.getElementById('add-widget-modal').remove();
  navigateTo('dashboard');
}

function configProjectSpotlight(idx) {
  var layout = getUserLayout();
  var w = layout[idx];
  if (!w) return;
  var selected = w.config_project_ids || (w.config_project_id ? [w.config_project_id] : []);

  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'config-spotlight';
  var html = '<div class="modal-card" style="max-width:420px;">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;"><h3>Select Projects</h3>';
  html += '<button class="btn-icon" onclick="document.getElementById(\'config-spotlight\').remove()" style="color:var(--text-muted);"><i class="fas fa-times"></i></button></div>';
  html += '<p class="text-muted" style="font-size:12px;margin-bottom:12px;">Select one or more projects to pin to your dashboard.</p>';
  html += '<div style="display:flex;flex-direction:column;gap:6px;">';
  DEMO_PROJECTS.forEach(function(p) {
    var sel = selected.indexOf(p.id) >= 0;
    html += '<label style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid ' + (sel ? 'var(--orange)' : 'rgba(200,215,240,0.5)') + ';border-radius:10px;cursor:pointer;background:' + (sel ? 'var(--orange-light)' : 'rgba(255,255,255,0.5)') + ';">';
    html += '<input type="checkbox" value="' + p.id + '" class="spotlight-check" ' + (sel ? 'checked' : '') + ' style="width:18px;height:18px;">';
    html += '<div style="flex:1;"><div style="font-size:13px;font-weight:600;">' + p.name + '</div>';
    html += '<div class="text-muted" style="font-size:11px;">' + p.client_brand + ' · ' + p.completion_pct + '%</div></div></label>';
  });
  html += '</div>';
  html += '<button class="btn btn-accent btn-full" style="margin-top:16px;" onclick="saveSpotlightProjects(' + idx + ')"><i class="fas fa-check"></i> Save</button>';
  html += '</div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);
}

function quickExpenseFilter(idx, value) {
  var layout = getUserLayout();
  if (layout[idx]) {
    layout[idx].config_expense_filter = value;
    saveUserLayout(layout);
    navigateTo('dashboard');
  }
}

function quickExpenseDate(idx, which, value) {
  var layout = getUserLayout();
  if (layout[idx]) {
    if (which === 'from') layout[idx].config_date_from = value;
    if (which === 'to') layout[idx].config_date_to = value;
    saveUserLayout(layout);
    navigateTo('dashboard');
  }
}

function configExpenseFilter(idx) {
  var layout = getUserLayout();
  var w = layout[idx];
  if (!w) return;
  var current = w.config_expense_filter || 'all';

  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'config-expense';
  var html = '<div class="modal-card" style="max-width:400px;">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;"><h3>Filter Expenses</h3>';
  html += '<button class="btn-icon" onclick="document.getElementById(\'config-expense\').remove()" style="color:var(--text-muted);"><i class="fas fa-times"></i></button></div>';
  html += '<p class="text-muted" style="font-size:12px;margin-bottom:12px;">Choose which expenses to show on this widget.</p>';
  html += '<div style="display:flex;flex-direction:column;gap:6px;">';

  // All option
  var selAll = current === 'all';
  html += '<div style="padding:10px 12px;border:1px solid ' + (selAll ? 'var(--orange)' : 'rgba(200,215,240,0.5)') + ';border-radius:10px;cursor:pointer;background:' + (selAll ? 'var(--orange-light)' : 'rgba(255,255,255,0.5)') + ';" onclick="setExpenseFilter(' + idx + ',\'all\')">';
  html += '<div style="font-size:13px;font-weight:600;">All Projects + Trivex</div>';
  html += '<div class="text-muted" style="font-size:11px;">Total across everything</div></div>';

  // Trivex corp option
  var selCorp = current === 'trivex-corp';
  html += '<div style="padding:10px 12px;border:1px solid ' + (selCorp ? 'var(--orange)' : 'rgba(200,215,240,0.5)') + ';border-radius:10px;cursor:pointer;background:' + (selCorp ? 'var(--orange-light)' : 'rgba(255,255,255,0.5)') + ';" onclick="setExpenseFilter(' + idx + ',\'trivex-corp\')">';
  html += '<div style="font-size:13px;font-weight:600;">Trivex Group — Company Only</div>';
  html += '<div class="text-muted" style="font-size:11px;">Corporate expenses not tied to a project</div></div>';

  // Per project
  DEMO_PROJECTS.forEach(function(p) {
    var sel = current === p.id;
    html += '<div style="padding:10px 12px;border:1px solid ' + (sel ? 'var(--orange)' : 'rgba(200,215,240,0.5)') + ';border-radius:10px;cursor:pointer;background:' + (sel ? 'var(--orange-light)' : 'rgba(255,255,255,0.5)') + ';" onclick="setExpenseFilter(' + idx + ',\'' + p.id + '\')">';
    html += '<div style="font-size:13px;font-weight:600;">' + p.name + '</div>';
    var projExp = DEMO_EXPENSES.filter(function(e) { return e.project_id === p.id; });
    html += '<div class="text-muted" style="font-size:11px;">' + projExp.length + ' receipts · ' + formatCAD(projExp.reduce(function(s, e) { return s + e.amount; }, 0)) + '</div></div>';
  });

  html += '</div></div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);
}

function setExpenseFilter(idx, value) {
  var layout = getUserLayout();
  if (layout[idx]) {
    layout[idx].config_expense_filter = value;
    saveUserLayout(layout);
  }
  document.getElementById('config-expense').remove();
  navigateTo('dashboard');
}

function saveSpotlightProjects(idx) {
  var layout = getUserLayout();
  if (!layout[idx]) return;
  var selected = [];
  document.querySelectorAll('.spotlight-check:checked').forEach(function(cb) { selected.push(cb.value); });
  layout[idx].config_project_ids = selected;
  delete layout[idx].config_project_id;
  saveUserLayout(layout);
  document.getElementById('config-spotlight').remove();
  navigateTo('dashboard');
}

// ---- Drag and drop ----
function widgetDragStart(e, idx) {
  if (!_dashboardEditMode) return;
  _dragWidget = idx;
  e.dataTransfer.effectAllowed = 'move';
  e.target.style.opacity = '0.5';
}

function widgetDragOver(e) {
  if (!_dashboardEditMode) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function widgetDrop(e, targetIdx) {
  if (!_dashboardEditMode || _dragWidget === null) return;
  e.preventDefault();
  var layout = getUserLayout();
  var moved = layout.splice(_dragWidget, 1)[0];
  layout.splice(targetIdx, 0, moved);
  saveUserLayout(layout);
  _dragWidget = null;
  navigateTo('dashboard');
}

document.addEventListener('dragend', function() {
  _dragWidget = null;
  document.querySelectorAll('.stat-card').forEach(function(el) { el.style.opacity = '1'; });
});

// Free-form drag-to-resize widgets (12-column grid)
var _resizingWidget = null;
var _resizeStartX = 0;
var _resizeStartSpan = 3;

function startWidgetResize(e, idx) {
  e.preventDefault();
  e.stopPropagation();
  _resizingWidget = idx;
  _resizeStartX = e.clientX;
  var layout = getUserLayout();
  _resizeStartSpan = layout[idx].colSpan || parseInt(WIDGET_SIZES[layout[idx].size]) || 3;
  document.addEventListener('mousemove', doWidgetResize);
  document.addEventListener('mouseup', endWidgetResize);
}

function startWidgetResizeTouch(e, idx) {
  e.preventDefault();
  e.stopPropagation();
  _resizingWidget = idx;
  _resizeStartX = e.touches[0].clientX;
  var layout = getUserLayout();
  _resizeStartSpan = layout[idx].colSpan || parseInt(WIDGET_SIZES[layout[idx].size]) || 3;
  document.addEventListener('touchmove', doWidgetResizeTouch);
  document.addEventListener('touchend', endWidgetResize);
}

function doWidgetResizeTouch(e) {
  doWidgetResizeAt(e.touches[0].clientX);
}

function doWidgetResize(e) {
  doWidgetResizeAt(e.clientX);
}

function doWidgetResizeAt(clientX) {
  if (_resizingWidget === null) return;
  var grid = document.getElementById('dashboard-grid');
  if (!grid) return;
  var gridWidth = grid.offsetWidth;
  var colWidth = gridWidth / 12;
  var dx = clientX - _resizeStartX;
  var newSpan = Math.max(2, Math.min(12, _resizeStartSpan + Math.round(dx / colWidth)));

  var el = document.querySelector('[data-idx="' + _resizingWidget + '"]');
  if (el) el.style.gridColumn = 'span ' + newSpan;
}

function endWidgetResize() {
  if (_resizingWidget !== null) {
    var el = document.querySelector('[data-idx="' + _resizingWidget + '"]');
    if (el) {
      var match = el.style.gridColumn.match(/span\s+(\d+)/);
      if (match) {
        resizeWidget(_resizingWidget, parseInt(match[1]));
      }
    }
  }
  _resizingWidget = null;
  document.removeEventListener('mousemove', doWidgetResize);
  document.removeEventListener('mouseup', endWidgetResize);
  document.removeEventListener('touchmove', doWidgetResizeTouch);
  document.removeEventListener('touchend', endWidgetResize);
  navigateTo('dashboard');
}
