import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Map, Zap, BookOpen, Wrench,
  TrendingUp, Bot, Settings, ChevronRight,
  LogOut, User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/home', label: 'Overview', icon: LayoutDashboard },
  { to: '/routes', label: 'My Routes', icon: Map },
  { to: '/skills', label: 'Skills', icon: Zap },
  { to: '/resources', label: 'Resources', icon: BookOpen },
  { to: '/projects', label: 'Projects', icon: Wrench },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
  { to: '/guide', label: 'AI Guide', icon: Bot },
];

const BOTTOM_ITEMS = [
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = currentUser?.name
    ? currentUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <aside
      className="hidden lg:flex flex-col h-screen sticky top-0 bg-[#171714] border-r border-[#383832] flex-shrink-0"
      style={{ width: 240 }}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#383832]">
        <button onClick={() => navigate('/')} className="block cursor-pointer text-left">
          <div className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#C89B5B] mb-0.5">RouteMaster</div>
          <div className="text-[10px] tracking-[0.08em] uppercase text-[#77766F]">Your Learning Route</div>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                  ${isActive
                    ? 'bg-[#C89B5B]/10 text-[#C89B5B]'
                    : 'text-[#AAA89F] hover:text-[#F3F0E8] hover:bg-[#22221E]'
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    <Icon size={16} strokeWidth={isActive ? 2 : 1.5} className="flex-shrink-0" />
                    <span>{label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-[#C89B5B]"
                      />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom */}
      <div className="border-t border-[#383832] px-3 py-3">
        <ul className="space-y-0.5 mb-3">
          {BOTTOM_ITEMS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150
                  ${isActive ? 'text-[#C89B5B] bg-[#C89B5B]/10' : 'text-[#77766F] hover:text-[#AAA89F] hover:bg-[#22221E]'}
                `}
              >
                <Icon size={15} strokeWidth={1.5} className="flex-shrink-0" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        {/* User section with dropdown */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#22221E] cursor-pointer transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-full bg-[#C89B5B]/20 border border-[#C89B5B]/40 flex items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-semibold text-[#C89B5B]">{initials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-[#F3F0E8] truncate">{currentUser?.name || 'User'}</div>
              <div className="text-[10px] text-[#77766F] truncate">{currentUser?.target_career || 'Learner'}</div>
            </div>
            <ChevronRight
              size={13}
              className="text-[#77766F] flex-shrink-0 transition-transform duration-150"
              style={{ transform: userMenuOpen ? 'rotate(90deg)' : 'none' }}
            />
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.97 }}
                transition={{ duration: 0.12 }}
                className="absolute bottom-full left-0 right-0 mb-1 bg-[#22221E] border border-[#383832] rounded-lg overflow-hidden shadow-xl"
              >
                <button
                  onClick={() => { navigate('/settings'); setUserMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-[#AAA89F] hover:text-[#F3F0E8] hover:bg-[#292923] transition-colors cursor-pointer text-left"
                >
                  <User size={13} /> Profile & Settings
                </button>
                <div className="border-t border-[#383832]" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-[#A96A5F] hover:bg-[#A96A5F]/10 transition-colors cursor-pointer text-left"
                >
                  <LogOut size={13} /> Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </aside>
  );
}
