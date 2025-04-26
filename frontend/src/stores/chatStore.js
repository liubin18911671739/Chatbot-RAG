/**
 * 聊天状态管理
 */

import { defineStore } from 'pinia';
import { ref, reactive, watch } from 'vue';

export const useChatStore = defineStore('chat', () => {
    // 响应式状态
    const currentScene = ref(null);
    const messagesHistory = reactive({});
    const currentChatId = ref(null);
    const loading = ref(false);
    
    // 问答缓存系统 - 保存最近的100条问答记录
    const qaCache = ref(JSON.parse(localStorage.getItem('qaCache') || '[]'));
    
    // 监听缓存变化，自动保存到本地存储
    watch(qaCache, (newCache) => {
        localStorage.setItem('qaCache', JSON.stringify(newCache));
    }, { deep: true });
    
    /**
     * 选择场景
     * @param {Object} scene - 场景信息
     */
    function selectScene(scene) {
        currentScene.value = scene;
    }
    
    /**
     * 添加聊天消息
     * @param {string} sceneId - 场景ID
     * @param {Object} message - 消息对象
     */
    function addMessage(sceneId, message) {
        if (!messagesHistory[sceneId]) {
            messagesHistory[sceneId] = [];
        }
        messagesHistory[sceneId].push(message);
    }
    
    /**
     * 获取当前场景的消息列表
     * @returns {Array} - 消息列表
     */
    function getCurrentMessages() {
        if (!currentScene.value) return [];
        return messagesHistory[currentScene.value.id] || [];
    }
    
    /**
     * 清空当前场景的聊天记录
     */
    function clearCurrentMessages() {
        if (currentScene.value) {
            messagesHistory[currentScene.value.id] = [];
            currentChatId.value = null;
        }
    }
    
    /**
     * 创建新的聊天
     */
    function createNewChat() {
        if (currentScene.value) {
            messagesHistory[currentScene.value.id] = [];
        }
        currentChatId.value = null;
    }

    /**
     * 添加问题和答案到缓存
     * @param {string} question - 用户问题
     * @param {string} answer - AI回答
     */
    function addToQACache(question, answer) {
        if (!question || !answer) return;
        
        // 规范化问题文本以便比较（去除空格、标点和大小写差异）
        const normalizedQuestion = normalizeText(question);
        
        // 检查是否已存在相同问题
        const existingIndex = qaCache.value.findIndex(item => normalizeText(item.question) === normalizedQuestion);
        
        if (existingIndex !== -1) {
            // 如果存在相同问题，更新答案并移到数组开头（最近使用的放在前面）
            qaCache.value.splice(existingIndex, 1);
            qaCache.value.unshift({
                question,
                answer,
                timestamp: Date.now()
            });
        } else {
            // 添加新问答到数组开头
            qaCache.value.unshift({
                question,
                answer,
                timestamp: Date.now()
            });
            
            // 如果超过100条记录，删除最旧的
            if (qaCache.value.length > 100) {
                qaCache.value.pop();
            }
        }
    }
    
    /**
     * 根据问题查找缓存的答案
     * @param {string} question - 用户问题
     * @returns {string|null} - 缓存的答案，如果没有则返回null
     */
    function findCachedAnswer(question) {
        if (!question) return null;
        
        // 规范化问题文本
        const normalizedQuestion = normalizeText(question);
        
        // 查找匹配的问题
        const cachedItem = qaCache.value.find(item => normalizeText(item.question) === normalizedQuestion);
        
        if (cachedItem) {
            // 找到匹配项，将其移到数组开头（最近使用的放在前面）
            const index = qaCache.value.indexOf(cachedItem);
            if (index > 0) {
                qaCache.value.splice(index, 1);
                qaCache.value.unshift(cachedItem);
            }
            return cachedItem.answer;
        }
        
        return null;
    }
    
    /**
     * 规范化文本以便比较
     * @param {string} text - 要规范化的文本
     * @returns {string} - 规范化后的文本
     */
    function normalizeText(text) {
        if (!text) return '';
        return text.trim().toLowerCase()
            .replace(/[.,?!;:，。？！；：""'']/g, '') // 移除标点符号
            .replace(/\s+/g, ' '); // 将多个空格替换为单个空格
    }
    
    /**
     * 清除问答缓存
     */
    function clearQACache() {
        qaCache.value = [];
    }
    
    /**
     * 获取缓存中的所有问题
     * @returns {Array} - 问题列表
     */
    function getCachedQuestions() {
        return qaCache.value.map(item => item.question);
    }

    // 返回store的公共属性和方法
    return {
        currentScene,
        messagesHistory,
        currentChatId,
        loading,
        qaCache,
        selectScene,
        addMessage,
        getCurrentMessages,
        clearCurrentMessages,
        createNewChat,
        addToQACache,
        findCachedAnswer,
        clearQACache,
        getCachedQuestions
    };
});