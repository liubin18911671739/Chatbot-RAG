<|vq_15066|>### ChatBox.vue

<template>
  <div class="chat-box">
    <div class="chat-history">
      <HistoryPanel :messages="messages" />
    </div>
    <div class="input-area">
      <InputBox v-model="userInput" @send="sendMessage" />
    </div>
    <div class="response-area">
      <ResponseRenderer :response="response" />
    </div>
  </div>
</template>

<script>
import HistoryPanel from './HistoryPanel.vue';
import InputBox from './InputBox.vue';
import ResponseRenderer from './ResponseRenderer.vue';

export default {
  components: {
    HistoryPanel,
    InputBox,
    ResponseRenderer,
  },
  data() {
    return {
      userInput: '',
      messages: [],
      response: null,
    };
  },
  methods: {
    async sendMessage() {
      if (this.userInput.trim() === '') return;

      this.messages.push({ sender: 'user', text: this.userInput });
      const reply = await this.fetchResponse(this.userInput);
      this.messages.push({ sender: 'agent', text: reply });
      this.response = reply;
      this.userInput = '';
    },
    async fetchResponse(input) {
      // Placeholder for API call to fetch response from the backend
      // This should be replaced with actual API interaction logic
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(`Response to: ${input}`);
        }, 1000);
      });
    },
  },
};
</script>

<style scoped>
.chat-box {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-history {
  flex: 1;
  overflow-y: auto;
}

.input-area {
  margin-top: 10px;
}

.response-area {
  margin-top: 10px;
}
</style>