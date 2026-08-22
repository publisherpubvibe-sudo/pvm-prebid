import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { publisherApi } from '../api/client';
import toast from 'react-hot-toast';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

function CreatePublisherModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', companyName: '', revShare: 70 });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await publisherApi.create(form);
      toast.success('Publisher created');
      onCreate();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create publisher');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: 'name', label: 'Full Name', type: 'text', placeholder: 'John Smith' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'publisher@example.com' },
    { name: 'password', label: 'Password', type: 'password', placeholder: 'min 8 characters' },
    { name: 'companyName', label: 'Company Name', type: 'text', placeholder: 'Example Media LLC' },
    { name: 'revShare', label: 'Revenue Share %', type: 'number', placeholder: '70' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-white mb-5">Add Publisher</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(f => (
            <div key={f.name}>
              <label className="block text-sm text-slate-400 mb-1">{f.label}</label>
              <input
                type={f.type}
                placeholder={f.placeholder}
                value={form[f.name]}
                onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                required
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold">
              {loading ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Publishers() {
  const [publishers, setPublishers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = () => {
    setLoading(true);
    publisherApi.list().then(r => setPublishers(r.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const deactivate = async (id) => {
    if (!window.confirm('Deactivate this publisher?')) return;
    try {
      await publisherApi.remove(id);
      toast.success('Publisher deactivated');
      load();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Publishers</h1>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-semibold">
          <PlusIcon className="w-4 h-4" /> Add Publisher
        </button>
      </div>

      {loading ? (
        <p className="text-slate-400">Loading…</p>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-left text-xs uppercase tracking-wider">
                <th className="px-4 py-3">Publisher</th>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Websites</th>
                <th className="px-4 py-3">Rev Share</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {publishers.map(p => (
                <tr key={p._id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{p.companyName}</p>
                    <p className="text-xs text-slate-500">{p.userId?.email}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{p.publisherId}</td>
                  <td className="px-4 py-3 text-slate-300">{p.websites?.length || 0}</td>
                  <td className="px-4 py-3 text-emerald-400">{p.revShare}%</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.isActive ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link to={`/publishers/${p._id}`} className="p-1.5 hover:bg-slate-600 rounded text-slate-400 hover:text-white" title="View details">
                        <PencilSquareIcon className="w-4 h-4" />
                      </Link>
                      <button onClick={() => deactivate(p._id)} className="p-1.5 hover:bg-red-900/40 rounded text-slate-400 hover:text-red-400" title="Deactivate">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {publishers.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No publishers yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && <CreatePublisherModal onClose={() => setShowCreate(false)} onCreate={load} />}
    </div>
  );
}
