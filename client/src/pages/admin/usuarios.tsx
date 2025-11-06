
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export default function GestionUsuarios() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: { username: string; email: string; password: string }) => {
      const sessionId = localStorage.getItem('sessionId');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (sessionId) {
        headers['Authorization'] = `Bearer ${sessionId}`;
      }
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al crear usuario');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setDialogOpen(false);
      toast({ 
        title: "Usuario creado", 
        description: "El usuario se ha creado correctamente." 
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const sessionId = localStorage.getItem('sessionId');
      const headers: HeadersInit = {};
      if (sessionId) {
        headers['Authorization'] = `Bearer ${sessionId}`;
      }
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) throw new Error('Error al eliminar usuario');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ 
        title: "Usuario eliminado", 
        description: "El usuario se ha eliminado correctamente." 
      });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "No se pudo eliminar el usuario.", 
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createUserMutation.mutate({
      username: formData.get('username') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    });
  };

  const columns: Column<User>[] = [
    { key: "username", label: "Usuario" },
    { key: "email", label: "Email" },
    { 
      key: "createdAt", 
      label: "Fecha de creación",
      render: (value) => new Date(value).toLocaleDateString('es-ES')
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Gestión de Usuarios</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Administra los usuarios con acceso al sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Usuarios de la organización</CardTitle>
              <CardDescription>Lista de usuarios con acceso al sistema</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingUser(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Nuevo Usuario</DialogTitle>
                  <DialogDescription>
                    Crea un nuevo usuario para tu organización
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Nombre de usuario *</Label>
                    <Input 
                      id="username" 
                      name="username" 
                      required 
                      placeholder="Juan Pérez"
                      minLength={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      required 
                      placeholder="usuario@ejemplo.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña *</Label>
                    <Input 
                      id="password" 
                      name="password" 
                      type="password" 
                      required 
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createUserMutation.isPending}>
                      Crear Usuario
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={users}
            onDelete={(row) => {
              if (confirm(`¿Estás seguro de eliminar al usuario ${row.username}?`)) {
                deleteUserMutation.mutate(row.id);
              }
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
