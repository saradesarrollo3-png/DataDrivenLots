
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DataTable, Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Truck, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface Shipment {
  shipmentCode: string;
  customer: string;
  batch: string;
  product: string;
  quantity: number;
  unit: string;
  truckPlate: string;
  shippedAt: string;
}

export default function Expedicion() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: shipments = [] } = useQuery({
    queryKey: ['/api/shipments'],
  });

  const { data: batches = [] } = useQuery({
    queryKey: ['/api/batches'],
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['/api/customers'],
  });

  const createShipmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Error al crear expedición');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shipments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/batches'] });
      setIsDialogOpen(false);
      toast({
        title: "Expedición creada",
        description: "La expedición se ha registrado correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear la expedición",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const selectedBatch = batches.find((b: any) => b.batch.id === formData.get('batchId'));
    
    const data = {
      shipmentCode: formData.get('shipmentCode'),
      customerId: formData.get('customerId'),
      batchId: formData.get('batchId'),
      quantity: parseFloat(formData.get('quantity') as string),
      unit: selectedBatch?.batch.unit || 'kg',
      truckPlate: formData.get('truckPlate'),
      deliveryNote: formData.get('deliveryNote'),
    };

    createShipmentMutation.mutate(data);
  };

  const processedShipments: Shipment[] = shipments.map((item: any) => ({
    shipmentCode: item.shipment.shipmentCode,
    customer: item.customer?.name || 'N/A',
    batch: item.batch?.batchCode || 'N/A',
    product: item.product?.name || 'N/A',
    quantity: parseFloat(item.shipment.quantity),
    unit: item.shipment.unit,
    truckPlate: item.shipment.truckPlate || 'N/A',
    shippedAt: new Date(item.shipment.shippedAt).toLocaleDateString('es-ES'),
  }));

  const approvedBatches = batches.filter((b: any) => b.batch.status === 'APROBADO');

  const columns: Column<Shipment>[] = [
    { 
      key: "shipmentCode", 
      label: "Código Expedición",
      render: (value) => <span className="font-mono">{value}</span>
    },
    { key: "customer", label: "Cliente" },
    { 
      key: "batch", 
      label: "Lote",
      render: (value) => <span className="font-mono">{value}</span>
    },
    { key: "product", label: "Producto" },
    { 
      key: "quantity", 
      label: "Cantidad",
      render: (value, row) => `${value} ${row.unit}`
    },
    { key: "truckPlate", label: "Matrícula" },
    { key: "shippedAt", label: "Fecha Expedición" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Expedición</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión de expediciones a clientes
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-shipment">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Expedición
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Nueva Expedición</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shipmentCode">Código Expedición *</Label>
                  <Input
                    id="shipmentCode"
                    name="shipmentCode"
                    placeholder="EXP-20250104-0001"
                    required
                    data-testid="input-shipment-code"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerId">Cliente *</Label>
                  <Select name="customerId" required>
                    <SelectTrigger id="customerId" data-testid="select-customer">
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer: any) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batchId">Lote a Expedir *</Label>
                  <Select name="batchId" required>
                    <SelectTrigger id="batchId" data-testid="select-batch">
                      <SelectValue placeholder="Seleccionar lote" />
                    </SelectTrigger>
                    <SelectContent>
                      {approvedBatches.map((item: any) => (
                        <SelectItem key={item.batch.id} value={item.batch.id}>
                          {item.batch.batchCode} - {item.product?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Cantidad *</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    required
                    data-testid="input-quantity"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="truckPlate">Matrícula Camión *</Label>
                  <Input
                    id="truckPlate"
                    name="truckPlate"
                    placeholder="ABC-1234"
                    required
                    data-testid="input-truck-plate"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryNote">Nº Albarán *</Label>
                  <Input
                    id="deliveryNote"
                    name="deliveryNote"
                    placeholder="ALB-2025-001"
                    required
                    data-testid="input-delivery-note"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" data-testid="button-submit">
                  Registrar Expedición
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Expediciones Registradas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={processedShipments}
            onView={(row) => console.log("View shipment:", row)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
