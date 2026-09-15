import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import AdminSidebar from './admin/AdminSidebar';
import AdminStats from './admin/AdminStats';
import AdminUsers from './admin/AdminUsers';
import AdminGroups from './admin/AdminGroups';
import AdminReports from './admin/AdminReports';
import AdminAccessRequests from './admin/AdminAccessRequests';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard } from 'lucide-react';
import Footer from './Footer';

interface AdminPanelProps {
  onLogout: () => void;
  currentUser: any;
}

const AdminPanel = ({ onLogout, currentUser }: AdminPanelProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Mock admin validation - replace with real auth later
  const isAdmin = currentUser?.role === 'admin' || true; // Always true for demo

  const getCurrentView = () => {
    const path = location.pathname;
    if (path.includes('/admin/users')) return 'users';
    if (path.includes('/admin/groups')) return 'groups';
    if (path.includes('/admin/reports')) return 'reports';
    if (path.includes('/admin/requests')) return 'requests';
    return 'stats';
  };

  const handleViewChange = (view: string) => {
    navigate(`/admin/${view === 'stats' ? '' : view}`);
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Acceso Denegado</h1>
          <p className="text-muted-foreground mb-6">No tienes permisos para acceder al panel de administración.</p>
          <Button onClick={handleGoToDashboard} variant="outline">
            Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }


  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background overflow-x-hidden">
        <AdminSidebar
          currentView={getCurrentView()}
          onViewChange={handleViewChange}
          onLogout={onLogout}
          currentUser={currentUser}
        />

        <main className="flex-1 p-6 min-w-0 flex flex-col">
          <div className="max-w-7xl mx-auto w-full">
            <header className="mb-8">
              <div className="flex items-center justify-end">
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-foreground">
                      {currentUser?.name || 'Administrador'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {currentUser?.email || 'admin@ejemplo.com'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleGoToDashboard}
                      className="gap-2 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span className="hidden md:inline">Dashboard</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onLogout}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-200"
                      title="Cerrar Sesión"
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </header>

            <Routes>
              <Route path="/" element={<AdminStats />} />
              <Route path="/users" element={<AdminUsers />} />
              <Route path="/groups" element={<AdminGroups />} />
              <Route path="/reports" element={<AdminReports />} />
              <Route path="/requests" element={<AdminAccessRequests currentUser={currentUser} />} />
            </Routes>
          </div>
          <div className="mt-16 mt-auto">
            <Footer />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminPanel;