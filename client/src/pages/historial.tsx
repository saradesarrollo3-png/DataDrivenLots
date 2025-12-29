import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Package,
  Truck,
  ClipboardCheck,
  Flame,
  Scissors,
  PackageIcon,
  Droplets,
  ChevronDown,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  txHash?: string; // Campo para el hash
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
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(
    null,
  );

  const { data: shipments = [] } = useQuery<any[]>({
    queryKey: ["/api/shipments"],
  });

  const { data: traceabilityEvents = [] } = useQuery<any[]>({
    queryKey: ["/api/traceability-events"],
  });

  const selectedShipment = selectedShipmentId
    ? shipments.find((s) => s.shipment.id === selectedShipmentId)
    : null;

  const buildTraceability = (shipmentId: string): TraceabilityStep[] => {
    const steps: TraceabilityStep[] = [];

    const expedicionEvent = traceabilityEvents.find(
      (e: any) => e.eventType === "EXPEDICION" && e.shipmentId === shipmentId,
    );

    if (!expedicionEvent) return [];

    const batchCode = expedicionEvent.outputBatchCode;

    // Obtener todos los eventos relacionados
    const shipmentEvents = traceabilityEvents.filter((e: any) => {
      const isOutputBatch = e.outputBatchCode === batchCode;
      const isInputBatch =
        e.inputBatchCodes &&
        JSON.parse(e.inputBatchCodes || "[]").includes(batchCode);
      return isOutputBatch || isInputBatch || e.shipmentId === shipmentId;
    });

    if (shipmentEvents.length === 0) return [];

    shipmentEvents.sort(
      (a, b) =>
        new Date(a.performedAt).getTime() - new Date(b.performedAt).getTime(),
    );

    // 1. EXPEDICION
    if (expedicionEvent) {
      steps.push({
        id: "shipment",
        stage: "Expedición",
        icon: Truck,
        color: "text-indigo-600",
        timestamp: new Date(
          expedicionEvent.processedDate || expedicionEvent.performedAt,
        ).toLocaleString("es-ES", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "EXPEDIDO",
        txHash: expedicionEvent.txHash, // Hash
        items: [
          {
            title: "Detalles de Expedición",
            details: [
              { label: "Cliente", value: expedicionEvent.customerName || "-" },
              {
                label: "Cantidad",
                value: `${expedicionEvent.outputQuantity} ${expedicionEvent.outputUnit}`,
              },
              { label: "Albarán", value: expedicionEvent.deliveryNote || "-" },
            ],
          },
        ],
      });

      // 2. CALIDAD
      const calidadEvent = traceabilityEvents.find(
        (e: any) =>
          e.eventType === "CALIDAD" && e.outputBatchCode === batchCode,
      );

      if (calidadEvent) {
        steps.push({
          id: "quality",
          stage: "Control de Calidad",
          icon: ClipboardCheck,
          color: "text-green-600",
          timestamp: new Date(
            calidadEvent.processedDate || calidadEvent.performedAt,
          ).toLocaleString("es-ES", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }),
          status: "APROBADO",
          txHash: calidadEvent.txHash, // Hash
          items: [
            {
              title: batchCode,
              details: [
                {
                  label: "Resultado",
                  value:
                    calidadEvent.qualityApproved === 1
                      ? "Aprobado ✓"
                      : "Rechazado ✗",
                },
                { label: "Producto", value: calidadEvent.productName || "-" },
              ],
            },
          ],
        });
      }

      // 3. ESTERILIZADO
      const esterilizadoEvent = traceabilityEvents.find(
        (e: any) =>
          e.eventType === "ESTERILIZADO" && e.outputBatchCode === batchCode,
      );

      if (esterilizadoEvent) {
        const inputCodes = esterilizadoEvent.inputBatchCodes
          ? JSON.parse(esterilizadoEvent.inputBatchCodes)
          : [];
        steps.push({
          id: "esterilizado",
          stage: "Esterilizado",
          icon: Droplets,
          color: "text-purple-600",
          timestamp: new Date(
            esterilizadoEvent.processedDate || esterilizadoEvent.performedAt,
          ).toLocaleString("es-ES", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }),
          status: "ESTERILIZADO",
          txHash: esterilizadoEvent.txHash, // Hash
          items: [
            {
              title: "Proceso de Esterilizado",
              details: [
                { label: "Lote Entrada", value: inputCodes.join(", ") || "-" },
                {
                  label: "Cantidad",
                  value: `${esterilizadoEvent.outputQuantity} ${esterilizadoEvent.outputUnit}`,
                },
              ],
            },
          ],
        });

        // 4. ENVASADO
        const envasadoEvents = traceabilityEvents.filter(
          (e: any) =>
            e.eventType === "ENVASADO" &&
            inputCodes.includes(e.outputBatchCode),
        );

        if (envasadoEvents.length > 0) {
          steps.push({
            id: "envasado",
            stage: "Envasado",
            icon: PackageIcon,
            color: "text-green-600",
            timestamp: new Date(
              envasadoEvents[0].processedDate || envasadoEvents[0].performedAt,
            ).toLocaleString("es-ES", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            }),
            status: "ENVASADO",
            txHash: envasadoEvents[0].txHash, // Hash (usamos el del primero)
            items: envasadoEvents.map((ev: any) => ({
              title: `${ev.packageType || "Envase"} - ${ev.outputBatchCode}`,
              details: [
                {
                  label: "Cantidad",
                  value: `${ev.outputQuantity} ${ev.outputUnit}`,
                },
              ],
            })),
          });

          // 5. PELADO
          const peladoInputCodes = envasadoEvents.flatMap((e: any) =>
            e.inputBatchCodes ? JSON.parse(e.inputBatchCodes) : [],
          );
          const peladoEvents = traceabilityEvents.filter(
            (e: any) =>
              e.eventType === "PELADO" &&
              peladoInputCodes.includes(e.outputBatchCode),
          );

          if (peladoEvents.length > 0) {
            steps.push({
              id: "pelado",
              stage: "Pelado y Corte",
              icon: Scissors,
              color: "text-blue-600",
              timestamp: new Date(
                peladoEvents[0].processedDate || peladoEvents[0].performedAt,
              ).toLocaleString("es-ES", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              }),
              status: "PELADO",
              txHash: peladoEvents[0].txHash, // Hash
              items: peladoEvents.map((ev: any) => ({
                title: `Lote ${ev.outputBatchCode}`,
                details: [
                  {
                    label: "Cantidad",
                    value: `${ev.outputQuantity} ${ev.outputUnit}`,
                  },
                ],
              })),
            });

            // 6. ASADO
            const asadoInputCodes = peladoEvents.flatMap((e: any) =>
              e.inputBatchCodes ? JSON.parse(e.inputBatchCodes) : [],
            );
            const asadoEvents = traceabilityEvents.filter(
              (e: any) =>
                e.eventType === "ASADO" &&
                asadoInputCodes.includes(e.outputBatchCode),
            );

            if (asadoEvents.length > 0) {
              steps.push({
                id: "asado",
                stage: "Asado",
                icon: Flame,
                color: "text-orange-600",
                timestamp: new Date(
                  asadoEvents[0].processedDate || asadoEvents[0].performedAt,
                ).toLocaleString("es-ES", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                status: "ASADO",
                txHash: asadoEvents[0].txHash, // Hash
                items: asadoEvents.map((ev: any) => ({
                  title: `Lote Salida ${ev.outputBatchCode}`,
                  details: [
                    {
                      label: "Cantidad",
                      value: `${ev.outputQuantity} ${ev.outputUnit}`,
                    },
                  ],
                })),
              });

              // 7. RECEPCION
              const recepcionCodes = asadoEvents.flatMap((e: any) =>
                e.inputBatchCodes ? JSON.parse(e.inputBatchCodes) : [],
              );
              const recepcionEvents = traceabilityEvents.filter(
                (e: any) =>
                  e.eventType === "RECEPCION" &&
                  recepcionCodes.includes(e.outputBatchCode),
              );

              if (recepcionEvents.length > 0) {
                steps.push({
                  id: "reception",
                  stage: "Recepción Materia Prima",
                  icon: Package,
                  color: "text-blue-600",
                  timestamp: new Date(
                    recepcionEvents[0].processedDate ||
                      recepcionEvents[0].performedAt,
                  ).toLocaleString("es-ES", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                  status: "RECEPCION",
                  txHash: recepcionEvents[0].txHash, // Hash
                  items: recepcionEvents.map((ev: any) => ({
                    title: ev.productName || "-",
                    details: [
                      { label: "Lote", value: ev.outputBatchCode || "-" },
                      { label: "Proveedor", value: ev.supplierName || "-" },
                      {
                        label: "Cantidad",
                        value: `${ev.outputQuantity} ${ev.outputUnit}`,
                      },
                    ],
                  })),
                });
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
      const found = shipments.find(
        (s) =>
          s.shipment.shipmentCode
            .toLowerCase()
            .includes(searchCode.toLowerCase()) ||
          s.batch?.batchCode?.toLowerCase().includes(searchCode.toLowerCase()),
      );
      if (found) setSelectedShipmentId(found.shipment.id);
      else setSelectedShipmentId(null);
    }
  };

  const traceabilitySteps = selectedShipmentId
    ? buildTraceability(selectedShipmentId)
    : [];

  const filteredShipments = searchCode.trim()
    ? shipments.filter(
        (s) =>
          s.shipment.shipmentCode
            .toLowerCase()
            .includes(searchCode.toLowerCase()) ||
          s.batch?.batchCode
            ?.toLowerCase()
            .includes(searchCode.toLowerCase()) ||
          s.product?.name?.toLowerCase().includes(searchCode.toLowerCase()) ||
          s.customer?.name?.toLowerCase().includes(searchCode.toLowerCase()),
      )
    : shipments;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Trazabilidad de Lotes Expedidos
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Consulta el historial completo y sus certificados en Blockchain
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
          />
        </div>
        <Button type="submit">Buscar</Button>
      </form>

      {!selectedShipmentId && (
        <Card>
          <CardHeader>
            <CardTitle>Expediciones ({filteredShipments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredShipments.map((shipment) => (
                <button
                  key={shipment.shipment.id}
                  onClick={() => setSelectedShipmentId(shipment.shipment.id)}
                  className="w-full text-left p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-medium">
                          {shipment.batch?.batchCode || "-"}
                        </span>
                        <Badge variant="outline">
                          {shipment.shipment.shipmentCode}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {shipment.product?.name || "-"} • Cliente:{" "}
                        {shipment.customer?.name || "-"}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedShipmentId && selectedShipment && (
        <div className="space-y-6">
          <Button variant="outline" onClick={() => setSelectedShipmentId(null)}>
            ← Volver a lista
          </Button>
          <Card>
            <CardHeader>
              <CardTitle>Historial de Trazabilidad Certificado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative border-l-2 border-muted ml-4 space-y-8 pl-8 py-2">
                {traceabilitySteps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.id} className="relative">
                      {/* Icono del paso */}
                      <div className="absolute -left-[41px] top-0 bg-background p-1.5 rounded-full border">
                        <Icon className={`h-5 w-5 ${step.color}`} />
                      </div>

                      <div className="border rounded-lg p-4 bg-card shadow-sm">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {step.stage}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {step.timestamp}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <StatusBadge status={step.status as any} />

                            {/* BOTÓN VERIFICAR BLOCKCHAIN */}
                            {step.txHash && (
                              <a
                                href={`https://sepolia.etherscan.io/tx/${step.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-full text-xs font-medium border border-blue-200 transition-colors"
                                title="Verificar en Ethereum Sepolia"
                              >
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Certificado Blockchain
                                <ExternalLink className="h-3 w-3 opacity-50" />
                              </a>
                            )}
                          </div>
                        </div>

                        <Separator className="my-3" />

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {step.items.map((item, itemIndex) => (
                            <div
                              key={itemIndex}
                              className="bg-muted/30 rounded p-3 text-sm"
                            >
                              {item.title && (
                                <p className="font-semibold mb-2">
                                  {item.title}
                                </p>
                              )}
                              {item.details.map((d, i) => (
                                <div
                                  key={i}
                                  className="flex justify-between py-0.5"
                                >
                                  <span className="text-muted-foreground">
                                    {d.label}:
                                  </span>
                                  <span className="font-medium text-right">
                                    {d.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
