import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface UserProfile {
  id_user: string;
  user_id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  status: string;
  groups?: { id_group: string; name: string }[];
}

export const useUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      const data = await api.get<UserProfile[]>('/api/v1/profiles');
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      });
    }
  };

  const updateUser = async (
    userId: string,
    userData: {
      name: string;
      email: string;
      role: string;
      status: string;
      groupIds?: string[];
    }
  ) => {
    try {
      await api.post('/api/v1/profiles', {
        user_id: userId,
        ...userData
      });

      toast({
        title: "Éxito",
        description: "Usuario actualizado correctamente",
      });

      await fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el usuario",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await api.delete(`/api/v1/profiles/${userId}`);

      toast({
        title: "Éxito",
        description: "Usuario eliminado correctamente",
      });

      await fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el usuario",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchUsers().then(() => setLoading(false));
  }, []);

  return {
    users,
    loading,
    updateUser,
    deleteUser,
    refreshUsers: fetchUsers
  };
};
