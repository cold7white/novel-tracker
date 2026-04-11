import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Novel, CreateNovelInput, UpdateNovelInput } from '../types/novel';
import type { Category } from '../types/category';
import { generateId } from '../utils/generateId';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { novelQueries, categoryQueries } from '../lib/supabase/queries';

interface NovelContextType {
  novels: Novel[];
  categories: Category[];
  loading: boolean;
  syncing: boolean;
  addNovel: (novel: CreateNovelInput) => Promise<void>;
  updateNovel: (id: string, updates: UpdateNovelInput) => Promise<void>;
  deleteNovel: (id: string) => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  updateCategory: (id: string, name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getNovelsByCategory: (categoryId?: string) => Novel[];
  getAllTags: () => string[];
  getAllAuthors: () => string[];
  syncFromSupabase: () => Promise<void>;
}

const NovelContext = createContext<NovelContextType | undefined>(undefined);

export const NovelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [novels, setNovels] = useState<Novel[]>(() => {
    const saved = localStorage.getItem('novels');
    return saved ? JSON.parse(saved) : [];
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('categories');
    return saved ? JSON.parse(saved) : [
      { id: 'default', name: '默认分类', createdAt: new Date() }
    ];
  });

  const [syncing, setSyncing] = useState(false);

  // 保存到 localStorage (作为缓存)
  useEffect(() => {
    localStorage.setItem('novels', JSON.stringify(novels));
  }, [novels]);

  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  // 从 Supabase 加载数据
  const syncFromSupabase = async () => {
    if (!user || !isSupabaseConfigured || !supabase) {
      // 未登录或未配置 Supabase 时使用 localStorage 数据
      return;
    }

    try {
      setSyncing(true);
      const [novelsData, categoriesData] = await Promise.all([
        novelQueries.getAll(),
        categoryQueries.getAll(),
      ]);

      // 转换数据格式
      const transformedNovels: Novel[] = novelsData.map(n => ({
        id: n.id,
        title: n.title,
        author: n.author || '',
        status: n.status || 'read',
        rating: n.rating || 0,
        tags: n.tags || [],
        details: n.details || '',
        readingDate: n.reading_date || undefined,
        coverColor: n.cover_color,
        createdAt: new Date(n.created_at),
        updatedAt: new Date(n.updated_at),
        categoryId: n.category_id || undefined,
      }));

      const transformedCategories: Category[] = [
        { id: 'default', name: '默认分类', createdAt: new Date() },
        ...categoriesData.map(c => ({
          id: c.id,
          name: c.name,
          createdAt: new Date(c.created_at),
        })),
      ];

      setNovels(transformedNovels);
      setCategories(transformedCategories);
    } catch (error) {
      console.error('Failed to sync from Supabase:', error);
    } finally {
      setSyncing(false);
    }
  };

  // 当用户登录状态改变时，同步数据
  useEffect(() => {
    if (user) {
      syncFromSupabase();
    }
  }, [user]);

  const addNovel = async (input: CreateNovelInput) => {
    const novel: Novel = {
      ...input,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 更新本地状态
    setNovels(prev => [novel, ...prev]);

    // 如果已登录，同步到 Supabase
    if (user) {
      try {
        await novelQueries.create({
          user_id: user.id,
          title: novel.title,
          author: novel.author,
          status: novel.status,
          rating: novel.rating,
          tags: novel.tags,
          details: novel.details,
          reading_date: novel.readingDate,
          cover_color: novel.coverColor,
          category_id: novel.categoryId,
        });
      } catch (error) {
        console.error('Failed to create novel in Supabase:', error);
      }
    }
  };

  const updateNovel = async (id: string, updates: UpdateNovelInput) => {
    // 更新本地状态
    setNovels(prev => prev.map(novel =>
      novel.id === id
        ? { ...novel, ...updates, updatedAt: new Date() }
        : novel
    ));

    // 如果已登录，同步到 Supabase
    if (user) {
      try {
        await novelQueries.update(id, {
          title: updates.title,
          author: updates.author,
          status: updates.status,
          rating: updates.rating,
          tags: updates.tags,
          details: updates.details,
          reading_date: updates.readingDate,
          cover_color: updates.coverColor,
          category_id: updates.categoryId,
        });
      } catch (error) {
        console.error('Failed to update novel in Supabase:', error);
      }
    }
  };

  const deleteNovel = async (id: string) => {
    // 更新本地状态
    setNovels(prev => prev.filter(novel => novel.id !== id));

    // 如果已登录，同步到 Supabase
    if (user) {
      try {
        await novelQueries.delete(id);
      } catch (error) {
        console.error('Failed to delete novel in Supabase:', error);
      }
    }
  };

  const addCategory = async (name: string) => {
    const category: Category = {
      id: generateId(),
      name,
      createdAt: new Date()
    };

    // 更新本地状态
    setCategories(prev => [...prev, category]);

    // 如果已登录，同步到 Supabase
    if (user) {
      try {
        await categoryQueries.create({
          user_id: user.id,
          name: category.name,
        });
      } catch (error) {
        console.error('Failed to create category in Supabase:', error);
      }
    }
  };

  const updateCategory = async (id: string, name: string) => {
    // 更新本地状态
    setCategories(prev => prev.map(cat =>
      cat.id === id ? { ...cat, name } : cat
    ));

    // 如果已登录且不是默认分类，同步到 Supabase
    if (user && id !== 'default') {
      try {
        await categoryQueries.update(id, { name });
      } catch (error) {
        console.error('Failed to update category in Supabase:', error);
      }
    }
  };

  const deleteCategory = async (id: string) => {
    if (id === 'default') return; // 不能删除默认分类

    // 更新本地状态
    setCategories(prev => prev.filter(cat => cat.id !== id));
    // 将该分类下的小说移到默认分类
    setNovels(prev => prev.map(novel =>
      novel.categoryId === id ? { ...novel, categoryId: 'default' } : novel
    ));

    // 如果已登录，同步到 Supabase
    if (user) {
      try {
        await categoryQueries.delete(id);
        // 更新相关小说的分类
        const novelsInCategory = novels.filter(n => n.categoryId === id);
        await Promise.all(
          novelsInCategory.map(novel =>
            novelQueries.update(novel.id, { category_id: 'default' })
          )
        );
      } catch (error) {
        console.error('Failed to delete category in Supabase:', error);
      }
    }
  };

  const getNovelsByCategory = (categoryId?: string) => {
    if (!categoryId) return novels;
    return novels.filter(novel => novel.categoryId === categoryId);
  };

  const getAllTags = () => {
    const tags = new Set<string>();
    novels.forEach(novel => {
      novel.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  };

  const getAllAuthors = () => {
    const authors = new Set<string>();
    novels.forEach(novel => {
      if (novel.author) authors.add(novel.author);
    });
    return Array.from(authors);
  };

  return (
    <NovelContext.Provider value={{
      novels,
      categories,
      loading: false,
      syncing,
      addNovel,
      updateNovel,
      deleteNovel,
      addCategory,
      updateCategory,
      deleteCategory,
      getNovelsByCategory,
      getAllTags,
      getAllAuthors,
      syncFromSupabase,
    }}>
      {children}
    </NovelContext.Provider>
  );
};

export const useNovels = () => {
  const context = useContext(NovelContext);
  if (!context) {
    throw new Error('useNovels must be used within a NovelProvider');
  }
  return context;
};
