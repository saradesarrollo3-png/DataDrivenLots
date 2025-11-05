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

  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingPackage, setEditingPackage] = useState<PackageType | null>(null);

  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [viewingLocation, setViewingLocation] = useState<Location | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [viewingPackage, setViewingPackage] = useState<PackageType | null>(null);

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
    mutationFn: async (data: Partial<Supplier>) => {
      const sessionId = localStorage.getItem('sessionId');
      const url = editingSupplier ? `/api/suppliers/${editingSupplier.id}` : '/api/suppliers';
      const method = editingSupplier ? 'PUT' : 'POST';
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (sessionId) {
        headers['Authorization'] = `Bearer ${sessionId}`;
      }
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Error al guardar proveedor');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      setSupplierDialogOpen(false);
      setEditingSupplier(null);
      toast({ 
        title: editingSupplier ? "Proveedor actualizado" : "Proveedor creado", 
        description: editingSupplier ? "El proveedor se ha actualizado correctamente." : "El proveedor se ha creado correctamente." 
      });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo guardar el proveedor.", variant: "destructive" });
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: Partial<Product>) => {
      const sessionId = localStorage.getItem('sessionId');
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (sessionId) {
        headers['Authorization'] = `Bearer ${sessionId}`;
      }
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Error al guardar producto');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setProductDialogOpen(false);
      setEditingProduct(null);
      toast({ 
        title: editingProduct ? "Producto actualizado" : "Producto creado", 
        description: editingProduct ? "El producto se ha actualizado correctamente." : "El producto se ha creado correctamente." 
      });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo guardar el producto.", variant: "destructive" });
    },
  });

  const createLocationMutation = useMutation({
    mutationFn: async (data: Partial<Location>) => {
      const sessionId = localStorage.getItem('sessionId');
      const url = editingLocation ? `/api/locations/${editingLocation.id}` : '/api/locations';
      const method = editingLocation ? 'PUT' : 'POST';
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (sessionId) {
        headers['Authorization'] = `Bearer ${sessionId}`;
      }
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Error al guardar ubicación');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
      setLocationDialogOpen(false);
      setEditingLocation(null);
      toast({ 
        title: editingLocation ? "Ubicación actualizada" : "Ubicación creada", 
        description: editingLocation ? "La ubicación se ha actualizado correctamente." : "La ubicación se ha creado correctamente." 
      });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo guardar la ubicación.", variant: "destructive" });
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (data: Partial<Customer>) => {
      const sessionId = localStorage.getItem('sessionId');
      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : '/api/customers';
      const method = editingCustomer ? 'PUT' : 'POST';
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (sessionId) {
        headers['Authorization'] = `Bearer ${sessionId}`;
      }
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Error al guardar cliente');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      setCustomerDialogOpen(false);
      setEditingCustomer(null);
      toast({ 
        title: editingCustomer ? "Cliente actualizado" : "Cliente creado", 
        description: editingCustomer ? "El cliente se ha actualizado correctamente." : "El cliente se ha creado correctamente." 
      });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo guardar el cliente.", variant: "destructive" });
    },
  });

  const createPackageTypeMutation = useMutation({
    mutationFn: async (data: Partial<PackageType>) => {
      const sessionId = localStorage.getItem('sessionId');
      const url = editingPackage ? `/api/package-types/${editingPackage.id}` : '/api/package-types';
      const method = editingPackage ? 'PUT' : 'POST';
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (sessionId) {
        headers['Authorization'] = `Bearer ${sessionId}`;
      }
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Error al guardar tipo de envase');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/package-types'] });
      setPackageDialogOpen(false);
      setEditingPackage(null);
      toast({ 
        title: editingPackage ? "Tipo de envase actualizado" : "Tipo de envase creado", 
        description: editingPackage ? "El tipo de envase se ha actualizado correctamente." : "El tipo de envase se ha creado correctamente." 
      });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo guardar el tipo de envase.", variant: "destructive" });
    },
  });

  const handleSupplierSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createSupplierMutation.mutate({
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      contact: (formData.get('contact') as string) || null,
      phone: (formData.get('phone') as string) || null,
      email: (formData.get('email') as string) || null,
    });
  };

  const handleProductSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const shelfLifeValue = formData.get('shelfLife') as string;
    createProductMutation.mutate({
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      type: formData.get('type') as string,
      format: (formData.get('format') as string) || null,
      shelfLife: shelfLifeValue ? parseInt(shelfLifeValue, 10) : 0,
    });
  };

  const handleLocationSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createLocationMutation.mutate({
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      type: formData.get('type') as string,
    });
  };

  const handleCustomerSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createCustomerMutation.mutate({
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      contact: (formData.get('contact') as string) || null,
      phone: (formData.get('phone') as string) || null,
      email: (formData.get('email') as string) || null,
      address: (formData.get('address') as string) || null,
    });
  };

  const handlePackageTypeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const capacityValue = formData.get('capacity') as string;
    createPackageTypeMutation.mutate({
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      capacity: capacityValue || null,
      unit: (formData.get('unit') as string) || null,
      description: (formData.get('description') as string) || null,
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
                    <Button data-testid="button-new-supplier" onClick={() => setEditingSupplier(null)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Proveedor
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{editingSupplier ? "Editar Proveedor" : "Nuevo Proveedor"}</DialogTitle>
                      <DialogDescription>
                        {editingSupplier ? "Modifica los datos del proveedor" : "Registra un nuevo proveedor de materia prima"}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSupplierSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Nombre de la Empresa *</Label>
                          <Input id="name" name="name" required placeholder="Agrícola del Sur" defaultValue={editingSupplier?.name || ""} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="code">Código</Label>
                          <Input id="code" name="code" placeholder="AGR-SUR" defaultValue={editingSupplier?.code || ""} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="contact">Persona de Contacto</Label>
                          <Input id="contact" name="contact" placeholder="Juan Pérez" defaultValue={editingSupplier?.contact || ""} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Teléfono</Label>
                          <Input id="phone" name="phone" placeholder="+34 600 123 456" defaultValue={editingSupplier?.phone || ""} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" placeholder="contacto@proveedor.com" defaultValue={editingSupplier?.email || ""} />
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => { setSupplierDialogOpen(false); setEditingSupplier(null); }}>
                          Cancelar
                        </Button>
                        <Button type="submit">{editingSupplier ? "Actualizar" : "Crear"} Proveedor</Button>
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
                  setViewingSupplier(row);
                }}
                onEdit={(row) => {
                  setEditingSupplier(row);
                  setSupplierDialogOpen(true);
                }}
                onDelete={(row) => {
                  if (confirm(`¿Estás seguro de eliminar el proveedor ${row.name}?`)) {
                    const sessionId = localStorage.getItem('sessionId');
                    const headers: HeadersInit = {};
                    if (sessionId) {
                      headers['Authorization'] = `Bearer ${sessionId}`;
                    }
                    fetch(`/api/suppliers/${row.id}`, { method: 'DELETE', headers })
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

              <Dialog open={!!viewingSupplier} onOpenChange={(open) => !open && setViewingSupplier(null)}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Detalles del Proveedor</DialogTitle>
                  </DialogHeader>
                  {viewingSupplier && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground">Nombre</Label>
                          <p className="font-medium">{viewingSupplier.name}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Código</Label>
                          <p className="font-medium font-mono">{viewingSupplier.code || "-"}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground">Contacto</Label>
                          <p className="font-medium">{viewingSupplier.contact || "-"}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Teléfono</Label>
                          <p className="font-medium">{viewingSupplier.phone || "-"}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Email</Label>
                        <p className="font-medium">{viewingSupplier.email || "-"}</p>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
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
                    <Button data-testid="button-new-product" onClick={() => setEditingProduct(null)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Producto
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingProduct ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
                      <DialogDescription>
                        {editingProduct ? "Modifica los datos del producto" : "Registra un nuevo producto en el catálogo"}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleProductSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="prod-name">Nombre *</Label>
                          <Input id="prod-name" name="name" required placeholder="Pimiento asado" defaultValue={editingProduct?.name || ""} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="prod-code">Código</Label>
                          <Input id="prod-code" name="code" placeholder="PIMP-AS" defaultValue={editingProduct?.code || ""} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="type">Tipo *</Label>
                          <Select name="type" required defaultValue={editingProduct?.type || ""}>
                            <SelectTrigger id="type">
                              <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="materia prima">Materia Prima</SelectItem>
                              <SelectItem value="semielaborado">Semielaborado</SelectItem>
                              <SelectItem value="producto terminado">Producto Terminado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="format">Formato</Label>
                          <Input id="format" name="format" placeholder="Frasco 370ml" defaultValue={editingProduct?.format || ""} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shelfLife">Vida Útil (días)</Label>
                        <Input id="shelfLife" name="shelfLife" type="number" placeholder="730" defaultValue={editingProduct?.shelfLife !== undefined && editingProduct?.shelfLife !== null ? editingProduct.shelfLife.toString() : ""} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="prod-description">Descripción</Label>
                        <Textarea id="prod-description" name="description" placeholder="Descripción del producto..." defaultValue={editingProduct?.description || ""} />
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => { setProductDialogOpen(false); setEditingProduct(null); }}>
                          Cancelar
                        </Button>
                        <Button type="submit">{editingProduct ? "Actualizar" : "Crear"} Producto</Button>
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
                  setViewingProduct(row);
                }}
                onEdit={(row) => {
                  setEditingProduct(row);
                  setProductDialogOpen(true);
                }}
                onDelete={(row) => {
                  if (confirm(`¿Estás seguro de eliminar el producto ${row.name}?`)) {
                    const sessionId = localStorage.getItem('sessionId');
                    const headers: HeadersInit = {};
                    if (sessionId) {
                      headers['Authorization'] = `Bearer ${sessionId}`;
                    }
                    fetch(`/api/products/${row.id}`, { method: 'DELETE', headers })
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

              <Dialog open={!!viewingProduct} onOpenChange={(open) => !open && setViewingProduct(null)}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Detalles del Producto</DialogTitle>
                  </DialogHeader>
                  {viewingProduct && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground">Nombre</Label>
                          <p className="font-medium">{viewingProduct.name}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Código</Label>
                          <p className="font-medium font-mono">{viewingProduct.code || "-"}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground">Tipo</Label>
                          <p className="font-medium">{viewingProduct.type}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Formato</Label>
                          <p className="font-medium">{viewingProduct.format || "-"}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Vida Útil</Label>
                        <p className="font-medium">{viewingProduct.shelfLife ? `${viewingProduct.shelfLife} días` : "-"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Descripción</Label>
                        <p className="font-medium">{viewingProduct.description || "-"}</p>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
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
                    <Button data-testid="button-new-location" onClick={() => setEditingLocation(null)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nueva Ubicación
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{editingLocation ? "Editar Ubicación" : "Nueva Ubicación"}</DialogTitle>
                      <DialogDescription>
                        {editingLocation ? "Modifica los datos de la ubicación" : "Registra una nueva ubicación física"}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleLocationSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="loc-name">Nombre *</Label>
                          <Input id="loc-name" name="name" required placeholder="Recepción - Zona 1" defaultValue={editingLocation?.name || ""} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="loc-code">Código</Label>
                          <Input id="loc-code" name="code" placeholder="REC-Z1" defaultValue={editingLocation?.code || ""} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="loc-type">Tipo *</Label>
                        <Select name="type" required defaultValue={editingLocation?.type || ""}>
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
                        <Button type="button" variant="outline" onClick={() => { setLocationDialogOpen(false); setEditingLocation(null); }}>
                          Cancelar
                        </Button>
                        <Button type="submit">{editingLocation ? "Actualizar" : "Crear"} Ubicación</Button>
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
                  setViewingLocation(row);
                }}
                onEdit={(row) => {
                  setEditingLocation(row);
                  setLocationDialogOpen(true);
                }}
                onDelete={(row) => {
                  if (confirm(`¿Estás seguro de eliminar la ubicación ${row.name}?`)) {
                    const sessionId = localStorage.getItem('sessionId');
                    const headers: HeadersInit = {};
                    if (sessionId) {
                      headers['Authorization'] = `Bearer ${sessionId}`;
                    }
                    fetch(`/api/locations/${row.id}`, { method: 'DELETE', headers })
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

              <Dialog open={!!viewingLocation} onOpenChange={(open) => !open && setViewingLocation(null)}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Detalles de la Ubicación</DialogTitle>
                  </DialogHeader>
                  {viewingLocation && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground">Nombre</Label>
                          <p className="font-medium">{viewingLocation.name}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Código</Label>
                          <p className="font-medium font-mono">{viewingLocation.code || "-"}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Tipo</Label>
                        <p className="font-medium">{viewingLocation.type}</p>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
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
                    <Button data-testid="button-new-customer" onClick={() => setEditingCustomer(null)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Cliente
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingCustomer ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
                      <DialogDescription>
                        {editingCustomer ? "Modifica los datos del cliente" : "Registra un nuevo cliente"}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCustomerSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="cust-name">Nombre *</Label>
                          <Input id="cust-name" name="name" required placeholder="Distribuidora García" defaultValue={editingCustomer?.name || ""} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cust-code">Código</Label>
                          <Input id="cust-code" name="code" placeholder="DIST-GAR" defaultValue={editingCustomer?.code || ""} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="cust-contact">Persona de Contacto</Label>
                          <Input id="cust-contact" name="contact" placeholder="María García" defaultValue={editingCustomer?.contact || ""} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cust-phone">Teléfono</Label>
                          <Input id="cust-phone" name="phone" placeholder="+34 600 123 456" defaultValue={editingCustomer?.phone || ""} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cust-email">Email</Label>
                        <Input id="cust-email" name="email" type="email" placeholder="contacto@cliente.com" defaultValue={editingCustomer?.email || ""} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Dirección</Label>
                        <Textarea id="address" name="address" placeholder="Calle Principal 123, Madrid" defaultValue={editingCustomer?.address || ""} />
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => { setCustomerDialogOpen(false); setEditingCustomer(null); }}>
                          Cancelar
                        </Button>
                        <Button type="submit">{editingCustomer ? "Actualizar" : "Crear"} Cliente</Button>
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
                  setViewingCustomer(row);
                }}
                onEdit={(row) => {
                  setEditingCustomer(row);
                  setCustomerDialogOpen(true);
                }}
                onDelete={(row) => {
                  if (confirm(`¿Estás seguro de eliminar el cliente ${row.name}?`)) {
                    const sessionId = localStorage.getItem('sessionId');
                    const headers: HeadersInit = {};
                    if (sessionId) {
                      headers['Authorization'] = `Bearer ${sessionId}`;
                    }
                    fetch(`/api/customers/${row.id}`, { method: 'DELETE', headers })
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

              <Dialog open={!!viewingCustomer} onOpenChange={(open) => !open && setViewingCustomer(null)}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Detalles del Cliente</DialogTitle>
                  </DialogHeader>
                  {viewingCustomer && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground">Nombre</Label>
                          <p className="font-medium">{viewingCustomer.name}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Código</Label>
                          <p className="font-medium font-mono">{viewingCustomer.code || "-"}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground">Contacto</Label>
                          <p className="font-medium">{viewingCustomer.contact || "-"}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Teléfono</Label>
                          <p className="font-medium">{viewingCustomer.phone || "-"}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Email</Label>
                        <p className="font-medium">{viewingCustomer.email || "-"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Dirección</Label>
                        <p className="font-medium">{viewingCustomer.address || "-"}</p>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
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
                    <Button data-testid="button-new-package" onClick={() => setEditingPackage(null)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Tipo de Envase
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{editingPackage ? "Editar Tipo de Envase" : "Nuevo Tipo de Envase"}</DialogTitle>
                      <DialogDescription>
                        {editingPackage ? "Modifica los datos del tipo de envase" : "Registra un nuevo tipo de envase"}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePackageTypeSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="pkg-name">Nombre *</Label>
                          <Input id="pkg-name" name="name" required placeholder="Frasco vidrio" defaultValue={editingPackage?.name || ""} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pkg-code">Código</Label>
                          <Input id="pkg-code" name="code" placeholder="FRA-VID" defaultValue={editingPackage?.code || ""} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="capacity">Capacidad</Label>
                          <Input id="capacity" name="capacity" type="number" step="0.01" placeholder="370" defaultValue={editingPackage?.capacity !== undefined && editingPackage?.capacity !== null ? editingPackage.capacity.toString() : ""} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="unit">Unidad</Label>
                          <Input id="unit" name="unit" placeholder="ml" defaultValue={editingPackage?.unit || ""} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pkg-description">Descripción</Label>
                        <Textarea id="pkg-description" name="description" placeholder="Descripción del envase..." defaultValue={editingPackage?.description || ""} />
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => { setPackageDialogOpen(false); setEditingPackage(null); }}>
                          Cancelar
                        </Button>
                        <Button type="submit">{editingPackage ? "Actualizar" : "Crear"} Tipo de Envase</Button>
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
                  setViewingPackage(row);
                }}
                onEdit={(row) => {
                  setEditingPackage(row);
                  setPackageDialogOpen(true);
                }}
                onDelete={(row) => {
                  if (confirm(`¿Estás seguro de eliminar el tipo de envase ${row.name}?`)) {
                    const sessionId = localStorage.getItem('sessionId');
                    const headers: HeadersInit = {};
                    if (sessionId) {
                      headers['Authorization'] = `Bearer ${sessionId}`;
                    }
                    fetch(`/api/package-types/${row.id}`, { method: 'DELETE', headers })
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

              <Dialog open={!!viewingPackage} onOpenChange={(open) => !open && setViewingPackage(null)}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Detalles del Tipo de Envase</DialogTitle>
                  </DialogHeader>
                  {viewingPackage && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground">Nombre</Label>
                          <p className="font-medium">{viewingPackage.name}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Código</Label>
                          <p className="font-medium font-mono">{viewingPackage.code || "-"}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground">Capacidad</Label>
                          <p className="font-medium">{viewingPackage.capacity ? `${viewingPackage.capacity} ${viewingPackage.unit || ''}` : "-"}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Descripción</Label>
                          <p className="font-medium">{viewingPackage.description || "-"}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}