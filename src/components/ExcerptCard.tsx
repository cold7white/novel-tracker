import React from 'react';
import type { Excerpt } from '../types/excerpt';
import './ExcerptCard.css';

interface ExcerptCardProps {
  excerpt: Excerpt;
  onClick: (excerpt: Excerpt) => void;
  onDelete: (id: string) => void;
}

const ExcerptCard: React.FC<ExcerptCardProps> = ({ excerpt, onClick, onDelete }) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(excerpt.id);
  };

  const handleClick = () => {
    onClick(excerpt);
  };

  return (
    <div className="excerpt-card" onClick={handleClick}>
      <button className="excerpt-delete-btn" onClick={handleDelete}>
        ×
      </button>

      {(excerpt.chapter || excerpt.pageNumber || excerpt.excerptDate) && (
        <div className="excerpt-meta">
          {excerpt.chapter && <span className="excerpt-chapter">{excerpt.chapter}</span>}
          {excerpt.pageNumber && <span className="excerpt-page">第 {excerpt.pageNumber} 页</span>}
          {excerpt.excerptDate && <span className="excerpt-date">{excerpt.excerptDate}</span>}
        </div>
      )}

      <div className="excerpt-content">{excerpt.content}</div>

      {excerpt.note && (
        <div className="excerpt-note">
          {excerpt.note}
        </div>
      )}
    </div>
  );
};

export default ExcerptCard;
