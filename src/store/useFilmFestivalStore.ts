import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Work, Category, ScreeningSession, UserRole } from '@/types';

interface FilmFestivalStore {
  works: Work[];
  categories: Category[];
  screeningSessions: ScreeningSession[];
  currentRole: UserRole;
  resultsPublished: boolean;

  setCurrentRole: (role: UserRole) => void;
  toggleResultsPublished: () => void;

  addWork: (work: Omit<Work, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => void;
  updateWork: (id: string, work: Partial<Work>) => void;
  deleteWork: (id: string) => void;
  getWorkById: (id: string) => Work | undefined;
  getWorksByCategory: (categoryId: string) => Work[];
  getSelectedWorks: () => Work[];

  reviewWork: (id: string, score: number, comment: string, status: 'selected' | 'not_selected') => void;

  addScreeningSession: (session: Omit<ScreeningSession, 'id' | 'screenings'>) => void;
  updateScreeningSession: (id: string, session: Partial<ScreeningSession>) => void;
  deleteScreeningSession: (id: string) => void;
  addScreeningToSession: (sessionId: string, workId: string) => void;
  removeScreeningFromSession: (sessionId: string, screeningId: string) => void;
  reorderScreenings: (sessionId: string, screenings: ScreeningSession['screenings']) => void;

  canEditWork: (work: Work) => boolean;
}

const initialCategories: Category[] = [
  {
    id: 'cat-1',
    name: '剧情短片',
    description: '叙事性短片，时长不超过15分钟',
    maxDuration: 15,
    color: 'bg-blue-500',
  },
  {
    id: 'cat-2',
    name: '纪录片',
    description: '纪实类作品，时长不超过30分钟',
    maxDuration: 30,
    color: 'bg-green-500',
  },
  {
    id: 'cat-3',
    name: '实验影像',
    description: '实验性、先锋性影像作品，时长不超过10分钟',
    maxDuration: 10,
    color: 'bg-purple-500',
  },
  {
    id: 'cat-4',
    name: '动画短片',
    description: '动画类作品，时长不超过12分钟',
    maxDuration: 12,
    color: 'bg-orange-500',
  },
];

const initialWorks: Work[] = [
  {
    id: 'work-1',
    title: '城市漫步',
    creator: '张明',
    creatorEmail: 'zhangming@example.com',
    category: 'cat-1',
    duration: 12,
    description: '一个关于城市孤独与相遇的故事。',
    coverUrl: 'https://picsum.photos/seed/film1/400/300',
    videoUrl: '',
    copyrightAccepted: true,
    status: 'pending',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'work-2',
    title: '山间回响',
    creator: '李华',
    creatorEmail: 'lihua@example.com',
    category: 'cat-2',
    duration: 25,
    description: '记录山区教师的一天。',
    coverUrl: 'https://picsum.photos/seed/film2/400/300',
    videoUrl: '',
    copyrightAccepted: true,
    status: 'selected',
    reviewScore: 8.5,
    reviewComment: '真实感人，画面优美。',
    createdAt: '2024-01-16T14:30:00Z',
    updatedAt: '2024-01-20T09:00:00Z',
  },
  {
    id: 'work-3',
    title: '时间的褶皱',
    creator: '王芳',
    creatorEmail: 'wangfang@example.com',
    category: 'cat-3',
    duration: 8,
    description: '关于记忆与时间的实验影像。',
    coverUrl: 'https://picsum.photos/seed/film3/400/300',
    videoUrl: '',
    copyrightAccepted: true,
    status: 'reviewing',
    createdAt: '2024-01-17T08:15:00Z',
    updatedAt: '2024-01-18T16:45:00Z',
  },
  {
    id: 'work-4',
    title: '星星的孩子',
    creator: '赵雷',
    creatorEmail: 'zhaolei@example.com',
    category: 'cat-4',
    duration: 10,
    description: '一个自闭症儿童的奇幻世界。',
    coverUrl: 'https://picsum.photos/seed/film4/400/300',
    videoUrl: '',
    copyrightAccepted: true,
    status: 'selected',
    reviewScore: 9.0,
    reviewComment: '创意十足，情感真挚。',
    createdAt: '2024-01-18T11:20:00Z',
    updatedAt: '2024-01-20T10:30:00Z',
  },
  {
    id: 'work-5',
    title: '夏日午后',
    creator: '陈静',
    creatorEmail: 'chenjing@example.com',
    category: 'cat-1',
    duration: 14,
    description: '青春的迷茫与悸动。',
    coverUrl: 'https://picsum.photos/seed/film5/400/300',
    videoUrl: '',
    copyrightAccepted: true,
    status: 'not_selected',
    reviewScore: 6.5,
    reviewComment: '表演略显生涩。',
    createdAt: '2024-01-19T09:00:00Z',
    updatedAt: '2024-01-21T14:00:00Z',
  },
];

const initialScreeningSessions: ScreeningSession[] = [
  {
    id: 'session-1',
    name: '开幕夜：剧情精选',
    date: '2024-02-10',
    startTime: '19:00',
    venue: '主放映厅 A',
    screenings: [
      { id: 'scr-1', workId: 'work-2', date: '2024-02-10', time: '19:00', venue: '主放映厅 A', order: 1 },
      { id: 'scr-2', workId: 'work-4', date: '2024-02-10', time: '19:30', venue: '主放映厅 A', order: 2 },
    ],
  },
  {
    id: 'session-2',
    name: '实验影像单元',
    date: '2024-02-11',
    startTime: '14:00',
    venue: '艺术空间 B',
    screenings: [],
  },
];

export const useFilmFestivalStore = create<FilmFestivalStore>()(
  persist(
    (set, get) => ({
      works: initialWorks,
      categories: initialCategories,
      screeningSessions: initialScreeningSessions,
      currentRole: 'creator',
      resultsPublished: false,

      setCurrentRole: (role) => set({ currentRole: role }),
      toggleResultsPublished: () => set((state) => ({ resultsPublished: !state.resultsPublished })),

      addWork: (work) => {
        const now = new Date().toISOString();
        const newWork: Work = {
          ...work,
          id: `work-${Date.now()}`,
          status: 'pending',
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ works: [...state.works, newWork] }));
      },

      updateWork: (id, work) => {
        const now = new Date().toISOString();
        set((state) => ({
          works: state.works.map((w) =>
            w.id === id ? { ...w, ...work, updatedAt: now } : w
          ),
        }));
      },

      deleteWork: (id) => {
        set((state) => ({ works: state.works.filter((w) => w.id !== id) }));
      },

      getWorkById: (id) => {
        return get().works.find((w) => w.id === id);
      },

      getWorksByCategory: (categoryId) => {
        return get().works.filter((w) => w.category === categoryId);
      },

      getSelectedWorks: () => {
        return get().works.filter((w) => w.status === 'selected');
      },

      reviewWork: (id, score, comment, status) => {
        const now = new Date().toISOString();
        set((state) => ({
          works: state.works.map((w) =>
            w.id === id
              ? { ...w, reviewScore: score, reviewComment: comment, status, updatedAt: now }
              : w
          ),
        }));
      },

      addScreeningSession: (session) => {
        const newSession: ScreeningSession = {
          ...session,
          id: `session-${Date.now()}`,
          screenings: [],
        };
        set((state) => ({ screeningSessions: [...state.screeningSessions, newSession] }));
      },

      updateScreeningSession: (id, session) => {
        set((state) => ({
          screeningSessions: state.screeningSessions.map((s) =>
            s.id === id ? { ...s, ...session } : s
          ),
        }));
      },

      deleteScreeningSession: (id) => {
        set((state) => ({
          screeningSessions: state.screeningSessions.filter((s) => s.id !== id),
        }));
      },

      addScreeningToSession: (sessionId, workId) => {
        const state = get();
        const work = state.works.find((w) => w.id === workId);
        if (!work) return;

        const session = state.screeningSessions.find((s) => s.id === sessionId);
        if (!session) return;

        const newScreening = {
          id: `scr-${Date.now()}`,
          workId,
          date: session.date,
          time: session.startTime,
          venue: session.venue,
          order: session.screenings.length + 1,
        };

        set((state) => ({
          screeningSessions: state.screeningSessions.map((s) =>
            s.id === sessionId
              ? { ...s, screenings: [...s.screenings, newScreening] }
              : s
          ),
        }));
      },

      removeScreeningFromSession: (sessionId, screeningId) => {
        set((state) => ({
          screeningSessions: state.screeningSessions.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  screenings: s.screenings
                    .filter((sc) => sc.id !== screeningId)
                    .map((sc, idx) => ({ ...sc, order: idx + 1 })),
                }
              : s
          ),
        }));
      },

      reorderScreenings: (sessionId, screenings) => {
        set((state) => ({
          screeningSessions: state.screeningSessions.map((s) =>
            s.id === sessionId ? { ...s, screenings } : s
          ),
        }));
      },

      canEditWork: (work) => {
        const { resultsPublished } = get();
        if (resultsPublished && work.status === 'selected') {
          return false;
        }
        return work.status !== 'selected';
      },
    }),
    {
      name: 'film-festival-storage',
    }
  )
);
