export interface PatientData {
  id: string;
  ageGroup: 'child' | 'adult';
  vitals: {
    pulse: number | null;
    breathing: 'normal' | 'labored' | 'absent';
    circulation: 'normal' | 'bleeding' | 'shock';
    consciousness: 'alert' | 'verbal' | 'pain' | 'unresponsive';
  };
  injuries: string[];
  timestamp: Date;
  lastUpdated: Date;
  priority?: TriagePriority;
  status: 'active' | 'treated' | 'transferred' | 'discharged';
  notes?: string;
}

export interface TriagePriority {
  level: 'red' | 'yellow' | 'green' | 'black';
  description: string;
  urgency: number;
  color: string;
  icon: string;
}

export interface AppState {
  currentView: 'dashboard' | 'intake' | 'patient-detail';
  selectedPatientId: string | null;
  language: 'en' | 'ar';
  theme: 'light' | 'dark';
  dashboardFilter: {
    priority: TriagePriority['level'] | 'all';
    status: PatientData['status'] | 'all';
    sortBy: 'priority' | 'timestamp';
    sortOrder: 'asc' | 'desc';
  };
  isOnline: boolean;
  lastSync: Date | null;
  version: string;
}
