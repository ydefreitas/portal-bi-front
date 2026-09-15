import React, { useEffect, useState, useRef } from 'react';
import { DatabricksDashboard } from '@databricks/aibi-client';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';

interface DatabricksEmbedProps {
  reportId?: string;
  dashboardId?: string;
  workspaceId?: string;
  cssClassName?: string;
  onError?: (error: string) => void;
  onLastUpdateLoaded?: (date: string | null) => void;
}

interface DatabricksEmbedConfigResponse {
  provider?: string;
  accessToken: string;
  dashboardId: string;
  workspaceId?: string;
  instanceUrl: string;
  expiration: string;
  lastUpdate?: string | null;
}

const DatabricksEmbed: React.FC<DatabricksEmbedProps> = ({
  reportId,
  dashboardId,
  workspaceId,
  cssClassName,
  onError,
  onLastUpdateLoaded,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dashboardInstanceRef = useRef<DatabricksDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    let isMounted = true;

    const initDashboard = async () => {
      if (!reportId && !dashboardId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMsg(null);

        let endpoint = '';
        if (reportId) {
          endpoint = `/api/v1/reports/${reportId}/embed-config`;
        } else if (dashboardId) {
          endpoint = `/api/v1/reports/preview/embed-config?provider=databricks&dashboardId=${encodeURIComponent(dashboardId)}${workspaceId ? `&workspaceId=${encodeURIComponent(workspaceId)}` : ''}`;
        }

        console.log('[DatabricksEmbed] Fetching embed config from:', endpoint);
        const config = await api.get<DatabricksEmbedConfigResponse>(endpoint);

        if (!isMounted) return;

        if (!containerRef.current) {
          throw new Error('El contenedor del dashboard no está disponible');
        }

        // Cleanup any previous instance
        if (dashboardInstanceRef.current) {
          try {
            dashboardInstanceRef.current.destroy();
          } catch (e) {
            console.warn('[DatabricksEmbed] Error destroying previous instance:', e);
          }
          dashboardInstanceRef.current = null;
        }

        // Clear container content before initializing new instance
        containerRef.current.innerHTML = '';

        const scheme = resolvedTheme === 'dark' ? 'dark' : 'light';

        const dashboard = new DatabricksDashboard({
          instanceUrl: config.instanceUrl,
          workspaceId: config.workspaceId || '',
          dashboardId: config.dashboardId,
          token: config.accessToken,
          container: containerRef.current,
          colorScheme: scheme,
          config: {
            version: 1,
            hideDatabricksLogo: false,
          },
          getNewToken: async () => {
            console.log('[DatabricksEmbed] Token refresh requested by SDK');
            try {
              const refreshed = await api.get<DatabricksEmbedConfigResponse>(endpoint);
              return refreshed.accessToken;
            } catch (err) {
              console.error('[DatabricksEmbed] Failed to refresh token:', err);
              throw err;
            }
          },
        });

        dashboard.initialize();
        dashboardInstanceRef.current = dashboard;

        if (onLastUpdateLoaded) {
          onLastUpdateLoaded(config.lastUpdate || null);
        }

        setLoading(false);
      } catch (err: unknown) {
        console.error('[DatabricksEmbed] Initialization error:', err);
        const msg = err instanceof Error ? err.message : 'No se pudo inicializar el dashboard de Databricks';
        if (isMounted) {
          setErrorMsg(msg);
          setLoading(false);
          if (onError) onError(msg);
        }
      }
    };

    initDashboard();

    return () => {
      isMounted = false;
      if (dashboardInstanceRef.current) {
        try {
          dashboardInstanceRef.current.destroy();
        } catch (e) {
          console.warn('[DatabricksEmbed] Cleanup error:', e);
        }
        dashboardInstanceRef.current = null;
      }
    };
  }, [reportId, dashboardId, workspaceId, resolvedTheme, onError, onLastUpdateLoaded]);

  return (
    <div className={`relative w-full h-full min-h-[500px] ${cssClassName || ''}`}>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Cargando Databricks AI/BI Dashboard...</span>
        </div>
      )}

      {errorMsg && !loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/20 rounded-lg text-destructive p-6 text-center">
          <div className="max-w-md bg-card p-6 rounded-xl border shadow-sm">
            <p className="font-semibold text-base mb-2">Error al cargar el dashboard de Databricks</p>
            <p className="text-sm text-muted-foreground break-words">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Container for the Databricks dashboard iframe rendered by SDK */}
      <div
        ref={containerRef}
        id="databricks-dashboard-container"
        className="w-full h-full min-h-[600px] rounded-lg overflow-hidden [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0"
      />
    </div>
  );
};

export default DatabricksEmbed;
