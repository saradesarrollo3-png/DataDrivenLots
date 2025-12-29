import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { createContext, useContext, ReactNode } from "react";
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
import Login from "@/pages/login";
import Register from "@/pages/register";
import GestionUsuarios from "@/pages/admin/usuarios";
import Auditoria from "@/pages/admin/auditoria";
import Tutorial from "@/pages/tutorial";
import VerifyBatch from "./pages/verify-batch"; // <--- IMPORTACIÓN NUEVA

interface AuthContextType {
  user: any | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const sessionId = localStorage.getItem("sessionId");

  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: !!sessionId,
    retry: false,
    queryFn: async () => {
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      });
      if (!response.ok) {
        localStorage.removeItem("sessionId");
        localStorage.removeItem("user");
        throw new Error("Not authenticated");
      }
      return await response.json();
    },
  });

  const logout = async () => {
    const sessionId = localStorage.getItem("sessionId");
    if (sessionId) {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      });
    }
    localStorage.removeItem("sessionId");
    localStorage.removeItem("user");
    queryClient.clear();
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user: user || null, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function ProtectedRoute({
  component: Component,
}: {
  component: () => JSX.Element;
}) {
  const { user } = useAuth();
  const sessionId = localStorage.getItem("sessionId");

  if (!sessionId) {
    return <Redirect to="/login" />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  return <Component />;
}

function Router() {
  const { user } = useAuth();
  const sessionId = localStorage.getItem("sessionId");

  return (
    <Switch>
      {/* RUTA PÚBLICA NUEVA PARA VERIFICACIÓN */}
      <Route path="/verify/:batchCode" component={VerifyBatch} />

      <Route
        path="/"
        component={() => {
          return sessionId ? (
            <ProtectedRoute component={Dashboard} />
          ) : (
            <Login />
          );
        }}
      />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route
        path="/recepcion"
        component={() => <ProtectedRoute component={Recepcion} />}
      />
      <Route
        path="/produccion"
        component={() => <ProtectedRoute component={Produccion} />}
      />
      <Route
        path="/calidad"
        component={() => <ProtectedRoute component={Calidad} />}
      />
      <Route
        path="/expedicion"
        component={() => <ProtectedRoute component={Expedicion} />}
      />
      <Route
        path="/configuracion"
        component={() => <ProtectedRoute component={Configuracion} />}
      />
      <Route
        path="/trazabilidad"
        component={() => <ProtectedRoute component={Trazabilidad} />}
      />
      <Route
        path="/historial"
        component={() => <ProtectedRoute component={Historial} />}
      />
      <Route
        path="/etiquetas"
        component={() => <ProtectedRoute component={Etiquetas} />}
      />
      <Route
        path="/admin/usuarios"
        component={() => <ProtectedRoute component={GestionUsuarios} />}
      />
      <Route
        path="/admin/auditoria"
        component={() => <ProtectedRoute component={Auditoria} />}
      />
      <Route
        path="/tutorial"
        component={() => <ProtectedRoute component={Tutorial} />}
      />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const isAuthPage = ["/login", "/register"].includes(location);
  const isLanding = location === "/" && !user;
  const isPublicVerify = location.startsWith("/verify/"); // <--- DETECTAR RUTA PÚBLICA

  // Si es página de auth, landing o verificación pública, NO mostrar sidebar
  if (isAuthPage || isLanding || isPublicVerify) {
    return <Router />;
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b">
            <div className="flex items-center gap-2 md:gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              {user && (
                <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="hidden md:inline">{user.username}</span>
                  <span className="text-xs hidden lg:inline">
                    ({user.organizationName})
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <ThemeToggle />
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="hidden sm:flex"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">Cerrar Sesión</span>
                </Button>
              )}
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="sm:hidden"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              )}
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
