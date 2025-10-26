import { LogOut, MapPin, PanelsTopLeft } from 'lucide-react';

export default function Header({ user, onLogout }) {
  return (
    <header className="border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
            <MapPin size={22} />
          </div>
          <div>
            <div className="text-lg font-semibold tracking-tight">Billboard Booker</div>
            <div className="text-xs text-slate-500 -mt-0.5">Find, book, and manage outdoor ads</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden sm:flex items-center text-sm text-slate-600 bg-slate-100 rounded-md px-3 py-1.5">
                <PanelsTopLeft size={16} className="mr-2 text-slate-500" />
                <span className="font-medium">{user.role === 'owner' ? 'Owner' : 'Customer'}</span>
                <span className="mx-2 text-slate-400">•</span>
                <span>{user.name}</span>
              </div>
              <button onClick={onLogout} className="inline-flex items-center gap-2 bg-white border hover:border-slate-300 text-slate-700 px-3 py-2 rounded-md shadow-sm transition">
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <div className="text-sm text-slate-500">Sign in to manage billboards</div>
          )}
        </div>
      </div>
    </header>
  );
}
