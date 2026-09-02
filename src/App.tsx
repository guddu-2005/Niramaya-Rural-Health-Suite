import React, { useState, useEffect, useCallback } from 'react';
import { 
  Heart, Activity, Bell, Settings, ShieldAlert, Smartphone, Check, 
  User, Stethoscope, Beaker, Pill, Building2, MapPin, Menu, HelpCircle, Sparkles
} from 'lucide-react';
import { TourGuide } from './components/TourGuide';
import { PatientPanel } from './components/PatientPanel';
import { DoctorPanel } from './components/DoctorPanel';
import { LabPanel } from './components/LabPanel';
import { PharmacyPanel } from './components/PharmacyPanel';
import { AdminPanel } from './components/AdminPanel';

import { 
  PatientProfile, Appointment, Facility, Consultation, 
  LabTestOrder, ReferralItem, MedicineInventory, SystemNotification, RoleType 
} from './types';

export default function App() {
  const [role, setRole] = useState<'patient' | 'doctor' | 'lab' | 'pharmacy' | 'admin'>('patient');
  const [demoStep, setDemoStep] = useState(1);
  const [activePatientId, setActivePatientId] = useState('P-101');
  const [triageSymptoms, setTriageSymptoms] = useState('');
  
  // Real DB state synchronized from server
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [labOrders, setLabOrders] = useState<any[]>([]);
  const [pharmacyPrescriptions, setPharmacyPrescriptions] = useState<any[]>([]);
  const [inventory, setInventory] = useState<MedicineInventory[]>([]);
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  
  // Bottleneck mitigation state
  const [extraDoctorActive, setExtraDoctorActive] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync state from server API
  const syncDataFromServer = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync-data');
      if (!res.ok) throw new Error('Data sync failed');
      const data = await res.json();
      
      setPatients(data.patients || []);
      setDoctors(data.doctors || []);
      setFacilities(data.facilities || []);
      setAppointments(data.appointments || []);
      setConsultations(data.consultations || []);
      setLabOrders(data.labOrders || []);
      setReferrals(data.referrals || []);
      setNotifications(data.notifications || []);
      
      // Parse inventory with category thresholds for styling
      if (data.inventory) {
        const parsedInv = data.inventory.map((item: any) => ({
          id: item.id,
          name: item.medicineName,
          genericName: item.genericName,
          category: item.facility.includes('Sub-centre') ? 'Maternal' : 'General', // categorized
          stock: item.quantity,
          reorderLevel: item.minStockLevel,
          facility: item.facility
        }));
        setInventory(parsedInv);
      }

      // Group medicines by consultation for pharmacy panel view
      if (data.pharmacyPrescriptions) {
        const parsedRx = data.pharmacyPrescriptions.map((p: any) => ({
          consultationId: p.id,
          patientId: p.patientId,
          patientName: p.patientName,
          doctorName: p.doctorName,
          facility: p.facility,
          date: p.date,
          items: p.medicines
        }));
        setPharmacyPrescriptions(parsedRx);
      }
    } catch (err) {
      console.error('Error syncing EHR database:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    syncDataFromServer();
  }, [syncDataFromServer]);

  // Action: Register new patient
  const handleRegisterPatient = async (patientData: Omit<PatientProfile, 'id' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData)
      });
      if (res.ok) {
        await syncDataFromServer();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Action: Book appointment
  const handleBookAppointment = async (bookingData: { patientId: string; doctorId: string; date: string; timeSlot: string }) => {
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });
      if (res.ok) {
        await syncDataFromServer();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Action: Complete consultation
  const handleCompleteConsultation = async (consultData: any) => {
    try {
      const res = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(consultData)
      });
      if (res.ok) {
        await syncDataFromServer();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Action: Update laboratory order
  const handleUpdateLabOrder = async (orderId: string, payload: any) => {
    try {
      const res = await fetch(`/api/lab-orders/${orderId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await syncDataFromServer();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Action: Update Prescription Medication Status
  const handleUpdatePrescriptionStatus = async (consultationId: string, prescriptionId: string, status: 'Dispensed' | 'Unavailable' | 'Pending') => {
    try {
      const res = await fetch(`/api/pharmacy-prescriptions/${consultationId}/dispense`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medicineId: prescriptionId, status })
      });
      if (res.ok) {
        await syncDataFromServer();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Action: Adjust Medicine Inventory
  const handleAdjustInventory = async (id: string, adjustment: number) => {
    const matchedItem = inventory.find(i => i.id === id);
    if (!matchedItem) return;

    try {
      const res = await fetch('/api/inventory/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, quantity: Math.max(0, matchedItem.stock + adjustment) })
      });
      if (res.ok) {
        await syncDataFromServer();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Action: Read Notification
  const handleReadNotification = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      if (res.ok) {
        // optimistically mark as read locally
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Bottleneck mitigation trigger
  const handleRelieveBottleneck = () => {
    setExtraDoctorActive(true);
    // Push emergency clinician alert
    const newAlert: SystemNotification = {
      id: `NT-EMERG-${Date.now()}`,
      userId: 'all',
      role: 'admin',
      title: 'Contingency Relieved',
      message: 'Reserve Tele-Physician Dr. Sunita Patra assigned to Naugaon PHC queue. Wait times normalized.',
      timestamp: new Date().toISOString(),
      read: false,
      type: 'success'
    };
    setNotifications([newAlert, ...notifications]);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 font-sans">
      {/* 🏥 MAIN EXECUTIVE HEADER */}
      <header className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Brand Logo & Connection State */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-md">
              <Heart size={20} fill="currentColor" className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight text-white leading-none">Niramaya Rural Health Suite</h1>
                <span className="flex items-center gap-1 text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full font-mono border border-emerald-400/20">
                  <Activity size={8} /> LIVE CLOUD EHR
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Unified Rural Healthcare Ecosystem • Odia & English Triage</p>
            </div>
          </div>

          {/* Unified Active Role Selector Pill */}
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 overflow-x-auto max-w-full shrink-0">
            {[
              { id: 'patient', label: '👤 Patient Panel', color: 'hover:text-emerald-300' },
              { id: 'doctor', label: '🩺 Clinical Work', color: 'hover:text-indigo-300' },
              { id: 'lab', label: '🔬 Diagnostics Lab', color: 'hover:text-amber-300' },
              { id: 'pharmacy', label: '💊 Pharmacy Store', color: 'hover:text-teal-300' },
              { id: 'admin', label: '📊 Facility Admin', color: 'hover:text-rose-300' }
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setRole(r.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  role === r.id
                    ? 'bg-slate-900 text-white shadow-sm ring-1 ring-white/10'
                    : `text-slate-400 ${r.color}`
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Direct DB Sync Indicator */}
          <div className="hidden md:flex items-center gap-2">
            <button 
              onClick={syncDataFromServer}
              disabled={isSyncing}
              className={`p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700 flex items-center justify-center ${isSyncing ? 'animate-spin' : ''}`}
              title="Sync Digital Health Records"
            >
              <RefreshCwIcon size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* 🏆 INTERACTIVE HACKATHON TOUR GUIDE */}
      <TourGuide 
        currentStep={demoStep}
        setStep={setDemoStep}
        setRole={setRole}
        setTriageSymptoms={setTriageSymptoms}
        setActivePatientId={setActivePatientId}
      />

      {/* ⚙ MAIN CORE WORKSPACE AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-6 grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Side: Role Workspace Panels */}
        <div className="xl:col-span-3 space-y-6">
          {role === 'patient' && (
            <PatientPanel 
              patients={patients}
              appointments={appointments}
              facilities={facilities}
              consultations={consultations}
              activePatientId={activePatientId}
              setActivePatientId={setActivePatientId}
              onRegisterPatient={handleRegisterPatient}
              onBookAppointment={handleBookAppointment}
              doctors={doctors}
              triageSymptoms={triageSymptoms}
              setTriageSymptoms={setTriageSymptoms}
            />
          )}

          {role === 'doctor' && (
            <DoctorPanel 
              appointments={appointments}
              patients={patients}
              consultations={consultations}
              doctors={doctors}
              onCompleteConsultation={handleCompleteConsultation}
              notifications={notifications}
            />
          )}

          {role === 'lab' && (
            <LabPanel 
              labOrders={labOrders}
              onUpdateLabOrder={handleUpdateLabOrder}
            />
          )}

          {role === 'pharmacy' && (
            <PharmacyPanel 
              prescriptions={pharmacyPrescriptions}
              inventory={inventory}
              onUpdatePrescriptionStatus={handleUpdatePrescriptionStatus}
              onAdjustInventory={handleAdjustInventory}
            />
          )}

          {role === 'admin' && (
            <AdminPanel 
              patients={patients}
              appointments={appointments}
              consultations={consultations}
              referrals={referrals}
              inventory={inventory}
              onRelieveBottleneck={handleRelieveBottleneck}
              extraDoctorActive={extraDoctorActive}
            />
          )}
        </div>

        {/* Right Side: Shared Real-Time Alerts & SMS Notification Simulator */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex flex-col h-[550px] lg:h-[650px]">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Bell size={14} className="text-indigo-600" /> EHR SMS & Alerts Feed
              </h3>
              <span className="text-[9px] bg-slate-100 text-slate-600 font-black px-2 py-0.5 rounded-full">
                {notifications.filter(n => !n.read).length} Unread
              </span>
            </div>

            <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
              {notifications.map((notif) => (
                <div 
                  key={notif.id}
                  onClick={() => handleReadNotification(notif.id)}
                  className={`border p-3.5 rounded-xl transition-all text-xs font-semibold relative overflow-hidden ${
                    notif.read ? 'bg-slate-50/50 border-slate-100 opacity-60' : 'bg-white border-slate-100 hover:bg-slate-50/50 cursor-pointer'
                  }`}
                >
                  {/* Decorative Left Alert Stripe */}
                  <div className={`absolute top-0 bottom-0 left-0 w-1 ${
                    notif.type === 'success' 
                      ? 'bg-emerald-500' 
                      : notif.type === 'warning' 
                      ? 'bg-amber-500' 
                      : notif.type === 'error' 
                      ? 'bg-red-500' 
                      : 'bg-indigo-500'
                  }`} />

                  <div className="pl-2">
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <h4 className="font-bold text-slate-800 leading-tight">{notif.title}</h4>
                      <span className="text-[8px] bg-slate-100 text-slate-400 font-mono uppercase px-1.5 py-0.25 rounded shrink-0">
                        {notif.role}
                      </span>
                    </div>
                    <p className="text-slate-500 leading-relaxed text-[11px]">{notif.message}</p>
                    
                    {/* Timestamp & Sim Banner */}
                    <div className="flex justify-between items-center mt-2 border-t border-slate-100/60 pt-1.5 text-[9px] text-slate-400 font-medium">
                      <span>{new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="flex items-center gap-0.5 text-indigo-600 bg-indigo-50 px-1 py-0.25 rounded font-bold">
                        <Smartphone size={8} /> SMS Alert Dispatched
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Interactive help footer */}
            <div className="border-t border-slate-100 pt-3.5 mt-4 text-[10px] text-slate-400 leading-normal flex items-start gap-1.5">
              <HelpCircle size={14} className="text-slate-300 shrink-0 mt-0.5" />
              <span>
                As events are recorded (consult completed, lab values published, drugs dispensed), SMS proxies register in real-time. Change roles using the selector in the header to view interconnected workflows.
              </span>
            </div>
          </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-100 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-medium">
          <div className="flex items-center gap-2">
            <Building2 size={14} />
            <span>© 2026 Odisha Rural Health Mission. Designed for NHM Hackathon.</span>
          </div>
          <div className="flex gap-4">
            <a href="#privacy" className="hover:text-slate-600">EHR Security (ABHA compliant)</a>
            <span className="text-slate-200">|</span>
            <a href="#terms" className="hover:text-slate-600">Store & Forward Telemetry Logs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Inline helper icon since Lucide RefreshCw acts similarly but sometimes requires special bundle bindings
function RefreshCwIcon({ size = 14 }: { size?: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}
