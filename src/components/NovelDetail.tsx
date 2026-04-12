import React, { useState, useEffect } from 'react';
import type { Novel } from '../types/novel';
import './NovelDetail.css';

interface NovelDetailProps {
  novel: Novel;
  onSave: (details: string) => void;
  onUpdate: (id: string, updates: Partial<Novel>) => void;
  onBack: () => void;
}

const NovelDetail: React.FC<NovelDetailProps> = ({ novel, onSave, onUpdate, onBack }) => {
  const [details, setDetails] = useState(novel.details);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNovel, setEditedNovel] = useState({
    title: novel.title,
    author: novel.author,
    status: novel.status,
    rating: novel.rating,
    tags: [...novel.tags],
    readingDate: novel.readingDate || ''
  });
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    setDetails(novel.details);
  }, [novel]);

  const handleSave = () => {
    onSave(details);
    onBack();
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedNovel({
      title: novel.title,
      author: novel.author,
      status: novel.status,
      rating: novel.rating,
      tags: [...novel.tags],
      readingDate: novel.readingDate || ''
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    onUpdate(novel.id, editedNovel);
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
      stars.push(
        <span key={i} className={`star ${i <= novel.rating ? 'filled' : ''}`}>
          ★
        </span>
      );
    }
    return stars;
  };

  const renderEditableStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`star ${i <= editedNovel.rating ? 'filled' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => setEditedNovel({ ...editedNovel, rating: i })}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div className="detail-overlay">
      <div className="detail-content">
        {/* 顶部工具栏 */}
        <div className="detail-header">
          <button className="back-btn" onClick={onBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
            返回
          </button>
          <button className="save-btn" onClick={handleSave}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
            </svg>
            保存
          </button>
        </div>

        {/* 信息区域 */}
        <div className="detail-info-section">
          <div className="detail-cover" style={{ backgroundColor: novel.coverColor }}>
            <div className="detail-cover-title">{novel.title}</div>
          </div>
          <div className="detail-meta">
            {!isEditing ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-md)' }}>
                  <h2 className="detail-title">{novel.title}</h2>
                  <button className="edit-info-btn" onClick={handleEdit}>
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
                  <span className={`status-indicator status-${novel.status}`}></span>
                  {getStatusText()}
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
                    <span>{novel.readingDate}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-md)' }}>
                  <h2 className="detail-title">编辑信息</h2>
                  <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <button className="cancel-edit-btn" onClick={handleCancelEdit}>取消</button>
                    <button className="save-edit-btn" onClick={handleSaveEdit}>保存</button>
                  </div>
                </div>
                <div className="meta-row">
                  <span className="meta-label">标题:</span>
                  <input
                    type="text"
                    value={editedNovel.title}
                    onChange={(e) => setEditedNovel({ ...editedNovel, title: e.target.value })}
                    className="detail-edit-input"
                  />
                </div>
                <div className="meta-row">
                  <span className="meta-label">作者:</span>
                  <input
                    type="text"
                    value={editedNovel.author}
                    onChange={(e) => setEditedNovel({ ...editedNovel, author: e.target.value })}
                    className="detail-edit-input"
                  />
                </div>
                <div className="meta-row">
                  <span className="meta-label">状态:</span>
                  <select
                    value={editedNovel.status}
                    onChange={(e) => setEditedNovel({ ...editedNovel, status: e.target.value as any })}
                    className="detail-edit-input"
                  >
                    <option value="reading">在读</option>
                    <option value="read">已读</option>
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
                        <span key={index} className="tag editable-tag">
                          {tag}
                          <button
                            className="remove-tag-btn"
                            onClick={() => handleRemoveTag(tag)}
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
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                        placeholder="添加标签"
                        className="detail-edit-input tag-input"
                      />
                      <button className="add-tag-btn" onClick={handleAddTag}>+</button>
                    </div>
                  </div>
                </div>
                <div className="meta-row">
                  <span className="meta-label">日期:</span>
                  <input
                    type="date"
                    value={editedNovel.readingDate}
                    onChange={(e) => setEditedNovel({ ...editedNovel, readingDate: e.target.value })}
                    className="detail-edit-input"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* 记录区域 */}
        <div className="detail-editor-section">
          <textarea
            className="detail-textarea"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="在这里记录小说内容、人物、评价等..."
            autoFocus
          />
        </div>
      </div>
    </div>
  );
};

export default NovelDetail;
