import { useState, useEffect } from 'react';
import { X, Star, Clock, Film, Award } from 'lucide-react';
import { useFilmFestivalStore } from '@/store/useFilmFestivalStore';
import type { Work } from '@/types';

interface ReviewModalProps {
  work: Work;
  onClose: () => void;
  onSubmit: (id: string, score: number, comment: string, status: 'selected' | 'not_selected') => void;
}

export default function ReviewModal({ work, onClose, onSubmit }: ReviewModalProps) {
  const { categories } = useFilmFestivalStore();
  const [score, setScore] = useState(work.reviewScore || 7);
  const [comment, setComment] = useState(work.reviewComment || '');
  const [decision, setDecision] = useState<'selected' | 'not_selected' | null>(
    work.status === 'selected' || work.status === 'not_selected' ? work.status : null
  );

  const category = categories.find((c) => c.id === work.category);

  const handleSubmit = () => {
    if (!decision) {
      alert('请选择评审结果');
      return;
    }
    onSubmit(work.id, score, comment, decision);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">作品评审</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex gap-6">
            <div className="w-48 flex-shrink-0">
              <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                <img
                  src={work.coverUrl}
                  alt={work.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {category && (
                <div className={`mt-3 text-center py-1.5 rounded-lg text-white text-sm ${category.color}`}>
                  {category.name}
                </div>
              )}
            </div>

            <div className="flex-1">
              <h4 className="text-xl font-bold text-gray-800">{work.title}</h4>
              <div className="flex items-center space-x-4 mt-2 text-gray-500 text-sm">
                <span className="flex items-center space-x-1">
                  <Film className="w-4 h-4" />
                  <span>{work.creator}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{work.duration} 分钟</span>
                </span>
              </div>
              <p className="text-gray-600 mt-4">{work.description}</p>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                评分
              </label>
              <div className="flex items-center space-x-4">
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setScore(s)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          s <= score
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-2xl font-bold text-gray-800">{score.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={score}
                onChange={(e) => setScore(parseFloat(e.target.value))}
                className="w-full mt-3 accent-indigo-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                评审意见
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors resize-none"
                placeholder="请写下你的评审意见..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                评审结果
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setDecision('selected')}
                  className={`p-4 rounded-xl border-2 transition-colors flex flex-col items-center space-y-2 ${
                    decision === 'selected'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <Award className={`w-10 h-10 ${decision === 'selected' ? 'text-green-500' : 'text-gray-400'}`} />
                  <span className={`font-semibold ${decision === 'selected' ? 'text-green-700' : 'text-gray-600'}`}>
                    入围
                  </span>
                  <span className="text-xs text-gray-500">作品进入展映名单</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDecision('not_selected')}
                  className={`p-4 rounded-xl border-2 transition-colors flex flex-col items-center space-y-2 ${
                    decision === 'not_selected'
                      ? 'border-gray-400 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <X className={`w-10 h-10 ${decision === 'not_selected' ? 'text-gray-500' : 'text-gray-400'}`} />
                  <span className={`font-semibold ${decision === 'not_selected' ? 'text-gray-700' : 'text-gray-600'}`}>
                    未入选
                  </span>
                  <span className="text-xs text-gray-500">作品未进入展映名单</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!decision}
            className={`px-6 py-2 text-white rounded-lg font-medium transition-colors ${
              decision
                ? 'bg-indigo-600 hover:bg-indigo-700'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            提交评审
          </button>
        </div>
      </div>
    </div>
  );
}
