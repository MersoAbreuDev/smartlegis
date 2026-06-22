import { normalizeApiErrorMessage } from './api-errors';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

export type UserRole = 'MASTER' | 'ADMIN_CAMARA' | 'SECRETARIO' | 'PRESIDENTE' | 'VEREADOR';

export type AuthUser = {
  id: string;
  tenantId: string | null;
  name: string;
  email: string;
  role: UserRole;
};

type ApiOptions = RequestInit & {
  token?: string | null;
};

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (options.token) headers.set('Authorization', `Bearer ${options.token}`);

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let message = 'Nao foi possivel completar a requisicao.';
    try {
      const body = await response.json();
      message = body.message ?? message;
    } catch {
      message = response.statusText || message;
    }

    const normalized = normalizeApiErrorMessage(
      Array.isArray(message) ? message.join(', ') : message,
      response.status
    );
    throw new Error(normalized);
  }

  return response.json() as Promise<T>;
}

export function roleHome(role: UserRole) {
  if (role === 'MASTER') return 'master';
  if (role === 'SECRETARIO') return 'secretaria';
  if (role === 'PRESIDENTE') return 'plenario';
  if (role === 'VEREADOR') return 'vereador';
  return 'admin';
}

export function roleHomePath(role: UserRole) {
  if (role === 'MASTER') return '/master/dashboard';
  return `/${roleHome(role)}`;
}

export function viewFromPath(pathname: string) {
  if (pathname.startsWith('/master')) return 'master';
  if (pathname.startsWith('/secretaria')) return 'secretaria';
  if (pathname.startsWith('/plenario')) return 'plenario';
  if (pathname.startsWith('/vereador')) return 'vereador';
  if (pathname.startsWith('/publico')) return 'publico';
  if (pathname.startsWith('/admin')) return 'admin';
  return 'admin';
}

export function canAccessView(role: UserRole, view: string) {
  if (view === 'publico') return true;
  const matrix: Record<UserRole, string[]> = {
    MASTER: ['master'],
    ADMIN_CAMARA: ['admin'],
    SECRETARIO: ['secretaria', 'plenario'],
    PRESIDENTE: ['plenario'],
    VEREADOR: ['vereador']
  };
  return matrix[role].includes(view);
}
