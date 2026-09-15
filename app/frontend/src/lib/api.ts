const isProd = import.meta.env.PROD;
const envUrl = import.meta.env.VITE_API_URL;

// Si envUrl existe (incluso si es ""), lo usamos. 
// Si es undefined (desarrollo sin variable), usamos localhost en DEV o "" en PROD.
const API_BASE = (envUrl !== undefined && envUrl !== null)
  ? envUrl
  : (isProd ? "" : 'http://localhost:3001');

console.log(`[API DEBUG] API_BASE: "${API_BASE}", isProd: ${isProd}, envUrl: "${envUrl}"`);

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success?: boolean;
}

// Interceptor para inyectar el token de autenticación
type TokenFetcher = () => Promise<string | null>;
let getToken: TokenFetcher | null = null;

export const setTokenFetcher = (fetcher: TokenFetcher) => {
  getToken = fetcher;
};

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  const url = `${API_BASE}${cleanPath}`;

  if (API_BASE === "") {
    console.log(`[API FETCH] Relative request to: ${url}`);
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string> || {})
    };

    // Inyectar token si el fetcher está configurado
    if (getToken) {
      const token = await getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed: ${path}`, error);
    throw error;
  }
}

// Convenience methods
export const api = {
  get: <T>(path: string) => apiFetch<T>(path, { method: 'GET' }),
  post: <T>(path: string, body: any) =>
    apiFetch<T>(path, {
      method: 'POST',
      body: JSON.stringify(body)
    }),
  put: <T>(path: string, body: any) =>
    apiFetch<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body)
    }),
  delete: <T>(path: string) =>
    apiFetch<T>(path, { method: 'DELETE' })
};
