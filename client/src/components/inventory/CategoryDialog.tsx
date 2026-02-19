import { useEffect, useState } from "react";
import { db, type Category } from "@/lib/db";
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
import { toast } from "@/hooks/use-toast";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
}

const PRESET_COLORS = ["#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#f59e0b", "#06b6d4", "#ec4899"];

export default function CategoryDialog({ open, onOpenChange, category }: CategoryDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setDescription(category.description || "");
      setColor(category.color || PRESET_COLORS[0]);
    } else {
      setName("");
      setDescription("");
      setColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
    }
  }, [category, open]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Missing Name", description: "Category name is required.", variant: "destructive" });
      return;
    }

    try {
      if (category?.id) {
        const oldName = category.name;
        await db.categories.update(category.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          color,
        });
        if (oldName !== name.trim()) {
          await db.products.where("category").equals(oldName).modify({ category: name.trim() });
        }
        toast({ title: "Category Updated", description: name });
      } else {
        await db.categories.add({
          name: name.trim(),
          description: description.trim() || undefined,
          color,
          createdAt: new Date(),
        });
        toast({ title: "Category Created", description: name });
      }
      onOpenChange(false);
    } catch {
      toast({ title: "Error", description: "Failed to save category.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{category ? "Edit Category" : "Create Category"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Category Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Food, Drinks, Electronics" />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  className="size-8 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? "hsl(var(--foreground))" : "transparent",
                    transform: color === c ? "scale(1.15)" : undefined,
                  }}
                  onClick={() => setColor(c)}
                  type="button"
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>{category ? "Update" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
