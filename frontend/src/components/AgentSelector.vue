<template>
  <div class="agent-selector">
    <h2>选择智能体场景</h2>
    <div class="agent-list">
      <div
        v-for="agent in agents"
        :key="agent.id"
        class="agent-item"
        @click="selectAgent(agent)"
      >
        <img :src="agent.image" :alt="agent.name" />
        <span>{{ agent.name }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AgentSelector',
  data() {
    return {
      agents: [
        {
          id: 1,
          name: '通用场景',
          image: require('@/assets/images/agents/general.png'),
        },
        {
          id: 2,
          name: '中阿场景',
          image: require('@/assets/images/agents/china-arab.png'),
        },
        {
          id: 3,
          name: '思政场景',
          image: require('@/assets/images/agents/political.png'),
        },
        {
          id: 4,
          name: '区域国别场景',
          image: require('@/assets/images/agents/region.png'),
        },
        {
          id: 5,
          name: '阿拉伯名人智能体',
          image: require('@/assets/images/agents/arab-figure.png'),
        },
      ],
    };
  },
  methods: {
    selectAgent(agent) {
      this.$emit('agent-selected', agent);
    },
  },
};
</script>

<style scoped>
.agent-selector {
  padding: 20px;
}

.agent-list {
  display: flex;
  flex-direction: column;
}

.agent-item {
  display: flex;
  align-items: center;
  cursor: pointer;
  margin: 10px 0;
}

.agent-item img {
  width: 50px;
  height: 50px;
  margin-right: 10px;
}

.agent-item:hover {
  background-color: #f0f0f0;
}
</style>