import { useState } from 'react';
import { Eye, Star, Clock, Film, CheckCircle, XCircle, ChevronRight, Award, GitCompare, ShieldCheck, Music, Subtitles, MapPin, AlertTriangle, Lock, History } from 'lucide-react';
import { useFilmFestivalStore } from '@/store/useFilmFestivalStore';
import ReviewModal from './ReviewModal';
import VersionDiffModal from '@/components/VersionDiffModal';
import PipelineView from '@/components/PipelineView';
import type { Work } from '@/types';

const statusConfig = {
  pending: { label: '待评审', color: 'bg-yellow-100 text-yellow-700' },
  reviewing: { label: '评审中', color: 'bg-blue-100 text-blue-700' },
  selected: { label: '已入围', color: 'bg-green-100 text-green-700' },
  not_selected: { label: '未入选', color: 'bg-gray-100 text-gray-600' },
  announced: { label: '已公示', color: 'bg-purple-100 text-purple-700' },
  screening_scheduled: { label: '已排片', color: 'bg-indigo-100 text-indigo-700' },
};

const regionNames: Record<string, string> = {
  beijing: '北京', shanghai: '上海', guangzhou: '广州',
  chengdu: '成都', hangzhou: '杭州', shenzhen: '深圳',
  nanjing: '南京', wuhan: '武汉', xian: '西安',
};

export default function JudgePage() {
  const { works, categories, reviewWork, validateSubmission, getWorkVersions, isWorkFrozen, announceResults } = useFilmFestivalStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [reviewingWork, setReviewingWork] = useState<Work | null>(null);
  const [diffingWork, setDiffingWork] = useState<Work | null>(null);
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);

  const filteredWorks = selectedCategory
    ? works.filter((w) => w.category === selectedCategory)
    : works;

  const pendingCount = works.filter((w) => w.status === 'pending' || w.status === 'reviewing').length;
  const selectedCount = works.filter((w) => w.status === 'selected' || w.status === 'announced').length;
  const notSelectedCount = works.filter((w) => w.status === 'not_selected').length;
  const announcedCount = works.filter((w) => w.status === 'announced').length;

  const handleReview = (work: Work) => {
    setReviewingWork(work);
  };

  const handleSubmitReview = (id: string, score: number, comment: string, status: 'selected' | 'not_selected') => {
    reviewWork(id, score, comment, status);
    setReviewingWork(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">评审中心</h2>
          <p className="text-gray-500 mt-1">按分类查看作品，检查投片完整性，对比版本历史</p>
        </div>
        <button
          onClick={announceResults}
          disabled={selectedCount - announcedCount === 0}
          className="px-5 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20 disabled:shadow-none flex items-center space-x-2"
        >
          <Award className="w-4 h-4" />
          <span>公布入围名单（{selectedCount - announcedCount}）</span>
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">待评审</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{pendingCount}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">已入围</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{selectedCount}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">已公示</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{announcedCount}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">未入选</p>
              <p className="text-3xl font-bold text-gray-400 mt-1">{notSelectedCount}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="w-72 flex-shrink-0 space-y-4">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-800">参赛分类</h3>
            </div>
            <div className="p-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                  selectedCategory === null
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <Film className="w-4 h-4" />
                  <span>全部作品</span>
                </span>
                <span className="text-sm">{works.length}</span>
              </button>
              {categories.map((cat) => {
                const count = works.filter((w) => w.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                      selectedCategory === cat.id
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${cat.color}`}></div>
                      <span>{cat.name}</span>
                    </span>
                    <span className="text-sm">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedCategory && (
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h4 className="font-medium text-gray-800 mb-2">分类说明</h4>
              {(() => {
                const cat = categories.find((c) => c.id === selectedCategory);
                if (!cat) return null;
                return (
                  <div>
                    <p className="text-sm text-gray-600">{cat.description}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      时长上限：{cat.maxDuration} 分钟
                    </p>
                  </div>
                );
              })()}
            </div>
          )}

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm p-4 border border-blue-100">
            <h4 className="font-medium text-gray-800 mb-3 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>投片完整性校验</span>
            </h4>
            <p className="text-xs text-gray-500 mb-3">系统自动检测作品材料的合规情况</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center space-x-1.5 text-gray-600">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>版权声明</span>
                </span>
                <span className="text-emerald-600 font-medium">
                  {works.filter((w) => w.copyrightAccepted).length}/{works.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center space-x-1.5 text-gray-600">
                  <Music className="w-3.5 h-3.5" />
                  <span>配乐授权</span>
                </span>
                <span className="text-emerald-600 font-medium">
                  {works.filter((w) => w.musicAuthorized).length}/{works.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center space-x-1.5 text-gray-600">
                  <Subtitles className="w-3.5 h-3.5" />
                  <span>字幕文件</span>
                </span>
                <span className="text-emerald-600 font-medium">
                  {works.filter((w) => w.subtitleUrl).length}/{works.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center space-x-1.5 text-gray-600">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>作品地区</span>
                </span>
                <span className="text-emerald-600 font-medium">
                  {works.filter((w) => w.region).length}/{works.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          {selectedWork && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between bg-gray-50">
                <h3 className="font-semibold text-gray-800">《{selectedWork.title}》详情</h3>
                <button
                  onClick={() => setSelectedWork(null)}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  收起详情
                </button>
              </div>
              <div className="p-5">
                <PipelineView work={selectedWork} />
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">
                {selectedCategory
                  ? categories.find((c) => c.id === selectedCategory)?.name
                  : '全部作品'}
                <span className="text-gray-400 font-normal ml-2">({filteredWorks.length} 部)</span>
              </h3>
            </div>

            {filteredWorks.length === 0 ? (
              <div className="p-12 text-center">
                <Film className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">暂无作品</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredWorks.map((work) => {
                  const status = statusConfig[work.status];
                  const category = categories.find((c) => c.id === work.category);
                  const versions = getWorkVersions(work.id);
                  const validation = validateSubmission(work);
                  const frozen = isWorkFrozen(work);
                  const hasWarnings = validation.warnings.length > 0;
                  const hasErrors = validation.errors.length > 0;

                  return (
                    <div
                      key={work.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        selectedWork?.id === work.id ? 'bg-indigo-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="w-32 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 relative">
                          <img
                            src={work.coverUrl}
                            alt={work.title}
                            className="w-full h-full object-cover"
                          />
                          {frozen && (
                            <div className="absolute top-1 right-1 bg-amber-500/90 backdrop-blur-sm text-white px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center space-x-0.5">
                              <Lock className="w-2.5 h-2.5" />
                              <span>已冻结</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="font-semibold text-gray-800">{work.title}</h4>
                                <span className="text-xs text-gray-400 font-mono">v{work.version}</span>
                                {versions.length > 1 && (
                                  <span className="flex items-center space-x-0.5 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-medium">
                                    <History className="w-3 h-3" />
                                    <span>{versions.length} 版本</span>
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 mt-1">
                                导演：{work.creator} · 时长：{work.duration} 分钟
                                {work.region && <span> · 地区：{regionNames[work.region] || work.region}</span>}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              {hasErrors && (
                                <span className="px-2 py-1 bg-red-50 text-red-600 rounded-full text-xs font-medium flex items-center space-x-1">
                                  <XCircle className="w-3 h-3" />
                                  <span>材料不全</span>
                                </span>
                              )}
                              {!hasErrors && hasWarnings && (
                                <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-medium flex items-center space-x-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>{validation.warnings.length} 项警告</span>
                                </span>
                              )}
                              {!hasErrors && !hasWarnings && (
                                <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-medium flex items-center space-x-1">
                                  <ShieldCheck className="w-3 h-3" />
                                  <span>材料完整</span>
                                </span>
                              )}
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                {status.label}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 mt-2">
                            <span className={`inline-flex items-center space-x-1 text-xs ${
                              work.copyrightAccepted ? 'text-emerald-600' : 'text-red-500'
                            }`}>
                              <ShieldCheck className="w-3 h-3" />
                              <span>版权{work.copyrightAccepted ? '已声明' : '未声明'}</span>
                            </span>
                            <span className={`inline-flex items-center space-x-1 text-xs ${
                              work.musicAuthorized ? 'text-emerald-600' : 'text-red-500'
                            }`}>
                              <Music className="w-3 h-3" />
                              <span>配乐{work.musicAuthorized ? '已授权' : '未授权'}</span>
                            </span>
                            <span className={`inline-flex items-center space-x-1 text-xs ${
                              work.subtitleUrl ? 'text-emerald-600' : 'text-red-500'
                            }`}>
                              <Subtitles className="w-3 h-3" />
                              <span>字幕{work.subtitleUrl ? '已提供' : '未提供'}</span>
                            </span>
                            {category && category.maxDuration < work.duration && (
                              <span className="inline-flex items-center space-x-1 text-xs text-red-500">
                                <AlertTriangle className="w-3 h-3" />
                                <span>超时{work.duration - category.maxDuration}分钟</span>
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-gray-600 mt-2 line-clamp-1">
                            {work.description}
                          </p>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center space-x-3">
                              {category && (
                                <span className={`text-xs px-2 py-1 rounded ${category.color} text-white`}>
                                  {category.name}
                                </span>
                              )}
                              {work.reviewScore !== undefined && (
                                <span className="flex items-center space-x-1 text-sm text-amber-600">
                                  <Star className="w-4 h-4 fill-current" />
                                  <span>{work.reviewScore.toFixed(1)}</span>
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => setSelectedWork(selectedWork?.id === work.id ? null : work)}
                                className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                              >
                                查看
                              </button>
                              {versions.length > 1 && (
                                <button
                                  onClick={() => setDiffingWork(work)}
                                  className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                                >
                                  <GitCompare className="w-4 h-4" />
                                  <span>对比版本</span>
                                </button>
                              )}
                              {!frozen && (
                                <button
                                  onClick={() => handleReview(work)}
                                  className="px-3 py-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg text-sm font-medium flex items-center space-x-1 transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                  <span>评审</span>
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {reviewingWork && (
        <ReviewModal
          work={reviewingWork}
          onClose={() => setReviewingWork(null)}
          onSubmit={handleSubmitReview}
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
