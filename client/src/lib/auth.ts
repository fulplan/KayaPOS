import { create } from 'zustand';

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  role: 'admin' | 'manager' | 'cashier';
  isActive: boolean;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  login: (username: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<AuthUser | null>;
  hasRole: (...roles: string[]) => boolean;
}

const CACHED_USER_KEY = 'kaya_pos_user';

function getCachedUser(): AuthUser | null {
  try {
    const cached = localStorage.getItem(CACHED_USER_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

function setCachedUser(user: AuthUser | null) {
  if (user) {
    localStorage.setItem(CACHED_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CACHED_USER_KEY);
  }
}

export const useAuth = create<AuthState>((set, get) => ({
  user: getCachedUser(),
  isLoading: true,

  setUser: (user) => {
    setCachedUser(user);
    set({ user });
  },

  login: async (username: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Login failed');
    }

    const user = await res.json();
    setCachedUser(user);
    set({ user });
    return user;
  },

  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setCachedUser(null);
    set({ user: null });
  },

  checkAuth: async () => {
    try {
      if (!navigator.onLine) {
        const cached = getCachedUser();
        set({ user: cached, isLoading: false });
        return cached;
      }

      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const user = await res.json();
        setCachedUser(user);
        set({ user, isLoading: false });
        return user;
      } else {
        const cached = getCachedUser();
        if (!cached) {
          setCachedUser(null);
          set({ user: null, isLoading: false });
        } else {
          set({ user: cached, isLoading: false });
        }
        return cached;
      }
    } catch {
      const cached = getCachedUser();
      set({ user: cached, isLoading: false });
      return cached;
    }
  },

  hasRole: (...roles: string[]) => {
    const user = get().user;
    return !!user && roles.includes(user.role);
  },
}));
