import React, { useState } from 'react';
import type { Excerpt, CreateExcerptInput } from '../types/excerpt';
import ExcerptCard from './ExcerptCard';
import ExcerptDetail from './ExcerptDetail';
import './ExcerptList.css';

interface ExcerptListProps {
  excerpts: Excerpt[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: CreateExcerptInput) => void;
  onAdd: () => void;
  initialExcerptId?: string;
}

const ExcerptList: React.FC<ExcerptListProps> = ({ excerpts, onDelete, onUpdate, onAdd, initialExcerptId }) => {
  const [viewingExcerpt, setViewingExcerpt] = useState<Excerpt | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 处理 initialExcerptId
  React.useEffect(() => {
    if (initialExcerptId && excerpts.length > 0) {
      const excerpt = excerpts.find(e => e.id === initialExcerptId);
      if (excerpt) {
        setViewingExcerpt(excerpt);
      }
    }
  }, [initialExcerptId, excerpts]);

  const handleCardClick = (excerpt: Excerpt) => {
    setViewingExcerpt(excerpt);
  };

  const handleCloseDetail = () => {
    setViewingExcerpt(null);
  };

  const handleSave = (id: string, data: CreateExcerptInput) => {
    onUpdate(id, data);
    setViewingExcerpt(null);
  };

  // 过滤书摘
  const filteredExcerpts = searchTerm
    ? excerpts.filter(excerpt =>
        excerpt.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (excerpt.chapter && excerpt.chapter.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (excerpt.note && excerpt.note.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : excerpts;

  if (excerpts.length === 0 && !showSearch) {
    return (
      <div className="excerpts-empty">
        <svg width="64" height="64" viewBox="0 0 1024 1024" fill="none" stroke="#9CA3AF" strokeWidth="30">
          <path d="M17.570428 968.951172c-1.518345 13.700414 12.535172 23.728552 26.023724 18.184828l237.532689-98.162759-234.990344-163.945931C37.30891 798.967172 18.87691 956.910345 17.570428 968.951172zM643.622841 757.971862c0 18.220138 16.242759 32.979862 36.299035 32.979862h289.968552c20.020966 0 36.263724-14.759724 36.263724-32.979862 0-18.149517-16.242759-32.944552-36.263724-32.944552H679.886566c-20.020966 0-36.299034 14.795034-36.299035 32.944552zM798.317462 210.802759a48.022069 48.022069 0 0 0-10.946207-69.172966L616.186703 15.465931c-23.022345-16.207448-55.472552-11.475862-72.456827 10.487172l-15.36 19.915035 254.552276 184.814345 15.36-19.879724zM510.255669 65.924414l-456.209655 617.577931 265.180689 191.205517 456.209656-617.613241-265.18069-191.170207zM370.497324 694.166069a31.108414 31.108414 0 0 1-42.831448 6.850207 29.66069 29.66069 0 0 1-6.885517-41.94869l287.355586-389.932138a31.108414 31.108414 0 0 1 42.796138-6.850207 29.625379 29.625379 0 0 1 6.920827 41.91338L370.497324 694.201379zM971.338152 922.765241H414.741186c-19.173517 0-34.745379 14.724414-34.745379 32.979862 0 18.184828 15.536552 32.944552 34.745379 32.944552h556.596966c19.244138 0 34.816-14.759724 34.816-32.944552 0-18.255448-15.571862-32.979862-34.816-32.979862z"/>
        </svg>
        <p>还没有添加书摘</p>
        <p className="empty-hint">记录书中的精彩片段吧</p>
        <button className="add-first-excerpt-btn" onClick={onAdd}>
          + 添加第一条书摘
        </button>
      </div>
    );
  }

  return (
    <div className="excerpts-list">
      <div className="excerpts-header">
        <h3 className="excerpts-title">书摘 ({filteredExcerpts.length})</h3>
        <div className="excerpts-actions">
          <button className="add-excerpt-btn" onClick={onAdd} title="添加书摘">
            <svg width="18" height="18" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
              <path d="M469.333333 469.333333V170.666667h85.333334v298.666666h298.666666v85.333334h-298.666666v298.666666h-85.333334v-298.666666H170.666667v-85.333334h298.666666z" fill="white"/>
            </svg>
          </button>
          <button className="search-excerpt-btn" onClick={() => setShowSearch(!showSearch)} title="搜索书摘">
            <svg width="20" height="20" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
              <path d="M782.165333 701.724444a369.777778 369.777778 0 1 0-80.440889 80.440889l111.388445 111.388445a56.888889 56.888889 0 0 0 80.440889-80.440889l-111.388445-111.388445z m-117.589333-399.189333Q739.555556 377.514667 739.555556 483.555556q0 106.040889-74.979556 181.020444Q589.596444 739.555556 483.555556 739.555556q-106.040889 0-181.020445-74.979556Q227.555556 589.596444 227.555556 483.555556q0-106.040889 74.979555-181.020445Q377.514667 227.555556 483.555556 227.555556q106.040889 0 181.020444 74.979555z" fill="#2D2D2D"/>
            </svg>
          </button>
        </div>
      </div>
      {showSearch && (
        <div className="excerpts-search-bar">
          <input
            type="text"
            className="excerpts-search-input"
            placeholder="搜索书摘内容..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>
      )}
      <div className="excerpts-grid">
        {filteredExcerpts.map(excerpt => (
          <ExcerptCard
            key={excerpt.id}
            excerpt={excerpt}
            onClick={handleCardClick}
            onDelete={onDelete}
          />
        ))}
      </div>

      {viewingExcerpt && (
        <ExcerptDetail
          excerpt={viewingExcerpt}
          onSave={handleSave}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
};

export default ExcerptList;
