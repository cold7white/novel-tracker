# 个人小说记录器项目计划

## 一、需求讨论记录

### 1. 技术栈选择
- **最终选择**：React + Vite + TypeScript
- **原因**：开发效率高，组件化开发，生态系统完善，适合快速原型开发
- **后续可扩展**：可轻松添加后端、打包成桌面应用等

### 2. 数据存储方案
- **当前方案**：localStorage（浏览器本地存储）
- **存储限制**：5-10MB（足够存储几千本小说数据）
- **数据持久性**：
  - ✅ 页面刷新后数据存在
  - ✅ 关闭浏览器后重新打开数据存在
  - ❌ 清除浏览器数据会丢失（包括：清除浏览数据、卸载浏览器、隐私模式）
- **增强方案**：添加导出/导入功能，支持数据备份

### 3. 跨设备同步需求分析
**问题**：如何实现跨设备同步？
**解决方案**：
1. **纯前端同步**（简单方案）：
   - 使用 GitHub Gist API
   - 使用 IndexedDB + File System Access API
   - 生成分享链接，用户手动同步

2. **后端方案**（完整方案）：
   - 使用 Firebase/Supabase（BaaS）
   - 自建 Node.js 后端
   - 需要：服务器、数据库、用户认证系统

### 4. 功能需求确认
- ✅ 核心功能：添加、编辑、删除、筛选、搜索、排序
- ✅ 分类管理：支持编辑、删除（右击操作）
- ✅ 双布局：卡片视图/列表视图
- ✅ 搜索字段：书名、作者、标签
- ✅ 排序方式：添加时间（默认倒序）、书名（A-Z）、评分（高到低）
- ✅ 封面：默认图标，可改颜色
- ✅ 响应式设计：适配不同屏幕
- ✅ 时间戳和最后修改时间

### 5. 暂不考虑的功能
- ❌ 深色/浅色主题切换
- ❌ 动画和微交互
- ❌ 阅读进度跟踪
- ❌ 快捷键支持
- ❌ 批量操作
- ❌ 数据统计图表

## 二、数据模型设计

### 1. 核心数据模型

```typescript
interface Novel {
  id: string;              // 唯一标识 (UUID)
  title: string;           // 书名
  author: string;          // 作者
  status: 'reading' | 'read' | 'want'; // 阅读状态
  rating: number;          // 评分 0-5 (0表示未评分)
  tags: string[];         // 标签数组 (空数组表示无标签)
  details: string;         // 详情内容 (HTML或纯文本)
  coverColor: string;      // 封面颜色 (十六进制，默认#6B7280)
  createdAt: Date;         // 创建时间
  updatedAt: Date;         // 最后修改时间
  categoryId?: string;     // 所属分类ID (可选)
}

interface Category {
  id: string;              // 唯一标识 (UUID)
  name: string;            // 分类名称
  color?: string;         // 分类颜色 (十六进制，可选)
  createdAt: Date;         // 创建时间
}
```

### 2. 状态管理模型

```typescript
interface AppState {
  novels: Novel[];
  categories: Category[];
  selectedCategory: string | null; // 当前选中的分类
  viewMode: 'card' | 'list';      // 视图模式
  searchTerm: string;            // 搜索关键词
  filters: {
    status: string[];            // 状态筛选
    tags: string[];             // 标签筛选
    authors: string[];          // 作者筛选
  };
  sortOption: 'createdAt' | 'title' | 'rating'; // 排序选项
  sortDirection: 'asc' | 'desc';              // 排序方向
  editingNovel: Novel | null;    // 正在编辑的小说
  contextMenu: {
    visible: boolean;
    x: number;
    y: number;
    targetId: string;
    targetType: 'novel' | 'category'; // 目标类型
  };
}
```

### 3. 组件交互模型

#### NovelCard 组件
- **属性**：
  - novel: Novel - 小说数据
  - onEdit: (novel: Novel) => void - 编辑回调
  - onDelete: (id: string) => void - 删除回调
  - onColorChange: (id: string, color: string) => void - 颜色变更回调
  - onDetail: (id: string) => void - 详情查看回调

- **交互**：
  - 右键点击封面：显示上下文菜单
  - 点击封面主体：进入详情页
  - 点击编辑：进入编辑模式
  - 点击颜色：打开颜色选择器
  - 点击删除：确认删除

#### Sidebar 组件
- **属性**：
  - categories: Category[] - 分类列表
  - selectedCategory: string | null - 当前选中分类
  - onCategorySelect: (id: string | null) => void - 分类选择回调
  - onAddCategory: (name: string) => void - 添加分类回调
  - onEditCategory: (category: Category) => void - 编辑分类回调
  - onDeleteCategory: (id: string) => void - 删除分类回调

- **交互**：
  - 点击分类：筛选小说
  - 点击"+"按钮：添加新分类
  - 右键点击分类：显示编辑/删除菜单

#### Header 组件
- **属性**：
  - onAddNovel: () => void - 添加小说回调
  - onSearch: (term: string) => void - 搜索回调
  - onFilterChange: (filters: Filters) => void - 筛选回调
  - onSortChange: (option: SortOption) => void - 排序回调
  - onViewModeChange: (mode: ViewMode) => void - 视图切换回调

- **交互**：
  - 点击添加按钮：打开添加表单
  - 输入搜索关键词：实时搜索
  - 选择筛选器：多选筛选
  - 点击排序选项：切换排序方式
  - 点击视图切换：切换布局

## 三、UI设计规范

### 1. 色彩方案

#### 主要色彩（黑白灰）
```css
:root {
  /* 主色调 - 黑白灰 */
  --color-white: #FFFFFF;
  --color-gray-50: #F9FAFB;   /* 最浅灰 - 背景 */
  --color-gray-100: #F3F4F6;  /* 浅灰 - 卡片背景 */
  --color-gray-200: #E5E7EB;  /* 边框颜色 */
  --color-gray-300: #D1D5DB;  /* 禁用状态 */
  --color-gray-400: #9CA3AF;  /* 辅助文字 */
  --color-gray-500: #6B7280;  /* 次要文字 */
  --color-gray-600: #4B5563;  /* 主要文字 */
  --color-gray-700: #374151;  /* 标题文字 */
  --color-gray-800: #1F2937;  /* 强调文字 */
  --color-gray-900: #111827;  /* 最深文字 */
  --color-black: #000000;
}
```

#### 标注色彩（用于状态和强调）
```css
:root {
  /* 状态颜色 */
  --color-reading: #3B82F6;   /* 在读 - 蓝色 */
  --color-read: #10B981;      /* 已读 - 绿色 */
  --color-want: #F59E0B;      /* 想看 - 橙色 */
  
  /* 交互颜色 */
  --color-primary: #2563EB;   /* 主要按钮 - 蓝色 */
  --color-danger: #EF4444;    /* 删除/警告 - 红色 */
  --color-success: #10B981;   /* 成功提示 - 绿色 */
  --color-warning: #F59E0B;   /* 警告提示 - 橙色 */
  
  /* 封面颜色预设 */
  --cover-colors: [
    "#6B7280",  /* 默认灰色 */
    "#EF4444",  /* 红色 */
    "#F59E0B",  /* 橙色 */
    "#10B981",  /* 绿色 */
    "#3B82F6",  /* 蓝色 */
    "#8B5CF6",  /* 紫色 */
    "#EC4899",  /* 粉色 */
    "#14B8A6"   /* 青色 */
  ];
}
```

### 2. 字体规范

```css
:root {
  /* 字体家族 */
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 
                 'Microsoft YaHei', sans-serif;
  
  /* 字体大小 */
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 20px;
  --font-size-2xl: 24px;
  --font-size-3xl: 30px;
  
  /* 字重 */
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
```

### 3. 间距规范

```css
:root {
  /* 间距 */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 20px;
  --spacing-2xl: 24px;
  --spacing-3xl: 32px;
  
  /* 圆角 */
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
  --border-radius-full: 9999px;
  
  /* 阴影 */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}
```

### 4. 组件样式规范

#### 状态指示器
```css
/* 阅读状态小圆点 */
.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 6px;
}

.status-reading {
  background-color: var(--color-reading);
}

.status-read {
  background-color: var(--color-read);
}

.status-want {
  background-color: var(--color-want);
}
```

#### 标签样式
```css
.tag {
  display: inline-block;
  padding: 2px 8px;
  background-color: var(--color-gray-100);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  color: var(--color-gray-600);
  margin-right: 4px;
  margin-bottom: 4px;
}

.tag-add {
  border: 1px dashed var(--color-gray-300);
  background-color: transparent;
  cursor: pointer;
}
```

#### 按钮样式
```css
.btn {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-white);
  border: none;
}

.btn-primary:hover {
  background-color: #1D4ED8;
}

.btn-secondary {
  background-color: var(--color-white);
  color: var(--color-gray-700);
  border: 1px solid var(--color-gray-300);
}

.btn-secondary:hover {
  background-color: var(--color-gray-50);
}

.btn-danger {
  background-color: var(--color-danger);
  color: var(--color-white);
  border: none;
}
```

#### 卡片样式
```css
.novel-card {
  background-color: var(--color-white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  transition: transform 0.2s ease;
}

.novel-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.novel-cover {
  width: 100%;
  aspect-ratio: 3/4;
  background-color: var(--color-gray-200);
  position: relative;
}

.novel-content {
  padding: var(--spacing-md);
}

.novel-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-800);
  margin-bottom: var(--spacing-xs);
}

.novel-author {
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
  margin-bottom: var(--spacing-sm);
}
```

### 5. 布局规范

```css
/* 侧边栏 */
.sidebar {
  width: 250px;
  background-color: var(--color-white);
  border-right: 1px solid var(--color-gray-200);
  padding: var(--spacing-lg);
}

/* 头部工具栏 */
.header {
  height: 60px;
  background-color: var(--color-white);
  border-bottom: 1px solid var(--color-gray-200);
  padding: 0 var(--spacing-lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 主区域 */
.main-content {
  padding: var(--spacing-lg);
  background-color: var(--color-gray-50);
}

/* 卡片网格 */
.novel-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--spacing-lg);
}
```

## 四、功能实现细节

### 1. 数据持久化实现

```typescript
// localStorage 封装
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  };

  return [storedValue, setValue] as const;
};
```

### 2. 筛选和搜索逻辑

```typescript
// 筛选函数
export const filterNovels = (novels: Novel[], filters: Filters, searchTerm: string) => {
  return novels.filter(novel => {
    // 状态筛选
    if (filters.status.length > 0 && !filters.status.includes(novel.status)) {
      return false;
    }
    
    // 标签筛选
    if (filters.tags.length > 0 && !novel.tags.some(tag => filters.tags.includes(tag))) {
      return false;
    }
    
    // 作者筛选
    if (filters.authors.length > 0 && !filters.authors.includes(novel.author)) {
      return false;
    }
    
    // 搜索筛选
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        novel.title.toLowerCase().includes(searchLower) ||
        novel.author.toLowerCase().includes(searchLower) ||
        novel.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });
};

// 排序函数
export const sortNovels = (novels: Novel[], sortOption: SortOption, sortDirection: SortDirection) => {
  return [...novels].sort((a, b) => {
    let comparison = 0;
    
    switch (sortOption) {
      case 'createdAt':
        comparison = a.createdAt.getTime() - b.createdAt.getTime();
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'rating':
        comparison = a.rating - b.rating;
        break;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });
};
```

### 3. 右键菜单实现

```typescript
// 上下文菜单状态管理
const [contextMenu, setContextMenu] = useState({
  visible: false,
  x: 0,
  y: 0,
  targetId: '',
  targetType: 'novel' as 'novel' | 'category'
});

const handleContextMenu = (e: React.MouseEvent, id: string, type: 'novel' | 'category') => {
  e.preventDefault();
  setContextMenu({
    visible: true,
    x: e.clientX,
    y: e.clientY,
    targetId: id,
    targetType: type
  });
};

const closeContextMenu = () => {
  setContextMenu({ visible: false, x: 0, y: 0, targetId: '', targetType: 'novel' });
};

// 全局点击事件监听
useEffect(() => {
  const handleClick = () => closeContextMenu();
  document.addEventListener('click', handleClick);
  return () => document.removeEventListener('click', handleClick);
}, []);

// 菜单组件
const ContextMenu = () => {
  if (!contextMenu.visible) return null;
  
  return (
    <div 
      className="context-menu"
      style={{ top: contextMenu.y, left: contextMenu.x }}
    >
      {contextMenu.targetType === 'novel' ? (
        <>
          <button onClick={() => handleEdit(contextMenu.targetId)}>编辑</button>
          <button onClick={() => handleColorChange(contextMenu.targetId)}>颜色</button>
          <button onClick={() => handleDelete(contextMenu.targetId)}>删除</button>
        </>
      ) : (
        <>
          <button onClick={() => handleEditCategory(contextMenu.targetId)}>编辑</button>
          <button onClick={() => handleDeleteCategory(contextMenu.targetId)}>删除</button>
        </>
      )}
    </div>
  );
};
```

### 4. 响应式设计实现

```css
/* 基础响应式样式 */
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* 桌面端布局 */
@media (min-width: 1024px) {
  .main-layout {
    display: grid;
    grid-template-columns: 250px 1fr;
    gap: 20px;
  }
}

/* 平板端布局 */
@media (min-width: 768px) and (max-width: 1023px) {
  .main-layout {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 15px;
  }
}

/* 移动端布局 */
@media (max-width: 767px) {
  .main-layout {
    display: flex;
    flex-direction: column;
  }
  
  .header {
    padding: 10px;
  }
  
  .sidebar {
    padding: 10px;
  }
  
  .novel-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
  }
}
```

### 5. 错误处理和用户体验

```typescript
// 错误边界组件
class ErrorBoundary extends React.Component<{}, { hasError: boolean }> {
  constructor(props: {}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // 可以在这里发送错误报告
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h2>出错了</h2>
          <p>请刷新页面或联系支持</p>
          <button onClick={() => window.location.reload()}>刷新页面</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// 操作确认对话框
const ConfirmDialog = ({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  title, 
  message 
}: ConfirmDialogProps) => {
  if (!isOpen) return null;
  
  return (
    <div className="confirm-overlay">
      <div className="confirm-dialog">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="confirm-buttons">
          <button onClick={onCancel} className="cancel">取消</button>
          <button onClick={onConfirm} className="confirm">确认</button>
        </div>
      </div>
    </div>
  );
};
```

## 四、性能优化考虑

### 1. 搜索防抖
```typescript
import { useDebounce } from './hooks/useDebounce';

const [searchTerm, setSearchTerm] = useState('');
const debouncedSearchTerm = useDebounce(searchTerm, 300);

useEffect(() => {
  if (debouncedSearchTerm) {
    // 执行搜索
  }
}, [debouncedSearchTerm]);
```

### 2. 大数据量虚拟滚动
```typescript
import { FixedSizeList as List } from 'react-window';

const NovelList = ({ novels }: { novels: Novel[] }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <NovelCard novel={novels[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={novels.length}
      itemSize={120}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

### 3. 组件懒加载
```typescript
const NovelDetail = React.lazy(() => import('./NovelDetail'));

// 在使用时
<Suspense fallback={<Loading />}>
  <NovelDetail novel={selectedNovel} />
</Suspense>
```

## 五、扩展功能预留

### 1. Supabase 集成接口
```typescript
// 预留的 API 接口
export const supabaseApi = {
  // 用户认证
  signUp: (email: string, password: string) => {},
  signIn: (email: string, password: string) => {},
  signOut: () => {},
  
  // 数据操作
  getNovels: () => {},
  addNovel: (novel: Omit<Novel, 'id' | 'createdAt' | 'updatedAt'>) => {},
  updateNovel: (id: string, updates: Partial<Novel>) => {},
  deleteNovel: (id: string) => {},
  
  // 分类操作
  getCategories: () => {},
  addCategory: (name: string) => {},
  updateCategory: (id: string, updates: Partial<Category>) => {},
  deleteCategory: (id: string) => {}
};
```

### 2. 数据同步逻辑
```typescript
// 离线数据同步
export const syncData = async () => {
  try {
    // 检查网络连接
    if (!navigator.onLine) {
      // 保存到本地缓存
      saveToLocalStorage('offline-novels', getUnsyncedData());
      return;
    }
    
    // 同步到服务器
    await supabaseApi.syncAllData();
    
    // 清除本地缓存
    removeFromLocalStorage('offline-novels');
  } catch (error) {
    console.error('Sync failed:', error);
    // 可以重试或显示错误提示
  }
};
```

这些详细的设计和实现细节应该能让项目更加清晰和具体。您觉得还需要补充哪些方面？

## 三、项目结构

```
novel-tracker/
├── src/
│   ├── components/
│   │   ├── NovelCard/          # 卡片组件
│   │   ├── NovelList/          # 列表组件
│   │   ├── Sidebar/            # 侧边栏
│   │   ├── Header/             # 顶部工具栏
│   │   ├── NovelDetail/       # 详情页
│   │   ├── NovelForm/          # 添加/编辑表单
│   │   └── StatusIndicator/   # 状态指示器
│   ├── hooks/
│   │   ├── useLocalStorage.ts   # localStorage 封装
│   │   ├── useDebounce.ts     # 搜索防抖
│   │   └── useSync.ts         # 数据同步（未来）
│   ├── types/
│   │   ├── novel.ts           # 类型定义
│   │   ├── category.ts        # 分类类型
│   │   └── index.ts           # 统一导出
│   ├── utils/
│   │   ├── export.ts          # 导入导出功能
│   │   ├── sort.ts            # 排序功能
│   │   ├── filter.ts          # 筛选功能
│   │   └── generateId.ts      # ID生成
│   ├── contexts/
│   │   ├── NovelContext.ts    # 数据上下文
│   │   └── CategoryContext.ts # 分类上下文
│   ├── App.tsx               # 主组件
│   ├── main.tsx              # 入口文件
│   └── index.css             # 全局样式
├── public/
└── package.json
```

## 四、实现步骤

### 阶段一：项目初始化（第1天）
1. **创建项目**：
   ```bash
   npm create vite@latest novel-tracker -- --template react-ts
   cd novel-tracker
   npm install
   npm install @types/node
   ```

2. **配置项目结构**：
   - 创建 `src/` 目录下的子文件夹
   - 设置 TypeScript 配置
   - 配置路径别名（@ 指向 src）

3. **基础设置**：
   - 配置 ESLint 和 Prettier
   - 设置全局 CSS 和基础样式
   - 配置环境变量

### 阶段二：类型定义（第2天）
1. 创建 `src/types/` 目录
2. 定义 `Novel` 和 `Category` 接口
3. 创建类型文件

### 阶段三：核心组件开发（第3-5天）
1. **侧边栏组件** - 分类管理
2. **头部工具栏** - 筛选和搜索
3. **小说卡片组件** - 卡片视图
4. **小说列表组件** - 列表视图
5. **详情页组件** - 编辑功能

### 阶段四：数据管理（第6天）
1. 创建 Context API 管理状态
2. 实现 localStorage 持久化
3. 添加增删改查功能

### 阶段五：功能实现（第7-8天）
1. 筛选、搜索、排序功能
2. 布局切换
3. 导出导入功能

### 阶段六：用户体验优化（第9天）
1. 响应式设计
2. 错误处理
3. 操作确认
4. 数据验证

### 阶段七：扩展功能（后续）
1. 连接 Supabase 后端
2. 添加用户认证
3. 实现数据同步
4. 添加实时协作功能

## 五、项目初始化详细步骤

### 1. 创建 React + Vite + TypeScript 项目
```bash
# 创建项目
npm create vite@latest novel-tracker -- --template react-ts

# 进入项目目录
cd novel-tracker

# 安装依赖
npm install

# 安装类型定义
npm install @types/node

# 启动开发服务器
npm run dev
```

### 2. 配置项目结构
```bash
# 创建必要的目录
mkdir -p src/components src/hooks src/types src/utils src/contexts

# 创建基础文件
touch src/App.tsx src/main.tsx src/index.css src/types/novel.ts src/types/category.ts
```

### 3. TypeScript 配置
在 `tsconfig.json` 中添加：
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### 4. 基础样式设置
在 `src/index.css` 中添加：
```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #f5f5f5;
  color: #333;
}

.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* 响应式设计基础 */
@media (max-width: 768px) {
  .app {
    padding: 10px;
  }
}
```

### 5. 环境变量设置
创建 `.env` 文件：
```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## 六、组件开发顺序建议

1. **先做静态页面**：创建基本布局
2. **再做数据管理**：实现状态管理
3. **最后做交互**：添加功能逻辑

## 七、开发工具推荐

1. **代码编辑器**：VS Code
2. **扩展插件**：
   - ESLint
   - Prettier
   - TypeScript
   - React Developer Tools
3. **浏览器工具**：
   - Chrome DevTools
   - React DevTools

## 八、测试和部署

### 测试
1. 单元测试：Jest + React Testing Library
2. 集成测试：Cypress
3. 手动测试：各浏览器兼容性

### 部署
1. 构建生产版本：`npm run build`
2. 部署到 Vercel：`vercel`
3. 配置自定义域名（可选）

## 五、跨设备同步方案讨论

### 方案1：GitHub Gist API（推荐）
- **优点**：
  - 免费，无需服务器
  - API简单
  - 版本控制
- **缺点**：
  - 需要GitHub账号
  - 有API限制
- **实现**：
  ```typescript
  // 伪代码
  const saveToGist = async (data) => {
    await fetch('https://api.github.com/gists', {
      method: 'POST',
      body: JSON.stringify({
        description: 'Novel Tracker Backup',
        files: {
          'novels.json': {
            content: JSON.stringify(data)
          }
        }
      })
    });
  };
  ```

### 方案2：Firebase/Supabase
- **优点**：
  - 实时同步
  - 无需管理服务器
- **缺点**：
  - 有免费额度限制
  - 需要注册服务

### 方案3：自建后端
- **技术栈**：Node.js + Express + MongoDB
- **优点**：
  - 完全可控
  - 功能强大
- **缺点**：
  - 需要服务器
  - 维护成本高

## 六、导出导入功能设计

### 导出功能
- **格式**：JSON
- **内容**：所有小说数据 + 分类数据
- **触发方式**：
  - 手动导出按钮
  - 定期自动提示
  - 关闭页面前提示

### 导入功能
- **格式**：JSON
- **验证**：数据格式检查
- **合并策略**：
  - 完全覆盖
  - 增量合并
  - 手动选择

### 实现示例
```typescript
// 导出
export const exportData = () => {
  const data = { novels, categories };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  // 触发下载
};

// 导入
export const importData = (file: File) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = JSON.parse(e.target?.result as string);
    // 验证并导入数据
  };
  reader.readAsText(file);
};
```

## 七、注意事项

1. **数据安全**：
   - 定期提醒用户备份数据
   - 导出数据时包含时间戳
   - 数据导入时的格式验证

2. **性能优化**：
   - 使用防抖处理搜索
   - 大数据量的虚拟滚动
   - 图片懒加载（如果将来有封面图片）

3. **用户体验**：
   - 操作确认提示
   - 删除前二次确认
   - 状态变化的视觉反馈

## 八、待讨论问题

1. GitHub 同步的具体实现细节
2. 导入导出时的数据合并策略
3. 是否需要数据压缩（减少文件大小）
4. 是否需要分享功能（分享单个书籍）