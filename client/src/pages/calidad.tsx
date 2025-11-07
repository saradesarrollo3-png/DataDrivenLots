
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface QualityCheckRecord {
  id: string;
  batchId: string;
  batchCode: string;
  product: string;
  quantity: number;
  approved: number;
  notes: string;
  checkedAt: string;
  status: BatchStatus;
  checkId?: string;
  expiryDate?: string;
}

export default function Calidad() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBatch, setSelectedBatch] = useState<QualityBatch | null>(null);
  const [notes, setNotes] = useState("");
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [expiryDate, setExpiryDate] = useState("");
  const [showConfig, setShowConfig] = useState(false);
  const [newChecklistLabel, setNewChecklistLabel] = useState("");
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const [editingCheck, setEditingCheck] = useState<QualityCheckRecord | null>(null);
  const [deletingCheck, setDeletingCheck] = useState<QualityCheckRecord | null>(null);

  // Obtener templates de checklist
  const { data: checklistTemplates = [] } = useQuery<ChecklistTemplate[]>({
    queryKey: ['/api/quality-checklist-templates'],
  });

  // Obtener lotes esterilizados
  const { data: sterilizedBatches = [] } = useQuery<any[]>({
    queryKey: ['/api/batches/status/ESTERILIZADO'],
  });

  // Obtener lotes aprobados
  const { data: approvedBatches = [] } = useQuery<any[]>({
    queryKey: ['/api/batches/status/APROBADO'],
  });

  // Obtener lotes bloqueados
  const { data: blockedBatches = [] } = useQuery<any[]>({
    queryKey: ['/api/batches/status/BLOQUEADO'],
  });

  // Obtener registros de calidad
  const { data: qualityChecks = [] } = useQuery<any[]>({
    queryKey: ['/api/quality-checks'],
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

  // Combinar lotes aprobados y bloqueados
  const reviewedBatches: QualityCheckRecord[] = [
    ...approvedBatches.map(item => ({
      id: item.batch.id,
      batchId: item.batch.id,
      batchCode: item.batch.batchCode,
      product: item.product?.name || '-',
      quantity: parseFloat(item.batch.quantity),
      approved: 1,
      notes: '',
      checkedAt: item.batch.updatedAt || item.batch.createdAt,
      status: item.batch.status,
      expiryDate: item.batch.expiryDate ? new Date(item.batch.expiryDate).toISOString().split('T')[0] : undefined,
    })),
    ...blockedBatches.map(item => ({
      id: item.batch.id,
      batchId: item.batch.id,
      batchCode: item.batch.batchCode,
      product: item.product?.name || '-',
      quantity: parseFloat(item.batch.quantity),
      approved: -1,
      notes: '',
      checkedAt: item.batch.updatedAt || item.batch.createdAt,
      status: item.batch.status,
      expiryDate: item.batch.expiryDate ? new Date(item.batch.expiryDate).toISOString().split('T')[0] : undefined,
    }))
  ].map(batch => {
    // Buscar el quality check correspondiente
    const check = qualityChecks.find((qc: any) => qc.check.batchId === batch.batchId);
    if (check) {
      return {
        ...batch,
        notes: check.check.notes || '',
        checkedAt: check.check.checkedAt,
        approved: check.check.approved,
        checkId: check.check.id,
      };
    }
    return batch;
  }).sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime());

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

  // Mutación para eliminar quality check
  const deleteQualityCheckMutation = useMutation({
    mutationFn: async (checkId: string) => {
      const response = await fetch(`/api/quality-checks/${checkId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al eliminar la revisión de calidad');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quality-checks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/batches/status/APROBADO'] });
      queryClient.invalidateQueries({ queryKey: ['/api/batches/status/BLOQUEADO'] });
      queryClient.invalidateQueries({ queryKey: ['/api/batches/status/ESTERILIZADO'] });
      toast({
        title: "Revisión eliminada",
        description: "La revisión de calidad ha sido eliminada.",
      });
      setDeletingCheck(null);
    },
  });

  // Mutación para crear quality check
  const createQualityCheckMutation = useMutation({
    mutationFn: async (data: { batchId: string; approved: number; notes: string; checklistData: string; expiryDate?: string; processedDate?: string }) => {
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
      queryClient.invalidateQueries({ queryKey: ['/api/batches/status/APROBADO'] });
      queryClient.invalidateQueries({ queryKey: ['/api/batches/status/BLOQUEADO'] });
      queryClient.invalidateQueries({ queryKey: ['/api/batches'] });
      queryClient.invalidateQueries({ queryKey: ['/api/quality-checks'] });
    },
  });

  const handleApprove = async () => {
    if (!selectedBatch) return;

    if (!expiryDate) {
      toast({
        title: "Fecha de caducidad requerida",
        description: "Debes indicar la fecha de caducidad del lote para aprobarlo.",
        variant: "destructive",
      });
      return;
    }

    const processedDateInput = (document.getElementById('processedDate') as HTMLInputElement)?.value;
    const processedTimeInput = (document.getElementById('processedTime') as HTMLInputElement)?.value;
    const processedDate = processedDateInput && processedTimeInput 
      ? new Date(`${processedDateInput}T${processedTimeInput}:00`).toISOString()
      : new Date().toISOString();

    try {
      await createQualityCheckMutation.mutateAsync({
        batchId: selectedBatch.id,
        approved: 1,
        notes: notes,
        checklistData: JSON.stringify(checklist),
        expiryDate: expiryDate,
        processedDate: processedDate,
      });

      toast({
        title: "Lote Aprobado",
        description: `El lote ${selectedBatch.code} ha sido aprobado para venta con caducidad ${new Date(expiryDate).toLocaleDateString('es-ES')}.`,
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

    const processedDateInput = (document.getElementById('processedDate') as HTMLInputElement)?.value;
    const processedTimeInput = (document.getElementById('processedTime') as HTMLInputElement)?.value;
    const processedDate = processedDateInput && processedTimeInput 
      ? new Date(`${processedDateInput}T${processedTimeInput}:00`).toISOString()
      : new Date().toISOString();

    try {
      await createQualityCheckMutation.mutateAsync({
        batchId: selectedBatch.id,
        approved: -1,
        notes: notes,
        checklistData: JSON.stringify(checklist),
        processedDate: processedDate,
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
    setExpiryDate("");
    setEditingCheck(null);
  };

  const handleChecklistChange = (id: string, checked: boolean) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, checked } : item
    ));
  };

  const handleOpenDialog = (batch: QualityBatch) => {
    setSelectedBatch(batch);
    setNotes("");
    setExpiryDate(batch.expiryDate && batch.expiryDate !== '-' ? new Date(batch.expiryDate).toISOString().split('T')[0] : "");
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

  const handleEditCheck = (check: QualityCheckRecord) => {
    // Crear un objeto QualityBatch a partir del check
    const batchToEdit: QualityBatch = {
      id: check.batchId,
      code: check.batchCode,
      product: check.product,
      quantity: check.quantity,
      manufactureDate: '-',
      expiryDate: check.expiryDate ? new Date(check.expiryDate).toLocaleDateString('es-ES') : '-',
      status: check.status,
    };
    
    setEditingCheck(check);
    setSelectedBatch(batchToEdit);
    setNotes(check.notes);
    setExpiryDate(check.expiryDate || '');
    
    // Cargar checklist desde el check existente
    if (check.checkId) {
      const checkData = qualityChecks.find((qc: any) => qc.check.id === check.checkId);
      if (checkData?.check.checklistData) {
        try {
          const parsedChecklist = JSON.parse(checkData.check.checklistData);
          setChecklist(parsedChecklist);
        } catch (e) {
          console.error('Error parsing checklist data:', e);
        }
      }
    }
  };

  const handleDeleteCheck = (check: QualityCheckRecord) => {
    setDeletingCheck(check);
  };

  const confirmDeleteCheck = async () => {
    if (deletingCheck?.checkId) {
      await deleteQualityCheckMutation.mutateAsync(deletingCheck.checkId);
    }
  };

  const pendingColumns: Column<QualityBatch>[] = [
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

  const reviewedColumns: Column<QualityCheckRecord>[] = [
    { 
      key: "batchCode", 
      label: "Código Lote",
      render: (value) => <span className="font-mono font-medium">{value}</span>
    },
    { key: "product", label: "Producto" },
    { 
      key: "quantity", 
      label: "Cantidad",
      render: (value) => `${value} envases`
    },
    { 
      key: "approved", 
      label: "Resultado",
      render: (value) => (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          value === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {value === 1 ? (
            <>
              <CheckCircle className="h-3 w-3" />
              Aprobado
            </>
          ) : (
            <>
              <XCircle className="h-3 w-3" />
              Rechazado
            </>
          )}
        </span>
      )
    },
    { 
      key: "checkedAt", 
      label: "Fecha Revisión",
      render: (value) => new Date(value).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    { 
      key: "status", 
      label: "Estado",
      render: (value) => <StatusBadge status={value} />
    },
  ];

  const filteredPendingBatches = qualityBatches.filter(b => 
    b.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.product.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReviewedBatches = reviewedBatches.filter(b => 
    b.batchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="pending">
            Pendientes de Revisión ({qualityBatches.length})
          </TabsTrigger>
          <TabsTrigger value="reviewed">
            Revisados ({reviewedBatches.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <DataTable
            columns={pendingColumns}
            data={filteredPendingBatches}
            onView={(row) => handleOpenDialog(row)}
            emptyMessage="No hay lotes esterilizados pendientes de revisión"
          />
        </TabsContent>

        <TabsContent value="reviewed" className="mt-6">
          <DataTable
            columns={reviewedColumns}
            data={filteredReviewedBatches}
            onEdit={handleEditCheck}
            onDelete={handleDeleteCheck}
            emptyMessage="No hay lotes revisados"
          />
        </TabsContent>
      </Tabs>

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
                <Label htmlFor="expiryDate">Fecha de Caducidad *</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  data-testid="input-expiry-date"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="processedDate">Fecha de Revisión *</Label>
                  <Input
                    id="processedDate"
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    data-testid="input-processed-date"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="processedTime">Hora de Revisión *</Label>
                  <Input
                    id="processedTime"
                    type="time"
                    defaultValue={new Date().toTimeString().slice(0, 5)}
                    data-testid="input-processed-time"
                    required
                  />
                </div>
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

      <AlertDialog open={deletingCheck !== null} onOpenChange={(open) => !open && setDeletingCheck(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar revisión de calidad?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la revisión del lote{' '}
              <span className="font-mono font-semibold">{deletingCheck?.batchCode}</span> y el lote volverá al estado ESTERILIZADO.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCheck}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
