import React, { useState, useEffect } from 'react';
import type { Novel } from '../types/novel';
import './NovelDetail.css';

interface NovelDetailProps {
  novel: Novel;
  onSave: (details: string) => void;
  onBack: () => void;
}

const NovelDetail: React.FC<NovelDetailProps> = ({ novel, onSave, onBack }) => {
  const [details, setDetails] = useState(novel.details);

  useEffect(() => {
    setDetails(novel.details);
  }, [novel]);

  const handleSave = () => {
    onSave(details);
    onBack();
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

  return (
    <div className="detail-overlay">
      <div className="detail-content">
        {/* 顶部工具栏 */}
        <div className="detail-header">
          <button className="back-btn" onClick={onBack}>
            ← 返回
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
            <h2 className="detail-title">{novel.title}</h2>
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
