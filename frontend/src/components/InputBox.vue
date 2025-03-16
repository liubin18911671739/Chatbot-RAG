<template>
  <div class="input-box">
    <textarea
      ref="inputField"
      v-model="input"
      :disabled="disabled"
      @keydown.enter.prevent="onEnterPress"
      :placeholder="placeholder"
      class="input-textarea"
      rows="2"
    ></textarea>
    <div class="button-container">
      <button
        @click="sendMessage"
        :disabled="!canSend || disabled"
        class="send-button"
      >
        <span v-if="loading">发送中...</span>
        <span v-else>发送</span>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'InputBox',
  props: {
    placeholder: {
      type: String,
      default: '请输入您的问题...'
    },
    disabled: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      input: ''
    }
  },
  computed: {
    canSend() {
      return this.input.trim().length > 0
    }
  },
  methods: {
    sendMessage() {
      if (!this.canSend || this.disabled) return
      
      const message = this.input.trim()
      this.$emit('send', message)
      this.input = ''
      
      // 聚焦回输入框
      this.$nextTick(() => {
        this.$refs.inputField.focus()
      })
    },
    onEnterPress(event) {
      // 当按下Shift+Enter时，允许换行
      if (event.shiftKey) return
      
      // 普通Enter键直接发送
      event.preventDefault()
      this.sendMessage()
    },
    // 提供一个公共方法让父组件可以设置输入框内容
    setInput(text) {
      this.input = text
    },
    // 提供一个公共方法让父组件可以聚焦输入框
    focus() {
      this.$refs.inputField.focus()
    }
  }
}
</script>

<style scoped>
.input-box {
  display: flex;
  flex-direction: column;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 10px;
  background-color: #ffffff;
}

.input-textarea {
  width: 100%;
  border: none;
  resize: none;
  outline: none;
  font-size: 16px;
  line-height: 1.5;
  font-family: inherit;
  padding: 8px 0;
}

.input-textarea:disabled {
  background-color: #f9f9f9;
  color: #999;
}

.button-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.send-button {
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.send-button:hover:not(:disabled) {
  background-color: #45a049;
}

.send-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style>