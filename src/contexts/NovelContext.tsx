import React, { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import type { Novel, CreateNovelInput, UpdateNovelInput } from '../types/novel';
import type { Category } from '../types/category';
import type { Excerpt, CreateExcerptInput, UpdateExcerptInput } from '../types/excerpt';
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
  addExcerpt: (novelId: string, excerpt: CreateExcerptInput) => Promise<Excerpt>;
  updateExcerpt: (novelId: string, excerptId: string, updates: UpdateExcerptInput) => Promise<void>;
  deleteExcerpt: (novelId: string, excerptId: string) => Promise<void>;
  getExcerpts: (novelId: string) => Excerpt[];
}

const NovelContext = createContext<NovelContextType | undefined>(undefined);

export const NovelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const syncInProgressRef = useRef(false);
  const lastSyncedUserRef = useRef<string | null>(null);
  const [novels, setNovels] = useState<Novel[]>(() => {
    const saved = localStorage.getItem('novels');
    if (saved) {
      const parsed = JSON.parse(saved);
      // 转换日期字符串回Date对象
      return parsed.map((n: any) => ({
        ...n,
        createdAt: new Date(n.createdAt),
        updatedAt: new Date(n.updatedAt),
        excerpts: (n.excerpts || []).map((e: any) => ({
          ...e,
          createdAt: new Date(e.createdAt),
          updatedAt: new Date(e.updatedAt)
        }))
      }));
    }
    return [];
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('categories');
    if (saved) {
      const parsed = JSON.parse(saved);
      // 转换日期字符串回Date对象并确保默认分类在最后
      const transformed = parsed.map((c: any) => ({
        ...c,
        createdAt: new Date(c.createdAt)
      }));
      const defaultCategory = transformed.find((c: Category) => c.id === 'default');
      const others = transformed.filter((c: Category) => c.id !== 'default');
      return defaultCategory ? [...others, defaultCategory] : transformed;
    }
    return [{ id: 'default', name: '默认分类', createdAt: new Date() }];
  });

  const [syncing, setSyncing] = useState(false);

  // 批量同步队列
  const syncQueueRef = useRef<Array<{ novelId: string; updates: any }>>([]);
  const syncTimeoutRef = useRef<number | null>(null);

  // 批量同步函数
  const flushSyncQueue = async () => {
    if (syncQueueRef.current.length === 0 || syncInProgressRef.current) {
      return;
    }

    syncInProgressRef.current = true;
    setSyncing(true);

    try {
      const queue = [...syncQueueRef.current];
      syncQueueRef.current = [];

      // 批量处理所有待同步的更改
      for (const { novelId, updates } of queue) {
        await novelQueries.update(novelId, updates);
      }
    } catch (error) {
      console.error('批量同步失败:', error);
    } finally {
      syncInProgressRef.current = false;
      setSyncing(false);
    }
  };

  // 延迟同步
  const scheduleSync = (novelId: string, updates: any) => {
    syncQueueRef.current.push({ novelId, updates });

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(flushSyncQueue, 500) as unknown as number;
  };

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

    // 防止重复同步
    if (syncInProgressRef.current) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    // 检查是否是同一个用户，避免重复同步
    const currentUserId = user.id;
    if (lastSyncedUserRef.current === currentUserId) {
      console.log('Already synced for this user, skipping...');
      return;
    }

    console.log('Starting sync from Supabase...');
    syncInProgressRef.current = true;
    lastSyncedUserRef.current = currentUserId;
    try {
      setSyncing(true);
      const [novelsData, categoriesData] = await Promise.all([
        novelQueries.getAll(),
        categoryQueries.getAll(),
      ]);
      console.log('Fetched from Supabase:', novelsData.length, 'novels,', categoriesData.length, 'categories');

      // 检查每个小说的 excerpts 字段
      novelsData.forEach((n: any) => {
        console.log(`📚 [Supabase] Novel "${n.title}":`, {
          id: n.id,
          excerpts: n.excerpts,
          excerptsCount: Array.isArray(n.excerpts) ? n.excerpts.length : 0,
          details: n.details,
          detailsLength: n.details?.length || 0,
          coverImage: n.cover_image
        });
      });

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
        coverImage: n.cover_image || undefined,
        createdAt: new Date(n.created_at),
        updatedAt: new Date(n.updated_at),
        categoryId: n.category_id || undefined,
        excerpts: ((n.excerpts as Excerpt[]) || []).map(e => ({
          ...e,
          createdAt: new Date(e.createdAt),
          updatedAt: new Date(e.updatedAt)
        })), // 从 Supabase 读取 excerpts 并转换 Date 字段
      }));

      const transformedCategories: Category[] = [
        ...categoriesData.map(c => ({
          id: c.id,
          name: c.name,
          createdAt: new Date(c.created_at),
        })),
        { id: 'default', name: '默认分类', createdAt: new Date() },
      ];

      // 合并策略：保留本地和远程的数据，以 updated_at 较新的为准
      const mergedNovels = (() => {
        const novelMap = new Map<string, Novel>();

        // 先添加本地数据
        novels.forEach(novel => novelMap.set(novel.id, novel));

        // 用远程数据更新（较新的会覆盖较旧的）
        transformedNovels.forEach(novel => {
          const existing = novelMap.get(novel.id);
          if (!existing || new Date(novel.updatedAt) > new Date(existing.updatedAt)) {
            // 如果本地有数据而远程没有，保留本地的
            const coverImage = novel.coverImage || existing?.coverImage;
            const details = (novel.details && novel.details !== '') ? novel.details : (existing?.details || '');
            const excerpts = (novel.excerpts && novel.excerpts.length > 0) ? novel.excerpts : existing?.excerpts;
            novelMap.set(novel.id, { ...novel, coverImage, details, excerpts });
          }
        });

        return Array.from(novelMap.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ).filter((novel, index, self) =>
          // 按标题去重，保留最新的
          index === self.findIndex(n => n.title === novel.title)
        );
      })();

      // 检查合并后的数据
      console.log('🔍 [Merge] Merged novels data:');
      mergedNovels.forEach(novel => {
        console.log(`  - "${novel.title}":`, {
          excerptsCount: novel.excerpts?.length || 0,
          detailsLength: novel.details?.length || 0,
          hasCoverImage: !!novel.coverImage
        });
      });

      // 检查是否有本地数据需要上传到 Supabase
      const supabaseIds = new Set(transformedNovels.map(n => n.id));
      const supabaseTitles = new Set(transformedNovels.map(n => n.title.toLowerCase()));
      const localOnlyNovels = mergedNovels.filter(n => !supabaseIds.has(n.id) && !supabaseTitles.has(n.title.toLowerCase()));

      if (localOnlyNovels.length > 0) {
        console.log('Local novels not in Supabase:', localOnlyNovels.map(n => ({ id: n.id, title: n.title })));
        console.log(`Uploading ${localOnlyNovels.length} local novels to Supabase...`);
        for (const novel of localOnlyNovels) {
          try {
            const novelData = {
              user_id: user.id,
              title: novel.title,
              author: novel.author || null,
              status: novel.status || 'read',
              rating: novel.rating || 0,
              tags: novel.tags || [],
              details: novel.details || null,
              reading_date: novel.readingDate && novel.readingDate !== '' ? novel.readingDate : null,
              cover_color: novel.coverColor || '#3b82f6',
              cover_image: novel.coverImage || null,
              category_id: novel.categoryId && novel.categoryId !== 'default' ? novel.categoryId : null,
              excerpts: (novel.excerpts || []).map(e => ({
                ...e,
                createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : e.createdAt,
                updatedAt: e.updatedAt instanceof Date ? e.updatedAt.toISOString() : e.updatedAt
              })),
            };
            console.log('Uploading novel:', novelData);
            const result = await novelQueries.create(novelData);
            console.log(`Successfully uploaded "${novel.title}" to Supabase with ID:`, result?.id);

            // 使用 Supabase 返回的数据更新本地 novel（包含新的 UUID）
            if (result) {
              const updatedNovel: Novel = {
                id: result.id,
                title: result.title,
                author: result.author || '',
                status: result.status || 'read',
                rating: result.rating || 0,
                tags: result.tags || [],
                details: result.details || '',
                readingDate: result.reading_date || undefined,
                coverColor: result.cover_color,
                coverImage: result.cover_image || undefined,
                createdAt: new Date(result.created_at),
                updatedAt: new Date(result.updated_at),
                categoryId: result.category_id || undefined,
              };
              // 更新 mergedNovels 中的数据
              const index = mergedNovels.findIndex(n => n.id === novel.id);
              if (index !== -1) {
                console.log(`Updating local novel ID from ${novel.id} to ${result.id}`);
                mergedNovels[index] = updatedNovel;
              }
            }
          } catch (err: any) {
            console.error(`Failed to upload novel "${novel.title}" to Supabase:`, err);
            if (err?.message) console.error('Error message:', err.message);
            if (err?.details) console.error('Error details:', err.details);
            if (err?.hint) console.error('Error hint:', err.hint);
          }
        }
      } else {
        console.log('No local novels to upload, all already in Supabase');
      }

      setNovels(mergedNovels);

      // 分类也使用合并策略
      const mergedCategories = (() => {
        const categoryMap = new Map<string, Category>();

        // 先添加本地数据（保留默认分类）
        categories.forEach(cat => categoryMap.set(cat.id, cat));

        // 用远程数据更新（跳过默认分类，避免重复）
        transformedCategories.forEach(cat => {
          if (cat.id !== 'default') {
            const existing = categoryMap.get(cat.id);
            if (!existing) {
              categoryMap.set(cat.id, cat);
            }
          }
        });

        // 排序：默认分类放在最后，其他按创建时间排序
        return Array.from(categoryMap.values()).sort((a, b) => {
          if (a.id === 'default') return 1;
          if (b.id === 'default') return -1;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
      })();

      // 检查是否有本地分类需要上传到 Supabase
      const supabaseCategoryIds = new Set(categoriesData.map(c => c.id));
      const supabaseCategoryNames = new Set(categoriesData.map(c => c.name.toLowerCase()));
      const localOnlyCategories = mergedCategories.filter(c =>
        c.id !== 'default' &&
        !supabaseCategoryIds.has(c.id) &&
        !supabaseCategoryNames.has(c.name.toLowerCase())
      );

      if (localOnlyCategories.length > 0) {
        console.log(`Uploading ${localOnlyCategories.length} local categories to Supabase...`);
        for (const category of localOnlyCategories) {
          try {
            const result = await categoryQueries.create({
              user_id: user.id,
              name: category.name,
            });
            console.log(`Successfully uploaded category "${category.name}" to Supabase with ID:`, result?.id);
          } catch (err) {
            console.error(`Failed to upload category "${category.name}" to Supabase:`, err);
          }
        }
      }

      setCategories(mergedCategories);
    } catch (error) {
      console.error('Failed to sync from Supabase:', error);
    } finally {
      setSyncing(false);
      syncInProgressRef.current = false;
      console.log('Sync completed');
    }
  };

  // 当用户登录状态改变时，同步数据
  useEffect(() => {
    if (user) {
      syncFromSupabase();
    } else {
      // 退出登录时清空数据，保留默认分类
      setNovels([]);
      setCategories([{ id: 'default', name: '默认分类', createdAt: new Date() }]);
      // 清空 localStorage
      localStorage.removeItem('novels');
      localStorage.removeItem('categories');
      // 重置同步状态
      lastSyncedUserRef.current = null;
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
          author: novel.author || null,
          status: novel.status || 'read',
          rating: novel.rating || 0,
          tags: novel.tags || [],
          details: novel.details || null,
          reading_date: novel.readingDate && novel.readingDate !== '' ? novel.readingDate : null,
          cover_color: novel.coverColor || '#3b82f6',
          cover_image: novel.coverImage || null,
          category_id: novel.categoryId && novel.categoryId !== 'default' ? novel.categoryId : null,
          excerpts: novel.excerpts || [],
        });
      } catch (error) {
        console.error('Failed to create novel in Supabase:', error);
      }
    }
  };

  const updateNovel = async (id: string, updates: UpdateNovelInput) => {
    // 获取当前书籍数据，用于同步到Supabase
    const currentNovel = novels.find(n => n.id === id);

    console.log('📝 [updateNovel] Updating novel:', { id, updates, currentNovelExcerpts: currentNovel?.excerpts });

    // 更新本地状态
    setNovels(prev => prev.map(novel =>
      novel.id === id
        ? { ...novel, ...updates, updatedAt: new Date() }
        : novel
    ));

    // 如果已登录，同步到 Supabase
    if (user) {
      try {
        // 构建更新对象，只包含非 undefined 的字段
        const updateData: any = {};
        if (updates.title !== undefined) updateData.title = updates.title;
        if (updates.author !== undefined) updateData.author = updates.author || null;
        if (updates.status !== undefined) updateData.status = updates.status || 'read';
        if (updates.rating !== undefined) updateData.rating = updates.rating || 0;
        if (updates.tags !== undefined) updateData.tags = updates.tags || [];
        if (updates.details !== undefined) updateData.details = updates.details;
        if (updates.readingDate !== undefined) {
          updateData.reading_date = (updates.readingDate && updates.readingDate !== '') ? updates.readingDate : null;
        }
        if (updates.coverColor !== undefined) updateData.cover_color = updates.coverColor || '#3b82f6';
        if (updates.coverImage !== undefined) updateData.cover_image = updates.coverImage || null;
        if (updates.categoryId !== undefined) {
          updateData.category_id = (updates.categoryId && updates.categoryId !== 'default') ? updates.categoryId : null;
        }

        // 确保excerpts始终被同步（使用当前状态中的数据）
        if (currentNovel) {
          // 将 Date 对象转换为 ISO 字符串，以便 Supabase JSONB 字段可以正确存储
          updateData.excerpts = (currentNovel.excerpts || []).map(e => ({
            ...e,
            createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : e.createdAt,
            updatedAt: e.updatedAt instanceof Date ? e.updatedAt.toISOString() : e.updatedAt
          }));
        }

        console.log('☁️ [updateNovel] Syncing to Supabase:', { id, updateData });
        console.log('📤 [updateNovel] Full updateData:', updateData);
        console.log('📤 [updateNovel] Excerpts array:', updateData.excerpts);
        const result = await novelQueries.update(id, updateData);
        console.log('✅ [updateNovel] Supabase update result:', result);
      } catch (error: any) {
        console.error('❌ [updateNovel] Failed to update novel in Supabase:', error);
        console.error('❌ [updateNovel] Error message:', error?.message);
        console.error('❌ [updateNovel] Error details:', error?.details);
        console.error('❌ [updateNovel] Error hint:', error?.hint);
        console.error('❌ [updateNovel] Error code:', error?.code);
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
    // 检查是否已存在相同名称的分类
    const existingCategory = categories.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (existingCategory) {
      console.warn('Category with this name already exists:', name);
      return;
    }

    const category: Category = {
      id: generateId(),
      name,
      createdAt: new Date()
    };

    // 更新本地状态，插入到默认分类之前
    setCategories(prev => {
      const withoutDefault = prev.filter(c => c.id !== 'default');
      const defaultCategory = prev.find(c => c.id === 'default');
      return defaultCategory
        ? [...withoutDefault, category, defaultCategory]
        : [...prev, category];
    });

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
    // 将该分类下的书籍移到默认分类
    setNovels(prev => prev.map(novel =>
      novel.categoryId === id ? { ...novel, categoryId: 'default' } : novel
    ));

    // 如果已登录，同步到 Supabase
    if (user) {
      try {
        await categoryQueries.delete(id);
        // 更新相关书籍的分类
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

  // 书摘 CRUD 方法
  const addExcerpt = async (novelId: string, excerptInput: CreateExcerptInput): Promise<Excerpt> => {
    // 自动生成摘录日期为当前日期
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 格式
    const excerpt: Excerpt = {
      ...excerptInput,
      excerptDate: currentDate,
      novelId,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 计算更新后的 excerpts 数组用于同步
    const currentNovel = novels.find(n => n.id === novelId);
    const updatedExcerpts = [...(currentNovel?.excerpts || []), excerpt];

    console.log('📝 [addExcerpt] Adding excerpt:', { novelId, excerpt, updatedExcerpts });

    // 更新本地状态
    setNovels(prev => prev.map(novel => {
      if (novel.id === novelId) {
        const excerpts = novel.excerpts || [];
        return { ...novel, excerpts: [...excerpts, excerpt], updatedAt: new Date() };
      }
      return novel;
    }));

    // 如果已登录，同步到 Supabase（不等待完成）
    if (user) {
      novelQueries.update(novelId, { excerpts: updatedExcerpts.map(e => ({
        ...e,
        createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : e.createdAt,
        updatedAt: e.updatedAt instanceof Date ? e.updatedAt.toISOString() : e.updatedAt
      }))}).catch((error: any) => {
        console.error('❌ [addExcerpt] Failed to sync to Supabase:', error);
      });
    }

    return excerpt;
  };

  const updateExcerpt = async (novelId: string, excerptId: string, updates: UpdateExcerptInput) => {
    // 更新本地状态
    setNovels(prev => prev.map(novel => {
      if (novel.id === novelId) {
        const excerpts = novel.excerpts || [];
        return {
          ...novel,
          excerpts: excerpts.map(excerpt =>
            excerpt.id === excerptId
              ? { ...excerpt, ...updates, updatedAt: new Date(), excerptDate: excerpt.excerptDate } // 保留原有的摘录日期
              : excerpt
          ),
          updatedAt: new Date()
        };
      }
      return novel;
    }));

    // 如果已登录，同步到 Supabase
    if (user) {
      try {
        // 获取当前小说数据
        const currentNovel = novels.find(n => n.id === novelId);
        if (currentNovel && currentNovel.excerpts) {
          // 计算更新后的 excerpts 数组
          const updatedExcerpts = currentNovel.excerpts.map(excerpt =>
            excerpt.id === excerptId
              ? { ...excerpt, ...updates, updatedAt: new Date() }
              : excerpt
          );

          // 将 Date 对象转换为 ISO 字符串
          const excerptsForSupabase = updatedExcerpts.map(e => ({
            ...e,
            createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : e.createdAt,
            updatedAt: e.updatedAt instanceof Date ? e.updatedAt.toISOString() : e.updatedAt
          }));

          await novelQueries.update(novelId, { excerpts: excerptsForSupabase });
        }
      } catch (error: any) {
        console.error('❌ [updateExcerpt] Failed to sync to Supabase:', error);
        console.error('❌ [updateExcerpt] Error details:', {
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          code: error?.code
        });
      }
    }
  };

  const deleteExcerpt = async (novelId: string, excerptId: string) => {
    // 更新本地状态
    setNovels(prev => prev.map(novel => {
      if (novel.id === novelId) {
        const excerpts = novel.excerpts || [];
        return {
          ...novel,
          excerpts: excerpts.filter(excerpt => excerpt.id !== excerptId),
          updatedAt: new Date()
        };
      }
      return novel;
    }));

    // 如果已登录，批量同步到 Supabase
    if (user) {
      // 获取当前小说数据
      const currentNovel = novels.find(n => n.id === novelId);
      if (currentNovel && currentNovel.excerpts) {
        // 计算更新后的 excerpts 数组
        const updatedExcerpts = currentNovel.excerpts.filter(excerpt => excerpt.id !== excerptId);

        // 将 Date 对象转换为 ISO 字符串
        const excerptsForSupabase = updatedExcerpts.map(e => ({
          ...e,
          createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : e.createdAt,
          updatedAt: e.updatedAt instanceof Date ? e.updatedAt.toISOString() : e.updatedAt
        }));

        // 使用批量同步
        scheduleSync(novelId, { excerpts: excerptsForSupabase });
      }
    }
  };

  const getExcerpts = (novelId: string) => {
    const novel = novels.find(n => n.id === novelId);
    return novel?.excerpts || [];
  };

  // 移除 syncChanges 方法，因为不再需要延迟同步

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
      addExcerpt,
      updateExcerpt,
      deleteExcerpt,
      getExcerpts,
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
