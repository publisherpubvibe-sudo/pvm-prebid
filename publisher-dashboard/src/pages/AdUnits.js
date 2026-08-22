import React, { useState } from 'react';
import { publisherApi } from '../api/client';
import { useAuth } from '../App';
import toast from 'react-hot-toast';
import { PlusIcon, RectangleGroupIcon } from '@heroicons/react/24/outline';

const REGION_LABELS = {
  useast: 'US East – New York',
  uswest: 'US West – Phoenix',
  eu:     'EU – Amsterdam',
  apac:   'APAC – Singapore',
};

const SIZE_PRESETS = [
  { label: '300×250 (Rectangle)', value: '[[300,250]]' },
  { label: '728×90 (Leaderboard)', value: '[[728,90]]' },
  { label: '160×600 (Wide Skyscraper)', value: '[[160,600]]' },
  { label: '320×50 (Mobile Banner)', value: '[[320,50]]' },
  { label: '300×250 + 728×90', value: '[[300,250],[728,90]]' },
  { label: 'Custom', value: '' },
];

export default function AdUnits() {
  const { publisher, setPublisher } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', divId: '', zoneId: '362093', region: 'useast', sizes: '[[300,250]]' });
  const [sizePreset, setSizePreset] = useState('[[300,250]]');
  const [loading, setLoading] = useState(false);

  const reload = () => {
    publisherApi.list().then(r => {
      const p = r.data.find(x => x._id === publisher?._id);
      if (p) setPublisher(p);
    });
  };

  const handlePresetChange = (val) => {
    setSizePreset(val);
    if (val) setForm(f => ({ ...f, sizes: val }));
  };

  const addUnit = async (e) => {
    e.preventDefault();
    if (!publisher) return;
    setLoading(true);
    try {
      const unit = { ...form, sizes: JSON.parse(form.sizes) };
      await publisherApi.addAdUnit(publisher._id, unit);
      toast.success('Ad unit added');
      setShowForm(false);
      setForm({ name: '', divId: '', zoneId: '362093', region: 'useast', sizes: '[[300,250]]' });
      reload();
    } catch {
      toast.error('Invalid JSON in sizes or server error');
    } finally {
      setLoading(false);
    }
  };

  if (!publisher) return <p className="text-slate-400">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Ad Units</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-semibold">
          <PlusIcon className="w-4 h-4" /> New Ad Unit
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-white">Configure Ad Unit</h2>
          <form onSubmit={addUnit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400">Unit Name</label>
                <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required
                  placeholder="e.g. Homepage Banner"
                  className="w-full mt-0.5 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400">Div ID</label>
                <input value={form.divId} onChange={e => setForm(f => ({...f, divId: e.target.value}))} required
                  placeholder="e.g. div-gpt-ad-1234567890-0"
                  className="w-full mt-0.5 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400">Zone ID (from PubVibe)</label>
                <input value={form.zoneId} onChange={e => setForm(f => ({...f, zoneId: e.target.value}))} required
                  placeholder="362093"
                  className="w-full mt-0.5 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400">Region</label>
                <select value={form.region} onChange={e => setForm(f => ({...f, region: e.target.value}))}
                  className="w-full mt-0.5 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                  {Object.entries(REGION_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-slate-400">Size Preset</label>
                <select value={sizePreset} onChange={e => handlePresetChange(e.target.value)}
                  className="w-full mt-0.5 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                  {SIZE_PRESETS.map(p => <option key={p.label} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-slate-400">Sizes JSON</label>
                <input value={form.sizes} onChange={e => setForm(f => ({...f, sizes: e.target.value}))} required
                  placeholder='[[300,250],[728,90]]'
                  className="w-full mt-0.5 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 py-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 text-sm">Cancel</button>
              <button type="submit" disabled={loading}
                className="flex-1 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold">
                {loading ? 'Saving…' : 'Save Ad Unit'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Ad unit list */}
      {publisher.adUnits?.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-10 text-center">
          <RectangleGroupIcon className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500">No ad units configured yet</p>
          <p className="text-xs text-slate-600 mt-1">Click "New Ad Unit" to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {publisher.adUnits.map(u => (
            <div key={u._id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-white">{u.name}</p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">#{u.divId}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.isActive ? 'bg-emerald-900/50 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
                  {u.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-700 text-xs">
                <div><span className="text-slate-500">Zone ID</span><br /><span className="text-teal-400 font-mono font-medium">{u.zoneId}</span></div>
                <div><span className="text-slate-500">Region</span><br /><span className="text-white uppercase">{u.region}</span></div>
                <div><span className="text-slate-500">Sizes</span><br /><span className="text-slate-300 font-mono">{u.sizes?.map(s => s.join('×')).join(', ')}</span></div>
                <div><span className="text-slate-500">Floor</span><br /><span className="text-amber-400">${(u.floorPrice || 0).toFixed(2)}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
