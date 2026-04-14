import type { Excerpt } from './excerpt';

// 阅读状态类型
export type ReadingStatus = 'reading' | 'read' | 'want';

// 书籍数据模型
export interface Novel {
  id: string;              // 唯一标识 (UUID)
  title: string;           // 书名
  author: string;          // 作者
  status: ReadingStatus;   // 阅读状态
  rating: number;          // 评分 0-5 (0表示未评分)
  tags: string[];         // 标签数组 (空数组表示无标签)
  details: string;         // 详情内容 (HTML或纯文本)
  readingDate?: string;    // 阅读日期 (YYYY-MM-DD格式)
  coverColor: string;      // 封面颜色 (十六进制，默认#6B7280)
  coverImage?: string;     // 封面图片 (base64格式，可选)
  createdAt: Date;         // 创建时间
  updatedAt: Date;         // 最后修改时间
  categoryId?: string;     // 所属分类ID (可选)
  excerpts?: Excerpt[];    // 书摘数组（可选）
}

// 创建书籍的输入类型（不包含自动生成的字段）
export type CreateNovelInput = Omit<Novel, 'id' | 'createdAt' | 'updatedAt'>;

// 更新书籍的输入类型（部分字段可选）
export type UpdateNovelInput = Partial<Omit<Novel, 'id' | 'createdAt' | 'updatedAt'>>;

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
