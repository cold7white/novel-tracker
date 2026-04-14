// 书摘数据模型
export interface Excerpt {
  id: string;                  // 唯一标识 (UUID)
  novelId: string;            // 关联的书籍ID
  content: string;            // 摘录内容
  chapter?: string;           // 章节（可选）
  pageNumber?: number;        // 页码（可选）
  excerptDate?: string;       // 摘录日期（可选）
  tags: string[];             // 书摘标签
  note?: string;              // 个人笔记（可选）
  createdAt: Date;           // 创建时间
  updatedAt: Date;           // 最后修改时间
}

// 创建书摘的输入类型（不包含自动生成的字段，novelId 由父组件提供）
export type CreateExcerptInput = Omit<Excerpt, 'id' | 'novelId' | 'createdAt' | 'updatedAt'>;

// 更新书摘的输入类型（部分字段可选）
export type UpdateExcerptInput = Partial<Omit<Excerpt, 'id' | 'novelId' | 'createdAt' | 'updatedAt'>>;
