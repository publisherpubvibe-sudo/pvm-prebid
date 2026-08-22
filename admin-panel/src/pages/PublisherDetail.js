import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { publisherApi } from '../api/client';
import toast from 'react-hot-toast';
import { PlusIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';

export default function PublisherDetail() {
  const { id } = useParams();
  const [pub, setPub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newSite, setNewSite] = useState('');
  const [newUnit, setNewUnit] = useState({ name: '', divId: '', zoneId: '', region: 'useast', sizes: '[[300,250]]' });

  const load = () => {
    setLoading(true);
    publisherApi.get(id).then(r => setPub(r.data)).finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const addWebsite = async (e) => {
    e.preventDefault();
    try {
      await publisherApi.addWebsite(id, { domain: newSite });
      toast.success('Website added');
      setNewSite('');
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const addAdUnit = async (e) => {
    e.preventDefault();
    try {
      const unit = { ...newUnit, sizes: JSON.parse(newUnit.sizes) };
      await publisherApi.addAdUnit(id, unit);
      toast.success('Ad unit added');
      setNewUnit({ name: '', divId: '', zoneId: '', region: 'useast', sizes: '[[300,250]]' });
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Invalid JSON in sizes'); }
  };

  if (loading) return <p className="text-slate-400">Loading…</p>;
  if (!pub) return <p className="text-red-400">Publisher not found</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">{pub.companyName}</h1>
            <p className="text-sm text-slate-400 mt-0.5">{pub.userId?.email} · <span className="font-mono">{pub.publisherId}</span></p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${pub.isActive ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
            {pub.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-700">
          <div><p className="text-xs text-slate-500">Revenue Share</p><p className="font-bold text-emerald-400">{pub.revShare}%</p></div>
          <div><p className="text-xs text-slate-500">Total Requests</p><p className="font-bold text-white">{pub.totalRequests?.toLocaleString()}</p></div>
          <div><p className="text-xs text-slate-500">Total Revenue</p><p className="font-bold text-amber-400">${pub.totalRevenue?.toFixed(2)}</p></div>
        </div>
      </div>

      {/* Websites */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-white">Websites</h2>
        <form onSubmit={addWebsite} className="flex gap-2">
          <input value={newSite} onChange={e => setNewSite(e.target.value)} placeholder="example.com" required
            className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          <button type="submit" className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-semibold flex items-center gap-1">
            <PlusIcon className="w-4 h-4" /> Add
          </button>
        </form>
        <div className="space-y-2">
          {pub.websites?.map(w => (
            <div key={w._id} className="flex items-center justify-between px-3 py-2 bg-slate-700/50 rounded-lg">
              <span className="text-sm text-white">{w.domain}</span>
              {w.isApproved
                ? <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckBadgeIcon className="w-4 h-4" /> Approved</span>
                : <span className="text-xs text-amber-400">Pending</span>}
            </div>
          ))}
          {!pub.websites?.length && <p className="text-slate-500 text-sm">No websites added</p>}
        </div>
      </div>

      {/* Ad Units */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-white">Ad Units</h2>
        <form onSubmit={addAdUnit} className="grid grid-cols-2 gap-3">
          {[
            { name: 'name', placeholder: 'Unit Name', label: 'Name' },
            { name: 'divId', placeholder: 'div-banner-1', label: 'Div ID' },
            { name: 'zoneId', placeholder: '362093', label: 'Zone ID' },
          ].map(f => (
            <div key={f.name}>
              <label className="text-xs text-slate-400">{f.label}</label>
              <input value={newUnit[f.name]} onChange={e => setNewUnit(p => ({ ...p, [f.name]: e.target.value }))}
                placeholder={f.placeholder} required
                className="w-full mt-0.5 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
          ))}
          <div>
            <label className="text-xs text-slate-400">Region</label>
            <select value={newUnit.region} onChange={e => setNewUnit(p => ({ ...p, region: e.target.value }))}
              className="w-full mt-0.5 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
              {['useast','uswest','eu','apac'].map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs text-slate-400">Sizes (JSON) – e.g. [[300,250],[728,90]]</label>
            <input value={newUnit.sizes} onChange={e => setNewUnit(p => ({ ...p, sizes: e.target.value }))}
              className="w-full mt-0.5 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div className="col-span-2">
            <button type="submit" className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-semibold">Add Ad Unit</button>
          </div>
        </form>

        <div className="space-y-2">
          {pub.adUnits?.map(u => (
            <div key={u._id} className="flex items-center justify-between px-3 py-2 bg-slate-700/50 rounded-lg text-sm">
              <div>
                <span className="font-medium text-white">{u.name}</span>
                <span className="ml-2 text-slate-400 text-xs font-mono">#{u.divId}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-400">Zone: <span className="text-white">{u.zoneId}</span></span>
                <span className="bg-slate-600 px-2 py-0.5 rounded text-slate-300 uppercase">{u.region}</span>
              </div>
            </div>
          ))}
          {!pub.adUnits?.length && <p className="text-slate-500 text-sm">No ad units configured</p>}
        </div>
      </div>
    </div>
  );
}
