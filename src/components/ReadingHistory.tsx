import React, { useState } from 'react';
import type { ReadingSession, ReadingStatus } from '../types/novel';
import { generateId } from '../utils/generateId';
import DatePicker from './DatePicker';
import './ReadingHistory.css';

interface ReadingHistoryProps {
  sessions: ReadingSession[];
  novelStatus: ReadingStatus;
  onUpdate: (sessions: ReadingSession[]) => void;
}

const ReadingHistory: React.FC<ReadingHistoryProps> = ({ sessions, novelStatus, onUpdate }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  // 本地工作副本，编辑期间使用此数据
  const [workingSessions, setWorkingSessions] = useState<ReadingSession[] | null>(null);

  // 当前生效的数据源：编辑中用工作副本，否则用 props
  const activeSessions = workingSessions ?? sessions;

  // 排序后的显示列表
  const sortedSessions = [...activeSessions].sort(
    (a, b) => {
      const timeA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const timeB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return timeB - timeA;
    }
  );

  const total = sortedSessions.length;

  // 开始编辑某条记录
  const handleStartEdit = (id: string) => {
    setEditingId(id);
    setWorkingSessions([...sessions]);
  };

  // 完成编辑，保存到父组件
  const handleDone = () => {
    if (workingSessions) {
      onUpdate(workingSessions);
    }
    setEditingId(null);
    setWorkingSessions(null);
  };

  // 添加新记录，直接保存并进入编辑
  const addSession = () => {
    // 用当天日期，这样新记录会排在最上方
    const today = new Date().toISOString().split('T')[0];
    const newSession: ReadingSession = {
      id: generateId(),
      startDate: today,
    };
    const updated = [newSession, ...sessions];
    onUpdate(updated);
    setEditingId(newSession.id);
    setWorkingSessions(updated);
  };

  // 删除记录
  const removeSession = (id: string) => {
    if (editingId) {
      // 编辑中：从工作副本删除
      const updated = (workingSessions ?? sessions).filter(s => s.id !== id);
      setWorkingSessions(updated);
      // 如果删除的是正在编辑的记录，退出编辑并保存
      if (id === editingId) {
        onUpdate(updated);
        setEditingId(null);
        setWorkingSessions(null);
      }
    } else {
      // 非编辑状态：直接保存
      const updated = sessions.filter(s => s.id !== id);
      onUpdate(updated);
    }
  };

  // 更新记录字段（编辑中暂存，不立即保存）
  const updateSession = (id: string, field: 'startDate' | 'endDate', value: string) => {
    const current = workingSessions ?? sessions;
    const updated = current.map(s =>
      s.id === id ? { ...s, [field]: value } : s
    );
    if (editingId) {
      setWorkingSessions(updated);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="reading-history">
      <div className="history-timeline">
        {sortedSessions.length > 0 && (
          <div className="timeline-vertical-line"></div>
        )}
        <div className="timeline-item timeline-add">
          <div className="timeline-content">
            <button className="add-history-btn" onClick={addSession}>
              + 添加阅读记录
            </button>
          </div>
        </div>
        {sortedSessions.length === 0 ? (
          <div className="timeline-item timeline-record">
            <div className="timeline-marker">
              <div className="timeline-dot"></div>
            </div>
            <div className="timeline-content">
              <div className="history-empty">
                暂无阅读记录
              </div>
            </div>
          </div>
        ) : (
          sortedSessions.map((session, index) => {
            const sessionNumber = total - index;
            return (
              <div key={session.id} className="timeline-item timeline-record">
                <div className="timeline-marker">
                  <div className="timeline-dot"></div>
                </div>
                <div className="timeline-content">
                  {editingId === session.id ? (
                    <div className="session-edit">
                      <div className="session-edit-row">
                        <div className="session-label">第{sessionNumber}次阅读</div>
                        <DatePicker
                          value={session.startDate}
                          onChange={(value) => updateSession(session.id, 'startDate', value)}
                          placeholder="开始日期"
                        />
                        <span className="session-arrow">→</span>
                        <DatePicker
                          value={session.endDate || ''}
                          onChange={(value) => updateSession(session.id, 'endDate', value)}
                          placeholder="结束日期(选填)"
                        />
                        <div className="session-edit-actions">
                          <button
                            className="session-edit-cancel"
                            onClick={handleDone}
                          >
                            完成
                          </button>
                          <button
                            className="session-delete"
                            onClick={() => removeSession(session.id)}
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="session-display"
                      onClick={() => handleStartEdit(session.id)}
                    >
                      <div className="session-label">第{sessionNumber}次阅读</div>
                      <div className="session-dates">
                        {formatDate(session.startDate)}
                        {session.endDate ? (
                          <> → {formatDate(session.endDate)}</>
                        ) : !session.endDate && novelStatus === 'reading' ? (
                          <span className="ongoing-tag">进行中</span>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ReadingHistory;