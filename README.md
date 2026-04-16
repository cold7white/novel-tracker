# Novel Tracker 📚

一个现代化的个人小说记录管理应用，帮助你追踪阅读进度、记录阅读心得，并提供丰富的数据统计分析。

![React](https://img.shields.io/badge/React-19.2.4-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0.2-blue)
![Vite](https://img.shields.io/badge/Vite-8.0.4-purple)
![Supabase](https://img.shields.io/badge/Supabase-2.103.0-green)

## ✨ 功能特性

### 📖 阅读管理
- **多状态追踪**：支持"在读"、"已读"、"想看"三种阅读状态
- **分类管理**：自定义分类，更好地组织你的阅读列表
- **标签系统**：为小说添加标签，方便筛选和查找
- **作者追踪**：记录作者信息，查看作品统计

### 📝 内容记录
- **详情编辑**：为每本小说记录详细内容、人物关系、读后感等
- **评分系统**：1-5星评分，记录你的阅读体验
- **阅读日期**：记录阅读完成日期，生成阅读时间线

### 🎨 双视图模式
- **卡片视图**：精美的封面展示，一目了然
- **列表视图**：详细信息展示，快速浏览

### 🔍 搜索与筛选
- **关键词搜索**：快速找到书名、作者或标签
- **多维度筛选**：按状态、标签、作者筛选
- **灵活排序**：按添加时间、书名、评分排序

### 📊 数据统计
- **阅读状态分布**：环形图展示各状态占比
- **评分分布**：条形图展示评分统计
- **热门标签**：标签使用排行
- **多产作者**：作者作品排行
- **阅读趋势**：按年/月/日查看阅读时间线

### 🌐 云端同步
- **用户认证**：支持注册/登录，数据云端存储
- **数据同步**：使用 Supabase 实现多设备同步
- **本地缓存**：支持离线使用，数据自动保存

### 📱 响应式设计
- **移动端优化**：适配手机、平板、桌面各种设备
- **方向感知**：横竖屏自动调整布局
- **汉堡菜单**：移动端友好的侧边栏交互

## 🛠️ 技术栈

### 前端
- **框架**：React 19 + TypeScript
- **构建工具**：Vite 8
- **状态管理**：React Context API
- **样式**：原生 CSS + CSS 变量
- **图标**：SVG 图标

### 后端
- **BaaS**：Supabase
  - 数据库：PostgreSQL
  - 认证：Supabase Auth
  - 实时订阅：Supabase Realtime

### 开发工具
- **代码规范**：ESLint
- **类型检查**：TypeScript
- **版本控制**：Git

## 📦 安装与运行

### 前置要求
- Node.js >= 18.0.0
- npm >= 9.0.0

### 本地开发

1. **克隆仓库**
```bash
git clone https://github.com/cold7white/novel-tracker.git
cd novel-tracker
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**

复制 `.env.example` 到 `.env`：
```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的 Supabase 凭证：
```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> 💡 **提示**：如果不需要云端同步功能，可以跳过此步骤，应用会使用 localStorage 存储数据。

4. **启动开发服务器**
```bash
npm run dev
```

5. **打开浏览器**
访问 `http://localhost:5173`

### 构建生产版本

```bash
npm run build
```

构建产物会输出到 `dist` 目录。

### 预览生产构建

```bash
npm run preview
```

## 📁 项目结构

```
novel-tracker/
├── docs/                          # 项目文档
│   ├── IMPLEMENTATION_PLAN.md     # 实施计划
│   ├── SUPABASE_SETUP.md          # Supabase 配置指南
│   └── TESTING_GUIDE.md           # 测试指南
├── public/                         # 静态资源
├── src/
│   ├── components/                 # React 组件
│   │   ├── Auth/                   # 认证相关组件
│   │   │   ├── AuthForm.tsx        # 登录/注册表单
│   │   │   └── UserAvatar.tsx      # 用户头像组件
│   │   ├── NovelCard.tsx           # 小说卡片组件
│   │   ├── NovelDetail.tsx         # 详情页组件
│   │   ├── NovelForm.tsx           # 添加/编辑表单
│   │   └── StatsDashboard.tsx      # 统计仪表板
│   ├── contexts/                   # React Context
│   │   ├── AuthContext.tsx         # 认证上下文
│   │   └── NovelContext.tsx        # 小说数据上下文
│   ├── lib/                        # 工具库
│   │   └── supabase/               # Supabase 相关
│   │       ├── client.ts           # Supabase 客户端
│   │       └── queries.ts          # 数据库查询
│   ├── types/                      # TypeScript 类型定义
│   │   └── novel.ts                # 小说类型定义
│   ├── App.tsx                     # 应用主组件
│   ├── App.css                     # 应用样式
│   ├── main.tsx                    # 应用入口
│   └── index.css                   # 全局样式
├── supabase/                       # Supabase 相关
│   └── setup.sql                   # 数据库初始化脚本
├── .env.example                    # 环境变量示例
├── .gitignore
├── package.json
├── README.md
└── tsconfig.json
```

## 🚀 部署

### Vercel 部署

项目已部署在 Vercel：[https://novel-tracker-khaki.vercel.app/](https://novel-tracker-khaki.vercel.app/)

#### 部署步骤

1. **Fork 本仓库**
2. **连接到 Vercel**
   - 登录 [Vercel](https://vercel.com)
   - 点击 "Add New Project"
   - 导入你的 GitHub 仓库

3. **配置环境变量**
   - 在 Vercel 项目设置中添加环境变量：
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

4. **部署**
   - Vercel 会自动检测 Vite 配置并构建
   - 每次推送到 `main` 分支都会自动部署

### 其他平台

本项目可以部署到任何支持静态网站的平台：
- **Netlify**
- **GitHub Pages**
- **Cloudflare Pages**

## 🎯 核心功能说明

### 添加小说
点击右上角"+ 添加小说"按钮，填写书名、作者等信息。

### 编辑详情
点击小说卡片进入详情页，可以记录：
- 小说内容概要
- 人物关系
- 阅读心得
- 评分和标签

### 分类管理
1. 点击左下角"+ 新建分类"
2. 输入分类名称
3. 右键点击分类可以重命名或删除

### 数据统计
点击左侧边栏的"统计"按钮查看：
- 阅读状态分布
- 评分统计
- 热门标签和作者
- 阅读趋势图

## 🔄 数据同步

### 本地模式（默认）
- 数据存储在浏览器 localStorage
- 无需登录，开箱即用
- 数据仅保存在当前设备

### 云端模式（推荐）
- 注册/登录账号
- 数据自动同步到云端
- 多设备数据一致
- 数据安全可靠

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范
- 遵循现有的代码风格
- 添加必要的注释
- 更新相关文档
- 确保所有测试通过

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [React](https://react.dev/) - 前端框架
- [Vite](https://vitejs.dev/) - 构建工具
- [Supabase](https://supabase.com/) - 后端服务
- [TypeScript](https://www.typescriptlang.org/) - 类型系统

## 📞 联系方式

- 项目地址：[https://github.com/cold7white/novel-tracker](https://github.com/cold7white/novel-tracker)
- 问题反馈：[Issues](https://github.com/cold7white/novel-tracker/issues)

## 📝 更新日志

### v1.0.0 (2024-04)
- ✨ 初始版本发布
- ✅ 完整的小说管理功能
- ✅ 用户认证和数据同步
- ✅ 数据统计仪表板
- ✅ 响应式设计
- ✅ 移动端优化

---

如果这个项目对你有帮助，请给个 ⭐️ Star 支持一下！
