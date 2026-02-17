import { Member, Competition, CalendarEvent, TimerPreset, ChatMessage } from './types';

// ID de l'utilisateur connecté (simulation)
export const CURRENT_USER_ID = '1';

// Mock Data for Members
export const INITIAL_MEMBERS: Member[] = [
  {
    id: '1',
    name: 'Thomas Anderson',
    phone: '0600000000',
    category: 'Compétiteur',
    notes: 'Très bon jab, doit travailler les esquives rotatives. Objectif : Championnat régional en fin de saison.',
    wins: 12,
    losses: 2,
    draws: 0,
    titles: [{ competition: 'Régional 2023', rank: 'Or', year: 2023 }],
    documentsUpToDate: true,
    subscriptionStatus: 'Paid',
    lastMedicalUpdate: '12/09/2023'
  },
  {
    id: '2',
    name: 'Sarah Connor',
    phone: '0612345678',
    category: 'Compétiteur',
    notes: 'Endurance exceptionnelle. Préparation physique à intensifier.',
    wins: 8,
    losses: 1,
    draws: 1,
    titles: [{ competition: 'National 2024', rank: 'Argent', year: 2024 }],
    documentsUpToDate: true,
    subscriptionStatus: 'Partial',
    lastMedicalUpdate: '05/01/2024'
  },
  {
    id: '3',
    name: 'Jean Dubois',
    phone: '0699887766',
    category: 'Loisir',
    notes: 'Débutant motivé.',
    wins: 0,
    losses: 0,
    draws: 0,
    titles: [],
    documentsUpToDate: false,
    subscriptionStatus: 'Unpaid',
    lastMedicalUpdate: 'Pending'
  }
];

// Mock Data for Competitions
export const INITIAL_COMPETITIONS: Competition[] = [
  { id: 'c1', name: 'Coupe de France', date: '2024-06-15', location: 'Paris' },
  { id: 'c2', name: 'Open Régional', date: '2024-05-20', location: 'Lyon' }
];

// Mock Data for Calendar
export const INITIAL_EVENTS: CalendarEvent[] = [
  { id: 'e1', title: 'Entraînement Pro', date: '2024-10-25', type: 'Training', description: 'Sparring intensif 19h' },
  { id: 'e2', title: 'Gala du Club', date: '2024-11-02', type: 'Social', description: 'Repas de fin de saison' },
  { id: 'e3', title: 'Pesée Coupe de France', date: '2024-06-14', type: 'Tournament', description: '18h au gymnase' }
];

// Timer Presets
export const TIMER_PRESETS: TimerPreset[] = [
  { name: 'Assaut 1min / 20s', work: 60, rest: 20 },
  { name: 'Assaut 1min / 35s', work: 60, rest: 35 },
  { name: 'Combat 2min / 45s', work: 120, rest: 45 },
  { name: 'Combat 2min / 1min', work: 120, rest: 60 },
  { name: 'Tabata 20s / 10s', work: 20, rest: 10 },
];

export const INITIAL_MESSAGES: ChatMessage[] = [
  { id: 'm1', senderId: '2', senderName: 'Sarah Connor', text: 'Quelqu\'un va à la salle ce soir ?', timestamp: '14:30', isMe: false },
  { id: 'm2', senderId: '1', senderName: 'Thomas Anderson', text: 'Oui j\'y serai vers 18h pour le sparring.', timestamp: '14:35', isMe: true },
  { id: 'm3', senderId: 'coach', senderName: 'Coach Mike', text: 'N\'oubliez pas vos protège-dents !', timestamp: '15:00', isMe: false },
];