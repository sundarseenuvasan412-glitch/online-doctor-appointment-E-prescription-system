import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const AuthContext = createContext(null);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
  autoConnect: false,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(!!token);

  useEffect(() => {
    axios.defaults.baseURL = API_BASE_URL;
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common.Authorization;
    }
  }, [token]);

  useEffect(() => {
    const init = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await axios.get('/auth/me');
        setUser(data.user);
        socket.connect();
        socket.emit('register', data.user._id);
      } catch {
        setToken(null);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    init();

    return () => {
      socket.disconnect();
    };
  }, [token]);

  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('token', jwtToken);
    socket.connect();
    socket.emit('register', userData._id);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    socket.disconnect();
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      logout,
      socket,
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

