import React, { useEffect, useState } from 'react';
import { statsApi } from '../api/client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function StatCard({ label, value, sub, color = 'violet' }) {
  const colors = { violet: 'from-violet-600 to-indigo-600', green: 'from-emerald-600 to-teal-600', amber: 'from-amber-500 to-orange-600', blue: 'from-blue-600 to-cyan-600' };
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <p className="text-slate-400 text-sm">{label}</p>
      <p className={`text-2xl font-bold mt-1 bg-gradient-to-r ${colors[color]} bg-clip-text text-transparent`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [timeseries, setTimeseries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([statsApi.overview(), statsApi.timeseries(24)])
      .then(([ov, ts]) => {
        setOverview(ov.data);
        const formatted = ts.data.map(d => ({
          hour: `${String(d._id.hour).padStart(2,'0')}:00`,
          requests: d.requests,
          wins: d.wins,
          revenue: +d.revenue.toFixed(4),
        }));
        setTimeseries(formatted);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-400 text-center py-20">Loading dashboard…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Dashboard</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Requests" value={overview?.totalRequests?.toLocaleString() || 0} color="violet" />
        <StatCard label="Total Wins" value={overview?.totalWins?.toLocaleString() || 0} color="green" />
        <StatCard label="Win Rate" value={`${overview?.winRate || 0}%`} color="blue" />
        <StatCard label="Total Revenue" value={`$${overview?.totalRevenue || '0.00'}`} color="amber" />
      </div>

      {/* Time series chart */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Last 24h – Requests vs Wins</h2>
        {timeseries.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">No auction data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={timeseries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="hour" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }} />
              <Line type="monotone" dataKey="requests" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Requests" />
              <Line type="monotone" dataKey="wins" stroke="#10b981" strokeWidth={2} dot={false} name="Wins" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bidder breakdown */}
      {overview?.byBidder?.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Bidder Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-left">
                  <th className="pb-2 pr-4">Bidder</th>
                  <th className="pb-2 pr-4">Requests</th>
                  <th className="pb-2 pr-4">Wins</th>
                  <th className="pb-2">Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {overview.byBidder.map(b => (
                  <tr key={b._id} className="border-b border-slate-700/50">
                    <td className="py-2 pr-4 font-medium text-white">{b._id}</td>
                    <td className="py-2 pr-4 text-slate-300">{b.requests}</td>
                    <td className="py-2 pr-4 text-emerald-400">{b.wins}</td>
                    <td className="py-2 text-blue-400">{b.requests > 0 ? ((b.wins/b.requests)*100).toFixed(1) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
