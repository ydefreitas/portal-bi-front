import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Maximize, Minimize, Shield, Loader2, AlertCircle, Heart } from 'lucide-react';
import AccessDenied from './AccessDenied';
import { useReports, type ReportWithGroups } from '@/hooks/useReports';
import { api } from '@/lib/api';
import PowerBIEmbed from './PowerBIEmbed';
import DatabricksEmbed from './DatabricksEmbed';
import GenieEmbed from './GenieEmbed';
import { useFavorites } from '@/hooks/useFavorites';
import Footer from './Footer';
import { ThemeToggle } from './ThemeToggle';
import { formatDate, formatVETime } from '@/lib/utils';
import { Calendar, Clock } from 'lucide-react';

interface ReportViewerProps {
  currentUser: any;
}

const ReportViewer = ({ currentUser }: ReportViewerProps) => {
  const { id: reportId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { reports, incrementViews, loading: reportsLoading } = useReports();
  const { isFavorite, toggleFavorite } = useFavorites(currentUser?.id);
  const [isFavorited, setIsFavorited] = useState(false);

  const [report, setReport] = useState<ReportWithGroups | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [accessTime, setAccessTime] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'genie'>('dashboard');

  const hasLoadedRef = useRef(false);

  useEffect(() => {
    const loadReport = async () => {
      // Wait for reports to load from the hook
      if (reportsLoading) return;

      if (!reportId || !currentUser?.id || reports.length === 0 || hasLoadedRef.current) {
        if (reports.length === 0 && !reportsLoading) {
          setError('No se pudieron cargar los reportes');
          setIsLoading(false);
        }
        return;
      }

      hasLoadedRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        console.log('[ReportViewer] Loading report:', reportId);
        // Find report from the reports loaded by useReports
        const foundReport = reports.find(r => r.id_report === reportId);

        if (!foundReport) {
          setError('Reporte no encontrado');
          setIsLoading(false);
          return;
        }

        setReport(foundReport);

        // Check access: Admin always has access
        let userHasAccess = false;

        if (currentUser.role === 'admin') {
          userHasAccess = true;
        } else {
          // Get user's groups using backend API
          console.log('[ReportViewer] Fetching groups for user:', currentUser.email);
          const userGroups = await api.get<any[]>(`/api/v1/groups/user/${encodeURIComponent(currentUser.email)}`);
          const userGroupIds = userGroups?.map(g => g.id_group) || [];

          // Check group access
          const hasGroupAccess = foundReport.groups.some(g =>
            userGroupIds.includes(g.id_group)
          );

          // Check special access using backend API
          console.log('[ReportViewer] Fetching special access for user:', currentUser.email);
          const specialAccess = await api.get<any[]>(`/api/v1/special-access/user/${encodeURIComponent(currentUser.email)}`);
          const hasSpecialAccess = specialAccess.some(sa => sa.id_report === reportId);

          userHasAccess = hasGroupAccess || hasSpecialAccess;
        }

        setHasAccess(userHasAccess);

        // If user has access, register access and increment views
        if (userHasAccess) {
          // Register access using backend API
          console.log('[ReportViewer] Logging access for user:', currentUser.id, 'report:', reportId);
          await api.post('/api/v1/users-access', {
            id_user: currentUser.id,
            id_report: reportId
          });

          // Increment views
          await incrementViews(reportId);

          // Capturar hora de acceso
          const { formatVETime } = await import('@/lib/utils');
          setAccessTime(formatVETime());
        }

      } catch (err) {
        setError('Error al cargar el reporte');
        console.error('Error loading report:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadReport();
  }, [reportId, currentUser?.id, currentUser?.email, reports, reportsLoading]);

  useEffect(() => {
    if (reportId) {
      setIsFavorited(isFavorite(reportId));
    }
  }, [reportId, isFavorite]);

  // Reset hasLoadedRef when reportId changes
  useEffect(() => {
    hasLoadedRef.current = false;
  }, [reportId]);

  // Fullscreen functionality
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      // Enter fullscreen
      const element = document.documentElement;
      if (element.requestFullscreen) {
        element.requestFullscreen().then(() => {
          setIsFullscreen(true);
        }).catch((err) => {
          console.error('Error entering fullscreen:', err);
        });
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        }).catch((err) => {
          console.error('Error exiting fullscreen:', err);
        });
      }
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Memoize callbacks to prevent PowerBIEmbed re-renders
  const handleReportError = useCallback((err: string) => {
    setError(err);
  }, []);

  const handleUpdateLoaded = useCallback((date: string | null) => {
    setLastUpdate(date);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex flex-col">
        <header className="border-b bg-card shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-9 w-24 bg-muted animate-pulse rounded-md" />
                <div className="h-6 w-px bg-border" />
                <div>
                  <div className="h-7 w-48 bg-muted animate-pulse rounded-md mb-2" />
                  <div className="h-4 w-32 bg-muted animate-pulse rounded-md" />
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-2 md:p-4">
          <div className="max-w-[1600px] mx-auto">
            <div className="w-full h-[calc(100vh-150px)] min-h-[700px] bg-card animate-pulse rounded-xl border shadow-lg" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error || !report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="text-center p-6">
            <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Error</h2>
            <p className="text-muted-foreground mb-4">
              {error || 'No se pudo cargar el reporte'}
            </p>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Access denied
  if (!hasAccess && !isLoading) {
    return (
      <AccessDenied
        reportName={report?.name || 'Reporte'}
        reportId={reportId}
        currentUser={currentUser}
        onBackToDashboard={() => navigate('/dashboard')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Header */}
      <header className="border-b bg-card shadow-sm sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="hover:bg-accent"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>

              <div className="h-6 w-px bg-border" />

              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <h1 className="text-xl font-bold line-clamp-1">{report?.name || 'Cargando...'}</h1>
                  {report?.groups[0] && (
                    <Badge 
                      variant="outline" 
                      className="hidden md:flex bg-primary/5 text-primary border-primary/20 rounded-full px-3 font-semibold uppercase tracking-wider text-[10px]"
                    >
                      {report.groups[0].name}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                  <span>Categoría: {report?.category || 'N/A'}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline">Usuario: {currentUser?.name}</span>
                  {lastUpdate && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <div className="flex items-center text-primary/80 font-medium">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>Data actualizada al: {formatDate(lastUpdate)}</span>
                      </div>
                    </>
                  )}
                  {accessTime && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <div className="flex items-center text-amber-600 font-medium">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>Acceso: {accessTime}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={() => reportId && toggleFavorite(reportId)}
                className={isFavorited ? "text-primary hover:text-primary/80" : ""}
              >
                <Heart className={`h-4 w-4 ${isFavorited ? "fill-primary" : ""}`} />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                disabled={!document.fullscreenEnabled}
                className="hidden sm:flex"
              >
                {isFullscreen ? (
                  <>
                    <Minimize className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <Maximize className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Genie / Dashboard Toggle */}
          {report?.databricks_genie_space_id && (
            <div className="flex justify-center border-t py-2">
              <div className="flex items-center space-x-2 bg-muted/50 p-1 rounded-lg">
                <Button
                  variant={activeView === 'dashboard' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('dashboard')}
                  className="rounded-md"
                >
                  <span className="font-semibold">Dashboard</span>
                </Button>
                <Button
                  variant={activeView === 'genie' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('genie')}
                  className="rounded-md"
                >
                  <span className="font-semibold">Agente Genie</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Report Content */}
      <main className="flex-1 p-2 md:p-4 transition-all duration-300">
        <div className="max-w-[1600px] mx-auto">
          <Card className="border shadow-lg overflow-hidden rounded-xl bg-card">
            <div className="w-full h-[calc(100vh-150px)] min-h-[700px]">
              {activeView === 'genie' && report?.databricks_genie_space_id ? (
                <GenieEmbed
                  reportId={reportId!}
                  genieSpaceId={report.databricks_genie_space_id}
                  onError={handleReportError}
                  cssClassName="w-full h-full"
                />
              ) : report?.report_type === 'databricks' || report?.databricks_dashboard_id ? (
                <DatabricksEmbed
                  reportId={reportId!}
                  onError={handleReportError}
                  onLastUpdateLoaded={handleUpdateLoaded}
                  cssClassName="w-full h-full"
                />
              ) : (
                <PowerBIEmbed
                  reportId={reportId!}
                  onError={handleReportError}
                  onLastUpdateLoaded={handleUpdateLoaded}
                  cssClassName="w-full h-full"
                />
              )}
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ReportViewer;