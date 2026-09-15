import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useMsal, MsalProvider, useAccount } from '@azure/msal-react';
import { PublicClientApplication, InteractionRequiredAuthError, InteractionStatus } from '@azure/msal-browser';
import { useToast } from '@/hooks/use-toast';
import { setTokenFetcher } from '@/lib/api';

interface Profile {
  id_user: string;
  name: string | null;
  email: string | null;
  role: string | null;
  status: string;
  creation_date: string;
  updated_at: string;
}

interface AuthContextType {
  user: any | null;
  session: any | null;
  profile: Profile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  logUserAccess: (id_user: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

// MSAL configuration - Lazy initialized
let msalInstance: PublicClientApplication | null = null;

const getMsalInstance = () => {
  if (!msalInstance) {
    const clientId = import.meta.env.VITE_AZURE_CLIENT_ID;
    const tenantId = import.meta.env.VITE_AZURE_TENANT_ID;

    if (!clientId || !tenantId) {
      throw new Error(
        `Azure AD environment variables not configured. Got clientId: ${clientId}, tenantId: ${tenantId}`
      );
    }

    const msalConfig = {
      auth: {
        clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        redirectUri: window.location.origin,
      },
      cache: { cacheLocation: 'localStorage', storeAuthStateInCookie: false },
    };

    msalInstance = new PublicClientApplication(msalConfig);
  }
  return msalInstance;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { instance, accounts, inProgress } = useMsal();
  const account = useAccount(accounts[0] || {});

  const fetchProfile = async (accessToken: string) => {
    try {
      // Obtener datos de Microsoft Graph
      const res = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      const email = data.mail || data.userPrincipalName;
      // Buscar perfil en backend por email
      if (email) {
        let backendRes = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/profiles/email/${encodeURIComponent(email)}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (backendRes.ok) {
          const backendProfile = await backendRes.json();
          setProfile(backendProfile);
        } else {
          // Si no existe (404), intentamos sincronizar/crear el usuario
          console.log('[useAuth] Profile not found, syncing with backend...');

          const syncRes = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/sync`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
              user_id: data.id,
              name: data.displayName,
              email: email
            })
          });

          if (syncRes.ok) {
            const newProfile = await syncRes.json();
            console.log('[useAuth] Profile synced/created:', newProfile);
            setProfile(newProfile);
          } else {
            console.error('[useAuth] Failed to sync profile:', await syncRes.text());
            // Fallback to local profile if sync fails, but this shouldn't happen ideally
            setProfile({
              id_user: data.id,
              name: data.displayName,
              email,
              role: 'user',
              status: 'activo',
              creation_date: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        }
      }
    } catch (err) {
      console.error('Error fetching/syncing profile:', err);
    }
  };

  const logUserAccess = async (id_user: string) => {
    const apiUrl = import.meta.env.VITE_API_URL;

    // Rate limiting: Prevent logging more than once every 5 seconds
    const lastLogTime = sessionStorage.getItem('last_log_timestamp');
    const now = Date.now();

    if (lastLogTime && (now - parseInt(lastLogTime)) < 5000) {
      console.log('[Auth] Access logged recently (rate limit), skipping.');
      return;
    }

    console.log('[Auth] logUserAccess called for:', id_user);

    try {
      const accessToken = await getAccessToken();
      const res = await fetch(`${apiUrl}/api/v1/users-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ id_user }),
      });
      console.log('[Auth] Response status:', res.status);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('[Auth] Failed to log access:', errorText);
      } else {
        console.log('User access logged successfully');
        sessionStorage.setItem('last_log_timestamp', Date.now().toString());
      }
    } catch (error) {
      console.error('Error logging user access:', error);
    }
  };

  const signIn = async () => {
    try {
      const response = await instance.loginPopup({
        scopes: ['openid', 'profile', 'email', 'User.Read'],
      });
      setUser(response.account);
      const tokenResponse = await instance.acquireTokenSilent({
        scopes: ['User.Read'],
        account: response.account!,
      });
      await fetchProfile(tokenResponse.accessToken);
    } catch (err) {
      if (err instanceof InteractionRequiredAuthError) {
        await instance.loginRedirect({ scopes: ['User.Read'] });
      } else {
        toast({ title: 'Error de autenticación', description: String(err), variant: 'destructive' });
      }
    }
  };

  const getAccessToken = async (): Promise<string | null> => {
    try {
      const activeAccount = instance.getActiveAccount() || accounts[0];
      if (!activeAccount) return null;

      const response = await instance.acquireTokenSilent({
        // Intentar obtener un token para la propia aplicación (backend)
        // El scope ideal sería: `api://${import.meta.env.VITE_AZURE_CLIENT_ID}/access_as_user`
        // Usamos User.Read como fallback si el API no está expuesta aún
        scopes: ['User.Read'], 
        account: activeAccount,
      });
      return response.accessToken;
    } catch (error) {
      console.error('[Auth] Failed to get access token:', error);
      return null;
    }
  };

  const signOut = async () => {
    await instance.logoutRedirect({ postLogoutRedirectUri: window.location.origin });
    setUser(null);
    setProfile(null);
    sessionStorage.removeItem('access_logged');
  };

  useEffect(() => {
    const initializeAuth = async () => {
      if (inProgress !== InteractionStatus.None) {
        return;
      }

      let activeAccount = account;

      if (!activeAccount) {
        const cachedAccounts = instance.getAllAccounts();
        if (cachedAccounts.length > 0) {
          activeAccount = cachedAccounts[0];
          instance.setActiveAccount(activeAccount);
        }
      }

      if (activeAccount) {
        setUser(activeAccount);
        try {
          const tokenResponse = await instance.acquireTokenSilent({
            scopes: ['User.Read'],
            account: activeAccount
          });
          await fetchProfile(tokenResponse.accessToken);
        } catch (error) {
          console.error("Failed to acquire token silently", error);
        }
      }
      setLoading(false);
    };

    // Registrar el fetcher de tokens en el cliente API global
    setTokenFetcher(getAccessToken);

    initializeAuth();
  }, [account, inProgress, instance]);

  return (
    <AuthContext.Provider value={{ user, session: null, profile, loading, signIn, signOut, getAccessToken, logUserAccess }}>
      {children}
    </AuthContext.Provider>
  );
};

export const AzureAuthProviderWrapper = ({ children }: { children: React.ReactNode }) => {
  const msalInstance = getMsalInstance();
  return (
    <MsalProvider instance={msalInstance}>
      <AuthProvider>{children}</AuthProvider>
    </MsalProvider>
  );
};

