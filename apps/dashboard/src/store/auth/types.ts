export type Role = 'user' | 'counselor' ;

export interface AuthState {
  id: string | null;
  role: Role | null;
  name: string | null;
  token: string | null;
  email: string | null
  setRole: (role: Role) => void;
  setToken: (token: string) => void;
  setEmail: (email: string) => void;
  setAuth: ({role, token, id, name}: {role: Role; token: string; id: string, email: string; name?: string}) => void;
  logout: () => void;
}