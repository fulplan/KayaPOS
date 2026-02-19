import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  DollarSign, 
  ShoppingBag, 
  TrendingUp, 
  Users, 
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Area, 
  AreaChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { format, subDays, startOfDay, startOfMonth, subMonths, endOfMonth } from "date-fns";
import { useLiveQuery } from "dexie-react-hooks";

export default function Dashboard() {
  const allOrders = useLiveQuery(() => db.orders.toArray());
  const allProducts = useLiveQuery(() => db.products.toArray());
  const allCustomers = useLiveQuery(() => db.customers.toArray());

  const completedOrders = allOrders?.filter(o => o.status !== 'draft') || [];

  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const thisMonthOrders = completedOrders.filter(o => new Date(o.createdAt) >= thisMonthStart);
  const lastMonthOrders = completedOrders.filter(o => {
    const d = new Date(o.createdAt);
    return d >= lastMonthStart && d <= lastMonthEnd;
  });

  const thisMonthRevenue = thisMonthOrders.reduce((acc, o) => acc + o.total, 0);
  const lastMonthRevenue = lastMonthOrders.reduce((acc, o) => acc + o.total, 0);
  const revenueChange = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

  const thisMonthOrderCount = thisMonthOrders.length;
  const lastMonthOrderCount = lastMonthOrders.length;
  const orderChange = lastMonthOrderCount > 0 ? ((thisMonthOrderCount - lastMonthOrderCount) / lastMonthOrderCount) * 100 : 0;

  const activeProducts = allProducts?.filter(p => p.isActive).length || 0;
  const customerCount = allCustomers?.length || 0;

  const totalRevenue = completedOrders.reduce((acc, o) => acc + o.total, 0);
  const totalOrderCount = completedOrders.length;

  const chartData = Array.from({ length: 7 }, (_, i) => {
    const day = subDays(now, 6 - i);
    const dayStart = startOfDay(day);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const dayTotal = completedOrders
      .filter(o => {
        const d = new Date(o.createdAt);
        return d >= dayStart && d < dayEnd;
      })
      .reduce((acc, o) => acc + o.total, 0);

    return {
      name: format(day, 'EEE'),
      total: Math.round(dayTotal * 100) / 100,
    };
  });

  const recentSales = completedOrders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const ChangeIndicator = ({ value }: { value: number }) => {
    if (value === 0) return (
      <span className="text-muted-foreground flex items-center"><Minus className="size-3" /> 0%</span>
    );
    if (value > 0) return (
      <span className="text-emerald-500 flex items-center"><ArrowUpRight className="size-3" /> +{value.toFixed(1)}%</span>
    );
    return (
      <span className="text-rose-500 flex items-center"><ArrowDownRight className="size-3" /> {value.toFixed(1)}%</span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your business performance.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₵{totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <ChangeIndicator value={revenueChange} /> from last month
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrderCount}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <ChangeIndicator value={orderChange} /> from last month
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Items</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              products in your inventory
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              registered customers
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Daily revenue for the last 7 days.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="name" 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `₵${value}`} 
                  />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      borderRadius: "8px", 
                      border: "1px solid hsl(var(--border))",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                    }}
                    formatter={(value) => [`₵${value}`, "Revenue"]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorTotal)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>
              {recentSales.length > 0 ? `Last ${recentSales.length} completed sales.` : 'No sales yet.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Payment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSales.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {format(new Date(order.createdAt), 'MMM d, h:mm a')}
                    </TableCell>
                    <TableCell className="font-mono">₵{order.total.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className={
                        order.status === 'refunded' ? "bg-rose-500/10 text-rose-600 border-rose-500/20" :
                        order.status === 'cancelled' ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                        "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      }>
                        {order.status === 'refunded' ? 'Refund' :
                         order.status === 'cancelled' ? 'Return' :
                         order.paymentMethods[0]?.method || 'N/A'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {recentSales.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No sales yet. Make your first sale in POS.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
