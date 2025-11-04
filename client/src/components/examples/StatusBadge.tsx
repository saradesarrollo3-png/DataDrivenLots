import { StatusBadge } from "../status-badge";

export default function StatusBadgeExample() {
  return (
    <div className="p-8 space-y-4">
      <div className="flex flex-wrap gap-2">
        <StatusBadge status="RECEPCION" />
        <StatusBadge status="EN_PROCESO" />
        <StatusBadge status="RETENIDO" />
        <StatusBadge status="APROBADO" />
        <StatusBadge status="BLOQUEADO" />
        <StatusBadge status="EXPEDIDO" />
      </div>
    </div>
  );
}
