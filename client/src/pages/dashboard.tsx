
import { KPICard } from "@/components/kpi-card";
import { DataTable, Column } from "@/components/data-table";
import { StatusBadge, BatchStatus } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  AlertTriangle, 
  Clock, 
  GraduationCap,
  Settings,
  ClipboardList,
  Tag,
  Factory,
  ClipboardCheck,
  Truck,
  Search,
  FileText,
  Users
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

interface RecentBatch {
  id: string;
  code: string;
  product: string;
  quantity: number;
  unit: string;
  status: BatchStatus;
  date: string;
}

interface ExpiringBatch {
  id: string;
  code: string;
  product: string;
  expiryDate: string;
  daysLeft: number;
}

interface QuickAccessLink {
  title: string;
  description: string;
  icon: any;
  href: string;
  color: string;
  bgColor: string;
}

export default function Dashboard() {
  const { data: batchesData = [] } = useQuery({
    queryKey: ['/api/batches'],
  });

  // Procesar datos recientes
  const recentBatches: RecentBatch[] = batchesData.slice(0, 5).map((item: any) => ({
    id: item.batch.id,
    code: item.batch.batchCode,
    product: item.product?.name || 'N/A',
    quantity: parseFloat(item.batch.quantity),
    unit: item.batch.unit,
    status: item.batch.status,
    date: new Date(item.batch.arrivedAt).toLocaleDateString('es-ES')
  }));

  // Calcular lotes próximos a caducar
  const expiringBatches: ExpiringBatch[] = batchesData
    .filter((item: any) => item.batch.expiryDate)
    .map((item: any) => {
      const expiryDate = new Date(item.batch.expiryDate);
      const today = new Date();
      const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return {
        id: item.batch.id,
        code: item.batch.batchCode,
        product: item.product?.name || 'N/A',
        expiryDate: expiryDate.toLocaleDateString('es-ES'),
        daysLeft
      };
    })
    .filter((item: ExpiringBatch) => item.daysLeft > 0 && item.daysLeft <= 30)
    .sort((a: ExpiringBatch, b: ExpiringBatch) => a.daysLeft - b.daysLeft)
    .slice(0, 5);

  // Calcular KPIs por zona (lotes con cantidad > 0)
  const lotesRecepcion = batchesData.filter((item: any) => 
    item.batch.status === 'RECEPCION' && parseFloat(item.batch.quantity) > 0
  ).length;
  
  const lotesAsado = batchesData.filter((item: any) => 
    item.batch.status === 'ASADO' && parseFloat(item.batch.quantity) > 0
  ).length;
  
  const lotesPelado = batchesData.filter((item: any) => 
    item.batch.status === 'PELADO' && parseFloat(item.batch.quantity) > 0
  ).length;
  
  const lotesEnvasado = batchesData.filter((item: any) => 
    item.batch.status === 'ENVASADO' && parseFloat(item.batch.quantity) > 0
  ).length;

  const lotesEsterilizado = batchesData.filter((item: any) => 
    item.batch.status === 'ESTERILIZADO' && parseFloat(item.batch.quantity) > 0
  ).length;

  const lotesAprobados = batchesData.filter((item: any) => 
    item.batch.status === 'APROBADO' && parseFloat(item.batch.quantity) > 0
  ).length;

  const recentColumns: Column<RecentBatch>[] = [
    { key: "code", label: "Código Lote" },
    { key: "product", label: "Producto" },
    { 
      key: "quantity", 
      label: "Cantidad",
      render: (value, row) => `${value} ${row.unit}`
    },
    { 
      key: "status", 
      label: "Estado",
      render: (value) => <StatusBadge status={value} />
    },
    { key: "date", label: "Fecha" },
  ];

  const expiringColumns: Column<ExpiringBatch>[] = [
    { key: "code", label: "Código Lote" },
    { key: "product", label: "Producto" },
    { key: "expiryDate", label: "Fecha Caducidad" },
    { 
      key: "daysLeft", 
      label: "Días Restantes",
      render: (value) => (
        <span className={value <= 7 ? "text-red-600 dark:text-red-400 font-medium" : ""}>
          {value} días
        </span>
      )
    },
  ];

  const quickAccessLinks: QuickAccessLink[] = [
    {
      title: "Configuración",
      description: "Gestiona proveedores, productos, clientes y más",
      icon: Settings,
      href: "/configuracion",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/30"
    },
    {
      title: "Recepción",
      description: "Registra la llegada de materia prima",
      icon: ClipboardList,
      href: "/recepcion",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30"
    },
    {
      title: "Producción",
      description: "Gestiona las etapas de producción",
      icon: Factory,
      href: "/produccion",
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900/30"
    },
    {
      title: "Control de Calidad",
      description: "Verifica y autoriza lotes",
      icon: ClipboardCheck,
      href: "/calidad",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30"
    },
    {
      title: "Etiquetas",
      description: "Imprime etiquetas de lotes",
      icon: Tag,
      href: "/etiquetas",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-100 dark:bg-amber-900/30"
    },
    {
      title: "Expedición",
      description: "Prepara y envía productos",
      icon: Truck,
      href: "/expedicion",
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-100 dark:bg-red-900/30"
    },
    {
      title: "Trazabilidad",
      description: "Consulta el historial completo",
      icon: Search,
      href: "/trazabilidad",
      color: "text-cyan-600 dark:text-cyan-400",
      bgColor: "bg-cyan-100 dark:bg-cyan-900/30"
    },
    {
      title: "Auditoría",
      description: "Genera reportes en PDF",
      icon: FileText,
      href: "/admin/auditoria",
      color: "text-slate-600 dark:text-slate-400",
      bgColor: "bg-slate-100 dark:bg-slate-900/30"
    },
    {
      title: "Usuarios",
      description: "Administra usuarios del sistema",
      icon: Users,
      href: "/admin/usuarios",
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-100 dark:bg-indigo-900/30"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Vista general del sistema de trazabilidad
        </p>
      </div>

      <Card className="border-primary/50 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">¿Primera vez usando el sistema?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Consulta nuestro tutorial paso a paso para aprender el flujo completo
                </p>
              </div>
            </div>
            <Link href="/tutorial">
              <Button size="lg">
                Ver Tutorial
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-4">Lotes por Zona</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KPICard
            title="Recepción"
            value={lotesRecepcion.toString()}
            icon={ClipboardList}
          />
          <KPICard
            title="Asado"
            value={lotesAsado.toString()}
            icon={Factory}
          />
          <KPICard
            title="Pelado"
            value={lotesPelado.toString()}
            icon={Factory}
          />
          <KPICard
            title="Envasado"
            value={lotesEnvasado.toString()}
            icon={Package}
          />
          <KPICard
            title="Esterilizado"
            value={lotesEsterilizado.toString()}
            icon={ClipboardCheck}
          />
          <KPICard
            title="Aprobados"
            value={lotesAprobados.toString()}
            icon={Package}
          />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Accesos Rápidos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickAccessLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`${link.bgColor} p-3 rounded-lg`}>
                        <Icon className={`h-6 w-6 ${link.color}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{link.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {link.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Lotes Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={recentColumns}
              data={recentBatches}
              onView={(row) => console.log("View batch:", row)}
              itemsPerPage={5}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Próximos a Caducar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={expiringColumns}
              data={expiringBatches}
              onView={(row) => console.log("View expiring batch:", row)}
              itemsPerPage={5}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
