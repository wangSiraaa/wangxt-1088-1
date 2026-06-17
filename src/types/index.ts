export interface Work {
  id: string;
  title: string;
  creator: string;
  creatorEmail: string;
  category: string;
  duration: number;
  description: string;
  coverUrl: string;
  videoUrl: string;
  copyrightAccepted: boolean;
  status: 'pending' | 'reviewing' | 'selected' | 'not_selected';
  reviewComment?: string;
  reviewScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  maxDuration: number;
  color: string;
}

export interface Screening {
  id: string;
  workId: string;
  date: string;
  time: string;
  venue: string;
  order: number;
}

export interface ScreeningSession {
  id: string;
  name: string;
  date: string;
  startTime: string;
  venue: string;
  screenings: Screening[];
}

export type UserRole = 'creator' | 'judge' | 'volunteer';
