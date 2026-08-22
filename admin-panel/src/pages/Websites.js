import React, { useEffect, useState } from 'react';
import { websiteApi } from '../api/client';
import toast from 'react-hot-toast';
import { CheckBadgeIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function Websites() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    websiteApi.list().then(r => setSites(r.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const approve = async (pubId, siteId) => {
    try {
      await websiteApi.approve(pubId, siteId);
      toast.success('Website approved');
      load();
    } catch { toast.error('Failed'); }
  };

  const remove = async (pubId, siteId) => {
    if (!window.confirm('Remove this website?')) return;
    try {
      await websiteApi.remove(pubId, siteId);
      toast.success('Removed');
      load();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-white">Website Management</h1>
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        {loading ? <p className="text-center py-10 text-slate-400">Loading…</p> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-left text-xs uppercase">
                <th className="px-4 py-3">Domain</th>
                <th className="px-4 py-3">Publisher</th>
                <th className="px-4 py-3">Publisher ID</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Added</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sites.map(s => (
                <tr key={s._id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                  <td className="px-4 py-3 font-medium text-white">{s.domain}</td>
                  <td className="px-4 py-3 text-slate-300">{s.publisher}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{s.publisherId}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.isApproved ? 'bg-emerald-900/50 text-emerald-400' : 'bg-amber-900/50 text-amber-400'}`}>
                      {s.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{new Date(s.addedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {!s.isApproved && (
                        <button onClick={() => approve(s.publisherId, s._id)} className="p-1.5 hover:bg-emerald-900/40 rounded text-slate-400 hover:text-emerald-400" title="Approve">
                          <CheckBadgeIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => remove(s.publisherId, s._id)} className="p-1.5 hover:bg-red-900/40 rounded text-slate-400 hover:text-red-400" title="Remove">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!sites.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No websites</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
