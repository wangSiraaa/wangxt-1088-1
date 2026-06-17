export type WorkStatus =
  | 'pending'
  | 'reviewing'
  | 'selected'
  | 'not_selected'
  | 'announced'
  | 'screening_scheduled';

export type Region = '华北' | '华东' | '华南' | '华中' | '西南' | '西北' | '东北' | '港澳台' | '海外';

export type AllocationBasis = 'manual' | 'category' | 'duration' | 'region';

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
  musicAuthorized: boolean;
  subtitleUrl: string;
  region: Region;
  screeningMaterialUrl: string;
  posterUrl: string;
  status: WorkStatus;
  reviewComment?: string;
  reviewScore?: number;
  createdAt: string;
  updatedAt: string;
  version: number;
  frozenAt?: string;
}

export type WorkSnapshot = Omit<Work, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'frozenAt'>;

export interface WorkVersion {
  id: string;
  workId: string;
  version: number;
  snapshot: WorkSnapshot;
  changeDescription: string;
  createdAt: string;
  changedBy: string;
  diffFields: string[];
}

export interface Category {
  id: string;
  name: string;
  description: string;
  maxDuration: number;
  color: string;
  regionQuota: number;
}

export interface Screening {
  id: string;
  workId: string;
  date: string;
  time: string;
  venue: string;
  order: number;
  allocatedBy: AllocationBasis;
}

export interface ScreeningSession {
  id: string;
  name: string;
  date: string;
  startTime: string;
  venue: string;
  theme: string;
  screenings: Screening[];
  maxWorksPerCategory?: number;
  maxDuration?: number;
}

export interface SchedulingLog {
  id: string;
  sessionId: string;
  action: 'add' | 'remove' | 'reorder' | 'allocate';
  workId?: string;
  detail: string;
  operator: string;
  createdAt: string;
  beforeState?: string;
  afterState?: string;
  allocationBasis?: AllocationBasis;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
}

export interface AllocationResult {
  sessionId: string;
  screenings: Screening[];
  warnings: string[];
  appliedRules: AllocationBasis[];
}

export interface PipelineMilestone {
  status: WorkStatus;
  label: string;
  timestamp?: string;
  operator?: string;
  note?: string;
}

export type UserRole = 'creator' | 'judge' | 'volunteer';

export const PIPELINE_STAGES: { key: WorkStatus; label: string }[] = [
  { key: 'pending', label: '投递' },
  { key: 'reviewing', label: '复审' },
  { key: 'selected', label: '入围' },
  { key: 'announced', label: '公示' },
  { key: 'screening_scheduled', label: '放映安排' },
];

export const REGIONS: Region[] = [
  '华北', '华东', '华南', '华中', '西南', '西北', '东北', '港澳台', '海外',
];

export const SUBMISSION_REQUIRED_FIELDS = [
  { key: 'copyrightAccepted', label: '版权声明', type: 'boolean', required: true },
  { key: 'musicAuthorized', label: '配乐授权', type: 'boolean', required: true },
  { key: 'subtitleUrl', label: '字幕文件', type: 'string', required: true },
  { key: 'region', label: '作品地区', type: 'region', required: true },
] as const;

export const FROZEN_FIELDS: (keyof Work)[] = [
  'title', 'creator', 'creatorEmail', 'category', 'duration',
  'description', 'coverUrl', 'videoUrl', 'copyrightAccepted',
  'musicAuthorized', 'subtitleUrl', 'region',
];

export const ALLOWED_AFTER_FREEZE: (keyof Work)[] = [
  'screeningMaterialUrl', 'posterUrl',
];
