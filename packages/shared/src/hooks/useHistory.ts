/**
 * 历史记录和搜索Hook
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { HistoryService, SearchQuery, SearchFilters, SortField, SearchResult, Bookmark, ConversationTag } from '../services/history';
import { ChatMessage, Conversation } from '../services/chat';

interface UseHistoryOptions {
  autoLoad?: boolean;
  debounceMs?: number;
  minQueryLength?: number;
  maxHistoryItems?: number;
}

interface UseHistoryReturn {
  // 搜索状态
  isSearching: boolean;
  searchQuery: string;
  searchResults: {
    messages: SearchResult<ChatMessage>;
    conversations: SearchResult<Conversation>;
  } | null;
  searchSuggestions: string[];
  searchHistory: SearchHistory[];

  // 书签状态
  bookmarks: Bookmark[];
  isLoadingBookmarks: boolean;

  // 标签状态
  conversationTags: ConversationTag[];
  isLoadingTags: boolean;

  // 搜索方法
  searchMessages: (query: string, filters?: SearchFilters) => Promise<void>;
  searchConversations: (query: string, filters?: SearchFilters) => Promise<void>;
  globalSearch: (query: string, filters?: SearchFilters) => Promise<void>;
  clearSearch: () => void;
  loadSearchSuggestions: (query: string) => Promise<void>;

  // 书签方法
  loadBookmarks: (options?: any) => Promise<void>;
  addBookmark: (messageId: string, conversationId: string, note?: string) => Promise<void>;
  updateBookmark: (bookmarkId: string, updates: any) => Promise<void>;
  removeBookmark: (bookmarkId: string) => Promise<void>;
  isBookmarked: (messageId: string) => boolean;

  // 标签方法
  loadConversationTags: () => Promise<void>;
  createTag: (tag: { name: string; color: string; description?: string }) => Promise<void>;
  addTagToConversation: (conversationId: string, tagId: string) => Promise<void>;
  removeTagFromConversation: (conversationId: string, tagId: string) => Promise<void>;

  // 批量操作
  bulkDeleteConversations: (conversationIds: string[]) => Promise<void>;
  bulkArchiveConversations: (conversationIds: string[]) => Promise<void>;

  // 导入导出
  exportHistory: (options: any) => Promise<string>;
  importHistory: (options: any) => Promise<any>;
}

interface SearchHistory {
  id: string;
  query: string;
  filters?: SearchFilters;
  resultCount: number;
  searchedAt: string;
}

export const useHistory = (options: UseHistoryOptions = {}): UseHistoryReturn => {
  const {
    autoLoad = true,
    debounceMs = 300,
    minQueryLength = 2,
    maxHistoryItems = 50,
  } = options;

  // 搜索状态
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    messages: SearchResult<ChatMessage>;
    conversations: SearchResult<Conversation>;
  } | null>(null);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);

  // 书签状态
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState(false);

  // 标签状态
  const [conversationTags, setConversationTags] = useState<ConversationTag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);

  // 防抖定时器
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 搜索消息
  const searchMessages = useCallback(async (query: string, filters?: SearchFilters) => {
    if (query.length < minQueryLength) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);

    try {
      const searchQuery: SearchQuery = {
        query,
        filters,
        sort: {
          field: SortField.RELEVANCE,
          direction: 'desc',
        },
        pagination: {
          limit: 20,
          offset: 0,
        },
      };

      const result = await HistoryService.searchMessages(searchQuery);

      setSearchResults(prev => ({
        messages: result,
        conversations: prev?.conversations || {
          items: [],
          total: 0,
          hasMore: false,
          searchTime: 0,
        },
      }));

      // 添加到搜索历史
      setSearchHistory(prev => [
        {
          id: Date.now().toString(),
          query,
          filters,
          resultCount: result.total,
          searchedAt: new Date().toISOString(),
        },
        ...prev.slice(0, maxHistoryItems - 1),
      ]);
    } catch (error) {
      console.error('Search messages error:', error);
      setSearchResults(null);
    } finally {
      setIsSearching(false);
    }
  }, [minQueryLength, maxHistoryItems]);

  // 搜索会话
  const searchConversations = useCallback(async (query: string, filters?: SearchFilters) => {
    if (query.length < minQueryLength) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);

    try {
      const searchQuery: SearchQuery = {
        query,
        filters,
        sort: {
          field: SortField.DATE,
          direction: 'desc',
        },
        pagination: {
          limit: 20,
          offset: 0,
        },
      };

      const result = await HistoryService.searchConversations(searchQuery);

      setSearchResults(prev => ({
        messages: prev?.messages || {
          items: [],
          total: 0,
          hasMore: false,
          searchTime: 0,
        },
        conversations: result,
      }));

      // 添加到搜索历史
      setSearchHistory(prev => [
        {
          id: Date.now().toString(),
          query,
          filters,
          resultCount: result.total,
          searchedAt: new Date().toISOString(),
        },
        ...prev.slice(0, maxHistoryItems - 1),
      ]);
    } catch (error) {
      console.error('Search conversations error:', error);
      setSearchResults(null);
    } finally {
      setIsSearching(false);
    }
  }, [minQueryLength, maxHistoryItems]);

  // 全局搜索
  const globalSearch = useCallback(async (query: string, filters?: SearchFilters) => {
    if (query.length < minQueryLength) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);

    try {
      const searchQuery: SearchQuery = {
        query,
        filters,
        sort: {
          field: SortField.RELEVANCE,
          direction: 'desc',
        },
        pagination: {
          limit: 20,
          offset: 0,
        },
      };

      const result = await HistoryService.globalSearch(searchQuery);

      setSearchResults({
        messages: result.messages,
        conversations: result.conversations,
      });

      // 添加到搜索历史
      setSearchHistory(prev => [
        {
          id: Date.now().toString(),
          query,
          filters,
          resultCount: result.messages.total + result.conversations.total,
          searchedAt: new Date().toISOString(),
        },
        ...prev.slice(0, maxHistoryItems - 1),
      ]);
    } catch (error) {
      console.error('Global search error:', error);
      setSearchResults(null);
    } finally {
      setIsSearching(false);
    }
  }, [minQueryLength, maxHistoryItems]);

  // 清除搜索
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults(null);
    setSearchSuggestions([]);
  }, []);

  // 加载搜索建议
  const loadSearchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchSuggestions([]);
      return;
    }

    try {
      const suggestions = await HistoryService.getSearchSuggestions(query, 8);
      setSearchSuggestions(suggestions);
    } catch (error) {
      console.error('Load suggestions error:', error);
      setSearchSuggestions([]);
    }
  }, []);

  // 加载书签
  const loadBookmarks = useCallback(async (options?: any) => {
    setIsLoadingBookmarks(true);

    try {
      const { bookmarks: bookmarkList } = await HistoryService.getBookmarks(options);
      setBookmarks(bookmarkList);
    } catch (error) {
      console.error('Load bookmarks error:', error);
    } finally {
      setIsLoadingBookmarks(false);
    }
  }, []);

  // 添加书签
  const addBookmark = useCallback(async (messageId: string, conversationId: string, note?: string) => {
    try {
      const bookmark = await HistoryService.addBookmark({
        messageId,
        conversationId,
        note,
      });
      setBookmarks(prev => [bookmark, ...prev]);
    } catch (error) {
      console.error('Add bookmark error:', error);
      throw error;
    }
  }, []);

  // 更新书签
  const updateBookmark = useCallback(async (bookmarkId: string, updates: any) => {
    try {
      const updatedBookmark = await HistoryService.updateBookmark(bookmarkId, updates);
      setBookmarks(prev =>
        prev.map(bookmark =>
          bookmark.id === bookmarkId ? updatedBookmark : bookmark
        )
      );
    } catch (error) {
      console.error('Update bookmark error:', error);
      throw error;
    }
  }, []);

  // 删除书签
  const removeBookmark = useCallback(async (bookmarkId: string) => {
    try {
      await HistoryService.removeBookmark(bookmarkId);
      setBookmarks(prev => prev.filter(bookmark => bookmark.id !== bookmarkId));
    } catch (error) {
      console.error('Remove bookmark error:', error);
      throw error;
    }
  }, []);

  // 检查消息是否已加书签
  const isBookmarked = useCallback((messageId: string) => {
    return bookmarks.some(bookmark => bookmark.messageId === messageId);
  }, [bookmarks]);

  // 加载会话标签
  const loadConversationTags = useCallback(async () => {
    setIsLoadingTags(true);

    try {
      const tags = await HistoryService.getConversationTags();
      setConversationTags(tags);
    } catch (error) {
      console.error('Load conversation tags error:', error);
    } finally {
      setIsLoadingTags(false);
    }
  }, []);

  // 创建标签
  const createTag = useCallback(async (tag: { name: string; color: string; description?: string }) => {
    try {
      const newTag = await HistoryService.createConversationTag(tag);
      setConversationTags(prev => [newTag, ...prev]);
    } catch (error) {
      console.error('Create tag error:', error);
      throw error;
    }
  }, []);

  // 为会话添加标签
  const addTagToConversation = useCallback(async (conversationId: string, tagId: string) => {
    try {
      await HistoryService.addTagToConversation(conversationId, tagId);
    } catch (error) {
      console.error('Add tag to conversation error:', error);
      throw error;
    }
  }, []);

  // 从会话移除标签
  const removeTagFromConversation = useCallback(async (conversationId: string, tagId: string) => {
    try {
      await HistoryService.removeTagFromConversation(conversationId, tagId);
    } catch (error) {
      console.error('Remove tag from conversation error:', error);
      throw error;
    }
  }, []);

  // 批量删除会话
  const bulkDeleteConversations = useCallback(async (conversationIds: string[]) => {
    try {
      await HistoryService.bulkDeleteConversations(conversationIds);
    } catch (error) {
      console.error('Bulk delete conversations error:', error);
      throw error;
    }
  }, []);

  // 批量归档会话
  const bulkArchiveConversations = useCallback(async (conversationIds: string[]) => {
    try {
      await HistoryService.bulkArchiveConversations(conversationIds);
    } catch (error) {
      console.error('Bulk archive conversations error:', error);
      throw error;
    }
  }, []);

  // 导出历史记录
  const exportHistory = useCallback(async (options: any) => {
    try {
      const exportUrl = await HistoryService.exportHistory(options);
      return exportUrl;
    } catch (error) {
      console.error('Export history error:', error);
      throw error;
    }
  }, []);

  // 导入历史记录
  const importHistory = useCallback(async (options: any) => {
    try {
      const summary = await HistoryService.importHistory(options);
      return summary;
    } catch (error) {
      console.error('Import history error:', error);
      throw error;
    }
  }, []);

  // 防抖搜索
  const debouncedSearch = useCallback((query: string, searchType: 'messages' | 'conversations' | 'global', filters?: SearchFilters) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      switch (searchType) {
        case 'messages':
          searchMessages(query, filters);
          break;
        case 'conversations':
          searchConversations(query, filters);
          break;
        case 'global':
          globalSearch(query, filters);
          break;
      }
    }, debounceMs);
  }, [searchMessages, searchConversations, globalSearch, debounceMs]);

  // 处理搜索查询变化
  useEffect(() => {
    if (searchQuery.length >= minQueryLength) {
      loadSearchSuggestions(searchQuery);
      debouncedSearch(searchQuery, 'global');
    } else {
      clearSearch();
    }
  }, [searchQuery, minQueryLength, loadSearchSuggestions, debouncedSearch, clearSearch]);

  // 初始化加载
  useEffect(() => {
    if (autoLoad) {
      loadBookmarks();
      loadConversationTags();
      // 加载搜索历史
      HistoryService.getSearchHistory().then(history => {
        setSearchHistory(history);
      }).catch(error => {
        console.error('Load search history error:', error);
      });
    }
  }, [autoLoad, loadBookmarks, loadConversationTags]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    // 搜索状态
    isSearching,
    searchQuery,
    searchResults,
    searchSuggestions,
    searchHistory,

    // 书签状态
    bookmarks,
    isLoadingBookmarks,

    // 标签状态
    conversationTags,
    isLoadingTags,

    // 搜索方法
    searchMessages,
    searchConversations,
    globalSearch,
    clearSearch,
    loadSearchSuggestions,

    // 书签方法
    loadBookmarks,
    addBookmark,
    updateBookmark,
    removeBookmark,
    isBookmarked,

    // 标签方法
    loadConversationTags,
    createTag,
    addTagToConversation,
    removeTagFromConversation,

    // 批量操作
    bulkDeleteConversations,
    bulkArchiveConversations,

    // 导入导出
    exportHistory,
    importHistory,
  };
};

/**
 * 搜索过滤器Hook
 */
export const useSearchFilters = () => {
  const [filters, setFilters] = useState<SearchFilters>({});

  const updateFilter = useCallback((key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const hasActiveFilters = Object.keys(filters).length > 0;

  return {
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
  };
};

/**
 * 搜索历史Hook
 */
export const useSearchHistory = () => {
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const searchHistory = await HistoryService.getSearchHistory();
      setHistory(searchHistory);
    } catch (error) {
      console.error('Load search history error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearHistory = useCallback(async () => {
    try {
      await HistoryService.clearSearchHistory();
      setHistory([]);
    } catch (error) {
      console.error('Clear search history error:', error);
      throw error;
    }
  }, []);

  const removeFromHistory = useCallback((id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    history,
    isLoading,
    loadHistory,
    clearHistory,
    removeFromHistory,
  };
};