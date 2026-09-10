import React, { useState } from 'react';
import { useEnergy } from '../context/EnergyContext';
import { 
  Shield, 
  UserCheck, 
  Zap, 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Building2, 
  Building, 
  CheckCircle2, 
  AlertCircle, 
  Sun, 
  Moon, 
  ShieldCheck, 
  Activity, 
  Sparkles,
  Layers,
  KeyRound,
  X
} from 'lucide-react';
import { UserRole, User } from '../types';

export const LoginPage: React.FC = () => {
  const { 
    users, 
    login, 
    allBlocks, 
    blocks, 
    isDarkMode, 
    toggleTheme 
  } = useEnergy();

  const availableBlocks = allBlocks || blocks;

  const [activeMode, setActiveMode] = useState<'quick' | 'credentials'>('quick');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // Password Verification Prompt for user card clicks
  const [passwordPromptUser, setPasswordPromptUser] = useState<User | null>(null);
  const [promptPassword, setPromptPassword] = useState<string>('');
  const [showPromptPassword, setShowPromptPassword] = useState<boolean>(false);
  const [promptError, setPromptError] = useState<string>('');

  // Handle manual login submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim()) {
      setErrorMsg('Please enter your username.');
      return;
    }

    if (!password.trim()) {
      setErrorMsg('Password is required to sign in.');
      return;
    }

    const success = await login(username.trim(), password.trim());
    if (!success) {
      setErrorMsg('Invalid username or password. Please check your credentials and try again.');
    }
  };

  // When clicking a user card, prompt for their password
  const handleCardClick = (user: User) => {
    setPasswordPromptUser(user);
    setPromptPassword('');
    setShowPromptPassword(false);
    setPromptError('');
  };

  const handlePromptLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordPromptUser) return;
    setPromptError('');

    if (!promptPassword.trim()) {
      setPromptError('Please enter the password.');
      return;
    }

    const success = await login(passwordPromptUser.username, promptPassword.trim());
    if (success) {
      setPasswordPromptUser(null);
    } else {
      setPromptError(`Invalid password for @${passwordPromptUser.username}. Please try again.`);
    }
  };

  // Helper to prefill credentials form
  const prefill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMsg('');
    setActiveMode('credentials');
  };

  // Block color badges
  const getBlockColor = (assignedBlockId?: string) => {
    if (!assignedBlockId || assignedBlockId === 'ALL') return '#f59e0b';
    const b = blocks.find((blk) => blk.id === assignedBlockId);
    if (b?.color) return b.color;
    if (assignedBlockId === 'block-a') return '#2563eb';
    if (assignedBlockId === 'block-b') return '#059669';
    if (assignedBlockId === 'block-c') return '#d97706';
    if (assignedBlockId === 'block-d') return '#7c3aed';
    return '#3b82f6';
  };

  const getRoleBadge = (role: UserRole, assignedBlockId?: string) => {
    if (role === 'admin') {
      return {
        label: 'Admin (All Blocks)',
        pillClass: isDarkMode 
          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
          : 'bg-amber-50 text-amber-800 border-amber-200',
        icon: Shield,
        description: 'Complete plant oversight across all blocks (A, B, C, D), MSEB incomers, live tariffs & user settings.',
      };
    }
    if (role === 'block_incharge') {
      const blk = availableBlocks.find((b) => b.id === assignedBlockId);
      const blkName = blk?.name || 'Block';
      return {
        label: `${blkName} In-Charge`,
        pillClass: isDarkMode 
          ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' 
          : 'bg-cyan-50 text-cyan-800 border-cyan-200',
        icon: UserCheck,
        description: `Strictly isolated to ${blkName} only. Shows only ${blkName} sub-meters, day-wise graphs, and billing calculations.`,
      };
    }
    return {
      label: 'Energy Auditor (Viewer)',
      pillClass: isDarkMode 
        ? 'bg-slate-500/15 text-slate-300 border-slate-500/30' 
        : 'bg-slate-100 text-slate-700 border-slate-300',
      icon: Eye,
      description: 'Audit and inspection access across all campus blocks with read-only permissions.',
    };
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between transition-colors duration-200 ${
      isDarkMode 
        ? 'bg-slate-950 text-slate-100' 
        : 'bg-slate-100/80 text-slate-900'
    }`}>
      {/* Top Bar with Department Info and Theme Switcher */}
      <header className={`border-b backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between ${
        isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/90 border-slate-200 shadow-2xs'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-base font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Energy Monitoring &amp; Billing System
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                v2.4 Live
              </span>
            </div>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Department of Electrical Engineering &bull; Industrial Substation Division
            </p>
          </div>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer shadow-xs ${
            isDarkMode 
              ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' 
              : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
          }`}
        >
          {isDarkMode ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">Dark Mode</span>
            </>
          )}
        </button>
      </header>

      {/* Main Login Workspace */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="w-full max-w-4xl">
          {/* Hero Explanatory Callout Banner */}
          <div className={`mb-6 p-4 sm:p-5 rounded-2xl border transition-all ${
            isDarkMode 
              ? 'bg-slate-900/90 border-slate-800 shadow-xl' 
              : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                  isDarkMode 
                    ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' 
                    : 'bg-cyan-50 border-cyan-200 text-cyan-700'
                }`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className={`text-sm sm:text-base font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Role-Based Access Control Architecture
                  </h2>
                  <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    <strong>Admin Login:</strong> Full oversight of all blocks (A, B, C, D), plant totals, MSEB incomers &amp; tariff configuration.<br className="hidden sm:inline" />
                    <strong>Block User Login:</strong> Strictly isolated to that block only. Shows only that block&apos;s meters, day-wise consumption, and bill.
                  </p>
                </div>
              </div>

              {/* Mode Toggle Tabs */}
              <div className={`p-1 rounded-xl border flex items-center shrink-0 ${
                isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-300'
              }`}>
                <button
                  type="button"
                  onClick={() => setActiveMode('quick')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeMode === 'quick'
                      ? isDarkMode ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'bg-cyan-600 text-white shadow-xs'
                      : isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  1-Click Role Access
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMode('credentials')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeMode === 'credentials'
                      ? isDarkMode ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'bg-cyan-600 text-white shadow-xs'
                      : isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Credentials Login
                </button>
              </div>
            </div>
          </div>

          {/* MODE 1: 1-Click Role Access Grid (Immediate verification of Admin vs Block Users) */}
          {activeMode === 'quick' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-sm font-bold uppercase tracking-wider ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Select User to Sign In
                  </h3>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Click any engineer profile below to enter their password and sign in with verified data isolation.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map((user) => {
                  const roleMeta = getRoleBadge(user.role, user.assignedBlockId);
                  const RoleIcon = roleMeta.icon;
                  const colorDot = getBlockColor(user.assignedBlockId);

                  return (
                    <div
                      key={user.id}
                      onClick={() => handleCardClick(user)}
                      className={`group p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                        isDarkMode 
                          ? 'bg-slate-900/90 border-slate-800 hover:border-cyan-500/60 hover:bg-slate-900 hover:shadow-xl hover:shadow-cyan-950/20' 
                          : 'bg-white border-slate-200 hover:border-cyan-500 hover:shadow-lg shadow-sm'
                      }`}
                    >
                      {/* Top Bar: Role badge & Icon */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${roleMeta.pillClass}`}>
                            <span 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: colorDot }} 
                            />
                            {roleMeta.label}
                          </span>
                          <span className={`p-1.5 rounded-lg border ${
                            isDarkMode ? 'bg-slate-800/80 border-slate-700/80 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                          }`}>
                            <RoleIcon className="w-4 h-4" />
                          </span>
                        </div>

                        {/* User Identity */}
                        <div className="space-y-0.5">
                          <h4 className={`text-base font-extrabold transition-colors ${
                            isDarkMode ? 'text-white group-hover:text-cyan-300' : 'text-slate-900 group-hover:text-cyan-700'
                          }`}>
                            {user.name}
                          </h4>
                          <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {user.designation}
                          </p>
                          <p className={`text-[11px] font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Username: <strong className={isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}>@{user.username}</strong>
                          </p>
                        </div>

                        {/* Role Description */}
                        <p className={`text-xs mt-3 pt-3 border-t leading-relaxed ${
                          isDarkMode ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-600'
                        }`}>
                          {roleMeta.description}
                        </p>
                      </div>

                      {/* Sign in action button */}
                      <div className="mt-4 pt-3 flex items-center justify-between text-xs font-bold">
                        <span className={`font-mono text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {user.role === 'admin' ? 'Full Plant Access' : user.role === 'block_incharge' ? 'Isolated Block Data' : 'Read-Only'}
                        </span>
                        <span className={`flex items-center gap-1 group-hover:translate-x-1 transition-transform ${
                          isDarkMode ? 'text-cyan-400' : 'text-cyan-600'
                        }`}>
                          <span>Enter Password &rarr;</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* MODE 2: Standard Credentials Form */
            <div className={`p-6 sm:p-8 rounded-2xl border max-w-lg mx-auto ${
              isDarkMode ? 'bg-slate-900/90 border-slate-800 shadow-xl' : 'bg-white border-slate-200 shadow-md'
            }`}>
              <div className="mb-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 mx-auto flex items-center justify-center mb-3">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Sign In to Electrical Portal
                </h3>
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Enter your assigned username and password to access the energy monitoring system.
                </p>
              </div>

              {errorMsg && (
                <div className="mb-5 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Username / Engineer ID
                  </label>
                  <div className="relative">
                    <UserIcon className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
                      isDarkMode ? 'text-slate-500' : 'text-slate-400'
                    }`} />
                    <input
                      id="login-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. Tejas or incharge_a"
                      className={`w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border transition-all ${
                        isDarkMode 
                          ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400' 
                          : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 shadow-2xs'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Password
                  </label>
                  <div className="relative">
                    <Lock className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
                      isDarkMode ? 'text-slate-500' : 'text-slate-400'
                    }`} />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className={`w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border transition-all ${
                        isDarkMode 
                          ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400' 
                          : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 shadow-2xs'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer p-1 ${
                        isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-600 text-cyan-500 focus:ring-cyan-400"
                    />
                    <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>Keep me signed in</span>
                  </label>
                  <span className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Industrial SSL Secured
                  </span>
                </div>

                <button
                  id="btn-submit-login"
                  type="submit"
                  className={`w-full py-2.5 px-4 text-sm font-bold rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 ${
                    isDarkMode 
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20 active:scale-98' 
                      : 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-cyan-600/20 active:scale-98'
                  }`}
                >
                  <span>Sign In to System</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

            </div>
          )}

          {/* Password Prompt Modal Dialog when clicking any user card */}
          {passwordPromptUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
              <div className={`border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transition-all ${
                isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}>
                {/* Modal Header */}
                <div className={`flex items-center justify-between px-6 py-4 border-b ${
                  isDarkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        Password Required
                      </h3>
                      <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Sign in as {passwordPromptUser.name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPasswordPromptUser(null)}
                    className={`cursor-pointer p-1 rounded-lg transition-colors ${
                      isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handlePromptLogin} className="p-6 space-y-4">
                  {/* Selected Account Info Card */}
                  <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div>
                      <div className="font-bold text-sm">{passwordPromptUser.name}</div>
                      <div className="text-xs text-slate-400 font-mono">@{passwordPromptUser.username}</div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        passwordPromptUser.role === 'admin'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                      }`}>
                        {passwordPromptUser.role === 'admin' ? 'Chief Admin' : 'Block In-Charge'}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {passwordPromptUser.assignedBlockId === 'ALL' || !passwordPromptUser.assignedBlockId
                          ? 'All Blocks Access'
                          : `Isolated to ${availableBlocks.find(b => b.id === passwordPromptUser.assignedBlockId)?.name || 'Block'}`}
                      </div>
                    </div>
                  </div>

                  {promptError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{promptError}</span>
                    </div>
                  )}

                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      Enter Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPromptPassword ? 'text' : 'password'}
                        value={promptPassword}
                        onChange={(e) => setPromptPassword(e.target.value)}
                        placeholder="Enter password"
                        autoFocus
                        required
                        className={`w-full px-3 py-2.5 rounded-xl text-sm font-mono border focus:outline-none transition-all pr-10 ${
                          isDarkMode 
                            ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-400' 
                            : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-600 shadow-2xs'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPromptPassword(!showPromptPassword)}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer p-1 ${
                          isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {showPromptPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setPasswordPromptUser(null)}
                      className={`px-4 py-2 text-xs font-semibold rounded-xl cursor-pointer ${
                        isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-md shadow-cyan-500/20 cursor-pointer flex items-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Verify &amp; Sign In</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className={`border-t px-4 sm:px-8 py-3 text-center text-xs flex flex-col sm:flex-row items-center justify-between gap-2 ${
        isDarkMode ? 'bg-slate-900/60 border-slate-800/80 text-slate-500' : 'bg-white border-slate-200 text-slate-500'
      }`}>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Industrial Grid Synchronized &bull; Secure Role-Based Access Engine</span>
        </div>
        <div>
          Energy Monitoring &amp; Billing System &bull; Confidential Internal Utility
        </div>
      </footer>
    </div>
  );
};
