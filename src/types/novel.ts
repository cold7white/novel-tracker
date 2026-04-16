import type { Excerpt } from './excerpt';

// 阅读状态类型
export type ReadingStatus = 'reading' | 'read' | 'want';

// 阅读记录
export interface ReadingSession {
  id: string;           // 唯一标识
  startDate: string;    // 开始日期 (YYYY-MM-DD)
  endDate?: string;    // 结束日期 (YYYY-MM-DD，可选)
}

// 书籍数据模型
export interface Novel {
  id: string;              // 唯一标识 (UUID)
  title: string;           // 书名
  author: string;          // 作者
  status: ReadingStatus;   // 阅读状态
  rating: number;          // 评分 0-5 (0表示未评分)
  tags: string[];         // 标签数组 (空数组表示无标签)
  details: string;         // 详情内容 (HTML或纯文本)
  readingSessions: ReadingSession[];  // 阅读记录数组
  coverColor: string;      // 封面颜色 (十六进制，默认#6B7280)
  coverImage?: string;     // 封面图片 (base64格式，可选)
  createdAt: Date;         // 创建时间
  updatedAt: Date;         // 最后修改时间
  categoryId?: string;     // 所属分类ID (可选)
  excerpts?: Excerpt[];    // 书摘数组（可选）
  aiContent?: string;      // AI 生成的内容（可选）
  aiContentUpdatedAt?: string;  // AI 内容更新时间（可选）
}

// 创建书籍的输入类型（不包含自动生成的字段）
export type CreateNovelInput = Omit<Novel, 'id' | 'createdAt' | 'updatedAt'>;

// 更新书籍的输入类型（部分字段可选）
export type UpdateNovelInput = Partial<Omit<Novel, 'id' | 'createdAt' | 'updatedAt'>>;

// 辅助函数：获取最近一次阅读的开始日期
export const getLatestReadingDate = (sessions: ReadingSession[]): string | null => {
  if (!sessions || sessions.length === 0) return null;
  const sorted = [...sessions].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );
  return sorted[0].startDate;
};

// 辅助函数：展开阅读区间为月份列表
export const expandSessionToMonths = (session: ReadingSession): string[] => {
  if (!session.startDate) return [];

  const months: string[] = [];
  const start = new Date(session.startDate);
  const end = session.endDate ? new Date(session.endDate) : null;

  const startMonth = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
  months.push(startMonth);

  if (end) {
    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}`;

    while (true) {
      current.setMonth(current.getMonth() + 1);
      const currentMonth = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      if (currentMonth > endMonth) break;
      months.push(currentMonth);
    }
  }

  return months;
};

// 筛选条件类型
export interface Filters {
  status: ReadingStatus[];  // 状态筛选
  tags: string[];          // 标签筛选
  authors: string[];       // 作者筛选
}

// 排序选项类型
export type SortOption = 'createdAt' | 'title' | 'rating';

// 排序方向类型
export type SortDirection = 'asc' | 'desc';

// 视图模式类型
export type ViewMode = 'card' | 'list';
