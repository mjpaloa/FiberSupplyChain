-- =====================================================
-- Notifications Table for Farmers
-- Tracks seedling distributions, monitoring updates, and deliveries
-- =====================================================

CREATE TABLE IF NOT EXISTS public.farmer_notifications (
  notification_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  farmer_id uuid NOT NULL,
  notification_type character varying NOT NULL CHECK (notification_type IN ('seedling_distribution', 'monitoring_update', 'delivery_update')),
  title character varying NOT NULL,
  message text NOT NULL,
  reference_id uuid, -- Can reference distribution_id, monitoring_id, or delivery_id
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT farmer_notifications_pkey PRIMARY KEY (notification_id),
  CONSTRAINT farmer_notifications_farmer_fkey FOREIGN KEY (farmer_id) REFERENCES public.farmers(farmer_id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_farmer_notifications_farmer_id ON public.farmer_notifications(farmer_id);
CREATE INDEX IF NOT EXISTS idx_farmer_notifications_created_at ON public.farmer_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_farmer_notifications_is_read ON public.farmer_notifications(is_read);

-- Enable RLS
ALTER TABLE public.farmer_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Farmers can only see their own notifications
CREATE POLICY farmer_notifications_select_policy ON public.farmer_notifications
  FOR SELECT
  USING (farmer_id = auth.uid());

-- Policy: Farmers can update their own notifications (mark as read)
CREATE POLICY farmer_notifications_update_policy ON public.farmer_notifications
  FOR UPDATE
  USING (farmer_id = auth.uid());

-- Grant permissions
GRANT SELECT, UPDATE ON public.farmer_notifications TO authenticated;
GRANT ALL ON public.farmer_notifications TO postgres;
