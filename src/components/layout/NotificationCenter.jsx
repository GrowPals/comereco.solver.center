
import React, { useState, useMemo, useEffect } from 'react';
import { Bell, CheckCheck, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { cn } from '@/lib/utils';
import logger from '@/utils/logger';

const notificationIcons = {
    success: { color: 'bg-green-100 text-green-600', icon: CheckCheck },
    warning: { color: 'bg-yellow-100 text-yellow-600', icon: Bell },
    danger: { color: 'bg-red-100 text-red-600', icon: X },
    info: { color: 'bg-blue-100 text-blue-600', icon: Bell },
};

// =================================================================
// Servicios de Notificaciones (Lógica de Supabase)
// =================================================================

const getNotifications = async () => {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        logger.error('Error fetching notifications:', error);
        return [];
    }
    return data;
};

const markNotificationAsRead = async (id) => {
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

    if (error) {
        logger.error('Error marking notification as read:', error);
    }
};


// =================================================================
// Componentes de UI
// =================================================================

const NotificationItem = ({ notification, onRead }) => {
    const navigate = useNavigate();
    const config = notificationIcons[notification.type] || notificationIcons.info;
    const Icon = config.icon;
    
    const handleClick = () => {
        onRead(notification.id);
        if (notification.link) {
            navigate(notification.link);
        }
    };

    return (
        <div
            className={cn(
                "flex items-start gap-3 p-3 border-b last:border-0 hover:bg-accent cursor-pointer transition-colors duration-150",
                !notification.is_read && "bg-primary/5"
            )}
            onClick={handleClick}
        >
            <div className="flex-shrink-0 flex items-center pt-1">
              {!notification.is_read && <div className="w-2 h-2 rounded-full bg-primary mr-2" />}
              <div className={cn("flex items-center justify-center w-8 h-8 rounded-full", config.color)}>
                  <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="flex-1">
                <p className={cn("font-semibold text-sm", !notification.is_read && "text-foreground")}>{notification.title}</p>
                <p className="text-xs text-muted-foreground">{notification.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: es })}
                </p>
            </div>
        </div>
    );
};

const NotificationCenter = () => {
    const { user } = useSupabaseAuth();
    const navigate = useNavigate();
    
    const [notifications, setNotifications] = useState([]);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (user) {
            getNotifications().then(setNotifications);

            const channel = supabase
                .channel('public:notifications')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
                    setNotifications(prev => [payload.new, ...prev]);
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [user]);
    
    const unreadCount = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications]);

    const handleMarkAsRead = (id) => {
        const notification = notifications.find(n => n.id === id);
        if(notification && !notification.is_read) {
            markNotificationAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        }
        setOpen(false); // Close popover on click
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-full" aria-label={`Ver notificaciones, ${unreadCount} no leídas`}>
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </div>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[350px] p-0 shadow-lg rounded-2xl border">
                <div className="p-3 flex items-center justify-between border-b">
                    <h3 className="font-bold text-base">Notificaciones</h3>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => setOpen(false)}><X className="w-4 h-4"/></Button>
                </div>
                
                <div className="max-h-[350px] overflow-y-auto">
                    {notifications.length > 0 ? (
                        notifications.map(n => <NotificationItem key={n.id} notification={n} onRead={handleMarkAsRead} />)
                    ) : (
                        <div className="p-8 text-center text-muted-foreground">
                            <CheckCheck className="mx-auto h-12 w-12 text-primary" />
                            <p className="mt-4 font-semibold">Todo al día</p>
                            <p className="text-sm">No tienes notificaciones nuevas.</p>
                        </div>
                    )}
                </div>
                
                <div className="p-2 border-t text-center bg-accent/50">
                    <Button variant="link" size="sm" onClick={() => { setOpen(false); navigate('/notifications'); }}>
                        Ver todas
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default NotificationCenter;
