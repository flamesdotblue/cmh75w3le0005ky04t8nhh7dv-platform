export default function Footer(){
  return (
    <footer className="border-t bg-white/70">
      <div className="container mx-auto px-4 py-6 text-xs text-slate-500 flex flex-col sm:flex-row gap-2 justify-between">
        <div>© {new Date().getFullYear()} Billboard Booker. All rights reserved.</div>
        <div className="flex gap-4">
          <a className="hover:text-slate-700" href="#">Terms</a>
          <a className="hover:text-slate-700" href="#">Privacy</a>
          <a className="hover:text-slate-700" href="#">Contact</a>
        </div>
      </div>
    </footer>
  );
}
