/**
 * Triage Priority Interface and Constants
 * Implements START Triage priority levels with color coding and descriptions
 */

export interface TriagePriority {
  level: 'red' | 'yellow' | 'green' | 'black';
  description: string;
  urgency: number; // 1-4 for sorting (1 = highest priority)
  color: string; // Hex color code for UI display
  icon: string; // Icon identifier for visual representation
}

/**
 * START Triage Priority Constants
 * Defines the four priority levels used in START triage protocol
 */
export const TRIAGE_PRIORITIES: Record<string, TriagePriority> = {
  red: {
    level: 'red',
    description: 'Immediate - Life threatening',
    urgency: 1,
    color: '#DC2626', // Tailwind red-600
    icon: 'emergency',
  },
  yellow: {
    level: 'yellow',
    description: 'Urgent - Serious injuries',
    urgency: 2,
    color: '#D97706', // Tailwind amber-600
    icon: 'warning',
  },
  green: {
    level: 'green',
    description: 'Minor - Can wait',
    urgency: 3,
    color: '#059669', // Tailwind emerald-600
    icon: 'check',
  },
  black: {
    level: 'black',
    description: 'Deceased/Expectant',
    urgency: 4,
    color: '#374151', // Tailwind gray-700
    icon: 'cross',
  },
} as const;

/**
 * Type for triage priority levels
 */
export type TriagePriorityLevel = keyof typeof TRIAGE_PRIORITIES;

/**
 * Helper function to get priority by level
 */
export function getTriagePriority(level: TriagePriorityLevel): TriagePriority {
  const priority = TRIAGE_PRIORITIES[level];
  if (!priority) {
    throw new Error(`Invalid triage priority level: ${level}`);
  }
  return priority;
}

/**
 * Helper function to get all priorities sorted by urgency
 */
export function getAllTriagePriorities(): TriagePriority[] {
  return Object.values(TRIAGE_PRIORITIES).sort((a, b) => a.urgency - b.urgency);
}

/**
 * Helper function to compare priorities for sorting
 */
export function compareTriagePriorities(
  a: TriagePriority,
  b: TriagePriority
): number {
  return a.urgency - b.urgency;
}
