
import { KPICard } from "@/components/kpi-card";
import { DataTable, Column } from "@/components/data-table";
import { StatusBadge, BatchStatus } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingUp, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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

  // Calcular KPIs
  const totalLotes = batchesData.length;
  const lotesEnProceso = batchesData.filter((item: any) => item.batch.status === 'EN_PROCESO').length;
  const lotesRetenidos = batchesData.filter((item: any) => item.batch.status === 'RETENIDO').length;
  
  const today = new Date().toDateString();
  const lotesAprobadosHoy = batchesData.filter((item: any) => {
    const arrivedDate = new Date(item.batch.arrivedAt).toDateString();
    return item.batch.status === 'APROBADO' && arrivedDate === today;
  }).length;

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Vista general del sistema de trazabilidad
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Lotes"
          value={totalLotes.toString()}
          icon={Package}
        />
        <KPICard
          title="En Producción"
          value={lotesEnProceso.toString()}
          icon={TrendingUp}
        />
        <KPICard
          title="Retenidos"
          value={lotesRetenidos.toString()}
          icon={AlertTriangle}
        />
        <KPICard
          title="Aprobados Hoy"
          value={lotesAprobadosHoy.toString()}
          icon={CheckCircle}
        />
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
