import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { db, type Order } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  DollarSign, 
  ShoppingBag, 
  TrendingUp, 
  Users, 
  ArrowUpRight,
  ArrowDownRight
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
import { format } from "date-fns";
import { useLiveQuery } from "dexie-react-hooks";

const chartData = [
  { name: "Mon", total: 1200 },
  { name: "Tue", total: 2100 },
  { name: "Wed", total: 1800 },
  { name: "Thu", total: 2400 },
  { name: "Fri", total: 3200 },
  { name: "Sat", total: 4500 },
  { name: "Sun", total: 3800 },
];

export default function Dashboard() {
  const orders = useLiveQuery(() => db.orders.orderBy('createdAt').reverse().limit(5).toArray());
  const [totalSales, setTotalSales] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      const allOrders = await db.orders.toArray();
      const sales = allOrders.reduce((acc, order) => acc + order.total, 0);
      setTotalSales(sales);
      setTotalOrders(allOrders.length);
    };
    fetchStats();
  }, [orders]); // Refresh when orders change

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
            <div className="text-2xl font-bold">₵{totalSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <span className="text-emerald-500 flex items-center"><ArrowUpRight className="size-3" /> +20.1%</span> from last month
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{totalOrders}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <span className="text-emerald-500 flex items-center"><ArrowUpRight className="size-3" /> +12.5%</span> from last month
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Items</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <span className="text-emerald-500 flex items-center"><ArrowUpRight className="size-3" /> +4.3%</span> from last month
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+573</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <span className="text-rose-500 flex items-center"><ArrowDownRight className="size-3" /> -2.1%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Daily revenue for the current week.</CardDescription>
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
              You made {orders?.length || 0} sales recently.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders?.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {format(new Date(order.createdAt), 'h:mm a')}
                    </TableCell>
                    <TableCell>₵{order.total.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                        {order.paymentMethod}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {(!orders || orders.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No recent sales found
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
