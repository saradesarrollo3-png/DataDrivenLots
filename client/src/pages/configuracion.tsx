import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Supplier {
  id: string;
  name: string;
  code: string;
  contact: string;
  phone: string;
  email: string;
}

interface Product {
  id: string;
  name: string;
  code: string;
  type: string;
  format: string;
  shelfLife: number;
}

interface Location {
  id: string;
  name: string;
  code: string;
  type: string;
}

export default function Configuracion() {
  const suppliers: Supplier[] = [
    { id: "1", name: "Agrícola del Sur", code: "AGR-001", contact: "Juan Pérez", phone: "612345678", email: "contacto@agricolasur.com" },
    { id: "2", name: "Hortalizas Premium", code: "HOR-002", contact: "María García", phone: "623456789", email: "info@hortalizaspremium.com" },
  ];

  const products: Product[] = [
    { id: "1", name: "Pimiento Asado", code: "PROD-001", type: "Pimiento", format: "Tarro 370g", shelfLife: 365 },
    { id: "2", name: "Pimiento Verde", code: "PROD-002", type: "Pimiento", format: "Tarro 370g", shelfLife: 365 },
    { id: "3", name: "Pimiento Rojo", code: "PROD-003", type: "Pimiento", format: "Tarro 370g", shelfLife: 365 },
  ];

  const locations: Location[] = [
    { id: "1", name: "Recepción Zona 1", code: "REC-01", type: "RECEPCION" },
    { id: "2", name: "Producción Principal", code: "PROD-01", type: "PRODUCCION" },
    { id: "3", name: "Calidad Lab", code: "CAL-01", type: "CALIDAD" },
    { id: "4", name: "Expedición Muelle A", code: "EXP-01", type: "EXPEDICION" },
  ];

  const supplierColumns: Column<Supplier>[] = [
    { key: "code", label: "Código", render: (value) => <span className="font-mono">{value}</span> },
    { key: "name", label: "Nombre" },
    { key: "contact", label: "Contacto" },
    { key: "phone", label: "Teléfono" },
    { key: "email", label: "Email" },
  ];

  const productColumns: Column<Product>[] = [
    { key: "code", label: "Código", render: (value) => <span className="font-mono">{value}</span> },
    { key: "name", label: "Nombre" },
    { key: "type", label: "Tipo" },
    { key: "format", label: "Formato" },
    { key: "shelfLife", label: "Vida Útil (días)" },
  ];

  const locationColumns: Column<Location>[] = [
    { key: "code", label: "Código", render: (value) => <span className="font-mono">{value}</span> },
    { key: "name", label: "Nombre" },
    { key: "type", label: "Tipo" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestión de datos maestros del sistema
        </p>
      </div>

      <Tabs defaultValue="suppliers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="suppliers" data-testid="tab-suppliers">Proveedores</TabsTrigger>
          <TabsTrigger value="products" data-testid="tab-products">Productos</TabsTrigger>
          <TabsTrigger value="locations" data-testid="tab-locations">Ubicaciones</TabsTrigger>
          <TabsTrigger value="customers" data-testid="tab-customers">Clientes</TabsTrigger>
          <TabsTrigger value="packages" data-testid="tab-packages">Tipos de Envase</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Proveedores</CardTitle>
                  <CardDescription>Gestión de proveedores de materia prima</CardDescription>
                </div>
                <Button data-testid="button-new-supplier">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Proveedor
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={supplierColumns}
                data={suppliers}
                onView={(row) => console.log("View supplier:", row)}
                onEdit={(row) => console.log("Edit supplier:", row)}
                onDelete={(row) => console.log("Delete supplier:", row)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Productos</CardTitle>
                  <CardDescription>Catálogo de productos</CardDescription>
                </div>
                <Button data-testid="button-new-product">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Producto
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={productColumns}
                data={products}
                onView={(row) => console.log("View product:", row)}
                onEdit={(row) => console.log("Edit product:", row)}
                onDelete={(row) => console.log("Delete product:", row)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Ubicaciones</CardTitle>
                  <CardDescription>Ubicaciones físicas de almacenamiento</CardDescription>
                </div>
                <Button data-testid="button-new-location">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Ubicación
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={locationColumns}
                data={locations}
                onView={(row) => console.log("View location:", row)}
                onEdit={(row) => console.log("Edit location:", row)}
                onDelete={(row) => console.log("Delete location:", row)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Clientes</CardTitle>
                  <CardDescription>Gestión de clientes</CardDescription>
                </div>
                <Button data-testid="button-new-customer">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Cliente
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-8">
                Módulo de clientes pendiente de implementación
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packages">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tipos de Envase</CardTitle>
                  <CardDescription>Catálogo de envases utilizados</CardDescription>
                </div>
                <Button data-testid="button-new-package">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Tipo de Envase
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-8">
                Módulo de tipos de envase pendiente de implementación
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
