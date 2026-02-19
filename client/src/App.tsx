import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Dashboard from "@/pages/Dashboard";
import POS from "@/pages/POS";
import Transactions from "@/pages/Transactions";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Dashboard}/>
        <Route path="/pos" component={POS}/>
        <Route path="/transactions" component={Transactions}/>
        <Route path="/settings">
          <div className="flex items-center justify-center h-[50vh] text-muted-foreground flex-col gap-4">
            <h2 className="text-2xl font-bold">Settings</h2>
            <p>Module coming soon...</p>
          </div>
        </Route>
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
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
