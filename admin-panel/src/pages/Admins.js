import React, { useEffect, useState } from 'react';
import { adminApi } from '../api/client';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../App';

export default function Admins() {
  const [admins, setAdmins] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'admin' });
  const { user } = useAuth();

  const load = () => adminApi.list().then(r => setAdmins(r.data));
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      await adminApi.create(form);
      toast.success('Admin created');
      setShowForm(false);
      setForm({ name: '', email: '', password: '', role: 'admin' });
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const deactivate = async (id) => {
    if (!window.confirm('Deactivate this admin?')) return;
    try {
      await adminApi.remove(id);
      toast.success('Deactivated');
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Admin Users</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-semibold">
          <PlusIcon className="w-4 h-4" /> Add Admin
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h2 className="font-semibold text-white mb-4">New Admin</h2>
          <form onSubmit={create} className="grid grid-cols-2 gap-4">
            {[['name','text','Full Name'],['email','email','Email'],['password','password','Password (min 8)']].map(([k,t,ph]) => (
              <div key={k}>
                <label className="text-xs text-slate-400 capitalize">{ph}</label>
                <input type={t} placeholder={ph} value={form[k]} required onChange={e => setForm(p => ({...p,[k]:e.target.value}))}
                  className="w-full mt-0.5 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
            ))}
            <div>
              <label className="text-xs text-slate-400">Role</label>
              <select value={form.role} onChange={e => setForm(p => ({...p,role:e.target.value}))}
                className="w-full mt-0.5 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                <option value="admin">Admin</option>
                <option value="superadmin">Superadmin</option>
              </select>
            </div>
            <div className="col-span-2 flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 text-sm">Cancel</button>
              <button type="submit" className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-semibold">Create</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400 text-left text-xs uppercase">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last Login</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map(a => (
              <tr key={a._id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                <td className="px-4 py-3 font-medium text-white">{a.name}</td>
                <td className="px-4 py-3 text-slate-400">{a.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${a.role === 'superadmin' ? 'bg-violet-900/50 text-violet-400' : 'bg-blue-900/50 text-blue-400'}`}>
                    {a.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${a.isActive ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
                    {a.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">{a.lastLogin ? new Date(a.lastLogin).toLocaleString() : 'Never'}</td>
                <td className="px-4 py-3">
                  {a._id !== user?._id && (
                    <button onClick={() => deactivate(a._id)} className="p-1.5 hover:bg-red-900/40 rounded text-slate-400 hover:text-red-400">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
