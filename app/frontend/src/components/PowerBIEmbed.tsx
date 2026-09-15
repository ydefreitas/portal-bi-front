import React, { useEffect, useState, useRef, useCallback } from 'react';
import { models, Report } from 'powerbi-client';
import { PowerBIEmbed as PowerBIEmbedComponent } from 'powerbi-client-react';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface PowerBIEmbedProps {
  reportId?: string; // Internal database ID
  workspaceId?: string; // For preview mode
  powerbiReportId?: string; // For preview mode
  cssClassName?: string;
  // Deprecated/Ignored props for compatibility with ReportViewer temporarily
  reportUrl?: string;
  onError?: (error: string) => void;
  onLastUpdateLoaded?: (date: string | null) => void;
}

interface EmbedConfigResponse {
  accessToken: string;
  embedUrl: string;
  reportId: string;
  expiration: string;
  lastUpdate?: string | null;
}

const PowerBIEmbed: React.FC<PowerBIEmbedProps> = ({
  reportId,
  workspaceId,
  powerbiReportId,
  onError,
  onLastUpdateLoaded,
  cssClassName
}) => {
  const [embedConfig, setEmbedConfig] = useState<models.IReportEmbedConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [tokenExpiration, setTokenExpiration] = useState<string | null>(null);
  
  // Reference to the embedded report object to call setAccessToken
  const reportRef = useRef<Report | null>(null);

  // Function to refresh the embed token without reloading the report
  const refreshToken = useCallback(async () => {
    if (!reportId && (!workspaceId || !powerbiReportId)) return;
    
    try {
      let endpoint = '';
      if (reportId) {
        endpoint = `/api/v1/reports/${reportId}/embed-config`;
      } else if (workspaceId && powerbiReportId) {
        endpoint = `/api/v1/reports/preview/embed-config?workspaceId=${workspaceId}&reportId=${powerbiReportId}`;
      }

      if (!endpoint) return;

      console.log('[PowerBIEmbed] Refreshing token from:', endpoint);
      const config = await api.get<EmbedConfigResponse>(endpoint);
      
      if (reportRef.current && config.accessToken) {
        console.log('[PowerBIEmbed] Updating access token...');
        // This updates the token in the current session without reloading the iframe
        await reportRef.current.setAccessToken(config.accessToken);
        setTokenExpiration(config.expiration);
        console.log('[PowerBIEmbed] Token updated successfully. Next expiration:', config.expiration);
      }
    } catch (error) {
      console.error('[PowerBIEmbed] Failed to refresh token:', error);
    }
  }, [reportId, workspaceId, powerbiReportId]);

  // Initial configuration fetch
  useEffect(() => {
    let isMounted = true;

    const fetchConfig = async () => {
      // If no ID(s), we can't fetch config.
      if (!reportId && (!workspaceId || !powerbiReportId)) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMsg(null);

        // Fetch embed config from our backend
        let endpoint = '';

        if (reportId) {
          endpoint = `/api/v1/reports/${reportId}/embed-config`;
        } else if (workspaceId && powerbiReportId) {
          endpoint = `/api/v1/reports/preview/embed-config?workspaceId=${workspaceId}&reportId=${powerbiReportId}`;
        }

        if (!endpoint) {
          setLoading(false);
          return;
        }

        console.log('[PowerBIEmbed] Fetching initial config from:', endpoint);
        const config = await api.get<EmbedConfigResponse>(endpoint);

        if (!isMounted) return;

        console.log('[PowerBIEmbed] Config received, expiration:', config.expiration);
        
        setTokenExpiration(config.expiration);

        setEmbedConfig({
          type: 'report',
          id: config.reportId,
          embedUrl: config.embedUrl,
          accessToken: config.accessToken,
          tokenType: models.TokenType.Embed,
          settings: {
            panes: {
              filters: {
                visible: false
              },
              pageNavigation: {
                visible: true
              }
            },
            background: models.BackgroundType.Default,
          }
        });

        // Notify parent about last update date
        if (onLastUpdateLoaded) {
          onLastUpdateLoaded(config.lastUpdate || null);
        }
      } catch (error: unknown) {
        console.error('Error fetching embed config:', error);
        // Extract error message from API response if possible
        const msg = error instanceof Error ? error.message : 'No se pudo cargar la configuración del reporte';
        if (isMounted) {
          setErrorMsg(msg);
          if (onError) onError(msg);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchConfig();

    return () => { isMounted = false; };
  }, [reportId, workspaceId, powerbiReportId, onError, onLastUpdateLoaded]);

  // Effect to manage token refresh scheduling
  useEffect(() => {
    if (!tokenExpiration || !reportRef.current) return;

    // Calculate time until expiration
    const expirationDate = new Date(tokenExpiration);
    const now = new Date();
    
    // Schedule refresh 10 minutes before expiration
    // If the token is valid for 1 hour, we refresh at 50 minutes.
    const refreshThresholdMs = 10 * 60 * 1000;
    const timeUntilExpirationMs = expirationDate.getTime() - now.getTime();
    const refreshTimeMs = timeUntilExpirationMs - refreshThresholdMs;

    console.log(`[PowerBIEmbed] Token status: Expires in ${Math.round(timeUntilExpirationMs / 1000 / 60)}m. Refresh scheduled in ${Math.round(refreshTimeMs / 1000 / 60)}m.`);

    const timer = setTimeout(() => {
      refreshToken();
    }, Math.max(refreshTimeMs, 0));

    return () => clearTimeout(timer);
  }, [tokenExpiration, refreshToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[600px] w-full bg-muted/10 rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Cargando Power BI...</span>
      </div>
    );
  }

  if (errorMsg || !embedConfig) {
    return (
      <div className="flex items-center justify-center h-full min-h-[600px] w-full bg-muted/10 rounded-lg text-destructive p-4 text-center">
        <div>
          <p className="font-semibold mb-2">Error al cargar el reporte</p>
          <p className="text-sm">{errorMsg || 'No se pudo obtener la configuración de incrustación.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full min-h-[400px] ${cssClassName || ''}`}>
      <PowerBIEmbedComponent
        embedConfig={embedConfig}
        cssClassName="w-full h-full"
        getEmbeddedComponent={(embeddedReport) => {
          console.log('[PowerBIEmbed] Report instance captured');
          reportRef.current = embeddedReport as Report;
        }}
        eventHandlers={
          new Map([
            ['loaded', function () { console.log('Report loaded'); }],
            ['rendered', function () { console.log('Report rendered'); }],
            ['error', function (event: unknown) {
              const detail = (event as { detail: unknown })?.detail;
              console.error('Power BI Embed Error:', detail);
            }]
          ])
        }
      />
    </div>
  );
};

export default PowerBIEmbed;


