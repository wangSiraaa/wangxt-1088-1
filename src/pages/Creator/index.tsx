import { useState } from 'react';
import { Plus, Edit, Trash2, Film, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useFilmFestivalStore } from '@/store/useFilmFestivalStore';
import WorkForm from './WorkForm';
import type { Work } from '@/types';

const statusConfig = {
  pending: { label: '待评审', color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-4 h-4" /> },
  reviewing: { label: '评审中', color: 'bg-blue-100 text-blue-700', icon: <Film className="w-4 h-4" /> },
  selected: { label: '已入围', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-4 h-4" /> },
  not_selected: { label: '未入选', color: 'bg-gray-100 text-gray-600', icon: <XCircle className="w-4 h-4" /> },
};

export default function CreatorPage() {
  const { works, categories, canEditWork, deleteWork, resultsPublished } = useFilmFestivalStore();
  const [showForm, setShowForm] = useState(false);
  const [editingWork, setEditingWork] = useState<Work | null>(null);

  const handleEdit = (work: Work) => {
    if (!canEditWork(work)) {
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
          <p className="text-gray-500 mt-1">管理你提交的所有短片作品</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>上传作品</span>
        </button>
      </div>

      {resultsPublished && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
          <div>
            <p className="font-medium text-green-800">入围结果已公布</p>
            <p className="text-sm text-green-600 mt-1">
              入围作品的资料已锁定，无法修改。未入选作品仍可编辑。
            </p>
          </div>
        </div>
      )}

      {works.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <Film className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">暂无作品</h3>
          <p className="text-gray-400 mb-6">上传你的第一部短片，参与影展评选</p>
          <button
            onClick={handleAdd}
            className="inline-flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>立即投稿</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {works.map((work) => {
            const category = categories.find((c) => c.id === work.category);
            const status = statusConfig[work.status];
            const canEdit = canEditWork(work);

            return (
              <div key={work.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-video bg-gray-200 relative">
                  <img
                    src={work.coverUrl}
                    alt={work.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                      {status.icon}
                      <span>{status.label}</span>
                    </span>
                  </div>
                  {category && (
                    <div className={`absolute top-2 right-2 ${category.color} text-white text-xs px-2 py-1 rounded`}>
                      {category.name}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 text-lg">{work.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">导演：{work.creator}</p>
                  <p className="text-sm text-gray-500">时长：{work.duration} 分钟</p>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{work.description}</p>

                  {work.reviewComment && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">评审意见</p>
                      <p className="text-sm text-gray-700">{work.reviewComment}</p>
                      {work.reviewScore !== undefined && (
                        <p className="text-sm font-semibold text-indigo-600 mt-1">
                          评分：{work.reviewScore.toFixed(1)} / 10
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(work)}
                      disabled={!canEdit}
                      className={`flex-1 flex items-center justify-center space-x-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        canEdit
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Edit className="w-4 h-4" />
                      <span>{canEdit ? '编辑' : '已锁定'}</span>
                    </button>
                    <button
                      onClick={() => handleDelete(work.id)}
                      disabled={!canEdit}
                      className={`flex items-center justify-center space-x-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        canEdit
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {!canEdit && (
                    <p className="text-xs text-amber-600 mt-2 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>入围作品不可修改</span>
                    </p>
                  )}
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
    </div>
  );
}
