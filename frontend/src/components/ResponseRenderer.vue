<template>
  <div class="response-renderer">
    <div v-if="response.text" class="text-response">
      <p>{{ response.text }}</p>
    </div>
    <div v-if="response.images && response.images.length" class="image-response">
      <img v-for="(image, index) in response.images" :key="index" :src="image" alt="Response Image" />
    </div>
    <div v-if="response.charts && response.charts.length" class="chart-response">
      <chart-component v-for="(chart, index) in response.charts" :key="index" :data="chart.data" :options="chart.options" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'ResponseRenderer',
  props: {
    response: {
      type: Object,
      required: true
    }
  }
}
</script>

<style scoped>
.response-renderer {
  margin: 20px 0;
}

.text-response {
  font-size: 16px;
  color: #333;
}

.image-response {
  display: flex;
  flex-wrap: wrap;
}

.image-response img {
  max-width: 100%;
  height: auto;
  margin: 5px;
}

.chart-response {
  margin-top: 10px;
}
</style>