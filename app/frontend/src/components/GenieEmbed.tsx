import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface GenieEmbedProps {
  reportId: string;
  genieSpaceId: string;
  cssClassName?: string;
  onError?: (error: string) => void;
}

const GenieEmbed: React.FC<GenieEmbedProps> = ({
  reportId,
  genieSpaceId,
  cssClassName,
  onError,
}) => {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchConfig = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const config = await api.get<any>(`/api/v1/reports/${reportId}/embed-config`);

        if (!isMounted) return;

        if (!config.instanceUrl) {
          throw new Error('No se pudo obtener la URL de Databricks para el agente Genie.');
        }

        // Construct the Genie Space iframe URL
        // Format: https://<databricks-instance>/published/genie/embedded/<genie_space_id>?o=<workspace_id>
        const baseUrl = config.instanceUrl.endsWith('/') ? config.instanceUrl.slice(0, -1) : config.instanceUrl;
        const workspaceParam = config.workspaceId ? `?o=${config.workspaceId}` : '';
        const fullUrl = `${baseUrl}/published/genie/embedded/${genieSpaceId}${workspaceParam}`;
        
        setEmbedUrl(fullUrl);
        setLoading(false);
      } catch (err: unknown) {
        console.error('[GenieEmbed] Initialization error:', err);
        const msg = err instanceof Error ? err.message : 'No se pudo inicializar el agente Genie';
        if (isMounted) {
          setErrorMsg(msg);
          setLoading(false);
          if (onError) onError(msg);
        }
      }
    };

    fetchConfig();

    return () => {
      isMounted = false;
    };
  }, [reportId, genieSpaceId, onError]);

  return (
    <div className={`relative w-full h-full min-h-[500px] ${cssClassName || ''}`}>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Conectando con Genie...</span>
        </div>
      )}

      {errorMsg && !loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/20 rounded-lg text-destructive p-6 text-center">
          <div className="max-w-md bg-card p-6 rounded-xl border shadow-sm">
            <p className="font-semibold text-base mb-2">Error al cargar el Agente Genie</p>
            <p className="text-sm text-muted-foreground break-words">{errorMsg}</p>
          </div>
        </div>
      )}

      {embedUrl && (
        <iframe
          src={embedUrl}
          allow="clipboard-write"
          className="w-full h-full min-h-[600px] rounded-lg border-0"
          title="Databricks Genie Agent"
        />
      )}
    </div>
  );
};

export default GenieEmbed;
