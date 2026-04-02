/* ================================================
   XOS — Trivex Group Operations System
   ================================================ */

// ============================================
// SUPABASE INIT
// ============================================
const SUPABASE_URL = 'https://ebppkrlykqjwtgzxzihe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVicHBrcmx5a3Fqd3Rnenh6aWhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNTUzMDQsImV4cCI6MjA5MDczMTMwNH0.HgXgh7aX-1owL0HT1SOzk3tVYSEr2f7izP_Jm7aciGY';

let sbClient = null;
let currentUser = null;   // { id, email, full_name, role, avatar_initials }
let currentPage = 'dashboard';

// Try init Supabase
function initSupabase() {
  if (SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase) {
    sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return true;
  }
  return false;
}

// ============================================
// DEMO MODE (works without Supabase)
// ============================================
const DEMO_USERS = {
  'omran@trivexgroup.com': { full_name: 'Omran Ismail', role: 'admin', avatar_initials: 'OI' },
  'alex@trivexgroup.com':  { full_name: 'Alex',         role: 'admin', avatar_initials: 'AX' },
  'saud@trivexgroup.com':  { full_name: 'Saud',         role: 'admin', avatar_initials: 'SD' },
};

// Client users — each linked to a specific project
const DEMO_CLIENTS = {
  'client@test.com': { full_name: '[TEST] Recipe Unlimited', role: 'client', avatar_initials: 'RU', project_id: '1', brand: 'Recipe Unlimited' },
};

// Demo project data
const DEMO_PROJECTS = [
  { id: '1', name: "[TEST] Harvey's — Burlington",  client_brand: 'Recipe Unlimited', status: 'active', completion_pct: 60, target_handover: '2026-06-15', budget: 310000, city: 'Burlington, ON', assigned: ['saud@trivexgroup.com', 'omran@trivexgroup.com', 'alex@trivexgroup.com'] },
];

const DEMO_EXPENSES = [
  { id: '1', project_id: '1', vendor: '[TEST] Home Depot — Lumber', amount: 4250.00, category: 'Materials', expense_date: '2026-03-20', submitted_by: 'saud@trivexgroup.com' },
  { id: '2', project_id: '1', vendor: '[TEST] Santos Electrical', amount: 8500.00, category: 'Subcontractor', expense_date: '2026-03-15', submitted_by: 'omran@trivexgroup.com' },
  { id: '3', project_id: '1', vendor: '[TEST] City of Burlington — Permit', amount: 650.00, category: 'Permits', expense_date: '2026-03-10', submitted_by: 'omran@trivexgroup.com' },
  { id: '4', project_id: 'trivex-corp', vendor: '[TEST] Bell Canada — Office Internet', amount: 189.99, category: 'Other', expense_date: '2026-03-01', submitted_by: 'omran@trivexgroup.com' },
];

const DEMO_INVOICES = [
  { id: '1', invoice_number: '[TEST] INV-2026-001', project_id: '1', stage: 'deposit', amount: 93000, amount_paid: 93000, status: 'paid', issue_date: '2026-02-15', due_date: '2026-03-10',
    payments: [{ amount: 93000, date: '2026-03-08', method: 'E-Transfer' }] },
  { id: '2', invoice_number: '[TEST] INV-2026-002', project_id: '1', stage: 'progress', amount: 124000, amount_paid: 60000, status: 'partially_paid', issue_date: '2026-03-15', due_date: '2026-04-15',
    payments: [{ amount: 60000, date: '2026-03-28', method: 'Wire Transfer' }] },
];

const ESTIMATE_CATEGORIES = ['Demo', 'Rough-in', 'MEP', 'Framing', 'Drywall', 'Finishes', 'Fixtures', 'Project Management', 'Contingency'];

const DEMO_ESTIMATES = [
  {
    id: 'est-1', client_name: '[TEST] Recipe Unlimited', project_type: 'Franchise Fit-Out', status: 'accepted',
    sqft: 2400, address: '123 Brant St, Burlington, ON', target_start: '2026-03-01', margin_pct: 16,
    created_at: '2026-02-10',
    items: [
      { id: 'li-1', description: 'Selective demolition', category: 'Demo', qty: 1, unit: 'lot', unit_cost: 9500 },
      { id: 'li-2', description: 'Electrical rough-in', category: 'Rough-in', qty: 1, unit: 'lot', unit_cost: 24000 },
      { id: 'li-3', description: 'Plumbing — grease trap + drains', category: 'MEP', qty: 1, unit: 'lot', unit_cost: 20000 },
      { id: 'li-4', description: 'HVAC — RTU + ductwork', category: 'MEP', qty: 1, unit: 'lot', unit_cost: 30000 },
      { id: 'li-5', description: 'Framing', category: 'Framing', qty: 2400, unit: 'sqft', unit_cost: 8.50 },
      { id: 'li-6', description: 'Drywall + taping', category: 'Drywall', qty: 2400, unit: 'sqft', unit_cost: 7.00 },
      { id: 'li-7', description: 'Finishes — tile, paint, ceiling', category: 'Finishes', qty: 1, unit: 'lot', unit_cost: 28000 },
      { id: 'li-8', description: 'Fixtures + equipment install', category: 'Fixtures', qty: 1, unit: 'lot', unit_cost: 32000 },
      { id: 'li-9', description: 'Project management — 12 weeks', category: 'Project Management', qty: 12, unit: 'week', unit_cost: 2500 },
      { id: 'li-10', description: 'Contingency (5%)', category: 'Contingency', qty: 1, unit: 'lot', unit_cost: 10000 },
    ],
  },
];

let activeEstimateId = null;

// Standard Trivex construction milestones
const MILESTONE_TEMPLATE = [
  'Permit & Shop Drawings',
  'Demolition',
  'Rough-in',
  'MEP (Mechanical/Electrical/Plumbing)',
  'Framing',
  'Drywall & Taping',
  'Finishes',
  'Fixtures & Equipment',
  'Punch List',
  'Handover',
];

// Generate milestones per project
const DEMO_MILESTONES = {};
function generateMilestones(projectId, completedCount, startDate) {
  const milestones = MILESTONE_TEMPLATE.map((name, i) => {
    const targetDate = new Date(startDate);
    targetDate.setDate(targetDate.getDate() + (i + 1) * 14); // 2 weeks per phase
    let status = 'pending';
    let completedDate = null;
    if (i < completedCount) {
      status = 'complete';
      const cd = new Date(startDate);
      cd.setDate(cd.getDate() + (i + 1) * 12); // completed slightly early
      completedDate = cd.toISOString().split('T')[0];
    } else if (i === completedCount) {
      status = 'in_progress';
    }
    return {
      id: `${projectId}-${i}`,
      project_id: projectId,
      name,
      sort_order: i,
      status,
      target_date: targetDate.toISOString().split('T')[0],
      completed_date: completedDate,
      notes: '',
    };
  });
  return milestones;
}

// Init milestones for each project (completedCount based on completion_pct)
DEMO_MILESTONES['1'] = generateMilestones('1', 6, '2026-02-01'); // [TEST] Harvey's 60%

// Recalculate completion_pct from milestones
DEMO_PROJECTS.forEach(p => {
  const ms = DEMO_MILESTONES[p.id];
  if (ms) {
    const done = ms.filter(m => m.status === 'complete').length;
    p.completion_pct = Math.round((done / ms.length) * 100);
  }
});

// Demo notes per project
const DEMO_NOTES = {
  '1': [
    { id: 'n1', text: '[TEST] Client approved marble countertop upgrade. Extra $4,200 confirmed.', author: 'Omran Ismail', date: '2026-03-20' },
    { id: 'n2', text: '[TEST] Framing inspection passed. Drywall starting next week.', author: 'Saud', date: '2026-03-18' },
  ],
};

// Demo client messages
const MSG_CATEGORIES = ['General', 'Change Request', 'Invoice', 'Drawing', 'Milestone', 'Urgent'];

const DEMO_CLIENT_MESSAGES = {
  '1': [
    { id: 'msg-1', sender: 'Omran Ismail', role: 'trivex', message: 'Hi team, drywall is complete and taping starts Monday. On track for April 30 handover.', date: '2026-03-22 10:30 AM', category: 'Milestone', read_by_client: true, read_by_trivex: true },
    { id: 'msg-2', sender: 'TDL Group', role: 'client', message: 'Thanks Omran. Can we get updated photos of the dining area?', date: '2026-03-22 2:15 PM', category: 'General', read_by_client: true, read_by_trivex: true },
    { id: 'msg-3', sender: 'Omran Ismail', role: 'trivex', message: '[TEST] Saud will take site photos tomorrow and upload them.', date: '2026-03-22 3:00 PM', category: 'General', read_by_client: true, read_by_trivex: true },
    { id: 'msg-4', sender: '[TEST] Recipe Unlimited', role: 'client', message: '[TEST] When can we expect the equipment layout drawing?', date: '2026-03-28 9:00 AM', category: 'Drawing', read_by_client: true, read_by_trivex: false },
  ],
};

function getUnreadClientMsgCount() {
  let count = 0;
  Object.values(DEMO_CLIENT_MESSAGES).forEach(msgs => {
    msgs.forEach(m => { if (m.role === 'client' && !m.read_by_trivex) count++; });
  });
  return count;
}

function getProjectUnreadCount(projectId) {
  const msgs = DEMO_CLIENT_MESSAGES[projectId] || [];
  return msgs.filter(m => m.role === 'client' && !m.read_by_trivex).length;
}

// Change Orders
const DEMO_CHANGE_ORDERS = {
  '1': [
    {
      id: 'co-1', number: '[TEST] CO-001', date: '2026-03-15', status: 'approved',
      description: '[TEST] Countertop upgrade to marble — client request',
      reason: 'Client Request',
      items: [
        { description: 'Remove laminate countertop', qty: 1, unit: 'lot', unit_cost: -2800 },
        { description: 'Supply & install marble', qty: 1, unit: 'lot', unit_cost: 7000 },
      ],
      revised_completion: null,
    },
  ],
};

function getCOTotal(co) {
  return (co.items || []).reduce((s, i) => s + i.qty * i.unit_cost, 0);
}

function getApprovedCOTotal(projectId) {
  const cos = DEMO_CHANGE_ORDERS[projectId] || [];
  return cos.filter(c => c.status === 'approved').reduce((s, c) => s + getCOTotal(c), 0);
}

function nextCONumber(projectId) {
  const cos = DEMO_CHANGE_ORDERS[projectId] || [];
  return 'CO-' + String(cos.length + 1).padStart(3, '0');
}

// Subcontractors — global list
const DEMO_SUBS = [
  { id: 'sub-1', company: 'Santos Electrical', trade: 'Electrical', contact: 'J. Santos', phone: '905-555-0101', email: 'josh@santoselectric.ca' },
  { id: 'sub-2', company: 'Patel HVAC Solutions', trade: 'HVAC', contact: 'M. Patel', phone: '905-555-0202', email: 'mpatel@patelhvac.ca' },
  { id: 'sub-3', company: 'Ontario Plumbing Co.', trade: 'Plumbing', contact: 'R. Singh', phone: '416-555-0303', email: 'info@ontarioplumbing.ca' },
  { id: 'sub-4', company: 'D. Woodworks', trade: 'Millwork', contact: 'D. Nguyen', phone: '905-555-0404', email: 'dan@dwoodworks.ca' },
  { id: 'sub-5', company: 'GTA Drywall Inc.', trade: 'Drywall', contact: 'K. Adams', phone: '905-555-0505', email: 'kyle@gtadrywall.ca' },
  { id: 'sub-6', company: 'ProFloor Installations', trade: 'Flooring', contact: 'T. Brown', phone: '416-555-0606', email: 'tbrown@profloor.ca' },
  { id: 'sub-7', company: 'Apex Framing', trade: 'Framing', contact: 'S. Moreau', phone: '905-555-0707', email: 'steve@apexframing.ca' },
  { id: 'sub-8', company: 'SignCraft Canada', trade: 'Signage', contact: 'L. Chen', phone: '416-555-0808', email: 'lisa@signcraft.ca' },
];

const SUB_TRADES = ['Electrical', 'Plumbing', 'HVAC', 'Framing', 'Drywall', 'Flooring', 'Millwork', 'Signage', 'Other'];

// Sub assignments per project: sub_id → { contract_amount, scope, amount_paid, payments[], notes[] }
const DEMO_SUB_ASSIGNMENTS = {
  '1': [
    { sub_id: 'sub-1', contract_amount: 22000, scope: 'Full electrical rough-in, panels, circuits', amount_paid: 15000,
      payments: [{ amount: 11000, date: '2026-02-15' }, { amount: 4000, date: '2026-03-10' }],
      notes: [{ text: 'Great work, ahead of schedule on rough-in.', date: '2026-03-10' }] },
    { sub_id: 'sub-2', contract_amount: 28000, scope: 'RTU install, ductwork, makeup air', amount_paid: 14000,
      payments: [{ amount: 14000, date: '2026-02-28' }],
      notes: [] },
    { sub_id: 'sub-4', contract_amount: 24000, scope: 'Service counter, back counter, shelving', amount_paid: 0,
      payments: [],
      notes: [{ text: 'Countertop upgraded to marble per CO-001.', date: '2026-03-12' }] },
    { sub_id: 'sub-5', contract_amount: 12600, scope: 'Drywall, taping, sanding throughout', amount_paid: 12600,
      payments: [{ amount: 6300, date: '2026-03-01' }, { amount: 6300, date: '2026-03-18' }],
      notes: [{ text: 'Completed on time, clean work.', date: '2026-03-18' }] },
    { sub_id: 'sub-7', contract_amount: 15300, scope: 'Steel stud framing — walls, soffits, bulkheads', amount_paid: 15300,
      payments: [{ amount: 15300, date: '2026-02-20' }],
      notes: [] },
  ],
};

// Due Diligence Checklist Template
const DD_TEMPLATE = {
  'Utilities': [
    'Electrical panel capacity (amps)',
    'Gas service availability',
    'Water/sewer capacity',
    'Grease trap requirement',
    'Ventilation shaft access',
  ],
  'HVAC': [
    'Rooftop unit availability',
    'Makeup air requirement',
    'Exhaust requirements',
  ],
  'Structural': [
    'Floor load capacity',
    'Ceiling height (clear)',
    'Column interference',
  ],
  'Fire & Life Safety': [
    'Sprinkler system present',
    'Fire alarm hookup required',
    'Hood suppression requirement',
  ],
  'Permits': [
    'Zoning confirmation',
    'Landlord approval required',
    'Heritage designation',
  ],
};

const DD_ASSIGNEES = ['Omran', 'Alex', 'Saud', 'Consultant'];

// Generate default checklist for a project
function generateDDChecklist() {
  const checklist = {};
  Object.entries(DD_TEMPLATE).forEach(([cat, items]) => {
    checklist[cat] = items.map(name => ({
      name,
      status: 'not_confirmed', // confirmed, not_confirmed, na
      notes: '',
      assigned_to: '',
    }));
  });
  return checklist;
}

// Per-project checklists
const DEMO_DD_CHECKLISTS = {
  '1': (() => {
    const c = generateDDChecklist();
    // Tim Hortons — mostly confirmed
    c['Utilities'][0] = { name: 'Electrical panel capacity (amps)', status: 'confirmed', notes: '200A panel — sufficient', assigned_to: 'Saud' };
    c['Utilities'][1] = { name: 'Gas service availability', status: 'confirmed', notes: 'Gas line active, 2" supply', assigned_to: 'Saud' };
    c['Utilities'][2] = { name: 'Water/sewer capacity', status: 'confirmed', notes: '', assigned_to: 'Alex' };
    c['Utilities'][3] = { name: 'Grease trap requirement', status: 'confirmed', notes: 'Required — 50 gal minimum per municipal code', assigned_to: 'Omran' };
    c['Utilities'][4] = { name: 'Ventilation shaft access', status: 'confirmed', notes: 'Roof access confirmed with landlord', assigned_to: 'Omran' };
    c['HVAC'][0] = { name: 'Rooftop unit availability', status: 'confirmed', notes: '2x RTU pads available', assigned_to: 'Saud' };
    c['HVAC'][1] = { name: 'Makeup air requirement', status: 'confirmed', notes: 'MAU required per hood spec', assigned_to: 'Consultant' };
    c['HVAC'][2] = { name: 'Exhaust requirements', status: 'confirmed', notes: '', assigned_to: 'Saud' };
    c['Structural'][0] = { name: 'Floor load capacity', status: 'confirmed', notes: '150 psf — adequate for walk-in cooler', assigned_to: 'Consultant' };
    c['Structural'][1] = { name: 'Ceiling height (clear)', status: 'confirmed', notes: '12ft clear — good', assigned_to: 'Saud' };
    c['Structural'][2] = { name: 'Column interference', status: 'na', notes: 'No columns in unit', assigned_to: 'Saud' };
    c['Fire & Life Safety'][0] = { name: 'Sprinkler system present', status: 'confirmed', notes: 'Wet system in place', assigned_to: 'Omran' };
    c['Fire & Life Safety'][1] = { name: 'Fire alarm hookup required', status: 'confirmed', notes: 'Tie-in to building panel', assigned_to: 'Omran' };
    c['Fire & Life Safety'][2] = { name: 'Hood suppression requirement', status: 'confirmed', notes: 'Ansul system required', assigned_to: 'Consultant' };
    c['Permits'][0] = { name: 'Zoning confirmation', status: 'confirmed', notes: 'Commercial food service permitted', assigned_to: 'Omran' };
    c['Permits'][1] = { name: 'Landlord approval required', status: 'confirmed', notes: 'LOI signed, lease in progress', assigned_to: 'Omran' };
    c['Permits'][2] = { name: 'Heritage designation', status: 'na', notes: 'Not applicable', assigned_to: 'Omran' };
    return c;
  })(),
};

function getDDCompletion(projectId) {
  const checklist = DEMO_DD_CHECKLISTS[projectId];
  if (!checklist) return null;
  let total = 0, done = 0;
  Object.values(checklist).forEach(items => {
    items.forEach(item => {
      total++;
      if (item.status === 'confirmed' || item.status === 'na') done++;
    });
  });
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

// Team members for scheduling
const TEAM_MEMBERS = [
  { id: 'omran', name: 'Omran', email: 'omran@trivexgroup.com' },
  { id: 'alex', name: 'Alex', email: 'alex@trivexgroup.com' },
  { id: 'saud', name: 'Saud', email: 'saud@trivexgroup.com' },
];

// Weekly schedule entries: { user_id, project_id, date }
const DEMO_SCHEDULE = [
  // Week of 2026-03-23
  { user_id: 'saud', project_id: '1', date: '2026-03-23' },
  { user_id: 'saud', project_id: '1', date: '2026-03-24' },
  { user_id: 'saud', project_id: '2', date: '2026-03-25' },
  { user_id: 'saud', project_id: '2', date: '2026-03-26' },
  { user_id: 'saud', project_id: '6', date: '2026-03-27' },
  { user_id: 'alex', project_id: '1', date: '2026-03-24' },
  { user_id: 'alex', project_id: '5', date: '2026-03-25' },
  { user_id: 'alex', project_id: '5', date: '2026-03-26' },
  { user_id: 'omran', project_id: '3', date: '2026-03-24' },
  { user_id: 'omran', project_id: '7', date: '2026-03-26' },
  // Week of 2026-03-30
  { user_id: 'saud', project_id: '1', date: '2026-03-30' },
  { user_id: 'saud', project_id: '1', date: '2026-03-31' },
  { user_id: 'saud', project_id: '6', date: '2026-04-01' },
  { user_id: 'saud', project_id: '6', date: '2026-04-02' },
  { user_id: 'alex', project_id: '5', date: '2026-03-30' },
  { user_id: 'alex', project_id: '2', date: '2026-04-01' },
  { user_id: 'omran', project_id: '1', date: '2026-03-31' },
];

// Tasks
const DEMO_TASKS = [
  { id: 't-1', project_id: '1', title: '[TEST] Schedule electrical inspection', assigned_to: 'saud', due_date: '2026-04-05', priority: 'high', completed: false },
  { id: 't-2', project_id: '1', title: '[TEST] Order marble countertop material', assigned_to: 'alex', due_date: '2026-04-08', priority: 'high', completed: false },
  { id: 't-3', project_id: '1', title: '[TEST] Upload floor plan Rev.4', assigned_to: 'omran', due_date: '2026-03-25', priority: 'low', completed: true },
];

let scheduleWeekOffset = 0; // 0 = current week, -1 = last week, +1 = next week

// Milestone sign-offs by client { milestone_id: { signed_by, signed_at } }
const DEMO_SIGNOFFS = {};

// Client Change Requests (distinct from Trivex-issued Change Orders)
const DEMO_CHANGE_REQUESTS = {
  '1': [
    {
      id: 'cr-1', number: '[TEST] CR-2026-001', status: 'submitted',
      title: '[TEST] Add USB outlets to dining counter',
      description: 'We need USB-A and USB-C charging outlets along the dining counter (8 positions).',
      location: 'Dining area',
      priority: 'Would like it done',
      submitted_by: '[TEST] Recipe Unlimited', submitted_at: '2026-03-25',
      quote_amount: null, quote_timeline: null,
      comments: [],
    },
  ],
};

function nextCRNumber(projectId) {
  const crs = DEMO_CHANGE_REQUESTS[projectId] || [];
  return 'CR-2026-' + String(crs.length + 1).padStart(3, '0');
}

// Client activity feed per project
const DEMO_CLIENT_ACTIVITY = {
  '1': [
    { icon: 'fas fa-check-circle', color: 'var(--green)', text: '[TEST] Drywall & Taping marked complete', date: '2026-03-18' },
    { icon: 'fas fa-check', color: 'var(--green)', text: '[TEST] Change order CO-001 approved — +$4,200', date: '2026-03-15' },
    { icon: 'fas fa-file-invoice-dollar', color: 'var(--blue)', text: '[TEST] Deposit invoice issued — $93,000', date: '2026-02-15' },
    { icon: 'fas fa-dollar-sign', color: 'var(--green)', text: '[TEST] Payment received — $93,000', date: '2026-03-08' },
  ],
};

// ============================================
// DRAWINGS DATA
// ============================================
const DRAWING_CATEGORIES = ['Floor Plans', 'Electrical', 'Mechanical', 'Plumbing', 'Structural', 'Signage', 'Other'];

const DEMO_DRAWINGS = {
  '1': [
    {
      id: 'dwg-1', title: 'Floor Plan — Main Level', drawing_number: 'DWG-001', category: 'Floor Plans',
      revision: 'B', status: 'current', shared_with_client: true,
      uploaded_by: 'Omran Ismail', created_at: '2026-03-10', file_type: 'pdf',
      revisions: [
        { rev: 'A', date: '2026-02-15', uploaded_by: 'Omran Ismail', status: 'superseded' },
        { rev: 'B', date: '2026-03-10', uploaded_by: 'Omran Ismail', status: 'current' },
      ],
      markups: [
        { id: 'mk-1', type: 'rect', x: 120, y: 80, w: 160, h: 100, color: '#3b82f6', text: 'Service counter area — verify dimensions with millwork sub', created_by: 'Omran Ismail', role: 'trivex', created_at: '2026-03-12', resolved: false },
        { id: 'mk-2', type: 'circle', x: 350, y: 200, r: 30, color: '#f97316', text: 'Grease trap access — client requested relocation', created_by: 'TDL Group', role: 'client', created_at: '2026-03-15', resolved: false },
        { id: 'mk-3', type: 'text', x: 50, y: 300, color: '#22c55e', text: 'Drive-thru window position confirmed', created_by: 'Omran Ismail', role: 'trivex', created_at: '2026-03-08', resolved: true },
      ],
      approval: { id: 'apr-1', number: 'APR-2026-001', status: 'pending', requested_by: 'Omran Ismail', requested_at: '2026-03-12', deadline: '2026-03-20', description: 'Please review floor layout and approve for construction.' },
    },
    {
      id: 'dwg-2', title: 'Electrical Layout', drawing_number: 'DWG-002', category: 'Electrical',
      revision: 'A', status: 'current', shared_with_client: true,
      uploaded_by: 'Alex', created_at: '2026-03-05', file_type: 'image',
      revisions: [
        { rev: 'A', date: '2026-03-05', uploaded_by: 'Alex', status: 'current' },
      ],
      markups: [],
      approval: null,
    },
    {
      id: 'dwg-3', title: 'HVAC Duct Routing', drawing_number: 'DWG-003', category: 'Mechanical',
      revision: 'A', status: 'current', shared_with_client: false,
      uploaded_by: 'Omran Ismail', created_at: '2026-03-08', file_type: 'pdf',
      revisions: [
        { rev: 'A', date: '2026-03-08', uploaded_by: 'Omran Ismail', status: 'current' },
      ],
      markups: [],
      approval: null,
    },
    {
      id: 'dwg-4', title: 'Signage Package', drawing_number: 'DWG-004', category: 'Signage',
      revision: 'C', status: 'approved', shared_with_client: true,
      uploaded_by: 'Omran Ismail', created_at: '2026-02-28', file_type: 'image',
      revisions: [
        { rev: 'A', date: '2026-02-10', uploaded_by: 'Omran Ismail', status: 'superseded' },
        { rev: 'B', date: '2026-02-20', uploaded_by: 'Omran Ismail', status: 'superseded' },
        { rev: 'C', date: '2026-02-28', uploaded_by: 'Omran Ismail', status: 'approved' },
      ],
      markups: [],
      approval: { id: 'apr-2', number: 'APR-2026-002', status: 'approved', requested_by: 'Omran Ismail', requested_at: '2026-02-28', approved_by: 'TDL Group', approved_at: '2026-03-02', description: 'Final signage layout for approval.' },
    },
  ],
};

// Client-uploaded drawings
const DEMO_CLIENT_DRAWINGS = {
  '1': [
    { id: 'cdwg-1', title: 'Brand Standards Guide', file_type: 'pdf', uploaded_by: 'TDL Group', created_at: '2026-02-01', category: 'Brand Standards' },
    { id: 'cdwg-2', title: 'Landlord As-Built Reference', file_type: 'pdf', uploaded_by: 'TDL Group', created_at: '2026-01-28', category: 'As-Built' },
  ],
};

let activeDrawingId = null;

// ============================================
// SUBCONTRACTOR BIDDING DATA
// ============================================
const BID_TRADES = ['Electrical', 'Plumbing', 'HVAC', 'Framing', 'Drywall', 'Flooring', 'Millwork', 'Signage', 'Painting', 'Fire Protection', 'Roofing', 'Other'];

const DEMO_BID_PACKAGES = {
  '1': [
    {
      id: 'bp-1', trade: 'Electrical', scope: 'Full electrical rough-in — 200A panel, circuits, outlets, lighting, drive-thru',
      status: 'awarded', // draft, open, closed, awarded
      created_at: '2026-01-15', deadline: '2026-01-28',
      invited: ['sub-1'],
      bids: [
        { sub_id: 'sub-1', amount: 22000, timeline: '3 weeks', notes: 'Includes panel upgrade. Can start Jan 20.', submitted_at: '2026-01-22', status: 'awarded',
          estimates: [
            { id: 'best-1', version: 1, name: 'Santos Electrical — Estimate Rev A.pdf', submitted_at: '2026-01-22', fileData: null, approved: true, approved_by: 'Omran Ismail', approved_at: '2026-01-24' },
          ]},
      ],
      awarded_to: 'sub-1', awarded_amount: 22000,
    },
    {
      id: 'bp-2', trade: 'HVAC', scope: 'RTU install (x2), ductwork, makeup air unit, exhaust system, controls',
      status: 'awarded',
      created_at: '2026-01-18', deadline: '2026-02-01',
      invited: ['sub-2'],
      bids: [
        { sub_id: 'sub-2', amount: 28000, timeline: '4 weeks', notes: 'RTU crane included. Startup and commissioning included.', submitted_at: '2026-01-25', status: 'awarded',
          estimates: [
            { id: 'best-2', version: 1, name: 'Patel HVAC — Quote V1.pdf', submitted_at: '2026-01-23', fileData: null, approved: false },
            { id: 'best-3', version: 2, name: 'Patel HVAC — Quote V2 (revised).pdf', submitted_at: '2026-01-25', fileData: null, approved: true, approved_by: 'Omran Ismail', approved_at: '2026-01-27' },
          ]},
      ],
      awarded_to: 'sub-2', awarded_amount: 28000,
    },
    {
      id: 'bp-3', trade: 'Flooring', scope: 'Porcelain tile — kitchen, service area, dining (1,200 sqft), transitions, baseboards',
      status: 'open',
      created_at: '2026-03-20', deadline: '2026-04-05',
      invited: ['sub-6'],
      bids: [
        { sub_id: 'sub-6', amount: 16800, timeline: '5 days', notes: 'Material + labour. Grout sealer included.', submitted_at: '2026-03-25', status: 'submitted',
          estimates: [
            { id: 'best-4', version: 1, name: 'ProFloor — Tile Estimate.pdf', submitted_at: '2026-03-25', fileData: null, approved: false },
          ]},
      ],
      awarded_to: null, awarded_amount: null,
    },
  ],
};

function nextBidPackageId() { return 'bp-' + Date.now(); }

// ============================================
// SIGNATURE DATA
// ============================================
const DEMO_SIGNATURES = {
  '1': [
    {
      id: 'sig-1', doc_id: 'doc-1', doc_name: 'GC Contract — Tim Hortons Brampton.pdf',
      status: 'signed', // pending, signed, declined
      requested_by: 'Omran Ismail', requested_at: '2026-01-18',
      signer_name: 'TDL Group', signer_email: 'ops@tdlgroup.com',
      signed_by: 'TDL Group', signed_at: '2026-01-20 2:30 PM',
      signature_type: 'typed', // typed or drawn
      signature_text: 'TDL Group — Authorized Representative',
      ip_address: '192.168.1.45',
      doc_hash: 'a7f3c2...b8e1d4',
      notes: 'GC Contract for Tim Hortons Brampton fit-out',
    },
    {
      id: 'sig-2', doc_id: null, doc_name: 'CCDC 2 — Stipulated Price Contract.pdf',
      status: 'pending',
      requested_by: 'Omran Ismail', requested_at: '2026-03-25',
      signer_name: 'TDL Group', signer_email: 'ops@tdlgroup.com',
      signed_by: null, signed_at: null,
      signature_type: null, signature_text: null,
      ip_address: null, doc_hash: null,
      notes: 'CCDC 2 contract for change order scope — requires client signature before work proceeds',
    },
  ],
};

function nextSigId() { return 'sig-' + Date.now(); }

// ============================================
// DOCUMENTS DATA
// ============================================
const DOC_CATEGORIES_TRIVEX = ['Contracts', 'Permits', 'Shop Drawings', 'Inspection Reports', 'Photos', 'Invoices', 'Other'];
const DOC_CATEGORIES_CLIENT = ['Lease', 'Brand Standards', 'Landlord Approvals', 'Insurance', 'Reference Images', 'Other'];

const DEMO_DOCUMENTS = {
  '1': {
    trivex: [
      { id: 'doc-1', name: 'GC Contract — Tim Hortons Brampton.pdf', category: 'Contracts', size: '3.1 MB', uploaded_by: 'Omran Ismail', date: '2026-01-18', shared: true },
      { id: 'doc-2', name: 'Building Permit — Approved.pdf', category: 'Permits', size: '1.2 MB', uploaded_by: 'Omran Ismail', date: '2026-02-10', shared: true },
      { id: 'doc-3', name: 'Electrical Inspection Report.pdf', category: 'Inspection Reports', size: '680 KB', uploaded_by: 'Alex', date: '2026-03-15', shared: true },
      { id: 'doc-4', name: 'Site Photos — Week 8.zip', category: 'Photos', size: '18 MB', uploaded_by: 'Saud', date: '2026-03-20', shared: true },
      { id: 'doc-5', name: 'Sub Agreement — Santos Electrical.pdf', category: 'Contracts', size: '1.8 MB', uploaded_by: 'Omran Ismail', date: '2026-01-25', shared: false },
      { id: 'doc-6', name: 'Sub Agreement — Patel HVAC.pdf', category: 'Contracts', size: '1.5 MB', uploaded_by: 'Omran Ismail', date: '2026-02-01', shared: false },
    ],
    client: [
      { id: 'cdoc-1', name: 'Lease Agreement — Brampton Plaza.pdf', category: 'Lease', size: '2.4 MB', uploaded_by: 'TDL Group', date: '2026-01-10' },
      { id: 'cdoc-2', name: 'Tim Hortons Brand Standards 2026.pdf', category: 'Brand Standards', size: '8.5 MB', uploaded_by: 'TDL Group', date: '2026-01-12' },
      { id: 'cdoc-3', name: 'Landlord LOI — Signed.pdf', category: 'Landlord Approvals', size: '420 KB', uploaded_by: 'TDL Group', date: '2026-01-15' },
    ],
    requests: [
      { id: 'dreq-1', name: 'Certificate of Insurance', category: 'Insurance', reason: 'Required before construction start', deadline: '2026-02-01', status: 'fulfilled', fulfilled_doc: 'cdoc-4' },
      { id: 'dreq-2', name: 'Franchise Agreement (relevant sections)', category: 'Brand Standards', reason: 'Need equipment specs and layout requirements', deadline: '2026-04-01', status: 'pending' },
    ],
  },
};
let markupMode = null; // null, 'arrow', 'rect', 'circle', 'text', 'freehand'
let markupColor = '#3b82f6'; // default trivex blue
let markupVisibility = 'all'; // all, mine, none
let drawingMarkupTemp = []; // temp markup being drawn

function nextDrawingNumber(projectId) {
  const drawings = DEMO_DRAWINGS[projectId] || [];
  return 'DWG-' + String(drawings.length + 1).padStart(3, '0');
}

function nextApprovalNumber() {
  let max = 0;
  Object.values(DEMO_DRAWINGS).forEach(drawings => {
    drawings.forEach(d => {
      if (d.approval && d.approval.number) {
        const n = parseInt(d.approval.number.match(/(\d+)$/)?.[1] || '0');
        if (n > max) max = n;
      }
    });
  });
  return 'APR-2026-' + String(max + 1).padStart(3, '0');
}

// Track which project is being viewed
// Site photos per milestone { project_id: { milestone_id: [{ id, url, caption, uploaded_by, date }] } }
const DEMO_SITE_PHOTOS = {};

// File folders structure { project_id: { folder: [files] } }
// Auto-organized: receipts, photos, documents, drawings, signed
const FILE_FOLDERS = {};

function getProjectFolders(projectId) {
  if (!FILE_FOLDERS[projectId]) {
    FILE_FOLDERS[projectId] = {
      receipts: DEMO_EXPENSES.filter(function(e) { return e.project_id === projectId && e.receipt_thumbnail; }).map(function(e) { return { name: e.vendor + ' — ' + formatCAD(e.amount), date: e.expense_date, type: 'receipt' }; }),
      photos: [],
      documents: ((DEMO_DOCUMENTS[projectId] || {}).trivex || []).concat((DEMO_DOCUMENTS[projectId] || {}).client || []),
      signed: (DEMO_SIGNATURES[projectId] || []).filter(function(s) { return s.status === 'signed'; }).map(function(s) { return { name: s.doc_name, date: s.signed_at, type: 'signed' }; }),
    };
  }
  return FILE_FOLDERS[projectId];
}

let activeProjectId = null;
let activeProjectTab = 'overview';

// ============================================
// AUTH
// ============================================

async function handleLogin() {
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('login-btn');
  const errorEl = document.getElementById('login-error');

  if (!email) {
    errorEl.textContent = 'Please enter your email address.';
    errorEl.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Signing in...';
  errorEl.style.display = 'none';

  // Try Supabase auth first
  if (sbClient) {
    try {
      const { data, error } = await sbClient.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: profile } = await sbClient.from('profiles').select('*').eq('id', data.user.id).single();
      if (profile) {
        currentUser = profile;
        enterApp();
        return;
      }
    } catch (err) {
      // Fall through to demo mode if Supabase fails
      console.warn('Supabase auth failed, trying demo mode:', err.message);
    }
  }

  // Demo mode fallback — check all user types
  const demoUser = DEMO_USERS[email];
  if (demoUser) {
    currentUser = { id: email, email, ...demoUser };
    enterApp();
    return;
  }

  // Check client accounts
  const clientUser = DEMO_CLIENTS[email];
  if (clientUser) {
    currentUser = { id: email, email, ...clientUser };
    enterApp();
    return;
  }

  // Check sub accounts
  const subUser = DEMO_SUBS.find(s => s.email === email);
  if (subUser) {
    currentUser = { id: subUser.id, email: subUser.email, full_name: subUser.company, role: 'sub', avatar_initials: subUser.company.substring(0, 2).toUpperCase(), sub_id: subUser.id };
    enterApp();
    return;
  }

  errorEl.textContent = 'No account found with that email.';
  errorEl.style.display = 'block';
  btn.disabled = false;
  btn.textContent = 'Sign in';
}

// ============================================
// CLIENT PORTAL LOGIN
// ============================================
async function handlePortalLogin() {
  const email = document.getElementById('portal-email').value.trim().toLowerCase();
  const password = document.getElementById('portal-password').value;
  const btn = document.getElementById('portal-login-btn');
  const errorEl = document.getElementById('portal-login-error');

  if (!email) {
    errorEl.textContent = 'Please enter your email address.';
    errorEl.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Signing in...';
  errorEl.style.display = 'none';

  // Try Supabase first
  if (sbClient) {
    try {
      const { data, error } = await sbClient.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: profile } = await sbClient.from('profiles').select('*').eq('id', data.user.id).single();
      if (profile && profile.role === 'client') {
        // Get linked project
        const { data: link } = await sbClient.from('client_projects').select('project_id').eq('client_id', data.user.id).single();
        currentUser = { ...profile, project_id: link?.project_id };
        enterApp();
        return;
      } else if (profile) {
        errorEl.textContent = 'This portal is for clients only. Use the main login at /.';
        errorEl.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'View My Project';
        return;
      }
    } catch (err) {
      console.warn('Supabase portal auth failed, trying demo mode:', err.message);
    }
  }

  // Demo mode
  const client = DEMO_CLIENTS[email];
  if (client) {
    currentUser = { id: email, email, ...client };
    enterApp();
    return;
  }

  errorEl.textContent = 'No account found with that email. Contact Trivex Group for access.';
  errorEl.style.display = 'block';
  btn.disabled = false;
  btn.textContent = 'View My Project';
}

async function handleLogout() {
  if (sbClient) {
    await sbClient.auth.signOut();
  }
  currentUser = null;
  document.getElementById('app-shell').style.display = 'none';

  // Always show the single login screen
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('login-email').value = '';
  document.getElementById('login-password').value = '';
  document.getElementById('login-btn').disabled = false;
  document.getElementById('login-btn').textContent = 'Sign in';
  document.getElementById('login-error').style.display = 'none';
}

// ============================================
// SUB BID PORTAL
// ============================================
function handleBidLogin() {
  const email = document.getElementById('bid-email').value.trim().toLowerCase();
  const errorEl = document.getElementById('bid-login-error');
  if (!email) { errorEl.textContent = 'Enter your email.'; errorEl.style.display = 'block'; return; }

  // Find sub by email
  const sub = DEMO_SUBS.find(s => s.email === email);
  if (!sub) {
    errorEl.textContent = 'No subcontractor account found with that email. Contact Trivex for access.';
    errorEl.style.display = 'block';
    return;
  }

  currentUser = { id: sub.id, email: sub.email, full_name: sub.company, role: 'sub', avatar_initials: sub.company.substring(0, 2).toUpperCase(), sub_id: sub.id };
  document.getElementById('bid-login-screen').style.display = 'none';
  document.getElementById('app-shell').style.display = 'flex';
  document.getElementById('sidebar').style.display = 'none';
  document.getElementById('user-avatar').textContent = currentUser.avatar_initials;
  document.getElementById('user-name').textContent = currentUser.full_name;
  document.getElementById('user-role-label').textContent = 'Subcontractor';
  const bottomNav = document.getElementById('bottom-nav');
  if (bottomNav) bottomNav.style.display = 'none';

  renderBidPortal();
}

function renderBidPortal() {
  const sub = DEMO_SUBS.find(s => s.id === currentUser.sub_id);
  if (!sub) return;

  // Find all bid packages this sub is invited to
  const myBids = [];
  Object.entries(DEMO_BID_PACKAGES).forEach(function([pid, pkgs]) {
    const proj = DEMO_PROJECTS.find(function(p) { return p.id === pid; });
    pkgs.forEach(function(bp) {
      if (bp.invited.includes(sub.id) && bp.status === 'open') {
        const existingBid = bp.bids.find(function(b) { return b.sub_id === sub.id; });
        myBids.push({ projectId: pid, project: proj, bp: bp, existingBid: existingBid });
      }
    });
  });

  // Awarded history
  const awarded = [];
  Object.entries(DEMO_BID_PACKAGES).forEach(function([pid, pkgs]) {
    const proj = DEMO_PROJECTS.find(function(p) { return p.id === pid; });
    pkgs.forEach(function(bp) {
      if (bp.awarded_to === sub.id) {
        awarded.push({ project: proj, bp: bp });
      }
    });
  });

  document.getElementById('breadcrumb').textContent = 'Bid Portal';

  var html = '<div class="page-header"><div><h1>Welcome, ' + sub.company + '</h1><p class="page-header-sub">' + sub.trade + ' · ' + sub.contact + ' · ' + sub.phone + '</p></div>' +
    '<button class="btn btn-outline btn-sm" onclick="handleLogout()"><i class="fas fa-sign-out-alt"></i> Sign Out</button></div>';

  html += '<div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">' +
    statCard('Open Invitations', myBids.length, 'fas fa-envelope-open', 'var(--blue)', 'Awaiting your bid') +
    statCard('Bids Submitted', myBids.filter(function(b) { return b.existingBid; }).length, 'fas fa-paper-plane', 'var(--orange)', '') +
    statCard('Trades Awarded', awarded.length, 'fas fa-trophy', 'var(--green)', awarded.length > 0 ? formatCAD(awarded.reduce(function(s, a) { return s + a.bp.awarded_amount; }, 0)) + ' total' : '') +
  '</div>';

  // Open bid packages
  if (myBids.length > 0) {
    html += '<div class="section-title" style="margin-bottom:12px;">Open Bid Packages</div>';
    myBids.forEach(function(item) {
      var bp = item.bp;
      var proj = item.project;
      var existing = item.existingBid;

      html += '<div class="stat-card mb-20" style="border-left:3px solid var(--blue);">';
      html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;flex-wrap:wrap;gap:8px;">';
      html += '<div>';
      html += '<span class="tag" style="background:var(--navy);color:#fff;font-size:11px;padding:3px 10px;">' + bp.trade + '</span>';
      html += '<div style="font-size:14px;font-weight:600;margin-top:6px;">' + bp.scope + '</div>';
      html += '<div class="text-muted" style="font-size:12px;margin-top:2px;">Project: <strong>' + (proj ? proj.name : '—') + '</strong> · ' + (proj ? proj.city : '') + '</div>';
      html += '<div class="text-muted" style="font-size:11px;">Deadline: <strong>' + bp.deadline + '</strong></div>';
      html += '</div>';
      html += '</div>';

      if (existing) {
        var ests = existing.estimates || [];
        var latestEst = ests.length > 0 ? ests[ests.length - 1] : null;
        var approvedEst = ests.find(function(e) { return e.approved; });

        html += '<div style="padding:12px;background:var(--green-bg);border:1px solid rgba(34,197,94,0.2);border-radius:var(--radius);margin-top:8px;">';
        html += '<div style="font-size:13px;font-weight:600;color:var(--green);"><i class="fas fa-check-circle" style="margin-right:6px;"></i>Bid Submitted</div>';
        html += '<div style="font-size:14px;font-weight:700;margin-top:4px;">' + formatCAD(existing.amount) + ' · ' + existing.timeline + '</div>';
        html += '<div class="text-muted" style="font-size:11px;margin-top:2px;">Submitted ' + existing.submitted_at + '</div>';

        // Show estimate documents
        if (ests.length > 0) {
          html += '<div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(34,197,94,0.2);">';
          html += '<div style="font-size:12px;font-weight:600;margin-bottom:6px;">Your Estimates (' + ests.length + ')</div>';
          ests.slice().reverse().forEach(function(est) {
            html += '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:12px;">';
            html += '<i class="fas fa-file-pdf" style="color:var(--red);"></i>';
            html += '<span style="flex:1;">' + est.name + ' <span class="text-muted">· V' + est.version + ' · ' + est.submitted_at + '</span></span>';
            if (est.approved) {
              html += '<span style="background:var(--green);color:#fff;font-size:10px;font-weight:600;padding:2px 8px;border-radius:8px;"><i class="fas fa-stamp" style="margin-right:3px;"></i>Approved ' + est.approved_at + '</span>';
            }
            html += '</div>';
          });
          html += '</div>';
        }

        // Approved estimate = signed document
        if (approvedEst) {
          html += '<div style="margin-top:10px;padding:10px 12px;background:#fff;border:2px solid var(--green);border-radius:var(--radius);display:flex;align-items:center;gap:8px;">';
          html += '<i class="fas fa-stamp" style="color:var(--green);font-size:16px;"></i>';
          html += '<div style="flex:1;"><div style="font-size:12px;font-weight:600;color:var(--green);">Estimate Approved & Locked</div>';
          html += '<div class="text-muted" style="font-size:11px;">Approved by ' + approvedEst.approved_by + ' on ' + approvedEst.approved_at + ' — this is a binding record</div></div>';
          html += '<button class="btn btn-outline btn-sm" onclick="downloadApprovedEstimate(\'' + item.projectId + '\',\'' + bp.id + '\',\'' + existing.sub_id + '\')"><i class="fas fa-download"></i></button>';
          html += '</div>';
        }

        // Upload revised estimate (always allowed — can never remove, only add)
        html += '<div style="margin-top:10px;padding:10px 12px;background:var(--page-bg);border-radius:var(--radius);">';
        html += '<div style="font-size:12px;font-weight:500;margin-bottom:6px;">Upload ' + (ests.length > 0 ? 'Revised ' : '') + 'Estimate</div>';
        html += '<div style="display:flex;gap:8px;align-items:center;">';
        html += '<input type="file" id="sub-est-file-' + bp.id + '" accept=".pdf,.jpg,.jpeg,.png" class="form-input-styled" style="padding:6px;font-size:12px;flex:1;">';
        html += '<button class="btn btn-accent btn-sm" onclick="uploadSubEstimate(\'' + item.projectId + '\',\'' + bp.id + '\')"><i class="fas fa-upload"></i> Upload</button>';
        html += '</div>';
        html += '<div class="text-muted" style="font-size:10px;margin-top:4px;"><i class="fas fa-lock" style="margin-right:3px;"></i>Uploaded estimates cannot be removed — they become part of the permanent bid record.</div>';
        html += '</div>';

        html += '</div>';
      } else {
        html += '<div style="margin-top:12px;padding:16px;border:2px dashed var(--orange);border-radius:var(--radius);background:var(--orange-light);">';
        html += '<div style="font-size:13px;font-weight:600;margin-bottom:10px;"><i class="fas fa-pen" style="color:var(--orange);margin-right:6px;"></i>Submit Your Bid</div>';
        html += '<div style="display:flex;gap:10px;margin-bottom:10px;flex-wrap:wrap;">';
        html += '<div class="form-group" style="flex:1;min-width:140px;"><label class="form-label" style="font-size:11px;">Bid Amount (CAD)</label><input id="bid-amount-' + bp.id + '" class="form-input-styled" type="number" step="0.01" placeholder="0.00" inputmode="decimal"></div>';
        html += '<div class="form-group" style="flex:1;min-width:140px;"><label class="form-label" style="font-size:11px;">Timeline</label><input id="bid-timeline-' + bp.id + '" class="form-input-styled" placeholder="e.g. 2 weeks"></div>';
        html += '</div>';
        html += '<div class="form-group" style="margin-bottom:10px;"><label class="form-label" style="font-size:11px;">Notes / Inclusions</label><textarea id="bid-notes-' + bp.id + '" class="form-input-styled" rows="2" placeholder="What\'s included, exclusions, conditions..."></textarea></div>';
        html += '<div class="form-group" style="margin-bottom:10px;"><label class="form-label" style="font-size:11px;">Upload Estimate (PDF or image)</label><input type="file" id="bid-est-file-' + bp.id + '" accept=".pdf,.jpg,.jpeg,.png" class="form-input-styled" style="padding:6px;font-size:12px;"></div>';
        html += '<button class="btn btn-accent btn-full" onclick="submitSubBid(\'' + item.projectId + '\',\'' + bp.id + '\')"><i class="fas fa-paper-plane"></i> Submit Bid</button>';
        html += '</div>';
      }
      html += '</div>';
    });
  } else {
    html += '<div class="empty-state"><i class="fas fa-inbox"></i><h3>No open bid invitations</h3><p>You\'ll see bid packages here when Trivex invites you to price a trade.</p></div>';
  }

  // Awarded trades
  if (awarded.length > 0) {
    html += '<div class="section-title" style="margin-top:24px;margin-bottom:12px;"><i class="fas fa-trophy" style="color:var(--green);margin-right:6px;"></i>Awarded Trades</div>';
    awarded.forEach(function(item) {
      html += '<div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--green-bg);border:1px solid rgba(34,197,94,0.2);border-radius:var(--radius);margin-bottom:8px;">';
      html += '<i class="fas fa-trophy" style="color:var(--green);font-size:16px;"></i>';
      html += '<div style="flex:1;"><div style="font-size:13px;font-weight:600;">' + item.bp.trade + ' — ' + (item.project ? item.project.name : '') + '</div>';
      html += '<div class="text-muted" style="font-size:11px;">' + item.bp.scope.substring(0, 60) + '...</div></div>';
      html += '<div style="font-size:15px;font-weight:700;color:var(--green);">' + formatCAD(item.bp.awarded_amount) + '</div>';
      html += '</div>';
    });
  }

  document.getElementById('page-content').innerHTML = html;
}

function submitSubBid(projectId, bpId) {
  var amount = parseFloat(document.getElementById('bid-amount-' + bpId).value);
  if (!amount || amount <= 0) { alert('Enter a valid bid amount.'); return; }

  var pkgs = DEMO_BID_PACKAGES[projectId] || [];
  var bp = pkgs.find(function(b) { return b.id === bpId; });
  if (!bp) return;

  var bid = {
    sub_id: currentUser.sub_id,
    amount: amount,
    timeline: document.getElementById('bid-timeline-' + bpId).value || '',
    notes: document.getElementById('bid-notes-' + bpId).value || '',
    submitted_at: new Date().toISOString().split('T')[0],
    status: 'submitted',
    estimates: [],
  };

  // Read estimate file if attached
  var fileInput = document.getElementById('bid-est-file-' + bpId);
  if (fileInput && fileInput.files[0]) {
    var file = fileInput.files[0];
    var reader = new FileReader();
    reader.onload = function(e) {
      bid.estimates.push({
        id: 'best-' + Date.now(),
        version: 1,
        name: file.name,
        submitted_at: new Date().toISOString().split('T')[0],
        fileData: e.target.result,
        fileType: file.type,
        approved: false,
      });
      bp.bids.push(bid);
      renderBidPortal();
    };
    reader.readAsDataURL(file);
  } else {
    bp.bids.push(bid);
    renderBidPortal();
  }
}

function uploadSubEstimate(projectId, bpId) {
  var fileInput = document.getElementById('sub-est-file-' + bpId);
  if (!fileInput || !fileInput.files[0]) { alert('Select a file to upload.'); return; }

  var pkgs = DEMO_BID_PACKAGES[projectId] || [];
  var bp = pkgs.find(function(b) { return b.id === bpId; });
  if (!bp) return;

  var bid = bp.bids.find(function(b) { return b.sub_id === currentUser.sub_id; });
  if (!bid) return;
  if (!bid.estimates) bid.estimates = [];

  var file = fileInput.files[0];
  var reader = new FileReader();
  reader.onload = function(e) {
    bid.estimates.push({
      id: 'best-' + Date.now(),
      version: bid.estimates.length + 1,
      name: file.name,
      submitted_at: new Date().toISOString().split('T')[0],
      fileData: e.target.result,
      fileType: file.type,
      approved: false,
    });
    renderBidPortal();
  };
  reader.readAsDataURL(file);
}

// Admin: view all estimate versions for a sub's bid
function viewSubEstimates(projectId, bpId, subId) {
  var pkgs = DEMO_BID_PACKAGES[projectId] || [];
  var bp = pkgs.find(function(b) { return b.id === bpId; });
  if (!bp) return;
  var bid = bp.bids.find(function(b) { return b.sub_id === subId; });
  if (!bid) return;
  var sub = DEMO_SUBS.find(function(s) { return s.id === subId; });
  var ests = bid.estimates || [];
  var latestEst = ests.length > 0 ? ests[ests.length - 1] : null;

  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'sub-est-modal';

  var html = '<div class="modal-card" style="max-width:600px;">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">';
  html += '<div><h3>' + (sub ? sub.company : '—') + ' — Estimates</h3>';
  html += '<div class="text-muted" style="font-size:12px;">' + bp.trade + ' · ' + formatCAD(bid.amount) + '</div></div>';
  html += '<button class="btn-icon" onclick="document.getElementById(\'sub-est-modal\').remove()" style="color:var(--text-muted);font-size:18px;"><i class="fas fa-times"></i></button>';
  html += '</div>';

  if (ests.length === 0) {
    html += '<div class="text-muted" style="text-align:center;padding:24px;">No estimate documents uploaded by this subcontractor.</div>';
  } else {
    // Latest estimate highlighted
    html += '<div style="font-size:12px;font-weight:600;margin-bottom:8px;">Latest Estimate (V' + latestEst.version + ')</div>';
    html += '<div style="border:2px solid var(--navy);border-radius:var(--radius);padding:14px;margin-bottom:16px;background:var(--page-bg);">';
    html += '<div style="display:flex;align-items:center;gap:10px;">';
    html += '<i class="fas fa-file-pdf" style="color:var(--red);font-size:20px;"></i>';
    html += '<div style="flex:1;"><div style="font-size:13px;font-weight:600;">' + latestEst.name + '</div>';
    html += '<div class="text-muted" style="font-size:11px;">Version ' + latestEst.version + ' · Submitted ' + latestEst.submitted_at + '</div></div>';
    if (latestEst.fileData) {
      html += '<button class="btn btn-outline btn-sm" onclick="previewEstimateFile(\'' + latestEst.id + '\',\'' + projectId + '\',\'' + bpId + '\',\'' + subId + '\')"><i class="fas fa-eye"></i></button>';
      html += '<button class="btn btn-outline btn-sm" onclick="downloadEstimateFile(\'' + latestEst.id + '\',\'' + projectId + '\',\'' + bpId + '\',\'' + subId + '\')"><i class="fas fa-download"></i></button>';
    }
    html += '</div>';

    if (latestEst.approved) {
      html += '<div style="margin-top:10px;padding:8px 12px;background:var(--green-bg);border:1px solid rgba(34,197,94,0.2);border-radius:var(--radius);display:flex;align-items:center;gap:8px;">';
      html += '<i class="fas fa-stamp" style="color:var(--green);"></i>';
      html += '<span style="font-size:12px;font-weight:600;color:var(--green);">Approved by ' + latestEst.approved_by + ' on ' + latestEst.approved_at + '</span>';
      html += '</div>';
    } else if (!ests.find(function(e) { return e.approved; })) {
      html += '<div style="margin-top:10px;display:flex;gap:8px;">';
      html += '<button class="btn btn-accent btn-full" onclick="approveSubEstimate(\'' + projectId + '\',\'' + bpId + '\',\'' + subId + '\',\'' + latestEst.id + '\')"><i class="fas fa-stamp"></i> Approve This Estimate</button>';
      html += '</div>';
    }
    html += '</div>';

    // Previous versions
    if (ests.length > 1) {
      html += '<div style="font-size:12px;font-weight:600;margin-bottom:8px;color:var(--text-muted);">Previous Versions</div>';
      ests.slice(0, -1).reverse().forEach(function(est) {
        html += '<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid var(--card-border);border-radius:var(--radius);margin-bottom:6px;opacity:0.7;">';
        html += '<i class="fas fa-file-pdf" style="color:var(--text-muted);"></i>';
        html += '<div style="flex:1;"><div style="font-size:12px;">' + est.name + '</div>';
        html += '<div class="text-muted" style="font-size:11px;">V' + est.version + ' · ' + est.submitted_at + '</div></div>';
        if (est.fileData) {
          html += '<button class="btn btn-outline btn-sm" onclick="previewEstimateFile(\'' + est.id + '\',\'' + projectId + '\',\'' + bpId + '\',\'' + subId + '\')"><i class="fas fa-eye"></i></button>';
          html += '<button class="btn btn-outline btn-sm" onclick="downloadEstimateFile(\'' + est.id + '\',\'' + projectId + '\',\'' + bpId + '\',\'' + subId + '\')"><i class="fas fa-download"></i></button>';
        }
        if (est.approved) {
          html += '<i class="fas fa-check-circle" style="color:var(--green);" title="Approved"></i>';
        }
        html += '</div>';
      });
    }
  }

  html += '</div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);
}

function previewEstimateFile(estId, projectId, bpId, subId) {
  var est = findEstimate(estId, projectId, bpId, subId);
  if (!est || !est.fileData) return;

  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'est-preview-modal';
  var content = '';
  if (est.fileType && est.fileType.startsWith('image/')) {
    content = '<img src="' + est.fileData + '" style="max-width:100%;max-height:70vh;object-fit:contain;border-radius:var(--radius);">';
  } else if (est.fileType === 'application/pdf') {
    content = '<iframe src="' + est.fileData + '" style="width:100%;height:70vh;border:1px solid var(--card-border);border-radius:var(--radius);"></iframe>';
  } else {
    content = '<div class="text-muted" style="text-align:center;padding:40px;">Preview not available. Click Download.</div>';
  }
  overlay.innerHTML = '<div class="modal-card" style="max-width:800px;max-height:90vh;overflow:auto;">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
      '<h3>' + est.name + '</h3>' +
      '<button class="btn-icon" onclick="document.getElementById(\'est-preview-modal\').remove()" style="color:var(--text-muted);font-size:18px;"><i class="fas fa-times"></i></button>' +
    '</div>' + content +
    '<div style="display:flex;gap:8px;margin-top:12px;">' +
      '<button class="btn btn-accent btn-full" onclick="downloadEstimateFile(\'' + estId + '\',\'' + projectId + '\',\'' + bpId + '\',\'' + subId + '\')"><i class="fas fa-download"></i> Download</button>' +
      '<button class="btn btn-outline btn-full" onclick="document.getElementById(\'est-preview-modal\').remove()">Close</button>' +
    '</div></div>';
  document.body.appendChild(overlay);
}

function downloadEstimateFile(estId, projectId, bpId, subId) {
  var est = findEstimate(estId, projectId, bpId, subId);
  if (!est || !est.fileData) return;
  var a = document.createElement('a');
  a.href = est.fileData;
  a.download = est.name;
  a.click();
}

function findEstimate(estId, projectId, bpId, subId) {
  var pkgs = DEMO_BID_PACKAGES[projectId] || [];
  var bp = pkgs.find(function(b) { return b.id === bpId; });
  if (!bp) return null;
  var bid = bp.bids.find(function(b) { return b.sub_id === subId; });
  if (!bid || !bid.estimates) return null;
  return bid.estimates.find(function(e) { return e.id === estId; });
}

function approveSubEstimate(projectId, bpId, subId, estId) {
  var est = findEstimate(estId, projectId, bpId, subId);
  if (!est) return;
  var sub = DEMO_SUBS.find(function(s) { return s.id === subId; });
  var pkgs = DEMO_BID_PACKAGES[projectId] || [];
  var bp = pkgs.find(function(b) { return b.id === bpId; });

  if (!confirm('Approve this estimate from ' + (sub ? sub.company : '') + '? This creates a binding record that both parties receive.')) return;

  est.approved = true;
  est.approved_by = currentUser.full_name;
  est.approved_at = new Date().toISOString().split('T')[0];

  // Close and reopen the modal
  document.getElementById('sub-est-modal').remove();
  viewSubEstimates(projectId, bpId, subId);

  // Generate the approved estimate PDF (signed document)
  generateApprovedEstimatePDF(est, sub, bp, projectId);
}

function generateApprovedEstimatePDF(est, sub, bp, projectId) {
  var proj = DEMO_PROJECTS.find(function(p) { return p.id === projectId; });

  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Approved Estimate — ' + (sub ? sub.company : '') + '</title>' +
    '<style>body{font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:#1f2937;margin:0;padding:40px;}' +
    '.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:3px solid #1a2744;}' +
    '.header h1{font-size:22px;font-weight:800;color:#1a2744;margin:0;}.header p{font-size:11px;color:#6b7280;margin:2px 0;}' +
    '.approved{background:#f0fdf4;border:2px solid #22c55e;border-radius:8px;padding:20px;margin-bottom:24px;text-align:center;}' +
    '.approved h2{color:#22c55e;margin:0 0 4px;font-size:18px;}.approved p{font-size:11px;color:#6b7280;margin:2px 0;}' +
    '.info{margin-bottom:20px;font-size:12px;line-height:1.8;}.info strong{color:#1a2744;}' +
    '.audit{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;font-size:11px;line-height:1.8;margin-bottom:20px;}' +
    '.footer{text-align:center;font-size:10px;color:#9ca3af;margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;}' +
    '@media print{body{padding:20px;}}</style></head><body>' +
    '<div class="header"><div><h1>TRIVEX GROUP CORP</h1><p>Commercial Construction · Franchise Fit-Outs</p><p>Burlington, ON</p></div>' +
    '<div style="text-align:right;"><div style="font-size:16px;font-weight:700;color:#22c55e;">APPROVED ESTIMATE</div><p>' + est.approved_at + '</p></div></div>' +
    '<div class="approved"><h2>ESTIMATE APPROVED</h2><p>This document confirms approval of the subcontractor estimate below.</p><p>This record is binding and cannot be altered.</p></div>' +
    '<div class="info">' +
      '<p><strong>Project:</strong> ' + (proj ? proj.name : '') + '</p>' +
      '<p><strong>Trade:</strong> ' + bp.trade + '</p>' +
      '<p><strong>Scope:</strong> ' + bp.scope + '</p>' +
      '<p><strong>Subcontractor:</strong> ' + (sub ? sub.company : '') + ' (' + (sub ? sub.contact + ', ' + sub.phone : '') + ')</p>' +
      '<p><strong>Estimate Document:</strong> ' + est.name + ' (Version ' + est.version + ')</p>' +
      '<p><strong>Submitted:</strong> ' + est.submitted_at + '</p>' +
    '</div>' +
    '<div class="audit"><strong>Approval Record</strong><br>' +
      'Estimate: ' + est.name + '<br>' +
      'Version: ' + est.version + '<br>' +
      'Approved by: ' + est.approved_by + '<br>' +
      'Approved on: ' + est.approved_at + '<br>' +
      'This approval constitutes acceptance of the subcontractor\'s pricing and scope as described in the attached estimate.</div>' +
    '<div class="footer">Trivex Group Corp · Burlington, ON · Generated via XOS · This is a permanent record of estimate approval.</div>' +
    '</body></html>';

  var w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  w.onload = function() { w.print(); };
}

function downloadApprovedEstimate(projectId, bpId, subId) {
  var pkgs = DEMO_BID_PACKAGES[projectId] || [];
  var bp = pkgs.find(function(b) { return b.id === bpId; });
  if (!bp) return;
  var bid = bp.bids.find(function(b) { return b.sub_id === subId; });
  if (!bid) return;
  var sub = DEMO_SUBS.find(function(s) { return s.id === subId; });
  var approved = (bid.estimates || []).find(function(e) { return e.approved; });
  if (approved) {
    generateApprovedEstimatePDF(approved, sub, bp, projectId);
  }
}

// ============================================
// INIT ON LOAD
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  initSupabase();

  // Single login — email determines role
  document.title = 'Trivex Group — Portal';
  document.getElementById('login-password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });
  document.getElementById('login-email').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });

  // Check for existing Supabase session — keeps you logged in on refresh
  if (sbClient) {
    sbClient.auth.getSession().then(({ data: { session } }) => {
      if (session && session.user) {
        sbClient.from('profiles').select('*').eq('id', session.user.id).single().then(({ data: profile }) => {
          if (profile) {
            currentUser = profile;
            enterApp();
          }
        }).catch(err => {
          console.warn('Profile fetch failed:', err);
          // Still try to enter with basic user info
          currentUser = { id: session.user.id, email: session.user.email, full_name: session.user.email.split('@')[0], role: 'admin', avatar_initials: session.user.email.substring(0, 2).toUpperCase() };
          enterApp();
        });
      }
    }).catch(err => {
      console.warn('Session check failed:', err);
    });
  }
});

// ============================================
// APP ENTRY
// ============================================

async function enterApp() {
  // Load all data from Supabase before rendering
  if (typeof loadAllData === 'function' && sbClient) {
    try {
      await loadAllData();
    } catch (err) {
      console.warn('Failed to load Supabase data, using demo data:', err);
    }
  }

  document.getElementById('login-screen').style.display = 'none';
  const portalScreen = document.getElementById('portal-login-screen');
  if (portalScreen) portalScreen.style.display = 'none';
  const bidScreen = document.getElementById('bid-login-screen');
  if (bidScreen) bidScreen.style.display = 'none';
  document.getElementById('app-shell').style.display = 'flex';

  const isClient = currentUser.role === 'client';
  const isSub = currentUser.role === 'sub';

  // Set the project context for clients
  if (isClient) {
    activeProjectId = currentUser.project_id || '1';
    window._portalTab = 'overview';
  }

  // Set user info in sidebar
  document.getElementById('user-avatar').textContent = currentUser.avatar_initials || '??';
  document.getElementById('user-name').textContent = currentUser.full_name;
  document.getElementById('user-role-label').textContent = isClient ? 'Client' : isSub ? 'Subcontractor' : currentUser.role;

  // Build sidebar based on role
  if (isSub) {
    document.getElementById('sidebar').style.display = 'none';
  } else {
    document.getElementById('sidebar').style.display = 'flex';
    if (isClient) {
      buildClientSidebar();
    } else {
      buildSidebar();
    }
  }

  // Show/hide bottom nav
  const bottomNav = document.getElementById('bottom-nav');
  if (bottomNav) bottomNav.style.display = (isClient || isSub) ? 'none' : '';

  // Route to correct default page based on role
  if (isSub) {
    renderBidPortal();
    return;
  } else if (isClient) {
    navigateTo('client-portal');
  } else {
    navigateTo('dashboard');
  }
}

// ============================================
// NAVIGATION
// ============================================

const adminNav = [
  { section: 'Operations' },
  { id: 'dashboard',  icon: 'fas fa-th-large',           label: 'Dashboard' },
  { id: 'projects',   icon: 'fas fa-hard-hat',            label: 'Projects' },
  { id: 'schedule',   icon: 'fas fa-calendar-alt',        label: 'Schedule' },
  { id: 'subcontractors', icon: 'fas fa-hard-hat',       label: 'Subcontractors' },
  { section: 'Finance' },
  { id: 'estimates',  icon: 'fas fa-file-invoice',        label: 'Estimates' },
  { id: 'invoices',   icon: 'fas fa-file-invoice-dollar', label: 'Invoices' },
  { id: 'expenses',   icon: 'fas fa-receipt',             label: 'Expenses' },
  { id: 'finances',   icon: 'fas fa-chart-pie',           label: 'Finances' },
  { section: 'Growth' },
  { id: 'rollout',    icon: 'fas fa-map-marked-alt',      label: 'Rollout' },
  { id: 'pipeline',   icon: 'fas fa-stream',              label: 'Pipeline' },
];

function buildSidebar() {
  const nav = document.getElementById('sidebar-nav');
  const items = adminNav;
  // Update sidebar branding for admin
  document.querySelector('.logo-text-sm').textContent = 'XOS';

  nav.innerHTML = items.map(item => {
    if (item.section) {
      return `<div class="nav-section">${item.section}</div>`;
    }
    // Add unread message badge to Projects nav item
    let badge = item.badge ? `<span class="nav-badge">${item.badge}</span>` : '';
    if (item.id === 'projects') {
      const unread = getUnreadClientMsgCount();
      if (unread > 0) badge = `<span class="nav-badge" style="background:var(--red);">${unread}</span>`;
    }
    return `
      <div class="nav-item ${item.id === currentPage ? 'active' : ''}" onclick="navigateTo('${item.id}')">
        <i class="${item.icon}"></i>
        <span>${item.label}</span>
        ${badge}
      </div>`;
  }).join('');
}

const clientNav = [
  { id: 'p-overview',    icon: 'fas fa-th-large',           label: 'Overview' },
  { id: 'p-milestones',  icon: 'fas fa-tasks',              label: 'Milestones' },
  { id: 'p-changes',     icon: 'fas fa-exchange-alt',       label: 'Change Requests' },
  { id: 'p-invoices',    icon: 'fas fa-file-invoice-dollar', label: 'Invoices' },
  { id: 'p-drawings',    icon: 'fas fa-drafting-compass',   label: 'Drawings' },
  { id: 'p-documents',   icon: 'fas fa-folder-open',        label: 'Documents' },
  { id: 'p-messages',    icon: 'fas fa-comment-dots',       label: 'Messages' },
];

function buildClientSidebar() {
  const nav = document.getElementById('sidebar-nav');
  const tab = window._portalTab || 'overview';
  // Update sidebar branding for client
  document.querySelector('.logo-text-sm').textContent = 'Trivex';

  // Compute action items for badge
  const pid = getPortalProjectId();
  const p = DEMO_PROJECTS.find(proj => proj.id === pid);
  const pendingCOs = (DEMO_CHANGE_ORDERS[pid] || []).filter(c => c.status === 'sent').length;

  nav.innerHTML = clientNav.map(item => {
    let badge = '';
    if (item.id === 'p-changes' && pendingCOs > 0) badge = `<span class="nav-badge" style="background:var(--red);">${pendingCOs}</span>`;
    return `
      <div class="nav-item ${item.id === 'p-' + tab ? 'active' : ''}" onclick="switchPortalTab('${item.id.replace('p-', '')}')">
        <i class="${item.icon}"></i>
        <span>${item.label}</span>
        ${badge}
      </div>`;
  }).join('');
}

function getPortalProjectId() {
  const clientBrand = currentUser.brand || '';
  const brandProjects = clientBrand ? DEMO_PROJECTS.filter(proj => proj.client_brand === clientBrand) : [];
  return window._portalProjectId || currentUser.project_id || (brandProjects[0] && brandProjects[0].id) || '1';
}

function switchPortalTab(tab) {
  window._portalTab = tab;
  buildClientSidebar();
  navigateTo('client-portal');
}

function navigateTo(page) {
  currentPage = page;
  if (currentUser && currentUser.role === 'client') {
    buildClientSidebar();
  } else {
    buildSidebar();
  }

  const content = document.getElementById('page-content');
  const renderer = pageRenderers[page];

  // Update breadcrumb
  const label = page.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  document.getElementById('breadcrumb').textContent = label;

  if (renderer) {
    content.innerHTML = renderer();
  } else {
    content.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-tools"></i>
        <h3>${label}</h3>
        <p>This module is coming soon.</p>
      </div>`;
  }

  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');
  const backdrop = document.querySelector('.sidebar-backdrop');
  if (backdrop) backdrop.classList.remove('show');

  // Update bottom nav active state
  document.querySelectorAll('.bottom-nav-item').forEach(btn => {
    const btnPage = btn.getAttribute('data-page');
    btn.classList.toggle('active', btnPage === page || (btnPage === 'dashboard' && page === 'dashboard'));
  });
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('open');

  let backdrop = document.querySelector('.sidebar-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    backdrop.onclick = () => {
      sidebar.classList.remove('open');
      backdrop.classList.remove('show');
    };
    document.body.appendChild(backdrop);
  }
  backdrop.classList.toggle('show');
}

function toggleMoreMenu() {
  const menu = document.getElementById('more-menu');
  if (menu) {
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
  }
}

// ============================================
// PAGE RENDERERS
// ============================================
const pageRenderers = {};

// ============================================
// ADMIN DASHBOARD
// ============================================
pageRenderers.dashboard = () => {
  // Use customizable widget dashboard
  return renderCustomDashboard();
};

// Legacy dashboard data (kept for reference)
pageRenderers._dashboard_legacy = () => {
  const activeProjects = DEMO_PROJECTS.filter(p => p.status === 'active').length;
  const outstandingInvoices = DEMO_INVOICES.filter(i => i.status !== 'paid').reduce((sum, i) => sum + (i.amount - i.amount_paid), 0);
  const openEstimates = DEMO_ESTIMATES.filter(e => e.status === 'draft' || e.status === 'sent').length;
  // Team on site = field users with active project assignments
  const teamOnSite = 1; // Saud

  return `
    <div class="page-header">
      <div>
        <h1>Dashboard</h1>
        <p class="page-header-sub">Welcome back, ${currentUser.full_name}. Here's your overview.</p>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-outline" onclick="openReceiptCapture()"><i class="fas fa-camera"></i> Capture Receipt</button>
        <button class="btn btn-accent" onclick="navigateTo('projects')"><i class="fas fa-plus"></i> New Project</button>
      </div>
    </div>

    <div class="stats-grid">
      ${statCard('Active Projects', activeProjects, 'fas fa-hard-hat', 'var(--blue)', `${DEMO_PROJECTS.length} total`)}
      ${statCard('Outstanding Invoices', formatCAD(outstandingInvoices), 'fas fa-file-invoice-dollar', 'var(--orange)', `${DEMO_INVOICES.filter(i => i.status !== 'paid').length} unpaid`)}
      ${statCard('Open Estimates', openEstimates, 'fas fa-file-invoice', 'var(--purple)', `${DEMO_ESTIMATES.length} total`)}
      ${statCard('Team On Site', teamOnSite, 'fas fa-users', 'var(--green)', 'Today')}
    </div>

    <div class="grid-2 mb-24">
      <div class="data-table-container">
        <div class="data-table-header">
          <span class="data-table-title">Active Projects</span>
          <button class="btn btn-outline btn-sm" onclick="navigateTo('projects')">View all</button>
        </div>
        <table class="data-table">
          <thead><tr><th>Project</th><th>Client</th><th>Status</th><th>Progress</th></tr></thead>
          <tbody>
            ${DEMO_PROJECTS.filter(p => p.status !== 'complete').slice(0, 5).map(p => projectRow(p)).join('')}
          </tbody>
        </table>
      </div>

      <div>
        <div class="data-table-container" style="margin-bottom:16px;">
          <div class="data-table-header">
            <span class="data-table-title">Outstanding Invoices</span>
            <button class="btn btn-outline btn-sm" onclick="navigateTo('invoices')">View all</button>
          </div>
          <table class="data-table">
            <thead><tr><th>Invoice</th><th>Amount</th><th>Balance</th><th>Status</th></tr></thead>
            <tbody>
              ${DEMO_INVOICES.filter(i => i.status !== 'paid').map(i => `
                <tr>
                  <td><strong>${i.invoice_number}</strong></td>
                  <td>${formatCAD(i.amount)}</td>
                  <td style="font-weight:600;color:var(--red);">${formatCAD(i.amount - i.amount_paid)}</td>
                  <td><span class="status-badge status-${i.status}">${i.status.replace('_', ' ')}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="data-table-container" style="padding:20px;">
          <span class="data-table-title" style="display:block;margin-bottom:12px;">Recent Activity</span>
          <ul class="activity-list">
            ${activityItem('var(--green)', 'Saud submitted receipt — Home Depot $2,340.50', '2 hours ago')}
            ${activityItem('var(--blue)', 'Invoice INV-2026-002 partially paid — $80,000', '5 hours ago')}
            ${activityItem('var(--orange)', 'Popeyes Scarborough moved to Punch List', 'Yesterday')}
            ${activityItem('var(--purple)', 'New estimate created — Jersey Mikes Oakville', '2 days ago')}
          </ul>
        </div>
      </div>
    </div>
  `;
};

// ============================================
// FIELD DASHBOARD (Saud)
// ============================================
pageRenderers['field-dashboard'] = () => {
  const myProjects = DEMO_PROJECTS.filter(p => p.assigned && p.assigned.includes(currentUser.email));
  const myExpenses = DEMO_EXPENSES.filter(e => e.submitted_by === currentUser.email);
  const totalExpenses = myExpenses.reduce((sum, e) => sum + e.amount, 0);

  return `
    <div class="page-header">
      <div>
        <h1>Hey ${currentUser.full_name}</h1>
        <p class="page-header-sub">Here's what's on your plate today.</p>
      </div>
    </div>

    <!-- RECEIPT CAPTURE — FRONT AND CENTER -->
    <div style="margin-bottom:24px;">
      <button class="receipt-capture-btn" onclick="openReceiptCapture()">
        <i class="fas fa-camera"></i>
        Capture Receipt
      </button>
    </div>

    <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr);">
      ${statCard('My Projects', myProjects.length, 'fas fa-hard-hat', 'var(--blue)', 'Active assignments')}
      ${statCard('Receipts Submitted', myExpenses.length, 'fas fa-receipt', 'var(--orange)', 'This month')}
      ${statCard('Total Expenses', formatCAD(totalExpenses), 'fas fa-dollar-sign', 'var(--green)', 'All projects')}
    </div>

    <div class="section-title">My Active Projects</div>
    <div class="cards-grid" style="grid-template-columns: 1fr;">
      ${myProjects.map(p => `
        <div class="card" onclick="viewProject('${p.id}')" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
          <div>
            <div style="font-size:15px;font-weight:700;margin-bottom:4px;">${p.name}</div>
            <div class="text-muted" style="font-size:13px;">${p.client_brand} &middot; ${p.city}</div>
          </div>
          <div style="display:flex;align-items:center;gap:16px;">
            <span class="status-badge status-${p.status}">${formatStatus(p.status)}</span>
            <div style="display:flex;align-items:center;gap:8px;min-width:120px;">
              <div class="progress-bar" style="flex:1;"><div class="progress-fill" style="width:${p.completion_pct}%;background:var(--orange);"></div></div>
              <span style="font-size:13px;font-weight:600;">${p.completion_pct}%</span>
            </div>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="section-title" style="margin-top:24px;">Recent Receipts</div>
    <div class="data-table-container">
      <table class="data-table">
        <thead><tr><th>Vendor</th><th>Amount</th><th>Category</th><th>Date</th><th>Project</th></tr></thead>
        <tbody>
          ${myExpenses.map(e => {
            const proj = DEMO_PROJECTS.find(p => p.id === e.project_id);
            return `<tr>
              <td><strong>${e.vendor}</strong></td>
              <td>${formatCAD(e.amount)}</td>
              <td><span class="tag">${e.category}</span></td>
              <td>${e.expense_date}</td>
              <td class="text-muted">${proj ? proj.name : '—'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
};

// ============================================
// FIELD — MY PROJECTS
// ============================================
pageRenderers['field-projects'] = () => {
  const myProjects = DEMO_PROJECTS.filter(p => p.assigned && p.assigned.includes(currentUser.email));

  return `
    <div class="page-header">
      <div>
        <h1>My Projects</h1>
        <p class="page-header-sub">${myProjects.length} assigned projects</p>
      </div>
    </div>

    <div class="cards-grid">
      ${myProjects.map(p => projectCardHTML(p)).join('')}
    </div>
  `;
};

// ============================================
// PROJECTS LIST (Admin)
// ============================================
pageRenderers.projects = () => {
  const projectFilter = window._projectFilter || 'active';
  const active = DEMO_PROJECTS.filter(p => p.status !== 'archived' && p.status !== 'lost');
  const archived = DEMO_PROJECTS.filter(p => p.status === 'archived');
  const lost = DEMO_PROJECTS.filter(p => p.status === 'lost');
  const complete = DEMO_PROJECTS.filter(p => p.status === 'complete');
  const showing = projectFilter === 'active' ? active :
                  projectFilter === 'archived' ? archived :
                  projectFilter === 'lost' ? lost :
                  projectFilter === 'complete' ? complete : DEMO_PROJECTS;

  return `
    <div class="page-header">
      <div>
        <h1>Projects</h1>
        <p class="page-header-sub">${active.length} active · ${complete.length} complete · ${archived.length} archived · ${lost.length} lost</p>
      </div>
      <button class="btn btn-accent"><i class="fas fa-plus"></i> New Project</button>
    </div>

    <div style="display:flex;gap:6px;margin-bottom:20px;">
      ${['active', 'complete', 'archived', 'lost', 'all'].map(f => {
        const counts = { active: active.length, complete: complete.length, archived: archived.length, lost: lost.length, all: DEMO_PROJECTS.length };
        return `<button class="btn ${projectFilter === f ? 'btn-accent' : 'btn-outline'} btn-sm" onclick="window._projectFilter='${f}'; navigateTo('projects');">${formatStatus(f)} (${counts[f]})</button>`;
      }).join('')}
    </div>

    <div class="cards-grid">
      ${showing.map(p => projectCardHTML(p)).join('')}
    </div>

    ${showing.length === 0 ? '<div class="empty-state"><i class="fas fa-folder-open"></i><h3>No projects in this category</h3></div>' : ''}
  `;
};

// ============================================
// PROJECT DETAIL — Full tabbed view
// ============================================
function viewProject(projectId) {
  activeProjectId = projectId;
  activeProjectTab = 'overview';
  navigateTo('project-detail');
}

function switchProjectTab(tab) {
  activeProjectTab = tab;
  const content = document.getElementById('page-content');
  content.innerHTML = pageRenderers['project-detail']();
}

pageRenderers['project-detail'] = () => {
  const p = DEMO_PROJECTS.find(proj => proj.id === activeProjectId) || DEMO_PROJECTS[0];
  const milestones = DEMO_MILESTONES[p.id] || [];
  const projectExpenses = DEMO_EXPENSES.filter(e => e.project_id === p.id);
  const projectInvoices = DEMO_INVOICES.filter(i => i.project_id === p.id);
  const notes = DEMO_NOTES[p.id] || [];
  const changeOrders = DEMO_CHANGE_ORDERS[p.id] || [];
  const totalExpenses = projectExpenses.reduce((s, e) => s + e.amount, 0);
  const totalInvoiced = projectInvoices.reduce((s, i) => s + i.amount, 0);
  const totalCollected = projectInvoices.reduce((s, i) => s + i.amount_paid, 0);
  const approvedCOTotal = getApprovedCOTotal(p.id);
  const revisedBudget = (p.budget || 0) + approvedCOTotal;
  const tab = activeProjectTab;
  const backPage = 'projects';

  let tabContent = '';

  // ---- OVERVIEW TAB ----
  if (tab === 'overview') {
    tabContent = `
      <div class="stats-grid" style="grid-template-columns:repeat(4,1fr);">
        <div onclick="switchProjectTab('change_orders')" style="cursor:pointer;">${statCard('Budget', formatCAD(revisedBudget), 'fas fa-dollar-sign', 'var(--green)', approvedCOTotal !== 0 ? 'Orig ' + formatCAD(p.budget) + ' + COs ' + formatCAD(approvedCOTotal) : 'Allocated')}</div>
        <div onclick="switchProjectTab('milestones')" style="cursor:pointer;">${statCard('Construction', p.completion_pct + '%', 'fas fa-chart-line', 'var(--blue)', milestones.filter(m => m.status === 'complete').length + ' of ' + milestones.length + ' milestones')}</div>
        <div onclick="navigateTo('invoices')" style="cursor:pointer;">${statCard('Invoiced', formatCAD(totalInvoiced), 'fas fa-file-invoice-dollar', 'var(--orange)', formatCAD(totalCollected) + ' collected')}</div>
        <div onclick="switchProjectTab('expenses')" style="cursor:pointer;">${statCard('Expenses', formatCAD(totalExpenses), 'fas fa-receipt', 'var(--red)', projectExpenses.length + ' receipts')}</div>
      </div>

      <div class="stat-card mb-20" style="cursor:pointer;" onclick="switchProjectTab('milestones')">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span class="section-title" style="margin:0;">Construction Progress</span>
          <span style="font-size:14px;font-weight:700;">${p.completion_pct}%</span>
        </div>
        <div class="progress-bar" style="height:10px;">
          <div class="progress-fill" style="width:${p.completion_pct}%;background:var(--orange);border-radius:5px;"></div>
        </div>
        ${(() => {
          const ddPct = getDDCompletion(p.id);
          if (ddPct === null) return '';
          return `
          <div style="display:flex;justify-content:space-between;margin-top:12px;margin-bottom:6px;">
            <span style="font-size:13px;font-weight:500;color:var(--text-muted);">Pre-Lease Due Diligence</span>
            <span style="font-size:13px;font-weight:600;color:${ddPct === 100 ? 'var(--green)' : 'var(--orange)'};">${ddPct}%</span>
          </div>
          <div class="progress-bar" style="height:8px;">
            <div class="progress-fill" style="width:${ddPct}%;background:${ddPct === 100 ? 'var(--green)' : 'var(--blue)'};border-radius:4px;"></div>
          </div>`;
        })()}
      </div>

      <!-- Milestone timeline visual -->
      <div class="stat-card mb-20">
        <div class="section-title" style="margin-bottom:16px;">Construction Timeline</div>
        <div style="display:flex;gap:4px;align-items:center;margin-bottom:12px;">
          ${milestones.map((m, i) => {
            const color = m.status === 'complete' ? 'var(--green)' : m.status === 'in_progress' ? 'var(--orange)' : 'var(--card-border)';
            return `<div style="flex:1;height:8px;border-radius:4px;background:${color};" title="${m.name} — ${formatStatus(m.status)}"></div>`;
          }).join('')}
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);">
          <span>${milestones[0]?.name || ''}</span>
          <span>${milestones[milestones.length - 1]?.name || ''}</span>
        </div>
      </div>

      <div class="grid-2">
        <div class="stat-card">
          <div class="section-title" style="margin-bottom:12px;">Project Info</div>
          <div style="font-size:13px;">
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--card-border);"><span class="text-muted">Client</span><span style="font-weight:600;">${p.client_brand}</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--card-border);"><span class="text-muted">Location</span><span style="font-weight:600;">${p.city}</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--card-border);"><span class="text-muted">Status</span><span class="status-badge status-${p.status}">${formatStatus(p.status)}</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--card-border);"><span class="text-muted">Target Handover</span><span style="font-weight:600;">${p.target_handover}</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;"><span class="text-muted">Team</span><span style="font-weight:600;">${p.assigned.map(a => DEMO_USERS[a]?.full_name || a).join(', ') || 'Unassigned'}</span></div>
          </div>
        </div>

        <div class="stat-card">
          <div class="section-title" style="margin-bottom:12px;">Recent Activity</div>
          <ul class="activity-list">
            ${milestones.filter(m => m.status === 'complete').slice(-3).reverse().map(m =>
              `<li class="activity-item">
                <div class="activity-dot" style="background:var(--green);"></div>
                <div><div style="font-size:13px;">${m.name} completed</div><div class="activity-time">${m.completed_date}</div></div>
              </li>`
            ).join('')}
            ${notes.slice(0, 2).map(n =>
              `<li class="activity-item">
                <div class="activity-dot" style="background:var(--blue);"></div>
                <div><div style="font-size:13px;">${n.text.substring(0, 60)}...</div><div class="activity-time">${n.date}</div></div>
              </li>`
            ).join('')}
          </ul>
        </div>
      </div>

      <!-- Payment Milestones on Overview -->
      ${projectInvoices.length > 0 ? `
      <div class="stat-card" style="margin-top:20px;">
        <div class="section-title" style="margin-bottom:12px;"><i class="fas fa-dollar-sign" style="color:var(--green);margin-right:6px;"></i>Payment Schedule</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${projectInvoices.map(inv => {
            const balance = inv.amount - inv.amount_paid;
            const stageLabel = (inv.stage || 'invoice').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            const isPaid = inv.status === 'paid';
            return `
            <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:var(--radius);border:1px solid ${isPaid ? 'rgba(34,197,94,0.2)' : 'var(--card-border)'};background:${isPaid ? 'var(--green-bg)' : 'transparent'};cursor:pointer;" onclick="viewInvoice('${inv.id}')">
              <i class="${isPaid ? 'fas fa-check-circle' : 'far fa-circle'}" style="color:${isPaid ? 'var(--green)' : 'var(--text-light)'};font-size:16px;flex-shrink:0;"></i>
              <div style="flex:1;min-width:0;">
                <div style="font-size:13px;font-weight:600;">${inv.invoice_number} — ${stageLabel}</div>
                <div style="font-size:12px;color:var(--text-muted);">Due: ${inv.due_date}${(inv.payments || []).length > 0 ? ` · Paid: ${inv.payments.map(p => p.date).join(', ')}` : ''}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:13px;font-weight:600;">${formatCAD(inv.amount)}</div>
                ${balance > 0 ? `<div style="font-size:11px;color:var(--red);">${formatCAD(balance)} owing</div>` : ''}
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>` : ''}
    `;
  }

  // ---- MILESTONES TAB ----
  if (tab === 'milestones') {
    const isAdmin = currentUser.role === 'admin';
    tabContent = `
      <div class="stat-card mb-20">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px;">
          <div class="section-title" style="margin:0;">Construction Milestones</div>
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="font-size:13px;color:var(--text-muted);">
              <span style="color:var(--green);font-weight:600;">${milestones.filter(m => m.status === 'complete').length}</span> complete &middot;
              <span style="color:var(--orange);font-weight:600;">${milestones.filter(m => m.status === 'in_progress').length}</span> in progress &middot;
              <span>${milestones.filter(m => m.status === 'pending').length}</span> pending
            </div>
            ${isAdmin ? `<button class="btn btn-accent btn-sm" onclick="addMilestone('${p.id}')"><i class="fas fa-plus"></i> Add Milestone</button>` : ''}
            <button class="btn btn-outline btn-sm" onclick="openSitePhotoCapture('${p.id}')" style="background:var(--orange);color:#fff;border-color:var(--orange);"><i class="fas fa-camera"></i> Site Photo</button>
          </div>
        </div>

        ${milestones.map((m, i) => {
          const icon = m.status === 'complete' ? 'fas fa-check-circle' : m.status === 'in_progress' ? 'fas fa-spinner fa-spin' : 'far fa-circle';
          const iconColor = m.status === 'complete' ? 'var(--green)' : m.status === 'in_progress' ? 'var(--orange)' : 'var(--text-light)';
          const lineColor = m.status === 'complete' ? 'var(--green)' : 'var(--card-border)';
          const isLast = i === milestones.length - 1;

          return `
            <div style="display:flex;gap:16px;position:relative;" id="milestone-${i}">
              <!-- Timeline line -->
              <div style="display:flex;flex-direction:column;align-items:center;width:24px;flex-shrink:0;">
                <i class="${icon}" style="color:${iconColor};font-size:18px;z-index:1;background:var(--card-bg);padding:2px 0;cursor:${isAdmin ? 'pointer' : 'default'};" ${isAdmin ? `onclick="cycleMilestoneStatus('${p.id}',${i})" title="Click to change status"` : ''}></i>
                ${!isLast ? `<div style="width:2px;flex:1;background:${lineColor};margin:4px 0;"></div>` : ''}
              </div>

              <!-- Content -->
              <div style="flex:1;padding-bottom:${isLast ? '0' : '16px'};">
                ${isAdmin ? `
                <div style="display:flex;gap:8px;align-items:flex-start;margin-bottom:6px;flex-wrap:wrap;">
                  <input class="form-input-styled" value="${m.name}" onchange="updateMilestoneField('${p.id}',${i},'name',this.value)" style="flex:1;min-width:180px;padding:6px 10px;font-size:13px;font-weight:600;">
                  <select class="form-input-styled" onchange="updateMilestoneField('${p.id}',${i},'status',this.value); recalcProjectCompletion('${p.id}'); switchProjectTab('milestones');" style="width:120px;padding:6px 8px;font-size:12px;">
                    <option value="pending" ${m.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="in_progress" ${m.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                    <option value="complete" ${m.status === 'complete' ? 'selected' : ''}>Complete</option>
                  </select>
                  <button class="btn-icon" onclick="removeMilestone('${p.id}',${i})" title="Remove milestone" style="color:var(--red);"><i class="fas fa-trash" style="font-size:12px;"></i></button>
                </div>
                <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                  <div style="display:flex;align-items:center;gap:4px;font-size:12px;">
                    <span class="text-muted">Target:</span>
                    <input type="date" class="form-input-styled" value="${m.target_date || ''}" onchange="updateMilestoneField('${p.id}',${i},'target_date',this.value)" style="padding:4px 8px;font-size:12px;width:140px;">
                  </div>
                  <div style="display:flex;align-items:center;gap:4px;font-size:12px;">
                    <span class="text-muted">Completed:</span>
                    <input type="date" class="form-input-styled" value="${m.completed_date || ''}" onchange="updateMilestoneField('${p.id}',${i},'completed_date',this.value)" style="padding:4px 8px;font-size:12px;width:140px;">
                  </div>
                </div>
                <div style="margin-top:6px;">
                  <input class="form-input-styled" value="${m.notes || ''}" placeholder="Notes..." onchange="updateMilestoneField('${p.id}',${i},'notes',this.value)" style="padding:4px 10px;font-size:12px;width:100%;">
                </div>
                <!-- Site photos for this milestone -->
                <div style="margin-top:8px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                  ${(() => {
                    const photos = (DEMO_SITE_PHOTOS[p.id] || {})[m.id] || [];
                    return photos.map(ph => `<img src="${ph.url}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;border:1px solid var(--card-border);cursor:pointer;" onclick="viewSitePhoto('${ph.url}','${ph.caption || ''}','${ph.uploaded_by}','${ph.date}')" title="${ph.caption || ''}">`).join('') +
                    `<label style="width:48px;height:48px;border:2px dashed rgba(200,215,240,0.5);border-radius:6px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text-light);font-size:16px;" title="Add photo">
                      <i class="fas fa-camera"></i>
                      <input type="file" accept="image/*" capture="environment" style="display:none;" onchange="uploadSitePhoto(this,'${p.id}','${m.id}')">
                    </label>`;
                  })()}
                </div>
                ` : `
                <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
                  <div>
                    <div style="font-size:14px;font-weight:600;${m.status === 'pending' ? 'color:var(--text-muted);' : ''}">${i + 1}. ${m.name}</div>
                    ${m.notes ? `<div class="text-muted" style="font-size:12px;margin-top:2px;">${m.notes}</div>` : ''}
                  </div>
                  <div style="display:flex;align-items:center;gap:12px;font-size:12px;">
                    <div><span class="text-muted">Target:</span> <span style="font-weight:500;">${m.target_date}</span></div>
                    ${m.completed_date ? `<div><span class="text-muted">Done:</span> <span style="font-weight:500;color:var(--green);">${m.completed_date}</span></div>` : ''}
                    <span class="status-badge status-${m.status}">${formatStatus(m.status)}</span>
                  </div>
                </div>
                `}
              </div>
            </div>`;
        }).join('')}
        ${milestones.length === 0 ? `<div class="text-muted" style="text-align:center;padding:24px;">No milestones. ${isAdmin ? 'Click "Add Milestone" to create one.' : ''}</div>` : ''}
      </div>

      <!-- Payment Milestones -->
      <div class="stat-card">
        <div class="section-title" style="margin-bottom:16px;"><i class="fas fa-dollar-sign" style="color:var(--green);margin-right:6px;"></i>Payment Milestones</div>
        ${projectInvoices.length > 0 ? `
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${projectInvoices.map(inv => {
            const balance = inv.amount - inv.amount_paid;
            const stageLabel = (inv.stage || 'invoice').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            const stageIcon = inv.status === 'paid' ? 'fas fa-check-circle' : inv.status === 'partially_paid' ? 'fas fa-clock' : 'far fa-circle';
            const stageColor = inv.status === 'paid' ? 'var(--green)' : inv.status === 'partially_paid' ? 'var(--orange)' : 'var(--text-light)';
            return `
            <div style="border:1px solid var(--card-border);border-radius:var(--radius);padding:14px;${inv.status === 'paid' ? 'background:var(--green-bg);border-color:rgba(34,197,94,0.2);' : ''}">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <div style="display:flex;align-items:center;gap:8px;">
                  <i class="${stageIcon}" style="color:${stageColor};font-size:16px;"></i>
                  <div>
                    <span style="font-size:13px;font-weight:600;">${inv.invoice_number}</span>
                    <span class="tag" style="margin-left:8px;">${stageLabel}</span>
                  </div>
                </div>
                <span class="status-badge status-${inv.status}">${formatStatus(inv.status)}</span>
              </div>
              <div style="display:flex;gap:20px;font-size:12px;flex-wrap:wrap;">
                <div><span class="text-muted">Amount:</span> <strong>${formatCAD(inv.amount)}</strong></div>
                <div><span class="text-muted">Paid:</span> <strong style="color:var(--green);">${formatCAD(inv.amount_paid)}</strong></div>
                ${balance > 0 ? `<div><span class="text-muted">Balance:</span> <strong style="color:var(--red);">${formatCAD(balance)}</strong></div>` : ''}
                <div><span class="text-muted">Issued:</span> ${inv.issue_date || '—'}</div>
                <div><span class="text-muted">Due:</span> ${inv.due_date}</div>
              </div>
              ${(inv.payments || []).length > 0 ? `
              <div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(0,0,0,0.06);">
                ${inv.payments.map(pay => `
                  <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--green);">
                    <i class="fas fa-arrow-right" style="font-size:10px;"></i>
                    <span>${formatCAD(pay.amount)} received on ${pay.date}</span>
                    ${pay.method ? `<span class="tag">${pay.method}</span>` : ''}
                  </div>
                `).join('')}
              </div>` : ''}
            </div>`;
          }).join('')}
        </div>
        ` : '<div class="text-muted" style="text-align:center;padding:20px;font-size:13px;">No invoices yet for this project.</div>'}
      </div>
    `;
  }

  // ---- DUE DILIGENCE TAB ----
  if (tab === 'due_diligence') {
    // Init checklist if not exists
    if (!DEMO_DD_CHECKLISTS[p.id]) DEMO_DD_CHECKLISTS[p.id] = generateDDChecklist();
    const checklist = DEMO_DD_CHECKLISTS[p.id];
    const ddPct = getDDCompletion(p.id);
    let totalItems = 0, confirmedItems = 0, naItems = 0;
    Object.values(checklist).forEach(items => {
      items.forEach(item => { totalItems++; if (item.status === 'confirmed') confirmedItems++; if (item.status === 'na') naItems++; });
    });

    tabContent = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:8px;">
        <div>
          <div class="section-title" style="margin:0;">Pre-Lease Due Diligence</div>
          <div class="text-muted" style="font-size:12px;margin-top:2px;">${confirmedItems} confirmed, ${naItems} N/A, ${totalItems - confirmedItems - naItems} pending of ${totalItems} items</div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="display:flex;align-items:center;gap:8px;min-width:140px;">
            <div class="progress-bar" style="flex:1;height:8px;"><div class="progress-fill" style="width:${ddPct}%;background:${ddPct === 100 ? 'var(--green)' : 'var(--blue)'};border-radius:4px;"></div></div>
            <span style="font-size:14px;font-weight:700;color:${ddPct === 100 ? 'var(--green)' : 'var(--navy)'};">${ddPct}%</span>
          </div>
          <button class="btn btn-navy btn-sm" onclick="exportDDPDF('${p.id}')"><i class="fas fa-file-pdf"></i> Export PDF</button>
        </div>
      </div>

      ${Object.entries(checklist).map(([category, items]) => {
        const catDone = items.filter(i => i.status === 'confirmed' || i.status === 'na').length;
        const catIcon = {
          'Utilities': 'fas fa-bolt',
          'HVAC': 'fas fa-wind',
          'Structural': 'fas fa-building',
          'Fire & Life Safety': 'fas fa-fire-extinguisher',
          'Permits': 'fas fa-stamp',
        }[category] || 'fas fa-clipboard';

        return `
        <div class="stat-card mb-20">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <i class="${catIcon}" style="color:var(--orange);font-size:15px;width:20px;text-align:center;"></i>
              <span class="section-title" style="margin:0;">${category}</span>
            </div>
            <span class="text-muted" style="font-size:12px;">${catDone}/${items.length} complete</span>
          </div>

          <div style="display:flex;flex-direction:column;gap:10px;">
            ${items.map((item, idx) => {
              const statusIcon = item.status === 'confirmed' ? 'fas fa-check-circle'
                : item.status === 'na' ? 'fas fa-minus-circle' : 'far fa-circle';
              const statusColor = item.status === 'confirmed' ? 'var(--green)'
                : item.status === 'na' ? 'var(--text-muted)' : 'var(--text-light)';
              const bgColor = item.status === 'confirmed' ? 'var(--green-bg)'
                : item.status === 'na' ? 'var(--page-bg)' : 'transparent';

              return `
              <div style="display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border-radius:var(--radius);border:1px solid var(--card-border);background:${bgColor};">
                <div style="display:flex;flex-direction:column;align-items:center;padding-top:2px;">
                  <i class="${statusIcon}" style="color:${statusColor};font-size:16px;cursor:pointer;" onclick="cycleDDStatus('${p.id}','${category}',${idx})" title="Click to change status"></i>
                </div>
                <div style="flex:1;min-width:0;">
                  <div style="font-size:13px;font-weight:500;${item.status === 'na' ? 'text-decoration:line-through;color:var(--text-muted);' : ''}">${item.name}</div>
                  <div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap;">
                    <select class="form-input-styled" onchange="updateDDField('${p.id}','${category}',${idx},'assigned_to',this.value)" style="padding:3px 8px;font-size:11px;min-height:28px;width:110px;">
                      <option value="">Assign to...</option>
                      ${DD_ASSIGNEES.map(a => `<option ${a === item.assigned_to ? 'selected' : ''}>${a}</option>`).join('')}
                    </select>
                    <input class="form-input-styled" value="${item.notes}" placeholder="Notes..." onchange="updateDDField('${p.id}','${category}',${idx},'notes',this.value)" style="padding:3px 8px;font-size:11px;min-height:28px;flex:1;min-width:120px;">
                  </div>
                </div>
                <div style="flex-shrink:0;">
                  <select class="form-input-styled" onchange="updateDDField('${p.id}','${category}',${idx},'status',this.value); switchProjectTab('due_diligence');" style="padding:3px 8px;font-size:11px;min-height:28px;width:110px;">
                    <option value="not_confirmed" ${item.status === 'not_confirmed' ? 'selected' : ''}>Not Confirmed</option>
                    <option value="confirmed" ${item.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option value="na" ${item.status === 'na' ? 'selected' : ''}>N/A</option>
                  </select>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>`;
      }).join('')}
    `;
  }

  // ---- EXPENSES TAB ----
  if (tab === 'expenses') {
    const byCategory = {};
    projectExpenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });

    tabContent = `
      <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
        ${statCard('Total Expenses', formatCAD(totalExpenses), 'fas fa-receipt', 'var(--red)', projectExpenses.length + ' receipts')}
        ${statCard('Revised Budget', formatCAD(revisedBudget), 'fas fa-dollar-sign', 'var(--green)', approvedCOTotal !== 0 ? 'Incl. ' + formatCAD(approvedCOTotal) + ' COs' : 'Allocated')}
        ${statCard('Remaining', formatCAD(revisedBudget - totalExpenses), 'fas fa-piggy-bank', revisedBudget - totalExpenses >= 0 ? 'var(--green)' : 'var(--red)', Math.round(totalExpenses / revisedBudget * 100) + '% used')}
      </div>

      ${Object.keys(byCategory).length > 0 ? `
      <div class="stat-card mb-20">
        <div class="section-title" style="margin-bottom:12px;">By Category</div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => `
            <div>
              <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
                <span>${cat}</span>
                <span style="font-weight:600;">${formatCAD(amt)}</span>
              </div>
              <div class="progress-bar"><div class="progress-fill" style="width:${Math.round(amt / totalExpenses * 100)}%;background:var(--orange);"></div></div>
            </div>
          `).join('')}
        </div>
      </div>` : ''}

      <div class="data-table-container">
        <div class="data-table-header">
          <span class="data-table-title">All Receipts</span>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-outline btn-sm" onclick="exportExpensesCSV('${p.id}')"><i class="fas fa-download"></i> Export CSV</button>
            <button class="btn btn-accent btn-sm" onclick="openReceiptCapture()"><i class="fas fa-camera"></i> Add Receipt</button>
          </div>
        </div>
        <table class="data-table">
          <thead><tr><th style="width:50px;"></th><th>Vendor</th><th>Amount</th><th>Category</th><th>Date</th><th>Submitted By</th></tr></thead>
          <tbody>
            ${projectExpenses.length > 0 ? projectExpenses.map(e => {
              const user = DEMO_USERS[e.submitted_by];
              return `<tr>
                <td>${e.receipt_thumbnail ? `<img src="${e.receipt_thumbnail}" style="width:36px;height:36px;object-fit:cover;border-radius:4px;border:1px solid var(--card-border);" onclick="viewReceiptFull('${e.id}')" title="Click to view">` : '<i class="fas fa-receipt" style="color:var(--text-light);font-size:16px;"></i>'}</td>
                <td><strong>${e.vendor}</strong>${e.notes ? `<div class="text-muted" style="font-size:11px;">${e.notes}</div>` : ''}</td>
                <td style="font-weight:600;">${formatCAD(e.amount)}</td>
                <td><span class="tag">${e.category}</span></td>
                <td>${e.expense_date}</td>
                <td class="text-muted">${user ? user.full_name : e.submitted_by}</td>
              </tr>`;
            }).join('') : '<tr><td colspan="6" class="text-muted" style="text-align:center;padding:24px;">No expenses recorded yet.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  }

  // ---- CHANGE ORDERS TAB ----
  if (tab === 'change_orders') {
    const coTotalAll = changeOrders.reduce((s, c) => s + getCOTotal(c), 0);
    const coApproved = changeOrders.filter(c => c.status === 'approved');
    const coPending = changeOrders.filter(c => c.status === 'draft' || c.status === 'sent');

    tabContent = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:8px;">
        <div class="section-title" style="margin:0;">Change Orders</div>
        <button class="btn btn-accent btn-sm" onclick="newChangeOrder('${p.id}')"><i class="fas fa-plus"></i> New Change Order</button>
      </div>

      <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
        ${statCard('Total COs', changeOrders.length, 'fas fa-exchange-alt', 'var(--blue)', coApproved.length + ' approved, ' + coPending.length + ' pending')}
        ${statCard('Approved Impact', formatCAD(approvedCOTotal), 'fas fa-dollar-sign', approvedCOTotal >= 0 ? 'var(--orange)' : 'var(--green)', approvedCOTotal >= 0 ? 'Added to budget' : 'Credit')}
        ${statCard('Revised Budget', formatCAD(revisedBudget), 'fas fa-calculator', 'var(--green)', 'Original: ' + formatCAD(p.budget))}
      </div>

      ${changeOrders.length > 0 ? changeOrders.map(co => {
        const coTotal = getCOTotal(co);
        const statusColors = { draft: 'var(--text-muted)', sent: 'var(--blue)', approved: 'var(--green)', declined: 'var(--red)' };
        return `
        <div class="stat-card mb-20" style="border-left:3px solid ${statusColors[co.status] || 'var(--card-border)'};">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
            <div>
              <div style="font-size:15px;font-weight:700;">${co.number} — ${co.description}</div>
              <div class="text-muted" style="font-size:12px;margin-top:4px;">
                ${co.date} &middot; ${co.reason}
                ${co.revised_completion ? ' &middot; Revised completion: ' + co.revised_completion : ''}
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:15px;font-weight:700;color:${coTotal >= 0 ? 'var(--orange)' : 'var(--green)'};">${coTotal >= 0 ? '+' : ''}${formatCAD(coTotal)}</span>
              <span class="status-badge status-${co.status}">${formatStatus(co.status)}</span>
            </div>
          </div>

          <!-- Line items -->
          <table class="data-table" style="margin-bottom:12px;">
            <thead><tr><th>Description</th><th style="width:60px;">Qty</th><th style="width:60px;">Unit</th><th style="width:100px;text-align:right;">Unit Cost</th><th style="width:100px;text-align:right;">Total</th></tr></thead>
            <tbody>
              ${co.items.map(item => `
                <tr>
                  <td>${item.description}</td>
                  <td>${item.qty}</td>
                  <td>${item.unit}</td>
                  <td style="text-align:right;">${formatCAD(item.unit_cost)}</td>
                  <td style="text-align:right;font-weight:600;">${formatCAD(item.qty * item.unit_cost)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Actions -->
          <div style="display:flex;gap:8px;justify-content:flex-end;">
            ${co.status === 'draft' ? `
              <button class="btn btn-outline btn-sm" onclick="editChangeOrder('${p.id}','${co.id}')"><i class="fas fa-edit"></i> Edit</button>
              <button class="btn btn-accent btn-sm" onclick="updateCOStatus('${p.id}','${co.id}','sent')"><i class="fas fa-paper-plane"></i> Send to Client</button>
            ` : ''}
            ${co.status === 'sent' ? `
              <button class="btn btn-accent btn-sm" onclick="updateCOStatus('${p.id}','${co.id}','approved')"><i class="fas fa-check"></i> Mark Approved</button>
              <button class="btn btn-outline btn-sm" onclick="updateCOStatus('${p.id}','${co.id}','declined')"><i class="fas fa-times"></i> Declined</button>
            ` : ''}
          </div>
        </div>`;
      }).join('') : `
        <div class="empty-state" style="padding:40px;">
          <i class="fas fa-exchange-alt"></i>
          <h3>No change orders</h3>
          <p>Change orders track scope changes with cost impact. Click "New Change Order" to create one.</p>
        </div>
      `}

      <!-- Client Change Requests (admin view) -->
      ${(() => {
        const clientCRs = DEMO_CHANGE_REQUESTS[p.id] || [];
        if (clientCRs.length === 0) return '';
        return `
        <div class="stat-card" style="margin-top:20px;">
          <div class="section-title" style="margin-bottom:12px;"><i class="fas fa-inbox" style="color:var(--blue);margin-right:6px;"></i>Client Change Requests</div>
          <div class="data-table-container" style="border:none;box-shadow:none;">
            <table class="data-table">
              <thead><tr><th>Request #</th><th>Title</th><th>Priority</th><th>Submitted</th><th>Status</th><th></th></tr></thead>
              <tbody>
                ${clientCRs.map(cr => `
                  <tr>
                    <td><strong>${cr.number}</strong></td>
                    <td>${cr.title}<div class="text-muted" style="font-size:11px;">${cr.description.substring(0, 60)}...</div></td>
                    <td><span class="tag">${cr.priority}</span></td>
                    <td>${cr.submitted_at}</td>
                    <td><span class="status-badge status-${cr.status}">${formatStatus(cr.status)}</span></td>
                    <td>
                      ${cr.status === 'submitted' ? `<button class="btn btn-accent btn-sm" onclick="adminReviewCR('${p.id}','${cr.id}')"><i class="fas fa-eye"></i> Review</button>` : ''}
                      ${cr.status === 'under_review' ? `<button class="btn btn-accent btn-sm" onclick="adminQuoteCR('${p.id}','${cr.id}')"><i class="fas fa-dollar-sign"></i> Send Quote</button>` : ''}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>`;
      })()}
    `;
  }

  // ---- DRAWINGS TAB ----
  if (tab === 'drawings') {
    const drawings = DEMO_DRAWINGS[p.id] || [];
    const filterCat = window._drawingFilter || '';
    const filtered = filterCat ? drawings.filter(d => d.category === filterCat) : drawings;

    tabContent = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:8px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div class="section-title" style="margin:0;">Drawings</div>
          <select class="form-input-styled" style="padding:4px 10px;font-size:12px;min-height:32px;" onchange="window._drawingFilter=this.value; switchProjectTab('drawings');">
            <option value="">All Categories</option>
            ${DRAWING_CATEGORIES.map(c => `<option ${c === filterCat ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <button class="btn btn-accent btn-sm" onclick="showUploadDrawingModal('${p.id}')"><i class="fas fa-upload"></i> Upload Drawing</button>
      </div>

      ${filtered.length > 0 ? `
      <div class="cards-grid" style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr));">
        ${filtered.map(d => {
          const statusColors = { current: 'var(--green)', approved: '#3b82f6', under_review: 'var(--orange)', superseded: '#6b7280', archived: '#9ca3af' };
          const approvalIcon = d.approval ? (d.approval.status === 'approved' ? '<i class="fas fa-stamp" style="color:var(--green);margin-left:6px;" title="Client approved"></i>' : d.approval.status === 'pending' ? '<i class="fas fa-clock" style="color:var(--orange);margin-left:6px;" title="Awaiting approval"></i>' : '') : '';
          return `
          <div class="card" onclick="openDrawingViewer('${p.id}','${d.id}')" style="padding:0;overflow:hidden;">
            <div style="height:140px;background:${d.file_type === 'pdf' ? 'linear-gradient(135deg,#1a2744 0%,#2d3f62 100%)' : 'linear-gradient(135deg,#f3f4f6 0%,#e5e7eb 100%)'};display:flex;align-items:center;justify-content:center;position:relative;">
              <i class="${d.file_type === 'pdf' ? 'fas fa-file-pdf' : 'fas fa-image'}" style="font-size:36px;color:${d.file_type === 'pdf' ? '#ffffff50' : '#9ca3af'};"></i>
              <div style="position:absolute;top:8px;right:8px;display:flex;gap:4px;">
                <span style="background:${statusColors[d.status] || '#6b7280'};color:#fff;font-size:10px;font-weight:600;padding:2px 8px;border-radius:10px;">${d.status}</span>
                ${d.shared_with_client ? '<span style="background:var(--orange);color:#fff;font-size:10px;font-weight:600;padding:2px 8px;border-radius:10px;"><i class="fas fa-eye" style="font-size:9px;"></i></span>' : ''}
              </div>
              ${d.markups.length > 0 ? `<div style="position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,0.6);color:#fff;font-size:10px;padding:2px 8px;border-radius:10px;"><i class="fas fa-pen" style="margin-right:3px;"></i>${d.markups.length}</div>` : ''}
            </div>
            <div style="padding:14px;">
              <div style="font-size:13px;font-weight:700;margin-bottom:2px;">${d.title}${approvalIcon}</div>
              <div class="text-muted" style="font-size:11px;">${d.drawing_number} · Rev ${d.revision} · ${d.category}</div>
              <div class="text-muted" style="font-size:11px;margin-top:2px;">${d.uploaded_by} · ${d.created_at}</div>
            </div>
          </div>`;
        }).join('')}
      </div>` : `
      <div class="empty-state">
        <i class="fas fa-drafting-compass"></i>
        <h3>No drawings${filterCat ? ' in ' + filterCat : ''}</h3>
        <p>Upload drawings to share with the team and client.</p>
      </div>`}
    `;
  }

  // ---- DOCUMENTS TAB ----
  if (tab === 'documents') {
    const docs = DEMO_DOCUMENTS[p.id] || { trivex: [], client: [], requests: [] };
    const trivexDocs = docs.trivex || [];
    const clientDocs = docs.client || [];
    const docRequests = docs.requests || [];
    const pendingRequests = docRequests.filter(r => r.status === 'pending');

    tabContent = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:8px;">
        <div class="section-title" style="margin:0;">Project Documents</div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-navy btn-sm" onclick="requestSignatureModal('${p.id}')"><i class="fas fa-signature"></i> Request Signature</button>
          <button class="btn btn-outline btn-sm" onclick="requestDocumentModal('${p.id}')"><i class="fas fa-inbox"></i> Request from Client</button>
          <button class="btn btn-accent btn-sm" onclick="uploadDocumentModal('${p.id}','trivex')"><i class="fas fa-upload"></i> Upload</button>
        </div>
      </div>

      <!-- Trivex Documents -->
      <div class="data-table-container mb-20">
        <div class="data-table-header">
          <span class="data-table-title">Trivex Documents</span>
          <span class="text-muted" style="font-size:12px;">${trivexDocs.length} files</span>
        </div>
        ${trivexDocs.length > 0 ? `
        <table class="data-table">
          <thead><tr><th></th><th>Name</th><th>Category</th><th>Size</th><th>Uploaded</th><th>Shared</th><th></th></tr></thead>
          <tbody>
            ${trivexDocs.map(doc => {
              const icon = doc.name.endsWith('.pdf') ? 'fas fa-file-pdf' : doc.name.endsWith('.zip') ? 'fas fa-file-archive' : doc.name.match(/\.(jpg|jpeg|png|gif)$/i) ? 'fas fa-image' : 'fas fa-file';
              const iconColor = doc.name.endsWith('.pdf') ? 'var(--red)' : doc.name.match(/\.(jpg|jpeg|png|gif)$/i) ? 'var(--green)' : 'var(--blue)';
              return `<tr>
                <td><i class="${icon}" style="color:${iconColor};font-size:16px;"></i></td>
                <td><strong style="cursor:pointer;" onclick="previewDocument('${doc.id}','${p.id}')">${doc.name}</strong></td>
                <td><span class="tag">${doc.category}</span></td>
                <td class="text-muted">${doc.size}</td>
                <td class="text-muted">${doc.uploaded_by}, ${doc.date}</td>
                <td>${doc.shared ? '<i class="fas fa-check-circle" style="color:var(--green);" title="Shared with client"></i>' : '<i class="fas fa-lock" style="color:var(--text-light);" title="Internal only"></i>'}</td>
                <td><button class="btn btn-outline btn-sm" onclick="previewDocument('${doc.id}','${p.id}')" title="View"><i class="fas fa-eye"></i></button></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>` : '<div class="text-muted" style="text-align:center;padding:20px;">No Trivex documents uploaded yet.</div>'}
      </div>

      <!-- Client Documents -->
      <div class="data-table-container mb-20">
        <div class="data-table-header">
          <span class="data-table-title">Client Documents</span>
          <span class="text-muted" style="font-size:12px;">${clientDocs.length} files</span>
        </div>
        ${clientDocs.length > 0 ? `
        <table class="data-table">
          <thead><tr><th></th><th>Name</th><th>Category</th><th>Size</th><th>Uploaded</th><th></th></tr></thead>
          <tbody>
            ${clientDocs.map(doc => `<tr>
              <td><i class="${doc.name.match(/\.(jpg|jpeg|png|gif)$/i) ? 'fas fa-image' : 'fas fa-file-pdf'}" style="color:${doc.name.match(/\.(jpg|jpeg|png|gif)$/i) ? 'var(--green)' : 'var(--red)'};font-size:16px;"></i></td>
              <td><strong style="cursor:pointer;" onclick="previewDocument('${doc.id}','${p.id}')">${doc.name}</strong></td>
              <td><span class="tag">${doc.category}</span></td>
              <td class="text-muted">${doc.size}</td>
              <td class="text-muted">${doc.uploaded_by}, ${doc.date}</td>
              <td><button class="btn btn-outline btn-sm" onclick="previewDocument('${doc.id}','${p.id}')" title="View"><i class="fas fa-eye"></i></button></td>
            </tr>`).join('')}
          </tbody>
        </table>` : '<div class="text-muted" style="text-align:center;padding:20px;">No client documents received yet.</div>'}
      </div>

      <!-- Document Requests -->
      ${docRequests.length > 0 ? `
      <div class="stat-card">
        <div class="section-title" style="margin-bottom:12px;">Document Requests</div>
        ${docRequests.map(req => `
          <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;border:1px solid var(--card-border);border-radius:var(--radius);margin-bottom:8px;${req.status === 'pending' ? 'background:var(--orange-light);border-color:rgba(249,115,22,0.2);' : ''}">
            <i class="${req.status === 'fulfilled' ? 'fas fa-check-circle' : 'fas fa-clock'}" style="color:${req.status === 'fulfilled' ? 'var(--green)' : 'var(--orange)'};font-size:16px;"></i>
            <div style="flex:1;">
              <div style="font-size:13px;font-weight:600;">${req.name}</div>
              <div class="text-muted" style="font-size:11px;">${req.category} · ${req.reason} · Due: ${req.deadline}</div>
            </div>
            <span class="status-badge status-${req.status === 'fulfilled' ? 'complete' : 'pending'}">${req.status}</span>
          </div>
        `).join('')}
      </div>` : ''}

      <!-- Signature Requests -->
      ${(() => {
        const sigs = DEMO_SIGNATURES[p.id] || [];
        if (sigs.length === 0) return '';
        return '<div class="stat-card" style="margin-top:20px;">' +
          '<div class="section-title" style="margin-bottom:12px;"><i class="fas fa-signature" style="color:var(--navy);margin-right:6px;"></i>Signature Requests</div>' +
          sigs.map(function(sig) {
            var statusIcon = sig.status === 'signed' ? 'fas fa-check-circle' : sig.status === 'declined' ? 'fas fa-times-circle' : 'fas fa-clock';
            var statusColor = sig.status === 'signed' ? 'var(--green)' : sig.status === 'declined' ? 'var(--red)' : 'var(--orange)';
            var bg = sig.status === 'signed' ? 'var(--green-bg)' : sig.status === 'pending' ? 'var(--orange-light)' : '';
            return '<div style="display:flex;align-items:flex-start;gap:12px;padding:12px;border:1px solid var(--card-border);border-radius:var(--radius);margin-bottom:8px;background:' + bg + ';">' +
              '<i class="' + statusIcon + '" style="color:' + statusColor + ';font-size:18px;margin-top:2px;"></i>' +
              '<div style="flex:1;">' +
                '<div style="font-size:13px;font-weight:600;">' + sig.doc_name + '</div>' +
                '<div class="text-muted" style="font-size:11px;">Signer: ' + sig.signer_name + ' · Requested: ' + sig.requested_at + '</div>' +
                (sig.notes ? '<div class="text-muted" style="font-size:11px;margin-top:2px;">' + sig.notes + '</div>' : '') +
                (sig.status === 'signed' ? '<div style="margin-top:6px;padding:6px 10px;background:var(--green);color:#fff;border-radius:var(--radius);font-size:11px;font-weight:600;display:inline-block;"><i class="fas fa-stamp" style="margin-right:4px;"></i>Signed by ' + sig.signed_by + ' on ' + sig.signed_at + '</div>' : '') +
              '</div>' +
              '<span class="status-badge status-' + (sig.status === 'signed' ? 'complete' : sig.status === 'declined' ? 'declined' : 'pending') + '">' + sig.status + '</span>' +
            '</div>';
          }).join('') +
        '</div>';
      })()}
    `;
  }

  // ---- BIDDING TAB ----
  if (tab === 'bidding') {
    const bidPkgs = DEMO_BID_PACKAGES[p.id] || [];
    const openBids = bidPkgs.filter(b => b.status === 'open');
    const awardedBids = bidPkgs.filter(b => b.status === 'awarded');
    const totalAwarded = awardedBids.reduce((s, b) => s + (b.awarded_amount || 0), 0);

    tabContent = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:8px;">
        <div class="section-title" style="margin:0;">Trade Bidding</div>
        <button class="btn btn-accent btn-sm" onclick="createBidPackage('${p.id}')"><i class="fas fa-plus"></i> New Bid Package</button>
      </div>

      <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
        ${statCard('Bid Packages', bidPkgs.length, 'fas fa-gavel', 'var(--blue)', openBids.length + ' open, ' + awardedBids.length + ' awarded')}
        ${statCard('Total Awarded', formatCAD(totalAwarded), 'fas fa-handshake', 'var(--green)', awardedBids.length + ' trades')}
        ${statCard('Awaiting Bids', openBids.filter(b => b.bids.length === 0).length, 'fas fa-clock', 'var(--orange)', openBids.length + ' packages open')}
      </div>

      ${bidPkgs.length > 0 ? bidPkgs.map(bp => {
        const invitedSubs = bp.invited.map(sid => DEMO_SUBS.find(s => s.id === sid)).filter(Boolean);
        const statusColors = { draft: '#6b7280', open: 'var(--blue)', closed: 'var(--text-muted)', awarded: 'var(--green)' };
        const lowestBid = bp.bids.length > 0 ? Math.min(...bp.bids.map(b => b.amount)) : null;
        const highestBid = bp.bids.length > 0 ? Math.max(...bp.bids.map(b => b.amount)) : null;

        return `
        <div class="stat-card mb-20" style="border-left:3px solid ${statusColors[bp.status] || 'var(--card-border)'};">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
            <div>
              <div style="display:flex;align-items:center;gap:8px;">
                <span class="tag" style="background:var(--navy);color:#fff;font-size:11px;padding:3px 10px;">${bp.trade}</span>
                <span class="status-badge status-${bp.status === 'awarded' ? 'complete' : bp.status === 'open' ? 'active' : bp.status}">${bp.status}</span>
              </div>
              <div style="font-size:14px;font-weight:600;margin-top:6px;">${bp.scope}</div>
              <div class="text-muted" style="font-size:11px;margin-top:2px;">Created ${bp.created_at} · Deadline: ${bp.deadline}</div>
            </div>
            ${bp.status === 'open' ? `<button class="btn btn-outline btn-sm" onclick="inviteSubsToBid('${p.id}','${bp.id}')"><i class="fas fa-user-plus"></i> Invite Subs</button>` : ''}
          </div>

          <!-- Invited subs -->
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:10px;">
            <strong>Invited (${invitedSubs.length}):</strong> ${invitedSubs.map(s => s.company).join(', ') || 'None yet'}
          </div>

          <!-- Bids received -->
          ${bp.bids.length > 0 ? `
          <div class="data-table-container" style="border:none;box-shadow:none;margin-bottom:10px;">
            <table class="data-table">
              <thead><tr><th>Subcontractor</th><th>Bid Amount</th><th>Timeline</th><th>Notes</th><th>Estimate</th><th>Status</th>${bp.status === 'open' ? '<th></th>' : ''}</tr></thead>
              <tbody>
                ${bp.bids.map(bid => {
                  const sub = DEMO_SUBS.find(s => s.id === bid.sub_id);
                  const isLowest = bp.bids.length > 1 && bid.amount === lowestBid;
                  const isAwarded = bid.status === 'awarded';
                  const ests = bid.estimates || [];
                  const latestEst = ests.length > 0 ? ests[ests.length - 1] : null;
                  const approvedEst = ests.find(e => e.approved);
                  return `<tr style="${isAwarded ? 'background:var(--green-bg);' : ''}">
                    <td><strong>${sub ? sub.company : '—'}</strong><div class="text-muted" style="font-size:11px;">${sub ? sub.contact + ' · ' + sub.phone : ''}</div></td>
                    <td style="font-size:15px;font-weight:700;${isLowest ? 'color:var(--green);' : ''}">${formatCAD(bid.amount)}${isLowest && bp.bids.length > 1 ? ' <i class="fas fa-arrow-down" style="font-size:10px;color:var(--green);" title="Lowest bid"></i>' : ''}</td>
                    <td>${bid.timeline || '—'}</td>
                    <td class="text-muted" style="font-size:12px;">${bid.notes || '—'}</td>
                    <td>${latestEst
                      ? `<div style="display:flex;align-items:center;gap:6px;"><button class="btn btn-outline btn-sm" onclick="viewSubEstimates('${p.id}','${bp.id}','${bid.sub_id}')" title="View estimates"><i class="fas fa-file-pdf"></i> ${ests.length > 1 ? 'V' + latestEst.version + ' (' + ests.length + ')' : 'V1'}</button>${approvedEst ? '<i class="fas fa-check-circle" style="color:var(--green);font-size:14px;" title="Approved"></i>' : ''}</div>`
                      : '<span class="text-muted" style="font-size:11px;">No estimate</span>'
                    }</td>
                    <td><span class="status-badge status-${isAwarded ? 'complete' : 'pending'}">${isAwarded ? 'Awarded' : 'Submitted'}</span></td>
                    ${bp.status === 'open' ? `<td><button class="btn btn-accent btn-sm" onclick="awardBid('${p.id}','${bp.id}','${bid.sub_id}')"><i class="fas fa-trophy"></i> Award</button></td>` : ''}
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
          ${bp.bids.length > 1 ? `<div class="text-muted" style="font-size:11px;">Range: ${formatCAD(lowestBid)} — ${formatCAD(highestBid)} · Spread: ${formatCAD(highestBid - lowestBid)}</div>` : ''}
          ` : `
          <div class="text-muted" style="text-align:center;padding:16px;font-size:13px;background:var(--page-bg);border-radius:var(--radius);">
            <i class="fas fa-inbox" style="margin-right:6px;"></i>No bids received yet
            ${bp.status === 'open' ? ' · <span style="cursor:pointer;color:var(--orange);text-decoration:underline;" onclick="simulateBid(\'' + p.id + '\',\'' + bp.id + '\')">Simulate a bid for demo</span>' : ''}
          </div>`}

          ${bp.status === 'awarded' ? `
          <div style="margin-top:10px;padding:10px 14px;background:var(--green-bg);border:1px solid rgba(34,197,94,0.2);border-radius:var(--radius);display:flex;align-items:center;gap:10px;">
            <i class="fas fa-trophy" style="color:var(--green);font-size:16px;"></i>
            <div>
              <div style="font-size:13px;font-weight:600;color:var(--green);">Awarded to ${(() => { const s = DEMO_SUBS.find(x => x.id === bp.awarded_to); return s ? s.company : '—'; })()} — ${formatCAD(bp.awarded_amount)}</div>
            </div>
          </div>` : ''}
        </div>`;
      }).join('') : `
        <div class="empty-state">
          <i class="fas fa-gavel"></i>
          <h3>No bid packages</h3>
          <p>Create a bid package to send scope to subcontractors for pricing.</p>
        </div>
      `}
    `;
  }

  // ---- SUBCONTRACTORS TAB ----
  if (tab === 'subcontractors') {
    const assignments = DEMO_SUB_ASSIGNMENTS[p.id] || [];
    const totalContract = assignments.reduce((s, a) => s + a.contract_amount, 0);
    const totalPaidSubs = assignments.reduce((s, a) => s + a.amount_paid, 0);
    const totalOwing = totalContract - totalPaidSubs;
    // Available subs = subs not already assigned
    const assignedIds = assignments.map(a => a.sub_id);
    const availableSubs = DEMO_SUBS.filter(s => !assignedIds.includes(s.id));

    tabContent = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:8px;">
        <div class="section-title" style="margin:0;">Assigned Subcontractors</div>
        ${availableSubs.length > 0 ? `
        <div style="display:flex;gap:8px;">
          <select id="assign-sub-select" class="form-input-styled" style="padding:6px 10px;font-size:13px;min-width:180px;">
            ${availableSubs.map(s => `<option value="${s.id}">${s.company} — ${s.trade}</option>`).join('')}
          </select>
          <button class="btn btn-accent btn-sm" onclick="assignSubToProject('${p.id}')"><i class="fas fa-plus"></i> Assign</button>
        </div>` : ''}
      </div>

      <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
        ${statCard('Total Contract', formatCAD(totalContract), 'fas fa-file-contract', 'var(--blue)', assignments.length + ' subcontractors')}
        ${statCard('Paid to Subs', formatCAD(totalPaidSubs), 'fas fa-hand-holding-usd', 'var(--green)', Math.round(totalPaidSubs / (totalContract || 1) * 100) + '% of contracts')}
        ${statCard('Owing to Subs', formatCAD(totalOwing), 'fas fa-exclamation-circle', totalOwing > 0 ? 'var(--orange)' : 'var(--green)', totalOwing > 0 ? 'Outstanding' : 'All paid')}
      </div>

      ${assignments.length > 0 ? assignments.map(a => {
        const sub = DEMO_SUBS.find(s => s.id === a.sub_id);
        if (!sub) return '';
        const owing = a.contract_amount - a.amount_paid;
        const pctPaid = Math.round(a.amount_paid / (a.contract_amount || 1) * 100);
        return `
        <div class="stat-card mb-20">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
            <div>
              <div style="font-size:15px;font-weight:700;">${sub.company}</div>
              <div class="text-muted" style="font-size:12px;">${sub.trade} &middot; ${sub.contact} &middot; ${sub.phone}</div>
              <div class="text-muted" style="font-size:12px;margin-top:2px;">Scope: ${a.scope}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:15px;font-weight:700;">${formatCAD(a.contract_amount)}</div>
              <div class="text-muted" style="font-size:12px;">${formatCAD(a.amount_paid)} paid &middot; ${formatCAD(owing)} owing</div>
            </div>
          </div>

          <!-- Progress bar -->
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
            <div class="progress-bar" style="flex:1;"><div class="progress-fill" style="width:${pctPaid}%;background:${owing > 0 ? 'var(--orange)' : 'var(--green)'};"></div></div>
            <span style="font-size:12px;font-weight:600;">${pctPaid}%</span>
          </div>

          <!-- Payments -->
          ${(a.payments || []).length > 0 ? `
          <div style="margin-bottom:12px;">
            <div style="font-size:12px;font-weight:600;margin-bottom:6px;color:var(--text-muted);">Payments</div>
            ${a.payments.map(pay => `
              <div style="display:flex;align-items:center;gap:8px;font-size:12px;padding:4px 0;">
                <i class="fas fa-check-circle" style="color:var(--green);font-size:11px;"></i>
                <span>${formatCAD(pay.amount)}</span>
                <span class="text-muted">${pay.date}</span>
              </div>
            `).join('')}
          </div>` : ''}

          <!-- Notes -->
          ${(a.notes || []).length > 0 ? `
          <div style="margin-bottom:12px;">
            <div style="font-size:12px;font-weight:600;margin-bottom:6px;color:var(--text-muted);">Notes</div>
            ${a.notes.map(n => `
              <div style="font-size:12px;padding:6px 10px;background:var(--page-bg);border-radius:var(--radius);margin-bottom:4px;">
                ${n.text} <span class="text-muted">— ${n.date}</span>
              </div>
            `).join('')}
          </div>` : ''}

          <!-- Actions -->
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${owing > 0 ? `<button class="btn btn-accent btn-sm" onclick="paySubModal('${p.id}','${a.sub_id}',${owing})"><i class="fas fa-dollar-sign"></i> Record Payment</button>` : ''}
            <button class="btn btn-outline btn-sm" onclick="addSubNote('${p.id}','${a.sub_id}')"><i class="fas fa-sticky-note"></i> Add Note</button>
          </div>
        </div>`;
      }).join('') : `
        <div class="empty-state" style="padding:40px;">
          <i class="fas fa-hard-hat"></i>
          <h3>No subcontractors assigned</h3>
          <p>Select a subcontractor from the dropdown and click "Assign" to add them to this project.</p>
        </div>
      `}
    `;
  }

  // ---- SCHEDULE TAB ---- (Project timeline with milestones + client events)
  if (tab === 'schedule') {
    // Client events stored per project
    if (!window._clientEvents) window._clientEvents = {};
    const clientEvents = window._clientEvents[p.id] || [];

    // Build timeline entries: milestones + client events, sorted by date
    const timelineItems = [];
    milestones.forEach(function(m, i) {
      timelineItems.push({ type: 'milestone', name: m.name, date: m.target_date || '', completed_date: m.completed_date, status: m.status, sort_order: i });
    });
    clientEvents.forEach(function(ev) {
      timelineItems.push({ type: 'client-event', name: ev.name, date: ev.date, notes: ev.notes, id: ev.id });
    });
    timelineItems.sort(function(a, b) { return (a.date || '9999').localeCompare(b.date || '9999'); });

    tabContent = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:8px;">
        <div class="section-title" style="margin:0;">Project Schedule</div>
        <button class="btn btn-outline btn-sm" onclick="addScheduleEvent('${p.id}')"><i class="fas fa-plus"></i> Add Event</button>
      </div>

      <!-- Visual Gantt-style timeline -->
      <div class="stat-card mb-20">
        <div style="display:flex;gap:3px;align-items:center;margin-bottom:16px;">
          ${milestones.map(m => {
            const color = m.status === 'complete' ? 'var(--green)' : m.status === 'in_progress' ? 'var(--orange)' : 'rgba(200,215,240,0.4)';
            return `<div style="flex:1;height:14px;border-radius:7px;background:${color};position:relative;" title="${m.name} — ${m.target_date || 'TBD'}">
              ${m.status === 'in_progress' ? '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;color:#fff;">NOW</div>' : ''}
            </div>`;
          }).join('')}
        </div>
        <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-muted);">
          <span>${milestones[0]?.target_date || ''}</span>
          <span>${p.target_handover || ''}</span>
        </div>
      </div>

      <!-- Timeline list -->
      <div class="stat-card">
        ${timelineItems.map(item => {
          if (item.type === 'milestone') {
            const icon = item.status === 'complete' ? 'fas fa-check-circle' : item.status === 'in_progress' ? 'fas fa-circle-notch' : 'far fa-circle';
            const iconColor = item.status === 'complete' ? 'var(--green)' : item.status === 'in_progress' ? 'var(--orange)' : 'var(--text-light)';
            return `<div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid rgba(200,215,240,0.3);">
              <div style="width:80px;font-size:12px;color:var(--text-muted);flex-shrink:0;">${item.date || 'TBD'}</div>
              <i class="${icon}" style="color:${iconColor};font-size:16px;margin-top:2px;"></i>
              <div style="flex:1;">
                <div style="font-size:13px;font-weight:500;">${item.name}</div>
                ${item.completed_date ? '<div class="text-muted" style="font-size:11px;">Completed: ' + item.completed_date + '</div>' : ''}
              </div>
              <span class="status-badge status-${item.status}" style="font-size:10px;">${formatStatus(item.status)}</span>
            </div>`;
          } else {
            return `<div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid rgba(200,215,240,0.3);background:rgba(249,115,22,0.04);margin:0 -20px;padding-left:20px;padding-right:20px;">
              <div style="width:80px;font-size:12px;color:var(--orange);font-weight:600;flex-shrink:0;">${item.date}</div>
              <i class="fas fa-truck" style="color:var(--orange);font-size:16px;margin-top:2px;"></i>
              <div style="flex:1;">
                <div style="font-size:13px;font-weight:500;color:var(--orange);">${item.name}</div>
                ${item.notes ? '<div class="text-muted" style="font-size:11px;">' + item.notes + '</div>' : ''}
              </div>
              <span class="tag" style="background:var(--orange-light);color:var(--orange);">Client Event</span>
            </div>`;
          }
        }).join('')}
      </div>

      <div style="display:flex;gap:12px;margin-top:12px;font-size:11px;color:var(--text-muted);">
        <div style="display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;border-radius:50%;background:var(--green);display:inline-block;"></span> Complete</div>
        <div style="display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;border-radius:50%;background:var(--orange);display:inline-block;"></span> In Progress / Client Event</div>
        <div style="display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;border-radius:50%;background:rgba(200,215,240,0.4);display:inline-block;"></span> Upcoming</div>
      </div>
    `;
  }

  // ---- NOTES TAB ----
  if (tab === 'notes') {
    tabContent = `
      <div class="stat-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <div class="section-title" style="margin:0;">Project Notes</div>
        </div>
        <div style="display:flex;gap:10px;margin-bottom:20px;">
          <input id="new-note-input" class="form-input-styled" placeholder="Add a note..." style="flex:1;">
          <button class="btn btn-accent" onclick="addProjectNote()"><i class="fas fa-plus"></i> Add</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${notes.length > 0 ? notes.map(n => `
            <div style="padding:14px;border:1px solid var(--card-border);border-radius:var(--radius);background:var(--page-bg);">
              <div style="font-size:13px;line-height:1.5;">${n.text}</div>
              <div style="display:flex;gap:12px;margin-top:8px;font-size:12px;color:var(--text-muted);">
                <span><i class="fas fa-user" style="margin-right:4px;"></i>${n.author}</span>
                <span><i class="fas fa-clock" style="margin-right:4px;"></i>${n.date}</span>
              </div>
            </div>
          `).join('') : '<div class="text-muted" style="text-align:center;padding:24px;font-size:13px;">No notes yet. Add one above.</div>'}
        </div>
      </div>

      <!-- Client Messages (admin view) -->
      ${renderAdminMessages(p.id)}
    `;
  }

  return `
    <div class="page-header">
      <div style="display:flex;align-items:center;gap:12px;">
        <button class="btn btn-outline btn-sm" onclick="navigateTo('${backPage}')"><i class="fas fa-arrow-left"></i></button>
        <div>
          <h1>${p.name}</h1>
          <p class="page-header-sub">${p.client_brand} &middot; ${p.city} &middot; Handover: ${p.target_handover}</p>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <span class="status-badge status-${p.status}" style="font-size:13px;padding:6px 14px;">${formatStatus(p.status)}</span>
        ${p.status !== 'archived' && p.status !== 'lost' ? `
          <select onchange="changeProjectStatus('${p.id}',this.value)" style="padding:4px 8px;font-size:11px;border:1px solid rgba(200,215,240,0.5);border-radius:6px;background:rgba(255,255,255,0.5);color:var(--text-muted);cursor:pointer;">
            <option value="">Change status...</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="punch_list">Punch List</option>
            <option value="complete">Complete</option>
            <option value="archived">Archive</option>
            <option value="lost">Mark as Lost</option>
          </select>
        ` : `<button class="btn btn-outline btn-sm" onclick="changeProjectStatus('${p.id}','active')"><i class="fas fa-undo"></i> Restore</button>`}
      </div>
    </div>

    ${(() => {
      const unread = getProjectUnreadCount(p.id);
      const msgs = DEMO_CLIENT_MESSAGES[p.id] || [];
      const unreadMsgs = msgs.filter(m => m.role === 'client' && !m.read_by_trivex);
      if (unread === 0) return '';
      return '<div style="background:var(--red-bg);border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius);padding:12px 16px;margin-bottom:16px;cursor:pointer;" onclick="switchProjectTab(\'notes\')">' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
          '<div style="background:var(--red);color:#fff;font-size:12px;font-weight:700;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' + unread + '</div>' +
          '<div style="flex:1;">' +
            '<div style="font-size:13px;font-weight:600;color:var(--red);">' + unread + ' unread client message' + (unread > 1 ? 's' : '') + '</div>' +
            unreadMsgs.slice(0, 2).map(function(m) {
              return '<div style="font-size:12px;color:var(--text);margin-top:4px;display:flex;gap:6px;align-items:flex-start;">' +
                '<span style="font-weight:600;flex-shrink:0;">' + m.sender + ':</span>' +
                '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + m.message.substring(0, 80) + (m.message.length > 80 ? '...' : '') + '</span>' +
                (m.category === 'Urgent' ? '<span style="background:var(--red);color:#fff;font-size:10px;font-weight:600;padding:1px 6px;border-radius:8px;flex-shrink:0;">URGENT</span>' : '') +
              '</div>';
            }).join('') +
          '</div>' +
          '<div style="flex-shrink:0;color:var(--red);font-size:12px;font-weight:500;"><i class="fas fa-arrow-right" style="margin-right:4px;"></i>View</div>' +
        '</div>' +
      '</div>';
    })()}

    <div class="tabs">
      ${['overview', 'milestones', 'due_diligence', 'expenses', 'change_orders', 'bidding', 'subcontractors', 'drawings', 'documents', 'schedule', 'notes'].map(t => {
        const labels = { change_orders: 'Change Orders', subcontractors: 'Subcontractors', due_diligence: 'Due Diligence', drawings: 'Drawings', bidding: 'Bidding' };
        const label = labels[t] || formatStatus(t);
        const notesBadge = t === 'notes' ? getProjectUnreadCount(p.id) : 0;
        return `<button class="tab ${t === tab ? 'active' : ''}" onclick="switchProjectTab('${t}')">${label}${notesBadge > 0 ? ' <span style="background:var(--red);color:#fff;font-size:10px;font-weight:700;padding:1px 6px;border-radius:8px;margin-left:4px;">' + notesBadge + '</span>' : ''}</button>`;
      }).join('')}
    </div>

    ${tabContent}
  `;
};

function changeProjectStatus(projectId, status) {
  if (!status) return;
  const p = DEMO_PROJECTS.find(pr => pr.id === projectId);
  if (!p) return;
  if (status === 'archived' && !confirm('Archive "' + p.name + '"? It will move to the Archived tab.')) return;
  if (status === 'lost' && !confirm('Mark "' + p.name + '" as Lost? It will move to the Lost tab.')) return;
  p.status = status;
  if (typeof updateProjectField === 'function') updateProjectField(projectId, 'status', status);
  switchProjectTab(activeProjectTab);
}

function addProjectNote() {
  const input = document.getElementById('new-note-input');
  const text = input.value.trim();
  if (!text || !activeProjectId) return;
  if (!DEMO_NOTES[activeProjectId]) DEMO_NOTES[activeProjectId] = [];
  DEMO_NOTES[activeProjectId].unshift({
    id: 'n' + Date.now(),
    text,
    author: currentUser.full_name,
    date: new Date().toISOString().split('T')[0],
  });
  switchProjectTab('notes');
}

function renderAdminMessages(projectId) {
  const msgs = DEMO_CLIENT_MESSAGES[projectId] || [];
  if (msgs.length === 0) return '';
  // Mark all as read by trivex
  msgs.forEach(function(m) { m.read_by_trivex = true; });

  var html = '<div class="stat-card" style="margin-top:20px;">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">';
  html += '<div class="section-title" style="margin:0;"><i class="fas fa-comment-dots" style="color:var(--orange);margin-right:6px;"></i>Client Messages</div>';
  html += '</div>';
  html += '<div style="display:flex;gap:8px;margin-bottom:16px;">';
  html += '<input id="admin-msg-input" class="form-input-styled" placeholder="Reply to client..." style="flex:1;">';
  html += '<button class="btn btn-accent" onclick="sendAdminMessage(\'' + projectId + '\')"><i class="fas fa-paper-plane"></i></button>';
  html += '</div>';

  var sorted = msgs.slice().reverse();
  for (var i = 0; i < sorted.length; i++) {
    var m = sorted[i];
    var isClient = m.role === 'client';
    var isUrgent = m.category === 'Urgent';
    var catColor = isUrgent ? 'var(--red)' : m.category === 'Milestone' ? 'var(--green)' : m.category === 'Invoice' ? 'var(--blue)' : 'var(--text-muted)';
    var bg = isClient ? 'var(--orange-light)' : 'var(--page-bg)';
    var borderStyle = isUrgent ? 'border-left:3px solid var(--red);' : '';

    html += '<div style="padding:10px 14px;border-radius:var(--radius);margin-bottom:6px;background:' + bg + ';' + borderStyle + '">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">';
    html += '<div style="display:flex;align-items:center;gap:6px;">';
    html += '<span style="font-size:12px;font-weight:600;">' + m.sender + '</span>';
    if (m.category) {
      html += '<span style="font-size:10px;font-weight:600;color:' + catColor + ';background:' + catColor + '15;padding:1px 6px;border-radius:8px;">' + m.category + '</span>';
    }
    html += '</div>';
    html += '<span style="font-size:11px;color:var(--text-muted);">' + m.date + '</span>';
    html += '</div>';
    html += '<div style="font-size:13px;line-height:1.5;">' + m.message + '</div>';
    html += '</div>';
  }

  html += '</div>';
  return html;
}

function sendAdminMessage(projectId) {
  var input = document.getElementById('admin-msg-input');
  var text = input.value.trim();
  if (!text) return;
  if (!DEMO_CLIENT_MESSAGES[projectId]) DEMO_CLIENT_MESSAGES[projectId] = [];
  DEMO_CLIENT_MESSAGES[projectId].push({
    id: 'msg-' + Date.now(),
    sender: currentUser.full_name,
    role: 'trivex',
    message: text,
    date: new Date().toISOString().split('T')[0] + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    category: 'General',
    read_by_client: false,
    read_by_trivex: true,
  });
  input.value = '';
  switchProjectTab('notes');
}

// ============================================
// SCHEDULE EVENTS
// ============================================
function addScheduleEvent(projectId) {
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'schedule-event-modal';
  overlay.innerHTML = '<div class="modal-card" style="max-width:420px;">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">' +
      '<h3>Add Schedule Event</h3>' +
      '<button class="btn-icon" onclick="document.getElementById(\'schedule-event-modal\').remove()" style="color:var(--text-muted);font-size:18px;"><i class="fas fa-times"></i></button>' +
    '</div>' +
    '<div style="display:flex;flex-direction:column;gap:14px;">' +
      '<div class="form-group"><label class="form-label">Event Name</label><input id="sched-name" class="form-input-styled" placeholder="e.g. Equipment delivery, Franchise inspection"></div>' +
      '<div class="form-group"><label class="form-label">Date</label><input id="sched-date" type="date" class="form-input-styled"></div>' +
      '<div class="form-group"><label class="form-label">Notes</label><input id="sched-notes" class="form-input-styled" placeholder="Optional details..."></div>' +
      '<button class="btn btn-accent btn-full btn-lg" onclick="saveScheduleEvent(\'' + projectId + '\')"><i class="fas fa-check"></i> Add to Schedule</button>' +
    '</div></div>';
  document.body.appendChild(overlay);
}

function saveScheduleEvent(projectId) {
  var name = document.getElementById('sched-name').value.trim();
  if (!name) { alert('Enter an event name.'); return; }
  if (!window._clientEvents) window._clientEvents = {};
  if (!window._clientEvents[projectId]) window._clientEvents[projectId] = [];
  window._clientEvents[projectId].push({
    id: 'cev-' + Date.now(),
    name: name,
    date: document.getElementById('sched-date').value,
    notes: document.getElementById('sched-notes').value,
    added_by: currentUser.full_name,
  });
  document.getElementById('schedule-event-modal').remove();
  switchProjectTab('schedule');
}

// ============================================
// SITE PHOTOS — Full capture flow like receipts
// ============================================
function openSitePhotoCapture(projectId) {
  var milestones = DEMO_MILESTONES[projectId] || [];
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'site-photo-modal';
  overlay.innerHTML =
    '<div class="modal-card" style="max-width:480px;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">' +
        '<h3><i class="fas fa-camera" style="color:var(--orange);margin-right:8px;"></i>Site Photo</h3>' +
        '<button class="btn-icon" onclick="document.getElementById(\'site-photo-modal\').remove()" style="color:var(--text-muted);font-size:18px;"><i class="fas fa-times"></i></button>' +
      '</div>' +

      '<div id="sp-step-1">' +
        '<p class="text-muted" style="font-size:13px;margin-bottom:16px;">Take a photo of work on site.</p>' +
        '<input type="file" id="sp-file-input" accept="image/*" capture="environment" style="display:none;" onchange="handleSitePhotoFile(this)">' +
        '<button class="receipt-capture-btn" onclick="document.getElementById(\'sp-file-input\').click()" style="margin-bottom:12px;">' +
          '<i class="fas fa-camera"></i> Take Photo' +
        '</button>' +
        '<button class="btn btn-outline btn-full" onclick="document.getElementById(\'sp-file-input\').removeAttribute(\'capture\'); document.getElementById(\'sp-file-input\').click()">' +
          '<i class="fas fa-image"></i> Choose from Gallery' +
        '</button>' +
      '</div>' +

      '<div id="sp-step-2" style="display:none;">' +
        '<img id="sp-preview" style="width:100%;max-height:250px;object-fit:contain;border-radius:var(--radius);border:1px solid var(--card-border);margin-bottom:16px;">' +
        '<div class="form-group" style="margin-bottom:12px;">' +
          '<label class="form-label">Which stage is this?</label>' +
          '<select id="sp-milestone" class="form-input-styled">' +
            milestones.map(function(m, i) { return '<option value="' + m.id + '">' + m.name + '</option>'; }).join('') +
          '</select>' +
        '</div>' +
        '<div class="form-group" style="margin-bottom:16px;">' +
          '<label class="form-label">Caption (optional)</label>' +
          '<input id="sp-caption" class="form-input-styled" placeholder="e.g. Framing complete — north wall">' +
        '</div>' +
        '<div style="display:flex;gap:10px;">' +
          '<button class="btn btn-outline btn-full" onclick="retakeSitePhoto()"><i class="fas fa-redo"></i> Retake</button>' +
          '<button class="btn btn-accent btn-full" onclick="saveSitePhoto(\'' + projectId + '\')"><i class="fas fa-check"></i> Save Photo</button>' +
        '</div>' +
      '</div>' +

      '<div id="sp-step-3" style="display:none;text-align:center;padding:20px;">' +
        '<i class="fas fa-check-circle" style="font-size:48px;color:var(--green);margin-bottom:12px;display:block;"></i>' +
        '<h3 style="margin-bottom:4px;">Photo Saved</h3>' +
        '<p class="text-muted" style="font-size:13px;margin-bottom:16px;" id="sp-saved-detail"></p>' +
        '<div style="display:flex;gap:10px;">' +
          '<button class="btn btn-outline btn-full" onclick="document.getElementById(\'site-photo-modal\').remove(); switchProjectTab(\'milestones\');">Done</button>' +
          '<button class="btn btn-accent btn-full" onclick="retakeSitePhoto()"><i class="fas fa-plus"></i> Another Photo</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);
}

var _sitePhotoData = null;

function handleSitePhotoFile(input) {
  var file = input.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    _sitePhotoData = e.target.result;
    document.getElementById('sp-preview').src = _sitePhotoData;
    document.getElementById('sp-step-1').style.display = 'none';
    document.getElementById('sp-step-2').style.display = 'block';
  };
  reader.readAsDataURL(file);
  input.setAttribute('capture', 'environment');
}

function retakeSitePhoto() {
  _sitePhotoData = null;
  document.getElementById('sp-file-input').value = '';
  document.getElementById('sp-step-2').style.display = 'none';
  document.getElementById('sp-step-3').style.display = 'none';
  document.getElementById('sp-step-1').style.display = 'block';
}

function saveSitePhoto(projectId) {
  if (!_sitePhotoData) return;
  var milestoneId = document.getElementById('sp-milestone').value;
  var caption = document.getElementById('sp-caption').value;

  if (!DEMO_SITE_PHOTOS[projectId]) DEMO_SITE_PHOTOS[projectId] = {};
  if (!DEMO_SITE_PHOTOS[projectId][milestoneId]) DEMO_SITE_PHOTOS[projectId][milestoneId] = [];
  DEMO_SITE_PHOTOS[projectId][milestoneId].push({
    id: 'sp-' + Date.now(),
    url: _sitePhotoData,
    caption: caption,
    uploaded_by: currentUser.full_name,
    date: new Date().toISOString().split('T')[0],
  });

  var ms = (DEMO_MILESTONES[projectId] || []).find(function(m) { return m.id === milestoneId; });
  document.getElementById('sp-saved-detail').textContent = (ms ? ms.name : 'Stage') + (caption ? ' — ' + caption : '');
  document.getElementById('sp-step-2').style.display = 'none';
  document.getElementById('sp-step-3').style.display = 'block';
  _sitePhotoData = null;
}

function uploadSitePhoto(input, projectId, milestoneId) {
  var file = input.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    if (!DEMO_SITE_PHOTOS[projectId]) DEMO_SITE_PHOTOS[projectId] = {};
    if (!DEMO_SITE_PHOTOS[projectId][milestoneId]) DEMO_SITE_PHOTOS[projectId][milestoneId] = [];
    DEMO_SITE_PHOTOS[projectId][milestoneId].push({
      id: 'sp-' + Date.now(),
      url: e.target.result,
      caption: '',
      uploaded_by: currentUser.full_name,
      date: new Date().toISOString().split('T')[0],
    });
    switchProjectTab('milestones');
  };
  reader.readAsDataURL(file);
}

function viewSitePhoto(url, caption, uploadedBy, date) {
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'site-photo-view';
  overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
  overlay.innerHTML = '<div class="modal-card" style="max-width:700px;text-align:center;">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
      '<div class="text-muted" style="font-size:12px;">' + uploadedBy + ' · ' + date + '</div>' +
      '<button class="btn-icon" onclick="document.getElementById(\'site-photo-view\').remove()" style="color:var(--text-muted);font-size:18px;"><i class="fas fa-times"></i></button>' +
    '</div>' +
    '<img src="' + url + '" style="max-width:100%;max-height:70vh;object-fit:contain;border-radius:var(--radius);">' +
    (caption ? '<div style="margin-top:8px;font-size:13px;">' + caption + '</div>' : '') +
  '</div>';
  document.body.appendChild(overlay);
}

// ============================================
// MILESTONE MANAGEMENT
// ============================================
function updateMilestoneField(projectId, idx, field, value) {
  const ms = DEMO_MILESTONES[projectId];
  if (ms && ms[idx]) {
    ms[idx][field] = value;
    // Auto-set completed_date when marking complete
    if (field === 'status' && value === 'complete' && !ms[idx].completed_date) {
      ms[idx].completed_date = new Date().toISOString().split('T')[0];
    }
    if (field === 'status' && value !== 'complete') {
      ms[idx].completed_date = null;
    }
    // Save to Supabase
    if (typeof saveMilestone === 'function') saveMilestone(ms[idx]);
  }
}

function cycleMilestoneStatus(projectId, idx) {
  const ms = DEMO_MILESTONES[projectId];
  if (!ms || !ms[idx]) return;
  const order = ['pending', 'in_progress', 'complete'];
  const current = order.indexOf(ms[idx].status);
  const next = order[(current + 1) % order.length];
  updateMilestoneField(projectId, idx, 'status', next);
  recalcProjectCompletion(projectId);
  switchProjectTab('milestones');
}

function addMilestone(projectId) {
  if (!DEMO_MILESTONES[projectId]) DEMO_MILESTONES[projectId] = [];
  const ms = DEMO_MILESTONES[projectId];
  ms.push({
    id: `${projectId}-${Date.now()}`,
    project_id: projectId,
    name: 'New Milestone',
    sort_order: ms.length,
    status: 'pending',
    target_date: '',
    completed_date: null,
    notes: '',
  });
  recalcProjectCompletion(projectId);
  switchProjectTab('milestones');
}

function removeMilestone(projectId, idx) {
  const ms = DEMO_MILESTONES[projectId];
  if (ms) {
    ms.splice(idx, 1);
    recalcProjectCompletion(projectId);
    switchProjectTab('milestones');
  }
}

function recalcProjectCompletion(projectId) {
  const ms = DEMO_MILESTONES[projectId];
  const p = DEMO_PROJECTS.find(proj => proj.id === projectId);
  if (ms && p) {
    const done = ms.filter(m => m.status === 'complete').length;
    p.completion_pct = ms.length > 0 ? Math.round((done / ms.length) * 100) : 0;
  }
}

// ============================================
// DUE DILIGENCE MANAGEMENT
// ============================================
function updateDDField(projectId, category, idx, field, value) {
  const checklist = DEMO_DD_CHECKLISTS[projectId];
  if (checklist && checklist[category] && checklist[category][idx]) {
    checklist[category][idx][field] = value;
  }
}

function cycleDDStatus(projectId, category, idx) {
  const checklist = DEMO_DD_CHECKLISTS[projectId];
  if (!checklist || !checklist[category] || !checklist[category][idx]) return;
  const order = ['not_confirmed', 'confirmed', 'na'];
  const current = order.indexOf(checklist[category][idx].status);
  checklist[category][idx].status = order[(current + 1) % order.length];
  switchProjectTab('due_diligence');
}

function exportDDPDF(projectId) {
  const p = DEMO_PROJECTS.find(proj => proj.id === projectId);
  const checklist = DEMO_DD_CHECKLISTS[projectId];
  if (!p || !checklist) return;
  const ddPct = getDDCompletion(projectId);

  const statusLabel = { confirmed: 'CONFIRMED', not_confirmed: 'NOT CONFIRMED', na: 'N/A' };
  const statusColor = { confirmed: '#22c55e', not_confirmed: '#ef4444', na: '#9ca3af' };

  const html = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<title>Due Diligence — ${p.name}</title>
<style>
  body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #1f2937; margin: 0; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 3px solid #1a2744; }
  .logo h1 { font-size: 24px; font-weight: 800; color: #1a2744; margin: 0; }
  .logo p { font-size: 11px; color: #6b7280; margin: 2px 0; }
  .title { text-align: right; }
  .title h2 { font-size: 18px; color: #f97316; margin: 0; }
  .title p { font-size: 11px; color: #6b7280; margin: 2px 0; }
  .project-info { margin-bottom: 20px; font-size: 12px; }
  .project-info span { margin-right: 20px; }
  .progress-summary { margin-bottom: 24px; padding: 12px 16px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; display: flex; align-items: center; gap: 12px; }
  .progress-bar-pdf { flex: 1; height: 10px; background: #e5e7eb; border-radius: 5px; overflow: hidden; }
  .progress-fill-pdf { height: 100%; border-radius: 5px; }
  .category { margin-bottom: 20px; }
  .cat-header { font-size: 14px; font-weight: 700; color: #1a2744; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  th { text-align: left; padding: 6px 8px; font-size: 10px; text-transform: uppercase; color: #6b7280; background: #f3f4f6; }
  td { padding: 6px 8px; border-bottom: 1px solid #f3f4f6; font-size: 12px; }
  .status { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; }
  .footer { margin-top: 32px; text-align: center; font-size: 10px; color: #9ca3af; }
  @media print { body { padding: 20px; } }
</style>
</head><body>
  <div class="header">
    <div class="logo">
      <h1>TRIVEX GROUP CORP</h1>
      <p>Commercial Construction &middot; Franchise Fit-Outs</p>
    </div>
    <div class="title">
      <h2>DUE DILIGENCE REPORT</h2>
      <p>Generated: ${new Date().toISOString().split('T')[0]}</p>
    </div>
  </div>

  <div class="project-info">
    <span><strong>Project:</strong> ${p.name}</span>
    <span><strong>Client:</strong> ${p.client_brand}</span>
    <span><strong>Location:</strong> ${p.city}</span>
  </div>

  <div class="progress-summary">
    <span style="font-weight:600;">Completion: ${ddPct}%</span>
    <div class="progress-bar-pdf"><div class="progress-fill-pdf" style="width:${ddPct}%;background:${ddPct === 100 ? '#22c55e' : '#3b82f6'};"></div></div>
  </div>

  ${Object.entries(checklist).map(([cat, items]) => `
    <div class="category">
      <div class="cat-header">${cat}</div>
      <table>
        <thead><tr><th>Item</th><th>Status</th><th>Assigned To</th><th>Notes</th></tr></thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>${item.name}</td>
              <td><span class="status" style="background:${statusColor[item.status]}20;color:${statusColor[item.status]};">${statusLabel[item.status]}</span></td>
              <td>${item.assigned_to || '—'}</td>
              <td style="color:#6b7280;">${item.notes || '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `).join('')}

  <div class="footer">
    Trivex Group Corp &middot; Burlington, ON &middot; Generated via XOS
  </div>
</body></html>`;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => printWindow.print();
}

// ============================================
// ============================================
// BIDDING MANAGEMENT
// ============================================
function createBidPackage(projectId) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'bid-pkg-modal';
  overlay.innerHTML = `
    <div class="modal-card" style="max-width:520px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3><i class="fas fa-gavel" style="color:var(--orange);margin-right:8px;"></i>New Bid Package</h3>
        <button class="btn-icon" onclick="document.getElementById('bid-pkg-modal').remove()" style="color:var(--text-muted);font-size:18px;"><i class="fas fa-times"></i></button>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="form-group">
          <label class="form-label">Trade</label>
          <select id="bp-trade" class="form-input-styled">
            ${BID_TRADES.map(t => '<option>' + t + '</option>').join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Scope of Work</label>
          <textarea id="bp-scope" class="form-input-styled" rows="3" placeholder="Describe the full scope — what's included, specs, quantities..."></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Bid Deadline</label>
          <input id="bp-deadline" type="date" class="form-input-styled">
        </div>
        <div class="section-title" style="margin-top:8px;margin-bottom:0;">Invite Subcontractors</div>
        <div id="bp-sub-list" style="display:flex;flex-direction:column;gap:6px;max-height:200px;overflow-y:auto;">
          ${DEMO_SUBS.map(s => `
            <label style="display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid var(--card-border);border-radius:var(--radius);cursor:pointer;">
              <input type="checkbox" value="${s.id}" class="bp-sub-check">
              <div style="flex:1;">
                <div style="font-size:13px;font-weight:500;">${s.company}</div>
                <div class="text-muted" style="font-size:11px;">${s.trade} · ${s.contact} · ${s.phone}</div>
              </div>
            </label>
          `).join('')}
        </div>
        <button class="btn btn-accent btn-full btn-lg" onclick="saveBidPackage('${projectId}')"><i class="fas fa-paper-plane"></i> Create & Send Invitations</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function saveBidPackage(projectId) {
  const scope = document.getElementById('bp-scope').value.trim();
  if (!scope) { alert('Enter the scope of work.'); return; }

  const selected = [];
  document.querySelectorAll('.bp-sub-check:checked').forEach(cb => selected.push(cb.value));

  if (!DEMO_BID_PACKAGES[projectId]) DEMO_BID_PACKAGES[projectId] = [];
  DEMO_BID_PACKAGES[projectId].push({
    id: nextBidPackageId(),
    trade: document.getElementById('bp-trade').value,
    scope,
    status: 'open',
    created_at: new Date().toISOString().split('T')[0],
    deadline: document.getElementById('bp-deadline').value || '',
    invited: selected,
    bids: [],
    awarded_to: null,
    awarded_amount: null,
  });

  document.getElementById('bid-pkg-modal').remove();
  switchProjectTab('bidding');
}

function inviteSubsToBid(projectId, bpId) {
  const pkgs = DEMO_BID_PACKAGES[projectId] || [];
  const bp = pkgs.find(b => b.id === bpId);
  if (!bp) return;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'invite-subs-modal';

  const subsHTML = DEMO_SUBS.filter(s => !bp.invited.includes(s.id)).map(s => `
    <label style="display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid var(--card-border);border-radius:var(--radius);cursor:pointer;">
      <input type="checkbox" value="${s.id}" class="invite-sub-check">
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:500;">${s.company}</div>
        <div class="text-muted" style="font-size:11px;">${s.trade} · ${s.contact}</div>
      </div>
    </label>
  `).join('');

  overlay.innerHTML = `
    <div class="modal-card" style="max-width:460px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3>Invite More Subs</h3>
        <button class="btn-icon" onclick="document.getElementById('invite-subs-modal').remove()" style="color:var(--text-muted);font-size:18px;"><i class="fas fa-times"></i></button>
      </div>
      <div style="font-size:13px;margin-bottom:12px;"><strong>${bp.trade}</strong> — ${bp.scope.substring(0, 80)}...</div>
      <div style="display:flex;flex-direction:column;gap:6px;max-height:300px;overflow-y:auto;margin-bottom:16px;">
        ${subsHTML || '<div class="text-muted" style="text-align:center;padding:16px;">All subcontractors already invited.</div>'}
      </div>
      <button class="btn btn-accent btn-full" onclick="sendSubInvites('${projectId}','${bpId}')"><i class="fas fa-paper-plane"></i> Send Invitations</button>
    </div>
  `;
  document.body.appendChild(overlay);
}

function sendSubInvites(projectId, bpId) {
  const pkgs = DEMO_BID_PACKAGES[projectId] || [];
  const bp = pkgs.find(b => b.id === bpId);
  if (!bp) return;

  document.querySelectorAll('.invite-sub-check:checked').forEach(cb => {
    if (!bp.invited.includes(cb.value)) bp.invited.push(cb.value);
  });

  document.getElementById('invite-subs-modal').remove();
  switchProjectTab('bidding');
}

function awardBid(projectId, bpId, subId) {
  const pkgs = DEMO_BID_PACKAGES[projectId] || [];
  const bp = pkgs.find(b => b.id === bpId);
  if (!bp) return;

  const bid = bp.bids.find(b => b.sub_id === subId);
  const sub = DEMO_SUBS.find(s => s.id === subId);
  if (!bid || !sub) return;

  if (!confirm('Award ' + bp.trade + ' to ' + sub.company + ' for ' + formatCAD(bid.amount) + '?')) return;

  // Update bid package
  bp.status = 'awarded';
  bp.awarded_to = subId;
  bp.awarded_amount = bid.amount;
  bp.bids.forEach(b => { b.status = b.sub_id === subId ? 'awarded' : 'not_awarded'; });

  // Auto-create subcontractor assignment on the project
  if (!DEMO_SUB_ASSIGNMENTS[projectId]) DEMO_SUB_ASSIGNMENTS[projectId] = [];
  const existing = DEMO_SUB_ASSIGNMENTS[projectId].find(a => a.sub_id === subId);
  if (!existing) {
    DEMO_SUB_ASSIGNMENTS[projectId].push({
      sub_id: subId,
      contract_amount: bid.amount,
      scope: bp.scope,
      amount_paid: 0,
      payments: [],
      notes: [{ text: 'Awarded via bid package — ' + bp.trade + ' — ' + formatCAD(bid.amount), date: new Date().toISOString().split('T')[0] }],
    });
  }

  switchProjectTab('bidding');
}

function simulateBid(projectId, bpId) {
  const pkgs = DEMO_BID_PACKAGES[projectId] || [];
  const bp = pkgs.find(b => b.id === bpId);
  if (!bp || bp.invited.length === 0) { alert('Invite subcontractors first.'); return; }

  // Pick a random invited sub that hasn't bid yet
  const unbid = bp.invited.filter(sid => !bp.bids.find(b => b.sub_id === sid));
  if (unbid.length === 0) { alert('All invited subs have already bid.'); return; }
  const subId = unbid[0];
  const sub = DEMO_SUBS.find(s => s.id === subId);

  // Generate a random realistic bid
  const basePrices = { 'Electrical': 22000, 'Plumbing': 20000, 'HVAC': 30000, 'Framing': 15000, 'Drywall': 13000, 'Flooring': 16000, 'Millwork': 24000, 'Signage': 12000, 'Painting': 8000 };
  const base = basePrices[bp.trade] || 15000;
  const variation = Math.round(base * (0.85 + Math.random() * 0.3));

  bp.bids.push({
    sub_id: subId,
    amount: variation,
    timeline: Math.floor(Math.random() * 3 + 1) + ' weeks',
    notes: 'All labour and materials included. Start available within 2 weeks.',
    submitted_at: new Date().toISOString().split('T')[0],
    status: 'submitted',
  });

  switchProjectTab('bidding');
}

// ============================================
// SUBCONTRACTOR MANAGEMENT
// ============================================
function assignSubToProject(projectId) {
  const select = document.getElementById('assign-sub-select');
  if (!select) return;
  const subId = select.value;
  if (!subId) return;

  if (!DEMO_SUB_ASSIGNMENTS[projectId]) DEMO_SUB_ASSIGNMENTS[projectId] = [];
  if (DEMO_SUB_ASSIGNMENTS[projectId].find(a => a.sub_id === subId)) return;

  const sub = DEMO_SUBS.find(s => s.id === subId);
  DEMO_SUB_ASSIGNMENTS[projectId].push({
    sub_id: subId,
    contract_amount: 0,
    scope: '',
    amount_paid: 0,
    payments: [],
    notes: [],
  });

  // Open edit modal for the new assignment
  showSubEditModal(projectId, subId, sub);
}

function showSubEditModal(projectId, subId, sub) {
  const assignments = DEMO_SUB_ASSIGNMENTS[projectId] || [];
  const a = assignments.find(x => x.sub_id === subId);
  if (!a || !sub) return;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'sub-modal';
  overlay.innerHTML = `
    <div class="modal-card" style="max-width:480px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3>${sub.company}</h3>
        <button class="btn-icon" onclick="document.getElementById('sub-modal').remove()" style="color:var(--text-muted);font-size:18px;"><i class="fas fa-times"></i></button>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="form-group">
          <label class="form-label">Scope of Work</label>
          <textarea id="sub-scope" class="form-input-styled" rows="2">${a.scope}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Contract Amount (CAD)</label>
          <input id="sub-contract" class="form-input-styled" type="number" step="0.01" value="${a.contract_amount}" inputmode="decimal">
        </div>
        <button class="btn btn-accent btn-full" onclick="saveSubEdit('${projectId}','${subId}')"><i class="fas fa-check"></i> Save</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function saveSubEdit(projectId, subId) {
  const assignments = DEMO_SUB_ASSIGNMENTS[projectId] || [];
  const a = assignments.find(x => x.sub_id === subId);
  if (!a) return;
  a.scope = document.getElementById('sub-scope').value;
  a.contract_amount = parseFloat(document.getElementById('sub-contract').value) || 0;
  document.getElementById('sub-modal').remove();
  switchProjectTab('subcontractors');
}

function paySubModal(projectId, subId, owing) {
  const sub = DEMO_SUBS.find(s => s.id === subId);
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'sub-pay-modal';
  overlay.innerHTML = `
    <div class="modal-card" style="max-width:420px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3>Pay ${sub ? sub.company : 'Sub'}</h3>
        <button class="btn-icon" onclick="document.getElementById('sub-pay-modal').remove()" style="color:var(--text-muted);font-size:18px;"><i class="fas fa-times"></i></button>
      </div>
      <p class="text-muted" style="font-size:13px;margin-bottom:16px;">Balance owing: <strong style="color:var(--red);">${formatCAD(owing)}</strong></p>
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="form-group">
          <label class="form-label">Amount (CAD)</label>
          <input id="sub-pay-amount" class="form-input-styled" type="number" step="0.01" value="${owing.toFixed(2)}" inputmode="decimal">
        </div>
        <div class="form-group">
          <label class="form-label">Date</label>
          <input id="sub-pay-date" class="form-input-styled" type="date" value="${new Date().toISOString().split('T')[0]}">
        </div>
        <button class="btn btn-accent btn-full btn-lg" onclick="recordSubPayment('${projectId}','${subId}')"><i class="fas fa-check"></i> Record Payment</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function recordSubPayment(projectId, subId) {
  const assignments = DEMO_SUB_ASSIGNMENTS[projectId] || [];
  const a = assignments.find(x => x.sub_id === subId);
  if (!a) return;
  const amount = parseFloat(document.getElementById('sub-pay-amount').value) || 0;
  const date = document.getElementById('sub-pay-date').value;
  if (amount <= 0) return;
  a.payments.push({ amount, date });
  a.amount_paid += amount;
  document.getElementById('sub-pay-modal').remove();
  switchProjectTab('subcontractors');
}

function addSubNote(projectId, subId) {
  const note = prompt('Enter a note for this subcontractor:');
  if (!note || !note.trim()) return;
  const assignments = DEMO_SUB_ASSIGNMENTS[projectId] || [];
  const a = assignments.find(x => x.sub_id === subId);
  if (!a) return;
  if (!a.notes) a.notes = [];
  a.notes.push({ text: note.trim(), date: new Date().toISOString().split('T')[0] });
  switchProjectTab('subcontractors');
}

// ============================================
// CHANGE ORDER MANAGEMENT
// ============================================
function newChangeOrder(projectId) {
  if (!DEMO_CHANGE_ORDERS[projectId]) DEMO_CHANGE_ORDERS[projectId] = [];

  const co = {
    id: 'co-' + Date.now(),
    number: nextCONumber(projectId),
    date: new Date().toISOString().split('T')[0],
    status: 'draft',
    description: '',
    reason: 'Client Request',
    items: [{ description: '', qty: 1, unit: 'lot', unit_cost: 0 }],
    revised_completion: null,
  };
  DEMO_CHANGE_ORDERS[projectId].push(co);
  showCOEditor(projectId, co.id);
}

function editChangeOrder(projectId, coId) {
  showCOEditor(projectId, coId);
}

function showCOEditor(projectId, coId) {
  const cos = DEMO_CHANGE_ORDERS[projectId] || [];
  const co = cos.find(c => c.id === coId);
  if (!co) return;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'co-modal';
  overlay.innerHTML = `
    <div class="modal-card" style="max-width:600px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3><i class="fas fa-exchange-alt" style="color:var(--orange);margin-right:8px;"></i>${co.number || 'New Change Order'}</h3>
        <button class="btn-icon" onclick="document.getElementById('co-modal').remove()" style="color:var(--text-muted);font-size:18px;"><i class="fas fa-times"></i></button>
      </div>

      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="form-group">
          <label class="form-label">Description of Scope Change</label>
          <textarea id="co-desc" class="form-input-styled" rows="3" placeholder="Describe the change...">${co.description}</textarea>
        </div>
        <div style="display:flex;gap:12px;">
          <div class="form-group" style="flex:1;">
            <label class="form-label">Reason</label>
            <select id="co-reason" class="form-input-styled">
              ${['Client Request', 'Site Condition', 'Design Change', 'Other'].map(r =>
                `<option ${r === co.reason ? 'selected' : ''}>${r}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group" style="flex:1;">
            <label class="form-label">Date</label>
            <input id="co-date" type="date" class="form-input-styled" value="${co.date}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Revised Completion Date (if affected)</label>
          <input id="co-revised" type="date" class="form-input-styled" value="${co.revised_completion || ''}">
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">
          <label class="form-label" style="margin:0;">Line Items</label>
          <button class="btn btn-outline btn-sm" onclick="addCOItemRow()"><i class="fas fa-plus"></i> Add Row</button>
        </div>
        <div id="co-items-container">
          ${co.items.map((item, idx) => coItemRow(item, idx)).join('')}
        </div>

        <div id="co-total" style="text-align:right;font-size:15px;font-weight:700;padding:8px 0;border-top:1px solid var(--card-border);">
          Net Impact: ${formatCAD(getCOTotal(co))}
        </div>

        <button class="btn btn-accent btn-full btn-lg" onclick="saveCOFromModal('${projectId}','${coId}')"><i class="fas fa-check"></i> Save Change Order</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function coItemRow(item, idx) {
  return `
    <div class="co-item-row" style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
      <input class="form-input-styled co-item-desc" value="${item.description}" placeholder="Description" style="flex:2;padding:6px 10px;font-size:13px;">
      <input class="form-input-styled co-item-qty" type="number" value="${item.qty}" style="width:60px;padding:6px 8px;font-size:13px;text-align:right;">
      <input class="form-input-styled co-item-unit" value="${item.unit}" style="width:60px;padding:6px 8px;font-size:13px;">
      <input class="form-input-styled co-item-cost" type="number" step="0.01" value="${item.unit_cost}" style="width:100px;padding:6px 8px;font-size:13px;text-align:right;">
      <button class="btn-icon" onclick="this.parentElement.remove(); updateCOTotal()" style="color:var(--red);"><i class="fas fa-trash" style="font-size:12px;"></i></button>
    </div>`;
}

function addCOItemRow() {
  const container = document.getElementById('co-items-container');
  const idx = container.children.length;
  container.insertAdjacentHTML('beforeend', coItemRow({ description: '', qty: 1, unit: 'lot', unit_cost: 0 }, idx));
}

function updateCOTotal() {
  const rows = document.querySelectorAll('.co-item-row');
  let total = 0;
  rows.forEach(row => {
    const qty = parseFloat(row.querySelector('.co-item-qty').value) || 0;
    const cost = parseFloat(row.querySelector('.co-item-cost').value) || 0;
    total += qty * cost;
  });
  const el = document.getElementById('co-total');
  if (el) el.textContent = 'Net Impact: ' + formatCAD(total);
}

function saveCOFromModal(projectId, coId) {
  const cos = DEMO_CHANGE_ORDERS[projectId] || [];
  const co = cos.find(c => c.id === coId);
  if (!co) return;

  co.description = document.getElementById('co-desc').value;
  co.reason = document.getElementById('co-reason').value;
  co.date = document.getElementById('co-date').value;
  co.revised_completion = document.getElementById('co-revised').value || null;

  // Read line items from DOM
  const rows = document.querySelectorAll('.co-item-row');
  co.items = [];
  rows.forEach(row => {
    co.items.push({
      description: row.querySelector('.co-item-desc').value,
      qty: parseFloat(row.querySelector('.co-item-qty').value) || 1,
      unit: row.querySelector('.co-item-unit').value || 'lot',
      unit_cost: parseFloat(row.querySelector('.co-item-cost').value) || 0,
    });
  });

  document.getElementById('co-modal').remove();
  switchProjectTab('change_orders');
}

function updateCOStatus(projectId, coId, status) {
  const cos = DEMO_CHANGE_ORDERS[projectId] || [];
  const co = cos.find(c => c.id === coId);
  if (!co) return;
  co.status = status;

  // If approved, recalc project budget display (budget stays as original, revised shown)
  switchProjectTab('change_orders');
}

// ============================================
// CLIENT PORTAL
// ============================================
pageRenderers['client-portal'] = () => {
  const pid = getPortalProjectId();
  const p = DEMO_PROJECTS.find(proj => proj.id === pid) || DEMO_PROJECTS[0];
  const milestones = DEMO_MILESTONES[p.id] || [];
  const messages = DEMO_CLIENT_MESSAGES[p.id] || [];
  const changeOrders = DEMO_CHANGE_ORDERS[p.id] || [];
  const projectInvoices = DEMO_INVOICES.filter(inv => inv.project_id === p.id);
  const activity = DEMO_CLIENT_ACTIVITY[p.id] || [];
  const pendingCOs = changeOrders.filter(c => c.status === 'sent').length;
  const tab = window._portalTab || 'overview';

  // Days to handover
  const today = new Date('2026-03-28');
  const handover = p.target_handover ? new Date(p.target_handover) : null;
  const daysToHandover = handover ? Math.round((handover - today) / (1000 * 60 * 60 * 24)) : null;

  // Rollout for multi-project brands
  const clientBrand = currentUser.brand || '';
  const brandProjects = clientBrand ? DEMO_PROJECTS.filter(proj => proj.client_brand === clientBrand) : [];
  const isRollout = brandProjects.length > 1;

  // Breadcrumb
  document.getElementById('breadcrumb').textContent = p.name;

  let content = '';

  // ---- OVERVIEW TAB ----
  if (tab === 'overview') {
    content = `
      <!-- Rollout switcher for multi-project clients -->
      ${isRollout ? `
      <div class="stat-card mb-20" style="padding:12px 16px;">
        <div style="display:flex;align-items:center;gap:8px;overflow-x:auto;">
          ${brandProjects.map(proj => `
            <button class="btn ${proj.id === p.id ? 'btn-accent' : 'btn-outline'} btn-sm" onclick="window._portalProjectId='${proj.id}'; switchPortalTab('overview');" style="white-space:nowrap;">
              ${proj.name.split('—')[1]?.trim() || proj.name} · ${proj.completion_pct}%
            </button>
          `).join('')}
        </div>
      </div>` : ''}

      <!-- Summary stat cards -->
      <div class="stats-grid">
        ${statCard('Status', formatStatus(p.status), 'fas fa-flag', p.status === 'active' ? 'var(--green)' : p.status === 'punch_list' ? 'var(--orange)' : 'var(--blue)', p.city)}
        ${statCard('Completion', p.completion_pct + '%', 'fas fa-chart-pie', 'var(--orange)', milestones.filter(m => m.status === 'complete').length + '/' + milestones.length + ' phases')}
        ${statCard('Handover', daysToHandover !== null ? (daysToHandover > 0 ? daysToHandover + ' days' : daysToHandover === 0 ? 'Today' : 'Overdue') : 'TBD', 'fas fa-calendar-check', daysToHandover !== null && daysToHandover <= 0 ? 'var(--red)' : 'var(--blue)', p.target_handover || 'Not set')}
        ${statCard('Action Items', pendingCOs, 'fas fa-bell', pendingCOs > 0 ? 'var(--red)' : 'var(--green)', pendingCOs > 0 ? 'Requires your response' : 'All clear')}
      </div>

      <!-- Construction Timeline -->
      <div class="stat-card mb-20">
        <div class="section-title" style="margin-bottom:16px;">Construction Timeline</div>
        <div style="display:flex;gap:3px;align-items:center;margin-bottom:12px;">
          ${milestones.map((m, i) => {
            const color = m.status === 'complete' ? 'var(--green)' : m.status === 'in_progress' ? 'var(--orange)' : 'var(--card-border)';
            return `<div style="flex:1;height:12px;border-radius:6px;background:${color};cursor:pointer;" title="${m.name} — ${formatStatus(m.status)}" onclick="switchPortalTab('milestones')"></div>`;
          }).join('')}
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);">
          <span>${milestones[0]?.name || ''}</span>
          <span>${milestones[milestones.length - 1]?.name || ''}</span>
        </div>
      </div>

      ${pendingCOs > 0 ? `
      <div class="stat-card mb-20" style="border-left:3px solid var(--red);background:var(--red-bg);">
        <div style="display:flex;align-items:center;gap:10px;">
          <i class="fas fa-exclamation-circle" style="color:var(--red);font-size:18px;"></i>
          <div>
            <div style="font-size:14px;font-weight:600;">${pendingCOs} change order${pendingCOs > 1 ? 's' : ''} awaiting your approval</div>
            <div class="text-muted" style="font-size:12px;cursor:pointer;text-decoration:underline;" onclick="switchPortalTab('changes')">Review now</div>
          </div>
        </div>
      </div>` : ''}

      <!-- Recent Activity -->
      <div class="stat-card">
        <div class="section-title" style="margin-bottom:12px;">Recent Activity</div>
        ${activity.length > 0 ? `
        <ul class="activity-list">
          ${activity.slice(0, 10).map(a => `
            <li class="activity-item">
              <div class="activity-dot" style="background:${a.color};"></div>
              <div><div style="font-size:13px;">${a.text}</div><div class="activity-time">${a.date}</div></div>
            </li>
          `).join('')}
        </ul>` : '<div class="text-muted" style="text-align:center;padding:20px;font-size:13px;">No recent activity.</div>'}
      </div>
    `;
  }

  // ---- MILESTONES TAB ----
  if (tab === 'milestones') {
    content = `
      <div class="stat-card mb-20">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <div class="section-title" style="margin:0;">Construction Phases</div>
          <div style="font-size:24px;font-weight:700;color:var(--orange);">${p.completion_pct}%</div>
        </div>

        <div style="display:flex;flex-direction:column;gap:10px;">
          ${milestones.map((m, i) => {
            const icon = m.status === 'complete' ? 'fas fa-check-circle' : m.status === 'in_progress' ? 'fas fa-circle-notch fa-spin' : 'far fa-circle';
            const iconColor = m.status === 'complete' ? 'var(--green)' : m.status === 'in_progress' ? 'var(--orange)' : 'var(--text-light)';
            const signoff = DEMO_SIGNOFFS[m.id];
            const needsSignoff = m.status === 'complete' && !signoff;

            return `
            <div style="border:1px solid ${m.status === 'in_progress' ? 'rgba(249,115,22,0.3)' : 'var(--card-border)'};border-radius:var(--radius);padding:14px;${m.status === 'in_progress' ? 'background:var(--orange-light);' : ''}">
              <div style="display:flex;align-items:flex-start;gap:12px;">
                <i class="${icon}" style="color:${iconColor};font-size:18px;margin-top:2px;"></i>
                <div style="flex:1;">
                  <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
                    <div>
                      <div style="font-size:14px;font-weight:${m.status === 'pending' ? '400' : '600'};${m.status === 'pending' ? 'color:var(--text-muted);' : ''}">${m.name}</div>
                      <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">
                        Target: ${m.target_date || 'TBD'}
                        ${m.completed_date ? ` · Completed: ${m.completed_date}` : ''}
                      </div>
                    </div>
                    <span class="status-badge status-${m.status}">${formatStatus(m.status)}</span>
                  </div>

                  ${signoff ? `
                  <div style="margin-top:8px;padding:8px 12px;background:var(--green-bg);border-radius:var(--radius);border:1px solid rgba(34,197,94,0.2);display:flex;align-items:center;gap:8px;">
                    <i class="fas fa-stamp" style="color:var(--green);font-size:14px;"></i>
                    <span style="font-size:12px;color:var(--green);font-weight:600;">Approved by ${signoff.signed_by} on ${signoff.signed_at}</span>
                  </div>` : ''}

                  ${needsSignoff ? `
                  <button class="btn btn-accent btn-sm" style="margin-top:10px;" onclick="signOffMilestone('${p.id}','${m.id}')">
                    <i class="fas fa-stamp"></i> Sign Off
                  </button>` : ''}
                </div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    `;
  }

  // ---- CHANGE REQUESTS TAB ----
  if (tab === 'changes') {
    const clientCOs = changeOrders.filter(c => c.status === 'sent');
    const clientCRs = DEMO_CHANGE_REQUESTS[p.id] || [];
    const allCOs = changeOrders;

    // Check if viewing a specific CR detail
    const viewingCR = window._viewingCR;

    if (viewingCR) {
      const cr = clientCRs.find(c => c.id === viewingCR);
      if (cr) {
        const statusColors = { submitted: 'var(--blue)', under_review: 'var(--purple)', quoted: 'var(--orange)', approved: 'var(--green)', in_progress: 'var(--blue)', complete: 'var(--green)', declined: 'var(--red)' };
        content = `
          <div style="margin-bottom:16px;">
            <button class="btn btn-outline btn-sm" onclick="window._viewingCR=null; switchPortalTab('changes');"><i class="fas fa-arrow-left"></i> Back</button>
          </div>

          <div class="stat-card mb-20">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
              <div>
                <div style="font-size:11px;color:var(--text-muted);font-weight:600;">${cr.number}</div>
                <div style="font-size:17px;font-weight:700;color:var(--navy);">${cr.title}</div>
              </div>
              <span class="status-badge status-${cr.status}" style="font-size:12px;padding:5px 12px;">${formatStatus(cr.status)}</span>
            </div>

            <div style="font-size:13px;line-height:1.6;margin-bottom:16px;padding:12px;background:var(--page-bg);border-radius:var(--radius);">${cr.description}</div>

            <div style="display:flex;gap:20px;font-size:12px;flex-wrap:wrap;margin-bottom:16px;">
              ${cr.location ? `<div><span class="text-muted">Location:</span> ${cr.location}</div>` : ''}
              <div><span class="text-muted">Priority:</span> <strong>${cr.priority}</strong></div>
              <div><span class="text-muted">Submitted:</span> ${cr.submitted_at}</div>
            </div>

            ${cr.status === 'quoted' && cr.quote_amount ? `
            <div style="border:2px solid var(--orange);border-radius:var(--radius);padding:16px;margin-bottom:16px;background:var(--orange-light);">
              <div style="font-size:14px;font-weight:700;margin-bottom:8px;"><i class="fas fa-file-invoice-dollar" style="color:var(--orange);margin-right:6px;"></i>Trivex Quote</div>
              <div style="display:flex;gap:20px;font-size:13px;margin-bottom:12px;">
                <div><span class="text-muted">Cost:</span> <strong style="color:var(--orange);">${formatCAD(cr.quote_amount)}</strong></div>
                ${cr.quote_timeline ? `<div><span class="text-muted">Timeline impact:</span> <strong>${cr.quote_timeline}</strong></div>` : ''}
              </div>
              <div style="display:flex;gap:8px;">
                <button class="btn btn-accent btn-full" onclick="approveChangeRequest('${p.id}','${cr.id}')"><i class="fas fa-check"></i> Approve Quote</button>
                <button class="btn btn-outline btn-full" onclick="declineChangeRequest('${p.id}','${cr.id}')"><i class="fas fa-times"></i> Decline</button>
              </div>
            </div>` : ''}
          </div>

          <!-- Comments thread -->
          <div class="stat-card">
            <div class="section-title" style="margin-bottom:12px;">Discussion</div>
            <div style="display:flex;gap:8px;margin-bottom:16px;">
              <input id="cr-comment-input" class="form-input-styled" placeholder="Add a comment..." style="flex:1;">
              <button class="btn btn-accent" onclick="addCRComment('${p.id}','${cr.id}')"><i class="fas fa-paper-plane"></i></button>
            </div>
            ${(cr.comments || []).length > 0 ? cr.comments.map(c => `
              <div style="padding:10px 14px;border-radius:var(--radius);margin-bottom:8px;background:${c.role === 'client' ? 'var(--orange-light)' : 'var(--page-bg)'};">
                <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                  <span style="font-size:12px;font-weight:600;">${c.author}</span>
                  <span style="font-size:11px;color:var(--text-muted);">${c.date}</span>
                </div>
                <div style="font-size:13px;line-height:1.5;">${c.text}</div>
              </div>
            `).join('') : '<div class="text-muted" style="text-align:center;padding:16px;font-size:13px;">No comments yet.</div>'}
          </div>
        `;
      } else {
        window._viewingCR = null;
      }
    }

    if (!viewingCR) {
      content = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:8px;">
          <div class="section-title" style="margin:0;">Change Requests & Orders</div>
          <button class="btn btn-accent btn-sm" onclick="showNewCRModal('${p.id}')"><i class="fas fa-plus"></i> New Change Request</button>
        </div>

        <!-- Pending COs awaiting approval -->
        ${clientCOs.length > 0 ? `
        <div class="section-title" style="margin-bottom:8px;font-size:12px;color:var(--red);"><i class="fas fa-exclamation-circle" style="margin-right:4px;"></i>Awaiting Your Approval</div>
        ${clientCOs.map(co => {
          const coTotal = getCOTotal(co);
          return `
          <div class="stat-card mb-20" style="border-left:3px solid var(--orange);">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;flex-wrap:wrap;gap:8px;">
              <div>
                <div style="font-size:14px;font-weight:600;">${co.number} — ${co.description}</div>
                <div class="text-muted" style="font-size:12px;">${co.reason} · ${co.date}</div>
              </div>
              <span style="font-size:15px;font-weight:700;color:var(--orange);">${coTotal >= 0 ? '+' : ''}${formatCAD(coTotal)}</span>
            </div>
            <div style="display:flex;gap:8px;">
              <button class="btn btn-accent btn-sm btn-full" onclick="updateCOStatus('${p.id}','${co.id}','approved'); switchPortalTab('changes');"><i class="fas fa-check"></i> Approve</button>
              <button class="btn btn-outline btn-sm btn-full" onclick="updateCOStatus('${p.id}','${co.id}','declined'); switchPortalTab('changes');"><i class="fas fa-times"></i> Decline</button>
            </div>
          </div>`;
        }).join('')}` : ''}

        <!-- Your Change Requests -->
        ${clientCRs.length > 0 ? `
        <div class="section-title" style="margin-bottom:8px;margin-top:16px;">Your Requests</div>
        <div class="data-table-container mb-20">
          <table class="data-table">
            <thead><tr><th>Request #</th><th>Title</th><th>Priority</th><th>Submitted</th><th>Quote</th><th>Status</th></tr></thead>
            <tbody>
              ${clientCRs.map(cr => `
                <tr style="cursor:pointer;" onclick="window._viewingCR='${cr.id}'; switchPortalTab('changes');">
                  <td><strong>${cr.number}</strong></td>
                  <td>${cr.title}</td>
                  <td><span class="tag">${cr.priority}</span></td>
                  <td>${cr.submitted_at}</td>
                  <td>${cr.quote_amount ? formatCAD(cr.quote_amount) : '—'}</td>
                  <td><span class="status-badge status-${cr.status}">${formatStatus(cr.status)}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>` : ''}

        <!-- Trivex Change Orders -->
        ${allCOs.length > 0 ? `
        <div class="section-title" style="margin-bottom:8px;margin-top:16px;">Trivex Change Orders</div>
        <div class="data-table-container">
          <table class="data-table">
            <thead><tr><th>CO #</th><th>Description</th><th>Date</th><th>Impact</th><th>Status</th></tr></thead>
            <tbody>
              ${allCOs.map(co => {
                const coTotal = getCOTotal(co);
                return `<tr>
                  <td><strong>${co.number}</strong></td>
                  <td>${co.description}</td>
                  <td>${co.date}</td>
                  <td style="font-weight:600;color:${coTotal >= 0 ? 'var(--orange)' : 'var(--green)'};">${coTotal >= 0 ? '+' : ''}${formatCAD(coTotal)}</td>
                  <td><span class="status-badge status-${co.status}">${formatStatus(co.status)}</span></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>` : ''}

        ${clientCRs.length === 0 && allCOs.length === 0 && clientCOs.length === 0 ? `
        <div class="empty-state">
          <i class="fas fa-exchange-alt"></i>
          <h3>No change requests or orders</h3>
          <p>Submit a change request if you need any modifications to the project scope.</p>
        </div>` : ''}
      `;
    }
  }

  // ---- INVOICES TAB ----
  if (tab === 'invoices') {
    const totalBilled = projectInvoices.reduce((s, inv) => s + inv.amount + inv.amount * (inv.tax_rate || 13) / 100, 0);
    const totalPaidClient = projectInvoices.reduce((s, inv) => s + inv.amount_paid, 0);
    const totalOwingClient = totalBilled - totalPaidClient;
    const overdueInvs = projectInvoices.filter(inv => inv.status !== 'paid' && inv.due_date < '2026-03-28');

    content = `
      <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
        ${statCard('Total Billed', formatCAD(totalBilled), 'fas fa-file-invoice-dollar', 'var(--blue)', projectInvoices.length + ' invoices')}
        ${statCard('Paid', formatCAD(totalPaidClient), 'fas fa-check-circle', 'var(--green)', totalBilled > 0 ? Math.round(totalPaidClient / totalBilled * 100) + '% of total' : '')}
        ${statCard('Outstanding', formatCAD(totalOwingClient), 'fas fa-exclamation-circle', totalOwingClient > 0 ? 'var(--red)' : 'var(--green)', overdueInvs.length > 0 ? overdueInvs.length + ' overdue' : 'None overdue')}
      </div>

      ${overdueInvs.length > 0 ? `
      <div style="background:var(--red-bg);border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius);padding:12px 16px;margin-bottom:20px;display:flex;align-items:center;gap:10px;">
        <i class="fas fa-exclamation-triangle" style="color:var(--red);font-size:16px;"></i>
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--red);">${overdueInvs.length} overdue invoice${overdueInvs.length > 1 ? 's' : ''}</div>
          <div style="font-size:12px;color:var(--text-muted);">Please arrange payment at your earliest convenience.</div>
        </div>
      </div>` : ''}

      ${projectInvoices.length > 0 ? `
      <div class="data-table-container">
        <table class="data-table">
          <thead><tr><th>Invoice #</th><th>Type</th><th>Amount (incl. HST)</th><th>Issued</th><th>Due</th><th>Status</th><th></th></tr></thead>
          <tbody>
            ${projectInvoices.map(inv => {
              const taxAmt = inv.amount * (inv.tax_rate || 13) / 100;
              const total = inv.amount + taxAmt;
              const balance = total - inv.amount_paid;
              const isOverdue = inv.status !== 'paid' && inv.due_date < '2026-03-28';
              const isAcknowledged = inv.acknowledged_by;
              const clientStatus = inv.status === 'paid' ? 'paid' : isOverdue ? 'overdue' : isAcknowledged ? 'acknowledged' : inv.status;
              return `<tr style="${isOverdue ? 'background:rgba(239,68,68,0.03);' : ''}">
                <td><strong>${inv.invoice_number}</strong></td>
                <td><span class="tag">${(inv.stage || 'invoice').replace(/_/g, ' ')}</span></td>
                <td style="font-weight:600;">${formatCAD(total)}${balance > 0 && inv.amount_paid > 0 ? `<div class="text-muted" style="font-size:11px;">${formatCAD(balance)} owing</div>` : ''}</td>
                <td>${inv.issue_date || '—'}</td>
                <td style="${isOverdue ? 'color:var(--red);font-weight:600;' : ''}">${inv.due_date}</td>
                <td><span class="status-badge status-${clientStatus}">${clientStatus === 'acknowledged' ? 'Acknowledged' : formatStatus(clientStatus)}</span></td>
                <td><button class="btn btn-outline btn-sm" onclick="clientViewInvoice('${inv.id}')"><i class="fas fa-eye"></i> View</button></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>` : '<div class="empty-state"><i class="fas fa-file-invoice-dollar"></i><h3>No invoices yet</h3><p>Invoices will appear here when issued by Trivex.</p></div>'}
    `;
  }

  // ---- DRAWINGS TAB (CLIENT) ----
  if (tab === 'drawings') {
    const allDrawings = DEMO_DRAWINGS[p.id] || [];
    const sharedDrawings = allDrawings.filter(d => d.shared_with_client);
    const clientUploads = DEMO_CLIENT_DRAWINGS[p.id] || [];
    const pendingApprovals = sharedDrawings.filter(d => d.approval && d.approval.status === 'pending');

    content = `
      ${pendingApprovals.length > 0 ? `
      <div style="background:var(--orange-light);border:1px solid rgba(249,115,22,0.2);border-radius:var(--radius);padding:12px 16px;margin-bottom:20px;display:flex;align-items:center;gap:10px;">
        <i class="fas fa-stamp" style="color:var(--orange);font-size:16px;"></i>
        <div>
          <div style="font-size:13px;font-weight:600;">${pendingApprovals.length} drawing${pendingApprovals.length > 1 ? 's' : ''} awaiting your approval</div>
          <div class="text-muted" style="font-size:12px;">Click on a drawing to review and approve.</div>
        </div>
      </div>` : ''}

      <div class="section-title" style="margin-bottom:12px;">Project Drawings</div>
      ${sharedDrawings.length > 0 ? `
      <div class="cards-grid" style="grid-template-columns:repeat(auto-fill,minmax(240px,1fr));margin-bottom:24px;">
        ${sharedDrawings.map(d => {
          const hasApproval = d.approval && d.approval.status === 'pending';
          return `
          <div class="card" onclick="openDrawingViewer('${p.id}','${d.id}')" style="padding:0;overflow:hidden;${hasApproval ? 'border-color:var(--orange);' : ''}">
            <div style="height:120px;background:${d.file_type === 'pdf' ? 'linear-gradient(135deg,#1a2744 0%,#2d3f62 100%)' : 'linear-gradient(135deg,#f3f4f6 0%,#e5e7eb 100%)'};display:flex;align-items:center;justify-content:center;position:relative;">
              <i class="${d.file_type === 'pdf' ? 'fas fa-file-pdf' : 'fas fa-image'}" style="font-size:28px;color:${d.file_type === 'pdf' ? '#ffffff40' : '#9ca3af'};"></i>
              ${hasApproval ? '<div style="position:absolute;top:8px;right:8px;background:var(--orange);color:#fff;font-size:10px;font-weight:600;padding:2px 8px;border-radius:10px;"><i class="fas fa-stamp" style="font-size:9px;margin-right:3px;"></i>Review</div>' : ''}
              ${d.status === 'approved' ? '<div style="position:absolute;top:8px;right:8px;background:var(--green);color:#fff;font-size:10px;font-weight:600;padding:2px 8px;border-radius:10px;">Approved</div>' : ''}
            </div>
            <div style="padding:12px;">
              <div style="font-size:13px;font-weight:600;">${d.title}</div>
              <div class="text-muted" style="font-size:11px;">${d.drawing_number} · Rev ${d.revision}</div>
            </div>
          </div>`;
        }).join('')}
      </div>` : '<div class="text-muted" style="text-align:center;padding:20px;font-size:13px;">No drawings shared yet.</div>'}

      <!-- Client uploads -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div class="section-title" style="margin:0;">Your Uploads</div>
        <button class="btn btn-outline btn-sm" onclick="clientUploadDrawing('${p.id}')"><i class="fas fa-upload"></i> Upload</button>
      </div>
      ${clientUploads.length > 0 ? `
      <div class="data-table-container">
        <table class="data-table">
          <thead><tr><th>Title</th><th>Category</th><th>Uploaded</th></tr></thead>
          <tbody>
            ${clientUploads.map(cd => `
              <tr><td><strong>${cd.title}</strong></td><td><span class="tag">${cd.category}</span></td><td class="text-muted">${cd.created_at}</td></tr>
            `).join('')}
          </tbody>
        </table>
      </div>` : '<div class="text-muted" style="text-align:center;padding:20px;font-size:13px;">No uploads yet.</div>'}
    `;
  }

  // ---- DOCUMENTS TAB (CLIENT) ----
  if (tab === 'documents') {
    const docs = DEMO_DOCUMENTS[p.id] || { trivex: [], client: [], requests: [] };
    const sharedDocs = (docs.trivex || []).filter(d => d.shared);
    const clientDocs = docs.client || [];
    const pendingRequests = (docs.requests || []).filter(r => r.status === 'pending');

    const pendingSigs = (DEMO_SIGNATURES[p.id] || []).filter(s => s.status === 'pending');

    content = `
      ${pendingSigs.length > 0 ? `
      <div style="background:var(--red-bg);border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius);padding:14px 16px;margin-bottom:20px;">
        <div style="font-size:14px;font-weight:700;margin-bottom:10px;color:var(--red);"><i class="fas fa-signature" style="margin-right:6px;"></i>${pendingSigs.length} document${pendingSigs.length > 1 ? 's' : ''} awaiting your signature</div>
        ${pendingSigs.map(sig => `
          <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-top:1px solid rgba(239,68,68,0.1);">
            <i class="fas fa-file-signature" style="color:var(--red);font-size:18px;"></i>
            <div style="flex:1;">
              <div style="font-size:13px;font-weight:600;">${sig.doc_name}</div>
              <div class="text-muted" style="font-size:11px;">${sig.notes || ''} · Requested ${sig.requested_at}</div>
            </div>
            <button class="btn btn-accent btn-sm" onclick="openSigningFlow('${p.id}','${sig.id}')"><i class="fas fa-pen-nib"></i> Sign Now</button>
          </div>
        `).join('')}
      </div>` : ''}

      ${pendingRequests.length > 0 ? `
      <div style="background:var(--orange-light);border:1px solid rgba(249,115,22,0.2);border-radius:var(--radius);padding:12px 16px;margin-bottom:20px;">
        <div style="font-size:13px;font-weight:600;margin-bottom:8px;"><i class="fas fa-inbox" style="color:var(--orange);margin-right:6px;"></i>${pendingRequests.length} document${pendingRequests.length > 1 ? 's' : ''} requested by Trivex</div>
        ${pendingRequests.map(req => `
          <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid rgba(249,115,22,0.15);">
            <i class="fas fa-file-upload" style="color:var(--orange);"></i>
            <div style="flex:1;">
              <div style="font-size:13px;font-weight:500;">${req.name}</div>
              <div class="text-muted" style="font-size:11px;">${req.reason} · Due: ${req.deadline}</div>
            </div>
            <button class="btn btn-accent btn-sm" onclick="uploadDocForRequest('${p.id}','${req.id}')"><i class="fas fa-upload"></i> Upload</button>
          </div>
        `).join('')}
      </div>` : ''}

      <!-- Trivex shared documents -->
      <div class="section-title" style="margin-bottom:12px;">Project Documents from Trivex</div>
      ${sharedDocs.length > 0 ? `
      <div class="data-table-container mb-20">
        <table class="data-table">
          <thead><tr><th></th><th>Name</th><th>Category</th><th>Date</th><th></th></tr></thead>
          <tbody>
            ${sharedDocs.map(doc => {
              const icon = doc.name.match(/\.(jpg|jpeg|png|gif)$/i) ? 'fas fa-image' : doc.name.endsWith('.pdf') ? 'fas fa-file-pdf' : doc.name.endsWith('.zip') ? 'fas fa-file-archive' : 'fas fa-file';
              const iconColor = doc.name.match(/\.(jpg|jpeg|png|gif)$/i) ? 'var(--green)' : 'var(--red)';
              return `<tr>
                <td><i class="${icon}" style="color:${iconColor};font-size:16px;"></i></td>
                <td><strong style="cursor:pointer;" onclick="previewDocument('${doc.id}','${p.id}')">${doc.name}</strong></td>
                <td><span class="tag">${doc.category}</span></td>
                <td class="text-muted">${doc.date}</td>
                <td><button class="btn btn-outline btn-sm" onclick="previewDocument('${doc.id}','${p.id}')" title="View"><i class="fas fa-eye"></i></button></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>` : '<div class="text-muted" style="text-align:center;padding:20px;margin-bottom:20px;">No documents shared yet.</div>'}

      <!-- Client uploaded documents -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div class="section-title" style="margin:0;">Your Uploads</div>
        <button class="btn btn-accent btn-sm" onclick="uploadDocumentModal('${p.id}','client')"><i class="fas fa-upload"></i> Upload Document</button>
      </div>
      ${clientDocs.length > 0 ? `
      <div class="data-table-container">
        <table class="data-table">
          <thead><tr><th></th><th>Name</th><th>Category</th><th>Date</th><th></th></tr></thead>
          <tbody>
            ${clientDocs.map(doc => `<tr>
              <td><i class="${doc.name.match(/\.(jpg|jpeg|png|gif)$/i) ? 'fas fa-image' : 'fas fa-file-pdf'}" style="color:${doc.name.match(/\.(jpg|jpeg|png|gif)$/i) ? 'var(--green)' : 'var(--red)'};font-size:16px;"></i></td>
              <td><strong style="cursor:pointer;" onclick="previewDocument('${doc.id}','${p.id}')">${doc.name}</strong></td>
              <td><span class="tag">${doc.category}</span></td>
              <td class="text-muted">${doc.date}</td>
              <td><button class="btn btn-outline btn-sm" onclick="previewDocument('${doc.id}','${p.id}')" title="View"><i class="fas fa-eye"></i></button></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>` : '<div class="text-muted" style="text-align:center;padding:20px;">No uploads yet.</div>'}

      <!-- Signed Documents -->
      ${(() => {
        const signedDocs = (DEMO_SIGNATURES[p.id] || []).filter(s => s.status === 'signed');
        if (signedDocs.length === 0) return '';
        return '<div class="section-title" style="margin-top:20px;margin-bottom:12px;"><i class="fas fa-stamp" style="color:var(--green);margin-right:6px;"></i>Signed Documents</div>' +
          signedDocs.map(function(sig) {
            return '<div style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid rgba(34,197,94,0.2);border-radius:var(--radius);margin-bottom:8px;background:var(--green-bg);">' +
              '<i class="fas fa-file-signature" style="color:var(--green);font-size:18px;"></i>' +
              '<div style="flex:1;">' +
                '<div style="font-size:13px;font-weight:600;">' + sig.doc_name + '</div>' +
                '<div style="font-size:11px;color:var(--green);font-weight:600;margin-top:2px;">Signed by ' + sig.signed_by + ' on ' + sig.signed_at + '</div>' +
              '</div>' +
              '<button class="btn btn-outline btn-sm" onclick="viewSignedDocument(\'' + sig.id + '\',\'' + p.id + '\')"><i class="fas fa-eye"></i> View</button>' +
            '</div>';
          }).join('');
      })()}
    `;
  }

  // ---- MESSAGES TAB ----
  if (tab === 'messages') {
    // Mark all trivex messages as read by client
    messages.forEach(m => { if (m.role === 'trivex') m.read_by_client = true; });

    content = `
      <div class="stat-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <div class="section-title" style="margin:0;">Messages</div>
        </div>

        <!-- Compose -->
        <div style="border:1px solid var(--card-border);border-radius:var(--radius);padding:12px;margin-bottom:20px;background:var(--page-bg);">
          <div style="display:flex;gap:8px;margin-bottom:8px;">
            <select id="portal-msg-category" class="form-input-styled" style="width:140px;padding:6px 8px;font-size:12px;">
              ${MSG_CATEGORIES.map(c => `<option>${c}</option>`).join('')}
            </select>
          </div>
          <div style="display:flex;gap:8px;">
            <textarea id="portal-msg-input" class="form-input-styled" placeholder="Type a message..." rows="2" style="flex:1;min-height:44px;"></textarea>
            <button class="btn btn-accent" onclick="sendClientMessage('${p.id}')" style="align-self:flex-end;"><i class="fas fa-paper-plane"></i></button>
          </div>
        </div>

        <!-- Thread -->
        ${messages.length > 0 ? [...messages].reverse().map(m => {
          const isClient = m.role === 'client';
          const isUrgent = m.category === 'Urgent';
          const catColor = isUrgent ? 'var(--red)' : m.category === 'Milestone' ? 'var(--green)' : m.category === 'Invoice' ? 'var(--blue)' : m.category === 'Drawing' ? 'var(--purple)' : m.category === 'Change Request' ? 'var(--orange)' : 'var(--text-muted)';
          return `
          <div style="padding:12px 14px;border-radius:var(--radius);margin-bottom:8px;background:${isClient ? 'var(--orange-light)' : 'var(--page-bg)'};${isUrgent ? 'border-left:3px solid var(--red);' : ''}">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:12px;font-weight:600;">${m.sender}</span>
                ${m.category ? `<span style="font-size:10px;font-weight:600;color:${catColor};background:${catColor}15;padding:1px 6px;border-radius:8px;">${m.category}</span>` : ''}
              </div>
              <span style="font-size:11px;color:var(--text-muted);">${m.date}</span>
            </div>
            <div style="font-size:13px;line-height:1.5;">${m.message}</div>
          </div>`;
        }).join('') : '<div class="text-muted" style="text-align:center;padding:24px;font-size:13px;">No messages yet. Send one above.</div>'}
      </div>
    `;
  }

  return `
    <div class="page-header">
      <div>
        <h1>${p.name}</h1>
        <p class="page-header-sub">${p.client_brand} · ${p.city}</p>
      </div>
    </div>
    ${content}
  `;
};

// Client portal helper functions
function signOffMilestone(projectId, milestoneId) {
  DEMO_SIGNOFFS[milestoneId] = {
    signed_by: currentUser.full_name,
    signed_at: new Date().toISOString().split('T')[0],
  };
  switchPortalTab('milestones');
}

function sendClientMessage(projectId) {
  const input = document.getElementById('portal-msg-input');
  const text = input.value.trim();
  if (!text) return;
  if (!DEMO_CLIENT_MESSAGES[projectId]) DEMO_CLIENT_MESSAGES[projectId] = [];

  const catSelect = document.getElementById('portal-msg-category');
  const category = catSelect ? catSelect.value : 'General';
  const isClient = currentUser.role === 'client';

  const msg = {
    id: 'msg-' + Date.now(),
    sender: currentUser.full_name,
    role: isClient ? 'client' : 'trivex',
    message: text,
    date: new Date().toISOString().split('T')[0] + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    category,
    read_by_client: !isClient,
    read_by_trivex: isClient ? false : true,
  };
  DEMO_CLIENT_MESSAGES[projectId].push(msg);
  if (typeof saveMessage === 'function') saveMessage(projectId, msg);
  input.value = '';

  if (isClient) {
    switchPortalTab('messages');
  } else {
    switchProjectTab('notes');
  }
}

function clientViewInvoice(invoiceId) {
  const inv = DEMO_INVOICES.find(i => i.id === invoiceId);
  if (!inv) return;
  const proj = DEMO_PROJECTS.find(p => p.id === inv.project_id);
  const taxAmt = inv.amount * (inv.tax_rate || 13) / 100;
  const total = inv.amount + taxAmt;
  const balance = total - inv.amount_paid;
  const isOverdue = balance > 0 && inv.due_date < '2026-03-28';
  const items = inv.items || [];

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'client-inv-modal';
  overlay.innerHTML = `
    <div class="modal-card" style="max-width:600px;">
      <!-- Header -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;">
        <div>
          <div style="font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">TRIVEX GROUP CORP</div>
          <h3 style="margin-top:4px;">${inv.invoice_number}</h3>
          <span class="tag" style="margin-top:4px;">${(inv.stage || 'invoice').replace(/_/g, ' ')}</span>
        </div>
        <button class="btn-icon" onclick="document.getElementById('client-inv-modal').remove()" style="color:var(--text-muted);font-size:18px;"><i class="fas fa-times"></i></button>
      </div>

      ${isOverdue ? '<div style="background:var(--red-bg);border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius);padding:10px 14px;margin-bottom:16px;font-size:13px;color:var(--red);font-weight:600;"><i class="fas fa-exclamation-triangle" style="margin-right:6px;"></i>Payment overdue — please arrange payment immediately.</div>' : ''}

      ${inv.acknowledged_by ? `
      <div style="background:var(--green-bg);border:1px solid rgba(34,197,94,0.2);border-radius:var(--radius);padding:10px 14px;margin-bottom:16px;display:flex;align-items:center;gap:8px;">
        <i class="fas fa-check-circle" style="color:var(--green);"></i>
        <span style="font-size:12px;color:var(--green);font-weight:600;">Acknowledged by ${inv.acknowledged_by} on ${inv.acknowledged_at}</span>
      </div>` : ''}

      <!-- Invoice details -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px;margin-bottom:16px;">
        <div style="padding:10px 12px;background:var(--page-bg);border-radius:var(--radius);">
          <div class="text-muted" style="font-size:11px;margin-bottom:2px;">Project</div>
          <div style="font-weight:600;">${proj ? proj.name : '—'}</div>
        </div>
        <div style="padding:10px 12px;background:var(--page-bg);border-radius:var(--radius);">
          <div class="text-muted" style="font-size:11px;margin-bottom:2px;">Issued / Due</div>
          <div style="font-weight:600;${isOverdue ? 'color:var(--red);' : ''}">${inv.issue_date || '—'} → ${inv.due_date}</div>
        </div>
      </div>

      <!-- Line items (if present) -->
      ${items.length > 0 ? `
      <div style="margin-bottom:16px;">
        <table class="data-table" style="font-size:12px;">
          <thead><tr><th>Description</th><th style="text-align:right;">Amount</th></tr></thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.description || ''}</td>
                <td style="text-align:right;font-weight:600;">${formatCAD((item.qty || 1) * (item.unit_cost || 0))}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>` : ''}

      <!-- Totals -->
      <div style="border-top:2px solid var(--card-border);padding-top:12px;margin-bottom:20px;">
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:14px;"><span>Subtotal</span><span>${formatCAD(inv.amount)}</span></div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:14px;"><span>HST (${inv.tax_rate || 13}%)</span><span>${formatCAD(taxAmt)}</span></div>
        <div style="display:flex;justify-content:space-between;padding:10px 0;font-size:20px;font-weight:700;border-top:2px solid var(--navy);margin-top:6px;">
          <span>Total (CAD)</span><span style="color:var(--orange);">${formatCAD(total)}</span>
        </div>
        ${inv.amount_paid > 0 ? `
        <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;"><span class="text-muted">Paid to date</span><span style="color:var(--green);">-${formatCAD(inv.amount_paid)}</span></div>
        <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:15px;font-weight:700;"><span>Balance Owing</span><span style="color:${balance > 0 ? 'var(--red)' : 'var(--green)'};">${formatCAD(Math.max(0, balance))}</span></div>` : ''}
      </div>

      <!-- Payment history -->
      ${(inv.payments || []).length > 0 ? `
      <div style="margin-bottom:16px;">
        <div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:8px;">Payment History</div>
        ${inv.payments.map(pay => `
          <div style="display:flex;align-items:center;gap:8px;font-size:12px;padding:4px 0;">
            <i class="fas fa-check-circle" style="color:var(--green);font-size:11px;"></i>
            <span>${formatCAD(pay.amount)} — ${pay.date}</span>
            ${pay.method ? `<span class="tag">${pay.method}</span>` : ''}
          </div>
        `).join('')}
      </div>` : ''}

      <!-- Actions -->
      <div style="display:flex;gap:8px;">
        <button class="btn btn-navy btn-full" onclick="exportInvoicePDF('${inv.id}'); document.getElementById('client-inv-modal').remove();"><i class="fas fa-file-pdf"></i> Download PDF</button>
        ${!inv.acknowledged_by && inv.status !== 'paid' ? `
        <button class="btn btn-accent btn-full" onclick="acknowledgeInvoice('${inv.id}')"><i class="fas fa-check"></i> Acknowledge Receipt</button>` : ''}
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function acknowledgeInvoice(invoiceId) {
  const inv = DEMO_INVOICES.find(i => i.id === invoiceId);
  if (!inv) return;
  inv.acknowledged_by = currentUser.full_name;
  inv.acknowledged_at = new Date().toISOString().split('T')[0];
  document.getElementById('client-inv-modal').remove();
  // Refresh to show the acknowledgement
  switchPortalTab('invoices');
}

function clientUploadDrawing(projectId) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'client-dwg-upload';
  overlay.innerHTML = `
    <div class="modal-card" style="max-width:420px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3>Upload Drawing</h3>
        <button class="btn-icon" onclick="document.getElementById('client-dwg-upload').remove()" style="color:var(--text-muted);font-size:18px;"><i class="fas fa-times"></i></button>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="form-group">
          <label class="form-label">Title</label>
          <input id="cdwg-title" class="form-input-styled" placeholder="e.g. Brand Standards Guide">
        </div>
        <div class="form-group">
          <label class="form-label">Category</label>
          <select id="cdwg-category" class="form-input-styled">
            <option>Brand Standards</option>
            <option>As-Built</option>
            <option>Landlord Drawings</option>
            <option>Reference Images</option>
            <option>Other</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">File</label>
          <input type="file" class="form-input-styled" accept=".pdf,.jpg,.jpeg,.png" style="padding:8px;">
        </div>
        <button class="btn btn-accent btn-full" onclick="saveClientDrawingUpload('${projectId}')"><i class="fas fa-upload"></i> Upload</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function saveClientDrawingUpload(projectId) {
  const title = document.getElementById('cdwg-title').value.trim();
  if (!title) { alert('Enter a title.'); return; }
  if (!DEMO_CLIENT_DRAWINGS[projectId]) DEMO_CLIENT_DRAWINGS[projectId] = [];
  DEMO_CLIENT_DRAWINGS[projectId].push({
    id: 'cdwg-' + Date.now(),
    title,
    file_type: 'pdf',
    uploaded_by: currentUser.full_name,
    created_at: new Date().toISOString().split('T')[0],
    category: document.getElementById('cdwg-category').value,
  });
  document.getElementById('client-dwg-upload').remove();
  switchPortalTab('drawings');
}

// ============================================
// DOCUMENT MANAGEMENT FUNCTIONS
// ============================================
function uploadDocumentModal(projectId, side) {
  const categories = side === 'client' ? DOC_CATEGORIES_CLIENT : DOC_CATEGORIES_TRIVEX;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'doc-upload-modal';
  overlay.innerHTML = `
    <div class="modal-card" style="max-width:460px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3><i class="fas fa-upload" style="color:var(--orange);margin-right:8px;"></i>Upload Document</h3>
        <button class="btn-icon" onclick="document.getElementById('doc-upload-modal').remove()" style="color:var(--text-muted);font-size:18px;"><i class="fas fa-times"></i></button>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="form-group">
          <label class="form-label">File (PDF, JPG, PNG, DOCX — max 25MB)</label>
          <input type="file" id="doc-file" class="form-input-styled" accept=".pdf,.jpg,.jpeg,.png,.docx" style="padding:8px;">
        </div>
        <div class="form-group">
          <label class="form-label">Category</label>
          <select id="doc-category" class="form-input-styled">
            ${categories.map(c => `<option>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Description (optional)</label>
          <input id="doc-description" class="form-input-styled" placeholder="Brief description...">
        </div>
        ${side === 'trivex' ? `
        <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">
          <input type="checkbox" id="doc-shared" checked> Share with client
        </label>` : ''}
        <button class="btn btn-accent btn-full btn-lg" onclick="saveDocUpload('${projectId}','${side}')"><i class="fas fa-upload"></i> Upload</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function saveDocUpload(projectId, side) {
  const fileInput = document.getElementById('doc-file');
  if (!fileInput.files[0]) { alert('Select a file.'); return; }
  const file = fileInput.files[0];
  if (file.size > 25 * 1024 * 1024) { alert('File exceeds 25MB limit.'); return; }

  // Read file as data URL so it can be previewed/downloaded
  const reader = new FileReader();
  reader.onload = function(e) {
    if (!DEMO_DOCUMENTS[projectId]) DEMO_DOCUMENTS[projectId] = { trivex: [], client: [], requests: [] };
    const docs = DEMO_DOCUMENTS[projectId];

    const doc = {
      id: (side === 'client' ? 'cdoc-' : 'doc-') + Date.now(),
      name: file.name,
      category: document.getElementById('doc-category').value,
      size: file.size > 1048576 ? (file.size / 1048576).toFixed(1) + ' MB' : Math.round(file.size / 1024) + ' KB',
      uploaded_by: currentUser.full_name,
      date: new Date().toISOString().split('T')[0],
      fileData: e.target.result,
      fileType: file.type,
    };

    if (side === 'trivex') {
      doc.shared = document.getElementById('doc-shared')?.checked || false;
      docs.trivex.push(doc);
    } else {
      docs.client.push(doc);
    }

    // Save to Supabase storage + database
    if (sb()) {
      (async function() {
        try {
          const url = await uploadDocumentFile(file, projectId);
          if (url) doc.fileData = url;
          await sb().from('documents').insert({
            project_id: projectId, name: doc.name, category: doc.category,
            file_url: url || null, file_size: doc.size, side: side,
            shared: doc.shared || false, uploaded_by: currentUser.id,
          });
        } catch(err) { console.error('Doc save error:', err); }
      })();
    }

    document.getElementById('doc-upload-modal').remove();

    if (currentUser.role === 'client') {
      switchPortalTab('documents');
    } else {
      switchProjectTab('documents');
    }
  };
  reader.readAsDataURL(file);
}

// View/download any document or image
function previewDocument(docId, projectId) {
  // Search across all document arrays
  const docs = DEMO_DOCUMENTS[projectId] || { trivex: [], client: [] };
  const doc = [...(docs.trivex || []), ...(docs.client || [])].find(d => d.id === docId);
  if (!doc) return;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'doc-preview-modal';

  let contentHTML = '';
  if (doc.fileData) {
    if (doc.fileType && doc.fileType.startsWith('image/')) {
      contentHTML = '<img src="' + doc.fileData + '" style="max-width:100%;max-height:70vh;object-fit:contain;border-radius:var(--radius);border:1px solid var(--card-border);">';
    } else if (doc.fileType === 'application/pdf') {
      contentHTML = '<iframe src="' + doc.fileData + '" style="width:100%;height:70vh;border:1px solid var(--card-border);border-radius:var(--radius);"></iframe>';
    } else {
      contentHTML = '<div class="text-muted" style="text-align:center;padding:40px;"><i class="fas fa-file" style="font-size:48px;margin-bottom:12px;display:block;"></i>Preview not available for this file type.<br>Click Download to open it.</div>';
    }
  } else {
    contentHTML = '<div style="text-align:center;padding:40px;background:var(--page-bg);border-radius:var(--radius);"><i class="fas fa-file-alt" style="font-size:48px;color:var(--text-light);margin-bottom:12px;display:block;"></i><div style="font-size:14px;font-weight:600;">' + doc.name + '</div><div class="text-muted" style="font-size:12px;margin-top:4px;">' + doc.size + ' · ' + doc.category + '</div><div class="text-muted" style="font-size:12px;margin-top:8px;">File preview available for newly uploaded files.<br>Demo files don\'t have preview data.</div></div>';
  }

  overlay.innerHTML =
    '<div class="modal-card" style="max-width:800px;max-height:90vh;overflow:auto;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
        '<div>' +
          '<h3 style="margin:0;">' + doc.name + '</h3>' +
          '<div class="text-muted" style="font-size:12px;">' + doc.size + ' · ' + doc.category + ' · ' + doc.uploaded_by + ', ' + doc.date + '</div>' +
        '</div>' +
        '<button class="btn-icon" onclick="document.getElementById(\'doc-preview-modal\').remove()" style="color:var(--text-muted);font-size:18px;"><i class="fas fa-times"></i></button>' +
      '</div>' +
      contentHTML +
      '<div style="display:flex;gap:8px;margin-top:16px;">' +
        (doc.fileData ? '<button class="btn btn-accent btn-full" onclick="downloadDocument(\'' + docId + '\',\'' + projectId + '\')"><i class="fas fa-download"></i> Download</button>' : '') +
        '<button class="btn btn-outline btn-full" onclick="document.getElementById(\'doc-preview-modal\').remove()">Close</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);
}

function downloadDocument(docId, projectId) {
  const docs = DEMO_DOCUMENTS[projectId] || { trivex: [], client: [] };
  const doc = [...(docs.trivex || []), ...(docs.client || [])].find(d => d.id === docId);
  if (!doc || !doc.fileData) return;
  const a = document.createElement('a');
  a.href = doc.fileData;
  a.download = doc.name;
  a.click();
}

function requestDocumentModal(projectId) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'doc-request-modal';
  overlay.innerHTML = `
    <div class="modal-card" style="max-width:460px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3><i class="fas fa-inbox" style="color:var(--orange);margin-right:8px;"></i>Request Document from Client</h3>
        <button class="btn-icon" onclick="document.getElementById('doc-request-modal').remove()" style="color:var(--text-muted);font-size:18px;"><i class="fas fa-times"></i></button>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="form-group">
          <label class="form-label">Document Name</label>
          <input id="dreq-name" class="form-input-styled" placeholder="e.g. Certificate of Insurance">
        </div>
        <div class="form-group">
          <label class="form-label">Category</label>
          <select id="dreq-category" class="form-input-styled">
            ${DOC_CATEGORIES_CLIENT.map(c => `<option>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Reason</label>
          <input id="dreq-reason" class="form-input-styled" placeholder="Why do you need this document?">
        </div>
        <div class="form-group">
          <label class="form-label">Deadline</label>
          <input id="dreq-deadline" type="date" class="form-input-styled">
        </div>
        <button class="btn btn-accent btn-full btn-lg" onclick="saveDocRequest('${projectId}')"><i class="fas fa-paper-plane"></i> Send Request</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function saveDocRequest(projectId) {
  const name = document.getElementById('dreq-name').value.trim();
  if (!name) { alert('Enter a document name.'); return; }
  if (!DEMO_DOCUMENTS[projectId]) DEMO_DOCUMENTS[projectId] = { trivex: [], client: [], requests: [] };
  DEMO_DOCUMENTS[projectId].requests.push({
    id: 'dreq-' + Date.now(),
    name,
    category: document.getElementById('dreq-category').value,
    reason: document.getElementById('dreq-reason').value,
    deadline: document.getElementById('dreq-deadline').value,
    status: 'pending',
  });
  document.getElementById('doc-request-modal').remove();
  switchProjectTab('documents');
}

function uploadDocForRequest(projectId, requestId) {
  // Open upload modal, and on save mark the request as fulfilled
  uploadDocumentModal(projectId, 'client');
  // Override the save to also fulfill the request
  const origSave = window.saveDocUpload;
  window.saveDocUpload = function(pid, side) {
    origSave(pid, side);
    const docs = DEMO_DOCUMENTS[pid];
    if (docs && docs.requests) {
      const req = docs.requests.find(r => r.id === requestId);
      if (req) req.status = 'fulfilled';
    }
    window.saveDocUpload = origSave;
  };
}

// ============================================
// CLIENT CHANGE REQUEST FUNCTIONS
// ============================================
function showNewCRModal(projectId) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'cr-modal';
  overlay.innerHTML = `
    <div class="modal-card" style="max-width:520px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3><i class="fas fa-plus-circle" style="color:var(--orange);margin-right:8px;"></i>New Change Request</h3>
        <button class="btn-icon" onclick="document.getElementById('cr-modal').remove()" style="color:var(--text-muted);font-size:18px;"><i class="fas fa-times"></i></button>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="form-group">
          <label class="form-label">Request Title <span style="color:var(--red);">*</span></label>
          <input id="cr-title" class="form-input-styled" placeholder="e.g. Add USB outlets to dining counter">
        </div>
        <div class="form-group">
          <label class="form-label">Description <span style="color:var(--red);">*</span></label>
          <textarea id="cr-desc" class="form-input-styled" rows="4" placeholder="Describe the change you need and why..."></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Location in Project</label>
          <input id="cr-location" class="form-input-styled" placeholder="e.g. Kitchen — north wall, Dining area">
        </div>
        <div class="form-group">
          <label class="form-label">Priority</label>
          <select id="cr-priority" class="form-input-styled">
            <option>Not urgent</option>
            <option>Would like it done</option>
            <option>Required before opening</option>
          </select>
        </div>
        <button class="btn btn-accent btn-full btn-lg" onclick="submitChangeRequest('${projectId}')"><i class="fas fa-paper-plane"></i> Submit Request</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function submitChangeRequest(projectId) {
  const title = document.getElementById('cr-title').value.trim();
  const desc = document.getElementById('cr-desc').value.trim();
  if (!title || !desc) { alert('Title and description are required.'); return; }

  if (!DEMO_CHANGE_REQUESTS[projectId]) DEMO_CHANGE_REQUESTS[projectId] = [];

  const cr = {
    id: 'cr-' + Date.now(),
    number: nextCRNumber(projectId),
    status: 'submitted',
    title,
    description: desc,
    location: document.getElementById('cr-location').value,
    priority: document.getElementById('cr-priority').value,
    submitted_by: currentUser.full_name,
    submitted_at: new Date().toISOString().split('T')[0],
    quote_amount: null,
    quote_timeline: null,
    comments: [],
  };

  DEMO_CHANGE_REQUESTS[projectId].push(cr);
  document.getElementById('cr-modal').remove();
  switchPortalTab('changes');
}

function addCRComment(projectId, crId) {
  const input = document.getElementById('cr-comment-input');
  const text = input.value.trim();
  if (!text) return;

  const crs = DEMO_CHANGE_REQUESTS[projectId] || [];
  const cr = crs.find(c => c.id === crId);
  if (!cr) return;

  if (!cr.comments) cr.comments = [];
  cr.comments.push({
    author: currentUser.full_name,
    role: currentUser.role === 'client' ? 'client' : 'trivex',
    text,
    date: new Date().toISOString().split('T')[0],
  });

  input.value = '';
  // Re-render
  window._viewingCR = crId;
  switchPortalTab('changes');
}

function approveChangeRequest(projectId, crId) {
  const crs = DEMO_CHANGE_REQUESTS[projectId] || [];
  const cr = crs.find(c => c.id === crId);
  if (!cr) return;

  cr.status = 'approved';
  cr.comments.push({
    author: currentUser.full_name,
    role: 'client',
    text: 'Quote approved. Please proceed.',
    date: new Date().toISOString().split('T')[0],
  });

  // Auto-create a formal Change Order from the approved request
  if (!DEMO_CHANGE_ORDERS[projectId]) DEMO_CHANGE_ORDERS[projectId] = [];
  const coNum = nextCONumber(projectId);
  DEMO_CHANGE_ORDERS[projectId].push({
    id: 'co-' + Date.now(),
    number: coNum,
    date: new Date().toISOString().split('T')[0],
    status: 'approved',
    description: cr.title + ' (from ' + cr.number + ')',
    reason: 'Client Request',
    items: [{ description: cr.title, qty: 1, unit: 'lot', unit_cost: cr.quote_amount || 0 }],
    revised_completion: null,
  });

  window._viewingCR = null;
  switchPortalTab('changes');
}

function declineChangeRequest(projectId, crId) {
  const crs = DEMO_CHANGE_REQUESTS[projectId] || [];
  const cr = crs.find(c => c.id === crId);
  if (!cr) return;

  cr.status = 'declined';
  cr.comments.push({
    author: currentUser.full_name,
    role: 'client',
    text: 'Quote declined.',
    date: new Date().toISOString().split('T')[0],
  });

  window._viewingCR = null;
  switchPortalTab('changes');
}

// ============================================
// ADMIN: Change Request Management
// ============================================
function adminReviewCR(projectId, crId) {
  const crs = DEMO_CHANGE_REQUESTS[projectId] || [];
  const cr = crs.find(c => c.id === crId);
  if (!cr) return;
  cr.status = 'under_review';
  switchProjectTab('change_orders');
}

function adminQuoteCR(projectId, crId) {
  const crs = DEMO_CHANGE_REQUESTS[projectId] || [];
  const cr = crs.find(c => c.id === crId);
  if (!cr) return;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'quote-modal';
  overlay.innerHTML = `
    <div class="modal-card" style="max-width:460px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3>Quote for ${cr.number}</h3>
        <button class="btn-icon" onclick="document.getElementById('quote-modal').remove()" style="color:var(--text-muted);font-size:18px;"><i class="fas fa-times"></i></button>
      </div>
      <div style="background:var(--page-bg);border-radius:var(--radius);padding:12px;margin-bottom:16px;">
        <div style="font-size:13px;font-weight:600;margin-bottom:4px;">${cr.title}</div>
        <div class="text-muted" style="font-size:12px;">${cr.description.substring(0, 100)}...</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="form-group">
          <label class="form-label">Quote Amount (CAD)</label>
          <input id="quote-amount" class="form-input-styled" type="number" step="0.01" placeholder="0.00" inputmode="decimal">
        </div>
        <div class="form-group">
          <label class="form-label">Timeline Impact</label>
          <input id="quote-timeline" class="form-input-styled" placeholder="e.g. 3 additional days">
        </div>
        <div class="form-group">
          <label class="form-label">Comment to Client</label>
          <textarea id="quote-comment" class="form-input-styled" rows="3" placeholder="Explain the quote..."></textarea>
        </div>
        <button class="btn btn-accent btn-full btn-lg" onclick="sendCRQuote('${projectId}','${crId}')"><i class="fas fa-paper-plane"></i> Send Quote to Client</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function sendCRQuote(projectId, crId) {
  const crs = DEMO_CHANGE_REQUESTS[projectId] || [];
  const cr = crs.find(c => c.id === crId);
  if (!cr) return;

  cr.status = 'quoted';
  cr.quote_amount = parseFloat(document.getElementById('quote-amount').value) || 0;
  cr.quote_timeline = document.getElementById('quote-timeline').value;

  const comment = document.getElementById('quote-comment').value.trim();
  if (comment) {
    if (!cr.comments) cr.comments = [];
    cr.comments.push({
      author: currentUser.full_name,
      role: 'trivex',
      text: comment,
      date: new Date().toISOString().split('T')[0],
    });
  }

  document.getElementById('quote-modal').remove();
  switchProjectTab('change_orders');
}

// ESTIMATES (placeholder)
// ============================================
pageRenderers.estimates = () => {
  return `
    <div class="page-header">
      <div>
        <h1>Estimates</h1>
        <p class="page-header-sub">${DEMO_ESTIMATES.length} estimates</p>
      </div>
      <button class="btn btn-accent" onclick="newEstimate()"><i class="fas fa-plus"></i> New Estimate</button>
    </div>

    <div class="data-table-container">
      <table class="data-table">
        <thead><tr><th>Client</th><th>Type</th><th>Location</th><th>Sq Ft</th><th>Quote Total</th><th>Margin</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${DEMO_ESTIMATES.map(e => {
            const cost = (e.items || []).reduce((s, i) => s + i.qty * i.unit_cost, 0);
            const margin = cost * (e.margin_pct || 0) / 100;
            const total = cost + margin;
            return `
            <tr style="cursor:pointer;" onclick="viewEstimate('${e.id}')">
              <td><strong>${e.client_name}</strong></td>
              <td>${e.project_type}</td>
              <td>${e.address}</td>
              <td>${e.sqft ? e.sqft.toLocaleString() : '—'}</td>
              <td style="font-weight:600;">${formatCAD(total)}</td>
              <td>${e.margin_pct}%</td>
              <td><span class="status-badge status-${e.status}">${formatStatus(e.status)}</span></td>
              <td>
                ${e.status === 'accepted' && !DEMO_PROJECTS.find(p => p.name.includes(e.client_name))
                  ? `<button class="btn btn-accent btn-sm" onclick="event.stopPropagation(); createProjectFromEstimate('${e.id}')"><i class="fas fa-plus"></i> Create Project</button>`
                  : ''}
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
};

function viewEstimate(id) {
  activeEstimateId = id;
  navigateTo('estimate-detail');
}

function newEstimate() {
  const est = {
    id: 'est-' + Date.now(),
    client_name: '',
    project_type: 'Franchise Fit-Out',
    status: 'draft',
    sqft: '',
    address: '',
    target_start: '',
    margin_pct: 15,
    created_at: new Date().toISOString().split('T')[0],
    items: [],
  };
  DEMO_ESTIMATES.push(est);
  activeEstimateId = est.id;
  navigateTo('estimate-detail');
}

// ============================================
// ESTIMATE DETAIL / EDITOR
// ============================================
pageRenderers['estimate-detail'] = () => {
  const est = DEMO_ESTIMATES.find(e => e.id === activeEstimateId);
  if (!est) return '<div class="empty-state"><p>Estimate not found.</p></div>';

  const items = est.items || [];
  const costSubtotal = items.reduce((s, i) => s + i.qty * i.unit_cost, 0);
  const marginAmt = costSubtotal * (est.margin_pct || 0) / 100;
  const quoteTotal = costSubtotal + marginAmt;
  const isDraft = est.status === 'draft';

  return `
    <div class="page-header">
      <div style="display:flex;align-items:center;gap:12px;">
        <button class="btn btn-outline btn-sm" onclick="navigateTo('estimates')"><i class="fas fa-arrow-left"></i></button>
        <div>
          <h1>${est.client_name || 'New Estimate'}</h1>
          <p class="page-header-sub">${est.project_type} &middot; ${est.address || 'No address'} &middot; Created ${est.created_at}</p>
        </div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <span class="status-badge status-${est.status}" style="font-size:13px;padding:6px 14px;">${formatStatus(est.status)}</span>
        ${est.status === 'draft' ? `<button class="btn btn-accent btn-sm" onclick="updateEstimateStatus('${est.id}', 'sent')"><i class="fas fa-paper-plane"></i> Mark Sent</button>` : ''}
        ${est.status === 'sent' ? `
          <button class="btn btn-accent btn-sm" onclick="updateEstimateStatus('${est.id}', 'accepted')"><i class="fas fa-check"></i> Accepted</button>
          <button class="btn btn-outline btn-sm" onclick="updateEstimateStatus('${est.id}', 'declined')"><i class="fas fa-times"></i> Declined</button>
        ` : ''}
        ${est.status === 'accepted' ? `
          <button class="btn btn-accent btn-sm" onclick="createProjectFromEstimate('${est.id}')"><i class="fas fa-plus"></i> Create Project</button>
          <button class="btn btn-outline btn-sm" onclick="createInvoiceFromEstimate('${est.id}')"><i class="fas fa-file-invoice-dollar"></i> Create Invoice</button>
        ` : ''}
        <button class="btn btn-navy btn-sm" onclick="exportEstimatePDF('${est.id}')"><i class="fas fa-file-pdf"></i> Export PDF</button>
      </div>
    </div>

    <!-- Project details -->
    <div class="stat-card mb-20">
      <div class="section-title" style="margin-bottom:12px;">Project Details</div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Client Name</label>
          <input class="form-input-styled" value="${est.client_name}" onchange="estField('${est.id}','client_name',this.value)" ${isDraft ? '' : 'readonly'}>
        </div>
        <div class="form-group">
          <label class="form-label">Project Type</label>
          <select class="form-input-styled" onchange="estField('${est.id}','project_type',this.value)" ${isDraft ? '' : 'disabled'}>
            ${['Franchise Fit-Out', 'Medical', 'Retail', 'Office', 'Other'].map(t =>
              `<option ${t === est.project_type ? 'selected' : ''}>${t}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Address</label>
          <input class="form-input-styled" value="${est.address}" onchange="estField('${est.id}','address',this.value)" ${isDraft ? '' : 'readonly'}>
        </div>
        <div class="form-group">
          <label class="form-label">Square Footage</label>
          <input class="form-input-styled" type="number" value="${est.sqft}" onchange="estField('${est.id}','sqft',parseInt(this.value)||0)" ${isDraft ? '' : 'readonly'}>
        </div>
        <div class="form-group">
          <label class="form-label">Target Start Date</label>
          <input class="form-input-styled" type="date" value="${est.target_start || ''}" onchange="estField('${est.id}','target_start',this.value)" ${isDraft ? '' : 'readonly'}>
        </div>
        <div class="form-group">
          <label class="form-label">Target Margin %</label>
          <input class="form-input-styled" type="number" value="${est.margin_pct}" min="0" max="100" onchange="estField('${est.id}','margin_pct',parseFloat(this.value)||0); switchProjectTab&&false; navigateTo('estimate-detail');" ${isDraft ? '' : 'readonly'}>
        </div>
      </div>
    </div>

    <!-- Line items table -->
    <div class="data-table-container mb-20">
      <div class="data-table-header">
        <span class="data-table-title">Line Items</span>
        ${isDraft ? `<button class="btn btn-accent btn-sm" onclick="addEstimateItem('${est.id}')"><i class="fas fa-plus"></i> Add Row</button>` : ''}
      </div>
      <table class="data-table" id="estimate-items-table">
        <thead>
          <tr>
            <th style="width:35%;">Description</th>
            <th>Category</th>
            <th style="width:70px;">Qty</th>
            <th style="width:70px;">Unit</th>
            <th style="width:100px;">Unit Cost</th>
            <th style="width:110px;text-align:right;">Line Total</th>
            ${isDraft ? '<th style="width:40px;"></th>' : ''}
          </tr>
        </thead>
        <tbody>
          ${items.map((item, idx) => `
            <tr>
              <td>${isDraft
                ? `<input class="form-input-styled" value="${item.description}" onchange="estItemField('${est.id}',${idx},'description',this.value)" style="padding:6px 10px;font-size:13px;">`
                : item.description}</td>
              <td>${isDraft
                ? `<select class="form-input-styled" onchange="estItemField('${est.id}',${idx},'category',this.value)" style="padding:6px 8px;font-size:12px;">
                    ${ESTIMATE_CATEGORIES.map(c => `<option ${c === item.category ? 'selected' : ''}>${c}</option>`).join('')}
                  </select>`
                : `<span class="tag">${item.category}</span>`}</td>
              <td>${isDraft
                ? `<input class="form-input-styled" type="number" value="${item.qty}" onchange="estItemField('${est.id}',${idx},'qty',parseFloat(this.value)||0); navigateTo('estimate-detail');" style="padding:6px 8px;font-size:13px;text-align:right;">`
                : item.qty.toLocaleString()}</td>
              <td>${isDraft
                ? `<input class="form-input-styled" value="${item.unit}" onchange="estItemField('${est.id}',${idx},'unit',this.value)" style="padding:6px 8px;font-size:13px;">`
                : item.unit}</td>
              <td>${isDraft
                ? `<input class="form-input-styled" type="number" step="0.01" value="${item.unit_cost}" onchange="estItemField('${est.id}',${idx},'unit_cost',parseFloat(this.value)||0); navigateTo('estimate-detail');" style="padding:6px 8px;font-size:13px;text-align:right;">`
                : formatCAD(item.unit_cost)}</td>
              <td style="text-align:right;font-weight:600;">${formatCAD(item.qty * item.unit_cost)}</td>
              ${isDraft ? `<td><button class="btn-icon" onclick="removeEstimateItem('${est.id}',${idx})" title="Remove"><i class="fas fa-trash" style="color:var(--red);font-size:12px;"></i></button></td>` : ''}
            </tr>
          `).join('')}
          ${items.length === 0 ? `<tr><td colspan="${isDraft ? 7 : 6}" class="text-muted" style="text-align:center;padding:24px;">No line items. Click "Add Row" to start building the estimate.</td></tr>` : ''}
        </tbody>
      </table>
    </div>

    <!-- Totals -->
    <div class="stat-card" style="max-width:400px;margin-left:auto;">
      <div style="display:flex;flex-direction:column;gap:8px;font-size:14px;">
        <div style="display:flex;justify-content:space-between;">
          <span class="text-muted">Cost Subtotal</span>
          <span style="font-weight:600;">${formatCAD(costSubtotal)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span class="text-muted">Margin (${est.margin_pct}%)</span>
          <span style="font-weight:600;">${formatCAD(marginAmt)}</span>
        </div>
        <div style="height:1px;background:var(--card-border);margin:4px 0;"></div>
        <div style="display:flex;justify-content:space-between;font-size:18px;">
          <span style="font-weight:700;color:var(--navy);">Quote Total</span>
          <span style="font-weight:700;color:var(--orange);">${formatCAD(quoteTotal)}</span>
        </div>
      </div>
    </div>
  `;
};

function estField(id, field, value) {
  const est = DEMO_ESTIMATES.find(e => e.id === id);
  if (est) est[field] = value;
}

function estItemField(id, idx, field, value) {
  const est = DEMO_ESTIMATES.find(e => e.id === id);
  if (est && est.items[idx]) est.items[idx][field] = value;
}

function addEstimateItem(id) {
  const est = DEMO_ESTIMATES.find(e => e.id === id);
  if (!est) return;
  est.items.push({
    id: 'li-' + Date.now(),
    description: '',
    category: 'Demo',
    qty: 1,
    unit: 'lot',
    unit_cost: 0,
  });
  navigateTo('estimate-detail');
}

function removeEstimateItem(id, idx) {
  const est = DEMO_ESTIMATES.find(e => e.id === id);
  if (est) {
    est.items.splice(idx, 1);
    navigateTo('estimate-detail');
  }
}

function updateEstimateStatus(id, status) {
  const est = DEMO_ESTIMATES.find(e => e.id === id);
  if (est) {
    est.status = status;
    navigateTo('estimate-detail');
  }
}

function createProjectFromEstimate(id) {
  const est = DEMO_ESTIMATES.find(e => e.id === id);
  if (!est) return;

  // Check if project already exists
  if (DEMO_PROJECTS.find(p => p.name.includes(est.client_name))) {
    alert('A project for this client already exists.');
    return;
  }

  const cost = (est.items || []).reduce((s, i) => s + i.qty * i.unit_cost, 0);
  const margin = cost * (est.margin_pct || 0) / 100;
  const budget = cost + margin;

  const newProject = {
    id: 'proj-' + Date.now(),
    name: `${est.client_name} — ${est.address.split(',')[0] || 'New'}`,
    client_brand: est.client_name,
    status: 'planning',
    completion_pct: 0,
    target_handover: '',
    budget: Math.round(budget),
    city: est.address,
    sqft: est.sqft,
    assigned: [],
  };

  DEMO_PROJECTS.push(newProject);
  DEMO_MILESTONES[newProject.id] = generateMilestones(newProject.id, 0, est.target_start || new Date().toISOString().split('T')[0]);

  // Navigate to the new project
  activeProjectId = newProject.id;
  activeProjectTab = 'overview';
  navigateTo('project-detail');
}

// ============================================
// ESTIMATE PDF EXPORT
// ============================================
function exportEstimatePDF(id) {
  const est = DEMO_ESTIMATES.find(e => e.id === id);
  if (!est) return;

  const items = est.items || [];
  const costSubtotal = items.reduce((s, i) => s + i.qty * i.unit_cost, 0);
  const marginAmt = costSubtotal * (est.margin_pct || 0) / 100;
  const quoteTotal = costSubtotal + marginAmt;

  const html = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<title>Estimate — ${est.client_name}</title>
<style>
  body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #1f2937; margin: 0; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 3px solid #1a2744; }
  .logo-area h1 { font-size: 24px; font-weight: 800; color: #1a2744; margin: 0; }
  .logo-area p { font-size: 11px; color: #6b7280; margin: 2px 0 0; }
  .estimate-label { text-align: right; }
  .estimate-label h2 { font-size: 20px; color: #f97316; margin: 0; }
  .estimate-label p { font-size: 11px; color: #6b7280; margin: 2px 0 0; }
  .info-grid { display: flex; gap: 40px; margin-bottom: 28px; }
  .info-block h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin: 0 0 6px; }
  .info-block p { margin: 2px 0; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  th { background: #f3f4f6; text-align: left; padding: 8px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
  td { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; font-size: 12px; }
  .text-right { text-align: right; }
  .totals { margin-left: auto; width: 280px; }
  .totals div { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
  .totals .total-line { border-top: 2px solid #1a2744; padding-top: 10px; margin-top: 4px; font-size: 16px; font-weight: 700; }
  .total-amount { color: #f97316; }
  .terms { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #9ca3af; line-height: 1.6; }
  .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #9ca3af; }
  @media print { body { padding: 20px; } }
</style>
</head><body>
  <div class="header">
    <div class="logo-area">
      <h1>TRIVEX GROUP CORP</h1>
      <p>Commercial Construction &middot; Franchise Fit-Outs</p>
      <p>Burlington, ON &middot; trivexgroup.com</p>
    </div>
    <div class="estimate-label">
      <h2>ESTIMATE</h2>
      <p>Date: ${est.created_at}</p>
      <p>Status: ${est.status.toUpperCase()}</p>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-block">
      <h3>Prepared For</h3>
      <p><strong>${est.client_name}</strong></p>
      <p>${est.address}</p>
    </div>
    <div class="info-block">
      <h3>Project Details</h3>
      <p>Type: ${est.project_type}</p>
      <p>Size: ${est.sqft ? est.sqft.toLocaleString() + ' sqft' : '—'}</p>
      <p>Target Start: ${est.target_start || 'TBD'}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr><th>Description</th><th>Category</th><th class="text-right">Qty</th><th>Unit</th><th class="text-right">Unit Cost</th><th class="text-right">Total</th></tr>
    </thead>
    <tbody>
      ${items.map(i => `
        <tr>
          <td>${i.description}</td>
          <td>${i.category}</td>
          <td class="text-right">${i.qty.toLocaleString()}</td>
          <td>${i.unit}</td>
          <td class="text-right">$${i.unit_cost.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</td>
          <td class="text-right"><strong>$${(i.qty * i.unit_cost).toLocaleString('en-CA', { minimumFractionDigits: 2 })}</strong></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div><span>Cost Subtotal</span><span>$${costSubtotal.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</span></div>
    <div><span>Margin (${est.margin_pct}%)</span><span>$${marginAmt.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</span></div>
    <div class="total-line"><span>QUOTE TOTAL (CAD)</span><span class="total-amount">$${quoteTotal.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</span></div>
  </div>

  <div class="terms">
    <strong>Terms & Conditions</strong><br>
    1. This estimate is valid for 30 days from date of issue.<br>
    2. Payment terms: 30% deposit upon acceptance, progress billing monthly, final payment upon substantial completion.<br>
    3. This estimate does not include: permits & inspection fees (unless listed), furniture/equipment not specified, exterior work, signage (unless listed).<br>
    4. Any changes to scope will be documented via change order and may affect the total price and timeline.<br>
    5. HST (13%) will be applied to all invoices and is not included in this estimate.<br>
    6. Trivex Group Corp carries full commercial general liability and WSIB coverage.
  </div>

  <div class="footer">
    Trivex Group Corp &middot; Burlington, ON &middot; Prepared via XOS
  </div>
</body></html>`;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => printWindow.print();
}

// ============================================
// INVOICES
// ============================================
let activeInvoiceId = null;

function nextInvoiceNumber() {
  const nums = DEMO_INVOICES.map(i => {
    const m = i.invoice_number.match(/(\d+)$/);
    return m ? parseInt(m[1]) : 0;
  });
  return 'INV-2026-' + String(Math.max(0, ...nums) + 1).padStart(3, '0');
}

pageRenderers.invoices = () => {
  const totalInvoiced = DEMO_INVOICES.reduce((s, i) => s + i.amount, 0);
  const totalPaid = DEMO_INVOICES.reduce((s, i) => s + i.amount_paid, 0);
  const totalOwing = totalInvoiced - totalPaid;
  const overdue = DEMO_INVOICES.filter(inv => inv.status !== 'paid' && inv.due_date && inv.due_date < '2026-03-28');

  return `
    <div class="page-header">
      <div>
        <h1>Invoices</h1>
        <p class="page-header-sub">${DEMO_INVOICES.length} invoices</p>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-accent" onclick="newInvoice()"><i class="fas fa-plus"></i> New Invoice</button>
      </div>
    </div>

    <div class="stats-grid" style="grid-template-columns:repeat(4,1fr);">
      ${statCard('Total Invoiced', formatCAD(totalInvoiced), 'fas fa-file-invoice-dollar', 'var(--blue)', DEMO_INVOICES.length + ' invoices')}
      ${statCard('Collected', formatCAD(totalPaid), 'fas fa-hand-holding-usd', 'var(--green)', Math.round(totalPaid / totalInvoiced * 100) + '% collected')}
      ${statCard('Outstanding', formatCAD(totalOwing), 'fas fa-exclamation-circle', 'var(--orange)', DEMO_INVOICES.filter(i => i.status !== 'paid').length + ' unpaid')}
      ${statCard('Overdue', overdue.length, 'fas fa-clock', 'var(--red)', overdue.length > 0 ? formatCAD(overdue.reduce((s, i) => s + i.amount - i.amount_paid, 0)) + ' owing' : 'None')}
    </div>

    <div class="data-table-container">
      <table class="data-table">
        <thead><tr><th>Invoice #</th><th>Project</th><th>Stage</th><th>Issued</th><th>Due</th><th>Amount</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead>
        <tbody>
          ${DEMO_INVOICES.map(inv => {
            const proj = DEMO_PROJECTS.find(p => p.id === inv.project_id);
            const balance = inv.amount - inv.amount_paid;
            const dueDate = inv.due_date || '';
            const isOverdue = inv.status !== 'paid' && dueDate && dueDate < '2026-03-28';
            return `<tr style="cursor:pointer;" onclick="viewInvoice('${inv.id}')">
              <td><strong>${inv.invoice_number}</strong></td>
              <td class="text-muted">${proj ? proj.name : '—'}</td>
              <td><span class="tag">${(inv.stage || 'invoice').replace(/_/g, ' ')}</span></td>
              <td>${inv.issue_date || '—'}</td>
              <td style="${isOverdue ? 'color:var(--red);font-weight:600;' : ''}">${dueDate}${isOverdue ? ' !' : ''}</td>
              <td>${formatCAD(inv.amount)}</td>
              <td style="color:var(--green);">${formatCAD(inv.amount_paid)}</td>
              <td style="font-weight:600;${balance > 0 ? 'color:var(--red);' : 'color:var(--green);'}">${formatCAD(balance)}</td>
              <td><span class="status-badge status-${inv.status}">${formatStatus(inv.status)}</span></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
};

// ============================================
// INVOICE DETAIL
// ============================================
function viewInvoice(id) {
  activeInvoiceId = id;
  navigateTo('invoice-detail');
}

function newInvoice() {
  const inv = {
    id: 'inv-' + Date.now(),
    invoice_number: nextInvoiceNumber(),
    project_id: DEMO_PROJECTS[0]?.id || '',
    estimate_id: null,
    stage: 'deposit',
    status: 'draft',
    amount: 0,
    tax_rate: 13,
    amount_paid: 0,
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    notes: '',
    items: [],
    payments: [],
  };
  DEMO_INVOICES.push(inv);
  activeInvoiceId = inv.id;
  navigateTo('invoice-detail');
}

function createInvoiceFromEstimate(estId) {
  const est = DEMO_ESTIMATES.find(e => e.id === estId);
  if (!est || est.status !== 'accepted') return;

  // Find the project created from this estimate
  const proj = DEMO_PROJECTS.find(p => p.client_brand === est.client_name);

  const costSubtotal = (est.items || []).reduce((s, i) => s + i.qty * i.unit_cost, 0);
  const marginAmt = costSubtotal * (est.margin_pct || 0) / 100;
  const quoteTotal = costSubtotal + marginAmt;

  // Default deposit = 30%
  const depositAmount = Math.round(quoteTotal * 0.3 * 100) / 100;

  const inv = {
    id: 'inv-' + Date.now(),
    invoice_number: nextInvoiceNumber(),
    project_id: proj ? proj.id : '',
    estimate_id: estId,
    stage: 'deposit',
    status: 'draft',
    amount: depositAmount,
    tax_rate: 13,
    amount_paid: 0,
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    notes: 'Deposit invoice — 30% of accepted estimate',
    items: (est.items || []).map(i => ({
      description: i.description,
      qty: i.qty,
      unit: i.unit,
      unit_cost: Math.round(i.unit_cost * 0.3 * 100) / 100,
    })),
    payments: [],
  };
  DEMO_INVOICES.push(inv);
  activeInvoiceId = inv.id;
  navigateTo('invoice-detail');
}

pageRenderers['invoice-detail'] = () => {
  const inv = DEMO_INVOICES.find(i => i.id === activeInvoiceId);
  if (!inv) return '<div class="empty-state"><p>Invoice not found.</p></div>';

  const proj = DEMO_PROJECTS.find(p => p.id === inv.project_id);
  const balance = inv.amount - inv.amount_paid;
  const isDraft = inv.status === 'draft';
  const items = inv.items || [];
  const subtotal = items.length > 0
    ? items.reduce((s, i) => s + (i.qty || 1) * (i.unit_cost || 0), 0)
    : inv.amount;
  const taxAmt = subtotal * (inv.tax_rate || 13) / 100;
  const total = subtotal + taxAmt;

  // If no line items, use inv.amount for totals
  const displaySubtotal = items.length > 0 ? subtotal : inv.amount;
  const displayTax = displaySubtotal * (inv.tax_rate || 13) / 100;
  const displayTotal = displaySubtotal + displayTax;

  return `
    <div class="page-header">
      <div style="display:flex;align-items:center;gap:12px;">
        <button class="btn btn-outline btn-sm" onclick="navigateTo('invoices')"><i class="fas fa-arrow-left"></i></button>
        <div>
          <h1>${inv.invoice_number}</h1>
          <p class="page-header-sub">${proj ? proj.name : 'No project'} &middot; ${(inv.stage || '').replace(/_/g, ' ')} &middot; Issued ${inv.issue_date || '—'}</p>
        </div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <span class="status-badge status-${inv.status}" style="font-size:13px;padding:6px 14px;">${formatStatus(inv.status)}</span>
        ${inv.acknowledged_by ? `<span class="status-badge status-acknowledged" style="font-size:11px;">Acknowledged by ${inv.acknowledged_by}</span>` : ''}
        ${inv.status === 'draft' ? `<button class="btn btn-accent btn-sm" onclick="updateInvoiceStatus('${inv.id}','sent')"><i class="fas fa-paper-plane"></i> Mark Sent</button>` : ''}
        ${inv.status === 'sent' || inv.status === 'partially_paid' ? `<button class="btn btn-accent btn-sm" onclick="showRecordPayment('${inv.id}')"><i class="fas fa-dollar-sign"></i> Record Payment</button>` : ''}
        <button class="btn btn-navy btn-sm" onclick="exportInvoicePDF('${inv.id}')"><i class="fas fa-file-pdf"></i> Export PDF</button>
      </div>
    </div>

    <div class="grid-2 mb-24">
      <!-- Invoice details -->
      <div class="stat-card">
        <div class="section-title" style="margin-bottom:12px;">Invoice Details</div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Project</label>
            <select class="form-input-styled" onchange="invField('${inv.id}','project_id',this.value)" ${isDraft ? '' : 'disabled'}>
              <option value="">Select project...</option>
              ${DEMO_PROJECTS.map(p => `<option value="${p.id}" ${p.id === inv.project_id ? 'selected' : ''}>${p.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Stage</label>
            <select class="form-input-styled" onchange="invField('${inv.id}','stage',this.value)" ${isDraft ? '' : 'disabled'}>
              <option value="deposit" ${inv.stage === 'deposit' ? 'selected' : ''}>Deposit (30%)</option>
              <option value="progress" ${inv.stage === 'progress' ? 'selected' : ''}>Progress</option>
              <option value="final" ${inv.stage === 'final' ? 'selected' : ''}>Final</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Issue Date</label>
            <input type="date" class="form-input-styled" value="${inv.issue_date || ''}" onchange="invField('${inv.id}','issue_date',this.value)" ${isDraft ? '' : 'readonly'}>
          </div>
          <div class="form-group">
            <label class="form-label">Due Date</label>
            <input type="date" class="form-input-styled" value="${inv.due_date || ''}" onchange="invField('${inv.id}','due_date',this.value)" ${isDraft ? '' : 'readonly'}>
          </div>
          <div class="form-group">
            <label class="form-label">Tax Rate (%)</label>
            <input type="number" class="form-input-styled" value="${inv.tax_rate || 13}" step="0.01" onchange="invField('${inv.id}','tax_rate',parseFloat(this.value)||13); navigateTo('invoice-detail');" ${isDraft ? '' : 'readonly'}>
          </div>
          <div class="form-group">
            <label class="form-label">Notes</label>
            <input class="form-input-styled" value="${inv.notes || ''}" placeholder="Optional notes" onchange="invField('${inv.id}','notes',this.value)">
          </div>
        </div>
      </div>

      <!-- Payment summary -->
      <div>
        <div class="stats-grid" style="grid-template-columns:1fr 1fr;margin-bottom:16px;">
          ${statCard('Amount', formatCAD(displayTotal), 'fas fa-file-invoice-dollar', 'var(--blue)', 'Incl. HST')}
          ${statCard('Balance', formatCAD(balance > 0 ? balance : 0), 'fas fa-exclamation-circle', balance > 0 ? 'var(--red)' : 'var(--green)', balance > 0 ? 'Owing' : 'Paid in full')}
        </div>

        <!-- Payments log -->
        <div class="stat-card">
          <div class="section-title" style="margin-bottom:12px;">Payments Received</div>
          ${(inv.payments || []).length > 0 ? `
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${inv.payments.map((pay, idx) => `
              <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:var(--radius);background:var(--green-bg);border:1px solid rgba(34,197,94,0.2);">
                <i class="fas fa-check-circle" style="color:var(--green);"></i>
                <div style="flex:1;">
                  <div style="font-size:13px;font-weight:600;">${formatCAD(pay.amount)}</div>
                  <div class="text-muted" style="font-size:12px;">${pay.date} ${pay.method ? '· ' + pay.method : ''}</div>
                </div>
              </div>
            `).join('')}
          </div>
          ` : '<div class="text-muted" style="font-size:13px;text-align:center;padding:16px;">No payments recorded.</div>'}
        </div>
      </div>
    </div>

    <!-- Line items -->
    <div class="data-table-container mb-20">
      <div class="data-table-header">
        <span class="data-table-title">Line Items</span>
        ${isDraft ? `<button class="btn btn-accent btn-sm" onclick="addInvoiceItem('${inv.id}')"><i class="fas fa-plus"></i> Add Row</button>` : ''}
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:45%;">Description</th>
            <th style="width:70px;">Qty</th>
            <th style="width:70px;">Unit</th>
            <th style="width:110px;">Unit Cost</th>
            <th style="width:110px;text-align:right;">Total</th>
            ${isDraft ? '<th style="width:40px;"></th>' : ''}
          </tr>
        </thead>
        <tbody>
          ${items.length > 0 ? items.map((item, idx) => `
            <tr>
              <td>${isDraft
                ? `<input class="form-input-styled" value="${item.description || ''}" onchange="invItemField('${inv.id}',${idx},'description',this.value)" style="padding:6px 10px;font-size:13px;">`
                : (item.description || '')}</td>
              <td>${isDraft
                ? `<input class="form-input-styled" type="number" value="${item.qty || 1}" onchange="invItemField('${inv.id}',${idx},'qty',parseFloat(this.value)||1); navigateTo('invoice-detail');" style="padding:6px 8px;font-size:13px;text-align:right;">`
                : (item.qty || 1)}</td>
              <td>${isDraft
                ? `<input class="form-input-styled" value="${item.unit || 'lot'}" onchange="invItemField('${inv.id}',${idx},'unit',this.value)" style="padding:6px 8px;font-size:13px;">`
                : (item.unit || 'lot')}</td>
              <td>${isDraft
                ? `<input class="form-input-styled" type="number" step="0.01" value="${item.unit_cost || 0}" onchange="invItemField('${inv.id}',${idx},'unit_cost',parseFloat(this.value)||0); navigateTo('invoice-detail');" style="padding:6px 8px;font-size:13px;text-align:right;">`
                : formatCAD(item.unit_cost || 0)}</td>
              <td style="text-align:right;font-weight:600;">${formatCAD((item.qty || 1) * (item.unit_cost || 0))}</td>
              ${isDraft ? `<td><button class="btn-icon" onclick="removeInvoiceItem('${inv.id}',${idx})" title="Remove"><i class="fas fa-trash" style="color:var(--red);font-size:12px;"></i></button></td>` : ''}
            </tr>
          `).join('') : `
            <tr>
              <td colspan="${isDraft ? 6 : 5}">
                ${isDraft
                  ? '<div class="text-muted" style="text-align:center;padding:16px;">No line items. Click "Add Row" or set a lump sum amount below.</div>'
                  : `<div style="padding:12px;font-size:13px;">Lump sum: <strong>${formatCAD(inv.amount)}</strong></div>`}
              </td>
            </tr>`}
        </tbody>
      </table>
    </div>

    <!-- Totals -->
    <div class="stat-card" style="max-width:400px;margin-left:auto;">
      ${isDraft && items.length === 0 ? `
      <div class="form-group" style="margin-bottom:12px;">
        <label class="form-label">Lump Sum Amount (before tax)</label>
        <input class="form-input-styled" type="number" step="0.01" value="${inv.amount}" onchange="invField('${inv.id}','amount',parseFloat(this.value)||0); navigateTo('invoice-detail');" style="font-size:16px;font-weight:600;">
      </div>
      ` : ''}
      <div style="display:flex;flex-direction:column;gap:8px;font-size:14px;">
        <div style="display:flex;justify-content:space-between;">
          <span class="text-muted">Subtotal</span>
          <span style="font-weight:600;">${formatCAD(displaySubtotal)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span class="text-muted">HST (${inv.tax_rate || 13}%)</span>
          <span style="font-weight:600;">${formatCAD(displayTax)}</span>
        </div>
        <div style="height:1px;background:var(--card-border);margin:4px 0;"></div>
        <div style="display:flex;justify-content:space-between;font-size:18px;">
          <span style="font-weight:700;color:var(--navy);">Total (CAD)</span>
          <span style="font-weight:700;color:var(--orange);">${formatCAD(displayTotal)}</span>
        </div>
        ${inv.amount_paid > 0 ? `
        <div style="display:flex;justify-content:space-between;margin-top:4px;">
          <span class="text-muted">Paid</span>
          <span style="font-weight:600;color:var(--green);">-${formatCAD(inv.amount_paid)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="font-weight:600;">Balance Owing</span>
          <span style="font-weight:700;color:var(--red);">${formatCAD(balance > 0 ? balance : 0)}</span>
        </div>` : ''}
      </div>
    </div>
  `;
};

function invField(id, field, value) {
  const inv = DEMO_INVOICES.find(i => i.id === id);
  if (inv) inv[field] = value;
}

function invItemField(id, idx, field, value) {
  const inv = DEMO_INVOICES.find(i => i.id === id);
  if (inv && inv.items && inv.items[idx]) {
    inv.items[idx][field] = value;
    // Recalc invoice amount from line items
    inv.amount = inv.items.reduce((s, item) => s + (item.qty || 1) * (item.unit_cost || 0), 0);
  }
}

function addInvoiceItem(id) {
  const inv = DEMO_INVOICES.find(i => i.id === id);
  if (!inv) return;
  if (!inv.items) inv.items = [];
  inv.items.push({ description: '', qty: 1, unit: 'lot', unit_cost: 0 });
  navigateTo('invoice-detail');
}

function removeInvoiceItem(id, idx) {
  const inv = DEMO_INVOICES.find(i => i.id === id);
  if (inv && inv.items) {
    inv.items.splice(idx, 1);
    inv.amount = inv.items.reduce((s, item) => s + (item.qty || 1) * (item.unit_cost || 0), 0);
    navigateTo('invoice-detail');
  }
}

function updateInvoiceStatus(id, status) {
  const inv = DEMO_INVOICES.find(i => i.id === id);
  if (inv) {
    inv.status = status;
    navigateTo('invoice-detail');
  }
}

function showRecordPayment(id) {
  const inv = DEMO_INVOICES.find(i => i.id === id);
  if (!inv) return;
  const balance = inv.amount - inv.amount_paid;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'payment-modal';
  overlay.innerHTML = `
    <div class="modal-card" style="max-width:420px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3>Record Payment</h3>
        <button class="btn-icon" onclick="document.getElementById('payment-modal').remove()" style="color:var(--text-muted);font-size:18px;"><i class="fas fa-times"></i></button>
      </div>
      <p class="text-muted" style="font-size:13px;margin-bottom:16px;">${inv.invoice_number} &middot; Balance owing: <strong style="color:var(--red);">${formatCAD(balance)}</strong></p>
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="form-group">
          <label class="form-label">Payment Amount (CAD)</label>
          <input id="pay-amount" class="form-input-styled" type="number" step="0.01" value="${balance.toFixed(2)}" style="font-size:16px;font-weight:600;" inputmode="decimal">
        </div>
        <div class="form-group">
          <label class="form-label">Payment Date</label>
          <input id="pay-date" class="form-input-styled" type="date" value="${new Date().toISOString().split('T')[0]}">
        </div>
        <div class="form-group">
          <label class="form-label">Method</label>
          <select id="pay-method" class="form-input-styled">
            <option>Wire Transfer</option>
            <option>Cheque</option>
            <option>E-Transfer</option>
            <option>Credit Card</option>
            <option>Cash</option>
          </select>
        </div>
        <button class="btn btn-accent btn-full btn-lg" onclick="recordPayment('${inv.id}')"><i class="fas fa-check"></i> Record Payment</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function recordPayment(id) {
  const inv = DEMO_INVOICES.find(i => i.id === id);
  if (!inv) return;

  const amount = parseFloat(document.getElementById('pay-amount').value) || 0;
  const date = document.getElementById('pay-date').value;
  const method = document.getElementById('pay-method').value;

  if (amount <= 0) { alert('Enter a valid amount.'); return; }

  if (!inv.payments) inv.payments = [];
  const pay = { amount, date, method };
  inv.payments.push(pay);
  inv.amount_paid += amount;

  // Update status
  if (inv.amount_paid >= inv.amount) {
    inv.status = 'paid';
  } else if (inv.amount_paid > 0) {
    inv.status = 'partially_paid';
  }

  // Save to Supabase
  if (typeof savePayment === 'function') savePayment(inv.id, pay);

  document.getElementById('payment-modal').remove();
  navigateTo('invoice-detail');
}

// ============================================
// INVOICE PDF EXPORT
// ============================================
function exportInvoicePDF(id) {
  const inv = DEMO_INVOICES.find(i => i.id === id);
  if (!inv) return;

  const proj = DEMO_PROJECTS.find(p => p.id === inv.project_id);
  const items = inv.items || [];
  const subtotal = items.length > 0
    ? items.reduce((s, i) => s + (i.qty || 1) * (i.unit_cost || 0), 0)
    : inv.amount;
  const taxRate = inv.tax_rate || 13;
  const taxAmt = subtotal * taxRate / 100;
  const total = subtotal + taxAmt;

  const html = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<title>Invoice ${inv.invoice_number}</title>
<style>
  body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #1f2937; margin: 0; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 3px solid #1a2744; }
  .logo-area h1 { font-size: 24px; font-weight: 800; color: #1a2744; margin: 0; }
  .logo-area p { font-size: 11px; color: #6b7280; margin: 2px 0 0; }
  .inv-label { text-align: right; }
  .inv-label h2 { font-size: 20px; color: #f97316; margin: 0; }
  .inv-label p { font-size: 11px; color: #6b7280; margin: 2px 0 0; }
  .info-grid { display: flex; gap: 40px; margin-bottom: 28px; }
  .info-block h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin: 0 0 6px; }
  .info-block p { margin: 2px 0; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  th { background: #f3f4f6; text-align: left; padding: 8px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
  td { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; font-size: 12px; }
  .text-right { text-align: right; }
  .totals { margin-left: auto; width: 280px; }
  .totals div { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
  .totals .total-line { border-top: 2px solid #1a2744; padding-top: 10px; margin-top: 4px; font-size: 16px; font-weight: 700; }
  .total-amount { color: #f97316; }
  .payment-info { margin-top: 32px; padding: 20px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; }
  .payment-info h3 { font-size: 12px; font-weight: 700; margin: 0 0 8px; color: #1a2744; }
  .payment-info p { margin: 2px 0; font-size: 11px; color: #6b7280; }
  .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #9ca3af; }
  @media print { body { padding: 20px; } }
</style>
</head><body>
  <div class="header">
    <div class="logo-area">
      <h1>TRIVEX GROUP CORP</h1>
      <p>Commercial Construction &middot; Franchise Fit-Outs</p>
      <p>Burlington, ON &middot; trivexgroup.com</p>
    </div>
    <div class="inv-label">
      <h2>INVOICE</h2>
      <p>${inv.invoice_number}</p>
      <p>Stage: ${(inv.stage || 'invoice').replace(/_/g, ' ').toUpperCase()}</p>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-block">
      <h3>Bill To</h3>
      <p><strong>${proj ? proj.client_brand : '—'}</strong></p>
      <p>${proj ? proj.city : ''}</p>
    </div>
    <div class="info-block">
      <h3>Project</h3>
      <p>${proj ? proj.name : '—'}</p>
    </div>
    <div class="info-block">
      <h3>Invoice Date</h3>
      <p>Issued: ${inv.issue_date || '—'}</p>
      <p>Due: ${inv.due_date || '—'}</p>
    </div>
  </div>

  ${items.length > 0 ? `
  <table>
    <thead><tr><th>Description</th><th class="text-right">Qty</th><th>Unit</th><th class="text-right">Unit Cost</th><th class="text-right">Total</th></tr></thead>
    <tbody>
      ${items.map(i => `
        <tr>
          <td>${i.description || ''}</td>
          <td class="text-right">${(i.qty || 1).toLocaleString()}</td>
          <td>${i.unit || 'lot'}</td>
          <td class="text-right">$${(i.unit_cost || 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}</td>
          <td class="text-right"><strong>$${((i.qty || 1) * (i.unit_cost || 0)).toLocaleString('en-CA', { minimumFractionDigits: 2 })}</strong></td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}

  <div class="totals">
    <div><span>Subtotal</span><span>$${subtotal.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</span></div>
    <div><span>HST (${taxRate}%)</span><span>$${taxAmt.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</span></div>
    <div class="total-line"><span>TOTAL (CAD)</span><span class="total-amount">$${total.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</span></div>
    ${inv.amount_paid > 0 ? `
    <div style="margin-top:8px;"><span>Paid to Date</span><span style="color:#22c55e;">-$${inv.amount_paid.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</span></div>
    <div><span><strong>Balance Owing</strong></span><span style="color:#ef4444;"><strong>$${(total - inv.amount_paid > 0 ? total - inv.amount_paid : 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}</strong></span></div>
    ` : ''}
  </div>

  <div class="payment-info">
    <h3>Payment Instructions</h3>
    <p>Please make payment to:</p>
    <p><strong>Trivex Group Corp</strong></p>
    <p>Wire Transfer / E-Transfer / Cheque</p>
    <p>Payment due by: ${inv.due_date || 'As agreed'}</p>
    <p style="margin-top:8px;">Please reference invoice number <strong>${inv.invoice_number}</strong> with your payment.</p>
  </div>

  ${inv.notes ? `<div style="margin-top:20px;font-size:11px;color:#6b7280;"><strong>Notes:</strong> ${inv.notes}</div>` : ''}

  <div class="footer">
    Trivex Group Corp &middot; Burlington, ON &middot; HST# [To Be Added] &middot; Generated via XOS
  </div>
</body></html>`;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => printWindow.print();
}

// ============================================
// EXPENSES
// ============================================
pageRenderers.expenses = () => {
  const expenses = currentUser.role === 'field'
    ? DEMO_EXPENSES.filter(e => e.submitted_by === currentUser.email)
    : DEMO_EXPENSES;

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const byCategory = {};
  expenses.forEach(e => {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  });

  return `
    <div class="page-header">
      <div>
        <h1>Expenses</h1>
        <p class="page-header-sub">${expenses.length} receipts &middot; Total: ${formatCAD(total)}</p>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-outline" onclick="exportExpensesCSV()"><i class="fas fa-download"></i> Export CSV</button>
        <button class="btn btn-accent" onclick="openReceiptCapture()"><i class="fas fa-camera"></i> Capture Receipt</button>
      </div>
    </div>

    <div class="stats-grid" style="grid-template-columns:repeat(${Math.min(Object.keys(byCategory).length, 4)}, 1fr);">
      ${Object.entries(byCategory).map(([cat, amt]) => {
        const icons = { Materials: 'fas fa-box', Labour: 'fas fa-users', Equipment: 'fas fa-tools', Subcontractor: 'fas fa-handshake', Permits: 'fas fa-stamp', Other: 'fas fa-ellipsis-h' };
        return statCard(cat, formatCAD(amt), icons[cat] || 'fas fa-tag', 'var(--orange)', '');
      }).join('')}
    </div>

    <div class="data-table-container">
      <table class="data-table">
        <thead><tr><th style="width:50px;"></th><th>Vendor</th><th>Amount</th><th>Category</th><th>Date</th><th>Project</th><th>Submitted By</th></tr></thead>
        <tbody>
          ${expenses.map(e => {
            const proj = DEMO_PROJECTS.find(p => p.id === e.project_id);
            const user = DEMO_USERS[e.submitted_by];
            return `<tr>
              <td>${e.receipt_thumbnail ? `<img src="${e.receipt_thumbnail}" style="width:36px;height:36px;object-fit:cover;border-radius:4px;border:1px solid var(--card-border);">` : '<i class="fas fa-receipt" style="color:var(--text-light);font-size:16px;"></i>'}</td>
              <td><strong>${e.vendor}</strong>${e.notes ? `<div class="text-muted" style="font-size:11px;">${e.notes}</div>` : ''}</td>
              <td style="font-weight:600;">${formatCAD(e.amount)}</td>
              <td><span class="tag">${e.category}</span></td>
              <td>${e.expense_date}</td>
              <td class="text-muted">${proj ? proj.name : '—'}</td>
              <td class="text-muted">${user ? user.full_name : e.submitted_by}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
};

// ============================================
// FINANCES (placeholder)
// ============================================
pageRenderers.finances = () => {
  const totalInvoiced = DEMO_INVOICES.reduce((s, i) => s + i.amount, 0);
  const totalCollected = DEMO_INVOICES.reduce((s, i) => s + i.amount_paid, 0);
  const totalExpenses = DEMO_EXPENSES.reduce((s, e) => s + e.amount, 0);
  const corpExpenses = DEMO_EXPENSES.filter(e => e.project_id === 'trivex-corp').reduce((s, e) => s + e.amount, 0);
  const projectExpensesTotal = totalExpenses - corpExpenses;
  const netMargin = totalCollected - totalExpenses;
  const outstanding = DEMO_INVOICES.filter(i => i.status !== 'paid');
  const allPayments = DEMO_INVOICES.flatMap(inv => (inv.payments || []).map(pay => ({ ...pay, invoice: inv }))).sort((a, b) => b.date.localeCompare(a.date));

  // Per-project P&L — include sub costs
  const allProjectIds = [...new Set([...DEMO_PROJECTS.map(p => p.id)])];
  const projectPL = allProjectIds.map(pid => {
    const proj = DEMO_PROJECTS.find(p => p.id === pid);
    const invoiced = DEMO_INVOICES.filter(i => i.project_id === pid).reduce((s, i) => s + i.amount, 0);
    const collected = DEMO_INVOICES.filter(i => i.project_id === pid).reduce((s, i) => s + i.amount_paid, 0);
    const expenses = DEMO_EXPENSES.filter(e => e.project_id === pid).reduce((s, e) => s + e.amount, 0);
    const subCosts = (DEMO_SUB_ASSIGNMENTS[pid] || []).reduce((s, a) => s + a.amount_paid, 0);
    const totalCosts = expenses + subCosts;
    const profit = collected - totalCosts;
    const marginPct = collected > 0 ? Math.round((profit / collected) * 100) : 0;
    return { proj, invoiced, collected, expenses, subCosts, totalCosts, profit, marginPct, budget: proj ? proj.budget : 0 };
  }).filter(pp => pp.invoiced > 0 || pp.expenses > 0 || pp.subCosts > 0);

  const totalProfit = projectPL.reduce((s, pp) => s + pp.profit, 0);
  const totalCostsAll = projectPL.reduce((s, pp) => s + pp.totalCosts, 0);
  const totalSubCostsAll = projectPL.reduce((s, pp) => s + pp.subCosts, 0);

  return `
    <div class="page-header">
      <div>
        <h1>Company Finances</h1>
        <p class="page-header-sub">March 2026 overview</p>
      </div>
    </div>

    <div class="stats-grid" style="grid-template-columns:repeat(5,1fr);">
      ${statCard('Collected', formatCAD(totalCollected), 'fas fa-hand-holding-usd', 'var(--green)', `${Math.round(totalCollected/(totalInvoiced||1)*100)}% of ${formatCAD(totalInvoiced)}`)}
      ${statCard('Expenses', formatCAD(totalExpenses), 'fas fa-receipt', 'var(--red)', `${DEMO_EXPENSES.length} receipts`)}
      ${statCard('Sub Costs', formatCAD(totalSubCostsAll), 'fas fa-hard-hat', 'var(--orange)', 'Paid to subs')}
      ${statCard('Total Costs', formatCAD(totalCostsAll), 'fas fa-calculator', 'var(--purple)', 'Expenses + Subs')}
      ${statCard('Total Profit', formatCAD(totalProfit), 'fas fa-chart-line', totalProfit >= 0 ? 'var(--green)' : 'var(--red)', totalCollected > 0 ? Math.round((totalProfit / totalCollected) * 100) + '% margin' : '')}
    </div>

    <!-- PROFIT BY PROJECT -->
    <div class="data-table-container mb-24">
      <div class="data-table-header">
        <span class="data-table-title"><i class="fas fa-chart-line" style="color:var(--green);margin-right:6px;"></i>Profit by Project</span>
      </div>
      <table class="data-table">
        <thead><tr><th>Project</th><th>Collected</th><th>Expenses</th><th>Sub Costs</th><th>Total Costs</th><th>Profit</th><th>Margin %</th></tr></thead>
        <tbody>
          ${projectPL.map(pp => `
            <tr style="cursor:pointer;" onclick="viewProject('${pp.proj ? pp.proj.id : ''}')">
              <td>
                <strong>${pp.proj ? pp.proj.name : '—'}</strong>
                <div class="text-muted" style="font-size:11px;">${pp.proj ? pp.proj.client_brand : ''} · Budget: ${formatCAD(pp.budget)}</div>
              </td>
              <td style="color:var(--green);">${formatCAD(pp.collected)}</td>
              <td>${formatCAD(pp.expenses)}</td>
              <td>${formatCAD(pp.subCosts)}</td>
              <td>${formatCAD(pp.totalCosts)}</td>
              <td style="font-size:15px;font-weight:700;color:${pp.profit >= 0 ? 'var(--green)' : 'var(--red)'};">${formatCAD(pp.profit)}</td>
              <td>
                <div style="display:flex;align-items:center;gap:6px;">
                  <div class="progress-bar" style="flex:1;min-width:50px;"><div class="progress-fill" style="width:${Math.max(0, Math.min(pp.marginPct, 100))}%;background:${pp.marginPct >= 0 ? 'var(--green)' : 'var(--red)'};"></div></div>
                  <span style="font-size:12px;font-weight:600;color:${pp.marginPct >= 0 ? 'var(--green)' : 'var(--red)'};">${pp.marginPct}%</span>
                </div>
              </td>
            </tr>
          `).join('')}
          <tr style="background:var(--page-bg);border-top:2px solid var(--navy);">
            <td style="font-size:14px;font-weight:700;color:var(--navy);">TOTAL</td>
            <td style="font-weight:700;color:var(--green);">${formatCAD(totalCollected)}</td>
            <td style="font-weight:700;">${formatCAD(totalExpenses)}</td>
            <td style="font-weight:700;">${formatCAD(totalSubCostsAll)}</td>
            <td style="font-weight:700;">${formatCAD(totalCostsAll)}</td>
            <td style="font-size:16px;font-weight:800;color:${totalProfit >= 0 ? 'var(--green)' : 'var(--red)'};">${formatCAD(totalProfit)}</td>
            <td style="font-size:14px;font-weight:700;color:${totalProfit >= 0 ? 'var(--green)' : 'var(--red)'};">${totalCollected > 0 ? Math.round((totalProfit / totalCollected) * 100) : 0}%</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="grid-2 mb-24">
      <!-- Outstanding Invoices -->
      <div class="data-table-container">
        <div class="data-table-header">
          <span class="data-table-title">Outstanding Invoices</span>
        </div>
        <table class="data-table">
          <thead><tr><th>Invoice</th><th>Project</th><th>Balance</th><th>Due</th><th>Days</th></tr></thead>
          <tbody>
            ${outstanding.length > 0 ? outstanding.map(inv => {
              const proj = DEMO_PROJECTS.find(p => p.id === inv.project_id);
              const balance = inv.amount - inv.amount_paid;
              const today = new Date('2026-03-28');
              const due = new Date(inv.due_date);
              const daysUntil = Math.round((due - today) / (1000 * 60 * 60 * 24));
              const overdue = daysUntil < 0;
              return `<tr>
                <td><strong>${inv.invoice_number}</strong><div class="text-muted" style="font-size:11px;">${(inv.stage || '').replace(/_/g,' ')}</div></td>
                <td class="text-muted">${proj ? proj.name : '—'}</td>
                <td style="font-weight:600;color:var(--red);">${formatCAD(balance)}</td>
                <td>${inv.due_date}</td>
                <td style="color:${overdue ? 'var(--red)' : 'var(--text-muted)'}; font-weight:${overdue ? '600' : '400'};">${overdue ? Math.abs(daysUntil) + 'd overdue' : daysUntil + 'd'}</td>
              </tr>`;
            }).join('') : '<tr><td colspan="5" class="text-muted" style="text-align:center;padding:20px;">All invoices paid.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Monthly Chart (simple bar chart) -->
    <div class="stat-card mb-24">
      <div class="section-title" style="margin-bottom:16px;"><i class="fas fa-chart-bar" style="color:var(--blue);margin-right:6px;"></i>Monthly Overview — Last 6 Months</div>
      ${(() => {
        const months = ['Oct 2025', 'Nov 2025', 'Dec 2025', 'Jan 2026', 'Feb 2026', 'Mar 2026'];
        const invoicedData = [85000, 120000, 95000, 207000, 174000, totalInvoiced];
        const collectedData = [85000, 110000, 95000, 201000, 174000, totalCollected];
        const expenseData = [12000, 18000, 14000, 22000, 16000, totalExpenses];
        const maxVal = Math.max(...invoicedData, ...collectedData);
        return `
        <div style="display:flex;gap:12px;align-items:flex-end;height:180px;padding:0 8px;">
          ${months.map((m, i) => `
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;height:100%;">
              <div style="flex:1;display:flex;align-items:flex-end;gap:3px;width:100%;">
                <div style="flex:1;background:var(--blue);border-radius:3px 3px 0 0;height:${Math.round(invoicedData[i] / maxVal * 100)}%;" title="Invoiced: ${formatCAD(invoicedData[i])}"></div>
                <div style="flex:1;background:var(--green);border-radius:3px 3px 0 0;height:${Math.round(collectedData[i] / maxVal * 100)}%;" title="Collected: ${formatCAD(collectedData[i])}"></div>
                <div style="flex:1;background:var(--red);border-radius:3px 3px 0 0;height:${Math.max(Math.round(expenseData[i] / maxVal * 100), 3)}%;" title="Expenses: ${formatCAD(expenseData[i])}"></div>
              </div>
              <div style="font-size:10px;color:var(--text-muted);white-space:nowrap;">${m.split(' ')[0]}</div>
            </div>
          `).join('')}
        </div>
        <div style="display:flex;justify-content:center;gap:20px;margin-top:12px;font-size:11px;">
          <div style="display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;border-radius:2px;background:var(--blue);display:inline-block;"></span> Invoiced</div>
          <div style="display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;border-radius:2px;background:var(--green);display:inline-block;"></span> Collected</div>
          <div style="display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;border-radius:2px;background:var(--red);display:inline-block;"></span> Expenses</div>
        </div>`;
      })()}
    </div>

    <!-- Subcontractor Liability -->
    <div class="grid-2 mb-24">
      <div class="stat-card">
        <div class="section-title" style="margin-bottom:12px;"><i class="fas fa-hard-hat" style="color:var(--orange);margin-right:6px;"></i>Subcontractor Liability</div>
        ${(() => {
          let totalSubContract = 0, totalSubPaid = 0;
          Object.values(DEMO_SUB_ASSIGNMENTS).forEach(assignments => {
            assignments.forEach(a => { totalSubContract += a.contract_amount; totalSubPaid += a.amount_paid; });
          });
          const totalSubOwing = totalSubContract - totalSubPaid;
          // Top owing subs
          const subOwing = DEMO_SUBS.map(sub => {
            let owing = 0;
            Object.values(DEMO_SUB_ASSIGNMENTS).forEach(assignments => {
              const a = assignments.find(x => x.sub_id === sub.id);
              if (a) owing += a.contract_amount - a.amount_paid;
            });
            return { ...sub, owing };
          }).filter(s => s.owing > 0).sort((a, b) => b.owing - a.owing);

          return `
          <div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:14px;">
            <span class="text-muted">Total owing to subs</span>
            <span style="font-weight:700;color:var(--red);">${formatCAD(totalSubOwing)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:16px;font-size:13px;">
            <span class="text-muted">Total sub contracts</span>
            <span style="font-weight:600;">${formatCAD(totalSubContract)}</span>
          </div>
          ${subOwing.length > 0 ? subOwing.map(s => `
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-top:1px solid var(--card-border);font-size:13px;">
              <span>${s.company} <span class="tag">${s.trade}</span></span>
              <span style="font-weight:600;color:var(--red);">${formatCAD(s.owing)}</span>
            </div>
          `).join('') : '<div class="text-muted" style="text-align:center;padding:16px;font-size:13px;">All subs paid in full.</div>'}`;
        })()}
      </div>

      <!-- Payment History -->
      <div class="stat-card">
        <div class="section-title" style="margin-bottom:12px;"><i class="fas fa-history" style="color:var(--green);margin-right:6px;"></i>Recent Payments</div>
        ${allPayments.length > 0 ? allPayments.slice(0, 5).map(pay => {
          const proj = DEMO_PROJECTS.find(p => p.id === pay.invoice.project_id);
          return `
          <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--card-border);">
            <i class="fas fa-check-circle" style="color:var(--green);font-size:14px;"></i>
            <div style="flex:1;">
              <div style="font-size:13px;font-weight:500;">${formatCAD(pay.amount)}</div>
              <div class="text-muted" style="font-size:11px;">${pay.invoice.invoice_number} &middot; ${proj ? proj.name.split('—')[0].trim() : ''}</div>
            </div>
            <div style="font-size:12px;color:var(--text-muted);">${pay.date}</div>
          </div>`;
        }).join('') : '<div class="text-muted" style="text-align:center;padding:16px;">No payments yet.</div>'}
      </div>
    </div>

    <!-- All Invoices -->
    <div class="data-table-container">
      <div class="data-table-header">
        <span class="data-table-title">All Invoices</span>
      </div>
      <table class="data-table">
        <thead><tr><th>Invoice</th><th>Project</th><th>Stage</th><th>Issued</th><th>Due</th><th>Amount</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead>
        <tbody>
          ${DEMO_INVOICES.map(inv => {
            const proj = DEMO_PROJECTS.find(p => p.id === inv.project_id);
            const balance = inv.amount - inv.amount_paid;
            return `<tr style="cursor:pointer;" onclick="viewInvoice('${inv.id}')">
              <td><strong>${inv.invoice_number}</strong></td>
              <td class="text-muted">${proj ? proj.name : '—'}</td>
              <td><span class="tag">${(inv.stage || 'invoice').replace(/_/g,' ')}</span></td>
              <td>${inv.issue_date || '—'}</td>
              <td>${inv.due_date}</td>
              <td>${formatCAD(inv.amount)}</td>
              <td style="color:var(--green);">${formatCAD(inv.amount_paid)}</td>
              <td style="font-weight:600;${balance > 0 ? 'color:var(--red);' : 'color:var(--green);'}">${formatCAD(balance)}</td>
              <td><span class="status-badge status-${inv.status}">${formatStatus(inv.status)}</span></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
};

// ============================================
// FRANCHISE ROLLOUT VIEW
// ============================================
pageRenderers.rollout = () => {
  // Group projects by client_brand
  const brands = {};
  DEMO_PROJECTS.forEach(p => {
    if (!brands[p.client_brand]) brands[p.client_brand] = [];
    brands[p.client_brand].push(p);
  });

  // Only show brands with projects
  const brandList = Object.entries(brands).sort((a, b) => b[1].length - a[1].length);
  const totalLocations = DEMO_PROJECTS.length;
  const inConstruction = DEMO_PROJECTS.filter(p => p.status === 'active').length;
  const completed = DEMO_PROJECTS.filter(p => p.status === 'complete').length;
  const avgCompletion = Math.round(DEMO_PROJECTS.reduce((s, p) => s + p.completion_pct, 0) / totalLocations);

  // Filter state
  const filterBrand = window._rolloutFilter || '';

  const filtered = filterBrand
    ? brandList.filter(([brand]) => brand === filterBrand)
    : brandList;

  return `
    <div class="page-header">
      <div>
        <h1>Franchise Rollout</h1>
        <p class="page-header-sub">Multi-location rollout tracking across all brands</p>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <select class="form-input-styled" style="padding:6px 12px;font-size:13px;min-height:38px;" onchange="window._rolloutFilter=this.value; navigateTo('rollout');">
          <option value="">All Brands</option>
          ${brandList.map(([brand, projects]) => `<option value="${brand}" ${brand === filterBrand ? 'selected' : ''}>${brand} (${projects.length})</option>`).join('')}
        </select>
        <button class="btn btn-outline btn-sm" onclick="exportRolloutCSV()"><i class="fas fa-download"></i> Export CSV</button>
      </div>
    </div>

    <div class="stats-grid">
      ${statCard('Total Locations', totalLocations, 'fas fa-map-marker-alt', 'var(--blue)', brandList.length + ' brands')}
      ${statCard('In Construction', inConstruction, 'fas fa-hard-hat', 'var(--orange)', 'Active sites')}
      ${statCard('Completed', completed, 'fas fa-check-circle', 'var(--green)', completed > 0 ? 'Handed over' : 'None yet')}
      ${statCard('Avg Completion', avgCompletion + '%', 'fas fa-chart-line', 'var(--purple)', 'Across all locations')}
    </div>

    ${filtered.map(([brand, projects]) => {
      const brandCompleted = projects.filter(p => p.status === 'complete').length;
      const brandActive = projects.filter(p => p.status === 'active').length;
      const brandAvg = Math.round(projects.reduce((s, p) => s + p.completion_pct, 0) / projects.length);
      const brandBudget = projects.reduce((s, p) => s + (p.budget || 0), 0);

      return `
      <div class="stat-card mb-20">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px;">
          <div>
            <div style="font-size:17px;font-weight:700;color:var(--navy);">${brand}</div>
            <div class="text-muted" style="font-size:12px;">${projects.length} location${projects.length > 1 ? 's' : ''} &middot; ${brandActive} active &middot; ${brandCompleted} complete &middot; Avg ${brandAvg}%</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:14px;font-weight:600;">${formatCAD(brandBudget)}</span>
            <span class="text-muted" style="font-size:12px;">total budget</span>
          </div>
        </div>

        <!-- Progress bar for brand -->
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
          <div class="progress-bar" style="flex:1;height:8px;">
            <div class="progress-fill" style="width:${brandAvg}%;background:var(--orange);border-radius:4px;"></div>
          </div>
          <span style="font-size:13px;font-weight:600;">${brandAvg}%</span>
        </div>

        <!-- Location rows -->
        <div class="data-table-container" style="border:none;box-shadow:none;">
          <table class="data-table">
            <thead><tr><th>Location</th><th>City</th><th>Phase</th><th>Completion</th><th>Target Opening</th><th>Budget</th><th>Status</th></tr></thead>
            <tbody>
              ${projects.map(p => {
                const currentPhase = (() => {
                  const ms = DEMO_MILESTONES[p.id] || [];
                  const inProgress = ms.find(m => m.status === 'in_progress');
                  if (inProgress) return inProgress.name;
                  const lastComplete = [...ms].reverse().find(m => m.status === 'complete');
                  if (lastComplete) return lastComplete.name + ' ✓';
                  return 'Not started';
                })();
                return `
                <tr style="cursor:pointer;" onclick="viewProject('${p.id}')">
                  <td><strong>${p.name}</strong></td>
                  <td>${p.city}</td>
                  <td class="text-muted">${currentPhase}</td>
                  <td>
                    <div style="display:flex;align-items:center;gap:6px;">
                      <div class="progress-bar" style="flex:1;min-width:60px;"><div class="progress-fill" style="width:${p.completion_pct}%;background:var(--orange);"></div></div>
                      <span style="font-size:12px;font-weight:600;">${p.completion_pct}%</span>
                    </div>
                  </td>
                  <td>${p.target_handover || 'TBD'}</td>
                  <td>${formatCAD(p.budget)}</td>
                  <td><span class="status-badge status-${p.status}">${formatStatus(p.status)}</span></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
    }).join('')}
  `;
};

function exportRolloutCSV() {
  const filterBrand = window._rolloutFilter || '';
  const projects = filterBrand
    ? DEMO_PROJECTS.filter(p => p.client_brand === filterBrand)
    : DEMO_PROJECTS;

  const headers = ['Brand', 'Location', 'City', 'Status', 'Completion %', 'Target Opening', 'Budget'];
  const rows = projects.map(p => {
    return [p.client_brand, p.name, p.city, formatStatus(p.status), p.completion_pct, p.target_handover || '', p.budget.toFixed(2)]
      .map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filterBrand ? `rollout-${filterBrand.replace(/[^a-zA-Z0-9]/g, '-')}.csv` : 'rollout-all.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================
// SUBCONTRACTORS (global page)
// ============================================
pageRenderers.subcontractors = () => {
  // Compute per-sub totals across all projects
  const subStats = DEMO_SUBS.map(sub => {
    let totalContract = 0, totalPaid = 0, projectCount = 0, lastUsed = '';
    Object.entries(DEMO_SUB_ASSIGNMENTS).forEach(([pid, assignments]) => {
      const a = assignments.find(x => x.sub_id === sub.id);
      if (a) {
        totalContract += a.contract_amount;
        totalPaid += a.amount_paid;
        projectCount++;
        (a.payments || []).forEach(pay => {
          if (pay.date > lastUsed) lastUsed = pay.date;
        });
      }
    });
    return { ...sub, totalContract, totalPaid, projectCount, lastUsed, owing: totalContract - totalPaid };
  });

  const grandContract = subStats.reduce((s, x) => s + x.totalContract, 0);
  const grandPaid = subStats.reduce((s, x) => s + x.totalPaid, 0);
  const grandOwing = grandContract - grandPaid;

  return `
    <div class="page-header">
      <div>
        <h1>Subcontractors</h1>
        <p class="page-header-sub">${DEMO_SUBS.length} subcontractors</p>
      </div>
      <button class="btn btn-accent" onclick="newSubcontractor()"><i class="fas fa-plus"></i> Add Subcontractor</button>
    </div>

    <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
      ${statCard('Total Contracts', formatCAD(grandContract), 'fas fa-file-contract', 'var(--blue)', subStats.filter(s => s.projectCount > 0).length + ' active subs')}
      ${statCard('Paid to Subs', formatCAD(grandPaid), 'fas fa-hand-holding-usd', 'var(--green)', Math.round(grandPaid / (grandContract || 1) * 100) + '% of contracts')}
      ${statCard('Total Owing', formatCAD(grandOwing), 'fas fa-exclamation-circle', grandOwing > 0 ? 'var(--red)' : 'var(--green)', grandOwing > 0 ? 'Across all projects' : 'All settled')}
    </div>

    <div class="data-table-container">
      <table class="data-table">
        <thead><tr><th>Company</th><th>Trade</th><th>Contact</th><th>Phone</th><th>Projects</th><th>Total Contract</th><th>Paid</th><th>Owing</th><th>Last Used</th></tr></thead>
        <tbody>
          ${subStats.map(sub => `
            <tr>
              <td><strong>${sub.company}</strong></td>
              <td><span class="tag">${sub.trade}</span></td>
              <td>${sub.contact}</td>
              <td class="text-muted">${sub.phone}</td>
              <td>${sub.projectCount}</td>
              <td>${formatCAD(sub.totalContract)}</td>
              <td style="color:var(--green);">${formatCAD(sub.totalPaid)}</td>
              <td style="font-weight:600;${sub.owing > 0 ? 'color:var(--red);' : 'color:var(--green);'}">${formatCAD(sub.owing)}</td>
              <td class="text-muted">${sub.lastUsed || '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
};

function newSubcontractor() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'new-sub-modal';
  overlay.innerHTML = `
    <div class="modal-card" style="max-width:480px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3>Add Subcontractor</h3>
        <button class="btn-icon" onclick="document.getElementById('new-sub-modal').remove()" style="color:var(--text-muted);font-size:18px;"><i class="fas fa-times"></i></button>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="form-group">
          <label class="form-label">Company Name</label>
          <input id="new-sub-company" class="form-input-styled" placeholder="e.g. ABC Electrical">
        </div>
        <div class="form-group">
          <label class="form-label">Trade</label>
          <select id="new-sub-trade" class="form-input-styled">
            ${SUB_TRADES.map(t => `<option>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Contact Name</label>
          <input id="new-sub-contact" class="form-input-styled" placeholder="e.g. John Smith">
        </div>
        <div style="display:flex;gap:12px;">
          <div class="form-group" style="flex:1;">
            <label class="form-label">Phone</label>
            <input id="new-sub-phone" class="form-input-styled" placeholder="905-555-0000" type="tel">
          </div>
          <div class="form-group" style="flex:1;">
            <label class="form-label">Email</label>
            <input id="new-sub-email" class="form-input-styled" placeholder="email@company.ca" type="email">
          </div>
        </div>
        <button class="btn btn-accent btn-full btn-lg" onclick="saveNewSub()"><i class="fas fa-check"></i> Add Subcontractor</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function saveNewSub() {
  const company = document.getElementById('new-sub-company').value.trim();
  if (!company) { alert('Enter a company name.'); return; }
  DEMO_SUBS.push({
    id: 'sub-' + Date.now(),
    company,
    trade: document.getElementById('new-sub-trade').value,
    contact: document.getElementById('new-sub-contact').value,
    phone: document.getElementById('new-sub-phone').value,
    email: document.getElementById('new-sub-email').value,
  });
  document.getElementById('new-sub-modal').remove();
  navigateTo('subcontractors');
}

// ============================================
// SCHEDULE + TASKS
// ============================================
function getWeekDates(offset) {
  // Get Monday of the week with given offset from "today" (2026-03-28 is a Saturday)
  const today = new Date('2026-03-28');
  today.setDate(today.getDate() + (offset * 7));
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

pageRenderers.schedule = () => {
  const weekDates = getWeekDates(scheduleWeekOffset);
  const weekLabel = weekDates[0].slice(5) + ' — ' + weekDates[6].slice(5);

  const openTasks = DEMO_TASKS.filter(t => !t.completed);
  const completedTasks = DEMO_TASKS.filter(t => t.completed);
  const overdueTasks = openTasks.filter(t => t.due_date < '2026-03-28');

  return `
    <div class="page-header">
      <div>
        <h1>Schedule & Tasks</h1>
        <p class="page-header-sub">${openTasks.length} open tasks, ${overdueTasks.length} overdue</p>
      </div>
      <button class="btn btn-accent" onclick="showNewTaskModal()"><i class="fas fa-plus"></i> New Task</button>
    </div>

    <!-- WEEKLY SCHEDULE GRID -->
    <div class="stat-card mb-20">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <button class="btn btn-outline btn-sm" onclick="scheduleWeekOffset--; navigateTo('schedule');"><i class="fas fa-chevron-left"></i></button>
        <div class="section-title" style="margin:0;">Week of ${weekLabel}</div>
        <button class="btn btn-outline btn-sm" onclick="scheduleWeekOffset++; navigateTo('schedule');"><i class="fas fa-chevron-right"></i></button>
      </div>

      <div style="overflow-x:auto;-webkit-overflow-scrolling:touch;">
        <table class="data-table" style="min-width:700px;">
          <thead>
            <tr>
              <th style="width:100px;">Team</th>
              ${weekDates.map((d, i) => {
                const isToday = d === '2026-03-28';
                const isWeekend = i >= 5;
                return `<th style="text-align:center;${isToday ? 'background:var(--orange-light);color:var(--orange);font-weight:700;' : ''}${isWeekend ? 'opacity:0.6;' : ''}">${DAY_NAMES[i]}<br><span style="font-weight:400;font-size:10px;">${d.slice(5)}</span></th>`;
              }).join('')}
            </tr>
          </thead>
          <tbody>
            ${TEAM_MEMBERS.map(member => `
              <tr>
                <td><strong>${member.name}</strong></td>
                ${weekDates.map((d, i) => {
                  const entry = DEMO_SCHEDULE.find(s => s.user_id === member.id && s.date === d);
                  const proj = entry ? DEMO_PROJECTS.find(p => p.id === entry.project_id) : null;
                  const isWeekend = i >= 5;
                  return `<td style="text-align:center;padding:8px 4px;${isWeekend ? 'opacity:0.5;' : ''}">
                    ${proj
                      ? `<div style="background:var(--orange-light);color:var(--orange);border-radius:4px;padding:4px 6px;font-size:11px;font-weight:500;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" onclick="viewProject('${proj.id}')" title="${proj.name}">${proj.name.split('—')[0].trim()}</div>`
                      : `<div style="color:var(--text-light);font-size:18px;cursor:pointer;" onclick="assignSchedule('${member.id}','${d}')" title="Assign project">+</div>`
                    }
                  </td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- TASKS -->
    <div class="grid-2">
      <!-- Open Tasks -->
      <div class="data-table-container">
        <div class="data-table-header">
          <span class="data-table-title">Open Tasks (${openTasks.length})</span>
        </div>
        ${openTasks.length > 0 ? `
        <div style="padding:0 4px;">
          ${openTasks.sort((a, b) => {
            const pOrder = { high: 0, medium: 1, low: 2 };
            return (pOrder[a.priority] || 1) - (pOrder[b.priority] || 1);
          }).map(task => {
            const proj = DEMO_PROJECTS.find(p => p.id === task.project_id);
            const member = TEAM_MEMBERS.find(m => m.id === task.assigned_to);
            const isOverdue = task.due_date < '2026-03-28';
            return `
            <div style="display:flex;align-items:flex-start;gap:10px;padding:12px;border-bottom:1px solid var(--card-border);">
              <div style="padding-top:2px;cursor:pointer;" onclick="toggleTask('${task.id}')">
                <i class="far fa-square" style="color:var(--text-light);font-size:16px;"></i>
              </div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:13px;font-weight:500;">${task.title}</div>
                <div style="display:flex;gap:8px;margin-top:4px;flex-wrap:wrap;">
                  <span class="tag">${proj ? proj.name.split('—')[0].trim() : ''}</span>
                  <span style="font-size:11px;color:var(--text-muted);">${member ? member.name : ''}</span>
                  <span style="font-size:11px;${isOverdue ? 'color:var(--red);font-weight:600;' : 'color:var(--text-muted);'}">${task.due_date}${isOverdue ? ' !' : ''}</span>
                </div>
              </div>
              <span class="status-badge status-${task.priority}" style="font-size:10px;">${task.priority}</span>
            </div>`;
          }).join('')}
        </div>` : '<div class="text-muted" style="text-align:center;padding:24px;">No open tasks.</div>'}
      </div>

      <!-- Completed Tasks -->
      <div class="data-table-container">
        <div class="data-table-header">
          <span class="data-table-title">Completed (${completedTasks.length})</span>
        </div>
        ${completedTasks.length > 0 ? `
        <div style="padding:0 4px;">
          ${completedTasks.map(task => {
            const proj = DEMO_PROJECTS.find(p => p.id === task.project_id);
            const member = TEAM_MEMBERS.find(m => m.id === task.assigned_to);
            return `
            <div style="display:flex;align-items:flex-start;gap:10px;padding:12px;border-bottom:1px solid var(--card-border);opacity:0.6;">
              <div style="padding-top:2px;cursor:pointer;" onclick="toggleTask('${task.id}')">
                <i class="fas fa-check-square" style="color:var(--green);font-size:16px;"></i>
              </div>
              <div style="flex:1;">
                <div style="font-size:13px;text-decoration:line-through;">${task.title}</div>
                <div style="display:flex;gap:8px;margin-top:4px;">
                  <span class="tag">${proj ? proj.name.split('—')[0].trim() : ''}</span>
                  <span style="font-size:11px;color:var(--text-muted);">${member ? member.name : ''}</span>
                </div>
              </div>
            </div>`;
          }).join('')}
        </div>` : '<div class="text-muted" style="text-align:center;padding:24px;">No completed tasks.</div>'}
      </div>
    </div>
  `;
};

function toggleTask(taskId) {
  const task = DEMO_TASKS.find(t => t.id === taskId);
  if (task) {
    task.completed = !task.completed;
    if (typeof saveTask === 'function') saveTask(task);
    navigateTo('schedule');
  }
}

function assignSchedule(userId, date) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'schedule-modal';
  overlay.innerHTML = `
    <div class="modal-card" style="max-width:400px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3>Assign Project</h3>
        <button class="btn-icon" onclick="document.getElementById('schedule-modal').remove()" style="color:var(--text-muted);font-size:18px;"><i class="fas fa-times"></i></button>
      </div>
      <p class="text-muted" style="font-size:13px;margin-bottom:16px;">${TEAM_MEMBERS.find(m => m.id === userId)?.name || ''} — ${date}</p>
      <div class="form-group" style="margin-bottom:16px;">
        <label class="form-label">Project</label>
        <select id="schedule-project" class="form-input-styled">
          ${DEMO_PROJECTS.filter(p => p.status !== 'complete').map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
        </select>
      </div>
      <button class="btn btn-accent btn-full" onclick="saveScheduleEntry('${userId}','${date}')"><i class="fas fa-check"></i> Assign</button>
    </div>
  `;
  document.body.appendChild(overlay);
}

function saveScheduleEntry(userId, date) {
  const projectId = document.getElementById('schedule-project').value;
  // Remove existing entry for this user+date
  const idx = DEMO_SCHEDULE.findIndex(s => s.user_id === userId && s.date === date);
  if (idx >= 0) DEMO_SCHEDULE.splice(idx, 1);
  DEMO_SCHEDULE.push({ user_id: userId, project_id: projectId, date });
  document.getElementById('schedule-modal').remove();
  navigateTo('schedule');
}

function showNewTaskModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'task-modal';
  overlay.innerHTML = `
    <div class="modal-card" style="max-width:480px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3>New Task</h3>
        <button class="btn-icon" onclick="document.getElementById('task-modal').remove()" style="color:var(--text-muted);font-size:18px;"><i class="fas fa-times"></i></button>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="form-group">
          <label class="form-label">Task Title</label>
          <input id="task-title" class="form-input-styled" placeholder="What needs to be done?">
        </div>
        <div style="display:flex;gap:12px;">
          <div class="form-group" style="flex:1;">
            <label class="form-label">Assign To</label>
            <select id="task-assignee" class="form-input-styled">
              ${TEAM_MEMBERS.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="flex:1;">
            <label class="form-label">Priority</label>
            <select id="task-priority" class="form-input-styled">
              <option value="high">High</option>
              <option value="medium" selected>Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
        <div style="display:flex;gap:12px;">
          <div class="form-group" style="flex:1;">
            <label class="form-label">Project</label>
            <select id="task-project" class="form-input-styled">
              ${DEMO_PROJECTS.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="flex:1;">
            <label class="form-label">Due Date</label>
            <input id="task-due" type="date" class="form-input-styled" value="${new Date('2026-03-28').toISOString().split('T')[0]}">
          </div>
        </div>
        <button class="btn btn-accent btn-full btn-lg" onclick="saveNewTask()"><i class="fas fa-check"></i> Create Task</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function saveNewTask() {
  const title = document.getElementById('task-title').value.trim();
  if (!title) { alert('Enter a task title.'); return; }
  const task = {
    id: 't-' + Date.now(),
    project_id: document.getElementById('task-project').value,
    title,
    assigned_to: document.getElementById('task-assignee').value,
    due_date: document.getElementById('task-due').value,
    priority: document.getElementById('task-priority').value,
    completed: false,
  };
  DEMO_TASKS.push(task);
  if (typeof saveTask === 'function') saveTask(task);
  document.getElementById('task-modal').remove();
  navigateTo('schedule');
}

// ============================================
// PIPELINE
// ============================================
const PIPELINE_STAGES = [
  { id: 'researched',    label: 'Researched',    color: '#9ca3af' },
  { id: 'contacted',     label: 'Contacted',     color: '#3b82f6' },
  { id: 'followed_up',   label: 'Followed Up',   color: '#8b5cf6' },
  { id: 'meeting_booked',label: 'Meeting Booked', color: '#f97316' },
  { id: 'proposal_sent', label: 'Proposal Sent', color: '#eab308' },
  { id: 'won',           label: 'Won',           color: '#22c55e' },
  { id: 'lost',          label: 'Lost',          color: '#ef4444' },
];

const DEMO_PIPELINE = [
  { id: 'pl-1', brand: "[TEST] Dairy Queen", contact: 'Nina Desmond', email: 'nina@idqcanada.com', phone: '905-555-1001', province: 'ON', stage: 'proposal_sent', notes: '[TEST] Interested in 3 Ontario locations.', last_activity: '2026-03-15',
    activities: [
      { type: 'email', description: '[TEST] Sent proposal for 3 locations', date: '2026-03-15' },
      { type: 'call', description: '[TEST] Discovery call', date: '2026-03-01' },
    ]},
  { id: 'pl-2', brand: "[TEST] Recipe Unlimited", contact: 'Sarah Miller', email: 'sarah@recipeunltd.com', phone: '416-555-1002', province: 'ON', stage: 'won', notes: '[TEST] Won Burlington location.', last_activity: '2026-02-10',
    activities: [
      { type: 'note', description: '[TEST] Contract signed. Project created.', date: '2026-02-10' },
    ]},
  { id: 'pl-3', brand: "[TEST] Five Guys", contact: 'Mike Robinson', email: 'mike@fiveguys.ca', phone: '905-555-1005', province: 'ON', stage: 'researched', notes: '[TEST] Expanding in Hamilton corridor.', last_activity: '2026-03-18',
    activities: []},
];

let activePipelineId = null;

pageRenderers.pipeline = () => {
  return `
    <div class="page-header">
      <div>
        <h1>Pipeline</h1>
        <p class="page-header-sub">${DEMO_PIPELINE.length} franchise brands in pipeline</p>
      </div>
      <button class="btn btn-accent" onclick="newPipelineContact()"><i class="fas fa-plus"></i> Add Contact</button>
    </div>

    <div class="pipeline-board">
      ${PIPELINE_STAGES.map(stage => {
        const items = DEMO_PIPELINE.filter(c => c.stage === stage.id);
        return `
          <div class="pipeline-column">
            <div class="pipeline-col-header">
              <div class="pipeline-col-dot" style="background:${stage.color};"></div>
              <span class="pipeline-col-title">${stage.label}</span>
              <span class="pipeline-col-count">${items.length}</span>
            </div>
            ${items.map(c => `
              <div class="pipeline-card" onclick="viewPipelineContact('${c.id}')">
                <div style="font-size:13px;font-weight:600;margin-bottom:4px;">${c.brand}</div>
                <div class="text-muted" style="font-size:12px;">${c.contact} &middot; ${c.province}</div>
                <div class="text-muted" style="font-size:11px;margin-top:4px;">${c.last_activity}</div>
              </div>
            `).join('')}
            ${items.length === 0 ? '<div class="text-muted" style="font-size:12px;text-align:center;padding:20px;">No contacts</div>' : ''}
          </div>`;
      }).join('')}
    </div>
  `;
};

function viewPipelineContact(id) {
  activePipelineId = id;
  navigateTo('pipeline-detail');
}

pageRenderers['pipeline-detail'] = () => {
  const c = DEMO_PIPELINE.find(x => x.id === activePipelineId);
  if (!c) return '<div class="empty-state"><p>Contact not found.</p></div>';

  const stageObj = PIPELINE_STAGES.find(s => s.id === c.stage);

  return `
    <div class="page-header">
      <div style="display:flex;align-items:center;gap:12px;">
        <button class="btn btn-outline btn-sm" onclick="navigateTo('pipeline')"><i class="fas fa-arrow-left"></i></button>
        <div>
          <h1>${c.brand}</h1>
          <p class="page-header-sub">${c.contact} &middot; ${c.province} &middot; Last activity: ${c.last_activity}</p>
        </div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <select class="form-input-styled" style="padding:6px 12px;font-size:13px;min-height:38px;border-color:${stageObj ? stageObj.color : 'var(--card-border)'};" onchange="updatePipelineStage('${c.id}',this.value)">
          ${PIPELINE_STAGES.map(s => `<option value="${s.id}" ${s.id === c.stage ? 'selected' : ''}>${s.label}</option>`).join('')}
        </select>
        ${c.stage === 'won' ? `<button class="btn btn-accent btn-sm" onclick="createProjectFromPipeline('${c.id}')"><i class="fas fa-plus"></i> Create Project</button>` : ''}
      </div>
    </div>

    <div class="grid-2 mb-24">
      <!-- Contact Info -->
      <div class="stat-card">
        <div class="section-title" style="margin-bottom:12px;">Contact Details</div>
        <div style="font-size:13px;">
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--card-border);"><span class="text-muted">Brand</span><span style="font-weight:600;">${c.brand}</span></div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--card-border);"><span class="text-muted">Contact</span><span style="font-weight:600;">${c.contact}</span></div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--card-border);"><span class="text-muted">Email</span><span style="font-weight:600;">${c.email}</span></div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--card-border);"><span class="text-muted">Phone</span><span style="font-weight:600;">${c.phone}</span></div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;"><span class="text-muted">Province</span><span style="font-weight:600;">${c.province}</span></div>
        </div>
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--card-border);">
          <label class="form-label">Notes</label>
          <textarea class="form-input-styled" rows="3" onchange="updatePipelineField('${c.id}','notes',this.value)">${c.notes || ''}</textarea>
        </div>
      </div>

      <!-- Activity Log -->
      <div class="stat-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div class="section-title" style="margin:0;">Activity Log</div>
          <button class="btn btn-accent btn-sm" onclick="logPipelineActivity('${c.id}')"><i class="fas fa-plus"></i> Log Activity</button>
        </div>
        ${(c.activities || []).length > 0 ? `
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${c.activities.map(a => {
            const icons = { call: 'fas fa-phone', email: 'fas fa-envelope', meeting: 'fas fa-handshake', note: 'fas fa-sticky-note' };
            const colors = { call: 'var(--blue)', email: 'var(--orange)', meeting: 'var(--green)', note: 'var(--purple)' };
            return `
            <div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--card-border);">
              <div style="width:28px;height:28px;border-radius:6px;background:${colors[a.type] || 'var(--blue)'}15;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <i class="${icons[a.type] || 'fas fa-circle'}" style="color:${colors[a.type] || 'var(--blue)'};font-size:12px;"></i>
              </div>
              <div>
                <div style="font-size:13px;">${a.description}</div>
                <div class="text-muted" style="font-size:11px;margin-top:2px;">${a.date} &middot; ${(a.type || '').replace(/_/g, ' ')}</div>
              </div>
            </div>`;
          }).join('')}
        </div>` : '<div class="text-muted" style="text-align:center;padding:20px;font-size:13px;">No activities logged.</div>'}
      </div>
    </div>
  `;
};

function updatePipelineStage(id, stage) {
  const c = DEMO_PIPELINE.find(x => x.id === id);
  if (c) {
    c.stage = stage;
    c.last_activity = new Date().toISOString().split('T')[0];
    navigateTo('pipeline-detail');
  }
}

function updatePipelineField(id, field, value) {
  const c = DEMO_PIPELINE.find(x => x.id === id);
  if (c) c[field] = value;
}

function logPipelineActivity(id) {
  const c = DEMO_PIPELINE.find(x => x.id === id);
  if (!c) return;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'activity-modal';
  overlay.innerHTML = `
    <div class="modal-card" style="max-width:420px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3>Log Activity — ${c.brand}</h3>
        <button class="btn-icon" onclick="document.getElementById('activity-modal').remove()" style="color:var(--text-muted);font-size:18px;"><i class="fas fa-times"></i></button>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="form-group">
          <label class="form-label">Type</label>
          <select id="activity-type" class="form-input-styled">
            <option value="call">Call</option>
            <option value="email">Email</option>
            <option value="meeting">Meeting</option>
            <option value="note">Note</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea id="activity-desc" class="form-input-styled" rows="3" placeholder="What happened?"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Date</label>
          <input id="activity-date" type="date" class="form-input-styled" value="${new Date().toISOString().split('T')[0]}">
        </div>
        <button class="btn btn-accent btn-full btn-lg" onclick="saveActivity('${c.id}')"><i class="fas fa-check"></i> Log Activity</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function saveActivity(id) {
  const c = DEMO_PIPELINE.find(x => x.id === id);
  if (!c) return;
  const desc = document.getElementById('activity-desc').value.trim();
  if (!desc) { alert('Enter a description.'); return; }
  if (!c.activities) c.activities = [];
  c.activities.unshift({
    type: document.getElementById('activity-type').value,
    description: desc,
    date: document.getElementById('activity-date').value,
  });
  c.last_activity = document.getElementById('activity-date').value;
  document.getElementById('activity-modal').remove();
  navigateTo('pipeline-detail');
}

function createProjectFromPipeline(id) {
  const c = DEMO_PIPELINE.find(x => x.id === id);
  if (!c) return;
  if (DEMO_PROJECTS.find(p => p.client_brand === c.brand && p.status !== 'complete')) {
    const proceed = confirm(`A project for ${c.brand} already exists. Create another?`);
    if (!proceed) return;
  }
  const newProject = {
    id: 'proj-' + Date.now(),
    name: `${c.brand} — New Location`,
    client_brand: c.brand,
    status: 'planning',
    completion_pct: 0,
    target_handover: '',
    budget: 0,
    city: c.province,
    assigned: [],
  };
  DEMO_PROJECTS.push(newProject);
  DEMO_MILESTONES[newProject.id] = generateMilestones(newProject.id, 0, new Date().toISOString().split('T')[0]);
  activeProjectId = newProject.id;
  activeProjectTab = 'overview';
  navigateTo('project-detail');
}

function newPipelineContact() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'pipeline-modal';
  overlay.innerHTML = `
    <div class="modal-card" style="max-width:480px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3>Add Contact</h3>
        <button class="btn-icon" onclick="document.getElementById('pipeline-modal').remove()" style="color:var(--text-muted);font-size:18px;"><i class="fas fa-times"></i></button>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="form-group">
          <label class="form-label">Brand Name</label>
          <input id="pl-brand" class="form-input-styled" placeholder="e.g. Popeyes">
        </div>
        <div style="display:flex;gap:12px;">
          <div class="form-group" style="flex:1;">
            <label class="form-label">Contact Name</label>
            <input id="pl-contact" class="form-input-styled" placeholder="e.g. John Smith">
          </div>
          <div class="form-group" style="flex:1;">
            <label class="form-label">Province</label>
            <input id="pl-province" class="form-input-styled" value="ON" placeholder="ON">
          </div>
        </div>
        <div style="display:flex;gap:12px;">
          <div class="form-group" style="flex:1;">
            <label class="form-label">Email</label>
            <input id="pl-email" class="form-input-styled" type="email" placeholder="email@brand.com">
          </div>
          <div class="form-group" style="flex:1;">
            <label class="form-label">Phone</label>
            <input id="pl-phone" class="form-input-styled" type="tel" placeholder="905-555-0000">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea id="pl-notes" class="form-input-styled" rows="2" placeholder="Initial notes..."></textarea>
        </div>
        <button class="btn btn-accent btn-full btn-lg" onclick="savePipelineContact()"><i class="fas fa-check"></i> Add to Pipeline</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function savePipelineContact() {
  const brand = document.getElementById('pl-brand').value.trim();
  if (!brand) { alert('Enter a brand name.'); return; }
  DEMO_PIPELINE.push({
    id: 'pl-' + Date.now(),
    brand,
    contact: document.getElementById('pl-contact').value,
    email: document.getElementById('pl-email').value,
    phone: document.getElementById('pl-phone').value,
    province: document.getElementById('pl-province').value || 'ON',
    stage: 'researched',
    notes: document.getElementById('pl-notes').value,
    last_activity: new Date().toISOString().split('T')[0],
    activities: [],
  });
  document.getElementById('pipeline-modal').remove();
  navigateTo('pipeline');
}

// ============================================
// RECEIPT CAPTURE (modal flow)
// ============================================
function openReceiptCapture() {
  // Build project options — field users see only their assigned projects, admins see all
  const projects = currentUser.role === 'field'
    ? DEMO_PROJECTS.filter(p => p.assigned && p.assigned.includes(currentUser.email))
    : DEMO_PROJECTS;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'receipt-modal';
  overlay.innerHTML = `
    <div class="modal-card" style="max-width:480px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3><i class="fas fa-receipt" style="color:var(--orange);margin-right:8px;"></i>Capture Receipt</h3>
        <button class="btn-icon" onclick="closeReceiptModal()" style="color:var(--text-muted);font-size:18px;"><i class="fas fa-times"></i></button>
      </div>

      <!-- STEP 1: Camera / file picker -->
      <div id="receipt-step-1">
        <p class="text-muted" style="font-size:13px;margin-bottom:16px;">Take a photo of the receipt or select from your camera roll.</p>
        <input type="file" id="receipt-file-input" accept="image/*" capture="environment" style="display:none;" onchange="handleReceiptFile(this)">
        <button class="receipt-capture-btn" onclick="document.getElementById('receipt-file-input').click()" style="margin-bottom:12px;">
          <i class="fas fa-camera"></i> Take Photo
        </button>
        <button class="btn btn-outline btn-full" onclick="document.getElementById('receipt-file-input').removeAttribute('capture'); document.getElementById('receipt-file-input').click()">
          <i class="fas fa-image"></i> Choose from Gallery
        </button>
      </div>

      <!-- STEP 2: Preview -->
      <div id="receipt-step-2" style="display:none;">
        <img id="receipt-preview" class="receipt-preview-img" src="" alt="Receipt preview">
        <div style="display:flex;gap:10px;">
          <button class="btn btn-outline btn-full" onclick="retakeReceipt()"><i class="fas fa-redo"></i> Retake</button>
          <button class="btn btn-accent btn-full" id="receipt-process-btn" onclick="processReceipt()"><i class="fas fa-magic"></i> Extract Details</button>
        </div>
      </div>

      <!-- STEP 3: Processing -->
      <div id="receipt-step-3" style="display:none;">
        <div style="text-align:center;padding:32px;">
          <div class="spinner" style="width:32px;height:32px;border-width:3px;margin:0 auto 16px;"></div>
          <div style="font-size:14px;font-weight:600;margin-bottom:4px;">Reading receipt...</div>
          <p class="text-muted" style="font-size:12px;">Extracting vendor, amount, date, and category.</p>
        </div>
      </div>

      <!-- STEP 3b: Error -->
      <div id="receipt-step-error" style="display:none;">
        <div style="text-align:center;padding:24px;">
          <i class="fas fa-exclamation-triangle" style="font-size:32px;color:var(--yellow);margin-bottom:12px;display:block;"></i>
          <div style="font-size:14px;font-weight:600;margin-bottom:4px;">Couldn't read this receipt</div>
          <p class="text-muted" style="font-size:12px;margin-bottom:16px;">The image may be blurry or not a receipt. You can enter the details manually or try again.</p>
          <div style="display:flex;gap:10px;">
            <button class="btn btn-outline btn-full" onclick="retakeReceipt()"><i class="fas fa-redo"></i> Retake</button>
            <button class="btn btn-accent btn-full" onclick="showManualEntry()"><i class="fas fa-keyboard"></i> Enter Manually</button>
          </div>
        </div>
      </div>

      <!-- STEP 4: Review / edit extracted data -->
      <div id="receipt-step-4" style="display:none;">
        <div style="background:var(--green-bg);border:1px solid rgba(34,197,94,0.2);border-radius:var(--radius);padding:10px 14px;margin-bottom:16px;display:flex;align-items:center;gap:8px;">
          <i class="fas fa-check-circle" style="color:var(--green);"></i>
          <span style="font-size:12px;font-weight:500;" id="receipt-extracted-msg">Details extracted — review and confirm.</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:14px;">
          <div class="form-group">
            <label class="form-label">Vendor</label>
            <input id="receipt-vendor" class="form-input-styled" placeholder="Vendor name">
          </div>
          <div style="display:flex;gap:12px;">
            <div class="form-group" style="flex:1;">
              <label class="form-label">Amount (CAD)</label>
              <input id="receipt-amount" class="form-input-styled" type="number" step="0.01" placeholder="0.00" inputmode="decimal">
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">Date</label>
              <input id="receipt-date" class="form-input-styled" type="date">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Category</label>
            <select id="receipt-category" class="form-input-styled">
              <option value="Materials">Materials</option>
              <option value="Labour">Labour</option>
              <option value="Equipment">Equipment</option>
              <option value="Subcontractor">Subcontractor</option>
              <option value="Permits">Permits</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Project <span style="color:var(--red);">*</span></label>
            <select id="receipt-project" class="form-input-styled">
              <option value="trivex-corp">Trivex Group — Company Expense</option>
              <optgroup label="Projects">
              ${projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
              </optgroup>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Notes</label>
            <input id="receipt-notes" class="form-input-styled" placeholder="Optional notes">
          </div>
          <button class="btn btn-accent btn-full btn-lg" onclick="saveReceipt()"><i class="fas fa-check"></i> Save Receipt</button>
        </div>
      </div>

      <!-- STEP 5: Success -->
      <div id="receipt-step-5" style="display:none;">
        <div style="text-align:center;padding:24px;">
          <i class="fas fa-check-circle" style="font-size:48px;color:var(--green);margin-bottom:12px;display:block;"></i>
          <h3 style="margin-bottom:4px;">Receipt Saved</h3>
          <p class="text-muted" style="font-size:13px;margin-bottom:4px;" id="receipt-saved-detail"></p>
          <div style="display:flex;gap:10px;margin-top:20px;">
            <button class="btn btn-outline btn-full" onclick="closeReceiptModal()">Done</button>
            <button class="btn btn-accent btn-full" onclick="captureAnother()"><i class="fas fa-plus"></i> Another Receipt</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

let receiptImageData = null;
let receiptMediaType = 'image/jpeg';

function handleReceiptFile(input) {
  const file = input.files[0];
  if (!file) return;

  // Detect media type
  receiptMediaType = file.type || 'image/jpeg';
  // Convert HEIC to jpeg label (browser converts on read anyway)
  if (receiptMediaType === 'image/heic' || receiptMediaType === 'image/heif') {
    receiptMediaType = 'image/jpeg';
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    receiptImageData = e.target.result;
    document.getElementById('receipt-preview').src = receiptImageData;
    document.getElementById('receipt-step-1').style.display = 'none';
    document.getElementById('receipt-step-2').style.display = 'block';
  };
  reader.readAsDataURL(file);

  // Reset capture attribute for next time
  input.setAttribute('capture', 'environment');
}

function retakeReceipt() {
  receiptImageData = null;
  document.getElementById('receipt-step-2').style.display = 'none';
  document.getElementById('receipt-step-error').style.display = 'none';
  document.getElementById('receipt-step-1').style.display = 'block';
  document.getElementById('receipt-file-input').value = '';
}

function showManualEntry() {
  document.getElementById('receipt-step-error').style.display = 'none';
  document.getElementById('receipt-extracted-msg').textContent = 'Enter receipt details manually.';
  document.getElementById('receipt-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('receipt-step-4').style.display = 'block';
}

async function processReceipt() {
  document.getElementById('receipt-step-2').style.display = 'none';
  document.getElementById('receipt-step-3').style.display = 'block';

  try {
    const base64 = receiptImageData.replace(/^data:image\/[^;]+;base64,/, '');

    const res = await fetch('/api/receipt-ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64, mediaType: receiptMediaType }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'OCR failed');
    }

    const data = await res.json();
    if (data.error) throw new Error(data.error);

    // Fill form
    document.getElementById('receipt-vendor').value = data.vendor || '';
    document.getElementById('receipt-amount').value = data.amount || '';
    document.getElementById('receipt-date').value = data.date || new Date().toISOString().split('T')[0];
    if (data.category) {
      const select = document.getElementById('receipt-category');
      for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value === data.category) {
          select.selectedIndex = i;
          break;
        }
      }
    }
    document.getElementById('receipt-notes').value = data.notes || '';
    document.getElementById('receipt-extracted-msg').textContent = 'Details extracted — review and confirm.';

    document.getElementById('receipt-step-3').style.display = 'none';
    document.getElementById('receipt-step-4').style.display = 'block';
  } catch (err) {
    console.error('Receipt processing error:', err);
    document.getElementById('receipt-step-3').style.display = 'none';
    document.getElementById('receipt-step-error').style.display = 'block';
  }
}

function saveReceipt() {
  const vendor = document.getElementById('receipt-vendor').value.trim();
  const amount = parseFloat(document.getElementById('receipt-amount').value);
  const projectId = document.getElementById('receipt-project').value;

  if (!vendor || !amount || !projectId) {
    alert('Please fill in vendor, amount, and select a project.');
    return;
  }

  // Create thumbnail from the receipt image (small base64 for display)
  let thumbnail = null;
  if (receiptImageData) {
    try {
      const canvas = document.createElement('canvas');
      const img = document.getElementById('receipt-preview');
      const maxDim = 80;
      const scale = Math.min(maxDim / img.naturalWidth, maxDim / img.naturalHeight, 1);
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      thumbnail = canvas.toDataURL('image/jpeg', 0.6);
    } catch (e) {
      // Thumbnail generation failed — not critical
    }
  }

  const expense = {
    id: 'exp-' + Date.now(),
    project_id: projectId,
    vendor,
    amount,
    category: document.getElementById('receipt-category').value,
    expense_date: document.getElementById('receipt-date').value || new Date().toISOString().split('T')[0],
    submitted_by: currentUser.email,
    notes: document.getElementById('receipt-notes').value,
    receipt_thumbnail: thumbnail,
    receipt_url: receiptImageData, // In production this would be a Supabase Storage URL
    created_at: new Date().toISOString(),
  };

  DEMO_EXPENSES.unshift(expense);

  // Save to Supabase
  if (typeof saveExpense === 'function') saveExpense(expense);

  const proj = DEMO_PROJECTS.find(p => p.id === projectId);
  document.getElementById('receipt-saved-detail').textContent =
    `${formatCAD(amount)} from ${vendor} → ${proj ? proj.name : 'Project'}`;

  document.getElementById('receipt-step-4').style.display = 'none';
  document.getElementById('receipt-step-5').style.display = 'block';
}

function captureAnother() {
  receiptImageData = null;
  receiptMediaType = 'image/jpeg';
  document.getElementById('receipt-file-input').value = '';
  document.getElementById('receipt-step-5').style.display = 'none';
  document.getElementById('receipt-step-1').style.display = 'block';
  // Clear form fields
  ['receipt-vendor', 'receipt-amount', 'receipt-date', 'receipt-notes'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

function closeReceiptModal() {
  const modal = document.getElementById('receipt-modal');
  if (modal) modal.remove();
  receiptImageData = null;
  navigateTo(currentPage);
}

// CSV export for expenses
function exportExpensesCSV(projectId) {
  const expenses = projectId
    ? DEMO_EXPENSES.filter(e => e.project_id === projectId)
    : (currentUser.role === 'field' ? DEMO_EXPENSES.filter(e => e.submitted_by === currentUser.email) : DEMO_EXPENSES);

  if (expenses.length === 0) {
    alert('No expenses to export.');
    return;
  }

  const headers = ['Vendor', 'Amount', 'Category', 'Date', 'Project', 'Submitted By', 'Notes'];
  const rows = expenses.map(e => {
    const proj = DEMO_PROJECTS.find(p => p.id === e.project_id);
    const user = DEMO_USERS[e.submitted_by];
    return [
      e.vendor,
      e.amount.toFixed(2),
      e.category,
      e.expense_date,
      proj ? proj.name : '',
      user ? user.full_name : e.submitted_by,
      e.notes || '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const proj = projectId ? DEMO_PROJECTS.find(p => p.id === projectId) : null;
  a.download = proj ? `expenses-${proj.name.replace(/[^a-zA-Z0-9]/g, '-')}.csv` : 'expenses-all.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// View full receipt image
function viewReceiptFull(expenseId) {
  const expense = DEMO_EXPENSES.find(e => e.id === expenseId);
  if (!expense || !expense.receipt_url) return;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  overlay.innerHTML = `
    <div class="modal-card" style="max-width:560px;text-align:center;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3>${expense.vendor} — ${formatCAD(expense.amount)}</h3>
        <button class="btn-icon" onclick="this.closest('.modal-overlay').remove()" style="color:var(--text-muted);font-size:18px;"><i class="fas fa-times"></i></button>
      </div>
      <img src="${expense.receipt_url}" style="max-width:100%;max-height:60vh;object-fit:contain;border-radius:var(--radius);border:1px solid var(--card-border);">
      <div class="text-muted" style="font-size:12px;margin-top:12px;">${expense.category} &middot; ${expense.expense_date}</div>
    </div>
  `;
  document.body.appendChild(overlay);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatCAD(amount) {
  return '$' + Number(amount).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatStatus(status) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function statCard(label, value, icon, color, sub) {
  return `
    <div class="stat-card">
      <div class="stat-card-header">
        <span class="stat-card-label">${label}</span>
        <div class="stat-card-icon" style="background:${color}15;color:${color};"><i class="${icon}"></i></div>
      </div>
      <div class="stat-card-value">${value}</div>
      ${sub ? `<div class="stat-card-change">${sub}</div>` : ''}
    </div>`;
}

function activityItem(color, text, time) {
  return `<li class="activity-item">
    <div class="activity-dot" style="background:${color};"></div>
    <div><div style="font-size:13px;">${text}</div><div class="activity-time">${time}</div></div>
  </li>`;
}

function projectRow(p) {
  return `<tr style="cursor:pointer;" onclick="viewProject('${p.id}')">
    <td><strong>${p.name}</strong></td>
    <td class="text-muted">${p.client_brand}</td>
    <td><span class="status-badge status-${p.status}">${formatStatus(p.status)}</span></td>
    <td style="width:140px;">
      <div style="display:flex;align-items:center;gap:8px;">
        <div class="progress-bar" style="flex:1;"><div class="progress-fill" style="width:${p.completion_pct}%;background:var(--orange);"></div></div>
        <span style="font-size:12px;font-weight:600;">${p.completion_pct}%</span>
      </div>
    </td>
  </tr>`;
}

function projectCardHTML(p) {
  const unread = getProjectUnreadCount(p.id);
  const isInactive = p.status === 'archived' || p.status === 'lost';
  return `
    <div class="card" onclick="viewProject('${p.id}')" style="position:relative;${isInactive ? 'opacity:0.6;' : ''}">
      ${unread > 0 ? `<div style="position:absolute;top:12px;right:12px;background:var(--red);color:#fff;font-size:11px;font-weight:700;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;">${unread}</div>` : ''}
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
        <div>
          <div style="font-size:14px;font-weight:700;margin-bottom:3px;">${p.name}</div>
          <div class="text-muted" style="font-size:12px;">${p.city}</div>
        </div>
        <span class="status-badge status-${p.status}" style="${unread > 0 ? 'margin-right:28px;' : ''}">${formatStatus(p.status)}</span>
      </div>
      ${unread > 0 ? `<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;padding:6px 10px;background:var(--red-bg);border-radius:var(--radius);border:1px solid rgba(239,68,68,0.15);"><i class="fas fa-comment-dots" style="color:var(--red);font-size:12px;"></i><span style="font-size:11px;font-weight:600;color:var(--red);">${unread} unread client message${unread > 1 ? 's' : ''}</span></div>` : ''}
      <div class="text-muted" style="font-size:12px;margin-bottom:4px;">Client: ${p.client_brand}</div>
      <div class="text-muted" style="font-size:12px;margin-bottom:4px;">Budget: ${formatCAD(p.budget)}</div>
      <div class="text-muted" style="font-size:12px;margin-bottom:12px;">Handover: ${p.target_handover}</div>
      <div style="display:flex;align-items:center;gap:8px;">
        <div class="progress-bar" style="flex:1;"><div class="progress-fill" style="width:${p.completion_pct}%;background:var(--orange);"></div></div>
        <span style="font-size:12px;font-weight:600;">${p.completion_pct}%</span>
      </div>
    </div>`;
}
