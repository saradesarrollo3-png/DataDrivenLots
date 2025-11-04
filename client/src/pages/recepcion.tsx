import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

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
}

export default function Recepcion() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const receptions: Reception[] = [
    { 
      id: "1", 
      batchCode: "MP-20250104-0001", 
      supplier: "Agrícola del Sur", 
      product: "Pimiento Asado",
      quantity: 250, 
      unit: "kg",
      temperature: 4.5,
      truckPlate: "ABC-1234",
      deliveryNote: "ALB-2025-001",
      arrivedAt: "2025-01-04 08:30",
      status: "RECEPCION"
    },
    { 
      id: "2", 
      batchCode: "MP-20250104-0002", 
      supplier: "Hortalizas Premium", 
      product: "Pimiento Rojo",
      quantity: 180, 
      unit: "kg",
      temperature: 5.2,
      truckPlate: "XYZ-5678",
      deliveryNote: "ALB-2025-002",
      arrivedAt: "2025-01-04 10:15",
      status: "RECEPCION"
    },
    { 
      id: "3", 
      batchCode: "MP-20250103-0015", 
      supplier: "Agrícola del Sur", 
      product: "Pimiento Verde",
      quantity: 320, 
      unit: "kg",
      temperature: 4.8,
      truckPlate: "DEF-9012",
      deliveryNote: "ALB-2025-003",
      arrivedAt: "2025-01-03 14:20",
      status: "EN_PROCESO"
    },
  ];

  const handleCreateReception = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Recepción creada",
      description: "El lote ha sido registrado correctamente.",
    });
    setIsDialogOpen(false);
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-reception">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Recepción
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nueva Recepción</DialogTitle>
              <DialogDescription>
                Registra una nueva entrada de materia prima
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateReception} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Proveedor *</Label>
                  <Select required>
                    <SelectTrigger id="supplier" data-testid="select-supplier">
                      <SelectValue placeholder="Seleccionar proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agr-sur">Agrícola del Sur</SelectItem>
                      <SelectItem value="hort-prem">Hortalizas Premium</SelectItem>
                      <SelectItem value="verd-nat">Verduras Naturales</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product">Producto *</Label>
                  <Select required>
                    <SelectTrigger id="product" data-testid="select-product">
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pim-asado">Pimiento Asado</SelectItem>
                      <SelectItem value="pim-rojo">Pimiento Rojo</SelectItem>
                      <SelectItem value="pim-verde">Pimiento Verde</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Cantidad (kg) *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    placeholder="250.00"
                    required
                    data-testid="input-quantity"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperatura (°C) *</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    placeholder="4.5"
                    required
                    data-testid="input-temperature"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="truckPlate">Matrícula Camión *</Label>
                  <Input
                    id="truckPlate"
                    placeholder="ABC-1234"
                    required
                    data-testid="input-truck-plate"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryNote">Nº Albarán Proveedor *</Label>
                  <Input
                    id="deliveryNote"
                    placeholder="ALB-2025-001"
                    required
                    data-testid="input-delivery-note"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Ubicación Destino *</Label>
                <Select required>
                  <SelectTrigger id="location" data-testid="select-location">
                    <SelectValue placeholder="Seleccionar ubicación" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rec-1">Recepción - Zona 1</SelectItem>
                    <SelectItem value="rec-2">Recepción - Zona 2</SelectItem>
                    <SelectItem value="prod-1">Producción - Entrada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" data-testid="button-submit-reception">
                  Registrar Recepción
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
        onView={(row) => console.log("View reception:", row)}
        onEdit={(row) => console.log("Edit reception:", row)}
      />
    </div>
  );
}
