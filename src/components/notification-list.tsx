'use client';
import type { Notification } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Button } from './ui/button';

interface NotificationListProps {
    notifications: Notification[];
    onMarkAsRead: (notification: Notification) => void;
}

export function NotificationList({ notifications, onMarkAsRead }: NotificationListProps) {
    if (notifications.length === 0) {
        return (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                You have no new notifications.
            </div>
        );
    }
    return (
        <div className="flow-root">
            <ul className="-my-2 divide-y divide-border">
                {notifications.map((notification) => (
                    <li key={notification.id} className={cn('flex items-center gap-4 px-4 py-3', !notification.isRead && 'bg-primary/5')}>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                                {notification.message}
                            </p>
                            <p className="truncate text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </p>
                        </div>
                        {!notification.isRead && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onMarkAsRead(notification);
                                }}
                            >
                                Mark as Read
                            </Button>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
