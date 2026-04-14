import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Novel } from '../types/novel';
import type { Excerpt, CreateExcerptInput } from '../types/excerpt';
import { useNovels } from '../contexts/NovelContext';
import ExcerptForm from './ExcerptForm';
import ExcerptList from './ExcerptList';
import DatePicker from './DatePicker';
import './NovelDetail.css';

type TabType = 'notes' | 'excerpts';

interface NovelDetailProps {
  novel: Novel;
  onUpdate: (id: string, updates: Partial<Novel>) => void;
  onBack: () => void;
  initialActiveTab?: TabType;
  initialExcerptId?: string;
}

const NovelDetail: React.FC<NovelDetailProps> = ({ novel, onUpdate, onBack, initialActiveTab, initialExcerptId }) => {
  const { addExcerpt, updateExcerpt, deleteExcerpt, getExcerpts } = useNovels();
  const [activeTab, setActiveTab] = useState<TabType>(initialActiveTab || 'notes');
  const [isEditing, setIsEditing] = useState(false);

  // 当 initialActiveTab 变化时更新标签页
  useEffect(() => {
    if (initialActiveTab) {
      setActiveTab(initialActiveTab);
    }
  }, [initialActiveTab]);

  // 当 initialExcerptId 存在时切换到书摘标签页
  useEffect(() => {
    if (initialExcerptId) {
      setActiveTab('excerpts');
    }
  }, [initialExcerptId]);

  // 使用 memo 来避免不必要的状态更新
  const [editedNovel, setEditedNovel] = useState({
    title: novel.title,
    author: novel.author,
    status: novel.status,
    rating: novel.rating,
    tags: [...novel.tags],
    readingDate: novel.readingDate || ''
  });

  const [newTag, setNewTag] = useState('');

  // 书评和书摘相关状态
  const [showExcerptForm, setShowExcerptForm] = useState(false);
  const [editingExcerpt, setEditingExcerpt] = useState<Excerpt | null>(null);
  const [excerpts, setExcerpts] = useState<Excerpt[]>([]);

  // 初始化 details 状态，过滤掉 UUID 格式的数据
  const [details, setDetails] = useState<string>(() => {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(novel.details);
    return isUUID ? '' : (novel.details || '');
  });

  // 使用 ref 来保存防抖定时器
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDetailsRef = useRef<string>('');

  // 使用 effect 来加载书摘，避免在渲染期间调用函数
  useEffect(() => {
    setExcerpts(getExcerpts(novel.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [novel.id]); // 只在 novel.id 变化时重新加载

  // 处理用户输入 - 使用防抖保存
  const handleDetailsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDetails = e.target.value;
    setDetails(newDetails);

    // 清除之前的定时器
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // 设置新的定时器，延迟保存
    saveTimeoutRef.current = setTimeout(() => {
      // 检查是否是 UUID 格式
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(newDetails);

      // 如果不是 UUID 且与上次保存的内容不同，则保存
      if (!isUUID && newDetails !== lastSavedDetailsRef.current) {
        lastSavedDetailsRef.current = newDetails;
        onUpdate(novel.id, {
          details: newDetails
        });
      }
    }, 500); // 500ms 防抖延迟
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleEdit = () => {
    // 简化编辑逻辑，避免复杂的状态更新
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    // 取消编辑，恢复原始数据
    setIsEditing(false);
    setEditedNovel({
      title: novel.title,
      author: novel.author,
      status: novel.status,
      rating: novel.rating,
      tags: Array.from(novel.tags),
      readingDate: novel.readingDate || ''
    });
  };

  const handleSaveEdit = () => {
    // 更新数据
    onUpdate(novel.id, {
      title: editedNovel.title,
      author: editedNovel.author,
      status: editedNovel.status,
      rating: editedNovel.rating,
      tags: editedNovel.tags,
      readingDate: editedNovel.readingDate
    });
    setIsEditing(false);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !editedNovel.tags.includes(newTag.trim())) {
      setEditedNovel({
        ...editedNovel,
        tags: [...editedNovel.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditedNovel({
      ...editedNovel,
      tags: editedNovel.tags.filter(tag => tag !== tagToRemove)
    });
  };

  // 书摘操作处理函数
  const handleAddExcerpt = () => {
    setEditingExcerpt(null);
    setShowExcerptForm(true);
  };

  const handleEditExcerpt = async (id: string, data: CreateExcerptInput) => {
    try {
      await updateExcerpt(novel.id, id, data);
      setExcerpts(getExcerpts(novel.id));
    } catch (error) {
      console.error('Failed to update excerpt:', error);
    }
  };

  const handleSaveExcerpt = async (data: CreateExcerptInput) => {
    try {
      if (editingExcerpt) {
        await updateExcerpt(novel.id, editingExcerpt.id, data);
        setExcerpts(getExcerpts(novel.id));
      } else {
        const newExcerpt = await addExcerpt(novel.id, data);
        setExcerpts(prev => [...prev, newExcerpt]);
      }
      setShowExcerptForm(false);
      setEditingExcerpt(null);
    } catch (error) {
      console.error('Failed to save excerpt:', error);
    }
  };

  const handleDeleteExcerpt = (excerptId: string) => {
    deleteExcerpt(novel.id, excerptId);
    setExcerpts(prev => prev.filter(e => e.id !== excerptId));
  };

  const handleCancelExcerptForm = () => {
    setShowExcerptForm(false);
    setEditingExcerpt(null);
  };

  const getStatusText = () => {
    switch (novel.status) {
      case 'reading': return '在读';
      case 'read': return '已读';
      case 'want': return '想看';
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= novel.rating;
      stars.push(
        <span key={i} className={`star ${isFilled ? 'filled' : ''}`}>
          <svg className="star-icon" viewBox="0 0 1024 1024" width="20" height="20">
            {isFilled ? (
              <path d="M313.991837 914.285714c-20.37551 0-40.228571-6.269388-56.946939-18.808163-30.302041-21.942857-44.930612-58.514286-38.661225-95.085714l24.032654-141.061225c3.134694-18.285714-3.134694-36.571429-16.195919-49.110204L123.297959 509.910204c-26.644898-26.122449-36.04898-64.261224-24.555102-99.787755 11.493878-35.526531 41.795918-61.126531 78.889796-66.35102l141.583674-20.375511c18.285714-2.612245 33.959184-14.106122 41.795918-30.30204l63.216326-128.522449C440.946939 130.612245 474.383673 109.714286 512 109.714286s71.053061 20.897959 87.24898 54.334694L662.987755 292.571429c8.359184 16.195918 24.032653 27.689796 41.795918 30.30204l141.583674 20.375511c37.093878 5.22449 67.395918 30.82449 78.889796 66.35102 11.493878 35.526531 2.089796 73.665306-24.555102 99.787755l-102.4 99.787755c-13.061224 12.538776-19.330612 31.346939-16.195919 49.110204l24.032654 141.061225c6.269388 37.093878-8.359184 73.142857-38.661225 95.085714-30.302041 21.942857-69.485714 24.555102-102.4 7.314286L538.122449 836.440816c-16.195918-8.359184-35.526531-8.359184-51.722449 0l-126.955102 66.87347c-14.628571 7.314286-30.302041 10.971429-45.453061 10.971428z m162.481632-96.653061z" fill="#F2CB51"/>
            ) : (
              <path d="M313.991837 914.285714c-20.37551 0-40.228571-6.269388-56.946939-18.808163-30.302041-21.942857-44.930612-58.514286-38.661225-95.085714l24.032654-141.061225c3.134694-18.285714-3.134694-36.571429-16.195919-49.110204L123.297959 509.910204c-26.644898-26.122449-36.04898-64.261224-24.555102-99.787755 11.493878-35.526531 41.795918-61.126531 78.889796-66.35102l141.583674-20.375511c18.285714-2.612245 33.959184-14.106122 41.795918-30.30204l63.216326-128.522449C440.946939 130.612245 474.383673 109.714286 512 109.714286s71.053061 20.897959 87.24898 54.334694L662.987755 292.571429c8.359184 16.195918 24.302653 27.689796 41.795918 30.30204l141.583674 20.375511c37.093878 5.22449 67.395918 30.82449 78.889796 66.35102 11.493878 35.526531 2.089796 73.665306-24.555102 99.787755l-102.4 99.787755c-13.061224 12.538776-19.330612 31.346939-16.195919 49.110204l24.032654 141.061225c6.269388 37.093878-8.359184 73.142857-38.661225 95.085714-30.302041 21.942857-69.485714 24.555102-102.4 7.314286L538.122449 836.440816c-16.195918-8.359184-35.526531-8.359184-51.722449 0l-126.955102 66.87347c-14.628571 7.314286-30.302041 10.971429-45.453061 10.971428z m162.481632-96.653061z" fill="none" stroke="#515151" strokeWidth="60"/>
            )}
          </svg>
        </span>
      );
    }
    return stars;
  };

  const renderEditableStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= editedNovel.rating;
      stars.push(
        <span
          key={`editable-${i}`}
          className={`star ${isFilled ? 'filled' : ''}`}
          onClick={() => setEditedNovel({ ...editedNovel, rating: i })}
        >
          <svg className="star-icon" viewBox="0 0 1024 1024" width="20" height="20">
            {isFilled ? (
              <path d="M313.991837 914.285714c-20.37551 0-40.228571-6.269388-56.946939-18.808163-30.302041-21.942857-44.930612-58.514286-38.661225-95.085714l24.032654-141.061225c3.134694-18.285714-3.134694-36.571429-16.195919-49.110204L123.297959 509.910204c-26.644898-26.122449-36.04898-64.261224-24.555102-99.787755 11.493878-35.526531 41.795918-61.126531 78.889796-66.35102l141.583674-20.375511c18.285714-2.612245 33.959184-14.106122 41.795918-30.30204l63.216326-128.522449C440.946939 130.612245 474.383673 109.714286 512 109.714286s71.053061 20.897959 87.24898 54.334694L662.987755 292.571429c8.359184 16.195918 24.032653 27.689796 41.795918 30.30204l141.583674 20.375511c37.093878 5.22449 67.395918 30.82449 78.889796 66.35102 11.493878 35.526531 2.089796 73.665306-24.555102 99.787755l-102.4 99.787755c-13.061224 12.538776-19.330612 31.346939-16.195919 49.110204l24.032654 141.061225c6.269388 37.093878-8.359184 73.142857-38.661225 95.085714-30.302041 21.942857-69.485714 24.555102-102.4 7.314286L538.122449 836.440816c-16.195918-8.359184-35.526531-8.359184-51.722449 0l-126.955102 66.87347c-14.628571 7.314286-30.302041 10.971429-45.453061 10.971428z m162.481632-96.653061z" fill="#F2CB51"/>
            ) : (
              <path d="M313.991837 914.285714c-20.37551 0-40.228571-6.269388-56.946939-18.808163-30.302041-21.942857-44.930612-58.514286-38.661225-95.085714l24.032654-141.061225c3.134694-18.285714-3.134694-36.571429-16.195919-49.110204L123.297959 509.910204c-26.644898-26.122449-36.04898-64.261224-24.555102-99.787755 11.493878-35.526531 41.795918-61.126531 78.889796-66.35102l141.583674-20.375511c18.285714-2.612245 33.959184-14.106122 41.795918-30.30204l63.216326-128.522449C440.946939 130.612245 474.383673 109.714286 512 109.714286s71.053061 20.897959 87.24898 54.334694L662.987755 292.571429c8.359184 16.195918 24.302653 27.689796 41.795918 30.30204l141.583674 20.375511c37.093878 5.22449 67.395918 30.82449 78.889796 66.35102 11.493878 35.526531 2.089796 73.665306-24.555102 99.787755l-102.4 99.787755c-13.061224 12.538776-19.330612 31.346939-16.195919 49.110204l24.032654 141.061225c6.269388 37.093878-8.359184 73.142857-38.661225 95.085714-30.302041 21.942857-69.485714 24.555102-102.4 7.314286L538.122449 836.440816c-16.195918-8.359184-35.526531-8.359184-51.722449 0l-126.955102 66.87347c-14.628571 7.314286-30.302041 10.971429-45.453061 10.971428z m162.481632-96.653061z" fill="none" stroke="#515151" strokeWidth="60"/>
            )}
          </svg>
        </span>
      );
    }
    return stars;
  };

  return (
    <div className="detail-overlay" onClick={(e) => e.stopPropagation()}>
      <div className="detail-content" onClick={(e) => e.stopPropagation()}>
        {/* 顶部工具栏 */}
        <div className="detail-header">
          <button className="back-btn" onClick={onBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
            返回
          </button>
        </div>

        {/* 信息区域 */}
        <div className="detail-info-section">
          <div className="detail-cover-wrapper">
            <div className="detail-cover" style={{
              backgroundColor: novel.coverColor,
              backgroundImage: novel.coverImage ? `url(${novel.coverImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}>
              {!novel.coverImage && (
                <div className="detail-cover-title">{novel.title}</div>
              )}
            </div>
          </div>
          <div className="detail-meta">
            {!isEditing && (
              <div className="detail-view-mode">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                  <h2 className="detail-title">{novel.title}</h2>
                  <button className="edit-info-btn" onClick={(e) => {
                    e.stopPropagation();
                    handleEdit();
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                    编辑
                  </button>
                </div>
                <div className="meta-row">
                  <span className="meta-label">作者:</span>
                  <span>{novel.author || '未知作者'}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">状态:</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className={`status-indicator status-${novel.status}`}></span>
                    {getStatusText()}
                  </span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">评分:</span>
                  <div className="rating">{renderStars()}</div>
                </div>
                <div className="meta-row">
                  <span className="meta-label">标签:</span>
                  <div className="tags">
                    {novel.tags.length > 0 ? (
                      novel.tags.map((tag, index) => (
                        <span key={index} className="tag">{tag}</span>
                      ))
                    ) : (
                      <span className="no-tags">暂无标签</span>
                    )}
                  </div>
                </div>
                {novel.readingDate && (
                  <div className="meta-row">
                    <span className="meta-label">日期:</span>
                    <div className="novel-reading-date">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" style={{ marginRight: '4px', verticalAlign: 'text-bottom' }}>
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      {novel.readingDate}
                    </div>
                  </div>
                )}
              </div>
            )}
            {isEditing && (
              <div>
                <div className="meta-row">
                  <span className="meta-label">标题:</span>
                  <input
                    type="text"
                    value={editedNovel.title}
                    onChange={(e) => {
                      e.stopPropagation();
                      setEditedNovel({ ...editedNovel, title: e.target.value });
                    }}
                    className="detail-edit-input"
                  />
                  <div className="edit-actions-desktop">
                    <button className="cancel-edit-btn" onClick={handleCancelEdit}>取消</button>
                    <button className="save-edit-btn" onClick={handleSaveEdit}>保存</button>
                  </div>
                  <div className="edit-actions-mobile">
                    <button className="cancel-edit-btn" onClick={handleCancelEdit}>取消</button>
                    <button className="save-edit-btn" onClick={handleSaveEdit}>保存</button>
                  </div>
                </div>
                <div className="meta-row">
                  <span className="meta-label">作者:</span>
                  <input
                    type="text"
                    value={editedNovel.author}
                    onChange={(e) => {
                      e.stopPropagation();
                      setEditedNovel({ ...editedNovel, author: e.target.value });
                    }}
                    className="detail-edit-input"
                  />
                </div>
                <div className="meta-row">
                  <span className="meta-label">状态:</span>
                  <select
                    value={editedNovel.status}
                    onChange={(e) => {
                      e.stopPropagation();
                      setEditedNovel({ ...editedNovel, status: e.target.value as any });
                    }}
                    className="detail-edit-input"
                  >
                    <option value="read">已读</option>
                    <option value="reading">在读</option>
                    <option value="want">想看</option>
                  </select>
                </div>
                <div className="meta-row">
                  <span className="meta-label">评分:</span>
                  <div className="rating">{renderEditableStars()}</div>
                </div>
                <div className="meta-row">
                  <span className="meta-label">标签:</span>
                  <div className="tags-edit">
                    <div className="tags-list">
                      {editedNovel.tags.map((tag, index) => (
                        <span key={tag + index} className="tag editable-tag">
                          {tag}
                          <button
                            className="remove-tag-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveTag(tag);
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="add-tag-row">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => {
                          e.stopPropagation();
                          setNewTag(e.target.value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddTag();
                          }
                        }}
                        placeholder="添加标签"
                        className="detail-edit-input tag-input"
                      />
                      <button
                        className="add-tag-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddTag();
                        }}
                      >+</button>
                    </div>
                  </div>
                </div>
                <div className="meta-row">
                  <span className="meta-label">日期:</span>
                  <DatePicker
                    value={editedNovel.readingDate}
                    onChange={(date) => {
                      setEditedNovel({ ...editedNovel, readingDate: date });
                    }}
                    placeholder="选择阅读日期"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 选项卡导航 */}
        <div className="detail-tabs-nav">
          <button
            className={`detail-tab ${activeTab === 'notes' ? 'active' : ''}`}
            onClick={() => setActiveTab('notes')}
          >
            <svg width="18" height="18" viewBox="0 0 1024 1024" fill="currentColor" style={{ marginRight: '6px' }}>
              <path d="M481.578667 968.832l-157.909334-158.293333H85.418667A85.290667 85.290667 0 0 1 0 725.12L0.426667 128.042667C0.426667 80.768 38.4 42.666667 85.845333 42.666667h852.778667c47.189333 0 85.418667 38.101333 85.376 85.418666l-0.426667 597.12c0 47.146667-38.229333 85.333333-85.376 85.333334h-237.781333l-158.549333 158.293333a42.624 42.624 0 0 1-60.288 0z m456.704-243.712L938.666667 128.042667s-852.906667-0.128-852.906667 0.042666c0 0-0.384 597.077333-0.298667 597.077334H341.333333c11.306667 0 22.186667 4.48 30.165334 12.501333l140.330666 140.629333 140.8-140.672a42.624 42.624 0 0 1 30.165334-12.458666h255.488zM277.333333 512a64 64 0 1 1 0-128 64 64 0 0 1 0 128z m234.666667 0a64 64 0 1 1 0-128 64 64 0 0 1 0 128z m234.666667 0a64 64 0 1 1 0-128 64 64 0 0 1 0 128z"/>
            </svg>
            书评
          </button>
          <button
            className={`detail-tab ${activeTab === 'excerpts' ? 'active' : ''}`}
            onClick={() => setActiveTab('excerpts')}
          >
            <svg width="18" height="18" viewBox="0 0 1024 1024" fill="currentColor" style={{ marginRight: '6px' }}>
              <path d="M17.570428 968.951172c-1.518345 13.700414 12.535172 23.728552 26.023724 18.184828l237.532689-98.162759-234.990344-163.945931C37.30891 798.967172 18.87691 956.910345 17.570428 968.951172zM643.622841 757.971862c0 18.220138 16.242759 32.979862 36.299035 32.979862h289.968552c20.020966 0 36.263724-14.759724 36.263724-32.979862 0-18.149517-16.242759-32.944552-36.263724-32.944552H679.886566c-20.020966 0-36.299034 14.795034-36.299035 32.944552zM798.317462 210.802759a48.022069 48.022069 0 0 0-10.946207-69.172966L616.186703 15.465931c-23.022345-16.207448-55.472552-11.475862-72.456827 10.487172l-15.36 19.915035 254.552276 184.814345 15.36-19.879724zM510.255669 65.924414l-456.209655 617.577931 265.180689 191.205517 456.209656-617.613241-265.18069-191.170207zM370.497324 694.166069a31.108414 31.108414 0 0 1-42.831448 6.850207 29.66069 29.66069 0 0 1-6.885517-41.94869l287.355586-389.932138a31.108414 31.108414 0 0 1 42.796138-6.850207 29.625379 29.625379 0 0 1 6.920827 41.91338L370.497324 694.201379zM971.338152 922.765241H414.741186c-19.173517 0-34.745379 14.724414-34.745379 32.979862 0 18.184828 15.536552 32.944552 34.745379 32.944552h556.596966c19.244138 0 34.816-14.759724 34.816-32.944552 0-18.255448-15.571862-32.979862-34.816-32.979862z"/>
            </svg>
            书摘
          </button>
        </div>

        {/* 选项卡内容区域 */}
        <div className="detail-tab-content">
          {activeTab === 'notes' && (
            <div className="detail-editor-section">
              <textarea
                className="detail-textarea"
                value={details || ''}
                onChange={handleDetailsChange}
                placeholder="在这里记录书籍内容、人物、评价等..."
              />
            </div>
          )}
          {activeTab === 'excerpts' && (
            <div className="detail-excerpts-section">
              <ExcerptList
                excerpts={excerpts}
                onDelete={handleDeleteExcerpt}
                onUpdate={handleEditExcerpt}
                onAdd={handleAddExcerpt}
                initialExcerptId={initialExcerptId}
              />
            </div>
          )}
        </div>

        {/* 书摘表单 - 使用 Portal 渲染到 body，避免 DOM 冲突 */}
        {showExcerptForm && createPortal(
          <ExcerptForm
            excerpt={editingExcerpt}
            onSave={handleSaveExcerpt}
            onCancel={handleCancelExcerptForm}
          />,
          document.body
        )}
      </div>
    </div>
  );
};

export default NovelDetail;
