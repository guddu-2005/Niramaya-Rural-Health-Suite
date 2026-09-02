export type RoleType = 'patient' | 'doctor' | 'lab' | 'pharmacy' | 'admin';

export interface PatientProfile {
  id: string;
  phone: string;
  abhaId: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  address: string;
  emergencyContact: string;
  bloodGroup: string;
  allergies: string[];
  existingConditions: string[];
  currentMedicines: string[];
  createdAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  facility: string;
  specialty: string;
  date: string;
  timeSlot: string;
  tokenNumber: number;
  status: 'Scheduled' | 'In-Queue' | 'In-Consultation' | 'Completed' | 'Cancelled';
  queuePosition: number;
  estimatedWaitMinutes: number;
}

export interface PrescriptionItem {
  id: string;
  medicineName: string;
  genericName: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
  instructions: string;
  status: 'Pending' | 'Dispensed' | 'Unavailable';
}

export interface LabTestOrder {
  id: string;
  testName: string;
  status: 'Ordered' | 'Sample-Collected' | 'Processing' | 'Completed' | 'Cancelled';
  sampleId?: string;
  collectedAt?: string;
  resultValues?: Record<string, { value: string; unit: string; normalRange: string; isAbnormal?: boolean }>;
  interpretation?: string; // AI assisted interpretation
  technicianNotes?: string;
  completedAt?: string;
}

export interface ReferralItem {
  id: string;
  patientId: string;
  patientName: string;
  sourceFacility: string;
  destinationFacility: string;
  specialtyRequired: string;
  reason: string;
  clinicalSummary: string;
  urgency: 'Routine' | 'Urgent' | 'Emergency';
  status: 'Created' | 'Accepted' | 'In-Progress' | 'Completed';
  appointmentDate?: string;
  specialistName?: string;
}

export interface Consultation {
  id: string;
  appointmentId?: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  facility: string;
  date: string;
  chiefComplaint: string;
  symptoms: string[];
  vitals: {
    bp: string;
    weight: string;
    pulse: string;
    temp: string;
  };
  diagnosis: string;
  treatmentPlan: string;
  prescription: PrescriptionItem[];
  labOrders: LabTestOrder[];
  referral?: ReferralItem;
  followUpDate?: string;
}

export interface MedicineItem {
  id: string;
  medicineName: string;
  genericName: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  minStockLevel: number;
  facility: string;
  storageLocation?: string;
}

export interface MedicineInventory {
  id: string;
  name: string;
  genericName: string;
  category: string;
  stock: number;
  reorderLevel: number;
  facility: string;
}

export interface Facility {
  id: string;
  name: string;
  type: 'Sub-centre' | 'PHC' | 'CHC' | 'District Hospital' | 'Private Pharmacy';
  distance: string;
  services: string[];
  openingHours: string;
  availableSpecialties: string[];
}

export interface SystemNotification {
  id: string;
  userId: string; // can be specific role or general
  role: RoleType | 'all';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error' | 'emergency';
}
