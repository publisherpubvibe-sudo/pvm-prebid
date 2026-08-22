import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { publisherApi } from '../api/client';
import {
  HomeIcon, GlobeAltIcon, RectangleGroupIcon, DocumentTextIcon,
  CodeBracketIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, Bars3Icon, XMarkIcon,
} from '@heroicons/react/24/outline';

const NAV = [
  { to: '/overview',    label: 'Overview',    icon: HomeIcon },
  { to: '/websites',    label: 'My Websites', icon: GlobeAltIcon },
  { to: '/ad-units',    label: 'Ad Units',    icon: RectangleGroupIcon },
  { to: '/logs',        label: 'Auction Logs',icon: DocumentTextIcon },
  { to: '/integration', label: 'Integration', icon: CodeBracketIcon },
  { to: '/settings',    label: 'Settings',    icon: Cog6ToothIcon },
];

export default function Layout() {
  const { user, publisher, setPublisher, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (user && !publisher) {
      publisherApi.list().then(r => {
        const pub = r.data.find(p => p.userId?._id === user._id || p.userId === user._id);
        if (pub) setPublisher(pub);
      });
    }
  }, [user, publisher, setPublisher]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold text-sm">PV</div>
        <div>
          <p className="font-bold text-white text-sm">PubVibe SSP</p>
          <p className="text-xs text-slate-400 truncate max-w-32">{publisher?.companyName || 'Publisher Portal'}</p>
        </div>
      </div>

      {/* Publisher ID badge */}
      {publisher && (
        <div className="mx-3 mt-3 px-3 py-2 bg-slate-700/50 rounded-lg">
          <p className="text-xs text-slate-500">Publisher ID</p>
          <p className="text-xs font-mono text-teal-400 font-medium mt-0.5">{publisher.publisherId}</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-teal-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-white uppercase">
            {user?.name?.[0] || 'P'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors">
          <ArrowRightOnRectangleIcon className="w-4 h-4" /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-60 bg-slate-800 border-r border-slate-700 shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="relative flex flex-col w-60 h-full bg-slate-800 border-r border-slate-700">
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-slate-400"><XMarkIcon className="w-5 h-5" /></button>
            <Sidebar />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-slate-800 border-b border-slate-700">
          <button onClick={() => setOpen(true)}><Bars3Icon className="w-6 h-6 text-slate-400" /></button>
          <span className="font-bold text-white">PubVibe Publisher</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
