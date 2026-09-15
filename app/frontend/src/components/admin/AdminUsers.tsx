import { useState } from 'react';
import { Edit, Trash2, Search, Users, Check, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUsers } from '@/hooks/useUsers';
import { useGroups } from '@/hooks/useGroups';

import DataTable from './DataTable';

const AdminUsers = () => {
  const { users, loading: usersLoading, updateUser, deleteUser } = useUsers();
  const { groups, loading: groupsLoading } = useGroups();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [groupSearchTerm, setGroupSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user',
    status: 'activo',
    groupIds: [] as string[]
  });

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'user',
      status: user.status || 'activo',
      groupIds: (user.groups || []).map((g: any) => g.id_group)
    });
    setGroupSearchTerm('');
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (selectedUser) {
      // Usar el user_id lógico, no el id_user (UUID)
      await updateUser(selectedUser.user_id, formData);
      setIsDialogOpen(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      await deleteUser(userId);
    }
  };

  const getRoleColor = (role: string) => {
    return role === 'admin' ? 'destructive' : 'secondary';
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'default' : 'secondary';
  };

  const columns = [
    {
      key: 'name',
      label: 'Nombre',
      sortable: true,
      render: (value: string) => value || 'Sin nombre'
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (value: string) => (
        <div className="max-w-[150px] md:max-w-[200px] truncate" title={value || 'Sin email'}>
          {value || 'Sin email'}
        </div>
      )
    },
    {
      key: 'role',
      label: 'Rol',
      sortable: true,
      className: 'text-center',
      render: (value: string) => (
        <div className="text-center">
          <Badge variant={getRoleColor(value || 'user')}>
            {value === 'admin' ? 'Administrador' : 'Usuario'}
          </Badge>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Estado',
      sortable: true,
      className: 'text-center',
      render: (value: string) => (
        <div className="text-center">
          <Badge variant={getStatusColor(value)}>
            {value === 'activo' ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
      )
    },
    {
      key: 'groups',
      label: 'Grupos',
      render: (_: any, user: any) => {
        const groups = user.groups || [];
        const groupNames = groups.map((g: any) => g.name).join(', ');

        return (
          <div className="max-w-[200px] md:max-w-[300px] truncate" title={groupNames}>
            <span className="text-sm">
              {groupNames || 'Sin grupos'}
            </span>
          </div>
        );
      }
    },
    {
      key: 'actions',
      label: 'Acciones',
      className: 'text-center',
      render: (_: any, user: any) => (
        <div className="text-center">
          <div className="flex justify-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(user)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(user.id_user)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestión de Usuarios</CardTitle>
              <CardDescription>
                Administra los usuarios del sistema Portal de Datos
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {usersLoading || groupsLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              Cargando usuarios...
            </div>
          ) : (
            <DataTable
              data={users}
              columns={columns}
              searchPlaceholder="Buscar usuarios por nombre o email..."
              itemsPerPage={10}
              maxHeight="500px"
              minWidth="900px"
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica los datos del usuario seleccionado.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nombre completo"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="usuario@empresa.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Rol</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuario</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Grupos Asignados</Label>
                <div className="border rounded-md p-3">
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Buscar grupos..."
                      value={groupSearchTerm}
                      onChange={(e) => setGroupSearchTerm(e.target.value)}
                      className="pl-10 h-9"
                    />
                  </div>

                  {formData.groupIds.length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-2">
                        {formData.groupIds.map((groupId) => {
                          const group = groups.find(g => g.id_group === groupId);
                          return group ? (
                            <Badge
                              key={groupId}
                              variant="secondary"
                              className="gap-1 pr-1.5 py-1"
                            >
                              {group.name}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 hover:bg-transparent"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    groupIds: formData.groupIds.filter(id => id !== groupId)
                                  });
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {groups
                      .filter(group =>
                        !formData.groupIds.includes(group.id_group) &&
                        group.name.toLowerCase().includes(groupSearchTerm.toLowerCase())
                      )
                      .map((group) => (
                        <div
                          key={group.id_group}
                          className="flex items-center justify-between p-2 hover:bg-background rounded-sm cursor-pointer border border-transparent hover:border-border transition-colors group"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              groupIds: [...formData.groupIds, group.id_group]
                            });
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                              <Users className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-sm font-medium">{group.name}</span>
                          </div>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    {groups.filter(group =>
                      !formData.groupIds.includes(group.id_group) &&
                      group.name.toLowerCase().includes(groupSearchTerm.toLowerCase())
                    ).length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4 italic">
                          {groupSearchTerm ? `No hay más grupos que coincidan con "${groupSearchTerm}"` : 'Todos los grupos han sido asignados'}
                        </p>
                      )}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                Guardar Cambios
              </Button>
            </DialogFooter>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;