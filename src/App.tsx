import React, { useState, useEffect } from 'react';
import { EnergyProvider, useEnergy } from './context/EnergyContext';
import { LoginPage } from './components/LoginPage';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { DayWiseConsumption } from './components/DayWiseConsumption';
import { EnergyGraphs } from './components/EnergyGraphs';
import { MsebBilling } from './components/MsebBilling';
import { LiveBilling } from './components/LiveBilling';
import { BillComparison } from './components/BillComparison';
import { UserManagement } from './components/UserManagement';
import { EnterReadingModal } from './components/EnterReadingModal';
import { RoleSwitcherModal } from './components/RoleSwitcherModal';
import { NotebookDigitizerModal } from './components/NotebookDigitizerModal';
import { ExceedanceCenter } from './components/ExceedanceCenter';
import { Zap } from 'lucide-react';

const AppContent: React.FC = () => {
  const { isDarkMode, isAuthenticated } = useEnergy();
  
  // टॅब मेमरी: पेज रीफ्रेश झाल्यावरही MSEB Bill किंवा चालू टॅब तसाच राहील
  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('voltwise_active_tab') || 'dashboard';
  });

  const [isEnterReadingOpen, setIsEnterReadingOpen] = useState<boolean>(false);
  const [readingModalMode, setReadingModalMode] = useState<'single' | 'batch4m'>('single');
  const [selectedBlockForReading, setSelectedBlockForReading] = useState<string | undefined>(undefined);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState<boolean>(false);
  const [isNotebookModalOpen, setIsNotebookModalOpen] = useState<boolean>(false);

  // चालू टॅब कायम लक्षात ठेवणे
  useEffect(() => {
    localStorage.setItem('voltwise_active_tab', activeTab);
  }, [activeTab]);

  // युझर लॉगिन नसेल तर थेट लॉगिन पेज दाखवणे
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Cross navigation handlers
  const handleOpenEnterReading = (blockId?: string, mode: 'single' | 'batch4m' = 'single') => {
    setSelectedBlockForReading(blockId);
    setReadingModalMode(mode);
    setIsEnterReadingOpen(true);
  };

  const handleNavigateToGraphs = (blockId?: string) => {
    setSelectedBlockForReading(blockId);
    setActiveTab('graphs');
  };

  const handleNavigateToBilling = (blockId?: string) => {
    setSelectedBlockForReading(blockId);
    setActiveTab('billing');
  };

  const handleNavigateToDayWise = (blockId?: string) => {
    setSelectedBlockForReading(blockId);
    setActiveTab('daywise');
  };

  return (
    <div className={`min-h-screen flex flex-col selection:bg-cyan-500 selection:text-slate-950 transition-colors duration-200 ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Top Industrial Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenEnterReading={() => handleOpenEnterReading()}
        onOpenNotebookModal={() => setIsNotebookModalOpen(true)}
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            onOpenEnterReading={handleOpenEnterReading}
            onNavigateToGraphs={handleNavigateToGraphs}
            onNavigateToBilling={handleNavigateToBilling}
            onNavigateToDayWise={handleNavigateToDayWise}
          />
        )}

        {activeTab === 'daywise' && (
          <DayWiseConsumption
            onOpenEnterReading={handleOpenEnterReading}
            initialBlockId={selectedBlockForReading}
          />
        )}

        {activeTab === 'graphs' && (
          <EnergyGraphs initialBlockId={selectedBlockForReading} />
        )}

        {/* MSEB Bill: Admin आणि Normal User दोघांसाठीही कायम दृश्यमान */}
        {activeTab === 'mseb' && (
          <MsebBilling />
        )}

        {activeTab === 'billing' && (
          <LiveBilling initialBlockId={selectedBlockForReading} />
        )}

        {activeTab === 'comparison' && (
          <BillComparison />
        )}

        {activeTab === 'users' && (
          <UserManagement />
        )}

        {activeTab === 'exceedances' && (
          <ExceedanceCenter />
        )}
      </main>

      {/* Modals & Dialogs */}
      <EnterReadingModal
        isOpen={isEnterReadingOpen}
        onClose={() => setIsEnterReadingOpen(false)}
        defaultBlockId={selectedBlockForReading}
        initialMode={readingModalMode}
      />

      <RoleSwitcherModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
      />

      <NotebookDigitizerModal
        isOpen={isNotebookModalOpen}
        onClose={() => setIsNotebookModalOpen(false)}
      />

      {/* Footer */}
      <footer className="no-print border-t border-slate-900 bg-slate-950/80 py-4 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-400">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-300">VoltWise Energy Monitoring & Smart Billing</span>
            <span>• Electrical Department</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span>100% Free & Standalone</span>
            <span>•</span>
            <span>Local Encryption & Persistence</span>
            <span>•</span>
            <span>Role-Based Access Control</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <EnergyProvider>
      <AppContent />
    </EnergyProvider>
  );
}