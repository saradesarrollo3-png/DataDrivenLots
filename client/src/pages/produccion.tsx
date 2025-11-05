import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flame, Scissors, Package as PackageIcon, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Checkbox } from "@/components/ui/checkbox";

interface ProductionBatch {
  id: string;
  code: string;
  product: string;
  quantity: number;
  unit: string;
  stage: string;
  createdAt: string;
}

interface AvailableBatch {
  id: string;
  batchCode: string;
  productName: string;
  availableQuantity: number;
  unit: string;
  status: string;
}

interface BatchSelection {
  batchId: string;
  batchCode: string;
  productName: string;
  maxQuantity: number;
  unit: string;
  selectedQuantity: number;
}

export default function Produccion() {
  const { toast } = useToast();
  const [activeStage, setActiveStage] = useState<string>("asado");
  const [showNewProcessDialog, setShowNewProcessDialog] = useState(false);
  const [selectedBatches, setSelectedBatches] = useState<BatchSelection[]>([]);
  const [outputBatchCode, setOutputBatchCode] = useState("");
  const [outputQuantity, setOutputQuantity] = useState("");
  const [selectedPackageType, setSelectedPackageType] = useState("");
  const [packageCount, setPackageCount] = useState("");
  const [notes, setNotes] = useState("");

  const { data: asadoRecords = [] } = useQuery<any[]>({
    queryKey: ['/api/production-records/stage/ASADO'],
  });

  const { data: peladoRecords = [] } = useQuery<any[]>({
    queryKey: ['/api/production-records/stage/PELADO'],
  });

  const { data: envasadoRecords = [] } = useQuery<any[]>({
    queryKey: ['/api/production-records/stage/ENVASADO'],
  });

  const { data: esterilizadoRecords = [] } = useQuery<any[]>({
    queryKey: ['/api/production-records/stage/ESTERILIZADO'],
  });

  const { data: allBatches = [] } = useQuery<any[]>({
    queryKey: ['/api/batches'],
  });

  const { data: packageTypes = [] } = useQuery<any[]>({
    queryKey: ['/api/package-types'],
  });

  const createProductionRecordMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/production-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Error al crear registro de producción');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/production-records/stage/ASADO'] });
      queryClient.invalidateQueries({ queryKey: ['/api/production-records/stage/PELADO'] });
      queryClient.invalidateQueries({ queryKey: ['/api/production-records/stage/ENVASADO'] });
      queryClient.invalidateQueries({ queryKey: ['/api/production-records/stage/ESTERILIZADO'] });
      queryClient.invalidateQueries({ queryKey: ['/api/batches'] });
      queryClient.invalidateQueries({ queryKey: ['/api/product-stock'] });
      toast({
        title: "Proceso creado",
        description: "El registro de producción se ha creado exitosamente",
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el registro de producción",
        variant: "destructive",
      });
    },
  });

  const updateBatchMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/batches/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Error al actualizar lote');
      return response.json();
    },
  });

  const createBatchMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/batches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Error al crear lote');
      return response.json();
    },
  });

  const getAvailableBatches = (): AvailableBatch[] => {
    let filteredBatches: any[] = [];

    switch (activeStage) {
      case "asado":
        // Solo lotes en RECEPCION
        filteredBatches = allBatches.filter(b => b.batch.status === "RECEPCION");
        break;
      case "pelado":
        // Solo lotes que pasaron por ASADO
        const asadoBatchCodes = asadoRecords.map(r => r.outputBatchCode);
        filteredBatches = allBatches.filter(b => asadoBatchCodes.includes(b.batch.batchCode));
        break;
      case "envasado":
        // Solo lotes que pasaron por PELADO
        const peladoBatchCodes = peladoRecords.map(r => r.outputBatchCode);
        filteredBatches = allBatches.filter(b => peladoBatchCodes.includes(b.batch.batchCode));
        break;
      case "esterilizado":
        // Solo lotes que pasaron por ENVASADO
        const envasadoBatchCodes = envasadoRecords.map(r => r.outputBatchCode);
        filteredBatches = allBatches.filter(b => envasadoBatchCodes.includes(b.batch.batchCode));
        break;
    }

    return filteredBatches.map(b => ({
      id: b.batch.id,
      batchCode: b.batch.batchCode,
      productName: b.product?.name || '-',
      availableQuantity: parseFloat(b.batch.quantity),
      unit: b.batch.unit,
      status: b.batch.status,
    }));
  };

  const handleBatchSelection = (batch: AvailableBatch, isChecked: boolean) => {
    if (isChecked) {
      setSelectedBatches([...selectedBatches, {
        batchId: batch.id,
        batchCode: batch.batchCode,
        productName: batch.productName,
        maxQuantity: batch.availableQuantity,
        unit: batch.unit,
        selectedQuantity: 0,
      }]);
    } else {
      setSelectedBatches(selectedBatches.filter(b => b.batchId !== batch.id));
    }
  };

  const handleQuantityChange = (batchId: string, quantity: string) => {
    const numQuantity = parseFloat(quantity) || 0;
    setSelectedBatches(selectedBatches.map(b => 
      b.batchId === batchId 
        ? { ...b, selectedQuantity: Math.min(numQuantity, b.maxQuantity) }
        : b
    ));
  };

  const calculateTotalInput = () => {
    return selectedBatches.reduce((sum, b) => sum + b.selectedQuantity, 0);
  };

  const handleCloseDialog = () => {
    setShowNewProcessDialog(false);
    setSelectedBatches([]);
    setOutputBatchCode("");
    setOutputQuantity("");
    setSelectedPackageType("");
    setPackageCount("");
    setNotes("");
  };

  const handleSubmitProcess = async () => {
    if (selectedBatches.length === 0 || !outputBatchCode) {
      toast({
        title: "Error",
        description: "Debes seleccionar al menos un lote de entrada y especificar un código de salida",
        variant: "destructive",
      });
      return;
    }

    const totalInput = calculateTotalInput();
    if (totalInput === 0) {
      toast({
        title: "Error",
        description: "Debes especificar cantidades para los lotes seleccionados",
        variant: "destructive",
      });
      return;
    }

    let finalOutputQuantity: number;
    let finalUnit: string;

    if (activeStage === "envasado") {
      // Envasado: cambio de unidad a envases
      if (!selectedPackageType || !packageCount || parseFloat(packageCount) === 0) {
        toast({
          title: "Error",
          description: "Debes seleccionar un tipo de envase y especificar la cantidad de envases",
          variant: "destructive",
        });
        return;
      }
      const pkgType = packageTypes.find((pt: any) => pt.id === selectedPackageType);
      finalOutputQuantity = parseFloat(packageCount);
      finalUnit = `envases ${pkgType?.name || 'unidad'}`;
    } else {
      // Otras etapas: misma unidad
      if (!outputQuantity || parseFloat(outputQuantity) === 0) {
        toast({
          title: "Error",
          description: "Debes especificar la cantidad de salida",
          variant: "destructive",
        });
        return;
      }
      finalOutputQuantity = parseFloat(outputQuantity);
      finalUnit = selectedBatches[0].unit;
    }

    try {
      // Determinar el estado según la etapa
      const stageStatusMap: Record<string, string> = {
        'asado': 'ASADO',
        'pelado': 'PELADO',
        'envasado': 'ENVASADO',
        'esterilizado': 'ESTERILIZADO',
      };
      const newStatus = stageStatusMap[activeStage] || 'EN_PROCESO';

      // Crear lote de salida
      const firstBatch = allBatches.find((b: any) => b.batch.id === selectedBatches[0].batchId);
      const newBatch = await createBatchMutation.mutateAsync({
        batchCode: outputBatchCode,
        productId: firstBatch?.batch.productId,
        quantity: finalOutputQuantity.toString(),
        unit: finalUnit,
        status: newStatus,
      });

      // Crear registros de producción para cada lote de entrada
      for (const selectedBatch of selectedBatches) {
        if (selectedBatch.selectedQuantity > 0) {
          await createProductionRecordMutation.mutateAsync({
            batchId: newBatch.id,
            stage: activeStage.toUpperCase(),
            inputBatchCode: selectedBatch.batchCode,
            outputBatchCode: outputBatchCode,
            inputQuantity: selectedBatch.selectedQuantity.toString(),
            outputQuantity: finalOutputQuantity.toString(),
            unit: selectedBatch.unit,
            notes: notes || null,
            completedAt: new Date().toISOString(),
          });

          // Actualizar cantidad disponible del lote de entrada
          const sourceBatch = allBatches.find((b: any) => b.batch.id === selectedBatch.batchId);
          if (sourceBatch) {
            const remainingQuantity = parseFloat(sourceBatch.batch.quantity) - selectedBatch.selectedQuantity;
            const stageStatusMap: Record<string, string> = {
              'asado': 'ASADO',
              'pelado': 'PELADO',
              'envasado': 'ENVASADO',
              'esterilizado': 'ESTERILIZADO',
            };
            const processedStatus = stageStatusMap[activeStage] || 'EN_PROCESO';
            
            await updateBatchMutation.mutateAsync({
              id: selectedBatch.batchId,
              data: {
                quantity: remainingQuantity.toString(),
                status: remainingQuantity > 0 ? sourceBatch.batch.status : processedStatus,
              },
            });
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ['/api/batches'] });
      queryClient.invalidateQueries({ queryKey: ['/api/product-stock'] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo completar el proceso",
        variant: "destructive",
      });
    }
  };

  const mapRecords = (records: any[]): ProductionBatch[] => 
    records.map(r => ({
      id: r.record?.id || r.id,
      code: r.record?.outputBatchCode || r.outputBatchCode,
      product: r.record?.inputBatchCode || r.inputBatchCode,
      quantity: parseFloat(r.record?.outputQuantity || r.outputQuantity),
      unit: r.record?.unit || r.unit,
      stage: (r.record?.completedAt || r.completedAt) ? "Completado" : "Pendiente",
      createdAt: new Date(r.record?.createdAt || r.createdAt).toLocaleDateString('es-ES')
    }));

  const asadoBatches = mapRecords(asadoRecords);
  const peladoBatches = mapRecords(peladoRecords);
  const envasadoBatches = mapRecords(envasadoRecords);
  const esterilizadoBatches = mapRecords(esterilizadoRecords);

  const columns: Column<ProductionBatch>[] = [
    { 
      key: "code", 
      label: "Código Lote Salida",
      render: (value) => <span className="font-mono font-medium">{value}</span>
    },
    { key: "product", label: "Lote Entrada" },
    { 
      key: "quantity", 
      label: "Cantidad",
      render: (value, row) => `${value} ${row.unit}`
    },
    { key: "createdAt", label: "Fecha" },
    { 
      key: "stage", 
      label: "Estado",
      render: (value) => (
        <StatusBadge 
          status={value === "Completado" ? "APROBADO" : "EN_PROCESO"} 
        />
      )
    },
  ];

  const stages = [
    {
      id: "asado",
      title: "Asado",
      icon: Flame,
      description: "Proceso de asado de materia prima",
      data: asadoBatches,
      color: "text-orange-600 dark:text-orange-400",
    },
    {
      id: "pelado",
      title: "Pelado y Corte",
      icon: Scissors,
      description: "Pelado y corte del producto asado",
      data: peladoBatches,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      id: "envasado",
      title: "Envasado",
      icon: PackageIcon,
      description: "Conversión a tarros y envasado",
      data: envasadoBatches,
      color: "text-green-600 dark:text-green-400",
    },
    {
      id: "esterilizado",
      title: "Esterilizado",
      icon: Droplets,
      description: "Esterilización y sellado final",
      data: esterilizadoBatches,
      color: "text-purple-600 dark:text-purple-400",
    },
  ];

  const availableBatches = getAvailableBatches();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Producción</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestión de las 4 etapas del proceso productivo
        </p>
      </div>

      <Tabs defaultValue="asado" className="space-y-4" onValueChange={setActiveStage}>
        <TabsList className="grid w-full grid-cols-4">
          {stages.map((stage) => {
            const Icon = stage.icon;
            return (
              <TabsTrigger 
                key={stage.id} 
                value={stage.id}
                data-testid={`tab-${stage.id}`}
              >
                <Icon className={`h-4 w-4 mr-2 ${stage.color}`} />
                {stage.title}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {stages.map((stage) => (
          <TabsContent key={stage.id} value={stage.id} className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <stage.icon className={`h-5 w-5 ${stage.color}`} />
                      {stage.title}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {stage.description}
                    </CardDescription>
                  </div>
                  <Button 
                    data-testid={`button-new-${stage.id}`}
                    onClick={() => setShowNewProcessDialog(true)}
                  >
                    Nuevo Proceso
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={columns}
                  data={stage.data}
                  onView={(row) => console.log(`View ${stage.id}:`, row)}
                  onEdit={(row) => console.log(`Edit ${stage.id}:`, row)}
                  emptyMessage={`No hay lotes en la etapa de ${stage.title.toLowerCase()}`}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={showNewProcessDialog} onOpenChange={setShowNewProcessDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Nuevo Proceso - {stages.find(s => s.id === activeStage)?.title}
            </DialogTitle>
            <DialogDescription>
              {activeStage === "asado" && "Selecciona lotes en RECEPCIÓN para procesar"}
              {activeStage === "pelado" && "Selecciona lotes que ya pasaron por ASADO"}
              {activeStage === "envasado" && "Selecciona lotes procesados en PELADO para envasar"}
              {activeStage === "esterilizado" && "Selecciona lotes envasados para esterilizar"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Selección de lotes de entrada */}
            <div>
              <Label className="text-base font-semibold">Lotes Disponibles</Label>
              <div className="mt-2 border rounded-lg">
                {availableBatches.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground text-center">
                    No hay lotes disponibles para esta etapa
                  </p>
                ) : (
                  <div className="divide-y">
                    {availableBatches.map((batch) => {
                      const isSelected = selectedBatches.some(b => b.batchId === batch.id);
                      const selectedBatch = selectedBatches.find(b => b.batchId === batch.id);

                      return (
                        <div key={batch.id} className="p-4 space-y-2">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => handleBatchSelection(batch, checked as boolean)}
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-mono font-medium">{batch.batchCode}</p>
                                  <p className="text-sm text-muted-foreground">{batch.productName}</p>
                                </div>
                                <p className="text-sm">
                                  Disponible: <span className="font-semibold">{batch.availableQuantity} {batch.unit}</span>
                                </p>
                              </div>
                              {isSelected && (
                                <div className="mt-2 flex items-center gap-2">
                                  <Label htmlFor={`qty-${batch.id}`} className="text-sm">Cantidad a usar:</Label>
                                  <Input
                                    id={`qty-${batch.id}`}
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max={batch.availableQuantity}
                                    value={selectedBatch?.selectedQuantity || ''}
                                    onChange={(e) => handleQuantityChange(batch.id, e.target.value)}
                                    className="w-32"
                                  />
                                  <span className="text-sm text-muted-foreground">{batch.unit}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {selectedBatches.length > 0 && (
                <p className="mt-2 text-sm font-medium">
                  Total entrada: {calculateTotalInput().toFixed(2)} {selectedBatches[0]?.unit}
                </p>
              )}
            </div>

            {/* Información de salida */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Lote de Salida</Label>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="output-code">Código de Lote Salida</Label>
                  <Input
                    id="output-code"
                    value={outputBatchCode}
                    onChange={(e) => setOutputBatchCode(e.target.value)}
                    placeholder="Ej: ASADO-001"
                  />
                </div>

                {activeStage === "envasado" ? (
                  <>
                    <div>
                      <Label htmlFor="package-type">Tipo de Envase</Label>
                      <Select value={selectedPackageType} onValueChange={setSelectedPackageType}>
                        <SelectTrigger id="package-type">
                          <SelectValue placeholder="Seleccionar envase" />
                        </SelectTrigger>
                        <SelectContent>
                          {packageTypes.map((pt: any) => (
                            <SelectItem key={pt.id} value={pt.id}>
                              {pt.name} ({pt.capacity} {pt.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="package-count">Número de Envases</Label>
                      <Input
                        id="package-count"
                        type="number"
                        step="1"
                        min="0"
                        value={packageCount}
                        onChange={(e) => setPackageCount(e.target.value)}
                        placeholder="Cantidad de envases"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <Label htmlFor="output-qty">Cantidad de Salida</Label>
                    <div className="flex gap-2">
                      <Input
                        id="output-qty"
                        type="number"
                        step="0.01"
                        min="0"
                        value={outputQuantity}
                        onChange={(e) => setOutputQuantity(e.target.value)}
                        placeholder="Cantidad producida"
                      />
                      {selectedBatches.length > 0 && (
                        <span className="flex items-center text-sm text-muted-foreground whitespace-nowrap">
                          {selectedBatches[0].unit}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="notes">Notas (Opcional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observaciones del proceso..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button onClick={handleSubmitProcess}>
                Crear Proceso
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}