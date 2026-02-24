export enum AppRoute {
  HOME = 'home', TIMER = 'timer', TOURNAMENT = 'tournament',
  CALENDAR = 'calendar', MEMBERS = 'members', SYSTEM = 'system', PROFILE = 'profile'
}
export type UserRole = 'Admin' | 'Coach' | 'Member';
export interface User {
  id: string; 
  name: string; 
  firstName?: string;
  lastName?: string;
  email?: string; 
  role: UserRole;
  memberType?: 'Enfant' | 'Junior' | 'Adulte' | 'Parent';
  category: 'Loisir' | 'Compétiteur' | string; 
  birthDate?: string;
  gender?: 'Homme' | 'Femme' | 'Autre';
  age?: string | number; 
  phone?: string;
  weight?: string; 
  record?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}
export interface Announcement {
  id: string; title: string; content: string; date: string;
  author: string; priority: 'High' | 'Normal' | 'Low';
}
export interface Poll { id: string; title: string; options: any[]; }
export interface CalendarEvent { id: string; title: string; date: string; }
