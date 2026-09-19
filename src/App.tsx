import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { NotificationDrawer } from './components/NotificationDrawer';

// Views
import { DashboardView } from './components/views/DashboardView';
import { TasksView } from './components/views/TasksView';
import { ChatView } from './components/views/ChatView';
import { DocumentsView } from './components/views/DocumentsView';
import { InventoryView } from './components/views/InventoryView';
import { WorkflowsView } from './components/views/WorkflowsView';
import { ComplianceView } from './components/views/ComplianceView';
import { CloudStorageView } from './components/views/CloudStorageView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { BillingView } from './components/views/BillingView';

// Modals
import { NewTaskModal } from './components/modals/NewTaskModal';
import { StockMovementModal } from './components/modals/StockMovementModal';
import { NewWorkOrderModal } from './components/modals/NewWorkOrderModal';
import { NewDocumentModal } from './components/modals/NewDocumentModal';
import { CreateAccountModal } from './components/modals/CreateAccountModal';
import { UpgradePlanModal } from './components/modals/UpgradePlanModal';
import { AddPaymentMethodModal } from './components/modals/AddPaymentMethodModal';
import { InvoiceDetailsModal } from './components/modals/InvoiceDetailsModal';

const AppContent: React.FC = () => {
  const { currentTab } = useApp();

  // Global Modals State
  const [showNewTask, setShowNewTask] = useState(false);
  const [showStockMovement, setShowStockMovement] = useState(false);
  const [showNewWorkOrder, setShowNewWorkOrder] = useState(false);
  const [showNewDocument, setShowNewDocument] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors">
      {/* Desktop Sidebar Navigation */}
      <Sidebar />

      {/* Main App Content Viewport */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
          <div className="max-w-7xl mx-auto w-full">
            {currentTab === 'dashboard' && (
              <DashboardView
                onOpenNewTask={() => setShowNewTask(true)}
                onOpenStockAdjust={() => setShowStockMovement(true)}
                onOpenNewWorkOrder={() => setShowNewWorkOrder(true)}
              />
            )}
            {currentTab === 'tasks' && (
              <TasksView onOpenNewTask={() => setShowNewTask(true)} />
            )}
            {currentTab === 'chat' && <ChatView />}
            {currentTab === 'documents' && (
              <DocumentsView onOpenNewDocument={() => setShowNewDocument(true)} />
            )}
            {currentTab === 'inventory' && (
              <InventoryView
                onOpenStockAdjust={() => setShowStockMovement(true)}
                onOpenNewWorkOrder={() => setShowNewWorkOrder(true)}
              />
            )}
            {currentTab === 'workflows' && <WorkflowsView />}
            {currentTab === 'compliance' && <ComplianceView />}
            {currentTab === 'cloud' && <CloudStorageView />}
            {currentTab === 'analytics' && <AnalyticsView />}
            {currentTab === 'billing' && <BillingView />}
          </div>
        </main>
      </div>

      {/* Mobile Navigation Bar & Drawer */}
      <MobileNav />

      {/* Push & Automated Alert Drawer */}
      <NotificationDrawer />

      {/* Modals */}
      <NewTaskModal isOpen={showNewTask} onClose={() => setShowNewTask(false)} />
      <StockMovementModal
        isOpen={showStockMovement}
        onClose={() => setShowStockMovement(false)}
      />
      <NewWorkOrderModal
        isOpen={showNewWorkOrder}
        onClose={() => setShowNewWorkOrder(false)}
      />
      <NewDocumentModal
        isOpen={showNewDocument}
        onClose={() => setShowNewDocument(false)}
      />
      <CreateAccountModal />
      <UpgradePlanModal />
      <AddPaymentMethodModal />
      <InvoiceDetailsModal />
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
