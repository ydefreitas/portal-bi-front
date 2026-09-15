import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStats } from '@/hooks/useStats';
import DataTable from './DataTable';

// Custom Tooltip for Line Chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // Format date from YYYY-MM-DD to standard locale string or specific format
    let formattedDate = label;
    try {
      const dateStr = String(label).split('T')[0];
      const [year, month, day] = dateStr.split('-');
      formattedDate = `${day}-${month}-${year}`;
    } catch (e) {
      formattedDate = label;
    }

    return (
      <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold mb-1">{formattedDate}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: <span className="font-bold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const AdminStats = () => {
  const { stats, loading } = useStats();
  const [dateRange, setDateRange] = useState(7);

  // Logic to fill missing dates and handle range
  const chartData = useMemo(() => {
    if (!stats?.accessStats) return [];

    const data: { date: string; accesses: number }[] = [];
    const today = new Date();

    // Create map of existing data for O(1) lookup
    // Assuming backend returns formatted date string 'YYYY-MM-DD'
    const statsMap = new Map();
    stats.accessStats.forEach(item => {
      // Normalize date to YYYY-MM-DD just in case
      const dateKey = String(item.date).split('T')[0];
      statsMap.set(dateKey, item.count);
    });

    // Validar dateRange para evitar loop infinito si es undefined o 0
    const daysToLookBack = dateRange || 7;

    for (let i = daysToLookBack - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      data.push({
        date: dateStr,
        accesses: statsMap.get(dateStr) || 0
      });
    }

    return data;
  }, [stats?.accessStats, dateRange]);

  // Si loading o stats no está listo, mostrar loading
  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando estadísticas...</p>
      </div>
    );
  }

  // Configuración de columnas para tabla de usuarios
  const userColumns = [
    {
      key: 'name',
      label: 'Nombre',
      sortable: true,
      render: (value) => <div className="max-w-[150px] truncate" title={value}>{value || 'Sin nombre'}</div>
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (value) => <div className="max-w-[200px] truncate" title={value}>{value || 'Sin email'}</div>
    },
    {
      key: 'totalAccesses',
      label: 'Total Visualizaciones',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-primary">{value}</span>
      )
    },
    {
      key: 'lastAccess',
      label: 'Última Visualización',
      sortable: true,
      render: (value: string) => {
        if (!value) return '-';
        const date = new Date(value.endsWith('Z') ? value : value + 'Z');
        return (
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        );
      }
    }
  ];

  // Configuración de columnas para tabla de reportes
  const reportColumns = [
    {
      key: 'name',
      label: 'Nombre del Reporte',
      sortable: true,
      render: (value) => <div className="max-w-[250px] truncate" title={value}>{value}</div>
    },
    { key: 'category', label: 'Categoría', sortable: true },
    {
      key: 'totalViews',
      label: 'Total Visualizaciones',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-primary">{value}</span>
      )
    },
    {
      key: 'lastView',
      label: 'Última Visualización',
      sortable: true,
      render: (value: string) => {
        if (!value) return '-';
        const date = new Date(value.endsWith('Z') ? value : value + 'Z');
        return (
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        );
      }
    }
  ];



  // Valores por defecto defensivos para evitar errores si alguna propiedad falta
  const totalUsers = stats.totalUsers ?? 0;
  const totalGroups = stats.totalGroups ?? 0;
  const totalReports = stats.totalReports ?? 0;
  const totalVisualizations = stats.totalVisualizations ?? 0;
  const groupDistribution = (stats.groupDistribution ?? []).sort((a, b) => b.users - a.users);
  const top5GroupNames = groupDistribution.slice(0, 5).map(g => g.name);
  const usersData = stats.usersData ?? [];
  const reportsData = stats.reportsData ?? [];



  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">Usuarios activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Grupos</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z" />
                <path d="M8 5v6" />
                <path d="M16 5v6" />
              </svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGroups}</div>
            <p className="text-xs text-muted-foreground">Grupos creados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reportes</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
                <path d="M16 13H8" />
                <path d="M16 17H8" />
                <path d="M10 9H8" />
              </svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReports}</div>
            <p className="text-xs text-muted-foreground">Reportes activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visualizaciones</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVisualizations}</div>
            <p className="text-xs text-muted-foreground">Visualizaciones totales</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
        <Card className="col-span-1 overflow-hidden">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 gap-4">
            <div className="space-y-1">
              <CardTitle>Visualizaciones</CardTitle>
              <CardDescription>Últimos {dateRange} días</CardDescription>
            </div>
            <Select value={String(dateRange)} onValueChange={(v) => setDateRange(Number(v))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Seleccionar periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 días</SelectItem>
                <SelectItem value="15">15 días</SelectItem>
                <SelectItem value="30">30 días</SelectItem>
                <SelectItem value="90">90 días</SelectItem>
                <SelectItem value="360">360 días</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => {
                      if (!value) return '';
                      try {
                        const dateStr = String(value).split('T')[0];
                        const [year, month, day] = dateStr.split('-');
                        return `${day}-${month}`;
                      } catch (e) {
                        return value;
                      }
                    }}
                    minTickGap={30}
                  />
                  <YAxis width={40} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="accesses"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="Visualizaciones"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 overflow-hidden">
          <CardHeader>
            <CardTitle>Distribución por Grupos</CardTitle>
            <CardDescription>Número de usuarios por grupo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={groupDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={(props: any) => {
                      if (top5GroupNames.includes(props.name)) {
                        return (
                          <line
                            x1={props.points[0].x}
                            y1={props.points[0].y}
                            x2={props.points[1].x}
                            y2={props.points[1].y}
                            stroke={props.stroke}
                            fill="none"
                          />
                        );
                      }
                      return null;
                    }}
                    label={({ name, percent }) => {
                      if (top5GroupNames.includes(name)) {
                        return `${name} ${(percent * 100).toFixed(0)}%`;
                      }
                      return null;
                    }}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="users"
                  >
                    {groupDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 gap-6 min-w-0">
        <Card className="col-span-1 overflow-hidden">
          <CardHeader>
            <CardTitle>Total de Visualizaciones por Usuario</CardTitle>
            <CardDescription>Lista completa con búsqueda y ordenamiento</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={usersData}
              columns={userColumns}
              searchPlaceholder="Buscar usuarios..."
              itemsPerPage={8}
            />
          </CardContent>
        </Card>

        <Card className="col-span-1 overflow-hidden">
          <CardHeader>
            <CardTitle>Visualizaciones por Reporte</CardTitle>
            <CardDescription>Lista completa con búsqueda y ordenamiento</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={reportsData}
              columns={reportColumns}
              searchPlaceholder="Buscar reportes..."
              itemsPerPage={8}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminStats;