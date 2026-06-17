import { Clock, CheckCircle2, Circle, Calendar, Film, Users, Award, Megaphone, Play, User, AlertCircle } from 'lucide-react';
import { useFilmFestivalStore } from '@/store/useFilmFestivalStore';
import type { Work, WorkStatus, PipelineMilestone } from '@/types';
import { PIPELINE_STAGES } from '@/types';

interface PipelineViewProps {
  work: Work;
  compact?: boolean;
}

const statusIcons: Record<WorkStatus, React.ReactNode> = {
  pending: <Film className="w-4 h-4" />,
  reviewing: <Users className="w-4 h-4" />,
  selected: <Award className="w-4 h-4" />,
  not_selected: <AlertCircle className="w-4 h-4" />,
  announced: <Megaphone className="w-4 h-4" />,
  screening_scheduled: <Play className="w-4 h-4" />,
};

const statusColors: Record<WorkStatus, { bg: string; border: string; text: string; ring: string }> = {
  pending: { bg: 'bg-yellow-500', border: 'border-yellow-200', text: 'text-yellow-700', ring: 'ring-yellow-200' },
  reviewing: { bg: 'bg-blue-500', border: 'border-blue-200', text: 'text-blue-700', ring: 'ring-blue-200' },
  selected: { bg: 'bg-emerald-500', border: 'border-emerald-200', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  not_selected: { bg: 'bg-gray-400', border: 'border-gray-200', text: 'text-gray-600', ring: 'ring-gray-200' },
  announced: { bg: 'bg-purple-500', border: 'border-purple-200', text: 'text-purple-700', ring: 'ring-purple-200' },
  screening_scheduled: { bg: 'bg-indigo-500', border: 'border-indigo-200', text: 'text-indigo-700', ring: 'ring-indigo-200' },
};

export default function PipelineView({ work, compact = false }: PipelineViewProps) {
  const { getPipelineMilestones, isWorkFrozen } = useFilmFestivalStore();
  const milestones = getPipelineMilestones(work.id);
  const frozen = isWorkFrozen(work);

  const currentIdx = PIPELINE_STAGES.findIndex((s) => s.key === work.status);

  const formatTime = (ts?: string) => {
    if (!ts) return null;
    const d = new Date(ts);
    return (
      <span className="text-xs text-gray-500 flex items-center space-x-1">
        <Calendar className="w-3 h-3" />
        <span>{d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</span>
      </span>
    );
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-1 overflow-x-auto pb-1">
        {PIPELINE_STAGES.map((stage, idx) => {
          const isCurrent = work.status === stage.key;
          const isPast = currentIdx !== -1 && idx < currentIdx;
          const milestone = milestones.find((m) => m.status === stage.key);
          const colors = statusColors[stage.key];

          return (
            <div key={stage.key} className="flex items-center">
              <div
                className={`relative flex flex-col items-center ${
                  isCurrent ? 'scale-105' : ''
                } transition-transform`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-white transition-all ${
                    isPast || isCurrent
                      ? colors.bg + ' shadow-md ring-2 ' + colors.ring
                      : 'bg-gray-200'
                  }`}
                >
                  {isPast || isCurrent ? statusIcons[stage.key] : <Circle className="w-3 h-3 text-gray-400" />}
                </div>
                <span
                  className={`text-[10px] mt-1 whitespace-nowrap font-medium ${
                    isCurrent ? colors.text : isPast ? 'text-gray-600' : 'text-gray-400'
                  }`}
                >
                  {stage.label}
                </span>
              </div>
              {idx < PIPELINE_STAGES.length - 1 && (
                <div
                  className={`w-8 h-0.5 mx-0.5 mb-5 ${
                    idx < currentIdx ? statusColors[PIPELINE_STAGES[idx + 1].key].bg : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="p-5 border-b bg-gradient-to-r from-indigo-50 to-purple-50 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
            <Clock className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h4 className="font-bold text-gray-800">作品评审流程</h4>
            <p className="text-sm text-gray-500">实时追踪作品处理进度</p>
          </div>
        </div>
        {frozen && (
          <div className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>资料已冻结</span>
          </div>
        )}
      </div>

      <div className="p-5 relative">
        <div className="absolute left-[30px] top-12 bottom-12 w-0.5 bg-gradient-to-b from-indigo-200 via-purple-200 to-pink-200" />

        <div className="space-y-6">
          {PIPELINE_STAGES.map((stage, idx) => {
            const milestone: PipelineMilestone | undefined = milestones.find(
              (m) => m.status === stage.key
            );
            const isCurrent = work.status === stage.key;
            const isPast = currentIdx !== -1 && idx < currentIdx;
            const isSkipped =
              work.status === 'not_selected' && idx > PIPELINE_STAGES.findIndex((s) => s.key === 'not_selected');
            const colors = statusColors[stage.key];

            const isActive = isCurrent || isPast;
            const isRelevant = !isSkipped;

            if (!isRelevant) return null;

            return (
              <div
                key={stage.key}
                className={`relative flex items-start space-x-4 transition-all ${
                  isCurrent ? 'animate-pulse-once' : ''
                }`}
              >
                <div
                  className={`relative z-10 w-[60px] h-[60px] rounded-2xl flex items-center justify-center transition-all shadow-lg ${
                    isActive
                      ? `${colors.bg} text-white ring-4 ring-white`
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isActive ? statusIcons[stage.key] : <Circle className="w-6 h-6" />}
                </div>

                <div className="flex-1 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h5
                        className={`font-bold text-base ${
                          isActive ? 'text-gray-900' : 'text-gray-400'
                        }`}
                      >
                        {stage.label}
                      </h5>
                      {isCurrent && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors.bg} text-white`}
                        >
                          当前
                        </span>
                      )}
                      {isPast && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>完成</span>
                        </span>
                      )}
                    </div>
                    {formatTime(milestone?.timestamp)}
                  </div>

                  {milestone?.note && (
                    <div
                      className={`mt-2 p-3 rounded-xl text-sm ${
                        isActive
                          ? colors.bg + '/10 border ' + colors.border
                          : 'bg-gray-50 text-gray-500 border border-gray-100'
                      }`}
                    >
                      {milestone.note}
                    </div>
                  )}

                  {milestone?.operator && (
                    <p className="text-xs text-gray-400 mt-1.5 flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span>处理人：{milestone.operator}</span>
                    </p>
                  )}

                  {!isActive && !milestone?.note && (
                    <p className="text-sm text-gray-400 mt-1 italic">等待处理中...</p>
                  )}
                </div>
              </div>
            );
          })}

          {work.status === 'not_selected' && (
            <div className="ml-[76px] pt-4 border-t border-gray-100">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500">
                  感谢你的投稿！本次未入选不代表作品不优秀，期待你继续参与后续活动。
                </p>
                {work.reviewComment && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">评审意见</p>
                    <p className="text-sm text-gray-700">{work.reviewComment}</p>
                    {work.reviewScore !== undefined && (
                      <p className="text-sm font-semibold text-gray-600 mt-2">
                        评分：{work.reviewScore.toFixed(1)} / 10
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
