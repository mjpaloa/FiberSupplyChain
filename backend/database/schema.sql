-- =====================================================
-- AbacaCAPSTONE Database Schema
-- Complete database schema for the Abaca Management System
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.organization (
  officer_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  full_name character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  password_hash character varying NOT NULL,
  position character varying,
  office_name character varying,
  assigned_municipality character varying,
  assigned_barangay character varying,
  contact_number character varying,
  address text,
  profile_completed boolean DEFAULT false,
  is_active boolean DEFAULT true,
  is_verified boolean DEFAULT true,
  remarks text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  last_login timestamp with time zone,
  profile_completed_at timestamp with time zone,
  profile_picture text,
  is_super_admin boolean DEFAULT false,
  verification_status character varying DEFAULT 'pending'::character varying CHECK (verification_status::text = ANY (ARRAY['pending'::character varying, 'verified'::character varying, 'rejected'::character varying]::text[])),
  CONSTRAINT organization_pkey PRIMARY KEY (officer_id)
);

CREATE TABLE public.association_officers (
  officer_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  full_name character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  password_hash character varying NOT NULL,
  position character varying,
  association_name character varying,
  contact_number character varying,
  address text,
  term_start_date date,
  term_end_date date,
  term_duration character varying,
  farmers_under_supervision integer DEFAULT 0,
  profile_picture text,
  valid_id_photo text,
  is_active boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  verification_status character varying DEFAULT 'pending'::character varying CHECK (verification_status::text = ANY (ARRAY['pending'::character varying, 'verified'::character varying, 'rejected'::character varying]::text[])),
  verified_by uuid,
  verified_at timestamp with time zone,
  rejection_reason text,
  remarks text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  last_login timestamp with time zone,
  CONSTRAINT association_officers_pkey PRIMARY KEY (officer_id),
  CONSTRAINT association_officers_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.organization(officer_id)
);

CREATE TABLE public.auth_audit_log (
  log_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  user_type character varying CHECK (user_type::text = ANY (ARRAY['farmer'::character varying, 'buyer'::character varying, 'officer'::character varying, 'association_officer'::character varying]::text[])),
  action character varying NOT NULL,
  ip_address character varying,
  user_agent text,
  success boolean DEFAULT true,
  error_message text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT auth_audit_log_pkey PRIMARY KEY (log_id)
);
CREATE TABLE public.buyers (
  buyer_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  business_name character varying NOT NULL,
  owner_name character varying NOT NULL,
  business_address text,
  contact_number character varying,
  email character varying NOT NULL UNIQUE,
  license_or_accreditation character varying,
  buying_schedule character varying,
  buying_location text,
  warehouse_address text,
  accepted_quality_grades ARRAY,
  price_range_min numeric,
  price_range_max numeric,
  payment_terms character varying,
  partnered_associations ARRAY,
  password_hash character varying NOT NULL,
  is_active boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  remarks text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  last_login timestamp with time zone,
  profile_photo text,
  valid_id_photo text,
  business_permit_photo text,
  verification_status character varying DEFAULT 'pending'::character varying CHECK (verification_status::text = ANY (ARRAY['pending'::character varying, 'verified'::character varying, 'rejected'::character varying]::text[])),
  verified_by uuid,
  verified_at timestamp with time zone,
  rejection_reason text,
  CONSTRAINT buyers_pkey PRIMARY KEY (buyer_id),
  CONSTRAINT buyers_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.organization(officer_id)
);
CREATE TABLE public.farmers (
  farmer_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  full_name character varying NOT NULL,
  sex character varying CHECK (sex::text = ANY (ARRAY['Male'::character varying, 'Female'::character varying, 'Other'::character varying]::text[])),
  age integer CHECK (age >= 18 AND age <= 100),
  birthday date,
  contact_number character varying,
  address text,
  barangay character varying,
  municipality character varying,
  association_name character varying,
  farm_location text,
  farm_coordinates character varying,
  farm_area_hectares numeric,
  years_in_farming integer,
  type_of_abaca_planted character varying,
  average_harvest_volume_kg numeric,
  harvest_frequency_weeks integer,
  selling_price_range_min numeric,
  selling_price_range_max numeric,
  regular_buyer character varying,
  income_per_cycle numeric,
  email character varying NOT NULL UNIQUE,
  password_hash character varying NOT NULL,
  is_active boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  remarks text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  last_login timestamp with time zone,
  profile_photo text,
  valid_id_photo text,
  verification_status character varying DEFAULT 'pending'::character varying CHECK (verification_status::text = ANY (ARRAY['pending'::character varying, 'verified'::character varying, 'rejected'::character varying]::text[])),
  verified_by uuid,
  verified_at timestamp with time zone,
  rejection_reason text,
  CONSTRAINT farmers_pkey PRIMARY KEY (farmer_id),
  CONSTRAINT farmers_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.organization(officer_id)
);
CREATE TABLE public.maintenance_logs (
  log_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  action character varying NOT NULL CHECK (action::text = ANY (ARRAY['enabled'::character varying, 'disabled'::character varying]::text[])),
  enabled_by uuid,
  reason text,
  ip_address character varying,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT maintenance_logs_pkey PRIMARY KEY (log_id),
  CONSTRAINT maintenance_logs_enabled_by_fkey FOREIGN KEY (enabled_by) REFERENCES public.organization(officer_id)
);
CREATE TABLE public.refresh_tokens (
  token_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  user_type character varying NOT NULL CHECK (user_type::text = ANY (ARRAY['farmer'::character varying, 'buyer'::character varying, 'officer'::character varying]::text[])),
  token_hash character varying NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  revoked boolean DEFAULT false,
  CONSTRAINT refresh_tokens_pkey PRIMARY KEY (token_id)
);
CREATE TABLE public.seedlings (
  seedling_id uuid NOT NULL DEFAULT gen_random_uuid(),
  variety character varying NOT NULL,
  source_supplier character varying,
  quantity_distributed integer NOT NULL CHECK (quantity_distributed > 0),
  date_distributed date NOT NULL DEFAULT CURRENT_DATE,
  recipient_farmer_id uuid,
  recipient_association character varying,
  remarks text,
  status character varying DEFAULT 'distributed_to_farmer'::character varying
    CHECK (status IN ('distributed_to_farmer', 'planted', 'damaged', 'replanted', 'lost', 'other')),
  distributed_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  seedling_photo text,
  packaging_photo text,
  quality_photo text,
  planting_date date,
  planting_location text,
  planting_photo_1 text,
  planting_photo_2 text,
  planting_photo_3 text,
  planting_notes text,
  planted_by uuid,
  planted_at timestamp with time zone,
  CONSTRAINT seedlings_pkey PRIMARY KEY (seedling_id),
  CONSTRAINT seedlings_distributed_by_fkey FOREIGN KEY (distributed_by) REFERENCES public.organization(officer_id),
  CONSTRAINT seedlings_planted_by_fkey FOREIGN KEY (planted_by) REFERENCES public.farmers(farmer_id),
  CONSTRAINT seedlings_recipient_farmer_id_fkey FOREIGN KEY (recipient_farmer_id) REFERENCES public.farmers(farmer_id)
);
CREATE TABLE public.system_settings (
  setting_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  setting_key character varying NOT NULL UNIQUE,
  setting_value text NOT NULL,
  description text,
  updated_by uuid,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT system_settings_pkey PRIMARY KEY (setting_id),
  CONSTRAINT system_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.organization(officer_id)
);

-- =====================================================
-- HARVEST AND INVENTORY MANAGEMENT SYSTEM
-- =====================================================

-- Harvests table for farmer submissions
CREATE TABLE IF NOT EXISTS public.harvests (
    harvest_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES public.farmers(farmer_id) ON DELETE CASCADE,
    county_province VARCHAR(255),
    municipality VARCHAR(255),
    barangay VARCHAR(255),
    farm_coordinates TEXT,
    landmark TEXT,
    farm_name VARCHAR(255),
    farm_code VARCHAR(100),
    area_hectares DECIMAL(10, 4) NOT NULL,
    plot_lot_id VARCHAR(100),
    farmer_name VARCHAR(255),
    farmer_contact VARCHAR(50),
    farmer_email VARCHAR(255),
    cooperative_name VARCHAR(255),
    mao_registration VARCHAR(100),
    farmer_registration_id VARCHAR(100),
    abaca_variety VARCHAR(100) NOT NULL, 
    planting_date DATE NOT NULL,
    planting_material_source VARCHAR(100) NOT NULL CHECK (planting_material_source IN ('Sucker', 'Corm', 'Tissue Culture', 'Other')),
    planting_density_hills_per_ha INTEGER,
    planting_spacing VARCHAR(50),
    harvest_date DATE NOT NULL,
    harvest_shift VARCHAR(100),
    harvest_crew_name VARCHAR(255),
    harvest_crew_id VARCHAR(100),
    harvest_method VARCHAR(100) NOT NULL CHECK (harvest_method IN ('Manual Tuxying + Hand Stripping', 'Mechanical Stripping', 'MSSM', 'Other')),
    stalks_harvested INTEGER,
    tuxies_collected INTEGER,
    wet_weight_kg DECIMAL(10, 2),
    dry_fiber_output_kg DECIMAL(10, 2),
    estimated_fiber_recovery_percent DECIMAL(5, 2),
    yield_per_hectare_kg DECIMAL(10, 2),
    fiber_grade VARCHAR(50),
    fiber_length_cm DECIMAL(5, 2),
    fiber_color VARCHAR(50),
    fiber_fineness VARCHAR(50),
    fiber_cleanliness VARCHAR(50),
    moisture_status VARCHAR(50) CHECK (moisture_status IN ('Sun-dried', 'Semi-dried', 'Wet', 'Other')),
    defects_noted TEXT[],
    has_mold BOOLEAN DEFAULT FALSE,
    has_discoloration BOOLEAN DEFAULT FALSE,
    has_pest_damage BOOLEAN DEFAULT FALSE,
    stripper_operator_name VARCHAR(255),
    bales_produced INTEGER,
    weight_per_bale_kg DECIMAL(10, 2),
    fertilizer_applied TEXT,
    fertilizer_application_date DATE,
    fertilizer_quantity VARCHAR(100),
    pesticide_applied TEXT,
    pesticide_application_date DATE,
    pesticide_quantity VARCHAR(100),
    labor_hours DECIMAL(10, 2),
    number_of_workers INTEGER,
    harvesting_cost_per_kg DECIMAL(10, 2),
    harvesting_cost_per_ha DECIMAL(10, 2),
    total_harvesting_cost DECIMAL(10, 2),
    pests_observed BOOLEAN DEFAULT FALSE,
    pests_description TEXT,
    diseases_observed BOOLEAN DEFAULT FALSE,
    diseases_description TEXT,
    remarks TEXT,
    photo_urls TEXT[],
    inspected_by VARCHAR(255),
    inspector_position VARCHAR(100),
    inspection_date DATE,
    farmer_signature_url TEXT,
    farmer_thumbmark_url TEXT,
    receiving_buyer_trader VARCHAR(255),
    buyer_contact VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Pending Verification' CHECK (status IN (
        'Pending Verification',
        'Verified',
        'Rejected',
        'In Inventory',
        'Delivered',
        'Sold'
    )),
    verification_notes TEXT,
    verified_by UUID,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_harvest_date CHECK (harvest_date <= CURRENT_DATE),
    CONSTRAINT check_planting_before_harvest CHECK (planting_date <= harvest_date),
    CONSTRAINT check_positive_area CHECK (area_hectares > 0),
    CONSTRAINT check_positive_weights CHECK (
        (wet_weight_kg IS NULL OR wet_weight_kg >= 0) AND
        (dry_fiber_output_kg IS NULL OR dry_fiber_output_kg >= 0)
    )
);

-- Inventory table for MAO management
CREATE TABLE IF NOT EXISTS public.inventory (
    inventory_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mao_id UUID NOT NULL,
    mao_name VARCHAR(255) NOT NULL,
    harvest_id UUID NOT NULL REFERENCES public.harvests(harvest_id) ON DELETE CASCADE,
    stock_weight_kg DECIMAL(10, 2) NOT NULL,
    current_stock_kg DECIMAL(10, 2) NOT NULL,
    fiber_grade VARCHAR(50) NOT NULL,
    fiber_quality_rating VARCHAR(50) CHECK (fiber_quality_rating IN ('Excellent', 'Good', 'Fair', 'Poor')),
    storage_location VARCHAR(255),
    warehouse_section VARCHAR(100),
    storage_condition VARCHAR(50) CHECK (storage_condition IN ('Dry', 'Humid', 'Controlled', 'Open Air')),
    storage_temperature_celsius DECIMAL(5, 2),
    storage_humidity_percent DECIMAL(5, 2),
    status VARCHAR(50) DEFAULT 'Stocked' CHECK (status IN (
        'Stocked',
        'Reserved',
        'Partially Distributed',
        'Fully Distributed',
        'Damaged',
        'Expired',
        'Under Inspection'
    )),
    quality_check_date DATE,
    quality_checked_by VARCHAR(255),
    quality_notes TEXT,
    expiry_date DATE,
    total_distributed_kg DECIMAL(10, 2) DEFAULT 0,
    number_of_distributions INTEGER DEFAULT 0,
    last_distribution_date DATE,
    unit_price_per_kg DECIMAL(10, 2),
    total_value DECIMAL(12, 2),
    remarks TEXT,
    photo_urls TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_positive_stock CHECK (stock_weight_kg > 0),
    CONSTRAINT check_current_stock_valid CHECK (current_stock_kg >= 0 AND current_stock_kg <= stock_weight_kg),
    CONSTRAINT check_distributed_valid CHECK (total_distributed_kg >= 0 AND total_distributed_kg <= stock_weight_kg)
);

-- Inventory distributions table
CREATE TABLE IF NOT EXISTS public.inventory_distributions (
    distribution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID NOT NULL REFERENCES public.inventory(inventory_id) ON DELETE CASCADE,
    distribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
    distributed_to VARCHAR(255) NOT NULL,
    recipient_type VARCHAR(50) CHECK (recipient_type IN ('Buyer', 'Trader', 'Processor', 'Government', 'Export', 'Other')),
    distributed_weight_kg DECIMAL(10, 2) NOT NULL,
    price_per_kg DECIMAL(10, 2),
    total_amount DECIMAL(12, 2),
    distributed_by UUID,
    distributor_name VARCHAR(255),
    transport_method VARCHAR(100),
    destination VARCHAR(255),
    delivery_receipt_number VARCHAR(100),
    invoice_number VARCHAR(100),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_positive_distribution CHECK (distributed_weight_kg > 0)
);

-- =====================================================
-- MONITORING SYSTEM
-- =====================================================

-- Monitoring records table
CREATE TABLE IF NOT EXISTS public.monitoring_records (
    monitoring_id VARCHAR(50) PRIMARY KEY,
    date_of_visit DATE NOT NULL,
    monitored_by VARCHAR(255) NOT NULL,
    monitored_by_role VARCHAR(100),
    farmer_id UUID,
    farmer_name VARCHAR(255) NOT NULL,
    association_name VARCHAR(255),
    farm_location TEXT,
    farm_condition VARCHAR(50) NOT NULL CHECK (farm_condition IN ('Healthy', 'Needs Support', 'Damaged')),
    growth_stage VARCHAR(50) NOT NULL CHECK (growth_stage IN (
        'Land Preparation',
        'Planting',
        'Seedling',
        'Vegetative',
        'Mature',
        'Ready for Harvest',
        'Harvesting',
        'Post-Harvest'
    )),
    issues_observed TEXT[],
    other_issues TEXT,
    actions_taken TEXT NOT NULL,
    recommendations TEXT NOT NULL,
    next_monitoring_date DATE NOT NULL,
    weather_condition VARCHAR(100),
    estimated_yield DECIMAL(10, 2),
    remarks TEXT,
    photo_urls TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    CONSTRAINT check_visit_date CHECK (date_of_visit <= CURRENT_DATE),
    CONSTRAINT check_next_monitoring CHECK (next_monitoring_date > date_of_visit)
);

-- Monitoring issues table
CREATE TABLE IF NOT EXISTS public.monitoring_issues (
    issue_id SERIAL PRIMARY KEY,
    issue_name VARCHAR(100) UNIQUE NOT NULL,
    issue_category VARCHAR(50),
    description TEXT,
    severity_level VARCHAR(20) CHECK (severity_level IN ('Low', 'Medium', 'High', 'Critical')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CONTENT MANAGEMENT
-- =====================================================

-- Articles table for news and educational content
CREATE TABLE IF NOT EXISTS public.articles (
  article_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  author VARCHAR(100),
  published_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES public.association_officers(officer_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team members table for MAO Culiram team
CREATE TABLE IF NOT EXISTS public.team_members (
  member_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(100) NOT NULL,
  position VARCHAR(100) NOT NULL,
  photo_url TEXT,
  bio TEXT,
  email VARCHAR(100),
  phone VARCHAR(20),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.association_officers(officer_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Harvest indexes
CREATE INDEX IF NOT EXISTS idx_harvests_farmer_id ON public.harvests(farmer_id);
CREATE INDEX IF NOT EXISTS idx_harvests_harvest_date ON public.harvests(harvest_date);
CREATE INDEX IF NOT EXISTS idx_harvests_status ON public.harvests(status);
CREATE INDEX IF NOT EXISTS idx_harvests_municipality ON public.harvests(municipality);
CREATE INDEX IF NOT EXISTS idx_harvests_barangay ON public.harvests(barangay);
CREATE INDEX IF NOT EXISTS idx_harvests_variety ON public.harvests(abaca_variety);
CREATE INDEX IF NOT EXISTS idx_harvests_created_at ON public.harvests(created_at);

-- Inventory indexes
CREATE INDEX IF NOT EXISTS idx_inventory_mao_id ON public.inventory(mao_id);
CREATE INDEX IF NOT EXISTS idx_inventory_harvest_id ON public.inventory(harvest_id);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON public.inventory(status);
CREATE INDEX IF NOT EXISTS idx_inventory_grade ON public.inventory(fiber_grade);
CREATE INDEX IF NOT EXISTS idx_inventory_storage_location ON public.inventory(storage_location);
CREATE INDEX IF NOT EXISTS idx_inventory_created_at ON public.inventory(created_at);

-- Distribution indexes
CREATE INDEX IF NOT EXISTS idx_distributions_inventory_id ON public.inventory_distributions(inventory_id);
CREATE INDEX IF NOT EXISTS idx_distributions_date ON public.inventory_distributions(distribution_date);
CREATE INDEX IF NOT EXISTS idx_distributions_recipient ON public.inventory_distributions(distributed_to);

-- Monitoring indexes
CREATE INDEX IF NOT EXISTS idx_monitoring_farmer_id ON public.monitoring_records(farmer_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_date_of_visit ON public.monitoring_records(date_of_visit);
CREATE INDEX IF NOT EXISTS idx_monitoring_next_date ON public.monitoring_records(next_monitoring_date);
CREATE INDEX IF NOT EXISTS idx_monitoring_farm_condition ON public.monitoring_records(farm_condition);
CREATE INDEX IF NOT EXISTS idx_monitoring_growth_stage ON public.monitoring_records(growth_stage);
CREATE INDEX IF NOT EXISTS idx_monitoring_created_at ON public.monitoring_records(created_at);

-- Content indexes
CREATE INDEX IF NOT EXISTS idx_articles_category ON public.articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_published_date ON public.articles(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_team_members_display_order ON public.team_members(display_order);
CREATE INDEX IF NOT EXISTS idx_team_members_active ON public.team_members(is_active);


-- =====================================================
-- ROW LEVEL SECURITY (Disabled for development)
-- =====================================================
ALTER TABLE public.harvests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_distributions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_records DISABLE ROW LEVEL SECURITY;