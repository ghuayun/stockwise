import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Historical from "@/pages/Historical";
import { TrendingUp, History, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

function Navigation() {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-[1600px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/">
              <a className="flex items-center gap-2 hover-elevate active-elevate-2 rounded-md px-3 py-2 -ml-3" data-testid="link-logo">
                <BarChart3 className="w-6 h-6 text-primary" />
                <span className="text-xl font-bold font-mono">StockSage</span>
              </a>
            </Link>
            <nav className="flex items-center gap-2">
              <Link href="/">
                <Button
                  variant={location === "/" ? "secondary" : "ghost"}
                  className="gap-2"
                  data-testid="link-dashboard"
                >
                  <TrendingUp className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/historical">
                <Button
                  variant={location === "/historical" ? "secondary" : "ghost"}
                  className="gap-2"
                  data-testid="link-historical"
                >
                  <History className="w-4 h-4" />
                  Historical
                </Button>
              </Link>
            </nav>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/historical" component={Historical} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <div className="min-h-screen bg-background">
            <Navigation />
            <Router />
          </div>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
