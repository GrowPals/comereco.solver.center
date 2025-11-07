
import React, { useState, useMemo, useEffect, memo, useCallback } from 'react';
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
    success: { color: 'text-emerald-500 dark:text-emerald-200', icon: CheckCheck },
    warning: { color: 'text-amber-500 dark:text-amber-200', icon: Bell },
    danger: { color: 'text-red-500 dark:text-red-200', icon: X },
    info: { color: 'text-primary-600 dark:text-primary-100', icon: Bell },
};

// UUID validation regex (extracted for performance)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isValidUUID = (str) => {
    if (!str) return false;
    return UUID_REGEX.test(str);
};

// =================================================================
// Componentes de UI
// =================================================================

const NotificationItem = memo(({ notification, onRead }) => {
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
              <div className={cn("icon-badge flex items-center justify-center w-10 h-10 rounded-xl transition-transform duration-200 group-hover:scale-105", config.color)}>
                  <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
                <p className={cn("font-semibold text-sm text-foreground dark:text-foreground/95", !notification.is_read && "text-foreground")}>{notification.title}</p>
                <p className="text-xs text-muted-foreground/90 dark:text-foreground/70 mt-0.5 line-clamp-2">{notification.message}</p>
                <p className="text-xs text-neutral-500 mt-2 font-medium">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: es })}
                </p>
            </div>
        </div>
    );
});

NotificationItem.displayName = 'NotificationItem';

const NotificationCenter = ({ variant = 'popover' }) => {
    const { user } = useSupabaseAuth();
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!user?.id) return;

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
                setNotifications(prev => {
                    // Buscar la notificación anterior en el estado actual
                    const oldNotification = prev.find(n => n.id === payload.new.id);

                    // Actualizar contador si cambió el estado de lectura
                    if (oldNotification && !oldNotification.is_read && payload.new.is_read) {
                        setUnreadCount(c => Math.max(0, c - 1));
                    } else if (oldNotification && oldNotification.is_read && !payload.new.is_read) {
                        setUnreadCount(c => c + 1);
                    }

                    return prev.map(n => n.id === payload.new.id ? payload.new : n);
                });
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
        // Delay before closing to show the read state transition
        setTimeout(() => setOpen(false), 300);
    };

    if (variant === 'icon') {
        return (
            <Button
                variant="ghost"
                size="icon"
                className="relative h-11 w-11 overflow-visible rounded-full border border-border bg-[var(--surface-contrast)] text-foreground shadow-none transition-colors hover:bg-[var(--surface-muted)] hover:shadow-none active:shadow-none dark:border-[#1a2f4f] dark:bg-[rgba(12,26,52,0.72)] dark:text-primary-50 dark:hover:bg-[rgba(16,32,62,0.85)] dark:hover:border-[#4678d4] dark:shadow-[0_22px_48px_rgba(5,12,28,0.52)] dark:hover:shadow-[0_28px_60px_rgba(6,14,30,0.6)]"
                aria-label={`Ver notificaciones${unreadCount > 0 ? `, ${unreadCount} sin leer` : ''}`}
                onClick={() => navigate('/notifications')}
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <div className="absolute -top-1.5 -right-1.5 z-20 flex h-5 min-w-[1.75rem] items-center justify-center rounded-full bg-gradient-error px-1.5 text-xs font-bold text-white leading-tight shadow-none dark:shadow-[0_20px_48px_rgba(4,12,28,0.55)]">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </div>
                )}
            </Button>
        );
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative overflow-visible rounded-full border border-border bg-[var(--surface-contrast)] text-foreground shadow-none transition-colors hover:bg-[var(--surface-muted)] hover:shadow-none active:shadow-none dark:border-[#1a2f4f] dark:bg-[rgba(12,26,52,0.72)] dark:text-primary-50 dark:hover:bg-[rgba(16,32,62,0.85)] dark:hover:border-[#4678d4] dark:shadow-[0_22px_48px_rgba(5,12,28,0.52)] dark:hover:shadow-[0_28px_60px_rgba(6,14,30,0.6)]"
                    aria-label={`Ver notificaciones, ${unreadCount} no leídas`}
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <div className="absolute -top-1.5 -right-1.5 z-20 flex h-5 min-w-[1.75rem] items-center justify-center rounded-full bg-gradient-error px-1.5 text-xs font-bold text-white leading-tight shadow-none dark:shadow-[0_20px_48px_rgba(4,12,28,0.55)] animate-pulse">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </div>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[380px] p-0 shadow-soft-xl">
                <div className="flex items-center justify-between border-b border-border bg-[var(--surface-overlay)] p-4">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
                            <Bell className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="text-base font-bold text-foreground">Notificaciones</h3>
                        {unreadCount > 0 && (
                            <span className="text-xs font-semibold text-muted-foreground">({unreadCount} nuevas)</span>
                        )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted/70 dark:hover:bg-muted/40" onClick={() => setOpen(false)}>
                        <X className="w-4 h-4"/>
                    </Button>
                </div>

                <div className="max-h-[420px] overflow-y-auto">
                    {notifications.length > 0 ? (
                        notifications.map(n => <NotificationItem key={n.id} notification={n} onRead={handleMarkAsRead} />)
                    ) : (
                        <div className="p-12 text-center">
                            <div className="icon-badge mx-auto mb-4 flex h-16 w-16 items-center justify-center text-primary-600 dark:text-primary-100">
                                <CheckCheck className="h-8 w-8" />
                            </div>
                            <p className="text-base font-bold text-foreground">Todo al día</p>
                            <p className="mt-1 text-sm text-muted-foreground">No tienes notificaciones nuevas.</p>
                        </div>
                    )}
                </div>

                {notifications.length > 0 && (
                    <div className="border-t border-border bg-[var(--surface-overlay)] p-3 text-center">
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
