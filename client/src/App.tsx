import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PWAInstallPrompt from "@/components/layout/PWAInstallPrompt";
import Dashboard from "@/pages/Dashboard";
import POS from "@/pages/POS";
import Transactions from "@/pages/Transactions";
import Inventory from "@/pages/Inventory";
import Settings from "@/pages/Settings";
import Quotes from "@/pages/Quotes";
import Admin from "@/pages/Admin";
import { startAutoSync } from "@/lib/sync";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { Loader2 } from "lucide-react";

function Router() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Dashboard}/>
        <Route path="/pos" component={POS}/>
        {user && (user.role === 'admin' || user.role === 'manager') && (
          <Route path="/inventory" component={Inventory}/>
        )}
        <Route path="/transactions" component={Transactions}/>
        {user && (user.role === 'admin' || user.role === 'manager') && (
          <Route path="/settings" component={Settings}/>
        )}
        <Route path="/quotes" component={Quotes}/>
        {user && user.role === 'admin' && (
          <Route path="/admin" component={Admin}/>
        )}
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function AppContent() {
  const { user, isLoading, checkAuth } = useAuth();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      startAutoSync(60000);
    }
  }, [user]);

  useEffect(() => {
    const savedCart = localStorage.getItem('kaya_pos_cart');
    if (savedCart) {
      try {
        const cart = JSON.parse(savedCart);
        if (Array.isArray(cart) && cart.length > 0) {
          useStore.getState().loadCart(cart);
        }
      } catch {}
    }

    const unsubscribe = useStore.subscribe((state) => {
      if (state.cart.length > 0) {
        localStorage.setItem('kaya_pos_cart', JSON.stringify(state.cart));
      } else {
        localStorage.removeItem('kaya_pos_cart');
      }
    });

    return unsubscribe;
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <>
      <Router />
      <PWAInstallPrompt />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
