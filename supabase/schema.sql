-- Supabase Schema for Binjwa SMM (Multi-tenant)

-- 1. Create Tenants table
CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  domain text,
  plan text DEFAULT 'Silver',
  ai_credits integer DEFAULT 100,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Create Posts table
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id text NOT NULL, -- Clerk user_id
  caption text NOT NULL,
  thumbnail text,
  image_url text,
  video_url text,
  platforms text[] NOT NULL,
  platform text,
  status text NOT NULL DEFAULT 'Draft',
  date date,
  time time,
  reach integer DEFAULT 0,
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  shares integer DEFAULT 0,
  engagement jsonb,
  platform_post_ids jsonb,
  youtube_settings jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Create Social Connections table
CREATE TABLE IF NOT EXISTS public.social_connections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id text NOT NULL, -- Clerk user_id
  platform text NOT NULL, -- 'linkedin', 'facebook', 'twitter', 'instagram', 'youtube'
  platform_id text NOT NULL,
  name text,
  username text,
  avatar text,
  access_token text,
  access_secret text,
  refresh_token text,
  token_expires_at timestamp with time zone,
  profile_data jsonb,
  connected_at timestamp with time zone DEFAULT now(),
  UNIQUE(tenant_id, platform, platform_id)
);

-- 4. Create Message Logs table
CREATE TABLE IF NOT EXISTS public.message_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  page_id text NOT NULL,
  sender_id text NOT NULL,
  message text NOT NULL,
  response text,
  needs_review boolean DEFAULT false,
  timestamp timestamp with time zone DEFAULT now()
);

-- Row Level Security (RLS) Policies for Multi-tenancy
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to extract tenant_id from Clerk JWT
CREATE OR REPLACE FUNCTION public.tenant_id() RETURNS uuid AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id', '')::uuid;
$$ LANGUAGE sql STABLE;

-- Tenant Policies
CREATE POLICY "Tenants can view own tenant" ON public.tenants FOR SELECT USING (id = public.tenant_id());
CREATE POLICY "Tenants can update own tenant" ON public.tenants FOR UPDATE USING (id = public.tenant_id());

-- Posts Policies
CREATE POLICY "Tenants can view own posts" ON public.posts FOR SELECT USING (tenant_id = public.tenant_id());
CREATE POLICY "Tenants can insert own posts" ON public.posts FOR INSERT WITH CHECK (tenant_id = public.tenant_id());
CREATE POLICY "Tenants can update own posts" ON public.posts FOR UPDATE USING (tenant_id = public.tenant_id());
CREATE POLICY "Tenants can delete own posts" ON public.posts FOR DELETE USING (tenant_id = public.tenant_id());

-- Connections Policies
CREATE POLICY "Tenants can view own connections" ON public.social_connections FOR SELECT USING (tenant_id = public.tenant_id());
CREATE POLICY "Tenants can insert own connections" ON public.social_connections FOR INSERT WITH CHECK (tenant_id = public.tenant_id());
CREATE POLICY "Tenants can update own connections" ON public.social_connections FOR UPDATE USING (tenant_id = public.tenant_id());
CREATE POLICY "Tenants can delete own connections" ON public.social_connections FOR DELETE USING (tenant_id = public.tenant_id());

-- Messages Policies
CREATE POLICY "Tenants can view own messages" ON public.message_logs FOR SELECT USING (tenant_id = public.tenant_id());
CREATE POLICY "Tenants can insert own messages" ON public.message_logs FOR INSERT WITH CHECK (tenant_id = public.tenant_id());
CREATE POLICY "Tenants can update own messages" ON public.message_logs FOR UPDATE USING (tenant_id = public.tenant_id());
CREATE POLICY "Tenants can delete own messages" ON public.message_logs FOR DELETE USING (tenant_id = public.tenant_id());

-- RPC: Decrement AI Credits
CREATE OR REPLACE FUNCTION decrement_ai_credits(cost integer)
RETURNS jsonb AS $$
DECLARE
  v_tenant_id uuid;
  v_current_credits integer;
BEGIN
  -- Get tenant id
  v_tenant_id := public.tenant_id();
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Lock row for update and check balance
  SELECT ai_credits INTO v_current_credits
  FROM public.tenants
  WHERE id = v_tenant_id
  FOR UPDATE;

  IF v_current_credits < cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits');
  END IF;

  -- Deduct
  UPDATE public.tenants
  SET ai_credits = ai_credits - cost
  WHERE id = v_tenant_id;

  -- Log Transaction
  INSERT INTO public.transactions (
    tenant_id, type, amount, credits_purchased, credits_distributed, prev_balance, new_balance, status, notes
  ) VALUES (
    v_tenant_id, 'Credit Deduction', 0, 0, cost, v_current_credits, v_current_credits - cost, 'Success', 'AI Generation usage'
  );

  RETURN jsonb_build_object('success', true, 'credits_remaining', v_current_credits - cost);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create Social Analytics table
CREATE TABLE IF NOT EXISTS public.social_analytics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  connection_id uuid REFERENCES public.social_connections(id) ON DELETE CASCADE,
  platform text NOT NULL,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  date date NOT NULL DEFAULT CURRENT_DATE,
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(tenant_id, connection_id, date)
);

-- Analytics Policies
ALTER TABLE public.social_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenants can view own analytics" ON public.social_analytics FOR SELECT USING (tenant_id = public.tenant_id());
CREATE POLICY "Tenants can insert own analytics" ON public.social_analytics FOR INSERT WITH CHECK (tenant_id = public.tenant_id());
CREATE POLICY "Tenants can update own analytics" ON public.social_analytics FOR UPDATE USING (tenant_id = public.tenant_id());
CREATE POLICY "Tenants can delete own analytics" ON public.social_analytics FOR DELETE USING (tenant_id = public.tenant_id());

-- 6. Create Workspace Settings table
CREATE TABLE IF NOT EXISTS public.workspace_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE UNIQUE,
  workspace_name text,
  logo_url text,
  timezone text DEFAULT 'UTC',
  language text DEFAULT 'en',
  notifications_enabled boolean DEFAULT true,
  updated_at timestamp with time zone DEFAULT now()
);

-- Workspace Settings Policies
ALTER TABLE public.workspace_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenants can view own settings" ON public.workspace_settings FOR SELECT USING (tenant_id = public.tenant_id());
CREATE POLICY "Tenants can insert own settings" ON public.workspace_settings FOR INSERT WITH CHECK (tenant_id = public.tenant_id());
CREATE POLICY "Tenants can update own settings" ON public.workspace_settings FOR UPDATE USING (tenant_id = public.tenant_id());
CREATE POLICY "Tenants can delete own settings" ON public.workspace_settings FOR DELETE USING (tenant_id = public.tenant_id());

-- 7. Create Workspace Users (Team) table
CREATE TABLE IF NOT EXISTS public.workspace_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id text NOT NULL, -- Clerk user_id
  email text NOT NULL,
  username text NOT NULL,
  role text DEFAULT 'Member', -- 'Admin', 'Editor', 'Viewer'
  status text DEFAULT 'Active', -- 'Active', 'Suspended', 'Pending'
  allocated_credits integer DEFAULT 0,
  used_credits integer DEFAULT 0,
  assigned_brands jsonb DEFAULT '[]'::jsonb,
  joined_at timestamp with time zone DEFAULT now(),
  UNIQUE(tenant_id, user_id),
  UNIQUE(tenant_id, email)
);

-- Workspace Users Policies
ALTER TABLE public.workspace_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenants can view own users" ON public.workspace_users FOR SELECT USING (tenant_id = public.tenant_id());
CREATE POLICY "Tenants can insert own users" ON public.workspace_users FOR INSERT WITH CHECK (tenant_id = public.tenant_id());
CREATE POLICY "Tenants can update own users" ON public.workspace_users FOR UPDATE USING (tenant_id = public.tenant_id());
CREATE POLICY "Tenants can delete own users" ON public.workspace_users FOR DELETE USING (tenant_id = public.tenant_id());

-- 8. Create Brands table
CREATE TABLE IF NOT EXISTS public.brands (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  logo_url text,
  website text,
  industry text,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(tenant_id, name)
);

-- Brands Policies
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenants can view own brands" ON public.brands FOR SELECT USING (tenant_id = public.tenant_id());
CREATE POLICY "Tenants can insert own brands" ON public.brands FOR INSERT WITH CHECK (tenant_id = public.tenant_id());
CREATE POLICY "Tenants can update own brands" ON public.brands FOR UPDATE USING (tenant_id = public.tenant_id());
CREATE POLICY "Tenants can delete own brands" ON public.brands FOR DELETE USING (tenant_id = public.tenant_id());

-- 9. Create Content Library table
CREATE TABLE IF NOT EXISTS public.content_library (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  brand_id uuid REFERENCES public.brands(id) ON DELETE CASCADE,
  user_id text NOT NULL, -- The Clerk user who uploaded it
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL, -- e.g., 'image/jpeg', 'video/mp4'
  file_size integer,
  created_at timestamp with time zone DEFAULT now()
);

-- Content Library Policies
ALTER TABLE public.content_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenants can view own content" ON public.content_library FOR SELECT USING (tenant_id = public.tenant_id());
CREATE POLICY "Tenants can insert own content" ON public.content_library FOR INSERT WITH CHECK (tenant_id = public.tenant_id());
CREATE POLICY "Tenants can update own content" ON public.content_library FOR UPDATE USING (tenant_id = public.tenant_id());
CREATE POLICY "Tenants can delete own content" ON public.content_library FOR DELETE USING (tenant_id = public.tenant_id());

-- 10. Create Transactions table (Super Admin visibility)
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  admin_id text, -- Clerk user_id of the admin performing/related to the transaction
  user_id text, -- Clerk user_id of a specific user if applicable
  plan text,
  type text NOT NULL, -- 'Subscription Purchase', 'Credit Purchase', 'Refund', etc.
  payment_method text,
  amount numeric(10, 2) DEFAULT 0.00,
  credits_purchased integer DEFAULT 0,
  credits_distributed integer DEFAULT 0,
  prev_balance integer,
  new_balance integer,
  status text NOT NULL DEFAULT 'Success', -- 'Success', 'Pending', 'Failed', 'Refunded'
  reference_id text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 11. Create Transaction Audit Logs table
CREATE TABLE IF NOT EXISTS public.transaction_audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id uuid NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  action text NOT NULL,
  performed_by text NOT NULL, -- Clerk user_id or 'System'
  prev_value text,
  new_value text,
  ip_address text,
  status text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Transaction Policies
-- Note: Super Admin routes typically use a service_role key to bypass RLS, 
-- but we can also add RLS for regular tenants to view their own transactions if needed.
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenants can view own transactions" ON public.transactions FOR SELECT USING (tenant_id = public.tenant_id());

ALTER TABLE public.transaction_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenants can view own transaction audit logs" ON public.transaction_audit_logs FOR SELECT USING (
  transaction_id IN (SELECT id FROM public.transactions WHERE tenant_id = public.tenant_id())
);

-- 12. Create Support Tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  admin_id text, -- Clerk user_id of the person who created the ticket (can be admin or user)
  user_id text, -- Clerk user_id of specific user if applicable
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  priority text NOT NULL DEFAULT 'Medium', -- 'Critical', 'High', 'Medium', 'Low'
  status text NOT NULL DEFAULT 'New', -- 'New', 'Open', 'Assigned', 'In Progress', 'Waiting for Customer', 'Resolved', 'Closed', 'Reopened'
  assigned_to text, -- Clerk user_id of the Super Admin assigned
  due_date timestamp with time zone,
  resolution_time integer, -- in minutes or seconds
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 13. Create Support Ticket Replies table
CREATE TABLE IF NOT EXISTS public.support_ticket_replies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id text NOT NULL, -- Clerk user_id of the replier
  message text NOT NULL,
  is_internal_note boolean DEFAULT false,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- 14. Create Support Ticket Activities table
CREATE TABLE IF NOT EXISTS public.support_ticket_activities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id text NOT NULL, -- Clerk user_id of the person who performed the action
  action text NOT NULL, -- 'Status Changed', 'Priority Changed', 'Assigned'
  old_value text,
  new_value text,
  created_at timestamp with time zone DEFAULT now()
);

-- Support Ticket Policies
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenants can view own tickets" ON public.support_tickets FOR SELECT USING (tenant_id = public.tenant_id());
CREATE POLICY "Tenants can insert own tickets" ON public.support_tickets FOR INSERT WITH CHECK (tenant_id = public.tenant_id());
CREATE POLICY "Tenants can update own tickets" ON public.support_tickets FOR UPDATE USING (tenant_id = public.tenant_id());

ALTER TABLE public.support_ticket_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenants can view own replies" ON public.support_ticket_replies FOR SELECT USING (
  ticket_id IN (SELECT id FROM public.support_tickets WHERE tenant_id = public.tenant_id())
);
CREATE POLICY "Tenants can insert own replies" ON public.support_ticket_replies FOR INSERT WITH CHECK (
  ticket_id IN (SELECT id FROM public.support_tickets WHERE tenant_id = public.tenant_id())
);

ALTER TABLE public.support_ticket_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenants can view own ticket activities" ON public.support_ticket_activities FOR SELECT USING (
  ticket_id IN (SELECT id FROM public.support_tickets WHERE tenant_id = public.tenant_id())
);
