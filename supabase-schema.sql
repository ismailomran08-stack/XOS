-- XOS Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text not null,
  role text not null check (role in ('admin', 'client', 'sub')),
  avatar_initials text,
  phone text,
  created_at timestamptz default now()
);

-- RLS
alter table public.profiles enable row level security;
create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Admins can read all profiles" on public.profiles for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can update profiles" on public.profiles for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ============================================
-- PROJECTS
-- ============================================
create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  client_brand text not null,
  address text,
  city text,
  province text,
  status text not null default 'planning' check (status in ('planning', 'active', 'punch_list', 'complete')),
  completion_pct integer default 0 check (completion_pct >= 0 and completion_pct <= 100),
  target_handover date,
  budget numeric(12,2),
  sqft integer,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.projects enable row level security;
create policy "Admins full access to projects" on public.projects for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Field users see assigned projects" on public.projects for select using (
  exists (select 1 from public.project_assignments where project_id = id and user_id = auth.uid())
);
create policy "Clients see their projects" on public.projects for select using (
  exists (select 1 from public.client_projects where project_id = id and client_id = auth.uid())
);

-- ============================================
-- PROJECT ASSIGNMENTS (field users to projects)
-- ============================================
create table public.project_assignments (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text default 'field',
  assigned_at timestamptz default now(),
  unique(project_id, user_id)
);

alter table public.project_assignments enable row level security;
create policy "Admins manage assignments" on public.project_assignments for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Users see own assignments" on public.project_assignments for select using (auth.uid() = user_id);

-- ============================================
-- CLIENT PROJECTS (client portal access)
-- ============================================
create table public.client_projects (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade,
  client_id uuid references public.profiles(id) on delete cascade,
  unique(project_id, client_id)
);

alter table public.client_projects enable row level security;
create policy "Admins manage client projects" on public.client_projects for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Clients see own links" on public.client_projects for select using (auth.uid() = client_id);

-- ============================================
-- MILESTONES
-- ============================================
create table public.milestones (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade,
  name text not null,
  sort_order integer not null,
  status text default 'pending' check (status in ('pending', 'in_progress', 'complete')),
  target_date date,
  completed_date date,
  notes text,
  created_at timestamptz default now()
);

alter table public.milestones enable row level security;
create policy "Admins full access milestones" on public.milestones for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Assigned users see milestones" on public.milestones for select using (
  exists (select 1 from public.project_assignments where project_id = milestones.project_id and user_id = auth.uid())
);
create policy "Clients see milestones" on public.milestones for select using (
  exists (select 1 from public.client_projects where project_id = milestones.project_id and client_id = auth.uid())
);

-- ============================================
-- EXPENSES / RECEIPTS
-- ============================================
create table public.expenses (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade,
  vendor text,
  amount numeric(10,2) not null,
  category text check (category in ('Materials', 'Labour', 'Equipment', 'Subcontractor', 'Permits', 'Other')),
  expense_date date,
  receipt_url text,
  notes text,
  submitted_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.expenses enable row level security;
create policy "Admins full access expenses" on public.expenses for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Field users manage own expenses" on public.expenses for all using (auth.uid() = submitted_by);
create policy "Field users see project expenses" on public.expenses for select using (
  exists (select 1 from public.project_assignments where project_id = expenses.project_id and user_id = auth.uid())
);

-- ============================================
-- ESTIMATES
-- ============================================
create table public.estimates (
  id uuid default uuid_generate_v4() primary key,
  client_name text not null,
  project_type text check (project_type in ('Franchise Fit-Out', 'Medical', 'Retail', 'Office', 'Other')),
  address text,
  sqft integer,
  target_start date,
  margin_pct numeric(5,2) default 15,
  status text default 'draft' check (status in ('draft', 'sent', 'accepted', 'declined')),
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.estimates enable row level security;
create policy "Admins full access estimates" on public.estimates for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ============================================
-- ESTIMATE LINE ITEMS
-- ============================================
create table public.estimate_items (
  id uuid default uuid_generate_v4() primary key,
  estimate_id uuid references public.estimates(id) on delete cascade,
  description text not null,
  category text,
  qty numeric(10,2) default 1,
  unit text default 'each',
  unit_cost numeric(10,2) not null,
  sort_order integer default 0
);

alter table public.estimate_items enable row level security;
create policy "Admins full access estimate items" on public.estimate_items for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ============================================
-- INVOICES
-- ============================================
create table public.invoices (
  id uuid default uuid_generate_v4() primary key,
  invoice_number text unique not null,
  project_id uuid references public.projects(id),
  estimate_id uuid references public.estimates(id),
  stage text default 'deposit' check (stage in ('deposit', 'progress', 'final')),
  status text default 'draft' check (status in ('draft', 'sent', 'partially_paid', 'paid')),
  amount numeric(12,2) not null,
  tax_rate numeric(5,2) default 13,
  amount_paid numeric(12,2) default 0,
  issue_date date default current_date,
  due_date date,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.invoices enable row level security;
create policy "Admins full access invoices" on public.invoices for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Clients see their invoices" on public.invoices for select using (
  exists (select 1 from public.client_projects cp
    join public.projects p on p.id = cp.project_id
    where p.id = invoices.project_id and cp.client_id = auth.uid())
);

-- ============================================
-- INVOICE LINE ITEMS
-- ============================================
create table public.invoice_items (
  id uuid default uuid_generate_v4() primary key,
  invoice_id uuid references public.invoices(id) on delete cascade,
  description text not null,
  qty numeric(10,2) default 1,
  unit text default 'each',
  unit_cost numeric(10,2) not null,
  sort_order integer default 0
);

alter table public.invoice_items enable row level security;
create policy "Admins full access invoice items" on public.invoice_items for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ============================================
-- PAYMENTS
-- ============================================
create table public.payments (
  id uuid default uuid_generate_v4() primary key,
  invoice_id uuid references public.invoices(id) on delete cascade,
  amount numeric(12,2) not null,
  payment_date date not null,
  method text,
  notes text,
  created_at timestamptz default now()
);

alter table public.payments enable row level security;
create policy "Admins full access payments" on public.payments for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ============================================
-- SCHEDULE
-- ============================================
create table public.schedule_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  entry_date date not null,
  notes text,
  created_at timestamptz default now()
);

alter table public.schedule_entries enable row level security;
create policy "Admins full access schedule" on public.schedule_entries for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Users see own schedule" on public.schedule_entries for select using (auth.uid() = user_id);

-- ============================================
-- TASKS
-- ============================================
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade,
  title text not null,
  assigned_to uuid references public.profiles(id),
  due_date date,
  priority text default 'medium' check (priority in ('high', 'medium', 'low')),
  completed boolean default false,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.tasks enable row level security;
create policy "Admins full access tasks" on public.tasks for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Assigned users see tasks" on public.tasks for select using (auth.uid() = assigned_to);
create policy "Assigned users update tasks" on public.tasks for update using (auth.uid() = assigned_to);

-- ============================================
-- PIPELINE / CRM
-- ============================================
create table public.pipeline_contacts (
  id uuid default uuid_generate_v4() primary key,
  brand_name text not null,
  contact_name text,
  email text,
  phone text,
  province text,
  stage text default 'researched' check (stage in ('researched', 'contacted', 'followed_up', 'meeting_booked', 'proposal_sent', 'won', 'lost')),
  notes text,
  last_activity_date date,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.pipeline_contacts enable row level security;
create policy "Admins full access pipeline" on public.pipeline_contacts for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ============================================
-- PIPELINE ACTIVITY LOG
-- ============================================
create table public.pipeline_activities (
  id uuid default uuid_generate_v4() primary key,
  contact_id uuid references public.pipeline_contacts(id) on delete cascade,
  activity_type text check (activity_type in ('call', 'email', 'meeting', 'note')),
  description text,
  activity_date date default current_date,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.pipeline_activities enable row level security;
create policy "Admins full access activities" on public.pipeline_activities for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ============================================
-- CLIENT MESSAGES (read-only thread for client portal)
-- ============================================
create table public.client_messages (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade,
  sender_id uuid references public.profiles(id),
  message text not null,
  created_at timestamptz default now()
);

alter table public.client_messages enable row level security;
create policy "Admins full access messages" on public.client_messages for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Clients see project messages" on public.client_messages for select using (
  exists (select 1 from public.client_projects where project_id = client_messages.project_id and client_id = auth.uid())
);

-- ============================================
-- STORAGE BUCKET for receipts & documents
-- ============================================
insert into storage.buckets (id, name, public) values ('receipts', 'receipts', true);
insert into storage.buckets (id, name, public) values ('documents', 'documents', true);

-- Storage policies
create policy "Authenticated users upload receipts" on storage.objects for insert
  with check (bucket_id = 'receipts' and auth.role() = 'authenticated');
create policy "Anyone can read receipts" on storage.objects for select
  using (bucket_id = 'receipts');
create policy "Authenticated users upload documents" on storage.objects for insert
  with check (bucket_id = 'documents' and auth.role() = 'authenticated');
create policy "Anyone can read documents" on storage.objects for select
  using (bucket_id = 'documents');

-- ============================================
-- FUNCTION: Auto-create profile on signup
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role, avatar_initials)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'client'),
    upper(left(coalesce(new.raw_user_meta_data->>'full_name', new.email), 1) ||
          left(split_part(coalesce(new.raw_user_meta_data->>'full_name', new.email), ' ', 2), 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- SEED DATA: Create test users via Supabase Auth dashboard
-- Then manually set roles:
-- ============================================
-- After creating users in Supabase Auth:
-- UPDATE public.profiles SET role = 'admin', full_name = 'Omran Ismail', avatar_initials = 'OI' WHERE email = 'omran@trivexgroup.com';
-- UPDATE public.profiles SET role = 'admin', full_name = 'Alex', avatar_initials = 'AX' WHERE email = 'alex@trivexgroup.com';
-- UPDATE public.profiles SET role = 'field', full_name = 'Saud', avatar_initials = 'SD' WHERE email = 'saud@trivexgroup.com';
