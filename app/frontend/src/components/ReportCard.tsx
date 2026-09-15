import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, FileText, Calendar, Heart, Lock, Clock } from 'lucide-react';
import React from 'react';

interface Report {
  id: string;
  name: string;
  description: string;
  group: string;
  thumbnail?: string | null;
  image_url?: string;
  workspaceId: string;
  hasAccess: boolean;
  lastAccessed?: string;
  updatedAt?: string;
  reportType?: 'powerbi' | 'databricks' | null;
}

interface ReportCardProps {
  report: Report;
  currentUser?: any;
  onViewReport: (reportId: string) => void;
  groupViews?: number;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
  requestStatus?: 'none' | 'pending' | 'approved' | 'denied';
}

const ReportCard = ({ 
  report, 
  currentUser, 
  onViewReport, 
  groupViews, 
  isFavorite, 
  onToggleFavorite,
  requestStatus = 'none'
}: ReportCardProps) => {
  const handleViewClick = () => {
    onViewReport(report.id);
  };

  const isDatabricks = report.reportType === 'databricks';

  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 h-full flex flex-col ${!report.hasAccess
      ? 'opacity-75 grayscale hover:grayscale-0 hover:opacity-100 border-dashed bg-muted/30'
      : isDatabricks
        ? 'hover:border-orange-500/50'
        : 'hover:border-primary/50'
      }`}>
      <CardHeader className="pb-3 flex-none">
        <div className="flex items-start justify-between">
          <Badge 
            variant="outline" 
            className="mb-2 bg-primary/5 text-primary border-primary/20 rounded-full px-3 font-semibold uppercase tracking-wider text-[10px]"
          >
            {report.group}
          </Badge>
          {report.hasAccess ? (
            onToggleFavorite && (
              <button
                onClick={onToggleFavorite}
                className="text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                title={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
              >
                <Heart className={`h-5 w-5 ${isFavorite ? "fill-primary text-primary" : ""}`} />
              </button>
            )
          ) : (
            <Lock className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <CardTitle className={`text-lg leading-tight transition-colors line-clamp-2 min-h-[3rem] ${
          isDatabricks ? 'group-hover:text-orange-500' : 'group-hover:text-primary'
        }`}>
          {report.name}
        </CardTitle>
        <CardDescription className="text-sm leading-relaxed line-clamp-2 min-h-[2.5rem]">
          {report.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="py-0 flex-grow">
        {/* Thumbnail preview */}
        <div className={`w-full h-32 rounded-lg mb-4 flex items-center justify-center transition-all duration-300 border ${
          isDatabricks
            ? 'bg-gradient-to-br from-orange-500/5 via-orange-500/10 to-red-500/20 group-hover:from-orange-500/15 group-hover:to-red-500/30 border-orange-500/20'
            : 'bg-gradient-to-br from-primary/5 via-primary/10 to-azure/20 group-hover:from-primary/10 group-hover:to-azure/30 border-primary/20'
        }`}>
          {report.thumbnail ? (
            <img
              src={report.thumbnail}
              alt={`Vista previa de ${report.name}`}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="text-center p-4">
              <div className="relative">
                {isDatabricks ? (
                  // Databricks icon
                  <svg className="h-12 w-12 text-orange-500/70 mx-auto mb-2 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1.5L2 7.25v9.5L12 22.5l10-5.75v-9.5L12 1.5zm0 2.31l7.5 4.32v8.76L12 20.19 4.5 16.69V7.93L12 3.61z"/>
                    <path d="M12 6l-5 2.88v5.24L12 17l5-2.88V8.88L12 6zm0 2.31l2.5 1.44v2.88L12 14.07l-2.5-1.44V9.75L12 8.31z"/>
                  </svg>
                ) : (
                  <FileText className="h-12 w-12 text-primary/60 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                )}
                <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse ${
                  isDatabricks ? 'bg-orange-500' : 'bg-azure'
                }`} />
              </div>
              <p className={`text-xs font-medium ${
                isDatabricks ? 'text-orange-500/90' : 'text-primary/80'
              }`}>{isDatabricks ? 'Databricks' : 'Power BI Report'}</p>
              <p className="text-xs text-muted-foreground mt-1">{report.group}</p>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="space-y-2 text-xs text-muted-foreground">
          {report.updatedAt && (
            <div className="flex items-center space-x-2">
              <Calendar className="h-3 w-3" />
              <span>Fecha última versión: {new Date(report.updatedAt).toLocaleDateString('es-ES')}</span>
            </div>
          )}

          {groupViews !== undefined && (
            <div className="flex items-center space-x-2">
              <Eye className="h-3 w-3 text-primary" />
              <span>{groupViews} visualizaciones</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-4 flex-none">
        <Button
          className={`w-full transition-all duration-300 ${!report.hasAccess
            ? 'bg-muted text-muted-foreground hover:bg-muted'
            : isDatabricks
              ? 'bg-card border-orange-500/30 group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500'
              : 'bg-card border-input group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary'
            }`}
          variant={!report.hasAccess ? "secondary" : "outline"}
          onClick={handleViewClick}
        >
          {!report.hasAccess ? (
            <>
              {requestStatus === 'pending' ? <Clock className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
              {requestStatus === 'pending' ? 'Solicitud Pendiente' : 'Solicitar Acceso'}
            </>
          ) : (
            <>
              <Eye className={`h-4 w-4 mr-2 transition-colors ${
                isDatabricks ? 'text-orange-500 group-hover:text-white' : 'text-primary group-hover:text-primary-foreground'
              }`} />
              Ver {isDatabricks ? 'Dashboard' : 'Reporte'}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ReportCard;