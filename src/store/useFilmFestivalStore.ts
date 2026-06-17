import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Work,
  Category,
  ScreeningSession,
  UserRole,
  WorkVersion,
  SchedulingLog,
  ValidationResult,
  AllocationResult,
  WorkSnapshot,
  AllocationBasis,
  PipelineMilestone,
  Region,
  Screening,
} from '@/types';
import {
  FROZEN_FIELDS,
  ALLOWED_AFTER_FREEZE,
  PIPELINE_STAGES,
  REGIONS,
} from '@/types';

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildValidationResult(
  errors: Record<string, string>,
  warnings: Record<string, string>
): ValidationResult {
  return {
    valid: Object.keys(errors).length === 0,
    errors,
    warnings,
    errorList: Object.values(errors),
    warningList: Object.values(warnings),
  };
}

function getWorkSnapshot(work: Work): WorkSnapshot {
  const { id, createdAt, updatedAt, version, frozenAt, ...rest } = work;
  return rest;
}

function computeDiff(
  oldSnapshot: WorkSnapshot,
  newSnapshot: WorkSnapshot
): string[] {
  const fields: string[] = [];
  const allKeys = new Set([...Object.keys(oldSnapshot), ...Object.keys(newSnapshot)]);
  for (const key of allKeys as (keyof WorkSnapshot)[]) {
    if (JSON.stringify(oldSnapshot[key]) !== JSON.stringify(newSnapshot[key])) {
      fields.push(key);
    }
  }
  return fields;
}

interface FilmFestivalStore {
  works: Work[];
  categories: Category[];
  screeningSessions: ScreeningSession[];
  workVersions: WorkVersion[];
  schedulingLogs: SchedulingLog[];
  currentRole: UserRole;
  resultsPublished: boolean;
  currentUser: string;
  maxWorksPerCategory: number;
  maxWorksPerRegion: number;

  setCurrentRole: (role: UserRole) => void;
  setCurrentUser: (user: string) => void;
  toggleResultsPublished: () => void;

  validateSubmission: (work: Partial<Work>) => ValidationResult;
  addWork: (work: Omit<Work, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'version'>) => ValidationResult;
  updateWork: (id: string, updates: Partial<Work>, changeDescription?: string) => ValidationResult;
  deleteWork: (id: string) => boolean;
  getWorkById: (id: string) => Work | undefined;
  getWorksByCategory: (categoryId: string) => Work[];
  getSelectedWorks: () => Work[];

  getWorkVersions: (workId: string) => WorkVersion[];
  compareVersions: (workId: string, v1: number, v2: number) => { field: string; old: unknown; new: unknown }[] | null;
  getLatestVersion: (workId: string) => WorkVersion | undefined;

  isWorkFrozen: (work: Work) => boolean;
  canEditField: (work: Work, field: keyof Work) => boolean;
  canFieldEditAfterFreeze: (work: Work, field: keyof Work) => boolean;
  canEditWork: (work: Work) => boolean;

  reviewWork: (
    id: string,
    score: number,
    comment: string,
    status: 'selected' | 'not_selected' | 'reviewing'
  ) => void;
  announceResults: () => void;

  addScreeningSession: (session: Omit<ScreeningSession, 'id' | 'screenings'>) => void;
  updateScreeningSession: (id: string, session: Partial<ScreeningSession>) => void;
  deleteScreeningSession: (id: string) => void;
  addScreeningToSession: (
    sessionId: string,
    workId: string,
    allocatedBy?: AllocationBasis
  ) => void;
  removeScreeningFromSession: (sessionId: string, screeningId: string) => void;
  reorderScreenings: (sessionId: string, screenings: ScreeningSession['screenings']) => void;

  smartAllocateToSession: (sessionId: string, workIds: string[]) => AllocationResult;
  getAllocationWarnings: (sessionId: string) => string[];
  getSchedulingLogs: (sessionId?: string) => SchedulingLog[];

  getPipelineMilestones: (workId: string) => PipelineMilestone[];
  getRegionQuotaUsage: (sessionId: string) => Record<Region, { used: number; quota: number }>;
  getCategoryDistribution: (sessionId: string) => Record<string, number>;
}

const initialCategories: Category[] = [
  { id: 'cat-1', name: '剧情短片', description: '叙事性短片，时长不超过15分钟', maxDuration: 15, color: 'bg-blue-500', regionQuota: 2 },
  { id: 'cat-2', name: '纪录片', description: '纪实类作品，时长不超过30分钟', maxDuration: 30, color: 'bg-green-500', regionQuota: 2 },
  { id: 'cat-3', name: '实验影像', description: '实验性、先锋性影像作品，时长不超过10分钟', maxDuration: 10, color: 'bg-purple-500', regionQuota: 1 },
  { id: 'cat-4', name: '动画短片', description: '动画类作品，时长不超过12分钟', maxDuration: 12, color: 'bg-orange-500', regionQuota: 2 },
];

const initialWorks: Work[] = [
  {
    id: 'work-1', title: '城市漫步', creator: '张明', creatorEmail: 'zhangming@example.com',
    category: 'cat-1', duration: 12, description: '一个关于城市孤独与相遇的故事。',
    coverUrl: 'https://picsum.photos/seed/film1/400/300', videoUrl: '',
    copyrightAccepted: true, musicAuthorized: true, subtitleUrl: 'https://example.com/sub1.srt',
    region: '华北', screeningMaterialUrl: '', posterUrl: '',
    status: 'pending', createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z', version: 1,
  },
  {
    id: 'work-2', title: '山间回响', creator: '李华', creatorEmail: 'lihua@example.com',
    category: 'cat-2', duration: 25, description: '记录山区教师的一天。',
    coverUrl: 'https://picsum.photos/seed/film2/400/300', videoUrl: '',
    copyrightAccepted: true, musicAuthorized: true, subtitleUrl: 'https://example.com/sub2.srt',
    region: '华东', screeningMaterialUrl: '', posterUrl: '',
    status: 'selected', reviewScore: 8.5, reviewComment: '真实感人，画面优美。',
    createdAt: '2024-01-16T14:30:00Z', updatedAt: '2024-01-20T09:00:00Z', version: 1,
  },
  {
    id: 'work-3', title: '时间的褶皱', creator: '王芳', creatorEmail: 'wangfang@example.com',
    category: 'cat-3', duration: 8, description: '关于记忆与时间的实验影像。',
    coverUrl: 'https://picsum.photos/seed/film3/400/300', videoUrl: '',
    copyrightAccepted: true, musicAuthorized: true, subtitleUrl: 'https://example.com/sub3.srt',
    region: '华南', screeningMaterialUrl: '', posterUrl: '',
    status: 'reviewing', createdAt: '2024-01-17T08:15:00Z', updatedAt: '2024-01-18T16:45:00Z', version: 1,
  },
  {
    id: 'work-4', title: '星星的孩子', creator: '赵雷', creatorEmail: 'zhaolei@example.com',
    category: 'cat-4', duration: 10, description: '一个自闭症儿童的奇幻世界。',
    coverUrl: 'https://picsum.photos/seed/film4/400/300', videoUrl: '',
    copyrightAccepted: true, musicAuthorized: true, subtitleUrl: 'https://example.com/sub4.srt',
    region: '西南', screeningMaterialUrl: '', posterUrl: '',
    status: 'selected', reviewScore: 9.0, reviewComment: '创意十足，情感真挚。',
    createdAt: '2024-01-18T11:20:00Z', updatedAt: '2024-01-20T10:30:00Z', version: 1,
  },
  {
    id: 'work-5', title: '夏日午后', creator: '陈静', creatorEmail: 'chenjing@example.com',
    category: 'cat-1', duration: 14, description: '青春的迷茫与悸动。',
    coverUrl: 'https://picsum.photos/seed/film5/400/300', videoUrl: '',
    copyrightAccepted: true, musicAuthorized: false, subtitleUrl: '',
    region: '华中', screeningMaterialUrl: '', posterUrl: '',
    status: 'not_selected', reviewScore: 6.5, reviewComment: '表演略显生涩。',
    createdAt: '2024-01-19T09:00:00Z', updatedAt: '2024-01-21T14:00:00Z', version: 1,
  },
  {
    id: 'work-6', title: '归乡路', creator: '刘洋', creatorEmail: 'liuyang@example.com',
    category: 'cat-1', duration: 13, description: '春运期间的一段感人旅程。',
    coverUrl: 'https://picsum.photos/seed/film6/400/300', videoUrl: '',
    copyrightAccepted: true, musicAuthorized: true, subtitleUrl: 'https://example.com/sub6.srt',
    region: '东北', screeningMaterialUrl: '', posterUrl: '',
    status: 'selected', reviewScore: 8.8, reviewComment: '情感细腻，主题深刻。',
    createdAt: '2024-01-20T10:00:00Z', updatedAt: '2024-01-22T10:00:00Z', version: 1,
  },
  {
    id: 'work-7', title: '海岸线', creator: '林小丹', creatorEmail: 'linxiaodan@example.com',
    category: 'cat-2', duration: 22, description: '沿海渔村的变迁与坚守。',
    coverUrl: 'https://picsum.photos/seed/film7/400/300', videoUrl: '',
    copyrightAccepted: true, musicAuthorized: true, subtitleUrl: 'https://example.com/sub7.srt',
    region: '华东', screeningMaterialUrl: '', posterUrl: '',
    status: 'selected', reviewScore: 8.2, reviewComment: '镜头语言丰富。',
    createdAt: '2024-01-21T11:00:00Z', updatedAt: '2024-01-23T11:00:00Z', version: 1,
  },
  {
    id: 'work-8', title: '梦境碎片', creator: '孙雨桐', creatorEmail: 'sunyutong@example.com',
    category: 'cat-3', duration: 6, description: '超现实主义的梦境探索。',
    coverUrl: 'https://picsum.photos/seed/film8/400/300', videoUrl: '',
    copyrightAccepted: true, musicAuthorized: true, subtitleUrl: 'https://example.com/sub8.srt',
    region: '西北', screeningMaterialUrl: '', posterUrl: '',
    status: 'selected', reviewScore: 8.0, reviewComment: '极具先锋性。',
    createdAt: '2024-01-22T12:00:00Z', updatedAt: '2024-01-24T12:00:00Z', version: 1,
  },
];

const initialScreeningSessions: ScreeningSession[] = [
  {
    id: 'session-1', name: '开幕夜：剧情精选', date: '2024-02-10', startTime: '19:00',
    venue: '主放映厅 A', theme: '剧情',
    maxWorksPerCategory: 3, maxDuration: 90,
    screenings: [
      { id: 'scr-1', workId: 'work-2', date: '2024-02-10', time: '19:00', venue: '主放映厅 A', order: 1, allocatedBy: 'manual' },
      { id: 'scr-2', workId: 'work-4', date: '2024-02-10', time: '19:30', venue: '主放映厅 A', order: 2, allocatedBy: 'manual' },
    ],
  },
  {
    id: 'session-2', name: '实验影像单元', date: '2024-02-11', startTime: '14:00',
    venue: '艺术空间 B', theme: '实验',
    maxWorksPerCategory: 4, maxDuration: 60,
    screenings: [],
  },
];

const initialWorkVersions: WorkVersion[] = initialWorks.map((w) => ({
  id: `v-${w.id}`,
  workId: w.id,
  version: 1,
  snapshot: getWorkSnapshot(w),
  changeDescription: '初始版本',
  createdAt: w.createdAt,
  changedBy: w.creator,
  diffFields: [],
}));

const initialSchedulingLogs: SchedulingLog[] = [
  {
    id: 'log-1', sessionId: 'session-1', action: 'add', workId: 'work-2',
    detail: '添加作品「山间回响」', operator: '系统管理员', createdAt: '2024-01-25T10:00:00Z',
  },
  {
    id: 'log-2', sessionId: 'session-1', action: 'add', workId: 'work-4',
    detail: '添加作品「星星的孩子」', operator: '系统管理员', createdAt: '2024-01-25T10:05:00Z',
  },
];

export const useFilmFestivalStore = create<FilmFestivalStore>()(
  persist(
    (set, get) => ({
      works: initialWorks,
      categories: initialCategories,
      screeningSessions: initialScreeningSessions,
      workVersions: initialWorkVersions,
      schedulingLogs: initialSchedulingLogs,
      currentRole: 'creator',
      resultsPublished: false,
      currentUser: '当前用户',
      maxWorksPerCategory: 2,
      maxWorksPerRegion: 2,

      setCurrentRole: (role) => set({ currentRole: role }),
      setCurrentUser: (user) => set({ currentUser: user }),
      toggleResultsPublished: () => set((s) => ({ resultsPublished: !s.resultsPublished })),

      validateSubmission: (work) => {
        const errors: Record<string, string> = {};
        const warnings: Record<string, string> = {};

        if (!work.title?.trim()) errors.title = '请输入作品标题';
        if (!work.creator?.trim()) errors.creator = '请输入创作者姓名';
        if (!work.creatorEmail?.trim()) errors.creatorEmail = '请输入联系邮箱';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(work.creatorEmail)) {
          errors.creatorEmail = '请输入有效的邮箱地址';
        }
        if (!work.category) errors.category = '请选择参赛分类';
        if (!work.duration || work.duration <= 0) errors.duration = '请输入作品时长';
        if (!work.description?.trim()) errors.description = '请输入作品简介';
        if (!work.coverUrl?.trim()) errors.coverUrl = '请输入封面图片链接';

        if (!work.copyrightAccepted) {
          errors.copyrightAccepted = '必须同意版权声明才能提交';
        }
        if (!work.musicAuthorized) {
          errors.musicAuthorized = '必须确认配乐已获得授权';
          warnings.musicAuthorized = '如使用无版权音乐，请在备注中说明';
        }
        if (!work.subtitleUrl?.trim()) {
          errors.subtitleUrl = '请上传字幕文件链接';
        }
        if (!work.region) {
          errors.region = '请选择作品地区';
        }

        if (work.category && work.duration) {
          const cat = get().categories.find((c) => c.id === work.category);
          if (cat && work.duration > cat.maxDuration) {
            errors.duration = `作品时长（${work.duration}分钟）超过${cat.name}上限（${cat.maxDuration}分钟）`;
          }
        }

        return buildValidationResult(errors, warnings);
      },

      addWork: (workData) => {
        if (get().resultsPublished) {
          return buildValidationResult(
            { frozen: '入围结果已公布，无法新增作品' },
            {}
          );
        }
        const validation = get().validateSubmission(workData as Work);
        if (!validation.valid) return validation;

        const now = new Date().toISOString();
        const newWork: Work = {
          ...(workData as Work),
          id: generateId('work'),
          status: 'pending',
          createdAt: now,
          updatedAt: now,
          version: 1,
        };

        const newVersion: WorkVersion = {
          id: generateId('v'),
          workId: newWork.id,
          version: 1,
          snapshot: getWorkSnapshot(newWork),
          changeDescription: '初始提交',
          createdAt: now,
          changedBy: get().currentUser,
          diffFields: [],
        };

        set((s) => ({
          works: [...s.works, newWork],
          workVersions: [...s.workVersions, newVersion],
        }));

        return validation;
      },

      updateWork: (id, updates, changeDescription = '修改作品信息') => {
        const state = get();
        const work = state.works.find((w) => w.id === id);
        if (!work) return buildValidationResult({ work: '作品不存在' }, {});

        if (state.resultsPublished) {
          return buildValidationResult(
            { frozen: '入围结果已公布，所有作品资料不可修改' },
            {}
          );
        }

        const frozen = state.isWorkFrozen(work);
        const updatedFields = Object.keys(updates) as (keyof Work)[];

        if (frozen) {
          const invalidFields = updatedFields.filter(
            (f) => !ALLOWED_AFTER_FREEZE.includes(f)
          );
          if (invalidFields.length > 0) {
            return buildValidationResult(
              { frozen: `作品已冻结，仅允许修改：${ALLOWED_AFTER_FREEZE.join('、')}` },
              {}
            );
          }
        }

        const now = new Date().toISOString();
        const newVersion = work.version + 1;
        const updatedWork: Work = { ...work, ...updates, updatedAt: now, version: newVersion };

        const newSnapshot = getWorkSnapshot(updatedWork);
        const oldSnapshot = getWorkSnapshot(work);
        const diffFields = computeDiff(oldSnapshot, newSnapshot);

        if (diffFields.length === 0) {
          return buildValidationResult({}, {});
        }

        const forSubmission = diffFields.some(
          (f) => ['copyrightAccepted', 'musicAuthorized', 'subtitleUrl', 'region', 'category', 'duration'].includes(f)
        );
        if (forSubmission) {
          const validation = state.validateSubmission(updatedWork);
          if (!validation.valid) return validation;
        }

        const versionRecord: WorkVersion = {
          id: generateId('v'),
          workId: id,
          version: newVersion,
          snapshot: newSnapshot,
          changeDescription,
          createdAt: now,
          changedBy: state.currentUser,
          diffFields,
        };

        set((s) => ({
          works: s.works.map((w) => (w.id === id ? updatedWork : w)),
          workVersions: [...s.workVersions, versionRecord],
        }));

        return buildValidationResult({}, {});
      },

      deleteWork: (id) => {
        const state = get();
        const work = state.works.find((w) => w.id === id);
        if (!work) return false;
        if (state.resultsPublished) return false;
        if (state.isWorkFrozen(work)) return false;

        set((s) => ({
          works: s.works.filter((w) => w.id !== id),
          workVersions: s.workVersions.filter((v) => v.workId !== id),
        }));
        return true;
      },

      getWorkById: (id) => get().works.find((w) => w.id === id),
      getWorksByCategory: (categoryId) => get().works.filter((w) => w.category === categoryId),
      getSelectedWorks: () => get().works.filter((w) => w.status === 'selected' || w.status === 'announced' || w.status === 'screening_scheduled'),

      getWorkVersions: (workId) =>
        [...get().workVersions.filter((v) => v.workId === workId)].sort(
          (a, b) => b.version - a.version
        ),

      compareVersions: (workId, v1, v2) => {
        const versions = get().workVersions.filter((v) => v.workId === workId);
        const ver1 = versions.find((v) => v.version === v1);
        const ver2 = versions.find((v) => v.version === v2);
        if (!ver1 || !ver2) return null;

        const diffs: { field: string; old: unknown; new: unknown }[] = [];
        const allKeys = new Set([
          ...Object.keys(ver1.snapshot),
          ...Object.keys(ver2.snapshot),
        ]);
        for (const key of allKeys as (keyof WorkSnapshot)[]) {
          const oldVal = ver1.snapshot[key];
          const newVal = ver2.snapshot[key];
          if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            diffs.push({ field: key, old: oldVal, new: newVal });
          }
        }
        return diffs;
      },

      getLatestVersion: (workId) => {
        const versions = get().getWorkVersions(workId);
        return versions[0];
      },

      isWorkFrozen: (work) => {
        if (get().resultsPublished) return true;
        return (
          work.status === 'announced' ||
          work.status === 'screening_scheduled' ||
          !!work.frozenAt
        );
      },

      canEditField: (work, field) => {
        if (get().resultsPublished) return false;
        if (!get().isWorkFrozen(work)) return true;
        if (!ALLOWED_AFTER_FREEZE.includes(field)) return false;
        return get().canFieldEditAfterFreeze(work, field);
      },

      canEditWork: (work) => {
        if (get().resultsPublished) return false;
        if (!get().isWorkFrozen(work)) return true;
        const canSupplement = ALLOWED_AFTER_FREEZE.some((field) => {
          const val = work[field];
          return !val || (typeof val === 'string' && val.trim() === '');
        });
        return canSupplement;
      },

      canFieldEditAfterFreeze: (work, field) => {
        if (get().resultsPublished) return false;
        if (!get().isWorkFrozen(work)) return false;
        if (!ALLOWED_AFTER_FREEZE.includes(field)) return false;
        const currentValue = work[field];
        return !currentValue || (typeof currentValue === 'string' && currentValue.trim() === '');
      },

      reviewWork: (id, score, comment, status) => {
        const now = new Date().toISOString();
        set((s) => ({
          works: s.works.map((w) =>
            w.id === id
              ? {
                  ...w,
                  reviewScore: score,
                  reviewComment: comment,
                  status,
                  updatedAt: now,
                  version: w.version + 1,
                }
              : w
          ),
        }));
      },

      announceResults: () => {
        const now = new Date().toISOString();
        set((s) => ({
          resultsPublished: true,
          works: s.works.map((w) =>
            w.status === 'selected'
              ? { ...w, status: 'announced' as const, frozenAt: now, updatedAt: now }
              : { ...w, frozenAt: now, updatedAt: now }
          ),
        }));
      },

      addScreeningSession: (session) => {
        const newSession: ScreeningSession = {
          ...session,
          id: generateId('session'),
          screenings: [],
        };
        set((s) => ({ screeningSessions: [...s.screeningSessions, newSession] }));
      },

      updateScreeningSession: (id, session) => {
        set((s) => ({
          screeningSessions: s.screeningSessions.map((sess) =>
            sess.id === id ? { ...sess, ...session } : sess
          ),
        }));
      },

      deleteScreeningSession: (id) => {
        set((s) => ({
          screeningSessions: s.screeningSessions.filter((sess) => sess.id !== id),
        }));
      },

      addScreeningToSession: (sessionId, workId, allocatedBy = 'manual') => {
        const state = get();
        const work = state.works.find((w) => w.id === workId);
        if (!work) return;

        const session = state.screeningSessions.find((s) => s.id === sessionId);
        if (!session) return;

        if (session.screenings.some((sc) => sc.workId === workId)) return;

        const timeParts = session.startTime.split(':');
        const startMinutes = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);
        const accumulatedDuration = session.screenings.reduce((acc, sc) => {
          const w = state.works.find((ww) => ww.id === sc.workId);
          return acc + (w?.duration || 0);
        }, 0);
        const screeningTime = new Date();
        screeningTime.setHours(0, startMinutes + accumulatedDuration, 0, 0);
        const timeStr = `${String(screeningTime.getHours()).padStart(2, '0')}:${String(
          screeningTime.getMinutes()
        ).padStart(2, '0')}`;

        const newScreening: Screening = {
          id: generateId('scr'),
          workId,
          date: session.date,
          time: timeStr,
          venue: session.venue,
          order: session.screenings.length + 1,
          allocatedBy,
        };

        const log: SchedulingLog = {
          id: generateId('log'),
          sessionId,
          action: 'add',
          workId,
          detail: `添加作品「${work.title}」，分配方式：${allocatedBy === 'manual' ? '手动' : allocatedBy === 'category' ? '按类别' : allocatedBy === 'duration' ? '按时长' : '按地区'}`,
          operator: state.currentUser,
          createdAt: new Date().toISOString(),
          allocationBasis: allocatedBy,
        };

        set((s) => ({
          screeningSessions: s.screeningSessions.map((sess) =>
            sess.id === sessionId
              ? { ...sess, screenings: [...sess.screenings, newScreening] }
              : sess
          ),
          schedulingLogs: [...s.schedulingLogs, log],
        }));
      },

      removeScreeningFromSession: (sessionId, screeningId) => {
        const state = get();
        const session = state.screeningSessions.find((s) => s.id === sessionId);
        const screening = session?.screenings.find((sc) => sc.id === screeningId);
        const work = screening ? state.works.find((w) => w.id === screening.workId) : null;

        if (screening && work) {
          const log: SchedulingLog = {
            id: generateId('log'),
            sessionId,
            action: 'remove',
            workId: work.id,
            detail: `移除作品「${work.title}」`,
            operator: state.currentUser,
            createdAt: new Date().toISOString(),
          };
          set((s) => ({ schedulingLogs: [...s.schedulingLogs, log] }));
        }

        set((s) => ({
          screeningSessions: s.screeningSessions.map((sess) =>
            sess.id === sessionId
              ? {
                  ...sess,
                  screenings: sess.screenings
                    .filter((sc) => sc.id !== screeningId)
                    .map((sc, idx) => ({ ...sc, order: idx + 1 })),
                }
              : sess
          ),
        }));
      },

      reorderScreenings: (sessionId, screenings) => {
        const before = JSON.stringify(
          get().screeningSessions.find((s) => s.id === sessionId)?.screenings.map((sc) => sc.workId)
        );
        const after = JSON.stringify(screenings.map((sc) => sc.workId));

        const log: SchedulingLog = {
          id: generateId('log'),
          sessionId,
          action: 'reorder',
          detail: '重新排列放映顺序',
          operator: get().currentUser,
          createdAt: new Date().toISOString(),
          beforeState: before,
          afterState: after,
        };

        set((s) => ({
          screeningSessions: s.screeningSessions.map((sess) =>
            sess.id === sessionId ? { ...sess, screenings } : sess
          ),
          schedulingLogs: [...s.schedulingLogs, log],
        }));
      },

      smartAllocateToSession: (sessionId, workIds) => {
        const state = get();
        const session = state.screeningSessions.find((s) => s.id === sessionId);
        const warnings: string[] = [];
        const appliedRules: AllocationBasis[] = [];
        const allocated: { workId: string; title: string }[] = [];
        const skipped: { workId: string; title: string; reason: string }[] = [];
        if (!session) return { sessionId, screenings: [], allocated, skipped, warnings, appliedRules };

        const validWorks = workIds
          .map((id) => state.works.find((w) => w.id === id))
          .filter((w): w is Work => !!w && (w.status === 'selected' || w.status === 'announced' || w.status === 'screening_scheduled'));

        const existingWorkIds = new Set(session.screenings.map((sc) => sc.workId));
        const newWorks = validWorks.filter((w) => !existingWorkIds.has(w.id));

        const regionQuota = state.maxWorksPerRegion;
        const currentRegionCount: Record<string, number> = {};
        session.screenings.forEach((sc) => {
          const w = state.works.find((ww) => ww.id === sc.workId);
          if (w) currentRegionCount[w.region] = (currentRegionCount[w.region] || 0) + 1;
        });

        const categoryCount: Record<string, number> = {};
        session.screenings.forEach((sc) => {
          const w = state.works.find((ww) => ww.id === sc.workId);
          if (w) categoryCount[w.category] = (categoryCount[w.category] || 0) + 1;
        });

        const sortedWorks = [...newWorks].sort((a, b) => {
          const aRegionOver = (currentRegionCount[a.region] || 0) >= regionQuota;
          const bRegionOver = (currentRegionCount[b.region] || 0) >= regionQuota;
          if (aRegionOver !== bRegionOver) return aRegionOver ? 1 : -1;

          const maxPerCat = session.maxWorksPerCategory || state.maxWorksPerCategory;
          const aCatOver = (categoryCount[a.category] || 0) >= maxPerCat;
          const bCatOver = (categoryCount[b.category] || 0) >= maxPerCat;
          if (aCatOver !== bCatOver) return aCatOver ? 1 : -1;

          return a.duration - b.duration;
        });

        let totalDuration = session.screenings.reduce((acc, sc) => {
          const w = state.works.find((ww) => ww.id === sc.workId);
          return acc + (w?.duration || 0);
        }, 0);
        const maxDuration = session.maxDuration || 120;

        const selected: Work[] = [];
        for (const work of sortedWorks) {
          if (totalDuration + work.duration > maxDuration) {
            warnings.push(`时长超限跳过：「${work.title}」（${work.duration}分钟，总时长将达${totalDuration + work.duration}分钟）`);
            skipped.push({ workId: work.id, title: work.title, reason: '时长超限' });
            continue;
          }
          if ((currentRegionCount[work.region] || 0) >= regionQuota) {
            warnings.push(`地区名额已满跳过：「${work.title}」（${work.region}）`);
            skipped.push({ workId: work.id, title: work.title, reason: `${work.region}名额已满` });
            continue;
          }
          const maxPerCat = session.maxWorksPerCategory || state.maxWorksPerCategory;
          if ((categoryCount[work.category] || 0) >= maxPerCat) {
            warnings.push(`类别数量已满跳过：「${work.title}」`);
            skipped.push({ workId: work.id, title: work.title, reason: '类别配额已满' });
            continue;
          }

          selected.push(work);
          allocated.push({ workId: work.id, title: work.title });
          totalDuration += work.duration;
          currentRegionCount[work.region] = (currentRegionCount[work.region] || 0) + 1;
          categoryCount[work.category] = (categoryCount[work.category] || 0) + 1;
        }

        const timeParts = session.startTime.split(':');
        const startMinutes = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);
        let accDuration = session.screenings.reduce((acc, sc) => {
          const w = state.works.find((ww) => ww.id === sc.workId);
          return acc + (w?.duration || 0);
        }, 0);

        const newScreenings: Screening[] = selected.map((work, idx) => {
          const screeningTime = new Date();
          screeningTime.setHours(0, startMinutes + accDuration, 0, 0);
          const timeStr = `${String(screeningTime.getHours()).padStart(2, '0')}:${String(
            screeningTime.getMinutes()
          ).padStart(2, '0')}`;
          accDuration += work.duration;

          return {
            id: generateId('scr'),
            workId: work.id,
            date: session.date,
            time: timeStr,
            venue: session.venue,
            order: session.screenings.length + idx + 1,
            allocatedBy: 'region',
          };
        });

        appliedRules.push('region', 'category', 'duration');

        const before = JSON.stringify(session.screenings.map((sc) => sc.workId));

        set((s) => ({
          screeningSessions: s.screeningSessions.map((sess) =>
            sess.id === sessionId
              ? { ...sess, screenings: [...sess.screenings, ...newScreenings] }
              : sess
          ),
        }));

        const after = JSON.stringify([...session.screenings.map((sc) => sc.workId), ...newScreenings.map((sc) => sc.workId)]);
        const log: SchedulingLog = {
          id: generateId('log'),
          sessionId,
          action: 'allocate',
          detail: `智能分配 ${newScreenings.length} 部作品，应用规则：类别、时长、地区名额`,
          operator: state.currentUser,
          createdAt: new Date().toISOString(),
          beforeState: before,
          afterState: after,
          allocationBasis: 'region',
        };
        set((s) => ({ schedulingLogs: [...s.schedulingLogs, log] }));

        return {
          sessionId,
          screenings: newScreenings,
          allocated,
          skipped,
          warnings,
          appliedRules,
        };
      },

      getAllocationWarnings: (sessionId) => {
        const state = get();
        const session = state.screeningSessions.find((s) => s.id === sessionId);
        const warnings: string[] = [];
        if (!session) return warnings;

        const maxPerCat = session.maxWorksPerCategory || state.maxWorksPerCategory;
        const maxPerRegion = state.maxWorksPerRegion;
        const maxDuration = session.maxDuration || 180;

        const categoryCount: Record<string, number> = {};
        const regionCount: Record<string, number> = {};
        let totalDuration = 0;

        session.screenings.forEach((sc) => {
          const w = state.works.find((ww) => ww.id === sc.workId);
          if (!w) return;
          categoryCount[w.category] = (categoryCount[w.category] || 0) + 1;
          if (w.region) regionCount[w.region] = (regionCount[w.region] || 0) + 1;
          totalDuration += w.duration;
        });

        for (const [catId, count] of Object.entries(categoryCount)) {
          if (count > maxPerCat) {
            const cat = state.categories.find((c) => c.id === catId);
            warnings.push(`${cat?.name || catId} 数量超限：${count} 部（上限 ${maxPerCat}）`);
          }
        }

        for (const [region, count] of Object.entries(regionCount)) {
          if (count > maxPerRegion) {
            warnings.push(`${region} 名额超限：${count} 部（上限 ${maxPerRegion}）`);
          }
        }

        if (totalDuration > maxDuration) {
          warnings.push(`总时长超限：${totalDuration} 分钟（上限 ${maxDuration} 分钟）`);
        }

        return warnings;
      },

      getSchedulingLogs: (sessionId) => {
        const logs = sessionId
          ? get().schedulingLogs.filter((l) => l.sessionId === sessionId)
          : get().schedulingLogs;
        return [...logs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      },

      getPipelineMilestones: (workId) => {
        const work = get().works.find((w) => w.id === workId);
        if (!work) return [];

        const milestones: PipelineMilestone[] = PIPELINE_STAGES.map((stage) => {
          const milestone: PipelineMilestone = {
            status: stage.key,
            label: stage.label,
          };

          const versions = get().getWorkVersions(workId);
          if (stage.key === 'pending') {
            milestone.timestamp = work.createdAt;
            milestone.operator = work.creator;
            milestone.note = '作品投递';
          }

          if (
            ['reviewing', 'selected', 'not_selected'].includes(stage.key) &&
            work.status !== 'pending'
          ) {
            const reviewVersion = versions.find(
              (v) => v.snapshot.status === stage.key ||
                (v.snapshot.status === 'reviewing' && stage.key === 'reviewing')
            );
            if (reviewVersion) {
              milestone.timestamp = reviewVersion.createdAt;
              milestone.operator = reviewVersion.changedBy;
            }
            if (work.status === stage.key) {
              milestone.timestamp = work.updatedAt;
            }
            if (stage.key === 'selected' && work.status === 'selected') {
              milestone.note = work.reviewComment;
            }
          }

          if (stage.key === 'announced' && get().resultsPublished) {
            if (work.status === 'announced' || work.status === 'screening_scheduled' || work.status === 'selected') {
              milestone.timestamp = work.frozenAt;
              milestone.note = '入围公示，作品资料冻结';
            }
          }

          if (stage.key === 'screening_scheduled') {
            const hasScreening = get().screeningSessions.some((s) =>
              s.screenings.some((sc) => sc.workId === workId)
            );
            if (hasScreening) {
              const sc = get().screeningSessions
                .flatMap((s) => s.screenings)
                .find((s) => s.workId === workId);
              milestone.timestamp = sc?.date;
              milestone.operator = '志愿者';
              milestone.note = `安排于 ${sc?.date} ${sc?.time} ${sc?.venue}`;
            }
          }

          return milestone;
        });

        return milestones;
      },

      getRegionQuotaUsage: (sessionId) => {
        const session = get().screeningSessions.find((s) => s.id === sessionId);
        const result: Record<Region, { used: number; quota: number }> = {} as Record<
          Region,
          { used: number; quota: number }
        >;
        REGIONS.forEach((r) => {
          result[r] = { used: 0, quota: 2 };
        });
        if (!session) return result;

        session.screenings.forEach((sc) => {
          const w = get().works.find((ww) => ww.id === sc.workId);
          if (w) result[w.region].used++;
        });
        return result;
      },

      getCategoryDistribution: (sessionId) => {
        const session = get().screeningSessions.find((s) => s.id === sessionId);
        const result: Record<string, number> = {};
        if (!session) return result;

        session.screenings.forEach((sc) => {
          const w = get().works.find((ww) => ww.id === sc.workId);
          if (w) result[w.category] = (result[w.category] || 0) + 1;
        });
        return result;
      },
    }),
    {
      name: 'film-festival-storage-v2',
    }
  )
);
