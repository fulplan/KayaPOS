import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
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
import { Search, CloudOff, CloudCog } from "lucide-react";
import { useState } from "react";

export default function Transactions() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const orders = useLiveQuery(
    () => db.orders.orderBy('createdAt').reverse().toArray()
  );

  const filteredOrders = orders?.filter(order => 
    order.id?.toString().includes(searchQuery) ||
    order.paymentMethods.some(pm => pm.method.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground">History of all offline and online sales.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-1">
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>
              Managing {orders?.length || 0} transactions.
            </CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search orders..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Order ID</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Payment Methods</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead className="text-right">Sync Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.id}</TableCell>
                  <TableCell>
                    {format(new Date(order.createdAt), 'MMM d, yyyy h:mm a')}
                  </TableCell>
                  <TableCell className="capitalize flex gap-1 flex-wrap">
                    {order.paymentMethods.map((pm, i) => (
                      <Badge key={i} variant="outline" className="capitalize text-[10px]">
                        {pm.method}: ₵{pm.amount.toFixed(2)}
                      </Badge>
                    ))}
                  </TableCell>
                  <TableCell>{order.items.length} items</TableCell>
                  <TableCell className="text-right font-bold">
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
                          <CloudOff className="mr-1 size-3" /> Offline
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!filteredOrders || filteredOrders.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No transactions found.
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
