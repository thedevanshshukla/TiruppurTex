import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { InfoButton } from './InfoButton';
import { 
  Layers, 
  PlusCircle, 
  AlertTriangle, 
  Smartphone, 
  FileSpreadsheet, 
  LogOut, 
  ShieldCheck,
  Loader2
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
  const { user, logout, quickLogin, demoUsers } = useAuth();
  const [switchingEmail, setSwitchingEmail] = useState<string | null>(null);

  if (!user) return null;

  return (
    <header className="bg-white border-b border-[#e8e6e1] sticky top-0 z-40 shadow-xs">
      {/* Top Banner: Minimal Warm Role Switcher */}
      <div className="bg-[#1e2633] text-stone-300 text-xs py-1.5 px-3 sm:px-6 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="font-semibold text-white tracking-wide uppercase text-[10px] bg-[#2a3648] px-2 py-0.5 rounded border border-[#3b495e]">
            Reviewer Switcher
          </span>
          <InfoButton
            align="left"
            title="Reviewer Role Switcher"
            content={
              <div className="space-y-1 text-stone-600">
                <p><strong>1-Click Persona Switch:</strong> Instantly toggle between roles to evaluate the system from different perspectives:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-[10px]">
                  <li><strong>Merchandiser:</strong> Order board, run-rate math, compliance dates & AI triage.</li>
                  <li><strong>Supervisor:</strong> Tamil floor entry, camera photo proof, offline queueing.</li>
                  <li><strong>Buyer B/C:</strong> Isolated read-only tracking (strictly scoped to their own POs).</li>
                </ul>
              </div>
            }
          />
        </div>

        <div className="flex items-center gap-1 shrink-0 overflow-x-auto py-0.5">
          {demoUsers.map((d) => {
            const isActive = user.email === d.email;
            const isSwitching = switchingEmail === d.email;
            return (
              <button
                key={d.email}
                type="button"
                disabled={isSwitching}
                onClick={async () => {
                  if (isActive) return;
                  try {
                    setSwitchingEmail(d.email);
                    await quickLogin(d.email, d.password);
                  } catch (err) {
                    console.error('Failed to switch persona', err);
                  } finally {
                    setSwitchingEmail(null);
                  }
                }}
                className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors shrink-0 flex items-center gap-1 cursor-pointer ${
                  isActive
                    ? 'bg-amber-600 text-white font-semibold shadow-xs'
                    : 'bg-[#2a3648] text-stone-300 hover:bg-[#38465c] hover:text-white'
                }`}
                title={d.description}
              >
                {isSwitching && <Loader2 className="w-3 h-3 animate-spin shrink-0" />}
                <span>
                  {d.role === 'merchandiser' && 'Merchandiser'}
                  {d.role === 'supervisor' && 'Supervisor (Tamil)'}
                  {d.role === 'buyer' && d.email.includes('uk') && 'Buyer B (UK)'}
                  {d.role === 'buyer' && d.email.includes('de') && 'Buyer C (DE)'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-[#1e2633] flex items-center justify-center text-white font-black text-sm shadow-xs border border-stone-700">
              TT
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-stone-900 tracking-tight text-base sm:text-lg">TiruppurTex</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider bg-stone-100 text-stone-600 border border-stone-200">
                  {user.role}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links based on role */}
          <nav className="flex items-center gap-1 overflow-x-auto py-1">
            {user.role === 'merchandiser' && (
              <>
                <button
                  type="button"
                  onClick={() => onSelectTab('order-board')}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors shrink-0 ${
                    currentTab === 'order-board'
                      ? 'bg-stone-100 text-stone-900 font-bold border border-stone-200'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-stone-600" />
                  <span>Orders</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTab('new-order')}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors shrink-0 ${
                    currentTab === 'new-order'
                      ? 'bg-stone-100 text-stone-900 font-bold border border-stone-200'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5 text-stone-600" />
                  <span>New PO</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTab('ai-inbox')}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors shrink-0 ${
                    currentTab === 'ai-inbox'
                      ? 'bg-stone-100 text-stone-900 font-bold border border-stone-200'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>AI Triage</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTab('export')}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors shrink-0 ${
                    currentTab === 'export'
                      ? 'bg-stone-100 text-stone-900 font-bold border border-stone-200'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-stone-600" />
                  <span className="hidden md:inline">Export</span>
                </button>
              </>
            )}

            {user.role === 'supervisor' && (
              <button
                type="button"
                onClick={() => onSelectTab('supervisor-floor')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors ${
                  currentTab === 'supervisor-floor'
                    ? 'bg-stone-100 text-stone-900 border border-stone-200'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Smartphone className="w-4 h-4 text-amber-600" />
                <span>Floor Update (Mobile)</span>
              </button>
            )}

            {user.role === 'buyer' && (
              <>
                <button
                  type="button"
                  onClick={() => onSelectTab('buyer-portal')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors ${
                    currentTab === 'buyer-portal'
                      ? 'bg-stone-100 text-stone-900 border border-stone-200'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>My Orders</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTab('export')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors ${
                    currentTab === 'export'
                      ? 'bg-stone-100 text-stone-900 border border-stone-200'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 text-stone-600" />
                  <span>Report</span>
                </button>
              </>
            )}
          </nav>

          {/* Right: User Profile & Logout */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-stone-800 leading-tight">{user.name.split(' ')[0]}</div>
              <div className="text-[10px] text-stone-400 leading-tight">{user.role}</div>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Sign Out"
              className="p-1.5 sm:p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
