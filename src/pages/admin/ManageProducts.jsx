
import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminProducts, createProduct, updateProduct, deleteProduct } from '@/services/productService';
import { useProductCategories } from '@/hooks/useProducts';
import { uploadProductImage, deleteProductImage } from '@/services/imageService';
import { useForm } from 'react-hook-form';
import { PlusCircle, MoreHorizontal, Edit, ToggleLeft, ToggleRight, ShoppingBag, Trash2, Upload, X, Image as ImageIcon } from 'lucide-react';
import OptimizedImage from '@/components/OptimizedImage';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/useToast';
import PageLoader from '@/components/PageLoader';
import PageContainer from '@/components/layout/PageContainer';
import EmptyState from '@/components/EmptyState';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FormStatusFeedback from '@/components/ui/form-status-feedback';

const ProductFormModal = ({ product, isOpen, onClose, onSave }) => {
    const { toast } = useToast();
    const { data: categories = [] } = useProductCategories();
    const fileInputRef = useRef(null);
    const [formStatus, setFormStatus] = useState({ status: 'idle', message: '' });
    const [imagePreview, setImagePreview] = useState(product?.image_url || '');
    const [imageFile, setImageFile] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [oldImageUrl, setOldImageUrl] = useState(null);
    
    const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({ 
        mode: 'onBlur',
        defaultValues: product || { name: '', sku: '', price: 0, stock: 0, category: '', is_active: true } 
    });
    const isActive = watch('is_active');
    const selectedCategory = watch('category');

    useEffect(() => {
        if(product) {
            Object.keys(product).forEach(key => setValue(key, product[key]));
            setImagePreview(product.image_url || '');
            setOldImageUrl(product.image_url || null);
        } else {
            setImagePreview('');
            setOldImageUrl(null);
            setImageFile(null);
        }
        setFormStatus({ status: 'idle', message: '' });
    }, [product, setValue, isOpen]);

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar tipo
        if (!file.type.startsWith('image/')) {
            toast({ variant: 'destructive', title: 'Error', description: 'Por favor selecciona un archivo de imagen válido.' });
            return;
        }

        // Validar tamaño (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast({ variant: 'destructive', title: 'Error', description: 'El archivo es demasiado grande. El tamaño máximo es 5MB.' });
            return;
        }

        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview('');
        setOldImageUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const onSubmit = async (data) => {
        setFormStatus({ status: 'loading', message: product ? 'Guardando cambios...' : 'Creando producto...' });
        try {
            let imageUrl = oldImageUrl || data.image_url || '';

            // Subir nueva imagen si hay una seleccionada
            if (imageFile) {
                setUploadingImage(true);
                try {
                    imageUrl = await uploadProductImage(imageFile, product?.id);
                    // Eliminar imagen anterior si existe y es diferente
                    if (oldImageUrl && oldImageUrl !== imageUrl) {
                        await deleteProductImage(oldImageUrl);
                    }
                } catch (imageError) {
                    setFormStatus({ status: 'error', message: imageError.message || 'Error al subir la imagen' });
                    setUploadingImage(false);
                    return;
                }
                setUploadingImage(false);
            }

            // Crear o actualizar producto con la URL de la imagen
            await onSave({ ...data, image_url: imageUrl });
            setFormStatus({ status: 'success', message: product ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente' });
            setTimeout(() => {
                onClose();
                setFormStatus({ status: 'idle', message: '' });
                setImagePreview('');
                setImageFile(null);
                setOldImageUrl(null);
            }, 1500);
        } catch (error) {
            setFormStatus({ status: 'error', message: error.message || 'Error al guardar el producto' });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl border border-border bg-card shadow-soft-xl p-0">
                <form onSubmit={handleSubmit(onSubmit)} className="flex max-h-[calc(100dvh-3.5rem)] flex-col">
                    <DialogHeader className="px-6 pt-6">
                        <DialogTitle className="text-2xl font-bold">
                            {product ? 'Editar Producto' : 'Crear Producto'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 space-y-5 overflow-y-auto px-6 py-4">
                        <FormStatusFeedback status={formStatus.status} message={formStatus.message} />
                    <div>
                        <Label htmlFor="name">Nombre</Label>
                        <Input 
                            id="name" 
                            {...register('name', { required: 'El nombre es requerido' })} 
                            className={errors.name && 'border-error focus-visible:ring-error'}
                        />
                        {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message}</p>}
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="sku">SKU</Label>
                            <Input 
                                id="sku" 
                                {...register('sku', { required: 'El SKU es requerido' })} 
                                className={errors.sku && 'border-error focus-visible:ring-error'}
                            />
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
                                className={errors.price && 'border-error focus-visible:ring-error'}
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
                                className={errors.stock && 'border-error focus-visible:ring-error'}
                            />
                            {errors.stock && <p className="text-destructive text-sm mt-1">{errors.stock.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="category">Categoría</Label>
                            <Select value={selectedCategory || 'none'} onValueChange={(value) => setValue('category', value === 'none' ? '' : value)}>
                                <SelectTrigger className={errors.category && 'border-error focus-visible:ring-error'}>
                                    <SelectValue placeholder="Seleccionar categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Sin categoría</SelectItem>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat} value={cat}>
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.category && <p className="text-destructive text-sm mt-1">{errors.category.message}</p>}
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="image">Imagen del Producto</Label>
                        <div className="mt-2 space-y-3">
                            {imagePreview && (
                                <div className="relative inline-block">
                                    <img 
                                        src={imagePreview} 
                                        alt="Preview" 
                                        className="h-32 w-32 object-contain rounded-lg border-2 border-border bg-muted/70 p-2"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                        onClick={handleRemoveImage}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                            {!imagePreview && (
                                <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-border/80 rounded-lg bg-muted/70">
                                    <ImageIcon className="h-8 w-8 text-muted-foreground/70" />
                                </div>
                            )}
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingImage}
                                    className="flex items-center gap-2"
                                >
                                    <Upload className="h-4 w-4" />
                                    {imagePreview ? 'Cambiar Imagen' : 'Subir Imagen'}
                                </Button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground/80">Formatos permitidos: JPEG, PNG, WebP, GIF. Tamaño máximo: 5MB</p>
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
                    </div>
                    <DialogFooter className="surface-sticky sticky bottom-0 flex flex-col gap-2 rounded-b-2xl px-6 py-4">
                        <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
                            <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting || uploadingImage} className="rounded-xl">Cancelar</Button>
                            <Button type="submit" isLoading={isSubmitting || uploadingImage} isSuccess={formStatus.status === 'success'} className="rounded-xl shadow-button hover:shadow-button-hover">
                                {uploadingImage ? 'Subiendo imagen...' : product ? 'Actualizar' : 'Crear'}
                            </Button>
                        </div>
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

    const createMutation = useMutation({ 
        mutationFn: createProduct, 
        ...mutationOptions, 
        onSuccess: () => { 
            toast({ title: 'Producto creado', description: 'El producto se ha creado exitosamente' }); 
            mutationOptions.onSuccess(); 
        } 
    });
    const updateMutation = useMutation({ 
        mutationFn: updateProduct, 
        ...mutationOptions, 
        onSuccess: () => { 
            toast({ title: 'Producto actualizado', description: 'El producto se ha actualizado exitosamente' }); 
            mutationOptions.onSuccess(); 
        } 
    });
    const deleteMutation = useMutation({ 
        mutationFn: deleteProduct, 
        ...mutationOptions, 
        onSuccess: () => { 
            toast({ title: 'Producto eliminado', description: 'El producto se ha eliminado exitosamente' }); 
            mutationOptions.onSuccess(); 
        } 
    });

    const handleSave = async (data) => {
        if (data.id) {
            await updateMutation.mutateAsync(data);
        } else {
            await createMutation.mutateAsync(data);
        }
    };
    
    const handleToggleActive = (product) => {
        updateMutation.mutate({ ...product, is_active: !product.is_active });
    };
    
    const handleDelete = async (product) => {
        if (!confirm(`¿Estás seguro de que deseas eliminar el producto "${product.name}"? Esta acción no se puede deshacer.`)) {
            return;
        }
        deleteMutation.mutate(product.id);
    };

    if (isLoading) return <PageLoader />;

    return (
        <>
            <Helmet><title>Gestionar Productos - ComerECO</title></Helmet>
            <PageContainer>
                <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
                    {/* Header */}
                    <header className="flex flex-col items-start gap-5 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:pb-6">
                        <div className="flex items-center gap-4 sm:gap-5">
                            <div className="icon-badge flex h-14 w-14 items-center justify-center">
                                <ShoppingBag className="h-7 w-7 text-primary-600 dark:text-primary-100" aria-hidden="true" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-foreground mb-1 sm:text-4xl">
                                    Gestionar <span className="bg-gradient-primary bg-clip-text text-transparent">Productos</span>
                                </h1>
                                <p className="text-sm text-muted-foreground sm:text-base">Crea, edita y gestiona el catálogo de tu compañía</p>
                            </div>
                        </div>
                        <Button
                            size="lg"
                            onClick={() => setFormModal({ isOpen: true, product: null })}
                            className="w-full whitespace-nowrap shadow-button hover:shadow-button-hover sm:w-auto"
                        >
                            <PlusCircle className="mr-2 h-5 w-5" />
                            Crear Producto
                        </Button>
                    </header>

                    {products?.length > 0 ? (
                        <div className="overflow-hidden rounded-2xl border-2 border-border bg-card shadow-soft-md">
                            <div className="w-full overflow-x-auto">
                            <Table className="min-w-[720px] md:min-w-full">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16 whitespace-nowrap">Imagen</TableHead>
                                    <TableHead className="whitespace-nowrap">SKU</TableHead>
                                    <TableHead className="whitespace-nowrap">Nombre</TableHead>
                                    <TableHead>Categoría</TableHead>
                                    <TableHead className="whitespace-nowrap">Precio</TableHead>
                                    <TableHead className="whitespace-nowrap">Stock</TableHead>
                                    <TableHead className="whitespace-nowrap">Estado</TableHead>
                                    <TableHead><span className="sr-only">Acciones</span></TableHead>
                                </TableRow>
                            </TableHeader>
                                <TableBody>
                                    {products.map(p => (
                                        <TableRow key={p.id} className="hover:bg-muted/70 transition-colors">
                                            <TableCell>
                                                <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex items-center justify-center">
                                                    {p.image_url ? (
                                                        <OptimizedImage
                                                            src={p.image_url}
                                                            alt={p.name}
                                                            fallback="/placeholder.svg"
                                                            className="w-full h-full object-contain p-1"
                                                        />
                                                    ) : (
                                                        <ImageIcon className="h-6 w-6 text-muted-foreground/70" />
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono font-semibold text-foreground">{p.sku}</TableCell>
                                            <TableCell className="font-semibold text-foreground">{p.name}</TableCell>
                                            <TableCell>
                                                {p.category ? (
                                                    <Badge variant="outline" className="text-xs">
                                                        {p.category}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground/70">Sin categoría</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-bold text-foreground">${p.price.toFixed(2)}</TableCell>
                                            <TableCell className="font-medium text-foreground/90">{p.stock}</TableCell>
                                            <TableCell>
                                                <Badge variant={p.is_active ? 'success' : 'destructive'} className="shadow-sm">
                                                    {p.is_active ? 'Activo' : 'Inactivo'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-9 w-9 p-0 hover:bg-muted rounded-xl">
                                                            <MoreHorizontal className="h-5 w-5" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="rounded-xl">
                                                        <DropdownMenuItem onClick={() => setFormModal({ isOpen: true, product: p })}>
                                                            <Edit className="mr-2 h-4 w-4" /> Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleToggleActive(p)}>
                                                            {p.is_active ? <ToggleLeft className="mr-2 h-4 w-4" /> : <ToggleRight className="mr-2 h-4 w-4" />}
                                                            {p.is_active ? 'Desactivar' : 'Activar'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDelete(p)} className="text-destructive focus:text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            </div>
                        </div>
                    ) : (
                        <EmptyState
                            icon={ShoppingBag}
                            title="No hay productos"
                            description="Crea tu primer producto para empezar a construir tu catálogo."
                            actionButton={
                                <Button size="lg" onClick={() => setFormModal({ isOpen: true, product: null })}>
                                    <PlusCircle className="mr-2 h-5 w-5" />
                                    Crear Producto
                                </Button>
                            }
                        />
                    )}
                </div>

            {formModal.isOpen && <ProductFormModal isOpen={formModal.isOpen} onClose={() => setFormModal({ isOpen: false, product: null })} product={formModal.product} onSave={handleSave} />}
        </PageContainer>
        </>
    );
};

export default ManageProductsPage;
