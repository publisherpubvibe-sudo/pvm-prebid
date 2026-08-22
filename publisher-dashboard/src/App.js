import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { authApi } from './api/client';

import Login from './pages/Login';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import MyWebsites from './pages/MyWebsites';
import AdUnits from './pages/AdUnits';
import AuctionLogs from './pages/AuctionLogs';
import Integration from './pages/Integration';
import Settings from './pages/Settings';

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-slate-400">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [publisher, setPublisher] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('pv_pub_token');
    if (!token) { setLoading(false); return; }
    authApi.me()
      .then(r => setUser(r.data))
      .catch(() => localStorage.removeItem('pv_pub_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('pv_pub_token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('pv_pub_token');
    setUser(null);
    setPublisher(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, publisher, setPublisher, login, logout }}>
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' } }} />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
            <Route index element={<Navigate to="/overview" replace />} />
            <Route path="overview" element={<Overview />} />
            <Route path="websites" element={<MyWebsites />} />
            <Route path="ad-units" element={<AdUnits />} />
            <Route path="logs" element={<AuctionLogs />} />
            <Route path="integration" element={<Integration />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
