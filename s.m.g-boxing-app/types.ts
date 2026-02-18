
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
  password?: string;
  role: UserRole;
  category: 'Loisir' | 'Compétiteur' | 'Pro' | 'Parent';
  phone?: string;
  age?: number;
  birthDate?: string;
  gender?: 'H' | 'F';
  address?: string;
  documents?: UserDocument[];
  isParent?: boolean;
  isPractitioner?: boolean;
  children?: ChildProfile[];
}

export interface MemberTitle {
  competition: string;
  rank: string;
  year: number;
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  category: 'Loisir' | 'Compétiteur' | 'Pro' | 'Parent';
  notes: string;
  wins: number;
  losses: number;
  draws: number;
  titles: MemberTitle[];
  documentsUpToDate: boolean;
  subscriptionStatus: 'Paid' | 'Partial' | 'Unpaid';
  lastMedicalUpdate: string;
  role?: UserRole;
}

export interface TimerPreset {
  name: string;
  work: number;
  rest: number;
}

export type FightStage = 'Finale' | 'Demi-finale' | '1/4 de finale' | '1/8 de finale' | 'Eliminatoire' | 'Assaut';

export interface Fight {
  id: string;
  fighterId: string;
  fighterName: string;
  opponentName?: string;
  competitionId: string;
  fightNumber: number;
  ring: string;
  helmetColor: 'Rouge' | 'Bleu' | 'Inconnu';
  status: 'Pending' | 'Ongoing' | 'Finished';
  result?: 'Victoire' | 'Défaite' | 'Nul' | '';
  stage?: FightStage;
  isAutoImported?: boolean;
  isLocked?: boolean;
}

export interface Competition {
  id: string;
  name: string;
  date: string;
  location: string;
  discipline?: string;
  weighInDayBefore?: boolean; // Nouveau
  ffkmdaId?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isMe: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  priority: 'High' | 'Normal' | 'Low';
}

export interface PollOption {
  id: string;
  text: string;
}

export interface Vote {
  userId: string;
  userName: string;
  optionId: string;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  active: boolean;
  createdAt: string;
  expiresAt?: string; // Nouveau
  votes: Vote[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'Training' | 'Tournament' | 'Social';
  description: string;
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
