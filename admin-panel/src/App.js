import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { authApi } from './api/client';

import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Publishers from './pages/Publishers';
import PublisherDetail from './pages/PublisherDetail';
import Admins from './pages/Admins';
import Websites from './pages/Websites';
import AuctionLogs from './pages/AuctionLogs';
import ServerLogs from './pages/ServerLogs';
import BidTester from './pages/BidTester';
import Settings from './pages/Settings';

// ── Auth context ────────────────────────────────────────────────────────────
export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

function RequireAuth({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-slate-400">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('pv_token');
    if (!token) { setLoading(false); return; }
    authApi.me().then(r => setUser(r.data)).catch(() => localStorage.removeItem('pv_token')).finally(() => setLoading(false));
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('pv_token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('pv_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' } }} />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="publishers" element={<RequireAuth roles={['admin','superadmin']}><Publishers /></RequireAuth>} />
            <Route path="publishers/:id" element={<RequireAuth roles={['admin','superadmin']}><PublisherDetail /></RequireAuth>} />
            <Route path="admins" element={<RequireAuth roles={['superadmin']}><Admins /></RequireAuth>} />
            <Route path="websites" element={<RequireAuth roles={['admin','superadmin']}><Websites /></RequireAuth>} />
            <Route path="logs/auction" element={<AuctionLogs />} />
            <Route path="logs/server" element={<RequireAuth roles={['admin','superadmin']}><ServerLogs /></RequireAuth>} />
            <Route path="bid-tester" element={<RequireAuth roles={['admin','superadmin']}><BidTester /></RequireAuth>} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
