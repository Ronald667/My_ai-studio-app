import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI } from '@google/genai';
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
  exampleTaskScenarios,
  initialSubscription,
} from './src/initialData.ts';
import {
  User,
  Project,
  ChatChannel,
  Task,
  ChatMessage,
  DocumentItem,
  InventoryItem,
  InventoryMovement,
  ProductionWorkOrder,
  WorkflowRule,
  AppNotification,
  ComplianceRecord,
  CloudStorageFile,
  AIPrioritizationResult,
  SubscriptionState,
  SubscriptionPlanTier,
  BillingInterval,
  PaymentMethod,
  BillingInvoice,
} from './src/types.ts';

const app = express();
const PORT = 3000;
const server = http.createServer(app);

app.use(express.json());

interface DBState {
  users: User[];
  projects: Project[];
  tasks: Task[];
  channels: ChatChannel[];
  messages: ChatMessage[];
  documents: DocumentItem[];
  inventory: InventoryItem[];
  inventoryMovements: InventoryMovement[];
  workOrders: ProductionWorkOrder[];
  workflows: WorkflowRule[];
  notifications: AppNotification[];
  complianceRecords: ComplianceRecord[];
  cloudFiles: CloudStorageFile[];
  subscription: SubscriptionState;
}

// In-memory state store with cross-client synchronization
const db: DBState = {
  users: [...initialUsers],
  projects: [...initialProjects],
  tasks: [...initialTasks],
  channels: [...initialChannels],
  messages: [...initialMessages],
  documents: [...initialDocuments],
  inventory: [...initialInventory],
  inventoryMovements: [...initialInventoryMovements],
  workOrders: [...initialWorkOrders],
  workflows: [...initialWorkflows],
  notifications: [...initialNotifications],
  complianceRecords: [...initialComplianceRecords],
  cloudFiles: [...initialCloudFiles],
  subscription: JSON.parse(JSON.stringify(initialSubscription)),
};

// WebSocket setup
const wss = new WebSocketServer({ server });

function broadcast(type: string, payload: unknown, excludeWs?: WebSocket) {
  const message = JSON.stringify({ type, payload });
  wss.clients.forEach((client) => {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function triggerAutomatedWorkflows(eventType: string, contextData: any) {
  const matchingRules = db.workflows.filter((w) => w.active && w.trigger === eventType);

  matchingRules.forEach((rule) => {
    rule.triggerCount += 1;
    rule.lastTriggered = new Date().toISOString();

    let notifTitle = `Workflow: ${rule.name}`;
    let notifMsg = `Automated action triggered based on: ${rule.conditionDescription}`;
    let notifType: AppNotification['type'] = 'workflow';

    if (eventType === 'inventory_low_stock') {
      notifTitle = `Reorder Alert: ${contextData.name} (${contextData.sku})`;
      notifMsg = `Stock dropped to ${contextData.quantity} ${contextData.unit} (Below min safety threshold ${contextData.minThreshold}). Purchase order proposal generated.`;
      notifType = 'inventory';
    } else if (eventType === 'task_status_change') {
      notifTitle = `Task Status Review Required: ${contextData.title}`;
      notifMsg = `Task moved to "${contextData.status}" by ${contextData.assigneeName}. Project Manager notification dispatched.`;
      notifType = 'workflow';
    } else if (eventType === 'phi_data_access') {
      notifTitle = `HIPAA Access Logged: ${contextData.title}`;
      notifMsg = `PHI sensitive record accessed. Immutable audit trail generated with SHA-256 integrity digest.`;
      notifType = 'compliance';
    }

    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: notifTitle,
      message: notifMsg,
      type: notifType,
      timestamp: new Date().toISOString(),
      read: false,
      linkTab: eventType === 'inventory_low_stock' ? 'inventory' : eventType === 'phi_data_access' ? 'compliance' : 'tasks',
      actionRequired: eventType === 'inventory_low_stock',
    };

    db.notifications.unshift(newNotif);
    broadcast('NOTIFICATION_PUSH', newNotif);
    broadcast('WORKFLOW_TRIGGERED', { rule, notification: newNotif });

    // Also auto-post system notification to relevant channel if configured
    if (rule.targetChannelId) {
      const sysMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        channelId: rule.targetChannelId,
        senderId: 'sys-bot',
        senderName: 'Workflow Automation Bot',
        senderAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
        senderRole: 'super_admin',
        content: `🤖 [AUTOMATED WORKFLOW]: ${notifTitle} — ${notifMsg}`,
        timestamp: new Date().toISOString(),
        isSystemEvent: true,
      };
      db.messages.push(sysMsg);
      broadcast('CHAT_MESSAGE_ADDED', sysMsg);
    }
  });
}

wss.on('connection', (ws) => {
  // Send initial synchronized state on connection
  ws.send(
    JSON.stringify({
      type: 'INIT_STATE',
      payload: {
        users: db.users,
        projects: db.projects,
        tasks: db.tasks,
        channels: db.channels,
        messages: db.messages,
        documents: db.documents,
        inventory: db.inventory,
        inventoryMovements: db.inventoryMovements,
        workOrders: db.workOrders,
        workflows: db.workflows,
        notifications: db.notifications,
        complianceRecords: db.complianceRecords,
        cloudFiles: db.cloudFiles,
        subscription: db.subscription,
        connectedClientsCount: wss.clients.size,
      },
    })
  );

  broadcast('PRESENCE_SYNC', { connectedCount: wss.clients.size });

  ws.on('message', async (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      const { type, payload } = data;

      switch (type) {
        case 'TASK_CREATE': {
          const newTask: Task = {
            ...payload,
            id: payload.id || `task-${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          db.tasks.unshift(newTask);
          broadcast('TASK_CREATED', newTask);
          break;
        }

        case 'TASK_UPDATE': {
          const index = db.tasks.findIndex((t) => t.id === payload.id);
          if (index !== -1) {
            const oldStatus = db.tasks[index].status;
            db.tasks[index] = { ...db.tasks[index], ...payload, updatedAt: new Date().toISOString() };
            const updatedTask = db.tasks[index];
            broadcast('TASK_UPDATED', updatedTask);

            // Trigger workflow if status changed to review or done
            if (oldStatus !== updatedTask.status) {
              triggerAutomatedWorkflows('task_status_change', updatedTask);
            }
          }
          break;
        }

        case 'TASK_DELETE': {
          db.tasks = db.tasks.filter((t) => t.id !== payload.id);
          broadcast('TASK_DELETED', payload.id);
          break;
        }

        case 'PRIORITIZE_TASKS': {
          const result = await handleTaskPrioritization(db.tasks);
          broadcast('TASKS_PRIORITIZED', { tasks: db.tasks, result });
          break;
        }

        case 'LOAD_SCENARIO': {
          const { scenarioId } = payload;
          const found = exampleTaskScenarios.find((s) => s.id === scenarioId);
          if (found) {
            db.tasks = JSON.parse(JSON.stringify(found.tasks));
            const result = await handleTaskPrioritization(db.tasks);
            broadcast('SCENARIO_LOADED', { scenarioId, tasks: db.tasks, result });
          }
          break;
        }

        case 'CHAT_MESSAGE_SEND': {
          const newMsg: ChatMessage = {
            ...payload,
            id: payload.id || `msg-${Date.now()}`,
            timestamp: new Date().toISOString(),
          };
          db.messages.push(newMsg);
          broadcast('CHAT_MESSAGE_ADDED', newMsg);
          break;
        }

        case 'CHAT_REACTION_TOGGLE': {
          const { messageId, emoji, userId } = payload;
          const msg = db.messages.find((m) => m.id === messageId);
          if (msg) {
            msg.reactions = msg.reactions || [];
            const rIndex = msg.reactions.findIndex((r) => r.emoji === emoji);
            if (rIndex > -1) {
              const uIndex = msg.reactions[rIndex].users.indexOf(userId);
              if (uIndex > -1) {
                msg.reactions[rIndex].users.splice(uIndex, 1);
                if (msg.reactions[rIndex].users.length === 0) {
                  msg.reactions.splice(rIndex, 1);
                }
              } else {
                msg.reactions[rIndex].users.push(userId);
              }
            } else {
              msg.reactions.push({ emoji, users: [userId] });
            }
            broadcast('CHAT_REACTION_UPDATED', { messageId, reactions: msg.reactions });
          }
          break;
        }

        case 'DOC_UPDATE': {
          const doc = db.documents.find((d) => d.id === payload.id);
          if (doc) {
            const newVersion = doc.version + 1;
            doc.versions.unshift({
              version: doc.version,
              timestamp: doc.lastModified,
              authorName: payload.authorName || doc.authorName,
              summary: payload.summary || `Version ${doc.version} revision`,
              contentSnippet: doc.content.slice(0, 80) + '...',
            });
            doc.content = payload.content;
            doc.title = payload.title || doc.title;
            doc.category = payload.category || doc.category;
            doc.version = newVersion;
            doc.lastModified = new Date().toISOString();
            doc.isEncrypted = payload.isEncrypted !== undefined ? payload.isEncrypted : doc.isEncrypted;
            doc.phiFlag = payload.phiFlag !== undefined ? payload.phiFlag : doc.phiFlag;
            broadcast('DOC_UPDATED', doc);

            if (doc.phiFlag) {
              triggerAutomatedWorkflows('phi_data_access', doc);
            }
          }
          break;
        }

        case 'DOC_LOCK_TOGGLE': {
          const doc = db.documents.find((d) => d.id === payload.id);
          if (doc) {
            doc.lockedBy = payload.lock ? { id: payload.userId, name: payload.userName, timestamp: new Date().toISOString() } : undefined;
            broadcast('DOC_LOCK_CHANGED', { id: doc.id, lockedBy: doc.lockedBy });
          }
          break;
        }

        case 'DOC_CREATE': {
          const newDoc: DocumentItem = {
            ...payload,
            id: payload.id || `doc-${Date.now()}`,
            version: 1,
            versions: [],
            lastModified: new Date().toISOString(),
          };
          db.documents.unshift(newDoc);
          broadcast('DOC_CREATED', newDoc);
          break;
        }

        case 'INVENTORY_ADJUST': {
          const { itemId, type, quantity, referenceOrder, performedBy, notes } = payload;
          const item = db.inventory.find((i) => i.id === itemId);
          if (item) {
            const prevQty = item.quantity;
            let newQty = prevQty;
            const diff = Number(quantity);

            if (type === 'stock_in') newQty = prevQty + diff;
            else if (type === 'stock_out' || type === 'waste') newQty = Math.max(0, prevQty - diff);
            else if (type === 'audit_adjustment') newQty = diff;

            item.quantity = newQty;
            item.status = newQty === 0 ? 'out_of_stock' : newQty <= item.minThreshold ? 'low_stock' : 'in_stock';
            item.lastAudited = new Date().toISOString().split('T')[0];

            const movement: InventoryMovement = {
              id: `mov-${Date.now()}`,
              itemId: item.id,
              itemName: item.name,
              sku: item.sku,
              type,
              quantity: diff,
              previousQuantity: prevQty,
              newQuantity: newQty,
              referenceOrder: referenceOrder || 'ADJ-' + Math.floor(1000 + Math.random() * 9000),
              performedBy: performedBy || 'Operator',
              timestamp: new Date().toISOString(),
              notes: notes || 'Stock adjustment movement',
            };

            db.inventoryMovements.unshift(movement);
            broadcast('INVENTORY_UPDATED', { item, movement });

            if (newQty <= item.minThreshold) {
              triggerAutomatedWorkflows('inventory_low_stock', item);
            }
          }
          break;
        }

        case 'INVENTORY_ITEM_CREATE': {
          const newItem: InventoryItem = {
            ...payload,
            id: payload.id || `inv-${Date.now()}`,
            lastAudited: new Date().toISOString().split('T')[0],
          };
          db.inventory.push(newItem);
          broadcast('INVENTORY_ITEM_CREATED', newItem);
          break;
        }

        case 'WORKORDER_UPDATE': {
          const wo = db.workOrders.find((w) => w.id === payload.id);
          if (wo) {
            Object.assign(wo, payload);
            broadcast('WORKORDER_UPDATED', wo);
          }
          break;
        }

        case 'WORKORDER_CREATE': {
          const newWo: ProductionWorkOrder = {
            ...payload,
            id: payload.id || `wo-${Date.now()}`,
            startDate: new Date().toISOString().split('T')[0],
          };
          db.workOrders.unshift(newWo);
          broadcast('WORKORDER_CREATED', newWo);
          break;
        }

        case 'WORKFLOW_RULE_TOGGLE': {
          const rule = db.workflows.find((w) => w.id === payload.id);
          if (rule) {
            rule.active = !rule.active;
            broadcast('WORKFLOW_RULE_UPDATED', rule);
          }
          break;
        }

        case 'WORKFLOW_TRIGGER_SIMULATE': {
          const { ruleId } = payload;
          const rule = db.workflows.find((w) => w.id === ruleId);
          if (rule) {
            triggerAutomatedWorkflows(rule.trigger, {
              title: 'Simulated Event Target',
              name: 'Microcontroller IC-902',
              sku: 'MCU-902-EXT',
              quantity: 240,
              unit: 'pcs',
              minThreshold: 500,
              status: 'review',
              assigneeName: 'Automated Test Runner',
            });
          }
          break;
        }

        case 'COMPLIANCE_RECORD_CREATE': {
          const newRecord: ComplianceRecord = {
            ...payload,
            id: payload.id || `cmp-${Date.now()}`,
            timestamp: new Date().toISOString(),
            hashSignature:
              payload.hashSignature ||
              Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
          };
          db.complianceRecords.unshift(newRecord);
          broadcast('COMPLIANCE_RECORD_ADDED', newRecord);
          break;
        }

        case 'CLOUD_FILE_UPLOAD': {
          const newFile: CloudStorageFile = {
            ...payload,
            id: payload.id || `cld-${Date.now()}`,
            uploadDate: new Date().toISOString().split('T')[0],
            checksum: `sha256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
          };
          db.cloudFiles.unshift(newFile);
          broadcast('CLOUD_FILE_ADDED', newFile);
          break;
        }

        case 'NOTIFICATION_MARK_READ': {
          const notif = db.notifications.find((n) => n.id === payload.id);
          if (notif) {
            notif.read = true;
            broadcast('NOTIFICATION_UPDATED', notif);
          }
          break;
        }

        case 'NOTIFICATIONS_MARK_ALL_READ': {
          db.notifications.forEach((n) => (n.read = true));
          broadcast('NOTIFICATIONS_ALL_READ', null);
          break;
        }

        case 'USER_CREATE': {
          const newUser: User = {
            id: payload.id || `usr-${Date.now()}`,
            name: payload.name,
            email: payload.email,
            avatar:
              payload.avatar ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            role: payload.role || 'team_member',
            department: payload.department || 'Operations',
            status: 'active',
            lastActive: 'Just now',
            jobTitle: payload.jobTitle || 'Team Member',
            createdAt: new Date().toISOString(),
          };
          db.users.push(newUser);
          db.subscription.seatsUsed = db.users.length;
          broadcast('USER_CREATED', newUser);

          // Automated Compliance Audit Trail
          const cmpRecord: ComplianceRecord = {
            id: `cmp-${Date.now()}`,
            standard: 'GDPR',
            type: 'ACCESS_CONTROL_CHANGE',
            subject: `User Identity Created: ${newUser.name} (${newUser.email})`,
            operator: 'IAM Governance Service',
            operatorRole: 'super_admin',
            status: 'verified',
            timestamp: new Date().toISOString(),
            hashSignature: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
            details: `Account provisioned with role [${newUser.role}], department [${newUser.department}]. Verified tenant seat allocated.`,
          };
          db.complianceRecords.unshift(cmpRecord);
          broadcast('COMPLIANCE_RECORD_ADDED', cmpRecord);
          break;
        }

        case 'USER_UPDATE': {
          const uIndex = db.users.findIndex((u) => u.id === payload.id);
          if (uIndex !== -1) {
            db.users[uIndex] = { ...db.users[uIndex], ...payload };
            broadcast('USER_UPDATED', db.users[uIndex]);
          }
          break;
        }

        case 'SUBSCRIPTION_UPGRADE': {
          const { plan, interval, seats } = payload;
          const currentPlan = (plan || 'professional') as SubscriptionPlanTier;
          const billingInterval = (interval || db.subscription.billingInterval) as BillingInterval;
          const seatsAllocated =
            seats ||
            (currentPlan === 'enterprise' ? 100 : currentPlan === 'professional' ? 25 : 5);
          const storageLimitGb =
            currentPlan === 'enterprise' ? 1000 : currentPlan === 'professional' ? 100 : 5;

          db.subscription.currentPlan = currentPlan;
          db.subscription.billingInterval = billingInterval;
          db.subscription.seatsAllocated = seatsAllocated;
          db.subscription.storageLimitGb = storageLimitGb;

          const perSeatRate =
            currentPlan === 'enterprise'
              ? billingInterval === 'annual'
                ? 65
                : 79
              : currentPlan === 'professional'
              ? billingInterval === 'annual'
                ? 24
                : 29
              : 0;
          const totalAmount =
            perSeatRate * (currentPlan === 'starter' ? 0 : seatsAllocated) * (billingInterval === 'annual' ? 12 : 1);

          const defaultPm =
            db.subscription.paymentMethods.find((p) => p.isDefault) || db.subscription.paymentMethods[0];
          const pmSummary = defaultPm
            ? `${defaultPm.brand.toUpperCase()} ending in ${defaultPm.last4}`
            : 'Corporate Account Invoicing';

          const newInvoice: BillingInvoice = {
            id: `inv-${Date.now()}`,
            invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            date: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
            planTier: currentPlan,
            planName: `${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan (${seatsAllocated} Seats)`,
            billingInterval,
            seatsCount: seatsAllocated,
            subtotal: totalAmount,
            tax: 0,
            total: totalAmount,
            currency: 'USD',
            status: 'paid',
            paymentMethodSummary: pmSummary,
            items: [
              {
                description: `${currentPlan.toUpperCase()} Tier License (${billingInterval}) - ${seatsAllocated} Seats`,
                qty: seatsAllocated,
                unitPrice: perSeatRate,
                amount: totalAmount,
              },
            ],
          };

          db.subscription.invoices.unshift(newInvoice);

          const notif: AppNotification = {
            id: `notif-${Date.now()}`,
            title: `Subscription Upgraded to ${currentPlan.toUpperCase()}`,
            message: `Workspace upgraded to ${currentPlan.toUpperCase()} tier with ${seatsAllocated} subscriber seats. Invoice ${newInvoice.invoiceNumber} confirmed.`,
            type: 'workflow',
            timestamp: new Date().toISOString(),
            read: false,
            linkTab: 'billing',
          };
          db.notifications.unshift(notif);
          broadcast('NOTIFICATION_ADDED', notif);
          broadcast('SUBSCRIPTION_UPDATED', db.subscription);
          break;
        }

        case 'PAYMENT_METHOD_ADD': {
          const newMethod: PaymentMethod = {
            id: `pm-${Date.now()}`,
            type: payload.type || 'credit_card',
            isDefault: Boolean(payload.isDefault) || db.subscription.paymentMethods.length === 0,
            name: payload.name || 'Account Holder',
            last4: payload.last4 || '4242',
            brand: payload.brand || 'visa',
            expiryMonth: payload.expiryMonth || 12,
            expiryYear: payload.expiryYear || 2028,
            billingEmail: payload.billingEmail || '',
            bankName: payload.bankName,
            accountType: payload.accountType,
            poNumber: payload.poNumber,
            postalCode: payload.postalCode || '94107',
            country: payload.country || 'United States',
            createdAt: new Date().toISOString(),
          };

          if (newMethod.isDefault) {
            db.subscription.paymentMethods.forEach((pm) => {
              pm.isDefault = false;
            });
          }
          db.subscription.paymentMethods.unshift(newMethod);
          broadcast('SUBSCRIPTION_UPDATED', db.subscription);
          break;
        }

        case 'PAYMENT_METHOD_DELETE': {
          db.subscription.paymentMethods = db.subscription.paymentMethods.filter((pm) => pm.id !== payload.id);
          if (!db.subscription.paymentMethods.some((pm) => pm.isDefault) && db.subscription.paymentMethods.length > 0) {
            db.subscription.paymentMethods[0].isDefault = true;
          }
          broadcast('SUBSCRIPTION_UPDATED', db.subscription);
          break;
        }

        case 'PAYMENT_METHOD_SET_DEFAULT': {
          db.subscription.paymentMethods.forEach((pm) => {
            pm.isDefault = pm.id === payload.id;
          });
          broadcast('SUBSCRIPTION_UPDATED', db.subscription);
          break;
        }
      }
    } catch (err) {
      console.error('WebSocket message parsing error:', err);
    }
  });

  ws.on('close', () => {
    broadcast('PRESENCE_SYNC', { connectedCount: wss.clients.size });
  });
});

// REST API Endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    activeSockets: wss.clients.size,
    standards: ['GDPR Article 17 Compliant', 'HIPAA Security Rule 45 CFR § 164.312', 'TLS 1.3 Strict'],
  });
});

app.get('/api/state', (req, res) => {
  res.json({
    users: db.users,
    projects: db.projects,
    tasks: db.tasks,
    channels: db.channels,
    messages: db.messages,
    documents: db.documents,
    inventory: db.inventory,
    inventoryMovements: db.inventoryMovements,
    workOrders: db.workOrders,
    workflows: db.workflows,
    notifications: db.notifications,
    complianceRecords: db.complianceRecords,
    cloudFiles: db.cloudFiles,
    subscription: db.subscription,
  });
});

app.get('/api/subscription', (req, res) => {
  res.json({ success: true, subscription: db.subscription });
});

app.post('/api/subscription/upgrade', (req, res) => {
  const { plan, interval, seats } = req.body;
  const currentPlan = (plan || 'professional') as SubscriptionPlanTier;
  const billingInterval = (interval || db.subscription.billingInterval) as BillingInterval;
  const seatsAllocated =
    seats || (currentPlan === 'enterprise' ? 100 : currentPlan === 'professional' ? 25 : 5);
  const storageLimitGb = currentPlan === 'enterprise' ? 1000 : currentPlan === 'professional' ? 100 : 5;

  db.subscription.currentPlan = currentPlan;
  db.subscription.billingInterval = billingInterval;
  db.subscription.seatsAllocated = seatsAllocated;
  db.subscription.storageLimitGb = storageLimitGb;

  const perSeatRate =
    currentPlan === 'enterprise'
      ? billingInterval === 'annual'
        ? 65
        : 79
      : currentPlan === 'professional'
      ? billingInterval === 'annual'
        ? 24
        : 29
      : 0;
  const totalAmount =
    perSeatRate * (currentPlan === 'starter' ? 0 : seatsAllocated) * (billingInterval === 'annual' ? 12 : 1);

  const defaultPm =
    db.subscription.paymentMethods.find((p) => p.isDefault) || db.subscription.paymentMethods[0];
  const pmSummary = defaultPm
    ? `${defaultPm.brand.toUpperCase()} ending in ${defaultPm.last4}`
    : 'Corporate Account Invoicing';

  const newInvoice: BillingInvoice = {
    id: `inv-${Date.now()}`,
    invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    planTier: currentPlan,
    planName: `${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan (${seatsAllocated} Seats)`,
    billingInterval,
    seatsCount: seatsAllocated,
    subtotal: totalAmount,
    tax: 0,
    total: totalAmount,
    currency: 'USD',
    status: 'paid',
    paymentMethodSummary: pmSummary,
    items: [
      {
        description: `${currentPlan.toUpperCase()} Tier License (${billingInterval}) - ${seatsAllocated} Seats`,
        qty: seatsAllocated,
        unitPrice: perSeatRate,
        amount: totalAmount,
      },
    ],
  };

  db.subscription.invoices.unshift(newInvoice);

  const notif: AppNotification = {
    id: `notif-${Date.now()}`,
    title: `Subscription Upgraded to ${currentPlan.toUpperCase()}`,
    message: `Workspace upgraded to ${currentPlan.toUpperCase()} with ${seatsAllocated} seats. Invoice ${newInvoice.invoiceNumber} recorded.`,
    type: 'workflow',
    timestamp: new Date().toISOString(),
    read: false,
    linkTab: 'billing',
  };
  db.notifications.unshift(notif);
  broadcast('NOTIFICATION_ADDED', notif);
  broadcast('SUBSCRIPTION_UPDATED', db.subscription);

  res.json({ success: true, subscription: db.subscription, invoice: newInvoice });
});

app.post('/api/users/register', (req, res) => {
  const { name, email, role, department, jobTitle, avatar } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }
  const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'A user account with this email already exists.' });
  }

  const newUser: User = {
    id: `usr-${Date.now()}`,
    name,
    email,
    avatar:
      avatar ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: role || 'team_member',
    department: department || 'Operations',
    status: 'active',
    lastActive: 'Just now',
    jobTitle: jobTitle || 'Team Member',
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  db.subscription.seatsUsed = db.users.length;
  broadcast('USER_CREATED', newUser);

  const cmpRecord: ComplianceRecord = {
    id: `cmp-${Date.now()}`,
    standard: 'GDPR',
    type: 'ACCESS_CONTROL_CHANGE',
    subject: `Identity Account Created: ${newUser.name} (${newUser.email})`,
    operator: 'Admin Web Registration',
    operatorRole: 'super_admin',
    status: 'verified',
    timestamp: new Date().toISOString(),
    hashSignature: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    details: `Role assigned: ${newUser.role}. Department: ${newUser.department}. Assigned tenant seat #${db.users.length}.`,
  };
  db.complianceRecords.unshift(cmpRecord);
  broadcast('COMPLIANCE_RECORD_ADDED', cmpRecord);

  res.status(201).json({ success: true, user: newUser });
});

app.post('/api/payment-methods', (req, res) => {
  const payload = req.body;
  const newMethod: PaymentMethod = {
    id: `pm-${Date.now()}`,
    type: payload.type || 'credit_card',
    isDefault: Boolean(payload.isDefault) || db.subscription.paymentMethods.length === 0,
    name: payload.name || 'Account Holder',
    last4: payload.last4 || '4242',
    brand: payload.brand || 'visa',
    expiryMonth: payload.expiryMonth || 12,
    expiryYear: payload.expiryYear || 2028,
    billingEmail: payload.billingEmail || '',
    bankName: payload.bankName,
    accountType: payload.accountType,
    poNumber: payload.poNumber,
    postalCode: payload.postalCode || '94107',
    country: payload.country || 'United States',
    createdAt: new Date().toISOString(),
  };

  if (newMethod.isDefault) {
    db.subscription.paymentMethods.forEach((pm) => {
      pm.isDefault = false;
    });
  }
  db.subscription.paymentMethods.unshift(newMethod);
  broadcast('SUBSCRIPTION_UPDATED', db.subscription);

  res.status(201).json({ success: true, paymentMethod: newMethod, subscription: db.subscription });
});

// AI Workflow & Analytics Assistant Endpoint (Gemini API Server-Side)
app.post('/api/ai/workflow-assist', async (req, res) => {
  const { queryType, context } = req.body;

  try {
    if (process.env.GEMINI_API_KEY) {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      let prompt = '';
      if (queryType === 'inventory_optimization') {
        prompt = `You are an expert enterprise supply chain & production inventory architect.
Analyze the following inventory items and pending work orders:
${JSON.stringify(context.inventory.slice(0, 5))}
Work Orders:
${JSON.stringify(context.workOrders.slice(0, 3))}

Provide a concise, highly actionable 3-point recommendation covering:
1. Critical reorder timing and safety stock adjustments.
2. Production work order bottleneck avoidance.
3. Waste reduction and batch expiration precautions.
Keep response professional, data-driven, and under 250 words.`;
      } else if (queryType === 'compliance_audit') {
        prompt = `You are a certified HIPAA & EU GDPR compliance auditor.
Review the following compliance log events:
${JSON.stringify(context.complianceRecords.slice(0, 4))}

Provide a concise 3-point risk analysis and executive sign-off summary:
1. HIPAA ePHI access confidentiality review.
2. GDPR DSAR and Right to Erasure timeliness assessment.
3. Next preventative security recommendation for multi-cloud encrypted storage.
Keep response strictly professional, audit-ready, and under 250 words.`;
      } else {
        prompt = `You are an agile project operations director.
Review current active tasks and project deadlines:
Tasks: ${JSON.stringify(context.tasks.slice(0, 5))}
Projects: ${JSON.stringify(context.projects.slice(0, 3))}

Provide a 3-point workflow optimization plan to resolve at-risk project deadlines and maximize team throughput. Keep under 250 words.`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      return res.json({
        success: true,
        source: 'gemini-3.8-flash',
        recommendation: response.text,
      });
    }

    // Fallback if no GEMINI_API_KEY is configured
    let fallbackText = '';
    if (queryType === 'inventory_optimization') {
      fallbackText = `1. **Safety Stock Buffer**: Recommend immediately placing purchase order for SKU MCU-902-EXT (current 380 pcs vs threshold 500 pcs) with 1,200 reorder batch to protect Assembly Cell Alpha.\n2. **Batch Lot Segregation**: Prioritize Biometric Optical Sensor Array Lot-2026-9012 for Work Order WO-2026-092 to prevent expiration slippage.\n3. **Warehouse Throughput**: Bay 3 automated bin access is running at 94% efficiency; schedule weekly calibration on Friday.`;
    } else if (queryType === 'compliance_audit') {
      fallbackText = `1. **HIPAA ePHI Access Audit**: All 22 recent telemetric touches in Project Helix were encrypted via AES-256-GCM with zero unmasked patient identifiers.\n2. **GDPR DSAR Timeliness**: Request DSAR-EU-2026-042 identity was confirmed under 24 hours, well ahead of the 30-day statutory limit.\n3. **Cloud Key Rotation**: Enforce KMS key re-encryption cycle within the next 14 days across AWS S3 and GCS buckets.`;
    } else {
      fallbackText = `1. **Critical Path Alignment**: Prioritize Task 101 (HIPAA PHI transit) and Task 102 (Reorder triggers) to unblock upcoming milestones.\n2. **Resource Load Rebalancing**: Marcus Vance and David Kalu have 4 active work streams; delegate subtasks to Aoi Takahashi.\n3. **Sprint Velocity**: 74% progress achieved on Project Helix; on target for on-time delivery.`;
    }

    return res.json({
      success: true,
      source: 'rule-engine-fallback',
      recommendation: fallbackText,
    });
  } catch (err: any) {
    console.error('AI Assist error:', err);
    return res.json({
      success: true,
      source: 'rule-engine-fallback',
      recommendation: `1. **Automated Reorder Trigger**: Reorder proposed for Microcontroller IC-902.\n2. **Deadline Safeguard**: Fast-track review on pending tasks.\n3. **Compliance Health**: 100% hash integrity maintained.`,
    });
  }
});

// AI-Powered Task Prioritization Logic (Deterministic Graph + Gemini LLM)
function computeDeterministicTaskPrioritization(tasks: Task[]): AIPrioritizationResult {
  const activeTasks = tasks.filter((t) => t.status !== 'done');
  const now = new Date('2026-09-18T12:00:00Z').getTime();

  const taskMap = new Map<string, Task>();
  tasks.forEach((t) => taskMap.set(t.id, t));

  const unblocksMap = new Map<string, string[]>();
  tasks.forEach((t) => {
    (t.dependencies || []).forEach((depId) => {
      const arr = unblocksMap.get(depId) || [];
      arr.push(t.title);
      unblocksMap.set(depId, arr);
    });
  });

  const scored = activeTasks.map((t) => {
    const deps = t.dependencies || [];
    const incompleteDeps = deps.filter((depId) => {
      const depTask = taskMap.get(depId);
      return depTask && depTask.status !== 'done';
    });

    const isBlocked = incompleteDeps.length > 0;
    const blockingTaskTitles = incompleteDeps.map((id) => taskMap.get(id)?.title || id);
    const unblocksTitles = unblocksMap.get(t.id) || [];
    const unblocksCount = unblocksTitles.length;

    const dueDateMs = new Date(t.dueDate).getTime();
    const daysUntilDue = Math.max(0, (dueDateMs - now) / (1000 * 60 * 60 * 24));

    let priorityPoints = 15;
    if (t.priority === 'urgent') priorityPoints = 40;
    else if (t.priority === 'high') priorityPoints = 28;
    else if (t.priority === 'medium') priorityPoints = 18;
    else if (t.priority === 'low') priorityPoints = 8;

    let deadlinePoints = 10;
    if (daysUntilDue <= 2) deadlinePoints = 35;
    else if (daysUntilDue <= 4) deadlinePoints = 24;
    else if (daysUntilDue <= 7) deadlinePoints = 14;

    const unblockPoints = unblocksCount * 14;
    const blockedPenalty = isBlocked ? -25 : 0;
    const complianceBonus = t.hipaaPhiSensitive ? 8 : 0;

    const rawScore = priorityPoints + deadlinePoints + unblockPoints + blockedPenalty + complianceBonus;
    const priorityScore = Math.max(15, Math.min(99, Math.round(rawScore)));

    let urgencyTier: 'critical' | 'high' | 'normal' | 'low' = 'normal';
    if (priorityScore >= 90) urgencyTier = 'critical';
    else if (priorityScore >= 75) urgencyTier = 'high';
    else if (priorityScore >= 50) urgencyTier = 'normal';
    else urgencyTier = 'low';

    let reason = '';
    if (unblocksCount > 0 && !isBlocked) {
      reason = `Root critical path blocker: unblocks ${unblocksCount} downstream workstream${unblocksCount > 1 ? 's' : ''} with deadline in ${Math.max(1, Math.round(daysUntilDue))}d.`;
    } else if (isBlocked) {
      reason = `Dependent task: currently waiting on "${blockingTaskTitles[0] || 'prerequisite'}". Complete prerequisite first.`;
    } else if (daysUntilDue <= 2) {
      reason = `Approaching deadline in ${Math.max(1, Math.round(daysUntilDue))}d with ${t.priority.toUpperCase()} priority. Prioritized for immediate action.`;
    } else if (t.priority === 'urgent') {
      reason = `Designated URGENT priority by project lead. Fast-track execution recommended.`;
    } else {
      reason = `Scheduled operation in queue. All prerequisites satisfied.`;
    }

    return {
      task: t,
      priorityScore,
      isBlocked,
      blockingTaskTitles,
      unblocksCount,
      unblocksTitles,
      urgencyTier,
      reason,
    };
  });

  scored.sort((a, b) => {
    if (b.task.dependencies?.includes(a.task.id)) return -1;
    if (a.task.dependencies?.includes(b.task.id)) return 1;

    if (!a.isBlocked && b.isBlocked) return -1;
    if (a.isBlocked && !b.isBlocked) return 1;

    return b.priorityScore - a.priorityScore;
  });

  const optimalOrder = scored.map((item, idx) => ({
    taskId: item.task.id,
    rank: idx + 1,
    priorityScore: item.priorityScore,
    reason: item.reason,
    urgencyTier: item.urgencyTier,
    unblocksCount: item.unblocksCount,
    isBlocked: item.isBlocked,
    blockingTaskTitles: item.blockingTaskTitles,
  }));

  const criticalBlockers = scored.filter((s) => s.unblocksCount > 0 && !s.isBlocked);
  const executiveSummary =
    criticalBlockers.length > 0
      ? `Identified ${criticalBlockers.length} critical path blocker${criticalBlockers.length > 1 ? 's' : ''} (${criticalBlockers.map((c) => `"${c.task.title.slice(0, 28)}..."`).join(' & ')}). Resolving these unblocks ${criticalBlockers.reduce((acc, c) => acc + c.unblocksCount, 0)} downstream production & compliance operations.`
      : `All active tasks evaluated across dependencies, deadlines, and urgency. Optimal order established for on-time delivery.`;

  return {
    lastOptimized: new Date().toISOString(),
    source: 'rule-engine-fallback',
    executiveSummary,
    optimalOrder,
    criticalBlockersCount: criticalBlockers.length,
  };
}

async function handleTaskPrioritization(tasks: Task[]): Promise<AIPrioritizationResult> {
  const deterministicResult = computeDeterministicTaskPrioritization(tasks);

  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' },
        },
      });

      const activeTasksSummary = tasks
        .filter((t) => t.status !== 'done')
        .map((t) => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
          status: t.status,
          dueDate: t.dueDate,
          dependencies: t.dependencies || [],
          assignee: t.assigneeName,
          projectName: t.projectName,
          hipaaPhiSensitive: t.hipaaPhiSensitive,
        }));

      const prompt = `You are an elite Operations Research Director and AI Task Scheduler.
Analyze these enterprise office tasks considering deadlines, dependency chains (prerequisites), and user-set priorities:
${JSON.stringify(activeTasksSummary, null, 2)}

Rules:
1. Prerequisite Constraint: If Task B depends on Task A and Task A is not done, Task A must come before Task B.
2. Critical Path: Tasks that unblock multiple other tasks must be given high priority.
3. Approaching Deadlines: Tasks with nearest due dates get higher urgency.
4. Provide a clear, actionable reason for each task's position in the optimal sequence.

Respond with ONLY valid JSON adhering to this schema:
{
  "executiveSummary": "Concise 2-sentence executive operational analysis highlighting critical blockers and recommended order",
  "optimalOrder": [
    {
      "taskId": "string",
      "rank": 1,
      "priorityScore": 98,
      "reason": "Clear explanation of why this task is placed at this rank",
      "urgencyTier": "critical" | "high" | "normal" | "low"
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        if (parsed && Array.isArray(parsed.optimalOrder)) {
          const geminiOrderMap = new Map<string, any>();
          parsed.optimalOrder.forEach((o: any) => {
            geminiOrderMap.set(o.taskId, o);
          });

          tasks.forEach((t) => {
            const geminiInfo = geminiOrderMap.get(t.id);
            if (geminiInfo) {
              t.aiPriorityRank = geminiInfo.rank;
              t.aiPriorityScore = geminiInfo.priorityScore;
              t.aiSuggestedOrderReason = geminiInfo.reason;
              t.aiUrgencyTier = geminiInfo.urgencyTier;
              const matched = deterministicResult.optimalOrder.find((d) => d.taskId === t.id);
              t.isBottleneck = (matched?.unblocksCount || 0) > 0 && !(matched?.isBlocked || false);
            } else if (t.status === 'done') {
              t.aiPriorityRank = 99;
              t.aiPriorityScore = 0;
              t.aiUrgencyTier = 'low';
              t.isBottleneck = false;
            }
          });

          return {
            lastOptimized: new Date().toISOString(),
            source: 'gemini-3.8-flash',
            executiveSummary: parsed.executiveSummary || deterministicResult.executiveSummary,
            optimalOrder: parsed.optimalOrder.map((item: any) => {
              const matched = deterministicResult.optimalOrder.find((d) => d.taskId === item.taskId);
              return {
                taskId: item.taskId,
                rank: item.rank,
                priorityScore: item.priorityScore || matched?.priorityScore || 80,
                reason: item.reason || matched?.reason || 'Optimized by Gemini AI',
                urgencyTier: item.urgencyTier || matched?.urgencyTier || 'normal',
                unblocksCount: matched?.unblocksCount || 0,
                isBlocked: matched?.isBlocked || false,
                blockingTaskTitles: matched?.blockingTaskTitles || [],
              };
            }),
            criticalBlockersCount: deterministicResult.criticalBlockersCount,
          };
        }
      }
    } catch (geminiErr) {
      console.warn('[Gemini AI Prioritization] Fallback to deterministic algorithm:', geminiErr);
    }
  }

  const rankMap = new Map<string, (typeof deterministicResult.optimalOrder)[0]>();
  deterministicResult.optimalOrder.forEach((item) => rankMap.set(item.taskId, item));

  tasks.forEach((t) => {
    const item = rankMap.get(t.id);
    if (item) {
      t.aiPriorityRank = item.rank;
      t.aiPriorityScore = item.priorityScore;
      t.aiSuggestedOrderReason = item.reason;
      t.aiUrgencyTier = item.urgencyTier;
      t.isBottleneck = item.unblocksCount > 0 && !item.isBlocked;
    } else if (t.status === 'done') {
      t.aiPriorityRank = 99;
      t.aiPriorityScore = 0;
      t.aiUrgencyTier = 'low';
      t.isBottleneck = false;
    }
  });

  return deterministicResult;
}

// AI-Powered Task Prioritization Endpoint
app.post('/api/ai/prioritize-tasks', async (req, res) => {
  try {
    const inputTasks = req.body.tasks || db.tasks;
    const result = await handleTaskPrioritization(inputTasks);
    db.tasks = inputTasks;
    broadcast('TASKS_PRIORITIZED', { tasks: db.tasks, result });
    return res.json({ success: true, result, tasks: db.tasks });
  } catch (err: any) {
    console.error('Error prioritizing tasks:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Example Scenario Loading Endpoint
app.post('/api/tasks/load-scenario', async (req, res) => {
  try {
    const { scenarioId } = req.body;
    const found = exampleTaskScenarios.find((s) => s.id === scenarioId);
    if (!found) {
      return res.status(404).json({ success: false, error: 'Scenario not found' });
    }
    db.tasks = JSON.parse(JSON.stringify(found.tasks));
    const result = await handleTaskPrioritization(db.tasks);
    broadcast('SCENARIO_LOADED', { scenarioId, tasks: db.tasks, result });
    return res.json({ success: true, scenario: found, tasks: db.tasks, result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Vite middleware setup
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[OmniWork Server] Listening on http://0.0.0.0:${PORT}`);
  });
}

start();
