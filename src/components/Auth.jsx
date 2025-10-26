import { useState } from 'react';
import { User, Shield } from 'lucide-react';

export default function Auth({ onLogin }) {
  const [role, setRole] = useState('customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!name || !email) return;
    const user = { id: crypto.randomUUID(), name, email, role };
    onLogin(user);
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white border rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
            <Shield size={20} />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Welcome</h2>
            <p className="text-slate-500 text-sm">Sign in to continue</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full name</label>
            <input value={name} onChange={(e)=>setName(e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Jane Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="jane@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={()=>setRole('customer')} className={(role==='customer'? 'border-indigo-500 ring-2 ring-indigo-200 ':'border-slate-200 ') + 'border rounded-md px-3 py-2 text-sm flex items-center justify-center gap-2'}>
                <User size={16} /> Customer
              </button>
              <button type="button" onClick={()=>setRole('owner')} className={(role==='owner'? 'border-indigo-500 ring-2 ring-indigo-200 ':'border-slate-200 ') + 'border rounded-md px-3 py-2 text-sm flex items-center justify-center gap-2'}>
                <Shield size={16} /> Owner
              </button>
            </div>
          </div>
          <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-4 py-2 font-medium">Continue</button>
        </form>
      </div>
    </div>
  );
}
