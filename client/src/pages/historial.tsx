import { useState } from "react";
import { DataTable, Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  Clock,
  ChevronDown,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useQuery } from "@tanstack/react-query";

interface HistoryEntry {
  id: string;
  batchCode: string;
  product: string;
  action: string;
  fromStatus: string;
  toStatus: string;
  notes: string;
  createdAt: string;
  txHash?: string; // Nuevo campo opcional
}

export default function Historial() {
  const [searchTerm, setSearchTerm] = useState("");

  // NOTA: Para que el txHash aparezca aquí, asegúrate de que tu endpoint /api/batch-history
  // devuelva también los datos de traceability_events o que hayas guardado el hash en batch_history.
  // Si no, esta columna saldrá vacía hasta que conectes esos datos en el backend.
  const { data: historyData = [] } = useQuery<any[]>({
    queryKey: ["/api/batch-history"],
  });

  const historyEntries: HistoryEntry[] = historyData.map((item) => ({
    id: item.history.id,
    batchCode: item.batch?.batchCode || "-",
    product: item.product?.name || "-",
    action: item.history.action,
    fromStatus: item.history.fromStatus || "-",
    toStatus: item.history.toStatus || "-",
    notes: item.history.notes || "-",
    // Intentamos buscar el hash si viene en el objeto (depende de tu backend)
    txHash: item.history.txHash || item.txHash || null,
    createdAt: new Date(item.history.createdAt).toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
  }));

  const translateAction = (action: string): string => {
    const translations: Record<string, string> = {
      created: "Creado",
      received: "Recibido",
      status_changed: "Cambio de Estado",
      roasted: "Asado",
      peeled: "Pelado",
      packaged: "Envasado",
      sterilized: "Esterilizado",
      quality_checked: "Control de Calidad",
      approved: "Aprobado",
      rejected: "Rechazado",
      shipped: "Expedido",
      partial_shipment: "Expedición Parcial",
    };
    return translations[action] || action.replace("_", " ");
  };

  const translateStatus = (status: string): string => {
    const translations: Record<string, string> = {
      received: "Recibido",
      asado: "Asado",
      pelado: "Pelado",
      envasado: "Envasado",
      esterilizado: "Esterilizado",
      quality_check: "Control de Calidad",
      approved: "Aprobado",
      rejected: "Rechazado",
      shipped: "Expedido",
      in_transit: "En Tránsito",
      delivered: "Entregado",
    };
    return translations[status] || status;
  };

  const columns: Column<HistoryEntry>[] = [
    {
      key: "createdAt",
      label: "Fecha/Hora",
    },
    {
      key: "batchCode",
      label: "Código Lote",
      render: (value) => <span className="font-mono font-medium">{value}</span>,
    },
    { key: "product", label: "Producto" },
    {
      key: "action",
      label: "Acción",
      render: (value) => (
        <span className="capitalize">{translateAction(value)}</span>
      ),
    },
    {
      key: "fromStatus",
      label: "Estado Anterior",
      render: (value) =>
        value !== "-" ? (
          <StatusBadge status={value} label={translateStatus(value)} />
        ) : (
          "-"
        ),
    },
    {
      key: "toStatus",
      label: "Nuevo Estado",
      render: (value) =>
        value !== "-" ? (
          <StatusBadge status={value} label={translateStatus(value)} />
        ) : (
          "-"
        ),
    },
    {
      key: "txHash",
      label: "Blockchain",
      render: (value) =>
        value ? (
          <a
            href={`https://sepolia.etherscan.io/tx/${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors w-fit font-medium text-xs border border-blue-200"
            onClick={(e) => e.stopPropagation()}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Verificar
            <ExternalLink className="h-3 w-3 opacity-50" />
          </a>
        ) : (
          <span className="text-muted-foreground text-xs opacity-50">-</span>
        ),
    },
  ];

  const filteredEntries = historyEntries.filter(
    (entry) =>
      entry.batchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.action.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Historial</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registro completo de todas las operaciones
        </p>
      </div>

      <Collapsible defaultOpen={false}>
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900">
          <CardHeader>
            <CollapsibleTrigger className="flex items-center justify-between w-full hover:opacity-80 transition-opacity">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                ¿Qué muestra el Historial?
              </CardTitle>
              <ChevronDown className="h-5 w-5 text-amber-600 dark:text-amber-400 transition-transform duration-200 data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-2 mt-0.5">
                  <span className="text-amber-600 dark:text-amber-400 font-semibold text-xs">
                    1
                  </span>
                </div>
                <div>
                  <p className="font-medium">Certificación Blockchain</p>
                  <p className="text-muted-foreground">
                    Los registros marcados con{" "}
                    <ShieldCheck className="h-3 w-3 inline text-blue-600" />{" "}
                    están inmutablemente guardados en la red Ethereum Sepolia.
                    Haz clic para ver el certificado oficial.
                  </p>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por lote, producto o acción..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
          data-testid="input-search"
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredEntries}
        emptyMessage="No hay registros en el historial"
      />
    </div>
  );
}
