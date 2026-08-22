import React, { useState } from 'react';
import { testApi } from '../api/client';
import toast from 'react-hot-toast';
import { BeakerIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const REGIONS = ['useast','uswest','eu','apac'];
const REGION_LABELS = { useast: 'US East (New York)', uswest: 'US West (Phoenix)', eu: 'EU (Amsterdam)', apac: 'APAC (Singapore)' };
const DEFAULT_ZONE = '362093';

export default function BidTester() {
  const [region, setRegion] = useState('useast');
  const [zoneId, setZoneId] = useState(DEFAULT_ZONE);
  const [publisherId, setPublisherId] = useState('test-pub-001');
  const [result, setResult] = useState(null);
  const [allResults, setAllResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);

  const testOne = async () => {
    setLoading(true);
    setResult(null);
    try {
      const { data } = await testApi.bid({ region, zoneId, publisherId });
      setResult(data);
    } catch (err) {
      toast.error('Request failed');
    } finally {
      setLoading(false);
    }
  };

  const testAll = async () => {
    setLoadingAll(true);
    setAllResults(null);
    try {
      const { data } = await testApi.bidAll({ zoneId, publisherId });
      setAllResults(data);
    } catch (err) {
      toast.error('Request failed');
    } finally {
      setLoadingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Bid Tester</h1>
      <p className="text-sm text-slate-400">Fire live oRTB 2.5 test requests to PubVibe regional endpoints and inspect the full response.</p>

      {/* Config */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-white">Test Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-slate-400">Zone ID</label>
            <input value={zoneId} onChange={e => setZoneId(e.target.value)}
              className="w-full mt-0.5 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div>
            <label className="text-xs text-slate-400">Publisher ID</label>
            <input value={publisherId} onChange={e => setPublisherId(e.target.value)}
              className="w-full mt-0.5 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div>
            <label className="text-xs text-slate-400">Region</label>
            <select value={region} onChange={e => setRegion(e.target.value)}
              className="w-full mt-0.5 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
              {REGIONS.map(r => <option key={r} value={r}>{REGION_LABELS[r]}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={testOne} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold">
            <BeakerIcon className="w-4 h-4" /> {loading ? 'Sending…' : `Test ${REGION_LABELS[region]}`}
          </button>
          <button onClick={testAll} disabled={loadingAll}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg text-sm font-semibold">
            {loadingAll ? 'Testing all…' : 'Test All Regions'}
          </button>
        </div>
      </div>

      {/* Single result */}
      {result && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            {result.success
              ? <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
              : <XCircleIcon className="w-5 h-5 text-red-400" />}
            <h2 className="font-semibold text-white">{REGION_LABELS[result.region]}</h2>
            <span className="ml-auto text-sm text-slate-400">{result.latencyMs}ms</span>
          </div>
          {result.error && <p className="text-red-400 text-sm">{result.error}</p>}
          {result.bidResponse && (
            <div>
              <p className="text-xs text-slate-400 mb-1">Response</p>
              <pre className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-300 overflow-auto max-h-60 font-mono">
                {JSON.stringify(result.bidResponse, null, 2)}
              </pre>
            </div>
          )}
          <details className="text-xs">
            <summary className="text-slate-400 cursor-pointer">Sent Request</summary>
            <pre className="mt-2 bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-500 overflow-auto max-h-60 font-mono">
              {JSON.stringify(result.sentRequest, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* All regions result */}
      {allResults && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-white">All Regions Results</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allResults.results.map(r => (
              <div key={r.region} className={`p-4 rounded-lg border ${r.success ? 'border-emerald-800 bg-emerald-900/20' : 'border-red-800 bg-red-900/20'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white text-sm">{REGION_LABELS[r.region]}</span>
                  {r.success ? <CheckCircleIcon className="w-4 h-4 text-emerald-400" /> : <XCircleIcon className="w-4 h-4 text-red-400" />}
                </div>
                <p className="text-xs text-slate-400 mt-1">{r.latencyMs}ms · HTTP {r.statusCode || 'N/A'}</p>
                {r.success && <p className="text-xs text-emerald-400 mt-0.5">{r.bids} bid(s) returned</p>}
                {r.error && <p className="text-xs text-red-400 mt-0.5">{r.error}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
