/**
 * 聊天状态管理
 */

import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';

export const useChatStore = defineStore('chat', () => {
    // 响应式状态
    const currentScene = ref(null);
    const messagesHistory = reactive({});
    const currentChatId = ref(null);
    const loading = ref(false);
    
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

    // 返回store的公共属性和方法
    return {
        currentScene,
        messagesHistory,
        currentChatId,
        loading,
        selectScene,
        addMessage,
        getCurrentMessages,
        clearCurrentMessages,
        createNewChat
    };
});