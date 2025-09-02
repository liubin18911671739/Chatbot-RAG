<template>
  <div class="mock-chat-test-view">
    <MockChatTest />
  </div>
</template>

<script>
import MockChatTest from '../components/MockChatTest.vue';

export default {
  name: 'MockChatTestView',
  components: {
    MockChatTest
  }
};
</script>

<style scoped>
.mock-chat-test-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px 0;
}
</style>