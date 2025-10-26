import { useEffect, useMemo, useState } from 'react';
import { Plus, Calendar, CheckCircle2, XCircle, MapPin, DollarSign, Ruler, Search, Trash2 } from 'lucide-react';
import MapSearch from './MapSearch';

const LS_KEYS = {
  billboards: 'bb_billboards',
  bookings: 'bb_bookings',
};

function load(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    if (!v) return fallback;
    return JSON.parse(v);
  } catch { return fallback; }
}
function save(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

function seedIfEmpty() {
  const existing = load(LS_KEYS.billboards, null);
  if (existing && existing.length) return;
  const sample = [
    { id: crypto.randomUUID(), ownerId: 'seed-owner-1', title: 'Downtown Mega Board', description: 'High-traffic intersection visibility', price: 1200, size: '14x48 ft', lat: 40.7484, lng: -73.9857, address: 'Empire State Bldg Area, NYC', active: true },
    { id: crypto.randomUUID(), ownerId: 'seed-owner-2', title: 'Riverside Display', description: 'Near popular park and mall', price: 800, size: '10x30 ft', lat: 34.0522, lng: -118.2437, address: 'Los Angeles Downtown', active: true },
    { id: crypto.randomUUID(), ownerId: 'seed-owner-1', title: 'Airport Expressway', description: 'Commuter route exposure', price: 1500, size: '20x60 ft', lat: 51.4700, lng: -0.4543, address: 'Heathrow Area, London', active: true },
  ];
  save(LS_KEYS.billboards, sample);
  save(LS_KEYS.bookings, []);
}

function haversine(lat1, lon1, lat2, lon2) {
  function toRad(d){return d*Math.PI/180;}
  const R=6371; const dLat=toRad(lat2-lat1); const dLon=toRad(lon2-lon1);
  const a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  const c=2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  return R*c; // km
}

function parseDate(d){ return new Date(d + 'T00:00:00'); }
function rangesOverlap(aStart, aEnd, bStart, bEnd) { return aStart <= bEnd && bStart <= aEnd; }

export default function Dashboard({ user }) {
  const [billboards, setBillboards] = useState([]);
  const [bookings, setBookings] = useState([]);

  useEffect(() => { seedIfEmpty(); }, []);
  useEffect(() => {
    setBillboards(load(LS_KEYS.billboards, []));
    setBookings(load(LS_KEYS.bookings, []));
  }, []);

  useEffect(() => { save(LS_KEYS.billboards, billboards); }, [billboards]);
  useEffect(() => { save(LS_KEYS.bookings, bookings); }, [bookings]);

  const isOwner = user.role === 'owner';

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        {isOwner ? (
          <OwnerPanel user={user} billboards={billboards} setBillboards={setBillboards} bookings={bookings} />
        ) : (
          <CustomerPanel user={user} billboards={billboards} bookings={bookings} setBookings={setBookings} />
        )}
      </div>
      <div className="lg:col-span-1">
        <SideStats billboards={billboards} bookings={bookings} user={user} />
      </div>
    </div>
  );
}

function SideStats({ billboards, bookings, user }){
  const mine = user.role==='owner' ? billboards.filter(b=>b.ownerId===user.id) : [];
  const myBookings = user.role==='customer' ? bookings.filter(b=>b.userId===user.id && b.status!=='canceled') : [];
  const totalActive = billboards.filter(b=>b.active).length;
  const totalBooked = billboards.filter(b=>isBillboardBookedNow(b, bookings)).length;
  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold mb-3">Overview</h3>
        <ul className="text-sm space-y-2">
          <li className="flex justify-between"><span>Total billboards</span><span className="font-medium">{billboards.length}</span></li>
          <li className="flex justify-between"><span>Active billboards</span><span className="font-medium">{totalActive}</span></li>
          <li className="flex justify-between"><span>Booked right now</span><span className="font-medium">{totalBooked}</span></li>
        </ul>
      </div>
      {user.role==='owner' && (
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold mb-3">Your inventory</h3>
          <ul className="text-sm space-y-2">
            <li className="flex justify-between"><span>Boards</span><span className="font-medium">{mine.length}</span></li>
            <li className="flex justify-between"><span>Currently booked</span><span className="font-medium">{mine.filter(b=>isBillboardBookedNow(b, bookings)).length}</span></li>
          </ul>
        </div>
      )}
      {user.role==='customer' && (
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold mb-3">Your bookings</h3>
          <ul className="text-sm space-y-2">
            <li className="flex justify-between"><span>Active/Upcoming</span><span className="font-medium">{myBookings.filter(b=> new Date(b.endDate)>=new Date()).length}</span></li>
            <li className="flex justify-between"><span>Past</span><span className="font-medium">{myBookings.filter(b=> new Date(b.endDate)<new Date()).length}</span></li>
          </ul>
        </div>
      )}
    </div>
  );
}

function isBillboardBookedNow(b, bookings){
  const today = new Date();
  return bookings.some(k=>k.billboardId===b.id && k.status!=='canceled' && parseDate(k.startDate)<=today && today<=parseDate(k.endDate));
}

function OwnerPanel({ user, billboards, setBillboards, bookings }){
  const [loc, setLoc] = useState(null);
  const [form, setForm] = useState({ title:'', description:'', price:'', size:'' });

  const myBillboards = useMemo(()=> billboards.filter(b=>b.ownerId===user.id), [billboards, user.id]);

  const addBoard = (e) => {
    e.preventDefault();
    if (!loc) return;
    const priceNum = Number(form.price||0);
    const newB = { id: crypto.randomUUID(), ownerId: user.id, title: form.title||'Billboard', description: form.description||'', price: priceNum, size: form.size||'N/A', lat: loc.lat, lng: loc.lng, address: loc.address, active: true };
    setBillboards([newB, ...billboards]);
    setForm({ title:'', description:'', price:'', size:'' });
    setLoc(null);
  };

  const toggleActive = (id) => {
    setBillboards(billboards.map(b=> b.id===id ? {...b, active: !b.active} : b));
  };

  const removeBoard = (id) => {
    const hasBookings = bookings.some(b=>b.billboardId===id && b.status!=='canceled');
    if (hasBookings) { alert('Cannot remove: billboard has bookings.'); return; }
    setBillboards(billboards.filter(b=>b.id!==id));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add a new billboard</h2>
          <Plus size={18} className="text-slate-400" />
        </div>
        <form onSubmit={addBoard} className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <MapSearch value={loc} onSelect={setLoc} height={220} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input className="w-full border rounded-md px-3 py-2" value={form.title} onChange={(e)=>setForm({...form, title:e.target.value})} placeholder="Prime location board"/>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Size</label>
            <input className="w-full border rounded-md px-3 py-2" value={form.size} onChange={(e)=>setForm({...form, size:e.target.value})} placeholder="e.g., 14x48 ft"/>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Price per day (USD)</label>
            <input type="number" className="w-full border rounded-md px-3 py-2" value={form.price} onChange={(e)=>setForm({...form, price:e.target.value})} placeholder="1000"/>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea className="w-full border rounded-md px-3 py-2" rows={3} value={form.description} onChange={(e)=>setForm({...form, description:e.target.value})} placeholder="Traffic, audience, visibility..."/>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-4 py-2">Add Billboard</button>
          </div>
        </form>
      </div>

      <div className="bg-white border rounded-xl shadow-sm">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your billboards</h2>
          <span className="text-sm text-slate-500">{myBillboards.length} total</span>
        </div>
        <ul className="divide-y">
          {myBillboards.map((b)=>{
            const bookedNow = isBillboardBookedNow(b, bookings);
            return (
              <li key={b.id} className="p-5 flex flex-col md:flex-row md:items-center gap-4 justify-between">
                <div className="flex-1">
                  <div className="font-medium">{b.title}</div>
                  <div className="text-sm text-slate-500 flex items-center gap-2">
                    <MapPin size={14} /> {b.address}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex gap-3">
                    <span className="inline-flex items-center gap-1"><DollarSign size={14}/> {b.price}/day</span>
                    <span className="inline-flex items-center gap-1"><Ruler size={14}/> {b.size}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${bookedNow? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {bookedNow? 'Booked now' : 'Available'}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${b.active? 'bg-indigo-100 text-indigo-700':'bg-slate-200 text-slate-700'}`}>{b.active? 'Active':'Inactive'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={()=>toggleActive(b.id)} className="px-3 py-2 border rounded-md text-sm">{b.active? 'Deactivate':'Activate'}</button>
                  <button onClick={()=>removeBoard(b.id)} className="px-3 py-2 border rounded-md text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 size={14}/> Remove</button>
                </div>
              </li>
            );
          })}
          {myBillboards.length===0 && (
            <li className="p-8 text-center text-slate-500">No billboards yet. Add your first one above.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

function CustomerPanel({ user, billboards, bookings, setBookings }){
  const [loc, setLoc] = useState(null);
  const [radius, setRadius] = useState(25); // km
  const [dates, setDates] = useState({ start:'', end:'' });
  const [searchText, setSearchText] = useState('');

  const filtered = useMemo(()=>{
    let list = billboards.filter(b=>b.active);
    if (loc) list = list.filter(b=> haversine(loc.lat, loc.lng, b.lat, b.lng) <= radius);
    if (searchText) {
      const t = searchText.toLowerCase();
      list = list.filter(b => (b.title+' '+b.address+' '+(b.description||'')).toLowerCase().includes(t));
    }
    return list;
  }, [billboards, loc, radius, searchText]);

  const available = useMemo(()=> filtered.filter(b=> isAvailableForDates(b, bookings, dates.start, dates.end)), [filtered, bookings, dates]);

  const book = (board) => {
    if (!dates.start || !dates.end) { alert('Select start and end dates'); return; }
    const s = parseDate(dates.start), e = parseDate(dates.end);
    if (e < s) { alert('End date must be after start date'); return; }
    if (!isAvailableForDates(board, bookings, dates.start, dates.end)) { alert('Billboard not available for selected dates'); return; }
    const id = crypto.randomUUID();
    const newBooking = { id, billboardId: board.id, userId: user.id, startDate: dates.start, endDate: dates.end, status: 'confirmed', createdAt: new Date().toISOString() };
    setBookings([newBooking, ...bookings]);
    alert('Booking confirmed');
  };

  const myBookings = bookings.filter(b=>b.userId===user.id).sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt));

  const cancelBooking = (id) => {
    setBookings(bookings.map(b=> b.id===id ? {...b, status:'canceled'}: b));
  };

  const selectedMap = loc ? { lat: loc.lat, lng: loc.lng, address: loc.address } : null;

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Find billboards</h2>
          <Search size={18} className="text-slate-400" />
        </div>
        <div className="grid gap-4">
          <MapSearch value={selectedMap} onSelect={setLoc} height={220} />
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Radius (km)</label>
              <input type="range" min={5} max={100} step={5} value={radius} onChange={(e)=>setRadius(Number(e.target.value))} className="w-full" />
              <div className="text-xs text-slate-600">{radius} km</div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start date</label>
              <input type="date" value={dates.start} onChange={(e)=>setDates({...dates, start:e.target.value})} className="w-full border rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End date</label>
              <input type="date" value={dates.end} onChange={(e)=>setDates({...dates, end:e.target.value})} className="w-full border rounded-md px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Keyword</label>
            <input value={searchText} onChange={(e)=>setSearchText(e.target.value)} placeholder="city, address, board title" className="w-full border rounded-md px-3 py-2" />
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl shadow-sm">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Available billboards</h2>
          <span className="text-sm text-slate-500">{available.length} results</span>
        </div>
        <ul className="divide-y">
          {available.map(b=> (
            <li key={b.id} className="p-5 grid md:grid-cols-5 gap-4 items-center">
              <div className="md:col-span-3">
                <div className="font-medium">{b.title}</div>
                <div className="text-sm text-slate-500 flex items-center gap-2"><MapPin size={14}/> {b.address}</div>
                <div className="text-xs text-slate-500 mt-1 flex gap-3">
                  <span className="inline-flex items-center gap-1"><DollarSign size={14}/> {b.price}/day</span>
                  <span className="inline-flex items-center gap-1"><Ruler size={14}/> {b.size}</span>
                </div>
              </div>
              <div className="md:col-span-2 flex md:justify-end gap-3 items-center">
                <button onClick={()=>book(b)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-4 py-2">Book</button>
                <span className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700 flex items-center gap-1"><CheckCircle2 size={14}/> Available</span>
              </div>
            </li>
          ))}
          {available.length===0 && (
            <li className="p-8 text-center text-slate-500">No billboards match your filters.</li>
          )}
        </ul>
      </div>

      <div className="bg-white border rounded-xl shadow-sm">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">My bookings</h2>
          <span className="text-sm text-slate-500">{myBookings.length} total</span>
        </div>
        <ul className="divide-y">
          {myBookings.map(b=>{
            const board = billboards.find(x=>x.id===b.billboardId);
            const isPast = new Date(b.endDate)<new Date();
            return (
              <li key={b.id} className="p-5 grid md:grid-cols-5 gap-3 items-center">
                <div className="md:col-span-3">
                  <div className="font-medium">{board?.title||'Billboard'}</div>
                  <div className="text-sm text-slate-500 flex items-center gap-2"><MapPin size={14}/> {board?.address}</div>
                  <div className="text-xs text-slate-500 mt-1">{b.startDate} → {b.endDate}</div>
                </div>
                <div className="md:col-span-2 flex md:justify-end gap-2 items-center">
                  <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${b.status==='canceled' ? 'bg-slate-200 text-slate-700' : isPast ? 'bg-slate-100 text-slate-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {b.status==='canceled' ? <XCircle size={14}/> : <CheckCircle2 size={14}/>} {b.status}
                  </span>
                  {b.status!=='canceled' && !isPast && (
                    <button onClick={()=>cancelBooking(b.id)} className="px-3 py-2 border rounded-md text-sm text-red-600 hover:bg-red-50">Cancel</button>
                  )}
                </div>
              </li>
            );
          })}
          {myBookings.length===0 && (
            <li className="p-8 text-center text-slate-500">No bookings yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

function isAvailableForDates(board, bookings, start, end) {
  if (!board.active) return false;
  if (!start || !end) return !bookings.some(b=>b.billboardId===board.id && b.status!=='canceled');
  const s = parseDate(start), e = parseDate(end);
  if (e < s) return false;
  const conflicts = bookings.filter(b=> b.billboardId===board.id && b.status!=='canceled' && rangesOverlap(s,e, parseDate(b.startDate), parseDate(b.endDate)));
  return conflicts.length===0;
}
