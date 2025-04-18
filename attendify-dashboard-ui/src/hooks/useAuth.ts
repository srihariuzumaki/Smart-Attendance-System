import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  user: {
    role: 'admin' | 'faculty' | 'student' | null;
    name: string | null;
  } | null;
  login: (user: { role: 'admin' | 'faculty' | 'student'; name: string }) => void;
  logout: () => void;
}

const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: (user) => set({ isAuthenticated: true, user }),
      logout: () => {
        set({ isAuthenticated: false, user: null });
        // Clear any stored tokens or session data
        localStorage.removeItem('token');
        // Redirect to login page
        window.location.href = '/login';
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

export default useAuth; 