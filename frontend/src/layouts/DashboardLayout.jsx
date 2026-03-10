import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  Users,
  Mail,
  BookOpen,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useConferenceContext } from '../context/ConferenceContext';
import ConferenceSelector from '../components/ConferenceSelector';

const NAV_ITEMS = [
  { key: 'overview', label: 'Panel General', icon: LayoutDashboard, path: '/dashboard', roles: null },
  { key: 'submissions', label: 'Envios', icon: FileText, path: '/dashboard/submissions', roles: null },
  { key: 'reviews', label: 'Mis Revisiones', icon: ClipboardCheck, path: '/dashboard/reviews', roles: ['reviewer'] },
  { key: 'users', label: 'Usuarios', icon: Users, path: '/dashboard/users', roles: ['admin', 'superadmin'] },
  { key: 'email-log', label: 'Email Log', icon: Mail, path: '/dashboard/email-log', roles: ['admin', 'superadmin'] },
  { key: 'conferences', label: 'Conferencias', icon: BookOpen, path: '/dashboard/conferences', roles: ['superadmin'] },
  { key: 'settings', label: 'Configuración', icon: Settings, path: '/dashboard/settings', roles: ['superadmin'] },
];

function getVisibleItems(role) {
  return NAV_ITEMS.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(role);
  });
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { activeConferenceId, setActiveConferenceId } = useConferenceContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const visibleItems = getVisibleItems(user?.role);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-[#1e293b]">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-6 w-6 text-[#2dd4a8]" />
          <span className="text-lg font-bold font-['Outfit'] text-[#e6edf3]">
            Open<span className="text-[#2dd4a8]">Papers</span>
          </span>
        </div>
        <ConferenceSelector
          value={activeConferenceId}
          onChange={setActiveConferenceId}
        />
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.key}
              to={item.path}
              end={item.path === '/dashboard'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-[#2dd4a8]/10 text-[#2dd4a8]'
                    : 'text-[#8b949e] hover:bg-[#161b22] hover:text-[#e6edf3]'
                }`
              }
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#1e293b]">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-[#2dd4a8]/20 flex items-center justify-center text-[#2dd4a8] text-sm font-medium">
            {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#e6edf3] truncate">
              {user?.full_name || 'Usuario'}
            </p>
            <p className="text-xs text-[#8b949e] truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#8b949e] hover:bg-[#161b22] hover:text-[#e6edf3] transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-[#06080d] text-[#e6edf3]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-[#0d1117] border-r border-[#1e293b] fixed inset-y-0 left-0 z-30">
        {sidebarContent}
      </aside>

      {/* Sidebar - mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0d1117] border-r border-[#1e293b] flex flex-col transform transition-transform duration-200 lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menu"
            className="text-[#8b949e] hover:text-[#e6edf3]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {sidebarContent}
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-4 h-14 border-b border-[#1e293b] bg-[#0d1117]">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
            className="text-[#8b949e] hover:text-[#e6edf3]"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-bold font-['Outfit'] text-[#e6edf3]">
            Open<span className="text-[#2dd4a8]">Papers</span>
          </span>
        </div>

        <main className="p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet context={{ activeConferenceId }} />
        </main>
      </div>
    </div>
  );
}
