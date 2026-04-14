import React, { useState } from 'react';
import type { Excerpt, CreateExcerptInput } from '../types/excerpt';
import DatePicker from './DatePicker';
import './ExcerptDetail.css';

interface ExcerptDetailProps {
  excerpt: Excerpt;
  onSave: (id: string, data: CreateExcerptInput) => void;
  onClose: () => void;
}

const ExcerptDetail: React.FC<ExcerptDetailProps> = ({ excerpt, onSave, onClose }) => {
  const [content, setContent] = useState(excerpt.content);
  const [chapter, setChapter] = useState(excerpt.chapter || '');
  const [pageNumber, setPageNumber] = useState(excerpt.pageNumber ? String(excerpt.pageNumber) : '');
  const [excerptDate, setExcerptDate] = useState(excerpt.excerptDate || '');
  const [note, setNote] = useState(excerpt.note || '');

  const handleSave = () => {
    if (!content.trim()) {
      alert('请输入摘录内容');
      return;
    }
    onSave(excerpt.id, {
      content: content.trim(),
      chapter: chapter.trim(),
      pageNumber: pageNumber.trim() ? parseInt(pageNumber) : undefined,
      excerptDate: excerptDate || undefined,
      tags: [],
      note: note.trim()
    });
    onClose();
  };

  return (
    <div className="excerpt-detail-overlay" onClick={onClose}>
      <div className="excerpt-detail-content" onClick={(e) => e.stopPropagation()}>
        <div className="excerpt-detail-header">
          <button className="excerpt-detail-close-btn" onClick={onClose} title="关闭">
            ×
          </button>
        </div>

        <div className="excerpt-detail-body">
          {/* 元信息 */}
          <div className="meta-section">
            <div className="meta-row">
              <div className="meta-item">
                <span className="meta-label">章节</span>
                <input
                  type="text"
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  placeholder="未设置"
                  className="meta-input"
                />
              </div>
              <div className="meta-item">
                <span className="meta-label">页码</span>
                <input
                  type="number"
                  value={pageNumber}
                  onChange={(e) => setPageNumber(e.target.value)}
                  placeholder="未设置"
                  className="meta-input"
                  min="1"
                />
              </div>
              <div className="meta-item">
                <span className="meta-label">日期</span>
                <DatePicker
                  value={excerptDate}
                  onChange={setExcerptDate}
                  placeholder="未设置"
                />
              </div>
            </div>
          </div>

          {/* 摘录内容 */}
          <div className="content-section">
            <h4 className="section-title">摘录内容</h4>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="content-textarea"
              placeholder="记录书中的精彩片段..."
            />
          </div>

          {/* 个人笔记 */}
          <div className="note-section">
            <h4 className="section-title">个人笔记</h4>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="note-textarea"
              placeholder="添加你的想法或感悟..."
            />
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="action-buttons">
          <button className="action-btn save-btn" onClick={handleSave}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExcerptDetail;
