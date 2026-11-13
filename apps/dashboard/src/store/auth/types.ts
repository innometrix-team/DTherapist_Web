export type Role = 'user' | 'counselor';
export type ProfessionalCategory = 'counselor' | 'psychologist';

export interface AuthState {
  id: string | null;
  role: Role | null;
  name: string | null;
  token: string | null;
  email: string | null;
  professionalCategory: ProfessionalCategory | null;
  setRole: (role: Role) => void;
  setToken: (token: string) => void;
  setEmail: (email: string) => void;
  setProfessionalCategory: (category: ProfessionalCategory | null) => void;
  setAuth: (payload: {
    role: Role;
    token: string;
    id: string;
    email: string;
    name?: string;
    professionalCategory?: ProfessionalCategory | null;
  }) => void;
  logout: () => void;
}