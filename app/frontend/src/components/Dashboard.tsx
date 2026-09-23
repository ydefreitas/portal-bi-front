import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, BarChart3, Users, Eye, LogOut, Settings, Loader2, Lock, Heart, FileText, Database, FileSpreadsheet, ExternalLink, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import ReportCard from './ReportCard';
import ReportSkeleton from './ReportSkeleton';
import { useReports } from '@/hooks/useReports';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import Footer from './Footer';
import { ThemeToggle } from './ThemeToggle';

interface DashboardProps {
  onLogout: () => void;
  onGoToAdmin?: () => void;
  currentUser?: any;
}

interface ReportAccess {
  hasAccess: boolean;
  reason: 'admin' | 'group' | 'special' | 'none';
}

const Dashboard = ({ onLogout, onGoToAdmin, currentUser }: DashboardProps) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [userGroupIds, setUserGroupIds] = useState<string[]>([]);
  const [specialAccessReportIds, setSpecialAccessReportIds] = useState<string[]>([]);
  const [userRequests, setUserRequests] = useState<any[]>([]);
  const [reportsAccess, setReportsAccess] = useState<Record<string, ReportAccess>>({});
  const [userStats, setUserStats] = useState<{ total_accesses: number; last_access: string | null; pending_requests: number }>({
    total_accesses: 0,
    last_access: null,
    pending_requests: 0
  });
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [databricksCollapsed, setDatabricksCollapsed] = useState(false);
  const [powerbiCollapsed, setPowerbiCollapsed] = useState(false);
  
  // Pagination state
  const [databricksPage, setDatabricksPage] = useState(1);
  const [powerbiPage, setPowerbiPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const { reports, loading: reportsLoading, fetchUserAccessRequests } = useReports();
  const { logUserAccess } = useAuth();
  const { favorites, toggleFavorite, isFavorite } = useFavorites(currentUser?.id);

  // Legacy access logging removed - now handled per report in ReportViewer

  // Fetch user's access and stats in parallel on mount
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!currentUser?.id || !currentUser?.email) {
        console.warn('[Dashboard] Current user ID or email missing, skipping data load');
        return;
      }

      try {
        setIsDataLoading(true);
        console.log('[Dashboard] Fetching groups, special access, requests and stats in parallel...');
        
        const [groups, specialAccess, requests, stats, pendingCountData] = await Promise.all([
          api.get<any[]>(`/api/v1/groups/user/${encodeURIComponent(currentUser.email)}`),
          api.get<any[]>(`/api/v1/special-access/user/${encodeURIComponent(currentUser.email)}`),
          fetchUserAccessRequests(currentUser.id),
          api.get<any>(`/api/v1/personal-stats/${currentUser.id}`),
          api.get<{ count: number }>(
            currentUser.role === 'admin'
              ? '/api/v1/access-requests/pending-count'
              : `/api/v1/access-requests/pending-count/${currentUser.id}`
          ).catch(e => {
            console.error('[Dashboard] Error fetching pending count:', e);
            return { count: 0 };
          })
        ]);

        console.log('[Dashboard] Data fetched in parallel:', { groups, specialAccess, requests, stats, pendingCountData });
        
        setUserGroupIds(groups.map(g => g.id_group));
        setSpecialAccessReportIds(specialAccess.map(sa => sa.id_report));
        setUserRequests(requests);
        setUserStats({
          ...stats,
          pending_requests: pendingCountData.count
        });
      } catch (error) {
        console.error('[Dashboard] Error loading dashboard data in parallel:', error);
      } finally {
        setIsDataLoading(false);
      }
    };

    loadDashboardData();
  }, [currentUser?.id, currentUser?.email, currentUser?.role]);

  // Debug logs for current state
  useEffect(() => {
    console.log('[Dashboard] State:', {
      currentUser,
      reportsCount: reports.length,
      reportsLoading,
      userGroupIds,
      specialAccessReportIds,
      reportsAccess
    });
  }, [currentUser, reports, reportsLoading, userGroupIds, specialAccessReportIds, reportsAccess]);

  // Check access for each report
  useEffect(() => {
    const checkAccess = () => {
      const access: Record<string, ReportAccess> = {};

      reports.forEach(report => {
        // Check if user is admin
        if (currentUser?.role === 'admin') {
          access[report.id_report] = { hasAccess: true, reason: 'admin' };
          return;
        }

        // Check group access
        const hasGroupAccess = report.groups?.some((g: any) =>
          userGroupIds.includes(g.id_group)
        );

        if (hasGroupAccess) {
          access[report.id_report] = { hasAccess: true, reason: 'group' };
          return;
        }

        // Check special access
        const hasSpecialAccess = specialAccessReportIds.includes(report.id_report);

        if (hasSpecialAccess) {
          access[report.id_report] = { hasAccess: true, reason: 'special' };
          return;
        }

        access[report.id_report] = { hasAccess: false, reason: 'none' };
      });

      setReportsAccess(access);
    };

    if (reports.length > 0) {
      checkAccess();
    }
  }, [reports, currentUser, userGroupIds, specialAccessReportIds]);

  // Get unique group names from reports user has access to
  const availableGroups = useMemo(() => {
    const groupNames = new Set<string>();
    reports.forEach(report => {
      const access = reportsAccess[report.id_report];
      if (access?.hasAccess) {
        report.groups?.forEach((g: any) => groupNames.add(g.name));
      }
    });
    return Array.from(groupNames).sort();
  }, [reports, reportsAccess]);

  // Filter reports by search term and selected group
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const access = reportsAccess[report.id_report];
      if (!access?.hasAccess || report.status !== 'activo') {
        return false;
      }

      const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (report.description || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesGroup = selectedGroup === 'all' ||
        report.groups?.some((g: any) => g.name === selectedGroup);

      return matchesSearch && matchesGroup;
    });
  }, [searchTerm, selectedGroup, reports, reportsAccess]);

  const inaccessibleReports = useMemo(() => {
    const inaccessible = reports.filter(report => {
      const access = reportsAccess[report.id_report];
      // Include only reports where user DOES NOT have access
      if (access?.hasAccess) {
        return false;
      }
      
      // EXCLUSION: Don't show 'Confidencial' reports to users without access
      if (report.category === 'Confidencial') {
        return false;
      }

      // Also apply filters to these reports
      const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (report.description || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesGroup = selectedGroup === 'all' ||
        report.groups?.some((g: any) => g.name === selectedGroup);

      return matchesSearch && matchesGroup;
    });
    return inaccessible;
  }, [searchTerm, selectedGroup, reports, reportsAccess]);

  const favoriteReports = useMemo(() => {
    return filteredReports.filter(report => isFavorite(report.id_report));
  }, [filteredReports, isFavorite]);

  // Split accessible filtered reports by provider
  const databricksReports = useMemo(() => {
    return filteredReports.filter(r => r.report_type === 'databricks' || r.databricks_dashboard_id);
  }, [filteredReports]);

  const powerbiReports = useMemo(() => {
    return filteredReports.filter(r => r.report_type !== 'databricks' && !r.databricks_dashboard_id);
  }, [filteredReports]);

  // Reset pagination when search or filter changes
  useEffect(() => {
    setDatabricksPage(1);
    setPowerbiPage(1);
  }, [searchTerm, selectedGroup]);

  // Paginated arrays
  const paginatedDatabricks = useMemo(() => {
    const startIndex = (databricksPage - 1) * ITEMS_PER_PAGE;
    return databricksReports.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [databricksReports, databricksPage]);

  const paginatedPowerbi = useMemo(() => {
    const startIndex = (powerbiPage - 1) * ITEMS_PER_PAGE;
    return powerbiReports.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [powerbiReports, powerbiPage]);

  const totalDatabricksPages = Math.ceil(databricksReports.length / ITEMS_PER_PAGE);
  const totalPowerbiPages = Math.ceil(powerbiReports.length / ITEMS_PER_PAGE);

  const isFiltering = searchTerm.trim() !== '' || selectedGroup !== 'all';


  const handleViewReport = (reportId: string) => {
    navigate(`/report/${reportId}`);
  };

  const isLoading = reportsLoading || isDataLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <img src="/lovable-uploads/c61755bb-3089-411c-9aa2-614ec102b621.png" alt="Portal de Datos" className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Portal de Datos</h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium">{currentUser?.name || 'Usuario'}</p>
                <p className="text-xs text-muted-foreground">{currentUser?.email || ''}</p>
              </div>
              {currentUser?.role === 'admin' && (
                <Button
                  variant="outline"
                  onClick={() => navigate('/admin')}
                  className="gap-2"
                >
                  <Settings className="w-4 h-4 text-primary" />
                  Panel Admin
                </Button>
              )}
              <ThemeToggle />
              <Button variant="ghost" size="sm" onClick={onLogout}>
                <LogOut className="h-4 w-4 text-primary" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Bienvenido, {currentUser?.name?.split(' ')[0] || 'Usuario'}
            </h2>
            <p className="text-muted-foreground">
              Tu centro estratégico para la visualización y gestión centralizada de datos
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className="group gap-2 bg-card border-input hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 shadow-sm"
              onClick={() => window.open('https://svprdsql01.simple.com.ve/Reports/browse/', '_blank')}
            >
              <Database className="w-4 h-4 text-primary group-hover:text-primary-foreground transition-colors" />
              <span>Reportes Operativos</span>
            </Button>
            <Button
              variant="outline"
              className="group gap-2 bg-card border-input hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 shadow-sm"
              onClick={() => window.open('https://simplevzla.sharepoint.com/:x:/r/sites/Arquitectura-Datos/_layouts/15/Doc.aspx?sourcedoc=%7BC53251B7-708C-41B7-A67F-80706692FAE8%7D&file=Catalogo_Dashboard_PowerBI_2026.xlsx&action=default&mobileredirect=true', '_blank')}
            >
              <FileSpreadsheet className="w-4 h-4 text-primary group-hover:text-primary-foreground transition-colors" />
              <span>Catálogo Dashboards</span>
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-primary" />
              <Input
                placeholder="Buscar reportes..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-primary" />
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por grupo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los grupos</SelectItem>
                  {availableGroups.map(group => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card p-6 rounded-lg border">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredReports.length}</p>
                <p className="text-sm text-muted-foreground">Reportes Disponibles</p>
              </div>
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg border">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-azure/10 rounded-lg">
                <Users className="h-6 w-6 text-azure" />
              </div>
              <div>
                <p className="text-2xl font-bold">{availableGroups.length}</p>
                <p className="text-sm text-muted-foreground">Grupos Totales</p>
              </div>
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg border">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {userStats.total_accesses}
                </p>
                <p className="text-sm text-muted-foreground">Mis Visualizaciones</p>
              </div>
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg border">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {userStats.pending_requests}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentUser?.role === 'admin' ? 'Pendientes Admin' : 'Mis Solicitudes'}
                </p>
              </div>
            </div>
          </div>
        </div>



        {/* Favorite Reports Section - Only show if not filtering */}
        {!isFiltering && (
          <div className="mb-8 pl-1">
            <h3 className="text-xl font-semibold w-full border-b pb-2 mb-4 text-foreground flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Reportes Favoritos
            </h3>
            {favoriteReports.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoriteReports.map(report => {
                  const request = userRequests.find(r => r.report_id === report.id_report);
                  return (
                    <ReportCard
                      key={report.id_report}
                      report={{
                        id: report.id_report,
                        name: report.name,
                        description: report.description || '',
                        group: report.groups?.[0]?.name || report.category || 'Sin grupo',
                        thumbnail: report.image_url,
                        workspaceId: report.url || '',
                        hasAccess: reportsAccess[report.id_report]?.hasAccess || false,
                        lastAccessed: report.last_view_date || undefined,
                        updatedAt: report.creation_date,
                        reportType: report.report_type || (report.databricks_dashboard_id ? 'databricks' : 'powerbi')
                      }}
                      requestStatus={request?.status || 'none'}
                      currentUser={currentUser}
                      onViewReport={handleViewReport}
                      groupViews={report.views}
                      isFavorite={true}
                      onToggleFavorite={(e) => {
                        e.stopPropagation();
                        toggleFavorite(report.id_report);
                      }}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Aún no tienes reportes favoritos.</h3>
                <p className="text-xs text-muted-foreground mt-1">¡Da me gusta a los reportes para verlos aquí!</p>
              </div>
            )}
          </div>
        )}

        {/* Reports Grid */}
        {filteredReports.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold w-full border-b pb-2 text-foreground flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {searchTerm || selectedGroup !== 'all'
                  ? `Resultados (${filteredReports.length})`
                  : 'Mis Reportes'
                }
              </h3>
            </div>

            {/* Databricks & Power BI Subsections */}
            <div className="pl-4 md:pl-6 space-y-6">
              {/* Databricks Section — first */}
              {databricksReports.length > 0 && (
                <div>
                  <button
                    onClick={() => setDatabricksCollapsed(c => !c)}
                    className="w-full flex items-center gap-2 mb-4 border-b border-border/70 pb-2 group text-left"
                  >
                    <Database className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    <h4 className="text-lg font-semibold text-foreground flex-1">
                      Databricks
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        ({databricksReports.length} {databricksReports.length === 1 ? 'dashboard' : 'dashboards'})
                      </span>
                    </h4>
                    {databricksCollapsed
                      ? <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      : <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    }
                  </button>
                  {!databricksCollapsed && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {isLoading
                          ? Array.from({ length: 3 }).map((_, i) => <ReportSkeleton key={i} />)
                          : paginatedDatabricks.map(report => {
                              const request = userRequests.find(r => r.report_id === report.id_report);
                              return (
                              <ReportCard
                                key={report.id_report}
                                report={{
                                  id: report.id_report,
                                  name: report.name,
                                  description: report.description || '',
                                  group: report.groups?.[0]?.name || report.category || 'Sin grupo',
                                  thumbnail: report.image_url,
                                  workspaceId: report.url || '',
                                  hasAccess: reportsAccess[report.id_report]?.hasAccess || false,
                                  lastAccessed: report.last_view_date || undefined,
                                  updatedAt: report.creation_date,
                                  reportType: 'databricks'
                                }}
                                requestStatus={request?.status || 'none'}
                                currentUser={currentUser}
                                onViewReport={handleViewReport}
                                groupViews={report.views}
                                isFavorite={isFavorite(report.id_report)}
                                onToggleFavorite={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(report.id_report);
                                }}
                              />
                            );
                          })
                      }
                      </div>
                      {totalDatabricksPages > 1 && (
                        <div className="flex justify-center items-center mt-6 space-x-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDatabricksPage(p => Math.max(1, p - 1))}
                            disabled={databricksPage === 1}
                          >
                            Anterior
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            Página {databricksPage} de {totalDatabricksPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDatabricksPage(p => Math.min(totalDatabricksPages, p + 1))}
                            disabled={databricksPage === totalDatabricksPages}
                          >
                            Siguiente
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Power BI Section */}
              {powerbiReports.length > 0 && (
                <div>
                  <button
                    onClick={() => setPowerbiCollapsed(c => !c)}
                    className="w-full flex items-center gap-2 mb-4 border-b border-border/70 pb-2 group text-left"
                  >
                    <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 1200 1600" fill="none">
                      <defs>
                        <linearGradient id="pbi_paint0" x1="650" y1="0" x2="1200" y2="1600" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#E6AD10" />
                          <stop offset="1" stopColor="#C87E0E" />
                        </linearGradient>
                        <linearGradient id="pbi_paint1" x1="325" y1="400" x2="875" y2="1600" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#F6D751" />
                          <stop offset="1" stopColor="#E6AD10" />
                        </linearGradient>
                        <linearGradient id="pbi_paint2" x1="0" y1="800" x2="550" y2="1600" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#F9E589" />
                          <stop offset="1" stopColor="#F6D751" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 1200,66.75 v 1466.5 c 0,36.86 -29.89,66.75 -66.75,66.75 H 716.75 C 679.885,1600 650,1570.11 650,1533.25 V 66.75 C 650,29.885 679.885,0 716.75,0 h 416.5 c 36.87,0 66.75,29.8849 66.75,66.75 z"
                        fill="url(#pbi_paint0)"
                      />
                      <path
                        d="M 875,466.667 V 1600 H 325 V 466.667 C 325,429.848 354.848,400 391.667,400 h 416.663 c 36.82,0 66.67,29.848 66.67,66.667 z"
                        fill="url(#pbi_paint1)"
                      />
                      <path
                        d="m 0,866.667 v 666.663 c 0,36.82 29.848,66.67 66.667,66.67 H 550 V 866.667 C 550,829.848 520.152,800 483.333,800 H 66.667 C 29.848,800 0,829.848 0,866.667 Z"
                        fill="url(#pbi_paint2)"
                      />
                    </svg>
                    <h4 className="text-lg font-semibold text-foreground flex-1">
                      Power BI
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        ({powerbiReports.length} {powerbiReports.length === 1 ? 'reporte' : 'reportes'})
                      </span>
                    </h4>
                    {powerbiCollapsed
                      ? <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      : <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    }
                  </button>
                  {!powerbiCollapsed && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {isLoading
                          ? Array.from({ length: 3 }).map((_, i) => <ReportSkeleton key={i} />)
                          : paginatedPowerbi.map(report => {
                              const request = userRequests.find(r => r.report_id === report.id_report);
                              return (
                              <ReportCard
                                key={report.id_report}
                                report={{
                                  id: report.id_report,
                                  name: report.name,
                                  description: report.description || '',
                                  group: report.groups?.[0]?.name || report.category || 'Sin grupo',
                                  thumbnail: report.image_url,
                                  workspaceId: report.url || '',
                                  hasAccess: reportsAccess[report.id_report]?.hasAccess || false,
                                  lastAccessed: report.last_view_date || undefined,
                                  updatedAt: report.creation_date,
                                  reportType: 'powerbi'
                                }}
                                requestStatus={request?.status || 'none'}
                                currentUser={currentUser}
                                onViewReport={handleViewReport}
                                groupViews={report.views}
                                isFavorite={isFavorite(report.id_report)}
                                onToggleFavorite={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(report.id_report);
                                }}
                              />
                            );
                          })
                      }
                      </div>
                      {totalPowerbiPages > 1 && (
                        <div className="flex justify-center items-center mt-6 space-x-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPowerbiPage(p => Math.max(1, p - 1))}
                            disabled={powerbiPage === 1}
                          >
                            Anterior
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            Página {powerbiPage} de {totalPowerbiPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPowerbiPage(p => Math.min(totalPowerbiPages, p + 1))}
                            disabled={powerbiPage === totalPowerbiPages}
                          >
                            Siguiente
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Empty state */}
            {!isLoading && powerbiReports.length === 0 && databricksReports.length === 0 && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No se encontraron reportes</h3>
                <p className="text-muted-foreground">Intenta ajustar tus filtros o términos de búsqueda</p>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-between mb-4">
            <h3 className="text-xl font-semibold w-full border-b pb-2 text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {searchTerm || selectedGroup !== 'all'
                ? `Resultados (${filteredReports.length})`
                : 'Mis Reportes'
              }
            </h3>
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No se encontraron reportes</h3>
              <p className="text-muted-foreground">
                Intenta ajustar tus filtros o términos de búsqueda
              </p>
            </div>
          </div>
        )}

        {/* More Reports Section (Inaccessible) */}
        {inaccessibleReports.length > 0 && (
          <div className="mt-8 pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold w-full border-b pb-2 text-foreground flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Más Reportes (Sin Acceso)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75 hover:opacity-100 transition-opacity">
              {inaccessibleReports.map(report => {
                const request = userRequests.find(r => r.report_id === report.id_report);
                return (
                  <ReportCard
                    key={report.id_report}
                    report={{
                      id: report.id_report,
                      name: report.name,
                      description: report.description || '',
                      group: report.groups?.[0]?.name || report.category || 'Sin grupo',
                      thumbnail: report.image_url,
                      workspaceId: report.url || '',
                      hasAccess: false,
                      lastAccessed: undefined,
                      updatedAt: report.creation_date,
                      reportType: report.report_type || (report.databricks_dashboard_id ? 'databricks' : 'powerbi')
                    }}
                    requestStatus={request?.status || 'none'}
                    currentUser={currentUser}
                    onViewReport={handleViewReport}
                    groupViews={report.views}
                    isFavorite={isFavorite(report.id_report)}
                    onToggleFavorite={(e) => {
                      e.stopPropagation();
                      toggleFavorite(report.id_report);
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;