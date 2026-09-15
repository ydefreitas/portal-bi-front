import { useState, useEffect } from 'react';
import { useReports, AdminAccessRequest } from '@/hooks/useReports';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Clock, ExternalLink } from 'lucide-react';
import DataTable from './DataTable';

interface AdminAccessRequestsProps {
    currentUser: any;
}

const AdminAccessRequests = ({ currentUser }: AdminAccessRequestsProps) => {
    const { fetchAllAccessRequests, approveAccessRequest, rejectAccessRequest } = useReports();
    const [requests, setRequests] = useState<AdminAccessRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const loadRequests = async () => {
        setLoading(true);
        const data = await fetchAllAccessRequests();
        setRequests(data || []);
        setLoading(false);
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const handleApprove = async (requestId: string) => {
        if (!currentUser?.id) return;
        const success = await approveAccessRequest(requestId, currentUser.id);
        if (success) {
            loadRequests();
        }
    };

    const handleReject = async (requestId: string) => {
        if (!currentUser?.id) return;
        const success = await rejectAccessRequest(requestId, currentUser.id);
        if (success) {
            loadRequests();
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return (
                    <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200/50 hover:bg-amber-100/80">
                        <Clock className="w-3.5 h-3.5 mr-1.5" />
                        Pendiente
                    </Badge>
                );
            case 'approved':
                return (
                    <Badge variant="default" className="bg-green-600/90 hover:bg-green-600">
                        Aprobada
                    </Badge>
                );
            case 'denied':
                return (
                    <Badge variant="destructive" className="bg-destructive/90 hover:bg-destructive">
                        Denegada
                    </Badge>
                );
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const columns = [
        {
            key: 'requester_name',
            label: 'Usuario',
            sortable: true,
            render: (value: string, req: AdminAccessRequest) => (
                <div className="flex flex-col py-1">
                    <span className="font-medium text-foreground">{value}</span>
                    <span className="text-xs text-muted-foreground">{req.requester_email}</span>
                </div>
            )
        },
        {
            key: 'report_name',
            label: 'Reporte',
            sortable: true,
            render: (value: string) => (
                <div className="max-w-[220px] truncate font-medium text-muted-foreground" title={value}>
                    {value}
                </div>
            )
        },
        {
            key: 'request_date',
            label: 'Fecha Solicitud',
            sortable: true,
            render: (value: string) => {
                const date = new Date(value.endsWith('Z') ? value : value + 'Z');
                return (
                    <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="mr-1.5 h-3.5 w-3.5" />
                        {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                <div className="flex justify-center">
                    {getStatusBadge(value)}
                </div>
            )
        },
        {
            key: 'actions',
            label: 'Acciones',
            className: 'text-center',
            render: (_: any, req: AdminAccessRequest) => (
                <div className="flex justify-center gap-1">
                    {req.status === 'pending' ? (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-600/10"
                                onClick={() => handleApprove(req.access_request_id)}
                                title="Aprobar"
                            >
                                <Check className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                                onClick={() => handleReject(req.access_request_id)}
                                title="Rechazar"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                onClick={() => window.open(`/report/${req.report_id}`, '_blank')}
                                title="Ver reporte"
                            >
                                <ExternalLink className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Solicitudes de Acceso</CardTitle>
                    <CardDescription>
                        Administra y responde a las peticiones de acceso de los usuarios del sistema.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DataTable
                        data={requests}
                        columns={columns}
                        searchPlaceholder="Buscar por usuario o reporte..."
                        itemsPerPage={10}
                        maxHeight="500px"
                        minWidth="900px"
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminAccessRequests;
