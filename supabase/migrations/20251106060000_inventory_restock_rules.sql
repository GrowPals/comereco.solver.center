BEGIN;

CREATE TABLE public.inventory_restock_rules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
    min_stock integer NOT NULL CHECK (min_stock >= 0),
    reorder_quantity integer NOT NULL CHECK (reorder_quantity > 0),
    status text NOT NULL CHECK (status IN ('active', 'paused')),
    notes text,
    preferred_vendor text,
    preferred_warehouse text,
    created_by uuid NOT NULL DEFAULT auth.uid(),
    updated_by uuid DEFAULT auth.uid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_restock_rules ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_inventory_restock_rules_company_status
    ON public.inventory_restock_rules (company_id, status);

CREATE INDEX idx_inventory_restock_rules_company_project
    ON public.inventory_restock_rules (company_id, project_id);

CREATE UNIQUE INDEX uq_inventory_restock_rules_active
    ON public.inventory_restock_rules (company_id, product_id, project_id)
    WHERE status = 'active';

CREATE TRIGGER trg_inventory_restock_rules_updated_at
    BEFORE UPDATE ON public.inventory_restock_rules
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "inventory_restock_rules_select"
    ON public.inventory_restock_rules
    FOR SELECT
    USING (
        company_id = public.get_user_company_id()
        AND (public.is_admin() OR public.is_supervisor())
    );

CREATE POLICY "inventory_restock_rules_insert"
    ON public.inventory_restock_rules
    FOR INSERT
    WITH CHECK (
        company_id = public.get_user_company_id()
        AND (public.is_admin() OR public.is_supervisor())
    );

CREATE POLICY "inventory_restock_rules_update"
    ON public.inventory_restock_rules
    FOR UPDATE
    USING (
        company_id = public.get_user_company_id()
        AND (public.is_admin() OR public.is_supervisor())
    )
    WITH CHECK (
        company_id = public.get_user_company_id()
        AND (public.is_admin() OR public.is_supervisor())
    );

CREATE POLICY "inventory_restock_rules_delete"
    ON public.inventory_restock_rules
    FOR DELETE
    USING (
        company_id = public.get_user_company_id()
        AND (public.is_admin() OR public.is_supervisor())
    );

CREATE TABLE public.inventory_restock_rule_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id uuid REFERENCES public.inventory_restock_rules(id) ON DELETE SET NULL,
    company_id uuid NOT NULL DEFAULT public.get_user_company_id(),
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
    triggered_stock integer,
    status_before text,
    status_after text,
    event_type text,
    metadata jsonb,
    created_by uuid DEFAULT auth.uid(),
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_restock_rule_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_inventory_restock_rule_logs_company_event
    ON public.inventory_restock_rule_logs (company_id, event_type, created_at DESC);

CREATE INDEX idx_inventory_restock_rule_logs_rule
    ON public.inventory_restock_rule_logs (rule_id);

CREATE POLICY "inventory_restock_rule_logs_select"
    ON public.inventory_restock_rule_logs
    FOR SELECT
    USING (
        company_id = public.get_user_company_id()
        AND (public.is_admin() OR public.is_supervisor())
    );

CREATE POLICY "inventory_restock_rule_logs_insert"
    ON public.inventory_restock_rule_logs
    FOR INSERT
    WITH CHECK (
        (
            company_id = public.get_user_company_id()
            AND (public.is_admin() OR public.is_supervisor())
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY "inventory_restock_rule_logs_delete"
    ON public.inventory_restock_rule_logs
    FOR DELETE
    USING (
        company_id = public.get_user_company_id()
        AND (public.is_admin() OR public.is_supervisor())
    );

COMMENT ON TABLE public.inventory_restock_rules IS 'Rules that define minimum stock and automatic reorder quantities per product/project.';
COMMENT ON TABLE public.inventory_restock_rule_logs IS 'Reserved for future tracking of automatic restock rule activations.';

CREATE OR REPLACE VIEW public.inventory_restock_rules_view AS
SELECT
    r.id AS rule_id,
    r.company_id,
    r.product_id,
    r.project_id,
    r.min_stock,
    r.reorder_quantity,
    r.status,
    r.notes,
    r.preferred_vendor,
    r.preferred_warehouse,
    r.updated_at,
    p.name AS product_name,
    p.sku AS product_sku,
    p.stock AS current_stock,
    p.category AS product_category,
    pr.name AS project_name,
    pr.status AS project_status
FROM public.inventory_restock_rules r
LEFT JOIN public.products p ON p.id = r.product_id
LEFT JOIN public.projects pr ON pr.id = r.project_id
WHERE r.status = 'active';

COMMENT ON VIEW public.inventory_restock_rules_view IS 'Active restock rules enriched with product and project metadata for integrations (n8n).';

GRANT SELECT ON public.inventory_restock_rules_view TO authenticated;
GRANT SELECT ON public.inventory_restock_rules_view TO service_role;

COMMIT;
