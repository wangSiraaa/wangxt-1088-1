import { Link, useLocation } from 'react-router-dom';
import { Film, Users, Eye, Calendar, Home } from 'lucide-react';
import { useFilmFestivalStore } from '@/store/useFilmFestivalStore';
import type { UserRole } from '@/types';

const roleNavItems: Record<UserRole, { to: string; label: string; icon: React.ReactNode }[]> = {
  creator: [
    { to: '/creator', label: '我的作品', icon: <Film className="w-5 h-5" /> },
  ],
  judge: [
    { to: '/judge', label: '评审作品', icon: <Eye className="w-5 h-5" /> },
  ],
  volunteer: [
    { to: '/volunteer', label: '放映安排', icon: <Calendar className="w-5 h-5" /> },
  ],
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { currentRole, setCurrentRole, resultsPublished, toggleResultsPublished } = useFilmFestivalStore();

  const navItems = roleNavItems[currentRole];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <Film className="w-8 h-8" />
              <h1 className="text-2xl font-bold">社区影展</h1>
            </Link>

            <div className="flex items-center space-x-4">
              <div className="flex bg-white/20 rounded-lg p-1">
                {(['creator', 'judge', 'volunteer'] as UserRole[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => setCurrentRole(role)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentRole === role
                        ? 'bg-white text-indigo-600'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    {role === 'creator' && '创作者'}
                    {role === 'judge' && '评审'}
                    {role === 'volunteer' && '志愿者'}
                  </button>
                ))}
              </div>

              <button
                onClick={toggleResultsPublished}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  resultsPublished
                    ? 'bg-green-500 text-white'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {resultsPublished ? '结果已公布' : '结果未公布'}
              </button>
            </div>
          </div>

          <nav className="mt-4 flex space-x-1">
            <Link
              to="/"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                location.pathname === '/'
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>首页</span>
            </Link>
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  location.pathname.startsWith(item.to)
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="bg-gray-800 text-gray-400 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="flex items-center justify-center space-x-2">
            <Users className="w-4 h-4" />
            <span>社区影展作品投递系统 · 让好电影被看见</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
