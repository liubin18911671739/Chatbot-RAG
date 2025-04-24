<template>
  <div class="typewriter-container">
    <div v-if="typing && !htmlContent" class="typewriter-plain">
      <span 
        v-for="(char, index) in displayedText" 
        :key="index"
        class="typewriter-char"
        :style="{ '--char-index': index }"
      >{{ char }}</span>
      <span class="typewriter-cursor" :class="{ 'blink': cursorVisible && isFinished }"></span>
    </div>
    <div v-else-if="typing && htmlContent" class="typewriter-html" v-html="processedHtml"></div>
    <div v-else v-html="content"></div>
  </div>
</template>

<script>
import { ref, onMounted, watch, computed } from 'vue';

export default {
  name: 'TypewriterText',
  props: {
    content: {
      type: String,
      required: true
    },
    typing: {
      type: Boolean,
      default: true
    },
    speed: {
      type: Number,
      default: 20 // 字符输出速度(ms)
    },
    startDelay: {
      type: Number,
      default: 300 // 开始打字前的延迟(ms)
    },
    htmlContent: {
      type: Boolean,
      default: false
    }
  },
  emits: ['typing-finished'],
  setup(props, { emit }) {
    const displayedText = ref('');
    const processedHtml = ref('');
    const typingInterval = ref(null);
    const currentIndex = ref(0);
    const isFinished = ref(false);
    const cursorVisible = ref(true);

    // 开始打字效果
    const startTyping = () => {
      if (!props.typing) return;

      clearInterval(typingInterval.value);
      currentIndex.value = 0;
      displayedText.value = '';
      processedHtml.value = '';
      isFinished.value = false;

      // 开始打字动画的延迟
      setTimeout(() => {
        if (props.htmlContent) {
          // HTML内容处理
          typingHTML();
        } else {
          // 纯文本处理
          typingInterval.value = setInterval(() => {
            if (currentIndex.value < props.content.length) {
              displayedText.value += props.content[currentIndex.value];
              currentIndex.value++;
            } else {
              clearInterval(typingInterval.value);
              isFinished.value = true;
              emit('typing-finished');
            }
          }, props.speed);
        }
      }, props.startDelay);

      // 闪烁光标效果
      setInterval(() => {
        cursorVisible.value = !cursorVisible.value;
      }, 500);
    };

    // 处理HTML内容
    const typingHTML = () => {
      const content = props.content;
      const totalChars = stripHtml(content).length;
      let plainTextIndex = 0;
      let htmlIndex = 0;
      
      // 这个函数将逐步显示HTML内容，保留HTML标签
      const processNextChar = () => {
        if (plainTextIndex >= totalChars) {
          isFinished.value = true;
          emit('typing-finished');
          return;
        }

        let tagStartIndex = content.indexOf('<', htmlIndex);
        let tagEndIndex = content.indexOf('>', htmlIndex);

        if (tagStartIndex !== -1 && tagStartIndex <= htmlIndex) {
          // 如果当前位置是标签的开始，直接添加整个标签
          processedHtml.value += content.substring(htmlIndex, tagEndIndex + 1);
          htmlIndex = tagEndIndex + 1;
        } else {
          // 添加一个普通字符
          processedHtml.value += content.charAt(htmlIndex);
          htmlIndex++;
          plainTextIndex++;
        }

        // 继续处理下一个字符
        setTimeout(processNextChar, props.speed);
      };

      // 开始处理
      processNextChar();
    };

    // 移除HTML标签，获取纯文本长度
    const stripHtml = (html) => {
      return html.replace(/<[^>]*>?/gm, '');
    };

    // 监听内容变化，重新开始打字效果
    watch(() => props.content, () => {
      startTyping();
    });

    // 监听typing属性变化
    watch(() => props.typing, (newValue) => {
      if (newValue) {
        startTyping();
      } else {
        clearInterval(typingInterval.value);
        displayedText.value = props.content;
        processedHtml.value = props.content;
        isFinished.value = true;
      }
    });

    // 组件挂载时启动
    onMounted(() => {
      startTyping();
    });

    return {
      displayedText,
      processedHtml,
      isFinished,
      cursorVisible
    };
  }
};
</script>

<style scoped>
.typewriter-container {
  position: relative;
  width: 100%;
}

.typewriter-char {
  display: inline-block;
  opacity: 0;
  animation: typing-effect 0.02s forwards;
  animation-delay: calc(var(--char-index, 0) * 0.005s);
}

.typewriter-cursor {
  display: inline-block;
  width: 2px;
  height: 1.2em;
  background-color: #333;
  vertical-align: middle;
  margin-left: 2px;
}

.typewriter-cursor.blink {
  animation: blink 0.7s infinite;
}

@keyframes typing-effect {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

.typewriter-plain, .typewriter-html {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>