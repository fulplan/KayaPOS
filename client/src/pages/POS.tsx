import { useState, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { db, type Product } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Banknote, 
  Smartphone,
  ScanBarcode,
  Percent,
  Calculator,
  UserPlus,
  RefreshCcw,
  RotateCcw
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function POS() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSplitPaymentOpen, setIsSplitPaymentOpen] = useState(false);
  const [isDiscountOpen, setIsDiscountOpen] = useState(false);
  const [manualDiscount, setManualDiscount] = useState("0");
  const [paymentSplits, setPaymentSplits] = useState({
    cash: 0,
    card: 0,
    momo: 0,
    credit: 0
  });

  const barcodeBuffer = useRef("");
  const lastKeyTime = useRef(0);
  
  const products = useLiveQuery(() => db.products.toArray());
  const { 
    cart, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    taxRate,
    orderDiscount,
    setOrderDiscount
  } = useStore();

  // Barcode scanning logic
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      
      // Scanners are fast, humans are slow. 
      // If time between keys > 50ms, it's likely a human typing, not a scanner.
      if (now - lastKeyTime.current > 50) {
        barcodeBuffer.current = "";
      }
      lastKeyTime.current = now;

      if (e.key === "Enter") {
        if (barcodeBuffer.current.length > 2) {
          const product = products?.find(p => p.barcode === barcodeBuffer.current);
          if (product) {
            addToCart(product);
            toast({ title: "Product Scanned", description: product.name });
          } else {
            toast({ title: "Unknown Barcode", description: `No product found for ${barcodeBuffer.current}`, variant: "destructive" });
          }
        }
        barcodeBuffer.current = "";
      } else if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [products, addToCart]);

  const subtotal = cart.reduce((acc, item) => acc + ((item.price - item.discount) * item.quantity), 0);
  const taxAmount = subtotal * taxRate;
  const finalTotal = Math.max(0, subtotal + taxAmount - orderDiscount);

  const handleCheckout = async (type: 'single' | 'split' | 'refund' | 'return', method?: 'cash' | 'momo' | 'card' | 'credit') => {
    if (cart.length === 0) return;

    const isNegative = type === 'refund' || type === 'return';
    const multiplier = isNegative ? -1 : 1;

    const payments = type === 'single' || isNegative
      ? [{ method: method || 'cash', amount: finalTotal * multiplier }]
      : Object.entries(paymentSplits)
          .filter(([_, amt]) => amt > 0)
          .map(([m, amt]) => ({ method: m as any, amount: amt }));

    try {
      await db.orders.add({
        items: cart.map(item => ({
          productId: item.id!,
          name: item.name,
          price: item.price,
          quantity: item.quantity * multiplier,
          discount: item.discount
        })),
        subtotal: subtotal * multiplier,
        tax: taxAmount * multiplier,
        discount: orderDiscount * multiplier,
        total: finalTotal * multiplier,
        status: isNegative ? (type === 'refund' ? 'refunded' : 'cancelled') : 'completed',
        paymentMethods: payments,
        createdAt: new Date(),
        synced: false
      });

      toast({ 
        title: isNegative ? `${type.charAt(0).toUpperCase() + type.slice(1)} Success` : "Order Success", 
        description: `Total: ₵${(finalTotal * multiplier).toFixed(2)}` 
      });
      clearCart();
      setIsSplitPaymentOpen(false);
    } catch (e) {
      toast({ title: "Error", variant: "destructive", description: "Transaction failed" });
    }
  };

  const categories = Array.from(new Set(products?.map(p => p.category) || []));

  return (
    <div className="h-[calc(100vh-6rem)] flex gap-6">
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products or scan barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card h-12 text-lg shadow-sm"
            />
            <ScanBarcode className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary animate-pulse" />
          </div>
          <ScrollArea className="w-auto max-w-md whitespace-nowrap pb-2">
            <div className="flex gap-2">
              <Button 
                variant={selectedCategory === null ? "default" : "outline"} 
                onClick={() => setSelectedCategory(null)}
                className="rounded-full"
                size="sm"
              >
                All
              </Button>
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  onClick={() => setSelectedCategory(cat)}
                  className="rounded-full"
                  size="sm"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        <ScrollArea className="flex-1 rounded-xl border bg-card/50 p-4 shadow-inner">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products?.filter(p => 
              p.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
              (selectedCategory ? p.category === selectedCategory : true)
            ).map((product) => (
              <Card 
                key={product.id} 
                className="cursor-pointer hover:border-primary transition-all group overflow-hidden border-border/40 shadow-sm active:scale-95"
                onClick={() => addToCart(product)}
              >
                <div className="aspect-square bg-muted flex items-center justify-center font-bold text-3xl opacity-10 group-hover:opacity-30 transition-opacity bg-gradient-to-br from-primary/5 to-transparent">
                  {product.name.substring(0,2).toUpperCase()}
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-sm truncate group-hover:text-primary transition-colors">{product.name}</h3>
                  <div className="flex justify-between items-center mt-1">
                    <span className="font-extrabold text-primary text-base">₵{product.price.toFixed(2)}</span>
                    <Badge variant="secondary" className="text-[10px] font-mono px-1.5">{product.stock}</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      <Card className="w-[450px] flex flex-col shadow-2xl border-primary/10">
        <div className="p-4 border-b flex items-center justify-between bg-primary/5">
          <div className="flex items-center gap-2 font-bold text-primary">
            <ShoppingCart className="size-5" /> Cart Summary
          </div>
          <div className="flex gap-2">
            <Dialog open={isDiscountOpen} onOpenChange={setIsDiscountOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 border-primary/20 text-primary hover:bg-primary/10"><Percent className="size-4" /></Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Apply Order Discount</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Discount Amount (₵)</Label>
                    <Input type="number" value={manualDiscount} onChange={(e) => setManualDiscount(e.target.value)} autoFocus />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {['5', '10', '20', '50'].map(val => (
                      <Button key={val} variant="outline" onClick={() => setManualDiscount(val)}>₵{val}</Button>
                    ))}
                  </div>
                </div>
                <DialogFooter>
                  <Button className="w-full h-11" onClick={() => { setOrderDiscount(parseFloat(manualDiscount) || 0); setIsDiscountOpen(false); }}>Apply Discount</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="icon" className="h-9 w-9 text-rose-500 border-rose-100 hover:bg-rose-50" onClick={clearCart}><Trash2 className="size-4" /></Button>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-20 py-20">
              <ShoppingCart className="size-20 mb-4" />
              <p className="font-medium">No items in cart</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex gap-3 mb-6 group animate-in slide-in-from-right-4 duration-200">
                <div className="size-12 rounded-lg bg-muted flex items-center justify-center font-bold text-muted-foreground/40 shrink-0">
                  {item.name.substring(0,2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm truncate">{item.name}</h4>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1 border rounded-md p-0.5 bg-background">
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm" onClick={() => updateQuantity(item.id!, item.quantity - 1)}><Minus className="size-3" /></Button>
                      <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm" onClick={() => updateQuantity(item.id!, item.quantity + 1)}><Plus className="size-3" /></Button>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">@ ₵{item.price.toFixed(2)}</span>
                  </div>
                </div>
                <div className="text-right flex flex-col justify-between">
                  <div className="font-extrabold text-sm">₵{(item.price * item.quantity).toFixed(2)}</div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity self-end" onClick={() => removeFromCart(item.id!)}><Trash2 className="size-3" /></Button>
                </div>
              </div>
            ))
          )}
        </ScrollArea>

        <div className="p-5 border-t bg-muted/20 space-y-4">
          <div className="space-y-2 bg-background p-3 rounded-xl border border-border/40 shadow-sm">
            <div className="flex justify-between text-sm text-muted-foreground"><span>Subtotal</span><span className="font-mono">₵{subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm text-muted-foreground"><span>VAT (15%)</span><span className="font-mono">₵{taxAmount.toFixed(2)}</span></div>
            {orderDiscount > 0 && <div className="flex justify-between text-sm text-rose-500 font-medium"><span>Discount</span><span className="font-mono">-₵{orderDiscount.toFixed(2)}</span></div>}
            <Separator className="my-1.5" />
            <div className="flex justify-between font-black text-2xl text-primary items-baseline">
              <span>Total</span>
              <span className="font-mono">₵{finalTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button className="col-span-2 h-14 gap-3 text-xl font-black shadow-lg shadow-primary/20 transition-transform active:scale-95" onClick={() => handleCheckout('single', 'cash')}>
              <Banknote className="size-6" /> PAY CASH
            </Button>
            <Button variant="outline" className="h-11 gap-2 font-bold border-primary/20 text-primary hover:bg-primary/5" onClick={() => handleCheckout('single', 'momo')}>
              <Smartphone className="size-4" /> MOMO
            </Button>
            <Button variant="outline" className="h-11 gap-2 font-bold border-primary/20 text-primary hover:bg-primary/5" onClick={() => handleCheckout('single', 'card')}>
              <CreditCard className="size-4" /> CARD
            </Button>
            
            <Dialog open={isSplitPaymentOpen} onOpenChange={setIsSplitPaymentOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="col-span-2 h-11 gap-2 font-bold bg-primary/10 text-primary hover:bg-primary/20 border-none"><Calculator className="size-4" /> SPLIT PAYMENT</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle className="text-2xl font-black">Split Transaction</DialogTitle></DialogHeader>
                <div className="grid gap-5 py-6">
                  {Object.keys(paymentSplits).map((method) => (
                    <div key={method} className="space-y-2">
                      <Label className="capitalize font-bold text-muted-foreground">{method} Amount</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">₵</span>
                        <Input 
                          type="number" 
                          className="pl-7 font-mono text-lg"
                          value={paymentSplits[method as keyof typeof paymentSplits]} 
                          onChange={(e) => setPaymentSplits({...paymentSplits, [method]: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex justify-between items-center mt-2">
                    <span className="font-bold text-muted-foreground">Total Paid:</span>
                    <div className="text-right">
                      <div className={cn("text-2xl font-black font-mono", (paymentSplits.cash + paymentSplits.card + paymentSplits.momo + paymentSplits.credit).toFixed(2) === finalTotal.toFixed(2) ? "text-emerald-600" : "text-rose-500")}>
                        ₵{(paymentSplits.cash + paymentSplits.card + paymentSplits.momo + paymentSplits.credit).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Target: ₵{finalTotal.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button className="w-full h-12 text-lg font-bold" onClick={() => handleCheckout('split')} disabled={(paymentSplits.cash + paymentSplits.card + paymentSplits.momo + paymentSplits.credit).toFixed(2) !== finalTotal.toFixed(2)}>Confirm Split Payment</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="col-span-2 grid grid-cols-3 gap-2 mt-2">
              <Button variant="ghost" className="h-10 gap-2 text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100" onClick={() => handleCheckout('refund', 'cash')}>
                <RotateCcw className="size-4" /> Refund
              </Button>
              <Button variant="ghost" className="h-10 gap-2 text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-100" onClick={() => handleCheckout('return', 'cash')}>
                <RefreshCcw className="size-4" /> Return
              </Button>
              <Button variant="ghost" className="h-10 gap-2 text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100" onClick={() => handleCheckout('single', 'credit')}>
                <UserPlus className="size-4" /> Credit
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
