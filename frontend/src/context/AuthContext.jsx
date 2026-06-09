import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const TOKEN_KEY = 'fenelons_admin_token';
const TOKEN_VALUE = 'fenelons-admin-secure-token-2024';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const login = (tok) => {
    localStorage.setItem(TOKEN_KEY, tok);
    setToken(tok);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
