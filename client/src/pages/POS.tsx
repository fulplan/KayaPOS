import { useState } from "react";
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
  Smartphone 
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function POS() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const products = useLiveQuery(
    () => db.products.toArray()
  );
  
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart } = useStore();
  
  const filteredProducts = products?.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(products?.map(p => p.category) || []));

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleCheckout = async (paymentMethod: 'cash' | 'momo' | 'card') => {
    if (cart.length === 0) return;

    try {
      await db.orders.add({
        items: cart.map(item => ({
          productId: item.id!,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        total: cartTotal,
        status: 'completed',
        paymentMethod,
        createdAt: new Date(),
        synced: false
      });

      toast({
        title: "Order Completed",
        description: `Order successfully processed via ${paymentMethod}.`,
      });
      
      clearCart();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process order.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex gap-6">
      {/* Left Side: Products */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card"
            />
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

        <ScrollArea className="flex-1 rounded-xl border bg-card/50 p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts?.map((product) => (
              <Card 
                key={product.id} 
                className="cursor-pointer hover:border-primary transition-all hover:shadow-md group overflow-hidden"
                onClick={() => addToCart(product)}
              >
                <div className="aspect-square bg-muted flex items-center justify-center relative">
                  <span className="text-4xl font-bold text-muted-foreground/20 group-hover:scale-110 transition-transform duration-300">
                    {product.name.substring(0, 2).toUpperCase()}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <span className="text-white font-medium text-sm">Add to Cart</span>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm truncate" title={product.name}>{product.name}</h3>
                  <div className="flex justify-between items-center mt-1">
                    <span className="font-bold text-primary">₵{product.price.toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground">{product.stock} left</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right Side: Cart */}
      <Card className="w-[400px] flex flex-col shadow-lg border-border/60">
        <div className="p-4 border-b flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2 font-semibold">
            <ShoppingCart className="size-5" />
            Current Order
          </div>
          <Badge variant="secondary">{cart.length} Items</Badge>
        </div>

        <ScrollArea className="flex-1 p-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2 min-h-[300px]">
              <ShoppingCart className="size-12 opacity-20" />
              <p>Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-3 items-start group">
                  <div className="size-12 rounded-md bg-muted flex items-center justify-center font-bold text-muted-foreground/50 text-xs shrink-0">
                    {item.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{item.name}</h4>
                    <p className="text-xs text-muted-foreground">₵{item.price.toFixed(2)} / unit</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-bold text-sm">₵{(item.price * item.quantity).toFixed(2)}</span>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="size-6 rounded-full"
                        onClick={() => updateQuantity(item.id!, item.quantity - 1)}
                      >
                        <Minus className="size-3" />
                      </Button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="size-6 rounded-full"
                        onClick={() => updateQuantity(item.id!, item.quantity + 1)}
                      >
                        <Plus className="size-3" />
                      </Button>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="size-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeFromCart(item.id!)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t bg-muted/10 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₵{cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax (0%)</span>
              <span>₵0.00</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">₵{cartTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button 
              variant="outline" 
              className="flex flex-col gap-1 h-auto py-3 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors"
              onClick={() => handleCheckout('cash')}
              disabled={cart.length === 0}
            >
              <Banknote className="size-5" />
              <span className="text-xs">Cash</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col gap-1 h-auto py-3 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 transition-colors"
              onClick={() => handleCheckout('card')}
              disabled={cart.length === 0}
            >
              <CreditCard className="size-5" />
              <span className="text-xs">Card</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col gap-1 h-auto py-3 hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-200 transition-colors"
              onClick={() => handleCheckout('momo')}
              disabled={cart.length === 0}
            >
              <Smartphone className="size-5" />
              <span className="text-xs">MoMo</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
