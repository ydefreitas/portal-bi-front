import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Cloud } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface LoginPageProps {
  onLogin?: (userData: any) => void;
}

const LoginPage = ({ onLogin }: LoginPageProps) => {
  const { signIn } = useAuth();

  const handleAzureLogin = async () => {
    try {
      await signIn();
    } catch (err) {
      console.error("Error during Azure login:", err);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo y encabezado */}
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <img
              src="/lovable-uploads/c61755bb-3089-411c-9aa2-614ec102b621.png"
              alt="Portal de Datos Logo"
              className="h-16 w-16 object-contain"
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Portal de Datos</h1>
            <p className="text-muted-foreground">
              Accede a tus reportes y análisis empresariales
            </p>
          </div>
        </div>

        {/* Azure AD Login */}
        <div className="space-y-6">
          <Card className="border-2 border-azure/30 hover:border-azure/60 transition-all duration-300">
            <CardHeader className="text-center pb-4">
              <CardTitle className="flex items-center justify-center gap-2 text-lg">
                <Cloud className="h-5 w-5 text-azure" />
                Acceso Corporativo
              </CardTitle>
              <CardDescription>
                Inicia sesión con tu cuenta example@simple.com.ve
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                size="lg"
                className="w-full border-azure/40 text-azure hover:bg-azure/10 hover:border-azure/60"
                onClick={handleAzureLogin}
              >
                <Cloud className="h-4 w-4 mr-2" />
                Continuar con Azure AD
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
