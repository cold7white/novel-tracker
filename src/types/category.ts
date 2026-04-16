// 分类数据模型
export interface Category {
  id: string;              // 唯一标识 (UUID)
  name: string;            // 分类名称
  color?: string;         // 分类颜色 (十六进制，可选)
  createdAt: Date;         // 创建时间
}

// 创建分类的输入类型
export type CreateCategoryInput = Omit<Category, 'id' | 'createdAt'>;

// 更新分类的输入类型
export type UpdateCategoryInput = Partial<Omit<Category, 'id' | 'createdAt'>>;
