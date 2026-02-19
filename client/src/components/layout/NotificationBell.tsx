import { useState } from "react";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, AlertTriangle, Calendar, Package } from "lucide-react";
import { useLocation } from "wouter";

interface Notification {
  id: string;
  type: 'low_stock' | 'expiring' | 'expired';
  title: string;
  description: string;
  severity: 'warning' | 'danger';
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();

  const products = useLiveQuery(() => db.products.toArray());
  const batches = useLiveQuery(() => db.batches.toArray());

  const notifications: Notification[] = [];

  const lowStockProducts = products?.filter(p => p.isActive && p.stock <= p.lowStockThreshold) || [];
  for (const p of lowStockProducts) {
    notifications.push({
      id: `low-${p.id}`,
      type: 'low_stock',
      title: `Low Stock: ${p.name}`,
      description: `Only ${p.stock} units remaining (threshold: ${p.lowStockThreshold})`,
      severity: p.stock === 0 ? 'danger' : 'warning',
    });
  }

  const now = Date.now();
  const expiringBatches = batches?.filter(b => {
    if (!b.expiryDate || b.remainingQuantity <= 0) return false;
    const daysLeft = Math.ceil((new Date(b.expiryDate).getTime() - now) / (1000 * 60 * 60 * 24));
    return daysLeft <= 30;
  }) || [];

  for (const b of expiringBatches) {
    const daysLeft = Math.ceil((new Date(b.expiryDate!).getTime() - now) / (1000 * 60 * 60 * 24));
    const productName = products?.find(p => p.id === b.productId)?.name || 'Unknown';
    const isExpired = daysLeft <= 0;
    notifications.push({
      id: `exp-${b.id}`,
      type: isExpired ? 'expired' : 'expiring',
      title: isExpired ? `Expired: ${productName}` : `Expiring Soon: ${productName}`,
      description: isExpired
        ? `Batch ${b.batchNumber} has expired (${b.remainingQuantity} units)`
        : `Batch ${b.batchNumber} expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} (${b.remainingQuantity} units)`,
      severity: isExpired || daysLeft <= 7 ? 'danger' : 'warning',
    });
  }

  const dangerCount = notifications.filter(n => n.severity === 'danger').length;
  const totalCount = notifications.length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'low_stock': return <Package className="size-4" />;
      case 'expiring': return <Calendar className="size-4" />;
      case 'expired': return <AlertTriangle className="size-4" />;
      default: return <Bell className="size-4" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="size-5" />
          {totalCount > 0 && (
            <span className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-background ${dangerCount > 0 ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'}`}>
              {totalCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b font-semibold flex items-center justify-between">
          <span>Notifications</span>
          {totalCount > 0 && (
            <Badge variant="secondary" className="text-[10px]">{totalCount}</Badge>
          )}
        </div>
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              No notifications
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  className="w-full text-left p-3 hover:bg-muted/50 transition-colors flex gap-3 items-start"
                  onClick={() => {
                    setOpen(false);
                    setLocation("/inventory");
                  }}
                >
                  <div className={`mt-0.5 ${notification.severity === 'danger' ? 'text-destructive' : 'text-amber-500'}`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{notification.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{notification.description}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
        {totalCount > 0 && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              className="w-full text-xs h-8"
              onClick={() => { setOpen(false); setLocation("/inventory"); }}
            >
              View all in Inventory
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
