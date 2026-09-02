import React, { useState } from 'react';
import { 
  User, Calendar, Stethoscope, Beaker, Pill, ArrowRight, Activity, 
  Shield, Volume2, ShieldCheck, MapPin, Search, AlertCircle, 
  CheckCircle2, Clock, Smartphone, SignalZero, Signal, PhoneCall
} from 'lucide-react';
import Markdown from 'react-markdown';
import { PatientProfile, Appointment, Facility, Consultation, RoleType } from '../types';

interface PatientPanelProps {
  patients: PatientProfile[];
  appointments: Appointment[];
  facilities: Facility[];
  consultations: Consultation[];
  activePatientId: string;
  setActivePatientId: (id: string) => void;
  onRegisterPatient: (patient: Omit<PatientProfile, 'id' | 'createdAt'>) => Promise<any>;
  onBookAppointment: (data: { patientId: string; doctorId: string; date: string; timeSlot: string }) => Promise<any>;
  doctors: any[];
  triageSymptoms: string;
  setTriageSymptoms: (symptoms: string) => void;
}

export const PatientPanel: React.FC<PatientPanelProps> = ({
  patients,
  appointments,
  facilities,
  consultations,
  activePatientId,
  setActivePatientId,
  onRegisterPatient,
  onBookAppointment,
  doctors,
  triageSymptoms,
  setTriageSymptoms,
}) => {
  const [activeTab, setActiveTab] = useState<'ehr' | 'triage' | 'booking' | 'telehealth' | 'register'>('ehr');
  const [isLowConnectivity, setIsLowConnectivity] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState<'en' | 'hi' | 'or'>('en');
  const [isRecording, setIsRecording] = useState(false);
  
  // Registration Form
  const [regName, setRegName] = useState('');
  const [regAge, setRegAge] = useState<number>(35);
  const [regGender, setRegGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [regPhone, setRegPhone] = useState('');
  const [regAbha, setRegAbha] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regBlood, setRegBlood] = useState('O+');
  const [regAllergies, setRegAllergies] = useState('');
  const [regConditions, setRegConditions] = useState('');
  const [regEmergency, setRegEmergency] = useState('');

  // Booking Form
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState('10:00 AM');

  // Triage state
  const [triageResult, setTriageResult] = useState<any>(null);
  const [triageLoading, setTriageLoading] = useState(false);

  // Facility and Medicine Search State
  const [facilitySearch, setFacilitySearch] = useState('');
  const [medSearch, setMedSearch] = useState('');
  const [medStockResult, setMedStockResult] = useState<any[]>([]);

  const activePatient = patients.find(p => p.id === activePatientId) || patients[0];

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regPhone) {
      alert('Please fill out Name and Phone number.');
      return;
    }
    const allergiesArr = regAllergies ? regAllergies.split(',').map(s => s.trim()) : [];
    const conditionsArr = regConditions ? regConditions.split(',').map(s => s.trim()) : [];
    
    await onRegisterPatient({
      name: regName,
      age: regAge,
      gender: regGender,
      phone: regPhone,
      abhaId: regAbha || `ABHA-${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      address: regAddress,
      bloodGroup: regBlood,
      allergies: allergiesArr,
      existingConditions: conditionsArr,
      currentMedicines: [],
      emergencyContact: regEmergency || 'Emergency Contact - N/A'
    });

    // Reset fields
    setRegName('');
    setRegPhone('');
    setRegAbha('');
    setRegAddress('');
    setRegEmergency('');
    setRegAllergies('');
    setRegConditions('');
    setActiveTab('ehr');
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId) {
      alert('Please select a doctor.');
      return;
    }
    await onBookAppointment({
      patientId: activePatient.id,
      doctorId: selectedDoctorId,
      date: bookingDate,
      timeSlot: bookingTime
    });
    alert('Appointment booked successfully! Token issued.');
    setActiveTab('ehr');
  };

  const runTriage = async () => {
    if (!triageSymptoms.trim()) {
      alert('Please enter or record some symptoms.');
      return;
    }
    setTriageLoading(true);
    setTriageResult(null);
    try {
      const response = await fetch('/api/ai/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: triageSymptoms,
          name: activePatient.name,
          age: activePatient.age,
          gender: activePatient.gender,
          allergies: activePatient.allergies,
          conditions: activePatient.existingConditions
        })
      });
      const data = await response.json();
      setTriageResult(data);
    } catch (e) {
      console.error(e);
      alert('Triage connection failed.');
    } finally {
      setTriageLoading(false);
    }
  };

  const simulateVoiceInput = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      if (voiceLanguage === 'en') {
        setTriageSymptoms('I have a severe pressing chest pain that radiates to my left arm, especially when climbing steps.');
      } else if (voiceLanguage === 'hi') {
        setTriageSymptoms('मेरे छाती में तेज दर्द हो रहा है और सांस लेने में बहुत तकलीफ है।');
      } else {
        setTriageSymptoms('ମୋର ଛାତିରେ ଭୀଷଣ ଯନ୍ତ୍ରଣା ହେଉଛି ଏବଂ ନିଶ୍ୱାସ ନେବାରେ କଷ୍ଟ ହେଉଛି।');
      }
    }, 1500);
  };

  // Text to Speech
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const cleaned = text.replace(/[*#_`]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.lang = voiceLanguage === 'hi' ? 'hi-IN' : voiceLanguage === 'or' ? 'or-IN' : 'en-IN';
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Text to speech is not supported in this browser.');
    }
  };

  const searchMedicineAvailability = (med: string) => {
    if (!med) {
      setMedStockResult([]);
      return;
    }
    const lowerMed = med.toLowerCase();
    
    // Simulate real stock levels
    const results = [
      { medicine: 'Metformin 500mg', generic: 'Metformin', facility: 'Naugaon PHC', stock: '1800 units (Available)', status: 'Available', color: 'text-emerald-600' },
      { medicine: 'Metformin 500mg', generic: 'Metformin', facility: 'Jagatsinghpur CHC', stock: '3000 units (Available)', status: 'Available', color: 'text-emerald-600' },
      { medicine: 'Amoxicillin 500mg', generic: 'Amoxicillin', facility: 'Naugaon PHC', stock: '300 units (Low Stock)', status: 'Low Stock', color: 'text-amber-600' },
      { medicine: 'Paracetamol 650mg', generic: 'Paracetamol', facility: 'Naugaon Sub-centre', stock: '400 units (Low Stock)', status: 'Low Stock', color: 'text-amber-600' },
      { medicine: 'Paracetamol 650mg', generic: 'Paracetamol', facility: 'Naugaon PHC', stock: '2400 units (Available)', status: 'Available', color: 'text-emerald-600' }
    ].filter(item => 
      item.medicine.toLowerCase().includes(lowerMed) || 
      item.generic.toLowerCase().includes(lowerMed)
    );

    setMedStockResult(results);
  };

  const activePatientAppointments = appointments.filter(a => a.patientId === activePatient.id);
  const activePatientConsultations = consultations.filter(c => c.patientId === activePatient.id);

  // Get risk color for badges
  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'emergency': return 'bg-red-100 text-red-800 border-red-200 animate-pulse';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'moderate': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div id="patient-panel-container" className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar: Patient Profiles & General Search */}
      <div id="patient-sidebar" className="lg:col-span-1 space-y-6">
        {/* Profile Card / ABHA Card */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Demographics</span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ShieldCheck size={12} /> EHR Active
            </div>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold shrink-0">
              {activePatient?.name?.charAt(0) || 'P'}
            </div>
            <div className="overflow-hidden">
              <h3 className="font-bold text-slate-800 truncate leading-snug">{activePatient?.name || 'Loading...'}</h3>
              <p className="text-xs text-slate-500">{activePatient?.age} yrs • {activePatient?.gender}</p>
            </div>
          </div>

          {/* Mini ABHA Digital Card */}
          <div className="bg-linear-to-br from-indigo-700 to-blue-800 text-white p-4 rounded-lg relative overflow-hidden shadow-xs mb-4">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-5 -mt-5" />
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium">ABHA Health Card</span>
              <span className="text-[9px] text-indigo-200 uppercase font-mono">Govt. of India</span>
            </div>
            <p className="text-xs font-semibold tracking-wide font-mono mb-2">
              {activePatient?.abhaId || '12-3456-7890-1212'}
            </p>
            <div className="flex justify-between items-end text-[9px] text-indigo-100 border-t border-white/10 pt-2 mt-2">
              <div>
                <p className="text-[8px] text-indigo-300">BLOOD GROUP</p>
                <p className="font-bold">{activePatient?.bloodGroup || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[8px] text-indigo-300">EMERGENCY CONTACT</p>
                <p className="font-bold truncate max-w-[120px]">{activePatient?.emergencyContact?.split(' - ')[0] || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Quick Details */}
          <div className="space-y-2.5 text-xs border-t border-slate-100 pt-4">
            <div>
              <span className="text-slate-400 font-medium block">Allergies:</span>
              <span className="text-slate-700 font-semibold">{activePatient?.allergies?.join(', ') || 'No known allergies'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Chronic Conditions:</span>
              <span className="text-slate-700 font-semibold">{activePatient?.existingConditions?.join(', ') || 'No reported conditions'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Address:</span>
              <span className="text-slate-600 font-medium flex items-center gap-1 mt-0.5">
                <MapPin size={10} /> {activePatient?.address}
              </span>
            </div>
          </div>
        </div>

        {/* Change / Select Active Patient Profile */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Family Profiles</h4>
          <div className="space-y-2">
            {patients.map((p) => (
              <button
                key={p.id}
                onClick={() => setActivePatientId(p.id)}
                className={`w-full flex items-center justify-between text-left p-2.5 rounded-lg text-xs font-semibold transition-all ${
                  p.id === activePatientId
                    ? 'bg-slate-100 border-l-3 border-slate-800 text-slate-800'
                    : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{p.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">#{p.id}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Medicine Store Availability Search */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Medicine Stock Locator</h4>
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="Search e.g. Metformin, Paracetamol"
              value={medSearch}
              onChange={(e) => {
                setMedSearch(e.target.value);
                searchMedicineAvailability(e.target.value);
              }}
              className="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-2 outline-hidden focus:border-slate-300"
            />
            <Search size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
          </div>

          {medStockResult.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {medStockResult.map((item, idx) => (
                <div key={idx} className="border border-slate-100 p-2 rounded-lg bg-slate-50/50 text-[11px]">
                  <div className="flex justify-between items-start font-bold text-slate-800">
                    <span>{item.medicine}</span>
                    <span className="text-[9px] text-slate-400 font-mono">({item.generic})</span>
                  </div>
                  <div className="flex justify-between items-center mt-1 text-slate-500">
                    <span className="flex items-center gap-0.5"><MapPin size={8} /> {item.facility}</span>
                    <span className={`font-semibold ${item.color}`}>{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : medSearch ? (
            <p className="text-[11px] text-slate-400 text-center py-2">No matching medicine found.</p>
          ) : (
            <p className="text-[11px] text-slate-400 text-center py-2">Find real-time pharmacy stocks near you.</p>
          )}
        </div>
      </div>

      {/* Main Panel Content Area */}
      <div id="patient-main-content" className="lg:col-span-3 flex flex-col">
        {/* Sub-Navigation Tabs */}
        <div className="flex border-b border-slate-100 mb-6 overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('ehr')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'ehr'
                ? 'border-slate-800 text-slate-800'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            📋 Digital Health Record & Timeline
          </button>
          <button
            onClick={() => setActiveTab('triage')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'triage'
                ? 'border-slate-800 text-slate-800'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            🩺 AI Digital Triage
          </button>
          <button
            onClick={() => setActiveTab('booking')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'booking'
                ? 'border-slate-800 text-slate-800'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            📅 Book Appointment
          </button>
          <button
            onClick={() => setActiveTab('telehealth')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'telehealth'
                ? 'border-slate-800 text-slate-800'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            🎥 Teleconsultation
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'register'
                ? 'border-slate-800 text-slate-800'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            👤 New Registration
          </button>
        </div>

        {/* TAB 1: Longitudinal Timeline EHR */}
        {activeTab === 'ehr' && (
          <div className="space-y-6">
            {/* Active Wait Queue Banner */}
            {activePatientAppointments.filter(a => a.status === 'In-Queue').map((app) => (
              <div key={app.id} className="bg-slate-900 text-white rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden shadow-md">
                <div className="absolute right-0 top-0 bottom-0 w-24 bg-linear-to-r from-transparent to-white/5 -skew-x-12" />
                <div className="space-y-1 z-10">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-emerald-400" />
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-400">Live Outpatient Queue Tracker</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Active appointment at <span className="font-semibold text-white">{app.facility}</span> with {app.doctorName}.
                  </p>
                </div>
                <div className="flex gap-4 shrink-0 z-10 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                  <div className="text-center">
                    <p className="text-[9px] text-slate-400">YOUR TOKEN</p>
                    <p className="text-lg font-black text-white">{app.tokenNumber}</p>
                  </div>
                  <div className="border-l border-slate-700" />
                  <div className="text-center">
                    <p className="text-[9px] text-slate-400">QUEUE POSITION</p>
                    <p className="text-lg font-black text-emerald-400">#{app.queuePosition}</p>
                  </div>
                  <div className="border-l border-slate-700" />
                  <div className="text-center">
                    <p className="text-[9px] text-slate-400">EST. WAIT TIME</p>
                    <p className="text-lg font-black text-amber-400">{app.estimatedWaitMinutes}m</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Longitudinal Timeline Tree */}
            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs">
              <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Activity size={18} className="text-emerald-600" /> Longitudinal Patient Health Timeline
              </h3>

              {activePatientConsultations.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-xl">
                  <Stethoscope size={32} className="mx-auto text-slate-300 mb-2" />
                  <h4 className="font-bold text-slate-700 text-sm">No clinical consults recorded yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    Book an appointment or run symptom triage to trigger clinical workspace entries.
                  </p>
                </div>
              ) : (
                <div className="relative border-l-2 border-slate-200 pl-6 ml-3 space-y-8">
                  {activePatientConsultations.map((consult, idx) => (
                    <div key={consult.id} className="relative">
                      {/* Timeline Dot Marker */}
                      <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white bg-slate-800 shadow-xs flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </div>

                      <div className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl p-5 transition-all">
                        {/* Event Date and Doctor Title */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                          <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{consult.date}</span>
                            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                              <Stethoscope size={14} className="text-indigo-600" />
                              Clinical Consultation ({consult.facility})
                            </h4>
                          </div>
                          <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-full">
                            By {consult.doctorName}
                          </span>
                        </div>

                        {/* Symptoms & Vitals & Diagnosis grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="text-xs bg-white p-3 rounded-lg border border-slate-100">
                            <span className="font-semibold text-slate-400 block mb-1">Chief Complaint:</span>
                            <p className="text-slate-700 italic">"{consult.chiefComplaint}"</p>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {consult.symptoms.map((s, i) => (
                                <span key={i} className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded font-medium">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="text-xs bg-white p-3 rounded-lg border border-slate-100">
                            <span className="font-semibold text-slate-400 block mb-1.5">Vitals Captured:</span>
                            <div className="grid grid-cols-2 gap-2 text-slate-600 font-semibold text-[11px]">
                              <div>BP: <span className="text-slate-800">{consult.vitals.bp}</span></div>
                              <div>Pulse: <span className="text-slate-800">{consult.vitals.pulse}</span></div>
                              <div>Temp: <span className="text-slate-800">{consult.vitals.temp}</span></div>
                              <div>Weight: <span className="text-slate-800">{consult.vitals.weight}</span></div>
                            </div>
                          </div>

                          <div className="text-xs bg-white p-3 rounded-lg border border-slate-100">
                            <span className="font-semibold text-slate-400 block mb-1">Diagnosis:</span>
                            <p className="text-slate-800 font-bold">{consult.diagnosis}</p>
                            <p className="text-slate-500 mt-1">{consult.treatmentPlan}</p>
                          </div>
                        </div>

                        {/* Prescribed Medications */}
                        {consult.prescription && consult.prescription.length > 0 && (
                          <div className="border-t border-slate-100 pt-3.5 mb-4">
                            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mb-2">
                              <Pill size={12} className="text-emerald-500" /> Prescribed Medications (E-Prescription)
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {consult.prescription.map((rx) => (
                                <div key={rx.id} className="bg-white border border-slate-100 p-2.5 rounded-lg flex justify-between items-center text-xs">
                                  <div>
                                    <h5 className="font-bold text-slate-800">{rx.medicineName}</h5>
                                    <p className="text-[10px] text-slate-500">{rx.dose} • {rx.frequency} • {rx.duration}</p>
                                    <p className="text-[10px] text-slate-400 italic mt-0.5">"{rx.instructions}"</p>
                                  </div>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    rx.status === 'Dispensed' 
                                      ? 'bg-emerald-50 text-emerald-700' 
                                      : rx.status === 'Unavailable' 
                                      ? 'bg-red-50 text-red-600' 
                                      : 'bg-amber-50 text-amber-700 animate-pulse'
                                  }`}>
                                    {rx.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Lab Orders */}
                        {consult.labOrders && consult.labOrders.length > 0 && (
                          <div className="border-t border-slate-100 pt-3.5 mb-4">
                            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mb-2">
                              <Beaker size={12} className="text-indigo-500" /> Associated Laboratory Diagnostics
                            </span>
                            <div className="space-y-3">
                              {consult.labOrders.map((lab) => (
                                <div key={lab.id} className="bg-white border border-slate-100 p-4 rounded-lg">
                                  <div className="flex justify-between items-center text-xs mb-2">
                                    <div>
                                      <h5 className="font-bold text-slate-800">{lab.testName}</h5>
                                      {lab.sampleId && <p className="text-[10px] font-mono text-slate-400">Sample ID: {lab.sampleId}</p>}
                                    </div>
                                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                      lab.status === 'Completed' 
                                        ? 'bg-emerald-50 text-emerald-700' 
                                        : 'bg-indigo-50 text-indigo-700 animate-pulse'
                                    }`}>
                                      {lab.status}
                                    </span>
                                  </div>

                                  {/* Lab Values */}
                                  {lab.resultValues && (
                                    <div className="bg-slate-50 p-2.5 rounded border border-slate-100 text-[11px] mb-3">
                                      <table className="w-full text-left">
                                        <thead>
                                          <tr className="text-slate-400 text-[10px] font-semibold border-b border-slate-200">
                                            <th className="pb-1">PARAMETER</th>
                                            <th className="pb-1">VALUE</th>
                                            <th className="pb-1">REFERENCE RANGE</th>
                                            <th className="pb-1">STATUS</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {Object.entries(lab.resultValues).map(([key, valObj]: [string, any]) => (
                                            <tr key={key} className="border-b border-slate-100/50 last:border-0">
                                              <td className="py-1.5 font-semibold text-slate-700">{key}</td>
                                              <td className="py-1.5 font-bold text-slate-900">{valObj.value} {valObj.unit}</td>
                                              <td className="py-1.5 text-slate-500">{valObj.normalRange}</td>
                                              <td className="py-1.5">
                                                <span className={`font-bold ${valObj.isAbnormal ? 'text-red-600' : 'text-emerald-600'}`}>
                                                  {valObj.isAbnormal ? 'Abnormal' : 'Normal'}
                                                </span>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}

                                  {/* AI Assisted Lab Interpretations */}
                                  {lab.interpretation && (
                                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-xs text-indigo-950">
                                      <div className="flex items-center gap-1 font-bold text-indigo-900 mb-1">
                                        <Volume2 size={12} /> AI-Assisted Clinical Interpretation
                                      </div>
                                      <div className="markdown-body text-[11px] leading-relaxed">
                                        <Markdown>{lab.interpretation}</Markdown>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Referrals */}
                        {consult.referral && (
                          <div className="border-t border-slate-100 pt-3.5">
                            <span className="text-xs font-semibold text-slate-400 block mb-2">Specialist Out-Referral</span>
                            <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-3 text-xs text-amber-900 flex justify-between items-center">
                              <div>
                                <h5 className="font-bold flex items-center gap-1">
                                  <ArrowRight size={12} className="text-amber-600" />
                                  Referral to {consult.referral.destinationFacility}
                                </h5>
                                <p className="text-[11px] text-amber-700 mt-1">Specialty: <span className="font-bold">{consult.referral.specialtyRequired}</span></p>
                                <p className="text-[11px] text-amber-600 italic">"Reason: {consult.referral.reason}"</p>
                              </div>
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200 uppercase">
                                {consult.referral.status}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: AI Digital Triage */}
        {activeTab === 'triage' && (
          <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
                🩺 AI-Assisted Digital Health Triage
              </h3>
              <p className="text-xs text-slate-500">
                Describe your current physical complaints. The local or cloud Gemini model will evaluate risk tiering to guide your next step.
              </p>
            </div>

            {/* Language & Voice Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-semibold text-slate-600">Language:</span>
                <div className="flex gap-1">
                  <button 
                    onClick={() => setVoiceLanguage('en')}
                    className={`px-3 py-1 text-xs rounded-md font-bold ${voiceLanguage === 'en' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    English
                  </button>
                  <button 
                    onClick={() => setVoiceLanguage('hi')}
                    className={`px-3 py-1 text-xs rounded-md font-bold ${voiceLanguage === 'hi' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    हिन्दी
                  </button>
                  <button 
                    onClick={() => setVoiceLanguage('or')}
                    className={`px-3 py-1 text-xs rounded-md font-bold ${voiceLanguage === 'or' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    ଓଡ଼ିଆ
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={simulateVoiceInput}
                className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-all ${
                  isRecording 
                    ? 'bg-red-600 text-white animate-pulse' 
                    : 'bg-white border border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <Volume2 size={14} className={isRecording ? 'text-white' : 'text-slate-500'} />
                {isRecording ? 'Listening...' : '🎤 Speak Symptoms (Voice Input)'}
              </button>
            </div>

            {/* Textarea Area */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600">Symptom Complaint Intake:</label>
              <textarea
                rows={4}
                value={triageSymptoms}
                onChange={(e) => setTriageSymptoms(e.target.value)}
                placeholder="Describe what you are experiencing... Include when it started and details."
                className="w-full text-xs border border-slate-200 rounded-lg p-3 outline-hidden focus:border-slate-300"
              />
              <div className="flex flex-wrap gap-1.5 mt-1">
                <span className="text-[10px] text-slate-400 font-bold self-center">Try:</span>
                <button 
                  onClick={() => setTriageSymptoms('Constant dry mouth, extreme thirst, and mild dizziness in the morning for the last week.')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-semibold px-2 py-1 rounded"
                >
                  Type 2 Diabetes Flare
                </button>
                <button 
                  onClick={() => setTriageSymptoms('Sudden pressing chest pressure radiating down left arm, cold sweat and dizziness.')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-semibold px-2 py-1 rounded"
                >
                  Cardiac Emergency
                </button>
                <button 
                  onClick={() => setTriageSymptoms('Mild dry cough, runny nose, and light body ache with no breathing issues.')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-semibold px-2 py-1 rounded"
                >
                  Low-Risk Cold
                </button>
              </div>
            </div>

            <button
              onClick={runTriage}
              disabled={triageLoading}
              className="w-full flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-3 rounded-lg disabled:opacity-50"
            >
              {triageLoading ? (
                <>Analyzing via Gemini AI...</>
              ) : (
                <>Analyze Symptoms & Run Triage <ArrowRight size={14} /></>
              )}
            </button>

            {/* Result display */}
            {triageResult && (
              <div className="border border-slate-100 rounded-xl overflow-hidden mt-6 shadow-xs">
                {/* Header Band based on risk */}
                <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">AI Triage Classification</span>
                  </div>
                  <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded text-white bg-slate-700`}>
                    Source: {triageResult.source}
                  </span>
                </div>

                <div className="p-5 space-y-4 bg-slate-50/50">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">DIAGNOSTIC RISK LEVEL</span>
                      <span className={`inline-block text-xs font-black px-3 py-1 rounded-full border mt-1 ${getRiskColor(triageResult.riskLevel)}`}>
                        {triageResult.riskLevel} Risk
                      </span>
                    </div>

                    <div className="flex-1 sm:text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">RECOMMENDED DESTINATION</span>
                      <p className="text-xs font-black text-slate-800 mt-1 flex items-center sm:justify-end gap-1">
                        <MapPin size={12} className="text-rose-500" /> {triageResult.nextStep}
                      </p>
                    </div>
                  </div>

                  {/* Reassurance text */}
                  <div className="bg-white p-3.5 rounded-lg border border-slate-100 text-xs">
                    <span className="font-bold text-slate-400 block mb-1">AI Explanation & Disclaimer:</span>
                    <p className="text-slate-700 leading-relaxed font-semibold">{triageResult.reassurance}</p>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-600 block">Symptom First-Aid & Suggested Steps:</span>
                    <ul className="space-y-1.5">
                      {triageResult.recommendations?.map((rec: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-100 text-xs text-slate-700 font-semibold shadow-xs">
                          <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Speech reader button */}
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => speakText(`${triageResult.reassurance}. Recommended steps include: ${triageResult.recommendations?.join(', ')}`)}
                      className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded-md"
                    >
                      <Volume2 size={12} /> 🔊 Read Instructions Aloud (Text-to-Voice)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Booking Form */}
        {activeTab === 'booking' && (
          <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-800 mb-1">📅 Book OPD Appointment & Entry Queue</h3>
              <p className="text-xs text-slate-500">
                Select your consulting clinic, facility, and physician below to generate your electronic token ID and live queue estimation.
              </p>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Select Doctor & Facility:</label>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-slate-300"
                    required
                  >
                    <option value="">-- Choose Specialization Clinic --</option>
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} ({doc.specialty}) - {doc.facility}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Facility Finder (Location Info):</label>
                  <select
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 outline-hidden"
                    disabled
                  >
                    <option>Automated by Selected Physician</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Preferred Date:</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-slate-300"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Preferred Time Slot:</label>
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-slate-300"
                  >
                    <option value="09:00 AM">09:00 AM - 10:00 AM</option>
                    <option value="10:15 AM">10:15 AM - 11:15 AM</option>
                    <option value="11:30 AM">11:30 AM - 12:30 PM</option>
                    <option value="01:30 PM">01:30 PM - 02:30 PM</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-3 rounded-lg"
              >
                Register Booking & Enter Queue
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: Teleconsultation Screen */}
        {activeTab === 'telehealth' && (
          <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-xs">
            {/* Header with Low-Connectivity Toggle */}
            <div className="bg-slate-900 text-white p-4 flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-2">
                <Smartphone size={16} className="text-emerald-400 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Active Teleconsultation Suite</span>
              </div>

              <button
                onClick={() => setIsLowConnectivity(!isLowConnectivity)}
                className={`flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-md border transition-all ${
                  isLowConnectivity 
                    ? 'bg-amber-600 text-white border-amber-500' 
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                {isLowConnectivity ? <SignalZero size={12} /> : <Signal size={12} />}
                Low-Connectivity Mode: {isLowConnectivity ? 'ON (Store & Forward)' : 'OFF (Video-first)'}
              </button>
            </div>

            <div className="p-5">
              {isLowConnectivity ? (
                /* Low Connectivity Layout */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="border border-amber-200 bg-amber-50/20 p-5 rounded-xl space-y-3.5">
                    <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                      <SignalZero size={14} className="text-amber-600" /> Store-and-Forward Active
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Network bandwidth is highly constrained. Real-time video is suspended. Text messaging, static snapshots, and offline clinical data capture are active. System will queue telemetry files and synchronize immediately upon connection restoration.
                    </p>
                    <div className="bg-white p-3 rounded-lg border border-slate-100 text-xs">
                      <span className="text-slate-400 font-bold block mb-1">Connectivity Status:</span>
                      <span className="text-slate-800 font-semibold block flex items-center gap-1 text-[11px]">
                        <Smartphone size={12} className="text-slate-400" /> Offline Sync Queue (0 files pending)
                      </span>
                    </div>
                  </div>

                  <div className="border border-slate-100 bg-slate-50 p-4 rounded-xl flex flex-col justify-between h-[250px]">
                    <div className="text-center py-6">
                      <PhoneCall size={28} className="mx-auto text-slate-400 mb-2 animate-bounce" />
                      <h4 className="font-bold text-slate-700 text-xs">Establish Text/Voice Link</h4>
                      <p className="text-[10px] text-slate-400 max-w-xs mx-auto mt-1">
                        Use secure SMS callback or compressed low-bitrate audio bridge to communicate.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type compressed message to doctor..."
                        className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 outline-hidden"
                      />
                      <button className="bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-lg">
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Normal Video Call Layout */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Big Video Stream Box */}
                  <div className="md:col-span-2 relative bg-slate-900 rounded-xl overflow-hidden aspect-video flex items-center justify-center border border-slate-800 shadow-inner">
                    {/* Mock Video streams */}
                    <div className="absolute inset-0 bg-linear-to-b from-slate-950/20 to-slate-950/80" />
                    
                    {/* Doctor Static Image or Screen Indicator */}
                    <div className="text-center z-10 space-y-2">
                      <div className="w-20 h-20 rounded-full bg-indigo-600 mx-auto border-3 border-white flex items-center justify-center text-white text-2xl font-black">
                        Dr
                      </div>
                      <h4 className="font-bold text-white text-sm">Dr. Ramesh Kumar (General Physician)</h4>
                      <span className="inline-block text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/20 px-2 py-0.5 rounded-full font-bold">
                        Connected • Live Outpatient Stream
                      </span>
                    </div>

                    {/* Miniature Self View */}
                    <div className="absolute bottom-3 right-3 w-28 h-20 rounded-lg bg-slate-800 border-2 border-slate-700 overflow-hidden flex items-center justify-center">
                      <div className="text-center">
                        <User size={14} className="mx-auto text-slate-400" />
                        <p className="text-[8px] text-slate-300 font-bold truncate max-w-[80px]">{activePatient.name}</p>
                      </div>
                    </div>
                  </div>

                  {/* Consultation Context Info Sidebar */}
                  <div className="border border-slate-100 p-4 rounded-xl flex flex-col justify-between space-y-4">
                    <div className="space-y-3 text-xs">
                      <h4 className="font-bold text-slate-800 pb-1.5 border-b border-slate-100 uppercase tracking-wider text-[10px]">Active Session</h4>
                      <div>
                        <span className="text-slate-400 font-medium block">Patient:</span>
                        <span className="text-slate-800 font-semibold text-[13px]">{activePatient.name}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block">Allergies:</span>
                        <span className="text-red-600 font-bold">{activePatient.allergies.join(', ') || 'None'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block">Vitals Reported (Self):</span>
                        <p className="text-slate-700 font-semibold">BP 125/80 • Pulse 74</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button className="bg-red-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-red-700 shadow-xs">
                        Disconnect Session
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: Registration Form */}
        {activeTab === 'register' && (
          <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs">
            <div className="mb-5">
              <h3 className="text-base font-bold text-slate-800 mb-1">👤 Rural Electronic Health Record (EHR) Registration</h3>
              <p className="text-xs text-slate-500">
                Register a new family member or neighbor to establish their longitudinal electronic medical record linked with ABHA.
              </p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600">Full Name *</label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-slate-300"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600">Age *</label>
                  <input
                    type="number"
                    value={regAge}
                    onChange={(e) => setRegAge(parseInt(e.target.value) || 0)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-slate-300"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600">Gender *</label>
                  <select
                    value={regGender}
                    onChange={(e) => setRegGender(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-slate-300"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600">Phone Number *</label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="Enter mobile number"
                    className="w-full border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-slate-300"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600">Aadhaar / ABHA ID (Optional)</label>
                  <input
                    type="text"
                    value={regAbha}
                    onChange={(e) => setRegAbha(e.target.value)}
                    placeholder="e.g. 12-3456-7890-1212"
                    className="w-full border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-slate-300"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600">Blood Group</label>
                  <select
                    value={regBlood}
                    onChange={(e) => setRegBlood(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-slate-300"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-600">Address (Village, Panchayat, Block) *</label>
                <input
                  type="text"
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  placeholder="Village name, Block name, District"
                  className="w-full border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-slate-300"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600">Allergies (comma separated)</label>
                  <input
                    type="text"
                    value={regAllergies}
                    onChange={(e) => setRegAllergies(e.target.value)}
                    placeholder="e.g. Penicillin, Dust, Sulfa"
                    className="w-full border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-slate-300"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600">Existing Conditions (comma separated)</label>
                  <input
                    type="text"
                    value={regConditions}
                    onChange={(e) => setRegConditions(e.target.value)}
                    placeholder="e.g. Hypertension, Asthma"
                    className="w-full border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-slate-300"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-600">Emergency Contact Details</label>
                <input
                  type="text"
                  value={regEmergency}
                  onChange={(e) => setRegEmergency(e.target.value)}
                  placeholder="Name (Relation) - Phone number"
                  className="w-full border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-slate-300"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-3 rounded-lg mt-4"
              >
                Create Digital Health Record
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
