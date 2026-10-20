import { httpClient } from '../../../shared/api/httpClient';
import type { AuthResponse, UserRole } from '../../../shared/api/types';

export type { UserRole };

export interface AuthUser {
  id: string;
  fullName: string;
  username: string;
  role: UserRole;
}

export function toAuthUser(response: AuthResponse): AuthUser {
  return { id: response.id, fullName: response.fullName, username: response.username, role: response.role };
}

export async function login(username: string, password: string): Promise<AuthResponse> {
  const { data } = await httpClient.post<AuthResponse>('/auth/login', { username, password });
  return data;
}

export async function refresh(refreshToken: string): Promise<AuthResponse> {
  const { data } = await httpClient.post<AuthResponse>('/auth/refresh', { refreshToken });
  return data;
}

// BE-E10: revokes the refresh token server-side.
export async function logout(refreshToken: string): Promise<void> {
  await httpClient.post('/auth/logout', { refreshToken });
}
