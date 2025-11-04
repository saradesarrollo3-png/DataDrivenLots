import { KPICard } from "../kpi-card";
import { Package, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

export default function KPICardExample() {
  return (
    <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
  );
}
