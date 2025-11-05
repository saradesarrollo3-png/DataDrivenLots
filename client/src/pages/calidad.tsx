import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable, Column } from "@/components/data-table";
import { StatusBadge, BatchStatus } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface QualityBatch {
  id: string;
  code: string;
  product: string;
  quantity: number;
  manufactureDate: string;
  expiryDate: string;
  status: BatchStatus;
}

export default function Calidad() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBatch, setSelectedBatch] = useState<QualityBatch | null>(null);

  const { data: pendingBatches = [] } = useQuery<any[]>({
    queryKey: ['/api/quality-checks/pending'],
  });

  const qualityBatches: QualityBatch[] = pendingBatches.map(item => ({
    id: item.batch.id,
    code: item.batch.batchCode,
    product: item.product?.name || '-',
    quantity: parseFloat(item.batch.quantity),
    manufactureDate: item.batch.manufactureDate ? new Date(item.batch.manufactureDate).toLocaleDateString('es-ES') : '-',
    expiryDate: item.batch.expiryDate ? new Date(item.batch.expiryDate).toLocaleDateString('es-ES') : '-',
    status: item.batch.status
  }));

  const handleApprove = (batch: QualityBatch) => {
    toast({
      title: "Lote Aprobado",
      description: `El lote ${batch.code} ha sido aprobado para venta.`,
    });
    setSelectedBatch(null);
  };

  const handleReject = (batch: QualityBatch) => {
    toast({
      title: "Lote Bloqueado",
      description: `El lote ${batch.code} ha sido bloqueado.`,
      variant: "destructive",
    });
    setSelectedBatch(null);
  };

  const columns: Column<QualityBatch>[] = [
    { 
      key: "code", 
      label: "Código Lote",
      render: (value) => <span className="font-mono font-medium">{value}</span>
    },
    { key: "product", label: "Producto" },
    { 
      key: "quantity", 
      label: "Cantidad",
      render: (value) => `${value} tarros`
    },
    { key: "manufactureDate", label: "Fabricación" },
    { key: "expiryDate", label: "Caducidad" },
    { 
      key: "status", 
      label: "Estado",
      render: (value) => <StatusBadge status={value} />
    },
  ];

  const filteredBatches = qualityBatches.filter(b => 
    b.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.product.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const retainedBatches = filteredBatches.filter(b => b.status === "RETENIDO");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Control de Calidad</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Revisión y liberación de lotes
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por código o producto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
          data-testid="input-search"
        />
      </div>

      <DataTable
        columns={columns}
        data={retainedBatches}
        onView={(row) => setSelectedBatch(row)}
        emptyMessage="No hay lotes retenidos pendientes de revisión"
      />

      <Dialog open={selectedBatch !== null} onOpenChange={(open) => !open && setSelectedBatch(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Revisión de Calidad</DialogTitle>
            <DialogDescription>
              Lote: {selectedBatch?.code} - {selectedBatch?.product}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-md">
              <div>
                <p className="text-sm text-muted-foreground">Cantidad</p>
                <p className="font-medium">{selectedBatch?.quantity} tarros</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha Fabricación</p>
                <p className="font-medium">{selectedBatch?.manufactureDate}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha Caducidad</p>
                <p className="font-medium">{selectedBatch?.expiryDate}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                {selectedBatch && <StatusBadge status={selectedBatch.status} />}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Checklist de Calidad</Label>
              <div className="space-y-2">
                {[
                  "Apariencia del producto conforme",
                  "Cierre hermético correcto",
                  "Peso neto dentro del rango",
                  "pH dentro de especificación",
                  "Ausencia de defectos visuales",
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Checkbox id={`check-${index}`} data-testid={`checkbox-quality-${index}`} />
                    <label
                      htmlFor={`check-${index}`}
                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {item}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observaciones</Label>
              <Textarea
                id="notes"
                placeholder="Notas adicionales sobre la revisión..."
                rows={4}
                data-testid="textarea-notes"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => selectedBatch && handleReject(selectedBatch)}
                data-testid="button-reject"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rechazar
              </Button>
              <Button
                onClick={() => selectedBatch && handleApprove(selectedBatch)}
                data-testid="button-approve"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprobar para Venta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
