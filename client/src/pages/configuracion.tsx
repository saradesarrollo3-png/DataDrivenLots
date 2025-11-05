
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

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

interface Customer {
  id: string;
  name: string;
  code: string;
  contact: string;
  phone: string;
  email: string;
}

interface PackageType {
  id: string;
  name: string;
  code: string;
  description: string;
  capacity: string;
  unit: string;
}

export default function Configuracion() {
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ['/api/suppliers'],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ['/api/locations'],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });

  const { data: packageTypes = [] } = useQuery<PackageType[]>({
    queryKey: ['/api/package-types'],
  });

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

  const customerColumns: Column<Customer>[] = [
    { key: "code", label: "Código", render: (value) => <span className="font-mono">{value}</span> },
    { key: "name", label: "Nombre" },
    { key: "contact", label: "Contacto" },
    { key: "phone", label: "Teléfono" },
    { key: "email", label: "Email" },
  ];

  const packageTypeColumns: Column<PackageType>[] = [
    { key: "code", label: "Código", render: (value) => <span className="font-mono">{value}</span> },
    { key: "name", label: "Nombre" },
    { key: "description", label: "Descripción" },
    { 
      key: "capacity", 
      label: "Capacidad",
      render: (value, row) => value ? `${value} ${row.unit || ''}` : '-'
    },
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
              <DataTable
                columns={customerColumns}
                data={customers}
                onView={(row) => console.log("View customer:", row)}
                onEdit={(row) => console.log("Edit customer:", row)}
                onDelete={(row) => console.log("Delete customer:", row)}
              />
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
              <DataTable
                columns={packageTypeColumns}
                data={packageTypes}
                onView={(row) => console.log("View package:", row)}
                onEdit={(row) => console.log("Edit package:", row)}
                onDelete={(row) => console.log("Delete package:", row)}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
