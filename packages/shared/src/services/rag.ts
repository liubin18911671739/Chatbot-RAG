/**
 * RAG管理服务 - 处理知识库管理、文档处理、向量化等功能
 */

import { AdminService } from './admin';

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  status: KnowledgeBaseStatus;
  config: KnowledgeBaseConfig;
  statistics: KnowledgeBaseStatistics;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  tags: string[];
  accessControl: AccessControl;
}

export enum KnowledgeBaseStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PROCESSING = 'processing',
  ERROR = 'error',
  MAINTENANCE = 'maintenance',
}

export interface KnowledgeBaseConfig {
  embeddingModel: EmbeddingModel;
  chunkingStrategy: ChunkingStrategy;
  retrievalConfig: RetrievalConfig;
  processingConfig: ProcessingConfig;
}

export interface EmbeddingModel {
  provider: 'zhipu' | 'openai' | 'huggingface' | 'local';
  modelName: string;
  dimensions: number;
  maxTokens: number;
  batchSize: number;
  temperature?: number;
}

export interface ChunkingStrategy {
  method: 'fixed_size' | 'semantic' | 'recursive' | 'markdown';
  chunkSize: number;
  chunkOverlap: number;
  separators?: string[];
  minChunkSize?: number;
  maxChunkSize?: number;
}

export interface RetrievalConfig {
  topK: number;
  similarityThreshold: number;
  reranking: RerankingConfig;
  hybridSearch: HybridSearchConfig;
  filters?: FilterConfig[];
}

export interface RerankingConfig {
  enabled: boolean;
  model: string;
  topN: number;
}

export interface HybridSearchConfig {
  enabled: boolean;
  keywordWeight: number;
  semanticWeight: number;
}

export interface FilterConfig {
  field: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between';
  value?: any;
}

export interface ProcessingConfig {
  extractMetadata: boolean;
  extractImages: boolean;
  extractTables: boolean;
  extractLinks: boolean;
  languageDetection: boolean;
  contentCleaning: boolean;
}

export interface KnowledgeBaseStatistics {
  documentCount: number;
  vectorCount: number;
  totalSize: number;
  averageDocumentSize: number;
  processingQueue: ProcessingQueueStats;
  lastUpdated: string;
  usageStats: UsageStats;
}

export interface ProcessingQueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  averageProcessingTime: number;
}

export interface UsageStats {
  dailyQueries: number;
  weeklyQueries: number;
  monthlyQueries: number;
  averageResponseTime: number;
  hitRate: number;
}

export interface AccessControl {
  isPublic: boolean;
  allowedRoles: string[];
  allowedUsers: string[];
  apiKeys: ApiKey[];
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  expiresAt?: string;
  lastUsed?: string;
  usageCount: number;
  rateLimit: RateLimit;
}

export interface RateLimit {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
}

export interface Document {
  id: string;
  knowledgeBaseId: string;
  title: string;
  content: string;
  originalUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  status: DocumentStatus;
  metadata: DocumentMetadata;
  vectorCount: number;
  processingLog: ProcessingLog[];
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
  error?: string;
}

export enum DocumentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  INDEXING = 'indexing',
  ARCHIVED = 'archived',
}

export interface DocumentMetadata {
  author?: string;
  createdAt?: string;
  modifiedAt?: string;
  language?: string;
  pageCount?: number;
  wordCount?: number;
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface ProcessingLog {
  step: ProcessingStep;
  status: 'started' | 'completed' | 'failed';
  message: string;
  timestamp: string;
  duration?: number;
  error?: string;
}

export enum ProcessingStep {
  UPLOADING = 'uploading',
  EXTRACTING = 'extracting',
  CHUNKING = 'chunking',
  EMBEDDING = 'embedding',
  INDEXING = 'indexing',
  CLEANUP = 'cleanup',
}

export interface VectorIndex {
  id: string;
  knowledgeBaseId: string;
  type: VectorIndexType;
  config: VectorIndexConfig;
  statistics: VectorIndexStatistics;
  status: VectorIndexStatus;
  createdAt: string;
  updatedAt: string;
}

export enum VectorIndexType {
  FAISS = 'faiss',
  PGVECTOR = 'pgvector',
  PINECONE = 'pinecone',
  WEVIATE = 'weviate',
  CHROMA = 'chroma',
}

export interface VectorIndexConfig {
  dimensions: number;
  distanceMetric: 'cosine' | 'euclidean' | 'dotproduct';
  indexType: string;
  efConstruction?: number;
  efSearch?: number;
  m?: number;
}

export interface VectorIndexStatistics {
  vectorCount: number;
  indexSize: number;
  buildTime: number;
  lastOptimized?: string;
  queryPerformance: QueryPerformance;
}

export interface QueryPerformance {
  averageQueryTime: number;
  p95QueryTime: number;
  p99QueryTime: number;
  queriesPerSecond: number;
}

export enum VectorIndexStatus {
  BUILDING = 'building',
  READY = 'ready',
  OPTIMIZING = 'optimizing',
  ERROR = 'error',
  MAINTENANCE = 'maintenance',
}

export interface RAGPipeline {
  id: string;
  name: string;
  description: string;
  knowledgeBaseIds: string[];
  stages: PipelineStage[];
  config: PipelineConfig;
  status: PipelineStatus;
  statistics: PipelineStatistics;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  type: StageType;
  config: StageConfig;
  order: number;
  enabled: boolean;
}

export enum StageType {
  RETRIEVAL = 'retrieval',
  RERANKING = 'reranking',
  FILTERING = 'filtering',
  TRANSFORMATION = 'transformation',
  VALIDATION = 'validation',
}

export interface StageConfig {
  parameters: Record<string, any>;
  timeout?: number;
  retryCount?: number;
}

export interface PipelineConfig {
  parallelism: number;
  timeout: number;
  errorHandling: 'fail_fast' | 'continue_on_error' | 'retry';
  caching: boolean;
  monitoring: boolean;
}

export enum PipelineStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  UPDATING = 'updating',
}

export interface PipelineStatistics {
  totalRuns: number;
  successRate: number;
  averageLatency: number;
  errorCount: number;
  lastRunAt?: string;
}

export interface RAGQuery {
  id: string;
  knowledgeBaseId: string;
  query: string;
  results: QueryResult[];
  metadata: QueryMetadata;
  responseTime: number;
  timestamp: string;
  userId?: string;
  sessionId?: string;
}

export interface QueryResult {
  documentId: string;
  documentTitle: string;
  chunkId: string;
  content: string;
  score: number;
  metadata?: Record<string, any>;
}

export interface QueryMetadata {
  retrievalConfig: any;
  vectorCount: number;
  processingTime: number;
  reranked: boolean;
  filters: any[];
}

export interface RAGAnalytics {
  queryAnalytics: QueryAnalytics;
  documentAnalytics: DocumentAnalytics;
  knowledgeBaseAnalytics: KnowledgeBaseAnalytics;
  performanceAnalytics: PerformanceAnalytics;
  userAnalytics: UserAnalytics;
}

export interface QueryAnalytics {
  totalQueries: number;
  averageQueryLength: number;
  queryDistribution: QueryDistribution[];
  topQueries: TopQuery[];
  queryTrends: QueryTrend[];
}

export interface QueryDistribution {
  category: string;
  count: number;
  percentage: number;
}

export interface TopQuery {
  query: string;
  count: number;
  averageScore: number;
}

export interface QueryTrend {
  date: string;
  queryCount: number;
  averageResponseTime: number;
}

export interface DocumentAnalytics {
  totalDocuments: number;
  documentTypes: DocumentTypeDistribution[];
  processingTimes: ProcessingTimeStats;
  errorRates: ErrorRateStats;
  popularDocuments: PopularDocument[];
}

export interface DocumentTypeDistribution {
  mimeType: string;
  count: number;
  percentage: number;
}

export interface ProcessingTimeStats {
  average: number;
  median: number;
  p95: number;
  p99: number;
}

export interface ErrorRateStats {
  totalErrors: number;
  errorRate: number;
  commonErrors: CommonError[];
}

export interface CommonError {
  errorType: string;
  count: number;
  percentage: number;
}

export interface PopularDocument {
  documentId: string;
  title: string;
  queryCount: number;
  averageScore: number;
}

export interface KnowledgeBaseAnalytics {
  knowledgeBases: KnowledgeBaseAnalyticsItem[];
  usageComparison: UsageComparison;
  performanceComparison: PerformanceComparison;
}

export interface KnowledgeBaseAnalyticsItem {
  knowledgeBaseId: string;
  name: string;
  queryCount: number;
  averageResponseTime: number;
  hitRate: number;
  growthRate: number;
}

export interface UsageComparison {
  period: string;
  knowledgeBases: ComparisonItem[];
}

export interface ComparisonItem {
  knowledgeBaseId: string;
  name: string;
  currentPeriod: number;
  previousPeriod: number;
  growthRate: number;
}

export interface PerformanceComparison {
  period: string;
  metrics: PerformanceMetric[];
}

export interface PerformanceMetric {
  metric: string;
  knowledgeBases: MetricValue[];
}

export interface MetricValue {
  knowledgeBaseId: string;
  name: string;
  value: number;
  change: number;
}

export interface PerformanceAnalytics {
  overallPerformance: OverallPerformance;
  bottlenecks: Bottleneck[];
  optimizationSuggestions: OptimizationSuggestion[];
}

export interface OverallPerformance {
  averageResponseTime: number;
  p95ResponseTime: number;
  throughput: number;
  errorRate: number;
  uptime: number;
}

export interface Bottleneck {
  component: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  frequency: number;
  averageDelay: number;
}

export interface OptimizationSuggestion {
  category: 'performance' | 'cost' | 'quality' | 'scalability';
  description: string;
  expectedImprovement: string;
  implementationEffort: 'low' | 'medium' | 'high';
  priority: number;
}

export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  userSegmentation: UserSegmentation[];
  userBehavior: UserBehaviorMetrics;
  retentionMetrics: RetentionMetrics;
}

export interface UserSegmentation {
  segment: string;
  count: number;
  percentage: number;
  characteristics: string[];
}

export interface UserBehaviorMetrics {
  averageQueriesPerUser: number;
  averageSessionDuration: number;
  bounceRate: number;
  featureUsage: FeatureUsage[];
}

export interface FeatureUsage {
  feature: string;
  usageCount: number;
  uniqueUsers: number;
  adoptionRate: number;
}

export interface RetentionMetrics {
  dailyRetention: number;
  weeklyRetention: number;
  monthlyRetention: number;
  churnRate: number;
  cohortAnalysis: CohortData[];
}

export interface CohortData {
  cohort: string;
  size: number;
  retentionRates: number[];
}

class RAGError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number
  ) {
    super(message);
    this.name = 'RAGError';
  }
}

export class RAGService {
  private static readonly API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  /**
   * 获取所有知识库
   */
  static async getKnowledgeBases(options?: {
    status?: KnowledgeBaseStatus;
    tags?: string[];
    limit?: number;
    offset?: number;
  }): Promise<{ knowledgeBases: KnowledgeBase[]; total: number }> {
    const token = AdminService.getAdminAccessToken();
    if (!token) {
      throw new RAGError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const params = new URLSearchParams();
      if (options?.status) params.append('status', options.status);
      if (options?.tags) params.append('tags', options.tags.join(','));
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());

      const response = await fetch(`${this.API_BASE}/api/admin/rag/knowledge-bases?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new RAGError(
          data.message || '获取知识库失败',
          data.code,
          response.status
        );
      }

      return {
        knowledgeBases: data.knowledgeBases,
        total: data.total,
      };
    } catch (error) {
      if (error instanceof RAGError) {
        throw error;
      }
      throw new RAGError('获取知识库失败');
    }
  }

  /**
   * 创建知识库
   */
  static async createKnowledgeBase(knowledgeBase: {
    name: string;
    description: string;
    config: KnowledgeBaseConfig;
    tags?: string[];
    accessControl?: Partial<AccessControl>;
  }): Promise<KnowledgeBase> {
    const token = AdminService.getAdminAccessToken();
    if (!token) {
      throw new RAGError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/admin/rag/knowledge-bases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(knowledgeBase),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new RAGError(
          data.message || '创建知识库失败',
          data.code,
          response.status
        );
      }

      return data.knowledgeBase;
    } catch (error) {
      if (error instanceof RAGError) {
        throw error;
      }
      throw new RAGError('创建知识库失败');
    }
  }

  /**
   * 更新知识库
   */
  static async updateKnowledgeBase(
    knowledgeBaseId: string,
    updates: Partial<KnowledgeBase>
  ): Promise<KnowledgeBase> {
    const token = AdminService.getAdminAccessToken();
    if (!token) {
      throw new RAGError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/admin/rag/knowledge-bases/${knowledgeBaseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new RAGError(
          data.message || '更新知识库失败',
          data.code,
          response.status
        );
      }

      return data.knowledgeBase;
    } catch (error) {
      if (error instanceof RAGError) {
        throw error;
      }
      throw new RAGError('更新知识库失败');
    }
  }

  /**
   * 删除知识库
   */
  static async deleteKnowledgeBase(knowledgeBaseId: string): Promise<void> {
    const token = AdminService.getAdminAccessToken();
    if (!token) {
      throw new RAGError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/admin/rag/knowledge-bases/${knowledgeBaseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new RAGError(
          data.message || '删除知识库失败',
          data.code,
          response.status
        );
      }
    } catch (error) {
      if (error instanceof RAGError) {
        throw error;
      }
      throw new RAGError('删除知识库失败');
    }
  }

  /**
   * 上传文档
   */
  static async uploadDocument(
    knowledgeBaseId: string,
    file: File,
    options?: {
      title?: string;
      description?: string;
      tags?: string[];
      metadata?: Record<string, any>;
      processingConfig?: Partial<ProcessingConfig>;
    }
  ): Promise<Document> {
    const token = AdminService.getAdminAccessToken();
    if (!token) {
      throw new RAGError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('knowledgeBaseId', knowledgeBaseId);

    if (options) {
      if (options.title) formData.append('title', options.title);
      if (options.description) formData.append('description', options.description);
      if (options.tags) formData.append('tags', JSON.stringify(options.tags));
      if (options.metadata) formData.append('metadata', JSON.stringify(options.metadata));
      if (options.processingConfig) {
        formData.append('processingConfig', JSON.stringify(options.processingConfig));
      }
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/admin/rag/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new RAGError(
          data.message || '上传文档失败',
          data.code,
          response.status
        );
      }

      return data.document;
    } catch (error) {
      if (error instanceof RAGError) {
        throw error;
      }
      throw new RAGError('上传文档失败');
    }
  }

  /**
   * 获取知识库文档列表
   */
  static async getDocuments(
    knowledgeBaseId: string,
    options?: {
      status?: DocumentStatus;
      limit?: number;
      offset?: number;
      sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'fileSize';
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<{ documents: Document[]; total: number }> {
    const token = AdminService.getAdminAccessToken();
    if (!token) {
      throw new RAGError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const params = new URLSearchParams();
      params.append('knowledgeBaseId', knowledgeBaseId);
      if (options?.status) params.append('status', options.status);
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());
      if (options?.sortBy) params.append('sortBy', options.sortBy);
      if (options?.sortOrder) params.append('sortOrder', options.sortOrder);

      const response = await fetch(`${this.API_BASE}/api/admin/rag/documents?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new RAGError(
          data.message || '获取文档列表失败',
          data.code,
          response.status
        );
      }

      return {
        documents: data.documents,
        total: data.total,
      };
    } catch (error) {
      if (error instanceof RAGError) {
        throw error;
      }
      throw new RAGError('获取文档列表失败');
    }
  }

  /**
   * 删除文档
   */
  static async deleteDocument(documentId: string): Promise<void> {
    const token = AdminService.getAdminAccessToken();
    if (!token) {
      throw new RAGError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/admin/rag/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new RAGError(
          data.message || '删除文档失败',
          data.code,
          response.status
        );
      }
    } catch (error) {
      if (error instanceof RAGError) {
        throw error;
      }
      throw new RAGError('删除文档失败');
    }
  }

  /**
   * 重新处理文档
   */
  static async reprocessDocument(
    documentId: string,
    processingConfig?: Partial<ProcessingConfig>
  ): Promise<Document> {
    const token = AdminService.getAdminAccessToken();
    if (!token) {
      throw new RAGError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/admin/rag/documents/${documentId}/reprocess`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ processingConfig }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new RAGError(
          data.message || '重新处理文档失败',
          data.code,
          response.status
        );
      }

      return data.document;
    } catch (error) {
      if (error instanceof RAGError) {
        throw error;
      }
      throw new RAGError('重新处理文档失败');
    }
  }

  /**
   * 获取处理队列状态
   */
  static async getProcessingQueue(knowledgeBaseId?: string): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    items: ProcessingQueueItem[];
  }> {
    const token = AdminService.getAdminAccessToken();
    if (!token) {
      throw new RAGError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const params = new URLSearchParams();
      if (knowledgeBaseId) params.append('knowledgeBaseId', knowledgeBaseId);

      const response = await fetch(`${this.API_BASE}/api/admin/rag/processing-queue?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new RAGError(
          data.message || '获取处理队列失败',
          data.code,
          response.status
        );
      }

      return data.queue;
    } catch (error) {
      if (error instanceof RAGError) {
        throw error;
      }
      throw new RAGError('获取处理队列失败');
    }
  }

  /**
   * 获取向量索引信息
   */
  static async getVectorIndex(knowledgeBaseId: string): Promise<VectorIndex> {
    const token = AdminService.getAdminAccessToken();
    if (!token) {
      throw new RAGError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/admin/rag/vector-index/${knowledgeBaseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new RAGError(
          data.message || '获取向量索引失败',
          data.code,
          response.status
        );
      }

      return data.vectorIndex;
    } catch (error) {
      if (error instanceof RAGError) {
        throw error;
      }
      throw new RAGError('获取向量索引失败');
    }
  }

  /**
   * 重建向量索引
   */
  static async rebuildVectorIndex(knowledgeBaseId: string): Promise<void> {
    const token = AdminService.getAdminAccessToken();
    if (!token) {
      throw new RAGError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/admin/rag/vector-index/${knowledgeBaseId}/rebuild`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new RAGError(
          data.message || '重建向量索引失败',
          data.code,
          response.status
        );
      }
    } catch (error) {
      if (error instanceof RAGError) {
        throw error;
      }
      throw new RAGError('重建向量索引失败');
    }
  }

  /**
   * 获取RAG分析数据
   */
  static async getRAGAnalytics(options?: {
    dateRange?: {
      start: string;
      end: string;
    };
    knowledgeBaseIds?: string[];
    metrics?: string[];
  }): Promise<RAGAnalytics> {
    const token = AdminService.getAdminAccessToken();
    if (!token) {
      throw new RAGError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const params = new URLSearchParams();
      if (options?.dateRange) {
        params.append('startDate', options.dateRange.start);
        params.append('endDate', options.dateRange.end);
      }
      if (options?.knowledgeBaseIds) {
        params.append('knowledgeBaseIds', options.knowledgeBaseIds.join(','));
      }
      if (options?.metrics) {
        params.append('metrics', options.metrics.join(','));
      }

      const response = await fetch(`${this.API_BASE}/api/admin/rag/analytics?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new RAGError(
          data.message || '获取RAG分析数据失败',
          data.code,
          response.status
        );
      }

      return data.analytics;
    } catch (error) {
      if (error instanceof RAGError) {
        throw error;
      }
      throw new RAGError('获取RAG分析数据失败');
    }
  }

  /**
   * 测试RAG查询
   */
  static async testRAGQuery(
    knowledgeBaseId: string,
    query: string,
    options?: {
      topK?: number;
      similarityThreshold?: number;
      filters?: FilterConfig[];
    }
  ): Promise<RAGQuery> {
    const token = AdminService.getAdminAccessToken();
    if (!token) {
      throw new RAGError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/admin/rag/test-query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          knowledgeBaseId,
          query,
          options,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new RAGError(
          data.message || '测试RAG查询失败',
          data.code,
          response.status
        );
      }

      return data.queryResult;
    } catch (error) {
      if (error instanceof RAGError) {
        throw error;
      }
      throw new RAGError('测试RAG查询失败');
    }
  }

  /**
   * 批量操作文档
   */
  static async bulkDocumentOperation(operation: {
    action: 'delete' | 'reprocess' | 'archive';
    documentIds: string[];
    processingConfig?: Partial<ProcessingConfig>;
  }): Promise<{ success: number; failed: number; errors: string[] }> {
    const token = AdminService.getAdminAccessToken();
    if (!token) {
      throw new RAGError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/admin/rag/documents/bulk-operation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(operation),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new RAGError(
          data.message || '批量操作文档失败',
          data.code,
          response.status
        );
      }

      return data.result;
    } catch (error) {
      if (error instanceof RAGError) {
        throw error;
      }
      throw new RAGError('批量操作文档失败');
    }
  }
}

interface ProcessingQueueItem {
  id: string;
  documentId: string;
  documentTitle: string;
  status: DocumentStatus;
  progress: number;
  startedAt: string;
  estimatedCompletion?: string;
  error?: string;
}