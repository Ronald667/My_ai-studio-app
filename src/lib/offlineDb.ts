// OmniWork Enterprise IndexedDB Persistence & Offline Synchronization Layer
import { Task, InventoryItem, InventoryMovement } from '../types';

const DB_NAME = 'omniwork_enterprise_db';
const DB_VERSION = 1;

export interface OfflineMutation {
  id: string;
  type:
    | 'TASK_CREATE'
    | 'TASK_UPDATE'
    | 'TASK_DELETE'
    | 'INVENTORY_ADJUST'
    | 'INVENTORY_ITEM_CREATE';
  payload: any;
  createdAt: string;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed';
  error?: string;
}

export interface OfflineStorageStats {
  tasksCount: number;
  inventoryCount: number;
  movementsCount: number;
  pendingMutationsCount: number;
  lastSync: string | null;
}

let dbInstance: IDBDatabase | null = null;
let dbOpenPromise: Promise<IDBDatabase> | null = null;

/**
 * Open or retrieve the existing IndexedDB connection.
 */
export function openOfflineDb(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  if (dbOpenPromise) {
    return dbOpenPromise;
  }

  dbOpenPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;

      // 1. Tasks Object Store
      if (!db.objectStoreNames.contains('tasks')) {
        const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
        taskStore.createIndex('status', 'status', { unique: false });
        taskStore.createIndex('priority', 'priority', { unique: false });
        taskStore.createIndex('projectId', 'projectId', { unique: false });
        taskStore.createIndex('assigneeId', 'assigneeId', { unique: false });
        taskStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      // 2. Inventory Object Store
      if (!db.objectStoreNames.contains('inventory')) {
        const invStore = db.createObjectStore('inventory', { keyPath: 'id' });
        invStore.createIndex('sku', 'sku', { unique: false });
        invStore.createIndex('category', 'category', { unique: false });
        invStore.createIndex('status', 'status', { unique: false });
      }

      // 3. Inventory Movements Object Store
      if (!db.objectStoreNames.contains('inventoryMovements')) {
        const movStore = db.createObjectStore('inventoryMovements', { keyPath: 'id' });
        movStore.createIndex('itemId', 'itemId', { unique: false });
        movStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // 4. Offline Mutation Queue Object Store
      if (!db.objectStoreNames.contains('offlineMutationQueue')) {
        const queueStore = db.createObjectStore('offlineMutationQueue', { keyPath: 'id' });
        queueStore.createIndex('status', 'status', { unique: false });
        queueStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // 5. Metadata Object Store (key-value)
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
        dbOpenPromise = null;
      };
      resolve(dbInstance);
    };

    request.onerror = () => {
      console.error('[IndexedDB] Failed to open database:', request.error);
      dbOpenPromise = null;
      reject(request.error || new Error('Unknown IndexedDB open error'));
    };
  });

  return dbOpenPromise;
}

// ---------------------------------------------------------------------------
// TASK OPERATIONS
// ---------------------------------------------------------------------------

export async function getAllTasksFromDb(): Promise<Task[]> {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('tasks', 'readonly');
    const store = tx.objectStore('tasks');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function saveTaskToDb(task: Task): Promise<void> {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('tasks', 'readwrite');
    const store = tx.objectStore('tasks');
    const req = store.put(task);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function saveAllTasksToDb(tasks: Task[]): Promise<void> {
  if (!tasks || tasks.length === 0) return;
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('tasks', 'readwrite');
    const store = tx.objectStore('tasks');
    tasks.forEach((task) => store.put(task));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteTaskFromDb(taskId: string): Promise<void> {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('tasks', 'readwrite');
    const store = tx.objectStore('tasks');
    const req = store.delete(taskId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ---------------------------------------------------------------------------
// INVENTORY OPERATIONS
// ---------------------------------------------------------------------------

export async function getAllInventoryFromDb(): Promise<InventoryItem[]> {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('inventory', 'readonly');
    const store = tx.objectStore('inventory');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function saveInventoryItemToDb(item: InventoryItem): Promise<void> {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('inventory', 'readwrite');
    const store = tx.objectStore('inventory');
    const req = store.put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function saveAllInventoryToDb(items: InventoryItem[]): Promise<void> {
  if (!items || items.length === 0) return;
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('inventory', 'readwrite');
    const store = tx.objectStore('inventory');
    items.forEach((item) => store.put(item));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllInventoryMovementsFromDb(): Promise<InventoryMovement[]> {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('inventoryMovements', 'readonly');
    const store = tx.objectStore('inventoryMovements');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function saveInventoryMovementToDb(movement: InventoryMovement): Promise<void> {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('inventoryMovements', 'readwrite');
    const store = tx.objectStore('inventoryMovements');
    const req = store.put(movement);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function saveAllInventoryMovementsToDb(movements: InventoryMovement[]): Promise<void> {
  if (!movements || movements.length === 0) return;
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('inventoryMovements', 'readwrite');
    const store = tx.objectStore('inventoryMovements');
    movements.forEach((m) => store.put(m));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ---------------------------------------------------------------------------
// OFFLINE MUTATION QUEUE OPERATIONS
// ---------------------------------------------------------------------------

export async function queueOfflineMutation(
  mutation: Omit<OfflineMutation, 'id' | 'createdAt' | 'retryCount' | 'status'>
): Promise<OfflineMutation> {
  const db = await openOfflineDb();
  const fullMutation: OfflineMutation = {
    ...mutation,
    id: `mut-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    retryCount: 0,
    status: 'pending',
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction('offlineMutationQueue', 'readwrite');
    const store = tx.objectStore('offlineMutationQueue');
    const req = store.put(fullMutation);
    req.onsuccess = () => resolve(fullMutation);
    req.onerror = () => reject(req.error);
  });
}

export async function getPendingMutationsFromDb(): Promise<OfflineMutation[]> {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offlineMutationQueue', 'readonly');
    const store = tx.objectStore('offlineMutationQueue');
    const req = store.getAll();
    req.onsuccess = () => {
      const list = (req.result || []) as OfflineMutation[];
      // Sort chronologically
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      resolve(list);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function removeMutationFromDb(mutationId: string): Promise<void> {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offlineMutationQueue', 'readwrite');
    const store = tx.objectStore('offlineMutationQueue');
    const req = store.delete(mutationId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearAllMutationsFromDb(): Promise<void> {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offlineMutationQueue', 'readwrite');
    const store = tx.objectStore('offlineMutationQueue');
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ---------------------------------------------------------------------------
// METADATA & DIAGNOSTICS
// ---------------------------------------------------------------------------

export async function setDbMetadata(key: string, value: any): Promise<void> {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('metadata', 'readwrite');
    const store = tx.objectStore('metadata');
    const req = store.put({ key, value, updatedAt: new Date().toISOString() });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getDbMetadata(key: string): Promise<any> {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('metadata', 'readonly');
    const store = tx.objectStore('metadata');
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result ? req.result.value : null);
    req.onerror = () => reject(req.error);
  });
}

export async function getOfflineStorageStats(): Promise<OfflineStorageStats> {
  try {
    const [tasks, inventory, movements, mutations, lastSync] = await Promise.all([
      getAllTasksFromDb(),
      getAllInventoryFromDb(),
      getAllInventoryMovementsFromDb(),
      getPendingMutationsFromDb(),
      getDbMetadata('lastOnlineSync'),
    ]);

    return {
      tasksCount: tasks.length,
      inventoryCount: inventory.length,
      movementsCount: movements.length,
      pendingMutationsCount: mutations.length,
      lastSync: lastSync || null,
    };
  } catch (err) {
    console.error('[IndexedDB] Failed to compute storage stats:', err);
    return {
      tasksCount: 0,
      inventoryCount: 0,
      movementsCount: 0,
      pendingMutationsCount: 0,
      lastSync: null,
    };
  }
}
