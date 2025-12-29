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
import { createContext, useContext, ReactNode, useEffect } from "react";
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
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import GestionUsuarios from "@/pages/admin/usuarios";
import Auditoria from "@/pages/admin/auditoria";
import Tutorial from "@/pages/tutorial";
import { useToast } from "@/hooks/use-toast";
import VerifyBatch from "./pages/verify-batch";

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

  console.log("AuthProvider - sessionId:", sessionId);

  const {
    data: user,
    refetch,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: !!sessionId,
    retry: false,
    queryFn: async () => {
      console.log("Fetching user with sessionId:", sessionId);
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      });
      if (!response.ok) {
        console.log("Auth failed, response:", response.status);
        localStorage.removeItem("sessionId");
        localStorage.removeItem("user");
        throw new Error("Not authenticated");
      }
      const userData = await response.json();
      console.log("User data fetched:", userData);
      return userData;
    },
  });

  console.log(
    "AuthProvider - user:",
    user,
    "isLoading:",
    isLoading,
    "error:",
    error,
  );

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
    // Forzar recarga completa para limpiar el estado
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

  console.log("ProtectedRoute - sessionId:", sessionId, "user:", user);

  // Si no hay sessionId, redirigir a login
  if (!sessionId) {
    console.log("ProtectedRoute - No sessionId, redirecting to /login");
    return <Redirect to="/login" />;
  }

  // Si hay sessionId pero user aún no está cargado, mostrar loading
  if (!user) {
    console.log("ProtectedRoute - Loading user data...");
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  console.log("ProtectedRoute - Rendering protected component");
  return <Component />;
}

function Router() {
  const { user } = useAuth();
  const sessionId = localStorage.getItem("sessionId");
  // ... logs existentes ...

  return (
    <Switch>
      {/* ... tus rutas existentes ... */}

      {/* AÑADE ESTA RUTA NUEVA: */}
      <Route path="/verify/:batchCode" component={VerifyBatch} />

      <Route
        path="/"
        component={() => {
          // ... lógica existente ...
          return sessionId ? (
            <ProtectedRoute component={Dashboard} />
          ) : (
            <Login />
          );
        }}
      />
      {/* ... resto de rutas ... */}
      <Route component={NotFound} />
    </Switch>
  );
}
function AppContent() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const isAuthPage = ['/login', '/register'].includes(location);
  const isLanding = location === '/' && !user;
  const isPublicVerify = location.startsWith('/verify/'); 

  if (isAuthPage || isLanding || isPublicVerify) {
    return <Router />;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="flex items-center justify-between border-b p-4">
            <SidebarTrigger />
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">{user?.username}</span>
              </div>
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="p-6">
            <Router />
          </div>
        </main>
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
