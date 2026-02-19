import { useLiveQuery } from "dexie-react-hooks";
import { db, type Order } from "@/lib/db";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, CloudOff, CloudCog, ChevronDown, ChevronUp, Receipt, Package } from "lucide-react";
import { useState } from "react";

export default function Transactions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  
  const orders = useLiveQuery(
    () => db.orders.orderBy('createdAt').reverse().toArray()
  );

  const nonDraftOrders = orders?.filter(o => o.status !== 'draft') || [];

  const filteredOrders = nonDraftOrders.filter(order => {
    const matchesSearch =
      order.id?.toString().includes(searchQuery) ||
      (order.items || []).some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.paymentMethods || []).some(pm => pm.method.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">Completed</Badge>;
      case 'refunded':
        return <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-[10px]">Refunded</Badge>;
      case 'cancelled':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">Returned</Badge>;
      case 'pending':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px]">Pending</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  const toggleExpand = (orderId: number) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const completedCount = nonDraftOrders.filter(o => o.status === 'completed').length;
  const refundedCount = nonDraftOrders.filter(o => o.status === 'refunded' || o.status === 'cancelled').length;
  const totalRevenue = nonDraftOrders
    .filter(o => o.status === 'completed')
    .reduce((acc, o) => acc + o.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground">Complete history of all sales and refunds.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">completed transactions</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <Package className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₵{totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">from completed sales</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Refunds & Returns</CardTitle>
            <Receipt className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{refundedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">reversed transactions</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-1">
            <CardTitle>Order History</CardTitle>
            <CardDescription>
              Showing {filteredOrders.length} of {nonDraftOrders.length} transactions. Click any row to see details.
            </CardDescription>
          </div>
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="cancelled">Returned</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by item, payment..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead className="w-[80px]">Order</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Sync</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <>
                  <TableRow
                    key={order.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleExpand(order.id!)}
                  >
                    <TableCell>
                      {expandedOrderId === order.id ? (
                        <ChevronUp className="size-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="size-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="font-mono font-medium">#{order.id}</TableCell>
                    <TableCell>
                      {format(new Date(order.createdAt), 'MMM d, yyyy h:mm a')}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {(order.paymentMethods || []).map((pm, i) => (
                          <Badge key={i} variant="outline" className="capitalize text-[10px]">
                            {pm.method}: ₵{Math.abs(pm.amount).toFixed(2)}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{(order.items || []).length} item{(order.items || []).length !== 1 ? 's' : ''}</TableCell>
                    <TableCell className="text-right font-bold font-mono">
                      ₵{order.total.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        {order.synced ? (
                          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20">
                            <CloudCog className="mr-1 size-3" /> Synced
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20">
                            <CloudOff className="mr-1 size-3" /> Local
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedOrderId === order.id && (
                    <TableRow key={`${order.id}-detail`}>
                      <TableCell colSpan={8} className="bg-muted/30 p-0">
                        <OrderDetail order={order} />
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    {nonDraftOrders.length === 0
                      ? "No transactions yet. Complete a sale in POS to see it here."
                      : "No transactions match your search."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function OrderDetail({ order }: { order: Order }) {
  return (
    <div className="p-6 space-y-4">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Package className="size-4" /> Items Purchased
          </h4>
          <div className="border rounded-lg divide-y bg-background">
            {(order.items || []).map((item, i) => (
              <div key={i} className="flex justify-between items-center p-3 text-sm">
                <div className="flex-1">
                  <span className="font-medium">{item.name}</span>
                  {(item.discount || 0) > 0 && (
                    <span className="text-rose-500 text-xs ml-2">(-₵{item.discount!.toFixed(2)} disc.)</span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-right">
                  <span className="text-muted-foreground">
                    {Math.abs(item.quantity)} x ₵{item.price.toFixed(2)}
                  </span>
                  <span className="font-mono font-medium w-20 text-right">
                    ₵{(Math.abs(item.quantity) * (item.price - (item.discount || 0))).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Receipt className="size-4" /> Order Summary
          </h4>
          <div className="border rounded-lg bg-background p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono">₵{Math.abs(order.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Tax {order.taxRuleName ? `(${order.taxRuleName})` : ''}
              </span>
              <span className="font-mono">₵{Math.abs(order.tax).toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm text-rose-500">
                <span>
                  Discount {order.discountType === 'percentage' ? `(%)` : '(flat)'}
                </span>
                <span className="font-mono">-₵{Math.abs(order.discount).toFixed(2)}</span>
              </div>
            )}
            <Separator className="my-2" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="font-mono">₵{order.total.toFixed(2)}</span>
            </div>

            <Separator className="my-2" />
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Payment Details</span>
              {(order.paymentMethods || []).map((pm, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="capitalize">{pm.method}</span>
                  <span className="font-mono">₵{Math.abs(pm.amount).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {order.notes && (
              <>
                <Separator className="my-2" />
                <div className="text-sm">
                  <span className="text-muted-foreground">Notes: </span>
                  <span>{order.notes}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
