import React, { useState } from 'react';
import { useAuth } from '../App';
import toast from 'react-hot-toast';
import { DocumentDuplicateIcon, CheckIcon } from '@heroicons/react/24/outline';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={copy}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs text-slate-300 rounded-lg transition-colors">
      {copied ? <CheckIcon className="w-3.5 h-3.5 text-emerald-400" /> : <DocumentDuplicateIcon className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function CodeBlock({ code, lang = 'html' }) {
  return (
    <div className="relative">
      <div className="absolute top-3 right-3">
        <CopyButton text={code} />
      </div>
      <pre className="bg-slate-900 border border-slate-700 rounded-xl p-4 pt-3 text-xs text-slate-300 font-mono overflow-x-auto leading-5 whitespace-pre">
        {code}
      </pre>
    </div>
  );
}

export default function Integration() {
  const { publisher } = useAuth();
  const [selectedUnit, setSelectedUnit] = useState(publisher?.adUnits?.[0] || null);

  const units = publisher?.adUnits || [];
  const pubId = publisher?.publisherId || 'YOUR-PUB-ID';
  const zone = selectedUnit?.zoneId || '362093';
  const divId = selectedUnit?.divId || 'div-banner-1';
  const sizes = selectedUnit?.sizes || [[300,250]];
  const region = selectedUnit?.region || 'useast';

  const PREBID_JS_URL = 'https://cdn.jsdelivr.net/npm/prebid.js@latest/dist/not-for-prod/prebid.js';
  const PBS_URL = process.env.REACT_APP_PBS_URL || 'http://localhost:8000';

  const snippet = `<!-- ============================================================
     PubVibe SSP – Prebid.js Integration
     Publisher: ${pubId}
     Zone: ${zone}  Region: ${region.toUpperCase()}
     ============================================================ -->
<script async src="${PREBID_JS_URL}"></script>

<div id="${divId}"></div>

<script>
  var pbjs = pbjs || {};
  pbjs.que = pbjs.que || [];

  var adUnits = [{
    code: '${divId}',
    mediaTypes: {
      banner: {
        sizes: ${JSON.stringify(sizes)}
      }
    },
    bids: [{
      bidder: 'pubvibe',
      params: {
        pubId:  '${pubId}',
        zoneId: '${zone}',
        region: '${region}'      // useast | uswest | eu | apac
      }
    }]
  }];

  pbjs.que.push(function () {
    pbjs.setConfig({
      debug: false,
      bidderTimeout: 2000,
      priceGranularity: 'medium',
      // Point to YOUR Prebid Server instance
      s2sConfig: {
        accountId: '${pubId}',
        bidders: ['pubvibe'],
        defaultVendor: 'appnexuspsp',
        enabled: true,
        endpoint: {
          p1Consent:    '${PBS_URL}/openrtb2/auction',
          noConsent:    '${PBS_URL}/openrtb2/auction'
        }
      }
    });

    pbjs.addAdUnits(adUnits);
    pbjs.requestBids({
      bidsBackHandler: function (bids) {
        var highestCpm = pbjs.getHighestCpmBids('${divId}')[0];
        if (highestCpm) {
          pbjs.renderAd(document, highestCpm.adId);
        }
      }
    });
  });
</script>`;

  const asyncSnippet = `<!-- Async/DFP-friendly version with GPT integration -->
<script async src="${PREBID_JS_URL}"></script>
<script async src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"></script>

<script>
  var googletag = googletag || { cmd: [] };
  var pbjs = pbjs || {};
  pbjs.que = pbjs.que || [];

  // 1. Define GPT slot
  googletag.cmd.push(function () {
    googletag.defineSlot('/your-network-id/slot-name', ${JSON.stringify(sizes[0] || [300,250])}, '${divId}')
      .addService(googletag.pubads());
    googletag.pubads().disableInitialLoad();
    googletag.enableServices();
  });

  // 2. Setup Prebid
  pbjs.que.push(function () {
    pbjs.addAdUnits([{
      code: '${divId}',
      mediaTypes: { banner: { sizes: ${JSON.stringify(sizes)} } },
      bids: [{
        bidder: 'pubvibe',
        params: { pubId: '${pubId}', zoneId: '${zone}', region: '${region}' }
      }]
    }]);

    pbjs.requestBids({
      bidsBackHandler: function () {
        googletag.cmd.push(function () {
          pbjs.setTargetingForGPTAsync();
          googletag.pubads().refresh();
        });
      }
    });
  });
</script>

<div id="${divId}">
  <script>googletag.cmd.push(function(){ googletag.display('${divId}'); });</script>
</div>`;

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-white">Integration Guide</h1>
        <p className="text-sm text-slate-400 mt-1">Copy the snippet for your ad unit and paste it into your website's HTML.</p>
      </div>

      {/* Ad unit selector */}
      {units.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-white">Select Ad Unit</h2>
          <div className="flex flex-wrap gap-2">
            {units.map(u => (
              <button key={u._id} onClick={() => setSelectedUnit(u)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedUnit?._id === u._id ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'
                }`}>
                {u.name}
              </button>
            ))}
          </div>
          {selectedUnit && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-700">
              <div><span className="text-slate-500">Zone ID</span><br /><span className="text-teal-400 font-mono">{selectedUnit.zoneId}</span></div>
              <div><span className="text-slate-500">Div ID</span><br /><span className="text-white font-mono">{selectedUnit.divId}</span></div>
              <div><span className="text-slate-500">Region</span><br /><span className="text-white uppercase">{selectedUnit.region}</span></div>
              <div><span className="text-slate-500">Sizes</span><br /><span className="text-slate-300">{selectedUnit.sizes?.map(s => s.join('×')).join(', ')}</span></div>
            </div>
          )}
        </div>
      )}

      {/* Step 1 */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
          <h2 className="font-semibold text-white">Basic Prebid.js Integration</h2>
        </div>
        <p className="text-sm text-slate-400 ml-9">Paste this into your page's <code className="text-teal-400 bg-slate-700 px-1 rounded text-xs">&lt;body&gt;</code>:</p>
        <CodeBlock code={snippet} />
      </div>

      {/* Step 2 */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
          <h2 className="font-semibold text-white">Google Ad Manager (GPT) Integration</h2>
        </div>
        <p className="text-sm text-slate-400 ml-9">If you use Google Ad Manager, use this version instead:</p>
        <CodeBlock code={asyncSnippet} />
      </div>

      {/* ads.txt reminder */}
      <div className="bg-amber-900/20 border border-amber-700/50 rounded-xl p-5 space-y-2">
        <h3 className="font-semibold text-amber-400">⚠ Don't forget ads.txt</h3>
        <p className="text-sm text-slate-300">Add this line to each website's <code className="text-teal-400 text-xs bg-slate-700 px-1 rounded">ads.txt</code>:</p>
        <pre className="font-mono text-xs text-teal-300 bg-slate-900 border border-slate-700 rounded-lg p-3 overflow-x-auto">
          trackifyy.com, {pubId}, DIRECT
        </pre>
      </div>

      {/* PBS endpoints reference */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-white">PubVibe Regional Endpoints</h2>
        <div className="space-y-2 text-sm">
          {[
            { region: 'US East (New York)',    url: 'https://rtb-useast.trackifyy.com/rtb?zone=' + zone },
            { region: 'US West (Phoenix)',      url: 'https://rtb-uswest.trackifyy.com/rtb?zone=' + zone },
            { region: 'EU (Amsterdam)',         url: 'https://rtb-eu.trackifyy.com/rtb?zone=' + zone },
            { region: 'APAC (Singapore)',       url: 'https://rtb-apac.trackifyy.com/rtb?zone=' + zone },
          ].map(e => (
            <div key={e.region} className="flex items-start gap-3">
              <span className="text-slate-400 shrink-0 w-36">{e.region}</span>
              <code className="text-teal-400 text-xs font-mono break-all">{e.url}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
