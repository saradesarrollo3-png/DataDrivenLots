import { useState, useEffect, useRef } from "react";
import { DataTable, Column } from "@/components/data-table";
import { StatusBadge, BatchStatus } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Printer, QrCode } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QRCodeLib from "qrcode";

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

interface ReceptionBatch {
  id: string;
  batchCode: string;
  product: string;
  supplier: string;
  quantity: number;
  unit: string;
  temperature: number | null; // Allow null for temperature
  truckPlate: string | null; // Allow null for truckPlate
  deliveryNote: string;
  arrivedAt: string;
  locationName: string;
  status: BatchStatus;
}

export default function Etiquetas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTermReception, setSearchTermReception] = useState("");
  const [selectedBatch, setSelectedBatch] = useState<LabelBatch | null>(null);
  const [selectedReceptionBatch, setSelectedReceptionBatch] = useState<ReceptionBatch | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const qrReceptionCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (selectedBatch && qrCanvasRef.current) {
      const qrData = JSON.stringify({
        lote: selectedBatch.batchCode,
        producto: selectedBatch.product,
        cantidad: `${selectedBatch.quantity} ${selectedBatch.unit}`,
        caducidad: selectedBatch.expiryDate,
      });

      QRCodeLib.toCanvas(qrCanvasRef.current, qrData, {
        width: 200,
        margin: 1,
      }).catch((err) => {
        console.error("Error generating QR code:", err);
      });
    }
  }, [selectedBatch]);

  useEffect(() => {
    if (selectedReceptionBatch && qrReceptionCanvasRef.current) {
      const qrData: any = {
        lote: selectedReceptionBatch.batchCode,
        producto: selectedReceptionBatch.product,
        proveedor: selectedReceptionBatch.supplier,
        cantidad: `${selectedReceptionBatch.quantity} ${selectedReceptionBatch.unit}`,
        albaran: selectedReceptionBatch.deliveryNote,
        fecha: selectedReceptionBatch.arrivedAt,
        ubicacion: selectedReceptionBatch.locationName,
      };

      if (selectedReceptionBatch.temperature !== null) {
        qrData.temperatura = `${selectedReceptionBatch.temperature.toFixed(1)}°C`;
      }

      if (selectedReceptionBatch.truckPlate) {
        qrData.matricula = selectedReceptionBatch.truckPlate;
      }

      QRCodeLib.toCanvas(qrReceptionCanvasRef.current, JSON.stringify(qrData), {
        width: 200,
        margin: 1,
      }).catch((err) => {
        console.error("Error generating QR code:", err);
      });
    }
  }, [selectedReceptionBatch]);


  const { data: batchesData = [] } = useQuery<any[]>({
    queryKey: ['/api/batches'],
  });

  const batches: LabelBatch[] = batchesData
    .filter(item => item.batch.status === 'APROBADO')
    .map(item => ({
      id: item.batch.id,
      batchCode: item.batch.batchCode,
      product: item.product?.name || '-',
      quantity: parseFloat(item.batch.quantity), // Use initialQuantity for labels
      unit: item.batch.unit,
      manufactureDate: item.batch.manufactureDate 
        ? new Date(item.batch.manufactureDate).toLocaleDateString('es-ES')
        : '-',
      expiryDate: item.batch.expiryDate 
        ? new Date(item.batch.expiryDate).toLocaleDateString('es-ES')
        : '-',
      status: item.batch.status
    }));

  const receptionBatches: ReceptionBatch[] = batchesData
    .filter(item => item.batch.status === 'RECEPCION')
    .map(item => ({
      id: item.batch.id,
      batchCode: item.batch.batchCode,
      product: item.product?.name || '-',
      supplier: item.supplier?.name || '-',
      quantity: parseFloat(item.batch.quantity), // Display initialQuantity for reception labels
      unit: item.batch.unit,
      temperature: item.batch.temperature === 0 ? null : parseFloat(item.batch.temperature || '0'), // Fix bug: 0 should be null
      truckPlate: item.batch.truckPlate || null, // Handle null truckPlate
      deliveryNote: item.batch.deliveryNote || '-',
      arrivedAt: item.batch.processedDate 
        ? new Date(item.batch.processedDate).toLocaleString('es-ES')
        : new Date(item.batch.arrivedAt).toLocaleString('es-ES'),
      locationName: item.location?.name || '-',
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

  const receptionColumns: Column<ReceptionBatch>[] = [
    { 
      key: "batchCode", 
      label: "Código Lote",
      render: (value) => <span className="font-mono font-medium">{value}</span>
    },
    { key: "product", label: "Producto" },
    { key: "supplier", label: "Proveedor" },
    { 
      key: "quantity", 
      label: "Cantidad",
      render: (value, row) => `${value} ${row.unit}`
    },
    { 
      key: "temperature", 
      label: "Temp. (°C)",
      render: (value) => value !== null ? value.toFixed(1) : '-' // Display '-' if temperature is null
    },
    { key: "deliveryNote", label: "Albarán" },
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

  const filteredReceptionBatches = receptionBatches.filter(b => 
    b.batchCode.toLowerCase().includes(searchTermReception.toLowerCase()) ||
    b.product.toLowerCase().includes(searchTermReception.toLowerCase()) ||
    b.supplier.toLowerCase().includes(searchTermReception.toLowerCase())
  );

  const handlePrintLabel = (batch: LabelBatch) => {
    setSelectedBatch(batch);
    setSelectedReceptionBatch(null);
    console.log("Print label for:", batch);
  };

  const handlePrintReceptionLabel = (batch: ReceptionBatch) => {
    setSelectedReceptionBatch(batch);
    setSelectedBatch(null);
    console.log("Print reception label for:", batch);
  };

  const handlePrintQR = (batch: LabelBatch) => {
    console.log("Print QR for:", batch);
  };

  const handlePrintReceptionQR = (batch: ReceptionBatch) => {
    console.log("Print reception QR for:", batch);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Etiquetas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generación de etiquetas y códigos QR para lotes aprobados y recepcionados
          </p>
        </div>
      </div>

      <Tabs defaultValue="aprobados" className="space-y-4">
        <TabsList>
          <TabsTrigger value="aprobados">Lotes Aprobados</TabsTrigger>
          <TabsTrigger value="recepcionados">Lotes Recepcionados</TabsTrigger>
        </TabsList>

        <TabsContent value="aprobados" className="space-y-4">
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
                <h3 className="font-semibold mb-4">Vista Previa de Etiqueta - Lote Aprobado</h3>
                <div className="border-2 border-dashed border-muted p-8 space-y-2 font-mono text-sm">
                  <div className="text-center border-b pb-2 mb-4">
                    <p className="text-2xl font-bold">{selectedBatch.product}</p>
                  </div>
                  <p><strong>Lote:</strong> {selectedBatch.batchCode}</p>
                  <p><strong>Cantidad:</strong> {selectedBatch.quantity} {selectedBatch.unit}</p>
                  {selectedBatch.manufactureDate !== '-' && (
                    <p><strong>Fabricación:</strong> {selectedBatch.manufactureDate}</p>
                  )}
                  <p><strong>Caducidad:</strong> {selectedBatch.expiryDate}</p>
                  <div className="mt-4 pt-4 border-t text-center">
                    <div className="inline-block bg-white p-4">
                      <canvas ref={qrCanvasRef} />
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
        </TabsContent>

        <TabsContent value="recepcionados" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código, producto o proveedor..."
              value={searchTermReception}
              onChange={(e) => setSearchTermReception(e.target.value)}
              className="pl-9"
              data-testid="input-search-reception"
            />
          </div>

          <DataTable
            columns={receptionColumns}
            data={filteredReceptionBatches}
            onView={(row) => setSelectedReceptionBatch(row)}
            emptyMessage="No hay lotes recepcionados disponibles para etiquetar"
            customActions={(row) => (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePrintReceptionLabel(row)}
                  data-testid="button-print-reception-label"
                >
                  <Printer className="h-4 w-4 mr-1" />
                  Etiqueta
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePrintReceptionQR(row)}
                  data-testid="button-print-reception-qr"
                >
                  <QrCode className="h-4 w-4 mr-1" />
                  QR
                </Button>
              </div>
            )}
          />

          {selectedReceptionBatch && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Vista Previa de Etiqueta - Recepción</h3>
                <div className="border-2 border-dashed border-muted p-8 space-y-2 font-mono text-sm">
                  <div className="text-center border-b pb-2 mb-4">
                    <p className="text-2xl font-bold">{selectedReceptionBatch.product}</p>
                    <p className="text-sm text-muted-foreground mt-1">MATERIA PRIMA</p>
                  </div>
                  <p><strong>Lote:</strong> {selectedReceptionBatch.batchCode}</p>
                  <p><strong>Proveedor:</strong> {selectedReceptionBatch.supplier}</p>
                  <p><strong>Cantidad:</strong> {selectedReceptionBatch.quantity} {selectedReceptionBatch.unit}</p>
                  <p><strong>Temperatura:</strong> {selectedReceptionBatch.temperature !== null ? selectedReceptionBatch.temperature.toFixed(1) : '-' }°C</p>
                  {selectedReceptionBatch.deliveryNote !== '-' && (
                    <p><strong>Nº Albarán:</strong> {selectedReceptionBatch.deliveryNote}</p>
                  )}
                  {selectedReceptionBatch.truckPlate !== null && (
                    <p><strong>Matrícula:</strong> {selectedReceptionBatch.truckPlate}</p>
                  )}
                  <p><strong>Fecha Recepción:</strong> {selectedReceptionBatch.arrivedAt}</p>
                  {selectedReceptionBatch.locationName !== '-' && (
                    <p><strong>Ubicación:</strong> {selectedReceptionBatch.locationName}</p>
                  )}
                  <div className="mt-4 pt-4 border-t text-center">
                    <div className="inline-block bg-white p-4">
                      <canvas ref={qrReceptionCanvasRef} />
                      <p className="text-xs mt-2">{selectedReceptionBatch.batchCode}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button className="flex-1" onClick={() => handlePrintReceptionLabel(selectedReceptionBatch)}>
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir Etiqueta
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedReceptionBatch(null)}>
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}