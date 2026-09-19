export type UserRole =
  | 'super_admin'
  | 'project_manager'
  | 'compliance_officer'
  | 'production_lead'
  | 'team_member';

export type UserStatus = 'active' | 'away' | 'busy' | 'offline';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  department: string;
  status: UserStatus;
  lastActive: string;
  jobTitle?: string;
  phoneNumber?: string;
  passwordHash?: string;
  twoFactorEnabled?: boolean;
  createdAt?: string;
}

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  projectName: string;
  assigneeId: string;
  assigneeName: string;
  assigneeAvatar: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  estimatedHours: number;
  loggedHours: number;
  tags: string[];
  subtasks: Subtask[];
  attachments: string[];
  hipaaPhiSensitive?: boolean;
  dependencies?: string[]; // Array of task IDs that must be completed before this task can start
  aiPriorityRank?: number; // 1 = top priority next action, 2, 3...
  aiPriorityScore?: number; // 0 - 100
  aiSuggestedOrderReason?: string; // Explainability for why AI placed this task here
  aiUrgencyTier?: 'critical' | 'high' | 'normal' | 'low';
  isBottleneck?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AIPrioritizationResult {
  lastOptimized: string;
  source: string;
  executiveSummary: string;
  optimalOrder: {
    taskId: string;
    rank: number;
    priorityScore: number;
    reason: string;
    urgencyTier: 'critical' | 'high' | 'normal' | 'low';
    unblocksCount: number;
    isBlocked: boolean;
    blockingTaskTitles?: string[];
  }[];
  criticalBlockersCount: number;
}

export type ProjectHealth = 'on_track' | 'at_risk' | 'delayed' | 'completed';

export interface Project {
  id: string;
  name: string;
  code: string;
  clientOrDept: string;
  startDate: string;
  targetDate: string;
  status: ProjectHealth;
  budget: number;
  spent: number;
  progress: number;
  managerId: string;
  managerName: string;
  description: string;
  tasksCount: number;
  completedTasksCount: number;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole: UserRole;
  content: string;
  timestamp: string;
  attachments?: {
    name: string;
    size: string;
    type: string;
    url?: string;
  }[];
  reactions?: {
    emoji: string;
    users: string[];
  }[];
  isSystemEvent?: boolean;
}

export interface ChatChannel {
  id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  members: string[];
  topic: string;
  category: 'team' | 'project' | 'operations' | 'compliance';
}

export interface DocumentVersion {
  version: number;
  timestamp: string;
  authorName: string;
  summary: string;
  contentSnippet: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  category: 'Policy' | 'SOP' | 'Meeting Notes' | 'Specifications' | 'Compliance';
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  lastModified: string;
  version: number;
  versions: DocumentVersion[];
  lockedBy?: {
    id: string;
    name: string;
    timestamp: string;
  };
  permissions: {
    role: UserRole;
    access: 'view' | 'edit' | 'admin';
  }[];
  isEncrypted: boolean;
  phiFlag: boolean;
  tags: string[];
}

export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'quarantine';

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  reorderQuantity: number;
  unitCost: number;
  warehouseLocation: string;
  batchNumber: string;
  expirationDate?: string;
  status: InventoryStatus;
  lastAudited: string;
  supplierName: string;
}

export type MovementType = 'stock_in' | 'stock_out' | 'transfer' | 'waste' | 'audit_adjustment';

export interface InventoryMovement {
  id: string;
  itemId: string;
  itemName: string;
  sku: string;
  type: MovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  referenceOrder: string;
  performedBy: string;
  timestamp: string;
  notes: string;
}

export type WorkOrderStage =
  | 'material_allocation'
  | 'in_production'
  | 'quality_check'
  | 'finished_goods'
  | 'released';

export interface ProductionWorkOrder {
  id: string;
  orderNumber: string;
  title: string;
  targetQuantity: number;
  completedQuantity: number;
  currentStage: WorkOrderStage;
  priority: 'normal' | 'rush';
  assignedTeam: string;
  deadline: string;
  sku: string;
  startDate: string;
  notes: string;
  batchLotNumber: string;
}

export type WorkflowTriggerType =
  | 'task_status_change'
  | 'inventory_low_stock'
  | 'approaching_deadline'
  | 'phi_data_access'
  | 'compliance_audit';

export type WorkflowActionType =
  | 'send_push_notification'
  | 'notify_channel'
  | 'auto_create_order'
  | 'lock_document'
  | 'log_audit';

export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTriggerType;
  conditionDescription: string;
  actionType: WorkflowActionType;
  targetChannelId?: string;
  active: boolean;
  triggerCount: number;
  lastTriggered?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'workflow' | 'deadline' | 'inventory' | 'compliance' | 'mention';
  timestamp: string;
  read: boolean;
  linkTab?: string;
  actionRequired?: boolean;
}

export interface ComplianceRecord {
  id: string;
  standard: 'GDPR' | 'HIPAA';
  type:
    | 'DSAR_REQUEST'
    | 'PHI_ACCESS'
    | 'RIGHT_TO_ERASURE'
    | 'CONSENT_UPDATE'
    | 'BAA_AUDIT'
    | 'ENCRYPTION_KEY_ROTATION'
    | 'ACCESS_CONTROL_CHANGE'
    | 'EMERGENCY_OVERRIDE';
  subject: string;
  operator: string;
  operatorRole: string;
  status: 'verified' | 'pending' | 'flagged' | 'resolved';
  timestamp: string;
  hashSignature: string;
  details: string;
}

export interface CloudStorageFile {
  id: string;
  fileName: string;
  fileSize: string;
  mimeType: string;
  cloudProvider: 'AWS S3' | 'Google Cloud Storage' | 'Azure Blob';
  encryption: 'AES-256-GCM' | 'RSA-4096';
  uploadDate: string;
  uploadedBy: string;
  checksum: string;
  accessLevel: 'Internal' | 'Confidential' | 'Restricted PHI';
  downloadUrl?: string;
}

export type SubscriptionPlanTier = 'starter' | 'professional' | 'enterprise';
export type BillingInterval = 'monthly' | 'annual';
export type PaymentMethodType = 'credit_card' | 'bank_ach' | 'corporate_po';

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  isDefault: boolean;
  name: string; // Cardholder or Company/Account Name
  last4: string; // e.g. "4242" or "9812"
  brand: string; // 'visa' | 'mastercard' | 'amex' | 'discover' | 'ach' | 'corporate_po'
  expiryMonth?: number;
  expiryYear?: number;
  billingEmail?: string;
  bankName?: string;
  accountType?: 'checking' | 'savings' | 'corporate';
  poNumber?: string;
  postalCode?: string;
  country?: string;
  createdAt: string;
}

export interface InvoiceLineItem {
  description: string;
  qty: number;
  unitPrice: number;
  amount: number;
}

export interface BillingInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  planTier: SubscriptionPlanTier;
  planName: string;
  billingInterval: BillingInterval;
  seatsCount: number;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  status: 'paid' | 'pending' | 'draft';
  paymentMethodSummary: string; // e.g., "Visa ending in 4242"
  downloadUrl?: string;
  items: InvoiceLineItem[];
}

export interface SubscriptionState {
  currentPlan: SubscriptionPlanTier;
  billingInterval: BillingInterval;
  seatsAllocated: number;
  seatsUsed: number;
  nextBillingDate: string;
  autoRenew: boolean;
  storageUsedGb: number;
  storageLimitGb: number;
  paymentMethods: PaymentMethod[];
  invoices: BillingInvoice[];
  isTrial?: boolean;
  trialDaysLeft?: number;
}

export interface AppGlobalState {
  users: User[];
  currentUser: User;
  tasks: Task[];
  projects: Project[];
  chatMessages: ChatMessage[];
  chatChannels: ChatChannel[];
  documents: DocumentItem[];
  inventory: InventoryItem[];
  inventoryMovements: InventoryMovement[];
  workOrders: ProductionWorkOrder[];
  workflows: WorkflowRule[];
  notifications: AppNotification[];
  complianceRecords: ComplianceRecord[];
  cloudFiles: CloudStorageFile[];
  connectedClientsCount: number;
  subscription: SubscriptionState;
}
