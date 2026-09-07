import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useFingerprint } from '../hooks/useFingerprint';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const fingerprint = useFingerprint();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password, fingerprint });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (email, password, name, verification_code) => {
    const res = await api.post('/auth/register', {
      email,
      password,
      name,
      verification_code,
      fingerprint,
    });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const loginWithGoogle = async (credential) => {
    const res = await api.post('/auth/google', { credential });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const updateName = async (newName) => {
    try {
      const res = await api.put('/auth/update-profile', { name: newName });
      setUser(res.data.user);
      return res.data;
    } catch (e) {
      console.error('Failed to update name', e);
      throw e;
    }
  };

  // Re-fetch the current user (e.g. after creating a wallet) without
  // requiring a full page reload to pick up the change.
  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
      return res.data;
    } catch (e) {
      console.error('Failed to refresh user', e);
      throw e;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateName, refreshUser, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
