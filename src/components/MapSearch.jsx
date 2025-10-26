import { useEffect, useMemo, useState } from 'react';
import { MapPin, Search } from 'lucide-react';

export default function MapSearch({ value, onSelect, height = 280, allowClear = true }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const selected = value; // {lat,lng,address}

  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      if (!query || query.length < 3) { setResults([]); return; }
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'en' }, signal: controller.signal });
        const data = await res.json();
        setResults(data.map(r=>({ lat: parseFloat(r.lat), lng: parseFloat(r.lon), address: r.display_name })));
      } catch (e) { /* ignore */ }
    };
    const t = setTimeout(run, 400);
    return () => { controller.abort(); clearTimeout(t); };
  }, [query]);

  const mapSrc = useMemo(() => {
    const lat = selected?.lat ?? 20;
    const lng = selected?.lng ?? 0;
    const zoom = selected ? 14 : 2;
    const marker = selected ? `&mlat=${lat}&mlon=${lng}` : '';
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.05}%2C${lat-0.05}%2C${lng+0.05}%2C${lat+0.05}&layer=mapnik${marker}`;
  }, [selected]);

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search address, city, landmark" className="w-full pl-9 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        {allowClear && selected && (
          <button onClick={()=>onSelect?.(null)} className="px-3 py-2 border rounded-md">Clear</button>
        )}
      </div>
      {results.length>0 && (
        <div className="border rounded-md divide-y mb-3 overflow-hidden">
          {results.map((r, idx)=> (
            <button key={idx} onClick={()=>onSelect?.(r)} className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 text-indigo-600" />
              <span className="text-sm">{r.address}</span>
            </button>
          ))}
        </div>
      )}
      <div className="rounded-lg overflow-hidden border">
        <iframe title="map" src={mapSrc} style={{ width: '100%', height }} />
      </div>
      {selected && (
        <div className="text-xs text-slate-600 mt-2">Selected: {selected.address} ({selected.lat.toFixed(5)}, {selected.lng.toFixed(5)})</div>
      )}
    </div>
  );
}
