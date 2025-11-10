import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flame, Scissors, Package as PackageIcon, Droplets, Info, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
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
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProductionBatch {
  id: string;
  batchCode: string;
  productName: string;
  quantity: number;
  unit: string;
  status: string;
  createdAt: string;
  inputBatchCodes?: string[];
  initialQuantity?: number; // Added for ZodError
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

interface PackageOutput {
  id: string;
  packageTypeId: string;
  packageTypeName: string;
  quantity: number;
}

interface ViewBatchDetailsProps {
  batch: ProductionBatch;
  allBatches: any[];
}

function ViewBatchDetails({ batch, allBatches }: ViewBatchDetailsProps) {
  const [productionRecords, setProductionRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const response = await fetch(`/api/production-records/batch/${batch.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('sessionId')}`,
          },
        });
        if (response.ok) {
          const records = await response.json();
          setProductionRecords(records);
        }
      } catch (error) {
        console.error('Error loading production records:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [batch.id]);

  if (loading) {
    return <div className="p-4 text-center text-muted-foreground">Cargando detalles...</div>;
  }

  const record = productionRecords[0]?.record;
  const totalInputQty = parseFloat(record?.inputQuantity || '0');

  // Parsear los detalles de lotes de entrada si existen
  let inputBatchDetails = [];
  try {
    inputBatchDetails = record?.inputBatchDetails ? JSON.parse(record.inputBatchDetails) : [];
  } catch (e) {
    console.error('Error parsing inputBatchDetails:', e);
  }

  return (
    <div className="space-y-6">
      {/* Información del lote de salida */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Lote Producido</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground">Código de Lote</Label>
            <p className="font-medium font-mono">{batch.batchCode}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Estado</Label>
            <div className="mt-1">
              <StatusBadge status={batch.status} />
            </div>
          </div>
          <div>
            <Label className="text-muted-foreground">Producto</Label>
            <p className="font-medium">{batch.productName}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Cantidad Producida</Label>
            <p className="font-medium">{batch.quantity} {batch.unit}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Fecha de Creación</Label>
            <p className="font-medium">{batch.createdAt}</p>
          </div>
        </div>
      </div>

      {/* Materia prima utilizada */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Materia Prima Utilizada</h3>
        <div className="border rounded-lg divide-y">
          {inputBatchDetails.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">
              No hay información de materia prima
            </p>
          ) : (
            inputBatchDetails.map((detail: any, index: number) => {
              const inputBatch = allBatches.find((b: any) => b.batch.id === detail.batchId);

              return (
                <div key={index} className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-medium">{detail.batchCode}</span>
                        <span className="text-sm text-muted-foreground">
                          ({inputBatch?.product?.name || 'Producto desconocido'})
                        </span>
                      </div>
                      {inputBatch?.supplier && (
                        <div className="text-sm text-muted-foreground">
                          Proveedor: <span className="font-medium">{inputBatch.supplier.name}</span>
                        </div>
                      )}
                      <div className="text-sm mt-1">
                        Cantidad utilizada: <span className="font-semibold">{detail.quantity.toFixed(2)} {batch.unit}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {totalInputQty > 0 && (
          <div className="mt-2 text-sm font-medium">
            Total materia prima: {totalInputQty.toFixed(2)} {batch.unit}
          </div>
        )}
      </div>

      {/* Notas */}
      {record?.notes && (
        <div>
          <Label className="text-muted-foreground">Notas del Proceso</Label>
          <p className="mt-1 text-sm">{record.notes}</p>
        </div>
      )}
    </div>
  );
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
  const [packageOutputs, setPackageOutputs] = useState<PackageOutput[]>([]);
  const [notes, setNotes] = useState("");
  const [editingBatch, setEditingBatch] = useState<ProductionBatch | null>(null);
  const [viewingBatch, setViewingBatch] = useState<ProductionBatch | null>(null);
  const [editProcessedDate, setEditProcessedDate] = useState<string>('');
  const [editProcessedTime, setEditProcessedTime] = useState<string>('');
  
  // Generar código de lote base según la etapa
  const generateBatchCode = (stage: string) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    const prefixes: Record<string, string> = {
      'asado': 'ASA',
      'envasado': 'ENV',
      'esterilizado': 'EST',
    };
    
    const prefix = prefixes[stage] || 'LOTE';
    return `${prefix}-${year}${month}${day}-${random}`;
  };

  const { data: asadoBatches = [] } = useQuery<any[]>({
    queryKey: ['/api/batches/status/ASADO'],
  });

  const { data: peladoBatchesRaw = [] } = useQuery<any[]>({
    queryKey: ['/api/batches/status/PELADO'],
  });

  // Filtrar lotes de pelado con cantidad mayor a 0
  const peladoBatches = peladoBatchesRaw.filter(b => {
    const quantity = parseFloat(b.batch.quantity);
    return quantity > 0;
  });

  console.log("📦 Lotes PELADO filtrados (cantidad > 0):", peladoBatches.length, "de", peladoBatchesRaw.length);
  console.log("📦 Lotes PELADO RAW:", peladoBatchesRaw.map(b => ({code: b.batch.batchCode, qty: b.batch.quantity})));

  const { data: envasadoBatchesRaw = [] } = useQuery<any[]>({
    queryKey: ['/api/batches/status/ENVASADO'],
  });

  // Filtrar lotes de envasado con cantidad mayor a 0
  const envasadoBatches = envasadoBatchesRaw.filter(b => {
    const quantity = parseFloat(b.batch.quantity);
    return quantity > 0;
  });

  console.log("📦 Lotes ENVASADO filtrados (cantidad > 0):", envasadoBatches.length, "de", envasadoBatchesRaw.length);

  const { data: esterilizadoBatchesRaw = [] } = useQuery<any[]>({
    queryKey: ['/api/batches/status/ESTERILIZADO'],
  });

  // Filtrar lotes de esterilizado con cantidad mayor a 0
  const esterilizadoBatches = esterilizadoBatchesRaw.filter(b => {
    const quantity = parseFloat(b.batch.quantity);
    return quantity > 0;
  });

  console.log("📦 Lotes ESTERILIZADO filtrados (cantidad > 0):", esterilizadoBatches.length, "de", esterilizadoBatchesRaw.length);

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
    onSuccess: async () => {
      // Invalidar y refrescar inmediatamente todas las queries relacionadas
      await queryClient.invalidateQueries({ queryKey: ['/api/batches/status/ASADO'], refetchType: 'active' });
      await queryClient.invalidateQueries({ queryKey: ['/api/batches/status/PELADO'], refetchType: 'active' });
      await queryClient.invalidateQueries({ queryKey: ['/api/batches/status/ENVASADO'], refetchType: 'active' });
      await queryClient.invalidateQueries({ queryKey: ['/api/batches/status/ESTERILIZADO'], refetchType: 'active' });
      await queryClient.invalidateQueries({ queryKey: ['/api/batches'], refetchType: 'active' });
      await queryClient.invalidateQueries({ queryKey: ['/api/product-stock'], refetchType: 'active' });
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
        // Filtrar lotes PELADO con cantidad mayor a 0
        filteredBatches = allBatches.filter(b => {
          const quantity = parseFloat(b.batch.quantity);
          const isValid = b.batch.status === "PELADO" && quantity > 0;
          console.log(`📦 Lote ${b.batch.batchCode}: status=${b.batch.status}, quantity=${quantity}, isValid=${isValid}`);
          return isValid;
        });
        console.log("📦 Total lotes disponibles para ENVASADO (PELADO con cantidad > 0):", filteredBatches.length);
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
      // Para pelado, envasado y esterilizado, asignar automáticamente la cantidad completa del lote
      const autoQuantity = (activeStage === "pelado" || activeStage === "envasado" || activeStage === "esterilizado")
        ? batch.availableQuantity
        : 0;

      console.log("✅ Lote seleccionado:", batch.batchCode, "Cantidad auto:", autoQuantity);

      setSelectedBatches([...selectedBatches, {
        batchId: batch.id,
        batchCode: batch.batchCode,
        productName: batch.productName,
        maxQuantity: batch.availableQuantity,
        unit: batch.unit,
        selectedQuantity: autoQuantity,
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

  const calculateTotalPackageOutput = () => {
    return packageOutputs.reduce((sum, p) => sum + p.quantity, 0);
  };

  // Calcular totales por tipo de envase para esterilizado
  const calculatePackageTypesSummary = () => {
    if (activeStage !== "esterilizado") return [];

    const summary = new Map<string, { typeName: string; count: number; unit: string }>();

    selectedBatches.forEach(selectedBatch => {
      // Extraer el tipo de envase del código de lote (formato: CODIGO-TIPO)
      const parts = selectedBatch.batchCode.split('-');
      const packageType = parts.length > 1 ? parts[parts.length - 1] : selectedBatch.batchCode;

      if (summary.has(packageType)) {
        const existing = summary.get(packageType)!;
        existing.count += selectedBatch.selectedQuantity;
      } else {
        summary.set(packageType, {
          typeName: packageType,
          count: selectedBatch.selectedQuantity,
          unit: selectedBatch.unit,
        });
      }
    });

    return Array.from(summary.values());
  };

  const getTotalEsterilizadoOutput = () => {
    return selectedBatches.reduce((sum, b) => sum + b.selectedQuantity, 0);
  };

  const addPackageOutput = () => {
    if (!selectedPackageType || !packageCount || parseFloat(packageCount) <= 0) {
      toast({
        title: "Error",
        description: "Debes seleccionar un tipo de envase y especificar una cantidad válida",
        variant: "destructive",
      });
      return;
    }

    const pkgType = packageTypes.find((pt: any) => pt.id === selectedPackageType);
    if (!pkgType) return;

    const newOutput: PackageOutput = {
      id: `pkg-${Date.now()}`,
      packageTypeId: selectedPackageType,
      packageTypeName: pkgType.name,
      quantity: parseFloat(packageCount),
    };

    setPackageOutputs([...packageOutputs, newOutput]);
    setSelectedPackageType("");
    setPackageCount("");
  };

  const removePackageOutput = (id: string) => {
    setPackageOutputs(packageOutputs.filter(p => p.id !== id));
  };

  const updatePackageOutputQuantity = (id: string, quantity: string) => {
    const numQuantity = parseFloat(quantity) || 0;
    setPackageOutputs(packageOutputs.map(p =>
      p.id === id ? { ...p, quantity: numQuantity } : p
    ));
  };

  const handleCloseDialog = () => {
    setShowNewProcessDialog(false);
    setEditingBatch(null);
    setSelectedBatches([]);
    setOutputBatchCode("");
    setOutputQuantity("");
    setSelectedPackageType("");
    setPackageCount("");
    setPackageOutputs([]);
    setNotes("");
    setEditProcessedDate("");
    setEditProcessedTime("");
  };
  
  // Generar código al abrir el diálogo
  const handleOpenNewProcessDialog = () => {
    if (!editingBatch && activeStage !== "pelado") {
      setOutputBatchCode(generateBatchCode(activeStage));
    }
    setShowNewProcessDialog(true);
  };

  const handleSubmitProcess = async () => {
    console.log("🚀 handleSubmitProcess - activeStage:", activeStage);
    console.log("🚀 selectedBatches:", selectedBatches);

    if (selectedBatches.length === 0) {
      toast({
        title: "Error",
        description: "Debes seleccionar al menos un lote",
        variant: "destructive",
      });
      return;
    }

    // Obtener la fecha y hora del formulario
    const processedDateInput = document.getElementById('processedDate') as HTMLInputElement;
    const processedTimeInput = document.getElementById('processedTime') as HTMLInputElement;

    let processedDateTime: string | undefined = undefined;
    if (processedDateInput?.value && processedTimeInput?.value) {
      processedDateTime = `${processedDateInput.value}T${processedTimeInput.value}:00`;
    }

    // Para pelado, crear registro de producción y cambiar estado
    if (activeStage === "pelado") {
      try {
        const inputBatchCodes = selectedBatches
          .filter(b => b.selectedQuantity > 0)
          .map(b => b.batchCode)
          .join(', ');

        const inputBatchDetails = selectedBatches
          .filter(b => b.selectedQuantity > 0)
          .map(b => ({
            batchId: b.batchId,
            batchCode: b.batchCode,
            quantity: b.selectedQuantity,
          }));

        const finalUnit = selectedBatches[0]?.unit || 'kg';

        for (const selectedBatch of selectedBatches) {
          if (selectedBatch.selectedQuantity > 0) {
            // Cambiar el estado del lote de ASADO a PELADO
            await updateBatchMutation.mutateAsync({
              id: selectedBatch.batchId,
              data: {
                status: 'PELADO',
                processedDate: processedDateTime,
              },
            });

            // Crear registro de producción para trazabilidad
            await createProductionRecordMutation.mutateAsync({
              batchId: selectedBatch.batchId,
              stage: 'PELADO',
              inputBatchCode: inputBatchCodes,
              outputBatchCode: selectedBatch.batchCode,
              inputQuantity: selectedBatch.selectedQuantity.toString(),
              outputQuantity: selectedBatch.selectedQuantity.toString(),
              unit: finalUnit,
              inputBatchDetails: JSON.stringify(inputBatchDetails),
              notes: notes || null,
              processedDate: processedDateTime,
              completedAt: new Date().toISOString(),
            });
          }
        }

        await queryClient.invalidateQueries({ queryKey: ['/api/batches/status/ASADO'] });
        await queryClient.invalidateQueries({ queryKey: ['/api/batches/status/PELADO'] });
        await queryClient.invalidateQueries({ queryKey: ['/api/batches'] });

        handleCloseDialog();
        return;
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "No se pudo completar el proceso",
          variant: "destructive",
        });
        return;
      }
    }

    // Para otras etapas, validar código de salida
    if (!outputBatchCode) {
      toast({
        title: "Error",
        description: "Debes especificar un código de salida",
        variant: "destructive",
      });
      return;
    }

    const totalInput = calculateTotalInput();
    console.log("🚀 totalInput:", totalInput);

    // Para envasado y esterilizado, no requerimos cantidades específicas por lote
    // ya que solo se seleccionan lotes completos
    if (activeStage === "asado" && totalInput === 0) {
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
      if (packageOutputs.length === 0) {
        toast({
          title: "Error",
          description: "Debes añadir al menos un tipo de envase con su cantidad",
          variant: "destructive",
        });
        return;
      }

      const totalPackages = calculateTotalPackageOutput();
      if (totalPackages === 0) {
        toast({
          title: "Error",
          description: "La cantidad total de envases debe ser mayor a cero",
          variant: "destructive",
        });
        return;
      }

      // Validar que el total no exceda la materia disponible
      const totalAvailable = calculateTotalInput();
      if (totalAvailable === 0) {
        toast({
          title: "Error",
          description: "Debes especificar las cantidades de los lotes seleccionados",
          variant: "destructive",
        });
        return;
      }

      finalOutputQuantity = totalPackages;
      finalUnit = "envases";
    } else if (activeStage === "esterilizado") {
      // Para esterilizado, la cantidad se calcula automáticamente de los lotes seleccionados
      finalOutputQuantity = getTotalEsterilizadoOutput();
      finalUnit = selectedBatches[0]?.unit || "envases";
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
      const currentStage = activeStage.toUpperCase();

      const firstBatch = allBatches.find((b: any) => b.batch.id === selectedBatches[0].batchId);

      if (activeStage === "envasado") {
        console.log("📦 Procesando envasado - packageOutputs:", packageOutputs);
        console.log("📦 selectedBatches antes de filtrar:", selectedBatches);

        // Para envasado con múltiples salidas, crear un lote por cada tipo de envase
        const inputBatchCodes = selectedBatches
          .filter(b => b.selectedQuantity > 0)
          .map(b => b.batchCode)
          .join(', ');

        console.log("📦 inputBatchCodes:", inputBatchCodes);

        const inputBatchDetails = selectedBatches
          .filter(b => b.selectedQuantity > 0)
          .map(b => ({
            batchId: b.batchId,
            batchCode: b.batchCode,
            quantity: b.selectedQuantity,
          }));

        console.log("📦 inputBatchDetails:", inputBatchDetails);

        const totalInput = calculateTotalInput();
        console.log("📦 totalInput calculado:", totalInput);

        // Crear un lote por cada tipo de envase
        for (const pkgOutput of packageOutputs) {
          const pkgType = packageTypes.find((pt: any) => pt.id === pkgOutput.packageTypeId);
          const batchCodeWithPkg = `${outputBatchCode}-${pkgType?.code || pkgOutput.packageTypeName}`;

          const batchData: any = {
            batchCode: batchCodeWithPkg,
            productId: firstBatch?.batch.productId,
            initialQuantity: pkgOutput.quantity.toString(),
            quantity: pkgOutput.quantity.toString(),
            unit: `envases ${pkgType?.name || 'unidad'}`,
            status: newStatus,
            processedDate: processedDateTime,
          };

          const newBatch = await createBatchMutation.mutateAsync(batchData);

          // Crear registro de producción para este envase
          await createProductionRecordMutation.mutateAsync({
            batchId: newBatch.id,
            stage: currentStage,
            inputBatchCode: inputBatchCodes,
            outputBatchCode: batchCodeWithPkg,
            inputQuantity: totalInput.toString(),
            outputQuantity: pkgOutput.quantity.toString(),
            unit: selectedBatches[0].unit,
            inputBatchDetails: JSON.stringify(inputBatchDetails),
            notes: notes ? `${notes} - Envase: ${pkgType?.name} (${pkgOutput.quantity} unidades)` : `Envase: ${pkgType?.name} (${pkgOutput.quantity} unidades)`,
            processedDate: processedDateTime,
            completedAt: new Date().toISOString(),
          });
        }

        // Actualizar los lotes de entrada para reflejar el consumo
        // Los lotes de PELADO se agotan pero mantienen su estado PELADO
        for (const selectedBatch of selectedBatches) {
          if (selectedBatch.selectedQuantity > 0) {
            const currentBatch = allBatches.find((b: any) => b.batch.id === selectedBatch.batchId);
            if (currentBatch) {
              const remainingQuantity = parseFloat(currentBatch.batch.quantity) - selectedBatch.selectedQuantity;
              await updateBatchMutation.mutateAsync({
                id: selectedBatch.batchId,
                data: {
                  quantity: remainingQuantity.toString(),
                  // NO cambiar el estado, permanece en PELADO
                },
              });
            }
          }
        }
      } else if (activeStage === "esterilizado") {
        // Agrupar lotes por tipo de envase
        const packageTypesMap = new Map<string, {
          typeName: string;
          batches: typeof selectedBatches;
          totalQuantity: number;
          unit: string;
        }>();

        selectedBatches.forEach(selectedBatch => {
          if (selectedBatch.selectedQuantity > 0) {
            // Extraer el tipo de envase del código de lote
            const parts = selectedBatch.batchCode.split('-');
            const packageType = parts.length > 1 ? parts[parts.length - 1] : selectedBatch.batchCode;

            if (packageTypesMap.has(packageType)) {
              const existing = packageTypesMap.get(packageType)!;
              existing.batches.push(selectedBatch);
              existing.totalQuantity += selectedBatch.selectedQuantity;
            } else {
              packageTypesMap.set(packageType, {
                typeName: packageType,
                batches: [selectedBatch],
                totalQuantity: selectedBatch.selectedQuantity,
                unit: selectedBatch.unit,
              });
            }
          }
        });

        // Crear un lote esterilizado por cada tipo de envase
        for (const [packageType, packageGroup] of packageTypesMap.entries()) {
          const inputBatchCodes = packageGroup.batches.map(b => b.batchCode).join(', ');
          const inputBatchDetails = packageGroup.batches.map(b => ({
            batchId: b.batchId,
            batchCode: b.batchCode,
            quantity: b.selectedQuantity,
          }));

          const firstBatch = allBatches.find((b: any) => b.batch.id === packageGroup.batches[0].batchId);
          const batchCodeWithType = outputBatchCode ? `${outputBatchCode}-${packageType}` : `EST-${packageType}`;

          // Crear nuevo lote esterilizado consolidado por tipo
          const batchData: any = {
            batchCode: batchCodeWithType,
            productId: firstBatch?.batch.productId,
            initialQuantity: packageGroup.totalQuantity.toString(),
            quantity: packageGroup.totalQuantity.toString(),
            unit: packageGroup.unit,
            status: 'ESTERILIZADO',
            processedDate: processedDateTime,
          };

          const newBatch = await createBatchMutation.mutateAsync(batchData);

          // Crear registro de producción
          await createProductionRecordMutation.mutateAsync({
            batchId: newBatch.id,
            stage: 'ESTERILIZADO',
            inputBatchCode: inputBatchCodes,
            outputBatchCode: batchCodeWithType,
            inputQuantity: packageGroup.totalQuantity.toString(),
            outputQuantity: packageGroup.totalQuantity.toString(),
            unit: packageGroup.unit,
            inputBatchDetails: JSON.stringify(inputBatchDetails),
            notes: notes ? `${notes} - Tipo: ${packageType} (${packageGroup.totalQuantity} ${packageGroup.unit})` : `Tipo: ${packageType} (${packageGroup.totalQuantity} ${packageGroup.unit})`,
            processedDate: processedDateTime,
            completedAt: new Date().toISOString(),
          });

          // Marcar lotes de ENVASADO como consumidos
          for (const selectedBatch of packageGroup.batches) {
            await updateBatchMutation.mutateAsync({
              id: selectedBatch.batchId,
              data: {
                quantity: "0",
              },
            });
          }
        }
      } else {
          // Para asado, crear nuevo lote o actualizar existente
          const inputBatchCodes = selectedBatches
            .filter(b => b.selectedQuantity > 0)
            .map(b => b.batchCode)
            .join(', ');

          const inputBatchDetails = selectedBatches
            .filter(b => b.selectedQuantity > 0)
            .map(b => ({
              batchId: b.batchId,
              batchCode: b.batchCode,
              quantity: b.selectedQuantity,
            }));

          const totalInput = calculateTotalInput();

          if (editingBatch) {
            // Actualizar lote existente
            await updateBatchMutation.mutateAsync({
              id: editingBatch.id,
              data: {
                quantity: finalOutputQuantity.toString(),
                processedDate: processedDateTime,
              },
            });

            // Actualizar el registro de producción existente
            const existingRecords = await fetch(`/api/production-records/batch/${editingBatch.id}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('sessionId')}`,
              },
            }).then(r => r.json());

            if (existingRecords.length > 0) {
              // Aquí deberías tener una ruta PUT para actualizar el registro
              // Por ahora, se mantiene como está
            }
          } else {
            // Crear lote de ASADO
            const batchData: any = {
              batchCode: outputBatchCode,
              productId: firstBatch?.batch.productId,
              initialQuantity: finalOutputQuantity.toString(),
              quantity: finalOutputQuantity.toString(),
              unit: finalUnit,
              status: 'ASADO',
              processedDate: processedDateTime,
            };

            const newBatch = await createBatchMutation.mutateAsync(batchData);

            // Crear registro de producción
            await createProductionRecordMutation.mutateAsync({
              batchId: newBatch.id,
              stage: 'ASADO',
              inputBatchCode: inputBatchCodes,
              outputBatchCode: outputBatchCode,
              inputQuantity: totalInput.toString(),
              outputQuantity: finalOutputQuantity.toString(),
              unit: finalUnit,
              inputBatchDetails: JSON.stringify(inputBatchDetails),
              notes: notes || null,
              processedDate: processedDateTime,
              completedAt: new Date().toISOString(),
            });

            // Reducir cantidad de los lotes de RECEPCIÓN sin cambiar su estado
            for (const selectedBatch of selectedBatches) {
              if (selectedBatch.selectedQuantity > 0) {
                const currentBatch = allBatches.find((b: any) => b.batch.id === selectedBatch.batchId);
                if (currentBatch) {
                  const remainingQuantity = parseFloat(currentBatch.batch.quantity) - selectedBatch.selectedQuantity;
                  await updateBatchMutation.mutateAsync({
                    id: selectedBatch.batchId,
                    data: {
                      quantity: remainingQuantity.toString(),
                      // NO cambiar el estado, permanece en RECEPCION
                    },
                  });
                }
              }
            }
          }
      }

      // Invalidate queries for all stages to refresh data
      await queryClient.invalidateQueries({ queryKey: ['/api/batches/status/ASADO'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/batches/status/PELADO'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/batches/status/ENVASADO'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/batches/status/ESTERILIZADO'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/batches'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/product-stock'] });

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
    batches
      .filter(b => parseFloat(b.batch.quantity) > 0) // Filtrar lotes con cantidad 0
      .map(b => {
        let displayDateTime = '';
        if (b.batch.processedDate) {
          const dt = new Date(b.batch.processedDate);
          displayDateTime = dt.toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          });
        } else {
          displayDateTime = new Date(b.batch.createdAt).toLocaleDateString('es-ES');
        }

        return {
          id: b.batch.id,
          batchCode: b.batch.batchCode,
          productName: b.product?.name || '-',
          quantity: parseFloat(b.batch.quantity),
          initialQuantity: b.batch.initialQuantity !== undefined ? parseFloat(b.batch.initialQuantity) : undefined,
          unit: b.batch.unit,
          status: b.batch.status,
          createdAt: displayDateTime,
        };
      });

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
    console.log('Edit asado:', batch);
    setEditingBatch(batch);
    setOutputBatchCode(batch.batchCode);
    setOutputQuantity(batch.quantity.toString());

    // Cargar los registros de producción para obtener fecha/hora y notas
    try {
      const response = await fetch(`/api/production-records/batch/${batch.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`,
        },
      });
      if (response.ok) {
        const records = await response.json();
        if (records.length > 0) {
          const record = records[0].record;

          if (record.notes) {
            setNotes(record.notes);
          }

          // Cargar fecha y hora desde processedDate
          if (record.processedDate) {
            const processedDateTime = new Date(record.processedDate);
            setEditProcessedDate(processedDateTime.toISOString().split('T')[0]);
            setEditProcessedTime(processedDateTime.toTimeString().slice(0, 5));
          } else {
            setEditProcessedDate(new Date().toISOString().split('T')[0]);
            setEditProcessedTime(new Date().toTimeString().slice(0, 5));
          }
        }
      }
    } catch (error) {
      console.error('Error loading production records:', error);
    }

    // No cargar lotes de entrada para evitar que reaparezcan
    setSelectedBatches([]);
    setShowNewProcessDialog(true);
  };

  const handleDelete = async (batch: ProductionBatch) => {
    if (window.confirm(`¿Estás seguro de eliminar el lote ${batch.batchCode}?`)) {
      await deleteBatchMutation.mutateAsync(batch.id);
    }
  };

  const handleDeletePelado = async (batch: ProductionBatch) => {
    if (window.confirm(`¿Estás seguro de eliminar el lote ${batch.batchCode}?`)) {
      await deleteBatchMutation.mutateAsync(batch.id);
    }
  };

  const handleDeleteEnvasado = async (batch: ProductionBatch) => {
    if (window.confirm(`¿Estás seguro de eliminar el lote ${batch.batchCode}?`)) {
      await deleteBatchMutation.mutateAsync(batch.id);
    }
  };

  const handleDeleteEsterilizado = async (batch: ProductionBatch) => {
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
      helpText: "Convierte la materia prima (estado RECEPCIÓN) en producto asado",
      inputStatus: "RECEPCIÓN",
      outputStatus: "ASADO",
      instructions: [
        "Selecciona uno o varios lotes en estado RECEPCIÓN",
        "Introduce la cantidad de cada lote que vas a procesar",
        "El sistema creará un nuevo lote en estado ASADO",
        "Los lotes de origen se reducirán en la cantidad procesada"
      ]
    },
    {
      id: "pelado",
      title: "Pelado y Corte",
      icon: Scissors,
      description: "Pelado y corte del producto asado",
      data: peladoTableData,
      color: "text-blue-600 dark:text-blue-400",
      helpText: "Cambia el estado de lotes ASADO a PELADO una vez procesados",
      inputStatus: "ASADO",
      outputStatus: "PELADO",
      instructions: [
        "Selecciona los lotes que han sido asados (estado ASADO)",
        "La cantidad completa del lote se marca como procesada",
        "El lote cambia automáticamente a estado PELADO",
        "Se mantiene la trazabilidad completa del proceso"
      ]
    },
    {
      id: "envasado",
      title: "Envasado",
      icon: PackageIcon,
      description: "Conversión a tarros y envasado",
      data: envasadoTableData,
      color: "text-green-600 dark:text-green-400",
      helpText: "Convierte producto PELADO en envases específicos (frascos, tarros, etc.)",
      inputStatus: "PELADO",
      outputStatus: "ENVASADO",
      instructions: [
        "Selecciona lotes en estado PELADO con cantidad disponible",
        "Define la cantidad de cada lote que vas a envasar",
        "Añade los tipos de envase y cantidades producidas",
        "Se crearán lotes nuevos por cada tipo de envase"
      ]
    },
    {
      id: "esterilizado",
      title: "Esterilizado",
      icon: Droplets,
      description: "Esterilización y sellado final",
      data: esterilizadoTableData,
      color: "text-purple-600 dark:text-purple-400",
      helpText: "Esteriliza los lotes ENVASADO para su conservación",
      inputStatus: "ENVASADO",
      outputStatus: "ESTERILIZADO",
      instructions: [
        "Selecciona lotes envasados (estado ENVASADO)",
        "Los lotes se agrupan automáticamente por tipo de envase",
        "Se crea un lote esterilizado consolidado por tipo",
        "Los envases pasan a estado ESTERILIZADO para control de calidad"
      ]
    },
  ];

  const availableBatches = getAvailableBatches();

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Producción</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Gestión de las 4 etapas del proceso productivo
        </p>
      </div>

      <Tabs defaultValue="asado" className="space-y-4" onValueChange={setActiveStage}>
        <TabsList className="grid grid-cols-2 md:grid-cols-4">
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
            {/* Alerta informativa con ayuda contextual */}
            <Alert className="border-primary/50">
              <Info className="h-4 w-4" />
              <AlertTitle className="flex items-center gap-2">
                Proceso: {stage.inputStatus} <ArrowRight className="h-4 w-4" /> {stage.outputStatus}
              </AlertTitle>
              <AlertDescription>
                {stage.helpText}
              </AlertDescription>
            </Alert>

            {/* Card con instrucciones paso a paso */}
            <Card className="border-primary/30 bg-muted/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  ¿Cómo crear un nuevo proceso?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2 text-sm">
                  {stage.instructions.map((instruction, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="font-semibold text-primary min-w-6">{idx + 1}.</span>
                      <span className="text-muted-foreground">{instruction}</span>
                    </li>
                  ))}
                </ol>
                <div className="mt-4 pt-4 border-t">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          data-testid={`button-new-${stage.id}`}
                          onClick={handleOpenNewProcessDialog}
                          className="w-full sm:w-auto"
                        >
                          <stage.icon className="h-4 w-4 mr-2" />
                          Iniciar Nuevo Proceso de {stage.title}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Los lotes disponibles estarán en estado {stage.inputStatus}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardContent>
            </Card>

            {/* Tabla de lotes */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <stage.icon className={`h-5 w-5 ${stage.color}`} />
                      Lotes en {stage.title}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {stage.data.length === 0 
                        ? `No hay lotes procesados en esta etapa`
                        : `${stage.data.length} lote(s) en estado ${stage.outputStatus}`
                      }
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {stage.data.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      No hay lotes en la etapa de {stage.title.toLowerCase()}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Comienza creando un nuevo proceso con lotes en estado {stage.inputStatus}
                    </p>
                    <Button
                      variant="outline"
                      onClick={handleOpenNewProcessDialog}
                    >
                      Crear Primer Lote
                    </Button>
                  </div>
                ) : (
                  <DataTable
                    columns={columns}
                    data={stage.data}
                    onView={stage.id === "asado" ? handleView : undefined}
                    onEdit={stage.id === "asado" ? handleEdit : undefined}
                    onDelete={
                      stage.id === "asado" ? handleDelete :
                      stage.id === "pelado" ? handleDeletePelado :
                      stage.id === "envasado" ? handleDeleteEnvasado :
                      stage.id === "esterilizado" ? handleDeleteEsterilizado :
                      undefined
                    }
                    emptyMessage={`No hay lotes en la etapa de ${stage.title.toLowerCase()}`}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={!!viewingBatch} onOpenChange={(open) => !open && setViewingBatch(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Lote de Producción</DialogTitle>
          </DialogHeader>
          {viewingBatch && (
            <ViewBatchDetails
              batch={viewingBatch}
              allBatches={allBatches}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showNewProcessDialog} onOpenChange={setShowNewProcessDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {stages.find(s => s.id === activeStage)?.icon && 
                React.createElement(stages.find(s => s.id === activeStage)!.icon, {
                  className: `h-5 w-5 ${stages.find(s => s.id === activeStage)?.color}`
                })
              }
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

          {/* Alerta de ayuda dentro del diálogo */}
          {!editingBatch && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Estado de lotes disponibles</AlertTitle>
              <AlertDescription>
                Los lotes que aparecen a continuación están en estado <strong>{stages.find(s => s.id === activeStage)?.inputStatus}</strong> y tienen cantidad disponible.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            {/* Selección de lotes de entrada - solo para asado */}
            {activeStage === "asado" && (
              <div>
                <Label className="text-base font-semibold">
                  {editingBatch ? "Materia Prima Utilizada" : "Lotes Disponibles en RECEPCIÓN"}
                </Label>
                <div className="mt-2 border rounded-lg">
                  {availableBatches.length === 0 && selectedBatches.length === 0 ? (
                    <div className="p-8 text-center">
                      <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground mb-2">
                        No hay lotes en estado RECEPCIÓN con cantidad disponible
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Primero debes registrar materia prima en la sección de Recepción
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {/* Mostrar lotes seleccionados (en edición) */}
                      {editingBatch && selectedBatches.map((selectedBatch) => {
                        const batchDetails = allBatches.find((b: any) => b.batch.id === selectedBatch.batchId);

                        return (
                          <div key={selectedBatch.batchId} className="p-4 space-y-2 bg-muted/30">
                            <div className="flex items-start gap-3">
                              <Checkbox checked={true} disabled />
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <p className="font-mono font-medium">{selectedBatch.batchCode}</p>
                                    <p className="text-sm text-muted-foreground">{selectedBatch.productName}</p>
                                    {batchDetails?.supplier && (
                                      <p className="text-sm text-muted-foreground">
                                        Proveedor: <span className="font-medium">{batchDetails.supplier.name}</span>
                                      </p>
                                    )}
                                  </div>
                                  <p className="text-sm">
                                    Disponible: <span className="font-semibold">{selectedBatch.maxQuantity.toFixed(2)} {selectedBatch.unit}</span>
                                  </p>
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                  <Label htmlFor={`qty-${selectedBatch.batchId}`} className="text-sm">Cantidad utilizada:</Label>
                                  <Input
                                    id={`qty-${selectedBatch.batchId}`}
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max={selectedBatch.maxQuantity}
                                    value={selectedBatch.selectedQuantity || ''}
                                    onChange={(e) => handleQuantityChange(selectedBatch.batchId, e.target.value)}
                                    className="w-32"
                                  />
                                  <span className="text-sm text-muted-foreground">{selectedBatch.unit}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Mostrar lotes disponibles (en nuevo proceso) */}
                      {!editingBatch && availableBatches.map((batch) => {
                        const isSelected = selectedBatches.some(b => b.batchId === batch.id);
                        const selectedBatch = selectedBatches.find(b => b.batchId === batch.id);
                        const batchDetails = allBatches.find((b: any) => b.batch.id === batch.id);

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
                                    {batchDetails?.supplier && (
                                      <p className="text-sm text-muted-foreground">
                                        Proveedor: <span className="font-medium">{batchDetails.supplier.name}</span>
                                      </p>
                                    )}
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
            )}

            {/* Selección de lotes - para pelado, envasado y esterilizado */}
            {activeStage !== "asado" && (
              <div>
                <Label className="text-base font-semibold">
                  Lotes Disponibles en {stages.find(s => s.id === activeStage)?.inputStatus}
                </Label>
                <div className="mt-2 border rounded-lg">
                  {availableBatches.length === 0 ? (
                    <div className="p-8 text-center">
                      <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground mb-2">
                        No hay lotes en estado {stages.find(s => s.id === activeStage)?.inputStatus} con cantidad disponible
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activeStage === "pelado" && "Primero debes procesar lotes en la etapa de Asado"}
                        {activeStage === "envasado" && "Primero debes procesar lotes en la etapa de Pelado"}
                        {activeStage === "esterilizado" && "Primero debes procesar lotes en la etapa de Envasado"}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {availableBatches.map((batch) => {
                        const isSelected = selectedBatches.some(b => b.batchId === batch.id);
                        const selectedBatch = selectedBatches.find(b => b.batchId === batch.id);
                        const batchDetails = allBatches.find((b: any) => b.batch.id === batch.id);

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
                                    {batchDetails?.supplier && (
                                      <p className="text-sm text-muted-foreground">
                                        Proveedor: <span className="font-medium">{batchDetails.supplier.name}</span>
                                      </p>
                                    )}
                                  </div>
                                  <p className="text-sm">
                                    Disponible: <span className="font-semibold">{batch.availableQuantity} {batch.unit}</span>
                                  </p>
                                </div>
                                {isSelected && activeStage === "envasado" && (
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
                {selectedBatches.length > 0 && activeStage === "envasado" && (
                  <p className="mt-2 text-sm font-medium">
                    Total materia prima: {calculateTotalInput().toFixed(2)} {selectedBatches[0]?.unit}
                  </p>
                )}
              </div>
            )}

            {/* Campos de fecha y hora para todas las etapas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="processedDate">Fecha de Proceso *</Label>
                <Input
                  id="processedDate"
                  name="processedDate"
                  type="date"
                  required
                  key={`date-${editingBatch?.id || 'new'}-${activeStage}`}
                  defaultValue={editingBatch && editProcessedDate ? editProcessedDate : new Date().toISOString().split('T')[0]}
                  data-testid="input-processed-date"
                />
              </div>
              <div>
                <Label htmlFor="processedTime">Hora de Proceso *</Label>
                <Input
                  id="processedTime"
                  name="processedTime"
                  type="time"
                  required
                  key={`time-${editingBatch?.id || 'new'}-${activeStage}`}
                  defaultValue={editingBatch && editProcessedTime ? editProcessedTime : new Date().toTimeString().slice(0, 5)}
                  data-testid="input-processed-time"
                />
              </div>
            </div>

            {/* Información de salida - solo para etapas que no sean pelado */}
            {activeStage !== "pelado" && (
              <div className="space-y-4">
                <Label className="text-base font-semibold">Lote de Salida</Label>

                <div>
                  <Label htmlFor="output-code">Código de Lote Base</Label>
                  <Input
                    id="output-code"
                    value={outputBatchCode}
                    onChange={(e) => setOutputBatchCode(e.target.value)}
                    placeholder={activeStage === "envasado" ? "Ej: ENV-001 (se añadirá sufijo por tipo)" : "Ej: ASADO-001"}
                  />
                  {activeStage === "envasado" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Se creará un lote por cada tipo de envase con el formato: CODIGO-TIPO
                    </p>
                  )}
                </div>

                {activeStage === "envasado" ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-semibold">Tipos de Envase</Label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div>
                          <Label htmlFor="package-type">Tipo de Envase</Label>
                          <Select value={selectedPackageType} onValueChange={setSelectedPackageType}>
                            <SelectTrigger id="package-type">
                              <SelectValue placeholder="Seleccionar" />
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
                          <Label htmlFor="package-count">Cantidad</Label>
                          <Input
                            id="package-count"
                            type="number"
                            step="1"
                            min="0"
                            value={packageCount}
                            onChange={(e) => setPackageCount(e.target.value)}
                            placeholder="Nº envases"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button type="button" onClick={addPackageOutput} className="w-full">
                            Añadir
                          </Button>
                        </div>
                      </div>
                    </div>

                    {packageOutputs.length > 0 && (
                      <div className="border rounded-lg">
                        <div className="p-3 bg-muted/50 border-b">
                          <Label className="font-semibold">Salidas de Envases</Label>
                        </div>
                        <div className="divide-y">
                          {packageOutputs.map((output) => {
                            const pkgType = packageTypes.find((pt: any) => pt.id === output.packageTypeId);
                            return (
                              <div key={output.id} className="p-3 flex items-center justify-between gap-4">
                                <div className="flex-1">
                                  <p className="font-medium">{output.packageTypeName}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {pkgType?.capacity} {pkgType?.unit} por envase
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    step="1"
                                    min="0"
                                    value={output.quantity}
                                    onChange={(e) => updatePackageOutputQuantity(output.id, e.target.value)}
                                    className="w-24"
                                  />
                                  <span className="text-sm text-muted-foreground">envases</span>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removePackageOutput(output.id)}
                                  >
                                    Eliminar
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="p-3 bg-muted/30 border-t">
                          <p className="text-sm font-semibold">
                            Total: {calculateTotalPackageOutput()} envases en {packageOutputs.length} tipo(s)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : activeStage === "esterilizado" && selectedBatches.length > 0 ? (
                  <div className="space-y-4">
                    <div className="border rounded-lg">
                      <div className="p-3 bg-muted/50 border-b">
                        <Label className="font-semibold">Resumen por Tipo de Envase</Label>
                      </div>
                      <div className="divide-y">
                        {calculatePackageTypesSummary().map((summary, index) => (
                          <div key={index} className="p-3 flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{summary.typeName}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{summary.count} {summary.unit}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-3 bg-muted/30 border-t">
                        <p className="text-sm font-semibold">
                          Total a esterilizar: {getTotalEsterilizadoOutput()} envases
                        </p>
                      </div>
                    </div>
                  </div>
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
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button onClick={handleSubmitProcess}>
                {activeStage === "pelado" ? "Cambiar Estado a Pelado" : "Crear Proceso"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}