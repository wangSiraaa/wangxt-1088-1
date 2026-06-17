import { useState } from 'react';
import { Plus, Calendar, MapPin, Clock, Film, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { useFilmFestivalStore } from '@/store/useFilmFestivalStore';
import AddScreeningModal from './AddScreeningModal';
import SessionFormModal from './SessionFormModal';
import type { ScreeningSession } from '@/types';

export default function VolunteerPage() {
  const {
    screeningSessions,
    works,
    addScreeningSession,
    updateScreeningSession,
    deleteScreeningSession,
    removeScreeningFromSession,
    getSelectedWorks,
  } = useFilmFestivalStore();

  const [showSessionForm, setShowSessionForm] = useState(false);
  const [editingSession, setEditingSession] = useState<ScreeningSession | null>(null);
  const [showAddScreening, setShowAddScreening] = useState<string | null>(null);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  const selectedWorks = getSelectedWorks();

  const toggleSession = (id: string) => {
    setExpandedSessions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAddSession = () => {
    setEditingSession(null);
    setShowSessionForm(true);
  };

  const handleEditSession = (session: ScreeningSession) => {
    setEditingSession(session);
    setShowSessionForm(true);
  };

  const handleDeleteSession = (id: string) => {
    if (window.confirm('确定要删除这个放映场次吗？')) {
      deleteScreeningSession(id);
    }
  };

  const handleSaveSession = (data: { name: string; date: string; startTime: string; venue: string }) => {
    if (editingSession) {
      updateScreeningSession(editingSession.id, data);
    } else {
      addScreeningSession(data);
    }
    setShowSessionForm(false);
    setEditingSession(null);
  };

  const handleAddScreening = (sessionId: string, workId: string) => {
    const { addScreeningToSession } = useFilmFestivalStore.getState();
    addScreeningToSession(sessionId, workId);
    setShowAddScreening(null);
  };

  const totalDuration = (session: ScreeningSession) => {
    return session.screenings.reduce((total, scr) => {
      const work = works.find((w) => w.id === scr.workId);
      return total + (work?.duration || 0);
    }, 0);
  };

  const sortedSessions = [...screeningSessions].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.startTime.localeCompare(b.startTime);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">放映安排</h2>
          <p className="text-gray-500 mt-1">管理展映场次和放映顺序</p>
        </div>
        <button
          onClick={handleAddSession}
          className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>新建场次</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">放映场次</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{screeningSessions.length}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">入围作品</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{selectedWorks.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Film className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">放映作品</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">
                {screeningSessions.reduce((sum, s) => sum + s.screenings.length, 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {sortedSessions.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">暂无放映场次</h3>
          <p className="text-gray-400 mb-6">创建第一个放映场次，开始安排展映</p>
          <button
            onClick={handleAddSession}
            className="inline-flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>新建场次</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedSessions.map((session) => {
            const isExpanded = expandedSessions.has(session.id);
            const total = totalDuration(session);

            return (
              <div key={session.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleSession(session.id)}
                >
                  <div className="flex items-center space-x-4">
                    <button className="text-gray-400 hover:text-gray-600 cursor-grab">
                      <GripVertical className="w-5 h-5" />
                    </button>
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-lg">{session.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{session.date}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{session.startTime}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{session.venue}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {session.screenings.length} 部作品
                      </p>
                      <p className="text-sm font-medium text-indigo-600">
                        总时长 {total} 分钟
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditSession(session);
                      }}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Plus className="w-5 h-5 rotate-45" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(session.id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t">
                    {session.screenings.length === 0 ? (
                      <div className="p-8 text-center">
                        <Film className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 mb-4">暂无排片</p>
                        <button
                          onClick={() => setShowAddScreening(session.id)}
                          className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                        >
                          + 添加作品
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {session.screenings.map((scr, index) => {
                          const work = works.find((w) => w.id === scr.workId);
                          if (!work) return null;

                          return (
                            <div
                              key={scr.id}
                              className="p-4 flex items-center space-x-4 hover:bg-gray-50 transition-colors"
                            >
                              <div className="text-gray-400 cursor-grab">
                                <GripVertical className="w-5 h-5" />
                              </div>
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-sm font-medium text-gray-600">
                                {index + 1}
                              </div>
                              <div className="w-16 h-10 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                                <img
                                  src={work.coverUrl}
                                  alt={work.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-800">{work.title}</h4>
                                <p className="text-sm text-gray-500">
                                  {work.creator} · {work.duration} 分钟
                                </p>
                              </div>
                              <div className="text-sm text-gray-500">
                                {scr.time}
                              </div>
                              <button
                                onClick={() => removeScreeningFromSession(session.id, scr.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="p-4 border-t bg-gray-50">
                      <button
                        onClick={() => setShowAddScreening(session.id)}
                        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center space-x-2"
                      >
                        <Plus className="w-5 h-5" />
                        <span>添加作品</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showSessionForm && (
        <SessionFormModal
          session={editingSession}
          onClose={() => {
            setShowSessionForm(false);
            setEditingSession(null);
          }}
          onSave={handleSaveSession}
        />
      )}

      {showAddScreening && (
        <AddScreeningModal
          sessionId={showAddScreening}
          onClose={() => setShowAddScreening(null)}
          onAdd={handleAddScreening}
        />
      )}
    </div>
  );
}
