/**
 * 聊天相关的TypeScript类型定义
 */

import { ChatMessage, ChatOptions, Conversation, KnowledgeBase } from '../services/chat';

export interface ChatState {
  currentSessionId: string | null;
  messages: ChatMessage[];
  conversations: Conversation[];
  knowledgeBases: KnowledgeBase[];
  isLoading: boolean;
  isSending: boolean;
  isStreaming: boolean;
  error: string | null;
  hasMoreMessages: boolean;
  hasMoreConversations: boolean;
  unreadCount: number;
  typingIndicator: TypingIndicator;
  searchState: SearchState;
  metadata: ChatMetadata;
}

export interface ChatActions {
  // 消息操作
  sendMessage: (message: string, options?: ChatOptions) => Promise<void>;
  sendMessageStream: (message: string, options?: ChatOptions) => Promise<void>;
  regenerateResponse: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  copyMessage: (messageId: string) => void;
  shareMessage: (messageId: string) => Promise<void>;

  // 会话操作
  createNewConversation: (title?: string, knowledgeBaseId?: string) => Promise<void>;
  switchConversation: (sessionId: string) => Promise<void>;
  updateConversation: (sessionId: string, updates: Partial<Conversation>) => Promise<void>;
  deleteConversation: (sessionId: string) => Promise<void>;
  archiveConversation: (sessionId: string) => Promise<void>;
  unarchiveConversation: (sessionId: string) => Promise<void>;

  // 数据加载
  loadConversations: (options?: LoadOptions) => Promise<void>;
  loadMoreConversations: () => Promise<void>;
  loadConversationHistory: (sessionId: string, options?: LoadOptions) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  loadKnowledgeBases: () => Promise<void>;

  // 搜索操作
  searchMessages: (query: string, options?: SearchOptions) => Promise<void>;
  searchConversations: (query: string, options?: SearchOptions) => Promise<void>;
  clearSearch: () => void;

  // 状态管理
  setCurrentSession: (sessionId: string | null) => void;
  clearMessages: () => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setTypingIndicator: (indicator: Partial<TypingIndicator>) => void;

  // 实时更新
  connectWebSocket: (sessionId: string) => void;
  disconnectWebSocket: () => void;
}

export interface TypingIndicator {
  isTyping: boolean;
  userId: string | null;
  userName: string | null;
  lastActivity: number;
}

export interface SearchState {
  isSearching: boolean;
  query: string;
  results: SearchResult[];
  hasMore: boolean;
  filters: SearchFilters;
}

export interface SearchResult {
  type: 'message' | 'conversation';
  id: string;
  title?: string;
  content: string;
  sessionId: string;
  createdAt: string;
  score: number;
  highlights: string[];
}

export interface SearchFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  knowledgeBase?: string;
  messageType?: 'user' | 'assistant' | 'all';
  hasAttachments?: boolean;
}

export interface LoadOptions {
  limit?: number;
  offset?: number;
  orderBy?: 'created_at' | 'updated_at' | 'message_count';
  orderDirection?: 'asc' | 'desc';
}

export interface ChatMetadata {
  totalMessages: number;
  totalTokens: number;
  averageResponseTime: number;
  lastActivity: number;
  settings: ChatSettings;
}

export interface ChatSettings {
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  showTimestamps: boolean;
  showSources: boolean;
  autoSaveHistory: boolean;
  enableNotifications: boolean;
  streamResponses: boolean;
  defaultKnowledgeBase: string | null;
  defaultModel: string;
  temperature: number;
  maxTokens: number;
}

// 聊天界面状态
export interface ChatUIState {
  sidebarCollapsed: boolean;
  showSourcePanel: boolean;
  showSearchPanel: boolean;
  showSettingsPanel: boolean;
  selectedMessageId: string | null;
  contextMenu: ContextMenuState | null;
  dragState: DragState;
}

export interface ContextMenuState {
  x: number;
  y: number;
  messageId: string;
  visible: boolean;
}

export interface DragState {
  isDragging: boolean;
  draggedMessageId: string | null;
  dropTargetId: string | null;
}

// 消息编辑状态
export interface MessageEditState {
  messageId: string | null;
  originalContent: string;
  editedContent: string;
  isEditing: boolean;
}

// WebSocket消息类型
export enum WebSocketMessageType {
  MESSAGE = 'message',
  TYPING = 'typing',
  STOP_TYPING = 'stop_typing',
  ERROR = 'error',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
}

export interface WebSocketMessage {
  type: WebSocketMessageType;
  data: any;
  timestamp: string;
}

// 快捷操作类型
export enum QuickActionType {
  COPY = 'copy',
  SHARE = 'share',
  EDIT = 'edit',
  DELETE = 'delete',
  REGENERATE = 'regenerate',
  FLAG = 'flag',
  SAVE = 'save',
  EXPORT = 'export',
}

export interface QuickAction {
  type: QuickActionType;
  label: string;
  icon: string;
  shortcut?: string;
  handler: () => void;
}

// 键盘快捷键
export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
}

// 消息渲染选项
export interface MessageRenderOptions {
  showAvatar: boolean;
  showTimestamp: boolean;
  showSources: boolean;
  enableMarkdown: boolean;
  enableCodeHighlight: boolean;
  enableMathJax: boolean;
  maxContentLength?: number;
  collapseLongContent: boolean;
}

// 聊天导出选项
export interface ChatExportOptions {
  format: 'json' | 'markdown' | 'pdf' | 'txt';
  includeMetadata: boolean;
  includeSources: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  conversationIds?: string[];
  filter?: (message: ChatMessage) => boolean;
}

// 聊天统计
export interface ChatStatistics {
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  totalCharacters: number;
  totalTokens: number;
  averageMessageLength: number;
  averageResponseTime: number;
  mostUsedWords: WordFrequency[];
  emotionAnalysis?: EmotionAnalysis;
  topicAnalysis?: TopicAnalysis;
}

export interface WordFrequency {
  word: string;
  count: number;
  percentage: number;
}

export interface EmotionAnalysis {
  positive: number;
  negative: number;
  neutral: number;
  dominant: 'positive' | 'negative' | 'neutral';
}

export interface TopicAnalysis {
  topics: Topic[];
  primaryTopic: Topic;
}

export interface Topic {
  id: string;
  name: string;
  confidence: number;
  keywords: string[];
}

// 消息状态枚举
export enum MessageStatus {
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  EDITED = 'edited',
  DELETED = 'deleted',
}

// 会话状态枚举
export enum ConversationStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
}

// 搜索排序选项
export enum SearchSortOrder {
  RELEVANCE = 'relevance',
  DATE_DESC = 'date_desc',
  DATE_ASC = 'date_asc',
  ALPHABETICAL = 'alphabetical',
}

// 通知类型
export enum ChatNotificationType {
  NEW_MESSAGE = 'new_message',
  MENTION = 'mention',
  REPLY = 'reply',
  ERROR = 'error',
  CONNECTION_STATUS = 'connection_status',
}

export interface ChatNotification {
  id: string;
  type: ChatNotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
}