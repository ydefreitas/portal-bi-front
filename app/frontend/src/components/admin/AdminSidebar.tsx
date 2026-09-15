import { BarChart3, Users, FolderOpen, FileText, LogOut, Settings } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

interface AdminSidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
  currentUser: any;
}

const menuItems = [
  { id: 'stats', title: 'Estadísticas', icon: BarChart3 },
  { id: 'users', title: 'Usuarios', icon: Users },
  { id: 'groups', title: 'Grupos', icon: FolderOpen },
  { id: 'reports', title: 'Reportes', icon: FileText },
  { id: 'requests', title: 'Solicitudes', icon: clockIcon },
];

// Helper to keep icon imports clean
import { Clock as clockIcon } from 'lucide-react';

const AdminSidebar = ({ currentView, onViewChange, onLogout, currentUser }: AdminSidebarProps) => {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <Sidebar
      className={`transition-all duration-300 ${collapsed ? 'w-14' : 'w-64'}`}
      collapsible="icon"
    >
      <SidebarContent>
        {/* Logo/Brand */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <Settings className="w-4 h-4 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <h2 className="font-semibold text-sidebar-foreground truncate">Admin Panel</h2>
                <p className="text-xs text-sidebar-foreground/60 truncate">Portal de Datos</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Gestión</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onViewChange(item.id)}
                    isActive={currentView === item.id}
                    className={`w-full transition-all duration-200 ${collapsed ? 'justify-center px-2' : 'justify-start'}`}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    {!collapsed && <span className="ml-2">{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Info */}
        <div className="mt-auto p-4 border-t border-sidebar-border">
          {!collapsed ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-primary">
                    {currentUser?.name?.[0] || 'A'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {currentUser?.name || 'Administrador'}
                  </p>
                  <p className="text-xs text-sidebar-foreground/60 truncate">
                    {currentUser?.email || 'admin@ejemplo.com'}
                  </p>
                </div>
              </div>
              <SidebarMenuButton
                onClick={onLogout}
                className="w-full justify-start gap-2 text-sidebar-foreground/80 hover:text-sidebar-foreground h-9"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                <span>Cerrar Sesión</span>
              </SidebarMenuButton>
            </>
          ) : (
            <SidebarMenuButton
              onClick={onLogout}
              className="w-full justify-center"
              tooltip="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
            </SidebarMenuButton>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
};

export default AdminSidebar;