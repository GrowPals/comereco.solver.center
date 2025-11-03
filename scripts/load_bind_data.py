#!/usr/bin/env python3
"""
Script para cargar datos de Bind ERP a Supabase para testing
Extrae productos, clientes, órdenes y price lists del JSON
"""

import json
import sys
from datetime import datetime
from supabase import create_client, Client
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración Supabase
SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_KEY = os.getenv('VITE_SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: Variables de entorno de Supabase no configuradas")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ID de GrowPals (hardcoded por ahora)
GROWPALS_ID = "cac090e5-0457-4093-a4fd-bd9a060b48f1"

def load_json_file(file_path):
    """Carga el archivo JSON"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def find_data_sections(data):
    """Identifica las diferentes secciones de datos en el JSON"""
    sections = {
        'clients': [],
        'products': [],
        'orders': [],
        'price_lists': []
    }
    
    for i, item in enumerate(data):
        if 'value' in item and isinstance(item['value'], list) and len(item['value']) > 0:
            sample = item['value'][0]
            keys = list(sample.keys())
            
            if 'ClientName' in keys and 'RFC' in keys:
                sections['clients'].append(item['value'])
            elif 'Title' in keys and 'Price' in keys and 'Code' in keys:
                sections['products'].append(item['value'])
            elif 'OrderDate' in keys and 'Status' in keys:
                sections['orders'].append(item['value'])
            elif 'PriceListID' in keys or 'PriceListName' in keys:
                sections['price_lists'].append(item['value'])
    
    # Flatten lists
    for key in sections:
        sections[key] = [item for sublist in sections[key] for item in sublist]
    
    return sections

def load_clients(clients_data):
    """Carga clientes - prioriza los que contengan 'Soluciones'"""
    print("\n📋 Cargando clientes...")
    
    # Filtrar clientes con "Soluciones" en el nombre
    soluciones_clients = [c for c in clients_data if 'soluciones' in c.get('ClientName', '').lower()]
    other_clients = [c for c in clients_data if 'soluciones' not in c.get('ClientName', '').lower()]
    
    # Priorizar Soluciones, luego otros (máximo 20 total)
    clients_to_load = soluciones_clients[:15] + other_clients[:5]
    
    print(f"  Total clientes encontrados: {len(clients_data)}")
    print(f"  Clientes con 'Soluciones': {len(soluciones_clients)}")
    print(f"  Clientes a cargar: {len(clients_to_load)}")
    
    # Crear mappings en bind_mappings
    mappings = []
    for client in clients_to_load:
        mappings.append({
            'company_id': GROWPALS_ID,
            'mapping_type': 'client',
            'bind_id': client['ID'],
            'bind_data': client,
            'is_active': True
        })
    
    if mappings:
        try:
            result = supabase.table('bind_mappings').upsert(mappings, on_conflict='bind_id').execute()
            print(f"  ✅ {len(mappings)} clientes mapeados en bind_mappings")
        except Exception as e:
            print(f"  ⚠️ Error cargando clientes: {e}")
    
    return len(clients_to_load)

def load_products(products_data):
    """Carga productos - prioriza los que tengan imágenes"""
    print("\n📦 Cargando productos...")
    
    # Filtrar productos con imágenes
    products_with_images = [p for p in products_data if p.get('ImageURL') or p.get('ImageUrl')]
    products_without_images = [p for p in products_data if not (p.get('ImageURL') or p.get('ImageUrl'))]
    
    # Priorizar productos con imágenes (máximo 50 productos)
    products_to_load = products_with_images[:40] + products_without_images[:10]
    
    print(f"  Total productos encontrados: {len(products_data)}")
    print(f"  Productos con imágenes: {len(products_with_images)}")
    print(f"  Productos a cargar: {len(products_to_load)}")
    
    # Preparar datos para insertar
    products_insert = []
    for product in products_to_load:
        try:
            # Obtener categoría si existe
            category = None
            if product.get('Cat1ID'):
                # Intentar obtener nombre de categoría si está disponible
                category = product.get('Cat1Name', 'Sin categoría')
            
            product_data = {
                'company_id': GROWPALS_ID,
                'bind_id': product['ID'],
                'sku': product.get('Code', '') or f"BIND-{product.get('Number', 'N/A')}",
                'name': product.get('Title', 'Sin nombre')[:200],
                'description': product.get('Descripcion', '')[:500] if product.get('Descripcion') else None,
                'price': float(product.get('Price', 0)),
                'stock': int(product.get('Inventory', 0)),
                'unit': product.get('Unit', 'Pieza') if product.get('Unit') else 'Pieza',
                'category': category[:100] if category else None,
                'image_url': product.get('ImageURL') or product.get('ImageUrl'),
                'is_active': True,
                'bind_sync_enabled': True,
                'bind_last_synced_at': datetime.now().isoformat()
            }
            products_insert.append(product_data)
        except Exception as e:
            print(f"  ⚠️ Error procesando producto {product.get('Title', 'N/A')}: {e}")
            continue
    
    if products_insert:
        try:
            # Insertar productos
            result = supabase.table('products').upsert(products_insert, on_conflict='bind_id').execute()
            print(f"  ✅ {len(products_insert)} productos cargados")
            
            # Crear mappings
            mappings = []
            for product in products_to_load:
                mappings.append({
                    'company_id': GROWPALS_ID,
                    'mapping_type': 'product',
                    'bind_id': product['ID'],
                    'bind_data': product,
                    'is_active': True
                })
            
            supabase.table('bind_mappings').upsert(mappings, on_conflict='bind_id').execute()
            print(f"  ✅ {len(mappings)} productos mapeados")
        except Exception as e:
            print(f"  ❌ Error cargando productos: {e}")
            print(f"  Detalles: {str(e)[:500]}")
    
    return len(products_insert)

def load_orders(orders_data):
    """Carga órdenes - 10 de cada tipo de status"""
    print("\n📝 Cargando órdenes...")
    
    # Agrupar por status
    orders_by_status = {}
    for order in orders_data:
        status = order.get('Status', 0)
        if status not in orders_by_status:
            orders_by_status[status] = []
        orders_by_status[status].append(order)
    
    print(f"  Total órdenes encontradas: {len(orders_data)}")
    print(f"  Estados encontrados: {list(orders_by_status.keys())}")
    
    # Seleccionar 10 de cada tipo
    orders_to_load = []
    for status, orders in orders_by_status.items():
        orders_to_load.extend(orders[:10])
    
    print(f"  Órdenes a cargar: {len(orders_to_load)}")
    
    # Mapear status de Bind a nuestro sistema
    status_mapping = {
        0: 'draft',  # Pendiente
        1: 'approved',  # Aprobada
        2: 'cancelled'  # Cancelada
    }
    
    # Obtener usuarios para asignar
    try:
        users_result = supabase.table('profiles').select('id').eq('company_id', GROWPALS_ID).execute()
        user_ids = [u['id'] for u in users_result.data] if users_result.data else []
        admin_user = user_ids[0] if user_ids else None
    except:
        admin_user = None
    
    orders_insert = []
    for order in orders_to_load:
        try:
            bind_status = order.get('Status', 0)
            business_status = status_mapping.get(bind_status, 'draft')
            
            # Formatear fecha
            order_date = order.get('OrderDate')
            if order_date:
                try:
                    if isinstance(order_date, str):
                        order_date = datetime.fromisoformat(order_date.replace('Z', '+00:00'))
                except:
                    order_date = datetime.now()
            else:
                order_date = datetime.now()
            
            order_data = {
                'company_id': GROWPALS_ID,
                'internal_folio': f"REQ-{order.get('Number', 'N/A')}",
                'total_amount': float(order.get('Total', 0)),
                'comments': order.get('Comments', '')[:500] if order.get('Comments') else None,
                'bind_order_id': order['ID'],
                'bind_status': str(bind_status),
                'bind_folio': str(order.get('Number', '')),
                'business_status': business_status,
                'integration_status': 'synced' if bind_status == 1 else 'draft',
                'created_by': admin_user,
                'created_at': order_date.isoformat(),
                'bind_synced_at': order_date.isoformat() if bind_status == 1 else None,
                'items': json.dumps([])  # Items vacíos por ahora
            }
            orders_insert.append(order_data)
        except Exception as e:
            print(f"  ⚠️ Error procesando orden {order.get('Number', 'N/A')}: {e}")
            continue
    
    if orders_insert:
        try:
            result = supabase.table('requisitions').upsert(orders_insert, on_conflict='bind_order_id').execute()
            print(f"  ✅ {len(orders_insert)} órdenes cargadas")
        except Exception as e:
            print(f"  ❌ Error cargando órdenes: {e}")
            print(f"  Detalles: {str(e)[:500]}")
    
    return len(orders_insert)

def main():
    """Función principal"""
    print("🚀 Iniciando carga de datos de Bind ERP a Supabase\n")
    
    file_path = 'integrations/n8n/api-docs/schemas/file.json'
    
    try:
        # Cargar JSON
        print("📂 Leyendo archivo JSON...")
        data = load_json_file(file_path)
        print(f"✅ Archivo cargado: {len(data)} elementos\n")
        
        # Identificar secciones
        print("🔍 Identificando secciones de datos...")
        sections = find_data_sections(data)
        
        print(f"  Clientes: {len(sections['clients'])}")
        print(f"  Productos: {len(sections['products'])}")
        print(f"  Órdenes: {len(sections['orders'])}")
        print(f"  Price Lists: {len(sections['price_lists'])}")
        
        # Cargar datos
        clients_loaded = load_clients(sections['clients'])
        products_loaded = load_products(sections['products'])
        orders_loaded = load_orders(sections['orders'])
        
        # Resumen
        print("\n" + "="*50)
        print("📊 RESUMEN DE CARGA")
        print("="*50)
        print(f"✅ Clientes cargados: {clients_loaded}")
        print(f"✅ Productos cargados: {products_loaded}")
        print(f"✅ Órdenes cargadas: {orders_loaded}")
        print("="*50)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()

