<template>
  <div class="admin-view">
    <h1>管理员界面</h1>
    <div class="admin-controls">
      <button @click="fetchUserList">获取用户列表</button>
      <button @click="fetchDocumentList">获取文档列表</button>
    </div>
    <div class="user-list">
      <h2>用户列表</h2>
      <ul>
        <li v-for="user in users" :key="user.id">{{ user.username }}</li>
      </ul>
    </div>
    <div class="document-list">
      <h2>文档列表</h2>
      <ul>
        <li v-for="document in documents" :key="document.id">{{ document.title }}</li>
      </ul>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'AdminView',
  data() {
    return {
      users: [],
      documents: []
    };
  },
  computed: {
    ...mapState('auth', ['isAdmin'])
  },
  methods: {
    async fetchUserList() {
      // 调用API获取用户列表
      try {
        const response = await this.$http.get('/api/admin/users');
        this.users = response.data;
      } catch (error) {
        console.error('获取用户列表失败:', error);
      }
    },
    async fetchDocumentList() {
      // 调用API获取文档列表
      try {
        const response = await this.$http.get('/api/admin/documents');
        this.documents = response.data;
      } catch (error) {
        console.error('获取文档列表失败:', error);
      }
    }
  },
  mounted() {
    if (this.isAdmin) {
      this.fetchUserList();
      this.fetchDocumentList();
    } else {
      this.$router.push('/login');
    }
  }
};
</script>

<style scoped>
.admin-view {
  padding: 20px;
}
.admin-controls {
  margin-bottom: 20px;
}
.user-list, .document-list {
  margin-top: 20px;
}
</style>