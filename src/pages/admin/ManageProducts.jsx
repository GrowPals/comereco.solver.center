
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminProducts, createProduct, updateProduct } from '@/services/productService';
import { useForm } from 'react-hook-form';
import { PlusCircle, MoreHorizontal, Edit, ToggleLeft, ToggleRight, ShoppingBag } from 'lucide-react'; // Added ShoppingBag
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/useToast';
import PageLoader from '@/components/PageLoader';
import EmptyState from '@/components/EmptyState';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

const ProductFormModal = ({ product, isOpen, onClose, onSave }) => {
    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({ 
        mode: 'onBlur',
        defaultValues: product || { name: '', sku: '', price: 0, stock: 0, is_active: true } 
    });
    const isActive = watch('is_active');

    React.useEffect(() => {
        if(product) {
            Object.keys(product).forEach(key => setValue(key, product[key]));
        }
    }, [product, setValue]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader><DialogTitle>{product ? 'Editar Producto' : 'Crear Producto'}</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit(onSave)} className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="name">Nombre</Label>
                        <Input id="name" {...register('name', { required: 'El nombre es requerido' })} />
                        {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message}</p>}
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="sku">SKU</Label>
                            <Input id="sku" {...register('sku', { required: 'El SKU es requerido' })} />
                             {errors.sku && <p className="text-destructive text-sm mt-1">{errors.sku.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="price">Precio</Label>
                            <Input 
                                id="price" 
                                type="number" 
                                step="0.01" 
                                {...register('price', { 
                                    required: 'El precio es requerido', 
                                    valueAsNumber: true, 
                                    min: { value: 0, message: 'El precio debe ser mayor o igual a 0' }
                                })} 
                            />
                            {errors.price && <p className="text-destructive text-sm mt-1">{errors.price.message}</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="stock">Stock</Label>
                            <Input 
                                id="stock" 
                                type="number" 
                                {...register('stock', { 
                                    required: 'El stock es requerido', 
                                    valueAsNumber: true, 
                                    min: { value: 0, message: 'El stock debe ser mayor o igual a 0' }
                                })} 
                            />
                            {errors.stock && <p className="text-destructive text-sm mt-1">{errors.stock.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="category">Categoría</Label>
                            <Input id="category" {...register('category')} />
                        </div>
                    </div>
                     <div>
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea id="description" {...register('description')} />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch id="is_active" checked={isActive} onCheckedChange={(checked) => setValue('is_active', checked)} />
                        <Label htmlFor="is_active">{isActive ? 'Activo' : 'Inactivo'}</Label>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" type="button" onClick={onClose}>Cancelar</Button>
                        <Button type="submit">Guardar</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

const ManageProductsPage = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [formModal, setFormModal] = useState({ isOpen: false, product: null });
    const { data: products, isLoading } = useQuery({ queryKey: ['adminProducts'], queryFn: getAdminProducts });

    const mutationOptions = {
        onSuccess: () => {
            queryClient.invalidateQueries(['adminProducts']);
            setFormModal({ isOpen: false, product: null });
        },
        onError: (error) => toast({ variant: 'destructive', title: 'Error', description: error.message }),
    };

    const createMutation = useMutation({ mutationFn: createProduct, ...mutationOptions, onSuccess: () => { toast({ title: 'Producto creado' }); mutationOptions.onSuccess(); } });
    const updateMutation = useMutation({ mutationFn: updateProduct, ...mutationOptions, onSuccess: () => { toast({ title: 'Producto actualizado' }); mutationOptions.onSuccess(); } });

    const handleSave = (data) => {
        if (data.id) {
            updateMutation.mutate(data);
        } else {
            createMutation.mutate(data);
        }
    };
    
    const handleToggleActive = (product) => {
        updateMutation.mutate({ ...product, is_active: !product.is_active });
    };

    if (isLoading) return <PageLoader />;

    return (
        <>
            <Helmet><title>Gestionar Productos - ComerECO</title></Helmet>
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Gestionar Productos</h1>
                        <p className="text-muted-foreground">Crea, edita y gestiona el catálogo de tu compañía.</p>
                    </div>
                    <Button onClick={() => setFormModal({ isOpen: true, product: null })}><PlusCircle className="mr-2 h-4 w-4" /> Crear Producto</Button>
                </div>

                {products?.length > 0 ? (
                    <div className="bg-card border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Precio</TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead><span className="sr-only">Acciones</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map(p => (
                                    <TableRow key={p.id}>
                                        <TableCell className="font-medium">{p.sku}</TableCell>
                                        <TableCell>{p.name}</TableCell>
                                        <TableCell>${p.price.toFixed(2)}</TableCell>
                                        <TableCell>{p.stock}</TableCell>
                                        <TableCell><Badge variant={p.is_active ? 'success' : 'secondary'}>{p.is_active ? 'Activo' : 'Inactivo'}</Badge></TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => setFormModal({ isOpen: true, product: p })}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleToggleActive(p)}>
                                                        {p.is_active ? <ToggleLeft className="mr-2 h-4 w-4" /> : <ToggleRight className="mr-2 h-4 w-4" />}
                                                        {p.is_active ? 'Desactivar' : 'Activar'}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <EmptyState icon={ShoppingBag} title="No hay productos" description="Crea tu primer producto para empezar a construir tu catálogo." actionButton={<Button onClick={() => setFormModal({ isOpen: true, product: null })}>Crear Producto</Button>} />
                )}
            </div>

            {formModal.isOpen && <ProductFormModal isOpen={formModal.isOpen} onClose={() => setFormModal({ isOpen: false, product: null })} product={formModal.product} onSave={handleSave} />}
        </>
    );
};

export default ManageProductsPage;
