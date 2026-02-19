import { useState } from "react";
import { db, type Product, type Category, type ProductVariant, type Batch } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Search,
  Plus,
  Package,
  AlertTriangle,
  Tag,
  Layers,
  Boxes,
  Calendar,
  Edit,
  Trash2,
  Archive,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import ProductDialog from "@/components/inventory/ProductDialog";
import CategoryDialog from "@/components/inventory/CategoryDialog";
import VariantDialog from "@/components/inventory/VariantDialog";
import BatchDialog from "@/components/inventory/BatchDialog";

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("products");

  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [variantProductId, setVariantProductId] = useState<number | null>(null);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [batchProductId, setBatchProductId] = useState<number | null>(null);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: number; name: string } | null>(null);

  const products = useLiveQuery(() => db.products.toArray());
  const categories = useLiveQuery(() => db.categories.toArray());
  const variants = useLiveQuery(() => db.variants.toArray());
  const batches = useLiveQuery(() => db.batches.toArray());

  const lowStockProducts = products?.filter(
    (p) => p.isActive && p.stock <= p.lowStockThreshold
  );

  const expiringSoonBatches = batches?.filter((b) => {
    if (!b.expiryDate || b.remainingQuantity <= 0) return false;
    const daysUntilExpiry = Math.ceil(
      (new Date(b.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 30;
  });

  const filteredProducts = products?.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q));
    return matchesSearch && (selectedCategory ? p.category === selectedCategory : true);
  });

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "product") {
        await db.products.delete(deleteTarget.id);
        await db.variants.where("productId").equals(deleteTarget.id).delete();
        await db.batches.where("productId").equals(deleteTarget.id).delete();
      } else if (deleteTarget.type === "category") {
        await db.categories.delete(deleteTarget.id);
      } else if (deleteTarget.type === "variant") {
        await db.variants.delete(deleteTarget.id);
      } else if (deleteTarget.type === "batch") {
        const batchToDelete = await db.batches.get(deleteTarget.id);
        if (batchToDelete && batchToDelete.remainingQuantity > 0) {
          const product = await db.products.get(batchToDelete.productId);
          if (product) {
            await db.products.update(batchToDelete.productId, {
              stock: Math.max(0, product.stock - batchToDelete.remainingQuantity),
              updatedAt: new Date(),
            });
          }
        }
        await db.batches.delete(deleteTarget.id);
      }
      toast({ title: "Deleted", description: `${deleteTarget.name} has been removed.` });
    } catch {
      toast({ title: "Error", description: "Failed to delete item.", variant: "destructive" });
    }
    setDeleteTarget(null);
  };

  const toggleProductActive = async (product: Product) => {
    await db.products.update(product.id!, { isActive: !product.isActive, updatedAt: new Date() });
    toast({
      title: product.isActive ? "Product Deactivated" : "Product Activated",
      description: product.name,
    });
  };

  const uniqueCategories = Array.from(new Set(products?.map((p) => p.category) || []));

  const getProductName = (productId: number) => {
    return products?.find((p) => p.id === productId)?.name || "Unknown";
  };

  const getVariantName = (variantId?: number) => {
    if (!variantId) return null;
    return variants?.find((v) => v.id === variantId)?.name || null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
        <p className="text-muted-foreground">
          Manage your products, categories, variants, and stock.
        </p>
      </div>

      {((lowStockProducts && lowStockProducts.length > 0) || (expiringSoonBatches && expiringSoonBatches.length > 0)) && (
        <div className="grid gap-4 md:grid-cols-2">
          {lowStockProducts && lowStockProducts.length > 0 && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="size-4" />
                  Low Stock Alert ({lowStockProducts.length} items)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lowStockProducts.slice(0, 5).map((p) => (
                    <div key={p.id} className="flex justify-between items-center text-sm">
                      <span className="font-medium">{p.name}</span>
                      <Badge variant="destructive" className="text-xs">
                        {p.stock} left
                      </Badge>
                    </div>
                  ))}
                  {lowStockProducts.length > 5 && (
                    <p className="text-xs text-muted-foreground">
                      +{lowStockProducts.length - 5} more items
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          {expiringSoonBatches && expiringSoonBatches.length > 0 && (
            <Card className="border-rose-500/30 bg-rose-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-rose-600">
                  <Calendar className="size-4" />
                  Expiring Soon ({expiringSoonBatches.length} batches)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {expiringSoonBatches.slice(0, 5).map((b) => {
                    const daysLeft = Math.ceil(
                      (new Date(b.expiryDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <div key={b.id} className="flex justify-between items-center text-sm">
                        <span className="font-medium">
                          {getProductName(b.productId)} - {b.batchNumber}
                        </span>
                        <Badge variant={daysLeft <= 7 ? "destructive" : "secondary"} className="text-xs">
                          {daysLeft <= 0 ? "Expired" : `${daysLeft}d left`}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {products?.filter((p) => p.isActive).length || 0} active
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories?.length || 0}</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Variants</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{variants?.length || 0}</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", lowStockProducts && lowStockProducts.length > 0 && "text-amber-600")}>
              {lowStockProducts?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="products" className="gap-2">
              <Package className="size-4" /> Products
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <Tag className="size-4" /> Categories
            </TabsTrigger>
            <TabsTrigger value="batches" className="gap-2">
              <Boxes className="size-4" /> Batches
            </TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            {activeTab === "products" && (
              <Button onClick={() => { setEditingProduct(null); setProductDialogOpen(true); }} className="gap-2">
                <Plus className="size-4" /> Add Product
              </Button>
            )}
            {activeTab === "categories" && (
              <Button onClick={() => { setEditingCategory(null); setCategoryDialogOpen(true); }} className="gap-2">
                <Plus className="size-4" /> Add Category
              </Button>
            )}
            {activeTab === "batches" && (
              <Button onClick={() => { setEditingBatch(null); setBatchProductId(null); setBatchDialogOpen(true); }} className="gap-2">
                <Plus className="size-4" /> Add Batch
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="products" className="space-y-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name, barcode, SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <ScrollArea className="w-auto max-w-md whitespace-nowrap pb-1">
              <div className="flex gap-2">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  onClick={() => setSelectedCategory(null)}
                  className="rounded-full"
                  size="sm"
                >
                  All
                </Button>
                {uniqueCategories.map((cat) => (
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

          <Card>
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>SKU / Barcode</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Variants</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts?.map((product) => {
                    const productVariants = variants?.filter((v) => v.productId === product.id) || [];
                    const isLowStock = product.stock <= product.lowStockThreshold;
                    return (
                      <TableRow key={product.id} className={cn(!product.isActive && "opacity-50")}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-lg bg-muted flex items-center justify-center font-bold text-xs text-muted-foreground">
                              {product.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium">{product.name}</div>
                              {product.description && (
                                <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  {product.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-mono">
                            {product.sku && <div>{product.sku}</div>}
                            {product.barcode && <div className="text-muted-foreground">{product.barcode}</div>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          ₵{product.price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className={cn("font-bold", isLowStock && "text-amber-600")}>
                            {product.stock}
                          </div>
                          {isLowStock && (
                            <div className="text-[10px] text-amber-500 flex items-center justify-end gap-1">
                              <AlertTriangle className="size-3" /> Low
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={product.isActive ? "default" : "secondary"}
                            className={cn(
                              "text-[10px]",
                              product.isActive
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20"
                                : ""
                            )}
                          >
                            {product.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {productVariants.length > 0 ? (
                            <Badge variant="secondary" className="text-[10px]">
                              {productVariants.length} variant{productVariants.length > 1 ? "s" : ""}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setEditingProduct(product); setProductDialogOpen(true); }}>
                                <Edit className="size-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setVariantProductId(product.id!); setEditingVariant(null); setVariantDialogOpen(true); }}>
                                <Layers className="size-4 mr-2" /> Add Variant
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setBatchProductId(product.id!); setEditingBatch(null); setBatchDialogOpen(true); }}>
                                <Boxes className="size-4 mr-2" /> Add Batch
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleProductActive(product)}>
                                <Archive className="size-4 mr-2" /> {product.isActive ? "Deactivate" : "Activate"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteTarget({ type: "product", id: product.id!, name: product.name })}
                              >
                                <Trash2 className="size-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(!filteredProducts || filteredProducts.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                        No products found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>

          {filteredProducts && filteredProducts.length > 0 && variants && variants.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="size-5" /> Product Variants
                </CardTitle>
                <CardDescription>All variants across your products</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Variant</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Attributes</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {variants
                      .filter((v) => {
                        const product = products?.find((p) => p.id === v.productId);
                        return product && (selectedCategory ? product.category === selectedCategory : true);
                      })
                      .map((variant) => (
                        <TableRow key={variant.id}>
                          <TableCell className="font-medium">{getProductName(variant.productId)}</TableCell>
                          <TableCell>{variant.name}</TableCell>
                          <TableCell className="font-mono text-xs">{variant.sku || "-"}</TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {Object.entries(variant.attributes).map(([key, val]) => (
                                <Badge key={key} variant="outline" className="text-[10px]">
                                  {key}: {val}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono">₵{variant.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-bold">{variant.stock}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { setVariantProductId(variant.productId); setEditingVariant(variant); setVariantDialogOpen(true); }}>
                                  <Edit className="size-4 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setDeleteTarget({ type: "variant", id: variant.id!, name: variant.name })}
                                >
                                  <Trash2 className="size-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Products</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories?.map((cat) => {
                    const productCount = products?.filter((p) => p.category === cat.name).length || 0;
                    return (
                      <TableRow key={cat.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div
                              className="size-8 rounded-md flex items-center justify-center text-white font-bold text-xs"
                              style={{ backgroundColor: cat.color || "#6b7280" }}
                            >
                              {cat.name.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="font-medium">{cat.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{cat.description || "-"}</TableCell>
                        <TableCell className="text-right font-bold">{productCount}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setEditingCategory(cat); setCategoryDialogOpen(true); }}>
                                <Edit className="size-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteTarget({ type: "category", id: cat.id!, name: cat.name })}
                              >
                                <Trash2 className="size-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(!categories || categories.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                        No categories yet. Create your first category.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="batches" className="space-y-4">
          <Card>
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Batch #</TableHead>
                    <TableHead>Variant</TableHead>
                    <TableHead className="text-right">Qty / Remaining</TableHead>
                    <TableHead className="text-right">Cost Price</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches?.map((batch) => {
                    const isExpired = batch.expiryDate && new Date(batch.expiryDate) < new Date();
                    const daysLeft = batch.expiryDate
                      ? Math.ceil((new Date(batch.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                      : null;
                    return (
                      <TableRow key={batch.id} className={cn(isExpired && "opacity-50")}>
                        <TableCell className="font-medium">{getProductName(batch.productId)}</TableCell>
                        <TableCell className="font-mono text-sm">{batch.batchNumber}</TableCell>
                        <TableCell>{getVariantName(batch.variantId) || "-"}</TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold">{batch.remainingQuantity}</span>
                          <span className="text-muted-foreground"> / {batch.quantity}</span>
                        </TableCell>
                        <TableCell className="text-right font-mono">₵{batch.costPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-muted-foreground">{batch.supplier || "-"}</TableCell>
                        <TableCell>
                          {batch.expiryDate ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm">
                                {new Date(batch.expiryDate).toLocaleDateString()}
                              </span>
                              {daysLeft !== null && (
                                <Badge
                                  variant={daysLeft <= 0 ? "destructive" : daysLeft <= 7 ? "destructive" : daysLeft <= 30 ? "secondary" : "outline"}
                                  className="text-[10px]"
                                >
                                  {daysLeft <= 0 ? "Expired" : `${daysLeft}d`}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setBatchProductId(batch.productId); setEditingBatch(batch); setBatchDialogOpen(true); }}>
                                <Edit className="size-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteTarget({ type: "batch", id: batch.id!, name: batch.batchNumber })}
                              >
                                <Trash2 className="size-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(!batches || batches.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                        No batches tracked yet. Add a batch to a product.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>
        </TabsContent>
      </Tabs>

      <ProductDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        product={editingProduct}
        categories={categories || []}
      />

      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        category={editingCategory}
      />

      <VariantDialog
        open={variantDialogOpen}
        onOpenChange={setVariantDialogOpen}
        variant={editingVariant}
        productId={variantProductId}
        products={products || []}
      />

      <BatchDialog
        open={batchDialogOpen}
        onOpenChange={setBatchDialogOpen}
        batch={editingBatch}
        productId={batchProductId}
        products={products || []}
        variants={variants || []}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTarget?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
