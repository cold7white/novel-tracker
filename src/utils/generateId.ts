// 生成唯一ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
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

// 颜色预设 - Aurora Borealis 调色板
export const COVER_COLORS = [
  '#6B7280',  // 默认深灰色
  '#00A896',  // 青绿色
  '#02C39A',  // 绿松石色
  '#FFD166',  // 金黄色
  '#EF476F',  // 玫瑰红色
  '#073B4C',  // 深青色
  '#118AB2',  // 天蓝色
  '#7CDEDC'   // 淡青色
];
