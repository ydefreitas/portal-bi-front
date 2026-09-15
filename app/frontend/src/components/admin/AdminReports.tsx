import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Edit, Trash2, Plus, Eye, ExternalLink, User, Loader2, Users, X } from 'lucide-react';
import { useReports, Report, Group, Profile } from '@/hooks/useReports';

import DataTable from './DataTable';
import PowerBIEmbed from '../PowerBIEmbed';
import DatabricksEmbed from '../DatabricksEmbed';

const AdminReports = () => {
  const {
    reports,
    groups,
    users,
    loading,
    getReportAccess,
    createReport,
    updateReport,
    deleteReport,
    updateReportAccess,
    refreshReports
  } = useReports();

  const [groupFilter, setGroupFilter] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    url: '',
    report_type: 'powerbi' as 'powerbi' | 'databricks',
    workspace_id: '',
    powerbi_report_id: '',
    databricks_dashboard_id: '',
    databricks_workspace_id: '',
    image_url: '',
    status: 'activo' as 'activo' | 'inactivo',
    selectedGroups: [] as string[],
    selectedUsers: [] as string[]
  });
  const [showPreview, setShowPreview] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [groupSearchTerm, setGroupSearchTerm] = useState('');
  const [reportAccess, setReportAccess] = useState<{ groups: Group[], specialUsers: Profile[] }>({
    groups: [],
    specialUsers: []
  });
  const [loadingAccess, setLoadingAccess] = useState(false);

  const reportsByGroup = useMemo(() => {
    if (!groupFilter) return reports;
    return reports.filter(report =>
      report.groups && report.groups.some(g => g.id_group === groupFilter)
    );
  }, [reports, groupFilter]);

  const filteredUsers = users.filter(user =>
    (user.name && user.name.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
    (user.email && user.email.toLowerCase().includes(userSearchTerm.toLowerCase()))
  );

  const loadReportAccess = async (reportId: string) => {
    setLoadingAccess(true);
    try {
      const access = await getReportAccess(reportId);
      setReportAccess(access);
      setFormData(prev => ({
        ...prev,
        selectedGroups: access.groups.map(g => g.id_group),
        selectedUsers: access.specialUsers.map(u => u.id_user)
      }));
    } catch (error) {
      console.error('Error loading report access:', error);
    } finally {
      setLoadingAccess(false);
    }
  };

  const handleCreate = () => {
    setSelectedReport(null);
    setFormData({
      name: '',
      description: '',
      category: '',
      url: '',
      report_type: 'powerbi',
      workspace_id: '',
      powerbi_report_id: '',
      databricks_dashboard_id: '',
      databricks_workspace_id: '',
      image_url: '',
      status: 'activo',
      selectedGroups: [],
      selectedUsers: []
    });
    setReportAccess({ groups: [], specialUsers: [] });
    setShowPreview(false);
    setUserSearchTerm('');
    setGroupSearchTerm('');
    setIsDialogOpen(true);
  };

  const handleEdit = async (report: Report) => {
    setSelectedReport(report);
    setFormData({
      name: report.name,
      description: report.description || '',
      category: report.category || '',
      url: report.url || '',
      report_type: (report.report_type as 'powerbi' | 'databricks') || (report.databricks_dashboard_id ? 'databricks' : 'powerbi'),
      workspace_id: report.workspace_id || '',
      powerbi_report_id: report.powerbi_report_id || '',
      databricks_dashboard_id: report.databricks_dashboard_id || '',
      databricks_workspace_id: report.databricks_workspace_id || '',
      image_url: report.image_url || '',
      status: report.status as 'activo' | 'inactivo',
      selectedGroups: [],
      selectedUsers: []
    });
    setShowPreview(false);
    setUserSearchTerm('');
    setGroupSearchTerm('');
    setIsDialogOpen(true);
    await loadReportAccess(report.id_report);
  };

  const handleSave = async () => {
    console.log('handleSave called', {
      selectedReport,
      formData,
    });
    try {
      const finalUrl = formData.url || (formData.report_type === 'databricks' ? formData.databricks_dashboard_id : '');
      const reportPayload = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        url: finalUrl,
        report_type: formData.report_type,
        workspace_id: formData.workspace_id,
        powerbi_report_id: formData.powerbi_report_id,
        databricks_dashboard_id: formData.databricks_dashboard_id,
        databricks_workspace_id: formData.databricks_workspace_id,
        image_url: formData.image_url,
        status: formData.status
      };

      if (selectedReport) {
        await updateReport(selectedReport.id_report, reportPayload);
        await updateReportAccess(
          selectedReport.id_report,
          formData.selectedGroups,
          formData.selectedUsers
        );
      } else {
        const newReportId = await createReport(reportPayload);
        console.log('Antes del if updateReportAccess', {
          newReportId,
          selectedGroups: formData.selectedGroups,
          selectedUsers: formData.selectedUsers
        });
        if (newReportId && (formData.selectedGroups.length > 0 || formData.selectedUsers.length > 0)) {
          console.log('Dentro del if updateReportAccess', {
            newReportId,
            selectedGroups: formData.selectedGroups,
            selectedUsers: formData.selectedUsers
          });
          await updateReportAccess(
            newReportId,
            formData.selectedGroups,
            formData.selectedUsers
          );
        }
      }
      await refreshReports();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving report:', error);
    }
  };

  const handleDelete = async (reportId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este reporte?')) {
      await deleteReport(reportId);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Nombre',
      sortable: true,
      render: (value: string, report: Report) => (
        <div className="max-w-[200px] md:max-w-xs">
          <div className="truncate" title={value}>
            <div className="font-medium truncate">{value}</div>
            <div className="text-sm text-muted-foreground truncate" title={report.description || ''}>
              {report.description}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'groups',
      label: 'Grupos',
      render: (groups: Group[]) => {
        const groupNames = (groups ?? []).map(g => g.name).join(', ');
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
      key: 'status',
      label: 'Estado',
      sortable: true,
      className: 'text-center',
      render: (value: string) => (
        <div className="text-center">
          <Badge variant={value === 'activo' ? "default" : "secondary"}>
            {value === 'activo' ? "Activo" : "Inactivo"}
          </Badge>
        </div>
      )
    },
    {
      key: 'views',
      label: 'Visualizaciones',
      sortable: true,
      className: 'text-center',
      render: (value: number) => (
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <span>{value}</span>
          </div>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      className: 'text-center',
      render: (_: any, report: Report) => (
        <div className="text-center">
          <div className="flex justify-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`/report/${report.id_report}`, '_blank')}
              title="Ver reporte"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(report)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(report.id_report)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Cargando reportes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestión de Reportes</CardTitle>
              <CardDescription>
                Administra los reportes de BI y sus permisos de acceso
              </CardDescription>
            </div>
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Reporte
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <label htmlFor="groupFilter" className="text-sm font-medium mr-2">Grupo:</label>
                <select
                  id="groupFilter"
                  value={groupFilter}
                  onChange={e => setGroupFilter(e.target.value)}
                  className="pl-3 pr-8 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors shadow-sm"
                >
                  <option value="" className="bg-background text-foreground">Todos los grupos</option>
                  {groups.map(group => (
                    <option key={group.id_group} value={group.id_group} className="bg-background text-foreground">{group.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              Cargando reportes...
            </div>
          ) : (
            <DataTable
              data={reportsByGroup}
              columns={columns}
              searchPlaceholder="Buscar reportes por nombre o descripción..."
              itemsPerPage={10}
              maxHeight="500px"
              minWidth="900px"
            />
          )}
        </CardContent>
      </Card>

      {/* Modal para crear/editar reporte */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedReport ? 'Editar Reporte' : 'Nuevo Reporte'}
            </DialogTitle>
            <DialogDescription>
              {selectedReport ? 'Modifica los datos del reporte' : 'Crea un nuevo reporte de BI'}
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
                  placeholder="Nombre del reporte"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción del reporte"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Categoría</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Seleccionar categoría...</option>
                  <option value="General">General</option>
                  <option value="Confidencial">Confidencial</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="report_type">Plataforma / Proveedor de BI</Label>
                <select
                  id="report_type"
                  value={formData.report_type}
                  onChange={(e) => setFormData({ ...formData, report_type: e.target.value as 'powerbi' | 'databricks' })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="powerbi">Microsoft Power BI</option>
                  <option value="databricks">Databricks (AI/BI Dashboard)</option>
                </select>
              </div>

              {formData.report_type === 'powerbi' ? (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="url">URL Fabric / Power BI</Label>
                    <Input
                      id="url"
                      value={formData.url}
                      onChange={(e) => {
                        const url = e.target.value;
                        const workspaceRegex = /groups\/([a-f0-9-]{36})/;
                        const reportRegex = /reports\/([a-f0-9-]{36})/;

                        const workspaceId = url.match(workspaceRegex)?.[1];
                        const reportId = url.match(reportRegex)?.[1];

                        let finalUrl = url;
                        if (workspaceId && reportId && !url.includes('reportEmbed')) {
                          finalUrl = `https://app.powerbi.com/reportEmbed?reportId=${reportId}&groupId=${workspaceId}&autoAuth=true&ctid=${workspaceId}&embedding={ "experience": "power-bi" }`;
                        }

                        setFormData({
                          ...formData,
                          url: finalUrl,
                          workspace_id: workspaceId || formData.workspace_id,
                          powerbi_report_id: reportId || formData.powerbi_report_id
                        });
                      }}
                      placeholder="Pega la URL del reporte de Power BI..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="workspace_id">Workspace ID</Label>
                      <Input
                        id="workspace_id"
                        value={formData.workspace_id}
                        onChange={(e) => setFormData({ ...formData, workspace_id: e.target.value })}
                        placeholder="GUID del Workspace"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="powerbi_report_id">Report ID</Label>
                      <Input
                        id="powerbi_report_id"
                        value={formData.powerbi_report_id}
                        onChange={(e) => setFormData({ ...formData, powerbi_report_id: e.target.value })}
                        placeholder="GUID del Reporte"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="databricks_url">URL o Enlace del Dashboard en Databricks</Label>
                    <Input
                      id="databricks_url"
                      value={formData.url}
                      onChange={(e) => {
                        const val = e.target.value;
                        const dbMatch = val.match(/dashboardsv3\/([a-f0-9]+)/i);
                        // Workspace ID puede estar en ?o=NUMERO o en el subdominio adb-NUMERO.azuredatabricks.net
                        const wsMatch = val.match(/[?&]o=([0-9]+)/) || val.match(/adb-([0-9]+)\./);
                        const dashId = dbMatch ? dbMatch[1] : (val.length === 32 ? val : formData.databricks_dashboard_id);
                        const wsId = wsMatch ? wsMatch[1] : formData.databricks_workspace_id;

                        setFormData({
                          ...formData,
                          url: val,
                          databricks_dashboard_id: dashId || formData.databricks_dashboard_id,
                          databricks_workspace_id: wsId || formData.databricks_workspace_id
                        });
                      }}
                      placeholder="Pega la URL del dashboard de Databricks..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="databricks_dashboard_id">Dashboard ID *</Label>
                      <Input
                        id="databricks_dashboard_id"
                        value={formData.databricks_dashboard_id}
                        onChange={(e) => setFormData({ ...formData, databricks_dashboard_id: e.target.value })}
                        placeholder="Ej: 01f1ad47be7513e88d8437ca617cc4d7"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="databricks_workspace_id">Workspace ID (Opcional)</Label>
                      <Input
                        id="databricks_workspace_id"
                        value={formData.databricks_workspace_id}
                        onChange={(e) => setFormData({ ...formData, databricks_workspace_id: e.target.value })}
                        placeholder="Ej: 6036806974756844"
                      />
                    </div>
                  </div>
                </>
              )}
              <div className="grid gap-2">
                <Label htmlFor="image_url">URL de Imagen (Opcional)</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://ejemplo.com/imagen.png"
                />
              </div>
              <div className="grid gap-2">

                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    disabled={!formData.url}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {showPreview ? 'Ocultar Vista Previa' : 'Vista Previa'}
                  </Button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="status"
                  checked={formData.status === 'activo'}
                  onCheckedChange={(checked) => setFormData({ ...formData, status: checked ? 'activo' : 'inactivo' })}
                />
                <Label htmlFor="status">Reporte activo</Label>
              </div>
              <div className="grid gap-2">
                <Label>Grupos con Acceso</Label>
                {loadingAccess ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span className="text-sm">Cargando accesos...</span>
                  </div>
                ) : (
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

                    {formData.selectedGroups.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-2">
                          {formData.selectedGroups.map((groupId) => {
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
                                      selectedGroups: formData.selectedGroups.filter(id => id !== groupId)
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

                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {groups
                        .filter(group =>
                          !formData.selectedGroups.includes(group.id_group) &&
                          group.name.toLowerCase().includes(groupSearchTerm.toLowerCase())
                        )
                        .map((group) => (
                          <div
                            key={group.id_group}
                            className="flex items-center justify-between p-2 hover:bg-background rounded-sm cursor-pointer border border-transparent hover:border-border transition-colors group"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                selectedGroups: [...formData.selectedGroups, group.id_group]
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
                        !formData.selectedGroups.includes(group.id_group) &&
                        group.name.toLowerCase().includes(groupSearchTerm.toLowerCase())
                      ).length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-4 italic">
                            {groupSearchTerm ? `No hay más grupos que coincidan con "${groupSearchTerm}"` : 'Todos los grupos han sido seleccionados'}
                          </p>
                        )}
                    </div>
                  </div>
                )}
              </div>
              <div className="grid gap-2">
                <Label>Usuarios Individuales con Acceso</Label>
                <div className="border rounded-md p-3">
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Buscar usuarios..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {formData.selectedUsers.length > 0 && (
                    <div className="mb-3">
                      <h5 className="text-sm font-medium mb-2">Usuarios seleccionados:</h5>
                      <div className="flex flex-wrap gap-2">
                        {formData.selectedUsers.map((userId) => {
                          const user = users.find(u => u.id_user === userId);
                          return user ? (
                            <Badge
                              key={userId}
                              variant="secondary"
                              className="cursor-pointer"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  selectedUsers: formData.selectedUsers.filter(id => id !== userId)
                                });
                              }}
                            >
                              <User className="w-3 h-3 mr-1" />
                              {user.name} ✕
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                  <div className="max-h-32 overflow-y-auto">
                    {filteredUsers
                      .filter(user => !formData.selectedUsers.includes(user.id_user))
                      .map((user) => (
                        <div
                          key={user.id_user}
                          className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-sm cursor-pointer"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              selectedUsers: [...formData.selectedUsers, user.id_user]
                            });
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-medium">{user.name}</div>
                              <div className="text-xs text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    {filteredUsers.filter(user => !formData.selectedUsers.includes(user.id_user)).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {userSearchTerm ? `No se encontraron usuarios que coincidan con "${userSearchTerm}"` : 'Todos los usuarios han sido seleccionados'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {showPreview && (formData.url || formData.databricks_dashboard_id) && (
                <div className="grid gap-2">
                  <Label>Vista Previa del Reporte</Label>
                  <div className="border rounded-md overflow-hidden bg-muted/5 min-h-[400px]">
                    {formData.report_type === 'databricks' || formData.databricks_dashboard_id ? (
                      <DatabricksEmbed
                        dashboardId={formData.databricks_dashboard_id}
                        workspaceId={formData.databricks_workspace_id}
                        cssClassName="w-full h-[400px]"
                      />
                    ) : (
                      <PowerBIEmbed
                        workspaceId={formData.workspace_id}
                        powerbiReportId={formData.powerbi_report_id}
                        cssClassName="w-full h-[400px]"
                      />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Esta es una vista previa del reporte incrustado. Asegúrate de que las credenciales y el reporte sean accesibles.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {selectedReport ? 'Guardar Cambios' : 'Crear Reporte'}
              </Button>
            </DialogFooter>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReports;
