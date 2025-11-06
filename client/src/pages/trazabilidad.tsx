
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

    // Función recursiva para encontrar todos los registros de producción hacia atrás
    const getAllProductionSteps = (currentBatchId: string, visitedBatches: Set<string> = new Set()): any[] => {
      if (visitedBatches.has(currentBatchId)) return [];
      visitedBatches.add(currentBatchId);

      const allSteps: any[] = [];

      // Buscar todos los registros de producción donde este lote es el output
      const records = productionRecords.filter((pr: any) => pr.record.batchId === currentBatchId);

      for (const record of records) {
        allSteps.push(record);

        // Si tiene lotes de entrada, rastrearlos recursivamente
        if (record.record.inputBatchDetails) {
          try {
            const inputBatchDetails = JSON.parse(record.record.inputBatchDetails);
            
            for (const detail of inputBatchDetails) {
              const deeperSteps = getAllProductionSteps(detail.batchId, visitedBatches);
              allSteps.push(...deeperSteps);
            }
          } catch (e) {
            console.error('Error parsing inputBatchDetails:', e);
          }
        }
      }

      return allSteps;
    };

    // Obtener todos los pasos de producción
    const allProductionSteps = getAllProductionSteps(batchId);

    // Encontrar todos los lotes de materia prima (sin duplicados)
    const rawMaterialBatchIds = new Set<string>();
    
    for (const record of allProductionSteps) {
      if (record.record.inputBatchDetails) {
        try {
          const inputBatchDetails = JSON.parse(record.record.inputBatchDetails);
          for (const detail of inputBatchDetails) {
            const inputBatch = allBatches.find((b: any) => b.batch.id === detail.batchId);
            if (inputBatch && (inputBatch.batch.status === 'RECEPCION' || inputBatch.batch.supplierId)) {
              rawMaterialBatchIds.add(detail.batchId);
            }
          }
        } catch (e) {
          console.error('Error parsing inputBatchDetails:', e);
        }
      }
    }

    // 1. RECEPCIÓN DE MATERIA PRIMA (mostrar todas en paralelo)
    if (rawMaterialBatchIds.size > 0) {
      const receptionItems: any[] = [];
      
      rawMaterialBatchIds.forEach((rawBatchId: string) => {
        const rawBatch = allBatches.find((b: any) => b.batch.id === rawBatchId);
        if (rawBatch) {
          // Encontrar cuánta cantidad se usó de esta materia prima
          let usedQuantity = 0;
          for (const record of allProductionSteps) {
            if (record.record.inputBatchDetails) {
              try {
                const inputBatchDetails = JSON.parse(record.record.inputBatchDetails);
                const detail = inputBatchDetails.find((d: any) => d.batchId === rawBatchId);
                if (detail) {
                  usedQuantity += parseFloat(detail.quantity);
                }
              } catch (e) {
                console.error('Error parsing inputBatchDetails:', e);
              }
            }
          }

          receptionItems.push({
            title: rawBatch.product?.name || '-',
            details: [
              { label: 'Lote', value: rawBatch.batch.batchCode },
              { label: 'Proveedor', value: rawBatch.supplier?.name || '-' },
              { label: 'Cantidad Utilizada', value: `${usedQuantity} ${rawBatch.batch.unit}` },
              { label: 'Cantidad Total Disponible', value: `${rawBatch.batch.quantity} ${rawBatch.batch.unit}` },
              { label: 'Temperatura', value: rawBatch.batch.temperature ? `${parseFloat(rawBatch.batch.temperature).toFixed(1)}°C` : '-' },
              { label: 'Albarán', value: rawBatch.batch.deliveryNote || '-' },
              { label: 'Fecha Recepción', value: new Date(rawBatch.batch.arrivedAt).toLocaleString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              }) },
            ]
          });
        }
      });

      // Usar la fecha más reciente de las recepciones
      const latestReception = Array.from(rawMaterialBatchIds)
        .map(id => allBatches.find((b: any) => b.batch.id === id))
        .filter(b => b)
        .sort((a, b) => new Date(b.batch.arrivedAt).getTime() - new Date(a.batch.arrivedAt).getTime())[0];

      steps.push({
        id: 'reception',
        stage: 'Recepción de Materia Prima',
        icon: Package,
        color: 'text-blue-600',
        timestamp: latestReception ? new Date(latestReception.batch.arrivedAt).toLocaleString('es-ES', {
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

    // 2. ASADO (mostrar todas las entradas en paralelo si hay múltiples)
    const asadoRecords = allProductionSteps.filter((pr: any) => pr.record.stage === 'ASADO');
    if (asadoRecords.length > 0) {
      // Agrupar por lote de salida
      const asadoGroups = new Map<string, any[]>();
      asadoRecords.forEach(record => {
        const outputCode = record.record.outputBatchCode;
        if (!asadoGroups.has(outputCode)) {
          asadoGroups.set(outputCode, []);
        }
        asadoGroups.get(outputCode)?.push(record);
      });

      asadoGroups.forEach((records, outputCode) => {
        const firstRecord = records[0];
        const asadoItems: any[] = [];

        // Información general del proceso
        asadoItems.push({
          title: 'Producción',
          details: [
            { label: 'Lote Salida', value: outputCode },
            { label: 'Cantidad Salida', value: `${firstRecord.record.outputQuantity} ${firstRecord.record.unit}` },
            { label: 'Notas', value: firstRecord.record.notes || '-' },
          ]
        });

        // Materias primas utilizadas (en paralelo)
        if (firstRecord.record.inputBatchDetails) {
          try {
            const inputBatchDetails = JSON.parse(firstRecord.record.inputBatchDetails);
            
            inputBatchDetails.forEach((detail: any) => {
              const inputBatch = allBatches.find((b: any) => b.batch.id === detail.batchId);
              if (inputBatch) {
                asadoItems.push({
                  title: inputBatch.product?.name || detail.batchCode,
                  details: [
                    { label: 'Lote', value: detail.batchCode },
                    { label: 'Proveedor', value: inputBatch.supplier?.name || '-' },
                    { label: 'Cantidad Disponible', value: `${inputBatch.batch.quantity} ${inputBatch.batch.unit}` },
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
          id: `asado-${outputCode}`,
          stage: 'Asado',
          icon: Flame,
          color: 'text-orange-600',
          timestamp: firstRecord.record.processedDate
            ? new Date(firstRecord.record.processedDate).toLocaleString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })
            : new Date(firstRecord.record.completedAt || firstRecord.record.createdAt).toLocaleString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              }),
          status: 'ASADO',
          items: asadoItems
        });
      });
    }

    // 3. PELADO (mostrar todas las entradas en paralelo si hay múltiples)
    const peladoRecords = allProductionSteps.filter((pr: any) => pr.record.stage === 'PELADO');
    if (peladoRecords.length > 0) {
      const peladoGroups = new Map<string, any[]>();
      peladoRecords.forEach(record => {
        const outputCode = record.record.outputBatchCode;
        if (!peladoGroups.has(outputCode)) {
          peladoGroups.set(outputCode, []);
        }
        peladoGroups.get(outputCode)?.push(record);
      });

      peladoGroups.forEach((records, outputCode) => {
        const firstRecord = records[0];
        const peladoItems: any[] = [];

        // Información general del proceso
        peladoItems.push({
          title: 'Producción',
          details: [
            { label: 'Lote Salida', value: outputCode },
            { label: 'Cantidad Salida', value: `${firstRecord.record.outputQuantity} ${firstRecord.record.unit}` },
            { label: 'Notas', value: firstRecord.record.notes || '-' },
          ]
        });

        // Lotes de entrada (en paralelo)
        if (firstRecord.record.inputBatchDetails) {
          try {
            const inputBatchDetails = JSON.parse(firstRecord.record.inputBatchDetails);
            
            inputBatchDetails.forEach((detail: any) => {
              const inputBatch = allBatches.find((b: any) => b.batch.id === detail.batchId);
              if (inputBatch) {
                peladoItems.push({
                  title: inputBatch.product?.name || detail.batchCode,
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
          id: `pelado-${outputCode}`,
          stage: 'Pelado y Corte',
          icon: Scissors,
          color: 'text-blue-600',
          timestamp: firstRecord.record.processedDate
            ? new Date(firstRecord.record.processedDate).toLocaleString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })
            : new Date(firstRecord.record.completedAt || firstRecord.record.createdAt).toLocaleString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              }),
          status: 'PELADO',
          items: peladoItems
        });
      });
    }

    // 4. ENVASADO (mostrar todos los tipos de frasco en paralelo)
    const envasadoRecords = allProductionSteps.filter((pr: any) => pr.record.stage === 'ENVASADO');
    if (envasadoRecords.length > 0) {
      // Agrupar por lote base
      const envasadoGroups = new Map<string, any[]>();
      
      envasadoRecords.forEach((envRecord: any) => {
        const outputCode = envRecord.record.outputBatchCode;
        const baseCode = outputCode.includes('-') && outputCode.match(/-[A-Z]+$/i) 
          ? outputCode.substring(0, outputCode.lastIndexOf('-'))
          : outputCode;
        
        if (!envasadoGroups.has(baseCode)) {
          envasadoGroups.set(baseCode, []);
        }
        envasadoGroups.get(baseCode)?.push(envRecord);
      });

      envasadoGroups.forEach((groupRecords, baseCode) => {
        const firstRecord = groupRecords[0];
        const envasadoItems: any[] = [];

        // Información general
        envasadoItems.push({
          title: 'Entrada',
          details: [
            { label: 'Lote Base', value: baseCode },
            { label: 'Lotes Entrada', value: firstRecord.record.inputBatchCode },
            { label: 'Cantidad Entrada', value: `${firstRecord.record.inputQuantity} ${firstRecord.record.unit}` },
            { label: 'Notas', value: firstRecord.record.notes || '-' },
          ]
        });

        // Cada tipo de frasco (en paralelo)
        let totalEnvases = 0;
        groupRecords.forEach((envRecord: any) => {
          const outputBatch = allBatches.find((b: any) => b.batch.batchCode === envRecord.record.outputBatchCode);
          const outputQuantity = parseFloat(envRecord.record.outputQuantity);
          totalEnvases += outputQuantity;
          
          const tipoEnvase = envRecord.record.outputBatchCode.split('-').pop() || 'Estándar';
          
          const itemDetails: any[] = [
            { label: 'Lote', value: envRecord.record.outputBatchCode },
            { label: 'Cantidad', value: `${outputQuantity} frascos` },
          ];

          if (outputBatch) {
            const shipment = shipments.find((s: any) => s.shipment.batchId === outputBatch.batch.id);
            
            if (shipment) {
              itemDetails.push({ label: 'Estado', value: 'EXPEDIDO ✓' });
              itemDetails.push({ label: 'Expedido', value: new Date(shipment.shipment.shippedAt).toLocaleDateString('es-ES') });
              itemDetails.push({ label: 'Cliente', value: shipment.customer?.name || '-' });
              itemDetails.push({ label: 'Cantidad Expedida', value: `${shipment.shipment.quantity} ${shipment.shipment.unit}` });
            } else {
              itemDetails.push({ label: 'Estado', value: outputBatch.batch.status });
              itemDetails.push({ label: 'Disponible', value: `${outputBatch.batch.quantity} ${outputBatch.batch.unit}` });
            }
          }

          envasadoItems.push({
            title: `Tipo ${tipoEnvase}`,
            details: itemDetails
          });
        });

        // Totales
        envasadoItems.push({
          title: 'Total',
          details: [
            { label: 'Total Envases', value: `${totalEnvases} frascos` },
            { label: 'Tipos Diferentes', value: `${groupRecords.length}` },
          ]
        });

        steps.push({
          id: `envasado-${baseCode}`,
          stage: 'Envasado',
          icon: PackageIcon,
          color: 'text-green-600',
          timestamp: firstRecord.record.processedDate
            ? new Date(firstRecord.record.processedDate).toLocaleString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })
            : new Date(firstRecord.record.completedAt || firstRecord.record.createdAt).toLocaleString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              }),
          status: 'ENVASADO',
          items: envasadoItems
        });
      });
    }

    // 5. ESTERILIZADO (mostrar todas las variantes en paralelo)
    const esterilizadoRecords = allProductionSteps.filter((pr: any) => pr.record.stage === 'ESTERILIZADO');
    if (esterilizadoRecords.length > 0) {
      const esterilizadoGroups = new Map<string, any[]>();
      esterilizadoRecords.forEach(record => {
        const outputCode = record.record.outputBatchCode;
        const baseCode = outputCode.includes('-') && outputCode.match(/-[A-Z]+$/i) 
          ? outputCode.substring(0, outputCode.lastIndexOf('-'))
          : outputCode;
        
        if (!esterilizadoGroups.has(baseCode)) {
          esterilizadoGroups.set(baseCode, []);
        }
        esterilizadoGroups.get(baseCode)?.push(record);
      });

      esterilizadoGroups.forEach((records, baseCode) => {
        const firstRecord = records[0];
        const esterilizadoItems: any[] = [];

        // Información general
        esterilizadoItems.push({
          title: 'Información General',
          details: [
            { label: 'Lote Base', value: baseCode },
            { label: 'Notas', value: firstRecord.record.notes || '-' },
          ]
        });

        // Cada variante en paralelo
        records.forEach((record: any) => {
          const inputBatch = allBatches.find((b: any) => b.batch.batchCode === record.record.inputBatchCode);
          const tipo = record.record.outputBatchCode.split('-').pop() || 'Estándar';

          esterilizadoItems.push({
            title: `Tipo ${tipo}`,
            details: [
              { label: 'Lote Entrada', value: record.record.inputBatchCode },
              { label: 'Lote Salida', value: record.record.outputBatchCode },
              { label: 'Cantidad', value: `${record.record.outputQuantity} ${record.record.unit}` },
            ]
          });
        });

        steps.push({
          id: `esterilizado-${baseCode}`,
          stage: 'Esterilizado',
          icon: Droplets,
          color: 'text-purple-600',
          timestamp: firstRecord.record.processedDate
            ? new Date(firstRecord.record.processedDate).toLocaleString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })
            : new Date(firstRecord.record.completedAt || firstRecord.record.createdAt).toLocaleString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              }),
          status: 'ESTERILIZADO',
          items: esterilizadoItems
        });
      });
    }

    // 6. CONTROL DE CALIDAD (mostrar todas las variantes si hay múltiples)
    const qualityChecksForBatch = qualityChecks.filter((qc: any) => {
      const qcBatch = allBatches.find((b: any) => b.batch.id === qc.check.batchId);
      if (!qcBatch) return false;
      
      // Verificar si este lote está relacionado con el lote expedido
      return qcBatch.batch.id === batchId || 
             qcBatch.batch.batchCode.startsWith(batch.batch.batchCode.split('-')[0]);
    });
    
    if (qualityChecksForBatch.length > 0) {
      const qualityItems: any[] = [];
      
      qualityChecksForBatch.forEach((qc: any) => {
        const qcBatch = allBatches.find((b: any) => b.batch.id === qc.check.batchId);
        const approved = qc.check.approved === 1;
        
        if (qcBatch) {
          qualityItems.push({
            title: qcBatch.batch.batchCode,
            details: [
              { label: 'Resultado', value: approved ? 'Aprobado ✓' : 'Rechazado ✗' },
              { label: 'Producto', value: qcBatch.product?.name || '-' },
              { label: 'Fecha Caducidad', value: qcBatch.batch.expiryDate ? new Date(qcBatch.batch.expiryDate).toLocaleDateString('es-ES') : '-' },
              { label: 'Notas', value: qc.check.notes || '-' },
            ]
          });
        }
      });

      const latestCheck = qualityChecksForBatch.sort((a, b) => 
        new Date(b.check.checkedAt).getTime() - new Date(a.check.checkedAt).getTime()
      )[0];

      steps.push({
        id: 'quality',
        stage: 'Control de Calidad',
        icon: ClipboardCheck,
        color: 'text-green-600',
        timestamp: new Date(latestCheck.check.checkedAt).toLocaleString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }),
        status: 'APROBADO',
        items: qualityItems
      });
    }

    // 7. EXPEDICIÓN (mostrar todas las expediciones si hay múltiples)
    const shipmentsForBatch = shipments.filter((s: any) => {
      const shipBatch = allBatches.find((b: any) => b.batch.id === s.shipment.batchId);
      if (!shipBatch) return false;
      
      // Verificar si este lote está relacionado con el lote expedido
      return shipBatch.batch.id === batchId || 
             shipBatch.batch.batchCode.startsWith(batch.batch.batchCode.split('-')[0]);
    });
    
    if (shipmentsForBatch.length > 0) {
      const expedicionItems: any[] = [];
      
      shipmentsForBatch.forEach((shipment: any) => {
        const shipBatch = allBatches.find((b: any) => b.batch.id === shipment.shipment.batchId);
        
        expedicionItems.push({
          title: shipBatch?.batch.batchCode || shipment.shipment.shipmentCode,
          details: [
            { label: 'Código Expedición', value: shipment.shipment.shipmentCode },
            { label: 'Cliente', value: shipment.customer?.name || '-' },
            { label: 'Cantidad', value: `${shipment.shipment.quantity} ${shipment.shipment.unit}` },
            { label: 'Matrícula', value: shipment.shipment.truckPlate || '-' },
            { label: 'Albarán', value: shipment.shipment.deliveryNote || '-' },
            { label: 'Fecha', value: new Date(shipment.shipment.shippedAt).toLocaleString('es-ES', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            }) },
          ]
        });
      });

      const latestShipment = shipmentsForBatch.sort((a, b) => 
        new Date(b.shipment.shippedAt).getTime() - new Date(a.shipment.shippedAt).getTime()
      )[0];

      steps.push({
        id: 'shipment',
        stage: 'Expedición',
        icon: Truck,
        color: 'text-indigo-600',
        timestamp: new Date(latestShipment.shipment.shippedAt).toLocaleString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }),
        status: 'EXPEDIDO',
        items: expedicionItems
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
