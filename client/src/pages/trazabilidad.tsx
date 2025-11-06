
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
  shipmentId: string;
}

interface TraceabilityStep {
  id: string;
  stage: string;
  icon: any;
  color: string;
  timestamp: string;
  status: string;
  items: Array<{
    title?: string;
    details: {
      label: string;
      value: string;
    }[];
  }>;
}

export default function Trazabilidad() {
  const [searchCode, setSearchCode] = useState("");
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);

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

  const { data: batchHistory = [] } = useQuery<any[]>({
    queryKey: ['/api/batch-history'],
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
      shipmentId: item.shipment.id,
    };
  });

  const selectedShipment = selectedShipmentId 
    ? shipments.find(s => s.shipment.id === selectedShipmentId)
    : null;

  const selectedBatch = selectedShipment
    ? shippedBatches.find(b => b.shipmentId === selectedShipmentId)
    : null;

  const buildTraceability = (shipmentId: string): TraceabilityStep[] => {
    const shipment = shipments.find((s: any) => s.shipment.id === shipmentId);
    if (!shipment) return [];

    const steps: TraceabilityStep[] = [];
    const shippedBatchData = allBatches.find((b: any) => b.batch.id === shipment.shipment.batchId);
    if (!shippedBatchData) return [];

    const shippedBatchCode = shippedBatchData.batch.batchCode;
    const shippedQuantity = parseFloat(shipment.shipment.quantity);

    // 1. EXPEDICIÓN
    steps.push({
      id: 'shipment',
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
      items: [{
        title: 'Detalles de Expedición',
        details: [
          { label: 'Código Expedición', value: shipment.shipment.shipmentCode },
          { label: 'Cliente', value: shipment.customer?.name || '-' },
          { label: 'Lote Expedido', value: shippedBatchCode },
          { label: 'Cantidad Expedida', value: `${shippedQuantity} ${shipment.shipment.unit}` },
          { label: 'Matrícula', value: shipment.shipment.truckPlate || '-' },
          { label: 'Albarán', value: shipment.shipment.deliveryNote || '-' },
        ]
      }]
    });

    // 2. CONTROL DE CALIDAD - del lote expedido
    const qualityCheck = qualityChecks.find((qc: any) => qc.check.batchId === shipment.shipment.batchId);
    if (qualityCheck) {
      const approved = qualityCheck.check.approved === 1;
      steps.push({
        id: 'quality',
        stage: 'Control de Calidad',
        icon: ClipboardCheck,
        color: 'text-green-600',
        timestamp: new Date(qualityCheck.check.checkedAt).toLocaleString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }),
        status: 'APROBADO',
        items: [{
          title: shippedBatchCode,
          details: [
            { label: 'Resultado', value: approved ? 'Aprobado ✓' : 'Rechazado ✗' },
            { label: 'Producto', value: shippedBatchData.product?.name || '-' },
            { label: 'Cantidad Aprobada', value: `${shippedQuantity} ${shipment.shipment.unit}` },
            { label: 'Fecha Caducidad', value: shippedBatchData.batch.expiryDate ? new Date(shippedBatchData.batch.expiryDate).toLocaleDateString('es-ES') : '-' },
            { label: 'Notas', value: qualityCheck.check.notes || '-' },
          ]
        }]
      });
    }

    // 3. ESTERILIZADO - buscar registro que generó este lote
    const esterilizadoRecord = productionRecords.find((pr: any) => 
      pr.record.stage === 'ESTERILIZADO' && pr.record.outputBatchCode === shippedBatchCode
    );

    if (esterilizadoRecord) {
      steps.push({
        id: 'esterilizado',
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
        items: [{
          title: 'Proceso de Esterilizado',
          details: [
            { label: 'Lote Entrada', value: esterilizadoRecord.record.inputBatchCode },
            { label: 'Lote Salida', value: esterilizadoRecord.record.outputBatchCode },
            { label: 'Cantidad Procesada', value: `${shippedQuantity} ${esterilizadoRecord.record.unit}` },
            { label: 'Notas', value: esterilizadoRecord.record.notes || '-' },
          ]
        }]
      });

      // 4. ENVASADO - buscar el registro que generó el lote de entrada del esterilizado
      const inputBatchCodeForSterilization = esterilizadoRecord.record.inputBatchCode;
      
      // Primero buscar por coincidencia exacta del outputBatchCode
      let envasadoRecords = productionRecords.filter((pr: any) => 
        pr.record.stage === 'ENVASADO' && pr.record.outputBatchCode === inputBatchCodeForSterilization
      );

      // Si no hay coincidencia exacta, buscar por código base (sin sufijo)
      if (envasadoRecords.length === 0) {
        const baseCodeEnvasado = inputBatchCodeForSterilization.includes('-') && inputBatchCodeForSterilization.match(/-[A-Z]+$/i)
          ? inputBatchCodeForSterilization.substring(0, inputBatchCodeForSterilization.lastIndexOf('-'))
          : inputBatchCodeForSterilization;

        envasadoRecords = productionRecords.filter((pr: any) => {
          if (pr.record.stage !== 'ENVASADO') return false;
          const outputCode = pr.record.outputBatchCode;
          const baseCode = outputCode.includes('-') && outputCode.match(/-[A-Z]+$/i)
            ? outputCode.substring(0, outputCode.lastIndexOf('-'))
            : outputCode;
          return baseCode === baseCodeEnvasado;
        });
      }

      if (envasadoRecords.length > 0) {
        const firstEnvasado = envasadoRecords[0];
        const envasadoItems: any[] = [];

        // Calcular el código base del envasado
        const baseCodeEnvasado = inputBatchCodeForSterilization.includes('-') && inputBatchCodeForSterilization.match(/-[A-Z]+$/i)
          ? inputBatchCodeForSterilization.substring(0, inputBatchCodeForSterilization.lastIndexOf('-'))
          : inputBatchCodeForSterilization;

        // Información general del envasado
        envasadoItems.push({
          title: 'Entrada al Envasado',
          details: [
            { label: 'Lote Base', value: baseCodeEnvasado },
            { label: 'Lotes Entrada', value: firstEnvasado.record.inputBatchCode },
            { label: 'Cantidad Total Entrada', value: `${firstEnvasado.record.inputQuantity} ${firstEnvasado.record.unit}` },
          ]
        });

        // Cada tipo de envase generado
        envasadoRecords.forEach((envRecord: any) => {
          const outputQuantity = parseFloat(envRecord.record.outputQuantity);
          const tipoEnvase = envRecord.record.outputBatchCode.split('-').pop() || 'Estándar';
          
          // Determinar si este sublote específico fue expedido
          const isThisShipment = envRecord.record.outputBatchCode === shippedBatchCode;
          
          const itemDetails: any[] = [
            { label: 'Código Lote', value: envRecord.record.outputBatchCode },
            { label: 'Tipo de Envase', value: tipoEnvase },
            { label: 'Cantidad Producida', value: `${outputQuantity} frascos` },
          ];

          if (isThisShipment) {
            itemDetails.push({ 
              label: 'Expedido en este Albarán', 
              value: `${shippedQuantity} frascos ✓` 
            });
          }

          envasadoItems.push({
            title: isThisShipment ? `${tipoEnvase} (EXPEDIDO)` : tipoEnvase,
            details: itemDetails
          });
        });

        steps.push({
          id: 'envasado',
          stage: 'Envasado',
          icon: PackageIcon,
          color: 'text-green-600',
          timestamp: firstEnvasado.record.processedDate
            ? new Date(firstEnvasado.record.processedDate).toLocaleString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })
            : new Date(firstEnvasado.record.completedAt || firstEnvasado.record.createdAt).toLocaleString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              }),
          status: 'ENVASADO',
          items: envasadoItems
        });

        // 5. PELADO - buscar el lote que alimentó el envasado
        const inputBatchCodeEnvasado = firstEnvasado.record.inputBatchCode;
        
        // Buscar por coincidencia exacta primero
        let peladoRecord = productionRecords.find((pr: any) =>
          pr.record.stage === 'PELADO' && pr.record.outputBatchCode === inputBatchCodeEnvasado
        );

        // Si no hay coincidencia exacta, buscar por código parcial
        if (!peladoRecord) {
          peladoRecord = productionRecords.find((pr: any) => {
            if (pr.record.stage !== 'PELADO') return false;
            // Verificar si el inputBatchCode del envasado empieza con el outputBatchCode del pelado
            return inputBatchCodeEnvasado.startsWith(pr.record.outputBatchCode);
          });
        }

        if (peladoRecord) {
          const peladoItems: any[] = [];

          peladoItems.push({
            title: 'Salida del Pelado',
            details: [
              { label: 'Lote Salida', value: peladoRecord.record.outputBatchCode },
              { label: 'Cantidad Salida', value: `${peladoRecord.record.outputQuantity} ${peladoRecord.record.unit}` },
              { label: 'Utilizada en Envasado', value: `${firstEnvasado.record.inputQuantity} ${firstEnvasado.record.unit}` },
            ]
          });

          // Materias primas del pelado
          if (peladoRecord.record.inputBatchDetails) {
            try {
              const inputBatchDetails = JSON.parse(peladoRecord.record.inputBatchDetails);
              inputBatchDetails.forEach((detail: any) => {
                const inputBatch = allBatches.find((b: any) => b.batch.id === detail.batchId);
                if (inputBatch) {
                  peladoItems.push({
                    title: `Entrada: ${inputBatch.product?.name || detail.batchCode}`,
                    details: [
                      { label: 'Lote', value: detail.batchCode },
                      { label: 'Cantidad Consumida', value: `${detail.quantity} ${inputBatch.batch.unit}` },
                    ]
                  });
                }
              });
            } catch (e) {
              console.error('Error parsing inputBatchDetails:', e);
            }
          }

          steps.push({
            id: 'pelado',
            stage: 'Pelado y Corte',
            icon: Scissors,
            color: 'text-blue-600',
            timestamp: peladoRecord.record.processedDate
              ? new Date(peladoRecord.record.processedDate).toLocaleString('es-ES', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : new Date(peladoRecord.record.completedAt || peladoRecord.record.createdAt).toLocaleString('es-ES', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                }),
            status: 'PELADO',
            items: peladoItems
          });

          // 6. ASADO - buscar el lote que alimentó el pelado
          const inputBatchCodePelado = peladoRecord.record.inputBatchCode;
          
          // Buscar por coincidencia exacta primero
          let asadoRecord = productionRecords.find((pr: any) =>
            pr.record.stage === 'ASADO' && pr.record.outputBatchCode === inputBatchCodePelado
          );

          // Si no encontramos con el código exacto, buscar por coincidencia parcial
          if (!asadoRecord) {
            asadoRecord = productionRecords.find((pr: any) => {
              if (pr.record.stage !== 'ASADO') return false;
              return inputBatchCodePelado.startsWith(pr.record.outputBatchCode);
            });
          }

          // Si aún no encontramos, buscar cualquier registro de ASADO que tenga inputBatchDetails
          if (!asadoRecord) {
            const peladoBatchId = allBatches.find((b: any) => b.batch.batchCode === inputBatchCodePelado)?.batch.id;
            if (peladoBatchId) {
              asadoRecord = productionRecords.find((pr: any) => 
                pr.record.stage === 'ASADO' && pr.record.batchId === peladoBatchId
              );
            }
          }

          if (asadoRecord) {
            const asadoItems: any[] = [];

            asadoItems.push({
              title: 'Salida del Asado',
              details: [
                { label: 'Lote Salida', value: asadoRecord.record.outputBatchCode },
                { label: 'Cantidad Salida', value: `${asadoRecord.record.outputQuantity} ${asadoRecord.record.unit}` },
                { label: 'Utilizada en Pelado', value: `${peladoRecord.record.inputQuantity} ${peladoRecord.record.unit}` },
              ]
            });

            // Materias primas utilizadas en el asado
            let inputBatchDetailsForReception: any[] = [];
            if (asadoRecord.record.inputBatchDetails) {
              try {
                const inputBatchDetails = JSON.parse(asadoRecord.record.inputBatchDetails);
                inputBatchDetailsForReception = inputBatchDetails;
                
                inputBatchDetails.forEach((detail: any) => {
                  const inputBatch = allBatches.find((b: any) => b.batch.id === detail.batchId);
                  if (inputBatch) {
                    asadoItems.push({
                      title: `Materia Prima: ${inputBatch.product?.name || detail.batchCode}`,
                      details: [
                        { label: 'Lote', value: detail.batchCode },
                        { label: 'Proveedor', value: inputBatch.supplier?.name || '-' },
                        { label: 'Cantidad Consumida', value: `${detail.quantity} ${inputBatch.batch.unit}` },
                      ]
                    });
                  }
                });
              } catch (e) {
                console.error('Error parsing inputBatchDetails:', e);
              }
            }

            steps.push({
              id: 'asado',
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
              items: asadoItems
            });

            // 7. RECEPCIÓN - mostrar las materias primas utilizadas
            if (inputBatchDetailsForReception.length > 0) {
              const receptionItems: any[] = [];

              inputBatchDetailsForReception.forEach((detail: any) => {
                const rawBatch = allBatches.find((b: any) => b.batch.id === detail.batchId);
                if (rawBatch) {
                  const arrivedAt = new Date(rawBatch.batch.arrivedAt);

                  receptionItems.push({
                    title: rawBatch.product?.name || '-',
                    details: [
                      { label: 'Lote', value: rawBatch.batch.batchCode },
                      { label: 'Proveedor', value: rawBatch.supplier?.name || '-' },
                      { label: 'Cantidad Utilizada', value: `${detail.quantity} ${rawBatch.batch.unit}` },
                      { label: 'Cantidad Recepcionada', value: `${rawBatch.batch.initialQuantity} ${rawBatch.batch.unit}` },
                      { label: 'Fecha Recepción', value: arrivedAt.toLocaleString('es-ES', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) },
                      { label: 'Temperatura', value: rawBatch.batch.temperature ? `${parseFloat(rawBatch.batch.temperature).toFixed(1)}°C` : '-' },
                      { label: 'Albarán', value: rawBatch.batch.deliveryNote || '-' },
                    ]
                  });
                }
              });

              if (receptionItems.length > 0) {
                // Usar la fecha más reciente de recepción
                const latestReception = inputBatchDetailsForReception.reduce((latest: any, detail: any) => {
                  const batch = allBatches.find((b: any) => b.batch.id === detail.batchId);
                  if (!batch) return latest;
                  const date = new Date(batch.batch.arrivedAt);
                  return !latest || date > latest ? date : latest;
                }, null);

                steps.push({
                  id: 'reception',
                  stage: 'Recepción de Materia Prima',
                  icon: Package,
                  color: 'text-blue-600',
                  timestamp: latestReception ? latestReception.toLocaleString('es-ES', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : '-',
                  status: 'RECEPCION',
                  items: receptionItems
                });
              }
            } else {
              // Si no hay detalles de recepción desde production records, intentar extraer de batch history
              const asadoBatchHistory = batchHistory.filter((bh: any) => 
                bh.history.batchId === asadoRecord.record.batchId && 
                bh.history.toStatus === 'ASADO' &&
                bh.history.notes?.includes('Materias primas:')
              );

              if (asadoBatchHistory.length > 0) {
                const receptionItems: any[] = [];
                const historyNotes = asadoBatchHistory[0].history.notes;
                
                // Extraer información de las notas: "Materias primas: LOTE1: 100 kg, LOTE2: 50 kg"
                const materiaPrimaMatch = historyNotes.match(/Materias primas:\s*([^|]+)/);
                if (materiaPrimaMatch) {
                  const materiaPrimaStr = materiaPrimaMatch[1].trim();
                  const lotes = materiaPrimaStr.split(',').map((l: string) => l.trim());
                  
                  lotes.forEach((loteInfo: string) => {
                    // Buscar patrón "CODIGO: CANTIDAD kg"
                    const match = loteInfo.match(/^(.+?):\s*(.+)$/);
                    if (match) {
                      const batchCode = match[1].trim();
                      const quantity = match[2].trim();
                      const rawBatch = allBatches.find((b: any) => b.batch.batchCode === batchCode);
                      
                      if (rawBatch) {
                        const arrivedAt = new Date(rawBatch.batch.arrivedAt);
                        receptionItems.push({
                          title: rawBatch.product?.name || '-',
                          details: [
                            { label: 'Lote', value: rawBatch.batch.batchCode },
                            { label: 'Proveedor', value: rawBatch.supplier?.name || '-' },
                            { label: 'Cantidad Utilizada', value: quantity },
                            { label: 'Cantidad Recepcionada', value: `${rawBatch.batch.initialQuantity} ${rawBatch.batch.unit}` },
                            { label: 'Fecha Recepción', value: arrivedAt.toLocaleString('es-ES', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) },
                            { label: 'Temperatura', value: rawBatch.batch.temperature ? `${parseFloat(rawBatch.batch.temperature).toFixed(1)}°C` : '-' },
                            { label: 'Albarán', value: rawBatch.batch.deliveryNote || '-' },
                          ]
                        });
                      }
                    }
                  });
                }

                if (receptionItems.length > 0) {
                  steps.push({
                    id: 'reception',
                    stage: 'Recepción de Materia Prima',
                    icon: Package,
                    color: 'text-blue-600',
                    timestamp: new Date(asadoBatchHistory[0].history.createdAt).toLocaleString('es-ES', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    }),
                    status: 'RECEPCION',
                    items: receptionItems
                  });
                }
              }
            }
          }
        }
      }
    }

    return steps;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchCode.trim()) {
      const found = shipments.find(s => 
        s.shipment.shipmentCode.toLowerCase().includes(searchCode.toLowerCase()) ||
        s.batch?.batchCode?.toLowerCase().includes(searchCode.toLowerCase())
      );
      if (found) {
        setSelectedShipmentId(found.shipment.id);
      } else {
        setSelectedShipmentId(null);
      }
    }
  };

  const traceabilitySteps = selectedShipmentId ? buildTraceability(selectedShipmentId) : [];

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
          Consulta el historial completo de cualquier expedición desde materia prima hasta cliente
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
      {!selectedShipmentId && (
        <Card>
          <CardHeader>
            <CardTitle>Lotes Expedidos ({shippedBatches.length})</CardTitle>
            <CardDescription>
              Haz clic en una expedición para ver su trazabilidad completa
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
                    key={batch.shipmentId}
                    onClick={() => setSelectedShipmentId(batch.shipmentId)}
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
      {selectedShipmentId && selectedBatch && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedShipmentId(null)}
            >
              ← Volver a lista
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Información de la Expedición</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Código de Expedición</p>
                  <p className="font-medium font-mono">{selectedBatch.shipmentCode}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lote Expedido</p>
                  <p className="font-medium font-mono">{selectedBatch.batchCode}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{selectedBatch.customer}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Producto</p>
                  <p className="font-medium">{selectedBatch.product}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historial de Trazabilidad Completo</CardTitle>
              <CardDescription>
                Flujo completo desde expedición hasta materia prima ({traceabilitySteps.length} etapas)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {traceabilitySteps.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay historial de trazabilidad para esta expedición
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

                            {/* Items en paralelo (grid horizontal) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {step.items.map((item, itemIndex) => (
                                <div key={itemIndex} className="border rounded-lg p-3 bg-muted/30">
                                  {item.title && (
                                    <h4 className="font-semibold text-sm mb-2 text-primary">{item.title}</h4>
                                  )}
                                  <div className="space-y-2">
                                    {item.details.map((detail, detailIndex) => (
                                      <div key={detailIndex}>
                                        <p className="text-xs text-muted-foreground">{detail.label}</p>
                                        <p className="text-sm font-medium">{detail.value}</p>
                                      </div>
                                    ))}
                                  </div>
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
