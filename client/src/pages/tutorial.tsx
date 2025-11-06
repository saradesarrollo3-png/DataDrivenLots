
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Settings, 
  ClipboardList, 
  Tag, 
  Factory, 
  ClipboardCheck, 
  Truck, 
  Search,
  ChevronRight,
  CheckCircle,
  FileText
} from "lucide-react";


const steps = [
  {
    id: 1,
    title: "1. Configuración Inicial",
    icon: Settings,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    description: "Configura los datos maestros de tu empresa",
    details: [
      "Registra tus proveedores de materia prima",
      "Añade el catálogo de productos (materia prima, semielaborados y terminados)",
      "Define las ubicaciones de almacenamiento (recepción, producción, calidad, expedición)",
      "Configura los tipos de envase utilizados",
      "Registra tus clientes"
    ],
    link: "/configuracion",
    linkText: "Ir a Configuración"
  },
  {
    id: 2,
    title: "2. Recepción de Materia Prima",
    icon: ClipboardList,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    description: "Registra la llegada de materias primas",
    details: [
      "Selecciona el proveedor y producto recibido",
      "Introduce la cantidad, temperatura y datos del albarán",
      "Asigna un código de lote automático",
      "Registra la fecha y hora de recepción",
      "El sistema crea automáticamente el stock disponible"
    ],
    link: "/recepcion",
    linkText: "Ir a Recepción"
  },
  {
    id: 3,
    title: "3. Etiquetas de Recepción (Opcional)",
    icon: Tag,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    description: "Imprime etiquetas para identificar los palés",
    details: [
      "Visualiza las etiquetas de los lotes recepcionados",
      "Cada etiqueta incluye código QR con toda la información",
      "Imprime las etiquetas para colocar en los palés",
      "Facilita la identificación rápida de materias primas"
    ],
    link: "/etiquetas",
    linkText: "Ir a Etiquetas"
  },
  {
    id: 4,
    title: "4. Proceso de Producción",
    icon: Factory,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    description: "Transforma la materia prima en producto final",
    details: [
      "Asado: Procesa la materia prima recepcionada",
      "Pelado y Corte: Pela y corta el producto asado",
      "Envasado: Convierte el producto pelado en envases específicos",
      "Esterilizado: Esteriliza y sella los envases para conservación",
      "Cada etapa registra trazabilidad completa"
    ],
    link: "/produccion",
    linkText: "Ir a Producción"
  },
  {
    id: 5,
    title: "5. Control de Calidad",
    icon: ClipboardCheck,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    description: "Verifica y autoriza los lotes producidos",
    details: [
      "Revisa los lotes esterilizados pendientes",
      "Completa el checklist de calidad configurado",
      "Establece la fecha de caducidad del producto",
      "Aprueba el lote para venta o bloquéalo si no cumple",
      "Registra observaciones importantes"
    ],
    link: "/calidad",
    linkText: "Ir a Control de Calidad"
  },
  {
    id: 6,
    title: "6. Etiquetas de Producto (Opcional)",
    icon: Tag,
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
    description: "Genera etiquetas para los productos aprobados",
    details: [
      "Visualiza etiquetas de lotes aprobados para venta",
      "Incluye código QR, código de lote, caducidad y fabricación",
      "Imprime o descarga las etiquetas",
      "Identifica fácilmente los productos en almacén"
    ],
    link: "/etiquetas",
    linkText: "Ir a Etiquetas"
  },
  {
    id: 7,
    title: "7. Expedición a Clientes",
    icon: Truck,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    description: "Prepara y envía productos a los clientes",
    details: [
      "Crea albaranes de expedición seleccionando el cliente",
      "El sistema muestra lotes ordenados por FEFO (lo que caduca antes se expide primero)",
      "Añade múltiples lotes al albarán según necesidad",
      "Registra matrícula del camión y notas adicionales",
      "El stock se actualiza automáticamente al confirmar"
    ],
    link: "/expedicion",
    linkText: "Ir a Expedición"
  },
  {
    id: 8,
    title: "8. Trazabilidad Completa",
    icon: Search,
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-100 dark:bg-cyan-900/30",
    description: "Consulta el historial de cualquier expedición",
    details: [
      "Busca cualquier expedición por código de lote o albarán",
      "Visualiza el recorrido completo desde materia prima hasta cliente",
      "Accede a todos los detalles de cada etapa del proceso",
      "Identifica proveedores, cantidades, fechas y responsables",
      "Trazabilidad inversa completa para auditorías"
    ],
    link: "/trazabilidad",
    linkText: "Ir a Trazabilidad"
  },
  {
    id: 9,
    title: "9. Auditoría y Reportes",
    icon: FileText,
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-100 dark:bg-slate-900/30",
    description: "Genera reportes en PDF para auditorías y análisis",
    details: [
      "Descarga reportes completos de historial de lotes",
      "Genera informes de registros de producción por etapas",
      "Exporta controles de calidad realizados",
      "Obtén reportes de expediciones a clientes",
      "Descarga trazabilidad completa y estado de stock en PDF"
    ],
    link: "/admin/auditoria",
    linkText: "Ir a Auditoría"
  }
];

export default function Tutorial() {

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tutorial del Sistema</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Guía paso a paso para utilizar el sistema de trazabilidad
        </p>
      </div>

      <Card className="border-primary/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Bienvenido al Sistema de Trazabilidad
          </CardTitle>
          <CardDescription>
            Este tutorial te guiará a través del flujo completo del sistema, desde la configuración inicial 
            hasta la consulta de trazabilidad de productos expedidos. Sigue estos pasos en orden para 
            aprovechar al máximo todas las funcionalidades.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <Card 
              key={step.id}
              className="transition-all"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`${step.bgColor} p-3 rounded-lg`}>
                      <Icon className={`h-6 w-6 ${step.color}`} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">
                        {step.title}
                      </CardTitle>
                      <CardDescription className="text-base mb-3">
                        {step.description}
                      </CardDescription>
                      <ul className="space-y-2">
                        {step.details.map((detail, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <ChevronRight className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Link href={step.link}>
                  <Button>
                    {step.linkText}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-primary/50">
        <CardHeader>
          <CardTitle>¿Necesitas ayuda?</CardTitle>
          <CardDescription>
            Puedes volver a este tutorial en cualquier momento desde el menú lateral o el dashboard. 
            Cada módulo del sistema tiene su propia interfaz intuitiva con indicaciones claras.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Link href="/">
              <Button variant="outline">
                Volver al Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
