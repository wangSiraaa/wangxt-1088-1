import { useState, useEffect } from 'react';
import { X, Upload, AlertTriangle, Check } from 'lucide-react';
import { useFilmFestivalStore } from '@/store/useFilmFestivalStore';
import type { Work } from '@/types';

interface WorkFormProps {
  work: Work | null;
  onClose: () => void;
}

export default function WorkForm({ work, onClose }: WorkFormProps) {
  const { categories, addWork, updateWork, canEditWork } = useFilmFestivalStore();

  const [formData, setFormData] = useState({
    title: '',
    creator: '',
    creatorEmail: '',
    category: '',
    duration: 0,
    description: '',
    coverUrl: '',
    videoUrl: '',
    copyrightAccepted: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (work) {
      setFormData({
        title: work.title,
        creator: work.creator,
        creatorEmail: work.creatorEmail,
        category: work.category,
        duration: work.duration,
        description: work.description,
        coverUrl: work.coverUrl,
        videoUrl: work.videoUrl,
        copyrightAccepted: work.copyrightAccepted,
      });
    }
  }, [work]);

  const selectedCategory = categories.find((c) => c.id === formData.category);
  const isOverDuration = selectedCategory && formData.duration > selectedCategory.maxDuration;
  const isEditing = !!work;
  const canEdit = isEditing ? canEditWork(work) : true;

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '请输入作品标题';
    }
    if (!formData.creator.trim()) {
      newErrors.creator = '请输入创作者姓名';
    }
    if (!formData.creatorEmail.trim()) {
      newErrors.creatorEmail = '请输入联系邮箱';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.creatorEmail)) {
      newErrors.creatorEmail = '请输入有效的邮箱地址';
    }
    if (!formData.category) {
      newErrors.category = '请选择参赛分类';
    }
    if (formData.duration <= 0) {
      newErrors.duration = '请输入作品时长';
    } else if (selectedCategory && formData.duration > selectedCategory.maxDuration) {
      newErrors.duration = `作品时长超过该分类上限（${selectedCategory.maxDuration}分钟）`;
    }
    if (!formData.description.trim()) {
      newErrors.description = '请输入作品简介';
    }
    if (!formData.coverUrl.trim()) {
      newErrors.coverUrl = '请输入封面图片链接';
    }
    if (!formData.copyrightAccepted) {
      newErrors.copyrightAccepted = '请阅读并同意版权声明';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!canEdit) {
      alert('该作品已入围，无法修改');
      return;
    }

    if (!validate()) {
      return;
    }

    if (isEditing) {
      updateWork(work.id, {
        ...formData,
      });
    } else {
      addWork({
        ...formData,
      });
    }

    onClose();
  };

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">
            {isEditing ? '编辑作品' : '上传作品'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                作品标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                disabled={!canEdit}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors ${
                  errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                } ${!canEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder="请输入作品标题"
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  创作者姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.creator}
                  onChange={(e) => handleChange('creator', e.target.value)}
                  disabled={!canEdit}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors ${
                    errors.creator ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  } ${!canEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="请输入姓名"
                />
                {errors.creator && (
                  <p className="text-red-500 text-sm mt-1">{errors.creator}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  联系邮箱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.creatorEmail}
                  onChange={(e) => handleChange('creatorEmail', e.target.value)}
                  disabled={!canEdit}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors ${
                    errors.creatorEmail ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  } ${!canEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="example@email.com"
                />
                {errors.creatorEmail && (
                  <p className="text-red-500 text-sm mt-1">{errors.creatorEmail}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  参赛分类 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  disabled={!canEdit}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors ${
                    errors.category ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  } ${!canEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <option value="">请选择分类</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}（时长上限 {cat.maxDuration} 分钟）
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-red-500 text-sm mt-1">{errors.category}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  作品时长（分钟） <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.duration || ''}
                  onChange={(e) => handleChange('duration', parseFloat(e.target.value) || 0)}
                  disabled={!canEdit}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors ${
                    errors.duration || isOverDuration
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  } ${!canEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="0"
                />
                {selectedCategory && (
                  <p className={`text-sm mt-1 ${isOverDuration ? 'text-red-500' : 'text-gray-500'}`}>
                    {isOverDuration ? (
                      <span className="flex items-center space-x-1">
                        <AlertTriangle className="w-4 h-4" />
                        <span>超出 {selectedCategory.maxDuration} 分钟上限</span>
                      </span>
                    ) : (
                      <span>该分类时长上限 {selectedCategory.maxDuration} 分钟</span>
                    )}
                  </p>
                )}
                {errors.duration && (
                  <p className="text-red-500 text-sm mt-1">{errors.duration}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                作品简介 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                disabled={!canEdit}
                rows={3}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors resize-none ${
                  errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                } ${!canEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder="请简要介绍你的作品..."
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                封面图片链接 <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-4">
                <input
                  type="url"
                  value={formData.coverUrl}
                  onChange={(e) => handleChange('coverUrl', e.target.value)}
                  disabled={!canEdit}
                  className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors ${
                    errors.coverUrl ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  } ${!canEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="https://..."
                />
                {formData.coverUrl && (
                  <div className="w-24 h-16 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                    <img
                      src={formData.coverUrl}
                      alt="封面预览"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
              {errors.coverUrl && (
                <p className="text-red-500 text-sm mt-1">{errors.coverUrl}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                视频链接
              </label>
              <div className="flex items-center space-x-2">
                <Upload className="w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  value={formData.videoUrl}
                  onChange={(e) => handleChange('videoUrl', e.target.value)}
                  disabled={!canEdit}
                  className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors ${
                    !canEdit ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'
                  }`}
                  placeholder="视频观看链接（可选）"
                />
              </div>
            </div>

            <div className={`border-2 rounded-lg p-4 ${
              errors.copyrightAccepted ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
            }`}>
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.copyrightAccepted}
                  onChange={(e) => handleChange('copyrightAccepted', e.target.checked)}
                  disabled={!canEdit}
                  className="mt-1 w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-800">版权声明</p>
                  <p className="text-sm text-gray-600 mt-1">
                    我确认本作品为本人原创，不侵犯任何第三方的知识产权和其他合法权益。
                    如因作品版权问题引发纠纷，由本人承担全部法律责任。
                    本人授权影展组委会在非商业用途下对作品进行展映、宣传和推广。
                  </p>
                </div>
                {formData.copyrightAccepted && (
                  <Check className="w-5 h-5 text-green-500 mt-0.5" />
                )}
              </label>
              {errors.copyrightAccepted && (
                <p className="text-red-500 text-sm mt-2 ml-8">
                  {errors.copyrightAccepted}
                </p>
              )}
            </div>

            {!canEdit && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">作品已锁定</p>
                  <p className="text-sm text-amber-600">
                    该作品已入围影展，作品资料不可修改。
                  </p>
                </div>
              </div>
            )}
          </div>
        </form>

        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            取消
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!canEdit}
            className={`px-6 py-2 text-white rounded-lg font-medium transition-colors ${
              canEdit
                ? 'bg-indigo-600 hover:bg-indigo-700'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {isEditing ? '保存修改' : '提交作品'}
          </button>
        </div>
      </div>
    </div>
  );
}
