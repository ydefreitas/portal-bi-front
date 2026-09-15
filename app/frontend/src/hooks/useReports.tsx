import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface Report {
  id_report: string;
  name: string;
  description: string | null;
  category: string | null;
  url: string | null;
  status: string;
  creation_date: string;
  views: number;
  last_view_date: string | null;
  workspace_id?: string | null;
  powerbi_report_id?: string | null;
  report_type?: 'powerbi' | 'databricks' | null;
  databricks_dashboard_id?: string | null;
  databricks_workspace_id?: string | null;
  databricks_genie_space_id?: string | null;
  image_url?: string | null;
}

export interface Group {
  id_group: string;
  name: string;
  creation_date: string;
}

export interface ReportWithGroups extends Report {
  groups: Group[];
}

export interface Profile {
  id_user: string;
  name: string | null;
  email: string | null;
  role: string | null;
  status: string;
  creation_date: string;
}

export interface ReportAccess {
  groups: Group[];
  specialUsers: Profile[];
}

export interface AccessRequestStatus {
  found: boolean;
  status?: 'pending' | 'approved' | 'denied';
  requestDate?: string;
  responseDate?: string;
}

export interface AdminAccessRequest extends AccessRequestStatus {
  access_request_id: string;
  report_id: string;
  requester_id: string;
  requester_name: string;
  requester_email: string;
  report_name: string;
  status: 'pending' | 'approved' | 'denied';
  request_date: string;
}

export const useReports = () => {
  const [reports, setReports] = useState<ReportWithGroups[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchReports = async () => {
    try {
      const data = await api.get<ReportWithGroups[]>('/api/v1/reports');
      setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los reportes",
        variant: "destructive",
      });
    }
  };

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

  const fetchUsers = async () => {
    try {
      const data = await api.get<Profile[]>('/api/v1/profiles');
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

  const createReport = async (reportData: Omit<Report, 'id_report' | 'creation_date' | 'views' | 'last_view_date'>) => {
    try {
      const data = await api.post<{ id_report: string }>('/api/v1/reports', reportData);
      toast({
        title: "Éxito",
        description: "Reporte creado correctamente",
      });
      await fetchReports();
      if (data && typeof data.id_report === 'string' && data.id_report.length > 0) {
        return data.id_report;
      } else {
        console.error('No id_report returned from backend:', data);
        return null;
      }
    } catch (error) {
      console.error('Error creating report:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el reporte",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateReport = async (id: string, reportData: Partial<Report>) => {
    try {
      await api.put(`/api/v1/reports/${id}`, reportData);

      toast({
        title: "Éxito",
        description: "Reporte actualizado correctamente",
      });

      await fetchReports();
    } catch (error) {
      console.error('Error updating report:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el reporte",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteReport = async (id: string) => {
    try {
      await api.delete(`/api/v1/reports/${id}`);

      toast({
        title: "Éxito",
        description: "Reporte eliminado correctamente",
      });

      await fetchReports();
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el reporte",
        variant: "destructive",
      });
      throw error;
    }
  };

  const incrementViews = async (reportId: string) => {
    try {
      await api.post(`/api/v1/reports/${reportId}/increment-views`, {});
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchReports(),
        fetchGroups(),
        fetchUsers()
      ]);
      setLoading(false);
    };

    loadData();
  }, []);

  // Fetch report access info
  const getReportAccess = async (reportId: string): Promise<ReportAccess> => {
    try {
      const data = await api.get<ReportAccess>(`/api/v1/reports/${reportId}/access`);
      return data;
    } catch (error) {
      console.error('Error fetching report access:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el acceso al reporte",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Update report access (groups and special users)
  const updateReportAccess = async (reportId: string, groupIds: string[], userIds: string[]) => {
    try {
      console.log('updateReportAccess (hook)', {
        reportId,
        groupIds,
        specialUserIds: userIds
      });
      await api.put(`/api/v1/reports/${reportId}/access`, {
        groupIds,
        specialUserIds: userIds
      });
      toast({
        title: "Éxito",
        description: "Acceso al reporte actualizado",
      });
    } catch (error) {
      console.error('Error updating report access:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el acceso al reporte",
        variant: "destructive",
      });
      throw error;
    }
  };

  const createAccessRequest = async (reportId: string, userId: string) => {
    try {
      await api.post('/api/v1/access-requests', {
        reportId,
        requesterId: userId
      });
      toast({
        title: "Solicitud enviada",
        description: "Tu solicitud de acceso ha sido enviada correctamente",
      });
      return true;
    } catch (error: any) {
      console.error('Error creating access request:', error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "No se pudo enviar la solicitud",
        variant: "destructive",
      });
      return false;
    }
  };

  const checkAccessRequestStatus = async (reportId: string, userId: string): Promise<AccessRequestStatus> => {
    try {
      const data = await api.get<AccessRequestStatus>(`/api/v1/access-requests/status/${userId}/${reportId}`);
      return data;
    } catch (error) {
      console.error('Error checking access request status:', error);
      return { found: false };
    }
  };

  const fetchUserAccessRequests = async (userId: string): Promise<any[]> => {
    try {
      const data = await api.get<any[]>(`/api/v1/access-requests/user/${userId}`);
      return data;
    } catch (error) {
      console.error('Error fetching user access requests:', error);
      return [];
    }
  };

  const fetchAllAccessRequests = async (): Promise<AdminAccessRequest[]> => {
    try {
      const data = await api.get<AdminAccessRequest[]>('/api/v1/access-requests');
      return data;
    } catch (error) {
      console.error('Error fetching all access requests:', error);
      return [];
    }
  };

  const approveAccessRequest = async (requestId: string, approverId: string) => {
    try {
      await api.post(`/api/v1/access-requests/${requestId}/approve`, { approverId });
      toast({
        title: "Solicitud Aprobada",
        description: "El acceso ha sido otorgado correctamente.",
      });
      return true;
    } catch (error) {
      console.error('Error approving access request:', error);
      toast({
        title: "Error",
        description: "No se pudo aprobar la solicitud.",
        variant: "destructive",
      });
      return false;
    }
  };

  const rejectAccessRequest = async (requestId: string, approverId: string) => {
    try {
      await api.post(`/api/v1/access-requests/${requestId}/reject`, { approverId });
      toast({
        title: "Solicitud Denegada",
        description: "La solicitud ha sido rechazada.",
      });
      return true;
    } catch (error) {
      console.error('Error rejecting access request:', error);
      toast({
        title: "Error",
        description: "No se pudo rechazar la solicitud.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    reports,
    groups,
    users,
    loading,
    createReport,
    updateReport,
    deleteReport,
    incrementViews,
    refreshReports: fetchReports,
    getReportAccess,
    updateReportAccess,
    createAccessRequest,
    checkAccessRequestStatus,
    fetchUserAccessRequests,
    fetchAllAccessRequests,
    approveAccessRequest,
    rejectAccessRequest
  };
};
