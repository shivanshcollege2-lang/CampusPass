import { createContext, useContext, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('accessflow_user') || 'null'); } catch { return null; }
  });

  const setSession = (token, userData) => {
    localStorage.setItem('accessflow_token', token);
    localStorage.setItem('accessflow_user', JSON.stringify(userData));
    setUser(userData);
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setSession(data.token, data.user);
    return data.user;
  };

    const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    setSession(data.token, data.user);
    return data.user;
  };


  const logout = () => {
    localStorage.removeItem('accessflow_token');
    localStorage.removeItem('accessflow_user');
    setUser(null);
  };

  const value = useMemo(() => ({ user, login, register, logout, setSession }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
