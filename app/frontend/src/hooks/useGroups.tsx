import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface Group {
  id_group: string;
  name: string;
  description?: string;
  creation_date: string;
  memberCount?: number;
  reportCount?: number;
}

export const useGroups = () => {
    // Fetch members of a group
    const getGroupMembers = async (groupId: string) => {
      try {
        const data = await api.get<any[]>(`/api/v1/groups/${groupId}/members`);
        return data;
      } catch (error) {
        console.error('Error fetching group members:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los miembros del grupo',
          variant: 'destructive',
        });
        return [];
      }
    };
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchGroups = async () => {
    try {
      const data = await api.get<Group[]>('/api/v1/groups');
      setGroups(data);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los grupos",
        variant: "destructive",
      });
    }
  };

  const createGroup = async (group: { name: string; description?: string; memberIds?: string[] }) => {
    try {
      const data = await api.post<Group>('/api/v1/groups', {
        name: group.name,
        description: group.description || '',
        memberIds: group.memberIds || []
      });

      toast({
        title: "Éxito",
        description: "Grupo creado correctamente",
      });

      await fetchGroups();
      return data;
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el grupo",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateGroup = async (
    groupId: string,
    data: { name: string; description?: string; memberIds?: string[] }
  ) => {
    try {
      await api.put(`/api/v1/groups/${groupId}`, data);

      toast({
        title: "Éxito",
        description: "Grupo actualizado correctamente",
      });

      await fetchGroups();
    } catch (error) {
      console.error('Error updating group:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el grupo",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteGroup = async (groupId: string) => {
    try {
      await api.delete(`/api/v1/groups/${groupId}`);

      toast({
        title: "Éxito",
        description: "Grupo eliminado correctamente",
      });

      await fetchGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el grupo",
        variant: "destructive",
      });
      throw error;
    }
  };

  const addUserToGroup = async (groupId: string, userId: string) => {
    try {
      await api.post(`/api/v1/groups/${groupId}/members`, { id_user: userId });

      toast({
        title: "Éxito",
        description: "Usuario añadido al grupo",
      });

      await fetchGroups();
    } catch (error) {
      console.error('Error adding user to group:', error);
      toast({
        title: "Error",
        description: "No se pudo añadir el usuario al grupo",
        variant: "destructive",
      });
      throw error;
    }
  };

  const removeUserFromGroup = async (groupId: string, userId: string) => {
    try {
      await api.delete(`/api/v1/groups/${groupId}/members/${userId}`);

      toast({
        title: "Éxito",
        description: "Usuario removido del grupo",
      });

      await fetchGroups();
    } catch (error) {
      console.error('Error removing user from group:', error);
      toast({
        title: "Error",
        description: "No se pudo remover el usuario del grupo",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Fetch reports assigned to a group
  const getGroupReports = async (groupId: string) => {
    try {
      const data = await api.get<any[]>(`/api/v1/groups/${groupId}/reports`);
      return data;
    } catch (error) {
      console.error('Error fetching group reports:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los reportes del grupo',
        variant: 'destructive',
      });
      return [];
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchGroups().then(() => setLoading(false));
  }, []);

  return {
    groups,
    loading,
    createGroup,
    updateGroup,
    deleteGroup,
    addUserToGroup,
    removeUserFromGroup,
    refreshGroups: fetchGroups,
    getGroupReports,
    getGroupMembers
  };
};
