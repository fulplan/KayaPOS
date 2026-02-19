import { useEffect, useState } from "react";
import { db, type ProductVariant, type Product } from "@/lib/db";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface VariantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: ProductVariant | null;
  productId: number | null;
  products: Product[];
}

export default function VariantDialog({ open, onOpenChange, variant, productId, products }: VariantDialogProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [attributes, setAttributes] = useState<Record<string, string>>({});
  const [newAttrKey, setNewAttrKey] = useState("");
  const [newAttrValue, setNewAttrValue] = useState("");

  useEffect(() => {
    if (variant) {
      setSelectedProductId(variant.productId.toString());
      setName(variant.name);
      setSku(variant.sku || "");
      setBarcode(variant.barcode || "");
      setPrice(variant.price.toString());
      setStock(variant.stock.toString());
      setAttributes({ ...variant.attributes });
    } else {
      setSelectedProductId(productId?.toString() || "");
      setName("");
      setSku("");
      setBarcode("");
      setPrice("");
      setStock("");
      setAttributes({});
    }
    setNewAttrKey("");
    setNewAttrValue("");
  }, [variant, productId, open]);

  const addAttribute = () => {
    if (!newAttrKey.trim()) return;
    setAttributes((prev) => ({ ...prev, [newAttrKey.trim()]: newAttrValue.trim() }));
    setNewAttrKey("");
    setNewAttrValue("");
  };

  const removeAttribute = (key: string) => {
    const updated = { ...attributes };
    delete updated[key];
    setAttributes(updated);
  };

  const handleSave = async () => {
    const pid = parseInt(selectedProductId);
    if (!pid || !name.trim() || !price) {
      toast({ title: "Missing Fields", description: "Product, name, and price are required.", variant: "destructive" });
      return;
    }

    const parentProduct = products.find(p => p.id === pid);

    try {
      if (variant?.id) {
        await db.variants.update(variant.id, {
          productId: pid,
          name: name.trim(),
          sku: sku.trim() || undefined,
          barcode: barcode.trim() || undefined,
          price: parseFloat(price),
          stock: parseInt(stock) || 0,
          attributes,
        });
        toast({ title: "Variant Updated", description: `${parentProduct?.name} - ${name}` });
      } else {
        await db.variants.add({
          productId: pid,
          name: name.trim(),
          sku: sku.trim() || undefined,
          barcode: barcode.trim() || undefined,
          price: parseFloat(price),
          stock: parseInt(stock) || 0,
          attributes,
        });
        toast({ title: "Variant Created", description: `${parentProduct?.name} - ${name}` });
      }
      onOpenChange(false);
    } catch {
      toast({ title: "Error", description: "Failed to save variant.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{variant ? "Edit Variant" : "Add Variant"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Product *</Label>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.filter(p => p.isActive).map((p) => (
                  <SelectItem key={p.id} value={p.id!.toString()}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Variant Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Large, Red, 500ml" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Price (₵) *</Label>
              <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" min="0" step="0.01" />
            </div>
            <div className="space-y-2">
              <Label>Stock</Label>
              <Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" min="0" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>SKU</Label>
              <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-2">
              <Label>Barcode</Label>
              <Input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Optional" />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Attributes</Label>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(attributes).map(([key, val]) => (
                <Badge key={key} variant="secondary" className="gap-1 px-2 py-1">
                  {key}: {val}
                  <button onClick={() => removeAttribute(key)} className="ml-1 hover:text-destructive">
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newAttrKey}
                onChange={(e) => setNewAttrKey(e.target.value)}
                placeholder="Key (e.g. Size)"
                className="flex-1"
              />
              <Input
                value={newAttrValue}
                onChange={(e) => setNewAttrValue(e.target.value)}
                placeholder="Value (e.g. Large)"
                className="flex-1"
              />
              <Button variant="outline" size="icon" onClick={addAttribute} type="button">
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>{variant ? "Update" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
