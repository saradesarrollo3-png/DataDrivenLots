
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [packageDialogOpen, setPackageDialogOpen] = useState(false);

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

  const createSupplierMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Error al crear proveedor');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      toast({ title: "Proveedor creado", description: "El proveedor se ha creado correctamente." });
      setSupplierDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo crear el proveedor.", variant: "destructive" });
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Error al crear producto');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({ title: "Producto creado", description: "El producto se ha creado correctamente." });
      setProductDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo crear el producto.", variant: "destructive" });
    },
  });

  const createLocationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Error al crear ubicación');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
      toast({ title: "Ubicación creada", description: "La ubicación se ha creado correctamente." });
      setLocationDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo crear la ubicación.", variant: "destructive" });
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Error al crear cliente');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      toast({ title: "Cliente creado", description: "El cliente se ha creado correctamente." });
      setCustomerDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo crear el cliente.", variant: "destructive" });
    },
  });

  const createPackageTypeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/package-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Error al crear tipo de envase');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/package-types'] });
      toast({ title: "Tipo de envase creado", description: "El tipo de envase se ha creado correctamente." });
      setPackageDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo crear el tipo de envase.", variant: "destructive" });
    },
  });

  const handleSupplierSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createSupplierMutation.mutate({
      name: formData.get('name'),
      code: formData.get('code'),
      contact: formData.get('contact') || null,
      phone: formData.get('phone') || null,
      email: formData.get('email') || null,
    });
  };

  const handleProductSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const shelfLifeValue = formData.get('shelfLife') as string;
    createProductMutation.mutate({
      name: formData.get('name'),
      code: formData.get('code'),
      type: formData.get('type'),
      format: formData.get('format') || null,
      shelfLife: shelfLifeValue ? parseInt(shelfLifeValue) : null,
      description: formData.get('description') || null,
    });
  };

  const handleLocationSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createLocationMutation.mutate({
      name: formData.get('name'),
      code: formData.get('code'),
      type: formData.get('type'),
    });
  };

  const handleCustomerSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createCustomerMutation.mutate({
      name: formData.get('name'),
      code: formData.get('code'),
      contact: formData.get('contact') || null,
      phone: formData.get('phone') || null,
      email: formData.get('email') || null,
      address: formData.get('address') || null,
    });
  };

  const handlePackageTypeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createPackageTypeMutation.mutate({
      name: formData.get('name'),
      code: formData.get('code'),
      capacity: formData.get('capacity') || null,
      unit: formData.get('unit') || null,
      description: formData.get('description') || null,
    });
  };

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
                <Dialog open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-new-supplier">
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Proveedor
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Nuevo Proveedor</DialogTitle>
                      <DialogDescription>
                        Registra un nuevo proveedor de materia prima
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSupplierSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Nombre de la Empresa *</Label>
                          <Input id="name" name="name" required placeholder="Agrícola del Sur" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="code">Código *</Label>
                          <Input id="code" name="code" required placeholder="AGR-SUR" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="contact">Persona de Contacto</Label>
                          <Input id="contact" name="contact" placeholder="Juan Pérez" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Teléfono</Label>
                          <Input id="phone" name="phone" placeholder="+34 600 123 456" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" placeholder="contacto@proveedor.com" />
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setSupplierDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit">Crear Proveedor</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={supplierColumns}
                data={suppliers}
                onView={(row) => {
                  toast({ title: "Ver Proveedor", description: `Mostrando detalles de ${row.name}` });
                }}
                onEdit={(row) => {
                  toast({ title: "Editar Proveedor", description: `Editando ${row.name}` });
                }}
                onDelete={(row) => {
                  if (confirm(`¿Estás seguro de eliminar el proveedor ${row.name}?`)) {
                    fetch(`/api/suppliers/${row.id}`, { method: 'DELETE' })
                      .then(() => {
                        queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
                        toast({ title: "Proveedor eliminado", description: "El proveedor se ha eliminado correctamente." });
                      })
                      .catch(() => {
                        toast({ title: "Error", description: "No se pudo eliminar el proveedor.", variant: "destructive" });
                      });
                  }
                }}
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
                <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-new-product">
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Producto
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Nuevo Producto</DialogTitle>
                      <DialogDescription>
                        Registra un nuevo producto en el catálogo
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleProductSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="prod-name">Nombre *</Label>
                          <Input id="prod-name" name="name" required placeholder="Pimiento asado" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="prod-code">Código *</Label>
                          <Input id="prod-code" name="code" required placeholder="PIMP-AS" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="type">Tipo *</Label>
                          <Input id="type" name="type" required placeholder="Conserva" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="format">Formato</Label>
                          <Input id="format" name="format" placeholder="Frasco 370ml" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shelfLife">Vida Útil (días)</Label>
                        <Input id="shelfLife" name="shelfLife" type="number" placeholder="730" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="prod-description">Descripción</Label>
                        <Textarea id="prod-description" name="description" placeholder="Descripción del producto..." />
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setProductDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit">Crear Producto</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={productColumns}
                data={products}
                onView={(row) => {
                  toast({ title: "Ver Producto", description: `Mostrando detalles de ${row.name}` });
                }}
                onEdit={(row) => {
                  toast({ title: "Editar Producto", description: `Editando ${row.name}` });
                }}
                onDelete={(row) => {
                  if (confirm(`¿Estás seguro de eliminar el producto ${row.name}?`)) {
                    fetch(`/api/products/${row.id}`, { method: 'DELETE' })
                      .then(() => {
                        queryClient.invalidateQueries({ queryKey: ['/api/products'] });
                        toast({ title: "Producto eliminado", description: "El producto se ha eliminado correctamente." });
                      })
                      .catch(() => {
                        toast({ title: "Error", description: "No se pudo eliminar el producto.", variant: "destructive" });
                      });
                  }
                }}
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
                <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-new-location">
                      <Plus className="h-4 w-4 mr-2" />
                      Nueva Ubicación
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Nueva Ubicación</DialogTitle>
                      <DialogDescription>
                        Registra una nueva ubicación física
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleLocationSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="loc-name">Nombre *</Label>
                          <Input id="loc-name" name="name" required placeholder="Recepción - Zona 1" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="loc-code">Código *</Label>
                          <Input id="loc-code" name="code" required placeholder="REC-Z1" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="loc-type">Tipo *</Label>
                        <Select name="type" required>
                          <SelectTrigger id="loc-type">
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="RECEPCION">Recepción</SelectItem>
                            <SelectItem value="PRODUCCION">Producción</SelectItem>
                            <SelectItem value="CALIDAD">Calidad</SelectItem>
                            <SelectItem value="EXPEDICION">Expedición</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setLocationDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit">Crear Ubicación</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={locationColumns}
                data={locations}
                onView={(row) => {
                  toast({ title: "Ver Ubicación", description: `Mostrando detalles de ${row.name}` });
                }}
                onEdit={(row) => {
                  toast({ title: "Editar Ubicación", description: `Editando ${row.name}` });
                }}
                onDelete={(row) => {
                  if (confirm(`¿Estás seguro de eliminar la ubicación ${row.name}?`)) {
                    fetch(`/api/locations/${row.id}`, { method: 'DELETE' })
                      .then(() => {
                        queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
                        toast({ title: "Ubicación eliminada", description: "La ubicación se ha eliminado correctamente." });
                      })
                      .catch(() => {
                        toast({ title: "Error", description: "No se pudo eliminar la ubicación.", variant: "destructive" });
                      });
                  }
                }}
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
                <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-new-customer">
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Cliente
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Nuevo Cliente</DialogTitle>
                      <DialogDescription>
                        Registra un nuevo cliente
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCustomerSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="cust-name">Nombre *</Label>
                          <Input id="cust-name" name="name" required placeholder="Distribuidora García" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cust-code">Código</Label>
                          <Input id="cust-code" name="code" placeholder="DIST-GAR" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="cust-contact">Persona de Contacto</Label>
                          <Input id="cust-contact" name="contact" placeholder="María García" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cust-phone">Teléfono</Label>
                          <Input id="cust-phone" name="phone" placeholder="+34 600 123 456" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cust-email">Email</Label>
                        <Input id="cust-email" name="email" type="email" placeholder="contacto@cliente.com" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Dirección</Label>
                        <Textarea id="address" name="address" placeholder="Calle Principal 123, Madrid" />
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setCustomerDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit">Crear Cliente</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={customerColumns}
                data={customers}
                onView={(row) => {
                  toast({ title: "Ver Cliente", description: `Mostrando detalles de ${row.name}` });
                }}
                onEdit={(row) => {
                  toast({ title: "Editar Cliente", description: `Editando ${row.name}` });
                }}
                onDelete={(row) => {
                  if (confirm(`¿Estás seguro de eliminar el cliente ${row.name}?`)) {
                    fetch(`/api/customers/${row.id}`, { method: 'DELETE' })
                      .then(() => {
                        queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
                        toast({ title: "Cliente eliminado", description: "El cliente se ha eliminado correctamente." });
                      })
                      .catch(() => {
                        toast({ title: "Error", description: "No se pudo eliminar el cliente.", variant: "destructive" });
                      });
                  }
                }}
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
                <Dialog open={packageDialogOpen} onOpenChange={setPackageDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-new-package">
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Tipo de Envase
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Nuevo Tipo de Envase</DialogTitle>
                      <DialogDescription>
                        Registra un nuevo tipo de envase
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePackageTypeSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="pkg-name">Nombre *</Label>
                          <Input id="pkg-name" name="name" required placeholder="Frasco vidrio" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pkg-code">Código</Label>
                          <Input id="pkg-code" name="code" placeholder="FRA-VID" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="capacity">Capacidad</Label>
                          <Input id="capacity" name="capacity" type="number" step="0.01" placeholder="370" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="unit">Unidad</Label>
                          <Input id="unit" name="unit" placeholder="ml" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pkg-description">Descripción</Label>
                        <Textarea id="pkg-description" name="description" placeholder="Descripción del envase..." />
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setPackageDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit">Crear Tipo de Envase</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={packageTypeColumns}
                data={packageTypes}
                onView={(row) => {
                  toast({ title: "Ver Tipo de Envase", description: `Mostrando detalles de ${row.name}` });
                }}
                onEdit={(row) => {
                  toast({ title: "Editar Tipo de Envase", description: `Editando ${row.name}` });
                }}
                onDelete={(row) => {
                  if (confirm(`¿Estás seguro de eliminar el tipo de envase ${row.name}?`)) {
                    fetch(`/api/package-types/${row.id}`, { method: 'DELETE' })
                      .then(() => {
                        queryClient.invalidateQueries({ queryKey: ['/api/package-types'] });
                        toast({ title: "Tipo de envase eliminado", description: "El tipo de envase se ha eliminado correctamente." });
                      })
                      .catch(() => {
                        toast({ title: "Error", description: "No se pudo eliminar el tipo de envase.", variant: "destructive" });
                      });
                  }
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
