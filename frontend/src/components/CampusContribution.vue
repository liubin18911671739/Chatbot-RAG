<template>
  <div class="campus-contribution">
    <h2 class="contribution-title">校园共建</h2>
    <div class="contribution-description">
      欢迎参与校园知识库建设，您的贡献将帮助更多同学获取准确信息。
    </div>
    
    <form @submit.prevent="submitContribution" class="contribution-form campus-card">
      <div class="form-group">
        <label for="question">问题</label>
        <textarea 
          id="question" 
          v-model="formData.question" 
          class="campus-input" 
          rows="3" 
          placeholder="请输入您想要提交的问题..."
          required
        ></textarea>
      </div>
      
      <div class="form-group">
        <label for="answer">答案</label>
        <textarea 
          id="answer" 
          v-model="formData.answer" 
          class="campus-input" 
          rows="5" 
          placeholder="请输入问题的答案或解决方案..."
          required
        ></textarea>
      </div>
      
      <!-- <div class="form-group">
        <label for="category">分类</label>
        <select id="category" v-model="formData.category" class="campus-input" required>
          <option value="">请选择分类</option>
          <option v-for="category in categories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>
      </div> -->
      
      <div class="form-actions">
        <button 
          type="submit" 
          class="campus-btn submit-btn" 
          :disabled="isSubmitting"
        >
          <span v-if="isSubmitting" class="loading-spinner"></span>
          <span v-else>提交</span>
        </button>
      </div>    </form>

    <!-- 错误提示 -->
    <div v-if="showError" class="error-message">
      <div class="error-icon">⚠️</div>
      <div class="error-text">
        <h3>提交失败</h3>
        <p>{{ errorMessage }}</p>
      </div>
      <div class="error-actions">
        <button @click="dismissError" class="campus-btn dismiss-btn">关闭</button>
      </div>
    </div>

    <!-- 成功提示 -->
    <div v-if="showSuccess" class="success-message">
      <div class="success-icon">✓</div>
      <div class="success-text">
        <h3>提交成功！</h3>
        <p>感谢您的贡献，我们将尽快审核。</p>
      </div>
      <div class="success-actions">
        <button @click="resetForm" class="campus-btn continue-btn">继续提交</button>
        <button @click="closeForm" class="campus-btn close-btn">返回聊天</button>
      </div>
    </div>
  </div>
</template>

<script>
import contributionService, { getErrorSuggestion } from '@/services/contributionService';

export default {
  name: 'CampusContribution',
  data() {
    return {
      formData: {
        question: '',
        answer: ''
      },
      isSubmitting: false,
      showSuccess: false,
      errorMessage: '',
      showError: false
    };
  },
  methods: {
    async submitContribution() {
      // 清除之前的错误状态
      this.showError = false;
      this.errorMessage = '';
      
      this.isSubmitting = true;
      
      try {
        // 使用校园共建服务提交数据
        const result = await contributionService.submitContribution(this.formData);
        
        if (result.success) {
          console.log('✅ 提交成功:', result);
          this.showSuccess = true;
        } else {
          throw new Error(result.message);
        }
        
      } catch (error) {
        console.error('❌ 提交校园共建内容时出错:', error);
        
        // 显示错误信息
        this.errorMessage = error.message || '提交失败，请重试';
        this.showError = true;
        
        // 如果是服务返回的错误结果，显示更详细的信息
        if (error.result && !error.result.success) {
          this.errorMessage = error.result.message;
          
          // 如果有错误建议，也显示出来
          const suggestion = getErrorSuggestion(error.result.type);
          if (suggestion) {
            this.errorMessage += '\n\n建议：' + suggestion;
          }
        }
        
      } finally {
        this.isSubmitting = false;
      }
    },
    
    resetForm() {
      this.formData = {
        question: '',
        answer: ''
      };
      this.showSuccess = false;
      this.showError = false;
      this.errorMessage = '';
    },
    
    closeForm() {
      this.$emit('contribution-submitted');
    },

    dismissError() {
      this.showError = false;
      this.errorMessage = '';
    }
  }
};
</script>

<style scoped>
.campus-contribution {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.contribution-title {
  font-size: 1.5rem;
  color: var(--campus-primary);
  margin-bottom: 8px;
}

.contribution-description {
  font-size: 0.9rem;
  color: var(--campus-neutral-700);
  margin-bottom: 24px;
}

.contribution-form {
  background-color: white;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--campus-neutral-800);
}

.campus-input {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--campus-neutral-300);
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

textarea.campus-input {
  resize: vertical;
  min-height: 80px;
}

.campus-input:focus {
  outline: none;
  border-color: var(--campus-primary);
  box-shadow: 0 0 0 2px rgba(var(--campus-primary-rgb), 0.1);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.submit-btn {
  background-color: var(--campus-primary);
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;
}

.submit-btn:hover {
  background-color: var(--campus-primary-dark);
  transform: translateY(-1px);
}

.submit-btn:disabled {
  background-color: var(--campus-neutral-400);
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 错误提示样式 */
.error-message {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.error-icon {
  background-color: #dc3545;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-right: 16px;
}

.error-text {
  flex-grow: 1;
}

.error-text h3 {
  margin: 0 0 4px 0;
  color: #721c24;
}

.error-text p {
  margin: 0;
  color: #721c24;
  white-space: pre-line;
}

.error-actions {
  display: flex;
  width: 100%;
  margin-top: 16px;
  justify-content: center;
}

.error-message .dismiss-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.error-message .dismiss-btn:hover {
  background-color: #c82333;
  transform: translateY(-1px);
}

/* 成功提示样式 */
.success-message {
  background-color: #ecf9ec;
  border: 1px solid #c3e6cb;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.success-icon {
  background-color: #28a745;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-right: 16px;
}

.success-text {
  flex-grow: 1;
}

.success-text h3 {
  margin: 0 0 4px 0;
  color: #28a745;
}

.success-text p {
  margin: 0;
  color: #495057;
}

.success-actions {
  display: flex;
  width: 100%;
  margin-top: 16px;
  justify-content: center;
  gap: 12px;
}

.success-message .campus-btn {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.success-message .close-btn {
  background-color: #6c757d;
}

.success-message .campus-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .campus-contribution {
    padding: 16px;
  }
  
  .contribution-form {
    padding: 16px;
  }
}
</style>
