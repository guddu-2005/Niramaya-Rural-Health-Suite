import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { 
  PatientProfile, 
  Appointment, 
  Consultation, 
  LabTestOrder, 
  ReferralItem, 
  MedicineItem, 
  Facility, 
  SystemNotification,
  PrescriptionItem
} from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with User-Agent header for telemetry
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.warn("GEMINI_API_KEY is not defined or is placeholder. Using smart heuristic fallbacks.");
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

// ==========================================
// 🗄️ IN-MEMORY SEED DATA STORE
// ==========================================

let patients: PatientProfile[] = [
  {
    id: 'P-101',
    phone: '9876543210',
    abhaId: '12-3456-7890-1212',
    name: 'Gagan Behera',
    age: 42,
    gender: 'Male',
    address: 'Naugaon Block, Jagatsinghpur, Odisha',
    emergencyContact: 'Satyabhama Behera (Wife) - 9876543211',
    bloodGroup: 'O+',
    allergies: ['Penicillin'],
    existingConditions: ['Type 2 Diabetes', 'Hypertension'],
    currentMedicines: ['Metformin 500mg (twice daily)', 'Amlodipine 5mg (once daily)'],
    createdAt: new Date('2026-01-10').toISOString()
  },
  {
    id: 'P-102',
    phone: '8765432109',
    abhaId: '98-7654-3210-9898',
    name: 'Pramila Das',
    age: 28,
    gender: 'Female',
    address: 'Kalyanpur, Khurda, Odisha',
    emergencyContact: 'Ramesh Das (Husband) - 8765432108',
    bloodGroup: 'B+',
    allergies: ['Dust', 'Sulfa drugs'],
    existingConditions: ['Pregnancy (24 weeks gestation)'],
    currentMedicines: ['Iron-Folic Acid (once daily)', 'Calcium Carbonate 500mg (once daily)'],
    createdAt: new Date('2026-03-15').toISOString()
  },
  {
    id: 'P-103',
    phone: '7654321098',
    abhaId: '45-6789-0123-4545',
    name: 'Suresh Chandra Swain',
    age: 67,
    gender: 'Male',
    address: 'Pipili, Puri, Odisha',
    emergencyContact: 'Alok Swain (Son) - 7654321097',
    bloodGroup: 'A+',
    allergies: [],
    existingConditions: ['Chronic Bronchitis', 'Osteoarthritis'],
    currentMedicines: ['Salbutamol Inhaler (as needed)', 'Paracetamol 650mg (as needed)'],
    createdAt: new Date('2026-05-20').toISOString()
  }
];

let doctors = [
  { id: 'D-201', name: 'Dr. Ramesh Kumar', specialty: 'General Physician', facility: 'Naugaon Primary Health Centre (PHC)', available: true },
  { id: 'D-202', name: 'Dr. Sunita Patra', specialty: 'Pediatrician', facility: 'Jagatsinghpur Community Health Centre (CHC)', available: true },
  { id: 'D-203', name: 'Dr. Anil Mohanty', specialty: 'Gynecologist', facility: 'Jagatsinghpur Community Health Centre (CHC)', available: true },
  { id: 'D-204', name: 'Dr. Priya Sen', specialty: 'Cardiologist', facility: 'Cuttack District Hospital', available: true }
];

let facilities: Facility[] = [
  {
    id: 'F-01',
    name: 'Naugaon Sub-centre',
    type: 'Sub-centre',
    distance: '1.2 km',
    services: ['Primary Care', 'Immunization', 'Pregnancy Registration', 'Basic Diagnostics'],
    openingHours: '9:00 AM - 4:00 PM',
    availableSpecialties: ['Community Health Worker']
  },
  {
    id: 'F-02',
    name: 'Naugaon Primary Health Centre (PHC)',
    type: 'PHC',
    distance: '4.5 km',
    services: ['General Outpatient', 'Maternal and Child Health', 'Lab Diagnostics', 'Pharmacy', 'Teleconsultation'],
    openingHours: '24/7 (Emergency) | Outpatient: 8:00 AM - 2:00 PM',
    availableSpecialties: ['General Physician', 'Dentist']
  },
  {
    id: 'F-03',
    name: 'Jagatsinghpur Community Health Centre (CHC)',
    type: 'CHC',
    distance: '12.8 km',
    services: ['Specialist Outpatient', 'Minor Surgeries', 'Advanced Laboratory', 'Digital X-ray', 'In-patient Care'],
    openingHours: '24/7',
    availableSpecialties: ['General Physician', 'Pediatrician', 'Gynecologist', 'General Surgeon']
  },
  {
    id: 'F-04',
    name: 'Cuttack District Hospital',
    type: 'District Hospital',
    distance: '42.0 km',
    services: ['Tertiary Care', 'Specialist Clinics', 'ICU', 'MRI/CT Scan', 'Blood Bank', 'Emergency Trauma'],
    openingHours: '24/7',
    availableSpecialties: ['Cardiologist', 'Neurologist', 'Orthopedic Surgeon', 'Pediatrician', 'Gynecologist', 'Dermatologist']
  }
];

let appointments: Appointment[] = [
  {
    id: 'A-501',
    patientId: 'P-101',
    patientName: 'Gagan Behera',
    doctorId: 'D-201',
    doctorName: 'Dr. Ramesh Kumar',
    facility: 'Naugaon Primary Health Centre (PHC)',
    specialty: 'General Physician',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '10:15 AM',
    tokenNumber: 27,
    status: 'In-Queue',
    queuePosition: 6,
    estimatedWaitMinutes: 35
  },
  {
    id: 'A-502',
    patientId: 'P-102',
    patientName: 'Pramila Das',
    doctorId: 'D-203',
    doctorName: 'Dr. Anil Mohanty',
    facility: 'Jagatsinghpur Community Health Centre (CHC)',
    specialty: 'Gynecologist',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '11:30 AM',
    tokenNumber: 12,
    status: 'Scheduled',
    queuePosition: 2,
    estimatedWaitMinutes: 15
  }
];

let consultations: Consultation[] = [
  {
    id: 'C-301',
    appointmentId: 'A-501',
    patientId: 'P-101',
    doctorId: 'D-201',
    doctorName: 'Dr. Ramesh Kumar',
    facility: 'Naugaon Primary Health Centre (PHC)',
    date: '2026-08-15',
    chiefComplaint: 'Routine blood sugar check and mild dizziness in the morning.',
    symptoms: ['Mild dizziness', 'Increased morning thirst'],
    vitals: { bp: '135/85', weight: '76 kg', pulse: '78 bpm', temp: '98.4 F' },
    diagnosis: 'Mild hyperglycemia, hypertensive status stable.',
    treatmentPlan: 'Continue regular Metformin. Reduce dietary carbohydrates. Retest Fasting Blood Glucose in 2 weeks.',
    prescription: [
      { id: 'Rx-01', medicineName: 'Metformin Hydrochloride', genericName: 'Metformin', dose: '500mg', route: 'Oral', frequency: 'Twice daily', duration: '30 days', instructions: 'Take with breakfast and dinner', status: 'Dispensed' },
      { id: 'Rx-02', medicineName: 'Amlodipine Besylate', genericName: 'Amlodipine', dose: '5mg', route: 'Oral', frequency: 'Once daily', duration: '30 days', instructions: 'Take in morning', status: 'Dispensed' }
    ],
    labOrders: [
      {
        id: 'L-801',
        testName: 'Fasting Blood Glucose',
        status: 'Completed',
        sampleId: 'SMP-80101',
        collectedAt: '2026-08-15T08:30:00.000Z',
        resultValues: {
          'Fasting Blood Sugar': { value: '148', unit: 'mg/dL', normalRange: '70 - 100', isAbnormal: true }
        },
        interpretation: 'Fasting Blood Sugar is elevated (148 mg/dL vs normal <100 mg/dL). This indicates hyperglycemia, which aligns with patient complaints of morning thirst.',
        technicianNotes: 'Sample collected under fasting state of 10 hours.',
        completedAt: '2026-08-15T12:00:00.000Z'
      }
    ],
    followUpDate: '2026-09-15'
  }
];

let labOrders: { id: string; patientId: string; patientName: string; doctorId: string; doctorName: string; testName: string; status: 'Ordered' | 'Sample-Collected' | 'Processing' | 'Completed' | 'Cancelled'; sampleId?: string; collectedAt?: string; resultValues?: Record<string, { value: string; unit: string; normalRange: string; isAbnormal?: boolean }>; interpretation?: string; completedAt?: string; urgency: 'Routine' | 'Urgent' }[] = [
  {
    id: 'L-802',
    patientId: 'P-101',
    patientName: 'Gagan Behera',
    doctorId: 'D-201',
    doctorName: 'Dr. Ramesh Kumar',
    testName: 'Hemoglobin & HbA1c',
    status: 'Ordered',
    urgency: 'Routine'
  },
  {
    id: 'L-803',
    patientId: 'P-102',
    patientName: 'Pramila Das',
    doctorId: 'D-203',
    doctorName: 'Dr. Anil Mohanty',
    testName: 'Complete Urine Analysis',
    status: 'Sample-Collected',
    sampleId: 'SMP-80302',
    collectedAt: new Date(Date.now() - 3600000).toISOString(),
    urgency: 'Routine'
  }
];

let pharmacyPrescriptions: { id: string; patientId: string; patientName: string; doctorId: string; doctorName: string; date: string; medicines: PrescriptionItem[]; facility: string }[] = [
  {
    id: 'RX-901',
    patientId: 'P-101',
    patientName: 'Gagan Behera',
    doctorId: 'D-201',
    doctorName: 'Dr. Ramesh Kumar',
    date: new Date().toISOString().split('T')[0],
    facility: 'Naugaon Primary Health Centre (PHC)',
    medicines: [
      { id: 'Rx-03', medicineName: 'Metformin Hydrochloride', genericName: 'Metformin', dose: '500mg', route: 'Oral', frequency: 'Twice daily', duration: '30 days', instructions: 'Take with breakfast and dinner', status: 'Pending' },
      { id: 'Rx-04', medicineName: 'Paracetamol', genericName: 'Paracetamol', dose: '650mg', route: 'Oral', frequency: 'Thrice daily', duration: '5 days', instructions: 'Take after meals', status: 'Pending' }
    ]
  }
];

let inventory: MedicineItem[] = [
  { id: 'INV-001', medicineName: 'Paracetamol 650mg', genericName: 'Paracetamol', batchNumber: 'PR2601', expiryDate: '2028-06-30', quantity: 2400, minStockLevel: 500, facility: 'Naugaon Primary Health Centre (PHC)' },
  { id: 'INV-002', medicineName: 'Metformin 500mg', genericName: 'Metformin', batchNumber: 'MT2645', expiryDate: '2027-12-31', quantity: 1800, minStockLevel: 400, facility: 'Naugaon Primary Health Centre (PHC)' },
  { id: 'INV-003', medicineName: 'Amoxicillin 500mg', genericName: 'Amoxicillin', batchNumber: 'AM2602', expiryDate: '2027-05-31', quantity: 300, minStockLevel: 500, facility: 'Naugaon Primary Health Centre (PHC)' }, // Low stock
  { id: 'INV-004', medicineName: 'Amlodipine 5mg', genericName: 'Amlodipine', batchNumber: 'AL2608', expiryDate: '2028-02-28', quantity: 1200, minStockLevel: 300, facility: 'Naugaon Primary Health Centre (PHC)' },
  { id: 'INV-005', medicineName: 'Iron-Folic Acid', genericName: 'Iron-Folic Acid', batchNumber: 'IF2612', expiryDate: '2027-09-30', quantity: 5000, minStockLevel: 1000, facility: 'Naugaon Sub-centre' },
  { id: 'INV-006', medicineName: 'Calcium Carbonate 500mg', genericName: 'Calcium Carbonate', batchNumber: 'CC2619', expiryDate: '2027-08-31', quantity: 3200, minStockLevel: 800, facility: 'Naugaon Sub-centre' },
  
  // CHC Inventory
  { id: 'INV-007', medicineName: 'Paracetamol 650mg', genericName: 'Paracetamol', batchNumber: 'PR2601', expiryDate: '2028-06-30', quantity: 5000, minStockLevel: 1000, facility: 'Jagatsinghpur Community Health Centre (CHC)' },
  { id: 'INV-008', medicineName: 'Metformin 500mg', genericName: 'Metformin', batchNumber: 'MT2645', expiryDate: '2027-12-31', quantity: 3000, minStockLevel: 1000, facility: 'Jagatsinghpur Community Health Centre (CHC)' },
  { id: 'INV-009', medicineName: 'Insulin Glargine 100 IU', genericName: 'Insulin', batchNumber: 'IN2690', expiryDate: '2026-11-30', quantity: 120, minStockLevel: 50, facility: 'Jagatsinghpur Community Health Centre (CHC)' },

  // District Hospital Inventory
  { id: 'INV-010', medicineName: 'Paracetamol 650mg', genericName: 'Paracetamol', batchNumber: 'PR2601', expiryDate: '2028-06-30', quantity: 15000, minStockLevel: 2000, facility: 'Cuttack District Hospital' },
  { id: 'INV-011', medicineName: 'Atorvastatin 10mg', genericName: 'Atorvastatin', batchNumber: 'AT2677', expiryDate: '2028-03-31', quantity: 6000, minStockLevel: 1000, facility: 'Cuttack District Hospital' },
  { id: 'INV-012', medicineName: 'Tenecteplase 40mg', genericName: 'Tenecteplase', batchNumber: 'TE2640', expiryDate: '2027-01-31', quantity: 15, minStockLevel: 5, facility: 'Cuttack District Hospital' }
];

let referrals: ReferralItem[] = [
  {
    id: 'REF-701',
    patientId: 'P-101',
    patientName: 'Gagan Behera',
    sourceFacility: 'Naugaon Primary Health Centre (PHC)',
    destinationFacility: 'Cuttack District Hospital',
    specialtyRequired: 'Cardiologist',
    reason: 'Frequent complaints of chest pressure during physical work, requiring advanced ECG & echo evaluation.',
    clinicalSummary: 'Patient is a known diabetic and hypertensive. Symptoms of exerting chest pain started 2 weeks ago. Vitals stable under current medications but specialist intervention needed.',
    urgency: 'Urgent',
    status: 'Created'
  }
];

let notifications: SystemNotification[] = [
  { id: 'NT-1', userId: 'P-101', role: 'patient', title: 'Appointment Active', message: 'You are currently position #6 in the Naugaon PHC General Outpatient queue.', timestamp: new Date().toISOString(), read: false, type: 'info' },
  { id: 'NT-2', userId: 'all', role: 'lab', title: 'Urgent Test Ordered', message: 'Hemoglobin test requested for Patient Gagan Behera by Dr. Ramesh Kumar.', timestamp: new Date().toISOString(), read: false, type: 'warning' },
  { id: 'NT-3', userId: 'all', role: 'pharmacy', title: 'Low Stock Alert', message: 'Amoxicillin 500mg is below the minimum threshold at Naugaon PHC.', timestamp: new Date().toISOString(), read: false, type: 'error' }
];

// ==========================================
// 🔌 API ROUTE ENDPOINTS
// ==========================================

// --- Unified Fetch: All Data ---
app.get('/api/sync-data', (req, res) => {
  res.json({
    patients,
    doctors,
    facilities,
    appointments,
    consultations,
    labOrders,
    pharmacyPrescriptions,
    inventory,
    referrals,
    notifications
  });
});

// --- Patient API ---
app.post('/api/patients', (req, res) => {
  const newPatient: PatientProfile = {
    id: `P-${Math.floor(100 + Math.random() * 900)}`,
    createdAt: new Date().toISOString(),
    ...req.body
  };
  patients.push(newPatient);
  
  // Add registration notification
  notifications.unshift({
    id: `NT-${Math.random().toString(36).substr(2, 5)}`,
    userId: newPatient.id,
    role: 'patient',
    title: 'Profile Registered Successfully',
    message: `Welcome ${newPatient.name}! Your electronic health record (EHR) profile linked with ABHA ID ${newPatient.abhaId || 'N/A'} is now active.`,
    timestamp: new Date().toISOString(),
    read: false,
    type: 'success'
  });

  res.status(201).json(newPatient);
});

// --- Appointment Booking / Queue Management ---
app.post('/api/appointments', (req, res) => {
  const patient = patients.find(p => p.id === req.body.patientId);
  const doctor = doctors.find(d => d.id === req.body.doctorId);
  const facilityName = req.body.facility || doctor?.facility || 'Naugaon PHC';
  
  // Find largest token for this doctor today
  const doctorApps = appointments.filter(a => a.doctorId === req.body.doctorId && a.status !== 'Completed' && a.status !== 'Cancelled');
  const nextToken = doctorApps.length > 0 ? Math.max(...doctorApps.map(a => a.tokenNumber)) + 1 : Math.floor(1 + Math.random() * 5);
  const queuePos = doctorApps.length + 1;
  const waitMinutes = queuePos * 8; // 8 mins per patient

  const newApp: Appointment = {
    id: `A-${Math.floor(500 + Math.random() * 500)}`,
    patientId: req.body.patientId,
    patientName: patient ? patient.name : 'Unknown Patient',
    doctorId: req.body.doctorId,
    doctorName: doctor ? doctor.name : 'Unknown Doctor',
    facility: facilityName,
    specialty: doctor ? doctor.specialty : 'General Physician',
    date: req.body.date || new Date().toISOString().split('T')[0],
    timeSlot: req.body.timeSlot || '10:00 AM',
    tokenNumber: nextToken,
    status: 'In-Queue',
    queuePosition: queuePos,
    estimatedWaitMinutes: waitMinutes
  };

  appointments.push(newApp);

  // Notify Doctor and Patient
  notifications.unshift({
    id: `NT-${Math.random().toString(36).substr(2, 5)}`,
    userId: newApp.patientId,
    role: 'patient',
    title: 'Appointment Registered',
    message: `Your slot with ${newApp.doctorName} is confirmed. Token #${newApp.tokenNumber}. Est. Wait: ${newApp.estimatedWaitMinutes} minutes.`,
    timestamp: new Date().toISOString(),
    read: false,
    type: 'success'
  });

  notifications.unshift({
    id: `NT-${Math.random().toString(36).substr(2, 5)}`,
    userId: 'all',
    role: 'doctor',
    title: 'New Queue Patient',
    message: `${newApp.patientName} entered queue for ${newApp.doctorName}. Token: ${newApp.tokenNumber}.`,
    timestamp: new Date().toISOString(),
    read: false,
    type: 'info'
  });

  res.status(201).json(newApp);
});

// Update appointment status
app.post('/api/appointments/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const appIndex = appointments.findIndex(a => a.id === id);
  if (appIndex !== -1) {
    appointments[appIndex].status = status;
    
    // Adjust queue positions for others if completed/cancelled
    if (status === 'Completed' || status === 'Cancelled') {
      const docId = appointments[appIndex].doctorId;
      appointments = appointments.map(a => {
        if (a.doctorId === docId && a.status === 'In-Queue' && a.queuePosition > appointments[appIndex].queuePosition) {
          return {
            ...a,
            queuePosition: Math.max(1, a.queuePosition - 1),
            estimatedWaitMinutes: Math.max(0, (a.queuePosition - 1) * 8)
          };
        }
        return a;
      });
    }

    res.json(appointments[appIndex]);
  } else {
    res.status(404).json({ error: 'Appointment not found' });
  }
});

// --- Create Consultation ---
app.post('/api/consultations', (req, res) => {
  const { 
    appointmentId, 
    patientId, 
    doctorId, 
    doctorName, 
    facility, 
    chiefComplaint, 
    symptoms, 
    vitals, 
    diagnosis, 
    treatmentPlan, 
    prescription, 
    labOrders: clientLabOrders, 
    referral, 
    followUpDate 
  } = req.body;

  const patient = patients.find(p => p.id === patientId);

  // Complete any appointment
  if (appointmentId) {
    const appIndex = appointments.findIndex(a => a.id === appointmentId);
    if (appIndex !== -1) {
      appointments[appIndex].status = 'Completed';
    }
  }

  // Create real consultation
  const newConsultation: Consultation = {
    id: `C-${Math.floor(300 + Math.random() * 700)}`,
    appointmentId,
    patientId,
    doctorId,
    doctorName,
    facility,
    date: new Date().toISOString().split('T')[0],
    chiefComplaint,
    symptoms: symptoms || [],
    vitals: vitals || { bp: '120/80', weight: '60 kg', pulse: '72 bpm', temp: '98.6 F' },
    diagnosis,
    treatmentPlan,
    prescription: prescription || [],
    labOrders: clientLabOrders || [],
    referral,
    followUpDate
  };

  consultations.unshift(newConsultation);

  // If doctor ordered labs, push them to the lab orders table
  if (clientLabOrders && clientLabOrders.length > 0) {
    clientLabOrders.forEach((l: LabTestOrder) => {
      labOrders.unshift({
        id: l.id || `L-${Math.floor(800 + Math.random() * 200)}`,
        patientId,
        patientName: patient ? patient.name : 'Unknown Patient',
        doctorId,
        doctorName,
        testName: l.testName,
        status: 'Ordered',
        urgency: 'Routine'
      });

      notifications.unshift({
        id: `NT-${Math.random().toString(36).substr(2, 5)}`,
        userId: 'all',
        role: 'lab',
        title: 'New Diagnostic Request',
        message: `${l.testName} ordered for ${patient ? patient.name : 'Patient'} by ${doctorName}.`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'info'
      });
    });
  }

  // If doctor generated a prescription, send to pharmacy orders
  if (prescription && prescription.length > 0) {
    pharmacyPrescriptions.unshift({
      id: `RX-${Math.floor(900 + Math.random() * 100)}`,
      patientId,
      patientName: patient ? patient.name : 'Unknown Patient',
      doctorId,
      doctorName,
      date: new Date().toISOString().split('T')[0],
      facility,
      medicines: prescription
    });

    notifications.unshift({
      id: `NT-${Math.random().toString(36).substr(2, 5)}`,
      userId: 'all',
      role: 'pharmacy',
      title: 'E-Prescription Received',
      message: `Prescription loaded for ${patient ? patient.name : 'Patient'} from ${facility}.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'info'
    });
  }

  // If doctor created referral
  if (referral) {
    const newRef: ReferralItem = {
      id: referral.id || `REF-${Math.floor(700 + Math.random() * 300)}`,
      patientId,
      patientName: patient ? patient.name : 'Unknown Patient',
      sourceFacility: facility,
      destinationFacility: referral.destinationFacility,
      specialtyRequired: referral.specialtyRequired,
      reason: referral.reason,
      clinicalSummary: referral.clinicalSummary || diagnosis,
      urgency: referral.urgency || 'Routine',
      status: 'Created'
    };
    referrals.unshift(newRef);

    notifications.unshift({
      id: `NT-${Math.random().toString(36).substr(2, 5)}`,
      userId: patientId,
      role: 'patient',
      title: 'Referral Generated',
      message: `Referral to ${newRef.destinationFacility} for ${newRef.specialtyRequired} has been created.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'warning'
    });
  }

  // Add system-reminders for patient taking medicines
  notifications.unshift({
    id: `NT-${Math.random().toString(36).substr(2, 5)}`,
    userId: patientId,
    role: 'patient',
    title: 'Consultation Complete & Reminders Set',
    message: `Prescription and treatment plan successfully added. Daily dose reminders activated.`,
    timestamp: new Date().toISOString(),
    read: false,
    type: 'success'
  });

  res.status(201).json(newConsultation);
});

// --- Lab Technician API ---
app.post('/api/lab-orders/:id/update', (req, res) => {
  const { id } = req.params;
  const { status, sampleId, resultValues, interpretation, technicianNotes } = req.body;
  const orderIndex = labOrders.findIndex(l => l.id === id);

  if (orderIndex !== -1) {
    const order = labOrders[orderIndex];
    order.status = status;
    if (sampleId) order.sampleId = sampleId;
    if (status === 'Sample-Collected' && !order.collectedAt) {
      order.collectedAt = new Date().toISOString();
    }
    if (resultValues) order.resultValues = resultValues;
    if (interpretation) order.interpretation = interpretation;
    if (status === 'Completed') {
      order.completedAt = new Date().toISOString();
      
      // Update the active consultation's lab order record if we find it
      const patientConsults = consultations.filter(c => c.patientId === order.patientId);
      if (patientConsults.length > 0) {
        // Find consultation where this lab test was ordered or add it
        const matchingLab = patientConsults[0].labOrders.find(l => l.testName === order.testName);
        if (matchingLab) {
          matchingLab.status = 'Completed';
          matchingLab.sampleId = sampleId;
          matchingLab.resultValues = resultValues;
          matchingLab.interpretation = interpretation;
          matchingLab.technicianNotes = technicianNotes;
          matchingLab.completedAt = order.completedAt;
        } else {
          patientConsults[0].labOrders.push({
            id: order.id,
            testName: order.testName,
            status: 'Completed',
            sampleId,
            collectedAt: order.collectedAt,
            resultValues,
            interpretation,
            technicianNotes,
            completedAt: order.completedAt
          });
        }
      }

      // Notify patient and doctor
      notifications.unshift({
        id: `NT-${Math.random().toString(36).substr(2, 5)}`,
        userId: order.patientId,
        role: 'patient',
        title: 'Diagnostic Report Published',
        message: `Your laboratory report for ${order.testName} is now available on your health timeline.`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'success'
      });

      notifications.unshift({
        id: `NT-${Math.random().toString(36).substr(2, 5)}`,
        userId: 'all',
        role: 'doctor',
        title: 'Lab Report Ready',
        message: `Diagnostic results published for ${order.patientName} (${order.testName}).`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'success'
      });
    }

    res.json(order);
  } else {
    res.status(404).json({ error: 'Lab order not found' });
  }
});

// --- Pharmacy API ---
app.post('/api/pharmacy-prescriptions/:id/dispense', (req, res) => {
  const { id } = req.params;
  const { medicineId, status } = req.body; // status: 'Dispensed' | 'Unavailable'
  const rxIndex = pharmacyPrescriptions.findIndex(p => p.id === id);

  if (rxIndex !== -1) {
    const rx = pharmacyPrescriptions[rxIndex];
    const med = rx.medicines.find(m => m.id === medicineId);
    if (med) {
      med.status = status;
      
      // If dispensed, subtract stock from inventory of the matching facility
      if (status === 'Dispensed') {
        const invItem = inventory.find(i => 
          i.facility === rx.facility && 
          i.genericName.toLowerCase() === med.genericName.toLowerCase()
        );
        if (invItem) {
          invItem.quantity = Math.max(0, invItem.quantity - 30); // Assume standard monthly pack of 30
          if (invItem.quantity <= invItem.minStockLevel) {
            // Low stock trigger notification
            notifications.unshift({
              id: `NT-${Math.random().toString(36).substr(2, 5)}`,
              userId: 'all',
              role: 'pharmacy',
              title: 'Low Stock Triggered',
              message: `${invItem.medicineName} is critically low at ${invItem.facility}. Current count: ${invItem.quantity}.`,
              timestamp: new Date().toISOString(),
              read: false,
              type: 'warning'
            });
          }
        }
      }

      // If all medicines in this prescription are resolved (either dispensed or unavailable)
      const allResolved = rx.medicines.every(m => m.status !== 'Pending');
      if (allResolved) {
        // Update matching consultation prescription records as well
        const consult = consultations.find(c => c.patientId === rx.patientId && c.date === rx.date);
        if (consult) {
          consult.prescription = rx.medicines;
        }

        notifications.unshift({
          id: `NT-${Math.random().toString(36).substr(2, 5)}`,
          userId: rx.patientId,
          role: 'patient',
          title: 'Prescription Medication Dispensed',
          message: `Your prescribed medication list has been prepared and collected from ${rx.facility}.`,
          timestamp: new Date().toISOString(),
          read: false,
          type: 'success'
        });
      }

      res.json(rx);
    } else {
      res.status(404).json({ error: 'Medicine not found in prescription' });
    }
  } else {
    res.status(404).json({ error: 'Prescription not found' });
  }
});

// Adjust stock levels
app.post('/api/inventory/update', (req, res) => {
  const { id, quantity } = req.body;
  const invIndex = inventory.findIndex(i => i.id === id);
  if (invIndex !== -1) {
    inventory[invIndex].quantity = quantity;
    res.json(inventory[invIndex]);
  } else {
    res.status(404).json({ error: 'Inventory item not found' });
  }
});

// --- Referral API ---
app.post('/api/referrals/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, appointmentDate, specialistName } = req.body;
  const refIndex = referrals.findIndex(r => r.id === id);

  if (refIndex !== -1) {
    const referral = referrals[refIndex];
    referral.status = status;
    if (appointmentDate) referral.appointmentDate = appointmentDate;
    if (specialistName) referral.specialistName = specialistName;

    // Trigger notification to patient and doctor
    notifications.unshift({
      id: `NT-${Math.random().toString(36).substr(2, 5)}`,
      userId: referral.patientId,
      role: 'patient',
      title: `Referral ${status}`,
      message: status === 'Accepted' 
        ? `Your referral to ${referral.destinationFacility} is Accepted. Specialist booking set for ${appointmentDate || 'TBD'} under ${specialistName || 'Specialist'}.`
        : `Your referral status changed to ${status}.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: status === 'Accepted' ? 'success' : 'info'
    });

    res.json(referral);
  } else {
    res.status(404).json({ error: 'Referral record not found' });
  }
});

// --- Notifications Read ---
app.post('/api/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  const index = notifications.findIndex(n => n.id === id);
  if (index !== -1) {
    notifications[index].read = true;
    res.json(notifications[index]);
  } else {
    res.status(404).json({ error: 'Notification not found' });
  }
});

// ==========================================
// 🧠 SERVER-SIDE GEMINI AI LOGIC
// ==========================================

// 1. Digital Triage Endpoint
app.post('/api/ai/triage', async (req, res) => {
  const { symptoms, name, age, gender, allergies, conditions } = req.body;
  
  if (!symptoms) {
    return res.status(400).json({ error: 'Symptoms are required for triage.' });
  }

  const client = getGeminiClient();
  
  if (!client) {
    // --- 🟢 SMART HEURISTIC FALLBACK (if API KEY is missing) ---
    const lower = symptoms.toLowerCase();
    let riskLevel: 'Low' | 'Moderate' | 'High' | 'Emergency' = 'Low';
    let recommendations: string[] = [];
    let nextStep = 'Self-care at home and routine follow-up.';
    let reassurance = 'These symptoms appear mild. Rest, hydration, and observation are advised.';

    if (lower.includes('chest pain') || lower.includes('difficulty breathing') || lower.includes('breathless') || lower.includes('heart attack') || lower.includes('severe bleeding')) {
      riskLevel = 'Emergency';
      recommendations = [
        'Call emergency dispatch or immediately proceed to the nearest District Hospital.',
        'Keep patient calm, sitting upright, and loosen any tight clothing.',
        'Do not ingest heavy solid foods; stay with the patient constantly.'
      ];
      nextStep = 'Immediate evacuation to District Hospital or nearest Tertiary Emergency Care.';
      reassurance = 'ALERT: These are critical life-threatening indicators. Do not delay seeking hands-on emergency care.';
    } else if (lower.includes('high fever') || lower.includes('abdominal pain') || lower.includes('vomiting') || lower.includes('vision') || lower.includes('fracture')) {
      riskLevel = 'High';
      recommendations = [
        'Visit the nearest Community Health Centre (CHC) or Rural Hospital within 1-2 hours.',
        'Sponge with room-temperature water for high fever.',
        'Take Oral Rehydration Salts (ORS) frequently if vomiting or diarrhea is active.'
      ];
      nextStep = 'Same-day clinical evaluation at Jagatsinghpur CHC.';
      reassurance = 'These symptoms require urgent clinical assessment to avoid complications, but can be safely treated at local healthcare hubs.';
    } else if (lower.includes('cough') || lower.includes('headache') || lower.includes('sugar') || lower.includes('mild pain') || lower.includes('rash')) {
      riskLevel = 'Moderate';
      recommendations = [
        'Schedule a routine OPD or teleconsultation with Naugaon PHC general physician.',
        'Avoid strenuous labor. Monitor temperature and blood pressure daily.',
        'Take warm fluids and light meals.'
      ];
      nextStep = 'Schedule an OPD consult or Teleconsultation at Naugaon PHC.';
      reassurance = 'Your symptoms are uncomfortable but do not show severe acute indicators. A doctor consultation will help resolve them.';
    } else {
      riskLevel = 'Low';
      recommendations = [
        'Rest at home, keep hydrated, and monitor temperature.',
        'Use local home remedies (warm saline gargles for sore throat).',
        'Keep a record of any symptoms if they progress.'
      ];
      nextStep = 'Self-care. Seek routine consultation if symptoms persist past 3 days.';
      reassurance = 'Your report points to a mild localized response. Home management is likely sufficient.';
    }

    return res.json({
      riskLevel,
      recommendations,
      nextStep,
      reassurance,
      source: 'Local Heuristic Engine'
    });
  }

  try {
    const prompt = `Perform medical digital triage based on the following patient description. 
Patient Details:
- Name: ${name || 'Anonymous'}
- Age: ${age || 'Unknown'}
- Gender: ${gender || 'Unknown'}
- Allergies: ${allergies ? allergies.join(', ') : 'None'}
- Existing Conditions: ${conditions ? conditions.join(', ') : 'None'}

Symptom complaint: "${symptoms}"

You must return a JSON response adhering strictly to this schema:
{
  "riskLevel": "Low" | "Moderate" | "High" | "Emergency",
  "recommendations": string[], // list of 3 specific clinical first-aid or symptom management steps
  "nextStep": string, // single recommended destination or action (e.g., "Naugaon PHC Outpatient", "Emergency CHC Evacuation", "Home Self-care")
  "reassurance": string // empathetic, clear explanation of what is happening and reassuring advice
}

Guidelines:
- "Emergency": chest pain, severe dyspnea, stroke indicators, massive bleeding, unconsciousness.
- "High": high fever, severe local pain, high sugars, signs of systemic infection.
- "Moderate": mild persistent infections, moderate blood sugars, mild chronic flares.
- "Low": simple cold, mild headache, localized muscle fatigue.
- Always include a prominent warning: "AI-assisted triage - not a diagnosis. Consult a clinician." in your reassurance or recommendations.`;

    const response = await client.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: { type: Type.STRING, description: "Triage tier: Low, Moderate, High, or Emergency" },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Three tailored recommendations for symptom management"
            },
            nextStep: { type: Type.STRING, description: "The precise action for patient to take" },
            reassurance: { type: Type.STRING, description: "Empathetic clinical reassurance containing a disclaimer" }
          },
          required: ["riskLevel", "recommendations", "nextStep", "reassurance"]
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    return res.json({
      ...data,
      source: 'Gemini AI Engine'
    });
  } catch (error: any) {
    console.error("Gemini triage error:", error);
    res.status(500).json({ error: 'AI Triage processing failed.', details: error.message });
  }
});

// 2. Doctor Consultation Summary Generator
app.post('/api/ai/summarize-patient', async (req, res) => {
  const { patientId } = req.body;
  const patient = patients.find(p => p.id === patientId);
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  const patientConsults = consultations.filter(c => c.patientId === patientId);
  const patientReferrals = referrals.filter(r => r.patientId === patientId);

  const client = getGeminiClient();

  if (!client) {
    // Heuristic Summary Fallback
    const lastDiagnosis = patientConsults.length > 0 ? patientConsults[0].diagnosis : 'No recorded previous diagnoses';
    const conditionsStr = patient.existingConditions.join(', ') || 'None';
    const summaryText = `Patient ${patient.name} (${patient.age}yo ${patient.gender}) has a history of ${conditionsStr}. 
Last clinical diagnosis was "${lastDiagnosis}". Active prescriptions: ${patient.currentMedicines.join(', ') || 'None'}.
Please evaluate vitals, check for allergies (${patient.allergies.join(', ') || 'None'}), and assess new symptoms.`;

    return res.json({
      summary: summaryText,
      source: 'Local Summary Heuristics'
    });
  }

  try {
    const recordString = JSON.stringify({
      demographics: { name: patient.name, age: patient.age, gender: patient.gender, allergies: patient.allergies, conditions: patient.existingConditions },
      recentConsultations: patientConsults.map(c => ({ date: c.date, complaint: c.chiefComplaint, diagnosis: c.diagnosis, treatment: c.treatmentPlan })),
      referrals: patientReferrals.map(r => ({ to: r.destinationFacility, specialty: r.specialtyRequired, status: r.status }))
    });

    const prompt = `As a clinical assistant, generate a highly concise (max 3-4 sentences), professional clinical executive brief of this patient's medical records to present to a busy doctor right before they open the consultation room.
    
    Patient Record:
    ${recordString}
    
    Structure the summary to highlight:
    1. Primary demographic & existing high-risk chronic diseases.
    2. Critical drug/food allergies (Highlight in bold if active).
    3. Crucial status checkups or pending diagnostics/referrals the doctor should act on.
    
    Do not suggest a diagnosis, keep it as a pre-consult review.`;

    const response = await client.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt
    });

    return res.json({
      summary: response.text,
      source: 'Gemini AI Assistant'
    });
  } catch (error: any) {
    console.error("Gemini summary error:", error);
    res.status(500).json({ error: 'Failed to generate patient summary', details: error.message });
  }
});

// 3. Lab Report AI Interpretation
app.post('/api/ai/interpret-lab', async (req, res) => {
  const { testName, values } = req.body;
  if (!testName || !values) {
    return res.status(400).json({ error: 'testName and values are required' });
  }

  const client = getGeminiClient();

  if (!client) {
    // Smart Heuristic Lab Interpretations
    let alerts: string[] = [];
    Object.entries(values).forEach(([key, valObj]: [string, any]) => {
      const valNum = parseFloat(valObj.value);
      if (key.toLowerCase().includes('sugar') || key.toLowerCase().includes('glucose')) {
        if (valNum > 125) alerts.push(`${key} (${valObj.value} ${valObj.unit}) is severely elevated (Normal: ${valObj.normalRange}). Points to active hyperglycemia.`);
        else if (valNum > 100) alerts.push(`${key} (${valObj.value} ${valObj.unit}) is slightly elevated, suggesting pre-diabetic monitoring.`);
      }
      if (key.toLowerCase().includes('hemoglobin') || key.toLowerCase().includes('hb')) {
        if (valNum < 12) alerts.push(`${key} (${valObj.value} ${valObj.unit}) is low (Normal: ${valObj.normalRange}). Suggests mild anemia.`);
      }
      if (key.toLowerCase().includes('protein') || key.toLowerCase().includes('albumin')) {
        if (valObj.value === '1+' || valObj.value === '2+' || valObj.value === 'Positive') {
          alerts.push(`${key} shows positive trace proteins (value: ${valObj.value}), suggesting kidney irritation or infection.`);
        }
      }
    });

    let interpretText = `Result explanation for ${testName}:\n\n`;
    if (alerts.length > 0) {
      interpretText += `⚠️ ABNORMAL FINDINGS DETECTED:\n` + alerts.map(a => `• ${a}`).join('\n') + `\n\nRECOMMENDATIONS:\n• Review these values with Dr. Ramesh Kumar promptly.\n• Increase dietary monitoring and repeat test as scheduled.`;
    } else {
      interpretText += `✅ ALL VALUES WITHIN NORMAL RANGE:\nEverything appears stable and within normal baseline standards. Keep up standard maintenance.`;
    }

    interpretText += `\n\n*DISCLAIMER: This is an AI-assisted interpretation, not a clinical diagnosis. The doctor remains fully responsible for diagnostic validation.*`;

    return res.json({
      interpretation: interpretText,
      source: 'Local Lab Rule Engine'
    });
  }

  try {
    const prompt = `You are an AI Laboratory Diagnostics Analyst. Provide a clear, patient-friendly, yet clinically precise interpretation of the following lab test results.
    
    Test: "${testName}"
    Report Values:
    ${JSON.stringify(values)}
    
    Instructions:
    1. Clearly flag which values are elevated, low, or abnormal based on normal ranges provided.
    2. Explain in plain, accessible language what these abnormal findings mean (e.g. "Low hemoglobin suggests anemia", "Protein in urine suggests potential UTI or kidney stress").
    3. Outline practical lifestyle or nutritional notes (e.g. iron-rich foods, sugar regulation).
    4. Provide a strong warning at the bottom stating: "This is an AI-assisted analysis - not an official clinical diagnosis. Your consulting physician remains fully responsible for validation and treatment adjustment."`;

    const response = await client.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt
    });

    return res.json({
      interpretation: response.text,
      source: 'Gemini AI Lab Analyst'
    });
  } catch (error: any) {
    console.error("Gemini lab interpret error:", error);
    res.status(500).json({ error: 'Failed to interpret laboratory report', details: error.message });
  }
});

// ==========================================
// 🚀 VITE / STATIC SERVING MIDDLEWARE
// ==========================================

const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    // In dev mode, mount Vite middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // In production mode, serve built static assets from dist
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Rural Health Ecosystem Server] Running on http://localhost:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("Error starting server:", err);
});
