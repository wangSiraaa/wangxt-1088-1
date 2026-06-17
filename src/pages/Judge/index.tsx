import { useState } from 'react';
import { Eye, Star, Clock, Film, CheckCircle, XCircle, ChevronRight, Award } from 'lucide-react';
import { useFilmFestivalStore } from '@/store/useFilmFestivalStore';
import ReviewModal from './ReviewModal';
import type { Work } from '@/types';

const statusConfig = {
  pending: { label: '待评审', color: 'bg-yellow-100 text-yellow-700' },
  reviewing: { label: '评审中', color: 'bg-blue-100 text-blue-700' },
  selected: { label: '已入围', color: 'bg-green-100 text-green-700' },
  not_selected: { label: '未入选', color: 'bg-gray-100 text-gray-600' },
};

export default function JudgePage() {
  const { works, categories, reviewWork } = useFilmFestivalStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [reviewingWork, setReviewingWork] = useState<Work | null>(null);

  const filteredWorks = selectedCategory
    ? works.filter((w) => w.category === selectedCategory)
    : works;

  const pendingCount = works.filter((w) => w.status === 'pending' || w.status === 'reviewing').length;
  const selectedCount = works.filter((w) => w.status === 'selected').length;
  const notSelectedCount = works.filter((w) => w.status === 'not_selected').length;

  const handleReview = (work: Work) => {
    setReviewingWork(work);
  };

  const handleSubmitReview = (id: string, score: number, comment: string, status: 'selected' | 'not_selected') => {
    reviewWork(id, score, comment, status);
    setReviewingWork(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">评审中心</h2>
        <p className="text-gray-500 mt-1">按分类查看作品，进行评审打分</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
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
        <div className="w-64 flex-shrink-0">
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
            <div className="bg-white rounded-xl shadow-sm mt-4 p-4">
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
        </div>

        <div className="flex-1">
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
                  return (
                    <div
                      key={work.id}
                      className="p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="w-32 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={work.coverUrl}
                            alt={work.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-800">{work.title}</h4>
                              <p className="text-sm text-gray-500 mt-1">
                                导演：{work.creator} · 时长：{work.duration} 分钟
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                              {status.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
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
                            <button
                              onClick={() => handleReview(work)}
                              className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                            >
                              <Eye className="w-4 h-4" />
                              <span>评审</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
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
    </div>
  );
}
