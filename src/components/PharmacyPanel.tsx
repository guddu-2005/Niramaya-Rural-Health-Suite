import React, { useState } from 'react';
import { 
  Pill, ClipboardList, CheckCircle2, AlertTriangle, 
  Search, ShieldAlert, Plus, Minus, Check, MapPin, Truck
} from 'lucide-react';
import { PrescriptionItem, MedicineInventory, PatientProfile } from '../types';

interface PharmacyPanelProps {
  prescriptions: {
    consultationId: string;
    patientId: string;
    patientName: string;
    doctorName: string;
    facility: string;
    date: string;
    items: PrescriptionItem[];
  }[];
  inventory: MedicineInventory[];
  onUpdatePrescriptionStatus: (consultationId: string, prescriptionId: string, status: 'Dispensed' | 'Unavailable' | 'Pending') => Promise<void>;
  onAdjustInventory: (id: string, adjustment: number) => Promise<void>;
}

export const PharmacyPanel: React.FC<PharmacyPanelProps> = ({
  prescriptions,
  inventory,
  onUpdatePrescriptionStatus,
  onAdjustInventory
}) => {
  const [activePrescriptionId, setActivePrescriptionId] = useState<string>('');
  const [inventoryCategory, setInventoryCategory] = useState<string>('All');
  const [inventorySearch, setInventorySearch] = useState('');

  const activeRxGroup = prescriptions.find(p => p.consultationId === activePrescriptionId);

  // Filter Inventory
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(inventorySearch.toLowerCase()) || 
                          item.genericName.toLowerCase().includes(inventorySearch.toLowerCase());
    const matchesCategory = inventoryCategory === 'All' || item.category === inventoryCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate approximate quantity needed for a prescription duration
  const calculateQuantityNeeded = (frequency: string, duration: string) => {
    const freqMultiplier = frequency.toLowerCase().includes('thrice') 
      ? 3 
      : frequency.toLowerCase().includes('twice') 
      ? 2 
      : 1;
    const daysMatch = duration.match(/\d+/);
    const days = daysMatch ? parseInt(daysMatch[0]) : 5;
    return freqMultiplier * days;
  };

  const handleDispenseRxItem = async (rxGroup: any, item: PrescriptionItem) => {
    // Find matching inventory
    const matchingInv = inventory.find(inv => 
      inv.name.toLowerCase().includes(item.medicineName.toLowerCase()) ||
      inv.genericName.toLowerCase().includes(item.genericName.toLowerCase())
    );

    const quantityNeeded = calculateQuantityNeeded(item.frequency, item.duration);

    if (matchingInv) {
      if (matchingInv.stock < quantityNeeded) {
        alert(`Insufficient Stock! ${matchingInv.name} stock level is ${matchingInv.stock} units, but prescription requires ${quantityNeeded} units.`);
        await onUpdatePrescriptionStatus(rxGroup.consultationId, item.id, 'Unavailable');
        return;
      }
      // Deduct from inventory
      await onAdjustInventory(matchingInv.id, -quantityNeeded);
    }

    // Update status
    await onUpdatePrescriptionStatus(rxGroup.consultationId, item.id, 'Dispensed');
    alert(`Dispensed ${quantityNeeded} units of ${item.medicineName}. Inventory decremented successfully.`);
  };

  const handleRestock = async (id: string) => {
    await onAdjustInventory(id, 500);
    alert('Restocked 500 units successfully.');
  };

  const getStockStatusColor = (stock: number, threshold: number) => {
    if (stock === 0) return 'bg-red-100 text-red-800 border-red-200';
    if (stock < threshold / 2) return 'bg-orange-100 text-orange-800 border-orange-200 animate-pulse';
    if (stock < threshold) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  };

  const getStockStatusLabel = (stock: number, threshold: number) => {
    if (stock === 0) return 'Out of Stock';
    if (stock < threshold / 2) return 'Critical Stock';
    if (stock < threshold) return 'Low Stock';
    return 'Available';
  };

  return (
    <div id="pharmacy-panel-container" className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar Pending Prescription Queue */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ClipboardList size={14} className="text-slate-500" /> Dispatch Queue
            </h3>
            <span className="text-[10px] bg-emerald-950 text-white font-black px-2 py-0.5 rounded-full">
              {prescriptions.filter(p => p.items.some(i => i.status === 'Pending')).length} Pending
            </span>
          </div>

          <div className="space-y-2.5">
            {prescriptions.map((rxGroup) => {
              const pendingCount = rxGroup.items.filter(i => i.status === 'Pending').length;
              return (
                <div
                  key={rxGroup.consultationId}
                  onClick={() => setActivePrescriptionId(rxGroup.consultationId)}
                  className={`border p-3 rounded-lg text-left text-xs transition-all cursor-pointer ${
                    rxGroup.consultationId === activePrescriptionId
                      ? 'border-emerald-600 bg-emerald-50/20 ring-1 ring-emerald-600'
                      : 'border-slate-100 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-start font-bold text-slate-800 mb-1.5">
                    <span>{rxGroup.patientName}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.25 rounded ${
                      pendingCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {pendingCount > 0 ? `${pendingCount} Pending` : 'Fulfilled'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold">
                    <span>Date: {rxGroup.date}</span>
                    <span className="text-[9px] font-mono">#{rxGroup.consultationId.substring(0, 5)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Pharmacy Workspace split in two: Left is Active Order, Right is Stock Master */}
      <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Order Details Panel */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex flex-col h-[550px] justify-between">
          {!activeRxGroup ? (
            <div className="text-center py-20 my-auto flex flex-col items-center">
              <Pill size={38} className="text-slate-300 mb-2" />
              <h4 className="font-bold text-slate-700 text-xs">No Active Prescription</h4>
              <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] mx-auto leading-normal">
                Select a patient from the dispatch worklist queue on the left to verify, stock check, and dispense drugs.
              </p>
            </div>
          ) : (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="border-b border-slate-100 pb-3.5 mb-3.5">
                  <span className="text-[9px] uppercase tracking-wider text-emerald-600 font-bold block">PRESCRIPTION DISPENSARY CONTEXT</span>
                  <h3 className="font-black text-slate-800 text-sm mt-0.5">{activeRxGroup.patientName}</h3>
                  <p className="text-[10px] text-slate-500">Facility: {activeRxGroup.facility} • Prescribed by: {activeRxGroup.doctorName}</p>
                </div>

                <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1">
                  {activeRxGroup.items.map((item) => {
                    const quantityNeeded = calculateQuantityNeeded(item.frequency, item.duration);
                    
                    // Match inventory
                    const matchingInv = inventory.find(inv => 
                      inv.name.toLowerCase().includes(item.medicineName.toLowerCase()) ||
                      inv.genericName.toLowerCase().includes(item.genericName.toLowerCase())
                    );
                    
                    const isOutOfStock = matchingInv ? matchingInv.stock < quantityNeeded : true;

                    return (
                      <div key={item.id} className="border border-slate-100 bg-slate-50/50 hover:bg-slate-50 p-3.5 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-semibold">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-slate-800">{item.medicineName}</h4>
                            <span className="text-[9px] text-slate-400">({item.genericName})</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">{item.dose} • {item.frequency} • {item.duration}</p>
                          <p className="text-[10px] text-slate-400 italic mt-0.5">"{item.instructions}"</p>
                          
                          <div className="flex gap-4 mt-2 text-[10px] font-bold text-slate-600 bg-white border border-slate-100/60 p-1.5 rounded">
                            <span>Req Qty: <span className="text-slate-800 font-black">{quantityNeeded}</span></span>
                            {matchingInv ? (
                              <span>Available: <span className={isOutOfStock ? 'text-red-600 font-black' : 'text-emerald-600 font-black'}>{matchingInv.stock} units</span></span>
                            ) : (
                              <span className="text-red-500 font-black">Not Carried In Stock</span>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 w-full sm:w-auto">
                          {item.status === 'Dispensed' ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg">
                              <CheckCircle2 size={12} /> Dispensed
                            </span>
                          ) : item.status === 'Unavailable' ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg">
                              <ShieldAlert size={12} /> Out of Stock
                            </span>
                          ) : (
                            <button
                              onClick={() => handleDispenseRxItem(activeRxGroup, item)}
                              className="w-full bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-1.5 px-3.5 rounded-lg shadow-xs"
                            >
                              Fulfill & Deduct
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Verified Dispensary Footing */}
              <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-[10px] text-slate-400">
                <span className="flex items-center gap-0.5"><MapPin size={10} /> Naugaon Dispensary Unit</span>
                <span className="font-mono">ABHA Connected Fulfillments</span>
              </div>
            </div>
          )}
        </div>

        {/* Inventory Management Master Panel */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex flex-col h-[550px]">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Dispensary Stock Master</h3>

          {/* Filters & Search */}
          <div className="space-y-2 mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search stock drug or generic..."
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-2 outline-hidden focus:border-slate-300"
              />
              <Search size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
            </div>

            <div className="flex gap-1 overflow-x-auto pb-1">
              {['All', 'Diabetes', 'Antibiotics', 'Pain Relief', 'Cardiac', 'Maternal'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setInventoryCategory(cat)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all shrink-0 ${
                    inventoryCategory === cat
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Stock items list */}
          <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
            {filteredInventory.map((item) => (
              <div key={item.id} className="border border-slate-100/80 hover:border-slate-200 p-3 rounded-lg bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs font-semibold">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-slate-800">{item.name}</h4>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.25 rounded font-mono">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Generic: {item.genericName}</p>
                  
                  <div className="flex gap-2.5 items-center mt-2">
                    <span className={`text-[10px] font-black border px-2 py-0.5 rounded-full ${getStockStatusColor(item.stock, item.reorderLevel)}`}>
                      {getStockStatusLabel(item.stock, item.reorderLevel)} ({item.stock} Units)
                    </span>
                  </div>
                </div>

                <div className="flex sm:flex-col gap-1 sm:items-end justify-between items-center shrink-0">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Bulk Supply Restock</span>
                  <button
                    onClick={() => handleRestock(item.id)}
                    className="bg-white border border-slate-200 hover:border-slate-300 text-[10px] text-slate-700 font-black px-2 py-1 rounded flex items-center gap-0.5 shadow-xs"
                  >
                    <Truck size={10} /> Restock (+500)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
