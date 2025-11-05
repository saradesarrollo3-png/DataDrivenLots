import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type BatchStatus =
  | "RECEPCION"
  | "EN_PROCESO"
  | "RETENIDO"
  | "APROBADO"
  | "BLOQUEADO"
  | "EXPEDIDO"
  | "ASADO"
  | "PELADO_CORTE"
  | "ENVASADO"
  | "ESTERILIZADO"
  | "Completado"
  | "En Proceso";

const statusConfig: Record<
  BatchStatus,
  { label: string; className: string }
> = {
  RECEPCION: {
    label: "Recepción",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  },
  EN_PROCESO: {
    label: "En Proceso",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  },
  RETENIDO: {
    label: "Retenido",
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  },
  APROBADO: {
    label: "Aprobado",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  },
  BLOQUEADO: {
    label: "Bloqueado",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  },
  EXPEDIDO: {
    label: "Expedido",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300",
  },
  ASADO: {
    label: "Asado",
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  },
  PELADO_CORTE: {
    label: "Pelado y Corte",
    className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  },
  ENVASADO: {
    label: "Envasado",
    className: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  },
  ESTERILIZADO: {
    label: "Esterilizado",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  },
  "Completado": {
    label: "Completado",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  },
  "En Proceso": {
    label: "En Proceso",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  },
};

interface StatusBadgeProps {
  status: BatchStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    className: "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300"
  };
  
  return (
    <Badge
      variant="outline"
      className={cn(config.className, "font-medium border-0", className)}
      data-testid={`badge-status-${status.toLowerCase()}`}
    >
      {config.label}
    </Badge>
  );
}
