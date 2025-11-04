
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
import { getNotifications, markNotificationsAsRead, getUnreadCount } from '@/services/notificationService';

const notificationIcons = {
    success: { color: 'bg-gradient-to-br from-green-100 to-green-50 text-green-600 shadow-sm', icon: CheckCheck },
    warning: { color: 'bg-gradient-to-br from-yellow-100 to-yellow-50 text-yellow-600 shadow-sm', icon: Bell },
    danger: { color: 'bg-gradient-to-br from-red-100 to-red-50 text-red-600 shadow-sm', icon: X },
    info: { color: 'bg-gradient-to-br from-primary-100 to-primary-50 text-primary-600 shadow-sm', icon: Bell },
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
                "flex items-start gap-3 p-4 border-b border-neutral-200 last:border-0 hover:bg-primary-50/30 cursor-pointer transition-all duration-200 group",
                !notification.is_read && "bg-primary-50/20"
            )}
            onClick={handleClick}
        >
            <div className="flex-shrink-0 flex items-center pt-1">
              {!notification.is_read && <div className="w-2.5 h-2.5 rounded-full bg-gradient-primary mr-2 animate-pulse" />}
              <div className={cn("flex items-center justify-center w-10 h-10 rounded-xl transition-transform duration-200 group-hover:scale-105", config.color)}>
                  <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
                <p className={cn("font-semibold text-sm text-neutral-900", !notification.is_read && "text-neutral-900")}>{notification.title}</p>
                <p className="text-xs text-neutral-600 mt-0.5 line-clamp-2">{notification.message}</p>
                <p className="text-xs text-neutral-500 mt-2 font-medium">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: es })}
                </p>
            </div>
        </div>
    );
};

const NotificationCenter = ({ variant = 'popover' }) => {
    const { user } = useSupabaseAuth();
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!user?.id) return;

        const isValidUUID = (str) => {
            if (!str) return false;
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            return uuidRegex.test(str);
        };

        if (!isValidUUID(user.id)) {
            logger.error('Invalid user ID format for notifications');
            return;
        }

        // Cargar notificaciones y contador en paralelo
        Promise.all([
            getNotifications(),
            getUnreadCount()
        ])
            .then(([allNotifications, count]) => {
                // Limitar a 20 notificaciones más recientes para el popover
                setNotifications(allNotifications.slice(0, 20));
                // Usar el contador real de todas las no leídas
                setUnreadCount(count);
            })
            .catch(error => {
                logger.error('Error loading notifications:', error);
            });

        // Suscripción real-time: solo escucha notificaciones del usuario autenticado
        const channel = supabase
            .channel(`notifications-user-${user.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}` // Filtro explícito por user_id
            }, (payload) => {
                logger.info('New notification received:', payload.new);
                setNotifications(prev => [payload.new, ...prev.slice(0, 19)]);
                // Actualizar contador si la nueva notificación no está leída
                if (!payload.new.is_read) {
                    setUnreadCount(prev => prev + 1);
                }
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}` // Filtro explícito por user_id
            }, (payload) => {
                logger.info('Notification updated:', payload.new);
                const oldNotification = notifications.find(n => n.id === payload.new.id);
                setNotifications(prev =>
                    prev.map(n => n.id === payload.new.id ? payload.new : n)
                );
                // Actualizar contador si cambió el estado de lectura
                if (oldNotification && !oldNotification.is_read && payload.new.is_read) {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                } else if (oldNotification && oldNotification.is_read && !payload.new.is_read) {
                    setUnreadCount(prev => prev + 1);
                }
            })
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    logger.info(`Subscribed to notifications for user ${user.id}`);
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    logger.error('Error subscribing to notifications channel', err);
                }
            });

        return () => {
            if (channel) {
                supabase.removeChannel(channel).catch(err => logger.error('Failed to remove notifications channel', err));
            }
        };
    }, [user]);

    const handleMarkAsRead = async (id) => {
        const notification = notifications.find(n => n.id === id);
        if(notification && !notification.is_read) {
            try {
                await markNotificationsAsRead([id]);
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
                // Decrementar el contador
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch (error) {
                logger.error('Error marking notification as read:', error);
            }
        }
        setOpen(false);
    };

    if (variant === 'icon') {
        return (
            <Button
                variant="ghost"
                size="icon"
                className="relative h-11 w-11 overflow-visible rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                aria-label={`Ver notificaciones${unreadCount > 0 ? `, ${unreadCount} sin leer` : ''}`}
                onClick={() => navigate('/notifications')}
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <div className="absolute -top-1.5 -right-1.5 z-20 flex h-5 min-w-[1.75rem] items-center justify-center rounded-full bg-gradient-error px-1.5 text-[10px] font-bold text-white leading-[20px] shadow-md">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </div>
                )}
            </Button>
        );
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative overflow-visible rounded-full hover:bg-primary-50 transition-colors" aria-label={`Ver notificaciones, ${unreadCount} no leídas`}>
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <div className="absolute -top-1.5 -right-1.5 z-20 flex h-5 min-w-[1.75rem] items-center justify-center rounded-full bg-gradient-error px-1.5 text-[10px] font-bold text-white leading-[20px] shadow-md animate-pulse">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </div>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[380px] p-0 shadow-2xl rounded-2xl border-neutral-200">
                <div className="p-4 flex items-center justify-between border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-white">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                            <Bell className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="font-bold text-base text-neutral-900">Notificaciones</h3>
                        {unreadCount > 0 && (
                            <span className="text-xs font-semibold text-neutral-500">({unreadCount} nuevas)</span>
                        )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-neutral-100" onClick={() => setOpen(false)}>
                        <X className="w-4 h-4"/>
                    </Button>
                </div>

                <div className="max-h-[420px] overflow-y-auto">
                    {notifications.length > 0 ? (
                        notifications.map(n => <NotificationItem key={n.id} notification={n} onRead={handleMarkAsRead} />)
                    ) : (
                        <div className="p-12 text-center">
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center mb-4">
                                <CheckCheck className="h-8 w-8 text-primary-600" />
                            </div>
                            <p className="font-bold text-neutral-900 text-base">Todo al día</p>
                            <p className="text-sm text-neutral-600 mt-1">No tienes notificaciones nuevas.</p>
                        </div>
                    )}
                </div>

                {notifications.length > 0 && (
                    <div className="p-3 border-t border-neutral-200 text-center bg-neutral-50/50">
                        <Button variant="link" size="sm" className="font-semibold" onClick={() => { setOpen(false); navigate('/notifications'); }}>
                            Ver todas las notificaciones →
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
};

export default NotificationCenter;
