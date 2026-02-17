export interface Member {
  id: string;
  name: string;
  phone: string;
  photoUrl?: string;
  category: 'Loisir' | 'Compétiteur' | 'Pro';
  notes: string;
  wins: number;
  losses: number;
  draws: number;
  titles: Title[];
  // Nouveaux champs pour la page perso
  documentsUpToDate: boolean;
  subscriptionStatus: 'Paid' | 'Partial' | 'Unpaid';
  lastMedicalUpdate: string;
}

export interface Title {
  competition: string;
  rank: 'Or' | 'Argent' | 'Bronze' | 'Participation';
  year: number;
}

export interface Fight {
  id: string;
  fighterId: string;
  opponentName?: string;
  competitionId: string;
  fightNumber: number;
  ring: string;
  helmetColor: 'Rouge' | 'Bleu';
  status: 'Pending' | 'Ongoing' | 'Finished';
}

export interface Competition {
  id: string;
  name: string;
  date: string;
  location: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'Training' | 'Tournament' | 'Social';
  description?: string;
}

export interface TimerPreset {
  name: string;
  work: number; // seconds
  rest: number; // seconds
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isMe: boolean;
}

export enum AppRoute {
  HOME = 'home',
  TIMER = 'timer',
  MEMBERS = 'members',
  TOURNAMENT = 'tournament',
  CALENDAR = 'calendar',
  INFO = 'info',
  CHAT = 'chat',
  PROFILE = 'profile'
}