import { useState, useEffect, useRef } from "react";
import { useStore, type CartItem } from "@/lib/store";
import { db, type Product, type TaxRule } from "@/lib/db";
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
  RotateCcw,
  Save,
  FileText,
  FolderOpen,
  X
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
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function POS() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSplitPaymentOpen, setIsSplitPaymentOpen] = useState(false);
  const [isDiscountOpen, setIsDiscountOpen] = useState(false);
  const [isDraftsOpen, setIsDraftsOpen] = useState(false);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [manualDiscount, setManualDiscount] = useState("0");
  const [discountMode, setDiscountMode] = useState<'flat' | 'percentage'>('flat');
  const [quoteName, setQuoteName] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [quoteValidDays, setQuoteValidDays] = useState("30");
  const [paymentSplits, setPaymentSplits] = useState({
    cash: 0,
    card: 0,
    momo: 0,
    credit: 0
  });

  const barcodeBuffer = useRef("");
  const lastKeyTime = useRef(0);

  const products = useLiveQuery(() => db.products.toArray().then(ps => ps.filter(p => p.isActive !== false)));
  const taxRules = useLiveQuery(() => db.taxRules.toArray().then(rs => rs.filter(r => r.isActive !== false)));
  const drafts = useLiveQuery(() => db.orders.where('status').equals('draft').toArray());
  const {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    loadCart,
    taxRate,
    taxRuleName,
    setTaxRule,
    orderDiscount,
    discountType,
    setOrderDiscount
  } = useStore();

  useEffect(() => {
    const loadDefaultTax = async () => {
      const allRules = await db.taxRules.toArray();
      const defaultRule = allRules.find(r => r.isDefault);
      if (defaultRule) {
        setTaxRule(defaultRule.name, defaultRule.rate);
      }
    };
    loadDefaultTax();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
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
  const computedDiscount = discountType === 'percentage'
    ? (subtotal + taxAmount) * (orderDiscount / 100)
    : orderDiscount;
  const finalTotal = Math.max(0, subtotal + taxAmount - computedDiscount);

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
        taxRuleName,
        taxRate,
        discount: computedDiscount * multiplier,
        discountType,
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

  const handleSaveDraft = async () => {
    if (cart.length === 0) return;
    try {
      await db.orders.add({
        items: cart.map(item => ({
          productId: item.id!,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          discount: item.discount
        })),
        subtotal,
        tax: taxAmount,
        taxRuleName,
        taxRate,
        discount: computedDiscount,
        discountType,
        total: finalTotal,
        status: 'draft',
        paymentMethods: [],
        createdAt: new Date(),
        synced: false,
        notes: `Draft saved at ${new Date().toLocaleTimeString()}`
      });
      toast({ title: "Draft Saved", description: `${cart.length} items saved for later` });
      clearCart();
    } catch {
      toast({ title: "Error", variant: "destructive", description: "Failed to save draft" });
    }
  };

  const handleLoadDraft = async (draftId: number) => {
    const draft = await db.orders.get(draftId);
    if (!draft) return;

    const cartItems: CartItem[] = [];
    for (const item of draft.items) {
      const product = await db.products.get(item.productId);
      if (product) {
        cartItems.push({ ...product, quantity: item.quantity, discount: item.discount || 0 });
      }
    }

    loadCart(cartItems);
    if (draft.discountType) {
      setOrderDiscount(
        draft.discountType === 'percentage' && draft.taxRate !== undefined
          ? (draft.discount / ((draft.subtotal + draft.subtotal * draft.taxRate) || 1)) * 100
          : draft.discount,
        draft.discountType
      );
    }

    await db.orders.delete(draftId);
    toast({ title: "Draft Loaded", description: `${cartItems.length} items restored` });
    setIsDraftsOpen(false);
  };

  const handleDeleteDraft = async (draftId: number) => {
    await db.orders.delete(draftId);
    toast({ title: "Draft Deleted" });
  };

  const handleSaveQuote = async () => {
    if (cart.length === 0) return;
    try {
      const validDays = parseInt(quoteValidDays) || 30;
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + validDays);

      await db.quotes.add({
        items: cart.map(item => ({
          productId: item.id!,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          discount: item.discount
        })),
        subtotal,
        tax: taxAmount,
        taxRuleName,
        taxRate,
        discount: computedDiscount,
        discountType,
        total: finalTotal,
        customerName: quoteName.trim() || undefined,
        notes: quoteNotes.trim() || undefined,
        validUntil,
        status: 'active',
        createdAt: new Date(),
      });
      toast({ title: "Quote Created", description: `Valid for ${validDays} days` });
      clearCart();
      setIsQuoteOpen(false);
      setQuoteName("");
      setQuoteNotes("");
    } catch {
      toast({ title: "Error", variant: "destructive", description: "Failed to create quote" });
    }
  };

  const categories = Array.from(new Set(products?.map(p => p.category) || []));

  const applyDiscount = () => {
    const val = parseFloat(manualDiscount) || 0;
    if (discountMode === 'percentage' && val > 100) {
      toast({ title: "Invalid", description: "Percentage cannot exceed 100%", variant: "destructive" });
      return;
    }
    setOrderDiscount(val, discountMode);
    setIsDiscountOpen(false);
  };

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
          <div className="flex gap-1.5">
            <Dialog open={isDiscountOpen} onOpenChange={setIsDiscountOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 border-primary/20 text-primary hover:bg-primary/10"><Percent className="size-4" /></Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Apply Order Discount</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex gap-2">
                    <Button
                      variant={discountMode === 'flat' ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => setDiscountMode('flat')}
                    >
                      ₵ Fixed Amount
                    </Button>
                    <Button
                      variant={discountMode === 'percentage' ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => setDiscountMode('percentage')}
                    >
                      % Percentage
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>{discountMode === 'flat' ? 'Discount Amount (₵)' : 'Discount Percentage (%)'}</Label>
                    <Input
                      type="number"
                      value={manualDiscount}
                      onChange={(e) => setManualDiscount(e.target.value)}
                      max={discountMode === 'percentage' ? 100 : undefined}
                      min="0"
                      autoFocus
                    />
                  </div>
                  {discountMode === 'flat' ? (
                    <div className="grid grid-cols-4 gap-2">
                      {['5', '10', '20', '50'].map(val => (
                        <Button key={val} variant="outline" onClick={() => setManualDiscount(val)}>₵{val}</Button>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {['5', '10', '15', '25'].map(val => (
                        <Button key={val} variant="outline" onClick={() => setManualDiscount(val)}>{val}%</Button>
                      ))}
                    </div>
                  )}
                  {discountMode === 'percentage' && subtotal > 0 && (
                    <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      Discount: ₵{((subtotal + taxAmount) * ((parseFloat(manualDiscount) || 0) / 100)).toFixed(2)} off ₵{(subtotal + taxAmount).toFixed(2)}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setOrderDiscount(0, 'flat'); setIsDiscountOpen(false); }}>Remove Discount</Button>
                  <Button onClick={applyDiscount}>Apply Discount</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="icon" className="h-9 w-9 border-primary/20 text-primary hover:bg-primary/10" onClick={handleSaveDraft} title="Save as Draft">
              <Save className="size-4" />
            </Button>

            <Dialog open={isDraftsOpen} onOpenChange={setIsDraftsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 border-primary/20 text-primary hover:bg-primary/10 relative" title="Open Drafts">
                  <FolderOpen className="size-4" />
                  {drafts && drafts.length > 0 && (
                    <span className="absolute -top-1 -right-1 size-4 bg-primary text-[10px] text-primary-foreground rounded-full flex items-center justify-center font-bold">{drafts.length}</span>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Saved Drafts</DialogTitle></DialogHeader>
                <div className="space-y-3 py-4 max-h-[400px] overflow-y-auto">
                  {drafts?.map((draft) => (
                    <div key={draft.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div>
                        <div className="font-medium text-sm">{draft.items.length} items - ₵{draft.total.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">{new Date(draft.createdAt).toLocaleString()}</div>
                        {draft.notes && <div className="text-xs text-muted-foreground mt-1">{draft.notes}</div>}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleLoadDraft(draft.id!)}>Load</Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteDraft(draft.id!)}><Trash2 className="size-4" /></Button>
                      </div>
                    </div>
                  ))}
                  {(!drafts || drafts.length === 0) && (
                    <p className="text-center text-muted-foreground py-8">No saved drafts</p>
                  )}
                </div>
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
            <div className="flex justify-between text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                {taxRuleName}
                {taxRules && taxRules.length > 1 && (
                  <Select value={taxRuleName} onValueChange={(val) => {
                    const rule = taxRules.find(r => r.name === val);
                    if (rule) setTaxRule(rule.name, rule.rate);
                  }}>
                    <SelectTrigger className="h-5 w-5 p-0 border-0 shadow-none [&>svg]:size-3">
                      <span></span>
                    </SelectTrigger>
                    <SelectContent>
                      {taxRules.map(rule => (
                        <SelectItem key={rule.id} value={rule.name}>{rule.name} ({(rule.rate * 100).toFixed(0)}%)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </span>
              <span className="font-mono">₵{taxAmount.toFixed(2)}</span>
            </div>
            {computedDiscount > 0 && (
              <div className="flex justify-between text-sm text-rose-500 font-medium">
                <span>Discount {discountType === 'percentage' ? `(${orderDiscount}%)` : ''}</span>
                <span className="font-mono">-₵{computedDiscount.toFixed(2)}</span>
              </div>
            )}
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

            <Dialog open={isQuoteOpen} onOpenChange={setIsQuoteOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="h-10 gap-2 font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border-none"><FileText className="size-4" /> Quote</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create Quote</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Customer Name (Optional)</Label>
                    <Input value={quoteName} onChange={(e) => setQuoteName(e.target.value)} placeholder="Customer name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes (Optional)</Label>
                    <Input value={quoteNotes} onChange={(e) => setQuoteNotes(e.target.value)} placeholder="Any notes for this quote" />
                  </div>
                  <div className="space-y-2">
                    <Label>Valid For (Days)</Label>
                    <Input type="number" value={quoteValidDays} onChange={(e) => setQuoteValidDays(e.target.value)} min="1" />
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-sm">
                    <div className="flex justify-between"><span>Items:</span><span>{cart.length}</span></div>
                    <div className="flex justify-between font-bold"><span>Total:</span><span>₵{finalTotal.toFixed(2)}</span></div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsQuoteOpen(false)}>Cancel</Button>
                  <Button onClick={handleSaveQuote} disabled={cart.length === 0}>Create Quote</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="grid grid-cols-3 gap-2">
              <Button variant="ghost" className="h-10 gap-1.5 text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 text-xs" onClick={() => handleCheckout('refund', 'cash')}>
                <RotateCcw className="size-3.5" /> Refund
              </Button>
              <Button variant="ghost" className="h-10 gap-1.5 text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-100 text-xs" onClick={() => handleCheckout('return', 'cash')}>
                <RefreshCcw className="size-3.5" /> Return
              </Button>
              <Button variant="ghost" className="h-10 gap-1.5 text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 text-xs" onClick={() => handleCheckout('single', 'credit')}>
                <UserPlus className="size-3.5" /> Credit
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
