import { useMemo } from 'react';
// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import ReportViewer from "./components/ReportViewer";
import AdminPanel from "./components/AdminPanel";
import NotFound from "./pages/NotFound";
import { AzureAuthProviderWrapper, useAuth } from "./hooks/useAuth";
import { ThemeProvider } from "./components/ThemeProvider";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user, profile, loading, signOut } = useAuth();
  const location = useLocation();

  const currentUser = useMemo(() => {
    if (!user) return null;
    return {
      id: profile?.id_user,
      name: profile?.name || user?.name || 'Usuario',
      email: profile?.email || user?.username || 'sin-email',
      role: profile?.role || 'user',
      authMethod: 'azure'
    };
  }, [user, profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  console.log('[AppRoutes] currentUser:', currentUser);

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to={location.state?.from?.pathname || "/dashboard"} replace /> : <LoginPage />}
      />
      <Route
        path="/dashboard"
        element={user && currentUser ? (
          <Dashboard
            onLogout={signOut}
            onGoToAdmin={() => { }}
            currentUser={currentUser}
          />
        ) : (
          <Navigate to="/login" state={{ from: location }} replace />
        )}
      />
      <Route
        path="/report/:id"
        element={user && currentUser ? (
          <ReportViewer currentUser={currentUser} />
        ) : (
          <Navigate to="/login" state={{ from: location }} replace />
        )}
      />
      <Route
        path="/admin/*"
        element={user && currentUser && currentUser.role === "admin" ? (
          <AdminPanel onLogout={signOut} currentUser={currentUser} />
        ) : (
          <Navigate to="/dashboard" replace />
        )}
      />
      <Route
        path="/"
        element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" enableSystem attribute="class">
        <TooltipProvider>
          <AzureAuthProviderWrapper>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </AzureAuthProviderWrapper>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
