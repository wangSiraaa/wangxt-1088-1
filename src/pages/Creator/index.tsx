import { useState } from 'react';
import { Plus, Edit, Trash2, Film, Clock, AlertCircle, CheckCircle, XCircle, Lock, Unlock, ShieldCheck, Music, Subtitles, MapPin, History } from 'lucide-react';
import { useFilmFestivalStore } from '@/store/useFilmFestivalStore';
import WorkForm from './WorkForm';
import PipelineView from '@/components/PipelineView';
import VersionDiffModal from '@/components/VersionDiffModal';
import type { Work } from '@/types';

const statusConfig = {
  pending: { label: '待评审', color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-4 h-4" /> },
  reviewing: { label: '评审中', color: 'bg-blue-100 text-blue-700', icon: <Film className="w-4 h-4" /> },
  selected: { label: '已入围', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-4 h-4" /> },
  not_selected: { label: '未入选', color: 'bg-gray-100 text-gray-600', icon: <XCircle className="w-4 h-4" /> },
  announced: { label: '已公示', color: 'bg-purple-100 text-purple-700', icon: <CheckCircle className="w-4 h-4" /> },
  screening_scheduled: { label: '已排片', color: 'bg-indigo-100 text-indigo-700', icon: <Film className="w-4 h-4" /> },
};

export default function CreatorPage() {
  const { works, categories, canEditWork, canFieldEditAfterFreeze, deleteWork, resultsPublished, validateSubmission, isWorkFrozen, getWorkVersions } = useFilmFestivalStore();
  const [showForm, setShowForm] = useState(false);
  const [editingWork, setEditingWork] = useState<Work | null>(null);
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [diffingWork, setDiffingWork] = useState<Work | null>(null);

  const handleEdit = (work: Work) => {
    const frozen = isWorkFrozen(work);
    const canEditBasic = canEditWork(work);
    const canSupplement = frozen && (
      (canFieldEditAfterFreeze(work, 'screeningMaterialUrl') && !work.screeningMaterialUrl) ||
      (canFieldEditAfterFreeze(work, 'posterUrl') && !work.posterUrl)
    );
    if (!canEditBasic && !canSupplement) {
      return;
    }
    setEditingWork(work);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingWork(null);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这个作品吗？')) {
      deleteWork(id);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingWork(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">我的作品</h2>
          <p className="text-gray-500 mt-1">管理你提交的所有短片作品，查看评审进度</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center space-x-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>上传作品</span>
        </button>
      </div>

      {resultsPublished && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-5 flex items-start space-x-4">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
            <CheckCircle className="w-6 h-6 text-purple-500" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-purple-800 text-lg">🎬 入围结果已公布</p>
            <p className="text-sm text-purple-600 mt-1">
              入围作品的核心资料已锁定，无法修改；但仍可补交放映素材和宣传海报。
            </p>
          </div>
        </div>
      )}

      {selectedWork && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b bg-gradient-to-r from-indigo-50 to-purple-50 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Film className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">《{selectedWork.title}》评审进度</h3>
                <p className="text-sm text-gray-500">实时追踪作品全流程状态</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedWork(null)}
              className="text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-white/60 text-sm font-medium transition-colors"
            >
              收起
            </button>
          </div>
          <div className="p-5">
            <PipelineView work={selectedWork} />
          </div>
        </div>
      )}

      {works.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-sm">
          <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Film className="w-10 h-10 text-indigo-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">还没有作品</h3>
          <p className="text-gray-400 mb-8 max-w-sm mx-auto">
            投稿需要同时上传作品、确认版权声明、提供配乐授权和字幕文件
          </p>
          <button
            onClick={handleAdd}
            className="inline-flex items-center space-x-2 bg-indigo-600 text-white px-8 py-3.5 rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-5 h-5" />
            <span>立即投稿</span>
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {works.map((work) => {
            const category = categories.find((c) => c.id === work.category);
            const status = statusConfig[work.status];
            const canEditBasic = canEditWork(work);
            const frozen = isWorkFrozen(work);
            const validation = validateSubmission(work);
            const versions = getWorkVersions(work.id);
            const needsSupplement = frozen && (
              (canFieldEditAfterFreeze(work, 'screeningMaterialUrl') && !work.screeningMaterialUrl) ||
              (canFieldEditAfterFreeze(work, 'posterUrl') && !work.posterUrl)
            );
            const canEdit = canEditBasic || needsSupplement;

            return (
              <div
                key={work.id}
                className={`bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all border ${
                  selectedWork?.id === work.id
                    ? 'border-indigo-300 ring-2 ring-indigo-100'
                    : 'border-gray-100'
                }`}
              >
                <div className="md:flex">
                  <div className="md:w-64 flex-shrink-0">
                    <div className="aspect-video md:aspect-[4/5] bg-gray-200 relative">
                      <img
                        src={work.coverUrl}
                        alt={work.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3">
                        <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${status.color}`}>
                          {status.icon}
                          <span>{status.label}</span>
                        </span>
                      </div>
                      {category && (
                        <div className={`absolute top-3 right-3 ${category.color} text-white text-xs px-2.5 py-1 rounded-lg font-medium shadow-sm`}>
                          {category.name}
                        </div>
                      )}
                      {frozen && (
                        <div className="absolute bottom-3 left-3 right-3 bg-amber-500/95 backdrop-blur text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between shadow-lg">
                          <span className="flex items-center space-x-1.5">
                            <Lock className="w-3.5 h-3.5" />
                            <span>资料已冻结</span>
                          </span>
                          {needsSupplement && (
                            <span className="flex items-center space-x-1 bg-white/20 px-2 py-0.5 rounded">
                              <Unlock className="w-3 h-3" />
                              <span>可补交</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-2">
                          <h3 className="font-bold text-gray-800 text-xl">{work.title}</h3>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs font-mono font-medium">
                            v{work.version}
                          </span>
                          {versions.length > 1 && (
                            <button
                              onClick={() => setDiffingWork(work)}
                              className="flex items-center space-x-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-medium hover:bg-blue-100 transition-colors"
                            >
                              <History className="w-3 h-3" />
                              <span>{versions.length} 个版本</span>
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1.5 flex items-center flex-wrap gap-x-4 gap-y-1">
                          <span>导演：{work.creator}</span>
                          <span>时长：{work.duration} 分钟</span>
                          {work.region && (
                            <span className="flex items-center space-x-1">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>{work.region}</span>
                            </span>
                          )}
                          {work.creatorEmail && <span>邮箱：{work.creatorEmail}</span>}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mt-3 line-clamp-2">{work.description}</p>

                    <div className="mt-4 p-4 bg-gray-50/60 rounded-xl border border-gray-100">
                      <p className="text-xs font-semibold text-gray-600 mb-3">投片材料完整性检查</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className={`flex items-center space-x-2 text-xs ${
                          work.copyrightAccepted ? 'text-emerald-600' : 'text-red-500'
                        }`}>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            work.copyrightAccepted ? 'bg-emerald-100' : 'bg-red-100'
                          }`}>
                            {work.copyrightAccepted
                              ? <CheckCircle className="w-3.5 h-3.5" />
                              : <XCircle className="w-3.5 h-3.5" />
                            }
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium flex items-center space-x-1">
                              <ShieldCheck className="w-3 h-3" />
                              <span>版权声明</span>
                            </span>
                          </div>
                        </div>
                        <div className={`flex items-center space-x-2 text-xs ${
                          work.musicAuthorized ? 'text-emerald-600' : 'text-red-500'
                        }`}>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            work.musicAuthorized ? 'bg-emerald-100' : 'bg-red-100'
                          }`}>
                            {work.musicAuthorized
                              ? <CheckCircle className="w-3.5 h-3.5" />
                              : <XCircle className="w-3.5 h-3.5" />
                            }
                          </div>
                          <span className="font-medium flex items-center space-x-1">
                            <Music className="w-3 h-3" />
                            <span>配乐授权</span>
                          </span>
                        </div>
                        <div className={`flex items-center space-x-2 text-xs ${
                          work.subtitleUrl ? 'text-emerald-600' : 'text-red-500'
                        }`}>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            work.subtitleUrl ? 'bg-emerald-100' : 'bg-red-100'
                          }`}>
                            {work.subtitleUrl
                              ? <CheckCircle className="w-3.5 h-3.5" />
                              : <XCircle className="w-3.5 h-3.5" />
                            }
                          </div>
                          <span className="font-medium flex items-center space-x-1">
                            <Subtitles className="w-3 h-3" />
                            <span>字幕文件</span>
                          </span>
                        </div>
                        <div className={`flex items-center space-x-2 text-xs ${
                          !validation.errorList.find((e) => e.includes('片长'))
                            ? 'text-emerald-600'
                            : 'text-red-500'
                        }`}>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            !validation.errorList.find((e) => e.includes('片长'))
                              ? 'bg-emerald-100'
                              : 'bg-red-100'
                          }`}>
                            {!validation.errorList.find((e) => e.includes('片长'))
                              ? <CheckCircle className="w-3.5 h-3.5" />
                              : <XCircle className="w-3.5 h-3.5" />
                            }
                          </div>
                          <span className="font-medium flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {category ? `${category.maxDuration}分钟上限` : '时长合规'}
                            </span>
                          </span>
                        </div>
                      </div>
                      {validation.errorList.length > 0 && (
                        <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100">
                          <p className="text-xs font-medium text-red-700 mb-1">⚠️ 未通过校验项</p>
                          <ul className="text-xs text-red-600 space-y-0.5 list-disc list-inside">
                            {validation.errorList.map((e, i) => (
                              <li key={i}>{e}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {validation.warningList.length > 0 && validation.errorList.length === 0 && (
                        <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                          <p className="text-xs font-medium text-amber-700 mb-1">💡 提示</p>
                          <ul className="text-xs text-amber-600 space-y-0.5 list-disc list-inside">
                            {validation.warningList.map((w, i) => (
                              <li key={i}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 p-3 bg-gradient-to-r from-indigo-50/60 to-purple-50/60 rounded-xl border border-indigo-100/60">
                      <PipelineView work={work} compact />
                    </div>

                    {work.reviewComment && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center space-x-1">
                          <Film className="w-3.5 h-3.5" />
                          <span>评审反馈</span>
                        </p>
                        <p className="text-sm text-gray-700">{work.reviewComment}</p>
                        {work.reviewScore !== undefined && (
                          <div className="mt-3 flex items-center justify-between pt-3 border-t border-gray-200">
                            <span className="text-xs text-gray-500">综合评分</span>
                            <span className="text-lg font-bold text-indigo-600">
                              {work.reviewScore.toFixed(1)}
                              <span className="text-sm font-normal text-gray-400 ml-1">/ 10</span>
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {frozen && needsSupplement && (
                      <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start space-x-3">
                        <Unlock className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-amber-800">
                            可补交资料通道
                          </p>
                          <p className="text-xs text-amber-700 mt-0.5">
                            入围作品基础信息已锁定，但仍可补充：
                            {canFieldEditAfterFreeze(work, 'screeningMaterialUrl') && !work.screeningMaterialUrl && (
                              <span className="ml-1 bg-amber-100 px-1.5 py-0.5 rounded">放映素材 DCP</span>
                            )}
                            {canFieldEditAfterFreeze(work, 'posterUrl') && !work.posterUrl && (
                              <span className="ml-1 bg-amber-100 px-1.5 py-0.5 rounded">宣传海报</span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedWork(selectedWork?.id === work.id ? null : work)}
                        className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-sm font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Clock className="w-4 h-4" />
                        <span>查看{selectedWork?.id === work.id ? '进度' : '详情'}</span>
                      </button>
                      <button
                        onClick={() => handleEdit(work)}
                        disabled={!canEdit}
                        className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          canEdit
                            ? needsSupplement
                              ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-500/20'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-500/20'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {frozen && needsSupplement ? (
                          <>
                            <Unlock className="w-4 h-4" />
                            <span>补交资料</span>
                          </>
                        ) : canEdit ? (
                          <>
                            <Edit className="w-4 h-4" />
                            <span>编辑作品</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            <span>已锁定</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(work.id)}
                        disabled={!canEditBasic}
                        className={`flex items-center justify-center space-x-1.5 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          canEditBasic
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <WorkForm
          work={editingWork}
          onClose={handleFormClose}
        />
      )}

      {diffingWork && (
        <VersionDiffModal
          work={diffingWork}
          onClose={() => setDiffingWork(null)}
        />
      )}
    </div>
  );
}
