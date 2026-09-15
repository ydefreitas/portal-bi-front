import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldX, ArrowLeft, AlertTriangle, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useReports } from '@/hooks/useReports';
import { useToast } from '@/hooks/use-toast';

interface AccessDeniedProps {
  reportName?: string;
  reportId?: string;
  currentUser?: any;
  onBackToDashboard: () => void;
}

const AccessDenied = ({ reportName, reportId, currentUser, onBackToDashboard }: AccessDeniedProps) => {
  const { createAccessRequest, checkAccessRequestStatus } = useReports();
  const [requestStatus, setRequestStatus] = React.useState<'none' | 'pending' | 'approved' | 'denied'>('none');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = React.useState(true);

  React.useEffect(() => {
    const getStatus = async () => {
      if (reportId && currentUser?.id) {
        setIsLoadingStatus(true);
        const status = await checkAccessRequestStatus(reportId, currentUser.id);
        if (status.found && status.status) {
          setRequestStatus(status.status);
        }
        setIsLoadingStatus(false);
      } else {
        setIsLoadingStatus(false);
      }
    };
    getStatus();
  }, [reportId, currentUser?.id]);

  const handleRequestAccess = async () => {
    if (!reportId || !currentUser?.id) return;

    setIsSubmitting(true);
    const success = await createAccessRequest(reportId, currentUser.id);
    if (success) {
      setRequestStatus('pending');
    }
    setIsSubmitting(false);
  };

  const getStatusDisplay = () => {
    switch (requestStatus) {
      case 'pending':
        return (
          <div className="bg-muted/50 border border-amber-200/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-center space-x-2 text-sm">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="font-medium">Solicitud Pendiente</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Tu solicitud de acceso está siendo revisada por un administrador.
            </p>
          </div>
        );
      case 'approved':
        return (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-center space-x-2 text-sm text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Acceso Revocado</span>
            </div>
            <p className="text-sm text-amber-600">
              Tu acceso parece haber sido revocado o ha expirado. Puedes solicitarlo de nuevo a continuación.
            </p>
          </div>
        );
      case 'denied':
        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-center space-x-2 text-sm text-red-700">
              <XCircle className="h-4 w-4" />
              <span className="font-medium">Solicitud Denegada</span>
            </div>
            <p className="text-sm text-red-600">
              Lo sentimos, tu solicitud de acceso anterior fue denegada. Puedes intentar solicitarlo de nuevo.
            </p>
          </div>
        );
      default:
        return (
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-center space-x-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="font-medium">¿Necesitas acceso?</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Puedes solicitar permisos para visualizar este reporte
            </p>
          </div>
        );
    }
  };
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-destructive/10 rounded-full">
              <ShieldX className="h-12 w-12 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl">Acceso Denegado</CardTitle>
        </CardHeader>

        <CardContent className="text-center space-y-6">
          <div className="space-y-2">
            <p className="text-muted-foreground">
              No tienes permisos para acceder a este reporte
              {reportName && (
                <>
                  :<br />
                  <span className="font-medium text-foreground">"{reportName}"</span>
                </>
              )}
            </p>
          </div>

          {getStatusDisplay()}

          <div className="space-y-3">
            <Button
              onClick={onBackToDashboard}
              className="w-full"
              size="lg"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleRequestAccess}
              disabled={requestStatus === 'pending' || isSubmitting || isLoadingStatus}
            >
              {isSubmitting ? 'Enviando...' : requestStatus === 'pending' ? 'Solicitud Pendiente' : 'Solicitar Acceso'}
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Si crees que esto es un error, verifica que tengas los permisos correctos
              o contacta al departamento de TI.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessDenied;