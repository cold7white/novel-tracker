import React, { useState, useMemo, useRef, useEffect } from 'react'
import './App.css'
import { NovelProvider, useNovels } from './contexts/NovelContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import NovelCard from './components/NovelCard'
import NovelForm from './components/NovelForm'
import NovelDetail from './components/NovelDetail'
import StatsDashboard from './components/StatsDashboard'
import AuthForm from './components/Auth/AuthForm'
import UserAvatar from './components/Auth/UserAvatar'
import type { ReadingStatus, Novel } from './types/novel'

function AppContent() {
  const { user, isConfigured } = useAuth()
  const {
    novels,
    categories,
    addNovel,
    updateNovel,
    deleteNovel,
    addCategory,
    updateCategory,
    deleteCategory,
    getAllTags,
    getAllAuthors
  } = useNovels()

  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')

  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [sortField, setSortField] = useState<'createdAt' | 'title' | 'rating'>('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // 筛选状态
  const [selectedStatus, setSelectedStatus] = useState<string>('全部状态')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  // 分类管理
  const [selectedCategory, setSelectedCategory] = useState<string | null>('default')
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [categoryMenu, setCategoryMenu] = useState<{ id: string; x: number; y: number } | null>(null)
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const addingCategoryRef = useRef<string | null>(null)

  // 右键菜单管理
  const [contextMenuNovelId, setContextMenuNovelId] = useState<string | null>(null)
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null)

  // 分类长按状态
  const [categoryLongPressTimer, setCategoryLongPressTimer] = useState<number | null>(null)

  // 模态框状态
  const [showForm, setShowForm] = useState(false)
  const [editingNovel, setEditingNovel] = useState<any>(null)
  const [viewingNovel, setViewingNovel] = useState<any>(null)
  const [showStats, setShowStats] = useState(false)

  // 移动端侧边栏状态
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // 详情页初始标签页和返回状态
  const [novelDetailInitialTab, setNovelDetailInitialTab] = useState<'notes' | 'excerpts'>('notes')
  const [returnToStats, setReturnToStats] = useState(false)
  const [initialExcerptId, setInitialExcerptId] = useState<string | undefined>(undefined)

  // 清理长按计时器
  useEffect(() => {
    return () => {
      if (categoryLongPressTimer) {
        clearTimeout(categoryLongPressTimer)
      }
    }
  }, [categoryLongPressTimer])

  // 处理排序
  const handleSort = (field: 'createdAt' | 'title' | 'rating') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      if (field === 'title') {
        setSortDirection('asc')
      } else {
        setSortDirection('desc')
      }
    }
    setActiveDropdown(null)
  }

  // 切换下拉菜单
  const toggleDropdown = (dropdown: string) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown)
  }

  // 选择状态（单选）
  const selectStatus = (status: string) => {
    setSelectedStatus(status)
    setActiveDropdown(null)
  }

  // 切换标签筛选（多选）
  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(v => v !== tag)
        : [...prev, tag]
    )
  }

  // 切换作者筛选（多选）
  const toggleAuthor = (author: string) => {
    setSelectedAuthors(prev =>
      prev.includes(author)
        ? prev.filter(v => v !== author)
        : [...prev, author]
    )
  }

  // 处理添加书籍
  const handleAddNovel = () => {
    setEditingNovel(null)
    setShowForm(true)
  }

  // 处理编辑书籍
  const handleEditNovel = (novel: any) => {
    setEditingNovel(novel)
    setShowForm(true)
  }

  // 处理内联编辑保存
  const handleInlineEditSave = (id: string, updates: any) => {
    updateNovel(id, updates)
    // 同时更新 viewingNovel 状态，确保详情页显示最新数据
    if (viewingNovel && viewingNovel.id === id) {
      setViewingNovel({ ...viewingNovel, ...updates })
    }
  }

  // 处理保存书籍
  const handleSaveNovel = (data: any) => {
    if (editingNovel) {
      updateNovel(editingNovel.id, data)
    } else {
      addNovel({ ...data, categoryId: selectedCategory || 'default' })
    }
    setShowForm(false)
    setEditingNovel(null)
  }

  // 处理删除书籍
  const handleDeleteNovel = (id: string) => {
    deleteNovel(id)
  }

  // 处理颜色变更
  const handleColorChange = (id: string, color: string) => {
    updateNovel(id, { coverColor: color })
  }

  // 处理封面上传
  const handleCoverImageUpload = (id: string, imageData: string) => {
    updateNovel(id, { coverImage: imageData })
    // 同时更新 viewingNovel 状态，确保详情页显示最新封面
    if (viewingNovel && viewingNovel.id === id) {
      setViewingNovel({ ...viewingNovel, coverImage: imageData })
    }
  }

  // 处理分类变更
  const handleCategoryChange = (id: string, categoryId: string) => {
    updateNovel(id, { categoryId })
    if (viewingNovel && viewingNovel.id === id) {
      setViewingNovel({ ...viewingNovel, categoryId })
    }
  }

  // 处理右键菜单
  const handleContextMenu = (novelId: string, position: { x: number; y: number }) => {
    setContextMenuNovelId(novelId)
    setContextMenuPosition(position)
  }

  const handleCloseContextMenu = () => {
    setContextMenuNovelId(null)
    setContextMenuPosition(null)
  }

  // 处理查看详情
  const handleViewDetail = (novel: any) => {
    setViewingNovel(novel)
  }

  // 处理保存详情
  const handleSaveDetails = (id: string, updates: { details?: string }) => {
    updateNovel(id, updates)
    // 同时更新 viewingNovel 状态，确保详情页显示最新数据
    if (viewingNovel && viewingNovel.id === id) {
      setViewingNovel({ ...viewingNovel, ...updates })
    }
  }

  // 添加分类
  const handleAddCategory = async () => {
    const trimmedName = newCategoryName.trim()
    if (trimmedName && !isAddingCategory && addingCategoryRef.current !== trimmedName) {
      setIsAddingCategory(true)
      addingCategoryRef.current = trimmedName
      await addCategory(trimmedName)
      setNewCategoryName('')
      setShowAddCategory(false)
      setTimeout(() => {
        setIsAddingCategory(false)
        addingCategoryRef.current = null
      }, 1000)
    }
  }

  // 重命名分类
  const handleRenameCategory = (categoryId: string, newName: string) => {
    if (newName.trim()) {
      updateCategory(categoryId, newName)
    }
    setCategoryMenu(null)
  }

  // 删除分类
  const handleDeleteCategory = (categoryId: string) => {
    if (confirm('确定要删除这个分类吗？分类下的书籍将移至默认分类。')) {
      deleteCategory(categoryId)
      if (selectedCategory === categoryId) {
        setSelectedCategory(null)
      }
    }
    setCategoryMenu(null)
  }

  // 分类长按处理
  const handleCategoryTouchStart = (e: React.TouchEvent, categoryId: string) => {
    if (categoryId === 'default') return
    const timer = setTimeout(() => {
      // 触觉反馈
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
      // 显示菜单
      const touch = e.touches[0]
      setCategoryMenu({ id: categoryId, x: touch.clientX, y: touch.clientY })
    }, 500)
    setCategoryLongPressTimer(timer)
  }

  const handleCategoryTouchEnd = () => {
    if (categoryLongPressTimer) {
      clearTimeout(categoryLongPressTimer)
      setCategoryLongPressTimer(null)
    }
  }

  const handleCategoryTouchMove = () => {
    if (categoryLongPressTimer) {
      clearTimeout(categoryLongPressTimer)
      setCategoryLongPressTimer(null)
    }
  }

  // 筛选和排序后的书籍列表
  const filteredNovels = useMemo(() => {
    let result = novels

    // 分类筛选
    if (selectedCategory) {
      result = result.filter(novel => {
        // 默认分类包含 categoryId 为 'default' 或 null 的书籍
        if (selectedCategory === 'default') {
          return novel.categoryId === 'default' || novel.categoryId === null || novel.categoryId === undefined
        }
        return novel.categoryId === selectedCategory
      })
    }

    // 状态筛选
    if (selectedStatus !== '全部状态') {
      const statusMap: { [key: string]: ReadingStatus } = {
        '在读': 'reading',
        '已读': 'read',
        '想看': 'want'
      }
      result = result.filter(novel => novel.status && novel.status === statusMap[selectedStatus])
    }

    // 标签筛选
    if (selectedTags.length > 0) {
      result = result.filter(novel =>
        selectedTags.some(tag => novel.tags.includes(tag))
      )
    }

    // 作者筛选
    if (selectedAuthors.length > 0) {
      result = result.filter(novel =>
        selectedAuthors.includes(novel.author)
      )
    }

    // 搜索筛选
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(novel =>
        novel.title.toLowerCase().includes(term) ||
        novel.author.toLowerCase().includes(term) ||
        novel.tags.some(tag => tag.toLowerCase().includes(term))
      )
    }

    // 排序
    result = [...result].sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'title':
          comparison = a.title.localeCompare(b.title, 'zh-CN')
          break
        case 'rating':
          comparison = a.rating - b.rating
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return result
  }, [novels, selectedCategory, selectedStatus, selectedTags, selectedAuthors, searchTerm, sortField, sortDirection])

  // 获取所有标签和作者
  const allTags = getAllTags()
  const allAuthors = getAllAuthors()

  return (
    <div className="app" onClick={() => {
      setActiveDropdown(null)
      setCategoryMenu(null)
      handleCloseContextMenu()
      // 点击内容区关闭移动端侧边栏
      if (sidebarOpen) {
        setSidebarOpen(false)
      }
    }}>
      {/* 移动端遮罩层 */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`} onClick={(e) => { e.stopPropagation(); handleCloseContextMenu(); }}>
        <div className="sidebar-header">
          <div className="sidebar-title">
            <span className="title-large">Novel</span>
            <span className="title-small">tracker</span>
          </div>
          {/* 认证按钮 - 放在侧边栏右上角 */}
          {isConfigured && (
            <div className="sidebar-auth">
              {user ? (
                <UserAvatar />
              ) : (
                <button
                  className="login-btn"
                  onClick={() => {
                    setAuthMode('login')
                    setShowAuth(true)
                  }}
                >
                  登录
                </button>
              )}
            </div>
          )}
        </div>
        <nav className="category-list">
          {/* 统计按钮 */}
          <div className="category-item-wrapper">
            <button
              className="stats-btn-inline"
              onClick={() => setShowStats(true)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
              </svg>
              统计
            </button>
          </div>
          {/* 默认分类 */}
          {categories.filter(c => c.id === 'default').map(category => (
            <div key={category.id} className="category-item-wrapper">
              <div
                className={`category-item ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCategory(selectedCategory === category.id ? null : category.id)
                  setSidebarOpen(false)
                }}
              >
                <span className="category-name">{category.name}</span>
                <span className="count">
                  {novels.filter(n => n.categoryId === 'default' || n.categoryId === null || n.categoryId === undefined).length}
                </span>
              </div>
            </div>
          ))}
          {categories.filter(c => c.id !== 'default').map(category => (
            <div key={category.id} className="category-item-wrapper">
              <div
                className={`category-item ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCategory(selectedCategory === category.id ? null : category.id)
                  setSidebarOpen(false)
                }}
                onContextMenu={(e) => {
                  e.preventDefault()
                  if (category.id !== 'default') {
                    setCategoryMenu({ id: category.id, x: e.clientX, y: e.clientY })
                  }
                }}
                onTouchStart={(e) => handleCategoryTouchStart(e, category.id)}
                onTouchEnd={handleCategoryTouchEnd}
                onTouchMove={handleCategoryTouchMove}
              >
                <span className="category-name">{category.name}</span>
                <span className="count">
                  {novels.filter(n => n.categoryId === category.id).length}
                </span>
              </div>
              {categoryMenu?.id === category.id && (
                <div
                  className="category-menu-popup"
                  style={{ left: `${categoryMenu.x}px`, top: `${categoryMenu.y}px` }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="category-menu-item"
                    onClick={() => {
                      const newName = prompt('重命名分类', category.name)
                      if (newName) {
                        handleRenameCategory(category.id, newName)
                      }
                      setCategoryMenu(null)
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                    重命名
                  </button>
                  <button
                    className="category-menu-item category-menu-item-danger"
                    onClick={() => handleDeleteCategory(category.id)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                    删除
                  </button>
                </div>
              )}
            </div>
          ))}
        </nav>
        {!showAddCategory ? (
          <button className="add-category-btn" onClick={() => setShowAddCategory(true)}>
            + 新建分类
          </button>
        ) : (
          <div className="add-category-form">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="分类名称"
              autoFocus
            />
            <div className="form-buttons">
              <button className="btn btn-secondary" onClick={(e) => {
                e.stopPropagation()
                setShowAddCategory(false)
                setNewCategoryName('')
              }}>取消</button>
              <button className="btn btn-primary" onClick={(e) => {
                e.stopPropagation()
                handleAddCategory()
              }} disabled={isAddingCategory}>{isAddingCategory ? '添加中...' : '添加'}</button>
            </div>
          </div>
        )}
      </aside>

      {/* 主内容区 */}
      <main className="main-content">
        {/* 顶部工具栏 */}
        <header className="header">
          {/* 移动端汉堡菜单按钮 */}
          <div className="header-left">
            <button
              className="hamburger-menu"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                {sidebarOpen ? (
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                ) : (
                  <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                )}
              </svg>
            </button>

            <button className="btn btn-primary" onClick={handleAddNovel}>+ 添加书籍</button>
          </div>

          <div className="header-right">
            <div className="header-filters">
              {/* 状态筛选 */}
              <div className="dropdown">
                <button
                  className={`btn btn-secondary dropdown-toggle ${selectedStatus !== '全部状态' ? 'active-filter' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleDropdown('status')
                  }}
                >
                  {selectedStatus}
                </button>
                {activeDropdown === 'status' && (
                  <div className="dropdown-menu">
                    <div
                      className={`dropdown-item ${selectedStatus === '全部状态' ? 'active' : ''}`}
                    onClick={() => selectStatus('全部状态')}
                  >
                    全部状态
                  </div>
                  <div
                    className={`dropdown-item ${selectedStatus === '在读' ? 'active' : ''}`}
                    onClick={() => selectStatus('在读')}
                  >
                    <span className="status-indicator status-reading"></span>
                    在读
                  </div>
                  <div
                    className={`dropdown-item ${selectedStatus === '已读' ? 'active' : ''}`}
                    onClick={() => selectStatus('已读')}
                  >
                    <span className="status-indicator status-read"></span>
                    已读
                  </div>
                  <div
                    className={`dropdown-item ${selectedStatus === '想看' ? 'active' : ''}`}
                    onClick={() => selectStatus('想看')}
                  >
                    <span className="status-indicator status-want"></span>
                    想看
                  </div>
                </div>
              )}
            </div>

            {/* 标签筛选 */}
            <div className="dropdown">
              <button
                className={`btn btn-secondary dropdown-toggle ${selectedTags.length > 0 ? 'active-filter' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleDropdown('tags')
                }}
              >
                标签
              </button>
              {activeDropdown === 'tags' && (
                <div className="dropdown-menu">
                  {allTags.length > 0 ? (
                    allTags.map(tag => (
                      <div
                        key={tag}
                        className="dropdown-item"
                        onClick={() => toggleTag(tag)}
                      >
                        <span className={`checkbox ${selectedTags.includes(tag) ? 'checked' : ''}`}></span>
                        {tag}
                      </div>
                    ))
                  ) : (
                    <div className="dropdown-item">
                      <span className="checkbox"></span>
                      暂无标签
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 作者筛选 */}
            <div className="dropdown">
              <button
                className={`btn btn-secondary dropdown-toggle ${selectedAuthors.length > 0 ? 'active-filter' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleDropdown('authors')
                }}
              >
                作者
              </button>
              {activeDropdown === 'authors' && (
                <div className="dropdown-menu">
                  {allAuthors.length > 0 ? (
                    allAuthors.map(author => (
                      <div
                        key={author}
                        className="dropdown-item"
                        onClick={() => toggleAuthor(author)}
                      >
                        <span className={`checkbox ${selectedAuthors.includes(author) ? 'checked' : ''}`}></span>
                        {author}
                      </div>
                    ))
                  ) : (
                    <div className="dropdown-item">
                      <span className="checkbox"></span>
                      暂无作者
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 排序 */}
            <div className="dropdown">
              <button
                className="btn btn-secondary dropdown-toggle"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleDropdown('sort')
                }}
              >
                排序
              </button>
              {activeDropdown === 'sort' && (
                <div className="dropdown-menu">
                  <div
                    className={`dropdown-item ${sortField === 'createdAt' ? 'active' : ''}`}
                    onClick={() => handleSort('createdAt')}
                  >
                    时间 {sortField === 'createdAt' && (sortDirection === 'desc' ? '↓' : '↑')}
                  </div>
                  <div
                    className={`dropdown-item ${sortField === 'title' ? 'active' : ''}`}
                    onClick={() => handleSort('title')}
                  >
                    书名 {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </div>
                  <div
                    className={`dropdown-item ${sortField === 'rating' ? 'active' : ''}`}
                    onClick={() => handleSort('rating')}
                  >
                    评分 {sortField === 'rating' && (sortDirection === 'desc' ? '↓' : '↑')}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 视图切换 + 搜索 */}
          <div className="view-search-group">
            <div className="view-toggle">
              <button
                className={`btn-icon ${viewMode === 'card' ? 'active' : ''}`}
                onClick={() => setViewMode('card')}
                title="卡片视图"
              >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="3" y="3" width="8" height="8" rx="2" />
                    <rect x="13" y="3" width="8" height="8" rx="2" />
                    <rect x="3" y="13" width="8" height="8" rx="2" />
                    <rect x="13" y="13" width="8" height="8" rx="2" />
                  </svg>
                </button>
                <button
                  className={`btn-icon ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="列表视图"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="3" y="4" width="18" height="3" rx="1" />
                    <rect x="3" y="10" width="18" height="3" rx="1" />
                    <rect x="3" y="16" width="18" height="3" rx="1" />
                  </svg>
                </button>
              </div>

              {/* 搜索框 */}
              <input
                type="text"
                placeholder="搜索书籍..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        {/* 内容区域滚动包裹器 */}
        <div className="content-scroll-wrapper">
          {/* 书籍列表区域 */}
          <div className={viewMode === 'card' ? 'novel-grid' : 'novel-list'}>
            {filteredNovels.length > 0 ? (
              filteredNovels.map(novel => (
                <NovelCard
                  key={novel.id}
                  novel={novel}
                  viewMode={viewMode}
                  onEdit={handleEditNovel}
                  onDelete={handleDeleteNovel}
                  onColorChange={handleColorChange}
                  onViewDetail={handleViewDetail}
                  onInlineEditSave={handleInlineEditSave}
                  onCoverImageUpload={handleCoverImageUpload}
                  onCategoryChange={handleCategoryChange}
                  categories={categories}
                  contextMenuOpen={contextMenuNovelId === novel.id}
                  contextMenuPosition={contextMenuPosition}
                  onContextMenu={handleContextMenu}
                  onCloseContextMenu={handleCloseContextMenu}
                />
              ))
            ) : (
              <div className="empty-state">
                <p>{searchTerm ? '没有找到匹配的书籍' : '还没有添加任何书籍'}</p>
                <p>点击上方"添加书籍"按钮开始记录</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 添加/编辑表单 */}
      {showForm && (
        <NovelForm
          novel={editingNovel}
          onSave={handleSaveNovel}
          onCancel={() => {
            setShowForm(false)
            setEditingNovel(null)
          }}
        />
      )}

      {/* 详情页 */}
      {viewingNovel && (
        <NovelDetail
          novel={viewingNovel}
          onUpdate={handleSaveDetails}
          onBack={() => {
            setViewingNovel(null)
            if (returnToStats) {
              setShowStats(true)
              setReturnToStats(false)
              setInitialExcerptId(undefined)
            }
          }}
          initialActiveTab={novelDetailInitialTab}
          initialExcerptId={initialExcerptId}
        />
      )}

      {/* 认证表单 */}
      {showAuth && (
        <AuthForm
          mode={authMode}
          onToggleMode={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
          onClose={() => setShowAuth(false)}
          onSuccess={() => setShowAuth(false)}
        />
      )}

      {/* 统计页面 */}
      {showStats && (
        <StatsDashboard
          novels={novels}
          onClose={() => setShowStats(false)}
          onViewNovel={(novel) => {
            setShowStats(false)
            setNovelDetailInitialTab('notes')
            setReturnToStats(true)
            setViewingNovel(novel)
          }}
          onViewExcerpt={(novel: Novel, excerptId: string) => {
            setShowStats(false)
            setNovelDetailInitialTab('excerpts')
            setInitialExcerptId(excerptId)
            setReturnToStats(true)
            setViewingNovel(novel)
          }}
        />
      )}
    </div>
  )
}

// 错误边界组件
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: '#666',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <h3>出现了一些小问题</h3>
          <p>请刷新页面重试</p>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <AuthProvider>
      <NovelProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </NovelProvider>
    </AuthProvider>
  )
}

export default App
