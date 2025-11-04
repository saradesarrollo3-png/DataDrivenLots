import { KPICard } from "@/components/kpi-card";
import { DataTable, Column } from "@/components/data-table";
import { StatusBadge, BatchStatus } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingUp, AlertTriangle, CheckCircle, Clock } from "lucide-react";

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
  const recentBatches: RecentBatch[] = [
    { id: "1", code: "MP-20250104-0001", product: "Pimiento Asado", quantity: 250, unit: "kg", status: "RECEPCION", date: "2025-01-04" },
    { id: "2", code: "MP-20250104-0002", product: "Pimiento Rojo", quantity: 180, unit: "kg", status: "EN_PROCESO", date: "2025-01-04" },
    { id: "3", code: "EN-20250103-0045", product: "Pimiento Asado", quantity: 450, unit: "tarros", status: "RETENIDO", date: "2025-01-03" },
    { id: "4", code: "EN-20250103-0044", product: "Pimiento Verde", quantity: 380, unit: "tarros", status: "APROBADO", date: "2025-01-03" },
  ];

  const expiringBatches: ExpiringBatch[] = [
    { id: "1", code: "EN-20241220-0012", product: "Pimiento Asado 370g", expiryDate: "2025-01-15", daysLeft: 11 },
    { id: "2", code: "EN-20241222-0015", product: "Pimiento Verde 370g", expiryDate: "2025-01-18", daysLeft: 14 },
    { id: "3", code: "EN-20241225-0020", product: "Pimiento Rojo 370g", expiryDate: "2025-01-22", daysLeft: 18 },
  ];

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
          value="1,247"
          icon={Package}
          trend={{ value: 12.5, isPositive: true }}
        />
        <KPICard
          title="En Producción"
          value="89"
          icon={TrendingUp}
          trend={{ value: 8.2, isPositive: true }}
        />
        <KPICard
          title="Retenidos"
          value="12"
          icon={AlertTriangle}
          trend={{ value: -15.3, isPositive: false }}
        />
        <KPICard
          title="Aprobados Hoy"
          value="45"
          icon={CheckCircle}
          trend={{ value: 23.1, isPositive: true }}
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
