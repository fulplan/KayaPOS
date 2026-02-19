import { useEffect, useState } from "react";
import { db, type Batch, type Product, type ProductVariant } from "@/lib/db";
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
import { toast } from "@/hooks/use-toast";

interface BatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: Batch | null;
  productId: number | null;
  products: Product[];
  variants: ProductVariant[];
}

export default function BatchDialog({ open, onOpenChange, batch, productId, products, variants }: BatchDialogProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [batchNumber, setBatchNumber] = useState("");
  const [quantity, setQuantity] = useState("");
  const [remainingQuantity, setRemainingQuantity] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [manufacturingDate, setManufacturingDate] = useState("");
  const [supplier, setSupplier] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (batch) {
      setSelectedProductId(batch.productId.toString());
      setSelectedVariantId(batch.variantId?.toString() || "");
      setBatchNumber(batch.batchNumber);
      setQuantity(batch.quantity.toString());
      setRemainingQuantity(batch.remainingQuantity.toString());
      setCostPrice(batch.costPrice.toString());
      setExpiryDate(batch.expiryDate ? new Date(batch.expiryDate).toISOString().split("T")[0] : "");
      setManufacturingDate(batch.manufacturingDate ? new Date(batch.manufacturingDate).toISOString().split("T")[0] : "");
      setSupplier(batch.supplier || "");
      setNotes(batch.notes || "");
    } else {
      setSelectedProductId(productId?.toString() || "");
      setSelectedVariantId("");
      setBatchNumber(`BATCH-${Date.now().toString(36).toUpperCase()}`);
      setQuantity("");
      setRemainingQuantity("");
      setCostPrice("");
      setExpiryDate("");
      setManufacturingDate("");
      setSupplier("");
      setNotes("");
    }
  }, [batch, productId, open]);

  const productVariants = variants.filter(
    (v) => v.productId === parseInt(selectedProductId)
  );

  const handleSave = async () => {
    const pid = parseInt(selectedProductId);
    if (!pid || !batchNumber.trim() || !quantity || !costPrice) {
      toast({ title: "Missing Fields", description: "Product, batch number, quantity, and cost price are required.", variant: "destructive" });
      return;
    }

    const qty = parseInt(quantity);
    const remaining = remainingQuantity ? parseInt(remainingQuantity) : qty;

    try {
      if (batch?.id) {
        const oldBatch = await db.batches.get(batch.id);
        await db.batches.update(batch.id, {
          productId: pid,
          variantId: selectedVariantId ? parseInt(selectedVariantId) : undefined,
          batchNumber: batchNumber.trim(),
          quantity: qty,
          remainingQuantity: remaining,
          costPrice: parseFloat(costPrice),
          expiryDate: expiryDate ? new Date(expiryDate) : undefined,
          manufacturingDate: manufacturingDate ? new Date(manufacturingDate) : undefined,
          supplier: supplier.trim() || undefined,
          notes: notes.trim() || undefined,
        });

        if (oldBatch) {
          const stockDelta = remaining - oldBatch.remainingQuantity;
          if (stockDelta !== 0) {
            const product = await db.products.get(pid);
            if (product) {
              await db.products.update(pid, {
                stock: Math.max(0, product.stock + stockDelta),
                updatedAt: new Date(),
              });
            }
          }
        }
        toast({ title: "Batch Updated", description: batchNumber });
      } else {
        await db.batches.add({
          productId: pid,
          variantId: selectedVariantId ? parseInt(selectedVariantId) : undefined,
          batchNumber: batchNumber.trim(),
          quantity: qty,
          remainingQuantity: remaining,
          costPrice: parseFloat(costPrice),
          expiryDate: expiryDate ? new Date(expiryDate) : undefined,
          manufacturingDate: manufacturingDate ? new Date(manufacturingDate) : undefined,
          supplier: supplier.trim() || undefined,
          notes: notes.trim() || undefined,
          createdAt: new Date(),
        });

        const product = await db.products.get(pid);
        if (product) {
          await db.products.update(pid, {
            stock: product.stock + qty,
            updatedAt: new Date(),
          });
        }

        toast({ title: "Batch Created", description: `${batchNumber} - ${qty} units added to stock` });
      }
      onOpenChange(false);
    } catch {
      toast({ title: "Error", description: "Failed to save batch.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{batch ? "Edit Batch" : "Add Batch"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Product *</Label>
            <Select value={selectedProductId} onValueChange={(val) => { setSelectedProductId(val); setSelectedVariantId(""); }}>
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

          {productVariants.length > 0 && (
            <div className="space-y-2">
              <Label>Variant (Optional)</Label>
              <Select value={selectedVariantId} onValueChange={setSelectedVariantId}>
                <SelectTrigger>
                  <SelectValue placeholder="No specific variant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {productVariants.map((v) => (
                    <SelectItem key={v.id} value={v.id!.toString()}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Batch Number *</Label>
            <Input value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} placeholder="BATCH-001" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantity *</Label>
              <Input type="number" value={quantity} onChange={(e) => { setQuantity(e.target.value); if (!batch) setRemainingQuantity(e.target.value); }} placeholder="0" min="0" />
            </div>
            <div className="space-y-2">
              <Label>Remaining Qty</Label>
              <Input type="number" value={remainingQuantity} onChange={(e) => setRemainingQuantity(e.target.value)} placeholder="0" min="0" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cost Price (₵) *</Label>
            <Input type="number" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} placeholder="0.00" min="0" step="0.01" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Manufacturing Date</Label>
              <Input type="date" value={manufacturingDate} onChange={(e) => setManufacturingDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Supplier</Label>
            <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Supplier name" />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes about this batch" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>{batch ? "Update" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
