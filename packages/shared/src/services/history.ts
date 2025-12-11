/**
 * 历史记录和搜索服务
 */

import { AuthService } from './auth';
import { ChatMessage, Conversation } from './chat';

export interface SearchQuery {
  query: string;
  filters?: SearchFilters;
  sort?: SortOption;
  pagination?: PaginationOptions;
}

export interface SearchFilters {
  dateRange?: DateRange;
  knowledgeBase?: string;
  messageTypes?: MessageType[];
  hasAttachments?: boolean;
  isBookmarked?: boolean;
  conversationStatus?: ConversationStatus[];
  tags?: string[];
}

export interface DateRange {
  start: string;
  end: string;
}

export interface SortOption {
  field: SortField;
  direction: 'asc' | 'desc';
}

export enum SortField {
  RELEVANCE = 'relevance',
  DATE = 'date',
  MESSAGE_COUNT = 'message_count',
  TITLE = 'title',
  LAST_ACTIVITY = 'last_activity',
}

export enum MessageType {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

export enum ConversationStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
}

export interface PaginationOptions {
  limit: number;
  offset: number;
}

export interface SearchResult<T = any> {
  items: T[];
  total: number;
  hasMore: boolean;
  facets?: SearchFacets;
  suggestions?: string[];
  searchTime: number;
}

export interface SearchFacets {
  knowledgeBases: KnowledgeBaseFacet[];
  dates: DateFacet[];
  tags: TagFacet[];
  messageTypes: MessageTypeFacet[];
}

export interface KnowledgeBaseFacet {
  id: string;
  name: string;
  count: number;
}

export interface DateFacet {
  period: string;
  count: number;
}

export interface TagFacet {
  tag: string;
  count: number;
}

export interface MessageTypeFacet {
  type: MessageType;
  count: number;
}

export interface HistoryStats {
  totalConversations: number;
  totalMessages: number;
  averageMessagesPerConversation: number;
  mostActiveDay: string;
  mostUsedKnowledgeBase: string;
  topicDistribution: TopicDistribution[];
  monthlyActivity: MonthlyActivity[];
}

export interface TopicDistribution {
  topic: string;
  count: number;
  percentage: number;
}

export interface MonthlyActivity {
  month: string;
  conversations: number;
  messages: number;
}

export interface BookmarkRequest {
  messageId: string;
  conversationId: string;
  note?: string;
  tags?: string[];
}

export interface Bookmark {
  id: string;
  messageId: string;
  conversationId: string;
  userId: string;
  note?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  message: {
    content: string;
    role: string;
    createdAt: string;
  };
  conversation: {
    title: string;
    knowledgeBase?: string;
  };
}

export interface HistoryExportOptions {
  format: 'json' | 'csv' | 'markdown' | 'pdf';
  includeBookmarks?: boolean;
  includeMetadata?: boolean;
  dateRange?: DateRange;
  conversationIds?: string[];
  filters?: SearchFilters;
}

export interface HistoryImportOptions {
  format: 'json' | 'csv';
  source: 'file' | 'url';
  data?: string | File;
  url?: string;
  mergeStrategy?: 'replace' | 'merge' | 'skip_duplicates';
}

export interface ConversationTag {
  id: string;
  name: string;
  color: string;
  description?: string;
  conversationCount: number;
  createdAt: string;
}

export interface ConversationTagAssignment {
  conversationId: string;
  tagId: string;
  createdAt: string;
}

export interface ConversationGroup {
  id: string;
  name: string;
  description?: string;
  conversationIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SearchHistory {
  id: string;
  query: string;
  filters?: SearchFilters;
  resultCount: number;
  searchedAt: string;
}

class HistoryError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number
  ) {
    super(message);
    this.name = 'HistoryError';
  }
}

export class HistoryService {
  private static readonly API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  /**
   * 搜索消息
   */
  static async searchMessages(searchQuery: SearchQuery): Promise<SearchResult<ChatMessage>> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new HistoryError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/history/messages/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(searchQuery),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new HistoryError(
          data.message || '搜索消息失败',
          data.code,
          response.status
        );
      }

      return {
        items: data.messages,
        total: data.total,
        hasMore: data.has_more,
        facets: data.facets,
        suggestions: data.suggestions,
        searchTime: data.search_time,
      };
    } catch (error) {
      if (error instanceof HistoryError) {
        throw error;
      }
      throw new HistoryError('搜索消息失败');
    }
  }

  /**
   * 搜索会话
   */
  static async searchConversations(searchQuery: SearchQuery): Promise<SearchResult<Conversation>> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new HistoryError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/history/conversations/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(searchQuery),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new HistoryError(
          data.message || '搜索会话失败',
          data.code,
          response.status
        );
      }

      return {
        items: data.conversations,
        total: data.total,
        hasMore: data.has_more,
        facets: data.facets,
        suggestions: data.suggestions,
        searchTime: data.search_time,
      };
    } catch (error) {
      if (error instanceof HistoryError) {
        throw error;
      }
      throw new HistoryError('搜索会话失败');
    }
  }

  /**
   * 全局搜索
   */
  static async globalSearch(searchQuery: SearchQuery): Promise<{
    messages: SearchResult<ChatMessage>;
    conversations: SearchResult<Conversation>;
  }> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new HistoryError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/history/global-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(searchQuery),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new HistoryError(
          data.message || '全局搜索失败',
          data.code,
          response.status
        );
      }

      return {
        messages: {
          items: data.messages,
          total: data.messages_total,
          hasMore: data.messages_has_more,
          searchTime: data.search_time,
        },
        conversations: {
          items: data.conversations,
          total: data.conversations_total,
          hasMore: data.conversations_has_more,
          searchTime: data.search_time,
        },
      };
    } catch (error) {
      if (error instanceof HistoryError) {
        throw error;
      }
      throw new HistoryError('全局搜索失败');
    }
  }

  /**
   * 获取搜索建议
   */
  static async getSearchSuggestions(query: string, limit = 10): Promise<string[]> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new HistoryError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(
        `${this.API_BASE}/api/history/suggestions?q=${encodeURIComponent(query)}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new HistoryError(
          data.message || '获取搜索建议失败',
          data.code,
          response.status
        );
      }

      return data.suggestions;
    } catch (error) {
      if (error instanceof HistoryError) {
        throw error;
      }
      throw new HistoryError('获取搜索建议失败');
    }
  }

  /**
   * 获取历史统计
   */
  static async getHistoryStats(options?: {
    dateRange?: DateRange;
    knowledgeBase?: string;
  }): Promise<HistoryStats> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new HistoryError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const params = new URLSearchParams();
      if (options?.dateRange) {
        params.append('start_date', options.dateRange.start);
        params.append('end_date', options.dateRange.end);
      }
      if (options?.knowledgeBase) {
        params.append('knowledge_base', options.knowledgeBase);
      }

      const response = await fetch(`${this.API_BASE}/api/history/stats?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new HistoryError(
          data.message || '获取历史统计失败',
          data.code,
          response.status
        );
      }

      return data.stats;
    } catch (error) {
      if (error instanceof HistoryError) {
        throw error;
      }
      throw new HistoryError('获取历史统计失败');
    }
  }

  /**
   * 添加书签
   */
  static async addBookmark(bookmarkRequest: BookmarkRequest): Promise<Bookmark> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new HistoryError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/history/bookmarks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bookmarkRequest),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new HistoryError(
          data.message || '添加书签失败',
          data.code,
          response.status
        );
      }

      return data.bookmark;
    } catch (error) {
      if (error instanceof HistoryError) {
        throw error;
      }
      throw new HistoryError('添加书签失败');
    }
  }

  /**
   * 获取书签列表
   */
  static async getBookmarks(options?: {
    limit?: number;
    offset?: number;
    tags?: string[];
    dateRange?: DateRange;
  }): Promise<{ bookmarks: Bookmark[]; total: number }> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new HistoryError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());
      if (options?.tags) params.append('tags', options.tags.join(','));
      if (options?.dateRange) {
        params.append('start_date', options.dateRange.start);
        params.append('end_date', options.dateRange.end);
      }

      const response = await fetch(`${this.API_BASE}/api/history/bookmarks?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new HistoryError(
          data.message || '获取书签列表失败',
          data.code,
          response.status
        );
      }

      return {
        bookmarks: data.bookmarks,
        total: data.total,
      };
    } catch (error) {
      if (error instanceof HistoryError) {
        throw error;
      }
      throw new HistoryError('获取书签列表失败');
    }
  }

  /**
   * 更新书签
   */
  static async updateBookmark(
    bookmarkId: string,
    updates: Partial<BookmarkRequest>
  ): Promise<Bookmark> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new HistoryError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/history/bookmarks/${bookmarkId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new HistoryError(
          data.message || '更新书签失败',
          data.code,
          response.status
        );
      }

      return data.bookmark;
    } catch (error) {
      if (error instanceof HistoryError) {
        throw error;
      }
      throw new HistoryError('更新书签失败');
    }
  }

  /**
   * 删除书签
   */
  static async removeBookmark(bookmarkId: string): Promise<void> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new HistoryError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/history/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new HistoryError(
          data.message || '删除书签失败',
          data.code,
          response.status
        );
      }
    } catch (error) {
      if (error instanceof HistoryError) {
        throw error;
      }
      throw new HistoryError('删除书签失败');
    }
  }

  /**
   * 获取会话标签
   */
  static async getConversationTags(): Promise<ConversationTag[]> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new HistoryError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/history/conversations/tags`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new HistoryError(
          data.message || '获取会话标签失败',
          data.code,
          response.status
        );
      }

      return data.tags;
    } catch (error) {
      if (error instanceof HistoryError) {
        throw error;
      }
      throw new HistoryError('获取会话标签失败');
    }
  }

  /**
   * 创建会话标签
   */
  static async createConversationTag(tag: {
    name: string;
    color: string;
    description?: string;
  }): Promise<ConversationTag> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new HistoryError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/history/conversations/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(tag),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new HistoryError(
          data.message || '创建会话标签失败',
          data.code,
          response.status
        );
      }

      return data.tag;
    } catch (error) {
      if (error instanceof HistoryError) {
        throw error;
      }
      throw new HistoryError('创建会话标签失败');
    }
  }

  /**
   * 为会话添加标签
   */
  static async addTagToConversation(
    conversationId: string,
    tagId: string
  ): Promise<void> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new HistoryError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/history/conversations/${conversationId}/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ tagId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new HistoryError(
          data.message || '添加标签失败',
          data.code,
          response.status
        );
      }
    } catch (error) {
      if (error instanceof HistoryError) {
        throw error;
      }
      throw new HistoryError('添加标签失败');
    }
  }

  /**
   * 从会话移除标签
   */
  static async removeTagFromConversation(
    conversationId: string,
    tagId: string
  ): Promise<void> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new HistoryError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(
        `${this.API_BASE}/api/history/conversations/${conversationId}/tags/${tagId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new HistoryError(
          data.message || '移除标签失败',
          data.code,
          response.status
        );
      }
    } catch (error) {
      if (error instanceof HistoryError) {
        throw error;
      }
      throw new HistoryError('移除标签失败');
    }
  }

  /**
   * 获取搜索历史
   */
  static async getSearchHistory(limit = 20): Promise<SearchHistory[]> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new HistoryError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/history/search-history?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new HistoryError(
          data.message || '获取搜索历史失败',
          data.code,
          response.status
        );
      }

      return data.searchHistory;
    } catch (error) {
      if (error instanceof HistoryError) {
        throw error;
      }
      throw new HistoryError('获取搜索历史失败');
    }
  }

  /**
   * 清除搜索历史
   */
  static async clearSearchHistory(): Promise<void> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new HistoryError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/history/search-history`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new HistoryError(
          data.message || '清除搜索历史失败',
          data.code,
          response.status
        );
      }
    } catch (error) {
      if (error instanceof HistoryError) {
        throw error;
      }
      throw new HistoryError('清除搜索历史失败');
    }
  }

  /**
   * 导出历史记录
   */
  static async exportHistory(options: HistoryExportOptions): Promise<string> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new HistoryError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/history/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(options),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new HistoryError(
          data.message || '导出历史记录失败',
          data.code,
          response.status
        );
      }

      return data.exportUrl;
    } catch (error) {
      if (error instanceof HistoryError) {
        throw error;
      }
      throw new HistoryError('导出历史记录失败');
    }
  }

  /**
   * 导入历史记录
   */
  static async importHistory(options: HistoryImportOptions): Promise<{
    totalRecords: number;
    importedRecords: number;
    skippedRecords: number;
    errorRecords: number;
  }> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new HistoryError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const formData = new FormData();
      formData.append('format', options.format);
      formData.append('source', options.source);
      formData.append('mergeStrategy', options.mergeStrategy || 'merge');

      if (options.source === 'file' && options.data instanceof File) {
        formData.append('file', options.data);
      } else if (options.source === 'url' && options.url) {
        formData.append('url', options.url);
      } else if (options.source === 'file' && typeof options.data === 'string') {
        formData.append('data', options.data);
      }

      const response = await fetch(`${this.API_BASE}/api/history/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new HistoryError(
          data.message || '导入历史记录失败',
          data.code,
          response.status
        );
      }

      return data.summary;
    } catch (error) {
      if (error instanceof HistoryError) {
        throw error;
      }
      throw new HistoryError('导入历史记录失败');
    }
  }

  /**
   * 批量删除会话
   */
  static async bulkDeleteConversations(conversationIds: string[]): Promise<void> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new HistoryError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/history/conversations/bulk-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ conversationIds }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new HistoryError(
          data.message || '批量删除会话失败',
          data.code,
          response.status
        );
      }
    } catch (error) {
      if (error instanceof HistoryError) {
        throw error;
      }
      throw new HistoryError('批量删除会话失败');
    }
  }

  /**
   * 批量归档会话
   */
  static async bulkArchiveConversations(conversationIds: string[]): Promise<void> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new HistoryError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/history/conversations/bulk-archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ conversationIds }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new HistoryError(
          data.message || '批量归档会话失败',
          data.code,
          response.status
        );
      }
    } catch (error) {
      if (error instanceof HistoryError) {
        throw error;
      }
      throw new HistoryError('批量归档会话失败');
    }
  }
}