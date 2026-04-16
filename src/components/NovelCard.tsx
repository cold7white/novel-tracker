import React, { useState, useEffect, useRef } from 'react';
import type { Novel } from '../types/novel';
import { getLatestReadingDate } from '../types/novel';
import type { Category } from '../types/category';
import { COVER_COLORS, generateId } from '../utils/generateId';
import DatePicker from './DatePicker';
import './NovelCard.css';

interface NovelCardProps {
  novel: Novel;
  viewMode?: 'card' | 'list';
  onEdit: (novel: Novel) => void;
  onDelete: (id: string) => void;
  onColorChange: (id: string, color: string) => void;
  onViewDetail: (novel: Novel) => void;
  onInlineEditSave?: (id: string, updates: Partial<Novel>) => void;
  onCoverImageUpload?: (id: string, imageData: string) => void;
  onCoverReset?: (id: string) => void;
  onCategoryChange?: (id: string, categoryId: string) => void;
  categories?: Category[];
  contextMenuOpen?: boolean;
  contextMenuPosition?: { x: number; y: number } | null;
  onContextMenu?: (novelId: string, position: { x: number; y: number }) => void;
  onCloseContextMenu?: () => void;
}

const NovelCard: React.FC<NovelCardProps> = ({
  novel,
  viewMode = 'card',
  onEdit,
  onDelete,
  onColorChange,
  onViewDetail,
  onInlineEditSave,
  onCoverImageUpload,
  onCoverReset,
  onCategoryChange,
  categories = [],
  contextMenuOpen = false,
  contextMenuPosition,
  onContextMenu,
  onCloseContextMenu
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(novel.title);
  const [editAuthor, setEditAuthor] = useState(novel.author);
  const [editStatus, setEditStatus] = useState(novel.status);
  const [editRating, setEditRating] = useState(novel.rating);
  const [editTags, setEditTags] = useState(novel.tags);
  const [editReadingDate, setEditReadingDate] = useState(getLatestReadingDate(novel.readingSessions || []) || '');
  const [tagInput, setTagInput] = useState('');

  // 长按状态
  const [longPressTimer, setLongPressTimer] = useState<number | null>(null);

  // 文件上传引用
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState<{ x: number; y: number } | null>(null);

  // 处理封面上传
  const handleCoverUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onCoverImageUpload) {
      // 检查文件大小（限制为 500KB）
      const maxSize = 500 * 1024; // 500KB in bytes
      if (file.size > maxSize) {
        alert('图片太大！请选择小于 500KB 的图片');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onCoverImageUpload(novel.id, base64String);
      };
      reader.readAsDataURL(file);
    }
    // 重置input以允许再次选择同一文件
    if (event.target) {
      event.target.value = '';
    }
  };

  // 处理封面重置
  const handleCoverReset = () => {
    if (onCoverReset) {
      onCoverReset(novel.id);
    }
    setShowColorPicker(false);
    setShowCategoryPicker(false);
  };

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenuOpen) {
        onCloseContextMenu?.();
        setShowColorPicker(false);
        setShowCategoryPicker(false);
      }
    };

    if (contextMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [contextMenuOpen, onCloseContextMenu]);

  // 菜单位置边界检测
  useEffect(() => {
    if (contextMenuOpen && contextMenuPosition && contextMenuRef.current) {
      const menu = contextMenuRef.current;
      const menuRect = menu.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let x = contextMenuPosition.x;
      let y = contextMenuPosition.y;

      if (x + menuRect.width > vw) {
        x = vw - menuRect.width - 8;
      }
      if (y + menuRect.height > vh) {
        y = vh - menuRect.height - 8;
      }
      if (x < 0) x = 8;
      if (y < 0) y = 8;

      setAdjustedPosition({ x, y });
    } else {
      setAdjustedPosition(null);
    }
  }, [contextMenuOpen, contextMenuPosition]);

  // 清理长按计时器
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (isEditing) return;
    e.preventDefault();
    e.stopPropagation();
    onContextMenu?.(novel.id, { x: e.clientX, y: e.clientY });
    setShowColorPicker(false);
  };

  // 长按开始
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isEditing) return;
    const timer = setTimeout(() => {
      // 触觉反馈（如果支持）
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      // 显示菜单
      const touch = e.touches[0];
      onContextMenu?.(novel.id, { x: touch.clientX, y: touch.clientY });
      setShowColorPicker(false);
    }, 500); // 500ms 长按
    setLongPressTimer(timer);
  };

  // 长按结束
  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // 长按移动取消
  const handleTouchMove = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleColorChange = (color: string) => {
    // 当选择颜色时，清除封面图片，只保留颜色背景
    onColorChange(novel.id, color);
    setShowColorPicker(false);
  };

  const handleCategoryChange = (categoryId: string) => {
    onCategoryChange?.(novel.id, categoryId);
    setShowCategoryPicker(false);
    onCloseContextMenu?.();
  };

  const handleEdit = () => {
    setIsEditing(true);
    setShowColorPicker(false);
    onCloseContextMenu?.();
  };

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      const updates: any = {
        title: editTitle.trim(),
        author: editAuthor.trim(),
        status: editStatus,
        rating: editRating,
        tags: editTags,
      };

      // 如果修改了日期，更新阅读记录
      if (editReadingDate.trim()) {
        const existingSessions = [...(novel.readingSessions || [])];
        const sortedSessions = [...existingSessions].sort(
          (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
        if (sortedSessions.length > 0) {
          const idx = existingSessions.findIndex(s => s.id === sortedSessions[0].id);
          if (idx !== -1) {
            existingSessions[idx] = { ...existingSessions[idx], startDate: editReadingDate.trim() };
          }
          updates.readingSessions = existingSessions;
        } else {
          updates.readingSessions = [{ id: generateId(), startDate: editReadingDate.trim() }];
        }
      }

      if (onInlineEditSave) {
        onInlineEditSave(novel.id, updates);
      } else {
        onEdit({ ...novel, ...updates });
      }
    }
    setIsEditing(false);
  };

  // 获取最近一次阅读日期用于显示
  const latestReadingDate = getLatestReadingDate(novel.readingSessions || []);

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
    onDelete(novel.id);
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
      onClick={handleCoverClick}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleCoverUpload}
      />

      {/* 封面 */}
      <div
        className="novel-cover"
        style={{
          backgroundColor: novel.coverColor,
          backgroundImage: novel.coverImage ? `url(${novel.coverImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {!isEditing && !novel.coverImage && (
          <div className="novel-cover-title">{novel.title}</div>
        )}
        {!isEditing && (
          <span className={`cover-status-badge status-${novel.status}`}>{getStatusText()}</span>
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
      {contextMenuOpen && !isEditing && contextMenuPosition && (
        <div
          className="context-menu"
          ref={contextMenuRef}
          style={{ top: (adjustedPosition || contextMenuPosition).y, left: (adjustedPosition || contextMenuPosition).x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="menu-item" onClick={() => setShowColorPicker(!showColorPicker)}>
            <svg width="16" height="16" viewBox="0 0 1024 1024" fill="currentColor">
              <path d="M512 85.333333c235.605333 0 426.666667 169.728 426.666667 379.264a237.141333 237.141333 0 0 1-237.056 237.013334h-83.882667c-39.338667 0-71.125333 31.786667-71.125333 71.125333 0 18.005333 7.125333 34.602667 18.005333 46.933333 11.392 12.8 18.517333 29.397333 18.517333 47.872C583.125333 906.922667 550.4 938.666667 512 938.666667 276.394667 938.666667 85.333333 747.605333 85.333333 512S276.394667 85.333333 512 85.333333zM320 512a64 64 0 1 0 0-128 64 64 0 0 0 0 128z m384 0a64 64 0 1 0 0-128 64 64 0 0 0 0 128zM512 384a64 64 0 1 0 0-128 64 64 0 0 0 0 128z"/>
            </svg>
            颜色
          </div>
          <div className="menu-item" onClick={() => fileInputRef.current?.click()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
            </svg>
            上传封面
          </div>
          {novel.coverImage && (
            <div className="menu-item" onClick={handleCoverReset}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              重置封面
            </div>
          )}
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
          <div className="menu-item" onClick={() => { setShowCategoryPicker(!showCategoryPicker); setShowColorPicker(false); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l-5.5 9h11L12 2zm0 3.84L13.93 9h-3.87L12 5.84zM17.5 13c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM3 21.5h8v-8H3v8zm2-6h4v4H5v-4z"/>
            </svg>
            更改分类
          </div>
          {showCategoryPicker && (
            <div className="category-picker-submenu">
              <div className="category-picker-title">选择分类</div>
              {[...categories].reverse().map(cat => (
                <div
                  key={cat.id}
                  className={`category-option ${(novel.categoryId || 'default') === cat.id ? 'selected' : ''}`}
                  onClick={() => handleCategoryChange(cat.id)}
                >
                  {cat.name}
                </div>
              ))}
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
                    <span key={index} className="tag editable-tag">
                      {tag}
                      <button className="remove-tag-btn" onClick={(e) => { e.stopPropagation(); removeTag(tag); }}>×</button>
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
                  <div className={`novel-reading-date ${latestReadingDate ? '' : 'empty'}`}>
                    {latestReadingDate && (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" style={{ marginRight: '2px', verticalAlign: 'text-bottom' }}>
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        {latestReadingDate}
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
                <div className={`novel-reading-date ${latestReadingDate ? '' : 'empty'}`}>
                  {latestReadingDate && (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" style={{ marginRight: '2px', verticalAlign: 'text-bottom' }}>
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      {latestReadingDate}
                    </>
                  )}
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
