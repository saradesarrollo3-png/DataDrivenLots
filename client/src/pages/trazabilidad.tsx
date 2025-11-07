import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Package, Truck, CheckCircle, ClipboardCheck, Flame, Scissors, PackageIcon, Droplets } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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

  const { data: traceabilityEvents = [] } = useQuery<any[]>({
    queryKey: ['/api/traceability-events'],
  });

  const selectedShipment = selectedShipmentId
    ? shipments.find(s => s.shipment.id === selectedShipmentId)
    : null;

  const buildTraceability = (shipmentId: string): TraceabilityStep[] => {
    console.log("🔍 buildTraceability - shipmentId:", shipmentId);
    console.log("🔍 Total eventos de trazabilidad:", traceabilityEvents.length);
    
    const steps: TraceabilityStep[] = [];

    // Primero buscar el evento de expedición para obtener el código del lote expedido
    const expedicionEvent = traceabilityEvents.find((e: any) => 
      e.eventType === 'EXPEDICION' && e.shipmentId === shipmentId
    );
    
    console.log("📦 Evento EXPEDICION encontrado:", !!expedicionEvent, expedicionEvent?.outputBatchCode);

    if (!expedicionEvent) {
      console.warn("⚠️ No se encontró evento de EXPEDICION para shipmentId:", shipmentId);
      console.log("📋 Eventos EXPEDICION disponibles:", traceabilityEvents
        .filter((e: any) => e.eventType === 'EXPEDICION')
        .map((e: any) => ({
          id: e.id,
          shipmentId: e.shipmentId,
          outputBatchCode: e.outputBatchCode
        })));
      return [];
    }

    // Obtener el código del lote expedido
    const batchCode = expedicionEvent.outputBatchCode;
    console.log("🔍 Rastreando trazabilidad para lote:", batchCode);

    // Obtener todos los eventos relacionados con este lote
    const shipmentEvents = traceabilityEvents.filter((e: any) => {
      // Incluir eventos donde el lote está en output o en input
      const isOutputBatch = e.outputBatchCode === batchCode;
      const isInputBatch = e.inputBatchCodes && 
        JSON.parse(e.inputBatchCodes || '[]').includes(batchCode);
      return isOutputBatch || isInputBatch || e.shipmentId === shipmentId;
    });
    
    console.log("🔍 Eventos relacionados encontrados:", shipmentEvents.length);

    if (shipmentEvents.length === 0) {
      console.warn("⚠️ No se encontraron eventos de trazabilidad para lote:", batchCode);
      return [];
    }

    // Ordenar eventos por fecha para asegurar el orden cronológico correcto
    shipmentEvents.sort((a, b) => new Date(a.performedAt).getTime() - new Date(b.performedAt).getTime());
    console.log("🔍 Eventos ordenados:", shipmentEvents.map((e: any) => ({
      eventType: e.eventType,
      outputBatchCode: e.outputBatchCode,
      performedAt: e.performedAt
    })));

    // 1. Evento de EXPEDICION (ya lo tenemos de antes)
    if (expedicionEvent) {
      console.log("✅ Construyendo paso de EXPEDICION");
      steps.push({
        id: 'shipment',
        stage: 'Expedición',
        icon: Truck,
        color: 'text-indigo-600',
        timestamp: new Date(expedicionEvent.processedDate || expedicionEvent.performedAt).toLocaleString('es-ES', {
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
            { label: 'Código Expedición', value: expedicionEvent.shipmentCode || '-' },
            { label: 'Cliente', value: expedicionEvent.customerName || '-' },
            { label: 'Lote Expedido', value: expedicionEvent.outputBatchCode || '-' },
            { label: 'Cantidad Expedida', value: `${expedicionEvent.outputQuantity} ${expedicionEvent.outputUnit}` },
            { label: 'Albarán', value: expedicionEvent.deliveryNote || '-' },
            { label: 'Notas', value: expedicionEvent.notes || '-' },
          ]
        }]
      });

      console.log("🔍 Buscando historial previo para lote:", batchCode);

      // 2. Buscar evento de CALIDAD para este lote
      const calidadEvent = traceabilityEvents.find((e: any) =>
        e.eventType === 'CALIDAD' && e.outputBatchCode === batchCode
      );
      console.log("✅ Evento CALIDAD encontrado:", !!calidadEvent);

      if (calidadEvent) {
        steps.push({
          id: 'quality',
          stage: 'Control de Calidad',
          icon: ClipboardCheck,
          color: 'text-green-600',
          timestamp: new Date(calidadEvent.processedDate || calidadEvent.performedAt).toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }),
          status: 'APROBADO',
          items: [{
            title: batchCode,
            details: [
              { label: 'Resultado', value: calidadEvent.qualityApproved === 1 ? 'Aprobado ✓' : 'Rechazado ✗' },
              { label: 'Producto', value: calidadEvent.productName || '-' },
              { label: 'Notas', value: calidadEvent.notes || '-' },
            ]
          }]
        });
      }

      // 3. Buscar evento de ESTERILIZADO
      const esterilizadoEvent = traceabilityEvents.find((e: any) =>
        e.eventType === 'ESTERILIZADO' && e.outputBatchCode === batchCode
      );
      console.log("🔥 Evento ESTERILIZADO encontrado:", !!esterilizadoEvent);

      if (esterilizadoEvent) {
        const inputCodes = esterilizadoEvent.inputBatchCodes ? JSON.parse(esterilizadoEvent.inputBatchCodes) : [];

        steps.push({
          id: 'esterilizado',
          stage: 'Esterilizado',
          icon: Droplets,
          color: 'text-purple-600',
          timestamp: new Date(esterilizadoEvent.processedDate || esterilizadoEvent.performedAt).toLocaleString('es-ES', {
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
              { label: 'Lote Entrada', value: inputCodes.join(', ') || '-' },
              { label: 'Lote Salida', value: esterilizadoEvent.outputBatchCode || '-' },
              { label: 'Cantidad Procesada', value: `${esterilizadoEvent.outputQuantity} ${esterilizadoEvent.outputUnit}` },
              { label: 'Notas', value: esterilizadoEvent.notes || '-' },
            ]
          }]
        });

        // 4. Buscar eventos de ENVASADO que produjeron el lote de entrada del esterilizado
        const envasadoEvents = traceabilityEvents.filter((e: any) =>
          e.eventType === 'ENVASADO' && inputCodes.includes(e.outputBatchCode)
        );
        console.log("📦 Eventos ENVASADO encontrados:", envasadoEvents.length, "para códigos:", inputCodes);

        if (envasadoEvents.length > 0) {
          const envasadoItems: any[] = [];

          // Ordenar eventos de envasado por fecha
          envasadoEvents.sort((a, b) => new Date(a.performedAt).getTime() - new Date(b.performedAt).getTime());

          envasadoEvents.forEach((envEvent: any) => {
            const envInputCodes = envEvent.inputBatchCodes ? JSON.parse(envEvent.inputBatchCodes) : [];
            const envInputQuantities = envEvent.inputQuantities ? JSON.parse(envEvent.inputQuantities) : [];

            envasadoItems.push({
              title: `${envEvent.packageType || 'Envase'} - ${envEvent.outputBatchCode}`,
              details: [
                { label: 'Lotes Entrada', value: envInputCodes.join(', ') || '-' },
                { label: 'Cantidad Producida', value: `${envEvent.outputQuantity} ${envEvent.outputUnit}` },
                { label: 'Notas', value: envEvent.notes || '-' },
              ]
            });
          });

          steps.push({
            id: 'envasado',
            stage: 'Envasado',
            icon: PackageIcon,
            color: 'text-green-600',
            timestamp: new Date(envasadoEvents[0].processedDate || envasadoEvents[0].performedAt).toLocaleString('es-ES', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            }),
            status: 'ENVASADO',
            items: envasadoItems
          });

          // 5. Buscar eventos de PELADO
          const peladoInputCodes = envasadoEvents.flatMap((e: any) =>
            e.inputBatchCodes ? JSON.parse(e.inputBatchCodes) : []
          );
          console.log("✂️ Buscando eventos PELADO para códigos:", peladoInputCodes);

          const peladoEvents = traceabilityEvents.filter((e: any) =>
            e.eventType === 'PELADO' && peladoInputCodes.includes(e.outputBatchCode)
          );
          console.log("✂️ Eventos PELADO encontrados:", peladoEvents.length);

          if (peladoEvents.length > 0) {
            const peladoItems: any[] = [];
            peladoEvents.sort((a, b) => new Date(a.performedAt).getTime() - new Date(b.performedAt).getTime());

            peladoEvents.forEach((pelEvent: any) => {
              const pelInputQuantities = pelEvent.inputQuantities ? JSON.parse(pelEvent.inputQuantities) : [];

              peladoItems.push({
                title: `Lote ${pelEvent.outputBatchCode}`,
                details: [
                  { label: 'Cantidad Salida', value: `${pelEvent.outputQuantity} ${pelEvent.outputUnit}` },
                  { label: 'Notas', value: pelEvent.notes || '-' },
                ]
              });

              // Mostrar materias primas consumidas
              pelInputQuantities.forEach((input: any) => {
                peladoItems.push({
                  title: `Entrada: ${input.batchCode}`,
                  details: [
                    { label: 'Cantidad Consumida', value: `${input.quantity} ${input.unit}` },
                  ]
                });
              });
            });

            steps.push({
              id: 'pelado',
              stage: 'Pelado y Corte',
              icon: Scissors,
              color: 'text-blue-600',
              timestamp: new Date(peladoEvents[0].processedDate || peladoEvents[0].performedAt).toLocaleString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              }),
              status: 'PELADO',
              items: peladoItems
            });

            // 6. Buscar eventos de ASADO
            const asadoInputCodes = peladoEvents.flatMap((e: any) =>
              e.inputBatchCodes ? JSON.parse(e.inputBatchCodes) : []
            );
            console.log("🔥 Buscando eventos ASADO para códigos:", asadoInputCodes);

            const asadoEvents = traceabilityEvents.filter((e: any) =>
              e.eventType === 'ASADO' && asadoInputCodes.includes(e.outputBatchCode)
            );
            console.log("🔥 Eventos ASADO encontrados:", asadoEvents.length);

            if (asadoEvents.length > 0) {
              const asadoItems: any[] = [];
              asadoEvents.sort((a, b) => new Date(a.performedAt).getTime() - new Date(b.performedAt).getTime());

              asadoEvents.forEach((asEvent: any) => {
                const asInputQuantities = asEvent.inputQuantities ? JSON.parse(asEvent.inputQuantities) : [];

                asadoItems.push({
                  title: `Lote Salida ${asEvent.outputBatchCode}`,
                  details: [
                    { label: 'Cantidad Salida', value: `${asEvent.outputQuantity} ${asEvent.outputUnit}` },
                  ]
                });

                // Mostrar materias primas utilizadas
                asInputQuantities.forEach((input: any) => {
                  asadoItems.push({
                    title: `Materia Prima: ${input.batchCode}`,
                    details: [
                      { label: 'Cantidad Consumida', value: `${input.quantity} ${input.unit}` },
                    ]
                  });
                });
              });

              steps.push({
                id: 'asado',
                stage: 'Asado',
                icon: Flame,
                color: 'text-orange-600',
                timestamp: new Date(asadoEvents[0].processedDate || asadoEvents[0].performedAt).toLocaleString('es-ES', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                }),
                status: 'ASADO',
                items: asadoItems
              });

              // 7. Buscar eventos de RECEPCION de las materias primas
              const recepcionCodes = asadoEvents.flatMap((e: any) =>
                e.inputBatchCodes ? JSON.parse(e.inputBatchCodes) : []
              );
              console.log("📥 Buscando eventos RECEPCION para códigos:", recepcionCodes);

              const recepcionEvents = traceabilityEvents.filter((e: any) =>
                e.eventType === 'RECEPCION' && recepcionCodes.includes(e.outputBatchCode)
              );
              console.log("📥 Eventos RECEPCION encontrados:", recepcionEvents.length);

              if (recepcionEvents.length > 0) {
                const recepcionItems: any[] = [];
                recepcionEvents.sort((a, b) => new Date(a.performedAt).getTime() - new Date(b.performedAt).getTime());


                recepcionEvents.forEach((recEvent: any) => {
                  recepcionItems.push({
                    title: recEvent.productName || '-',
                    details: [
                      { label: 'Lote', value: recEvent.outputBatchCode || '-' },
                      { label: 'Proveedor', value: recEvent.supplierName || '-' },
                      { label: 'Cantidad Recepcionada', value: `${recEvent.outputQuantity} ${recEvent.outputUnit}` },
                      { label: 'Temperatura', value: recEvent.temperature ? `${parseFloat(recEvent.temperature).toFixed(1)}°C` : '-' },
                      { label: 'Albarán', value: recEvent.deliveryNote || '-' },
                      { label: 'Fecha', value: new Date(recEvent.processedDate || recEvent.performedAt).toLocaleString('es-ES', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) },
                    ]
                  });
                });

                steps.push({
                  id: 'reception',
                  stage: 'Recepción de Materia Prima',
                  icon: Package,
                  color: 'text-blue-600',
                  timestamp: new Date(recepcionEvents[0].processedDate || recepcionEvents[0].performedAt).toLocaleString('es-ES', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  }),
                  status: 'RECEPCION',
                  items: recepcionItems
                });
              }
            }
          }
        }
      }
    }

    console.log("✅ Trazabilidad construida - Total de pasos:", steps.length);
    console.log("📋 Pasos:", steps.map(s => s.stage));
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

  const filteredShipments = searchCode.trim()
    ? shipments.filter(s =>
        s.shipment.shipmentCode.toLowerCase().includes(searchCode.toLowerCase()) ||
        s.batch?.batchCode?.toLowerCase().includes(searchCode.toLowerCase()) ||
        s.product?.name?.toLowerCase().includes(searchCode.toLowerCase()) ||
        s.customer?.name?.toLowerCase().includes(searchCode.toLowerCase())
      )
    : shipments;

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

      {!selectedShipmentId && (
        <Card>
          <CardHeader>
            <CardTitle>Expediciones ({shipments.length})</CardTitle>
            <CardDescription>
              Haz clic en una expedición para ver su trazabilidad completa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredShipments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {searchCode ? 'No se encontraron expediciones' : 'No hay expediciones'}
                </p>
              ) : (
                filteredShipments.map((shipment) => (
                  <button
                    key={shipment.shipment.id}
                    onClick={() => setSelectedShipmentId(shipment.shipment.id)}
                    className="w-full text-left p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-medium">{shipment.batch?.batchCode || '-'}</span>
                          <Badge variant="outline">{shipment.shipment.shipmentCode}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {shipment.product?.name || '-'} • Cliente: {shipment.customer?.name || '-'}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Expedido: {new Date(shipment.shipment.shippedAt).toLocaleString('es-ES')} • {shipment.shipment.quantity} {shipment.shipment.unit}
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

      {selectedShipmentId && selectedShipment && (
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
                  <p className="font-medium font-mono">{selectedShipment.shipment.shipmentCode}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lote Expedido</p>
                  <p className="font-medium font-mono">{selectedShipment.batch?.batchCode || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{selectedShipment.customer?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Producto</p>
                  <p className="font-medium">{selectedShipment.product?.name || '-'}</p>
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
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

                  <div className="space-y-6">
                    {traceabilitySteps.map((step, index) => {
                      const Icon = step.icon;
                      return (
                        <div key={step.id} className="relative pl-16">
                          <div className="absolute left-0 top-0 w-12 h-12 rounded-full bg-background border-2 border-border flex items-center justify-center">
                            <Icon className={`h-6 w-6 ${step.color}`} />
                          </div>

                          <div className="border rounded-lg p-4 bg-card">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-lg">{step.stage}</h3>
                                <p className="text-sm text-muted-foreground">{step.timestamp}</p>
                              </div>
                              <StatusBadge status={step.status as any} />
                            </div>

                            <Separator className="my-3" />

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