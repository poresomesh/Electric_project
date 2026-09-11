import React, { useState } from 'react';
import { useEnergy } from '../context/EnergyContext';
import { 
  Users, 
  Shield, 
  UserCheck, 
  Eye, 
  EyeOff,
  KeyRound,
  Copy,
  CheckCircle2,
  Plus, 
  Settings, 
  Sliders, 
  Building, 
  Gauge, 
  Key, 
  Database, 
  Download, 
  RefreshCw, 
  Check, 
  AlertTriangle,
  Info,
  Trash2,
  Edit2,
  X,
  UserPlus,
  Sun,
  Moon,
  Monitor,
  Lock,
  ShieldAlert
} from 'lucide-react';
import { TariffConfig, UserRole, User, Block, Meter } from '../types';

export const UserManagement: React.FC = () => {
  const {
    users,
    currentUser,
    blocks,
    meters,
    readings,
    tariff,
    theme,
    isDarkMode,
    setTheme,
    toggleTheme,
    isAdmin,
    updateTariff,
    addBlock,
    updateBlock,
    deleteBlock,
    addMeter,
    updateMeter,
    deleteMeter,
    addUser,
    updateUser,
    deleteUser,
    assignBlockCredentials,
    deleteAllReadings,
    resetToDefaults,
    exportDatabaseJson,
  } = useEnergy();

  const [activeSubTab, setActiveSubTab] = useState<'users' | 'tariff' | 'meters' | 'system'>('users');

  // User Edit Modal / Form State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserId, setEditUserId] = useState('');
  const [editUserUsername, setEditUserUsername] = useState('');
  const [editUserPassword, setEditUserPassword] = useState('');
  const [showEditUserPassword, setShowEditUserPassword] = useState(false);
  const [editUserName, setEditUserName] = useState('');
  const [editUserRole, setEditUserRole] = useState<UserRole>('block_incharge');
  const [editUserBlockId, setEditUserBlockId] = useState('ALL');
  const [editUserDesignation, setEditUserDesignation] = useState('');
  const [editUserPhone, setEditUserPhone] = useState('');

  // Add User State
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('SOL@13');
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('block_incharge');
  const [newUserBlockId, setNewUserBlockId] = useState('ALL');
  const [newUserDesignation, setNewUserDesignation] = useState('');

  // Block Credentials Assignment State
  const [assigningBlockModal, setAssigningBlockModal] = useState<Block | null>(null);
  const [assignBlockUserId, setAssignBlockUserId] = useState('');
  const [assignBlockUsername, setAssignBlockUsername] = useState('');
  const [assignBlockPassword, setAssignBlockPassword] = useState('');
  const [assignBlockName, setAssignBlockName] = useState('');
  const [assignBlockPhone, setAssignBlockPhone] = useState('');
  const [assignBlockDesignation, setAssignBlockDesignation] = useState('');
  const [showAssignPassword, setShowAssignPassword] = useState(false);
  const [assignFeedback, setAssignFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Table password visibility and copy feedback
  const [revealedPasswordIds, setRevealedPasswordIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Tariff Edit State
  const [tariffForm, setTariffForm] = useState<TariffConfig>(tariff);
  const [tariffSavedMsg, setTariffSavedMsg] = useState(false);

  // New Block State
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [blockName, setBlockName] = useState('');
  const [blockCode, setBlockCode] = useState('');
  const [blockDesc, setBlockDesc] = useState('');
  const [blockInchargeName, setBlockInchargeName] = useState('');
  const [blockInchargeId, setBlockInchargeId] = useState('');
  const [blockCapacity, setBlockCapacity] = useState(500);
  const [blockTarget, setBlockTarget] = useState(4000);

  // Block Edit State
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [editBlockName, setEditBlockName] = useState('');
  const [editBlockInchargeName, setEditBlockInchargeName] = useState('');
  const [editBlockInchargeId, setEditBlockInchargeId] = useState('');
  const [editBlockDesc, setEditBlockDesc] = useState('');
  const [editBlockTarget, setEditBlockTarget] = useState(4000);

  // New Meter State
  const [showAddMeter, setShowAddMeter] = useState(false);
  const [meterNumber, setMeterNumber] = useState('');
  const [meterName, setMeterName] = useState('');
  const [meterBlockId, setMeterBlockId] = useState(blocks[0]?.id || 'block-a');
  const [meterMultiplier, setMeterMultiplier] = useState(1);
  const [initialReading, setInitialReading] = useState(0);

  // Meter Edit State
  const [editingMeter, setEditingMeter] = useState<Meter | null>(null);
  const [editMeterName, setEditMeterName] = useState('');
  const [editMeterNumber, setEditMeterNumber] = useState('');
  const [editMeterBlockId, setEditMeterBlockId] = useState('');
  const [editMeterMultiplier, setEditMeterMultiplier] = useState(1);
  const [editMeterLocation, setEditMeterLocation] = useState('');

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    type: 'clear_readings' | 'reset_system' | 'delete_block' | 'delete_meter' | 'delete_user';
    id?: string;
    name?: string;
    title: string;
    message: string;
  } | null>(null);
  const [actionFeedbackMsg, setActionFeedbackMsg] = useState<string>('');

  const handleExecuteConfirmedAction = () => {
    if (!confirmModal) return;
    if (confirmModal.type === 'clear_readings') {
      deleteAllReadings();
      setActionFeedbackMsg('All meter readings have been successfully cleared! You can now manually enter your 4-month data.');
    } else if (confirmModal.type === 'reset_system') {
      resetToDefaults();
      setActionFeedbackMsg('System settings, blocks, and initial tariff have been reset.');
    } else if (confirmModal.type === 'delete_block' && confirmModal.id) {
      deleteBlock(confirmModal.id);
      setActionFeedbackMsg(`Block "${confirmModal.name || ''}" removed successfully.`);
    } else if (confirmModal.type === 'delete_meter' && confirmModal.id) {
      deleteMeter(confirmModal.id);
      setActionFeedbackMsg(`Meter "${confirmModal.name || ''}" removed successfully.`);
    } else if (confirmModal.type === 'delete_user' && confirmModal.id) {
      deleteUser(confirmModal.id);
      setActionFeedbackMsg(`User account "${confirmModal.name || ''}" deleted successfully.`);
    }
    setConfirmModal(null);
  };

  const handleOpenEditUser = (user: User) => {
    if (!isAdmin) return;
    setEditingUser(user);
    setEditUserId(user.id);
    setEditUserName(user.name);
    setEditUserUsername(user.username);
    setEditUserPassword(user.password || '');
    setShowEditUserPassword(false);
    setEditUserRole(user.role);
    setEditUserBlockId(user.assignedBlockId || 'ALL');
    setEditUserDesignation(user.designation || '');
    setEditUserPhone(user.phone || '');
  };

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !editingUser) return;
    const finalUserId = editUserId.trim() || editingUser.id;
    const finalName = editUserName.trim();

    await updateUser(editingUser.id, {
      newId: finalUserId,
      name: finalName,
      username: editUserUsername.trim().toLowerCase(),
      password: editUserPassword.trim(),
      role: editUserRole,
      assignedBlockId: editUserBlockId,
      designation: editUserDesignation.trim(),
      phone: editUserPhone.trim(),
    });

    if (editUserRole === 'block_incharge' && editUserBlockId !== 'ALL') {
      updateBlock(editUserBlockId, {
        inchargeName: finalName,
        inchargeId: finalUserId,
      });
    }

    setActionFeedbackMsg(`User account "${finalName}" updated successfully.`);
    setEditingUser(null);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !newUsername || !newUserName) return;
    const cleanUsername = newUsername.toLowerCase().trim().replace(/\s+/g, '_');
    const finalUserId = newUserId.trim() || undefined;
    
    addUser({
      id: finalUserId,
      username: cleanUsername,
      password: newUserPassword.trim(),
      name: newUserName.trim(),
      role: newUserRole,
      assignedBlockId: newUserBlockId,
      email: `${cleanUsername}@company.com`,
      phone: '+91 98000 00000',
      department: 'Electrical Department',
      designation: newUserDesignation.trim() || `${newUserName} (${newUserRole})`,
    });

    if (newUserRole === 'block_incharge' && newUserBlockId !== 'ALL') {
      updateBlock(newUserBlockId, {
        inchargeName: newUserName.trim(),
        inchargeId: finalUserId,
      });
    }

    setActionFeedbackMsg(`New user "${newUserName}" created with username "${cleanUsername}".`);
    setNewUserId('');
    setNewUsername('');
    setNewUserPassword('SOL@13');
    setNewUserName('');
    setNewUserDesignation('');
    setShowAddUser(false);
  };

  const handleOpenAssignBlockCredentials = (block: Block) => {
    if (!isAdmin) return;
    setAssigningBlockModal(block);

    const existingIncharge = users.find(
      (u) =>
        (block.inchargeId && u.id.toLowerCase() === block.inchargeId.toLowerCase()) ||
        (u.assignedBlockId?.toLowerCase() === block.id.toLowerCase() && u.role === 'block_incharge')
    );

    const defaultUserId = existingIncharge?.id || `usr-incharge-${block.id.replace('block-', '')}`;
    const defaultUsername = existingIncharge?.username || `incharge_${block.code.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    const defaultPassword = existingIncharge?.password || 'SOL@13';
    const defaultName = existingIncharge?.name || (block.inchargeName && block.inchargeName !== 'Unassigned' ? block.inchargeName : `${block.name} In-Charge`);
    const defaultPhone = existingIncharge?.phone || '+91 98111 22233';
    const defaultDesignation = existingIncharge?.designation || `${block.name} In-Charge (${block.description || 'Plant Section'})`;

    setAssignBlockUserId(defaultUserId);
    setAssignBlockUsername(defaultUsername);
    setAssignBlockPassword(defaultPassword);
    setAssignBlockName(defaultName);
    setAssignBlockPhone(defaultPhone);
    setAssignBlockDesignation(defaultDesignation);
    setShowAssignPassword(false);
    setAssignFeedback(null);
  };

  const handleSaveBlockCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !assigningBlockModal) return;

    const res = await assignBlockCredentials(assigningBlockModal.id, {
      userId: assignBlockUserId.trim(),
      username: assignBlockUsername.trim().toLowerCase(),
      password: assignBlockPassword.trim(),
      name: assignBlockName.trim(),
      phone: assignBlockPhone.trim(),
      designation: assignBlockDesignation.trim(),
    });

    if (res.success) {
      updateBlock(assigningBlockModal.id, {
        inchargeName: assignBlockName.trim(),
        inchargeId: assignBlockUserId.trim(),
      });
      setActionFeedbackMsg(res.message);
      setAssigningBlockModal(null);
    } else {
      setAssignFeedback({ type: 'error', message: res.message });
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const togglePasswordReveal = (userId: string) => {
    setRevealedPasswordIds((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleSaveTariff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    updateTariff(tariffForm);
    setTariffSavedMsg(true);
    setTimeout(() => setTariffSavedMsg(false), 3000);
  };

  const handleCreateBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !blockName || !blockCode) return;
    
    let finalInchargeName = blockInchargeName.trim() || 'Unassigned';
    let finalInchargeId = blockInchargeId;
    if (blockInchargeId) {
      const selectedUser = users.find((u) => u.id === blockInchargeId);
      if (selectedUser) {
        finalInchargeName = selectedUser.name;
      }
    }

    addBlock({
      name: blockName,
      code: blockCode,
      category: 'production',
      description: blockDesc || `${blockName} facility section`,
      inchargeName: finalInchargeName,
      inchargeId: finalInchargeId,
      capacityKva: blockCapacity,
      targetMonthlyKwh: blockTarget,
      color: '#3b82f6',
    });

    setBlockName('');
    setBlockCode('');
    setBlockDesc('');
    setBlockInchargeName('');
    setBlockInchargeId('');
    setShowAddBlock(false);
  };

  const handleOpenEditBlock = (block: Block) => {
    if (!isAdmin) return;
    setEditingBlock(block);
    setEditBlockName(block.name);
    setEditBlockInchargeName(block.inchargeName || '');
    setEditBlockInchargeId(block.inchargeId || '');
    setEditBlockDesc(block.description || '');
    setEditBlockTarget(block.targetMonthlyKwh || 4000);
  };

  const handleSaveBlockEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !editingBlock) return;

    let finalInchargeName = editBlockInchargeName;
    if (editBlockInchargeId) {
      const u = users.find((usr) => usr.id === editBlockInchargeId);
      if (u) {
        finalInchargeName = u.name;
      }
    }

    updateBlock(editingBlock.id, {
      name: editBlockName,
      inchargeName: finalInchargeName,
      inchargeId: editBlockInchargeId,
      description: editBlockDesc,
      targetMonthlyKwh: editBlockTarget,
    });

    if (editBlockInchargeId) {
      updateUser(editBlockInchargeId, {
        assignedBlockId: editingBlock.id,
      });
    }

    setEditingBlock(null);
  };

  const handleCreateMeter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !meterNumber || !meterName) return;
    addMeter({
      meterNumber,
      name: meterName,
      blockId: meterBlockId,
      meterType: 'main_incomer',
      multiplier: Math.max(1, Number(meterMultiplier) || 1),
      location: 'Main Substation Panel',
      status: 'active',
      initialReading,
      initialDate: '2026-08-30',
    });
    setMeterNumber('');
    setMeterName('');
    setMeterMultiplier(1);
    setShowAddMeter(false);
  };

  const handleOpenEditMeter = (meter: Meter) => {
    if (!isAdmin) return;
    setEditingMeter(meter);
    setEditMeterName(meter.name);
    setEditMeterNumber(meter.meterNumber);
    setEditMeterBlockId(meter.blockId);
    setEditMeterMultiplier(meter.multiplier || 1);
    setEditMeterLocation(meter.location || 'Main Substation Panel');
  };

  const handleSaveMeterEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !editingMeter) return;
    updateMeter(editingMeter.id, {
      name: editMeterName,
      meterNumber: editMeterNumber,
      blockId: editMeterBlockId,
      multiplier: Math.max(1, Number(editMeterMultiplier) || 1),
      location: editMeterLocation,
    });
    setEditingMeter(null);
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportDatabaseJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `voltwise_electrical_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Administration & Policy
            </span>
            <span className="text-xs text-slate-400">Security, Meters, Users & Tariff Configuration</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-1">
            Department User Management & Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Configure role access control, edit names/roles, assign in-charges to blocks, and manage electrical readings data
          </p>
        </div>

        {/* Sub Navigation */}
        <div className="flex items-center p-1 bg-slate-950/80 rounded-xl border border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('users')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'users' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            User Roles & Names
          </button>
          <button
            onClick={() => setActiveSubTab('meters')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'meters' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Blocks & Meters
          </button>
          <button
            onClick={() => setActiveSubTab('tariff')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'tariff' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tariff & Billing Rates
          </button>
          <button
            onClick={() => setActiveSubTab('system')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'system' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Data Management & Storage
          </button>
        </div>
      </div>

      {/* SUBTAB 1: USERS & RBAC */}
      {activeSubTab === 'users' && (
        <div className="space-y-6">
          {!isAdmin && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3 shadow-sm">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold text-sm text-amber-200 block">Read-Only Personnel Directory</span>
                <span className="text-slate-300">
                  You are signed in as <strong className="text-white">{currentUser.name}</strong> ({currentUser.role === 'block_incharge' ? 'Block In-Charge' : 'Auditor'}). Only the Chief Administrator (Tejas) can assign IDs, usernames, and passwords to blocks or department personnel.
                </span>
              </div>
            </div>
          )}

          {/* SECTION: Admin Authority to Assign ID, Username & Password to Each Block */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    <KeyRound className="w-4 h-4" />
                  </span>
                  <h2 className="text-base font-bold text-white">
                    Block In-Charge Credentials & ID / Password Assignment
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  As Chief Administrator (<strong>Tejas</strong>), you have full authority to assign or update the User ID, Username, and Password for each block. When in-charges sign in, they will strictly see only their block's electrical data.
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Admin Authority Active
                </span>
              </div>
            </div>

            {/* Block Credentials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 pt-1">
              {blocks.map((block) => {
                // १. अचूक इनचार्ज युझर शोधणे
                const assignedUser = users.find(
                  (u) =>
                    (block.inchargeId && u.id.toLowerCase() === block.inchargeId.toLowerCase()) ||
                    (u.assignedBlockId?.toLowerCase() === block.id.toLowerCase() && u.role === 'block_incharge') ||
                    (block.inchargeName && u.name.toLowerCase() === block.inchargeName.toLowerCase())
                );
                const isRevealed = assignedUser ? revealedPasswordIds[assignedUser.id] : false;
                const passwordConfigured = Boolean(assignedUser?.passwordConfigured || assignedUser?.password);
                const displayInchargeName = assignedUser?.name || block.inchargeName || 'Unassigned';

                return (
                  <div
                    key={block.id}
                    className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-cyan-500/50 transition-all flex flex-col justify-between group shadow-sm"
                  >
                    <div>
                      {/* Block Header */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: block.color || '#3b82f6' }}
                          />
                          <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                            {block.name}
                          </h3>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {block.code}
                        </span>
                      </div>

                      {/* Credentials Display */}
                      <div className="space-y-2 text-xs bg-slate-900/80 p-3 rounded-lg border border-slate-800/80">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Assigned In-Charge:</span>
                          <span className="font-semibold text-white truncate max-w-[120px]" title={displayInchargeName}>
                            {displayInchargeName}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Assigned ID:</span>
                          <span className="font-mono text-cyan-400 font-semibold text-[11px] truncate max-w-[120px]">
                            {assignedUser?.id || block.inchargeId || 'Not Assigned'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Username:</span>
                          <span className="font-mono text-amber-300 font-semibold text-[11px]">
                            @{assignedUser?.username || 'incharge_' + block.code.toLowerCase()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                          <span className="text-slate-400">Password:</span>
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="text-white font-bold text-xs">
                              {passwordConfigured ? 'Configured' : 'Not configured'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">
                        Data Isolation: User can strictly only view & manage meters under <strong>{block.name}</strong>.
                      </p>
                    </div>

                    {/* Action button */}
                    <div className="mt-4 pt-2 border-t border-slate-800/80">
                      {isAdmin ? (
                        <button
                          type="button"
                          onClick={() => handleOpenAssignBlockCredentials(block)}
                          className="w-full py-2 px-3 rounded-lg text-xs font-bold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Assign ID & Password</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500 flex items-center justify-center gap-1 py-1">
                          <Lock className="w-3 h-3 text-slate-500" />
                          <span>Admin Protected</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Directory Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>All Authorized Personnel & Department User Directory</span>
                </h2>
                <p className="text-xs text-slate-400">
                  {isAdmin
                    ? "Chief Administrator (Tejas) view: Manage IDs, Usernames, Passwords, and Block assignments."
                    : "Facility personnel directory with assigned electrical responsibilities and access scopes"}
                </p>
              </div>

              {isAdmin ? (
                <button
                  onClick={() => setShowAddUser(!showAddUser)}
                  className="px-3 py-1.5 text-xs font-semibold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add New User</span>
                </button>
              ) : (
                <span className="text-xs text-slate-400 font-mono px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>Admin Only</span>
                </span>
              )}
            </div>

            {/* Add User Form Drawer */}
            {isAdmin && showAddUser && (
              <form onSubmit={handleCreateUser} className="p-4 bg-slate-950 border-b border-slate-800 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">Register New Department User & Assign Credentials</h4>
                  <button type="button" onClick={() => setShowAddUser(false)} className="text-slate-400 hover:text-white cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Sagar Mahindrakar"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Login Username</label>
                    <input
                      type="text"
                      placeholder="e.g. incharge_a"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Assigned Password</label>
                    <div className="relative">
                      <input
                        type={showNewUserPassword ? 'text' : 'password'}
                        placeholder="Enter a server-managed credential"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-500 pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showNewUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Custom User ID (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. usr-incharge-a"
                      value={newUserId}
                      onChange={(e) => setNewUserId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">User Role</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="admin">Admin / Chief Engineer (Full Permissions)</option>
                      <option value="block_incharge">Block In-Charge (Read/Write assigned block)</option>
                      <option value="viewer">Viewer / Energy Auditor (Read Only)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Assigned Block Scope</label>
                    <select
                      value={newUserBlockId}
                      onChange={(e) => setNewUserBlockId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="ALL">All Blocks (Facility-Wide)</option>
                      {blocks.map((b) => (
                        <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Designation & Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Electrical Supervisor - Plant Operations"
                    value={newUserDesignation}
                    onChange={(e) => setNewUserDesignation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setShowAddUser(false)} className="px-3 py-1.5 text-slate-400 hover:text-white cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg transition-all cursor-pointer">
                    Create User & Assign Credentials
                  </button>
                </div>
              </form>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-300 uppercase text-[11px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">User / Engineer</th>
                    <th className="py-3 px-4">User ID & Username</th>
                    <th className="py-3 px-4">Password</th>
                    <th className="py-3 px-4">Role Permission</th>
                    <th className="py-3 px-4">Assigned Block Scope</th>
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {users.map((u) => {
                    const block = blocks.find((b) => b.id.toLowerCase() === u.assignedBlockId?.toLowerCase());
                    const isRevealed = revealedPasswordIds[u.id];
                    const passwordConfigured = Boolean(u.passwordConfigured || u.password);

                    return (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-bold text-xs">
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm">{u.name}</div>
                              {u.phone && <div className="text-[10px] text-slate-400">{u.phone}</div>}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-mono text-cyan-400 font-semibold text-xs">{u.id}</div>
                          <div className="font-mono text-amber-300 text-[11px]">@{u.username}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="text-white font-medium text-xs">
                              {passwordConfigured ? 'Configured' : 'Not configured'}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {u.role === 'admin' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold shadow-xs">
                              <Shield className="w-3 h-3 text-amber-400" />
                              Chief Admin / Full Access
                            </span>
                          )}
                          {u.role === 'block_incharge' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold shadow-xs">
                              <UserCheck className="w-3 h-3 text-cyan-400" />
                              Block In-Charge (Read/Write)
                            </span>
                          )}
                          {u.role === 'viewer' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-600 text-[11px] font-semibold shadow-xs">
                              <Eye className="w-3 h-3 text-slate-300" />
                              Read Only Auditor
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-200">
                            {u.assignedBlockId === 'ALL' || !u.assignedBlockId
                              ? 'All Blocks (Facility-Wide)'
                              : block ? `${block.name} (${block.code})` : u.assignedBlockId}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-300 font-medium">
                          {u.designation}
                        </td>

                        <td className="py-3 px-4 text-center">
                          {isAdmin ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenEditUser(u)}
                                title={`Edit credentials and profile for ${u.name}`}
                                className="px-2.5 py-1 text-xs font-semibold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              {users.length > 1 && (
                                <button
                                  onClick={() => {
                                    setConfirmModal({
                                      type: 'delete_user',
                                      id: u.id,
                                      name: u.name,
                                      title: `Delete User: ${u.name}`,
                                      message: `Are you sure you want to delete user account "${u.name}" (@${u.username})? Any blocks assigned to this incharge will become unassigned.`,
                                    });
                                  }}
                                  title={`Delete ${u.name}`}
                                  className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700 text-[11px] font-mono">
                              <Lock className="w-3 h-3 text-slate-500" />
                              Locked
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Edit User Modal Dialog */}
          {isAdmin && editingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
                  <div className="flex items-center gap-2">
                    <Edit2 className="w-5 h-5 text-cyan-400" />
                    <div>
                      <h3 className="text-base font-bold text-white">Edit User & Credentials: {editingUser.name}</h3>
                      <p className="text-xs text-slate-400">Admin Authority: Update user ID, login username, and password</p>
                    </div>
                  </div>
                  <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveUserEdit} className="p-6 space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">User ID</label>
                      <input
                        type="text"
                        value={editUserId}
                        onChange={(e) => setEditUserId(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-500 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Login Username</label>
                      <input
                        type="text"
                        value={editUserUsername}
                        onChange={(e) => setEditUserUsername(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 font-mono focus:outline-none focus:border-cyan-500 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Password</label>
                    <div className="relative">
                      <input
                        type={showEditUserPassword ? 'text' : 'password'}
                        value={editUserPassword}
                        onChange={(e) => setEditUserPassword(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-500 text-xs pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditUserPassword(!showEditUserPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showEditUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                    <input
                      type="text"
                      value={editUserName}
                      onChange={(e) => setEditUserName(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">User Role</label>
                      <select
                        value={editUserRole}
                        onChange={(e) => setEditUserRole(e.target.value as UserRole)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="admin">Admin / Chief Engineer</option>
                        <option value="block_incharge">Block In-Charge</option>
                        <option value="viewer">Viewer / Energy Auditor</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Assigned Block Scope</label>
                      <select
                        value={editUserBlockId}
                        onChange={(e) => setEditUserBlockId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="ALL">All Blocks (Facility-Wide)</option>
                        {blocks.map((b) => (
                          <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Designation & Notes</label>
                      <input
                        type="text"
                        value={editUserDesignation}
                        onChange={(e) => setEditUserDesignation(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={editUserPhone}
                        onChange={(e) => setEditUserPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setEditingUser(null)}
                      className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
                    >
                      Save Credentials & User
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Block Credentials Assignment Modal Dialog */}
          {isAdmin && assigningBlockModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-cyan-400" />
                    <div>
                      <h3 className="text-base font-bold text-white">
                        Assign ID & Password: {assigningBlockModal.name}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Admin authority to set login credentials for {assigningBlockModal.code}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setAssigningBlockModal(null)} className="text-slate-400 hover:text-white cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {assignFeedback && (
                  <div className={`p-3 mx-6 mt-4 rounded-xl text-xs flex items-center gap-2 ${
                    assignFeedback.type === 'error'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{assignFeedback.message}</span>
                  </div>
                )}

                <form onSubmit={handleSaveBlockCredentials} className="p-6 space-y-4 text-xs">
                  <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-300 text-xs">
                    <strong>Notice:</strong> When the in-charge for {assigningBlockModal.name} signs in with this Username and Password, the system will strictly isolate their view so they only see data for {assigningBlockModal.name}.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">In-Charge User ID</label>
                      <input
                        type="text"
                        value={assignBlockUserId}
                        onChange={(e) => setAssignBlockUserId(e.target.value)}
                        placeholder="e.g. usr-incharge-a"
                        required
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Login Username</label>
                      <input
                        type="text"
                        value={assignBlockUsername}
                        onChange={(e) => setAssignBlockUsername(e.target.value)}
                        placeholder="e.g. incharge_a"
                        required
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-300 font-semibold">Assign Password</label>
                      <button
                        type="button"
                        onClick={() => {
                          const randomNum = Math.floor(100 + Math.random() * 900);
                          const generated = `block@${randomNum}`;
                          setAssignBlockPassword(generated);
                          setShowAssignPassword(true);
                        }}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 cursor-pointer"
                      >
                        Generate Random
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showAssignPassword ? 'text' : 'password'}
                        value={assignBlockPassword}
                        onChange={(e) => setAssignBlockPassword(e.target.value)}
                        placeholder="Enter secure password"
                        required
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAssignPassword(!showAssignPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showAssignPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">In-Charge Full Name</label>
                      <input
                        type="text"
                        value={assignBlockName}
                        onChange={(e) => setAssignBlockName(e.target.value)}
                        placeholder="e.g. Sagar Mahindrakar"
                        required
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Contact Phone</label>
                      <input
                        type="text"
                        value={assignBlockPhone}
                        onChange={(e) => setAssignBlockPhone(e.target.value)}
                        placeholder="e.g. +91 98111 22233"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Department Designation</label>
                    <input
                      type="text"
                      value={assignBlockDesignation}
                      onChange={(e) => setAssignBlockDesignation(e.target.value)}
                      placeholder="e.g. Block A Operations In-Charge"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setAssigningBlockModal(null)}
                      className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-md shadow-cyan-500/20 cursor-pointer flex items-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Save & Assign Credentials</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* RBAC Permission Matrix Card */}
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                <span>Role Permissions Matrix</span>
              </h3>
              <span className="text-xs text-slate-400 font-medium">Department Access Levels & Security Policies</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span>Admin / Lead Engineer</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">Full Access</span>
                </div>
                <ul className="space-y-1.5 text-slate-200 text-xs">
                  <li className="flex items-start gap-1.5"><span className="text-emerald-400 font-bold">✓</span> Enter meter readings for ALL blocks</li>
                  <li className="flex items-start gap-1.5"><span className="text-emerald-400 font-bold">✓</span> Edit & delete historical meter records</li>
                  <li className="flex items-start gap-1.5"><span className="text-emerald-400 font-bold">✓</span> Configure Tariff rates & fixed demand charges</li>
                  <li className="flex items-start gap-1.5"><span className="text-emerald-400 font-bold">✓</span> Add & manage Block, Meter, and User assets</li>
                  <li className="flex items-start gap-1.5"><span className="text-emerald-400 font-bold">✓</span> Export official invoice slips & CSV audits</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-cyan-300 flex items-center gap-1.5 text-xs">
                    <UserCheck className="w-4 h-4 text-cyan-400" />
                    <span>Block In-Charge (e.g. A Block)</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">Block Read/Write</span>
                </div>
                <ul className="space-y-1.5 text-slate-200 text-xs">
                  <li className="flex items-start gap-1.5"><span className="text-emerald-400 font-bold">✓</span> Enter daily readings for assigned block only</li>
                  <li className="flex items-start gap-1.5"><span className="text-emerald-400 font-bold">✓</span> View block-specific consumption graphs</li>
                  <li className="flex items-start gap-1.5"><span className="text-emerald-400 font-bold">✓</span> Access live bill calculation for assigned block</li>
                  <li className="flex items-start gap-1.5"><span className="text-emerald-400 font-bold">✓</span> Print departmental assessment slips</li>
                  <li className="flex items-start gap-1.5 text-slate-400"><span className="text-rose-400 font-bold">✗</span> Restricted from modifying tariff or other blocks</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                    <Eye className="w-4 h-4 text-slate-300" />
                    <span>Viewer / Energy Auditor</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-600">Read-Only</span>
                </div>
                <ul className="space-y-1.5 text-slate-200 text-xs">
                  <li className="flex items-start gap-1.5"><span className="text-emerald-400 font-bold">✓</span> Inspect monitoring tables & graphs</li>
                  <li className="flex items-start gap-1.5"><span className="text-emerald-400 font-bold">✓</span> View facility-wide energy analytics</li>
                  <li className="flex items-start gap-1.5"><span className="text-emerald-400 font-bold">✓</span> Generate CSV report exports</li>
                  <li className="flex items-start gap-1.5 text-slate-400"><span className="text-rose-400 font-bold">✗</span> Cannot submit or edit meter data</li>
                  <li className="flex items-start gap-1.5 text-slate-400"><span className="text-rose-400 font-bold">✗</span> Cannot modify tariff or infrastructure assets</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: BLOCKS & METERS */}
      {activeSubTab === 'meters' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {!isAdmin && (
            <div className="col-span-full p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3 shadow-sm">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold text-sm text-amber-200 block">Restricted Asset Configuration</span>
                <span className="text-slate-300">
                  Only the Chief Administrator can register, modify, or delete facility load blocks and energy meters.
                </span>
              </div>
            </div>
          )}

          {/* Blocks List */}
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">Facility Blocks</h3>
                <p className="text-xs text-slate-400">{blocks.length} active load zones with designated In-Charges</p>
              </div>
              {isAdmin ? (
                <button
                  onClick={() => setShowAddBlock(!showAddBlock)}
                  className="px-3 py-1.5 text-xs font-semibold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Block</span>
                </button>
              ) : (
                <span className="text-xs text-slate-400 font-mono px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>Admin Only</span>
                </span>
              )}
            </div>

            {isAdmin && showAddBlock && (
              <form onSubmit={handleCreateBlock} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                <h4 className="font-bold text-slate-200">Register New Facility Block</h4>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Block Name (e.g. F Block)"
                    value={blockName}
                    onChange={(e) => setBlockName(e.target.value)}
                    required
                    className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Code (e.g. BLK-F)"
                    value={blockCode}
                    onChange={(e) => setBlockCode(e.target.value)}
                    required
                    className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Assign In-Charge Name / Person</label>
                  <select
                    value={blockInchargeId}
                    onChange={(e) => {
                      setBlockInchargeId(e.target.value);
                      const found = users.find((u) => u.id === e.target.value);
                      if (found) setBlockInchargeName(found.name);
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white mb-2"
                  >
                    <option value="">-- Select from Existing Department Personnel --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} (@{u.username})</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Or type In-Charge Name directly"
                    value={blockInchargeName}
                    onChange={(e) => setBlockInchargeName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowAddBlock(false)} className="px-3 py-1 text-slate-400 cursor-pointer">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 bg-cyan-500 text-slate-950 font-bold rounded-lg cursor-pointer">Save Block</button>
                </div>
              </form>
            )}

            <div className="space-y-2.5">
              {blocks.map((b) => (
                <div key={b.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.color }}></span>
                      <span className="font-bold text-white text-sm">{b.name}</span>
                      <span className="font-mono text-cyan-400 font-semibold">({b.code})</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-cyan-300 font-medium">In-Charge: <strong className="text-white">{b.inchargeName || 'Unassigned'}</strong></span>
                      <span className="text-[11px] text-slate-500">•</span>
                      <span className="text-[11px] text-slate-400 truncate max-w-xs">{b.description}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdmin ? (
                      <>
                        <button
                          onClick={() => handleOpenEditBlock(b)}
                          title={`Edit ${b.name}`}
                          className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setConfirmModal({
                              type: 'delete_block',
                              id: b.id,
                              name: b.name,
                              title: `Delete Block: ${b.name}`,
                              message: `Are you sure you want to delete ${b.name}? All associated readings for this block will also be removed.`,
                            });
                          }}
                          title={`Remove ${b.name}`}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-slate-500" />
                        Locked
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Edit Block Modal */}
          {isAdmin && editingBlock && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
                  <h3 className="text-base font-bold text-white">Edit Block: {editingBlock.name}</h3>
                  <button onClick={() => setEditingBlock(null)} className="text-slate-400 hover:text-white cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveBlockEdit} className="p-6 space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Block Name</label>
                    <input
                      type="text"
                      value={editBlockName}
                      onChange={(e) => setEditBlockName(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Assign In-Charge Name</label>
                    <select
                      value={editBlockInchargeId}
                      onChange={(e) => {
                        setEditBlockInchargeId(e.target.value);
                        const found = users.find((u) => u.id === e.target.value);
                        if (found) setEditBlockInchargeName(found.name);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 mb-2"
                    >
                      <option value="">-- Choose User --</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.name} (@{u.username})</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Or enter name"
                      value={editBlockInchargeName}
                      onChange={(e) => setEditBlockInchargeName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Description / Machinery</label>
                    <input
                      type="text"
                      value={editBlockDesc}
                      onChange={(e) => setEditBlockDesc(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setEditingBlock(null)}
                      className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all cursor-pointer"
                    >
                      Save Block
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Meters List */}
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">Energy Meters & CT/PT Multipliers</h3>
                <p className="text-xs text-slate-400">{meters.length} digital sub-meters registered</p>
              </div>
              {isAdmin ? (
                <button
                  onClick={() => setShowAddMeter(!showAddMeter)}
                  className="px-3 py-1.5 text-xs font-semibold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Meter</span>
                </button>
              ) : (
                <span className="text-xs text-slate-400 font-mono px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>Admin Only</span>
                </span>
              )}
            </div>

            {isAdmin && showAddMeter && (
              <form onSubmit={handleCreateMeter} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                <h4 className="font-bold text-slate-200">Register New Energy Meter</h4>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Meter Number (e.g. MTR-007)"
                    value={meterNumber}
                    onChange={(e) => setMeterNumber(e.target.value)}
                    required
                    className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Feeder Name (e.g. Furnace 2)"
                    value={meterName}
                    onChange={(e) => setMeterName(e.target.value)}
                    required
                    className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={meterBlockId}
                    onChange={(e) => setMeterBlockId(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  >
                    {blocks.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Initial Reading (kWh)"
                    value={initialReading}
                    onChange={(e) => setInitialReading(Number(e.target.value))}
                    className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Multiplying Factor (MF / CT Ratio):</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="1"
                      value={meterMultiplier}
                      onChange={(e) => setMeterMultiplier(Math.max(1, Number(e.target.value) || 1))}
                      className="w-24 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold"
                    />
                    <div className="flex flex-wrap gap-1">
                      {[1, 10, 20, 40, 50, 100, 200, 400].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setMeterMultiplier(val)}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono border cursor-pointer ${
                            meterMultiplier === val
                              ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                              : 'bg-slate-900 text-slate-400 border-slate-700'
                          }`}
                        >
                          {val}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowAddMeter(false)} className="px-3 py-1 text-slate-400 cursor-pointer">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 bg-cyan-500 text-slate-950 font-bold rounded-lg cursor-pointer">Save Meter</button>
                </div>
              </form>
            )}

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {meters.map((m) => {
                const b = blocks.find((blk) => blk.id === m.blockId);
                return (
                  <div key={m.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-cyan-300 bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">
                          {m.meterNumber}
                        </span>
                        <span className="font-bold text-white">{m.name}</span>
                        <span className="px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 font-mono font-semibold text-[10px] border border-cyan-500/20">
                          MF: {m.multiplier || 1}x
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {b ? b.name : m.blockId} • {m.location}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right mr-1">
                        <span className="font-mono text-white font-bold">{m.lastReadingValue.toLocaleString()} kWh</span>
                        <span className="text-[10px] text-slate-400 block font-medium">Last: {m.lastReadingDate}</span>
                      </div>
                      {isAdmin ? (
                        <>
                          <button
                            onClick={() => handleOpenEditMeter(m)}
                            title={`Edit meter ${m.meterNumber}`}
                            className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setConfirmModal({
                                type: 'delete_meter',
                                id: m.id,
                                name: `${m.meterNumber} (${m.name})`,
                                title: `Delete Meter: ${m.meterNumber}`,
                                message: `Are you sure you want to remove meter ${m.meterNumber} (${m.name})? All associated readings for this meter will also be removed.`,
                              });
                            }}
                            title={`Remove meter ${m.meterNumber}`}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-slate-500" />
                          Locked
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Edit Meter Modal */}
          {isAdmin && editingMeter && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
                  <h3 className="text-base font-bold text-white">Edit Meter: {editingMeter.meterNumber}</h3>
                  <button onClick={() => setEditingMeter(null)} className="text-slate-400 hover:text-white cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveMeterEdit} className="p-6 space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Meter Number / ID</label>
                    <input
                      type="text"
                      value={editMeterNumber}
                      onChange={(e) => setEditMeterNumber(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Feeder / Equipment Name</label>
                    <input
                      type="text"
                      value={editMeterName}
                      onChange={(e) => setEditMeterName(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Assigned Block</label>
                    <select
                      value={editMeterBlockId}
                      onChange={(e) => setEditMeterBlockId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    >
                      {blocks.map((b) => (
                        <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-cyan-300 font-bold mb-1">
                      Multiplying Factor (MF / CT-PT Ratio)
                    </label>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="number"
                        min="1"
                        step="any"
                        value={editMeterMultiplier}
                        onChange={(e) => setEditMeterMultiplier(Math.max(1, Number(e.target.value) || 1))}
                        className="w-28 px-3 py-2 rounded-xl bg-slate-950 border-2 border-cyan-500/60 text-white font-mono font-bold text-sm"
                      />
                      <div className="flex flex-wrap gap-1">
                        {[1, 10, 20, 40, 50, 100, 200, 400].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setEditMeterMultiplier(val)}
                            className={`px-2 py-1 rounded-lg text-xs font-mono border cursor-pointer ${
                              editMeterMultiplier === val
                                ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                            }`}
                          >
                            {val}x
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Units consumed will be multiplied by this factor: (Current - Previous) × MF
                    </p>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Physical Location / Panel</label>
                    <input
                      type="text"
                      value={editMeterLocation}
                      onChange={(e) => setEditMeterLocation(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setEditingMeter(null)}
                      className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all cursor-pointer"
                    >
                      Save Meter Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: TARIFF CONFIGURATION */}
      {activeSubTab === 'tariff' && (
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-lg max-w-2xl space-y-4">
          {!isAdmin && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3 shadow-sm">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold text-sm text-amber-200 block">Read-Only Tariff Rates</span>
                <span className="text-slate-300">
                  Tariff rates, statutory taxes, and surcharge parameters can only be modified by the Chief Administrator.
                </span>
              </div>
            </div>
          )}

          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Electricity Tariff & Surcharge Rates</span>
            </h2>
            <p className="text-xs text-slate-400">
              Update unit rate, demand charges, and statutory tax percentages applied in the Live Billing section
            </p>
          </div>

          <form onSubmit={handleSaveTariff} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Base Energy Rate ({tariffForm.currencySymbol} / kWh)
                </label>
                <input
                  type="number"
                  step="0.01"
                  disabled={!isAdmin}
                  value={tariffForm.baseRatePerUnit}
                  onChange={(e) => setTariffForm({ ...tariffForm, baseRatePerUnit: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 font-mono text-white text-sm focus:outline-none focus:border-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Default: ₹ 8.00 per unit</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Monthly Fixed Demand Charges ({tariffForm.currencySymbol})
                </label>
                <input
                  type="number"
                  step="1"
                  disabled={!isAdmin}
                  value={tariffForm.fixedChargesMonthly}
                  onChange={(e) => setTariffForm({ ...tariffForm, fixedChargesMonthly: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 font-mono text-white text-sm focus:outline-none focus:border-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Default: ₹ 500.00 / month</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Electricity Duty Tax (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  disabled={!isAdmin}
                  value={tariffForm.dutyTaxPercent}
                  onChange={(e) => setTariffForm({ ...tariffForm, dutyTaxPercent: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 font-mono text-white text-sm focus:outline-none focus:border-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Default: 6.0%</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Fuel Cost Adjustment / Surcharge (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  disabled={!isAdmin}
                  value={tariffForm.fuelSurchargePercent}
                  onChange={(e) => setTariffForm({ ...tariffForm, fuelSurchargePercent: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 font-mono text-white text-sm focus:outline-none focus:border-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Default: 1.5%</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Currency Symbol
              </label>
              <select
                value={tariffForm.currencySymbol}
                disabled={!isAdmin}
                onChange={(e) => setTariffForm({ ...tariffForm, currencySymbol: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-500 font-mono disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="₹">₹ (INR - Indian Rupee)</option>
                <option value="$">$ (USD - US Dollar)</option>
                <option value="€">€ (EUR - Euro)</option>
                <option value="£">£ (GBP - British Pound)</option>
                <option value="AED">AED (Dirham)</option>
              </select>
            </div>

            {tariffSavedMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Tariff settings updated and synced with Live Billing!</span>
              </div>
            )}

            {isAdmin ? (
              <button
                type="submit"
                className="py-2.5 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                Update Department Tariff Configuration
              </button>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>You do not have administrative permission to modify tariff rates. Contact Chief Administrator for changes.</span>
              </div>
            )}
          </form>
        </div>
      )}

      {/* SUBTAB 4: DATA MANAGEMENT & STORAGE */}
      {activeSubTab === 'system' && (
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-lg space-y-5 max-w-2xl">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <span>Readings Data Management & Free Persistence</span>
            </h2>
            <p className="text-xs text-slate-400">
              Clear readings, export backups, or manage departmental data logs freely with local persistence
            </p>
          </div>

          {actionFeedbackMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{actionFeedbackMsg}</span>
              </div>
              <button onClick={() => setActionFeedbackMsg('')} className="text-slate-400 hover:text-white text-xs ml-2 cursor-pointer">
                ✕
              </button>
            </div>
          )}

          {/* Appearance Switcher */}
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-white block">Appearance & Theme Mode</span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  Choose between high-contrast dark industrial theme, crisp daytime light mode, or automatic device sync
                </span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Active: {theme === 'system' ? `Auto (${isDarkMode ? 'Dark' : 'Light'})` : theme === 'dark' ? 'Dark' : 'Light'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setTheme('dark');
                  setActionFeedbackMsg('Shifted to Dark Mode.');
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-cyan-500 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 shrink-0">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Dark Mode</span>
                  <span className="text-[10px] text-slate-400 block">Night / Control Room</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTheme('light');
                  setActionFeedbackMsg('Shifted to Light Mode.');
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  theme === 'light'
                    ? 'bg-slate-900 border-amber-500 shadow-md shadow-amber-500/10 ring-1 ring-amber-500'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Light Mode</span>
                  <span className="text-[10px] text-slate-400 block">Daytime / High Light</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTheme('system');
                  setActionFeedbackMsg('Shifted to System Auto Mode.');
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  theme === 'system'
                    ? 'bg-slate-900 border-cyan-500 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                  <Monitor className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">System Auto</span>
                  <span className="text-[10px] text-slate-400 block">Follow OS / Device</span>
                </div>
              </button>
            </div>
          </div>

          {/* Clear All Readings Action */}
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-sm font-bold text-rose-300 block">Clear All Meter Readings</span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  Wipe all recorded meter readings ({readings.length} entries) and reset meter baselines to start fresh with your custom logs.
                </span>
              </div>
              <button
                disabled={!isAdmin}
                onClick={() => {
                  if (!isAdmin) return;
                  setConfirmModal({
                    type: 'clear_readings',
                    title: 'Clear All Meter Readings?',
                    message: `Are you sure you want to delete all ${readings.length} meter readings? All historical records will be cleared so you can fill in your custom 4-month data.`,
                  });
                }}
                className={`px-4 py-2 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 shrink-0 ${
                  isAdmin
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30 cursor-pointer'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 opacity-75 cursor-not-allowed'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>{isAdmin ? 'Delete All Readings' : 'Delete All Readings (Admin Only)'}</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <span className="text-sm font-bold text-white block">Download Full JSON Database Backup</span>
                <span className="text-xs text-slate-400">
                  Export all meter readings, blocks, tariff rules, and user configs for audit or backup
                </span>
              </div>
              <button
                onClick={handleDownloadBackup}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                <span>Export Backup</span>
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <span className="text-sm font-bold text-amber-400 block">Reset System to Defaults</span>
                <span className="text-xs text-slate-400">
                  Reset users, blocks, and initial tariff to default state
                </span>
              </div>
              <button
                disabled={!isAdmin}
                onClick={() => {
                  if (!isAdmin) return;
                  setConfirmModal({
                    type: 'reset_system',
                    title: 'Reset System to Factory Defaults?',
                    message: 'This will restore standard users, blocks, and default tariff settings. Any custom block configurations will be reset.',
                  });
                }}
                className={`px-4 py-2 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-all ${
                  isAdmin
                    ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30 cursor-pointer'
                    : 'bg-slate-800 text-slate-400 border-slate-700 opacity-75 cursor-not-allowed'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                <span>{isAdmin ? 'Reset System' : 'Reset System (Admin Only)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{confirmModal.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Confirmation required</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              {confirmModal.message}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteConfirmedAction}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-md shadow-rose-600/30 cursor-pointer"
              >
                Confirm & Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};