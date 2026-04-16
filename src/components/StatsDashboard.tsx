import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Novel } from '../types/novel';
import { getLatestReadingDate, expandSessionToMonths } from '../types/novel';
import type { Excerpt } from '../types/excerpt';
import './StatsDashboard.css';

interface StatsDashboardProps {
  novels: Novel[];
  onClose: () => void;
  onViewNovel: (novel: Novel) => void;
  onViewExcerpt: (novel: Novel, excerptId: string) => void;
}

const StatsDashboard: React.FC<StatsDashboardProps> = ({ novels, onClose, onViewNovel, onViewExcerpt }) => {
  const [trendPeriod, setTrendPeriod] = useState<'year' | 'month' | 'day'>('month');
  const [chartKey, setChartKey] = useState(0);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(1200);

  // 监听容器宽度变化
  useEffect(() => {
    const updateWidth = () => {
      if (chartContainerRef.current) {
        const width = chartContainerRef.current.clientWidth;
        setChartWidth(Math.max(width, 300));
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // 图表加载后直接定位到最右边
  useEffect(() => {
    if (chartContainerRef.current) {
      const el = chartContainerRef.current;
      requestAnimationFrame(() => {
        el.scrollLeft = el.scrollWidth;
      });
    }
  }, [chartWidth, trendPeriod]);

  // 配色方案 - 与 CSS 变量 --color-reading/read/want 统一
  const colors = {
    reading: '#EF476F',
    read: '#00A896',
    want: '#F59E0B',
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

    // 按时间周期统计阅读的书籍数量（每本书的所有阅读区间都计入）
    const timeCounts = new Map<string, number>();
    const now = new Date();

    if (trendPeriod === 'year') {
      // 近20年
      for (let i = 19; i >= 0; i--) {
        const year = now.getFullYear() - i;
        const yearKey = `${year}`;
        timeCounts.set(yearKey, 0);
      }
      novels.forEach(novel => {
        (novel.readingSessions || []).forEach(session => {
          expandSessionToMonths(session).forEach(monthStr => {
            const yearKey = monthStr.split('-')[0];
            if (timeCounts.has(yearKey)) {
              timeCounts.set(yearKey, (timeCounts.get(yearKey) || 0) + 1);
            }
          });
        });
      });
    } else if (trendPeriod === 'month') {
      // 近12个月
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${String(date.getFullYear()).slice(2)}/${String(date.getMonth() + 1).padStart(2, '0')}`;
        timeCounts.set(monthKey, 0);
      }
      novels.forEach(novel => {
        (novel.readingSessions || []).forEach(session => {
          expandSessionToMonths(session).forEach(monthStr => {
            const monthKey = `${monthStr.slice(2, 4)}/${monthStr.slice(5, 7)}`;
            if (timeCounts.has(monthKey)) {
              timeCounts.set(monthKey, (timeCounts.get(monthKey) || 0) + 1);
            }
          });
        });
      });
    } else {
      // 近一个月，按天
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dayKey = `${date.getMonth() + 1}/${date.getDate()}`;
        timeCounts.set(dayKey, 0);
      }
      novels.forEach(novel => {
        (novel.readingSessions || []).forEach(session => {
          if (session.startDate) {
            const date = new Date(session.startDate);
            const dayKey = `${date.getMonth() + 1}/${date.getDate()}`;
            if (timeCounts.has(dayKey)) {
              timeCounts.set(dayKey, (timeCounts.get(dayKey) || 0) + 1);
            }
          }
        });
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

  // 最近阅读（按最近一次阅读日期排序，取前 5 本）
  const recentNovels = useMemo(() => {
    return [...novels]
      .filter(n => getLatestReadingDate(n.readingSessions || []))
      .sort((a, b) => {
        const dateA = getLatestReadingDate(a.readingSessions || [])!;
        const dateB = getLatestReadingDate(b.readingSessions || [])!;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      })
      .slice(0, 5);
  }, [novels]);

  // 最近书摘（扁平化所有书摘，按创建时间排序取前 5 条）
  const recentExcerpts = useMemo(() => {
    const allExcerpts: { excerpt: Excerpt; novel: Novel }[] = [];
    novels.forEach(novel => {
      (novel.excerpts || []).forEach(excerpt => {
        allExcerpts.push({ excerpt, novel });
      });
    });
    return allExcerpts
      .sort((a, b) => new Date(b.excerpt.createdAt).getTime() - new Date(a.excerpt.createdAt).getTime())
      .slice(0, 5);
  }, [novels]);

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
    const containerWidth = Math.max(chartWidth, 700);
    const chartHeight = 280;
    const padding = { top: 30, right: 30, bottom: 30, left: 10 };

    const points = stats.timeData.map(([_, value], index) => {
      const x = padding.left + (index / (stats.timeData.length - 1 || 1)) * (containerWidth - padding.left - padding.right);
      const y = padding.top + (1 - value / max) * (chartHeight - padding.top - padding.bottom);
      return { x, y, value };
    });

    // 生成贝塞尔曲线路径
    const linePath = points.map((point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;

      const prev = points[index - 1];
      const cpX = (prev.x + point.x) / 2;

      return `C ${cpX} ${prev.y}, ${cpX} ${point.y}, ${point.x} ${point.y}`;
    }).join(' ');

    // 生成面积填充路径
    const areaPath = `M${points[0].x},${points[0].y} ${linePath} L${points[points.length - 1].x},${chartHeight - padding.bottom} L${points[0].x},${chartHeight - padding.bottom} Z`;

    // X轴标签 - 移动端旋转显示更多标签，桌面端水平间隔显示
    const totalLabels = stats.timeData.length;
    const isMobile = chartWidth < 768;
    const showAll = isMobile && trendPeriod === 'day';
    const minSpacing = isMobile ? 25 : 50;
    const labelFontSize = isMobile ? 11 : 13;
    const labelRotation = isMobile ? -35 : 0;
    const maxLabels = showAll ? totalLabels : Math.floor((containerWidth - padding.left - padding.right) / minSpacing);
    const skipInterval = showAll ? 1 : Math.max(1, Math.ceil(totalLabels / Math.max(maxLabels, 1)));

    const labels = stats.timeData.map(([label, _], index) => {
      const x = padding.left + (index / (stats.timeData.length - 1 || 1)) * (containerWidth - padding.left - padding.right);
      const y = chartHeight - padding.bottom + 20;
      // 只显示间隔后的标签，以及第一个和最后一个
      const shouldShow = index === 0 || index === totalLabels - 1 || index % skipInterval === 0;
      if (!shouldShow) return null;
      return (
        <text
          key={index}
          x={x}
          y={y}
          textAnchor="middle"
          fontSize={labelFontSize}
          fill="#6B7280"
          transform={labelRotation ? `rotate(${labelRotation}, ${x}, ${y})` : undefined}
        >
          {label}
        </text>
      );
    });

    // 数据标注 - 显示非零值
    const dataLabels = points.map((point, index) => {
      if (point.value === 0) return null;
      return (
        <text
          key={`value-${index}`}
          x={point.x}
          y={point.y - 8}
          textAnchor="middle"
          fontSize={isMobile ? 9 : 11}
          fill="#118AB2"
          fontWeight="500"
        >
          {point.value}
        </text>
      );
    });

    return (
      <svg width={containerWidth} height={chartHeight} viewBox={`0 0 ${containerWidth} ${chartHeight}`} className="trend-chart-svg">
        {/* 桌面端：从左往右绘制动画 */}
        {!isMobile && (
          <defs>
            <clipPath id={`reveal-${chartKey}`}>
              <rect x="0" y="0" width="0" height={chartHeight}>
                <animate
                  attributeName="width"
                  from="0"
                  to={containerWidth}
                  dur="0.8s"
                  fill="freeze"
                />
              </rect>
            </clipPath>
          </defs>
        )}

        {/* 面积填充 */}
        <path
          d={areaPath}
          fill={colors.primary}
          fillOpacity="0.1"
          clipPath={!isMobile ? `url(#reveal-${chartKey})` : undefined}
          className={isMobile ? 'trend-area-mobile' : undefined}
        />

        {/* 平滑曲线 */}
        <path
          d={linePath}
          fill="none"
          stroke={colors.primary}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={!isMobile ? "1" : undefined}
          strokeDasharray={!isMobile ? "1" : undefined}
          strokeDashoffset={!isMobile ? "1" : undefined}
          className={isMobile ? 'trend-line-mobile' : undefined}
        >
          {!isMobile && (
            <animate
              attributeName="stroke-dashoffset"
              from="1"
              to="0"
              dur="0.8s"
              fill="freeze"
            />
          )}
        </path>

        {/* X轴标签 */}
        {labels}

        {/* 数据标注 */}
        {dataLabels}
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
                  onClick={() => { setTrendPeriod('year'); setChartKey(k => k + 1); }}
                >
                  按年
                </button>
                <button
                  className={`trend-btn ${trendPeriod === 'month' ? 'active' : ''}`}
                  onClick={() => { setTrendPeriod('month'); setChartKey(k => k + 1); }}
                >
                  按月
                </button>
                <button
                  className={`trend-btn ${trendPeriod === 'day' ? 'active' : ''}`}
                  onClick={() => { setTrendPeriod('day'); setChartKey(k => k + 1); }}
                >
                  按日
                </button>
              </div>
            </div>
            <div className="line-chart-container" key={chartKey} ref={chartContainerRef}>
              {renderLineChart()}
            </div>
          </div>

          {/* 最近阅读和最近书摘 */}
          <div className="recent-section">
            <div className="recent-books">
              <h3>最近阅读</h3>
              <div className="recent-books-list">
                {recentNovels.length > 0 ? recentNovels.map(novel => (
                  <div key={novel.id} className="recent-book-item" onClick={() => onViewNovel(novel)}>
                    <div className="recent-book-cover" style={{
                      backgroundColor: novel.coverColor,
                      backgroundImage: novel.coverImage ? `url(${novel.coverImage})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}>
                      {!novel.coverImage && <span className="cover-initial">{novel.title.charAt(0)}</span>}
                    </div>
                    <div className="recent-book-title">{novel.title}</div>
                  </div>
                )) : <div className="empty-recent">暂无阅读记录</div>}
              </div>
            </div>
            <div className="recent-excerpts">
              <h3>最近书摘</h3>
              <div className="recent-excerpts-list">
                {recentExcerpts.length > 0 ? recentExcerpts.slice(0, 4).map(({ excerpt, novel }) => (
                  <div key={excerpt.id} className="recent-excerpt-card" onClick={() => onViewExcerpt(novel, excerpt.id)}>
                    <div className="excerpt-card-header">《{novel.title}》</div>
                    <p className="excerpt-card-content">"{excerpt.content}"</p>
                  </div>
                )) : <div className="empty-recent">暂无书摘</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsDashboard;
