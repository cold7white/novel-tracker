# 贡献指南

感谢你对 Novel Tracker 项目的关注！我们欢迎任何形式的贡献。

## 🤝 如何贡献

### 报告 Bug

如果你发现了 bug，请：

1. 在 [Issues](https://github.com/cold7white/novel-tracker/issues) 中搜索是否已有相同问题
2. 如果没有，创建新的 Issue，包含：
   - 清晰的标题
   - 详细的复现步骤
   - 预期行为和实际行为的对比
   - 截图（如果可能）
   - 环境信息（浏览器、操作系统等）
   - 示例：
     ```markdown
     ## Bug 描述
     
     ### 复现步骤
     1. 点击添加小说
     2. 输入书名和作者
     3. 点击保存
     
     ### 预期行为
     小说应该被保存并显示在列表中
     
     ### 实际行为
     小说没有显示，控制台报错
     
     ### 环境信息
     - 操作系统：Windows 11
     - 浏览器：Chrome 123
     - Node.js 版本：18.17.0
     ```

### 提出新功能

如果你有好的想法：

1. 先在 [Issues](https://github.com/cold7white/novel-tracker/issues) 中讨论
2. 说明功能的使用场景和预期效果
3. 如果获得积极反馈，再开始实施

### 提交代码

#### 准备工作

1. **Fork 仓库**
   - 点击 GitHub 页面右上角的 Fork 按钮

2. **克隆到本地**
   ```bash
   git clone https://github.com/your-username/novel-tracker.git
   cd novel-tracker
   ```

3. **添加上游仓库**
   ```bash
   git remote add upstream https://github.com/cold7white/novel-tracker.git
   ```

4. **安装依赖**
   ```bash
   npm install
   ```

#### 开发流程

1. **创建分支**
   ```bash
   git checkout -b feature/your-feature-name
   # 或
   git checkout -b fix/your-bug-fix
   ```

2. **进行开发**
   - 遵循现有代码风格
   - 添加必要的注释
   - 确保代码通过 ESLint 检查
   - 测试你的更改

3. **运行测试**
   ```bash
   npm run lint
   npm run build
   ```

4. **提交更改**
   ```bash
   git add .
   git commit -m "feat: add some amazing feature"
   # 或
   git commit -m "fix: resolve some bug"
   ```

   **提交消息格式**：
   - `feat:` - 新功能
   - `fix:` - Bug 修复
   - `docs:` - 文档更新
   - `style:` - 代码格式调整
   - `refactor:` - 代码重构
   - `perf:` - 性能优化
   - `test:` - 测试相关
   - `chore:` - 构建/工具相关

5. **同步上游更改**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

6. **推送到你的 Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **创建 Pull Request**
   - 访问你的 Fork 页面
   - 点击 "Compare & pull request"
   - 填写 PR 描述模板
   - 等待代码审查

#### 代码规范

##### TypeScript
- 使用 TypeScript 编写所有新代码
- 为函数、组件添加类型定义
- 避免使用 `any` 类型

##### 命名约定
- 组件：PascalCase（如 `NovelCard`）
- 函数/变量：camelCase（如 `getNovels`）
- 常量：UPPER_SNAKE_CASE（如 `MAX_NOVELS`）
- CSS 类名：kebab-case（如 `novel-card`）

##### 代码风格
- 使用 2 空格缩进
- 使用单引号
- 每行代码不超过 100 字符
- 函数长度不超过 50 行
- 组件文件不超过 300 行

##### React 规范
- 使用函数组件和 Hooks
- 组件职责单一
- 避免过度嵌套
- 合理使用 `useMemo` 和 `useCallback`
- 使用 `props destructuring`

##### CSS 规范
- 使用 CSS 变量定义颜色、间距等
- 使用语义化的类名
- 避免深层嵌套选择器
- 使用 Flexbox 和 Grid 布局
- 确保响应式设计

## 📋 Pull Request 检查清单

提交 PR 前，请确保：

- [ ] 代码通过 ESLint 检查
- [ ] 项目可以正常构建（`npm run build`）
- [ ] 添加了必要的注释
- [ ] 更新了相关文档
- [ ] 没有引入新的警告
- [ ] 遵循了现有代码风格
- [ ] 测试了你的更改

## 🐛 调试技巧

### 常见问题

1. **构建失败**
   - 清除缓存：`rm -rf node_modules dist && npm install`
   - 检查 Node.js 版本：`node -v`（需要 >= 18）

2. **类型错误**
   - 运行 `npm run build` 查看详细错误
   - 检查类型定义文件

3. **样式问题**
   - 检查 CSS 变量是否正确
   - 确认类名拼写正确

### 开发工具

- **React DevTools**：调试 React 组件
- **浏览器控制台**：查看错误和警告
- **VS Code**：推荐的编辑器

## 📚 学习资源

如果你想深入了解项目技术栈：

- [React 官方文档](https://react.dev/)
- [TypeScript 手册](https://www.typescriptlang.org/docs/)
- [Vite 指南](https://vitejs.dev/guide/)
- [Supabase 文档](https://supabase.com/docs)

## 💬 交流社区

- [GitHub Discussions](https://github.com/cold7white/novel-tracker/discussions)
- [Issues](https://github.com/cold7white/novel-tracker/issues)

## 📜 行为准则

请遵守以下准则：

- 尊重所有贡献者
- 保持友善和专业
- 接受建设性批评
- 关注对社区最有利的事情

## ⚖️ 许可证

通过贡献代码，你同意你的贡献将使用 [MIT 许可证](LICENSE) 进行授权。

---

再次感谢你的贡献！🎉
