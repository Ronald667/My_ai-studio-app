import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { InventoryItem, ProductionWorkOrder, WorkOrderStage } from '../../types';
import {
  Boxes,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  FileCheck2,
  Download,
  Filter,
  Search,
  CheckCircle2,
  Printer,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface InventoryViewProps {
  onOpenStockAdjust: () => void;
  onOpenNewWorkOrder: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  onOpenStockAdjust,
  onOpenNewWorkOrder,
}) => {
  const { t, state, updateWorkOrder, currentUser, askAIAssist } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'work_orders' | 'movements' | 'reports'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const filteredInventory = state.inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.warehouseLocation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const totalValuation = state.inventory.reduce(
    (sum, item) => sum + item.quantity * item.unitCost,
    0
  );

  const lowStockItems = state.inventory.filter(
    (i) => i.status === 'low_stock' || i.status === 'out_of_stock'
  );

  const reorderCost = lowStockItems.reduce(
    (sum, item) => sum + item.reorderQuantity * item.unitCost,
    0
  );

  const stages: { id: WorkOrderStage; label: string }[] = [
    { id: 'material_allocation', label: 'Material Prep' },
    { id: 'in_production', label: 'In Production' },
    { id: 'quality_check', label: 'QA / Inspection' },
    { id: 'finished_goods', label: 'Finished Goods' },
    { id: 'released', label: 'Released' },
  ];

  const handleAdvanceStage = (wo: ProductionWorkOrder) => {
    const currentIndex = stages.findIndex((s) => s.id === wo.currentStage);
    if (currentIndex < stages.length - 1) {
      const nextStage = stages[currentIndex + 1].id;
      const completedQty = nextStage === 'released' ? wo.targetQuantity : wo.completedQuantity;
      updateWorkOrder({ id: wo.id, currentStage: nextStage, completedQuantity: completedQty });
    }
  };

  const handleExportCSV = () => {
    const headers = 'SKU,Name,Category,Quantity,Unit,MinThreshold,UnitCost,Valuation,Location,BatchLot,Status\n';
    const rows = state.inventory
      .map(
        (i) =>
          `"${i.sku}","${i.name}","${i.category}",${i.quantity},"${i.unit}",${i.minThreshold},${i.unitCost},${(
            i.quantity * i.unitCost
          ).toFixed(2)},"${i.warehouseLocation}","${i.batchNumber}","${i.status}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory_audit_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleAiOptimization = async () => {
    setLoadingAi(true);
    const res = await askAIAssist('inventory_optimization');
    setAiReport(res.recommendation);
    setLoadingAi(false);
  };

  return (
    <div id="inventory-view" className="space-y-5 animate-in fade-in duration-150">
      {/* Header & Valuation Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-display text-slate-900 dark:text-slate-100">
            {t.inventoryCatalog}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manufacturing workflow stages, automated buffer thresholds & custom reporting
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenStockAdjust}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-xs"
          >
            <Boxes className="h-4 w-4" />
            <span>{t.stockMovement}</span>
          </button>

          <button
            onClick={onOpenNewWorkOrder}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>New Work Order</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-[11px] text-slate-400 font-medium">
            Total Inventory Valuation
          </span>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            ${totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-500">Across {state.inventory.length} tracked SKUs</span>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-[11px] text-slate-400 font-medium">Low Safety Stock Alerts</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-rose-500">{lowStockItems.length}</span>
            <span className="text-[10px] text-slate-500">Below safety buffer</span>
          </div>
          <span className="text-[10px] text-rose-400">Triggers reorder workflow</span>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-[11px] text-slate-400 font-medium">Reorder Capital Needed</span>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            ${reorderCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-500">For {lowStockItems.length} critical batches</span>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-[11px] text-slate-400 font-medium">Active Production Orders</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-cyan-600 dark:text-cyan-400">
              {state.workOrders.filter((w) => w.currentStage !== 'released').length}
            </span>
            <span className="text-[10px] text-slate-500">In assembly pipeline</span>
          </div>
          <span className="text-[10px] text-slate-500">Cells running on schedule</span>
        </div>
      </div>

      {/* Sub-Tabs Navigator */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveSubTab('inventory')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeSubTab === 'inventory'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Inventory Catalog ({state.inventory.length})
          </button>
          <button
            onClick={() => setActiveSubTab('work_orders')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeSubTab === 'work_orders'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Production Work Orders ({state.workOrders.length})
          </button>
          <button
            onClick={() => setActiveSubTab('movements')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeSubTab === 'movements'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Stock Movement Ledger
          </button>
          <button
            onClick={() => setActiveSubTab('reports')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeSubTab === 'reports'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Custom Reporting & AI
          </button>
        </div>

        <div className="flex items-center gap-2 pb-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* TAB 1: INVENTORY CATALOG */}
      {activeSubTab === 'inventory' && (
        <div className="space-y-3">
          {/* Filter and Search Bar */}
          <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by SKU, part name, warehouse bin..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="Microcontrollers">Microcontrollers</option>
                <option value="Sensors">Sensors</option>
                <option value="Power">Power</option>
                <option value="Enclosures">Enclosures</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">SKU / Item Name</th>
                  <th className="py-3 px-3">Stock Level</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3">Batch / Lot</th>
                  <th className="py-3 px-3 text-right">Unit Cost</th>
                  <th className="py-3 px-3 text-right">Valuation</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredInventory.map((item) => {
                  const percentOfSafety = Math.min(
                    100,
                    Math.round((item.quantity / (item.minThreshold * 1.5)) * 100)
                  );
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {item.name}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400">
                            {item.sku} • {item.category}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-3 min-w-[150px]">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {item.quantity} {item.unit}
                            </span>
                            <span className="text-slate-400">
                              Min: {item.minThreshold}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                item.status === 'out_of_stock'
                                  ? 'bg-rose-500'
                                  : item.status === 'low_stock'
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${percentOfSafety}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                        {item.warehouseLocation}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-[10px] text-slate-500">
                          {item.batchNumber}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                        ${item.unitCost.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium text-slate-900 dark:text-slate-100">
                        ${(item.quantity * item.unitCost).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            item.status === 'in_stock'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : item.status === 'low_stock'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {item.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTION WORK ORDERS */}
      {activeSubTab === 'work_orders' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.workOrders.map((wo) => {
              const currentStageIdx = stages.findIndex((s) => s.id === wo.currentStage);
              return (
                <div
                  key={wo.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {wo.orderNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          wo.priority === 'rush'
                            ? 'bg-rose-500/10 text-rose-500'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {wo.priority.toUpperCase()}
                      </span>
                    </div>

                    <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 mb-1">
                      {wo.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                      Cell: {wo.assignedTeam} • Batch: {wo.batchLotNumber}
                    </p>

                    {/* Progress */}
                    <div className="space-y-1 mb-4">
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Completion</span>
                        <span>
                          {wo.completedQuantity} / {wo.targetQuantity} units
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full"
                          style={{
                            width: `${(wo.completedQuantity / wo.targetQuantity) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Stage Pipeline Indicator */}
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 text-[10px] space-y-1">
                      <span className="text-slate-400 font-semibold uppercase">Current Stage</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {stages.find((s) => s.id === wo.currentStage)?.label}
                      </p>
                    </div>
                  </div>

                  {/* Advance Stage Button */}
                  <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-400">Due: {wo.deadline}</span>
                    {wo.currentStage !== 'released' ? (
                      <button
                        onClick={() => handleAdvanceStage(wo)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 font-semibold text-[11px] border border-indigo-200 dark:border-indigo-800"
                      >
                        <span>Advance Stage</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-500 font-bold text-[11px]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Released
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: STOCK MOVEMENTS LEDGER */}
      {activeSubTab === 'movements' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-3">Item / SKU</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Change</th>
                <th className="py-3 px-3">Balance</th>
                <th className="py-3 px-3">Reference Order</th>
                <th className="py-3 px-3">Operator</th>
                <th className="py-3 px-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {state.inventoryMovements.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                    {new Date(m.timestamp).toLocaleDateString()}{' '}
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200">
                    {m.itemName}
                    <span className="block text-[10px] font-mono text-slate-400">{m.sku}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.type === 'stock_in'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : m.type === 'stock_out'
                          ? 'bg-cyan-500/10 text-cyan-500'
                          : 'bg-amber-500/10 text-amber-500'
                      }`}
                    >
                      {m.type.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                    {m.type === 'stock_in' ? `+${m.quantity}` : `-${m.quantity}`}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                    {m.previousQuantity} → {m.newQuantity}
                  </td>
                  <td className="py-3 px-3 font-mono text-indigo-500">{m.referenceOrder}</td>
                  <td className="py-3 px-3 text-slate-700 dark:text-slate-300">{m.performedBy}</td>
                  <td className="py-3 px-3 text-slate-500 text-[11px] max-w-xs truncate">{m.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: CUSTOM REPORTING & AI */}
      {activeSubTab === 'reports' && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Custom Inventory & Workflow Reports
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Generate regulatory manufacturing audit trails and AI supply-chain analysis
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAiOptimization}
                  disabled={loadingAi}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{loadingAi ? 'Analyzing Operations...' : 'AI Supply Optimizer'}</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-xs font-medium"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Audit Sheet</span>
                </button>
              </div>
            </div>

            {aiReport && (
              <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-200">
                  <Sparkles className="h-4 w-4 text-indigo-500" />
                  <span>AI Operations Architecture Recommendation</span>
                </div>
                <div className="text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                  {aiReport}
                </div>
              </div>
            )}

            {/* Regulatory Sign-Off Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-xs space-y-2">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  ISO-13485 Medical Device Traceability
                </span>
                <p className="text-[11px] text-slate-500">
                  Every lot has verified certificate of compliance, inspection logs, and dual-authorization batch tracking.
                </p>
                <div className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-bold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>100% Component Lineage Verified</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-xs space-y-2">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  Automated Purchase Order Proposals
                </span>
                <p className="text-[11px] text-slate-500">
                  Rules actively monitor {state.inventory.length} bin levels; 1 low stock warning dispatched to procurement.
                </p>
                <div className="flex items-center gap-1.5 text-indigo-500 text-[10px] font-bold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>ERP Procurement Sync Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
