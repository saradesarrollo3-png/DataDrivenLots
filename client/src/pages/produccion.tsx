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
  batchCode: string;
  productName: string;
  quantity: number;
  unit: string;
  status: string;
  createdAt: string;
  inputBatchCodes?: string[];
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
  const [editingBatch, setEditingBatch] = useState<ProductionBatch | null>(null);
  const [viewingBatch, setViewingBatch] = useState<ProductionBatch | null>(null);

  const { data: asadoBatches = [] } = useQuery<any[]>({
    queryKey: ['/api/batches/status/ASADO'],
  });

  const { data: peladoBatches = [] } = useQuery<any[]>({
    queryKey: ['/api/batches/status/PELADO'],
  });

  const { data: envasadoBatches = [] } = useQuery<any[]>({
    queryKey: ['/api/batches/status/ENVASADO'],
  });

  const { data: esterilizadoBatches = [] } = useQuery<any[]>({
    queryKey: ['/api/batches/status/ESTERILIZADO'],
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

  const deleteBatchMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/batches/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`,
        },
      });
      if (!response.ok) throw new Error('Error al eliminar lote');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/batches/status/ASADO'] });
      queryClient.invalidateQueries({ queryKey: ['/api/batches'] });
      queryClient.invalidateQueries({ queryKey: ['/api/product-stock'] });
      toast({
        title: "Lote eliminado",
        description: "El lote ha sido eliminado exitosamente",
      });
    },
  });

  const getAvailableBatches = (): AvailableBatch[] => {
    let filteredBatches: any[] = [];

    switch (activeStage) {
      case "asado":
        filteredBatches = allBatches.filter(b => b.batch.status === "RECEPCION" && parseFloat(b.batch.quantity) > 0);
        break;
      case "pelado":
        filteredBatches = allBatches.filter(b => b.batch.status === "ASADO" && parseFloat(b.batch.quantity) > 0);
        break;
      case "envasado":
        filteredBatches = allBatches.filter(b => b.batch.status === "PELADO" && parseFloat(b.batch.quantity) > 0);
        break;
      case "esterilizado":
        filteredBatches = allBatches.filter(b => b.batch.status === "ENVASADO" && parseFloat(b.batch.quantity) > 0);
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
    setEditingBatch(null);
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
      const stageStatusMap: Record<string, string> = {
        'asado': 'ASADO',
        'pelado': 'PELADO',
        'envasado': 'ENVASADO',
        'esterilizado': 'ESTERILIZADO',
      };
      const newStatus = stageStatusMap[activeStage] || 'EN_PROCESO';

      // Crear UN ÚNICO lote de salida consolidado
      const firstBatch = allBatches.find((b: any) => b.batch.id === selectedBatches[0].batchId);
      const newBatch = await createBatchMutation.mutateAsync({
        batchCode: outputBatchCode,
        productId: firstBatch?.batch.productId,
        quantity: finalOutputQuantity.toString(),
        unit: finalUnit,
        status: newStatus,
      });

      // Crear UN registro de producción que consolida todos los lotes de entrada
      const inputBatchCodes = selectedBatches
        .filter(b => b.selectedQuantity > 0)
        .map(b => b.batchCode)
        .join(', ');

      await createProductionRecordMutation.mutateAsync({
        batchId: newBatch.id,
        stage: activeStage.toUpperCase(),
        inputBatchCode: inputBatchCodes,
        outputBatchCode: outputBatchCode,
        inputQuantity: totalInput.toString(),
        outputQuantity: finalOutputQuantity.toString(),
        unit: selectedBatches[0].unit,
        notes: notes || null,
        completedAt: new Date().toISOString(),
      });

      // Actualizar cantidades disponibles de todos los lotes de entrada
      for (const selectedBatch of selectedBatches) {
        if (selectedBatch.selectedQuantity > 0) {
          const sourceBatch = allBatches.find((b: any) => b.batch.id === selectedBatch.batchId);
          if (sourceBatch) {
            const remainingQuantity = parseFloat(sourceBatch.batch.quantity) - selectedBatch.selectedQuantity;
            await updateBatchMutation.mutateAsync({
              id: selectedBatch.batchId,
              data: {
                quantity: remainingQuantity.toString(),
              },
            });
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ['/api/batches/status/ASADO'] });
      queryClient.invalidateQueries({ queryKey: ['/api/batches/status/PELADO'] });
      queryClient.invalidateQueries({ queryKey: ['/api/batches/status/ENVASADO'] });
      queryClient.invalidateQueries({ queryKey: ['/api/batches/status/ESTERILIZADO'] });
      queryClient.invalidateQueries({ queryKey: ['/api/batches'] });
      queryClient.invalidateQueries({ queryKey: ['/api/product-stock'] });
      
      toast({
        title: "Proceso creado",
        description: "El lote consolidado se ha creado exitosamente",
      });
      handleCloseDialog();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo completar el proceso",
        variant: "destructive",
      });
    }
  };

  const mapBatchesToTable = (batches: any[]): ProductionBatch[] => 
    batches.map(b => ({
      id: b.batch.id,
      batchCode: b.batch.batchCode,
      productName: b.product?.name || '-',
      quantity: parseFloat(b.batch.quantity),
      unit: b.batch.unit,
      status: b.batch.status,
      createdAt: new Date(b.batch.createdAt).toLocaleDateString('es-ES'),
    }));

  const asadoTableData = mapBatchesToTable(asadoBatches);
  const peladoTableData = mapBatchesToTable(peladoBatches);
  const envasadoTableData = mapBatchesToTable(envasadoBatches);
  const esterilizadoTableData = mapBatchesToTable(esterilizadoBatches);

  const columns: Column<ProductionBatch>[] = [
    { 
      key: "batchCode", 
      label: "Código Lote",
      render: (value) => <span className="font-mono font-medium">{value}</span>
    },
    { key: "productName", label: "Producto" },
    { 
      key: "quantity", 
      label: "Cantidad",
      render: (value, row) => `${value} ${row.unit}`
    },
    { key: "createdAt", label: "Fecha" },
    { 
      key: "status", 
      label: "Estado",
      render: (value) => <StatusBadge status={value} />
    },
  ];

  const handleView = (batch: ProductionBatch) => {
    setViewingBatch(batch);
  };

  const handleEdit = async (batch: ProductionBatch) => {
    setEditingBatch(batch);
    setOutputBatchCode(batch.batchCode);
    setOutputQuantity(batch.quantity.toString());
    
    // Cargar los registros de producción para obtener los lotes de entrada
    try {
      const response = await fetch(`/api/production-records/batch/${batch.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`,
        },
      });
      if (response.ok) {
        const records = await response.json();
        if (records.length > 0) {
          const inputCodes = records[0].record.inputBatchCode.split(', ');
          // Marcar los lotes de entrada como seleccionados
          const inputSelections: BatchSelection[] = [];
          for (const code of inputCodes) {
            const inputBatch = allBatches.find((b: any) => b.batch.batchCode === code.trim());
            if (inputBatch) {
              inputSelections.push({
                batchId: inputBatch.batch.id,
                batchCode: inputBatch.batch.batchCode,
                productName: inputBatch.product?.name || '-',
                maxQuantity: parseFloat(inputBatch.batch.quantity),
                unit: inputBatch.batch.unit,
                selectedQuantity: 0, // Se puede mejorar guardando las cantidades originales
              });
            }
          }
          setSelectedBatches(inputSelections);
        }
      }
    } catch (error) {
      console.error('Error loading production records:', error);
    }
    
    setShowNewProcessDialog(true);
  };

  const handleDelete = async (batch: ProductionBatch) => {
    if (window.confirm(`¿Estás seguro de eliminar el lote ${batch.batchCode}?`)) {
      await deleteBatchMutation.mutateAsync(batch.id);
    }
  };

  const stages = [
    {
      id: "asado",
      title: "Asado",
      icon: Flame,
      description: "Proceso de asado de materia prima",
      data: asadoTableData,
      color: "text-orange-600 dark:text-orange-400",
    },
    {
      id: "pelado",
      title: "Pelado y Corte",
      icon: Scissors,
      description: "Pelado y corte del producto asado",
      data: peladoTableData,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      id: "envasado",
      title: "Envasado",
      icon: PackageIcon,
      description: "Conversión a tarros y envasado",
      data: envasadoTableData,
      color: "text-green-600 dark:text-green-400",
    },
    {
      id: "esterilizado",
      title: "Esterilizado",
      icon: Droplets,
      description: "Esterilización y sellado final",
      data: esterilizadoTableData,
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
                  onView={stage.id === "asado" ? handleView : undefined}
                  onEdit={stage.id === "asado" ? handleEdit : undefined}
                  onDelete={stage.id === "asado" ? handleDelete : undefined}
                  emptyMessage={`No hay lotes en la etapa de ${stage.title.toLowerCase()}`}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={!!viewingBatch} onOpenChange={(open) => !open && setViewingBatch(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Lote</DialogTitle>
          </DialogHeader>
          {viewingBatch && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Código de Lote</Label>
                  <p className="font-medium font-mono">{viewingBatch.batchCode}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Estado</Label>
                  <div className="mt-1">
                    <StatusBadge status={viewingBatch.status} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Producto</Label>
                  <p className="font-medium">{viewingBatch.productName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Cantidad</Label>
                  <p className="font-medium">{viewingBatch.quantity} {viewingBatch.unit}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Fecha de Creación</Label>
                <p className="font-medium">{viewingBatch.createdAt}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showNewProcessDialog} onOpenChange={setShowNewProcessDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBatch ? "Editar Proceso" : "Nuevo Proceso"} - {stages.find(s => s.id === activeStage)?.title}
            </DialogTitle>
            <DialogDescription>
              {editingBatch && "Modificando el lote y sus orígenes"}
              {!editingBatch && activeStage === "asado" && "Selecciona lotes en RECEPCIÓN para procesar"}
              {!editingBatch && activeStage === "pelado" && "Selecciona lotes que ya pasaron por ASADO"}
              {!editingBatch && activeStage === "envasado" && "Selecciona lotes procesados en PELADO para envasar"}
              {!editingBatch && activeStage === "esterilizado" && "Selecciona lotes envasados para esterilizar"}
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