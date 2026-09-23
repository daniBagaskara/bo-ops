import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { DashboardOverview } from './components/DashboardOverview';
import { TargetWizardModal } from './components/TargetWizardModal';
import { TargetListView } from './components/TargetListView';
import { SdmManagementView } from './components/SdmManagementView';
import { RelasiManagementView } from './components/RelasiManagementView';
import { ProdukHargaView } from './components/ProdukHargaView';
import { SqlMigrationView } from './components/SqlMigrationView';
import { ToastContainer } from './components/ToastContainer';

const AppContent: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* Top Bar Navigation */}
      <Navbar onOpenTargetWizard={() => setIsWizardOpen(true)} />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8">
        {activeTab === 'dashboard' && (
          <DashboardOverview
            onOpenTargetWizard={() => setIsWizardOpen(true)}
            onOpenSdmModal={() => setActiveTab('sdm')}
          />
        )}

        {activeTab === 'target_list' && (
          <TargetListView onOpenTargetWizard={() => setIsWizardOpen(true)} />
        )}

        {activeTab === 'sdm' && <SdmManagementView />}

        {activeTab === 'relasi' && <RelasiManagementView />}

        {activeTab === 'produk_harga' && <ProdukHargaView />}

        {activeTab === 'sql_migration' && <SqlMigrationView />}
      </main>

      {/* Target Allocation Interactive Wizard Modal */}
      <TargetWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
      />

      {/* Toast Notification Container */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
