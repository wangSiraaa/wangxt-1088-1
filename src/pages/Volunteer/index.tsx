import { useState, useMemo } from 'react';
import {
  Plus, Calendar, MapPin, Clock, Film, Trash2, GripVertical, ChevronDown, ChevronUp,
  Sparkles, AlertTriangle, CheckCircle2, XCircle, History, Users, BarChart3,
  LayoutGrid, Activity, User, TrendingUp, RefreshCw, Info, Map as MapIcon
} from 'lucide-react';
import { useFilmFestivalStore } from '@/store/useFilmFestivalStore';
import AddScreeningModal from './AddScreeningModal';
import SessionFormModal from './SessionFormModal';
import type { ScreeningSession, SchedulingLog } from '@/types';

const regionNames: Record<string, string> = {
  beijing: '北京', shanghai: '上海', guangzhou: '广州',
  chengdu: '成都', hangzhou: '杭州', shenzhen: '深圳',
  nanjing: '南京', wuhan: '武汉', xian: '西安',
};

type TabKey = 'schedule' | 'quotas' | 'logs';

export default function VolunteerPage() {
  const {
    screeningSessions,
    works,
    categories,
    schedulingLogs,
    addScreeningSession,
    updateScreeningSession,
    deleteScreeningSession,
    removeScreeningFromSession,
    getSelectedWorks,
    smartAllocateToSession,
    getAllocationWarnings,
    maxWorksPerCategory,
    maxWorksPerRegion,
  } = useFilmFestivalStore();

  const [activeTab, setActiveTab] = useState<TabKey>('schedule');
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [editingSession, setEditingSession] = useState<ScreeningSession | null>(null);
  const [showAddScreening, setShowAddScreening] = useState<string | null>(null);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [allocatingTo, setAllocatingTo] = useState<string | null>(null);

  const selectedWorks = getSelectedWorks();
  const unscheduledWorks = selectedWorks.filter(
    (w) => !screeningSessions.some((s) => s.screenings.some((scr) => scr.workId === w.id))
  );

  const toggleSession = (id: string) => {
    setExpandedSessions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleAddSession = () => { setEditingSession(null); setShowSessionForm(true); };
  const handleEditSession = (session: ScreeningSession) => {
    setEditingSession(session); setShowSessionForm(true);
  };
  const handleDeleteSession = (id: string) => {
    if (window.confirm('确定要删除这个放映场次吗？')) deleteScreeningSession(id);
  };
  const handleSaveSession = (data: { name: string; date: string; startTime: string; venue: string }) => {
    if (editingSession) updateScreeningSession(editingSession.id, data);
    else addScreeningSession(data);
    setShowSessionForm(false); setEditingSession(null);
  };
  const handleAddScreening = (sessionId: string, workId: string) => {
    useFilmFestivalStore.getState().addScreeningToSession(sessionId, workId);
    setShowAddScreening(null);
  };
  const handleSmartAllocate = async (sessionId: string) => {
    if (unscheduledWorks.length === 0) {
      alert('没有待排片的入围作品'); return;
    }
    setAllocatingTo(sessionId);
    const result = smartAllocateToSession(sessionId, unscheduledWorks.map((w) => w.id));
    setTimeout(() => {
      setAllocatingTo(null);
      const msg = [
        `成功排片：${result.allocated.length} 部`,
        result.skipped.length > 0 ? `跳过（配额满）：${result.skipped.length} 部` : null,
        result.warnings.length > 0 ? `提示：${result.warnings.length} 条` : null,
      ].filter(Boolean).join('｜');
      if (result.warnings.length > 0) {
        alert(`${msg}\n\n细节：\n${result.warnings.slice(0, 5).map((w) => '· ' + w).join('\n')}${
          result.warnings.length > 5 ? `\n...还有 ${result.warnings.length - 5} 条` : ''
        }`);
      } else {
        alert(msg);
      }
    }, 400);
  };

  const totalDuration = (session: ScreeningSession) =>
    session.screenings.reduce((t, scr) => t + (works.find((w) => w.id === scr.workId)?.duration || 0), 0);

  const sortedSessions = useMemo(
    () => [...screeningSessions].sort((a, b) =>
      a.date !== b.date ? a.date.localeCompare(b.date) : a.startTime.localeCompare(b.startTime)
    ),
    [screeningSessions]
  );

  const quotaAnalysis = useMemo(() => {
    return sortedSessions.map((session) => {
      const worksInSession = session.screenings
        .map((s) => works.find((w) => w.id === s.workId))
        .filter(Boolean) as typeof selectedWorks;

      const categoryCounts: Record<string, number> = {};
      const regionCounts: Record<string, number> = {};
      worksInSession.forEach((w) => {
        categoryCounts[w.category] = (categoryCounts[w.category] || 0) + 1;
        if (w.region) regionCounts[w.region] = (regionCounts[w.region] || 0) + 1;
      });

      const warnings = getAllocationWarnings(session.id);
      const duration = totalDuration(session);
      const maxDuration = session.maxDuration || 180;

      return {
        session,
        works: worksInSession,
        duration,
        maxDuration,
        durationRatio: duration / maxDuration,
        categoryCounts,
        regionCounts,
        warnings,
        categoryIssues: Object.entries(categoryCounts).filter(
          ([c, n]) => n > maxWorksPerCategory
        ).map(([c, n]) => ({ cat: c, count: n })),
        regionIssues: Object.entries(regionCounts).filter(
          ([r, n]) => n > maxWorksPerRegion
        ).map(([r, n]) => ({ region: r, count: n })),
      };
    });
  }, [sortedSessions, works, getAllocationWarnings, maxWorksPerCategory, maxWorksPerRegion]);

  const tabBg = (k: TabKey) => activeTab === k
    ? 'bg-white text-indigo-600 shadow-sm'
    : 'text-gray-600 hover:text-gray-800 hover:bg-white/40';

  const logActionLabels: Record<SchedulingLog['action'], { label: string; color: string; icon: JSX.Element }> = {
    add: { label: '添加作品', color: 'text-emerald-600 bg-emerald-50', icon: <Plus className="w-3 h-3" /> },
    remove: { label: '移除作品', color: 'text-red-600 bg-red-50', icon: <Trash2 className="w-3 h-3" /> },
    reorder: { label: '调整顺序', color: 'text-blue-600 bg-blue-50', icon: <GripVertical className="w-3 h-3" /> },
    allocate: { label: '智能分配', color: 'text-purple-600 bg-purple-50', icon: <Sparkles className="w-3 h-3" /> },
    create: { label: '新建场次', color: 'text-indigo-600 bg-indigo-50', icon: <Calendar className="w-3 h-3" /> },
    update: { label: '编辑场次', color: 'text-amber-600 bg-amber-50', icon: <RefreshCw className="w-3 h-3" /> },
    delete: { label: '删除场次', color: 'text-rose-600 bg-rose-50', icon: <XCircle className="w-3 h-3" /> },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">放映安排</h2>
          <p className="text-gray-500 mt-1">
            智能配额排片 · 按类别/时长/地区自动二次分配 · 保留全部调整痕迹
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleAddSession}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>新建场次</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">放映场次</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{screeningSessions.length}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">入围作品</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{selectedWorks.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Film className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">已排片/待排</p>
              <p className="text-3xl font-bold mt-1">
                <span className="text-purple-600">
                  {selectedWorks.length - unscheduledWorks.length}
                </span>
                <span className="text-gray-300 mx-1">/</span>
                <span className="text-amber-500 text-2xl">{unscheduledWorks.length}</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <LayoutGrid className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">操作日志</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{schedulingLogs.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <History className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 inline-flex w-max">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-5 py-2 rounded-xl text-sm font-medium transition-all flex items-center space-x-2 ${tabBg('schedule')}`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>排片安排</span>
        </button>
        <button
          onClick={() => setActiveTab('quotas')}
          className={`px-5 py-2 rounded-xl text-sm font-medium transition-all flex items-center space-x-2 ${tabBg('quotas')}`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>配额监控</span>
          {quotaAnalysis.some((q) => q.warnings.length > 0) && (
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-5 py-2 rounded-xl text-sm font-medium transition-all flex items-center space-x-2 ${tabBg('logs')}`}
        >
          <Activity className="w-4 h-4" />
          <span>调整痕迹</span>
        </button>
      </div>

      {activeTab === 'schedule' && (
        <>
          {unscheduledWorks.length > 0 && screeningSessions.length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-5 flex items-start space-x-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                <Sparkles className="w-6 h-6 text-purple-500" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-purple-800 text-lg">
                  ✨ 有 {unscheduledWorks.length} 部入围作品待排片
                </p>
                <p className="text-sm text-purple-600 mt-1">
                  智能分配将按「地区名额优先 → 类别配额平衡 → 时长约束」自动二次分配，
                  同主题作品不会挤在同一场次
                </p>
              </div>
              <div className="flex flex-col space-y-2 pt-1">
                {sortedSessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSmartAllocate(s.id)}
                    disabled={allocatingTo === s.id}
                    className="px-4 py-2 bg-white text-purple-700 rounded-xl text-sm font-medium hover:bg-purple-100 transition-colors shadow-sm border border-purple-200 disabled:opacity-60 flex items-center space-x-1.5"
                  >
                    {allocatingTo === s.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>智能分配至「{s.name}」</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {sortedSessions.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 text-center shadow-sm">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">暂无放映场次</h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                创建放映场次后，可使用智能分配功能自动安排入围作品，
                系统会自动平衡类别、时长和地区配额
              </p>
              <button
                onClick={handleAddSession}
                className="inline-flex items-center space-x-2 bg-indigo-600 text-white px-8 py-3.5 rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-lg shadow-indigo-500/20"
              >
                <Plus className="w-5 h-5" />
                <span>新建场次</span>
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {sortedSessions.map((session) => {
                const isExpanded = expandedSessions.has(session.id);
                const total = totalDuration(session);
                const analysis = quotaAnalysis.find((q) => q.session.id === session.id);
                const hasIssues = analysis && analysis.warnings.length > 0;

                return (
                  <div
                    key={session.id}
                    className={`bg-white rounded-2xl shadow-sm overflow-hidden border transition-all ${
                      hasIssues ? 'border-amber-200 ring-1 ring-amber-100' : 'border-gray-100'
                    }`}
                  >
                    <div
                      className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition-colors"
                      onClick={() => toggleSession(session.id)}
                    >
                      <div className="flex items-center space-x-4 min-w-0">
                        <button className="text-gray-300 hover:text-gray-500 cursor-grab p-2">
                          <GripVertical className="w-5 h-5" />
                        </button>
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-sm">
                          <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-bold text-gray-800 text-lg truncate">{session.name}</h3>
                            {hasIssues && (
                              <span className="flex items-center space-x-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium flex-shrink-0">
                                <AlertTriangle className="w-3 h-3" />
                                <span>{analysis!.warnings.length} 项配额提示</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{session.date}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{session.startTime}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{session.venue}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-5 flex-shrink-0">
                        <div className="text-right">
                          <div className="flex items-center justify-end space-x-2 mb-1">
                            <p className="text-sm text-gray-500">
                              {session.screenings.length} 部作品
                            </p>
                          </div>
                          <div className="flex items-center justify-end space-x-2">
                            <p className="text-sm font-bold text-indigo-600">
                              {total} 分钟
                            </p>
                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  analysis && analysis.durationRatio > 0.9
                                    ? 'bg-red-500'
                                    : analysis && analysis.durationRatio > 0.7
                                    ? 'bg-amber-500'
                                    : 'bg-indigo-500'
                                }`}
                                style={{
                                  width: `${Math.min(100, ((analysis?.durationRatio || 0) * 100)).toFixed(0)}%`
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-400 w-8">
                              / {session.maxDuration || 180}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditSession(session);
                            }}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="编辑场次"
                          >
                            <Plus className="w-5 h-5 rotate-45" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSmartAllocate(session.id);
                            }}
                            disabled={allocatingTo === session.id || unscheduledWorks.length === 0}
                            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title="智能分配"
                          >
                            {allocatingTo === session.id ? (
                              <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : (
                              <Sparkles className="w-5 h-5" />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSession(session.id);
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="删除场次"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t">
                        {hasIssues && (
                          <div className="mx-5 mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                            <p className="text-sm font-semibold text-amber-800 mb-2 flex items-center space-x-2">
                              <Info className="w-4 h-4" />
                              <span>配额与约束提示</span>
                            </p>
                            <ul className="text-xs text-amber-700 space-y-1">
                              {analysis!.warnings.slice(0, 4).map((w, i) => (
                                <li key={i} className="flex items-start space-x-2">
                                  <span>·</span>
                                  <span>{w}</span>
                                </li>
                              ))}
                              {analysis!.warnings.length > 4 && (
                                <li className="opacity-70">……还有 {analysis!.warnings.length - 4} 项提示</li>
                              )}
                            </ul>
                          </div>
                        )}

                        {session.screenings.length === 0 ? (
                          <div className="p-10 text-center">
                            <Film className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 mb-5">暂无排片作品</p>
                            <div className="flex items-center justify-center space-x-3">
                              <button
                                onClick={() => setShowAddScreening(session.id)}
                                className="px-5 py-2 border-2 border-indigo-300 text-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-50 transition-colors"
                              >
                                + 手动添加
                              </button>
                              {unscheduledWorks.length > 0 && (
                                <button
                                  onClick={() => handleSmartAllocate(session.id)}
                                  disabled={allocatingTo === session.id}
                                  className="px-5 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center space-x-1.5"
                                >
                                  <Sparkles className="w-4 h-4" />
                                  <span>智能分配 {unscheduledWorks.length} 部</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="divide-y">
                              {session.screenings.map((scr, index) => {
                                const work = works.find((w) => w.id === scr.workId);
                                if (!work) return null;
                                const category = categories.find((c) => c.id === work.category);

                                return (
                                  <div
                                    key={scr.id}
                                    className="px-5 py-4 flex items-center space-x-4 hover:bg-gray-50/70 transition-colors"
                                  >
                                    <div className="text-gray-300 cursor-grab p-1.5 hover:text-gray-500 hover:bg-gray-100 rounded-md transition-colors">
                                      <GripVertical className="w-4 h-4" />
                                    </div>
                                    <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center text-sm font-bold text-gray-600 shadow-sm">
                                      {String(index + 1).padStart(2, '0')}
                                    </div>
                                    <div className="w-16 h-10 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                                      <img
                                        src={work.coverUrl}
                                        alt={work.title}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center flex-wrap gap-2">
                                        <h4 className="font-semibold text-gray-800 truncate">{work.title}</h4>
                                        {category && (
                                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${category.color} text-white font-medium`}>
                                            {category.name}
                                          </span>
                                        )}
                                        {work.region && (
                                          <span className="inline-flex items-center space-x-1 text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-medium">
                                            <MapIcon className="w-2.5 h-2.5" />
                                            <span>{regionNames[work.region] || work.region}</span>
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-sm text-gray-500 mt-0.5">
                                        {work.creator} · {work.duration} 分钟
                                      </p>
                                    </div>
                                    <div className="flex items-center space-x-4 flex-shrink-0">
                                      <div className="text-right">
                                        <p className="text-sm text-gray-400">放映时间</p>
                                        <p className="text-sm font-semibold text-gray-700">{scr.time}</p>
                                      </div>
                                      <button
                                        onClick={() => removeScreeningFromSession(session.id, scr.id)}
                                        className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="移除"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="px-5 py-4 border-t bg-gray-50/60 flex items-center justify-between">
                              <div className="text-xs text-gray-500 flex items-center space-x-2">
                                <Users className="w-3.5 h-3.5" />
                                <span>
                                  已排 {session.screenings.length} 部 / 共 {selectedWorks.length} 部入围
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => setShowAddScreening(session.id)}
                                  className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 text-sm font-medium hover:border-indigo-400 hover:text-indigo-600 hover:bg-white transition-colors flex items-center space-x-1.5"
                                >
                                  <Plus className="w-4 h-4" />
                                  <span>手动添加</span>
                                </button>
                                {unscheduledWorks.length > 0 && (
                                  <button
                                    onClick={() => handleSmartAllocate(session.id)}
                                    disabled={allocatingTo === session.id}
                                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl text-sm font-medium hover:shadow-md transition-all disabled:opacity-50 flex items-center space-x-1.5"
                                  >
                                    {allocatingTo === session.id ? (
                                      <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Sparkles className="w-4 h-4" />
                                    )}
                                    <span>智能分配剩余 {unscheduledWorks.length} 部</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'quotas' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">配额与约束实时监控</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    单场配额：每类 ≤ {maxWorksPerCategory} 部 · 每地区 ≤ {maxWorksPerRegion} 部 · 默认总时长 ≤ 180 分钟
                  </p>
                </div>
              </div>
            </div>

            {sortedSessions.length === 0 ? (
              <div className="p-16 text-center">
                <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">请先创建放映场次</p>
              </div>
            ) : (
              <div className="divide-y">
                {quotaAnalysis.map((q) => (
                  <div key={q.session.id} className="p-5 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-gray-800">{q.session.name}</h4>
                          {q.warnings.length > 0 && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium flex items-center space-x-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{q.warnings.length} 项告警</span>
                            </span>
                          )}
                          {q.warnings.length === 0 && q.session.screenings.length > 0 && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>配额健康</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {q.session.date} {q.session.startTime} · {q.session.venue}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-indigo-600">
                          {q.duration}
                          <span className="text-sm font-normal text-gray-400 ml-1">
                            / {q.maxDuration} 分钟
                          </span>
                        </p>
                        <div className="w-32 h-2.5 bg-gray-100 rounded-full overflow-hidden mt-1.5">
                          <div
                            className={`h-full rounded-full transition-all ${
                              q.durationRatio > 0.9
                                ? 'bg-gradient-to-r from-red-500 to-rose-500'
                                : q.durationRatio > 0.7
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                                : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                            }`}
                            style={{ width: `${Math.min(100, q.durationRatio * 100).toFixed(0)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-2.5 flex items-center space-x-1.5">
                          <Film className="w-3.5 h-3.5" />
                          <span>类别配额使用情况（上限 {maxWorksPerCategory} / 类）</span>
                        </p>
                        <div className="space-y-2">
                          {categories.map((cat) => {
                            const count = q.categoryCounts[cat.id] || 0;
                            const ratio = count / maxWorksPerCategory;
                            const over = count > maxWorksPerCategory;
                            return (
                              <div key={cat.id} className="flex items-center space-x-3">
                                <div className={`w-2 h-2 rounded-full ${cat.color}`} />
                                <span className="text-xs text-gray-600 w-16 truncate">
                                  {cat.name}
                                </span>
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      over
                                        ? 'bg-red-500'
                                        : ratio > 0.7
                                        ? 'bg-amber-500'
                                        : cat.color
                                    }`}
                                    style={{
                                      width: `${Math.min(100, ratio * 100).toFixed(0)}%`
                                    }}
                                  />
                                </div>
                                <span
                                  className={`text-xs font-bold w-10 text-right ${
                                    over ? 'text-red-600' : 'text-gray-700'
                                  }`}
                                >
                                  {count}/{maxWorksPerCategory}
                                </span>
                                {over && (
                                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-2.5 flex items-center space-x-1.5">
                          <MapIcon className="w-3.5 h-3.5" />
                          <span>地区名额使用情况（上限 {maxWorksPerRegion} / 地区）</span>
                        </p>
                        <div className="space-y-2">
                          {Object.entries(regionNames).map(([code, name]) => {
                            const count = q.regionCounts[code] || 0;
                            const ratio = count / maxWorksPerRegion;
                            const over = count > maxWorksPerRegion;
                            return (
                              <div key={code} className="flex items-center space-x-3">
                                <MapIcon className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-xs text-gray-600 w-16 truncate">{name}</span>
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      over
                                        ? 'bg-red-500'
                                        : ratio > 0.7
                                        ? 'bg-amber-500'
                                        : 'bg-blue-500'
                                    }`}
                                    style={{
                                      width: `${Math.min(100, ratio * 100).toFixed(0)}%`
                                    }}
                                  />
                                </div>
                                <span
                                  className={`text-xs font-bold w-10 text-right ${
                                    over ? 'text-red-600' : 'text-gray-700'
                                  }`}
                                >
                                  {count}/{maxWorksPerRegion}
                                </span>
                                {over && (
                                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {q.warnings.length > 0 && (
                      <div className="mt-4 p-4 bg-amber-50/70 rounded-xl border border-amber-200/60">
                        <p className="text-xs font-semibold text-amber-800 mb-2">⚠️ 具体告警信息</p>
                        <ul className="grid md:grid-cols-2 gap-y-1">
                          {q.warnings.map((w, i) => (
                            <li key={i} className="text-xs text-amber-700 flex items-start space-x-1.5">
                              <span className="mt-0.5">·</span>
                              <span>{w}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-200">
              <div className="flex items-center space-x-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-emerald-800">智能分配算法说明</h4>
              </div>
              <ol className="text-xs text-emerald-700 space-y-1.5 list-decimal list-inside">
                <li>优先筛掉<strong>地区名额已满</strong>的作品</li>
                <li>再筛掉<strong>分类配额超了</strong>的作品</li>
                <li>最后检查<strong>总时长是否超限</strong></li>
                <li>同主题按<strong>地区溢出优先</strong>重排</li>
              </ol>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-200">
              <div className="flex items-center space-x-2 mb-3">
                <Info className="w-5 h-5 text-blue-600" />
                <h4 className="font-bold text-blue-800">配额调整建议</h4>
              </div>
              <p className="text-xs text-blue-700 leading-relaxed">
                如果配额紧张，可以新建同主题的第二场次分散作品，
                或在编辑场次时提高 <code>maxDuration</code> 放宽时长。
              </p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200">
              <div className="flex items-center space-x-2 mb-3">
                <TrendingUp className="w-5 h-5 text-amber-600" />
                <h4 className="font-bold text-amber-800">数据概览</h4>
              </div>
              <div className="text-xs text-amber-700 space-y-1">
                <p>告警场次：{quotaAnalysis.filter((q) => q.warnings.length > 0).length}</p>
                <p>总排片时长：{quotaAnalysis.reduce((s, q) => s + q.duration, 0)} 分钟</p>
                <p>覆盖地区：{new Set(works.filter((w) => w.region).map((w) => w.region)).size} 个</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b bg-gradient-to-r from-gray-50 to-slate-50 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <History className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">排片调整痕迹</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  所有排片操作均已记录，共 {schedulingLogs.length} 条日志
                </p>
              </div>
            </div>
          </div>

          {schedulingLogs.length === 0 ? (
            <div className="p-16 text-center">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">暂无操作记录，开始排片后将自动生成日志</p>
            </div>
          ) : (
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {[...schedulingLogs].reverse().map((log) => {
                const cfg = logActionLabels[log.action];
                const session = screeningSessions.find((s) => s.id === log.sessionId);
                const work = log.workId ? works.find((w) => w.id === log.workId) : null;

                return (
                  <div key={log.id} className="px-5 py-4 hover:bg-gray-50/60 transition-colors">
                    <div className="flex items-start space-x-4">
                      <div
                        className={`p-2 rounded-xl ${cfg.color} flex-shrink-0`}
                      >
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div>
                            <div className="flex items-center space-x-2 flex-wrap">
                              <span className="font-semibold text-gray-800">{cfg.label}</span>
                              {work && (
                                <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-700">
                                  <Film className="w-3 h-3" />
                                  <span className="truncate max-w-[180px]">{work.title}</span>
                                </span>
                              )}
                              {session && (
                                <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 bg-indigo-50 rounded text-xs text-indigo-700">
                                  <Calendar className="w-3 h-3" />
                                  <span>{session.name}</span>
                                </span>
                              )}
                              {log.allocationBasis && (
                                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs font-medium">
                                  依据：
                                  {log.allocationBasis === 'manual' ? '手动'
                                    : log.allocationBasis === 'category' ? '分类配额'
                                    : log.allocationBasis === 'duration' ? '时长约束'
                                    : '地区名额'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-1.5">
                              <span className="text-xs text-gray-500 flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{new Date(log.createdAt).toLocaleString('zh-CN')}</span>
                              </span>
                              <span className="text-xs text-gray-500 flex items-center space-x-1">
                                <User className="w-3 h-3" />
                                <span>{log.operator}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {(log.beforeState || log.afterState) && (
                          <div className="mt-3 grid md:grid-cols-2 gap-3">
                            {log.beforeState && (
                              <div className="p-3 bg-red-50/60 rounded-lg border border-red-100">
                                <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wide mb-1">
                                  调整前
                                </p>
                                <p className="text-xs text-red-700 break-all line-clamp-3">
                                  {log.beforeState}
                                </p>
                              </div>
                            )}
                            {log.afterState && (
                              <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-100">
                                <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide mb-1">
                                  调整后
                                </p>
                                <p className="text-xs text-emerald-700 break-all line-clamp-3">
                                  {log.afterState}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {log.detail && (
                          <div className="mt-2.5 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-xs text-gray-600">💡 {log.detail}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showSessionForm && (
        <SessionFormModal
          session={editingSession}
          onClose={() => { setShowSessionForm(false); setEditingSession(null); }}
          onSave={handleSaveSession}
        />
      )}

      {showAddScreening && (
        <AddScreeningModal
          sessionId={showAddScreening}
          onClose={() => setShowAddScreening(null)}
          onAdd={handleAddScreening}
        />
      )}
    </div>
  );
}
