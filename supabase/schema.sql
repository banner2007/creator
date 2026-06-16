-- Creator Shopy - Database Schema Definition
-- Deployable in Supabase SQL Editor

-- -------------------------------------------------------------
-- 1. CLEANUP (Optional for re-runs)
-- -------------------------------------------------------------
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_new_user();
-- DROP TABLE IF EXISTS public.audit_logs CASCADE;
-- DROP TABLE IF EXISTS public.analytics CASCADE;
-- DROP TABLE IF EXISTS public.publications CASCADE;
-- DROP TABLE IF EXISTS public.ai_images CASCADE;
-- DROP TABLE IF EXISTS public.sections CASCADE;
-- DROP TABLE IF EXISTS public.landing_pages CASCADE;
-- DROP TABLE IF EXISTS public.projects CASCADE;
-- DROP TABLE IF EXISTS public.products CASCADE;
-- DROP TABLE IF EXISTS public.users CASCADE;

-- -------------------------------------------------------------
-- 2. CREATE TABLES
-- -------------------------------------------------------------

-- USERS TABLE (Extends auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    credits INTEGER DEFAULT 20 CHECK (credits >= 0),
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'premium', 'agency')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- PRODUCTS TABLE
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (price >= 0),
    category TEXT,
    cover_image TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- PROJECTS TABLE
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'landing-page' NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- LANDING PAGES TABLE
CREATE TABLE public.landing_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    seo_title TEXT,
    seo_description TEXT,
    published BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- SECTIONS TABLE
CREATE TABLE public.sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landing_id UUID REFERENCES public.landing_pages(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('hero', 'gallery', 'benefits', 'comparison', 'faq', 'offer', 'cta', 'reviews')),
    content_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    position INTEGER NOT NULL,
    CONSTRAINT unique_landing_section_position UNIQUE (landing_id, position) INITIALLY DEFERRED
);

-- AI IMAGES TABLE
CREATE TABLE public.ai_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    prompt TEXT NOT NULL,
    model TEXT NOT NULL,
    resolution TEXT NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- PUBLICATIONS TABLE
CREATE TABLE public.publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landing_id UUID REFERENCES public.landing_pages(id) ON DELETE CASCADE NOT NULL,
    domain TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
    published_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ANALYTICS TABLE
CREATE TABLE public.analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landing_id UUID REFERENCES public.landing_pages(id) ON DELETE CASCADE NOT NULL,
    visits INTEGER DEFAULT 0 NOT NULL CHECK (visits >= 0),
    clicks INTEGER DEFAULT 0 NOT NULL CHECK (clicks >= 0),
    conversion NUMERIC(5,2) DEFAULT 0.00 NOT NULL CHECK (conversion >= 0.00 AND conversion <= 100.00),
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    CONSTRAINT unique_landing_date UNIQUE (landing_id, date)
);

-- AUDIT LOGS TABLE
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- -------------------------------------------------------------
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- -------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------
-- 4. CREATE RLS POLICIES
-- -------------------------------------------------------------

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Products policies
CREATE POLICY "Users can view their own products" ON public.products
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own products" ON public.products
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products" ON public.products
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products" ON public.products
    FOR DELETE USING (auth.uid() = user_id);

-- Projects policies
CREATE POLICY "Users can view their own projects" ON public.projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects" ON public.projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON public.projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON public.projects
    FOR DELETE USING (auth.uid() = user_id);

-- Landing Pages policies
CREATE POLICY "Users can view landings of their own projects" ON public.landing_pages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE public.projects.id = public.landing_pages.project_id
            AND public.projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create landings in their own projects" ON public.landing_pages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE public.projects.id = project_id
            AND public.projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update landings in their own projects" ON public.landing_pages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE public.projects.id = public.landing_pages.project_id
            AND public.projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete landings in their own projects" ON public.landing_pages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE public.projects.id = public.landing_pages.project_id
            AND public.projects.user_id = auth.uid()
        )
    );

-- Sections policies
CREATE POLICY "Users can view sections of their own landings" ON public.sections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.landing_pages
            JOIN public.projects ON public.projects.id = public.landing_pages.project_id
            WHERE public.landing_pages.id = public.sections.landing_id
            AND public.projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create sections in their own landings" ON public.sections
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.landing_pages
            JOIN public.projects ON public.projects.id = public.landing_pages.project_id
            WHERE public.landing_pages.id = landing_id
            AND public.projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update sections in their own landings" ON public.sections
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.landing_pages
            JOIN public.projects ON public.projects.id = public.landing_pages.project_id
            WHERE public.landing_pages.id = public.sections.landing_id
            AND public.projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete sections in their own landings" ON public.sections
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.landing_pages
            JOIN public.projects ON public.projects.id = public.landing_pages.project_id
            WHERE public.landing_pages.id = public.sections.landing_id
            AND public.projects.user_id = auth.uid()
        )
    );

-- AI Images policies
CREATE POLICY "Users can view their own AI generated images" ON public.ai_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE public.projects.id = public.ai_images.project_id
            AND public.projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can record AI generated images" ON public.ai_images
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE public.projects.id = project_id
            AND public.projects.user_id = auth.uid()
        )
    );

-- Publications policies
CREATE POLICY "Users can view their own publications" ON public.publications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.landing_pages
            JOIN public.projects ON public.projects.id = public.landing_pages.project_id
            WHERE public.landing_pages.id = public.publications.landing_id
            AND public.projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create/update their own publications" ON public.publications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.landing_pages
            JOIN public.projects ON public.projects.id = public.landing_pages.project_id
            WHERE public.landing_pages.id = public.publications.landing_id
            AND public.projects.user_id = auth.uid()
        )
    );

-- Analytics policies
CREATE POLICY "Users can view their landing analytics" ON public.analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.landing_pages
            JOIN public.projects ON public.projects.id = public.landing_pages.project_id
            WHERE public.landing_pages.id = public.analytics.landing_id
            AND public.projects.user_id = auth.uid()
        )
    );

-- Audit logs policies
CREATE POLICY "Users can view their own audit logs" ON public.audit_logs
    FOR SELECT USING (auth.uid() = user_id);

-- -------------------------------------------------------------
-- 5. TRIGGER FOR NEW USER SYNCHRONIZATION
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role, credits, plan)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        'user',
        20, -- Default free credits
        'free'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -------------------------------------------------------------
-- 6. INDEXES FOR PERFORMANCE
-- -------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_landing_pages_project_id ON public.landing_pages(project_id);
CREATE INDEX IF NOT EXISTS idx_sections_landing_id ON public.sections(landing_id);
CREATE INDEX IF NOT EXISTS idx_ai_images_project_id ON public.ai_images(project_id);
CREATE INDEX IF NOT EXISTS idx_publications_landing_id ON public.publications(landing_id);
CREATE INDEX IF NOT EXISTS idx_analytics_landing_id ON public.analytics(landing_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
