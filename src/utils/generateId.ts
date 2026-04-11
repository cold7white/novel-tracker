// 生成唯一ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 格式化日期
export const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 颜色预设
export const COVER_COLORS = [
  '#6B7280',  // 默认灰色
  '#EF4444',  // 红色
  '#F59E0B',  // 橙色
  '#10B981',  // 绿色
  '#3B82F6',  // 蓝色
  '#8B5CF6',  // 紫色
  '#EC4899',  // 粉色
  '#14B8A6'   // 青色
];
