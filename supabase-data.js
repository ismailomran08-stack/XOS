/* ================================================
   XOS — Supabase Data Layer
   Syncs in-memory arrays ↔ Supabase database
   ================================================ */

// Helper: get the Supabase client
function sb() {
  return sbClient;
}

// ============================================
// LOAD ALL DATA ON LOGIN
// ============================================
async function loadAllData() {
  if (!sb()) { console.warn('loadAllData: no sb client'); return; }
  console.log('loadAllData: starting for user ' + (currentUser ? currentUser.email : 'unknown'));
  try {
    await Promise.all([
      loadProjects(),
      loadExpenses(),
      loadInvoices(),
      loadEstimates(),
      loadMilestones(),
      loadTasks(),
      loadPipelineContacts(),
      loadSubcontractors(),
      loadDocuments(),
      loadMessages(),
      loadChangeOrders(),
    ]);
    console.log('All data loaded from Supabase');
  } catch (err) {
    console.error('Error loading data:', err);
  }
}

// ============================================
// PROJECTS
// ============================================
async function loadProjects() {
  const { data } = await sb().from('projects').select('*').order('created_at', { ascending: false });
  if (data && data.length > 0) {
    DEMO_PROJECTS.length = 0;
    data.forEach(p => {
      DEMO_PROJECTS.push({
        id: p.id, name: p.name, client_brand: p.client_brand,
        status: p.status, completion_pct: p.completion_pct || 0,
        target_handover: p.target_handover, budget: parseFloat(p.budget) || 0,
        city: p.city, sqft: p.sqft, address: p.address,
        notes: p.notes, assigned: [],
      });
    });
  }
}

async function saveProject(project) {
  if (!sb()) return;
  const row = {
    name: project.name, client_brand: project.client_brand,
    status: project.status, completion_pct: project.completion_pct,
    target_handover: project.target_handover || null,
    budget: project.budget, city: project.city, sqft: project.sqft,
    address: project.address, notes: project.notes,
  };
  if (project.id && !project.id.startsWith('proj-')) {
    // Update existing
    await sb().from('projects').update(row).eq('id', project.id);
  } else {
    // Insert new
    const { data } = await sb().from('projects').insert(row).select().single();
    if (data) project.id = data.id;
  }
}

async function updateProjectField(projectId, field, value) {
  if (!sb() || !projectId || projectId.startsWith('proj-')) return;
  await sb().from('projects').update({ [field]: value, updated_at: new Date().toISOString() }).eq('id', projectId);
}

// ============================================
// EXPENSES
// ============================================
async function loadExpenses() {
  console.log('loadExpenses: starting...');
  const { data, error } = await sb().from('expenses').select('*').order('created_at', { ascending: false });
  console.log('loadExpenses: data=' + (data ? data.length : 'null') + ', error=' + (error ? JSON.stringify(error) : 'none'));
  if (error) { console.error('Load expenses error:', error); return; }
  if (data && data.length > 0) {
    // Merge Supabase data with demo data instead of replacing
    data.forEach(e => {
      // Don't add if already in demo data
      if (DEMO_EXPENSES.find(d => d.id === e.id)) return;

      var notes = e.notes || '';
      var projectId = e.project_id;
      // Reconstruct project_id from notes if stored there
      if (notes.startsWith('[TRIVEX-CORP]')) projectId = 'trivex-corp';
      var projMatch = notes.match(/\[Project:([^\]]+)\]/);
      if (projMatch) projectId = projMatch[1];
      // Clean notes
      notes = notes.replace(/\[TRIVEX-CORP\]\s*/, '').replace(/\[Project:[^\]]+\]\s*/, '');

      DEMO_EXPENSES.unshift({
        id: e.id, project_id: projectId || 'trivex-corp',
        vendor: e.vendor, amount: parseFloat(e.amount),
        category: e.category, expense_date: e.expense_date,
        receipt_url: e.receipt_url, notes: notes,
        submitted_by: e.submitted_by || '',
      });
    });
    console.log('Loaded ' + data.length + ' expenses from Supabase');
  }
}

async function saveExpense(expense) {
  if (!sb()) { console.warn('saveExpense: no Supabase client'); return; }

  var projId = expense.project_id;
  var isRealUUID = projId && projId.length > 30 && projId.includes('-');
  var userId = currentUser && currentUser.id && currentUser.id.length > 30 ? currentUser.id : null;

  const row = {
    vendor: expense.vendor,
    amount: expense.amount,
    category: expense.category,
    expense_date: expense.expense_date || null,
    receipt_url: expense.receipt_url && expense.receipt_url.startsWith('http') ? expense.receipt_url : null,
    notes: (projId === 'trivex-corp' ? '[TRIVEX-CORP] ' : '') + (projId && !isRealUUID ? '[Project:' + projId + '] ' : '') + (expense.notes || ''),
  };

  // Only add project_id if it's a real UUID (FK constraint)
  if (isRealUUID) row.project_id = projId;
  // Only add submitted_by if it's a real UUID
  if (userId) row.submitted_by = userId;

  console.log('saveExpense: attempting insert', JSON.stringify(row));

  try {
    const { data, error } = await sb().from('expenses').insert(row).select().single();
    if (error) {
      console.error('saveExpense ERROR:', JSON.stringify(error));
      alert('Failed to save expense: ' + (error.message || error.details || 'Unknown error'));
      return;
    }
    if (data) {
      expense.id = data.id;
      console.log('saveExpense SUCCESS:', data.id);
    }
  } catch (err) {
    console.error('saveExpense EXCEPTION:', err);
    alert('Failed to save expense: ' + err.message);
  }
}

// ============================================
// INVOICES
// ============================================
async function loadInvoices() {
  const { data } = await sb().from('invoices').select('*').order('created_at', { ascending: false });
  if (data && data.length > 0) {
    DEMO_INVOICES.length = 0;
    data.forEach(inv => {
      DEMO_INVOICES.push({
        id: inv.id, invoice_number: inv.invoice_number,
        project_id: inv.project_id, estimate_id: inv.estimate_id,
        stage: inv.stage, status: inv.status,
        amount: parseFloat(inv.amount), tax_rate: parseFloat(inv.tax_rate) || 13,
        amount_paid: parseFloat(inv.amount_paid) || 0,
        issue_date: inv.issue_date, due_date: inv.due_date,
        notes: inv.notes, items: [], payments: [],
      });
    });
    // Load payments
    const { data: payments } = await sb().from('payments').select('*');
    if (payments) {
      payments.forEach(pay => {
        const inv = DEMO_INVOICES.find(i => i.id === pay.invoice_id);
        if (inv) inv.payments.push({ amount: parseFloat(pay.amount), date: pay.payment_date, method: pay.method });
      });
    }
  }
}

async function saveInvoice(invoice) {
  if (!sb()) return;
  const row = {
    invoice_number: invoice.invoice_number, project_id: invoice.project_id || null,
    estimate_id: invoice.estimate_id || null, stage: invoice.stage,
    status: invoice.status, amount: invoice.amount,
    tax_rate: invoice.tax_rate || 13, amount_paid: invoice.amount_paid || 0,
    issue_date: invoice.issue_date || null, due_date: invoice.due_date || null,
    notes: invoice.notes,
  };
  if (invoice.id && !invoice.id.startsWith('inv-')) {
    await sb().from('invoices').update(row).eq('id', invoice.id);
  } else {
    const { data } = await sb().from('invoices').insert(row).select().single();
    if (data) invoice.id = data.id;
  }
}

async function savePayment(invoiceId, payment) {
  if (!sb() || !invoiceId) return;
  await sb().from('payments').insert({
    invoice_id: invoiceId, amount: payment.amount,
    payment_date: payment.date, method: payment.method,
  });
  // Update invoice amount_paid
  const inv = DEMO_INVOICES.find(i => i.id === invoiceId);
  if (inv) {
    await sb().from('invoices').update({ amount_paid: inv.amount_paid, status: inv.status }).eq('id', invoiceId);
  }
}

// ============================================
// ESTIMATES
// ============================================
async function loadEstimates() {
  const { data } = await sb().from('estimates').select('*').order('created_at', { ascending: false });
  if (data && data.length > 0) {
    DEMO_ESTIMATES.length = 0;
    for (const est of data) {
      const { data: items } = await sb().from('estimate_items').select('*').eq('estimate_id', est.id).order('sort_order');
      DEMO_ESTIMATES.push({
        id: est.id, client_name: est.client_name, project_type: est.project_type,
        status: est.status, sqft: est.sqft, address: est.address,
        target_start: est.target_start, margin_pct: parseFloat(est.margin_pct) || 15,
        created_at: est.created_at ? est.created_at.split('T')[0] : '',
        items: (items || []).map(i => ({
          id: i.id, description: i.description, category: i.category,
          qty: parseFloat(i.qty), unit: i.unit, unit_cost: parseFloat(i.unit_cost),
        })),
      });
    }
  }
}

async function saveEstimate(estimate) {
  if (!sb()) return;
  const row = {
    client_name: estimate.client_name, project_type: estimate.project_type,
    status: estimate.status, sqft: estimate.sqft, address: estimate.address,
    target_start: estimate.target_start || null, margin_pct: estimate.margin_pct,
  };
  if (estimate.id && !estimate.id.startsWith('est-')) {
    await sb().from('estimates').update(row).eq('id', estimate.id);
  } else {
    const { data } = await sb().from('estimates').insert(row).select().single();
    if (data) estimate.id = data.id;
  }
  // Save items
  if (estimate.id && !estimate.id.startsWith('est-')) {
    await sb().from('estimate_items').delete().eq('estimate_id', estimate.id);
    if (estimate.items && estimate.items.length > 0) {
      await sb().from('estimate_items').insert(
        estimate.items.map((item, idx) => ({
          estimate_id: estimate.id, description: item.description,
          category: item.category, qty: item.qty, unit: item.unit,
          unit_cost: item.unit_cost, sort_order: idx,
        }))
      );
    }
  }
}

// ============================================
// MILESTONES
// ============================================
async function loadMilestones() {
  const { data } = await sb().from('milestones').select('*').order('sort_order');
  if (data && data.length > 0) {
    // Clear and rebuild
    Object.keys(DEMO_MILESTONES).forEach(k => delete DEMO_MILESTONES[k]);
    data.forEach(m => {
      if (!DEMO_MILESTONES[m.project_id]) DEMO_MILESTONES[m.project_id] = [];
      DEMO_MILESTONES[m.project_id].push({
        id: m.id, project_id: m.project_id, name: m.name,
        sort_order: m.sort_order, status: m.status,
        target_date: m.target_date, completed_date: m.completed_date,
        notes: m.notes,
      });
    });
  }
}

async function saveMilestone(milestone) {
  if (!sb()) return;
  const row = {
    project_id: milestone.project_id, name: milestone.name,
    sort_order: milestone.sort_order, status: milestone.status,
    target_date: milestone.target_date || null,
    completed_date: milestone.completed_date || null, notes: milestone.notes,
  };
  if (milestone.id && !milestone.id.includes('-')) {
    // UUID from Supabase — update
    await sb().from('milestones').update(row).eq('id', milestone.id);
  } else {
    const { data } = await sb().from('milestones').insert(row).select().single();
    if (data) milestone.id = data.id;
  }
}

async function deleteMilestone(milestoneId) {
  if (!sb() || !milestoneId) return;
  await sb().from('milestones').delete().eq('id', milestoneId);
}

// ============================================
// TASKS
// ============================================
async function loadTasks() {
  const { data } = await sb().from('tasks').select('*').order('created_at', { ascending: false });
  if (data && data.length > 0) {
    DEMO_TASKS.length = 0;
    data.forEach(t => {
      DEMO_TASKS.push({
        id: t.id, project_id: t.project_id, title: t.title,
        assigned_to: t.assigned_to, due_date: t.due_date,
        priority: t.priority, completed: t.completed, notes: t.notes,
      });
    });
  }
}

async function saveTask(task) {
  if (!sb()) return;
  const row = {
    project_id: task.project_id, title: task.title,
    assigned_to: task.assigned_to || null, due_date: task.due_date || null,
    priority: task.priority, completed: task.completed, notes: task.notes,
  };
  if (task.id && !task.id.startsWith('t-')) {
    await sb().from('tasks').update(row).eq('id', task.id);
  } else {
    const { data } = await sb().from('tasks').insert(row).select().single();
    if (data) task.id = data.id;
  }
}

// ============================================
// PIPELINE
// ============================================
async function loadPipelineContacts() {
  const { data } = await sb().from('pipeline_contacts').select('*').order('created_at', { ascending: false });
  if (data && data.length > 0) {
    DEMO_PIPELINE.length = 0;
    for (const c of data) {
      const { data: acts } = await sb().from('pipeline_activities').select('*').eq('contact_id', c.id).order('activity_date', { ascending: false });
      DEMO_PIPELINE.push({
        id: c.id, brand: c.brand_name, contact: c.contact_name,
        email: c.email, phone: c.phone, province: c.province,
        stage: c.stage, notes: c.notes, last_activity: c.last_activity_date,
        activities: (acts || []).map(a => ({
          type: a.activity_type, description: a.description, date: a.activity_date,
        })),
      });
    }
  }
}

async function savePipelineContact(contact) {
  if (!sb()) return;
  const row = {
    brand_name: contact.brand, contact_name: contact.contact,
    email: contact.email, phone: contact.phone, province: contact.province,
    stage: contact.stage, notes: contact.notes,
    last_activity_date: contact.last_activity || null,
  };
  if (contact.id && !contact.id.startsWith('pl-')) {
    await sb().from('pipeline_contacts').update(row).eq('id', contact.id);
  } else {
    const { data } = await sb().from('pipeline_contacts').insert(row).select().single();
    if (data) contact.id = data.id;
  }
}

// ============================================
// SUBCONTRACTORS
// ============================================
async function loadSubcontractors() {
  const { data } = await sb().from('subcontractors').select('*');
  if (data && data.length > 0) {
    DEMO_SUBS.length = 0;
    data.forEach(s => {
      DEMO_SUBS.push({
        id: s.id, company: s.company, trade: s.trade,
        contact: s.contact_name, phone: s.phone, email: s.email,
      });
    });
  }
  // Load assignments
  const { data: assigns } = await sb().from('sub_assignments').select('*');
  if (assigns) {
    Object.keys(DEMO_SUB_ASSIGNMENTS).forEach(k => delete DEMO_SUB_ASSIGNMENTS[k]);
    assigns.forEach(a => {
      if (!DEMO_SUB_ASSIGNMENTS[a.project_id]) DEMO_SUB_ASSIGNMENTS[a.project_id] = [];
      DEMO_SUB_ASSIGNMENTS[a.project_id].push({
        sub_id: a.sub_id, contract_amount: parseFloat(a.contract_amount) || 0,
        scope: a.scope, amount_paid: parseFloat(a.amount_paid) || 0,
        payments: [], notes: [],
      });
    });
  }
}

// ============================================
// DOCUMENTS
// ============================================
async function loadDocuments() {
  const { data } = await sb().from('documents').select('*').order('created_at', { ascending: false });
  if (data && data.length > 0) {
    Object.keys(DEMO_DOCUMENTS).forEach(k => delete DEMO_DOCUMENTS[k]);
    data.forEach(d => {
      if (!DEMO_DOCUMENTS[d.project_id]) DEMO_DOCUMENTS[d.project_id] = { trivex: [], client: [], requests: [] };
      const doc = {
        id: d.id, name: d.name, category: d.category,
        size: d.file_size || '', uploaded_by: d.uploaded_by,
        date: d.created_at ? d.created_at.split('T')[0] : '',
        shared: d.shared, fileData: d.file_url, fileType: '',
      };
      if (d.side === 'client') {
        DEMO_DOCUMENTS[d.project_id].client.push(doc);
      } else {
        DEMO_DOCUMENTS[d.project_id].trivex.push(doc);
      }
    });
  }
}

// ============================================
// MESSAGES
// ============================================
async function loadMessages() {
  const { data } = await sb().from('client_messages').select('*').order('created_at', { ascending: true });
  if (data && data.length > 0) {
    Object.keys(DEMO_CLIENT_MESSAGES).forEach(k => delete DEMO_CLIENT_MESSAGES[k]);
    data.forEach(m => {
      if (!DEMO_CLIENT_MESSAGES[m.project_id]) DEMO_CLIENT_MESSAGES[m.project_id] = [];
      DEMO_CLIENT_MESSAGES[m.project_id].push({
        id: m.id, sender: m.sender_id, role: 'trivex',
        message: m.message, category: m.category || 'General',
        date: m.created_at ? m.created_at.replace('T', ' ').substring(0, 16) : '',
        read_by_client: m.read_by_client, read_by_trivex: m.read_by_trivex,
      });
    });
  }
}

async function saveMessage(projectId, message) {
  if (!sb()) return;
  await sb().from('client_messages').insert({
    project_id: projectId, sender_id: currentUser ? currentUser.id : null,
    message: message.message, category: message.category || 'General',
    read_by_client: message.read_by_client, read_by_trivex: message.read_by_trivex,
  });
}

// ============================================
// CHANGE ORDERS
// ============================================
async function loadChangeOrders() {
  const { data } = await sb().from('change_orders').select('*').order('created_at', { ascending: false });
  if (data && data.length > 0) {
    Object.keys(DEMO_CHANGE_ORDERS).forEach(k => delete DEMO_CHANGE_ORDERS[k]);
    for (const co of data) {
      if (!DEMO_CHANGE_ORDERS[co.project_id]) DEMO_CHANGE_ORDERS[co.project_id] = [];
      const { data: items } = await sb().from('change_order_items').select('*').eq('change_order_id', co.id);
      DEMO_CHANGE_ORDERS[co.project_id].push({
        id: co.id, number: co.number, date: co.created_at ? co.created_at.split('T')[0] : '',
        status: co.status, description: co.description, reason: co.reason,
        items: (items || []).map(i => ({
          description: i.description, qty: parseFloat(i.qty), unit: i.unit, unit_cost: parseFloat(i.unit_cost),
        })),
        revised_completion: co.revised_completion,
      });
    }
  }
}

// ============================================
// FILE UPLOAD TO SUPABASE STORAGE
// ============================================
async function uploadFile(bucket, path, file) {
  if (!sb()) return null;
  const { data, error } = await sb().storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) {
    console.error('Upload error:', error);
    return null;
  }
  // Get public URL
  const { data: urlData } = sb().storage.from(bucket).getPublicUrl(path);
  return urlData ? urlData.publicUrl : null;
}

async function uploadReceiptImage(file, expenseId) {
  const ext = file.name ? file.name.split('.').pop() : 'jpg';
  const path = 'receipts/' + expenseId + '.' + ext;
  return await uploadFile('receipts', path, file);
}

async function uploadDocumentFile(file, projectId) {
  const path = projectId + '/' + Date.now() + '-' + file.name;
  return await uploadFile('documents', path, file);
}

async function uploadDrawingFile(file, projectId) {
  const path = projectId + '/' + Date.now() + '-' + file.name;
  return await uploadFile('drawings', path, file);
}

async function uploadSitePhotoFile(file, projectId, milestoneId) {
  const path = projectId + '/' + milestoneId + '/' + Date.now() + '.jpg';
  return await uploadFile('photos', path, file);
}

console.log('Supabase data layer loaded');
