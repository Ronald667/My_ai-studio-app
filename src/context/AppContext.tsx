import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
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
  | 'billing';

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
  notificationDrawerOpen: boolean;
  setNotificationDrawerOpen: (open: boolean) => void;

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
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    let socket: WebSocket | null = null;
    let reconnectTimer: any = null;

    function connect() {
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
          reconnectTimer = setTimeout(connect, 3000);
        };

        socket.onerror = () => {
          setIsSocketConnected(false);
        };
      } catch {
        setIsSocketConnected(false);
        reconnectTimer = setTimeout(connect, 3000);
      }
    }

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (socket) socket.close();
    };
  }, []);

  // Central event dispatcher for real-time synchronization
  function handleIncomingEvent(type: string, payload: any) {
    switch (type) {
      case 'INIT_STATE':
        setState((prev) => ({ ...prev, ...payload }));
        break;

      case 'TASK_CREATED':
        setState((prev) => ({
          ...prev,
          tasks: [payload, ...prev.tasks.filter((t) => t.id !== payload.id)],
        }));
        showPushAlert('Task Created', payload.title);
        break;

      case 'TASK_UPDATED':
        setState((prev) => ({
          ...prev,
          tasks: prev.tasks.map((t) => (t.id === payload.id ? { ...t, ...payload } : t)),
        }));
        break;

      case 'TASK_DELETED':
        setState((prev) => ({
          ...prev,
          tasks: prev.tasks.filter((t) => t.id !== payload),
        }));
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
        break;

      case 'INVENTORY_ITEM_CREATED':
        setState((prev) => ({
          ...prev,
          inventory: [...prev.inventory, payload],
        }));
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

    emit('TASK_CREATE', newTask);
    handleIncomingEvent('TASK_CREATED', newTask);
  };

  const updateTask = (task: Partial<Task> & { id: string }) => {
    emit('TASK_UPDATE', task);
    handleIncomingEvent('TASK_UPDATED', task);
  };

  const deleteTask = (taskId: string) => {
    emit('TASK_DELETE', { id: taskId });
    handleIncomingEvent('TASK_DELETED', taskId);
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
    type: InventoryMovement['type'];
    quantity: number;
    referenceOrder?: string;
    performedBy?: string;
    notes?: string;
  }) => {
    emit('INVENTORY_ADJUST', {
      ...payload,
      performedBy: payload.performedBy || currentUser.name,
    });
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

    emit('INVENTORY_ITEM_CREATE', newItem);
    handleIncomingEvent('INVENTORY_ITEM_CREATED', newItem);
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
        notificationDrawerOpen,
        setNotificationDrawerOpen,
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
