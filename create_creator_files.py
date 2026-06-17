import os

base_dir = '/Users/mingyuan/workspace/sihuo/wangxtw3/1088/src/pages/Creator'

files = {
    'index.tsx': '''import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, AlertTriangle, Upload } from 'lucide-react';
import Layout from '@/components/Layout';
import FilmCard from '@/components/FilmCard';
import { useStore } from '@/store/useStore';

const MAX_DURATION = 30;

export default function CreatorHome() {
  const navigate = useNavigate();
  const { films, initData, isResultsPublished } = useStore();

  useEffect(() => {
    initData();
  }, [initData]);

  const myFilms = films;

  return (
    <Layout title="创作者中心">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h2 className="section-title">我的作品</h2>
          <p className="section-subtitle">管理你投递的所有短片作品</p>
        </div>
        <button
          onClick={() => navigate('/creator/submit')}
          disabled={isResultsPublished}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          新增投稿
        </button>
      </div>

      {isResultsPublished && (
        <div className="mb-6 p-4 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-gold-400 mb-0.5">入围名单已公布</p>
            <p className="text-cream-200/70">作品资料已锁定，不可再编辑。感谢您的参与！</p>
          </div>
        </div>
      )}

      {myFilms.length === 0 ? (
        <div className="card-base p-16 text-center">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-ink-700 flex items-center justify-center">
            <Upload className="w-10 h-10 text-cream-200/40" />
          </div>
          <h3 className="font-serif text-xl font-semibold text-cream-50 mb-2">还没有作品</h3>
          <p className="text-cream-200/60 mb-6">投递你的第一部短片，参与社区影展</p>
          <button onClick={() => navigate('/creator/submit')} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-5 h-5" />
            立即投稿
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {myFilms.map((film) => (
            <FilmCard key={film.id} film={film} showEdit={!isResultsPublished} />
          ))}
        </div>
      )}
    </Layout>
  );
}
''',
    'Submit.tsx': '''import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Clock, FileVideo, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import Layout from '@/components/Layout';
import { useStore } from '@/store/useStore';
import type { Film } from '@/types';

const MAX_DURATION = 30;

interface FormData {
  title: string;
  category: string;
  categoryCode: string;
  duration: number | '';
  director: string;
  synopsis: string;
  posterUrl: string;
  videoUrl: string;
  copyrightChecked: boolean;
}

const initialForm: FormData = {
  title: '',
  category: '',
  categoryCode: '',
  duration: '',
  director: '',
  synopsis: '',
  posterUrl: '',
  videoUrl: '',
  copyrightChecked: false,
};

export default function CreatorSubmit() {
  const navigate = useNavigate();
  const { categories, addFilm, initData } = useStore();
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCopyrightModal, setShowCopyrightModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as string]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key as string];
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!form.title.trim()) nextErrors.title = '请输入作品标题';
    if (!form.category) nextErrors.category = '请选择作品分类';
    if (form.duration === '' || Number(form.duration) <= 0) {
      nextErrors.duration = '请输入有效时长';
    } else if (Number(form.duration) > MAX_DURATION) {
      nextErrors.duration = `作品时长不能超过 ${MAX_DURATION} 分钟`;
    }
    if (!form.director.trim()) nextErrors.director = '请输入导演姓名';
    if (!form.synopsis.trim()) nextErrors.synopsis = '请输入作品简介';
    if (!form.copyrightChecked) nextErrors.copyrightChecked = '请阅读并同意版权声明';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const name = file.name.replace(/\\.[^/.]+$/, '');
    if (!form.title) updateField('title', name);
    updateField('videoUrl', file.name);
    updateField('posterUrl', `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(`cinematic film poster for movie ${name} dramatic lighting`)}&image_size=portrait_4_3`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    const cat = categories.find((c) => c.id === form.category);
    const duration = Number(form.duration);

    if (duration > MAX_DURATION) {
      setErrors((prev) => ({ ...prev, duration: `作品时长不能超过 ${MAX_DURATION} 分钟` }));
      setIsSubmitting(false);
      return;
    }

    addFilm({
      title: form.title.trim(),
      category: cat?.name || '',
      categoryCode: cat?.code || '',
      duration,
      director: form.director.trim(),
      synopsis: form.synopsis.trim(),
      videoUrl: form.videoUrl,
      posterUrl: form.posterUrl || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(`film poster ${form.title} cinematic`)}&image_size=portrait_4_3`,
      copyrightChecked: form.copyrightChecked,
    } as Omit<Film, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'score' | 'judgeComment' | 'isSelected' | 'isLocked'>);

    await new Promise((r) => setTimeout(r, 600));
    setIsSubmitting(false);
    navigate('/creator');
  };

  const durationExceeded = form.duration !== '' && Number(form.duration) > MAX_DURATION;

  return (
    <Layout title="新增投稿" showBack backTo="/creator">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8">
        <div className="card-base p-6">
          <h3 className="font-serif text-lg font-semibold text-cream-50 mb-5">基本信息</h3>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="label-base">作品标题 *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="请输入作品标题"
                className={`input-base ${errors.title ? 'border-ember-500 focus:border-ember-500 focus:ring-ember-500/30' : ''}`}
              />
              {errors.title && <p className="mt-1 text-xs text-ember-400">{errors.title}</p>}
            </div>
            <div>
              <label className="label-base">作品分类 *</label>
              <select
                value={form.category}
                onChange={(e) => {
                  const cat = categories.find((c) => c.id === e.target.value);
                  setForm((prev) => ({ ...prev, category: e.target.value, categoryCode: cat?.code || '' }));
                  if (errors.category) {
                    setErrors((prev) => { const n = { ...prev }; delete n.category; return n; });
                  }
                }}
                className={`input-base ${errors.category ? 'border-ember-500' : ''}`}
              >
                <option value="">请选择分类</option>
                {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
              {errors.category && <p className="mt-1 text-xs text-ember-400">{errors.category}</p>}
            </div>
            <div>
              <label className="label-base flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> 时长（分钟）*
                <span className="ml-auto text-xs text-cream-200/40">上限 {MAX_DURATION} 分钟</span>
              </label>
              <input
                type="number"
                min="1"
                max={MAX_DURATION}
                value={form.duration}
                onChange={(e) => updateField('duration', e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="例如：15"
                className={`input-base ${durationExceeded || errors.duration ? 'border-ember-500' : ''}`}
              />
              {durationExceeded && (
                <p className="mt-1 text-xs text-ember-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> 时长超过上限，需压缩至 {MAX_DURATION} 分钟以内
                </p>
              )}
              {!durationExceeded && errors.duration && (
                <p className="mt-1 text-xs text-ember-400">{errors.duration}</p>
              )}
            </div>
            <div>
              <label className="label-base">导演 *</label>
              <input
                type="text"
                value={form.director}
                onChange={(e) => updateField('director', e.target.value)}
                placeholder="导演姓名"
                className={`input-base ${errors.director ? 'border-ember-500' : ''}`}
              />
              {errors.director && <p className="mt-1 text-xs text-ember-400">{errors.director}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="label-base">作品简介 *</label>
              <textarea
                rows={4}
                value={form.synopsis}
                onChange={(e) => updateField('synopsis', e.target.value)}
                placeholder="简要描述作品内容、创作背景等"
                className={`input-base resize-none ${errors.synopsis ? 'border-ember-500' : ''}`}
              />
              {errors.synopsis && <p className="mt-1 text-xs text-ember-400">{errors.synopsis}</p>}
            </div>
          </div>
        </div>

        <div className="card-base p-6">
          <h3 className="font-serif text-lg font-semibold text-cream-50 mb-5">作品文件</h3>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-ink-700 hover:border-gold-500/50 rounded-xl p-10 text-center cursor-pointer transition-colors group"
          >
            <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />
            <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-ink-700 flex items-center justify-center group-hover:bg-ink-700/80 transition-colors">
              {form.videoUrl ? (
                <FileVideo className="w-7 h-7 text-gold-400" />
              ) : (
                <Upload className="w-7 h-7 text-cream-200/40" />
              )}
            </div>
            {form.videoUrl ? (
              <>
                <p className="font-medium text-cream-100 mb-1">{form.videoUrl}</p>
                <p className="text-sm text-gold-400">点击重新选择文件</p>
              </>
            ) : (
              <>
                <p className="font-medium text-cream-100 mb-1">点击或拖拽上传视频文件</p>
                <p className="text-sm text-cream-200/50">支持 MP4、MOV、AVI 等常见视频格式</p>
              </>
            )}
          </div>
        </div>

        <div className="card-base p-6">
          <h3 className="font-serif text-lg font-semibold text-cream-50 mb-4">版权声明</h3>
          <div className="mb-4 p-4 rounded-xl bg-ink-900/60 border border-ink-700">
            <div className="flex items-start gap-3 mb-3">
              <Info className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-cream-200/80 leading-relaxed">
                本作品为本人原创，本人拥有完整著作权。本人授权社区影展在本次活动及相关宣传中放映、展示本作品。
                本人保证作品不侵犯任何第三方合法权益，如产生纠纷由本人承担全部责任。
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCopyrightModal(true)}
              className="text-sm text-gold-400 hover:text-gold-300 underline underline-offset-2"
            >
              查看完整版权声明
            </button>
          </div>
          <label className={`flex items-start gap-3 cursor-pointer p-4 rounded-xl border transition-colors ${
            form.copyrightChecked ? 'border-gold-500/50 bg-gold-500/5' : 'border-ink-700 hover:border-ink-600'
          } ${errors.copyrightChecked ? 'border-ember-500' : ''}`}>
            <div className={`w-5 h-5 mt-0.5 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
              form.copyrightChecked ? 'bg-gold-500 border-gold-500' : 'border-ink-600'
            }`}>
              {form.copyrightChecked && <CheckCircle2 className="w-4 h-4 text-ink-900" />}
            </div>
            <input
              type="checkbox"
              className="sr-only"
              checked={form.copyrightChecked}
              onChange={(e) => updateField('copyrightChecked', e.target.checked)}
            />
            <span className="text-sm text-cream-100">我已阅读并同意以上版权声明 *</span>
          </label>
          {errors.copyrightChecked && (
            <p className="mt-2 text-xs text-ember-400">{errors.copyrightChecked}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pb-4">
          <button type="button" onClick={() => navigate('/creator')} className="btn-secondary">取消</button>
          <button type="submit" disabled={isSubmitting} className="btn-primary min-w-[140px]">
            {isSubmitting ? '提交中...' : '提交作品'}
          </button>
        </div>
      </form>

      {showCopyrightModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowCopyrightModal(false)}>
          <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg card-base p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-xl font-semibold text-cream-50 mb-4">完整版权声明</h3>
            <div className="space-y-3 text-sm text-cream-200/80 leading-relaxed max-h-80 overflow-y-auto pr-2">
              <p>一、投稿人保证其提交的作品（包括但不限于视频、音乐、图像、文字等）为其原创或已获得合法授权，不侵犯任何第三方的著作权、肖像权、名誉权、隐私权等合法权益。</p>
              <p>二、投稿人授权社区影展在本次影展期间及相关宣传推广活动中，无偿使用该作品进行放映、展示、网络传播等。</p>
              <p>三、如因投稿人提交的作品产生任何法律纠纷，由投稿人自行承担全部法律责任，并赔偿影展主办方因此遭受的一切损失。</p>
              <p>四、影展主办方保留对作品进行适当剪辑用于宣传的权利，完整作品的放映需征得投稿人同意。</p>
              <p>五、本声明的最终解释权归社区影展组委会所有。</p>
            </div>
            <button onClick={() => setShowCopyrightModal(false)} className="mt-5 w-full btn-primary">我已阅读</button>
          </div>
        </div>
      )}
    </Layout>
  );
}
''',
    'Edit.tsx': '''import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Clock, Lock } from 'lucide-react';
import Layout from '@/components/Layout';
import { useStore } from '@/store/useStore';

export default function CreatorEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getFilmById, updateFilm, initData, isResultsPublished } = useStore();
  const film = getFilmById(id || '');

  const [title, setTitle] = useState('');
  const [director, setDirector] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    initData();
  }, [initData]);

  useEffect(() => {
    if (film) {
      setTitle(film.title);
      setDirector(film.director);
      setSynopsis(film.synopsis);
    }
  }, [film]);

  const isLocked = isResultsPublished || film?.isLocked;

  if (!film) {
    return (
      <Layout title="编辑作品" showBack backTo="/creator">
        <div className="card-base p-12 text-center">
          <p className="text-cream-200/60">作品不存在</p>
          <button onClick={() => navigate('/creator')} className="btn-secondary mt-4">返回</button>
        </div>
      </Layout>
    );
  }

  const handleSave = async () => {
    if (isLocked || !id) return;
    setIsSaving(true);
    updateFilm(id, { title: title.trim(), director: director.trim(), synopsis: synopsis.trim() });
    await new Promise((r) => setTimeout(r, 400));
    setIsSaving(false);
    navigate('/creator');
  };

  return (
    <Layout title="编辑作品" showBack backTo="/creator">
      <div className="max-w-3xl mx-auto space-y-6">
        {isLocked && (
          <div className="p-4 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-start gap-3">
            <Lock className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gold-400 mb-0.5">作品已锁定</p>
              <p className="text-cream-200/70 text-sm">入围名单公布后，作品资料不可修改</p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <div className="card-base overflow-hidden">
              <div className="aspect-[4/3] overflow-hidden bg-ink-700">
                <img src={film.posterUrl} alt={film.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 text-sm text-cream-200/60 mb-2">
                  <Clock className="w-3.5 h-3.5" /> {film.duration}分钟
                </div>
                <div className="text-xs text-gold-400">{film.category}</div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-5">
            <div className="card-base p-6 space-y-5">
              <div>
                <label className="label-base">作品标题</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isLocked}
                  className="input-base disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="label-base">导演</label>
                <input
                  type="text"
                  value={director}
                  onChange={(e) => setDirector(e.target.value)}
                  disabled={isLocked}
                  className="input-base disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="label-base">作品简介</label>
                <textarea
                  rows={6}
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  disabled={isLocked}
                  className="input-base resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button onClick={() => navigate('/creator')} className="btn-secondary">取消</button>
              <button onClick={handleSave} disabled={isLocked || isSaving} className="btn-primary min-w-[120px]">
                {isSaving ? '保存中...' : '保存修改'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
'''
}

for filename, content in files.items():
    filepath = os.path.join(base_dir, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Created: {filepath}')

print('All files created successfully!')
