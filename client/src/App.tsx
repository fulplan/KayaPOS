import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PWAInstallPrompt from "@/components/layout/PWAInstallPrompt";
import Dashboard from "@/pages/Dashboard";
import POS from "@/pages/POS";
import Transactions from "@/pages/Transactions";
import Inventory from "@/pages/Inventory";
import Settings from "@/pages/Settings";
import Quotes from "@/pages/Quotes";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Dashboard}/>
        <Route path="/pos" component={POS}/>
        <Route path="/inventory" component={Inventory}/>
        <Route path="/transactions" component={Transactions}/>
        <Route path="/settings" component={Settings}/>
        <Route path="/quotes" component={Quotes}/>
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <PWAInstallPrompt />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
