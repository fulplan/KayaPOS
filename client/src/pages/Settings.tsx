import { useState, useEffect } from "react";
import { db, type TaxRule, type BusinessSettings } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, Receipt, MoreHorizontal, Cloud, RefreshCw, Building2, Tags } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { syncAll } from "@/lib/sync";

const BUSINESS_TYPES = [
  { value: "pharmacy", label: "Pharmacy" },
  { value: "salon", label: "Salon / Beauty" },
  { value: "restaurant", label: "Restaurant / Food" },
  { value: "retail", label: "Retail / Mini Mart" },
  { value: "wholesale", label: "Wholesale" },
  { value: "other", label: "Other" },
];

const SUGGESTED_CATEGORIES: Record<string, string[]> = {
  pharmacy: ["Antibiotics", "Pain Relief", "Vitamins & Supplements", "First Aid", "Skin Care", "Prescription Drugs", "OTC Medicines", "Baby Care"],
  salon: ["Hair Care", "Skin Care", "Nails", "Makeup", "Products", "Accessories"],
  restaurant: ["Appetizers", "Main Course", "Beverages", "Desserts", "Sides", "Specials"],
  retail: ["General", "Electronics", "Clothing", "Household", "Groceries", "Stationery"],
  wholesale: ["General", "Bulk Items", "Industrial", "Office Supplies"],
  other: ["General"],
};

export default function Settings() {
  const taxRules = useLiveQuery(() => db.taxRules.toArray());
  const businessSettings = useLiveQuery(() => db.businessSettings.toCollection().first());
  const existingCategories = useLiveQuery(() => db.categories.toArray());
  const [isSyncing, setIsSyncing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<TaxRule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TaxRule | null>(null);

  const [name, setName] = useState("");
  const [rate, setRate] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [bizName, setBizName] = useState("");
  const [bizAddress, setBizAddress] = useState("");
  const [bizPhone, setBizPhone] = useState("");
  const [bizEmail, setBizEmail] = useState("");
  const [bizLogo, setBizLogo] = useState("");
  const [bizType, setBizType] = useState<string>("retail");

  useEffect(() => {
    if (businessSettings) {
      setBizName(businessSettings.businessName || "");
      setBizAddress(businessSettings.address || "");
      setBizPhone(businessSettings.phone || "");
      setBizEmail(businessSettings.email || "");
      setBizLogo(businessSettings.logo || "");
      setBizType(businessSettings.businessType || "retail");
    }
  }, [businessSettings]);

  const openDialog = (rule: TaxRule | null) => {
    setEditingRule(rule);
    if (rule) {
      setName(rule.name);
      setRate((rule.rate * 100).toString());
      setIsDefault(rule.isDefault);
      setIsActive(rule.isActive);
    } else {
      setName("");
      setRate("");
      setIsDefault(false);
      setIsActive(true);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim() || rate === "") {
      toast({ title: "Missing Fields", description: "Name and rate are required.", variant: "destructive" });
      return;
    }

    const rateValue = parseFloat(rate) / 100;
    if (rateValue < 0 || rateValue > 1) {
      toast({ title: "Invalid Rate", description: "Rate must be between 0% and 100%.", variant: "destructive" });
      return;
    }

    try {
      if (isDefault) {
        await db.taxRules.toCollection().modify({ isDefault: false });
      }

      if (editingRule?.id) {
        await db.taxRules.update(editingRule.id, {
          name: name.trim(),
          rate: rateValue,
          isDefault,
          isActive,
        });
        toast({ title: "Tax Rule Updated", description: name });
      } else {
        await db.taxRules.add({
          name: name.trim(),
          rate: rateValue,
          isDefault,
          isActive,
          createdAt: new Date(),
        });
        toast({ title: "Tax Rule Created", description: name });
      }
      setDialogOpen(false);
    } catch {
      toast({ title: "Error", description: "Failed to save tax rule.", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    try {
      await db.taxRules.delete(deleteTarget.id);
      toast({ title: "Tax Rule Deleted", description: deleteTarget.name });
    } catch {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    }
    setDeleteTarget(null);
  };

  const handleSaveBusinessSettings = async () => {
    try {
      const existing = await db.businessSettings.toCollection().first();
      const data: BusinessSettings = {
        businessName: bizName.trim(),
        address: bizAddress.trim() || undefined,
        phone: bizPhone.trim() || undefined,
        email: bizEmail.trim() || undefined,
        logo: bizLogo.trim() || undefined,
        businessType: bizType as BusinessSettings['businessType'],
        updatedAt: new Date(),
      };

      if (existing?.id) {
        await db.businessSettings.update(existing.id, data);
      } else {
        await db.businessSettings.add(data);
      }
      toast({ title: "Business Profile Saved" });
    } catch {
      toast({ title: "Error", description: "Failed to save.", variant: "destructive" });
    }
  };

  const handleAddSuggestedCategories = async () => {
    const suggestions = SUGGESTED_CATEGORIES[bizType] || SUGGESTED_CATEGORIES.other;
    const existingNames = new Set((existingCategories || []).map(c => c.name.toLowerCase()));
    const toAdd = suggestions.filter(s => !existingNames.has(s.toLowerCase()));

    if (toAdd.length === 0) {
      toast({ title: "All Set", description: "These categories already exist." });
      return;
    }

    await db.categories.bulkAdd(
      toAdd.map(name => ({ name, description: '', color: '#6b7280', createdAt: new Date() }))
    );
    toast({ title: "Categories Added", description: `Added ${toAdd.length} categories for ${BUSINESS_TYPES.find(b => b.value === bizType)?.label || bizType}` });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure your POS system preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-5" /> Business Profile
          </CardTitle>
          <CardDescription>Set up your business information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Business Name</Label>
              <Input value={bizName} onChange={(e) => setBizName(e.target.value)} placeholder="Your business name" />
            </div>
            <div className="space-y-2">
              <Label>Business Type</Label>
              <Select value={bizType} onValueChange={setBizType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={bizPhone} onChange={(e) => setBizPhone(e.target.value)} placeholder="Phone number" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={bizEmail} onChange={(e) => setBizEmail(e.target.value)} placeholder="Email address" type="email" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Address</Label>
              <Input value={bizAddress} onChange={(e) => setBizAddress(e.target.value)} placeholder="Business address" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Logo URL</Label>
              <Input value={bizLogo} onChange={(e) => setBizLogo(e.target.value)} placeholder="https://example.com/logo.png" />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleSaveBusinessSettings}>Save Profile</Button>
            <Button variant="outline" onClick={handleAddSuggestedCategories} className="gap-2">
              <Tags className="size-4" />
              Add {BUSINESS_TYPES.find(b => b.value === bizType)?.label} Categories
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="size-5" /> Tax Rules
            </CardTitle>
            <CardDescription>Manage tax rates applied to orders</CardDescription>
          </div>
          <Button onClick={() => openDialog(null)} className="gap-2">
            <Plus className="size-4" /> Add Tax Rule
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead>Default</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxRules?.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell className="text-right font-mono">{(rule.rate * 100).toFixed(1)}%</TableCell>
                  <TableCell>
                    {rule.isDefault && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">Default</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={rule.isActive ? "default" : "secondary"}
                      className={rule.isActive ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]" : "text-[10px]"}
                    >
                      {rule.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openDialog(rule)}>
                          <Edit className="size-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(rule)}>
                          <Trash2 className="size-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {(!taxRules || taxRules.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No tax rules configured. Add one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRule ? "Edit Tax Rule" : "Create Tax Rule"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Rule Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. VAT (15%), Service Tax" />
            </div>
            <div className="space-y-2">
              <Label>Tax Rate (%) *</Label>
              <Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="15" min="0" max="100" step="0.1" />
            </div>
            <div className="flex items-center justify-between border rounded-lg p-3">
              <div>
                <Label>Default Rule</Label>
                <p className="text-xs text-muted-foreground">Automatically applied to new orders</p>
              </div>
              <Switch checked={isDefault} onCheckedChange={setIsDefault} />
            </div>
            <div className="flex items-center justify-between border rounded-lg p-3">
              <div>
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">Available for selection in POS</p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingRule ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="size-5" /> Data Sync
          </CardTitle>
          <CardDescription>Sync your local data to the server for backup and multi-device access</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              onClick={async () => {
                setIsSyncing(true);
                try {
                  const result = await syncAll();
                  if (result.errors.length > 0) {
                    toast({ title: "Sync Partial", description: `Some items failed: ${result.errors.join(', ')}`, variant: "destructive" });
                  } else {
                    const totalSynced = (result.products?.synced || 0) + (result.orders?.synced || 0) + (result.customers?.synced || 0);
                    toast({ title: "Sync Complete", description: `${totalSynced} items synced to server` });
                  }
                } catch {
                  toast({ title: "Sync Failed", description: "Could not connect to server. Data is saved locally.", variant: "destructive" });
                } finally {
                  setIsSyncing(false);
                }
              }}
              disabled={isSyncing}
              className="gap-2"
            >
              <RefreshCw className={`size-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
            <p className="text-sm text-muted-foreground">
              Data syncs automatically every 60 seconds when online.
            </p>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tax Rule?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTarget?.name}". Existing orders won't be affected.
            </AlertDialogDescription>
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
