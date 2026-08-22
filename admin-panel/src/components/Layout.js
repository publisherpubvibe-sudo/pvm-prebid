import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import {
  HomeIcon, UsersIcon, GlobeAltIcon, ShieldCheckIcon,
  DocumentTextIcon, ServerIcon, BeakerIcon, Cog6ToothIcon,
  ArrowRightOnRectangleIcon, Bars3Icon, XMarkIcon, ChartBarIcon,
} from '@heroicons/react/24/outline';

const navItems = [
  { to: '/dashboard',    label: 'Dashboard',     icon: HomeIcon,                  roles: ['admin','superadmin','publisher'] },
  { to: '/publishers',   label: 'Publishers',    icon: UsersIcon,                 roles: ['admin','superadmin'] },
  { to: '/websites',     label: 'Websites',      icon: GlobeAltIcon,              roles: ['admin','superadmin'] },
  { to: '/admins',       label: 'Admins',        icon: ShieldCheckIcon,           roles: ['superadmin'] },
  { to: '/logs/auction', label: 'Auction Logs',  icon: ChartBarIcon,              roles: ['admin','superadmin','publisher'] },
  { to: '/logs/server',  label: 'Server Logs',   icon: ServerIcon,                roles: ['admin','superadmin'] },
  { to: '/bid-tester',   label: 'Bid Tester',    icon: BeakerIcon,                roles: ['admin','superadmin'] },
  { to: '/settings',     label: 'Settings',      icon: Cog6ToothIcon,             roles: ['admin','superadmin','publisher'] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const visible = navItems.filter(n => n.roles.includes(user?.role));

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">PV</div>
        <div>
          <p className="font-bold text-white text-sm">PubVibe SSP</p>
          <p className="text-xs text-slate-400">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visible.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-violet-600 text-white'
                  : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="px-4 py-4 border-t border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-white uppercase">
            {user?.name?.[0] || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4" /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-60 bg-slate-800 border-r border-slate-700 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-60 h-full bg-slate-800 border-r border-slate-700">
            <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-slate-400">
              <XMarkIcon className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-slate-800 border-b border-slate-700">
          <button onClick={() => setSidebarOpen(true)}>
            <Bars3Icon className="w-6 h-6 text-slate-400" />
          </button>
          <span className="font-bold text-white">PubVibe Admin</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
