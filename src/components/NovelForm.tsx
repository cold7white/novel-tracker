import React, { useState, useEffect } from 'react';
import type { Novel, ReadingStatus, ReadingSession } from '../types/novel';
import { COVER_COLORS, generateId } from '../utils/generateId';
import DatePicker from './DatePicker';
import { useNovels } from '../contexts/NovelContext';
import './NovelForm.css';

interface NovelFormProps {
  novel?: Novel | null;
  onSave: (data: {
    title: string;
    author: string;
    status: ReadingStatus;
    rating: number;
    tags: string[];
    readingSessions: ReadingSession[];
    coverColor: string;
    coverImage?: string;
    categoryId?: string;
  }) => void;
  onCancel: () => void;
}

const NovelForm: React.FC<NovelFormProps> = ({ novel, onSave, onCancel }) => {
  const { categories } = useNovels();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState<ReadingStatus>('read');
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [readingSessions, setReadingSessions] = useState<ReadingSession[]>([]);
  const [coverColor, setCoverColor] = useState('#6B7280');
  const [categoryId, setCategoryId] = useState('default');

  useEffect(() => {
    if (novel) {
      setTitle(novel.title);
      setAuthor(novel.author);
      setStatus(novel.status);
      setRating(novel.rating);
      setTags(novel.tags);
      setReadingSessions(novel.readingSessions || []);
      setCoverColor(novel.coverColor);
      setCategoryId(novel.categoryId || 'default');
    }
  }, [novel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('请输入书名');
      return;
    }
    onSave({
      title: title.trim(),
      author: author.trim(),
      status,
      rating,
      tags: tags.filter(t => t.trim()),
      readingSessions: readingSessions.filter(s => s.startDate.trim()),
      coverColor,
      coverImage: novel?.coverImage,
      categoryId
    });
  };

  const addReadingSession = () => {
    setReadingSessions([...readingSessions, { id: generateId(), startDate: '' }]);
  };

  const removeReadingSession = (id: string) => {
    setReadingSessions(readingSessions.filter(s => s.id !== id));
  };

  const updateReadingSession = (id: string, field: 'startDate' | 'endDate', value: string) => {
    setReadingSessions(readingSessions.map(s =>
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{novel ? '编辑书籍' : '添加书籍'}</h3>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="novel-form">
          <div className="form-group">
            <label>书名 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入书名"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>作者</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="请输入作者"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>阅读状态</label>
              <div className="status-buttons">
                <button
                  type="button"
                  className={`status-btn ${status === 'read' ? 'active' : ''}`}
                  onClick={() => setStatus('read')}
                >
                  已读
                </button>
                <button
                  type="button"
                  className={`status-btn ${status === 'reading' ? 'active' : ''}`}
                  onClick={() => setStatus('reading')}
                >
                  在读
                </button>
                <button
                  type="button"
                  className={`status-btn ${status === 'want' ? 'active' : ''}`}
                  onClick={() => setStatus('want')}
                >
                  想读
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>评分</label>
              <div className="rating-input">
                {[1, 2, 3, 4, 5].map(star => {
                  const isFilled = star <= rating;
                  return (
                    <span
                      key={star}
                      className={`star ${isFilled ? 'filled' : ''}`}
                      onClick={() => setRating(star)}
                    >
                      <svg className="star-icon" viewBox="0 0 1024 1024" width="24" height="24">
                        {isFilled ? (
                          <path d="M313.991837 914.285714c-20.37551 0-40.228571-6.269388-56.946939-18.808163-30.302041-21.942857-44.930612-58.514286-38.661225-95.085714l24.032654-141.061225c3.134694-18.285714-3.134694-36.571429-16.195919-49.110204L123.297959 509.910204c-26.644898-26.122449-36.04898-64.261224-24.555102-99.787755 11.493878-35.526531 41.795918-61.126531 78.889796-66.35102l141.583674-20.375511c18.285714-2.612245 33.959184-14.106122 41.795918-30.30204l63.216326-128.522449C440.946939 130.612245 474.383673 109.714286 512 109.714286s71.053061 20.897959 87.24898 54.334694L662.987755 292.571429c8.359184 16.195918 24.032653 27.689796 41.795918 30.30204l141.583674 20.375511c37.093878 5.22449 67.395918 30.82449 78.889796 66.35102 11.493878 35.526531 2.089796 73.665306-24.555102 99.787755l-102.4 99.787755c-13.061224 12.538776-19.330612 31.346939-16.195919 49.110204l24.032654 141.061225c6.269388 37.093878-8.359184 73.142857-38.661225 95.085714-30.302041 21.942857-69.485714 24.555102-102.4 7.314286L538.122449 836.440816c-16.195918-8.359184-35.526531-8.359184-51.722449 0l-126.955102 66.87347c-14.628571 7.314286-30.302041 10.971429-45.453061 10.971428z m162.481632-96.653061z" fill="#F2CB51"/>
                        ) : (
                          <path d="M313.991837 914.285714c-20.37551 0-40.228571-6.269388-56.946939-18.808163-30.302041-21.942857-44.930612-58.514286-38.661225-95.085714l24.032654-141.061225c3.134694-18.285714-3.134694-36.571429-16.195919-49.110204L123.297959 509.910204c-26.644898-26.122449-36.04898-64.261224-24.555102-99.787755 11.493878-35.526531 41.795918-61.126531 78.889796-66.35102l141.583674-20.375511c18.285714-2.612245 33.959184-14.106122 41.795918-30.30204l63.216326-128.522449C440.946939 130.612245 474.383673 109.714286 512 109.714286s71.053061 20.897959 87.24898 54.334694L662.987755 292.571429c8.359184 16.195918 24.032653 27.689796 41.795918 30.30204l141.583674 20.375511c37.093878 5.22449 67.395918 30.82449 78.889796 66.35102 11.493878 35.526531 2.089796 73.665306-24.555102 99.787755l-102.4 99.787755c-13.061224 12.538776-19.330612 31.346939-16.195919 49.110204l24.032654 141.061225c6.269388 37.093878-8.359184 73.142857-38.661225 95.085714-30.302041 21.942857-69.485714 24.555102-102.4 7.314286L538.122449 836.440816c-16.195918-8.359184-35.526531-8.359184-51.722449 0l-126.955102 66.87347c-14.628571 7.314286-30.302041 10.971429-45.453061 10.971428z m162.481632-96.653061z" fill="none" stroke="#515151" strokeWidth="60"/>
                        )}
                      </svg>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>阅读记录</label>
            <div className="reading-sessions">
              {readingSessions.map((session, index) => (
                <div key={session.id} className="reading-session-row">
                  <span className="session-label">{index + 1}.</span>
                  <div className="session-inputs">
                    <DatePicker
                      value={session.startDate}
                      onChange={(value) => updateReadingSession(session.id, 'startDate', value)}
                      placeholder="开始日期"
                    />
                    <span className="session-arrow">→</span>
                    <DatePicker
                      value={session.endDate || ''}
                      onChange={(value) => updateReadingSession(session.id, 'endDate', value)}
                      placeholder="结束日期(选填)"
                    />
                  </div>
                  <button
                    type="button"
                    className="remove-session-btn"
                    onClick={() => removeReadingSession(session.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button type="button" className="add-session-btn" onClick={addReadingSession}>
                + 添加阅读记录
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>分类</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>封面颜色</label>
            <div className="color-options">
              {COVER_COLORS.map(color => (
                <div
                  key={color}
                  className={`color-option ${coverColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setCoverColor(color)}
                />
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>标签</label>
            <div className="tags-input">
              <div className="tags-list">
                {tags.map((tag, index) => (
                  <span key={index} className="tag editable-tag">
                    {tag}
                    <button type="button" className="remove-tag-btn" onClick={() => removeTag(tag)}>×</button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagInputKeyPress}
                placeholder="输入标签后按回车添加"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              {novel ? '保存' : '添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NovelForm;
