
import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday, isThisWeek, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markNotificationsAsRead, markNotificationsAsUnread, deleteNotifications } from '@/services/notificationService';

import { Bell, Search, X, CheckCheck, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/useToast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import PageLoader from '@/components/PageLoader';

const notificationIcons = {
    success: { icon: CheckCheck, color: 'bg-green-100 text-green-800' },
    warning: { icon: Bell, color: 'bg-yellow-100 text-yellow-800' },
    danger: { icon: X, color: 'bg-red-100 text-red-700' },
    info: { icon: Bell, color: 'bg-blue-100 text-blue-700' },
    default: { icon: Bell, color: 'bg-gray-100 text-gray-800' },
};

const groupNotificationsByDate = (notifications) => {
    return notifications.reduce((acc, notification) => {
        const date = new Date(notification.created_at);
        let group;
        if (isToday(date)) group = 'Hoy';
        else if (isYesterday(date)) group = 'Ayer';
        else if (isThisWeek(date, { weekStartsOn: 1 })) group = 'Esta semana';
        else group = format(startOfDay(date), 'MMMM yyyy', { locale: es });
        
        if (!acc[group]) acc[group] = [];
        acc[group].push(notification);
        return acc;
    }, {});
};

const NotificationsPage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [filters, setFilters] = useState({ query: '', type: 'all' });
    const [activeTab, setActiveTab] = useState('all');
    const [selectedIds, setSelectedIds] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogAction, setDialogAction] = useState(null);

    const { data: allNotifications = [], isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: getNotifications,
    });

    const mutationOptions = {
        onSuccess: () => queryClient.invalidateQueries(['notifications']),
        onError: (error) => toast({ variant: 'destructive', title: 'Error', description: error.message }),
    };

    const readMutation = useMutation({ mutationFn: markNotificationsAsRead, ...mutationOptions });
    const unreadMutation = useMutation({ mutationFn: markNotificationsAsUnread, ...mutationOptions });
    const deleteMutation = useMutation({ mutationFn: deleteNotifications, ...mutationOptions });

    const filteredNotifications = useMemo(() => {
        let items = [...allNotifications];
        if (activeTab === 'unread') items = items.filter(n => !n.is_read);
        if (filters.query) items = items.filter(n => n.title.toLowerCase().includes(filters.query.toLowerCase()) || n.message.toLowerCase().includes(filters.query.toLowerCase()));
        if (filters.type !== 'all') items = items.filter(n => n.type === filters.type);
        return items;
    }, [allNotifications, filters, activeTab]);

    const unreadCount = useMemo(() => allNotifications.filter(n => !n.is_read).length, [allNotifications]);
    const groupedNotifications = useMemo(() => groupNotificationsByDate(filteredNotifications), [filteredNotifications]);
    
    const handleMarkAsRead = (ids) => { readMutation.mutate(ids); setSelectedIds([]); };
    const handleMarkAsUnread = (ids) => { unreadMutation.mutate(ids); setSelectedIds([]); };
    const handleDelete = (ids) => { deleteMutation.mutate(ids); setSelectedIds([]); setDialogOpen(false); };
    
    const handleSelectAllOnPage = (checked) => setSelectedIds(checked ? filteredNotifications.map(n => n.id) : []);

    const confirmAction = (action, ids) => {
        const performAction = () => {
            if (action === 'delete') handleDelete(ids);
            if (action === 'markAllRead') {
              const unreadIds = allNotifications.filter(n => !n.is_read).map(n => n.id);
              if (unreadIds.length > 0) handleMarkAsRead(unreadIds);
            }
            setDialogOpen(false);
        };
        setDialogAction({ perform: performAction, count: ids.length, type: action });
        setDialogOpen(true);
    };

    if (isLoading) return <PageLoader />;
    
    const NotificationCard = ({ notification }) => {
        const { icon: Icon, color } = notificationIcons[notification.type] || notificationIcons.default;
        return (
            <Card className={cn(
                "flex items-start gap-4 p-5 transition-all duration-200 hover:shadow-lg cursor-pointer border-2 rounded-2xl",
                !notification.is_read && "bg-blue-50/50 border-blue-200",
                notification.is_read && "border-slate-200",
                selectedIds.includes(notification.id) && "ring-2 ring-blue-500 border-blue-500"
            )} onClick={() => notification.link && navigate(notification.link)}>
                <Checkbox checked={selectedIds.includes(notification.id)} onCheckedChange={(checked) => setSelectedIds(prev => checked ? [...prev, notification.id] : prev.filter(id => id !== notification.id))} className="mt-1" onClick={(e) => e.stopPropagation()} />
                <div className={cn("flex items-center justify-center w-12 h-12 rounded-xl shrink-0 shadow-sm", color)}>
                    <Icon className="w-6 h-6" aria-hidden="true" />
                </div>
                <div className="flex-1">
                    <p className={cn("text-base", notification.is_read ? "font-semibold text-slate-900" : "font-bold text-slate-900")}>{notification.title}</p>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">{notification.message}</p>
                    <p className="text-xs text-slate-500 mt-2">{format(new Date(notification.created_at), 'dd MMM, HH:mm', { locale: es })}</p>
                </div>
                <DropdownMenu onOpenChange={(e) => e.stopPropagation()}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()} className="rounded-xl h-9 w-9">
                            <MoreVertical className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="rounded-xl">
                        <DropdownMenuItem onClick={() => notification.is_read ? handleMarkAsUnread([notification.id]) : handleMarkAsRead([notification.id])}>
                            Marcar como {notification.is_read ? 'no leída' : 'leída'}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => confirmAction('delete', [notification.id])}>
                            Eliminar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </Card>
        );
    };

    return (
        <>
            <Helmet><title>Notificaciones - ComerECO</title></Helmet>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-8 border-b border-slate-200">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shadow-md">
                                <Bell className="h-7 w-7 text-blue-600" aria-hidden="true" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-1">Notificaciones</h1>
                                {unreadCount > 0 && <p className="text-base sm:text-lg text-slate-600">{unreadCount} notificaciones no leídas</p>}
                            </div>
                        </div>
                        <Button onClick={() => confirmAction('markAllRead', allNotifications.filter(n => !n.is_read).map(n => n.id))} disabled={unreadCount === 0} size="lg" className="shadow-button hover:shadow-button-hover whitespace-nowrap">
                            <CheckCheck className="mr-2 h-5 w-5" /> Marcar todo como leído
                        </Button>
                    </header>

                    <Card className="p-6 border-2 border-slate-200 shadow-lg rounded-2xl">
                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                            <div className="relative w-full sm:max-w-xs">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" aria-hidden="true" />
                                <Input placeholder="Buscar..." value={filters.query} onChange={e => setFilters(p => ({...p, query: e.target.value}))} className="pl-10 rounded-xl" />
                            </div>
                            <Select value={filters.type} onValueChange={v => setFilters(p => ({...p, type: v}))}>
                                <SelectTrigger className="w-full sm:w-[200px] rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="all">Todos los tipos</SelectItem>
                                    <SelectItem value="success">Éxito</SelectItem>
                                    <SelectItem value="warning">Advertencia</SelectItem>
                                    <SelectItem value="danger">Error</SelectItem>
                                    <SelectItem value="info">Información</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="ghost" onClick={() => setFilters({ query: '', type: 'all' })} className="w-full sm:w-auto rounded-xl">
                                <X className="mr-2 h-4 w-4"/>Limpiar
                            </Button>
                        </div>
                    </Card>

                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-2 rounded-xl h-12">
                            <TabsTrigger value="all" className="rounded-lg">Todas</TabsTrigger>
                            <TabsTrigger value="unread" className="rounded-lg">
                                No Leídas {unreadCount > 0 && <span className="ml-2 bg-blue-600 text-white h-5 w-5 text-xs rounded-full flex items-center justify-center">{unreadCount}</span>}
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                
                    <AnimatePresence>
                        {selectedIds.length > 0 && (
                            <motion.div
                                initial={{ y: -50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -50, opacity: 0 }}
                                className="sticky top-2 z-10 bg-white p-4 border-2 border-blue-200 rounded-2xl shadow-xl flex items-center justify-between"
                            >
                                <p className="font-bold text-slate-900">{selectedIds.length} seleccionada(s)</p>
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={() => handleMarkAsRead(selectedIds)} className="rounded-xl">Marcar como leídas</Button>
                                    <Button size="sm" variant="destructive" onClick={() => confirmAction('delete', selectedIds)} className="rounded-xl">Eliminar</Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                
                    {filteredNotifications.length > 0 ? (
                        <div className="space-y-6">
                            <div className="flex items-center bg-white p-4 rounded-xl border-2 border-slate-200">
                                <Checkbox id="select-all" onCheckedChange={handleSelectAllOnPage} checked={selectedIds.length === filteredNotifications.length && filteredNotifications.length > 0} />
                                <label htmlFor="select-all" className="ml-3 text-sm font-semibold text-slate-900">Seleccionar todo en esta página</label>
                            </div>
                            {Object.entries(groupedNotifications).map(([group, notifications]) => (
                                <div key={group}>
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider pb-3 mb-4 border-b-2 border-slate-200">{group}</h3>
                                    <div className="space-y-4">
                                        {notifications.map(n => <NotificationCard key={n.id} notification={n} />)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-lg p-20 border-2 border-slate-200 text-center">
                            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-6">
                                <Search className="h-10 w-10 text-slate-400" aria-hidden="true" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">No se encontraron notificaciones</h3>
                            <p className="text-base text-slate-600">Intenta ajustar tus filtros de búsqueda.</p>
                        </div>
                    )}
                </div>
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md border border-slate-200 bg-white shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Confirmar Acción</DialogTitle>
                    </DialogHeader>
                    <DialogDescription className="text-base text-slate-600">
                        {dialogAction?.type === 'delete' && `¿Estás seguro de que quieres eliminar ${dialogAction.count} notificación(es)? Esta acción no se puede deshacer.`}
                        {dialogAction?.type === 'markAllRead' && `¿Estás seguro de que quieres marcar ${dialogAction.count} notificación(es) como leídas?`}
                    </DialogDescription>
                    <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={() => setDialogOpen(false)} className="rounded-xl">Cancelar</Button>
                        <Button onClick={dialogAction?.perform} variant={dialogAction?.type === 'delete' ? 'destructive' : 'default'} className="rounded-xl shadow-button hover:shadow-button-hover">
                            Confirmar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default NotificationsPage;
