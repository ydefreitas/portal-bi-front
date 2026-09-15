

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface AccessSummary {
  date: string;
  count: number;
}

export interface Stats {
  totalUsers: number;
  totalGroups: number;
  totalReports: number;
  accessStats: AccessSummary[];
  totalVisualizations: number;
  dailyAccess: { date: string; accesses: number }[];
  groupDistribution: { name: string; users: number; color: string }[];
  usersData: any[];
  reportsData: any[];
}

// Colores para los grupos (puedes personalizar más)
const GROUP_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1', '#a4de6c', '#d0ed57', '#d885a3', '#a28fd0', '#f7b267'
];

export const useStats = () => {
  const [stats, setStats] = useState<Stats | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      // Llama al nuevo endpoint centralizado
      const data = await api.get<Stats>('/api/v1/admin/dashboard-stats');
      
      // Formatear las fechas para visualización si es necesario
      const formattedData = {
        ...data,
        usersData: data.usersData.map(user => ({
          ...user,
          lastAccess: user.lastAccess 
            ? new Date(user.lastAccess).toLocaleString('es-ES', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })
            : 'Nunca'
        })),
        reportsData: data.reportsData.map(report => ({
          ...report,
          lastView: report.lastView
            ? new Date(report.lastView).toLocaleString('es-ES', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })
            : 'Nunca'
        }))
      };

      setStats(formattedData);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas",
        variant: "destructive",
      });
    }
  };

  const logAccess = async (userId: string) => {
    try {
      await api.post('/api/v1/users-access', { id_user: userId });
    } catch (error) {
      console.error('Error logging access:', error);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchStats().then(() => setLoading(false));
  }, []);

  return {
    stats,
    loading,
    logAccess,
    refreshStats: fetchStats
  };
};
