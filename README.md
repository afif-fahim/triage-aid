# TriageAid

A comprehensive offline-capable Progressive Web App (PWA) designed for medical triage assessment in emergency situations and clinical environments. TriageAid helps medical personnel quickly assess, prioritize, and manage patient flow using the validated START (Simple Triage and Rapid Treatment) algorithm.

## 🚑 Core Functionalities

### Medical Triage Assessment

- **START Algorithm Implementation** - Standardized triage protocol for rapid patient assessment
- **Priority Classification** - Automatic assignment of triage levels:
  - 🔴 **Red (Immediate)** - Life-threatening conditions requiring immediate care
  - 🟡 **Yellow (Urgent/Delayed)** - Serious injuries that can wait briefly
  - 🟢 **Green (Minor)** - Walking wounded who can wait
  - ⚫ **Black (Deceased/Expectant)** - No treatment required or futile care

### Patient Data Management

- **Secure Patient Records** - Encrypted local storage using Web Crypto API
- **Anonymous Patient IDs** - UUID-based identification without PII exposure
- **Real-time Updates** - Dynamic priority recalculation based on changing conditions
- **Comprehensive Assessment** - Vital signs, consciousness level, mobility, and injury details

### Offline-First Design

- **Complete Offline Functionality** - Works without internet connectivity after initial load
- **Local Data Persistence** - All patient data stored locally with IndexedDB
- **Service Worker Caching** - App shell and resources cached for instant loading
- **Data Synchronization Ready** - Architecture supports future sync capabilities

### Multi-Language Support

- **English and Arabic** - Full internationalization with professional medical terminology
- **RTL Layout Support** - Right-to-left interface for Arabic language users
- **Cultural Adaptation** - Medical terminology appropriate for different regions

## 🏥 Key Features

### Patient Dashboard

- **Priority-Based Sorting** - Patients automatically ordered by triage priority
- **Visual Priority Indicators** - Color-coded cards for quick identification
- **Status Tracking** - Monitor patient treatment progress and disposition
- **Quick Actions** - Fast access to patient details and status updates

### Patient Intake System

- **Guided Assessment** - Step-by-step triage evaluation following START protocol
- **Form Validation** - Real-time validation ensuring data accuracy
- **Touch-Optimized Interface** - Designed for mobile devices and tablets
- **Quick Entry Mode** - Streamlined interface for high-volume scenarios

### Data Security & Privacy

- **Client-Side Encryption** - All patient data encrypted before storage
- **No Cloud Dependencies** - Complete data sovereignty and privacy
- **HIPAA-Conscious Design** - Built with medical data privacy in mind
- **Secure Data Export** - Encrypted backup and transfer capabilities

## 🛠️ Technology Stack

- **Frontend**: Preact + TypeScript for lightweight, performant UI
- **Styling**: Tailwind CSS with medical-themed color palette
- **Data Storage**: Dexie.js (IndexedDB) with Web Crypto API encryption
- **PWA Features**: Vite PWA plugin with Workbox for advanced caching
- **Build System**: Vite with optimized bundling for mobile devices

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Modern web browser with PWA support

### Installation

```bash
# Clone the repository
git clone
cd triage-aid

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development Commands

```bash
npm run dev              # Start development server
npm run build           # Build for production
npm run preview         # Preview production build
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run format          # Format code with Prettier
```

## 📱 PWA Installation

TriageAid can be installed as a native app on mobile devices and desktops:

1. **Mobile**: Tap "Add to Home Screen" when prompted
2. **Desktop**: Click the install icon in the browser address bar
3. **Manual**: Use browser menu → "Install TriageAid"

### PWA Features

- **Offline Access** - Full functionality without internet
- **Native App Experience** - Runs in standalone mode
- **App Shortcuts** - Quick access to new assessment and dashboard
- **Background Updates** - Automatic app updates when online

## 🏗️ Architecture

### Component Structure

```
src/
├── components/          # UI components
│   ├── ui/             # Reusable UI elements
│   ├── PatientDashboard.tsx
│   └── PatientIntakeForm.tsx
├── services/           # Business logic
│   ├── DataService.ts  # Database operations
│   ├── SecurityService.ts # Encryption
│   └── TriageEngine.ts # START algorithm
├── types/              # TypeScript definitions
└── locales/           # Translation files
```

### Data Flow

1. **Patient Assessment** → Form validation → Triage calculation
2. **Data Encryption** → Local storage → Dashboard display
3. **Status Updates** → Re-encryption → Persistence

## 🔒 Security & Compliance

- **Data Encryption**: AES-256-GCM encryption for all patient data
- **No Network Transmission**: All data remains on device
- **Anonymous Identifiers**: No personally identifiable information stored
- **Audit Trail**: All patient interactions logged for accountability

## 🌍 Use Cases

### Emergency Scenarios

- **Mass Casualty Incidents** - Rapid triage of multiple patients
- **Disaster Response** - Offline capability in infrastructure-compromised areas
- **Field Medicine** - Mobile triage for remote or austere environments

### Clinical Settings

- **Emergency Departments** - Streamlined patient intake and prioritization
- **Urgent Care Centers** - Consistent triage protocols
- **Medical Training** - Educational tool for triage methodology

## 📋 Medical Protocols

### START Triage Algorithm

1. **Mobility Assessment** - Can the patient walk?
2. **Respiratory Status** - Breathing rate and quality
3. **Circulatory Status** - Pulse and capillary refill
4. **Neurological Status** - Consciousness and response level

### Priority Assignments

- Automatic calculation based on assessment findings
- Real-time recalculation when patient status changes
- Override capability for clinical judgment

## ⚠️ Medical Disclaimer

TriageAid is a clinical decision support tool. It does not replace professional medical judgment and should only be used by qualified medical personnel. Always follow local protocols and medical direction.
