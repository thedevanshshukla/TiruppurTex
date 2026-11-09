import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'merchandiser' | 'supervisor' | 'buyer';
  buyer_id?: string;
  unit_id?: string;
  language_preference: string;
}

export interface DemoUser {
  role: 'merchandiser' | 'supervisor' | 'buyer';
  email: string;
  password: string;
  name: string;
  description: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  quickLogin: (email: string, password: string) => Promise<void>;
  logout: () => void;
  demoUsers: DemoUser[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([]);

  useEffect(() => {
    const savedToken = localStorage.getItem('tiruppur_token');
    const savedUser = localStorage.getItem('tiruppur_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      } catch (e) {
        localStorage.removeItem('tiruppur_token');
        localStorage.removeItem('tiruppur_user');
        delete apiClient.defaults.headers.common['Authorization'];
      }
    }
    setLoading(false);

    // Fetch demo credentials for reviewer convenience
    apiClient.get('/auth/demo-users')
      .then((res) => setDemoUsers(res.data))
      .catch(() => {
        // Fallback demo users if backend is still waking up
        setDemoUsers([
          {
            role: 'merchandiser',
            email: 'merchandiser@company-a.com',
            password: 'admin123',
            name: 'Karthik Subramanian (Lead Merchandiser)',
            description: 'Order Board, PO Setup, Delay Warnings & AI Triage'
          },
          {
            role: 'supervisor',
            email: 'supervisor@company-a.com',
            password: 'admin123',
            name: 'Muthu Vel (Floor Supervisor)',
            description: 'Tamil floor production log with output numbers, camera proof & notes'
          },
          {
            role: 'buyer',
            email: 'buyer.uk@company-b.co.uk',
            password: 'admin123',
            name: 'Sarah Jenkins (Company B - UK)',
            description: 'Isolated UK Buyer view (Company B orders only)'
          },
          {
            role: 'buyer',
            email: 'buyer.de@company-c.de',
            password: 'admin123',
            name: 'Hans Müller (Company C - Germany)',
            description: 'Isolated German Buyer view (Company C orders only)'
          }
        ]);
      });
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiClient.post('/auth/login', { email, password });
    const { access_token, user } = res.data;
    localStorage.setItem('tiruppur_token', access_token);
    localStorage.setItem('tiruppur_user', JSON.stringify(user));
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setToken(access_token);
    setUser(user);
  };

  const quickLogin = async (email: string, password: string) => {
    await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem('tiruppur_token');
    localStorage.removeItem('tiruppur_user');
    delete apiClient.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, quickLogin, logout, demoUsers }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

