import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday, isThisWeek, startOfDay, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

import { Bell, Search, X, CheckCheck, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { getNotificationsForUser } from '@/data/mockdata';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const notificationIcons = {
    success: { icon: CheckCheck, color: 'bg-secondary-20 text-secondary-100' },
    warning: { icon: Bell, color: 'bg-yellow-100 text-yellow-800' },
    danger: { icon: X, color: 'bg-red-100 text-red-700' },
    info: { icon: Bell, color: 'bg-blue-100 text-blue-700' },
};

const groupNotificationsByDate = (notifications) => {
    return notifications.reduce((acc, notification) => {
        const date = new Date(notification.time);
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
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [allNotifications, setAllNotifications] = useState([]);
    const [filters, setFilters] = useState({ query: '', type: 'all' });
    const [activeTab, setActiveTab] = useState('all');
    const [selectedIds, setSelectedIds] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogAction, setDialogAction] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        if (user) {
            const userNotifications = getNotificationsForUser(user.id);
            setAllNotifications(userNotifications);
        }
        const timer = setTimeout(() => setLoading(false), 500);
        return () => clearTimeout(timer);
    }, [user]);

    const filteredNotifications = useMemo(() => {
        let items = [...allNotifications];

        if (activeTab === 'unread') items = items.filter(n => !n.read);

        if (filters.query) {
            const queryLower = filters.query.toLowerCase();
            items = items.filter(n =>
                n.title.toLowerCase().includes(queryLower) ||
                n.message.toLowerCase().includes(queryLower)
            );
        }

        if (filters.type !== 'all') {
            items = items.filter(n => n.type === filters.type);
        }

        return items;
    }, [allNotifications, filters, activeTab]);

    const unreadCount = useMemo(() => allNotifications.filter(n => !n.read).length, [allNotifications]);
    
    const groupedNotifications = useMemo(() => groupNotificationsByDate(filteredNotifications), [filteredNotifications]);
    
    const handleMarkAsRead = (ids) => {
        setAllNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, read: true } : n));
        setSelectedIds([]);
        toast({ title: "Notificaciones actualizadas", description: `${ids.length} notificación(es) marcada(s) como leída(s).`, variant: 'success' });
    };

    const handleMarkAsUnread = (ids) => {
        setAllNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, read: false } : n));
        setSelectedIds([]);
    };
    
    const handleDelete = (ids) => {
        setAllNotifications(prev => prev.filter(n => !ids.includes(n.id)));
        setSelectedIds([]);
        toast({ title: "Notificaciones eliminadas", description: `${ids.length} notificación(es) ha(n) sido eliminada(s).`, variant: 'destructive' });
        setDialogOpen(false);
    };
    
    const handleSelectAllOnPage = (checked) => {
      if (checked) {
        setSelectedIds(filteredNotifications.map(n => n.id));
      } else {
        setSelectedIds([]);
      }
    };

    const confirmAction = (action, ids) => {
        const performAction = () => {
            if (action === 'delete') handleDelete(ids);
            if (action === 'markAllRead') {
              const unreadIds = allNotifications.filter(n => !n.read).map(n => n.id);
              if (unreadIds.length > 0) handleMarkAsRead(unreadIds);
            }
            setDialogOpen(false);
        };
        setDialogAction({ perform: performAction, count: ids.length, type: action });
        setDialogOpen(true);
    };

    const NotificationCardSkeleton = () => (
        <div className="flex items-start gap-4 p-4">
            <Skeleton className="h-5 w-5 mt-1" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-1/4" />
            </div>
        </div>
    );
    
    const NotificationCard = ({ notification }) => {
        const { icon: Icon, color } = notificationIcons[notification.type] || notificationIcons.info;
        return (
            <Card className={cn(
                "flex items-start gap-4 p-4 transition-all duration-200 hover:shadow-md cursor-pointer",
                !notification.read && "bg-primary-10/50",
                selectedIds.includes(notification.id) && "ring-2 ring-primary border-primary"
            )}
            onClick={() => notification.link && navigate(notification.link)}>
                <Checkbox
                  checked={selectedIds.includes(notification.id)}
                  onCheckedChange={(checked) => {
                    setSelectedIds(prev => checked ? [...prev, notification.id] : prev.filter(id => id !== notification.id));
                  }}
                  className="mt-1"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className={cn("flex items-center justify-center w-10 h-10 rounded-full shrink-0", color)}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <p className={cn("font-semibold", !notification.read && "font-bold")}>{notification.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">{format(new Date(notification.time), 'dd MMM, HH:mm', { locale: es })}</p>
                </div>
                <DropdownMenu onOpenChange={(e) => e.stopPropagation()}>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => notification.read ? handleMarkAsUnread([notification.id]) : handleMarkAsRead([notification.id])}>
                            Marcar como {notification.read ? 'no leída' : 'leída'}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => confirmAction('delete', [notification.id])}>Eliminar</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </Card>
        );
    };

    return (
        <>
            <Helmet><title>Notificaciones - ComerECO</title></Helmet>
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Notificaciones</h1>
                        {unreadCount > 0 && <p className="text-muted-foreground">{unreadCount} notificaciones no leídas</p>}
                    </div>
                    <Button onClick={() => confirmAction('markAllRead', allNotifications.filter(n => !n.read).map(n => n.id))} disabled={unreadCount === 0}>
                        <CheckCheck className="mr-2 h-4 w-4" /> Marcar todo como leído
                    </Button>
                </header>

                <Card className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <div className="relative w-full sm:max-w-xs">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                          <Input placeholder="Buscar..." value={filters.query} onChange={e => setFilters(p => ({...p, query: e.target.value}))} className="pl-10" />
                        </div>
                        <Select value={filters.type} onValueChange={v => setFilters(p => ({...p, type: v}))}>
                            <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los tipos</SelectItem>
                                <SelectItem value="success">Aprobaciones</SelectItem>
                                <SelectItem value="danger">Rechazos</SelectItem>
                                <SelectItem value="info">Comentarios</SelectItem>
                                <SelectItem value="warning">Alertas</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="ghost" onClick={() => setFilters({ query: '', type: 'all' })} className="w-full sm:w-auto"><X className="mr-2 h-4 w-4"/>Limpiar</Button>
                    </div>
                </Card>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="all">Todas</TabsTrigger>
                        <TabsTrigger value="unread">No Leídas {unreadCount > 0 && <span className="ml-2 bg-primary text-primary-foreground h-5 w-5 text-xs rounded-full flex items-center justify-center">{unreadCount}</span>}</TabsTrigger>
                    </TabsList>
                </Tabs>
                
                <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }}
                        className="sticky top-2 z-10 bg-card p-3 border rounded-lg shadow-lg flex items-center justify-between">
                        <p className="font-semibold">{selectedIds.length} seleccionada(s)</p>
                        <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleMarkAsRead(selectedIds)}>Marcar como leídas</Button>
                            <Button size="sm" variant="destructive" onClick={() => confirmAction('delete', selectedIds)}>Eliminar</Button>
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>
                
                {loading ? (
                    <div className="space-y-3">{Array.from({length: 5}).map((_, i) => <NotificationCardSkeleton key={i} />)}</div>
                ) : filteredNotifications.length > 0 ? (
                    <div className="space-y-6">
                        <div className="flex items-center">
                            <Checkbox id="select-all" onCheckedChange={handleSelectAllOnPage} checked={selectedIds.length === filteredNotifications.length && filteredNotifications.length > 0} />
                            <label htmlFor="select-all" className="ml-2 text-sm font-medium">Seleccionar todo en esta página</label>
                        </div>
                        {Object.entries(groupedNotifications).map(([group, notifications]) => (
                            <div key={group}>
                                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider pb-2 mb-4 border-b">{group}</h3>
                                <div className="space-y-3">
                                    {notifications.map(n => <NotificationCard key={n.id} notification={n} />)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <Search className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <h3 className="mt-4 text-lg font-semibold">No se encontraron notificaciones</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Intenta ajustar tus filtros de búsqueda.</p>
                    </div>
                )}
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmar Acción</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                  {dialogAction?.type === 'delete' && `¿Estás seguro de que quieres eliminar ${dialogAction.count} notificación(es)? Esta acción no se puede deshacer.`}
                  {dialogAction?.type === 'markAllRead' && `¿Estás seguro de que quieres marcar ${dialogAction.count} notificación(es) como leídas?`}
                </DialogDescription>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                  <Button
                    onClick={dialogAction?.perform}
                    variant={dialogAction?.type === 'delete' ? 'destructive' : 'default'}
                  >
                    Confirmar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        </>
    );
};

export default NotificationsPage;