export type Role = 'user' | 'counselor';

export interface AuthState {
  role: Role | null;
  token: string | null;
  setRole: (role: Role) => void;
  setToken: (token: string) => void;
  logout: () => void;
}