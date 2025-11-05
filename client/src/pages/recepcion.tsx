import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DataTable, Column } from "@/components/data-table";
import { StatusBadge, BatchStatus } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface Reception {
  id: string;
  batchCode: string;
  supplier: string;
  product: string;
  quantity: number;
  unit: string;
  temperature: number;
  truckPlate: string;
  deliveryNote: string;
  arrivedAt: string;
  status: BatchStatus;
  supplierId?: string;
  productId?: string;
  locationId?: string;
}

export default function Recepcion() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingReception, setViewingReception] = useState<Reception | null>(null);
  const [editingReception, setEditingReception] = useState<Reception | null>(null);
  const [deletingReception, setDeletingReception] = useState<Reception | null>(null);

  const { data: batchesData = [] } = useQuery<any[]>({
    queryKey: ['/api/batches'],
  });

  const { data: suppliersData = [] } = useQuery<any[]>({
    queryKey: ['/api/suppliers'],
  });

  const { data: productsData = [] } = useQuery<any[]>({
    queryKey: ['/api/products'],
  });

  const { data: locationsData = [] } = useQuery<any[]>({
    queryKey: ['/api/locations'],
  });

  const createReceptionMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editingReception ? `/api/batches/${editingReception.id}` : '/api/batches';
      const method = editingReception ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al guardar recepción');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/batches'] });
      setIsDialogOpen(false);
      setEditingReception(null);
      toast({
        title: editingReception ? "Recepción actualizada" : "Recepción creada",
        description: editingReception ? "El lote ha sido actualizado correctamente." : "El lote ha sido registrado correctamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la recepción",
        variant: "destructive",
      });
    },
  });

  const deleteReceptionMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/batches/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al eliminar recepción');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/batches'] });
      setDeletingReception(null);
      toast({
        title: "Recepción eliminada",
        description: "El lote ha sido eliminado correctamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la recepción",
        variant: "destructive",
      });
    },
  });

  const receptions: Reception[] = batchesData.map(item => ({
    id: item.batch.id,
    batchCode: item.batch.batchCode,
    supplier: item.supplier?.name || '-',
    product: item.product?.name || '-',
    quantity: parseFloat(item.batch.quantity),
    unit: item.batch.unit,
    temperature: parseFloat(item.batch.temperature || '0'),
    truckPlate: item.batch.truckPlate || '-',
    deliveryNote: item.batch.deliveryNote || '-',
    arrivedAt: new Date(item.batch.arrivedAt).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }),
    status: item.batch.status,
    supplierId: item.batch.supplierId,
    productId: item.batch.productId,
    locationId: item.batch.locationId
  }));

  const handleCreateReception = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data: any = {
      batchCode: editingReception ? editingReception.batchCode : `L-${Date.now().toString().slice(-8)}`,
      supplierId: formData.get('supplierId') || null,
      productId: formData.get('productId'),
      quantity: formData.get('quantity'),
      unit: formData.get('unit'),
      deliveryNote: formData.get('deliveryNote'),
      temperature: formData.get('temperature') || null,
      truckPlate: formData.get('truckPlate') || null,
      locationId: formData.get('locationId') || null,
      status: editingReception ? editingReception.status : 'RECEPCION',
    };

    createReceptionMutation.mutate(data);
  };

  const handleEdit = (reception: Reception) => {
    setEditingReception(reception);
    setIsDialogOpen(true);
  };

  const handleDelete = (reception: Reception) => {
    setDeletingReception(reception);
  };

  const confirmDelete = () => {
    if (deletingReception) {
      deleteReceptionMutation.mutate(deletingReception.id);
    }
  };

  const columns: Column<Reception>[] = [
    { 
      key: "batchCode", 
      label: "Código Lote",
      render: (value) => <span className="font-mono font-medium">{value}</span>
    },
    { key: "supplier", label: "Proveedor" },
    { key: "product", label: "Producto" },
    { 
      key: "quantity", 
      label: "Cantidad",
      render: (value, row) => `${value} ${row.unit}`
    },
    { 
      key: "temperature", 
      label: "Temp. (°C)",
      render: (value) => value.toFixed(1)
    },
    { key: "truckPlate", label: "Matrícula" },
    { key: "arrivedAt", label: "Fecha/Hora" },
    { 
      key: "status", 
      label: "Estado",
      render: (value) => <StatusBadge status={value} />
    },
  ];

  const filteredReceptions = receptions.filter(r => 
    r.batchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.product.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Recepción</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión de entradas de materia prima
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingReception(null);
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-reception" onClick={() => setEditingReception(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Recepción
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingReception ? "Editar Recepción" : "Nueva Recepción"}</DialogTitle>
              <DialogDescription>
                {editingReception ? "Modifica los datos de la recepción" : "Registra una nueva entrada de materia prima"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateReception} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Proveedor *</Label>
                  <Select name="supplierId" required defaultValue={editingReception?.supplierId || ""}>
                    <SelectTrigger id="supplier" data-testid="select-supplier">
                      <SelectValue placeholder="Seleccionar proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliersData.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryNote">Nº Albarán *</Label>
                  <Input
                    id="deliveryNote"
                    name="deliveryNote"
                    placeholder="ALB-2025-001"
                    required
                    defaultValue={editingReception?.deliveryNote !== '-' ? editingReception?.deliveryNote : ''}
                    data-testid="input-delivery-note"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Cantidad *</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    step="0.01"
                    placeholder="250.00"
                    required
                    defaultValue={editingReception?.quantity || ''}
                    data-testid="input-quantity"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unidad *</Label>
                  <Select name="unit" required defaultValue={editingReception?.unit || ""}>
                    <SelectTrigger id="unit" data-testid="select-unit">
                      <SelectValue placeholder="Seleccionar unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Kilogramos (kg)</SelectItem>
                      <SelectItem value="L">Litros (L)</SelectItem>
                      <SelectItem value="unidades">Unidades</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product">Producto *</Label>
                  <Select name="productId" required defaultValue={editingReception?.productId || ""}>
                    <SelectTrigger id="product" data-testid="select-product">
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {productsData.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperatura (°C)</Label>
                  <Input
                    id="temperature"
                    name="temperature"
                    type="number"
                    step="0.1"
                    placeholder="4.5"
                    defaultValue={editingReception?.temperature || ''}
                    data-testid="input-temperature"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="truckPlate">Matrícula Camión</Label>
                  <Input
                    id="truckPlate"
                    name="truckPlate"
                    placeholder="ABC-1234"
                    defaultValue={editingReception?.truckPlate !== '-' ? editingReception?.truckPlate : ''}
                    data-testid="input-truck-plate"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Ubicación Destino</Label>
                  <Select name="locationId" defaultValue={editingReception?.locationId || ""}>
                    <SelectTrigger id="location" data-testid="select-location">
                      <SelectValue placeholder="Seleccionar ubicación (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {locationsData.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingReception(null);
                  }}
                  disabled={createReceptionMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  data-testid="button-submit-reception"
                  disabled={createReceptionMutation.isPending}
                >
                  {createReceptionMutation.isPending ? "Guardando..." : (editingReception ? "Actualizar Recepción" : "Registrar Recepción")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, proveedor o producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
        <Button variant="outline" data-testid="button-filter">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
        <Button variant="outline" data-testid="button-export">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filteredReceptions}
        onView={(row) => setViewingReception(row)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Dialog para ver detalles */}
      <Dialog open={!!viewingReception} onOpenChange={(open) => !open && setViewingReception(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Recepción</DialogTitle>
          </DialogHeader>
          {viewingReception && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Código de Lote</Label>
                  <p className="font-medium font-mono">{viewingReception.batchCode}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Estado</Label>
                  <div className="mt-1">
                    <StatusBadge status={viewingReception.status} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Proveedor</Label>
                  <p className="font-medium">{viewingReception.supplier}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Producto</Label>
                  <p className="font-medium">{viewingReception.product}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Cantidad</Label>
                  <p className="font-medium">{viewingReception.quantity} {viewingReception.unit}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Nº Albarán</Label>
                  <p className="font-medium">{viewingReception.deliveryNote}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Temperatura</Label>
                  <p className="font-medium">{viewingReception.temperature.toFixed(1)}°C</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Matrícula Camión</Label>
                  <p className="font-medium">{viewingReception.truckPlate}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Fecha y Hora de Llegada</Label>
                <p className="font-medium">{viewingReception.arrivedAt}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AlertDialog para confirmar eliminación */}
      <AlertDialog open={!!deletingReception} onOpenChange={(open) => !open && setDeletingReception(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la recepción con código de lote{' '}
              <span className="font-mono font-semibold">{deletingReception?.batchCode}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
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
