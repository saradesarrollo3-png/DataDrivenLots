
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
import { Truck, Plus, Package, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

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

interface ApprovedBatch {
  id: string;
  batchCode: string;
  productId: string;
  productName: string;
  availableQuantity: number;
  unit: string;
  expiryDate: string;
  manufactureDate: string;
  daysToExpiry: number;
}

interface ShipmentLine {
  id: string;
  batchId: string;
  batchCode: string;
  productName: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  maxQuantity: number;
}

export default function Expedicion() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [shipmentCode, setShipmentCode] = useState("");
  const [truckPlate, setTruckPlate] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [shipmentLines, setShipmentLines] = useState<ShipmentLine[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  
  // Generar código de albarán de expedición
  const generateShipmentCode = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `EXP-${year}${month}${day}-${random}`;
  };

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
    mutationFn: async ({ lines, processedDate }: { lines: ShipmentLine[], processedDate: string }) => {
      // Crear un shipment por cada línea con código único
      const promises = lines.map((line, index) => {
        // Generar código único: código base + sufijo si hay múltiples líneas
        const uniqueCode = lines.length > 1 
          ? `${shipmentCode}-${(index + 1).toString().padStart(3, '0')}`
          : shipmentCode;
        
        return fetch('/api/shipments', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('sessionId')}`,
          },
          body: JSON.stringify({
            shipmentCode: uniqueCode,
            customerId: selectedCustomer,
            batchId: line.batchId,
            quantity: line.quantity.toString(),
            unit: line.unit,
            truckPlate: truckPlate,
            deliveryNote: deliveryNote,
            processedDate: processedDate,
          }),
        }).then(async res => {
          if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Error al crear expedición');
          }
          return res.json();
        });
      });
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shipments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/batches'] });
      queryClient.invalidateQueries({ queryKey: ['/api/product-stock'] });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear expedición",
        description: error.message || "No se pudo crear la expedición. Verifica que el código del albarán no esté duplicado.",
        variant: "destructive",
      });
    },
  });

  // Obtener lotes aprobados con ordenación FEFO
  const approvedBatches: ApprovedBatch[] = batches
    .filter((b: any) => b.batch.status === 'APROBADO' && parseFloat(b.batch.quantity) > 0)
    .map((item: any) => {
      const expiryDate = item.batch.expiryDate ? new Date(item.batch.expiryDate) : null;
      const today = new Date();
      const daysToExpiry = expiryDate 
        ? Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        : 999999;

      return {
        id: item.batch.id,
        batchCode: item.batch.batchCode,
        productId: item.batch.productId,
        productName: item.product?.name || '-',
        availableQuantity: parseFloat(item.batch.quantity),
        unit: item.batch.unit,
        expiryDate: expiryDate ? expiryDate.toLocaleDateString('es-ES') : '-',
        manufactureDate: item.batch.manufactureDate 
          ? new Date(item.batch.manufactureDate).toLocaleDateString('es-ES') 
          : '-',
        daysToExpiry,
      };
    })
    .sort((a, b) => a.daysToExpiry - b.daysToExpiry); // FEFO: ordenar por caducidad más próxima primero

  // Obtener productos únicos del stock aprobado
  const availableProducts = Array.from(
    new Map(
      approvedBatches.map(b => [b.productId, { id: b.productId, name: b.productName }])
    ).values()
  );

  // Filtrar lotes por producto seleccionado
  const filteredBatches = selectedProduct && selectedProduct !== "ALL_PRODUCTS"
    ? approvedBatches.filter(b => b.productId === selectedProduct)
    : approvedBatches;

  const handleSubmit = () => {
    if (!selectedCustomer || !shipmentCode || shipmentLines.length === 0) {
      toast({
        title: "Error",
        description: "Debes completar el código de albarán, cliente y añadir al menos un producto",
        variant: "destructive",
      });
      return;
    }

    // Validar que todas las líneas tengan cantidad mayor a 0
    const invalidLines = shipmentLines.filter(line => line.quantity <= 0);
    if (invalidLines.length > 0) {
      toast({
        title: "Error",
        description: "Todas las líneas deben tener una cantidad mayor a 0",
        variant: "destructive",
      });
      return;
    }

    const processedDateInput = (document.getElementById('processedDate') as HTMLInputElement)?.value;
    const processedTimeInput = (document.getElementById('processedTime') as HTMLInputElement)?.value;
    const processedDate = processedDateInput && processedTimeInput 
      ? new Date(`${processedDateInput}T${processedTimeInput}:00`).toISOString()
      : new Date().toISOString();

    createShipmentMutation.mutate({ lines: shipmentLines, processedDate });
  };

  const handleAddLine = (batch: ApprovedBatch) => {
    // Verificar si ya existe una línea con este lote
    const existingLine = shipmentLines.find(line => line.batchId === batch.id);
    if (existingLine) {
      toast({
        title: "Advertencia",
        description: "Este lote ya está añadido al albarán",
        variant: "destructive",
      });
      return;
    }

    const newLine: ShipmentLine = {
      id: `line-${Date.now()}`,
      batchId: batch.id,
      batchCode: batch.batchCode,
      productName: batch.productName,
      quantity: 0,
      unit: batch.unit,
      expiryDate: batch.expiryDate,
      maxQuantity: batch.availableQuantity,
    };

    setShipmentLines([...shipmentLines, newLine]);
  };

  const handleRemoveLine = (lineId: string) => {
    setShipmentLines(shipmentLines.filter(line => line.id !== lineId));
  };

  const handleUpdateLineQuantity = (lineId: string, quantity: number) => {
    setShipmentLines(shipmentLines.map(line => 
      line.id === lineId 
        ? { ...line, quantity: Math.min(quantity, line.maxQuantity) }
        : line
    ));
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedCustomer("");
    setShipmentCode("");
    setTruckPlate("");
    setDeliveryNote("");
    setShipmentLines([]);
    setSelectedProduct("");
  };
  
  const handleOpenDialog = () => {
    setShipmentCode(generateShipmentCode());
    setIsDialogOpen(true);
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

  const shipmentsColumns: Column<Shipment>[] = [
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

  const stockColumns: Column<ApprovedBatch>[] = [
    { 
      key: "batchCode", 
      label: "Código Lote",
      render: (value) => <span className="font-mono font-medium">{value}</span>
    },
    { key: "productName", label: "Producto" },
    { 
      key: "availableQuantity", 
      label: "Cantidad Disponible",
      render: (value, row) => (
        <span className="font-semibold">{value.toFixed(2)} {row.unit}</span>
      )
    },
    { key: "manufactureDate", label: "Fabricación" },
    { 
      key: "expiryDate", 
      label: "Caducidad",
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <span>{value}</span>
          {row.daysToExpiry < 30 && row.daysToExpiry >= 0 && (
            <Badge variant="destructive" className="text-xs">
              {row.daysToExpiry} días
            </Badge>
          )}
          {row.daysToExpiry < 0 && (
            <Badge variant="destructive" className="text-xs">
              Caducado
            </Badge>
          )}
        </div>
      )
    },
  ];

  const filteredStockBatches = approvedBatches.filter(b => 
    b.batchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalLines = shipmentLines.reduce((sum, line) => sum + line.quantity, 0);

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
      await queryClient.invalidateQueries({ queryKey: ['/api/batches/status/APROBADO'], refetchType: 'active' });
      await queryClient.invalidateQueries({ queryKey: ['/api/batches'], refetchType: 'active' });
      await queryClient.invalidateQueries({ queryKey: ['/api/product-stock'], refetchType: 'active' });
    },
  });

  const handleDeleteStock = async (batch: ApprovedBatch) => {
    if (window.confirm(`¿Estás seguro de eliminar el lote ${batch.batchCode}?`)) {
      await deleteBatchMutation.mutateAsync(batch.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Expedición</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión de expediciones a clientes con criterio FEFO
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (open) {
            handleOpenDialog();
          } else {
            handleCloseDialog();
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-shipment">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Albarán
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Albarán de Expedición</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Datos del albarán */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shipmentCode">Código Albarán *</Label>
                  <Input
                    id="shipmentCode"
                    placeholder="EXP-20250104-0001"
                    value={shipmentCode}
                    onChange={(e) => setShipmentCode(e.target.value)}
                    data-testid="input-shipment-code"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerId">Cliente *</Label>
                  <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
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
                  <Label htmlFor="truckPlate">Matrícula Camión</Label>
                  <Input
                    id="truckPlate"
                    placeholder="ABC-1234 (opcional)"
                    value={truckPlate}
                    onChange={(e) => setTruckPlate(e.target.value)}
                    data-testid="input-truck-plate"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryNote">Nº Albarán</Label>
                  <Input
                    id="deliveryNote"
                    placeholder="ALB-2025-001 (opcional)"
                    value={deliveryNote}
                    onChange={(e) => setDeliveryNote(e.target.value)}
                    data-testid="input-delivery-note"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="processedDate">Fecha de Expedición *</Label>
                  <Input
                    id="processedDate"
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    data-testid="input-processed-date"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="processedTime">Hora de Expedición *</Label>
                  <Input
                    id="processedTime"
                    type="time"
                    defaultValue={new Date().toTimeString().slice(0, 5)}
                    data-testid="input-processed-time"
                    required
                  />
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Los lotes se muestran ordenados por caducidad (FEFO). Prioriza los que caducan antes.
                </AlertDescription>
              </Alert>

              {/* Selector de producto */}
              <div className="space-y-2">
                <Label htmlFor="productFilter">Filtrar por Producto</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger id="productFilter">
                    <SelectValue placeholder="Todos los productos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL_PRODUCTS">Todos los productos</SelectItem>
                    {availableProducts.map((product: any) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Lotes disponibles */}
              <div className="space-y-2">
                <Label>Lotes Disponibles (Stock Aprobado - Orden FEFO)</Label>
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  {filteredBatches.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground text-center">
                      No hay stock aprobado disponible
                    </p>
                  ) : (
                    <div className="divide-y">
                      {filteredBatches.map((batch) => (
                        <div key={batch.id} className="p-3 flex items-center justify-between hover:bg-muted/50">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-medium">{batch.batchCode}</span>
                              <span className="text-sm text-muted-foreground">
                                {batch.productName}
                              </span>
                              {batch.daysToExpiry < 30 && batch.daysToExpiry >= 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  Caduca en {batch.daysToExpiry} días
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Disponible: <span className="font-semibold">{batch.availableQuantity.toFixed(2)} {batch.unit}</span>
                              {' • '}
                              Caducidad: {batch.expiryDate}
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleAddLine(batch)}
                            disabled={shipmentLines.some(line => line.batchId === batch.id)}
                          >
                            Añadir
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Líneas del albarán */}
              <div className="space-y-2">
                <Label>Líneas del Albarán ({shipmentLines.length})</Label>
                {shipmentLines.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground text-center border rounded-lg">
                    No hay productos añadidos. Selecciona lotes del listado superior.
                  </p>
                ) : (
                  <div className="border rounded-lg divide-y">
                    {shipmentLines.map((line) => (
                      <div key={line.id} className="p-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-mono font-medium">{line.batchCode}</div>
                            <div className="text-sm text-muted-foreground">
                              {line.productName} • Caduca: {line.expiryDate}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveLine(line.id)}
                          >
                            Eliminar
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">Cantidad:</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max={line.maxQuantity}
                            value={line.quantity || ''}
                            onChange={(e) => handleUpdateLineQuantity(line.id, parseFloat(e.target.value) || 0)}
                            className="w-32"
                          />
                          <span className="text-sm text-muted-foreground">
                            / {line.maxQuantity.toFixed(2)} {line.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div className="p-3 bg-muted/30">
                      <p className="text-sm font-semibold">
                        Total líneas: {shipmentLines.length} • Total cantidad: {totalLines.toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                >
                  Cancelar
                </Button>
                <Button 
                  type="button"
                  onClick={handleSubmit} 
                  data-testid="button-submit"
                  disabled={createShipmentMutation.isPending || shipmentLines.length === 0}
                >
                  {createShipmentMutation.isPending ? "Registrando..." : "Confirmar Expedición"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="shipments" className="w-full">
        <TabsList>
          <TabsTrigger value="shipments">
            <Truck className="h-4 w-4 mr-2" />
            Expediciones
          </TabsTrigger>
          <TabsTrigger value="stock">
            <Package className="h-4 w-4 mr-2" />
            Stock Aprobado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shipments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Expediciones Registradas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={shipmentsColumns}
                data={processedShipments}
                onView={(row) => console.log("View shipment:", row)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock" className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar por lote o producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Package className="h-4 w-4" />
                Stock Aprobado para Expedición (Orden FEFO)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={stockColumns}
                data={filteredStockBatches}
                onDelete={handleDeleteStock}
                emptyMessage="No hay stock aprobado disponible"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
