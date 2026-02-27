export enum AppRoute { HOME='home', TIMER='timer', TOURNAMENT='tournament', CALENDAR='calendar', MEMBERS='members', SYSTEM='system', PROFILE='profile' }
export type UserRole = 'Admin' | 'Coach' | 'Member';
export interface User { id: string; name: string; firstName?: string; lastName?: string; email?: string; role: UserRole; memberType?: 'Enfant' | 'Junior' | 'Adulte' | 'Parent'; category: 'Loisir' | 'Compétiteur' | string; birthDate?: string; gender?: 'Homme' | 'Femme' | 'Autre'; age?: string | number; phone?: string; weight?: string; record?: string; emergencyContact?: string; emergencyPhone?: string; }
export type EventType = 'Championnat' | 'Coupe' | 'Événement Club';
export interface CalendarEvent { id: string; title: string; date: string; type: EventType; }
export interface News { id: string; type: 'info' | 'poll'; title: string; content: string; date: string; author: string; options?: { text: string; votes: string[] }[]; }
export interface Competition { id: string; name: string; date: string; location: string; }
export interface FightCard { id: string; compId: string; userId: string; userName: string; weight: string; category: string; area: string; matchNum: string; headgear: 'Rouge' | 'Bleu' | ''; }
