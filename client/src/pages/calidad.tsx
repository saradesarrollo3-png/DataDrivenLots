
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DataTable, Column } from "@/components/data-table";
import { StatusBadge, BatchStatus } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle, XCircle, Plus, Trash2, Settings, ClipboardCheck } from "lucide-react";
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
  expiryDate: string;
  status: BatchStatus;
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

  // Combinar lotes aprobados y bloqueados con sus quality checks
  const reviewedBatches: QualityCheckRecord[] = qualityChecks
    .map((qc: any) => {
      // Buscar el lote correspondiente en aprobados o bloqueados
      const approvedBatch = approvedBatches.find(item => item.batch.id === qc.check.batchId);
      const blockedBatch = blockedBatches.find(item => item.batch.id === qc.check.batchId);
      const batchData = approvedBatch || blockedBatch;

      if (!batchData) return null;

      // Usar processedDate (fecha y hora de revisión ingresada manualmente)
      // Si no existe, usar checkedAt como fallback
      const reviewDate = qc.check.processedDate || qc.check.checkedAt;

      return {
        id: batchData.batch.id,
        batchId: batchData.batch.id,
        batchCode: batchData.batch.batchCode,
        product: batchData.product?.name || '-',
        quantity: parseFloat(batchData.batch.quantity),
        approved: qc.check.approved,
        notes: qc.check.notes || '',
        checkedAt: reviewDate,
        expiryDate: batchData.batch.expiryDate || '-',
        status: batchData.batch.status
      };
    })
    .filter((batch): batch is QualityCheckRecord => batch !== null)
    .sort((a, b) => {
      const dateA = new Date(a.checkedAt).getTime();
      const dateB = new Date(b.checkedAt).getTime();
      return dateB - dateA;
    });

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

  // Texto de ayuda personalizado para la tabla de pendientes
  const pendingEmptyMessage = qualityBatches.length === 0 
    ? "No hay lotes esterilizados pendientes de revisión. Los lotes aparecerán aquí después de completar la etapa de esterilizado en Producción."
    : "No hay lotes que coincidan con tu búsqueda";

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
      key: "expiryDate", 
      label: "Fecha Caducidad",
      render: (value) => value && value !== '-' ? new Date(value).toLocaleDateString('es-ES') : '-'
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
      render: (value) => {
        if (!value) return '-';
        const date = new Date(value);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
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

  // Mutación para eliminar lote
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
      await queryClient.invalidateQueries({ queryKey: ['/api/batches/status/ESTERILIZADO'], refetchType: 'active' });
      await queryClient.invalidateQueries({ queryKey: ['/api/batches/status/APROBADO'], refetchType: 'active' });
      await queryClient.invalidateQueries({ queryKey: ['/api/batches/status/BLOQUEADO'], refetchType: 'active' });
      await queryClient.invalidateQueries({ queryKey: ['/api/batches'], refetchType: 'active' });
      await queryClient.invalidateQueries({ queryKey: ['/api/quality-checks'], refetchType: 'active' });
      await queryClient.invalidateQueries({ queryKey: ['/api/product-stock'], refetchType: 'active' });
    },
  });

  const handleDeletePending = async (batch: QualityBatch) => {
    if (window.confirm(`¿Estás seguro de eliminar el lote ${batch.code}?`)) {
      await deleteBatchMutation.mutateAsync(batch.id);
    }
  };

  const handleDeleteReviewed = async (batch: QualityCheckRecord) => {
    if (window.confirm(`¿Estás seguro de eliminar el lote ${batch.batchCode}?`)) {
      await deleteBatchMutation.mutateAsync(batch.batchId);
    }
  };

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

      {/* Guía de ayuda para el usuario */}
      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-2">
              <ClipboardCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-medium text-blue-900 dark:text-blue-100">
                ¿Cómo realizar un control de calidad?
              </h3>
              <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                <li>En la pestaña <strong>"Pendientes de Revisión"</strong>, verás los lotes esterilizados que esperan control de calidad</li>
                <li>Haz clic en el <strong>icono del ojo (👁️)</strong> en la columna "Acciones" del lote que deseas revisar</li>
                <li>Se abrirá un formulario donde podrás completar el checklist de calidad, establecer fecha de caducidad y añadir observaciones</li>
                <li>Finalmente, <strong>aprueba el lote para venta</strong> si cumple los requisitos o <strong>recházalo</strong> si detectas problemas</li>
              </ol>
              {qualityBatches.length === 0 && (
                <p className="text-sm text-blue-700 dark:text-blue-300 italic mt-2">
                  ℹ️ No hay lotes esterilizados pendientes de revisión en este momento
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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
          <TabsTrigger value="pending" className="gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Pendientes de Revisión ({qualityBatches.length})
          </TabsTrigger>
          <TabsTrigger value="reviewed" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Revisados ({reviewedBatches.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {qualityBatches.length > 0 && filteredPendingBatches.length > 0 && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
              <p className="text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
                <span className="text-lg">👁️</span>
                <strong>Tip:</strong> Haz clic en el icono del ojo en la columna "Acciones" para revisar cada lote
              </p>
            </div>
          )}
          <DataTable
            columns={pendingColumns}
            data={filteredPendingBatches}
            onView={(row) => handleOpenDialog(row)}
            onDelete={handleDeletePending}
            emptyMessage={pendingEmptyMessage}
          />
        </TabsContent>

        <TabsContent value="reviewed" className="mt-6">
          <DataTable
            columns={reviewedColumns}
            data={filteredReviewedBatches}
            onDelete={handleDeleteReviewed}
            emptyMessage="No hay lotes revisados"
          />
        </TabsContent>
      </Tabs>

      <Dialog open={selectedBatch !== null} onOpenChange={(open) => !open && resetDialog()}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              Control de Calidad - Revisión de Lote
            </DialogTitle>
            <DialogDescription>
              <span className="font-medium">Lote: {selectedBatch?.code}</span> - {selectedBatch?.product}
              <br />
              <span className="text-xs mt-1 inline-block">
                Completa el checklist, verifica los datos y decide si el lote cumple los estándares de calidad
              </span>
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
    </div>
  );
}
