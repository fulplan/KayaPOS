import { useState } from "react";
import { db, type Quote } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { useStore, type CartItem } from "@/lib/store";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, ShoppingCart, Trash2, Eye, MoreHorizontal } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Quotes() {
  const quotes = useLiveQuery(() => db.quotes.orderBy('createdAt').reverse().toArray());
  const { loadCart, setOrderDiscount, setTaxRule } = useStore();
  const [, setLocation] = useLocation();
  const [deleteTarget, setDeleteTarget] = useState<Quote | null>(null);
  const [viewingQuote, setViewingQuote] = useState<Quote | null>(null);

  const handleConvertToSale = async (quote: Quote) => {
    const cartItems: CartItem[] = [];
    for (const item of quote.items) {
      const product = await db.products.get(item.productId);
      if (product) {
        cartItems.push({ ...product, quantity: item.quantity, discount: item.discount || 0 });
      }
    }

    if (cartItems.length === 0) {
      toast({ title: "Error", description: "Products in this quote are no longer available.", variant: "destructive" });
      return;
    }

    loadCart(cartItems);
    if (quote.discountType && quote.discount > 0) {
      const discountVal = quote.discountType === 'percentage' && quote.taxRate !== undefined
        ? (quote.discount / ((quote.subtotal + quote.subtotal * quote.taxRate) || 1)) * 100
        : quote.discount;
      setOrderDiscount(discountVal, quote.discountType);
    }
    if (quote.taxRuleName && quote.taxRate !== undefined) {
      setTaxRule(quote.taxRuleName, quote.taxRate);
    }

    await db.quotes.update(quote.id!, { status: 'converted' });
    toast({ title: "Quote Loaded to POS", description: `${cartItems.length} items loaded. Complete the sale in POS.` });
    setLocation("/pos");
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    await db.quotes.delete(deleteTarget.id);
    toast({ title: "Quote Deleted" });
    setDeleteTarget(null);
  };

  const getStatusBadge = (quote: Quote) => {
    if (quote.status === 'converted') {
      return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">Converted</Badge>;
    }
    if (quote.validUntil && new Date(quote.validUntil) < new Date()) {
      return <Badge variant="destructive" className="text-[10px]">Expired</Badge>;
    }
    return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px]">Active</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Quotes</h1>
        <p className="text-muted-foreground">Manage price quotes for customers.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quotes?.length || 0}</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quotes?.filter(q => q.status === 'active' && (!q.validUntil || new Date(q.validUntil) >= new Date())).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Converted</CardTitle>
            <ShoppingCart className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quotes?.filter(q => q.status === 'converted').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <ScrollArea className="w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes?.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium">{format(new Date(quote.createdAt), 'MMM d, h:mm a')}</TableCell>
                  <TableCell>{quote.customerName || "-"}</TableCell>
                  <TableCell>{quote.items.length} items</TableCell>
                  <TableCell className="text-right font-mono font-bold">₵{quote.total.toFixed(2)}</TableCell>
                  <TableCell>
                    {quote.validUntil ? format(new Date(quote.validUntil), 'MMM d, yyyy') : "-"}
                  </TableCell>
                  <TableCell>{getStatusBadge(quote)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewingQuote(quote)}>
                          <Eye className="size-4 mr-2" /> View Details
                        </DropdownMenuItem>
                        {quote.status === 'active' && (!quote.validUntil || new Date(quote.validUntil) >= new Date()) && (
                          <DropdownMenuItem onClick={() => handleConvertToSale(quote)}>
                            <ShoppingCart className="size-4 mr-2" /> Convert to Sale
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(quote)}>
                          <Trash2 className="size-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {(!quotes || quotes.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                    No quotes yet. Create one from the POS terminal.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      <Dialog open={!!viewingQuote} onOpenChange={(open) => !open && setViewingQuote(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Quote Details</DialogTitle>
          </DialogHeader>
          {viewingQuote && (
            <div className="space-y-4 py-2">
              {viewingQuote.customerName && (
                <div className="text-sm"><span className="text-muted-foreground">Customer:</span> <span className="font-medium">{viewingQuote.customerName}</span></div>
              )}
              <div className="border rounded-lg divide-y">
                {viewingQuote.items.map((item, i) => (
                  <div key={i} className="flex justify-between p-3 text-sm">
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                    </div>
                    <span className="font-mono">₵{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-mono">₵{viewingQuote.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span className="font-mono">₵{viewingQuote.tax.toFixed(2)}</span></div>
                {viewingQuote.discount > 0 && (
                  <div className="flex justify-between text-rose-500"><span>Discount</span><span className="font-mono">-₵{viewingQuote.discount.toFixed(2)}</span></div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2"><span>Total</span><span className="font-mono">₵{viewingQuote.total.toFixed(2)}</span></div>
              </div>
              {viewingQuote.notes && (
                <div className="text-sm bg-muted/50 p-3 rounded-lg"><span className="text-muted-foreground">Notes:</span> {viewingQuote.notes}</div>
              )}
              {viewingQuote.status === 'active' && (!viewingQuote.validUntil || new Date(viewingQuote.validUntil) >= new Date()) && (
                <Button className="w-full gap-2" onClick={() => { setViewingQuote(null); handleConvertToSale(viewingQuote); }}>
                  <ShoppingCart className="size-4" /> Convert to Sale
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quote?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this quote.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
