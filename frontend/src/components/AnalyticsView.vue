<template>
  <div class="analytics-view">
    <div class="analytics-header">
      <h2>检索词统计分析</h2>
      <div class="time-selector">
        <el-select v-model="selectedDays" @change="fetchAllData" placeholder="选择时间范围">
          <el-option label="最近7天" :value="7"></el-option>
          <el-option label="最近30天" :value="30"></el-option>
          <el-option label="最近90天" :value="90"></el-option>
        </el-select>
        <el-button @click="exportData" type="primary" icon="Download" :loading="isExporting">
          导出数据
        </el-button>
      </div>
    </div>

    <!-- 统计概览卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-number">{{ statsOverview.total_searches }}</div>
        <div class="stat-label">总搜索次数</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ statsOverview.unique_users }}</div>
        <div class="stat-label">独立用户</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ statsOverview.avg_response_time }}ms</div>
        <div class="stat-label">平均响应时间</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ statsOverview.success_rate }}%</div>
        <div class="stat-label">成功率</div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-container">
      <!-- 时间趋势图 -->
      <div class="chart-panel">
        <h3>搜索趋势</h3>
        <div id="timeSeriesChart" style="height: 300px;"></div>
      </div>

      <!-- 场景分布饼图 -->
      <div class="chart-panel">
        <h3>场景分布</h3>
        <div id="sceneDistributionChart" style="height: 300px;"></div>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="data-tables">
      <!-- 热门查询表格 -->
      <div class="table-panel">
        <h3>热门查询</h3>
        <el-table :data="popularQueries" stripe v-loading="isLoading">
          <el-table-column prop="query" label="查询内容" width="300">
            <template #default="scope">
              <el-tooltip :content="scope.row.query" placement="top">
                <span class="query-text">{{ scope.row.query }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column prop="count" label="次数" width="100" sortable></el-table-column>
          <el-table-column prop="last_searched" label="最近搜索" width="180">
            <template #default="scope">
              {{ formatDate(scope.row.last_searched) }}
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 热门关键词表格 -->
      <div class="table-panel">
        <h3>趋势关键词</h3>
        <div class="keywords-cloud" v-loading="isLoading">
          <span
            v-for="keyword in trendingKeywords"
            :key="keyword.keyword"
            class="keyword-tag"
            :style="{ fontSize: getKeywordSize(keyword.count) + 'px' }"
          >
            {{ keyword.keyword }}
            <span class="keyword-count">({{ keyword.count }})</span>
          </span>
          <div v-if="trendingKeywords.length === 0" class="empty-keywords">
            暂无关键词数据
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import axios from 'axios'

// 响应式数据
const selectedDays = ref(7)
const isLoading = ref(false)
const isExporting = ref(false)
const statsOverview = ref({
  total_searches: 0,
  unique_users: 0,
  avg_response_time: 0,
  success_rate: 0
})
const popularQueries = ref([])
const trendingKeywords = ref([])
const sceneDistribution = ref([])
const timeSeriesData = ref([])

// ECharts 实例
let timeSeriesChart = null
let sceneChart = null

// 生命周期
onMounted(async () => {
  await nextTick()
  initCharts()
  fetchAllData()
})

// 方法
const fetchAllData = async () => {
  isLoading.value = true
  try {
    await Promise.all([
      fetchStatsOverview(),
      fetchPopularQueries(),
      fetchTrendingKeywords(),
      fetchSceneDistribution(),
      fetchTimeSeriesData()
    ])
    updateCharts()
  } catch (error) {
    console.error('获取数据失败:', error)
    const errorMessage = error.response && error.response.data && error.response.data.message
      ? error.response.data.message
      : error.message
    ElMessage.error('获取数据失败: ' + errorMessage)
  } finally {
    isLoading.value = false
  }
}

const fetchStatsOverview = async () => {
  const response = await axios.get(`/api/analytics/search-stats?days=${selectedDays.value}`)
  if (response.data.status === 'success') {
    statsOverview.value = response.data.data
  }
}

const fetchPopularQueries = async () => {
  const response = await axios.get(`/api/analytics/popular-queries?days=${selectedDays.value}&limit=20`)
  if (response.data.status === 'success') {
    popularQueries.value = response.data.data
  }
}

const fetchTrendingKeywords = async () => {
  const response = await axios.get(`/api/analytics/trending-keywords?limit=30`)
  if (response.data.status === 'success') {
    trendingKeywords.value = response.data.data
  }
}

const fetchSceneDistribution = async () => {
  const response = await axios.get(`/api/analytics/scene-distribution?days=${selectedDays.value}`)
  if (response.data.status === 'success') {
    sceneDistribution.value = response.data.data
  }
}

const fetchTimeSeriesData = async () => {
  const response = await axios.get(`/api/analytics/time-series?days=${selectedDays.value}`)
  if (response.data.status === 'success') {
    timeSeriesData.value = response.data.data
  }
}

const initCharts = () => {
  // 初始化时间序列图
  const timeSeriesElement = document.getElementById('timeSeriesChart')
  if (timeSeriesElement) {
    timeSeriesChart = echarts.init(timeSeriesElement)
  }

  // 初始化场景分布图
  const sceneElement = document.getElementById('sceneDistributionChart')
  if (sceneElement) {
    sceneChart = echarts.init(sceneElement)
  }
}

const updateCharts = () => {
  // 更新时间序列图
  if (timeSeriesChart && timeSeriesData.value.length > 0) {
    const timeSeriesOption = {
      title: {
        text: '搜索量趋势',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        formatter: function (params) {
          const date = new Date(params[0].value[0])
          return `${date.toLocaleString()}<br/>搜索次数: ${params[0].value[1]}`
        }
      },
      xAxis: {
        type: 'time',
        splitLine: {
          show: false
        }
      },
      yAxis: {
        type: 'value'
      },
      series: [{
        name: '搜索次数',
        type: 'line',
        smooth: true,
        data: timeSeriesData.value.map(item => [item.time, item.count]),
        areaStyle: {
          opacity: 0.3
        },
        lineStyle: {
          color: '#409eff'
        },
        areaStyle: {
          color: '#409eff'
        }
      }]
    }
    timeSeriesChart.setOption(timeSeriesOption)
  }

  // 更新场景分布图
  if (sceneChart && sceneDistribution.value.length > 0) {
    const sceneOption = {
      title: {
        text: '场景使用分布',
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left'
      },
      series: [{
        name: '场景分布',
        type: 'pie',
        radius: '60%',
        center: ['50%', '60%'],
        data: sceneDistribution.value.map(item => ({
          name: item.scene_name,
          value: item.count
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    }
    sceneChart.setOption(sceneOption)
  }
}

const getKeywordSize = (count) => {
  const minSize = 12
  const maxSize = 24
  if (trendingKeywords.value.length === 0) return minSize

  const maxCount = Math.max(...trendingKeywords.value.map(k => k.count))
  return minSize + (count / maxCount) * (maxSize - minSize)
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const exportData = async () => {
  isExporting.value = true
  try {
    const response = await axios.get(`/api/analytics/export?days=${selectedDays.value}`, {
      responseType: 'blob'
    })

    const blob = new Blob([response.data], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `search_analytics_${selectedDays.value}days.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    const errorMessage = error.response && error.response.data && error.response.data.message
      ? error.response.data.message
      : error.message
    ElMessage.error('导出失败: ' + errorMessage)
  } finally {
    isExporting.value = false
  }
}
</script>

<style scoped>
.analytics-view {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.analytics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.analytics-header h2 {
  margin: 0;
  color: #333;
}

.time-selector {
  display: flex;
  gap: 10px;
  align-items: center;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
  border: 1px solid #e4e7ed;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.charts-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

@media (max-width: 768px) {
  .charts-container {
    grid-template-columns: 1fr;
  }
}

.chart-panel {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid #e4e7ed;
}

.chart-panel h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
  font-size: 16px;
}

.data-tables {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

@media (max-width: 768px) {
  .data-tables {
    grid-template-columns: 1fr;
  }
}

.table-panel {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid #e4e7ed;
}

.table-panel h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
  font-size: 16px;
}

.query-text {
  display: block;
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.keywords-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  min-height: 100px;
}

.keyword-tag {
  display: inline-block;
  padding: 5px 12px;
  background: #f0f9ff;
  border: 1px solid #409eff;
  border-radius: 20px;
  color: #409eff;
  font-weight: 500;
  transition: all 0.3s;
  cursor: default;
}

.keyword-tag:hover {
  background: #409eff;
  color: white;
  transform: scale(1.05);
}

.keyword-count {
  font-size: 0.8em;
  opacity: 0.8;
}

.empty-keywords {
  color: #999;
  font-style: italic;
  width: 100%;
  text-align: center;
  padding: 40px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .analytics-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .time-selector {
    justify-content: center;
  }

  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>