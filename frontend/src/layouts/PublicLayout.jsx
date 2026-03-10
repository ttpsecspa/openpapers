import { Link, Outlet } from 'react-router-dom';
import { FileText } from 'lucide-react';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#06080d] text-[#e6edf3]">
      <header className="border-b border-[#1e293b] bg-[#0d1117]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-[#2dd4a8]" />
              <span className="text-xl font-bold font-['Outfit'] text-[#e6edf3]">
                Open<span className="text-[#2dd4a8]">Papers</span>
              </span>
            </Link>

            <nav className="flex items-center gap-6">
              <Link
                to="/"
                className="text-sm text-[#8b949e] hover:text-[#e6edf3] transition-colors"
              >
                Inicio
              </Link>
              <Link
                to="/estado"
                className="text-sm text-[#8b949e] hover:text-[#e6edf3] transition-colors"
              >
                Consultar Estado
              </Link>
              <Link
                to="/login"
                className="text-sm px-4 py-2 rounded-lg bg-[#2dd4a8] text-[#06080d] font-medium hover:bg-[#2dd4a8]/90 transition-colors"
              >
                Iniciar Sesión
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-[#1e293b] bg-[#0d1117] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-[#8b949e]">
            OpenPapers by TTPSEC SPA &mdash; Plataforma de Call for Papers
          </p>
        </div>
      </footer>
    </div>
  );
}
