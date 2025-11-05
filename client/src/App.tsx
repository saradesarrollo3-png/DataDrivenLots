import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import Configuracion from "./pages/configuracion";
import Trazabilidad from "./pages/trazabilidad";
import Historial from "./pages/historial";
import Etiquetas from "./pages/etiquetas";
import NotFound from "./pages/not-found";
import Dashboard from "@/pages/dashboard";
import Recepcion from "@/pages/recepcion";
import Produccion from "@/pages/produccion";
import Calidad from "@/pages/calidad";
import Expedicion from "@/pages/expedicion";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/recepcion" component={Recepcion} />
      <Route path="/produccion" component={Produccion} />
      <Route path="/calidad" component={Calidad} />
      <Route path="/expedicion" component={Expedicion} />
      <Route path="/configuracion" component={Configuracion} />
      <Route path="/trazabilidad" component={Trazabilidad} />
      <Route path="/historial" component={Historial} />
      <Route path="/etiquetas" component={Etiquetas} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between px-6 py-4 border-b">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <ThemeToggle />
                </header>
                <main className="flex-1 overflow-auto p-6">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}