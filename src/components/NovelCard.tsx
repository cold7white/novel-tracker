import React, { useState, useEffect } from 'react';
import type { Novel } from '../types/novel';
import { COVER_COLORS } from '../utils/generateId';
import DatePicker from './DatePicker';
import './NovelCard.css';

interface NovelCardProps {
  novel: Novel;
  viewMode?: 'card' | 'list';
  onEdit: (novel: Novel) => void;
  onDelete: (id: string) => void;
  onColorChange: (id: string, color: string) => void;
  onViewDetail: (novel: Novel) => void;
  onInlineEditSave?: (novel: Novel) => void;
}

const NovelCard: React.FC<NovelCardProps> = ({
  novel,
  viewMode = 'card',
  onEdit,
  onDelete,
  onColorChange,
  onViewDetail,
  onInlineEditSave
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(novel.title);
  const [editAuthor, setEditAuthor] = useState(novel.author);
  const [editStatus, setEditStatus] = useState(novel.status);
  const [editRating, setEditRating] = useState(novel.rating);
  const [editTags, setEditTags] = useState(novel.tags);
  const [editReadingDate, setEditReadingDate] = useState(novel.readingDate || '');
  const [tagInput, setTagInput] = useState('');
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = () => {
      setShowMenu(false);
      setShowColorPicker(false);
    };

    if (showMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [showMenu]);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (isEditing) return;
    e.preventDefault();
    e.stopPropagation();
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
    setShowColorPicker(false);
  };

  const handleColorChange = (color: string) => {
    onColorChange(novel.id, color);
    setShowColorPicker(false);
    setShowMenu(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setShowMenu(false);
    setShowColorPicker(false);
  };

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      const updatedNovel = {
        ...novel,
        title: editTitle.trim(),
        author: editAuthor.trim(),
        status: editStatus,
        rating: editRating,
        tags: editTags,
        readingDate: editReadingDate.trim()
      };

      if (onInlineEditSave) {
        onInlineEditSave(updatedNovel);
      } else {
        onEdit(updatedNovel);
      }
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(novel.title);
    setEditAuthor(novel.author);
    setEditStatus(novel.status);
    setEditRating(novel.rating);
    setEditTags(novel.tags);
    setEditReadingDate(novel.readingDate || '');
    setTagInput('');
    setIsEditing(false);
  };

  const addTag = () => {
    if (tagInput.trim() && !editTags.includes(tagInput.trim())) {
      setEditTags([...editTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditTags(editTags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleDelete = () => {
    if (confirm('确定要删除这本小说吗？')) {
      onDelete(novel.id);
    }
    setShowMenu(false);
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
          <svg className="star-icon" viewBox="0 0 1024 1024" width="14" height="14">
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

  const handleCoverClick = () => {
    if (!isEditing) {
      onViewDetail(novel);
    }
  };

  return (
    <div
      className={viewMode === 'card' ? 'novel-card' : 'novel-list-item'}
    >
      {/* 封面 */}
      <div
        className="novel-cover"
        style={{ backgroundColor: novel.coverColor }}
        onClick={handleCoverClick}
        onContextMenu={handleContextMenu}
      >
        {!isEditing && (
          <div className="novel-cover-title">{novel.title}</div>
        )}
        {isEditing && (
          <div className="edit-buttons" style={{ '--cover-color': novel.coverColor } as React.CSSProperties}>
            <div className="edit-confirm-btn" onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }}>
              确定
            </div>
          </div>
        )}
      </div>

      {/* 右键菜单 */}
      {showMenu && !isEditing && (
        <div
          className="context-menu"
          style={{ top: menuPosition.y, left: menuPosition.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="menu-item" onClick={() => setShowColorPicker(!showColorPicker)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 22C6.49 22 2 17.51 2 12S6.49 2 12 2s10 4.49 10 10-4.49 10-10 10zm0-18c4.41 0 8 3.59 8 8s-3.59 8-8 8-8-3.59-8-8 3.59-8 8-8z"/>
              <circle cx="12" cy="12" r="5"/>
            </svg>
            颜色
          </div>
          {showColorPicker && (
            <div className="color-picker-submenu">
              <div className="color-picker-title">选择颜色</div>
              <div className="color-options">
                {COVER_COLORS.map(color => (
                  <div
                    key={color}
                    className="color-option"
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorChange(color)}
                  />
                ))}
              </div>
            </div>
          )}
          <div className="menu-item" onClick={handleEdit}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
            编辑
          </div>
          <div className="menu-item danger" onClick={handleDelete}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
            删除
          </div>
        </div>
      )}

      {/* 内容 */}
      <div className="novel-content">
        {isEditing ? (
          <>
            <div className="edit-field">
              <label>书名</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="edit-field">
              <label>作者</label>
              <input
                type="text"
                value={editAuthor}
                onChange={(e) => setEditAuthor(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="edit-field">
              <label>状态</label>
              <select value={editStatus} onChange={(e) => { setEditStatus(e.target.value as any); e.stopPropagation(); }}>
                <option value="want">想看</option>
                <option value="reading">在读</option>
                <option value="read">已读</option>
              </select>
            </div>
            <div className="edit-field">
              <label>评分</label>
              <div className={`rating-input ${viewMode === 'list' ? 'rating-input-compact' : ''}`}>
                {[1, 2, 3, 4, 5].map(star => {
                  const isFilled = star <= editRating;
                  return (
                    <span
                      key={star}
                      className={`star ${isFilled ? 'filled' : ''}`}
                      onClick={(e) => { e.stopPropagation(); setEditRating(star); }}
                    >
                      <svg className="star-icon" viewBox="0 0 1024 1024" width="14" height="14">
                        {isFilled ? (
                          <path d="M313.991837 914.285714c-20.37551 0-40.228571-6.269388-56.946939-18.808163-30.302041-21.942857-44.930612-58.514286-38.661225-95.085714l24.032654-141.061225c3.134694-18.285714-3.134694-36.571429-16.195919-49.110204L123.297959 509.910204c-26.644898-26.122449-36.04898-64.261224-24.555102-99.787755 11.493878-35.526531 41.795918-61.126531 78.889796-66.35102l141.583674-20.375511c18.285714-2.612245 33.959184-14.106122 41.795918-30.30204l63.216326-128.522449C440.946939 130.612245 474.383673 109.714286 512 109.714286s71.053061 20.897959 87.24898 54.334694L662.987755 292.571429c8.359184 16.195918 24.032653 27.689796 41.795918 30.30204l141.583674 20.375511c37.093878 5.22449 67.395918 30.82449 78.889796 66.35102 11.493878 35.526531 2.089796 73.665306-24.555102 99.787755l-102.4 99.787755c-13.061224 12.538776-19.330612 31.346939-16.195919 49.110204l24.032654 141.061225c6.269388 37.093878-8.359184 73.142857-38.661225 95.085714-30.302041 21.942857-69.485714 24.555102-102.4 7.314286L538.122449 836.440816c-16.195918-8.359184-35.526531-8.359184-51.722449 0l-126.955102 66.87347c-14.628571 7.314286-30.302041 10.971429-45.453061 10.971428z m162.481632-96.653061z" fill="#F2CB51"/>
                        ) : (
                          <path d="M313.991837 914.285714c-20.37551 0-40.228571-6.269388-56.946939-18.808163-30.302041-21.942857-44.930612-58.514286-38.661225-95.085714l24.032654-141.061225c3.134694-18.285714-3.134694-36.571429-16.195919-49.110204L123.297959 509.910204c-26.644898-26.122449-36.04898-64.261224-24.555102-99.787755 11.493878-35.526531 41.795918-61.126531 78.889796-66.35102l141.583674-20.375511c18.285714-2.612245 33.959184-14.106122 41.795918-30.30204l63.216326-128.522449C440.946939 130.612245 474.383673 109.714286 512 109.714286s71.053061 20.897959 87.24898 54.334694L662.987755 292.571429c8.359184 16.195918 24.302653 27.689796 41.795918 30.30204l141.583674 20.375511c37.093878 5.22449 67.395918 30.82449 78.889796 66.35102 11.493878 35.526531 2.089796 73.665306-24.555102 99.787755l-102.4 99.787755c-13.061224 12.538776-19.330612 31.346939-16.195919 49.110204l24.032654 141.061225c6.269388 37.093878-8.359184 73.142857-38.661225 95.085714-30.302041 21.942857-69.485714 24.555102-102.4 7.314286L538.122449 836.440816c-16.195918-8.359184-35.526531-8.359184-51.722449 0l-126.955102 66.87347c-14.628571 7.314286-30.302041 10.971429-45.453061 10.971428z m162.481632-96.653061z" fill="none" stroke="#515151" strokeWidth="60"/>
                        )}
                      </svg>
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="edit-field">
              <label>阅读日期</label>
              <DatePicker
                value={editReadingDate}
                onChange={setEditReadingDate}
                placeholder="选择阅读日期"
              />
            </div>
            <div className="edit-field">
              <label>标签</label>
              <div className="tags-edit">
                <div className="tags-list">
                  {editTags.map((tag, index) => (
                    <span key={index} className="tag">
                      {tag}
                      <span onClick={(e) => { e.stopPropagation(); removeTag(tag); }}>×</span>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagInputKeyPress}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="输入标签按回车"
                />
              </div>
            </div>
          </>
        ) : (
          <>
            {viewMode === 'list' ? (
              <div className="list-view-content" key="list-view">
                <div className="content-row">
                  <div className="novel-title">{novel.title}</div>
                  <span className="content-separator">·</span>
                  <div className="novel-author">{novel.author || '未知作者'}</div>
                </div>
                <div className="content-row">
                  <div className="novel-status">
                    <span className={`status-indicator status-${novel.status}`}></span>
                    {getStatusText()}
                  </div>
                  <div className="novel-rating">{renderStars()}</div>
                  <div className={`novel-reading-date ${novel.readingDate ? '' : 'empty'}`}>
                    {novel.readingDate && (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" style={{ marginRight: '2px', verticalAlign: 'text-bottom' }}>
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        {novel.readingDate}
                      </>
                    )}
                  </div>
                  <div className="novel-tags">
                    {novel.tags.slice(0, 5).map((tag, index) => (
                      <span key={index} className="tag">{tag}</span>
                    ))}
                    {novel.tags.length > 5 && (
                      <span className="tag">+{novel.tags.length - 5}</span>
                    )}
                  </div>
                </div>
                {novel.details && (
                  <div className="novel-details-preview">
                    {novel.details}
                  </div>
                )}
              </div>
            ) : (
              <div className="card-view-content" key="card-view">
                <div className="novel-title">{novel.title}</div>
                <div className="novel-author">{novel.author || '未知作者'}</div>
                <div className="novel-status-row">
                  <div className="novel-status">
                    <span className={`status-indicator status-${novel.status}`}></span>
                    {getStatusText()}
                  </div>
                  <div className={`novel-reading-date ${novel.readingDate ? '' : 'empty'}`}>
                    {novel.readingDate && (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" style={{ marginRight: '2px', verticalAlign: 'text-bottom' }}>
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        {novel.readingDate}
                      </>
                    )}
                  </div>
                </div>
                <div className="novel-rating">{renderStars()}</div>
                <div className="novel-tags">
                  {novel.tags.slice(0, 3).map((tag, index) => (
                    <span key={index} className="tag">{tag}</span>
                  ))}
                  {novel.tags.length > 3 && (
                    <span className="tag">+{novel.tags.length - 3}</span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NovelCard;
