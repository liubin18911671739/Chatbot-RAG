/**
 * 聊天相关的自定义Hook
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChatService, ChatMessage, ChatOptions, Conversation, KnowledgeBase } from '../services/chat';
import { ChatState, ChatActions, WebSocketMessageType, TypingIndicator, SearchState } from '../types/chat';

interface UseChatOptions {
  autoLoadHistory?: boolean;
  enableWebSocket?: boolean;
  maxMessages?: number;
  storageKey?: string;
  onNewMessage?: (message: ChatMessage) => void;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: Error) => void;
}

interface UseChatReturn extends ChatState, ChatActions {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  quickActions: QuickAction[];
  keyboardShortcuts: KeyboardShortcut[];
  exportConversation: (options: ChatExportOptions) => Promise<void>;
  clearChatHistory: () => Promise<void>;
}

/**
 * 聊天Hook - 提供完整的聊天功能
 */
export const useChat = (options: UseChatOptions = {}): UseChatReturn => {
  const {
    autoLoadHistory = true,
    enableWebSocket = true,
    maxMessages = 1000,
    storageKey = 'rag_chat_state',
    onNewMessage,
    onConnectionChange,
    onError,
  } = options;

  // 状态管理
  const [state, setState] = useState<ChatState>({
    currentSessionId: null,
    messages: [],
    conversations: [],
    knowledgeBases: [],
    isLoading: false,
    isSending: false,
    isStreaming: false,
    error: null,
    hasMoreMessages: false,
    hasMoreConversations: false,
    unreadCount: 0,
    typingIndicator: {
      isTyping: false,
      userId: null,
      userName: null,
      lastActivity: 0,
    },
    searchState: {
      isSearching: false,
      query: '',
      results: [],
      hasMore: false,
      filters: {},
    },
    metadata: {
      totalMessages: 0,
      totalTokens: 0,
      averageResponseTime: 0,
      lastActivity: Date.now(),
      settings: {
        theme: 'auto',
        fontSize: 'medium',
        showTimestamps: true,
        showSources: true,
        autoSaveHistory: true,
        enableNotifications: true,
        streamResponses: true,
        defaultKnowledgeBase: null,
        defaultModel: 'zhipu-chatglm-turbo',
        temperature: 0.7,
        maxTokens: 2000,
      },
    },
  });

  // WebSocket连接
  const wsRef = useRef<WebSocket | null>(null);
  const connectionStatusRef = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [connectionStatus, setConnectionStatus] = connectionStatusRef;

  // 消息编辑状态
  const editingMessageRef = useRef<string | null>(null);

  // 更新状态的辅助函数
  const updateState = useCallback((updater: Partial<ChatState>) => {
    setState(prev => ({ ...prev, ...updater }));
  }, []);

  // 保存状态到本地存储
  const saveState = useCallback(() => {
    try {
      const stateToSave = {
        currentSessionId: state.currentSessionId,
        metadata: state.metadata,
      };
      localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Failed to save chat state:', error);
    }
  }, [state, storageKey]);

  // 从本地存储加载状态
  const loadState = useCallback(() => {
    try {
      const savedState = localStorage.getItem(storageKey);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        updateState({
          currentSessionId: parsedState.currentSessionId,
          metadata: parsedState.metadata,
        });
      }
    } catch (error) {
      console.error('Failed to load chat state:', error);
    }
  }, [storageKey, updateState]);

  // 创建WebSocket连接
  const connectWebSocket = useCallback((sessionId: string) => {
    if (!enableWebSocket || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      setConnectionStatus('connecting');
      const ws = ChatService.createWebSocketConnection(sessionId);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('connected');
        onConnectionChange?.(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        setConnectionStatus('disconnected');
        wsRef.current = null;
        onConnectionChange?.(false);
      };

      ws.onerror = () => {
        setConnectionStatus('error');
        onConnectionChange?.(false);
      };
    } catch (error) {
      setConnectionStatus('error');
      onError?.(error as Error);
    }
  }, [enableWebSocket, onConnectionChange, onError]);

  // 处理WebSocket消息
  const handleWebSocketMessage = useCallback((data: any) => {
    switch (data.type) {
      case WebSocketMessageType.MESSAGE:
        if (onNewMessage) {
          onNewMessage(data.data);
        }
        break;
      case WebSocketMessageType.TYPING:
        updateState({
          typingIndicator: {
            isTyping: true,
            userId: data.data.userId,
            userName: data.data.userName,
            lastActivity: Date.now(),
          },
        });
        break;
      case WebSocketMessageType.STOP_TYPING:
        updateState({
          typingIndicator: {
            isTyping: false,
            userId: null,
            userName: null,
            lastActivity: 0,
          },
        });
        break;
      case WebSocketMessageType.ERROR:
        updateState({ error: data.data.message });
        onError?.(new Error(data.data.message));
        break;
    }
  }, [onNewMessage, onError, updateState]);

  // 断开WebSocket连接
  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnectionStatus('disconnected');
  }, []);

  // 发送消息
  const sendMessage = useCallback(async (message: string, options?: ChatOptions) => {
    if (!message.trim()) {
      return;
    }

    updateState({ isSending: true, error: null });

    // 创建临时用户消息
    const tempUserMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      sessionId: state.currentSessionId || 'new',
      role: 'user',
      content: message,
      createdAt: new Date().toISOString(),
      status: {
        sending: true,
        sent: false,
        failed: false,
        streaming: false,
      },
    };

    // 添加到消息列表
    updateState({
      messages: [...state.messages, tempUserMessage],
    });

    try {
      // 如果没有会话ID，创建新会话
      let sessionId = state.currentSessionId;
      if (!sessionId) {
        const conversation = await ChatService.createConversation();
        sessionId = conversation.id;
        updateState({ currentSessionId: sessionId });
      }

      // 发送消息到服务器
      const response = await ChatService.sendMessage({
        message,
        sessionId,
        options: {
          ...state.metadata.settings,
          ...options,
        },
      });

      // 创建助手消息
      const assistantMessage: ChatMessage = {
        id: response.id,
        sessionId: response.sessionId,
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        metadata: response.metadata,
        createdAt: response.timestamp,
        status: {
          sending: false,
          sent: true,
          failed: false,
          streaming: false,
        },
      };

      // 更新消息列表
      updateState({
        messages: [
          ...state.messages.filter(msg => msg.id !== tempUserMessage.id),
          {
            ...tempUserMessage,
            id: `user-${Date.now()}`,
            status: {
              sending: false,
              sent: true,
              failed: false,
              streaming: false,
            },
          },
          assistantMessage,
        ],
        isSending: false,
        metadata: {
          ...state.metadata,
          lastActivity: Date.now(),
          totalMessages: state.metadata.totalMessages + 2,
          totalTokens: state.metadata.totalTokens + (response.metadata.tokenCount?.total || 0),
        },
      });

      // 重新连接WebSocket
      if (enableWebSocket) {
        connectWebSocket(sessionId);
      }

      saveState();
    } catch (error) {
      // 更新失败状态
      updateState({
        messages: state.messages.map(msg =>
          msg.id === tempUserMessage.id
            ? {
                ...msg,
                status: {
                  sending: false,
                  sent: false,
                  failed: true,
                  streaming: false,
                },
                error: error instanceof Error ? error.message : '发送失败',
              }
            : msg
        ),
        isSending: false,
        error: error instanceof Error ? error.message : '发送失败',
      });

      onError?.(error as Error);
      throw error;
    }
  }, [state, updateState, enableWebSocket, connectWebSocket, onNewMessage, onError, saveState]);

  // 流式发送消息
  const sendMessageStream = useCallback(async (message: string, options?: ChatOptions) => {
    if (!message.trim()) {
      return;
    }

    updateState({ isSending: true, isStreaming: true, error: null });

    // 创建临时用户消息
    const tempUserMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      sessionId: state.currentSessionId || 'new',
      role: 'user',
      content: message,
      createdAt: new Date().toISOString(),
      status: {
        sending: true,
        sent: false,
        failed: false,
        streaming: false,
      },
    };

    // 创建临时助手消息
    const tempAssistantMessage: ChatMessage = {
      id: `temp-assistant-${Date.now()}`,
      sessionId: state.currentSessionId || 'new',
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      status: {
        sending: false,
        sent: false,
        failed: false,
        streaming: true,
      },
    };

    // 添加到消息列表
    updateState({
      messages: [...state.messages, tempUserMessage, tempAssistantMessage],
    });

    try {
      // 如果没有会话ID，创建新会话
      let sessionId = state.currentSessionId;
      if (!sessionId) {
        const conversation = await ChatService.createConversation();
        sessionId = conversation.id;
        updateState({ currentSessionId: sessionId });
      }

      // 开始流式发送
      await ChatService.sendMessageStream(
        {
          message,
          sessionId,
          options: {
            ...state.metadata.settings,
            ...options,
            streamResponse: true,
          },
        },
        (chunk) => {
          // 更新流式消息内容
          updateState({
            messages: state.messages.map(msg =>
              msg.id === tempAssistantMessage.id
                ? {
                    ...msg,
                    content: msg.content + chunk.content,
                    sources: chunk.sources || msg.sources,
                    metadata: chunk.metadata ? { ...msg.metadata, ...chunk.metadata } : msg.metadata,
                  }
                : msg
            ),
          });

          if (chunk.isComplete) {
            updateState({
              isSending: false,
              isStreaming: false,
              messages: state.messages.map(msg => {
                if (msg.id === tempUserMessage.id) {
                  return {
                    ...msg,
                    id: `user-${Date.now()}`,
                    status: {
                      sending: false,
                      sent: true,
                      failed: false,
                      streaming: false,
                    },
                  };
                }
                if (msg.id === tempAssistantMessage.id) {
                  return {
                    ...msg,
                    id: chunk.id,
                    status: {
                      sending: false,
                      sent: true,
                      failed: false,
                      streaming: false,
                    },
                  };
                }
                return msg;
              }),
            });

            saveState();
          }
        }
      );
    } catch (error) {
      updateState({
        isSending: false,
        isStreaming: false,
        error: error instanceof Error ? error.message : '发送失败',
      });

      onError?.(error as Error);
      throw error;
    }
  }, [state, updateState, onNewMessage, onError, saveState]);

  // 创建新会话
  const createNewConversation = useCallback(async (title?: string, knowledgeBaseId?: string) => {
    try {
      const conversation = await ChatService.createConversation(title, knowledgeBaseId);
      updateState({
        currentSessionId: conversation.id,
        messages: [],
        conversations: [conversation, ...state.conversations],
      });
      saveState();
    } catch (error) {
      updateState({ error: error instanceof Error ? error.message : '创建会话失败' });
      onError?.(error as Error);
      throw error;
    }
  }, [state.conversations, updateState, onError, saveState]);

  // 加载会话历史
  const loadConversationHistory = useCallback(async (sessionId: string, options?: any) => {
    try {
      updateState({ isLoading: true });
      const history = await ChatService.getConversationHistory(sessionId);
      updateState({
        currentSessionId: sessionId,
        messages: history.slice(-maxMessages),
        isLoading: false,
      });
    } catch (error) {
      updateState({
        isLoading: false,
        error: error instanceof Error ? error.message : '加载历史记录失败',
      });
      onError?.(error as Error);
    }
  }, [maxMessages, updateState, onError]);

  // 切换会话
  const switchConversation = useCallback(async (sessionId: string) => {
    updateState({ currentSessionId: sessionId });
    if (autoLoadHistory) {
      await loadConversationHistory(sessionId);
    }
    if (enableWebSocket) {
      connectWebSocket(sessionId);
    }
  }, [autoLoadHistory, enableWebSocket, connectWebSocket, loadConversationHistory, updateState]);

  // 加载会话列表
  const loadConversations = useCallback(async (options?: any) => {
    try {
      updateState({ isLoading: true });
      const { conversations } = await ChatService.getConversations(options);
      updateState({
        conversations,
        isLoading: false,
      });
    } catch (error) {
      updateState({
        isLoading: false,
        error: error instanceof Error ? error.message : '加载会话列表失败',
      });
      onError?.(error as Error);
    }
  }, [updateState, onError]);

  // 删除会话
  const deleteConversation = useCallback(async (sessionId: string) => {
    try {
      await ChatService.deleteConversation(sessionId);
      updateState({
        conversations: state.conversations.filter(conv => conv.id !== sessionId),
        currentSessionId: state.currentSessionId === sessionId ? null : state.currentSessionId,
        messages: state.currentSessionId === sessionId ? [] : state.messages,
      });
      saveState();
    } catch (error) {
      updateState({ error: error instanceof Error ? error.message : '删除会话失败' });
      onError?.(error as Error);
      throw error;
    }
  }, [state, updateState, onError, saveState]);

  // 清除错误
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  // 设置当前会话
  const setCurrentSession = useCallback((sessionId: string | null) => {
    updateState({ currentSessionId: sessionId });
  }, [updateState]);

  // 清除消息
  const clearMessages = useCallback(() => {
    updateState({ messages: [] });
  }, [updateState]);

  // 设置错误
  const setError = useCallback((error: string | null) => {
    updateState({ error });
  }, [updateState]);

  // 搜索消息
  const searchMessages = useCallback(async (query: string, options?: any) => {
    try {
      updateState({
        searchState: {
          ...state.searchState,
          isSearching: true,
          query,
        },
      });

      const searchResponse = await ChatService.searchChat({
        query,
        ...options,
      });

      updateState({
        searchState: {
          isSearching: false,
          query,
          results: searchResponse.messages.map(msg => ({
            type: 'message' as const,
            id: msg.id,
            content: msg.content,
            sessionId: msg.sessionId,
            createdAt: msg.createdAt,
            score: 1, // 默认分数
            highlights: [],
          })),
          hasMore: searchResponse.hasMore,
          filters: options?.filters || {},
        },
      });
    } catch (error) {
      updateState({
        searchState: {
          ...state.searchState,
          isSearching: false,
          error: error instanceof Error ? error.message : '搜索失败',
        },
      });
      onError?.(error as Error);
    }
  }, [state.searchState, updateState, onError]);

  // 其他方法的实现...
  const regenerateResponse = useCallback(async (messageId: string) => {
    // 实现重新生成逻辑
  }, []);

  const editMessage = useCallback(async (messageId: string, content: string) => {
    // 实现编辑消息逻辑
  }, []);

  const deleteMessage = useCallback(async (messageId: string) => {
    // 实现删除消息逻辑
  }, []);

  const copyMessage = useCallback((messageId: string) => {
    const message = state.messages.find(msg => msg.id === messageId);
    if (message) {
      navigator.clipboard.writeText(message.content);
    }
  }, [state.messages]);

  const shareMessage = useCallback(async (messageId: string) => {
    // 实现分享消息逻辑
  }, []);

  const updateConversation = useCallback(async (sessionId: string, updates: any) => {
    try {
      const updated = await ChatService.updateConversation(sessionId, updates);
      updateState({
        conversations: state.conversations.map(conv =>
          conv.id === sessionId ? updated : conv
        ),
      });
    } catch (error) {
      updateState({ error: error instanceof Error ? error.message : '更新会话失败' });
      onError?.(error as Error);
    }
  }, [state.conversations, updateState, onError]);

  const archiveConversation = useCallback(async (sessionId: string) => {
    await updateConversation(sessionId, { isArchived: true });
  }, [updateConversation]);

  const unarchiveConversation = useCallback(async (sessionId: string) => {
    await updateConversation(sessionId, { isArchived: false });
  }, [updateConversation]);

  const loadMoreConversations = useCallback(async () => {
    // 实现加载更多会话逻辑
  }, []);

  const loadMoreMessages = useCallback(async () => {
    // 实现加载更多消息逻辑
  }, []);

  const loadKnowledgeBases = useCallback(async () => {
    try {
      const knowledgeBases = await ChatService.getKnowledgeBases();
      updateState({ knowledgeBases });
    } catch (error) {
      updateState({ error: error instanceof Error ? error.message : '加载知识库失败' });
      onError?.(error as Error);
    }
  }, [updateState, onError]);

  const searchConversations = useCallback(async (query: string, options?: any) => {
    // 实现搜索会话逻辑
  }, []);

  const clearSearch = useCallback(() => {
    updateState({
      searchState: {
        isSearching: false,
        query: '',
        results: [],
        hasMore: false,
        filters: {},
      },
    });
  }, [updateState]);

  const setTypingIndicator = useCallback((indicator: Partial<TypingIndicator>) => {
    updateState({
      typingIndicator: {
        ...state.typingIndicator,
        ...indicator,
      },
    });
  }, [state.typingIndicator, updateState]);

  // 快捷操作
  const quickActions = [
    {
      type: 'copy',
      label: '复制',
      icon: 'Copy',
      shortcut: 'Ctrl+C',
      handler: () => {},
    },
  ];

  // 键盘快捷键
  const keyboardShortcuts = [
    {
      key: 'Enter',
      ctrl: false,
      alt: false,
      shift: false,
      action: () => {},
      description: '发送消息',
    },
  ];

  // 导出会话
  const exportConversation = useCallback(async (options: any) => {
    // 实现导出逻辑
  }, []);

  // 清除聊天历史
  const clearChatHistory = useCallback(async () => {
    // 实现清除历史逻辑
  }, []);

  // 初始化
  useEffect(() => {
    loadState();
    loadConversations();
    loadKnowledgeBases();
  }, []);

  // 清理WebSocket连接
  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, [disconnectWebSocket]);

  // 页面可见性变化时重新连接
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && state.currentSessionId) {
        if (enableWebSocket) {
          connectWebSocket(state.currentSessionId);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.currentSessionId, enableWebSocket, connectWebSocket]);

  return {
    // 状态
    ...state,
    isConnected: connectionStatus === 'connected',
    connectionStatus,

    // 方法
    sendMessage,
    sendMessageStream,
    regenerateResponse,
    editMessage,
    deleteMessage,
    copyMessage,
    shareMessage,
    createNewConversation,
    switchConversation,
    updateConversation,
    deleteConversation,
    archiveConversation,
    unarchiveConversation,
    loadConversations,
    loadMoreConversations,
    loadConversationHistory,
    loadMoreMessages,
    loadKnowledgeBases,
    searchMessages,
    searchConversations,
    clearSearch,
    setCurrentSession,
    clearMessages,
    setError,
    clearError,
    setTypingIndicator,
    connectWebSocket,
    disconnectWebSocket,

    // 额外方法
    quickActions,
    keyboardShortcuts,
    exportConversation,
    clearChatHistory,
  };
};