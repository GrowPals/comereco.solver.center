-- =====================================================
-- EnviteRP Production-Like Seed Data
-- 6 Months of Realistic Activity Simulation
-- =====================================================
--
-- This seed script generates:
-- - ~150 products across 10+ categories
-- - 50 virtual suppliers (via preferred_vendor fields)
-- - 300+ stock movements (via audit_log)
-- - 40 purchase orders (requisitions) with various states
-- - 100+ user actions from different roles
-- - 20+ support tickets (via notifications)
-- - Realistic timestamps spanning 6 months
-- - Real-world inconsistencies
--
-- Compatible with dark/light theme testing
-- =====================================================

BEGIN;

-- =====================================================
-- CLEANUP (Optional - comment out if adding to existing data)
-- =====================================================
-- TRUNCATE TABLE public.audit_log CASCADE;
-- TRUNCATE TABLE public.inventory_restock_rule_logs CASCADE;
-- TRUNCATE TABLE public.inventory_restock_rules CASCADE;
-- TRUNCATE TABLE public.requisition_items CASCADE;
-- TRUNCATE TABLE public.requisitions CASCADE;
-- TRUNCATE TABLE public.requisition_templates CASCADE;
-- TRUNCATE TABLE public.user_cart_items CASCADE;
-- TRUNCATE TABLE public.user_favorites CASCADE;
-- TRUNCATE TABLE public.project_members CASCADE;
-- TRUNCATE TABLE public.projects CASCADE;
-- TRUNCATE TABLE public.notifications CASCADE;
-- TRUNCATE TABLE public.products CASCADE;
-- TRUNCATE TABLE public.profiles CASCADE;
-- TRUNCATE TABLE public.companies CASCADE;
-- TRUNCATE TABLE public.folio_sequences CASCADE;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to generate random timestamps within the last 6 months
CREATE OR REPLACE FUNCTION random_timestamp_6mo(base_offset_days INTEGER DEFAULT 0)
RETURNS TIMESTAMPTZ AS $$
BEGIN
    RETURN NOW() - (RANDOM() * INTERVAL '180 days') - (base_offset_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Function to generate random timestamps in a specific range
CREATE OR REPLACE FUNCTION random_timestamp_between(start_ts TIMESTAMPTZ, end_ts TIMESTAMPTZ)
RETURNS TIMESTAMPTZ AS $$
BEGIN
    RETURN start_ts + (RANDOM() * (end_ts - start_ts));
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 1. COMPANY DATA
-- =====================================================

-- Insert main company
INSERT INTO public.companies (id, name, bind_location_id, bind_price_list_id, created_at)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'EnviteRP Solutions', 'LOC-001', 'PRICELIST-001', NOW() - INTERVAL '2 years')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. USER PROFILES (Various Roles)
-- =====================================================

-- Admin users (2)
INSERT INTO public.profiles (id, company_id, full_name, avatar_url, role, role_v2, is_active, phone, can_submit_without_approval, updated_at)
VALUES
    ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Carlos Mendoza', 'https://i.pravatar.cc/150?u=carlos', 'admin_corp', 'admin', true, '+52-555-1001', true, NOW() - INTERVAL '1 year'),
    ('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'María González', 'https://i.pravatar.cc/150?u=maria', 'admin_corp', 'admin', true, '+52-555-1002', true, NOW() - INTERVAL '1 year')
ON CONFLICT (id) DO NOTHING;

-- Supervisor users (3)
INSERT INTO public.profiles (id, company_id, full_name, avatar_url, role, role_v2, is_active, phone, can_submit_without_approval, updated_at)
VALUES
    ('a0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Roberto Sánchez', 'https://i.pravatar.cc/150?u=roberto', 'employee', 'supervisor', true, '+52-555-1003', true, NOW() - INTERVAL '10 months'),
    ('a0000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Ana López', 'https://i.pravatar.cc/150?u=ana', 'employee', 'supervisor', true, '+52-555-1004', true, NOW() - INTERVAL '9 months'),
    ('a0000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Jorge Ramírez', 'https://i.pravatar.cc/150?u=jorge', 'employee', 'supervisor', true, '+52-555-1005', true, NOW() - INTERVAL '8 months')
ON CONFLICT (id) DO NOTHING;

-- Regular users (10)
INSERT INTO public.profiles (id, company_id, full_name, avatar_url, role, role_v2, is_active, phone, can_submit_without_approval, updated_at)
VALUES
    ('a0000000-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 'Luis Fernández', 'https://i.pravatar.cc/150?u=luis', 'employee', 'user', true, '+52-555-1010', false, NOW() - INTERVAL '7 months'),
    ('a0000000-0000-0000-0000-000000000011', '11111111-1111-1111-1111-111111111111', 'Patricia Herrera', 'https://i.pravatar.cc/150?u=patricia', 'employee', 'user', true, '+52-555-1011', false, NOW() - INTERVAL '6 months'),
    ('a0000000-0000-0000-0000-000000000012', '11111111-1111-1111-1111-111111111111', 'Ricardo Torres', 'https://i.pravatar.cc/150?u=ricardo', 'employee', 'user', true, '+52-555-1012', false, NOW() - INTERVAL '6 months'),
    ('a0000000-0000-0000-0000-000000000013', '11111111-1111-1111-1111-111111111111', 'Sofía Morales', 'https://i.pravatar.cc/150?u=sofia', 'employee', 'user', true, '+52-555-1013', false, NOW() - INTERVAL '5 months'),
    ('a0000000-0000-0000-0000-000000000014', '11111111-1111-1111-1111-111111111111', 'Diego Castro', 'https://i.pravatar.cc/150?u=diego', 'employee', 'user', true, '+52-555-1014', false, NOW() - INTERVAL '5 months'),
    ('a0000000-0000-0000-0000-000000000015', '11111111-1111-1111-1111-111111111111', 'Carmen Ruiz', 'https://i.pravatar.cc/150?u=carmen', 'employee', 'user', true, '+52-555-1015', false, NOW() - INTERVAL '4 months'),
    ('a0000000-0000-0000-0000-000000000016', '11111111-1111-1111-1111-111111111111', 'Miguel Vargas', 'https://i.pravatar.cc/150?u=miguel', 'employee', 'user', true, '+52-555-1016', false, NOW() - INTERVAL '4 months'),
    ('a0000000-0000-0000-0000-000000000017', '11111111-1111-1111-1111-111111111111', 'Isabel Jiménez', 'https://i.pravatar.cc/150?u=isabel', 'employee', 'user', true, '+52-555-1017', false, NOW() - INTERVAL '3 months'),
    ('a0000000-0000-0000-0000-000000000018', '11111111-1111-1111-1111-111111111111', 'Fernando Ortiz', 'https://i.pravatar.cc/150?u=fernando', 'employee', 'user', true, '+52-555-1018', false, NOW() - INTERVAL '3 months'),
    ('a0000000-0000-0000-0000-000000000019', '11111111-1111-1111-1111-111111111111', 'Gabriela Medina', 'https://i.pravatar.cc/150?u=gabriela', 'employee', 'user', true, '+52-555-1019', false, NOW() - INTERVAL '2 months')
ON CONFLICT (id) DO NOTHING;

-- Inactive user (1)
INSERT INTO public.profiles (id, company_id, full_name, avatar_url, role, role_v2, is_active, phone, can_submit_without_approval, updated_at)
VALUES
    ('a0000000-0000-0000-0000-000000000020', '11111111-1111-1111-1111-111111111111', 'Pedro Inactive', 'https://i.pravatar.cc/150?u=pedro', 'employee', 'user', false, '+52-555-1020', false, NOW() - INTERVAL '3 months')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 3. PROJECTS
-- =====================================================

INSERT INTO public.projects (id, company_id, name, description, status, created_by, supervisor_id, created_at, updated_at)
VALUES
    ('p0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Edificio Central - Piso 5', 'Remodelación de oficinas ejecutivas', 'active', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', NOW() - INTERVAL '180 days', NOW() - INTERVAL '180 days'),
    ('p0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Almacén Norte', 'Expansión de capacidad de almacenamiento', 'active', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', NOW() - INTERVAL '150 days', NOW() - INTERVAL '150 days'),
    ('p0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Planta de Producción', 'Modernización de líneas de ensamblaje', 'active', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000005', NOW() - INTERVAL '120 days', NOW() - INTERVAL '120 days'),
    ('p0000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Centro de Distribución Sur', 'Nueva bodega de distribución', 'active', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', NOW() - INTERVAL '90 days', NOW() - INTERVAL '90 days'),
    ('p0000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Proyecto Piloto Q4', 'Implementación de nuevos sistemas', 'active', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days'),
    ('p0000000-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'Mantenimiento General 2024', 'Mantenimiento preventivo anual', 'archived', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', NOW() - INTERVAL '200 days', NOW() - INTERVAL '30 days')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 4. PROJECT MEMBERS
-- =====================================================

INSERT INTO public.project_members (project_id, user_id, role_in_project, requires_approval, added_at)
VALUES
    -- Edificio Central - Piso 5
    ('p0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000010', 'member', true, NOW() - INTERVAL '175 days'),
    ('p0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000011', 'member', true, NOW() - INTERVAL '175 days'),
    ('p0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000012', 'lead', false, NOW() - INTERVAL '175 days'),

    -- Almacén Norte
    ('p0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000013', 'member', true, NOW() - INTERVAL '145 days'),
    ('p0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000014', 'member', true, NOW() - INTERVAL '145 days'),
    ('p0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000015', 'lead', false, NOW() - INTERVAL '145 days'),

    -- Planta de Producción
    ('p0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000016', 'member', true, NOW() - INTERVAL '115 days'),
    ('p0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000017', 'member', true, NOW() - INTERVAL '115 days'),
    ('p0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000018', 'lead', false, NOW() - INTERVAL '115 days'),

    -- Centro de Distribución Sur
    ('p0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000010', 'member', true, NOW() - INTERVAL '85 days'),
    ('p0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000019', 'member', true, NOW() - INTERVAL '85 days'),

    -- Proyecto Piloto Q4
    ('p0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000011', 'lead', false, NOW() - INTERVAL '55 days'),
    ('p0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000012', 'member', true, NOW() - INTERVAL '55 days')
ON CONFLICT (project_id, user_id) DO NOTHING;

-- =====================================================
-- 5. PRODUCTS (150 products across 10+ categories)
-- =====================================================

-- Electronics & IT (15 products)
INSERT INTO public.products (id, company_id, bind_id, sku, name, description, price, stock, unit, category, is_active, created_at, updated_at)
VALUES
    ('prod0000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'BIND-ELE-001', 'ELE-001', 'Laptop Dell Latitude 5420', 'Intel i7, 16GB RAM, 512GB SSD', 18500.00, 45, 'pcs', 'Electronics', true, NOW() - INTERVAL '180 days', NOW() - INTERVAL '10 days'),
    ('prod0000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'BIND-ELE-002', 'ELE-002', 'Monitor LG 27" UltraGear', '144Hz, 1ms, IPS', 6800.00, 78, 'pcs', 'Electronics', true, NOW() - INTERVAL '175 days', NOW() - INTERVAL '5 days'),
    ('prod0000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'BIND-ELE-003', 'ELE-003', 'Teclado Mecánico Logitech G915', 'Wireless, RGB, Switch Tactile', 3200.00, 120, 'pcs', 'Electronics', true, NOW() - INTERVAL '170 days', NOW() - INTERVAL '15 days'),
    ('prod0000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'BIND-ELE-004', 'ELE-004', 'Mouse Logitech MX Master 3', 'Ergonómico, inalámbrico', 1850.00, 95, 'pcs', 'Electronics', true, NOW() - INTERVAL '165 days', NOW() - INTERVAL '8 days'),
    ('prod0000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'BIND-ELE-005', 'ELE-005', 'Webcam Logitech C920 HD Pro', '1080p, 30fps, Auto focus', 1450.00, 62, 'pcs', 'Electronics', true, NOW() - INTERVAL '160 days', NOW() - INTERVAL '12 days'),
    ('prod0000-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'BIND-ELE-006', 'ELE-006', 'Auriculares Sony WH-1000XM4', 'Noise cancelling, 30hrs batería', 6200.00, 38, 'pcs', 'Electronics', true, NOW() - INTERVAL '155 days', NOW() - INTERVAL '20 days'),
    ('prod0000-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'BIND-ELE-007', 'ELE-007', 'Hub USB-C Anker 7-en-1', 'HDMI, USB 3.0, lector SD', 980.00, 142, 'pcs', 'Electronics', true, NOW() - INTERVAL '150 days', NOW() - INTERVAL '3 days'),
    ('prod0000-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'BIND-ELE-008', 'ELE-008', 'Disco Duro Externo Seagate 2TB', 'USB 3.0, portátil', 1350.00, 88, 'pcs', 'Electronics', true, NOW() - INTERVAL '145 days', NOW() - INTERVAL '7 days'),
    ('prod0000-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'BIND-ELE-009', 'ELE-009', 'Router TP-Link Archer AX50', 'WiFi 6, dual band, 3000Mbps', 2100.00, 52, 'pcs', 'Electronics', true, NOW() - INTERVAL '140 days', NOW() - INTERVAL '18 days'),
    ('prod0000-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 'BIND-ELE-010', 'ELE-010', 'Switch de Red Cisco 24 puertos', 'Gigabit, administrable', 8500.00, 15, 'pcs', 'Electronics', true, NOW() - INTERVAL '135 days', NOW() - INTERVAL '25 days'),
    ('prod0000-0000-0000-0000-000000000011', '11111111-1111-1111-1111-111111111111', 'BIND-ELE-011', 'ELE-011', 'UPS APC 1500VA', 'Respaldo de batería, 8 salidas', 3800.00, 28, 'pcs', 'Electronics', true, NOW() - INTERVAL '130 days', NOW() - INTERVAL '14 days'),
    ('prod0000-0000-0000-0000-000000000012', '11111111-1111-1111-1111-111111111111', 'BIND-ELE-012', 'ELE-012', 'Tablet Samsung Galaxy Tab S8', '11", 128GB, S Pen incluido', 11200.00, 22, 'pcs', 'Electronics', true, NOW() - INTERVAL '125 days', NOW() - INTERVAL '30 days'),
    ('prod0000-0000-0000-0000-000000000013', '11111111-1111-1111-1111-111111111111', 'BIND-ELE-013', 'ELE-013', 'Impresora HP LaserJet Pro M404dn', 'Monocromática, duplex', 5600.00, 12, 'pcs', 'Electronics', true, NOW() - INTERVAL '120 days', NOW() - INTERVAL '22 days'),
    ('prod0000-0000-0000-0000-000000000014', '11111111-1111-1111-1111-111111111111', 'BIND-ELE-014', 'ELE-014', 'Cámara de Seguridad Hikvision 4MP', 'Visión nocturna, PoE', 1680.00, 65, 'pcs', 'Electronics', true, NOW() - INTERVAL '115 days', NOW() - INTERVAL '9 days'),
    ('prod0000-0000-0000-0000-000000000015', '11111111-1111-1111-1111-111111111111', 'BIND-ELE-015', 'ELE-015', 'Cable HDMI 2.1 Belkin 2m', '8K, 48Gbps', 485.00, 210, 'pcs', 'Electronics', true, NOW() - INTERVAL '110 days', NOW() - INTERVAL '4 days')
ON CONFLICT (id) DO NOTHING;

-- Office Furniture (15 products)
INSERT INTO public.products (id, company_id, bind_id, sku, name, description, price, stock, unit, category, is_active, created_at, updated_at)
VALUES
    ('prod0000-0000-0000-0000-000000000016', '11111111-1111-1111-1111-111111111111', 'BIND-FUR-001', 'FUR-001', 'Silla Ergonómica Herman Miller Aeron', 'Tamaño B, ajuste lumbar', 18500.00, 32, 'pcs', 'Furniture', true, NOW() - INTERVAL '180 days', NOW() - INTERVAL '11 days'),
    ('prod0000-0000-0000-0000-000000000017', '11111111-1111-1111-1111-111111111111', 'BIND-FUR-002', 'FUR-002', 'Escritorio Ajustable Flexispot E7', 'Eléctrico, 140x70cm', 9800.00, 18, 'pcs', 'Furniture', true, NOW() - INTERVAL '175 days', NOW() - INTERVAL '16 days'),
    ('prod0000-0000-0000-0000-000000000018', '11111111-1111-1111-1111-111111111111', 'BIND-FUR-003', 'FUR-003', 'Archivero Metálico 4 Gavetas', 'Con cerradura, color gris', 2350.00, 45, 'pcs', 'Furniture', true, NOW() - INTERVAL '170 days', NOW() - INTERVAL '8 days'),
    ('prod0000-0000-0000-0000-000000000019', '11111111-1111-1111-1111-111111111111', 'BIND-FUR-004', 'FUR-004', 'Mesa de Juntas 8 personas', 'Madera roble, 240x120cm', 12500.00, 8, 'pcs', 'Furniture', true, NOW() - INTERVAL '165 days', NOW() - INTERVAL '28 days'),
    ('prod0000-0000-0000-0000-000000000020', '11111111-1111-1111-1111-111111111111', 'BIND-FUR-005', 'FUR-005', 'Librero Modular IKEA Kallax 4x4', 'Blanco, 147x147cm', 3200.00, 22, 'pcs', 'Furniture', true, NOW() - INTERVAL '160 days', NOW() - INTERVAL '19 days'),
    ('prod0000-0000-0000-0000-000000000021', '11111111-1111-1111-1111-111111111111', 'BIND-FUR-006', 'FUR-006', 'Silla de Visita Apilable', 'Plástico reforzado, negra', 680.00, 156, 'pcs', 'Furniture', true, NOW() - INTERVAL '155 days', NOW() - INTERVAL '5 days'),
    ('prod0000-0000-0000-0000-000000000022', '11111111-1111-1111-1111-111111111111', 'BIND-FUR-007', 'FUR-007', 'Perchero de Pie Moderno', 'Acero inoxidable, 8 ganchos', 1150.00, 38, 'pcs', 'Furniture', true, NOW() - INTERVAL '150 days', NOW() - INTERVAL '12 days'),
    ('prod0000-0000-0000-0000-000000000023', '11111111-1111-1111-1111-111111111111', 'BIND-FUR-008', 'FUR-008', 'Escritorio Ejecutivo L-Shape', 'Cerezo, 180x140cm', 8900.00, 11, 'pcs', 'Furniture', true, NOW() - INTERVAL '145 days', NOW() - INTERVAL '24 days'),
    ('prod0000-0000-0000-0000-000000000024', '11111111-1111-1111-1111-111111111111', 'BIND-FUR-009', 'FUR-009', 'Cajonera Móvil 3 Gavetas', 'Con ruedas, blanca', 1580.00, 52, 'pcs', 'Furniture', true, NOW() - INTERVAL '140 days', NOW() - INTERVAL '7 days'),
    ('prod0000-0000-0000-0000-000000000025', '11111111-1111-1111-1111-111111111111', 'BIND-FUR-010', 'FUR-010', 'Estación de Trabajo Modular', '120x60cm, incluye panel divisorio', 5600.00, 28, 'pcs', 'Furniture', true, NOW() - INTERVAL '135 days', NOW() - INTERVAL '15 days'),
    ('prod0000-0000-0000-0000-000000000026', '11111111-1111-1111-1111-111111111111', 'BIND-FUR-011', 'FUR-011', 'Pizarra Blanca Magnética 120x90cm', 'Marco aluminio, incluye marcadores', 980.00, 42, 'pcs', 'Furniture', true, NOW() - INTERVAL '130 days', NOW() - INTERVAL '21 days'),
    ('prod0000-0000-0000-0000-000000000027', '11111111-1111-1111-1111-111111111111', 'BIND-FUR-012', 'FUR-012', 'Sofá de Espera 3 Plazas', 'Piel sintética negra', 6800.00, 9, 'pcs', 'Furniture', true, NOW() - INTERVAL '125 days', NOW() - INTERVAL '32 days'),
    ('prod0000-0000-0000-0000-000000000028', '11111111-1111-1111-1111-111111111111', 'BIND-FUR-013', 'FUR-013', 'Lámpara de Escritorio LED', 'Brazo articulado, dimeable', 850.00, 78, 'pcs', 'Furniture', true, NOW() - INTERVAL '120 days', NOW() - INTERVAL '6 days'),
    ('prod0000-0000-0000-0000-000000000029', '11111111-1111-1111-1111-111111111111', 'BIND-FUR-014', 'FUR-014', 'Reposapiés Ergonómico Ajustable', 'Ángulo regulable, antideslizante', 420.00, 95, 'pcs', 'Furniture', true, NOW() - INTERVAL '115 days', NOW() - INTERVAL '10 days'),
    ('prod0000-0000-0000-0000-000000000030', '11111111-1111-1111-1111-111111111111', 'BIND-FUR-015', 'FUR-015', 'Organizador de Cables Escritorio', 'Bandeja adhesiva, 40cm', 185.00, 225, 'pcs', 'Furniture', true, NOW() - INTERVAL '110 days', NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- Office Supplies (20 products)
INSERT INTO public.products (id, company_id, bind_id, sku, name, description, price, stock, unit, category, is_active, created_at, updated_at)
VALUES
    ('prod0000-0000-0000-0000-000000000031', '11111111-1111-1111-1111-111111111111', 'BIND-SUP-001', 'SUP-001', 'Papel Bond Carta 5000 hojas', '75g/m², alta blancura', 580.00, 485, 'box', 'Office Supplies', true, NOW() - INTERVAL '180 days', NOW() - INTERVAL '2 days'),
    ('prod0000-0000-0000-0000-000000000032', '11111111-1111-1111-1111-111111111111', 'BIND-SUP-002', 'SUP-002', 'Bolígrafos BIC Cristal Azul Caja 50', 'Punta mediana, tinta azul', 285.00, 1250, 'box', 'Office Supplies', true, NOW() - INTERVAL '175 days', NOW() - INTERVAL '1 day'),
    ('prod0000-0000-0000-0000-000000000033', '11111111-1111-1111-1111-111111111111', 'BIND-SUP-003', 'SUP-003', 'Folders Manila Tamaño Carta 100pcs', 'Sin broche, color manila', 165.00, 820, 'pack', 'Office Supplies', true, NOW() - INTERVAL '170 days', NOW() - INTERVAL '4 days'),
    ('prod0000-0000-0000-0000-000000000034', '11111111-1111-1111-1111-111111111111', 'BIND-SUP-004', 'SUP-004', 'Clips Metálicos #1 Caja 100', 'Niquelados, estándar', 35.00, 1850, 'box', 'Office Supplies', true, NOW() - INTERVAL '165 days', NOW() - INTERVAL '3 days'),
    ('prod0000-0000-0000-0000-000000000035', '11111111-1111-1111-1111-111111111111', 'BIND-SUP-005', 'SUP-005', 'Post-it 3x3 Amarillo 12 blocks', '100 hojas por block', 185.00, 650, 'pack', 'Office Supplies', true, NOW() - INTERVAL '160 days', NOW() - INTERVAL '5 days'),
    ('prod0000-0000-0000-0000-000000000036', '11111111-1111-1111-1111-111111111111', 'BIND-SUP-006', 'SUP-006', 'Marcadores Permanentes Sharpie Negro 12pcs', 'Punta fina', 320.00, 385, 'pack', 'Office Supplies', true, NOW() - INTERVAL '155 days', NOW() - INTERVAL '6 days'),
    ('prod0000-0000-0000-0000-000000000037', '11111111-1111-1111-1111-111111111111', 'BIND-SUP-007', 'SUP-007', 'Carpetas de Argollas 3" Blancas', 'Tamaño carta, 4 argollas', 125.00, 520, 'pcs', 'Office Supplies', true, NOW() - INTERVAL '150 days', NOW() - INTERVAL '8 days'),
    ('prod0000-0000-0000-0000-000000000038', '11111111-1111-1111-1111-111111111111', 'BIND-SUP-008', 'SUP-008', 'Engrapadoras Swingline Heavy Duty', 'Hasta 120 hojas', 485.00, 145, 'pcs', 'Office Supplies', true, NOW() - INTERVAL '145 days', NOW() - INTERVAL '12 days'),
    ('prod0000-0000-0000-0000-000000000039', '11111111-1111-1111-1111-111111111111', 'BIND-SUP-009', 'SUP-009', 'Grapas Estándar 26/6 Caja 5000', 'Para engrapadora estándar', 42.00, 2500, 'box', 'Office Supplies', true, NOW() - INTERVAL '140 days', NOW() - INTERVAL '7 days'),
    ('prod0000-0000-0000-0000-000000000040', '11111111-1111-1111-1111-111111111111', 'BIND-SUP-010', 'SUP-010', 'Corrector Líquido BIC Wite-Out 20ml', 'Secado rápido', 28.00, 1200, 'pcs', 'Office Supplies', true, NOW() - INTERVAL '135 days', NOW() - INTERVAL '9 days'),
    ('prod0000-0000-0000-0000-000000000041', '11111111-1111-1111-1111-111111111111', 'BIND-SUP-011', 'SUP-011', 'Cinta Adhesiva Scotch 3/4" x 65m', 'Transparente, 12 rollos', 285.00, 425, 'pack', 'Office Supplies', true, NOW() - INTERVAL '130 days', NOW() - INTERVAL '11 days'),
    ('prod0000-0000-0000-0000-000000000042', '11111111-1111-1111-1111-111111111111', 'BIND-SUP-012', 'SUP-012', 'Tijeras Oficina 8" Acero Inox', 'Mango ergonómico', 95.00, 285, 'pcs', 'Office Supplies', true, NOW() - INTERVAL '125 days', NOW() - INTERVAL '14 days'),
    ('prod0000-0000-0000-0000-000000000043', '11111111-1111-1111-1111-111111111111', 'BIND-SUP-013', 'SUP-013', 'Pegamento en Barra Pritt 40g', 'No tóxico, lavable', 32.00, 950, 'pcs', 'Office Supplies', true, NOW() - INTERVAL '120 days', NOW() - INTERVAL '5 days'),
    ('prod0000-0000-0000-0000-000000000044', '11111111-1111-1111-1111-111111111111', 'BIND-SUP-014', 'SUP-014', 'Calculadora Científica Casio FX-991', '552 funciones', 485.00, 68, 'pcs', 'Office Supplies', true, NOW() - INTERVAL '115 days', NOW() - INTERVAL '18 days'),
    ('prod0000-0000-0000-0000-000000000045', '11111111-1111-1111-1111-111111111111', 'BIND-SUP-015', 'SUP-015', 'Etiquetas Autoadhesivas Blancas 1000pcs', '38x12mm, para impresora', 125.00, 680, 'pack', 'Office Supplies', true, NOW() - INTERVAL '110 days', NOW() - INTERVAL '10 days'),
    ('prod0000-0000-0000-0000-000000000046', '11111111-1111-1111-1111-111111111111', 'BIND-SUP-016', 'SUP-016', 'Perforadora 2 Hoyos 40 hojas', 'Ajuste de margen', 185.00, 195, 'pcs', 'Office Supplies', true, NOW() - INTERVAL '105 days', NOW() - INTERVAL '22 days'),
    ('prod0000-0000-0000-0000-000000000047', '11111111-1111-1111-1111-111111111111', 'BIND-SUP-017', 'SUP-017', 'Cuadernos Profesionales 100 hojas', 'Raya, pasta dura', 38.00, 1500, 'pcs', 'Office Supplies', true, NOW() - INTERVAL '100 days', NOW() - INTERVAL '6 days'),
    ('prod0000-0000-0000-0000-000000000048', '11111111-1111-1111-1111-111111111111', 'BIND-SUP-018', 'SUP-018', 'Marcatextos Stabilo Boss Colores 4pcs', 'Amarillo, naranja, verde, rosa', 95.00, 425, 'pack', 'Office Supplies', true, NOW() - INTERVAL '95 days', NOW() - INTERVAL '13 days'),
    ('prod0000-0000-0000-0000-000000000049', '11111111-1111-1111-1111-111111111111', 'BIND-SUP-019', 'SUP-019', 'Regla Metálica 30cm Antiderrapante', 'Aluminio, graduación mm', 48.00, 580, 'pcs', 'Office Supplies', true, NOW() - INTERVAL '90 days', NOW() - INTERVAL '8 days'),
    ('prod0000-0000-0000-0000-000000000050', '11111111-1111-1111-1111-111111111111', 'BIND-SUP-020', 'SUP-020', 'Bandeja Portadocumentos 3 Niveles', 'Metal malla, negra', 285.00, 175, 'pcs', 'Office Supplies', true, NOW() - INTERVAL '85 days', NOW() - INTERVAL '15 days')
ON CONFLICT (id) DO NOTHING;

-- Construction Materials (20 products)
INSERT INTO public.products (id, company_id, bind_id, sku, name, description, price, stock, unit, category, is_active, created_at, updated_at)
VALUES
    ('prod0000-0000-0000-0000-000000000051', '11111111-1111-1111-1111-111111111111', 'BIND-CON-001', 'CON-001', 'Cemento Portland Gris Bulto 50kg', 'Tipo CPO 40', 185.00, 2500, 'bag', 'Construction', true, NOW() - INTERVAL '180 days', NOW() - INTERVAL '1 day'),
    ('prod0000-0000-0000-0000-000000000052', '11111111-1111-1111-1111-111111111111', 'BIND-CON-002', 'CON-002', 'Arena de Río m³', 'Lavada, para construcción', 420.00, 85, 'm3', 'Construction', true, NOW() - INTERVAL '175 days', NOW() - INTERVAL '3 days'),
    ('prod0000-0000-0000-0000-000000000053', '11111111-1111-1111-1111-111111111111', 'BIND-CON-003', 'CON-003', 'Grava 3/4" m³', 'Triturada, clasificada', 385.00, 92, 'm3', 'Construction', true, NOW() - INTERVAL '170 days', NOW() - INTERVAL '2 days'),
    ('prod0000-0000-0000-0000-000000000054', '11111111-1111-1111-1111-111111111111', 'BIND-CON-004', 'CON-004', 'Varilla Corrugada 3/8" x 12m', 'Acero grado 42', 145.00, 1850, 'pcs', 'Construction', true, NOW() - INTERVAL '165 days', NOW() - INTERVAL '4 days'),
    ('prod0000-0000-0000-0000-000000000055', '11111111-1111-1111-1111-111111111111', 'BIND-CON-005', 'CON-005', 'Varilla Corrugada 1/2" x 12m', 'Acero grado 42', 255.00, 1420, 'pcs', 'Construction', true, NOW() - INTERVAL '160 days', NOW() - INTERVAL '5 days'),
    ('prod0000-0000-0000-0000-000000000056', '11111111-1111-1111-1111-111111111111', 'BIND-CON-006', 'CON-006', 'Block de Concreto 15x20x40cm', 'Hueco estándar', 18.50, 8500, 'pcs', 'Construction', true, NOW() - INTERVAL '155 days', NOW() - INTERVAL '2 days'),
    ('prod0000-0000-0000-0000-000000000057', '11111111-1111-1111-1111-111111111111', 'BIND-CON-007', 'CON-007', 'Tabique Rojo Recocido 7x14x28cm', 'Arcilla cocida', 8.50, 12500, 'pcs', 'Construction', true, NOW() - INTERVAL '150 days', NOW() - INTERVAL '6 days'),
    ('prod0000-0000-0000-0000-000000000058', '11111111-1111-1111-1111-111111111111', 'BIND-CON-008', 'CON-008', 'Cal Hidratada Bulto 20kg', 'Para mortero', 95.00, 850, 'bag', 'Construction', true, NOW() - INTERVAL '145 days', NOW() - INTERVAL '8 days'),
    ('prod0000-0000-0000-0000-000000000059', '11111111-1111-1111-1111-111111111111', 'BIND-CON-009', 'CON-009', 'Yeso Blanco Bulto 25kg', 'Para acabados interiores', 125.00, 520, 'bag', 'Construction', true, NOW() - INTERVAL '140 days', NOW() - INTERVAL '7 days'),
    ('prod0000-0000-0000-0000-000000000060', '11111111-1111-1111-1111-111111111111', 'BIND-CON-010', 'CON-010', 'Alambrón 5.5mm x kg', 'Acero bajo carbono', 18.50, 3250, 'kg', 'Construction', true, NOW() - INTERVAL '135 days', NOW() - INTERVAL '4 days'),
    ('prod0000-0000-0000-0000-000000000061', '11111111-1111-1111-1111-111111111111', 'BIND-CON-011', 'CON-011', 'Alambre Recocido Rollo 1kg', 'Calibre 18', 42.00, 1680, 'roll', 'Construction', true, NOW() - INTERVAL '130 days', NOW() - INTERVAL '9 days'),
    ('prod0000-0000-0000-0000-000000000062', '11111111-1111-1111-1111-111111111111', 'BIND-CON-012', 'CON-012', 'Pintura Vinílica Blanca 19L', 'Rendimiento 12-14 m²/L', 685.00, 285, 'bucket', 'Construction', true, NOW() - INTERVAL '125 days', NOW() - INTERVAL '11 days'),
    ('prod0000-0000-0000-0000-000000000063', '11111111-1111-1111-1111-111111111111', 'BIND-CON-013', 'CON-013', 'Pintura Esmalte Azul Comex 1L', 'Para metal y madera', 285.00, 385, 'liter', 'Construction', true, NOW() - INTERVAL '120 days', NOW() - INTERVAL '13 days'),
    ('prod0000-0000-0000-0000-000000000064', '11111111-1111-1111-1111-111111111111', 'BIND-CON-014', 'CON-014', 'Thinner Estándar 4L', 'Diluyente para esmaltes', 185.00, 420, 'liter', 'Construction', true, NOW() - INTERVAL '115 days', NOW() - INTERVAL '10 days'),
    ('prod0000-0000-0000-0000-000000000065', '11111111-1111-1111-1111-111111111111', 'BIND-CON-015', 'CON-015', 'Tubo PVC Sanitario 4" x 6m', 'Serie 20, para drenaje', 185.00, 620, 'pcs', 'Construction', true, NOW() - INTERVAL '110 days', NOW() - INTERVAL '6 days'),
    ('prod0000-0000-0000-0000-000000000066', '11111111-1111-1111-1111-111111111111', 'BIND-CON-016', 'CON-016', 'Tubo PVC Hidráulico 1/2" x 6m', 'Cédula 40, agua fría', 85.00, 1250, 'pcs', 'Construction', true, NOW() - INTERVAL '105 days', NOW() - INTERVAL '12 days'),
    ('prod0000-0000-0000-0000-000000000067', '11111111-1111-1111-1111-111111111111', 'BIND-CON-017', 'CON-017', 'Codo PVC 90° 1/2" Roscado', 'Para instalaciones hidráulicas', 12.50, 2850, 'pcs', 'Construction', true, NOW() - INTERVAL '100 days', NOW() - INTERVAL '5 days'),
    ('prod0000-0000-0000-0000-000000000068', '11111111-1111-1111-1111-111111111111', 'BIND-CON-018', 'CON-018', 'Llave de Paso 1/2" Bronce', 'Con maneral', 125.00, 485, 'pcs', 'Construction', true, NOW() - INTERVAL '95 days', NOW() - INTERVAL '14 days'),
    ('prod0000-0000-0000-0000-000000000069', '11111111-1111-1111-1111-111111111111', 'BIND-CON-019', 'CON-019', 'Cable Eléctrico THW 12 AWG x 100m', 'Cobre, 600V', 1250.00, 185, 'roll', 'Construction', true, NOW() - INTERVAL '90 days', NOW() - INTERVAL '18 days'),
    ('prod0000-0000-0000-0000-000000000070', '11111111-1111-1111-1111-111111111111', 'BIND-CON-020', 'CON-020', 'Interruptor Sencillo 15A Blanco', 'Para uso residencial', 28.50, 1850, 'pcs', 'Construction', true, NOW() - INTERVAL '85 days', NOW() - INTERVAL '7 days')
ON CONFLICT (id) DO NOTHING;

-- Tools & Equipment (20 products)
INSERT INTO public.products (id, company_id, bind_id, sku, name, description, price, stock, unit, category, is_active, created_at, updated_at)
VALUES
    ('prod0000-0000-0000-0000-000000000071', '11111111-1111-1111-1111-111111111111', 'BIND-TOO-001', 'TOO-001', 'Taladro Percutor DeWalt 1/2" 850W', 'Velocidad variable, reversa', 2850.00, 28, 'pcs', 'Tools', true, NOW() - INTERVAL '180 days', NOW() - INTERVAL '15 days'),
    ('prod0000-0000-0000-0000-000000000072', '11111111-1111-1111-1111-111111111111', 'BIND-TOO-002', 'TOO-002', 'Taladro Inalámbrico Makita 18V', 'Incluye 2 baterías y cargador', 4200.00, 18, 'pcs', 'Tools', true, NOW() - INTERVAL '175 days', NOW() - INTERVAL '22 days'),
    ('prod0000-0000-0000-0000-000000000073', '11111111-1111-1111-1111-111111111111', 'BIND-TOO-003', 'TOO-003', 'Esmeriladora Angular 4-1/2" Bosch', '850W, 11,000 RPM', 1680.00, 35, 'pcs', 'Tools', true, NOW() - INTERVAL '170 days', NOW() - INTERVAL '18 days'),
    ('prod0000-0000-0000-0000-000000000074', '11111111-1111-1111-1111-111111111111', 'BIND-TOO-004', 'TOO-004', 'Sierra Circular 7-1/4" Skil', '1400W, guía láser', 1950.00, 22, 'pcs', 'Tools', true, NOW() - INTERVAL '165 days', NOW() - INTERVAL '25 days'),
    ('prod0000-0000-0000-0000-000000000075', '11111111-1111-1111-1111-111111111111', 'BIND-TOO-005', 'TOO-005', 'Caladora Profesional Black & Decker', '550W, corte pendular', 1280.00, 28, 'pcs', 'Tools', true, NOW() - INTERVAL '160 days', NOW() - INTERVAL '12 days'),
    ('prod0000-0000-0000-0000-000000000076', '11111111-1111-1111-1111-111111111111', 'BIND-TOO-006', 'TOO-006', 'Rotomartillo SDS Plus 26mm Bosch', '800W, 3 modos', 3850.00, 12, 'pcs', 'Tools', true, NOW() - INTERVAL '155 days', NOW() - INTERVAL '28 days'),
    ('prod0000-0000-0000-0000-000000000077', '11111111-1111-1111-1111-111111111111', 'BIND-TOO-007', 'TOO-007', 'Compresor de Aire 50L 2.5HP', 'Portátil, libre de aceite', 4800.00, 8, 'pcs', 'Tools', true, NOW() - INTERVAL '150 days', NOW() - INTERVAL '35 days'),
    ('prod0000-0000-0000-0000-000000000078', '11111111-1111-1111-1111-111111111111', 'BIND-TOO-008', 'TOO-008', 'Pistola de Impacto Neumática 1/2"', 'Torque 550 lb-ft', 1450.00, 18, 'pcs', 'Tools', true, NOW() - INTERVAL '145 days', NOW() - INTERVAL '16 days'),
    ('prod0000-0000-0000-0000-000000000079', '11111111-1111-1111-1111-111111111111', 'BIND-TOO-009', 'TOO-009', 'Juego de Llaves Combinadas 8-24mm', '12 piezas, cromo vanadio', 1180.00, 42, 'set', 'Tools', true, NOW() - INTERVAL '140 days', NOW() - INTERVAL '8 days'),
    ('prod0000-0000-0000-0000-000000000080', '11111111-1111-1111-1111-111111111111', 'BIND-TOO-010', 'TOO-010', 'Juego de Desarmadores Stanley 20pcs', 'Planos y Phillips, magnéticos', 485.00, 68, 'set', 'Tools', true, NOW() - INTERVAL '135 days', NOW() - INTERVAL '14 days'),
    ('prod0000-0000-0000-0000-000000000081', '11111111-1111-1111-1111-111111111111', 'BIND-TOO-011', 'TOO-011', 'Martillo Carpintero 16oz Stanley', 'Mango fibra de vidrio', 285.00, 95, 'pcs', 'Tools', true, NOW() - INTERVAL '130 days', NOW() - INTERVAL '6 days'),
    ('prod0000-0000-0000-0000-000000000082', '11111111-1111-1111-1111-111111111111', 'BIND-TOO-012', 'TOO-012', 'Nivel de Burbuja Aluminio 24"', '3 burbujas, precisión 0.5mm/m', 385.00, 52, 'pcs', 'Tools', true, NOW() - INTERVAL '125 days', NOW() - INTERVAL '11 days'),
    ('prod0000-0000-0000-0000-000000000083', '11111111-1111-1111-1111-111111111111', 'BIND-TOO-013', 'TOO-013', 'Flexómetro Stanley PowerLock 7.5m', 'Cinta 25mm, auto retráctil', 245.00, 125, 'pcs', 'Tools', true, NOW() - INTERVAL '120 days', NOW() - INTERVAL '5 days'),
    ('prod0000-0000-0000-0000-000000000084', '11111111-1111-1111-1111-111111111111', 'BIND-TOO-014', 'TOO-014', 'Alicate Universal 8" Truper', 'Acero forjado', 185.00, 145, 'pcs', 'Tools', true, NOW() - INTERVAL '115 days', NOW() - INTERVAL '9 days'),
    ('prod0000-0000-0000-0000-000000000085', '11111111-1111-1111-1111-111111111111', 'BIND-TOO-015', 'TOO-015', 'Segueta Profesional 12" Truper', 'Marco ajustable', 125.00, 88, 'pcs', 'Tools', true, NOW() - INTERVAL '110 days', NOW() - INTERVAL '13 days'),
    ('prod0000-0000-0000-0000-000000000086', '11111111-1111-1111-1111-111111111111', 'BIND-TOO-016', 'TOO-016', 'Caja de Herramientas Plástica 21"', 'Con organizador superior', 385.00, 45, 'pcs', 'Tools', true, NOW() - INTERVAL '105 days', NOW() - INTERVAL '19 days'),
    ('prod0000-0000-0000-0000-000000000087', '11111111-1111-1111-1111-111111111111', 'BIND-TOO-017', 'TOO-017', 'Extensión Eléctrica 15m Calibre 12', '3 contactos, para intemperie', 485.00, 62, 'pcs', 'Tools', true, NOW() - INTERVAL '100 days', NOW() - INTERVAL '10 days'),
    ('prod0000-0000-0000-0000-000000000088', '11111111-1111-1111-1111-111111111111', 'BIND-TOO-018', 'TOO-018', 'Multímetro Digital Fluke 115', 'True RMS, 600V', 1850.00, 22, 'pcs', 'Tools', true, NOW() - INTERVAL '95 days', NOW() - INTERVAL '24 days'),
    ('prod0000-0000-0000-0000-000000000089', '11111111-1111-1111-1111-111111111111', 'BIND-TOO-019', 'TOO-019', 'Escalera Tijera Aluminio 6 Pasos', 'Carga máxima 150kg', 1280.00, 18, 'pcs', 'Tools', true, NOW() - INTERVAL '90 days', NOW() - INTERVAL '28 days'),
    ('prod0000-0000-0000-0000-000000000090', '11111111-1111-1111-1111-111111111111', 'BIND-TOO-020', 'TOO-020', 'Carretilla Industrial 100L', 'Neumática, acero reforzado', 1680.00, 25, 'pcs', 'Tools', true, NOW() - INTERVAL '85 days', NOW() - INTERVAL '15 days')
ON CONFLICT (id) DO NOTHING;

-- Safety Equipment (15 products)
INSERT INTO public.products (id, company_id, bind_id, sku, name, description, price, stock, unit, category, is_active, created_at, updated_at)
VALUES
    ('prod0000-0000-0000-0000-000000000091', '11111111-1111-1111-1111-111111111111', 'BIND-SAF-001', 'SAF-001', 'Casco de Seguridad 3M Blanco', 'Tipo I, Clase E, ajustable', 285.00, 285, 'pcs', 'Safety', true, NOW() - INTERVAL '180 days', NOW() - INTERVAL '3 days'),
    ('prod0000-0000-0000-0000-000000000092', '11111111-1111-1111-1111-111111111111', 'BIND-SAF-002', 'SAF-002', 'Lentes de Seguridad Claros', 'Antiempañante, protección UV', 65.00, 850, 'pcs', 'Safety', true, NOW() - INTERVAL '175 days', NOW() - INTERVAL '2 days'),
    ('prod0000-0000-0000-0000-000000000093', '11111111-1111-1111-1111-111111111111', 'BIND-SAF-003', 'SAF-003', 'Guantes de Carnaza Reforzados', 'Para trabajo pesado', 85.00, 1250, 'pair', 'Safety', true, NOW() - INTERVAL '170 days', NOW() - INTERVAL '4 days'),
    ('prod0000-0000-0000-0000-000000000094', '11111111-1111-1111-1111-111111111111', 'BIND-SAF-004', 'SAF-004', 'Botas de Seguridad con Casquillo', 'Piel, puntera acero, dieléctricas', 950.00, 125, 'pair', 'Safety', true, NOW() - INTERVAL '165 days', NOW() - INTERVAL '12 days'),
    ('prod0000-0000-0000-0000-000000000095', '11111111-1111-1111-1111-111111111111', 'BIND-SAF-005', 'SAF-005', 'Arnés de Seguridad Tipo Paracaídas', 'Con línea de vida 1.8m', 1450.00, 42, 'pcs', 'Safety', true, NOW() - INTERVAL '160 days', NOW() - INTERVAL '18 days'),
    ('prod0000-0000-0000-0000-000000000096', '11111111-1111-1111-1111-111111111111', 'BIND-SAF-006', 'SAF-006', 'Respirador N95 Caja 20 pzas', 'Protección contra partículas', 285.00, 420, 'box', 'Safety', true, NOW() - INTERVAL '155 days', NOW() - INTERVAL '5 days'),
    ('prod0000-0000-0000-0000-000000000097', '11111111-1111-1111-1111-111111111111', 'BIND-SAF-007', 'SAF-007', 'Tapones Auditivos Desechables 100 pares', 'Reducción 32dB', 185.00, 285, 'box', 'Safety', true, NOW() - INTERVAL '150 days', NOW() - INTERVAL '8 days'),
    ('prod0000-0000-0000-0000-000000000098', '11111111-1111-1111-1111-111111111111', 'BIND-SAF-008', 'SAF-008', 'Chaleco Reflejante Alta Visibilidad', 'Naranja, talla única', 125.00, 385, 'pcs', 'Safety', true, NOW() - INTERVAL '145 days', NOW() - INTERVAL '6 days'),
    ('prod0000-0000-0000-0000-000000000099', '11111111-1111-1111-1111-111111111111', 'BIND-SAF-009', 'SAF-009', 'Extintor PQS 6kg ABC', 'Recargable, con soporte', 485.00, 68, 'pcs', 'Safety', true, NOW() - INTERVAL '140 days', NOW() - INTERVAL '22 days'),
    ('prod0000-0000-0000-0000-000000000100', '11111111-1111-1111-1111-111111111111', 'BIND-SAF-010', 'SAF-010', 'Botiquín Primeros Auxilios Tipo A', '25 personas, completo', 850.00, 45, 'pcs', 'Safety', true, NOW() - INTERVAL '135 days', NOW() - INTERVAL '15 days'),
    ('prod0000-0000-0000-0000-000000000101', '11111111-1111-1111-1111-111111111111', 'BIND-SAF-011', 'SAF-011', 'Conos de Seguridad 71cm Naranja', 'Base cuadrada 36x36cm', 185.00, 125, 'pcs', 'Safety', true, NOW() - INTERVAL '130 days', NOW() - INTERVAL '9 days'),
    ('prod0000-0000-0000-0000-000000000102', '11111111-1111-1111-1111-111111111111', 'BIND-SAF-012', 'SAF-012', 'Cinta Barricada Amarilla 300m', 'Precaución, no pasar', 95.00, 185, 'roll', 'Safety', true, NOW() - INTERVAL '125 days', NOW() - INTERVAL '11 days'),
    ('prod0000-0000-0000-0000-000000000103', '11111111-1111-1111-1111-111111111111', 'BIND-SAF-013', 'SAF-013', 'Señalamiento Salida de Emergencia', 'Fotoluminiscente, 30x15cm', 125.00, 285, 'pcs', 'Safety', true, NOW() - INTERVAL '120 days', NOW() - INTERVAL '14 days'),
    ('prod0000-0000-0000-0000-000000000104', '11111111-1111-1111-1111-111111111111', 'BIND-SAF-014', 'SAF-014', 'Candado de Seguridad Lockout', 'Para bloqueo de energía', 285.00, 95, 'pcs', 'Safety', true, NOW() - INTERVAL '115 days', NOW() - INTERVAL '19 days'),
    ('prod0000-0000-0000-0000-000000000105', '11111111-1111-1111-1111-111111111111', 'BIND-SAF-015', 'SAF-015', 'Detector de Humo Fotoeléctrico', 'Batería 9V incluida', 385.00, 78, 'pcs', 'Safety', true, NOW() - INTERVAL '110 days', NOW() - INTERVAL '7 days')
ON CONFLICT (id) DO NOTHING;

-- Cleaning Supplies (15 products)
INSERT INTO public.products (id, company_id, bind_id, sku, name, description, price, stock, unit, category, is_active, created_at, updated_at)
VALUES
    ('prod0000-0000-0000-0000-000000000106', '11111111-1111-1111-1111-111111111111', 'BIND-CLE-001', 'CLE-001', 'Desinfectante Multiusos 5L', 'Aroma lavanda, antibacterial', 185.00, 485, 'bottle', 'Cleaning', true, NOW() - INTERVAL '180 days', NOW() - INTERVAL '2 days'),
    ('prod0000-0000-0000-0000-000000000107', '11111111-1111-1111-1111-111111111111', 'BIND-CLE-002', 'CLE-002', 'Cloro Blanqueador 3.8L', 'Concentrado al 6%', 65.00, 950, 'bottle', 'Cleaning', true, NOW() - INTERVAL '175 days', NOW() - INTERVAL '3 days'),
    ('prod0000-0000-0000-0000-000000000108', '11111111-1111-1111-1111-111111111111', 'BIND-CLE-003', 'CLE-003', 'Limpiador de Vidrios 750ml Spray', 'Sin rayas, brillo instantáneo', 42.00, 650, 'bottle', 'Cleaning', true, NOW() - INTERVAL '170 days', NOW() - INTERVAL '5 days'),
    ('prod0000-0000-0000-0000-000000000109', '11111111-1111-1111-1111-111111111111', 'BIND-CLE-004', 'CLE-004', 'Jabón Líquido para Manos 5L', 'pH neutro, dermatológico', 285.00, 285, 'bottle', 'Cleaning', true, NOW() - INTERVAL '165 days', NOW() - INTERVAL '6 days'),
    ('prod0000-0000-0000-0000-000000000110', '11111111-1111-1111-1111-111111111111', 'BIND-CLE-005', 'CLE-005', 'Papel Higiénico Jumbo 300m 12 rollos', 'Doble hoja, blanco', 385.00, 420, 'pack', 'Cleaning', true, NOW() - INTERVAL '160 days', NOW() - INTERVAL '4 days'),
    ('prod0000-0000-0000-0000-000000000111', '11111111-1111-1111-1111-111111111111', 'BIND-CLE-006', 'CLE-006', 'Toalla de Papel Industrial 6 rollos', '220 hojas por rollo', 185.00, 580, 'pack', 'Cleaning', true, NOW() - INTERVAL '155 days', NOW() - INTERVAL '7 days'),
    ('prod0000-0000-0000-0000-000000000112', '11111111-1111-1111-1111-111111111111', 'BIND-CLE-007', 'CLE-007', 'Bolsas de Basura 90x120cm Negro 10pcs', 'Calibre 1.5, 100L', 125.00, 1250, 'pack', 'Cleaning', true, NOW() - INTERVAL '150 days', NOW() - INTERVAL '3 days'),
    ('prod0000-0000-0000-0000-000000000113', '11111111-1111-1111-1111-111111111111', 'BIND-CLE-008', 'CLE-008', 'Trapeador de Microfibra Profesional', 'Cabezal 40cm, con palo telescópico', 285.00, 125, 'pcs', 'Cleaning', true, NOW() - INTERVAL '145 days', NOW() - INTERVAL '16 days'),
    ('prod0000-0000-0000-0000-000000000114', '11111111-1111-1111-1111-111111111111', 'BIND-CLE-009', 'CLE-009', 'Escoba de Mijo Reforzada', 'Con palo madera 1.20m', 95.00, 185, 'pcs', 'Cleaning', true, NOW() - INTERVAL '140 days', NOW() - INTERVAL '12 days'),
    ('prod0000-0000-0000-0000-000000000115', '11111111-1111-1111-1111-111111111111', 'BIND-CLE-010', 'CLE-010', 'Cubeta Plástica 19L con Asa', 'Resistente, uso rudo', 125.00, 225, 'pcs', 'Cleaning', true, NOW() - INTERVAL '135 days', NOW() - INTERVAL '8 days'),
    ('prod0000-0000-0000-0000-000000000116', '11111111-1111-1111-1111-111111111111', 'BIND-CLE-011', 'CLE-011', 'Esponja Verde Industrial 10 pzas', 'Fibra abrasiva', 65.00, 850, 'pack', 'Cleaning', true, NOW() - INTERVAL '130 days', NOW() - INTERVAL '5 days'),
    ('prod0000-0000-0000-0000-000000000117', '11111111-1111-1111-1111-111111111111', 'BIND-CLE-012', 'CLE-012', 'Guantes de Látex Amarillo Talla M', 'Para limpieza, reusables', 42.00, 520, 'pair', 'Cleaning', true, NOW() - INTERVAL '125 days', NOW() - INTERVAL '9 days'),
    ('prod0000-0000-0000-0000-000000000118', '11111111-1111-1111-1111-111111111111', 'BIND-CLE-013', 'CLE-013', 'Jerga Blanca 40x60cm Paquete 12pcs', 'Algodón absorbente', 185.00, 385, 'pack', 'Cleaning', true, NOW() - INTERVAL '120 days', NOW() - INTERVAL '11 days'),
    ('prod0000-0000-0000-0000-000000000119', '11111111-1111-1111-1111-111111111111', 'BIND-CLE-014', 'CLE-014', 'Aromatizante Ambiental Spray 400ml', 'Aroma flores frescas', 85.00, 285, 'can', 'Cleaning', true, NOW() - INTERVAL '115 days', NOW() - INTERVAL '14 days'),
    ('prod0000-0000-0000-0000-000000000120', '11111111-1111-1111-1111-111111111111', 'BIND-CLE-015', 'CLE-015', 'Recogedor Plástico Industrial', 'Con borde de hule', 58.00, 165, 'pcs', 'Cleaning', true, NOW() - INTERVAL '110 days', NOW() - INTERVAL '6 days')
ON CONFLICT (id) DO NOTHING;

-- Kitchen & Pantry (10 products)
INSERT INTO public.products (id, company_id, bind_id, sku, name, description, price, stock, unit, category, is_active, created_at, updated_at)
VALUES
    ('prod0000-0000-0000-0000-000000000121', '11111111-1111-1111-1111-111111111111', 'BIND-KIT-001', 'KIT-001', 'Café Molido Premium 1kg', 'Tostado medio, 100% arábica', 285.00, 185, 'bag', 'Kitchen', true, NOW() - INTERVAL '180 days', NOW() - INTERVAL '8 days'),
    ('prod0000-0000-0000-0000-000000000122', '11111111-1111-1111-1111-111111111111', 'BIND-KIT-002', 'KIT-002', 'Azúcar Estándar 5kg', 'Refinada', 95.00, 285, 'bag', 'Kitchen', true, NOW() - INTERVAL '175 days', NOW() - INTERVAL '4 days'),
    ('prod0000-0000-0000-0000-000000000123', '11111111-1111-1111-1111-111111111111', 'BIND-KIT-003', 'KIT-003', 'Vasos Desechables 8oz Paquete 100', 'Poliestireno, blancos', 85.00, 850, 'pack', 'Kitchen', true, NOW() - INTERVAL '170 days', NOW() - INTERVAL '3 days'),
    ('prod0000-0000-0000-0000-000000000124', '11111111-1111-1111-1111-111111111111', 'BIND-KIT-004', 'KIT-004', 'Platos Desechables 9" Paquete 50', 'Biodegradables', 95.00, 625, 'pack', 'Kitchen', true, NOW() - INTERVAL '165 days', NOW() - INTERVAL '6 days'),
    ('prod0000-0000-0000-0000-000000000125', '11111111-1111-1111-1111-111111111111', 'BIND-KIT-005', 'KIT-005', 'Cucharas Desechables Paquete 100', 'Plástico resistente', 42.00, 1250, 'pack', 'Kitchen', true, NOW() - INTERVAL '160 days', NOW() - INTERVAL '5 days'),
    ('prod0000-0000-0000-0000-000000000126', '11111111-1111-1111-1111-111111111111', 'BIND-KIT-006', 'KIT-006', 'Servilletas de Papel Blancas 500pcs', 'Hoja sencilla, 30x30cm', 125.00, 485, 'pack', 'Kitchen', true, NOW() - INTERVAL '155 days', NOW() - INTERVAL '7 days'),
    ('prod0000-0000-0000-0000-000000000127', '11111111-1111-1111-1111-111111111111', 'BIND-KIT-007', 'KIT-007', 'Agua Embotellada 600ml Caja 24', 'Purificada', 125.00, 320, 'case', 'Kitchen', true, NOW() - INTERVAL '150 days', NOW() - INTERVAL '2 days'),
    ('prod0000-0000-0000-0000-000000000128', '11111111-1111-1111-1111-111111111111', 'BIND-KIT-008', 'KIT-008', 'Refresco Cola 600ml Caja 24', 'Sabor original', 285.00, 185, 'case', 'Kitchen', true, NOW() - INTERVAL '145 days', NOW() - INTERVAL '9 days'),
    ('prod0000-0000-0000-0000-000000000129', '11111111-1111-1111-1111-111111111111', 'BIND-KIT-009', 'KIT-009', 'Galletas Saladas Caja 24 paquetes', 'Integrales, 30g c/u', 185.00, 225, 'case', 'Kitchen', true, NOW() - INTERVAL '140 days', NOW() - INTERVAL '12 days'),
    ('prod0000-0000-0000-0000-000000000130', '11111111-1111-1111-1111-111111111111', 'BIND-KIT-010', 'KIT-010', 'Sal de Mesa 1kg', 'Yodada', 28.00, 425, 'bag', 'Kitchen', true, NOW() - INTERVAL '135 days', NOW() - INTERVAL '6 days')
ON CONFLICT (id) DO NOTHING;

-- Industrial Machinery (10 products)
INSERT INTO public.products (id, company_id, bind_id, sku, name, description, price, stock, unit, category, is_active, created_at, updated_at)
VALUES
    ('prod0000-0000-0000-0000-000000000131', '11111111-1111-1111-1111-111111111111', 'BIND-MAC-001', 'MAC-001', 'Montacargas Eléctrico 2.5 Ton', 'Batería 48V, altura máx 4m', 285000.00, 2, 'pcs', 'Machinery', true, NOW() - INTERVAL '180 days', NOW() - INTERVAL '45 days'),
    ('prod0000-0000-0000-0000-000000000132', '11111111-1111-1111-1111-111111111111', 'BIND-MAC-002', 'MAC-002', 'Generador Diésel 75kVA', 'Trifásico, con transferencia', 185000.00, 1, 'pcs', 'Machinery', true, NOW() - INTERVAL '175 days', NOW() - INTERVAL '60 days'),
    ('prod0000-0000-0000-0000-000000000133', '11111111-1111-1111-1111-111111111111', 'BIND-MAC-003', 'MAC-003', 'Bomba Centrífuga 5HP', 'Caudal 150 L/min', 12500.00, 8, 'pcs', 'Machinery', true, NOW() - INTERVAL '170 days', NOW() - INTERVAL '25 days'),
    ('prod0000-0000-0000-0000-000000000134', '11111111-1111-1111-1111-111111111111', 'BIND-MAC-004', 'MAC-004', 'Soldadora Inverter MIG 250A', 'Con carrete alambre', 18500.00, 5, 'pcs', 'Machinery', true, NOW() - INTERVAL '165 days', NOW() - INTERVAL '38 days'),
    ('prod0000-0000-0000-0000-000000000135', '11111111-1111-1111-1111-111111111111', 'BIND-MAC-005', 'MAC-005', 'Torno Industrial 1000mm', 'Con motor 3HP', 125000.00, 1, 'pcs', 'Machinery', true, NOW() - INTERVAL '160 days', NOW() - INTERVAL '90 days'),
    ('prod0000-0000-0000-0000-000000000136', '11111111-1111-1111-1111-111111111111', 'BIND-MAC-006', 'MAC-006', 'Compresor Industrial 10HP 300L', 'Trifásico, 175 PSI', 45000.00, 3, 'pcs', 'Machinery', true, NOW() - INTERVAL '155 days', NOW() - INTERVAL '52 days'),
    ('prod0000-0000-0000-0000-000000000137', '11111111-1111-1111-1111-111111111111', 'BIND-MAC-007', 'MAC-007', 'Sierra Cinta Industrial Vertical', 'Corte hasta 400mm', 68000.00, 2, 'pcs', 'Machinery', true, NOW() - INTERVAL '150 days', NOW() - INTERVAL '75 days'),
    ('prod0000-0000-0000-0000-000000000138', '11111111-1111-1111-1111-111111111111', 'BIND-MAC-008', 'MAC-008', 'Prensa Hidráulica 50 Ton', 'Con manómetro', 32000.00, 2, 'pcs', 'Machinery', true, NOW() - INTERVAL '145 days', NOW() - INTERVAL '48 days'),
    ('prod0000-0000-0000-0000-000000000139', '11111111-1111-1111-1111-111111111111', 'BIND-MAC-009', 'MAC-009', 'Polipasto Eléctrico 2 Ton', 'Con control remoto, 6m cadena', 15800.00, 4, 'pcs', 'Machinery', true, NOW() - INTERVAL '140 days', NOW() - INTERVAL '35 days'),
    ('prod0000-0000-0000-0000-000000000140', '11111111-1111-1111-1111-111111111111', 'BIND-MAC-010', 'MAC-010', 'Aspiradora Industrial 80L', 'Sólidos y líquidos, 3000W', 8500.00, 6, 'pcs', 'Machinery', true, NOW() - INTERVAL '135 days', NOW() - INTERVAL '28 days')
ON CONFLICT (id) DO NOTHING;

-- Automotive (10 products - low stock intentionally)
INSERT INTO public.products (id, company_id, bind_id, sku, name, description, price, stock, unit, category, is_active, created_at, updated_at)
VALUES
    ('prod0000-0000-0000-0000-000000000141', '11111111-1111-1111-1111-111111111111', 'BIND-AUT-001', 'AUT-001', 'Aceite Motor 15W-40 Mineral 19L', 'Para diésel y gasolina', 850.00, 18, 'bucket', 'Automotive', true, NOW() - INTERVAL '180 days', NOW() - INTERVAL '12 days'),
    ('prod0000-0000-0000-0000-000000000142', '11111111-1111-1111-1111-111111111111', 'BIND-AUT-002', 'AUT-002', 'Filtro de Aceite Universal', 'Rosca 3/4-16', 95.00, 125, 'pcs', 'Automotive', true, NOW() - INTERVAL '175 days', NOW() - INTERVAL '8 days'),
    ('prod0000-0000-0000-0000-000000000143', '11111111-1111-1111-1111-111111111111', 'BIND-AUT-003', 'AUT-003', 'Batería Automotriz 12V 70Ah', 'Libre mantenimiento', 1850.00, 8, 'pcs', 'Automotive', true, NOW() - INTERVAL '170 days', NOW() - INTERVAL '22 days'),
    ('prod0000-0000-0000-0000-000000000144', '11111111-1111-1111-1111-111111111111', 'BIND-AUT-004', 'AUT-004', 'Llanta 195/65R15 91H', 'Para auto compacto', 1450.00, 16, 'pcs', 'Automotive', true, NOW() - INTERVAL '165 days', NOW() - INTERVAL '35 days'),
    ('prod0000-0000-0000-0000-000000000145', '11111111-1111-1111-1111-111111111111', 'BIND-AUT-005', 'AUT-005', 'Balatas Freno Delantero Cerámicas', 'Para sedán mediano', 685.00, 22, 'set', 'Automotive', true, NOW() - INTERVAL '160 days', NOW() - INTERVAL '18 days'),
    ('prod0000-0000-0000-0000-000000000146', '11111111-1111-1111-1111-111111111111', 'BIND-AUT-006', 'AUT-006', 'Anticongelante/Refrigerante 4L', 'Concentrado, larga duración', 285.00, 42, 'bottle', 'Automotive', true, NOW() - INTERVAL '155 days', NOW() - INTERVAL '9 days'),
    ('prod0000-0000-0000-0000-000000000147', '11111111-1111-1111-1111-111111111111', 'BIND-AUT-007', 'AUT-007', 'Limpia Parabrisas Transparente 4L', 'Con repelente agua', 125.00, 85, 'bottle', 'Automotive', true, NOW() - INTERVAL '150 days', NOW() - INTERVAL '14 days'),
    ('prod0000-0000-0000-0000-000000000148', '11111111-1111-1111-1111-111111111111', 'BIND-AUT-008', 'AUT-008', 'Cables para Pasar Corriente 400A', '3m, calibre 2, pinzas cobre', 485.00, 18, 'set', 'Automotive', true, NOW() - INTERVAL '145 days', NOW() - INTERVAL '24 days'),
    ('prod0000-0000-0000-0000-000000000149', '11111111-1111-1111-1111-111111111111', 'BIND-AUT-009', 'AUT-009', 'Gato Hidráulico Tipo Botella 3 Ton', 'Altura mínima 19cm', 680.00, 12, 'pcs', 'Automotive', true, NOW() - INTERVAL '140 days', NOW() - INTERVAL '28 days'),
    ('prod0000-0000-0000-0000-000000000150', '11111111-1111-1111-1111-111111111111', 'BIND-AUT-010', 'AUT-010', 'Kit Herramientas Básicas Auto', '35 piezas con estuche', 850.00, 15, 'set', 'Automotive', true, NOW() - INTERVAL '135 days', NOW() - INTERVAL '16 days')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- Folio sequences initialization
-- =====================================================

INSERT INTO public.folio_sequences (company_id, entity_type, year, prefix, last_value)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'requisition', EXTRACT(YEAR FROM NOW())::INTEGER, 'REQ-', 45),
    ('11111111-1111-1111-1111-111111111111', 'requisition', EXTRACT(YEAR FROM NOW() - INTERVAL '1 year')::INTEGER, 'REQ-', 128)
ON CONFLICT (company_id, entity_type, year) DO NOTHING;

-- =====================================================
-- This is part 1 of the seed file.
-- To be continued in the next section with:
-- 6. Inventory Restock Rules (with suppliers)
-- 7. Requisitions (purchase orders)
-- 8. Requisition Items
-- 9. Audit Log (stock movements and user actions)
-- 10. Notifications (as support tickets)
-- 11. User favorites and carts
-- 12. Requisition templates
-- =====================================================

COMMIT;
