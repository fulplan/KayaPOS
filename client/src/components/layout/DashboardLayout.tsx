import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Store, 
  Receipt, 
  Settings, 
  LogOut, 
  Wifi, 
  WifiOff, 
  Menu,
  Bell,
  Package
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const { isOffline } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "POS Terminal", href: "/pos", icon: Store },
    { name: "Inventory", href: "/inventory", icon: Package },
    { name: "Transactions", href: "/transactions", icon: Receipt },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const SidebarContent = () => (
    <div className="flex h-full flex-col gap-4 bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center px-6 border-b border-sidebar-border/10">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
            <Store className="size-5" />
          </div>
          <span>Kaya POS</span>
        </div>
      </div>
      
      <ScrollArea className="flex-1 px-4 py-2">
        <nav className="flex flex-col gap-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="size-4" />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t border-sidebar-border/10">
        <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/30 p-3">
          <Avatar className="size-9 rounded-md border border-sidebar-border/20">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback className="rounded-md">YA</AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium truncate">Yaw Asamoah</span>
            <span className="text-xs text-sidebar-foreground/60 truncate">Manager</span>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground">
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 border-r bg-sidebar md:flex md:flex-col fixed inset-y-0 z-50">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:pl-64 flex flex-col min-h-screen transition-all duration-300">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/80 px-6 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden -ml-2">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 bg-sidebar border-r-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2 ml-auto">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
              isOffline 
                ? "bg-destructive/10 text-destructive border-destructive/20" 
                : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
            )}>
              {isOffline ? <WifiOff className="size-3.5" /> : <Wifi className="size-3.5" />}
              {isOffline ? "Offline Mode" : "Online"}
            </div>
            
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
              <Bell className="size-5" />
              <span className="absolute top-2.5 right-2.5 size-2 bg-primary rounded-full ring-2 ring-background" />
            </Button>
          </div>
        </header>
        
        <div className="flex-1 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
