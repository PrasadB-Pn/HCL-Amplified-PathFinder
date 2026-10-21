import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, LogOut, Settings } from 'lucide-react';
import { IconButton } from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';

export default function Topbar({ title, subtitle, actions }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [avatarOpen, setAvatarOpen] = useState(false);

  const initials = currentUser?.name
    ? currentUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-[#171714]/95 backdrop-blur-sm border-b border-[#383832] px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: title */}
        <div className="min-w-0">
          <div className="label">{title}</div>
          {subtitle && <p className="text-xs text-[#77766F] mt-0.5 truncate">{subtitle}</p>}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {searchOpen ? (
            <div className="flex items-center gap-2 bg-[#22221E] border border-[#383832] rounded-lg px-3 py-1.5">
              <Search size={13} className="text-[#77766F]" />
              <input
                autoFocus
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onBlur={() => { if (!searchValue) setSearchOpen(false); }}
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-sm text-[#F3F0E8] placeholder-[#77766F] w-40 p-0"
              />
            </div>
          ) : (
            <IconButton icon={<Search size={16} />} onClick={() => setSearchOpen(true)} label="Search" />
          )}

          <IconButton icon={<Bell size={16} />} label="Notifications" />
          {actions}

          {/* Avatar + dropdown */}
          <div className="relative">
            <button
              onClick={() => setAvatarOpen((v) => !v)}
              className="w-7 h-7 rounded-full bg-[#C89B5B]/20 border border-[#C89B5B]/40 flex items-center justify-center cursor-pointer hover:bg-[#C89B5B]/30 transition-colors"
            >
              <span className="text-[11px] font-semibold text-[#C89B5B]">{initials}</span>
            </button>

            <AnimatePresence>
              {avatarOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-[#22221E] border border-[#383832] rounded-lg overflow-hidden shadow-xl z-50"
                >
                  <div className="px-4 py-3 border-b border-[#383832]">
                    <div className="text-xs font-medium text-[#F3F0E8] truncate">{currentUser?.name || 'User'}</div>
                    <div className="text-[10px] text-[#77766F] truncate">{currentUser?.email || ''}</div>
                  </div>
                  <button
                    onClick={() => { navigate('/settings'); setAvatarOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-[#AAA89F] hover:text-[#F3F0E8] hover:bg-[#292923] transition-colors cursor-pointer text-left"
                  >
                    <Settings size={13} /> Settings
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
      </div>
    </header>
  );
}
