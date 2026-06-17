import { useState } from 'react';
import { X, Search, Film, Clock, Plus } from 'lucide-react';
import { useFilmFestivalStore } from '@/store/useFilmFestivalStore';

interface AddScreeningModalProps {
  sessionId: string;
  onClose: () => void;
  onAdd: (sessionId: string, workId: string) => void;
}

export default function AddScreeningModal({ sessionId, onClose, onAdd }: AddScreeningModalProps) {
  const { getSelectedWorks, categories, screeningSessions } = useFilmFestivalStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const selectedWorks = getSelectedWorks();
  const session = screeningSessions.find((s) => s.id === sessionId);
  const addedWorkIds = session?.screenings.map((s) => s.workId) || [];

  const availableWorks = selectedWorks.filter((work) => {
    if (addedWorkIds.includes(work.id)) return false;
    if (searchQuery && !work.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !work.creator.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filterCategory && work.category !== filterCategory) return false;
    return true;
  });

  const handleAdd = (workId: string) => {
    onAdd(sessionId, workId);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">添加作品</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 border-b space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索作品名称或创作者..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterCategory(null)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filterCategory === null
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              全部
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  filterCategory === cat.id
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {availableWorks.length === 0 ? (
            <div className="p-12 text-center">
              <Film className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {selectedWorks.length === 0
                  ? '暂无可添加的入围作品'
                  : '没有找到符合条件的作品'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {availableWorks.map((work) => {
                const category = categories.find((c) => c.id === work.category);
                return (
                  <div
                    key={work.id}
                    className="p-4 flex items-center space-x-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-20 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={work.coverUrl}
                        alt={work.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-800 truncate">{work.title}</h4>
                      <div className="flex items-center space-x-3 mt-1 text-sm text-gray-500">
                        <span>{work.creator}</span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{work.duration} 分钟</span>
                        </span>
                        {category && (
                          <span className={`text-xs px-2 py-0.5 rounded text-white ${category.color}`}>
                            {category.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAdd(work.id)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      <span>添加</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            共 {availableWorks.length} 部可添加作品
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
