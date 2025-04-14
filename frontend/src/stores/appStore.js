import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useAppStore = defineStore('app', () => {
  // 状态 (ref)
  const theme = ref(localStorage.getItem('theme') || 'light');
  const sidebarCollapsed = ref(localStorage.getItem('sidebarCollapsed') === 'true' || false);
  const networkStatus = ref(navigator.onLine);
  const appLoaded = ref(false);
  const userPreferences = ref(JSON.parse(localStorage.getItem('userPreferences') || '{}'));
  
  // 计算属性 (computed)
  const isDarkMode = computed(() => theme.value === 'dark');
  const isSidebarOpen = computed(() => !sidebarCollapsed.value);
  const isOnline = computed(() => networkStatus.value);
  
  // 动作 (actions)
  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', theme.value);
    
    // 添加/移除暗色模式CSS类
    if (theme.value === 'dark') {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }
  
  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value;
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed.value);
  }
  
  function updateNetworkStatus(isOnline) {
    networkStatus.value = isOnline;
  }
  
  function setAppLoaded(status = true) {
    appLoaded.value = status;
  }
  
  function updateUserPreference(key, value) {
    userPreferences.value = {
      ...userPreferences.value,
      [key]: value
    };
    localStorage.setItem('userPreferences', JSON.stringify(userPreferences.value));
  }
  
  function initialize() {
    // 监听网络状态变化
    window.addEventListener('online', () => updateNetworkStatus(true));
    window.addEventListener('offline', () => updateNetworkStatus(false));
    
    // 初始化主题
    if (theme.value === 'dark') {
      document.documentElement.classList.add('dark-mode');
    }
    
    // 标记应用已加载
    setAppLoaded();
  }

  return {
    // 状态
    theme,
    sidebarCollapsed,
    networkStatus,
    appLoaded,
    userPreferences,
    
    // 计算属性
    isDarkMode,
    isSidebarOpen,
    isOnline,
    
    // 动作
    toggleTheme,
    toggleSidebar,
    updateNetworkStatus,
    setAppLoaded,
    updateUserPreference,
    initialize
  };
});