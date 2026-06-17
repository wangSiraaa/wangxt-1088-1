import { useState, useEffect } from 'react';
import { X, Upload, AlertTriangle, Check, FileText, MapPin, Lock, Unlock, History } from 'lucide-react';
import { useFilmFestivalStore } from '@/store/useFilmFestivalStore';
import type { Work, Region } from '@/types';
import { REGIONS, ALLOWED_AFTER_FREEZE, FROZEN_FIELDS } from '@/types';

interface WorkFormProps {
  work: Work | null;
  onClose: () => void;
}

const fieldLabels: Record<string, string> = {
  title: '作品标题', creator: '创作者姓名', creatorEmail: '联系邮箱',
  category: '参赛分类', duration: '作品时长', description: '作品简介',
  coverUrl: '封面图片', videoUrl: '视频链接', copyrightAccepted: '版权声明',
  musicAuthorized: '配乐授权', subtitleUrl: '字幕文件', region: '作品地区',
  screeningMaterialUrl: '放映素材', posterUrl: '宣传海报',
};

export default function WorkForm({ work, onClose }: WorkFormProps) {
  const {
    categories, addWork, updateWork, canEditWork, canEditField,
    isWorkFrozen, validateSubmission,
  } = useFilmFestivalStore();

  const [formData, setFormData] = useState({
    title: '', creator: '', creatorEmail: '', category: '', duration: 0,
    description: '', coverUrl: '', videoUrl: '', copyrightAccepted: false,
    musicAuthorized: false, subtitleUrl: '', region: '' as Region | '',
    screeningMaterialUrl: '', posterUrl: '',
  });
  const [changeNote, setChangeNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (work) {
      setFormData({
        title: work.title, creator: work.creator, creatorEmail: work.creatorEmail,
        category: work.category, duration: work.duration, description: work.description,
        coverUrl: work.coverUrl, videoUrl: work.videoUrl,
        copyrightAccepted: work.copyrightAccepted, musicAuthorized: work.musicAuthorized,
        subtitleUrl: work.subtitleUrl, region: work.region || '',
        screeningMaterialUrl: work.screeningMaterialUrl || '',
        posterUrl: work.posterUrl || '',
      });
    }
  }, [work]);

  const selectedCategory = categories.find((c) => c.id === formData.category);
  const isOverDuration = selectedCategory && formData.duration > selectedCategory.maxDuration;
  const isEditing = !!work;
  const canEdit = isEditing ? canEditWork(work) : true;
  const frozen = isEditing ? isWorkFrozen(work) : false;

  const renderFieldDisabled = (field: keyof typeof formData): boolean => {
    if (!canEdit) return true;
    if (!isEditing) return false;
    if (frozen) return !canEditField(work!, field as keyof Work);
    return false;
  };

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
    }
    if (warnings[field]) {
      setWarnings((prev) => { const next = { ...prev }; delete next[field]; return next; });
    }
  };

  const runValidation = (): boolean => {
    const result = validateSubmission(formData);
    setErrors(result.errors);
    setWarnings(result.warnings);
    return result.valid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!canEdit) {
      alert('该作品已锁定，无法修改');
      return;
    }

    if (!runValidation()) {
      setSubmitStatus('error');
      return;
    }

    if (isEditing && work) {
      const result = updateWork(work.id, formData, changeNote || '修改作品信息');
      if (!result.valid) {
        setErrors(result.errors);
        setSubmitStatus('error');
        return;
      }
    } else {
      const result = addWork({ ...formData, region: formData.region as Region });
      if (!result.valid) {
        setErrors(result.errors);
        setWarnings(result.warnings);
        setSubmitStatus('error');
        return;
      }
    }

    setSubmitStatus('success');
    setTimeout(onClose, 400);
  };

  const FrozenFieldBadge = ({ field }: { field: string }) => {
    if (!frozen) return null;
    const key = field as keyof Work;
    const editable = ALLOWED_AFTER_FREEZE.includes(key);
    if (FROZEN_FIELDS.includes(key)) {
      return (
        <span className="inline-flex items-center space-x-1 ml-2 text-xs text-amber-600">
          <Lock className="w-3 h-3" /><span>已冻结</span>
        </span>
      );
    }
    if (editable) {
      return (
        <span className="inline-flex items-center space-x-1 ml-2 text-xs text-emerald-600">
          <Unlock className="w-3 h-3" /><span>可补交</span>
        </span>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${frozen ? 'bg-amber-100' : 'bg-indigo-100'}`}>
              {frozen ? <Lock className="w-5 h-5 text-amber-600" /> : <FileText className="w-5 h-5 text-indigo-600" />}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                {isEditing ? '编辑作品' : '投稿作品'}
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {frozen
                  ? '入围作品资料已锁定，仅可补交放映素材和海报'
                  : isEditing ? '修改将生成新的版本记录，供评审查看' : '请完整填写所有必填项'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-white/60"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          {frozen && (
            <div className="mb-5 bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-800">作品资料已冻结</p>
                <p className="text-sm text-amber-700 mt-1">
                  入围名单公布后，以下字段不可修改：
                  {FROZEN_FIELDS.map((f) => fieldLabels[f as string] || f).join('、')}。
                  仅允许补交放映素材和宣传海报。
                </p>
              </div>
            </div>
          )}

          {submitStatus === 'success' && (
            <div className="mb-5 bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 flex items-start space-x-3">
              <Check className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-emerald-800">保存成功</p>
                <p className="text-sm text-emerald-700">
                  {isEditing ? '新版本已记录，评审可查看变更历史' : '作品已提交，等待评审'}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-5">
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <h4 className="font-semibold text-gray-700 mb-4 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                <span>基本信息</span>
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    作品标题 <span className="text-red-500">*</span>
                    <FrozenFieldBadge field="title" />
                  </label>
                  <input
                    type="text" value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    disabled={renderFieldDisabled('title')}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${
                      errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    } ${renderFieldDisabled('title') ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'}`}
                    placeholder="请输入作品标题"
                  />
                  {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    创作者 <span className="text-red-500">*</span>
                    <FrozenFieldBadge field="creator" />
                  </label>
                  <input
                    type="text" value={formData.creator}
                    onChange={(e) => handleChange('creator', e.target.value)}
                    disabled={renderFieldDisabled('creator')}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${
                      errors.creator ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    } ${renderFieldDisabled('creator') ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
                  />
                  {errors.creator && <p className="text-red-500 text-sm mt-1">{errors.creator}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    联系邮箱 <span className="text-red-500">*</span>
                    <FrozenFieldBadge field="creatorEmail" />
                  </label>
                  <input
                    type="email" value={formData.creatorEmail}
                    onChange={(e) => handleChange('creatorEmail', e.target.value)}
                    disabled={renderFieldDisabled('creatorEmail')}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${
                      errors.creatorEmail ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    } ${renderFieldDisabled('creatorEmail') ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
                  />
                  {errors.creatorEmail && <p className="text-red-500 text-sm mt-1">{errors.creatorEmail}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    参赛分类 <span className="text-red-500">*</span>
                    <FrozenFieldBadge field="category" />
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    disabled={renderFieldDisabled('category')}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${
                      errors.category ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    } ${renderFieldDisabled('category') ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
                  >
                    <option value="">请选择分类</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}（时长上限 {cat.maxDuration} 分钟）
                      </option>
                    ))}
                  </select>
                  {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    作品时长（分钟） <span className="text-red-500">*</span>
                    <FrozenFieldBadge field="duration" />
                  </label>
                  <input
                    type="number" min="0" step="0.1"
                    value={formData.duration || ''}
                    onChange={(e) => handleChange('duration', parseFloat(e.target.value) || 0)}
                    disabled={renderFieldDisabled('duration')}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${
                      errors.duration || isOverDuration ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    } ${renderFieldDisabled('duration') ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
                  />
                  {selectedCategory && (
                    <p className={`text-sm mt-1 ${isOverDuration ? 'text-red-500' : 'text-gray-500'}`}>
                      {isOverDuration ? (
                        <span className="flex items-center space-x-1">
                          <AlertTriangle className="w-4 h-4" />
                          <span>超出上限 {selectedCategory.maxDuration} 分钟</span>
                        </span>
                      ) : (
                        <span>上限 {selectedCategory.maxDuration} 分钟</span>
                      )}
                    </p>
                  )}
                  {errors.duration && <p className="text-red-500 text-sm mt-1">{errors.duration}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    作品地区 <span className="text-red-500">*</span>
                    <FrozenFieldBadge field="region" />
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      value={formData.region}
                      onChange={(e) => handleChange('region', e.target.value)}
                      disabled={renderFieldDisabled('region')}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${
                        errors.region ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      } ${renderFieldDisabled('region') ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
                    >
                      <option value="">请选择地区</option>
                      {REGIONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  {errors.region && <p className="text-red-500 text-sm mt-1">{errors.region}</p>}
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    作品简介 <span className="text-red-500">*</span>
                    <FrozenFieldBadge field="description" />
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    disabled={renderFieldDisabled('description')}
                    rows={3}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition resize-none ${
                      errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    } ${renderFieldDisabled('description') ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
                    placeholder="请简要介绍你的作品..."
                  />
                  {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <h4 className="font-semibold text-gray-700 mb-4 flex items-center space-x-2">
                <Upload className="w-4 h-4 text-purple-500" />
                <span>作品素材</span>
              </h4>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    封面图片链接 <span className="text-red-500">*</span>
                    <FrozenFieldBadge field="coverUrl" />
                  </label>
                  <div className="flex space-x-4">
                    <input
                      type="url" value={formData.coverUrl}
                      onChange={(e) => handleChange('coverUrl', e.target.value)}
                      disabled={renderFieldDisabled('coverUrl')}
                      className={`flex-1 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${
                        errors.coverUrl ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      } ${renderFieldDisabled('coverUrl') ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
                      placeholder="https://..."
                    />
                    {formData.coverUrl && (
                      <div className="w-24 h-16 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                        <img
                          src={formData.coverUrl} alt="封面预览"
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    )}
                  </div>
                  {errors.coverUrl && <p className="text-red-500 text-sm mt-1">{errors.coverUrl}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    视频链接
                    <FrozenFieldBadge field="videoUrl" />
                  </label>
                  <div className="flex items-center space-x-2">
                    <Upload className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <input
                      type="url" value={formData.videoUrl}
                      onChange={(e) => handleChange('videoUrl', e.target.value)}
                      disabled={renderFieldDisabled('videoUrl')}
                      className={`flex-1 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${
                        renderFieldDisabled('videoUrl') ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'border-gray-300'
                      }`}
                      placeholder="评审观看链接（可选）"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    字幕文件链接 <span className="text-red-500">*</span>
                    <FrozenFieldBadge field="subtitleUrl" />
                  </label>
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <input
                      type="url" value={formData.subtitleUrl}
                      onChange={(e) => handleChange('subtitleUrl', e.target.value)}
                      disabled={renderFieldDisabled('subtitleUrl')}
                      className={`flex-1 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${
                        errors.subtitleUrl ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      } ${renderFieldDisabled('subtitleUrl') ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
                      placeholder="SRT/VTT 字幕文件链接"
                    />
                  </div>
                  {errors.subtitleUrl && <p className="text-red-500 text-sm mt-1">{errors.subtitleUrl}</p>}
                  <p className="text-xs text-gray-500 mt-1">支持 SRT、VTT 格式，用于展映时加载字幕</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <h4 className="font-semibold text-gray-700 mb-4 flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>法律声明</span>
              </h4>
              <div className="space-y-3">
                <div className={`border-2 rounded-xl p-4 transition ${
                  errors.copyrightAccepted ? 'border-red-300 bg-red-50' :
                  formData.copyrightAccepted ? 'border-emerald-200 bg-emerald-50/50' : 'border-gray-200 bg-gray-50'
                }`}>
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.copyrightAccepted}
                      onChange={(e) => handleChange('copyrightAccepted', e.target.checked)}
                      disabled={renderFieldDisabled('copyrightAccepted')}
                      className="mt-1 w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center">
                        <p className="font-semibold text-gray-800">版权声明 <span className="text-red-500">*</span></p>
                        <FrozenFieldBadge field="copyrightAccepted" />
                      </div>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                        我确认本作品为本人原创，不侵犯任何第三方的知识产权和其他合法权益。
                        如因作品版权问题引发纠纷，由本人承担全部法律责任。
                        本人授权影展组委会在非商业用途下对作品进行展映、宣传和推广。
                      </p>
                    </div>
                    {formData.copyrightAccepted && (
                      <Check className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    )}
                  </label>
                  {errors.copyrightAccepted && (
                    <p className="text-red-500 text-sm mt-2 ml-8">{errors.copyrightAccepted}</p>
                  )}
                </div>

                <div className={`border-2 rounded-xl p-4 transition ${
                  errors.musicAuthorized ? 'border-red-300 bg-red-50' :
                  formData.musicAuthorized ? 'border-emerald-200 bg-emerald-50/50' : 'border-gray-200 bg-gray-50'
                }`}>
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.musicAuthorized}
                      onChange={(e) => handleChange('musicAuthorized', e.target.checked)}
                      disabled={renderFieldDisabled('musicAuthorized')}
                      className="mt-1 w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center">
                        <p className="font-semibold text-gray-800">配乐授权 <span className="text-red-500">*</span></p>
                        <FrozenFieldBadge field="musicAuthorized" />
                      </div>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                        我确认作品中使用的所有音乐均已获得合法授权，或使用无版权音乐。
                        如使用配乐引发版权纠纷，由本人承担全部责任。
                      </p>
                    </div>
                    {formData.musicAuthorized && (
                      <Check className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    )}
                  </label>
                  {errors.musicAuthorized && (
                    <p className="text-red-500 text-sm mt-2 ml-8">{errors.musicAuthorized}</p>
                  )}
                  {warnings.musicAuthorized && (
                    <p className="text-amber-600 text-sm mt-2 ml-8">
                      ⚠ {warnings.musicAuthorized}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {frozen && (
              <div className="bg-white rounded-xl p-5 border-2 border-emerald-200 bg-emerald-50/30">
                <h4 className="font-semibold text-emerald-700 mb-4 flex items-center space-x-2">
                  <Unlock className="w-4 h-4" />
                  <span>补交放映资料</span>
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      放映素材链接 <span className="text-emerald-600 text-xs">（展映用高分辨率母带）</span>
                    </label>
                    <div className="flex items-center space-x-2">
                      <Upload className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <input
                        type="url" value={formData.screeningMaterialUrl}
                        onChange={(e) => handleChange('screeningMaterialUrl', e.target.value)}
                        disabled={renderFieldDisabled('screeningMaterialUrl')}
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
                        placeholder="高分辨率视频文件或下载链接"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      宣传海报链接 <span className="text-emerald-600 text-xs">（用于官方宣传物料）</span>
                    </label>
                    <div className="flex space-x-4">
                      <input
                        type="url" value={formData.posterUrl}
                        onChange={(e) => handleChange('posterUrl', e.target.value)}
                        disabled={renderFieldDisabled('posterUrl')}
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
                        placeholder="高清海报图片链接"
                      />
                      {formData.posterUrl && (
                        <div className="w-20 h-28 rounded overflow-hidden border border-gray-200 flex-shrink-0">
                          <img
                            src={formData.posterUrl} alt="海报预览"
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isEditing && (
              <div className="bg-white rounded-xl p-5 border border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                  <History className="w-4 h-4 text-gray-500" />
                  <span>修改说明</span>
                  <span className="text-xs text-gray-400 font-normal">（将记录在版本历史中）</span>
                </label>
                <input
                  type="text"
                  value={changeNote}
                  onChange={(e) => setChangeNote(e.target.value)}
                  disabled={!canEdit}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  placeholder="如：修改了简介、更新了视频链接..."
                />
              </div>
            )}
          </div>
        </form>

        <div className="flex items-center justify-between p-6 border-t bg-white">
          <div className="text-sm text-gray-500">
            {Object.keys(errors).length > 0 && (
              <span className="text-red-500">{Object.keys(errors).length} 项需要修正</span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={!canEdit || submitStatus === 'success'}
              className={`px-6 py-2.5 text-white rounded-lg font-medium transition-all ${
                canEdit && submitStatus !== 'success'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {submitStatus === 'success'
                ? '已保存 ✓'
                : isEditing ? (frozen ? '补交资料' : '保存修改') : '提交作品'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
