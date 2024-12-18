export interface AuthState {
    isAuthenticated: boolean;
    username: string | null;
  }
  
  export interface LoginCredentials {
    username: string;
    password: string;
  }