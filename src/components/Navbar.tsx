import React, { useState, useRef, useEffect } from 'react';
import { useEnergy } from '../context/EnergyContext';
import { 
  Zap, 
  Activity, 
  BarChart3, 
  Receipt, 
  TrendingUp, 
  Users, 
  PlusCircle, 
  Shield, 
  UserCheck, 
  Building2, 
  LogOut,
  Sparkles,
  BookOpen,
  ChevronDown,
  Sun,
  Moon,
  Calendar,
  X,
  Cloud,
  Radio,
  AlertTriangle
} from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenEnterReading: () => void;
  onOpenNotebookModal: () => void;
  onOpenRoleModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenEnterReading,
  onOpenNotebookModal,
  onOpenRoleModal,
}) => {
  const { 
    currentUser, 
    notifications,
    isAdmin, 
    isBlockIncharge, 
    isViewer, 
    userAssignedBlock, 
    canEnterReading, 
    tariff,
    theme,
    isDarkMode,
    toggleTheme,
    setTheme,
    logout,
    syncStatus,
  } = useEnergy();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Admin / Lead Engineer',
          bgColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          icon: Shield,
        };
      case 'block_incharge':
        return {
          label: `${userAssignedBlock?.name || 'Block'} In-Charge`,
          bgColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
          icon: UserCheck,
        };
      case 'viewer':
        return {
          label: 'View Only (Auditor)',
          bgColor: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
          icon: Building2,
        };
    }
  };

  const roleInfo = getRoleBadge(currentUser.role);
  const RoleIcon = roleInfo.icon;
  const unreadNotificationCount = notifications.filter(
    (notification) => !notification.readByUserIds.includes(currentUser.id)
  ).length;

  const navItems = [
    { id: 'dashboard', label: 'Energy Monitoring', icon: Activity },
    { id: 'daywise', label: 'Day-Wise Consumption', icon: Calendar },
    { id: 'graphs', label: 'Consumption Graphs', icon: BarChart3 },
    { id: 'mseb', label: 'MSEB Bill', icon: Zap },
    { id: 'billing', label: 'Live Billing', icon: Receipt },
    { id: 'comparison', label: 'Bill Comparison', icon: TrendingUp },
    { id: 'exceedances', label: 'Limit Alerts', icon: AlertTriangle },
    { id: 'users', label: 'Users & Settings', icon: Users },
  ];

  return (
    <header className={`sticky top-0 z-30 backdrop-blur-md border-b transition-all no-print ${
      isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/95 border-slate-200 shadow-xs'
    }`}>
      {/* Top Banner / Department Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-lg text-white ${
              isDarkMode 
                ? 'bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-cyan-500/20' 
                : 'bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-blue-500/25'
            }`}>
              <Zap className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-extrabold text-lg sm:text-xl tracking-tight ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  Volt<span className={isDarkMode ? 'text-cyan-400' : 'text-blue-600'}>Wise</span>
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                  isDarkMode 
                    ? 'bg-cyan-950 text-cyan-400 border-cyan-800/50' 
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  Electrical Dept
                </span>
              </div>
              <p className={`text-xs hidden sm:block font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Digital Energy Monitoring & Smart Billing System
              </p>
            </div>
          </div>

          {/* Quick Actions & Role Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Sync Status Indicator */}
            <div
              title={
                syncStatus === 'cloud'
                  ? 'Cloud database connected: multi-device sync is active.'
                  : 'Local Server Sync: Real-time sync on local network. For cloud multi-PC sync on Vercel, set DATABASE_URL.'
              }
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                syncStatus === 'cloud'
                  ? isDarkMode
                    ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-400'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : isDarkMode
                    ? 'bg-cyan-950/50 border-cyan-800/40 text-cyan-400'
                    : 'bg-blue-50 border-blue-200 text-blue-700'
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    syncStatus === 'cloud' ? 'bg-emerald-400' : 'bg-cyan-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    syncStatus === 'cloud' ? 'bg-emerald-500' : 'bg-cyan-500'
                  }`}
                />
              </span>
              <span className="text-[11px] font-medium tracking-wide">
                {syncStatus === 'cloud' ? 'Cloud Live Sync' : 'Real-Time Sync'}
              </span>
            </div>

            {/* Dark / Light Mode Switcher */}
            <button
              id="btn-theme-toggle"
              onClick={toggleTheme}
              title={isDarkMode ? 'Shift to Light Mode' : 'Shift to Dark Mode'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer shadow-xs active:scale-95 ${
                isDarkMode
                  ? 'bg-slate-800/90 hover:bg-slate-700/80 border-slate-700/80 text-slate-300 hover:text-white'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800 hover:text-slate-950'
              }`}
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span className="hidden sm:inline text-amber-300">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span className="hidden sm:inline text-indigo-700 font-bold">Dark</span>
                </>
              )}
            </button>

            {/* Notebook Batch Entry Button */}
            <button
              id="btn-notebook-digitize"
              onClick={onOpenNotebookModal}
              title="Digitize physical notebook readings"
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                isDarkMode
                  ? 'text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border-slate-700'
                  : 'text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-300'
              }`}
            >
              <BookOpen className={`w-3.5 h-3.5 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
              <span>Notebook Batch Entry</span>
            </button>

            {/* Enter Reading Primary Button */}
            <button
              id="btn-enter-reading"
              onClick={onOpenEnterReading}
              disabled={!canEnterReading()}
              className={`flex items-center gap-2 px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-lg shadow-sm transition-all ${
                canEnterReading()
                  ? isDarkMode
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/25 hover:shadow-cyan-500/40 active:scale-98 cursor-pointer'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 hover:shadow-blue-500/35 active:scale-98 cursor-pointer'
                  : isDarkMode
                    ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Enter Reading</span>
            </button>

            {/* Divider between operational buttons and session controls */}
            <div className={`hidden sm:block h-6 w-px mx-0.5 sm:mx-1 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-300'}`} />

            {/* User Profile & Account Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                id="btn-role-switcher"
                onClick={() => setShowProfileMenu((prev) => !prev)}
                title="Account profile & options"
                aria-expanded={showProfileMenu}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-left transition-all cursor-pointer ${
                  showProfileMenu
                    ? isDarkMode
                      ? 'bg-slate-800 border-cyan-500/50 shadow-md ring-1 ring-cyan-500/30'
                      : 'bg-slate-200 border-blue-400 shadow-md'
                    : isDarkMode
                      ? 'bg-slate-800/90 hover:bg-slate-750 border-slate-700/80 hover:border-slate-600'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-300 shadow-xs'
                }`}
              >
                <div className={`w-7 h-7 rounded-full border flex items-center justify-center font-bold text-xs ${
                  isDarkMode
                    ? 'bg-cyan-900/60 border-cyan-500/40 text-cyan-300'
                    : 'bg-blue-100 border-blue-300 text-blue-700'
                }`}>
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden lg:block">
                  <div className={`text-xs font-bold leading-tight ${
                    isDarkMode ? 'text-slate-200' : 'text-slate-900'
                  }`}>
                    {currentUser.name}
                  </div>
                  <div className={`text-[10px] font-medium flex items-center gap-1 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                      isAdmin ? (isDarkMode ? 'bg-amber-400' : 'bg-amber-600') : isBlockIncharge ? (isDarkMode ? 'bg-cyan-400' : 'bg-blue-600') : (isDarkMode ? 'bg-slate-400' : 'bg-slate-500')
                    }`}></span>
                    {roleInfo.label}
                  </div>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  showProfileMenu ? 'rotate-180 text-cyan-400' : isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`} />
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className={`absolute right-0 top-full mt-2 w-72 rounded-2xl border shadow-2xl z-50 overflow-hidden animate-fadeIn ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-white shadow-black/80' : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/60'
                }`}>
                  {/* Dropdown Header */}
                  <div className={`p-4 border-b ${isDarkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-base ${
                        isDarkMode ? 'bg-cyan-950 border-cyan-500/40 text-cyan-300' : 'bg-blue-50 border-blue-300 text-blue-700'
                      }`}>
                        {currentUser.name.charAt(0)}
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-bold text-sm truncate">{currentUser.name}</div>
                        <div className="text-xs text-cyan-400 font-mono">@{currentUser.username}</div>
                        <div className="text-[10px] text-slate-400 truncate">{currentUser.designation || roleInfo.label}</div>
                      </div>
                    </div>
                    <div className="mt-2.5 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Assigned Scope:</span>
                      <span className="font-semibold text-slate-200 truncate max-w-[150px]">
                        {currentUser.assignedBlockId === 'ALL' || !currentUser.assignedBlockId ? 'All Blocks (Campus)' : `${userAssignedBlock?.name || currentUser.assignedBlockId}`}
                      </span>
                    </div>
                  </div>

                  {/* Dropdown Actions */}
                  <div className="p-2 space-y-1 text-xs">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        onOpenRoleModal();
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors text-left cursor-pointer ${
                        isDarkMode ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <UserCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div>
                        <div className="font-semibold">Switch Account / Role</div>
                        <div className="text-[10px] text-slate-400">Switch role or test other block views</div>
                      </div>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          setActiveTab('users');
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors text-left cursor-pointer ${
                          isDarkMode ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                        }`}
                      >
                        <Users className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <div className="font-semibold">Users &amp; Block Passwords</div>
                          <div className="text-[10px] text-slate-400">Manage credentials and permissions</div>
                        </div>
                      </button>
                    )}
                  </div>

                  {/* Dropdown Logout */}
                  <div className={`p-2 border-t ${isDarkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50/60'}`}>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        setShowLogoutModal(true);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isDarkMode
                          ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <LogOut className="w-4 h-4 text-rose-400" />
                        <span>Sign Out of Portal</span>
                      </span>
                      <span className="text-[10px] font-mono opacity-75">@{currentUser.username}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Standalone Logout Action in Navbar */}
            <button
              id="btn-navbar-logout"
              onClick={() => setShowLogoutModal(true)}
              title="Log out and return to Login Screen"
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                isDarkMode
                  ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border-rose-500/30 hover:border-rose-500/50 shadow-xs'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border-rose-200 hover:border-rose-300 shadow-xs'
              }`}
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className={`flex space-x-1 overflow-x-auto py-2 border-t scrollbar-none ${
          isDarkMode ? 'border-slate-800/60' : 'border-slate-200'
        }`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? isDarkMode
                      ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm'
                      : 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                    : isDarkMode
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${
                  isActive 
                    ? isDarkMode ? 'text-cyan-400' : 'text-blue-600' 
                    : isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`} />
                <span className="flex items-center gap-2">
                  {item.label}
                  {item.id === 'exceedances' && unreadNotificationCount > 0 && (
                    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                      {unreadNotificationCount}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Role Notice for Block In-Charge / Viewer */}
      {isBlockIncharge && userAssignedBlock && (
        <div className={`border-b px-4 py-1 text-center text-xs flex items-center justify-center gap-2 ${
          isDarkMode ? 'bg-cyan-950/60 border-cyan-800/40 text-cyan-300' : 'bg-blue-50 border-blue-200 text-blue-800 font-medium'
        }`}>
          <UserCheck className="w-3.5 h-3.5" />
          <span>
            You are logged in as <strong>{userAssignedBlock.name} In-Charge</strong>. You have dedicated access to {userAssignedBlock.name} meter readings and billing.
          </span>
        </div>
      )}

      {isViewer && (
        <div className={`border-b px-4 py-1 text-center text-xs flex items-center justify-center gap-2 ${
          isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-amber-50 border-amber-200 text-amber-900 font-medium'
        }`}>
          <Shield className="w-3.5 h-3.5 text-amber-500" />
          <span>
            <strong>Read-Only Access Mode</strong>: You can inspect all meter readings, energy graphs, and live bills. Only authorized Engineers/In-Charges can enter readings.
          </span>
        </div>
      )}

      {/* Logout Confirmation Modal Dialog */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
          <div className={`border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transition-all ${
            isDarkMode ? 'bg-slate-900 border-slate-700 text-white shadow-black/90' : 'bg-white border-slate-200 text-slate-900 shadow-slate-400/40'
          }`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${
              isDarkMode ? 'border-slate-800 bg-slate-950/70' : 'border-slate-100 bg-slate-50'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Confirm Sign Out</h3>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Electrical Energy Monitoring Portal
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLogoutModal(false)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg border flex items-center justify-center font-bold text-xs ${
                    isDarkMode ? 'bg-cyan-950 border-cyan-500/40 text-cyan-300' : 'bg-blue-50 border-blue-300 text-blue-700'
                  }`}>
                    {currentUser.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{currentUser.name}</div>
                    <div className="text-xs text-cyan-400 font-mono">@{currentUser.username}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{roleInfo.label}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    isAdmin
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                  }`}>
                    {isAdmin ? 'Admin' : 'In-Charge'}
                  </span>
                </div>
              </div>

              <p className={`leading-relaxed text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Are you sure you want to log out? Your session will be closed securely, and you will be returned to the sign-in page. All saved readings, tariffs, and configurations remain safely intact.
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowLogoutModal(false)}
                  className={`px-4 py-2 rounded-xl font-semibold transition-colors cursor-pointer text-xs ${
                    isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="btn-confirm-logout"
                  onClick={() => {
                    setShowLogoutModal(false);
                    logout();
                  }}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-md shadow-rose-600/25 flex items-center gap-2 cursor-pointer active:scale-95 text-xs"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Yes, Log Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
