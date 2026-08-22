import React, { useState } from 'react';
import { authApi } from '../api/client';
import { useAuth } from '../App';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, publisher } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const changePassword = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await authApi.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast.success('Password updated successfully');
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-xl font-bold text-white">Settings</h1>

      {/* Account info */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-white">Account Details</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { label: 'Name', value: user?.name },
            { label: 'Email', value: user?.email },
            { label: 'Company', value: publisher?.companyName },
            { label: 'Publisher ID', value: publisher?.publisherId },
            { label: 'Revenue Share', value: publisher ? `${publisher.revShare}%` : '—' },
            { label: 'Status', value: publisher?.isActive ? 'Active' : 'Inactive' },
          ].map(r => (
            <div key={r.label} className="bg-slate-700/40 rounded-lg px-3 py-2">
              <p className="text-xs text-slate-500">{r.label}</p>
              <p className="text-white font-medium mt-0.5 font-mono text-xs sm:text-sm sm:font-sans">{r.value || '—'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Change password */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-white">Change Password</h2>
        <form onSubmit={changePassword} className="space-y-3">
          {[
            { key: 'currentPassword', label: 'Current Password' },
            { key: 'newPassword', label: 'New Password (min 8 characters)' },
            { key: 'confirm', label: 'Confirm New Password' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs text-slate-400">{f.label}</label>
              <input
                type="password"
                required
                value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                className="w-full mt-0.5 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          ))}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold">
            {loading ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Support */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-2">
        <h2 className="font-semibold text-white">Need Help?</h2>
        <p className="text-sm text-slate-400">Contact your PubVibe account manager or email <a href="mailto:support@pubvibe.com" className="text-teal-400 hover:underline">support@pubvibe.com</a></p>
      </div>
    </div>
  );
}
