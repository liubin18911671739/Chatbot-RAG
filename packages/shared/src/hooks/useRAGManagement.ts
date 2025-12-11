/**
 * RAG管理Hook
 */

import { useCallback, useEffect, useState } from 'react';
import { RAGService, KnowledgeBase, Document, KnowledgeBaseStatus, DocumentStatus } from '../services/rag';

interface UseRAGManagementOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  onKnowledgeBaseChange?: (knowledgeBases: KnowledgeBase[]) => void;
  onDocumentChange?: (documents: Document[]) => void;
}

interface UseRAGManagementReturn {
  // 知识库管理
  knowledgeBases: KnowledgeBase[];
  isLoadingKnowledgeBases: boolean;
  knowledgeBaseError: string | null;
  selectedKnowledgeBase: KnowledgeBase | null;

  // 文档管理
  documents: Document[];
  isLoadingDocuments: boolean;
  documentError: string | null;
  selectedDocuments: string[];
  uploadProgress: UploadProgress[];

  // 处理队列
  processingQueue: ProcessingQueueStatus;
  isLoadingQueue: boolean;

  // 知识库操作
  loadKnowledgeBases: () => Promise<void>;
  createKnowledgeBase: (kb: any) => Promise<void>;
  updateKnowledgeBase: (id: string, updates: any) => Promise<void>;
  deleteKnowledgeBase: (id: string) => Promise<void>;
  selectKnowledgeBase: (kb: KnowledgeBase | null) => void;

  // 文档操作
  loadDocuments: (knowledgeBaseId: string) => Promise<void>;
  uploadDocument: (file: File, options?: any) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  reprocessDocument: (id: string, config?: any) => Promise<void>;
  selectDocument: (id: string, selected: boolean) => void;
  selectAllDocuments: (selected: boolean) => void;

  // 批量操作
  bulkDeleteDocuments: () => Promise<void>;
  bulkReprocessDocuments: (config?: any) => Promise<void>;

  // 队列操作
  loadProcessingQueue: (knowledgeBaseId?: string) => Promise<void>;

  // 搜索和过滤
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: KnowledgeBaseStatus | DocumentStatus | 'all';
  setStatusFilter: (status: KnowledgeBaseStatus | DocumentStatus | 'all') => void;

  // 向量索引
  rebuildVectorIndex: (knowledgeBaseId: string) => Promise<void>;
}

interface UploadProgress {
  id: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

interface ProcessingQueueStatus {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  items: any[];
}

export const useRAGManagement = (options: UseRAGManagementOptions = {}): UseRAGManagementReturn => {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30秒
    onKnowledgeBaseChange,
    onDocumentChange,
  } = options;

  // 知识库状态
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [isLoadingKnowledgeBases, setIsLoadingKnowledgeBases] = useState(false);
  const [knowledgeBaseError, setKnowledgeBaseError] = useState<string | null>(null);
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState<KnowledgeBase | null>(null);

  // 文档状态
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);

  // 上传进度
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

  // 处理队列状态
  const [processingQueue, setProcessingQueue] = useState<ProcessingQueueStatus>({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    items: [],
  });
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);

  // 搜索和过滤
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<KnowledgeBaseStatus | DocumentStatus | 'all'>('all');

  // 加载知识库列表
  const loadKnowledgeBases = useCallback(async () => {
    setIsLoadingKnowledgeBases(true);
    setKnowledgeBaseError(null);

    try {
      const { knowledgeBases: kbList } = await RAGService.getKnowledgeBases();
      setKnowledgeBases(kbList);
      onKnowledgeBaseChange?.(kbList);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '加载知识库失败';
      setKnowledgeBaseError(errorMessage);
    } finally {
      setIsLoadingKnowledgeBases(false);
    }
  }, [onKnowledgeBaseChange]);

  // 创建知识库
  const createKnowledgeBase = useCallback(async (kbData: any) => {
    try {
      const newKb = await RAGService.createKnowledgeBase(kbData);
      setKnowledgeBases(prev => [newKb, ...prev]);
      onKnowledgeBaseChange?.([newKb, ...knowledgeBases]);
      return newKb;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建知识库失败';
      setKnowledgeBaseError(errorMessage);
      throw error;
    }
  }, [knowledgeBases, onKnowledgeBaseChange]);

  // 更新知识库
  const updateKnowledgeBase = useCallback(async (id: string, updates: any) => {
    try {
      const updatedKb = await RAGService.updateKnowledgeBase(id, updates);
      setKnowledgeBases(prev =>
        prev.map(kb => (kb.id === id ? updatedKb : kb))
      );

      if (selectedKnowledgeBase?.id === id) {
        setSelectedKnowledgeBase(updatedKb);
      }

      onKnowledgeBaseChange?.(
        knowledgeBases.map(kb => (kb.id === id ? updatedKb : kb))
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新知识库失败';
      setKnowledgeBaseError(errorMessage);
      throw error;
    }
  }, [selectedKnowledgeBase, knowledgeBases, onKnowledgeBaseChange]);

  // 删除知识库
  const deleteKnowledgeBase = useCallback(async (id: string) => {
    try {
      await RAGService.deleteKnowledgeBase(id);
      setKnowledgeBases(prev => prev.filter(kb => kb.id !== id));

      if (selectedKnowledgeBase?.id === id) {
        setSelectedKnowledgeBase(null);
        setDocuments([]);
      }

      onKnowledgeBaseChange?.(knowledgeBases.filter(kb => kb.id !== id));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除知识库失败';
      setKnowledgeBaseError(errorMessage);
      throw error;
    }
  }, [selectedKnowledgeBase, knowledgeBases, onKnowledgeBaseChange]);

  // 选择知识库
  const selectKnowledgeBase = useCallback((kb: KnowledgeBase | null) => {
    setSelectedKnowledgeBase(kb);
    if (kb) {
      loadDocuments(kb.id);
      loadProcessingQueue(kb.id);
    } else {
      setDocuments([]);
    }
  }, []);

  // 加载文档列表
  const loadDocuments = useCallback(async (knowledgeBaseId: string) => {
    setIsLoadingDocuments(true);
    setDocumentError(null);

    try {
      const { documents: docList } = await RAGService.getDocuments(knowledgeBaseId);
      setDocuments(docList);
      onDocumentChange?.(docList);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '加载文档失败';
      setDocumentError(errorMessage);
    } finally {
      setIsLoadingDocuments(false);
    }
  }, [onDocumentChange]);

  // 上传文档
  const uploadDocument = useCallback(async (file: File, options?: any) => {
    if (!selectedKnowledgeBase) {
      throw new Error('请先选择知识库');
    }

    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 添加到上传进度列表
    setUploadProgress(prev => [...prev, {
      id: uploadId,
      fileName: file.name,
      progress: 0,
      status: 'uploading',
    }]);

    try {
      // 更新上传进度
      const updateProgress = (progress: number, status: UploadProgress['status']) => {
        setUploadProgress(prev =>
          prev.map(item =>
            item.id === uploadId
              ? { ...item, progress, status }
              : item
          )
        );
      };

      updateProgress(10, 'uploading');

      const document = await RAGService.uploadDocument(selectedKnowledgeBase.id, file, options);

      updateProgress(100, 'processing');

      // 添加到文档列表
      setDocuments(prev => [document, ...prev]);

      // 更新上传进度为完成
      setTimeout(() => {
        setUploadProgress(prev => prev.filter(item => item.id !== uploadId));
      }, 2000);

      onDocumentChange?.([document, ...documents]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '上传文档失败';

      setUploadProgress(prev =>
        prev.map(item =>
          item.id === uploadId
            ? { ...item, status: 'error', error: errorMessage }
            : item
        )
      );

      setTimeout(() => {
        setUploadProgress(prev => prev.filter(item => item.id !== uploadId));
      }, 5000);

      throw error;
    }
  }, [selectedKnowledgeBase, documents, onDocumentChange]);

  // 删除文档
  const deleteDocument = useCallback(async (id: string) => {
    try {
      await RAGService.deleteDocument(id);
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      setSelectedDocuments(prev => prev.filter(docId => docId !== id));
      onDocumentChange?.(documents.filter(doc => doc.id !== id));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除文档失败';
      setDocumentError(errorMessage);
      throw error;
    }
  }, [documents, onDocumentChange]);

  // 重新处理文档
  const reprocessDocument = useCallback(async (id: string, config?: any) => {
    try {
      const updatedDoc = await RAGService.reprocessDocument(id, config);
      setDocuments(prev =>
        prev.map(doc => (doc.id === id ? updatedDoc : doc))
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '重新处理文档失败';
      setDocumentError(errorMessage);
      throw error;
    }
  }, []);

  // 选择文档
  const selectDocument = useCallback((id: string, selected: boolean) => {
    setSelectedDocuments(prev => {
      if (selected) {
        return [...prev, id];
      } else {
        return prev.filter(docId => docId !== id);
      }
    });
  }, []);

  // 全选/取消全选文档
  const selectAllDocuments = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedDocuments(documents.map(doc => doc.id));
    } else {
      setSelectedDocuments([]);
    }
  }, [documents]);

  // 批量删除文档
  const bulkDeleteDocuments = useCallback(async () => {
    if (selectedDocuments.length === 0) return;

    try {
      await RAGService.bulkDocumentOperation({
        action: 'delete',
        documentIds: selectedDocuments,
      });

      setDocuments(prev => prev.filter(doc => !selectedDocuments.includes(doc.id)));
      setSelectedDocuments([]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '批量删除文档失败';
      setDocumentError(errorMessage);
      throw error;
    }
  }, [selectedDocuments]);

  // 批量重新处理文档
  const bulkReprocessDocuments = useCallback(async (config?: any) => {
    if (selectedDocuments.length === 0) return;

    try {
      await RAGService.bulkDocumentOperation({
        action: 'reprocess',
        documentIds: selectedDocuments,
        processingConfig: config,
      });

      // 重新加载文档列表以更新状态
      if (selectedKnowledgeBase) {
        await loadDocuments(selectedKnowledgeBase.id);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '批量重新处理文档失败';
      setDocumentError(errorMessage);
      throw error;
    }
  }, [selectedDocuments, selectedKnowledgeBase, loadDocuments]);

  // 加载处理队列
  const loadProcessingQueue = useCallback(async (knowledgeBaseId?: string) => {
    setIsLoadingQueue(true);

    try {
      const queue = await RAGService.getProcessingQueue(knowledgeBaseId);
      setProcessingQueue(queue);
    } catch (error) {
      console.error('Failed to load processing queue:', error);
    } finally {
      setIsLoadingQueue(false);
    }
  }, []);

  // 重建向量索引
  const rebuildVectorIndex = useCallback(async (knowledgeBaseId: string) => {
    try {
      await RAGService.rebuildVectorIndex(knowledgeBaseId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '重建向量索引失败';
      setKnowledgeBaseError(errorMessage);
      throw error;
    }
  }, []);

  // 过滤知识库
  const filteredKnowledgeBases = knowledgeBases.filter(kb => {
    const matchesSearch = !searchQuery ||
      kb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kb.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || kb.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // 过滤文档
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = !searchQuery ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (selectedKnowledgeBase) {
        loadDocuments(selectedKnowledgeBase.id);
        loadProcessingQueue(selectedKnowledgeBase.id);
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, selectedKnowledgeBase, loadDocuments, loadProcessingQueue]);

  // 初始化加载
  useEffect(() => {
    loadKnowledgeBases();
  }, [loadKnowledgeBases]);

  return {
    // 知识库管理
    knowledgeBases: filteredKnowledgeBases,
    isLoadingKnowledgeBases,
    knowledgeBaseError,
    selectedKnowledgeBase,

    // 文档管理
    documents: filteredDocuments,
    isLoadingDocuments,
    documentError,
    selectedDocuments,
    uploadProgress,

    // 处理队列
    processingQueue,
    isLoadingQueue,

    // 知识库操作
    loadKnowledgeBases,
    createKnowledgeBase,
    updateKnowledgeBase,
    deleteKnowledgeBase,
    selectKnowledgeBase,

    // 文档操作
    loadDocuments,
    uploadDocument,
    deleteDocument,
    reprocessDocument,
    selectDocument,
    selectAllDocuments,

    // 批量操作
    bulkDeleteDocuments,
    bulkReprocessDocuments,

    // 队列操作
    loadProcessingQueue,

    // 搜索和过滤
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,

    // 向量索引
    rebuildVectorIndex,
  };
};

/**
 * RAG分析Hook
 */
export const useRAGAnalytics = (options?: {
  dateRange?: {
    start: string;
    end: string;
  };
  knowledgeBaseIds?: string[];
  autoRefresh?: boolean;
}) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const analyticsData = await RAGService.getRAGAnalytics(options);
      setAnalytics(analyticsData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '加载分析数据失败';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    analytics,
    isLoading,
    error,
    loadAnalytics,
  };
};

/**
 * RAG测试Hook
 */
export const useRAGTesting = () => {
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testQuery = useCallback(async (
    knowledgeBaseId: string,
    query: string,
    options?: any
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await RAGService.testRAGQuery(knowledgeBaseId, query, options);
      setTestResults(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '测试查询失败';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    testResults,
    isLoading,
    error,
    testQuery,
  };
};