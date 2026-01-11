CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: milestone_cashflow; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.milestone_cashflow (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    timeline_item_id uuid NOT NULL,
    budget numeric DEFAULT 0,
    forecasted numeric DEFAULT 0,
    contracted numeric DEFAULT 0,
    invoiced numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: project_costs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_costs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    timeline_item_id uuid,
    issue_date date NOT NULL,
    issue_number text,
    amount numeric(15,2) NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    description text,
    attachment_name text,
    attachment_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: project_files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_files (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    timeline_item_id uuid,
    name text NOT NULL,
    file_url text NOT NULL,
    file_type text,
    file_size integer,
    uploaded_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    status text DEFAULT 'Open'::text NOT NULL,
    start_date date,
    end_date date,
    total_budget numeric(15,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    site text,
    building text,
    tenant text,
    budget_line text,
    fiscal_year text,
    currency text DEFAULT 'PLN'::text,
    address text
);


--
-- Name: timeline_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.timeline_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    parent_id uuid,
    type text NOT NULL,
    name text NOT NULL,
    status text DEFAULT 'not-started'::text NOT NULL,
    due_date date,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    include_in_cashflow boolean DEFAULT false NOT NULL,
    CONSTRAINT timeline_items_type_check CHECK ((type = ANY (ARRAY['task'::text, 'milestone'::text])))
);


--
-- Name: milestone_cashflow milestone_cashflow_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.milestone_cashflow
    ADD CONSTRAINT milestone_cashflow_pkey PRIMARY KEY (id);


--
-- Name: milestone_cashflow milestone_cashflow_timeline_item_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.milestone_cashflow
    ADD CONSTRAINT milestone_cashflow_timeline_item_id_key UNIQUE (timeline_item_id);


--
-- Name: project_costs project_costs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_costs
    ADD CONSTRAINT project_costs_pkey PRIMARY KEY (id);


--
-- Name: project_files project_files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_files
    ADD CONSTRAINT project_files_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: timeline_items timeline_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.timeline_items
    ADD CONSTRAINT timeline_items_pkey PRIMARY KEY (id);


--
-- Name: milestone_cashflow update_milestone_cashflow_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_milestone_cashflow_updated_at BEFORE UPDATE ON public.milestone_cashflow FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: projects update_projects_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: timeline_items update_timeline_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_timeline_items_updated_at BEFORE UPDATE ON public.timeline_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: milestone_cashflow milestone_cashflow_timeline_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.milestone_cashflow
    ADD CONSTRAINT milestone_cashflow_timeline_item_id_fkey FOREIGN KEY (timeline_item_id) REFERENCES public.timeline_items(id) ON DELETE CASCADE;


--
-- Name: project_costs project_costs_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_costs
    ADD CONSTRAINT project_costs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_costs project_costs_timeline_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_costs
    ADD CONSTRAINT project_costs_timeline_item_id_fkey FOREIGN KEY (timeline_item_id) REFERENCES public.timeline_items(id) ON DELETE SET NULL;


--
-- Name: project_files project_files_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_files
    ADD CONSTRAINT project_files_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_files project_files_timeline_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_files
    ADD CONSTRAINT project_files_timeline_item_id_fkey FOREIGN KEY (timeline_item_id) REFERENCES public.timeline_items(id) ON DELETE SET NULL;


--
-- Name: timeline_items timeline_items_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.timeline_items
    ADD CONSTRAINT timeline_items_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.timeline_items(id) ON DELETE SET NULL;


--
-- Name: timeline_items timeline_items_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.timeline_items
    ADD CONSTRAINT timeline_items_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: milestone_cashflow Allow public delete access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete access" ON public.milestone_cashflow FOR DELETE USING (true);


--
-- Name: project_costs Allow public delete access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete access" ON public.project_costs FOR DELETE USING (true);


--
-- Name: project_files Allow public delete access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete access" ON public.project_files FOR DELETE USING (true);


--
-- Name: projects Allow public delete access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete access" ON public.projects FOR DELETE USING (true);


--
-- Name: timeline_items Allow public delete access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete access" ON public.timeline_items FOR DELETE USING (true);


--
-- Name: milestone_cashflow Allow public insert access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert access" ON public.milestone_cashflow FOR INSERT WITH CHECK (true);


--
-- Name: project_costs Allow public insert access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert access" ON public.project_costs FOR INSERT WITH CHECK (true);


--
-- Name: project_files Allow public insert access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert access" ON public.project_files FOR INSERT WITH CHECK (true);


--
-- Name: projects Allow public insert access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert access" ON public.projects FOR INSERT WITH CHECK (true);


--
-- Name: timeline_items Allow public insert access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert access" ON public.timeline_items FOR INSERT WITH CHECK (true);


--
-- Name: milestone_cashflow Allow public read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access" ON public.milestone_cashflow FOR SELECT USING (true);


--
-- Name: project_costs Allow public read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access" ON public.project_costs FOR SELECT USING (true);


--
-- Name: project_files Allow public read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access" ON public.project_files FOR SELECT USING (true);


--
-- Name: projects Allow public read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access" ON public.projects FOR SELECT USING (true);


--
-- Name: timeline_items Allow public read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access" ON public.timeline_items FOR SELECT USING (true);


--
-- Name: milestone_cashflow Allow public update access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update access" ON public.milestone_cashflow FOR UPDATE USING (true);


--
-- Name: project_costs Allow public update access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update access" ON public.project_costs FOR UPDATE USING (true);


--
-- Name: project_files Allow public update access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update access" ON public.project_files FOR UPDATE USING (true);


--
-- Name: projects Allow public update access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update access" ON public.projects FOR UPDATE USING (true);


--
-- Name: timeline_items Allow public update access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update access" ON public.timeline_items FOR UPDATE USING (true);


--
-- Name: milestone_cashflow; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.milestone_cashflow ENABLE ROW LEVEL SECURITY;

--
-- Name: project_costs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.project_costs ENABLE ROW LEVEL SECURITY;

--
-- Name: project_files; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

--
-- Name: projects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

--
-- Name: timeline_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.timeline_items ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;