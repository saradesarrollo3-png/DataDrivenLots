
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Package, Truck, CheckCircle, ClipboardCheck, Flame, Scissors, PackageIcon, Droplets } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ShippedBatch {
  id: string;
  batchCode: string;
  product: string;
  customer: string;
  quantity: number;
  unit: string;
  shippedAt: string;
  shipmentCode: string;
}

interface TraceabilityStep {
  id: string;
  stage: string;
  icon: any;
  color: string;
  timestamp: string;
  status: string;
  details: {
    label: string;
    value: string;
  }[];
}

export default function Trazabilidad() {
  const [searchCode, setSearchCode] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  const { data: shipments = [] } = useQuery<any[]>({
    queryKey: ['/api/shipments'],
  });

  const { data: allBatches = [] } = useQuery<any[]>({
    queryKey: ['/api/batches'],
  });

  const { data: productionRecords = [] } = useQuery<any[]>({
    queryKey: ['/api/production-records'],
  });

  const { data: qualityChecks = [] } = useQuery<any[]>({
    queryKey: ['/api/quality-checks'],
  });

  // Obtener lotes expedidos únicamente
  const shippedBatches: ShippedBatch[] = shipments.map((item: any) => {
    const batch = allBatches.find((b: any) => b.batch.id === item.shipment.batchId);
    return {
      id: item.shipment.batchId,
      batchCode: batch?.batch.batchCode || item.batch?.batchCode || '-',
      product: batch?.product?.name || item.product?.name || '-',
      customer: item.customer?.name || '-',
      quantity: parseFloat(item.shipment.quantity),
      unit: item.shipment.unit,
      shippedAt: new Date(item.shipment.shippedAt).toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      shipmentCode: item.shipment.shipmentCode,
    };
  });

  const selectedBatch = selectedBatchId 
    ? shippedBatches.find(b => b.id === selectedBatchId)
    : null;

  const buildTraceability = (batchId: string): TraceabilityStep[] => {
    const batch = allBatches.find((b: any) => b.batch.id === batchId);
    if (!batch) return [];

    const steps: TraceabilityStep[] = [];

    // Función recursiva para rastrear materia prima
    const traceRawMaterial = (currentBatchId: string, visitedBatches: Set<string> = new Set()): any[] => {
      if (visitedBatches.has(currentBatchId)) return [];
      visitedBatches.add(currentBatchId);

      const currentBatch = allBatches.find((b: any) => b.batch.id === currentBatchId);
      if (!currentBatch) return [];

      // Buscar registros de producción donde este lote es el output
      const productionRecord = productionRecords.find((pr: any) => 
        pr.record.batchId === currentBatchId
      );

      if (productionRecord && productionRecord.record.inputBatchDetails) {
        try {
          const inputBatchDetails = JSON.parse(productionRecord.record.inputBatchDetails);
          
          // Rastrear recursivamente cada lote de entrada
          const inputBatches = inputBatchDetails.map((detail: any) => {
            const inputBatch = allBatches.find((b: any) => b.batch.id === detail.batchId);
            return {
              ...inputBatch,
              usedQuantity: detail.quantity
            };
          });

          // Continuar rastreando recursivamente
          const deeperBatches = inputBatches.flatMap((ib: any) => 
            ib ? traceRawMaterial(ib.batch.id, visitedBatches) : []
          );

          return [...inputBatches, ...deeperBatches];
        } catch (e) {
          console.error('Error parsing inputBatchDetails:', e);
        }
      }

      // Si es un lote de recepción (materia prima), devolverlo
      if (currentBatch.batch.status === 'RECEPCION' || currentBatch.batch.supplierId) {
        return [currentBatch];
      }

      return [];
    };

    // 1. MATERIA PRIMA (Recepción)
    const rawMaterialBatches = traceRawMaterial(batchId);
    
    rawMaterialBatches.forEach((rawBatch: any) => {
      if (rawBatch) {
        steps.push({
          id: `reception-${rawBatch.batch.id}`,
          stage: 'Recepción de Materia Prima',
          icon: Package,
          color: 'text-blue-600',
          timestamp: rawBatch.batch.processedDate 
            ? new Date(rawBatch.batch.processedDate).toLocaleString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })
            : new Date(rawBatch.batch.arrivedAt).toLocaleString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              }),
          status: 'RECEPCION',
          details: [
            { label: 'Lote', value: rawBatch.batch.batchCode },
            { label: 'Proveedor', value: rawBatch.supplier?.name || '-' },
            { label: 'Producto', value: rawBatch.product?.name || '-' },
            { label: 'Cantidad Recibida', value: `${rawBatch.batch.initialQuantity || rawBatch.batch.quantity} ${rawBatch.batch.unit}` },
            { label: 'Temperatura', value: rawBatch.batch.temperature ? `${parseFloat(rawBatch.batch.temperature).toFixed(1)}°C` : '-' },
            { label: 'Albarán', value: rawBatch.batch.deliveryNote || '-' },
            { label: 'Matrícula', value: rawBatch.batch.truckPlate || '-' },
          ]
        });
      }
    });

    // 2. ASADO
    const asadoRecord = productionRecords.find((pr: any) => 
      pr.record.stage === 'ASADO' && pr.record.outputBatchCode === batch.batch.batchCode
    );
    
    if (asadoRecord) {
      const asadoBatch = allBatches.find((b: any) => b.batch.id === asadoRecord.record.batchId);
      steps.push({
        id: `asado-${asadoRecord.record.id}`,
        stage: 'Asado',
        icon: Flame,
        color: 'text-orange-600',
        timestamp: asadoRecord.record.processedDate
          ? new Date(asadoRecord.record.processedDate).toLocaleString('es-ES', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })
          : new Date(asadoRecord.record.completedAt || asadoRecord.record.createdAt).toLocaleString('es-ES', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            }),
        status: 'ASADO',
        details: [
          { label: 'Lote Salida', value: asadoRecord.record.outputBatchCode },
          { label: 'Lotes Entrada', value: asadoRecord.record.inputBatchCode },
          { label: 'Cantidad Entrada', value: `${asadoRecord.record.inputQuantity} ${asadoRecord.record.unit}` },
          { label: 'Cantidad Salida', value: `${asadoRecord.record.outputQuantity} ${asadoRecord.record.unit}` },
          { label: 'Notas', value: asadoRecord.record.notes || '-' },
        ]
      });
    }

    // 3. PELADO - buscar lotes que pasaron de ASADO a PELADO
    const peladoBatch = allBatches.find((b: any) => 
      b.batch.batchCode === batch.batch.batchCode && b.batch.status === 'PELADO'
    );
    
    if (peladoBatch && peladoBatch.batch.processedDate) {
      steps.push({
        id: `pelado-${peladoBatch.batch.id}`,
        stage: 'Pelado y Corte',
        icon: Scissors,
        color: 'text-blue-600',
        timestamp: new Date(peladoBatch.batch.processedDate).toLocaleString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }),
        status: 'PELADO',
        details: [
          { label: 'Lote', value: peladoBatch.batch.batchCode },
          { label: 'Cantidad', value: `${peladoBatch.batch.quantity} ${peladoBatch.batch.unit}` },
        ]
      });
    }

    // 4. ENVASADO
    const envasadoRecords = productionRecords.filter((pr: any) => 
      pr.record.stage === 'ENVASADO' && 
      pr.record.inputBatchCode.includes(batch.batch.batchCode)
    );

    envasadoRecords.forEach((envRecord: any) => {
      steps.push({
        id: `envasado-${envRecord.record.id}`,
        stage: 'Envasado',
        icon: PackageIcon,
        color: 'text-green-600',
        timestamp: envRecord.record.processedDate
          ? new Date(envRecord.record.processedDate).toLocaleString('es-ES', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })
          : new Date(envRecord.record.completedAt || envRecord.record.createdAt).toLocaleString('es-ES', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            }),
        status: 'ENVASADO',
        details: [
          { label: 'Lote Salida', value: envRecord.record.outputBatchCode },
          { label: 'Lotes Entrada', value: envRecord.record.inputBatchCode },
          { label: 'Cantidad Entrada', value: `${envRecord.record.inputQuantity} ${envRecord.record.unit}` },
          { label: 'Cantidad Salida', value: `${envRecord.record.outputQuantity} envases` },
          { label: 'Notas', value: envRecord.record.notes || '-' },
        ]
      });
    });

    // 5. ESTERILIZADO
    const esterilizadoRecord = productionRecords.find((pr: any) => 
      pr.record.stage === 'ESTERILIZADO' && pr.record.batchId === batchId
    );

    if (esterilizadoRecord) {
      steps.push({
        id: `esterilizado-${esterilizadoRecord.record.id}`,
        stage: 'Esterilizado',
        icon: Droplets,
        color: 'text-purple-600',
        timestamp: esterilizadoRecord.record.processedDate
          ? new Date(esterilizadoRecord.record.processedDate).toLocaleString('es-ES', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })
          : new Date(esterilizadoRecord.record.completedAt || esterilizadoRecord.record.createdAt).toLocaleString('es-ES', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            }),
        status: 'ESTERILIZADO',
        details: [
          { label: 'Lote Salida', value: esterilizadoRecord.record.outputBatchCode },
          { label: 'Lote Entrada', value: esterilizadoRecord.record.inputBatchCode },
          { label: 'Cantidad', value: `${esterilizadoRecord.record.outputQuantity} ${esterilizadoRecord.record.unit}` },
          { label: 'Notas', value: esterilizadoRecord.record.notes || '-' },
        ]
      });
    }

    // 6. CONTROL DE CALIDAD
    const qualityCheck = qualityChecks.find((qc: any) => qc.check.batchId === batchId);
    
    if (qualityCheck) {
      const approved = qualityCheck.check.approved === 1;
      steps.push({
        id: `quality-${qualityCheck.check.id}`,
        stage: 'Control de Calidad',
        icon: ClipboardCheck,
        color: approved ? 'text-green-600' : 'text-red-600',
        timestamp: new Date(qualityCheck.check.checkedAt).toLocaleString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }),
        status: approved ? 'APROBADO' : 'BLOQUEADO',
        details: [
          { label: 'Resultado', value: approved ? 'Aprobado para venta' : 'Rechazado' },
          { label: 'Notas', value: qualityCheck.check.notes || '-' },
          { label: 'Fecha Caducidad', value: batch.batch.expiryDate ? new Date(batch.batch.expiryDate).toLocaleDateString('es-ES') : '-' },
        ]
      });
    }

    // 7. EXPEDICIÓN
    const shipment = shipments.find((s: any) => s.shipment.batchId === batchId);
    
    if (shipment) {
      steps.push({
        id: `shipment-${shipment.shipment.id}`,
        stage: 'Expedición',
        icon: Truck,
        color: 'text-indigo-600',
        timestamp: new Date(shipment.shipment.shippedAt).toLocaleString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }),
        status: 'EXPEDIDO',
        details: [
          { label: 'Código Expedición', value: shipment.shipment.shipmentCode },
          { label: 'Cliente', value: shipment.customer?.name || '-' },
          { label: 'Cantidad', value: `${shipment.shipment.quantity} ${shipment.shipment.unit}` },
          { label: 'Matrícula', value: shipment.shipment.truckPlate || '-' },
          { label: 'Albarán', value: shipment.shipment.deliveryNote || '-' },
        ]
      });
    }

    return steps;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchCode.trim()) {
      const found = shippedBatches.find(b => 
        b.batchCode.toLowerCase().includes(searchCode.toLowerCase()) ||
        b.shipmentCode.toLowerCase().includes(searchCode.toLowerCase())
      );
      if (found) {
        setSelectedBatchId(found.id);
      } else {
        setSelectedBatchId(null);
      }
    }
  };

  const traceabilitySteps = selectedBatchId ? buildTraceability(selectedBatchId) : [];

  const filteredBatches = searchCode.trim()
    ? shippedBatches.filter(b => 
        b.batchCode.toLowerCase().includes(searchCode.toLowerCase()) ||
        b.shipmentCode.toLowerCase().includes(searchCode.toLowerCase()) ||
        b.product.toLowerCase().includes(searchCode.toLowerCase()) ||
        b.customer.toLowerCase().includes(searchCode.toLowerCase())
      )
    : shippedBatches;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Trazabilidad de Lotes Expedidos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Consulta el historial completo de cualquier lote expedido desde materia prima hasta cliente
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Busca por código de lote o expedición..."
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            className="pl-9"
            data-testid="input-search-batch"
          />
        </div>
        <Button type="submit" data-testid="button-search">
          Buscar
        </Button>
      </form>

      {/* Lista de lotes expedidos */}
      {!selectedBatchId && (
        <Card>
          <CardHeader>
            <CardTitle>Lotes Expedidos ({shippedBatches.length})</CardTitle>
            <CardDescription>
              Haz clic en un lote para ver su trazabilidad completa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredBatches.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {searchCode ? 'No se encontraron lotes con ese criterio' : 'No hay lotes expedidos'}
                </p>
              ) : (
                filteredBatches.map((batch) => (
                  <button
                    key={batch.id}
                    onClick={() => setSelectedBatchId(batch.id)}
                    className="w-full text-left p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-medium">{batch.batchCode}</span>
                          <Badge variant="outline">{batch.shipmentCode}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {batch.product} • Cliente: {batch.customer}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Expedido: {batch.shippedAt} • {batch.quantity} {batch.unit}
                        </div>
                      </div>
                      <Search className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trazabilidad completa */}
      {selectedBatchId && selectedBatch && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedBatchId(null)}
            >
              ← Volver a lista
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Información del Lote Expedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Código de Lote</p>
                  <p className="font-medium font-mono">{selectedBatch.batchCode}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Producto</p>
                  <p className="font-medium">{selectedBatch.product}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{selectedBatch.customer}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Código Expedición</p>
                  <p className="font-medium font-mono">{selectedBatch.shipmentCode}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historial de Trazabilidad Completo</CardTitle>
              <CardDescription>
                Flujo completo desde materia prima hasta expedición ({traceabilitySteps.length} pasos)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {traceabilitySteps.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay historial de trazabilidad para este lote
                </p>
              ) : (
                <div className="relative">
                  {/* Línea vertical de conexión */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
                  
                  <div className="space-y-6">
                    {traceabilitySteps.map((step, index) => {
                      const Icon = step.icon;
                      return (
                        <div key={step.id} className="relative pl-16">
                          {/* Icono */}
                          <div className="absolute left-0 top-0 w-12 h-12 rounded-full bg-background border-2 border-border flex items-center justify-center">
                            <Icon className={`h-6 w-6 ${step.color}`} />
                          </div>

                          {/* Contenido */}
                          <div className="border rounded-lg p-4 bg-card">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-lg">{step.stage}</h3>
                                <p className="text-sm text-muted-foreground">{step.timestamp}</p>
                              </div>
                              <StatusBadge status={step.status as any} />
                            </div>

                            <Separator className="my-3" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {step.details.map((detail, detailIndex) => (
                                <div key={detailIndex}>
                                  <p className="text-xs text-muted-foreground">{detail.label}</p>
                                  <p className="text-sm font-medium">{detail.value}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Número de paso */}
                          <div className="absolute -left-1 top-14 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
