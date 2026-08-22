import React, { useEffect, useState } from 'react';
import { publisherApi } from '../api/client';
import { useAuth } from '../App';
import toast from 'react-hot-toast';
import { PlusIcon, CheckBadgeIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function MyWebsites() {
  const { publisher, setPublisher } = useAuth();
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(false);

  const reload = () => {
    publisherApi.list().then(r => {
      const p = r.data.find(x => x._id === publisher?._id);
      if (p) setPublisher(p);
    });
  };

  const addWebsite = async (e) => {
    e.preventDefault();
    if (!publisher) return;
    setLoading(true);
    try {
      await publisherApi.addWebsite(publisher._id, { domain: newDomain.trim() });
      toast.success('Website submitted for approval');
      setNewDomain('');
      reload();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add website');
    } finally {
      setLoading(false);
    }
  };

  if (!publisher) return <p className="text-slate-400">Loading publisher data…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">My Websites</h1>

      {/* Add website */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-white">Add a Website</h2>
        <p className="text-sm text-slate-400">Enter your domain. PubVibe will review and approve it before ads can run.</p>
        <form onSubmit={addWebsite} className="flex gap-2">
          <input
            value={newDomain}
            onChange={e => setNewDomain(e.target.value)}
            placeholder="yourwebsite.com"
            required
            pattern="^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$"
            title="Enter a valid domain (e.g. example.com)"
            className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold">
            <PlusIcon className="w-4 h-4" /> {loading ? 'Adding…' : 'Add'}
          </button>
        </form>
      </div>

      {/* Website list */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700">
          <h2 className="font-semibold text-white">Registered Websites ({publisher.websites?.length || 0})</h2>
        </div>
        {publisher.websites?.length === 0 ? (
          <p className="px-5 py-8 text-slate-500 text-sm text-center">No websites added yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-left text-xs uppercase">
                <th className="px-5 py-3">Domain</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Added</th>
              </tr>
            </thead>
            <tbody>
              {publisher.websites.map(w => (
                <tr key={w._id} className="border-b border-slate-700/40 hover:bg-slate-700/20">
                  <td className="px-5 py-3 font-medium text-white">{w.domain}</td>
                  <td className="px-5 py-3">
                    {w.isApproved ? (
                      <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                        <CheckBadgeIcon className="w-4 h-4" /> Approved
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-amber-400 text-xs font-medium">
                        <ClockIcon className="w-4 h-4" /> Pending Review
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs">
                    {new Date(w.addedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ads.txt helper */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-white">ads.txt Entry</h2>
        <p className="text-sm text-slate-400">Add this line to the <code className="text-teal-400 text-xs bg-slate-700 px-1.5 py-0.5 rounded">ads.txt</code> file at the root of each approved website:</p>
        <pre className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-teal-300 font-mono overflow-x-auto">
          trackifyy.com, {publisher.publisherId}, DIRECT
        </pre>
        <p className="text-xs text-slate-500">Place this file at https://yourwebsite.com/ads.txt</p>
      </div>
    </div>
  );
}
