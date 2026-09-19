import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { InventoryMovement } from '../../types';
import { X, Boxes, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StockMovementModal: React.FC<StockMovementModalProps> = ({ isOpen, onClose }) => {
  const { t, state, adjustInventory, currentUser } = useApp();

  const [itemId, setItemId] = useState(state.inventory[0]?.id || 'inv-1');
  const [movementType, setMovementType] = useState<InventoryMovement['type']>('stock_in');
  const [quantity, setQuantity] = useState(50);
  const [referenceOrder, setReferenceOrder] = useState(`PO-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [notes, setNotes] = useState('Standard production line replenishment');

  if (!isOpen) return null;

  const selectedItem = state.inventory.find((i) => i.id === itemId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId || quantity <= 0) return;

    adjustInventory({
      itemId,
      type: movementType,
      quantity: Number(quantity),
      referenceOrder,
      performedBy: currentUser.name,
      notes,
    });

    onClose();
  };

  return (
    <div
      id="stock-movement-modal-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        id="stock-movement-modal-card"
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Boxes className="h-4 w-4 text-amber-500" />
            <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Record Inventory Stock Movement
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Item Selector */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Component / SKU *
            </label>
            <select
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none"
            >
              {state.inventory.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.name} ({inv.sku}) — Current: {inv.quantity} {inv.unit}
                </option>
              ))}
            </select>
          </div>

          {/* Current Stock Snapshot */}
          {selectedItem && (
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 text-[11px] flex justify-between">
              <span className="text-slate-500">Warehouse Location: {selectedItem.warehouseLocation}</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                Min Safety Buffer: {selectedItem.minThreshold} {selectedItem.unit}
              </span>
            </div>
          )}

          {/* Movement Type */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Movement Action Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'stock_in', label: 'Stock In (Receive)', color: 'text-emerald-500' },
                { id: 'stock_out', label: 'Stock Out (Assembly)', color: 'text-cyan-500' },
                { id: 'waste', label: 'Scrap / Waste', color: 'text-rose-500' },
                { id: 'audit_adjustment', label: 'Audit Adjustment', color: 'text-amber-500' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMovementType(m.id as any)}
                  className={`p-2 rounded-xl border text-left font-medium transition-all ${
                    movementType === m.id
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-bold'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className={m.color}>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity & Reference */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Quantity ({selectedItem?.unit || 'units'}) *
              </label>
              <input
                required
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reference Order #
              </label>
              <input
                type="text"
                value={referenceOrder}
                onChange={(e) => setReferenceOrder(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Audit Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for movement or batch inspection ID..."
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md shadow-amber-600/30"
            >
              Commit Movement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
