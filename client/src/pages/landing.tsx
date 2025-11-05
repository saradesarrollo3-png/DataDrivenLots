
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingUp, Shield, Zap, Users, BarChart } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Sistema de Trazabilidad
              <span className="block text-primary mt-2">Completo y Seguro</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Control total desde la recepción hasta la expedición. Gestiona lotes, producción, calidad y envíos con total transparencia.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8">
                Comenzar Gratis
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Iniciar Sesión
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-24">
          <Card>
            <CardHeader>
              <Package className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Gestión de Lotes</CardTitle>
              <CardDescription>
                Rastrea cada lote desde su llegada hasta su salida con códigos únicos y trazabilidad completa
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Control de Producción</CardTitle>
              <CardDescription>
                Monitorea todas las etapas: asado, pelado, envasado y esterilizado con métricas en tiempo real
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Calidad Garantizada</CardTitle>
              <CardDescription>
                Sistema de aprobación y rechazo de lotes con checklists personalizables
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Velocidad y Eficiencia</CardTitle>
              <CardDescription>
                Interfaz intuitiva que agiliza el registro de datos y reduce errores
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Multi-Organización</CardTitle>
              <CardDescription>
                Datos completamente aislados por organización con acceso seguro
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BarChart className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Reportes y Analytics</CardTitle>
              <CardDescription>
                Dashboard con KPIs, gráficos y métricas para tomar decisiones informadas
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center space-y-6">
          <h2 className="text-3xl font-bold">¿Listo para mejorar tu trazabilidad?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Únete a las empresas que ya confían en nuestro sistema para gestionar sus operaciones
          </p>
          <Link href="/register">
            <Button size="lg" className="text-lg px-8">
              Crear Cuenta Ahora
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-24">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            © 2024 Sistema de Trazabilidad. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
