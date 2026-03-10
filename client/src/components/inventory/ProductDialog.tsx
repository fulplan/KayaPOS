import { useEffect, useState } from "react";
import { db, type Product, type Category } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  categories: Category[];
}

const DOSAGE_FORMS = [
  "Tablet", "Capsule", "Syrup", "Cream", "Ointment", "Injection", "Drops", "Inhaler", "Powder", "Other"
];

export default function ProductDialog({ open, onOpenChange, product, categories }: ProductDialogProps) {
  const businessSettings = useLiveQuery(() => db.businessSettings.toCollection().first());
  const businessType = businessSettings?.businessType || "retail";

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [stock, setStock] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("10");
  const [barcode, setBarcode] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [dosageForm, setDosageForm] = useState("");
  const [strength, setStrength] = useState("");
  const [requiresPrescription, setRequiresPrescription] = useState(false);
  const [manufacturer, setManufacturer] = useState("");
  const [serviceTime, setServiceTime] = useState("");
  const [servingSize, setServingSize] = useState("");

  useEffect(() => {
    if (product) {
      setName(product.name);
      setPrice(product.price.toString());
      setCategory(product.category);
      setNewCategory("");
      setStock(product.stock.toString());
      setLowStockThreshold(product.lowStockThreshold.toString());
      setBarcode(product.barcode || "");
      setSku(product.sku || "");
      setDescription(product.description || "");
      setImageUrl(product.image || "");
      setIsActive(product.isActive);
      setDosageForm(product.dosageForm || "");
      setStrength(product.strength || "");
      setRequiresPrescription(product.requiresPrescription || false);
      setManufacturer(product.manufacturer || "");
      setServiceTime(product.serviceTime?.toString() || "");
      setServingSize(product.servingSize || "");
    } else {
      setName("");
      setPrice("");
      setCategory("");
      setNewCategory("");
      setStock("");
      setLowStockThreshold("10");
      setBarcode("");
      setSku("");
      setDescription("");
      setImageUrl("");
      setIsActive(true);
      setDosageForm("");
      setStrength("");
      setRequiresPrescription(false);
      setManufacturer("");
      setServiceTime("");
      setServingSize("");
    }
  }, [product, open]);

  const handleSave = async () => {
    const finalCategory = category === "__new__" ? newCategory.trim() : category;
    if (!name.trim() || !finalCategory || finalCategory === "__new__" || !price) {
      toast({ title: "Missing Fields", description: "Name, price, and category are required.", variant: "destructive" });
      return;
    }

    if (newCategory.trim()) {
      const existing = await db.categories.where("name").equals(newCategory.trim()).first();
      if (!existing) {
        await db.categories.add({ name: newCategory.trim(), createdAt: new Date() });
      }
    }

    try {
      const productData: Partial<Product> = {
        name: name.trim(),
        price: parseFloat(price),
        category: finalCategory,
        stock: parseInt(stock) || 0,
        lowStockThreshold: parseInt(lowStockThreshold) || 10,
        barcode: barcode.trim() || undefined,
        sku: sku.trim() || undefined,
        description: description.trim() || undefined,
        image: imageUrl.trim() || undefined,
        isActive,
        dosageForm: dosageForm || undefined,
        strength: strength.trim() || undefined,
        requiresPrescription,
        manufacturer: manufacturer.trim() || undefined,
        serviceTime: serviceTime ? parseInt(serviceTime) : undefined,
        servingSize: servingSize.trim() || undefined,
        updatedAt: new Date(),
      };

      if (product?.id) {
        await db.products.update(product.id, productData);
        toast({ title: "Product Updated", description: name });
      } else {
        await db.products.add({
          ...productData,
          createdAt: new Date(),
        } as Product);
        toast({ title: "Product Created", description: name });
      }
      onOpenChange(false);
    } catch {
      toast({ title: "Error", description: "Failed to save product.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Create Product"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Product Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter product name" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Price (₵) *</Label>
              <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" min="0" step="0.01" />
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={category} onValueChange={(val) => { setCategory(val); setNewCategory(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                  ))}
                  <SelectItem value="__new__">+ New Category</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {category === "__new__" && (
            <div className="space-y-2">
              <Label>New Category Name</Label>
              <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Enter new category name" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Current Stock</Label>
              <Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" min="0" />
            </div>
            <div className="space-y-2">
              <Label>Low Stock Threshold</Label>
              <Input type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} placeholder="10" min="0" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Barcode</Label>
              <Input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-2">
              <Label>SKU</Label>
              <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Optional" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional product description" />
          </div>

          <div className="space-y-2">
            <Label>Image URL</Label>
            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg (optional)" />
            {imageUrl.trim() && (
              <div className="mt-2 rounded-lg border overflow-hidden w-20 h-20">
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
          </div>

          {businessType === "pharmacy" && (
            <>
              <Separator />
              <p className="text-sm font-medium text-muted-foreground">Pharmacy Details</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dosage Form</Label>
                  <Select value={dosageForm} onValueChange={setDosageForm}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select form" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOSAGE_FORMS.map(form => (
                        <SelectItem key={form} value={form}>{form}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Strength</Label>
                  <Input value={strength} onChange={(e) => setStrength(e.target.value)} placeholder="e.g. 500mg, 10ml" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Manufacturer</Label>
                <Input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} placeholder="Optional" />
              </div>
              <div className="flex items-center justify-between border rounded-lg p-3">
                <div>
                  <Label>Prescription Required</Label>
                  <p className="text-xs text-muted-foreground">Shows Rx badge and warns during checkout</p>
                </div>
                <Switch checked={requiresPrescription} onCheckedChange={setRequiresPrescription} />
              </div>
            </>
          )}

          {businessType === "salon" && (
            <>
              <Separator />
              <p className="text-sm font-medium text-muted-foreground">Salon Details</p>
              <div className="space-y-2">
                <Label>Service Time (minutes)</Label>
                <Input type="number" value={serviceTime} onChange={(e) => setServiceTime(e.target.value)} placeholder="e.g. 30, 60" min="0" />
              </div>
            </>
          )}

          {businessType === "restaurant" && (
            <>
              <Separator />
              <p className="text-sm font-medium text-muted-foreground">Restaurant Details</p>
              <div className="space-y-2">
                <Label>Serving Size</Label>
                <Input value={servingSize} onChange={(e) => setServingSize(e.target.value)} placeholder="e.g. 1 plate, 500ml" />
              </div>
            </>
          )}

          <div className="flex items-center justify-between border rounded-lg p-3">
            <div>
              <Label>Active Product</Label>
              <p className="text-xs text-muted-foreground">Inactive products won't appear in POS</p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>{product ? "Update" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
