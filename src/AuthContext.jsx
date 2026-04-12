import { createContext, useContext, useState, useEffect } from 'react';
import { getUser, getToken, logout as apiLogout } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getUser());
  const [token, setToken] = useState(() => getToken());

  const isLoggedIn = !!token;

  function loginDone() {
    setUser(getUser());
    setToken(getToken());
  }

  function logout() {
    apiLogout();
    setUser(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoggedIn, loginDone, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
