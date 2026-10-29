import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import {
  openOfflineDb,
  getAllTasksFromDb,
  saveTaskToDb,
  saveAllTasksToDb,
  deleteTaskFromDb,
  getAllInventoryFromDb,
  saveInventoryItemToDb,
  saveAllInventoryToDb,
  getAllInventoryMovementsFromDb,
  saveInventoryMovementToDb,
  saveAllInventoryMovementsToDb,
  queueOfflineMutation,
  getPendingMutationsFromDb,
  removeMutationFromDb,
  clearAllMutationsFromDb,
  setDbMetadata,
  getDbMetadata,
  getOfflineStorageStats,
  OfflineMutation,
  OfflineStorageStats,
} from '../lib/offlineDb';
import {
  User,
  UserRole,
  Project,
  Task,
  ChatChannel,
  ChatMessage,
  DocumentItem,
  InventoryItem,
  InventoryMovement,
  InventoryStatus,
  MovementType,
  ProductionWorkOrder,
  WorkflowRule,
  AppNotification,
  ComplianceRecord,
  CloudStorageFile,
  AppGlobalState,
  AIPrioritizationResult,
  SubscriptionState,
  SubscriptionPlanTier,
  BillingInterval,
  PaymentMethod,
  BillingInvoice,
} from '../types';
import {
  initialUsers,
  initialProjects,
  initialTasks,
  initialChannels,
  initialMessages,
  initialDocuments,
  initialInventory,
  initialInventoryMovements,
  initialWorkOrders,
  initialWorkflows,
  initialNotifications,
  initialComplianceRecords,
  initialCloudFiles,
  initialSubscription,
} from '../initialData';
import { Language, translations, Translations } from '../i18n';

export type NavTab =
  | 'dashboard'
  | 'tasks'
  | 'chat'
  | 'documents'
  | 'inventory'
  | 'workflows'
  | 'compliance'
  | 'cloud'
  | 'analytics'
  | 'billing'
  | 'users';

interface AppContextType {
  // State
  state: AppGlobalState;
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  isSocketConnected: boolean;
  pushEnabled: boolean;
  setPushEnabled: (enabled: boolean) => void;
  showPushAlert: (title: string, body: string) => void;
  notificationDrawerOpen: boolean;
  setNotificationDrawerOpen: (open: boolean) => void;

  // Offline & IndexedDB Synchronization
  isOnline: boolean;
  isOfflineSimulated: boolean;
  effectiveOnline: boolean;
  toggleOfflineSimulation: () => void;
  setOfflineSimulation: (simulated: boolean) => void;
  isIndexedDbReady: boolean;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'offline' | 'error';
  pendingOfflineMutationsCount: number;
  lastSyncTimestamp: string | null;
  syncOfflineQueue: () => Promise<void>;
  offlineStatsModalOpen: boolean;
  setOfflineStatsModalOpen: (open: boolean) => void;

  // Account & Upgrade Modals
  isCreateAccountOpen: boolean;
  setIsCreateAccountOpen: (open: boolean) => void;
  isUpgradeModalOpen: boolean;
  setIsUpgradeModalOpen: (open: boolean) => void;
  isAddPaymentMethodOpen: boolean;
  setIsAddPaymentMethodOpen: (open: boolean) => void;
  selectedInvoice: BillingInvoice | null;
  setSelectedInvoice: (inv: BillingInvoice | null) => void;

  // User Account Management
  createUserAccount: (
    userData: {
      name: string;
      email: string;
      role: UserRole;
      department: string;
      jobTitle?: string;
      avatar?: string;
      password?: string;
    },
    autoLogin?: boolean
  ) => User;
  switchUser: (userId: string) => void;
  updateUserProfile: (userId: string, updates: Partial<User>) => void;
  deleteUserAccount: (userId: string) => void;

  // Subscription & Payment Methods
  upgradeSubscription: (plan: SubscriptionPlanTier, interval?: BillingInterval, seats?: number) => void;
  addPaymentMethod: (method: Omit<PaymentMethod, 'id' | 'createdAt'>) => PaymentMethod;
  removePaymentMethod: (id: string) => void;
  setDefaultPaymentMethod: (id: string) => void;

  // Permissions helper
  hasPermission: (action: string, resource?: string) => boolean;

  // Task actions
  createTask: (task: Partial<Task>) => void;
  updateTask: (task: Partial<Task> & { id: string }) => void;
  deleteTask: (taskId: string) => void;

  // Chat actions
  activeChannelId: string;
  setActiveChannelId: (id: string) => void;
  sendMessage: (content: string, channelId?: string, attachments?: any[]) => void;
  toggleReaction: (messageId: string, emoji: string) => void;

  // Document actions
  selectedDocId: string | null;
  setSelectedDocId: (id: string | null) => void;
  updateDocument: (doc: Partial<DocumentItem> & { id: string }) => void;
  createDocument: (doc: Partial<DocumentItem>) => void;
  toggleDocLock: (docId: string, lock: boolean) => void;

  // Inventory actions
  adjustInventory: (payload: {
    itemId: string;
    type: InventoryMovement['type'];
    quantity: number;
    referenceOrder?: string;
    performedBy?: string;
    notes?: string;
  }) => void;
  createInventoryItem: (item: Partial<InventoryItem>) => void;
  updateWorkOrder: (wo: Partial<ProductionWorkOrder> & { id: string }) => void;
  createWorkOrder: (wo: Partial<ProductionWorkOrder>) => void;

  // Workflow actions
  toggleWorkflowRule: (ruleId: string) => void;
  simulateWorkflowTrigger: (ruleId: string) => void;

  // Compliance actions
  createComplianceRecord: (record: Partial<ComplianceRecord>) => void;

  // Cloud actions
  uploadCloudFile: (file: Partial<CloudStorageFile>) => void;

  // Notification actions
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // AI Assist
  askAIAssist: (queryType: string) => Promise<{ success: boolean; source: string; recommendation: string }>;

  // AI Task Prioritization & Scenarios
  aiPrioritization: AIPrioritizationResult | null;
  isPrioritizing: boolean;
  prioritizeTasks: () => Promise<void>;
  loadExampleScenario: (scenarioId: string) => Promise<void>;
  selectedScenarioId: string;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [currentUser, setCurrentUser] = useState<User>(initialUsers[0]);
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isSocketConnected, setIsSocketConnected] = useState<boolean>(false);
  const [pushEnabled, setPushEnabled] = useState<boolean>(true);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState<boolean>(false);
  const [activeChannelId, setActiveChannelId] = useState<string>('chan-general');
  const [selectedDocId, setSelectedDocId] = useState<string | null>('doc-1');
  const [isPrioritizing, setIsPrioritizing] = useState<boolean>(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('scenario-critical-path');
  const [aiPrioritization, setAiPrioritization] = useState<AIPrioritizationResult | null>(() => {
    const active = initialTasks.filter((t) => t.status !== 'done');
    return {
      lastOptimized: new Date().toISOString(),
      source: 'gemini-3.8-flash',
      executiveSummary:
        'AI Critical Path Analysis: Microcontroller IC-902 reorder trigger (#1) and HIPAA PHI transit validation (#2) currently block 4 downstream workstreams in bio-telemetry manufacturing and compliance. Prioritizing these 2 tasks unblocks upcoming milestones.',
      optimalOrder: active.map((t, idx) => ({
        taskId: t.id,
        rank: t.aiPriorityRank || idx + 1,
        priorityScore: t.aiPriorityScore || 85,
        reason: t.aiSuggestedOrderReason || 'Scheduled sprint operation',
        urgencyTier: t.aiUrgencyTier || 'normal',
        unblocksCount: t.id === 'task-102' || t.id === 'task-101' ? 2 : 0,
        isBlocked: (t.dependencies && t.dependencies.length > 0) || false,
        blockingTaskTitles: t.dependencies?.map((d) => initialTasks.find((it) => it.id === d)?.title || d) || [],
      })),
      criticalBlockersCount: 2,
    };
  });

  // Core synchronized state
  const [state, setState] = useState<AppGlobalState>({
    users: initialUsers,
    currentUser: initialUsers[0],
    tasks: initialTasks,
    projects: initialProjects,
    chatMessages: initialMessages,
    chatChannels: initialChannels,
    documents: initialDocuments,
    inventory: initialInventory,
    inventoryMovements: initialInventoryMovements,
    workOrders: initialWorkOrders,
    workflows: initialWorkflows,
    notifications: initialNotifications,
    complianceRecords: initialComplianceRecords,
    cloudFiles: initialCloudFiles,
    subscription: initialSubscription,
    connectedClientsCount: 1,
  });

  // Modal and dialog control states
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isAddPaymentMethodOpen, setIsAddPaymentMethodOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<BillingInvoice | null>(null);

  // Offline & IndexedDB Synchronization State
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isOfflineSimulated, setIsOfflineSimulated] = useState<boolean>(false);
  const [isIndexedDbReady, setIsIndexedDbReady] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'offline' | 'error'>('idle');
  const [pendingOfflineMutationsCount, setPendingOfflineMutationsCount] = useState<number>(0);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string | null>(null);
  const [offlineStatsModalOpen, setOfflineStatsModalOpen] = useState<boolean>(false);

  const effectiveOnline = isOnline && !isOfflineSimulated;

  const wsRef = useRef<WebSocket | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('omniwork_theme') as 'light' | 'dark' | null;
    const initial = savedTheme || 'dark';
    setTheme(initial);
    if (initial === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('omniwork_theme', next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // 1. Initialize IndexedDB & hydrate tasks/inventory from local storage immediately
  useEffect(() => {
    let isMounted = true;

    async function initOfflinePersistence() {
      try {
        const [savedTasks, savedInventory, savedMovements, pendingMutations, savedSyncMeta] =
          await Promise.all([
            getAllTasksFromDb(),
            getAllInventoryFromDb(),
            getAllInventoryMovementsFromDb(),
            getPendingMutationsFromDb(),
            getDbMetadata('lastOnlineSync'),
          ]);

        if (isMounted) {
          setIsIndexedDbReady(true);
          setPendingOfflineMutationsCount(pendingMutations.length);
          if (savedSyncMeta) setLastSyncTimestamp(savedSyncMeta);

          // If local IndexedDB already has tasks or inventory, populate state immediately so user can view/manage offline
          if (savedTasks.length > 0 || savedInventory.length > 0) {
            setState((prev) => ({
              ...prev,
              tasks: savedTasks.length > 0 ? savedTasks : prev.tasks,
              inventory: savedInventory.length > 0 ? savedInventory : prev.inventory,
              inventoryMovements:
                savedMovements.length > 0 ? savedMovements : prev.inventoryMovements,
            }));
          } else {
            // First visit seeding: save initial tasks & inventory into IndexedDB
            await Promise.all([
              saveAllTasksToDb(initialTasks),
              saveAllInventoryToDb(initialInventory),
              saveAllInventoryMovementsToDb(initialInventoryMovements),
              setDbMetadata('lastOnlineSync', new Date().toISOString()),
            ]);
            setLastSyncTimestamp(new Date().toISOString());
          }
        }
      } catch (err) {
        console.warn('[IndexedDB] Init error:', err);
      }
    }

    initOfflinePersistence();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Setup browser network online / offline listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showPushAlert('Network Reconnected', 'Connection restored. Syncing offline changes...');
      // Trigger sync
      syncOfflineQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
      showPushAlert(
        'Working Offline',
        'Disconnected from network. Tasks & inventory stored locally in IndexedDB.'
      );
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [effectiveOnline]);

  // Setup BroadcastChannel for immediate multi-tab cross-synchronization
  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('omniwork_sync_channel');
      broadcastChannelRef.current = bc;

      bc.onmessage = (event) => {
        const { type, payload } = event.data;
        handleIncomingEvent(type, payload);
      };

      return () => {
        bc.close();
      };
    }
  }, []);

  // Setup WebSocket connection to server
  useEffect(() => {
    if (!effectiveOnline) {
      setIsSocketConnected(false);
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    let socket: WebSocket | null = null;
    let reconnectTimer: any = null;

    function connect() {
      if (!effectiveOnline) {
        setIsSocketConnected(false);
        return;
      }

      try {
        socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          setIsSocketConnected(true);
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            handleIncomingEvent(data.type, data.payload);
          } catch (err) {
            console.error('Error handling WebSocket message:', err);
          }
        };

        socket.onclose = () => {
          setIsSocketConnected(false);
          if (effectiveOnline) {
            reconnectTimer = setTimeout(connect, 3000);
          }
        };

        socket.onerror = () => {
          setIsSocketConnected(false);
        };
      } catch {
        setIsSocketConnected(false);
        if (effectiveOnline) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      }
    }

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (socket) socket.close();
    };
  }, [effectiveOnline]);

  // Central event dispatcher for real-time synchronization
  function handleIncomingEvent(type: string, payload: any) {
    switch (type) {
      case 'INIT_STATE':
        setState((prev) => ({ ...prev, ...payload }));
        if (payload.tasks) saveAllTasksToDb(payload.tasks).catch(console.warn);
        if (payload.inventory) saveAllInventoryToDb(payload.inventory).catch(console.warn);
        if (payload.inventoryMovements) saveAllInventoryMovementsToDb(payload.inventoryMovements).catch(console.warn);
        setDbMetadata('lastOnlineSync', new Date().toISOString()).catch(console.warn);
        setLastSyncTimestamp(new Date().toISOString());
        break;

      case 'TASK_CREATED':
        setState((prev) => ({
          ...prev,
          tasks: [payload, ...prev.tasks.filter((t) => t.id !== payload.id)],
        }));
        saveTaskToDb(payload).catch(console.warn);
        showPushAlert('Task Created', payload.title);
        break;

      case 'TASK_UPDATED':
        setState((prev) => ({
          ...prev,
          tasks: prev.tasks.map((t) => (t.id === payload.id ? { ...t, ...payload } : t)),
        }));
        saveTaskToDb(payload).catch(console.warn);
        break;

      case 'TASK_DELETED':
        setState((prev) => ({
          ...prev,
          tasks: prev.tasks.filter((t) => t.id !== payload),
        }));
        deleteTaskFromDb(payload).catch(console.warn);
        break;

      case 'TASKS_PRIORITIZED':
        setState((prev) => ({
          ...prev,
          tasks: payload.tasks || prev.tasks,
        }));
        if (payload.result) {
          setAiPrioritization(payload.result);
        }
        showPushAlert('AI Task Prioritization', 'Tasks optimal order updated via AI analysis');
        break;

      case 'SCENARIO_LOADED':
        setState((prev) => ({
          ...prev,
          tasks: payload.tasks || prev.tasks,
        }));
        if (payload.result) {
          setAiPrioritization(payload.result);
        }
        if (payload.scenarioId) {
          setSelectedScenarioId(payload.scenarioId);
        }
        showPushAlert('Scenario Loaded', 'New scenario tasks loaded and prioritized');
        break;

      case 'CHAT_MESSAGE_ADDED':
        setState((prev) => ({
          ...prev,
          chatMessages: [...prev.chatMessages, payload],
        }));
        if (payload.senderId !== currentUser.id) {
          showPushAlert(`Chat #${payload.channelId}`, `${payload.senderName}: ${payload.content.slice(0, 50)}`);
        }
        break;

      case 'CHAT_REACTION_UPDATED':
        setState((prev) => ({
          ...prev,
          chatMessages: prev.chatMessages.map((m) =>
            m.id === payload.messageId ? { ...m, reactions: payload.reactions } : m
          ),
        }));
        break;

      case 'DOC_UPDATED':
      case 'DOC_CREATED':
        setState((prev) => ({
          ...prev,
          documents: [
            payload,
            ...prev.documents.filter((d) => d.id !== payload.id),
          ],
        }));
        break;

      case 'DOC_LOCK_CHANGED':
        setState((prev) => ({
          ...prev,
          documents: prev.documents.map((d) =>
            d.id === payload.id ? { ...d, lockedBy: payload.lockedBy } : d
          ),
        }));
        break;

      case 'INVENTORY_UPDATED':
        setState((prev) => ({
          ...prev,
          inventory: prev.inventory.map((item) =>
            item.id === payload.item.id ? payload.item : item
          ),
          inventoryMovements: [payload.movement, ...prev.inventoryMovements],
        }));
        if (payload.item) saveInventoryItemToDb(payload.item).catch(console.warn);
        if (payload.movement) saveInventoryMovementToDb(payload.movement).catch(console.warn);
        break;

      case 'INVENTORY_ITEM_CREATED':
        setState((prev) => ({
          ...prev,
          inventory: [...prev.inventory, payload],
        }));
        saveInventoryItemToDb(payload).catch(console.warn);
        break;

      case 'WORKORDER_UPDATED':
        setState((prev) => ({
          ...prev,
          workOrders: prev.workOrders.map((wo) =>
            wo.id === payload.id ? { ...wo, ...payload } : wo
          ),
        }));
        break;

      case 'WORKORDER_CREATED':
        setState((prev) => ({
          ...prev,
          workOrders: [payload, ...prev.workOrders],
        }));
        break;

      case 'WORKFLOW_RULE_UPDATED':
        setState((prev) => ({
          ...prev,
          workflows: prev.workflows.map((w) =>
            w.id === payload.id ? payload : w
          ),
        }));
        break;

      case 'NOTIFICATION_PUSH':
        setState((prev) => ({
          ...prev,
          notifications: [payload, ...prev.notifications],
        }));
        showPushAlert(payload.title, payload.message);
        break;

      case 'NOTIFICATION_UPDATED':
        setState((prev) => ({
          ...prev,
          notifications: prev.notifications.map((n) =>
            n.id === payload.id ? payload : n
          ),
        }));
        break;

      case 'NOTIFICATIONS_ALL_READ':
        setState((prev) => ({
          ...prev,
          notifications: prev.notifications.map((n) => ({ ...n, read: true })),
        }));
        break;

      case 'COMPLIANCE_RECORD_ADDED':
        setState((prev) => ({
          ...prev,
          complianceRecords: [payload, ...prev.complianceRecords],
        }));
        break;

      case 'CLOUD_FILE_ADDED':
        setState((prev) => ({
          ...prev,
          cloudFiles: [payload, ...prev.cloudFiles],
        }));
        break;

      case 'PRESENCE_SYNC':
        setState((prev) => ({
          ...prev,
          connectedClientsCount: payload.connectedCount,
        }));
        break;

      case 'USER_CREATED':
        setState((prev) => ({
          ...prev,
          users: [...prev.users.filter((u) => u.id !== payload.id), payload],
          subscription: {
            ...prev.subscription,
            seatsUsed: prev.users.length + 1,
          },
        }));
        showPushAlert('New Workspace Member', `${payload.name} (${payload.department}) has joined.`);
        break;

      case 'USER_UPDATED':
        setState((prev) => ({
          ...prev,
          users: prev.users.map((u) => (u.id === payload.id ? { ...u, ...payload } : u)),
        }));
        if (currentUser.id === payload.id) {
          setCurrentUser((prev) => ({ ...prev, ...payload }));
        }
        break;

      case 'USER_DELETED':
        setState((prev) => {
          const filtered = prev.users.filter((u) => u.id !== payload);
          return {
            ...prev,
            users: filtered,
            subscription: {
              ...prev.subscription,
              seatsUsed: Math.max(1, filtered.length),
            },
          };
        });
        showPushAlert('User Account Removed', 'User account removed from workspace.');
        break;

      case 'SUBSCRIPTION_UPDATED':
        setState((prev) => ({
          ...prev,
          subscription: payload,
        }));
        showPushAlert('Subscription Updated', `Workspace updated to ${payload.currentPlan.toUpperCase()} tier.`);
        break;
    }
  }

  // Push notifications dispatcher
  function showPushAlert(title: string, body: string) {
    if (!pushEnabled) return;

    // Web Notification API
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
        });
      } catch (e) {
        console.warn('Native notification failed:', e);
      }
    }
  }

  // Helper to send message via WebSocket or BroadcastChannel
  function emit(type: string, payload: any) {
    const data = { type, payload };
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
    // Also broadcast to other browser tabs immediately
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage(data);
    }
    // Apply optimistically locally if not handled by server echo
  }

  // Role Switcher
  const setRole = (role: UserRole) => {
    const matchingUser = state.users.find((u) => u.role === role) || {
      ...currentUser,
      role,
    };
    setCurrentUser(matchingUser);
  };

  // RBAC Permission checker
  const hasPermission = (action: string, resource?: string): boolean => {
    const role = currentUser.role;
    if (role === 'super_admin') return true;

    if (action === 'compliance_admin' || resource === 'hipaa_audit') {
      return role === 'compliance_officer';
    }

    if (action === 'inventory_manage' || resource === 'production_orders') {
      return role === 'production_lead' || role === 'project_manager';
    }

    if (action === 'project_admin') {
      return role === 'project_manager';
    }

    if (action === 'edit_sop' && resource === 'SOP') {
      return role === 'production_lead' || role === 'project_manager';
    }

    if (action === 'phi_access') {
      return role === 'compliance_officer';
    }

    // Default general actions (view, comment, update assigned tasks)
    return true;
  };

  // Mutation Handlers
  const createTask = (task: Partial<Task>) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: task.title || 'Untitled Task',
      description: task.description || '',
      projectId: task.projectId || 'proj-1',
      projectName:
        state.projects.find((p) => p.id === task.projectId)?.name || 'Project Helix',
      assigneeId: task.assigneeId || currentUser.id,
      assigneeName:
        state.users.find((u) => u.id === task.assigneeId)?.name || currentUser.name,
      assigneeAvatar:
        state.users.find((u) => u.id === task.assigneeId)?.avatar || currentUser.avatar,
      priority: task.priority || 'medium',
      status: task.status || 'todo',
      dueDate: task.dueDate || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      estimatedHours: task.estimatedHours || 8,
      loggedHours: task.loggedHours || 0,
      tags: task.tags || ['Task'],
      subtasks: task.subtasks || [],
      attachments: task.attachments || [],
      hipaaPhiSensitive: task.hipaaPhiSensitive || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    handleIncomingEvent('TASK_CREATED', newTask);
    saveTaskToDb(newTask).catch(console.warn);

    if (effectiveOnline && isSocketConnected) {
      emit('TASK_CREATE', newTask);
    } else {
      queueOfflineMutation({
        type: 'TASK_CREATE',
        payload: newTask,
      })
        .then(() => {
          setPendingOfflineMutationsCount((c) => c + 1);
          setSyncStatus('offline');
          showPushAlert('Task Saved Offline', `"${newTask.title}" saved in IndexedDB.`);
        })
        .catch(console.warn);
    }
  };

  const updateTask = (task: Partial<Task> & { id: string }) => {
    handleIncomingEvent('TASK_UPDATED', task);
    const existing = state.tasks.find((t) => t.id === task.id);
    if (existing) {
      saveTaskToDb({ ...existing, ...task, updatedAt: new Date().toISOString() }).catch(console.warn);
    }

    if (effectiveOnline && isSocketConnected) {
      emit('TASK_UPDATE', task);
    } else {
      queueOfflineMutation({
        type: 'TASK_UPDATE',
        payload: task,
      })
        .then(() => {
          setPendingOfflineMutationsCount((c) => c + 1);
          setSyncStatus('offline');
          showPushAlert('Task Updated Offline', 'Changes saved to IndexedDB.');
        })
        .catch(console.warn);
    }
  };

  const deleteTask = (taskId: string) => {
    handleIncomingEvent('TASK_DELETED', taskId);
    deleteTaskFromDb(taskId).catch(console.warn);

    if (effectiveOnline && isSocketConnected) {
      emit('TASK_DELETE', { id: taskId });
    } else {
      queueOfflineMutation({
        type: 'TASK_DELETE',
        payload: { id: taskId },
      })
        .then(() => {
          setPendingOfflineMutationsCount((c) => c + 1);
          setSyncStatus('offline');
          showPushAlert('Task Deleted Offline', 'Task deletion stored in IndexedDB.');
        })
        .catch(console.warn);
    }
  };

  const sendMessage = (
    content: string,
    channelId: string = activeChannelId,
    attachments: any[] = []
  ) => {
    if (!content.trim() && attachments.length === 0) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      channelId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      senderRole: currentUser.role,
      content,
      timestamp: new Date().toISOString(),
      attachments,
      reactions: [],
    };

    emit('CHAT_MESSAGE_SEND', newMsg);
    handleIncomingEvent('CHAT_MESSAGE_ADDED', newMsg);
  };

  const toggleReaction = (messageId: string, emoji: string) => {
    emit('CHAT_REACTION_TOGGLE', { messageId, emoji, userId: currentUser.id });
  };

  const updateDocument = (doc: Partial<DocumentItem> & { id: string }) => {
    emit('DOC_UPDATE', { ...doc, authorName: currentUser.name });
    handleIncomingEvent('DOC_UPDATED', doc);
  };

  const createDocument = (doc: Partial<DocumentItem>) => {
    const newDoc: DocumentItem = {
      id: `doc-${Date.now()}`,
      title: doc.title || 'Untitled Document',
      category: doc.category || 'SOP',
      content: doc.content || '# New Document\n\nBegin typing markdown...',
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      lastModified: new Date().toISOString(),
      version: 1,
      versions: [],
      permissions: [
        { role: 'super_admin', access: 'admin' },
        { role: 'project_manager', access: 'edit' },
        { role: 'team_member', access: 'view' },
      ],
      isEncrypted: doc.isEncrypted !== undefined ? doc.isEncrypted : true,
      phiFlag: doc.phiFlag || false,
      tags: doc.tags || ['Document'],
    };

    emit('DOC_CREATE', newDoc);
    handleIncomingEvent('DOC_CREATED', newDoc);
    setSelectedDocId(newDoc.id);
  };

  const toggleDocLock = (docId: string, lock: boolean) => {
    emit('DOC_LOCK_TOGGLE', {
      id: docId,
      lock,
      userId: currentUser.id,
      userName: currentUser.name,
    });
  };

  const adjustInventory = (payload: {
    itemId: string;
    type: MovementType;
    quantity: number;
    referenceOrder?: string;
    performedBy?: string;
    notes?: string;
  }) => {
    const item = state.inventory.find((i) => i.id === payload.itemId);
    if (item) {
      const prevQty = item.quantity;
      let newQty = prevQty;
      if (payload.type === 'stock_in' || payload.type === 'audit_adjustment') {
        newQty += payload.quantity;
      } else if (payload.type === 'stock_out' || payload.type === 'waste' || payload.type === 'transfer') {
        newQty = Math.max(0, newQty - payload.quantity);
      }

      const newStatus: InventoryStatus =
        newQty === 0
          ? 'out_of_stock'
          : newQty <= item.minThreshold
          ? 'low_stock'
          : 'in_stock';

      const updatedItem: InventoryItem = {
        ...item,
        quantity: newQty,
        status: newStatus,
        lastAudited: new Date().toISOString().split('T')[0],
      };

      const newMovement: InventoryMovement = {
        id: `mov-${Date.now()}`,
        itemId: item.id,
        itemName: item.name,
        sku: item.sku,
        type: payload.type,
        quantity: payload.quantity,
        previousQuantity: prevQty,
        newQuantity: newQty,
        performedBy: payload.performedBy || currentUser.name,
        timestamp: new Date().toISOString(),
        referenceOrder: payload.referenceOrder || 'ADJ-MANUAL',
        notes: payload.notes || 'Manual stock adjustment',
      };

      handleIncomingEvent('INVENTORY_UPDATED', { item: updatedItem, movement: newMovement });
      saveInventoryItemToDb(updatedItem).catch(console.warn);
      saveInventoryMovementToDb(newMovement).catch(console.warn);
    }

    if (effectiveOnline && isSocketConnected) {
      emit('INVENTORY_ADJUST', {
        ...payload,
        performedBy: payload.performedBy || currentUser.name,
      });
    } else {
      queueOfflineMutation({
        type: 'INVENTORY_ADJUST',
        payload: {
          ...payload,
          performedBy: payload.performedBy || currentUser.name,
        },
      })
        .then(() => {
          setPendingOfflineMutationsCount((c) => c + 1);
          setSyncStatus('offline');
          showPushAlert('Inventory Adjusted Offline', 'Stock update stored in IndexedDB.');
        })
        .catch(console.warn);
    }
  };

  const createInventoryItem = (item: Partial<InventoryItem>) => {
    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      sku: item.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      name: item.name || 'New Inventory Component',
      category: item.category || 'General',
      quantity: item.quantity || 100,
      unit: item.unit || 'pcs',
      minThreshold: item.minThreshold || 50,
      reorderQuantity: item.reorderQuantity || 200,
      unitCost: item.unitCost || 10.0,
      warehouseLocation: item.warehouseLocation || 'Bay 1 - Bin A',
      batchNumber: item.batchNumber || `LOT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      status:
        (item.quantity || 100) <= (item.minThreshold || 50) ? 'low_stock' : 'in_stock',
      lastAudited: new Date().toISOString().split('T')[0],
      supplierName: item.supplierName || 'Global Supply Corp',
    };

    handleIncomingEvent('INVENTORY_ITEM_CREATED', newItem);
    saveInventoryItemToDb(newItem).catch(console.warn);

    if (effectiveOnline && isSocketConnected) {
      emit('INVENTORY_ITEM_CREATE', newItem);
    } else {
      queueOfflineMutation({
        type: 'INVENTORY_ITEM_CREATE',
        payload: newItem,
      })
        .then(() => {
          setPendingOfflineMutationsCount((c) => c + 1);
          setSyncStatus('offline');
          showPushAlert('Item Stored Offline', `${newItem.name} saved in IndexedDB.`);
        })
        .catch(console.warn);
    }
  };

  const updateWorkOrder = (wo: Partial<ProductionWorkOrder> & { id: string }) => {
    emit('WORKORDER_UPDATE', wo);
    handleIncomingEvent('WORKORDER_UPDATED', wo);
  };

  const createWorkOrder = (wo: Partial<ProductionWorkOrder>) => {
    const newWo: ProductionWorkOrder = {
      id: `wo-${Date.now()}`,
      orderNumber: wo.orderNumber || `WO-2026-${Math.floor(100 + Math.random() * 900)}`,
      title: wo.title || 'New Production Work Order',
      targetQuantity: wo.targetQuantity || 100,
      completedQuantity: wo.completedQuantity || 0,
      currentStage: wo.currentStage || 'material_allocation',
      priority: wo.priority || 'normal',
      assignedTeam: wo.assignedTeam || 'Assembly Line B',
      deadline: wo.deadline || new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      sku: wo.sku || 'MCU-902-EXT',
      startDate: new Date().toISOString().split('T')[0],
      notes: wo.notes || 'Automated batch release.',
      batchLotNumber: wo.batchLotNumber || `LOT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    emit('WORKORDER_CREATE', newWo);
    handleIncomingEvent('WORKORDER_CREATED', newWo);
  };

  const toggleWorkflowRule = (ruleId: string) => {
    emit('WORKFLOW_RULE_TOGGLE', { id: ruleId });
  };

  const simulateWorkflowTrigger = (ruleId: string) => {
    emit('WORKFLOW_TRIGGER_SIMULATE', { ruleId });
  };

  const createComplianceRecord = (record: Partial<ComplianceRecord>) => {
    const newRecord: ComplianceRecord = {
      id: `cmp-${Date.now()}`,
      standard: record.standard || 'GDPR',
      type: record.type || 'DSAR_REQUEST',
      subject: record.subject || 'Audit Protocol Verification',
      operator: currentUser.name,
      operatorRole: currentUser.role,
      status: record.status || 'verified',
      timestamp: new Date().toISOString(),
      hashSignature: Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join(''),
      details: record.details || 'Compliance record logged with cryptographic tamper-evident seal.',
    };

    emit('COMPLIANCE_RECORD_CREATE', newRecord);
    handleIncomingEvent('COMPLIANCE_RECORD_ADDED', newRecord);
  };

  const uploadCloudFile = (file: Partial<CloudStorageFile>) => {
    const newFile: CloudStorageFile = {
      id: `cld-${Date.now()}`,
      fileName: file.fileName || 'Uploaded_Document.pdf',
      fileSize: file.fileSize || '3.2 MB',
      mimeType: file.mimeType || 'application/pdf',
      cloudProvider: file.cloudProvider || 'AWS S3',
      encryption: 'AES-256-GCM',
      uploadDate: new Date().toISOString().split('T')[0],
      uploadedBy: currentUser.name,
      checksum: `sha256:${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`,
      accessLevel: file.accessLevel || 'Confidential',
    };

    emit('CLOUD_FILE_UPLOAD', newFile);
    handleIncomingEvent('CLOUD_FILE_ADDED', newFile);
  };

  const markNotificationRead = (id: string) => {
    emit('NOTIFICATION_MARK_READ', { id });
    handleIncomingEvent('NOTIFICATION_UPDATED', { id, read: true });
  };

  const markAllNotificationsRead = () => {
    emit('NOTIFICATIONS_MARK_ALL_READ', null);
    handleIncomingEvent('NOTIFICATIONS_ALL_READ', null);
  };

  const askAIAssist = async (queryType: string) => {
    try {
      const res = await fetch('/api/ai/workflow-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryType,
          context: {
            tasks: state.tasks,
            projects: state.projects,
            inventory: state.inventory,
            workOrders: state.workOrders,
            complianceRecords: state.complianceRecords,
          },
        }),
      });
      return await res.json();
    } catch {
      return {
        success: true,
        source: 'local-engine',
        recommendation:
          '1. Prioritize critical path task deliverables.\n2. Reorder inventory SKU-902 immediately.\n3. Execute scheduled GDPR audit verification.',
      };
    }
  };

  const t = translations[language];

  const prioritizeTasks = async () => {
    setIsPrioritizing(true);
    try {
      const res = await fetch('/api/ai/prioritize-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: state.tasks }),
      });
      const data = await res.json();
      if (data.success && data.result) {
        setAiPrioritization(data.result);
        if (data.tasks) {
          setState((prev) => ({ ...prev, tasks: data.tasks }));
          saveAllTasksToDb(data.tasks).catch(console.warn);
        }
        showPushAlert('AI Prioritization Complete', 'Tasks reordered by critical path, deadlines & dependencies.');
      }
    } catch (err) {
      console.error('Failed to run AI prioritization:', err);
    } finally {
      setIsPrioritizing(false);
    }
  };

  const loadExampleScenario = async (scenarioId: string) => {
    setIsPrioritizing(true);
    try {
      setSelectedScenarioId(scenarioId);
      const res = await fetch('/api/tasks/load-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.tasks) {
          setState((prev) => ({ ...prev, tasks: data.tasks }));
          saveAllTasksToDb(data.tasks).catch(console.warn);
        }
        if (data.result) {
          setAiPrioritization(data.result);
        }
        showPushAlert('Scenario Loaded', `Loaded preset: ${data.scenario?.name || scenarioId}`);
      }
    } catch (err) {
      console.error('Failed to load example scenario:', err);
    } finally {
      setIsPrioritizing(false);
    }
  };

  // Offline Synchronization & Simulation Controls
  const toggleOfflineSimulation = () => {
    setIsOfflineSimulated((prev) => {
      const next = !prev;
      if (next) {
        setSyncStatus('offline');
        showPushAlert('Offline Mode Simulated', 'Disconnected from network. Using local IndexedDB store.');
      } else {
        setSyncStatus('syncing');
        showPushAlert('Reconnected', 'Network connection restored. Syncing IndexedDB changes...');
        setTimeout(() => {
          syncOfflineQueue();
        }, 300);
      }
      return next;
    });
  };

  const setOfflineSimulation = (sim: boolean) => {
    setIsOfflineSimulated(sim);
    if (sim) {
      setSyncStatus('offline');
      showPushAlert('Offline Mode Simulated', 'Disconnected from network. Using local IndexedDB store.');
    } else {
      setSyncStatus('syncing');
      showPushAlert('Reconnected', 'Network connection restored. Syncing IndexedDB changes...');
      setTimeout(() => {
        syncOfflineQueue();
      }, 300);
    }
  };

  const syncOfflineQueue = async () => {
    if (!effectiveOnline) {
      showPushAlert('Offline Mode Active', 'Cannot sync while offline or simulated offline.');
      return;
    }

    setSyncStatus('syncing');

    try {
      const pendingMutations = await getPendingMutationsFromDb();
      if (pendingMutations.length > 0) {
        const res = await fetch('/api/sync/offline-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mutations: pendingMutations }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            // Delete synced mutations
            await Promise.all(pendingMutations.map((m) => removeMutationFromDb(m.id)));
            setPendingOfflineMutationsCount(0);

            if (data.tasks) {
              setState((prev) => ({
                ...prev,
                tasks: data.tasks,
                inventory: data.inventory || prev.inventory,
                inventoryMovements: data.inventoryMovements || prev.inventoryMovements,
              }));
              await saveAllTasksToDb(data.tasks);
            }
            if (data.inventory) {
              await saveAllInventoryToDb(data.inventory);
            }
            if (data.inventoryMovements) {
              await saveAllInventoryMovementsToDb(data.inventoryMovements);
            }

            const nowIso = new Date().toISOString();
            await setDbMetadata('lastOnlineSync', nowIso);
            setLastSyncTimestamp(nowIso);
            setSyncStatus('synced');
            showPushAlert(
              'Sync Completed',
              `Successfully synchronized ${data.processedCount} offline mutation(s) with the server.`
            );
            return;
          }
        }
      }

      // If no mutations, refresh state from server
      const stateRes = await fetch('/api/state').catch(() => null);
      if (stateRes && stateRes.ok) {
        const data = await stateRes.json();
        if (data.success && data.state) {
          setState((prev) => ({
            ...prev,
            tasks: data.state.tasks,
            inventory: data.state.inventory,
            inventoryMovements: data.state.inventoryMovements,
          }));
          await Promise.all([
            saveAllTasksToDb(data.state.tasks),
            saveAllInventoryToDb(data.state.inventory),
            saveAllInventoryMovementsToDb(data.state.inventoryMovements),
            setDbMetadata('lastOnlineSync', new Date().toISOString()),
          ]);
          setLastSyncTimestamp(new Date().toISOString());
        }
      }

      setPendingOfflineMutationsCount(0);
      setSyncStatus('synced');
    } catch (err) {
      console.error('Failed to sync offline queue:', err);
      setSyncStatus('error');
    }
  };

  // User Account Management Actions
  const createUserAccount = (
    userData: {
      name: string;
      email: string;
      role: UserRole;
      department: string;
      jobTitle?: string;
      avatar?: string;
      password?: string;
    },
    autoLogin: boolean = true
  ): User => {
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: userData.name,
      email: userData.email,
      avatar:
        userData.avatar ||
        `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      role: userData.role || 'team_member',
      department: userData.department || 'Operations',
      status: 'active',
      lastActive: 'Just now',
      jobTitle: userData.jobTitle || 'Team Member',
      createdAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      users: [...prev.users, newUser],
      subscription: {
        ...prev.subscription,
        seatsUsed: prev.users.length + 1,
      },
    }));

    if (autoLogin) {
      setCurrentUser(newUser);
    }

    emit('USER_CREATE', newUser);

    // Call REST endpoint as well to guarantee persistence
    fetch('/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    }).catch((e) => console.warn('User register REST error:', e));

    showPushAlert('Account Created', `Welcome to OmniWork, ${newUser.name}!`);
    return newUser;
  };

  const switchUser = (userId: string) => {
    const found = state.users.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
      showPushAlert('Identity Switched', `Active user profile changed to ${found.name} (${found.role}).`);
    }
  };

  const updateUserProfile = (userId: string, updates: Partial<User>) => {
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === userId ? { ...u, ...updates } : u)),
    }));
    if (currentUser.id === userId) {
      setCurrentUser((prev) => ({ ...prev, ...updates }));
    }
    emit('USER_UPDATE', { id: userId, ...updates });

    fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch((e) => console.warn('User update REST error:', e));
  };

  const deleteUserAccount = (userId: string) => {
    if (userId === currentUser.id) {
      showPushAlert('Action Restricted', 'Cannot decommission your own currently active administrator session.');
      return;
    }

    setState((prev) => {
      const remaining = prev.users.filter((u) => u.id !== userId);
      return {
        ...prev,
        users: remaining,
        subscription: {
          ...prev.subscription,
          seatsUsed: Math.max(1, remaining.length),
        },
      };
    });

    emit('USER_DELETE', { id: userId });

    fetch(`/api/users/${userId}`, {
      method: 'DELETE',
    }).catch((e) => console.warn('User delete REST error:', e));

    showPushAlert('User Decommissioned', 'User account and credentials revoked.');
  };

  // Subscription & Payment Methods Actions
  const upgradeSubscription = (
    plan: SubscriptionPlanTier,
    interval: BillingInterval = 'annual',
    seats?: number
  ) => {
    const seatsAllocated =
      seats || (plan === 'enterprise' ? 100 : plan === 'professional' ? 25 : 5);
    const storageLimitGb = plan === 'enterprise' ? 1000 : plan === 'professional' ? 100 : 5;

    const perSeatRate =
      plan === 'enterprise'
        ? interval === 'annual'
          ? 65
          : 79
        : plan === 'professional'
        ? interval === 'annual'
          ? 24
          : 29
        : 0;
    const totalAmount =
      perSeatRate * (plan === 'starter' ? 0 : seatsAllocated) * (interval === 'annual' ? 12 : 1);

    const defaultPm =
      state.subscription.paymentMethods.find((p) => p.isDefault) || state.subscription.paymentMethods[0];
    const pmSummary = defaultPm
      ? `${defaultPm.brand.toUpperCase()} ending in ${defaultPm.last4}`
      : 'Corporate Account Invoicing';

    const newInvoice: BillingInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      planTier: plan,
      planName: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan (${seatsAllocated} Seats)`,
      billingInterval: interval,
      seatsCount: seatsAllocated,
      subtotal: totalAmount,
      tax: 0,
      total: totalAmount,
      currency: 'USD',
      status: 'paid',
      paymentMethodSummary: pmSummary,
      items: [
        {
          description: `${plan.toUpperCase()} Tier License (${interval}) - ${seatsAllocated} Seats`,
          qty: seatsAllocated,
          unitPrice: perSeatRate,
          amount: totalAmount,
        },
      ],
    };

    setState((prev) => ({
      ...prev,
      subscription: {
        ...prev.subscription,
        currentPlan: plan,
        billingInterval: interval,
        seatsAllocated,
        storageLimitGb,
        invoices: [newInvoice, ...prev.subscription.invoices],
      },
    }));

    emit('SUBSCRIPTION_UPGRADE', { plan, interval, seats: seatsAllocated });

    fetch('/api/subscription/upgrade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, interval, seats: seatsAllocated }),
    }).catch((e) => console.warn('Upgrade subscription REST error:', e));

    showPushAlert('Plan Upgraded', `Successfully upgraded workspace to ${plan.toUpperCase()} tier!`);
  };

  const addPaymentMethod = (method: Omit<PaymentMethod, 'id' | 'createdAt'>): PaymentMethod => {
    const newPm: PaymentMethod = {
      ...method,
      id: `pm-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setState((prev) => {
      let updatedList = [...prev.subscription.paymentMethods];
      if (newPm.isDefault || updatedList.length === 0) {
        newPm.isDefault = true;
        updatedList = updatedList.map((p) => ({ ...p, isDefault: false }));
      }
      return {
        ...prev,
        subscription: {
          ...prev.subscription,
          paymentMethods: [newPm, ...updatedList],
        },
      };
    });

    emit('PAYMENT_METHOD_ADD', newPm);

    fetch('/api/payment-methods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPm),
    }).catch((e) => console.warn('Payment method REST error:', e));

    showPushAlert('Payment Method Added', `${newPm.brand.toUpperCase()} card ending in ${newPm.last4} is active.`);
    return newPm;
  };

  const removePaymentMethod = (id: string) => {
    setState((prev) => {
      const filtered = prev.subscription.paymentMethods.filter((p) => p.id !== id);
      if (!filtered.some((p) => p.isDefault) && filtered.length > 0) {
        filtered[0].isDefault = true;
      }
      return {
        ...prev,
        subscription: {
          ...prev.subscription,
          paymentMethods: filtered,
        },
      };
    });

    emit('PAYMENT_METHOD_DELETE', { id });
    showPushAlert('Payment Method Removed', 'Payment method removed from workspace billing.');
  };

  const setDefaultPaymentMethod = (id: string) => {
    setState((prev) => ({
      ...prev,
      subscription: {
        ...prev.subscription,
        paymentMethods: prev.subscription.paymentMethods.map((p) => ({
          ...p,
          isDefault: p.id === id,
        })),
      },
    }));

    emit('PAYMENT_METHOD_SET_DEFAULT', { id });
    showPushAlert('Default Payment Updated', 'Default billing payment method updated.');
  };

  return (
    <AppContext.Provider
      value={{
        state,
        currentTab,
        setCurrentTab,
        currentUser,
        setCurrentUser,
        currentRole: currentUser.role,
        setRole,
        language,
        setLanguage,
        t,
        theme,
        setTheme,
        toggleTheme,
        isSocketConnected,
        pushEnabled,
        setPushEnabled,
        showPushAlert,
        notificationDrawerOpen,
        setNotificationDrawerOpen,
        isOnline,
        isOfflineSimulated,
        effectiveOnline,
        toggleOfflineSimulation,
        setOfflineSimulation,
        isIndexedDbReady,
        syncStatus,
        pendingOfflineMutationsCount,
        lastSyncTimestamp,
        syncOfflineQueue,
        offlineStatsModalOpen,
        setOfflineStatsModalOpen,
        isCreateAccountOpen,
        setIsCreateAccountOpen,
        isUpgradeModalOpen,
        setIsUpgradeModalOpen,
        isAddPaymentMethodOpen,
        setIsAddPaymentMethodOpen,
        selectedInvoice,
        setSelectedInvoice,
        createUserAccount,
        switchUser,
        updateUserProfile,
        deleteUserAccount,
        upgradeSubscription,
        addPaymentMethod,
        removePaymentMethod,
        setDefaultPaymentMethod,
        hasPermission,
        createTask,
        updateTask,
        deleteTask,
        activeChannelId,
        setActiveChannelId,
        sendMessage,
        toggleReaction,
        selectedDocId,
        setSelectedDocId,
        updateDocument,
        createDocument,
        toggleDocLock,
        adjustInventory,
        createInventoryItem,
        updateWorkOrder,
        createWorkOrder,
        toggleWorkflowRule,
        simulateWorkflowTrigger,
        createComplianceRecord,
        uploadCloudFile,
        markNotificationRead,
        markAllNotificationsRead,
        askAIAssist,
        aiPrioritization,
        isPrioritizing,
        prioritizeTasks,
        loadExampleScenario,
        selectedScenarioId,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
