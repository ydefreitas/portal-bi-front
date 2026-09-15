import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Edit, Trash2, Plus, Users, UserMinus, Loader2 } from 'lucide-react';
import { useGroups } from '@/hooks/useGroups';
import { useUsers } from '@/hooks/useUsers';

import DataTable from './DataTable';

const AdminGroups = () => {
  const {
    groups,
    loading,
    createGroup,
    updateGroup,
    deleteGroup,
    getGroupReports,
    getGroupMembers
  } = useGroups();
  const { users: allUsers, loading: usersLoading } = useUsers();

  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    members: [] as any[]
  });
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [groupReports, setGroupReports] = useState<any[]>([]);

  const filteredAvailableUsers = useMemo(() => {
    return availableUsers.filter(user =>
      (user.name && user.name.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(userSearchTerm.toLowerCase()))
    );
  }, [availableUsers, userSearchTerm]);

  useEffect(() => {
    if (selectedGroup) {
      loadGroupReports();
    }
  }, [selectedGroup]);

  const loadGroupReports = async () => {
    if (selectedGroup) {
      const reports = await getGroupReports(selectedGroup.id_group);
      setGroupReports(reports);
    }
  };

  const handleCreate = () => {
    setSelectedGroup(null);
    setFormData({
      name: '',
      description: '',
      members: []
    });
    setAvailableUsers(allUsers);
    setUserSearchTerm('');
    setGroupReports([]);
    setIsDialogOpen(true);
  };

  const handleEdit = (group: any) => {
    setSelectedGroup(group);
    // Fetch members from backend
    getGroupMembers(group.id_group).then(members => {
      setFormData({
        name: group.name,
        description: group.description || '',
        members: members || []
      });
      // Usuarios disponibles: todos menos los que ya están en este grupo
      const currentMemberIds = (members || []).map((m: any) => m.id_user);
      setAvailableUsers(allUsers.filter(user => !currentMemberIds.includes(user.id_user)));
      setUserSearchTerm('');
      setIsDialogOpen(true);
    });
  };

  const handleSave = async () => {
    try {
      const memberIds = formData.members.map(m => m.id_user);

      if (selectedGroup) {
        await updateGroup(selectedGroup.id_group, {
          name: formData.name,
          description: formData.description,
          memberIds
        });
      } else {
        await createGroup({
          name: formData.name,
          description: formData.description,
          memberIds
        });
      }
      setIsDialogOpen(false);
    } catch (error) {
      // Error ya manejado en el hook
    }
  };

  const handleDelete = async (groupId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este grupo?')) {
      await deleteGroup(groupId);
    }
  };

  const handleAddUser = (user: any) => {
    setFormData(prev => ({
      ...prev,
      members: [...prev.members, user]
    }));
    setAvailableUsers(availableUsers.filter(u => u.id_user !== user.id_user));
  };

  const handleRemoveUser = (userId: string) => {
    const removedUser = formData.members.find(m => m.id_user === userId);
    setFormData(prev => ({
      ...prev,
      members: prev.members.filter(m => m.id_user !== userId)
    }));
    if (removedUser) {
      setAvailableUsers([...availableUsers, removedUser]);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Nombre',
      sortable: true,
      render: (value: string) => <div className="font-medium">{value}</div>
    },
    {
      key: 'description',
      label: 'Descripción',
      sortable: true,
      render: (value: string) => (
        <div className="max-w-[300px] truncate text-muted-foreground" title={value || ''}>
          {value || 'Sin descripción'}
        </div>
      )
    },
    {
      key: 'memberCount',
      label: 'Miembros',
      sortable: true,
      className: 'text-center',
      render: (value: number) => (
        <div className="text-center font-medium">
          {value}
        </div>
      )
    },
    {
      key: 'reportCount',
      label: 'Reportes Asignados',
      sortable: true,
      className: 'text-center',
      render: (value: number) => (
        <div className="text-center font-medium">
          {value}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      className: 'text-center',
      render: (_: any, group: any) => (
        <div className="text-center">
          <div className="flex justify-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(group)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(group.id_group)}
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
              <CardTitle>Gestión de Grupos</CardTitle>
              <CardDescription>
                Administra los grupos de usuarios y sus accesos a reportes
              </CardDescription>
            </div>
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Grupo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              Cargando grupos...
            </div>
          ) : (
            <DataTable
              data={groups}
              columns={columns}
              searchPlaceholder="Buscar grupos por nombre o descripción..."
              itemsPerPage={10}
              maxHeight="500px"
              minWidth="800px"
            />
          )}
        </CardContent>
      </Card>

      {/* Modal para crear/editar grupo */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedGroup ? 'Editar Grupo' : 'Nuevo Grupo'}
            </DialogTitle>
            <DialogDescription>
              {selectedGroup ? 'Modifica los datos del grupo y gestiona sus miembros' : 'Crea un nuevo grupo de usuarios'}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="grid gap-6 py-4">
              {/* Información básica del grupo */}
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nombre del grupo"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción del grupo"
                  />
                </div>
              </div>

              {/* Gestión de miembros */}
              <div className="grid gap-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <Label>Miembros del Grupo</Label>
                  <Badge variant="secondary">{formData.members.length}</Badge>
                </div>

                {/* Miembros actuales */}
                {formData.members.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Miembros actuales:</h4>
                    <div className="border rounded-md max-h-32 overflow-y-auto">
                      {formData.members.map((member) => (
                        <div key={member.id_user} className="flex items-center justify-between p-2 border-b last:border-b-0">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{member.name || 'Sin nombre'}</span>
                            <span className="text-xs text-muted-foreground">{member.email || 'Sin email'}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveUser(member.id_user)}
                            className="text-destructive hover:text-destructive"
                          >
                            <UserMinus className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Usuarios disponibles para agregar */}
                {availableUsers.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Agregar usuarios:</h4>
                    {/* Buscador de usuarios */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Buscar usuarios..."
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="border rounded-md max-h-40 overflow-y-auto">
                      {filteredAvailableUsers.map((user) => (
                        <div key={user.id_user} className="flex items-center justify-between p-2 border-b last:border-b-0">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{user.name || 'Sin nombre'}</span>
                            <span className="text-xs text-muted-foreground">{user.email || 'Sin email'}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddUser(user)}
                            className="text-primary hover:text-primary"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      {filteredAvailableUsers.length === 0 && userSearchTerm && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No se encontraron usuarios que coincidan con "{userSearchTerm}"
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {availableUsers.length === 0 && formData.members.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay usuarios disponibles para agregar
                  </p>
                )}
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {selectedGroup ? 'Guardar Cambios' : 'Crear Grupo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminGroups;