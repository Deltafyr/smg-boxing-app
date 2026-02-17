export type UserRole = 'Member' | 'Coach' | 'Admin';

export interface ChildProfile {
  id: string;
  name: string;
  age: number;
  gender: 'H' | 'F';
}

export interface UserDocument {
  id: string;
  type: 'Certificat Médical' | 'Auto. Soins' | 'Auto. Transport' | 'Règlement' | 'Autre';
  fileName: string;
  date: string;
  status: 'Pending' | 'Valid' | 'Rejected';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  category: 'Loisir' | 'Compétiteur' | 'Pro' | 'Parent';
  
  // Champs existants
  phone?: string;
  age?: number;
  gender?: 'H' | 'F';
  
  // Nouveaux champs demandés
  address?: string;
  documents?: UserDocument[];
  
  // Logique Parentale
  isParent?: boolean;
  isPractitioner?: boolean;
  children?: ChildProfile[];
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  photoUrl?: string;
  category: 'Loisir' | 'Compétiteur' | 'Pro' | 'Parent';
  notes: string;
  wins: number;
  losses: number;
  draws: number;
  titles: Title[];
  documentsUpToDate: boolean;
  subscriptionStatus: 'Paid' | 'Partial' | 'Unpaid';
  lastMedicalUpdate: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  priority: 'High' | 'Normal';
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
  LOGIN = 'login',
  REGISTER = 'register',
  HOME = 'home',
  TIMER = 'timer',
  MEMBERS = 'members',
  TOURNAMENT = 'tournament',
  CALENDAR = 'calendar',
  INFO = 'info',
  CHAT = 'chat',
  PROFILE = 'profile',
  ADMIN = 'admin'
}