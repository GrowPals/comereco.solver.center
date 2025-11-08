
import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
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
import PageContainer from '@/components/layout/PageContainer';
import { Icon as Glyph } from '@/components/ui/icon';
import { SectionIcon } from '@/components/ui/icon-wrapper';

const notificationThemes = {
    success: {
        iconTone: 'success',
        accent: 'from-emerald-400/80 to-emerald-500/30',
    },
    warning: {
        iconTone: 'warning',
        accent: 'from-amber-400/80 to-amber-500/30',
    },
    danger: {
        iconTone: 'danger',
        accent: 'from-coral-400/80 to-red-500/30',
    },
    info: {
        iconTone: 'primary',
        accent: 'from-sky-400/80 to-indigo-500/30',
    },
    default: {
        iconTone: 'primary',
        accent: 'from-muted/80 to-muted/40',
    },
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
        const theme = notificationThemes[notification.type] || notificationThemes.default;
        const isSelected = selectedIds.includes(notification.id);
        const isUnread = !notification.is_read;

        return (
            <Card
                className={cn(
                    'relative flex items-start gap-3 rounded-xl border border-border bg-card p-4 pl-6 transition-colors duration-200 cursor-pointer dark:border-border/60 dark:bg-[#0f192b] dark:hover:bg-[#13233c]',
                    isUnread && 'bg-primary-50/40 dark:bg-primary-500/5',
                    isSelected && 'ring-1 ring-primary-500 border-primary-400 dark:border-primary-400/60'
                )}
                onClick={() => notification.link && navigate(notification.link)}
            >
                <span className={cn('absolute inset-y-4 left-2 w-[3px] rounded-full', theme.accent)} aria-hidden="true" />
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) =>
                        setSelectedIds(prev =>
                            checked ? [...prev, notification.id] : prev.filter(id => id !== notification.id)
                        )
                    }
                    className="mt-1"
                    onClick={(e) => e.stopPropagation()}
                />
                <Glyph icon={Bell} tone={theme.iconTone} size="lg" className="mt-1 flex-shrink-0" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                    <p className={cn("text-sm sm:text-base", notification.is_read ? "font-semibold text-foreground" : "font-bold text-foreground")}>{notification.title}</p>
                    <p className="mt-1 text-xs leading-snug text-muted-foreground sm:text-sm">{notification.message}</p>
                    <p className="mt-2 text-[11px] text-muted-foreground/80">{format(new Date(notification.created_at), 'dd MMM, HH:mm', { locale: es })}</p>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()} className="rounded-xl h-8 w-8 mt-0.5">
                            <MoreVertical className="h-5 w-5 text-muted-foreground" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="rounded-xl surface-card p-2">
                        <DropdownMenuItem onClick={() => notification.is_read ? handleMarkAsUnread([notification.id]) : handleMarkAsRead([notification.id])}>
                            Marcar como {notification.is_read ? 'no leída' : 'leída'}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => confirmAction('delete', [notification.id])}>
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
            <PageContainer>
                <div className="mx-auto w-full max-w-7xl space-y-6 sm:space-y-8">
                    <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between sm:pb-6 dark:border-border">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <SectionIcon icon={Bell} size="lg" />
                            <div className="space-y-1">
                                <h1 className="page-title">
                                    Centro de <span className="page-title-accent">Notificaciones</span>
                                </h1>
                                {unreadCount > 0 && (
                                    <p className="page-title-subtext">{unreadCount} notificaciones no leídas</p>
                                )}
                            </div>
                        </div>
                        <Button
                            onClick={() => confirmAction('markAllRead', allNotifications.filter(n => !n.is_read).map(n => n.id))}
                            disabled={unreadCount === 0}
                            size="lg"
                            className="w-full rounded-xl shadow-button hover:shadow-button-hover sm:w-auto"
                        >
                            <CheckCheck className="mr-2 h-5 w-5" /> Marcar todo como leído
                        </Button>
                    </header>

                    <Card className="surface-card p-4 shadow-soft-md sm:p-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                            <div className="relative w-full sm:max-w-xs">
                                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                                <Input
                                    placeholder="Buscar..."
                                    value={filters.query}
                                    onChange={e => setFilters(p => ({ ...p, query: e.target.value }))}
                                    className="h-11 rounded-xl pl-10"
                                />
                            </div>
                            <Select value={filters.type} onValueChange={v => setFilters(p => ({ ...p, type: v }))}>
                                <SelectTrigger className="h-11 w-full rounded-xl sm:w-[220px]">
                                    <SelectValue placeholder="Todos los tipos" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-border bg-card dark:border-border dark:bg-card">
                                    <SelectItem value="all">Todos los tipos</SelectItem>
                                    <SelectItem value="success">Éxito</SelectItem>
                                    <SelectItem value="warning">Advertencia</SelectItem>
                                    <SelectItem value="danger">Error</SelectItem>
                                    <SelectItem value="info">Información</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="ghost"
                                onClick={() => setFilters({ query: '', type: 'all' })}
                                className="w-full rounded-xl border border-transparent hover:border-border sm:w-auto dark:hover:border-border"
                            >
                                <X className="mr-2 h-4 w-4" />Limpiar
                            </Button>
                        </div>
                    </Card>

                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid h-12 w-full grid-cols-2 rounded-2xl border border-border/70 bg-[var(--surface-contrast)] p-1 shadow-sm dark:border-[rgba(124,188,255,0.35)] dark:bg-[#081526]">
                            <TabsTrigger
                                value="all"
                                className="rounded-xl text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-primary-700 data-[state=active]:shadow-lg data-[state=active]:ring-1 data-[state=active]:ring-primary/25 dark:data-[state=active]:bg-[#112541] dark:data-[state=active]:text-primary-100"
                            >
                                Todas
                            </TabsTrigger>
                            <TabsTrigger
                                value="unread"
                                className="rounded-xl text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-primary-700 data-[state=active]:shadow-lg data-[state=active]:ring-1 data-[state=active]:ring-primary/25 dark:data-[state=active]:bg-[#112541] dark:data-[state=active]:text-primary-100"
                            >
                                No Leídas
                                {unreadCount > 0 && (
                                    <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[11px] font-bold text-white dark:bg-primary-400">
                                        {unreadCount}
                                    </span>
                                )}
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                
                    <AnimatePresence>
                        {selectedIds.length > 0 && (
                            <motion.div
                                initial={{ y: -50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -50, opacity: 0 }}
                                className="sticky top-2 z-10 flex items-center justify-between surface-card border border-primary/30 p-4 shadow-soft-lg ring-1 ring-primary-300/35 backdrop-blur dark:border-primary/40 dark:ring-primary-400/30"
                            >
                                <p className="font-bold text-foreground">{selectedIds.length} seleccionada(s)</p>
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={() => handleMarkAsRead(selectedIds)} className="rounded-xl">Marcar como leídas</Button>
                                    <Button size="sm" variant="destructive" onClick={() => confirmAction('delete', selectedIds)} className="rounded-xl">Eliminar</Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                
                    {filteredNotifications.length > 0 ? (
                        <div className="space-y-6">
                            <div className="surface-card flex items-center p-4">
                                <Checkbox id="select-all" onCheckedChange={handleSelectAllOnPage} checked={selectedIds.length === filteredNotifications.length && filteredNotifications.length > 0} />
                                <label htmlFor="select-all" className="ml-3 text-sm font-semibold text-foreground">Seleccionar todo en esta página</label>
                            </div>
                            {Object.entries(groupedNotifications).map(([group, notifications]) => (
                                <div key={group}>
                                    <h3 className="mb-4 border-b-2 border-border pb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">{group}</h3>
                                    <div className="space-y-4">
                                        {notifications.map(n => <NotificationCard key={n.id} notification={n} />)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="surface-card p-20 text-center">
                            <Glyph icon={Search} size="lg" className="mx-auto mb-6" tone="primary" />
                            <h3 className="mb-2 text-2xl font-bold text-foreground">No se encontraron notificaciones</h3>
                            <p className="text-base text-muted-foreground">Intenta ajustar tus filtros de búsqueda.</p>
                        </div>
                    )}
                </div>
            </PageContainer>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md border border-border bg-card shadow-soft-xl dark:border-border dark:bg-card">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Confirmar Acción</DialogTitle>
                    </DialogHeader>
                    <DialogDescription className="text-base text-muted-foreground">
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
