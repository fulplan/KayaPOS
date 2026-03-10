import { useState, useEffect } from "react";
import { useAuth, type AuthUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, Plus, MoreHorizontal, Edit, Shield, Key, WifiOff, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useStore } from "@/lib/store";

interface UserRecord {
  id: string;
  username: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt?: string;
}

export default function Admin() {
  const { user: currentUser } = useAuth();
  const { isOffline } = useStore();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserRecord | null>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("cashier");

  const [newPassword, setNewPassword] = useState("");

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch {
      toast({ title: "Error", description: "Failed to load users", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOffline) fetchUsers();
    else setIsLoading(false);
  }, [isOffline]);

  const openCreateDialog = () => {
    setEditingUser(null);
    setUsername("");
    setPassword("");
    setFullName("");
    setRole("cashier");
    setDialogOpen(true);
  };

  const openEditDialog = (user: UserRecord) => {
    setEditingUser(user);
    setUsername(user.username);
    setFullName(user.fullName);
    setRole(user.role);
    setPassword("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingUser && (!username.trim() || !password.trim())) {
      toast({ title: "Missing Fields", description: "Username and password are required.", variant: "destructive" });
      return;
    }

    try {
      if (editingUser) {
        const res = await fetch(`/api/admin/users/${editingUser.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullName, role }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error);
        }
        toast({ title: "User Updated", description: fullName });
      } else {
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password, fullName: fullName || username, role }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error);
        }
        toast({ title: "User Created", description: fullName || username });
      }
      setDialogOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleToggleActive = async (user: UserRecord) => {
    if (user.id === currentUser?.id) {
      toast({ title: "Error", description: "You cannot deactivate your own account.", variant: "destructive" });
      return;
    }
    try {
      await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      toast({ title: user.isActive ? "User Deactivated" : "User Activated" });
      fetchUsers();
    } catch {
      toast({ title: "Error", description: "Failed to update user", variant: "destructive" });
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUser || !newPassword.trim()) return;
    try {
      const res = await fetch(`/api/admin/users/${resetPasswordUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Password Reset", description: `Password updated for ${resetPasswordUser.fullName}` });
      setResetPasswordUser(null);
      setNewPassword("");
    } catch {
      toast({ title: "Error", description: "Failed to reset password", variant: "destructive" });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20 text-[10px]">Admin</Badge>;
      case "manager":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px]">Manager</Badge>;
      default:
        return <Badge className="bg-slate-500/10 text-slate-600 border-slate-500/20 text-[10px]">Cashier</Badge>;
    }
  };

  if (isOffline) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <WifiOff className="size-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Internet Required</h3>
            <p className="text-muted-foreground max-w-sm">
              User management requires an internet connection. Connect to the internet and try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">Manage staff accounts and access permissions.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Shield className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(u => u.isActive).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(u => u.role === "admin").length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Staff Accounts</CardTitle>
            <CardDescription>Create and manage user accounts for your team</CardDescription>
          </div>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="size-4" /> Add User
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">{user.username}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={user.isActive ? "default" : "secondary"}
                        className={user.isActive ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]" : "bg-red-500/10 text-red-600 border-red-500/20 text-[10px]"}
                      >
                        {user.isActive ? "Active" : "Inactive"}
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
                          <DropdownMenuItem onClick={() => openEditDialog(user)}>
                            <Edit className="size-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setResetPasswordUser(user); setNewPassword(""); }}>
                            <Key className="size-4 mr-2" /> Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleActive(user)}
                            className={user.isActive ? "text-destructive" : "text-emerald-600"}
                          >
                            <Shield className="size-4 mr-2" />
                            {user.isActive ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Create User"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {!editingUser && (
              <div className="space-y-2">
                <Label>Username *</Label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" />
              </div>
            )}
            {!editingUser && (
              <div className="space-y-2">
                <Label>Password *</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" />
              </div>
            )}
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter full name" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cashier">Cashier - POS & Transactions only</SelectItem>
                  <SelectItem value="manager">Manager - Full access except user management</SelectItem>
                  <SelectItem value="admin">Admin - Full access including user management</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingUser ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resetPasswordUser} onOpenChange={(open) => !open && setResetPasswordUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password for {resetPasswordUser?.fullName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordUser(null)}>Cancel</Button>
            <Button onClick={handleResetPassword} disabled={!newPassword.trim()}>Reset Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
