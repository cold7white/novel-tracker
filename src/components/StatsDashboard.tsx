import React, { useState, useMemo } from 'react';
import type { Novel } from '../types/novel';
import './StatsDashboard.css';

interface StatsDashboardProps {
  novels: Novel[];
  onClose: () => void;
}

const StatsDashboard: React.FC<StatsDashboardProps> = ({ novels, onClose }) => {
  const [trendPeriod, setTrendPeriod] = useState<'year' | 'month' | 'day'>('month');

  // 新配色方案
  const colors = {
    reading: '#EF476F',
    read: '#00A896',
    want: '#FFD166',
    accent: '#02C39A',
    primary: '#118AB2',
    secondary: '#7CDEDC',
    bg: '#F0F3BD',
    dark: '#073B4C'
  };

  // 计算统计数据
  const stats = useMemo(() => {
    const total = novels.length;
    const reading = novels.filter(n => n.status === 'reading').length;
    const read = novels.filter(n => n.status === 'read').length;
    const want = novels.filter(n => n.status === 'want').length;

    // 计算平均评分
    const ratedNovels = novels.filter(n => n.rating > 0);
    const avgRating = ratedNovels.length > 0
      ? (ratedNovels.reduce((sum, n) => sum + n.rating, 0) / ratedNovels.length).toFixed(1)
      : '0.0';

    // 获取所有标签并统计使用次数
    const tagCounts = new Map<string, number>();
    novels.forEach(novel => {
      novel.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });
    const topTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // 获取所有作者并统计作品数
    const authorCounts = new Map<string, number>();
    novels.forEach(novel => {
      if (novel.author) {
        authorCounts.set(novel.author, (authorCounts.get(novel.author) || 0) + 1);
      }
    });
    const topAuthors = Array.from(authorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // 按时间周期统计添加的小说数量
    const timeCounts = new Map<string, number>();
    const now = new Date();

    // 只统计有阅读时间的小说
    const novelsWithReadingDate = novels.filter(novel => novel.readingDate);

    if (trendPeriod === 'year') {
      // 近20年
      for (let i = 19; i >= 0; i--) {
        const year = now.getFullYear() - i;
        const yearKey = `${year}`;
        timeCounts.set(yearKey, 0);
      }
      novelsWithReadingDate.forEach(novel => {
        if (novel.readingDate) {
          const date = new Date(novel.readingDate);
          const yearKey = `${date.getFullYear()}`;
          if (timeCounts.has(yearKey)) {
            timeCounts.set(yearKey, (timeCounts.get(yearKey) || 0) + 1);
          }
        }
      });
    } else if (trendPeriod === 'month') {
      // 近12个月
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        timeCounts.set(monthKey, 0);
      }
      novelsWithReadingDate.forEach(novel => {
        if (novel.readingDate) {
          const date = new Date(novel.readingDate);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (timeCounts.has(monthKey)) {
            timeCounts.set(monthKey, (timeCounts.get(monthKey) || 0) + 1);
          }
        }
      });
    } else {
      // 近一个月，按天
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dayKey = `${date.getMonth() + 1}/${date.getDate()}`;
        timeCounts.set(dayKey, 0);
      }
      novelsWithReadingDate.forEach(novel => {
        if (novel.readingDate) {
          const date = new Date(novel.readingDate);
          const dayKey = `${date.getMonth() + 1}/${date.getDate()}`;
          if (timeCounts.has(dayKey)) {
            timeCounts.set(dayKey, (timeCounts.get(dayKey) || 0) + 1);
          }
        }
      });
    }

    const timeData = Array.from(timeCounts.entries());

    // 评分分布
    const ratingDistribution = [0, 0, 0, 0, 0];
    novels.forEach(novel => {
      if (novel.rating > 0) {
        ratingDistribution[novel.rating - 1]++;
      }
    });

    return {
      total,
      reading,
      read,
      want,
      avgRating,
      topTags,
      topAuthors,
      timeData,
      ratingDistribution
    };
  }, [novels, trendPeriod]);

  // 渲染饼图
  const renderPieChart = () => {
    if (stats.total === 0) return <div className="empty-chart">暂无数据</div>;

    const data = [
      { label: '在读', value: stats.reading, color: colors.reading },
      { label: '已读', value: stats.read, color: colors.read },
      { label: '想看', value: stats.want, color: colors.want }
    ];

    const radius = 80;
    const center = 100;
    const innerRadius = 40;

    // 计算每个扇形的路径
    let currentAngle = -90; // 从顶部开始
    const paths = data.map((item, index) => {
      const percentage = (item.value / stats.total) * 100;
      const angle = (item.value / stats.total) * 360;

      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;

      const startAngleRad = (startAngle * Math.PI) / 180;
      const endAngleRad = (endAngle * Math.PI) / 180;

      const x1 = center + radius * Math.cos(startAngleRad);
      const y1 = center + radius * Math.sin(startAngleRad);
      const x2 = center + radius * Math.cos(endAngleRad);
      const y2 = center + radius * Math.sin(endAngleRad);

      const x3 = center + innerRadius * Math.cos(endAngleRad);
      const y3 = center + innerRadius * Math.sin(endAngleRad);
      const x4 = center + innerRadius * Math.cos(startAngleRad);
      const y4 = center + innerRadius * Math.sin(startAngleRad);

      const largeArcFlag = angle > 180 ? 1 : 0;

      let pathData;
      if (item.value === 0) {
        pathData = '';
      } else if (data.filter(d => d.value > 0).length === 1) {
        // 只有一个非零数据项，画完整的环形
        pathData = [
          `M ${center + radius} ${center}`,
          `A ${radius} ${radius} 0 1 1 ${center - radius} ${center}`,
          `A ${radius} ${radius} 0 1 1 ${center + radius} ${center}`,
          `M ${center + innerRadius} ${center}`,
          `A ${innerRadius} ${innerRadius} 0 1 0 ${center - innerRadius} ${center}`,
          `A ${innerRadius} ${innerRadius} 0 1 0 ${center + innerRadius} ${center}`,
          'Z'
        ].join(' ');
      } else {
        pathData = [
          `M ${x1} ${y1}`,
          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
          `L ${x3} ${y3}`,
          `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
          'Z'
        ].join(' ');
      }

      currentAngle += angle;

      return {
        path: pathData ? (
          <g key={index}>
            <path d={pathData} fill={item.color} stroke="#FFFFFF" strokeWidth="2" />
          </g>
        ) : null,
        percentage
      };
    });

    return (
      <div className="pie-chart-container">
        <svg width="200" height="200" viewBox="0 0 200 200">
          {paths.map(p => p.path)}
        </svg>
        <div className="pie-legend">
          {data.map((item, index) => (
            <div key={index} className="legend-item">
              <span className="legend-color" style={{ backgroundColor: item.color }}></span>
              <span className="legend-label">{item.label}</span>
              <span className="legend-value">{item.value}本 ({paths[index].percentage.toFixed(0)}%)</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 渲染条形图
  const renderBarChart = () => {
    const max = Math.max(...stats.ratingDistribution, 1);
    const barWidth = max >= 10 ? 40 : max >= 5 ? 50 : 60;

    return (
      <div className="rating-bar-chart">
        {stats.ratingDistribution.map((count, index) => {
          const barHeight = max > 0 ? (count / max) * 100 : 0;
          return (
            <div key={index} className="rating-bar-column">
              <div className="rating-value">{count}</div>
              <div
                className="rating-bar"
                style={{
                  height: `${barHeight > 0 ? Math.max(barHeight, 2) : 2}%`,
                  width: `${barWidth}px`,
                  backgroundColor: count > 0 ? '#118AB2' : '#E5E7EB',
                  minWidth: count > 0 ? `${barWidth}px` : '2px'
                }}
              ></div>
              <div className="rating-label">{index + 1}星</div>
            </div>
          );
        })}
      </div>
    );
  };

  // 渲染排行榜
  const renderLeaderboard = (data: Array<[string, number]>, title: string) => {
    if (data.length === 0) {
      return (
        <div className="leaderboard-section">
          <h3 className="leaderboard-title">{title}</h3>
          <div className="empty-leaderboard">暂无数据</div>
        </div>
      );
    }

    const max = Math.max(...data.map(d => d[1]), 1);

    return (
      <div className="leaderboard-section">
        <h3 className="leaderboard-title">{title}</h3>
        <div className="leaderboard-list">
          {data.map(([name, count], index) => (
            <div key={index} className="leaderboard-item">
              <div className="leaderboard-rank">{index + 1}</div>
              <div className="leaderboard-content">
                <div className="leaderboard-name">{name}</div>
                <div className="leaderboard-bar">
                  <div
                    className="leaderboard-bar-fill"
                    style={{
                      width: `${(count / max) * 100}%`,
                      backgroundColor: '#FFD166'
                    }}
                  ></div>
                </div>
              </div>
              <div className="leaderboard-count">{count}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 渲染折线图
  const renderLineChart = () => {
    const max = Math.max(...stats.timeData.map(d => d[1]), 1);
    // 固定宽度，无论选择哪个时间周期
    const containerWidth = 1200;
    const chartHeight = 280;
    const padding = { top: 30, right: 30, bottom: 30, left: 40 };

    const points = stats.timeData.map(([_, value], index) => {
      const x = padding.left + (index / (stats.timeData.length - 1 || 1)) * (containerWidth - padding.left - padding.right);
      const y = padding.top + (1 - value / max) * (chartHeight - padding.top - padding.bottom);
      return { x, y, value };
    });

    const pointsString = points.map(p => `${p.x},${p.y}`).join(' ');
    const areaPath = `M${padding.left},${chartHeight - padding.bottom} L${pointsString} L${containerWidth - padding.right},${chartHeight - padding.bottom} Z`;

    // 数据点
    const dots = points.map((point, index) => (
      <g key={index}>
        <circle cx={point.x} cy={point.y} r="5" fill={colors.primary} stroke="#FFFFFF" strokeWidth="2" />
        {point.value > 0 && (
          <text x={point.x} y={point.y - 12} textAnchor="middle" fontSize="12" fill="#374151" fontWeight="600">
            {point.value}
          </text>
        )}
      </g>
    ));

    // X轴标签
    const labels = stats.timeData.map(([label, _], index) => {
      const x = padding.left + (index / (stats.timeData.length - 1 || 1)) * (containerWidth - padding.left - padding.right);
      let displayLabel = label;
      if (trendPeriod === 'year') {
        displayLabel = label;
      } else if (trendPeriod === 'month') {
        // 显示年+月，如"2024-01"
        displayLabel = label;
      } else {
        displayLabel = label;
      }
      return (
        <text key={index} x={x} y={chartHeight - padding.bottom + 20} textAnchor="middle" fontSize="11" fill="#6B7280">
          {displayLabel}
        </text>
      );
    });

    // Y轴刻度线
    const gridLines = [0, 0.25, 0.5, 0.75, 1].map(ratio => {
      const y = padding.top + (1 - ratio) * (chartHeight - padding.top - padding.bottom);
      const value = Math.round(ratio * max);
      return (
        <g key={ratio}>
          <line x1={padding.left} y1={y} x2={containerWidth - padding.right} y2={y} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 4" />
          {ratio > 0 && ratio < 1 && (
            <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#9CA3AF">{value}</text>
          )}
        </g>
      );
    });

    return (
      <svg width={containerWidth} height={chartHeight} viewBox={`0 0 ${containerWidth} ${chartHeight}`}>
        {/* Y轴刻度线 */}
        {gridLines}

        {/* 面积填充 */}
        <path
          d={areaPath}
          fill={colors.primary}
          fillOpacity="0.15"
        />

        {/* 折线 */}
        <polyline
          points={pointsString}
          fill="none"
          stroke={colors.primary}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 数据点 */}
        {dots}

        {/* X轴标签 */}
        {labels}
      </svg>
    );
  };

  return (
    <div className="stats-overlay">
      <div className="stats-content">
        {/* 顶部工具栏 */}
        <div className="stats-header">
          <button className="back-stats-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
            返回
          </button>
          <h1 className="stats-title">数据统计</h1>
          <div style={{ width: '80px' }}></div>
        </div>

        {/* 统计内容 */}
        <div className="stats-body">
          {/* 阅读状态和评分 */}
          <div className="stats-row">
            <div className="stats-section">
              <h2 className="section-title">
                阅读状态
                <span className="section-value">总计：{stats.total} 本</span>
              </h2>
              {renderPieChart()}
            </div>
            <div className="stats-section">
              <h2 className="section-title">
                评分分布
                <span className="section-value">平均评分：{stats.avgRating} 分</span>
              </h2>
              {renderBarChart()}
            </div>
          </div>

          {/* 热门标签和热门作者 */}
          <div className="stats-row">
            {renderLeaderboard(stats.topTags, '热门标签')}
            {renderLeaderboard(stats.topAuthors, '多产作者')}
          </div>

          {/* 阅读趋势 */}
          <div className="stats-section">
            <div className="section-header-with-controls">
              <h2 className="section-title">阅读趋势</h2>
              <div className="trend-controls">
                <button
                  className={`trend-btn ${trendPeriod === 'year' ? 'active' : ''}`}
                  onClick={() => setTrendPeriod('year')}
                >
                  按年
                </button>
                <button
                  className={`trend-btn ${trendPeriod === 'month' ? 'active' : ''}`}
                  onClick={() => setTrendPeriod('month')}
                >
                  按月
                </button>
                <button
                  className={`trend-btn ${trendPeriod === 'day' ? 'active' : ''}`}
                  onClick={() => setTrendPeriod('day')}
                >
                  按日
                </button>
              </div>
            </div>
            <div className="line-chart-container">
              {renderLineChart()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsDashboard;
