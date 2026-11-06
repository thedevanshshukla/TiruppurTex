import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Layers, 
  PlusCircle, 
  AlertTriangle, 
  Smartphone, 
  FileSpreadsheet, 
  LogOut, 
  User as UserIcon,
  ShieldCheck
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
  const { user, logout, quickLogin, demoUsers } = useAuth();

  if (!user) return null;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Banner: Quick Role Switcher for Reviewers */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1 px-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white tracking-wide uppercase text-[10px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            Reviewer Demo Switcher
          </span>
          <span className="hidden sm:inline text-slate-400">Instant Role Switch:</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {demoUsers.map((d) => {
            const isActive = user.email === d.email;
            return (
              <button
                key={d.email}
                onClick={() => quickLogin(d.email, d.password)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
                title={d.description}
              >
                {d.role === 'merchandiser' && 'Merchandiser'}
                {d.role === 'supervisor' && 'Supervisor (Tamil Floor)'}
                {d.role === 'buyer' && d.email.includes('uk') && 'Buyer B (UK)'}
                {d.role === 'buyer' && d.email.includes('de') && 'Buyer C (Germany)'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-xs">
              TT
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-lg">TiruppurTex</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Production Tracking & Run-Rate Delay Warning</p>
            </div>
          </div>

          {/* Navigation Links based on role */}
          <nav className="flex items-center gap-1">
            {user.role === 'merchandiser' && (
              <>
                <button
                  onClick={() => onSelectTab('order-board')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentTab === 'order-board'
                      ? 'bg-slate-100 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Order Board</span>
                </button>

                <button
                  onClick={() => onSelectTab('new-order')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentTab === 'new-order'
                      ? 'bg-slate-100 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>New PO Setup</span>
                </button>

                <button
                  onClick={() => onSelectTab('ai-inbox')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentTab === 'ai-inbox'
                      ? 'bg-slate-100 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>AI Issue Triage</span>
                </button>

                <button
                  onClick={() => onSelectTab('export')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentTab === 'export'
                      ? 'bg-slate-100 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="hidden md:inline">Weekly Export</span>
                </button>
              </>
            )}

            {user.role === 'supervisor' && (
              <button
                onClick={() => onSelectTab('supervisor-floor')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentTab === 'supervisor-floor'
                    ? 'bg-slate-100 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Floor Update (Mobile)</span>
              </button>
            )}

            {user.role === 'buyer' && (
              <>
                <button
                  onClick={() => onSelectTab('buyer-portal')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentTab === 'buyer-portal'
                      ? 'bg-slate-100 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>My Orders</span>
                </button>

                <button
                  onClick={() => onSelectTab('export')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentTab === 'export'
                      ? 'bg-slate-100 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Weekly Report</span>
                </button>
              </>
            )}
          </nav>

          {/* Right: User Profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-800">{user.name}</div>
              <div className="text-[11px] text-slate-500">{user.email}</div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

