
import { useState } from "react";
import { DataTable, Column } from "@/components/data-table";
import { StatusBadge, BatchStatus } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Printer, QrCode } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";

interface LabelBatch {
  id: string;
  batchCode: string;
  product: string;
  quantity: number;
  unit: string;
  manufactureDate: string;
  expiryDate: string;
  status: BatchStatus;
}

export default function Etiquetas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBatch, setSelectedBatch] = useState<LabelBatch | null>(null);

  const { data: batchesData = [] } = useQuery<any[]>({
    queryKey: ['/api/batches'],
  });

  const batches: LabelBatch[] = batchesData
    .filter(item => item.batch.status === 'APROBADO')
    .map(item => ({
      id: item.batch.id,
      batchCode: item.batch.batchCode,
      product: item.product?.name || '-',
      quantity: parseFloat(item.batch.quantity),
      unit: item.batch.unit,
      manufactureDate: item.batch.manufactureDate 
        ? new Date(item.batch.manufactureDate).toLocaleDateString('es-ES')
        : '-',
      expiryDate: item.batch.expiryDate 
        ? new Date(item.batch.expiryDate).toLocaleDateString('es-ES')
        : '-',
      status: item.batch.status
    }));

  const columns: Column<LabelBatch>[] = [
    { 
      key: "batchCode", 
      label: "Código Lote",
      render: (value) => <span className="font-mono font-medium">{value}</span>
    },
    { key: "product", label: "Producto" },
    { 
      key: "quantity", 
      label: "Cantidad",
      render: (value, row) => `${value} ${row.unit}`
    },
    { key: "manufactureDate", label: "Fabricación" },
    { key: "expiryDate", label: "Caducidad" },
    { 
      key: "status", 
      label: "Estado",
      render: (value) => <StatusBadge status={value} />
    },
  ];

  const filteredBatches = batches.filter(b => 
    b.batchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.product.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrintLabel = (batch: LabelBatch) => {
    setSelectedBatch(batch);
    // In production, this would trigger actual label printing
    console.log("Print label for:", batch);
  };

  const handlePrintQR = (batch: LabelBatch) => {
    // In production, this would generate and print QR code
    console.log("Print QR for:", batch);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Etiquetas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generación de etiquetas y códigos QR para lotes aprobados
          </p>
        </div>
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
        data={filteredBatches}
        onView={(row) => setSelectedBatch(row)}
        emptyMessage="No hay lotes aprobados disponibles para etiquetar"
        customActions={(row) => (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePrintLabel(row)}
              data-testid="button-print-label"
            >
              <Printer className="h-4 w-4 mr-1" />
              Etiqueta
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePrintQR(row)}
              data-testid="button-print-qr"
            >
              <QrCode className="h-4 w-4 mr-1" />
              QR
            </Button>
          </div>
        )}
      />

      {selectedBatch && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Vista Previa de Etiqueta</h3>
            <div className="border-2 border-dashed border-muted p-8 space-y-2 font-mono text-sm">
              <div className="text-center border-b pb-2 mb-4">
                <p className="text-2xl font-bold">{selectedBatch.product}</p>
              </div>
              <p><strong>Lote:</strong> {selectedBatch.batchCode}</p>
              <p><strong>Cantidad:</strong> {selectedBatch.quantity} {selectedBatch.unit}</p>
              <p><strong>Fabricación:</strong> {selectedBatch.manufactureDate}</p>
              <p><strong>Caducidad:</strong> {selectedBatch.expiryDate}</p>
              <div className="mt-4 pt-4 border-t text-center">
                <div className="inline-block bg-muted p-4">
                  <QrCode className="h-24 w-24" />
                  <p className="text-xs mt-2">{selectedBatch.batchCode}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button className="flex-1" onClick={() => handlePrintLabel(selectedBatch)}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir Etiqueta
              </Button>
              <Button variant="outline" onClick={() => setSelectedBatch(null)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
