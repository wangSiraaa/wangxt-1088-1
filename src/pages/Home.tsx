import { Film, Award, Calendar, Users, Clock, CheckCircle } from 'lucide-react';
import { useFilmFestivalStore } from '@/store/useFilmFestivalStore';

export default function Home() {
  const { works, categories, screeningSessions, getSelectedWorks, currentRole, resultsPublished } = useFilmFestivalStore();
  const selectedWorks = getSelectedWorks();

  const stats = [
    { label: '投稿作品', value: works.length, icon: <Film className="w-6 h-6" />, color: 'bg-blue-500' },
    { label: '入围作品', value: selectedWorks.length, icon: <Award className="w-6 h-6" />, color: 'bg-yellow-500' },
    { label: '展映场次', value: screeningSessions.length, icon: <Calendar className="w-6 h-6" />, color: 'bg-green-500' },
    { label: '参赛分类', value: categories.length, icon: <Users className="w-6 h-6" />, color: 'bg-purple-500' },
  ];

  const roleInfo = {
    creator: {
      title: '创作者中心',
      description: '上传你的短片作品，参与影展评选',
      action: '立即投稿',
      actionLink: '/creator',
    },
    judge: {
      title: '评审中心',
      description: '按分类查看作品，进行评审打分',
      action: '开始评审',
      actionLink: '/judge',
    },
    volunteer: {
      title: '志愿者中心',
      description: '安排放映表，组织展映活动',
      action: '安排放映',
      actionLink: '/volunteer',
    },
  };

  const currentRoleInfo = roleInfo[currentRole];

  return (
    <div className="space-y-8">
      <section className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold mb-4">欢迎来到社区影展</h2>
          <p className="text-lg text-white/90 mb-6">
            发现优秀短片，支持独立创作。我们致力于为社区创作者提供展示的舞台，
            让每一个好故事都能被看见。
          </p>
          <div className="flex items-center space-x-4">
            <a
              href={currentRoleInfo.actionLink}
              className="inline-flex items-center space-x-2 bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              <Film className="w-5 h-5" />
              <span>{currentRoleInfo.action}</span>
            </a>
            <div className="text-white/80">
              当前身份：{currentRole === 'creator' ? '创作者' : currentRole === 'judge' ? '评审' : '志愿者'}
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-bold text-gray-800 mb-4">数据概览</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white mb-4`}>
                {stat.icon}
              </div>
              <div className="text-3xl font-bold text-gray-800">{stat.value}</div>
              <div className="text-gray-500 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            <span>参赛分类</span>
          </h3>
          <div className="space-y-3">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${cat.color}`}></div>
                  <span className="font-medium text-gray-800">{cat.name}</span>
                </div>
                <span className="text-sm text-gray-500">时长上限 {cat.maxDuration} 分钟</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>投稿须知</span>
          </h3>
          <ul className="space-y-3 text-gray-600">
            <li className="flex items-start space-x-2">
              <span className="text-indigo-500 mt-1">•</span>
              <span>作品需为原创，且未在其他影展获奖</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-indigo-500 mt-1">•</span>
              <span>请仔细阅读各分类时长限制</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-indigo-500 mt-1">•</span>
              <span>提交前请确认已阅读并同意版权声明</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-indigo-500 mt-1">•</span>
              <span>入围名单公布后，作品资料不可修改</span>
            </li>
          </ul>
        </div>
      </section>

      {resultsPublished && selectedWorks.length > 0 && (
        <section>
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
            <Award className="w-5 h-5 text-yellow-500" />
            <span>入围作品</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {selectedWorks.slice(0, 4).map((work) => {
              const category = categories.find((c) => c.id === work.category);
              return (
                <div key={work.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="aspect-video bg-gray-200 relative">
                    <img
                      src={work.coverUrl}
                      alt={work.title}
                      className="w-full h-full object-cover"
                    />
                    <div className={`absolute top-2 right-2 ${category?.color || 'bg-gray-500'} text-white text-xs px-2 py-1 rounded`}>
                      {category?.name}
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="font-semibold text-gray-800 truncate">{work.title}</h4>
                    <p className="text-sm text-gray-500">{work.creator}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
