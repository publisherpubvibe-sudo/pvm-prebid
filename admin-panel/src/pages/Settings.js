import React, { useState } from 'react';
import { authApi } from '../api/client';
import toast from 'react-hot-toast';
import { useAuth } from '../App';

export default function Settings() {
  const { user } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const changePassword = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await authApi.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast.success('Password updated');
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-xl font-bold text-white">Settings</h1>

      {/* Profile */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-2">
        <h2 className="font-semibold text-white">Profile</h2>
        <div className="text-sm text-slate-400 space-y-1">
          <p>Name: <span className="text-white">{user?.name}</span></p>
          <p>Email: <span className="text-white">{user?.email}</span></p>
          <p>Role: <span className="capitalize text-violet-400">{user?.role}</span></p>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-white">Change Password</h2>
        <form onSubmit={changePassword} className="space-y-3">
          {[
            { key: 'currentPassword', label: 'Current Password' },
            { key: 'newPassword', label: 'New Password (min 8 chars)' },
            { key: 'confirm', label: 'Confirm New Password' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs text-slate-400">{f.label}</label>
              <input type="password" required minLength={f.key !== 'currentPassword' ? 8 : undefined}
                value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                className="w-full mt-0.5 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
          ))}
          <button type="submit" disabled={loading} className="w-full py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold">
            {loading ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
