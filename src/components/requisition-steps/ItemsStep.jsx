import React, { useState, useMemo, useEffect } from 'react';
import { useCart } from '@/hooks/useCart';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus, Trash2, ShoppingCart, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import EmptyState from '@/components/EmptyState';
import { todosLosProductos } from '@/data/mockdata';
import { motion, AnimatePresence } from 'framer-motion';

const ProductCard = ({ product, onAdd }) => (
    <Card className="overflow-hidden">
        <CardContent className="p-4 flex flex-col h-full">
            <img className="w-full h-32 object-cover rounded-md mb-4" alt={product.nombre} src="https://images.unsplash.com/photo-1648476029943-301781dd76d4" />
            <div className="flex-grow">
                <p className="font-semibold text-sm">{product.nombre}</p>
                <p className="text-xs text-neutral-70">{product.sku}</p>
                 <p className="text-xs text-neutral-70">Stock: {product.stock}</p>
            </div>
            <div className="mt-4 flex justify-between items-center">
                <p className="font-bold">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(product.precio)}</p>
                <Button size="sm" variant="secondary" onClick={() => onAdd(product)}>
                    <Plus className="h-4 w-4 mr-1" /> Agregar
                </Button>
            </div>
        </CardContent>
    </Card>
);

const CartItem = ({ item, onUpdate, onRemove }) => (
     <motion.div 
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-10/50"
    >
        <div className="flex items-center gap-4 flex-1 min-w-0">
            <img alt={item.nombre} className="w-16 h-16 object-cover rounded-md flex-shrink-0" src="https://images.unsplash.com/photo-1526575860131-8f0bca043cfe" />
            <div className="min-w-0">
                <p className="font-semibold truncate">{item.nombre}</p>
                <p className="text-sm text-neutral-70">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(item.precio)}</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onUpdate(item.id, item.quantity - 1)}>
                <Minus className="h-4 w-4" />
            </Button>
            <span className="font-bold w-8 text-center">{item.quantity}</span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onUpdate(item.id, item.quantity + 1)}>
                <Plus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onRemove(item.id)}>
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    </motion.div>
);


const ItemsStep = () => {
    const { cart, addToCart, updateQuantity, removeFromCart, clearCart } = useCart();
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    
    useEffect(() => {
        const timeout = setTimeout(() => {
            setSearchTerm(searchInput);
        }, 300);
        return () => clearTimeout(timeout);
    }, [searchInput]);

    const filteredProducts = useMemo(() => {
        if (!searchTerm) return todosLosProductos.slice(0, 6); // Show some initial products
        return todosLosProductos.filter(p =>
            p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 12);
    }, [searchTerm]);

    const total = cart.items.reduce((sum, item) => sum + item.precio * item.quantity, 0);

    return (
        <div className="grid lg:grid-cols-2 gap-8">
            {/* Left side: Catalog Search */}
            <div className="space-y-4">
                <h3 className="font-bold text-xl">Buscar Productos</h3>
                <Input
                    placeholder="Buscar por nombre o SKU..."
                    icon={<Search />}
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                />
                <div className="grid sm:grid-cols-2 gap-4">
                    {filteredProducts.map(product => (
                        <ProductCard key={product.id} product={product} onAdd={addToCart} />
                    ))}
                </div>
            </div>

            {/* Right side: Shopping Cart */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-xl">Tu Carrito ({cart.items.length} items)</h3>
                    {cart.items.length > 0 && <Button variant="outline" size="sm" onClick={clearCart}><Trash2 className="h-4 w-4 mr-1"/> Vaciar</Button>}
                </div>

                {cart.items.length === 0 ? (
                    <Card className="flex items-center justify-center p-12 text-center">
                         <EmptyState
                            icon={<ShoppingCart className="mx-auto h-12 w-12 text-neutral-300 mb-4" />}
                            title="Carrito vacío"
                            description="Busca productos y agrégalos a tu requisición."
                        />
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="p-4 space-y-2">
                           <AnimatePresence>
                                {cart.items.map(item => (
                                    <CartItem key={item.id} item={item} onUpdate={updateQuantity} onRemove={removeFromCart} />
                                ))}
                            </AnimatePresence>
                        </CardContent>
                    </Card>
                )}

                 {cart.items.length > 0 && (
                    <Card className="sticky bottom-20 bg-card/80 backdrop-blur-sm shadow-lg">
                        <CardContent className="p-4">
                            <div className="flex justify-between items-center text-sm text-neutral-70">
                                <p>Subtotal</p>
                                <p>{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(total)}</p>
                            </div>
                            <div className="flex justify-between items-center text-sm text-neutral-70">
                                <p>IVA (16%)</p>
                                <p>{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(total * 0.16)}</p>
                            </div>
                            <div className="border-t my-2"></div>
                            <div className="flex justify-between items-center font-bold text-lg">
                                <p>Total</p>
                                <p className="text-secondary">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(total * 1.16)}</p>
                            </div>
                        </CardContent>
                    </Card>
                 )}
            </div>
        </div>
    );
};

export default ItemsStep;