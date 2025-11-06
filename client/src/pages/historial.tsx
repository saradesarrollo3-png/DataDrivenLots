
import { useState } from "react";
import { DataTable, Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
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
}

export default function Historial() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: historyData = [] } = useQuery<any[]>({
    queryKey: ['/api/batch-history'],
  });

  const historyEntries: HistoryEntry[] = historyData.map(item => ({
    id: item.history.id,
    batchCode: item.batch?.batchCode || '-',
    product: item.product?.name || '-',
    action: item.history.action,
    fromStatus: item.history.fromStatus || '-',
    toStatus: item.history.toStatus || '-',
    notes: item.history.notes || '-',
    createdAt: new Date(item.history.createdAt).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }));

  const translateAction = (action: string): string => {
    const translations: Record<string, string> = {
      'created': 'Creado',
      'received': 'Recibido',
      'status_changed': 'Cambio de Estado',
      'roasted': 'Asado',
      'peeled': 'Pelado',
      'packaged': 'Envasado',
      'sterilized': 'Esterilizado',
      'quality_checked': 'Control de Calidad',
      'approved': 'Aprobado',
      'rejected': 'Rechazado',
      'shipped': 'Expedido',
      'partial_shipment': 'Expedición Parcial',
    };
    return translations[action] || action.replace('_', ' ');
  };

  const translateStatus = (status: string): string => {
    const translations: Record<string, string> = {
      'received': 'Recibido',
      'asado': 'Asado',
      'pelado': 'Pelado',
      'envasado': 'Envasado',
      'esterilizado': 'Esterilizado',
      'quality_check': 'Control de Calidad',
      'approved': 'Aprobado',
      'rejected': 'Rechazado',
      'shipped': 'Expedido',
      'in_transit': 'En Tránsito',
      'delivered': 'Entregado',
    };
    return translations[status] || status;
  };

  const columns: Column<HistoryEntry>[] = [
    { 
      key: "createdAt", 
      label: "Fecha/Hora"
    },
    { 
      key: "batchCode", 
      label: "Código Lote",
      render: (value) => <span className="font-mono font-medium">{value}</span>
    },
    { key: "product", label: "Producto" },
    { 
      key: "action", 
      label: "Acción",
      render: (value) => <span className="capitalize">{translateAction(value)}</span>
    },
    { 
      key: "fromStatus", 
      label: "Estado Anterior",
      render: (value) => value !== '-' ? <StatusBadge status={value} label={translateStatus(value)} /> : '-'
    },
    { 
      key: "toStatus", 
      label: "Nuevo Estado",
      render: (value) => value !== '-' ? <StatusBadge status={value} label={translateStatus(value)} /> : '-'
    },
    { key: "notes", label: "Notas" },
  ];

  const filteredEntries = historyEntries.filter(entry => 
    entry.batchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Historial</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registro completo de todas las operaciones
        </p>
      </div>

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
