/**
 * 聊天服务 - 处理与智普清言API的交互和RAG检索
 */

import { AuthService } from './auth';

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: Source[];
  metadata?: MessageMetadata;
  createdAt: string;
  status: MessageStatus;
  error?: string;
}

export interface Source {
  documentId: string;
  documentTitle: string;
  documentUrl?: string;
  content: string;
  similarity: number;
  chunkIndex: number;
  totalChunks: number;
  page?: number;
}

export interface MessageMetadata {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topK?: number;
  similarityThreshold?: number;
  knowledgeBase?: string;
  responseTime?: number;
  tokenCount?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface MessageStatus {
  sending: boolean;
  sent: boolean;
  failed: boolean;
  streaming: boolean;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
  knowledgeBase?: string;
  options?: ChatOptions;
  context?: ConversationContext;
}

export interface ChatOptions {
  model?: 'zhipu-chatglm-turbo' | 'zhipu-chatglm-pro' | 'zhipu-chatglm-std';
  temperature?: number;
  maxTokens?: number;
  topK?: number;
  similarityThreshold?: number;
  includeSources?: boolean;
  streamResponse?: boolean;
}

export interface ConversationContext {
  previousMessages?: Omit<ChatMessage, 'metadata' | 'status'>[];
  systemPrompt?: string;
  userPreferences?: UserPreferences;
}

export interface ChatResponse {
  id: string;
  sessionId: string;
  answer: string;
  sources: Source[];
  metadata: MessageMetadata;
  timestamp: string;
}

export interface Conversation {
  id: string;
  title: string;
  userId: string;
  knowledgeBase?: string;
  messageCount: number;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  isArchived: boolean;
  metadata?: ConversationMetadata;
}

export interface ConversationMetadata {
  tags?: string[];
  summary?: string;
  language?: string;
  totalTokens?: number;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'zh-CN' | 'en-US';
  notifications: boolean;
  autoSaveHistory: boolean;
  showTimestamps: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  documentCount: number;
  vectorCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  config: KnowledgeBaseConfig;
}

export interface KnowledgeBaseConfig {
  embeddingModel: string;
  chunkSize: number;
  chunkOverlap: number;
  similarityThreshold: number;
  topK: number;
}

export interface StreamChatResponse {
  id: string;
  sessionId: string;
  content: string;
  sources?: Source[];
  isComplete: boolean;
  metadata?: Partial<MessageMetadata>;
}

export interface ChatAnalytics {
  totalMessages: number;
  totalConversations: number;
  averageMessagesPerConversation: number;
  totalTokens: number;
  averageResponseTime: number;
  knowledgeBaseUsage: Record<string, number>;
  dailyStats: DailyStats[];
}

export interface DailyStats {
  date: string;
  messageCount: number;
  conversationCount: number;
  uniqueUsers: number;
  averageResponseTime: number;
}

export interface ChatSearchRequest {
  query: string;
  sessionId?: string;
  knowledgeBase?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  limit?: number;
  offset?: number;
}

export interface ChatSearchResponse {
  messages: ChatMessage[];
  conversations: Conversation[];
  total: number;
  hasMore: boolean;
}

class ChatError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number
  ) {
    super(message);
    this.name = 'ChatError';
  }
}

export class ChatService {
  private static readonly API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  private static readonly WEBSOCKET_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:5000';

  /**
   * 发送消息并获取回复
   */
  static async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new ChatError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: request.message,
          session_id: request.sessionId,
          knowledge_base: request.knowledgeBase,
          options: request.options,
          context: request.context,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new ChatError(
          data.message || '发送消息失败',
          data.code,
          response.status
        );
      }

      return {
        id: data.id,
        sessionId: data.session_id,
        answer: data.answer,
        sources: data.sources || [],
        metadata: data.metadata || {},
        timestamp: data.timestamp,
      };
    } catch (error) {
      if (error instanceof ChatError) {
        throw error;
      }
      throw new ChatError('网络连接失败，请检查网络设置');
    }
  }

  /**
   * 流式发送消息
   */
  static async sendMessageStream(
    request: ChatRequest,
    onChunk: (chunk: StreamChatResponse) => void
  ): Promise<void> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new ChatError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: request.message,
          session_id: request.sessionId,
          knowledge_base: request.knowledgeBase,
          options: {
            ...request.options,
            streamResponse: true,
          },
          context: request.context,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new ChatError(
          data.message || '发送消息失败',
          data.code,
          response.status
        );
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new ChatError('无法读取响应流');
      }

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                onChunk({
                  id: data.id,
                  sessionId: data.session_id,
                  content: data.content,
                  sources: data.sources,
                  isComplete: data.is_complete,
                  metadata: data.metadata,
                });
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      if (error instanceof ChatError) {
        throw error;
      }
      throw new ChatError('流式连接失败');
    }
  }

  /**
   * 建立WebSocket连接进行实时聊天
   */
  static createWebSocketConnection(sessionId: string): WebSocket {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new ChatError('用户未登录', 'NOT_AUTHENTICATED');
    }

    const wsUrl = `${this.WEBSOCKET_URL}/ws/chat/${sessionId}?token=${encodeURIComponent(token)}`;
    return new WebSocket(wsUrl);
  }

  /**
   * 获取会话历史
   */
  static async getConversationHistory(sessionId: string): Promise<ChatMessage[]> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new ChatError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/chat/sessions/${sessionId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new ChatError(
          data.message || '获取历史记录失败',
          data.code,
          response.status
        );
      }

      return data.messages.map((msg: any) => ({
        id: msg.id,
        sessionId: msg.session_id,
        role: msg.role,
        content: msg.content,
        sources: msg.sources || [],
        metadata: msg.metadata || {},
        createdAt: msg.created_at,
        status: {
          sending: false,
          sent: true,
          failed: false,
          streaming: false,
        },
      }));
    } catch (error) {
      if (error instanceof ChatError) {
        throw error;
      }
      throw new ChatError('获取历史记录失败');
    }
  }

  /**
   * 获取用户的所有会话
   */
  static async getConversations(options?: {
    limit?: number;
    offset?: number;
    archived?: boolean;
  }): Promise<{ conversations: Conversation[]; total: number }> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new ChatError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());
      if (options?.archived !== undefined) params.append('archived', options.archived.toString());

      const response = await fetch(`${this.API_BASE}/api/chat/sessions?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new ChatError(
          data.message || '获取会话列表失败',
          data.code,
          response.status
        );
      }

      return {
        conversations: data.conversations.map((conv: any) => ({
          id: conv.id,
          title: conv.title,
          userId: conv.user_id,
          knowledgeBase: conv.knowledge_base,
          messageCount: conv.message_count,
          lastMessageAt: conv.last_message_at,
          createdAt: conv.created_at,
          updatedAt: conv.updated_at,
          isArchived: conv.is_archived,
          metadata: conv.metadata || {},
        })),
        total: data.total,
      };
    } catch (error) {
      if (error instanceof ChatError) {
        throw error;
      }
      throw new ChatError('获取会话列表失败');
    }
  }

  /**
   * 创建新会话
   */
  static async createConversation(title?: string, knowledgeBase?: string): Promise<Conversation> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new ChatError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/chat/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          knowledge_base: knowledgeBase,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new ChatError(
          data.message || '创建会话失败',
          data.code,
          response.status
        );
      }

      return {
        id: data.id,
        title: data.title,
        userId: data.user_id,
        knowledgeBase: data.knowledge_base,
        messageCount: 0,
        lastMessageAt: data.created_at,
        createdAt: data.created_at,
        updatedAt: data.created_at,
        isArchived: false,
        metadata: {},
      };
    } catch (error) {
      if (error instanceof ChatError) {
        throw error;
      }
      throw new ChatError('创建会话失败');
    }
  }

  /**
   * 更新会话信息
   */
  static async updateConversation(
    sessionId: string,
    updates: Partial<Conversation>
  ): Promise<Conversation> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new ChatError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/chat/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new ChatError(
          data.message || '更新会话失败',
          data.code,
          response.status
        );
      }

      return {
        id: data.id,
        title: data.title,
        userId: data.user_id,
        knowledgeBase: data.knowledge_base,
        messageCount: data.message_count,
        lastMessageAt: data.last_message_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        isArchived: data.is_archived,
        metadata: data.metadata || {},
      };
    } catch (error) {
      if (error instanceof ChatError) {
        throw error;
      }
      throw new ChatError('更新会话失败');
    }
  }

  /**
   * 删除会话
   */
  static async deleteConversation(sessionId: string): Promise<void> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new ChatError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/chat/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new ChatError(
          data.message || '删除会话失败',
          data.code,
          response.status
        );
      }
    } catch (error) {
      if (error instanceof ChatError) {
        throw error;
      }
      throw new ChatError('删除会话失败');
    }
  }

  /**
   * 搜索聊天记录
   */
  static async searchChat(request: ChatSearchRequest): Promise<ChatSearchResponse> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new ChatError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const params = new URLSearchParams();
      params.append('query', request.query);
      if (request.sessionId) params.append('session_id', request.sessionId);
      if (request.knowledgeBase) params.append('knowledge_base', request.knowledgeBase);
      if (request.dateRange) {
        params.append('start_date', request.dateRange.start);
        params.append('end_date', request.dateRange.end);
      }
      if (request.limit) params.append('limit', request.limit.toString());
      if (request.offset) params.append('offset', request.offset.toString());

      const response = await fetch(`${this.API_BASE}/api/chat/search?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new ChatError(
          data.message || '搜索失败',
          data.code,
          response.status
        );
      }

      return {
        messages: data.messages?.map((msg: any) => ({
          id: msg.id,
          sessionId: msg.session_id,
          role: msg.role,
          content: msg.content,
          sources: msg.sources || [],
          metadata: msg.metadata || {},
          createdAt: msg.created_at,
          status: {
            sending: false,
            sent: true,
            failed: false,
            streaming: false,
          },
        })) || [],
        conversations: data.conversations?.map((conv: any) => ({
          id: conv.id,
          title: conv.title,
          userId: conv.user_id,
          knowledgeBase: conv.knowledge_base,
          messageCount: conv.message_count,
          lastMessageAt: conv.last_message_at,
          createdAt: conv.created_at,
          updatedAt: conv.updated_at,
          isArchived: conv.is_archived,
          metadata: conv.metadata || {},
        })) || [],
        total: data.total,
        hasMore: data.has_more,
      };
    } catch (error) {
      if (error instanceof ChatError) {
        throw error;
      }
      throw new ChatError('搜索失败');
    }
  }

  /**
   * 获取可用的知识库
   */
  static async getKnowledgeBases(): Promise<KnowledgeBase[]> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new ChatError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/knowledge-bases`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new ChatError(
          data.message || '获取知识库失败',
          data.code,
          response.status
        );
      }

      return data.map((kb: any) => ({
        id: kb.id,
        name: kb.name,
        description: kb.description,
        documentCount: kb.document_count,
        vectorCount: kb.vector_count,
        isActive: kb.is_active,
        createdAt: kb.created_at,
        updatedAt: kb.updated_at,
        config: kb.config || {},
      }));
    } catch (error) {
      if (error instanceof ChatError) {
        throw error;
      }
      throw new ChatError('获取知识库失败');
    }
  }

  /**
   * 获取聊天分析数据
   */
  static async getChatAnalytics(options?: {
    dateRange?: {
      start: string;
      end: string;
    };
  }): Promise<ChatAnalytics> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new ChatError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const params = new URLSearchParams();
      if (options?.dateRange) {
        params.append('start_date', options.dateRange.start);
        params.append('end_date', options.dateRange.end);
      }

      const response = await fetch(`${this.API_BASE}/api/chat/analytics?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new ChatError(
          data.message || '获取分析数据失败',
          data.code,
          response.status
        );
      }

      return {
        totalMessages: data.total_messages,
        totalConversations: data.total_conversations,
        averageMessagesPerConversation: data.average_messages_per_conversation,
        totalTokens: data.total_tokens,
        averageResponseTime: data.average_response_time,
        knowledgeBaseUsage: data.knowledge_base_usage || {},
        dailyStats: data.daily_stats || [],
      };
    } catch (error) {
      if (error instanceof ChatError) {
        throw error;
      }
      throw new ChatError('获取分析数据失败');
    }
  }

  /**
   * 重新生成回复
   */
  static async regenerateResponse(
    sessionId: string,
    messageId: string,
    options?: ChatOptions
  ): Promise<ChatResponse> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new ChatError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/chat/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          message_id: messageId,
          options,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new ChatError(
          data.message || '重新生成失败',
          data.code,
          response.status
        );
      }

      return {
        id: data.id,
        sessionId: data.session_id,
        answer: data.answer,
        sources: data.sources || [],
        metadata: data.metadata || {},
        timestamp: data.timestamp,
      };
    } catch (error) {
      if (error instanceof ChatError) {
        throw error;
      }
      throw new ChatError('重新生成失败');
    }
  }
}