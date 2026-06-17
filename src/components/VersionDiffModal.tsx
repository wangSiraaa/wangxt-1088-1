import { useState } from 'react';
import { X, GitCompare, ChevronRight, Clock, User, ArrowRight, ArrowLeft, Diff } from 'lucide-react';
import { useFilmFestivalStore } from '@/store/useFilmFestivalStore';
import type { Work, WorkVersion } from '@/types';

interface VersionDiffModalProps {
  work: Work;
  onClose: () => void;
}

const fieldDisplayNames: Record<string, string> = {
  title: '作品标题', creator: '创作者', creatorEmail: '联系邮箱',
  category: '参赛分类', duration: '作品时长', description: '作品简介',
  coverUrl: '封面图片', videoUrl: '视频链接',
  copyrightAccepted: '版权声明', musicAuthorized: '配乐授权',
  subtitleUrl: '字幕文件', region: '作品地区',
  screeningMaterialUrl: '放映素材', posterUrl: '宣传海报',
  status: '作品状态', reviewScore: '评审评分', reviewComment: '评审意见',
};

const booleanDisplay = (v: unknown) => (v ? '✓ 已确认' : '✗ 未确认');
const categoryDisplay = (v: unknown, categories: { id: string; name: string }[]) => {
  const cat = categories.find((c) => c.id === v);
  return cat ? cat.name : String(v);
};

export default function VersionDiffModal({ work, onClose }: VersionDiffModalProps) {
  const { getWorkVersions, compareVersions, categories } = useFilmFestivalStore();
  const versions = getWorkVersions(work.id);

  const [leftVer, setLeftVer] = useState<number>(versions.length >= 2 ? versions[versions.length - 2]?.version || 1 : 1);
  const [rightVer, setRightVer] = useState<number>(versions[0]?.version || 1);
  const [showAll, setShowAll] = useState(false);

  const diffs = compareVersions(work.id, Math.min(leftVer, rightVer), Math.max(leftVer, rightVer));
  const isReversed = leftVer > rightVer;

  const displayValue = (field: string, val: unknown) => {
    if (val === undefined || val === null || val === '') return '—';
    if (field === 'copyrightAccepted' || field === 'musicAuthorized') return booleanDisplay(val);
    if (field === 'category') return categoryDisplay(val, categories);
    if (field === 'duration') return `${val} 分钟`;
    if (field === 'status') {
      const statusMap: Record<string, string> = {
        pending: '待评审', reviewing: '评审中', selected: '已入围',
        not_selected: '未入选', announced: '已公示', screening_scheduled: '已排片',
      };
      return statusMap[String(val)] || String(val);
    }
    if (typeof val === 'boolean') return booleanDisplay(val);
    if (typeof val === 'string' && val.startsWith('http')) {
      return (
        <a href={val} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline break-all">
          {val.length > 40 ? val.slice(0, 40) + '...' : val}
        </a>
      );
    }
    return String(val);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <GitCompare className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">版本对比</h3>
              <p className="text-sm text-gray-500 mt-0.5">《{work.title}》 - 共 {versions.length} 个版本</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-white/60"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">旧版本</label>
                <select
                  value={leftVer}
                  onChange={(e) => setLeftVer(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white"
                >
                  {versions.map((v) => (
                    <option key={v.id} value={v.version}>
                      v{v.version} - {new Date(v.createdAt).toLocaleString('zh-CN')}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pt-5">
                {isReversed ? (
                  <ArrowLeft className="w-5 h-5 text-red-500" />
                ) : (
                  <ArrowRight className="w-5 h-5 text-emerald-500" />
                )}
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">新版本</label>
                <select
                  value={rightVer}
                  onChange={(e) => setRightVer(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white"
                >
                  {versions.map((v) => (
                    <option key={v.id} value={v.version}>
                      v{v.version} - {new Date(v.createdAt).toLocaleString('zh-CN')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <label className="flex items-center space-x-2 pt-5 cursor-pointer">
              <input
                type="checkbox"
                checked={showAll}
                onChange={(e) => setShowAll(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-gray-600">显示全部字段</span>
            </label>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {versions.length < 2 ? (
            <div className="p-12 text-center">
              <Diff className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">只有一个版本，暂无可对比的修改</p>
            </div>
          ) : !diffs || diffs.length === 0 ? (
            <div className="p-12 text-center">
              <Diff className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                v{Math.min(leftVer, rightVer)} 与 v{Math.max(leftVer, rightVer)} 内容相同
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {diffs.map((diff, idx) => {
                const fieldName = fieldDisplayNames[diff.field] || diff.field;
                const [oldVal, newVal] = isReversed ? [diff.new, diff.old] : [diff.old, diff.new];
                return (
                  <div key={idx} className="p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-md">
                          {fieldName}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                        <div className="flex items-center space-x-2 text-xs text-red-600 font-medium mb-2">
                          <ArrowLeft className="w-3 h-3" />
                          <span>v{Math.min(leftVer, rightVer)}</span>
                        </div>
                        <div className="text-sm text-gray-700 break-words">
                          {displayValue(diff.field, oldVal)}
                        </div>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                        <div className="flex items-center space-x-2 text-xs text-emerald-600 font-medium mb-2">
                          <span>v{Math.max(leftVer, rightVer)}</span>
                          <ChevronRight className="w-3 h-3" />
                        </div>
                        <div className="text-sm text-gray-700 break-words">
                          {displayValue(diff.field, newVal)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {showAll && (
                <div className="p-5 border-t-2 border-gray-200 bg-gray-50/50">
                  <p className="text-sm font-medium text-gray-500 mb-4">未变更字段</p>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(versions.find((v) => v.version === Math.max(leftVer, rightVer))?.snapshot || {})
                      .filter(([key]) => !diffs.find((d) => d.field === key))
                      .map(([key, val]) => (
                        <div key={key} className="flex items-start space-x-2 text-sm">
                          <span className="text-gray-500 w-20 flex-shrink-0">
                            {fieldDisplayNames[key] || key}:
                          </span>
                          <span className="text-gray-700 break-all">
                            {typeof displayValue(key, val) === 'string'
                              ? (displayValue(key, val) as string).slice(0, 80)
                              : displayValue(key, val)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-5 border-t bg-gray-50">
          <p className="text-xs text-gray-500 mb-3 font-medium">版本历史</p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {versions.map((v: WorkVersion) => (
              <div
                key={v.id}
                className={`flex items-center justify-between p-3 rounded-lg transition ${
                  v.version === leftVer || v.version === rightVer
                    ? 'bg-purple-100 border border-purple-200'
                    : 'bg-white border border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="px-2 py-0.5 bg-gray-800 text-white text-xs font-bold rounded font-mono">
                    v{v.version}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{v.changeDescription}</p>
                    <div className="flex items-center space-x-3 text-xs text-gray-500 mt-0.5">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(v.createdAt).toLocaleString('zh-CN')}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>{v.changedBy}</span>
                      </span>
                    </div>
                  </div>
                </div>
                {v.diffFields.length > 0 && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {v.diffFields.length} 处变更
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
