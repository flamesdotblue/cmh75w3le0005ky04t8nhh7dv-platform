import { useEffect, useState } from 'react';
import Header from './components/Header';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Footer from './components/Footer';

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('bb_user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const handleLogin = (u) => {
    localStorage.setItem('bb_user', JSON.stringify(u));
    setUser(u);
  };

  const handleLogout = () => {
    localStorage.removeItem('bb_user');
    setUser(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white text-slate-800">
      <Header user={user} onLogout={handleLogout} />
      <main className="flex-1 container mx-auto px-4 py-6">
        {!user ? (
          <Auth onLogin={handleLogin} />
        ) : (
          <Dashboard user={user} />
        )}
      </main>
      <Footer />
    </div>
  );
}
