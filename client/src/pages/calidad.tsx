
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DataTable, Column } from "@/components/data-table";
import { StatusBadge, BatchStatus } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle, XCircle, Plus, Trash2, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface QualityBatch {
  id: string;
  code: string;
  product: string;
  quantity: number;
  manufactureDate: string;
  expiryDate: string;
  status: BatchStatus;
}

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

interface ChecklistTemplate {
  id: string;
  label: string;
  order: number;
  isActive: number;
}

export default function Calidad() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBatch, setSelectedBatch] = useState<QualityBatch | null>(null);
  const [notes, setNotes] = useState("");
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [newChecklistLabel, setNewChecklistLabel] = useState("");
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);

  // Obtener templates de checklist
  const { data: checklistTemplates = [] } = useQuery<ChecklistTemplate[]>({
    queryKey: ['/api/quality-checklist-templates'],
  });

  // Obtener lotes esterilizados
  const { data: sterilizedBatches = [] } = useQuery<any[]>({
    queryKey: ['/api/batches/status/ESTERILIZADO'],
  });

  const qualityBatches: QualityBatch[] = sterilizedBatches.map(item => ({
    id: item.batch.id,
    code: item.batch.batchCode,
    product: item.product?.name || '-',
    quantity: parseFloat(item.batch.quantity),
    manufactureDate: item.batch.manufactureDate ? new Date(item.batch.manufactureDate).toLocaleDateString('es-ES') : '-',
    expiryDate: item.batch.expiryDate ? new Date(item.batch.expiryDate).toLocaleDateString('es-ES') : '-',
    status: item.batch.status
  }));

  // Mutación para crear template
  const createTemplateMutation = useMutation({
    mutationFn: async (label: string) => {
      const response = await fetch('/api/quality-checklist-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`,
        },
        body: JSON.stringify({
          label,
          order: checklistTemplates.length,
          isActive: 1,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al crear el checklist');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quality-checklist-templates'] });
      setNewChecklistLabel("");
      toast({
        title: "Checklist creado",
        description: "El nuevo punto de control ha sido añadido.",
      });
    },
  });

  // Mutación para eliminar template
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/quality-checklist-templates/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el checklist');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quality-checklist-templates'] });
      toast({
        title: "Checklist eliminado",
        description: "El punto de control ha sido eliminado.",
      });
    },
  });

  // Mutación para crear quality check
  const createQualityCheckMutation = useMutation({
    mutationFn: async (data: { batchId: string; approved: number; notes: string; checklistData: string }) => {
      const response = await fetch('/api/quality-checks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Error al crear el control de calidad');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/batches/status/ESTERILIZADO'] });
      queryClient.invalidateQueries({ queryKey: ['/api/batches'] });
      queryClient.invalidateQueries({ queryKey: ['/api/quality-checks'] });
    },
  });

  const handleApprove = async () => {
    if (!selectedBatch) return;

    try {
      await createQualityCheckMutation.mutateAsync({
        batchId: selectedBatch.id,
        approved: 1,
        notes: notes,
        checklistData: JSON.stringify(checklist),
      });

      toast({
        title: "Lote Aprobado",
        description: `El lote ${selectedBatch.code} ha sido aprobado para venta.`,
      });

      resetDialog();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo aprobar el lote",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!selectedBatch) return;

    if (!notes.trim()) {
      toast({
        title: "Observaciones requeridas",
        description: "Debes agregar observaciones explicando el motivo del rechazo.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createQualityCheckMutation.mutateAsync({
        batchId: selectedBatch.id,
        approved: -1,
        notes: notes,
        checklistData: JSON.stringify(checklist),
      });

      toast({
        title: "Lote Bloqueado",
        description: `El lote ${selectedBatch.code} ha sido bloqueado.`,
        variant: "destructive",
      });

      resetDialog();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo rechazar el lote",
        variant: "destructive",
      });
    }
  };

  const resetDialog = () => {
    setSelectedBatch(null);
    setNotes("");
    setChecklist([]);
  };

  const handleChecklistChange = (id: string, checked: boolean) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, checked } : item
    ));
  };

  const handleOpenDialog = (batch: QualityBatch) => {
    setSelectedBatch(batch);
    setNotes("");
    // Cargar checklist desde templates
    const initialChecklist = checklistTemplates
      .filter(t => t.isActive === 1)
      .map(t => ({
        id: t.id,
        label: t.label,
        checked: false,
      }));
    setChecklist(initialChecklist);
  };

  const handleAddChecklist = async () => {
    if (!newChecklistLabel.trim()) {
      toast({
        title: "Error",
        description: "El texto del checklist no puede estar vacío",
        variant: "destructive",
      });
      return;
    }

    await createTemplateMutation.mutateAsync(newChecklistLabel);
  };

  const handleDeleteTemplate = async () => {
    if (deleteTemplateId) {
      await deleteTemplateMutation.mutateAsync(deleteTemplateId);
      setDeleteTemplateId(null);
    }
  };

  const columns: Column<QualityBatch>[] = [
    { 
      key: "code", 
      label: "Código Lote",
      render: (value) => <span className="font-mono font-medium">{value}</span>
    },
    { key: "product", label: "Producto" },
    { 
      key: "quantity", 
      label: "Cantidad",
      render: (value) => `${value} envases`
    },
    { key: "manufactureDate", label: "Fabricación" },
    { key: "expiryDate", label: "Caducidad" },
    { 
      key: "status", 
      label: "Estado",
      render: (value) => <StatusBadge status={value} />
    },
  ];

  const filteredBatches = qualityBatches.filter(b => 
    b.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.product.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Control de Calidad</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Revisión y liberación de lotes esterilizados para venta
          </p>
        </div>
        <Button onClick={() => setShowConfig(!showConfig)} variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Configurar Checklists
        </Button>
      </div>

      {showConfig && (
        <Card>
          <CardHeader>
            <CardTitle>Configuración de Checklists</CardTitle>
            <CardDescription>
              Gestiona los puntos de control para la revisión de calidad
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Nuevo punto de control..."
                value={newChecklistLabel}
                onChange={(e) => setNewChecklistLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddChecklist()}
              />
              <Button onClick={handleAddChecklist} disabled={createTemplateMutation.isPending}>
                <Plus className="h-4 w-4 mr-2" />
                Añadir
              </Button>
            </div>

            <div className="space-y-2">
              {checklistTemplates.map((template) => (
                <div key={template.id} className="flex items-center justify-between p-3 border rounded-md">
                  <span className="text-sm">{template.label}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteTemplateId(template.id)}
                    disabled={deleteTemplateMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              {checklistTemplates.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay puntos de control configurados
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
        onView={(row) => handleOpenDialog(row)}
        emptyMessage="No hay lotes esterilizados pendientes de revisión"
      />

      <Dialog open={selectedBatch !== null} onOpenChange={(open) => !open && resetDialog()}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Revisión de Calidad</DialogTitle>
            <DialogDescription>
              Lote: {selectedBatch?.code} - {selectedBatch?.product}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4 pb-2">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-md">
                <div>
                  <p className="text-sm text-muted-foreground">Cantidad</p>
                  <p className="font-medium">{selectedBatch?.quantity} envases</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha Fabricación</p>
                  <p className="font-medium">{selectedBatch?.manufactureDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha Caducidad</p>
                  <p className="font-medium">{selectedBatch?.expiryDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  {selectedBatch && <StatusBadge status={selectedBatch.status} />}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Checklist de Calidad</Label>
                {checklist.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">
                    No hay puntos de control configurados. Configure checklists antes de revisar lotes.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {checklist.map((item, index) => (
                      <div key={item.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`check-${item.id}`} 
                          checked={item.checked}
                          onCheckedChange={(checked) => handleChecklistChange(item.id, checked as boolean)}
                          data-testid={`checkbox-quality-${index}`} 
                        />
                        <label
                          htmlFor={`check-${item.id}`}
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {item.label}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observaciones</Label>
                <Textarea
                  id="notes"
                  placeholder="Notas adicionales sobre la revisión..."
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  data-testid="textarea-notes"
                />
              </div>
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4 border-t mt-2">
            <Button
              variant="outline"
              onClick={handleReject}
              disabled={createQualityCheckMutation.isPending}
              data-testid="button-reject"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rechazar
            </Button>
            <Button
              onClick={handleApprove}
              disabled={createQualityCheckMutation.isPending}
              data-testid="button-approve"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Aprobar para Venta
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTemplateId !== null} onOpenChange={(open) => !open && setDeleteTemplateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar punto de control?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El punto de control será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTemplate}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
