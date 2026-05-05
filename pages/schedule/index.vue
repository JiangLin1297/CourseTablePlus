<template>
  <view class="container">
    <!-- 顶部 Tab：今天 / 本周 / 全部 -->
    <view class="top-tabs">
      <view 
        v-for="tab in tabs" :key="tab.key"
        class="tab-item" :class="{ active: currentTab === tab.key }"
        @click="switchTab(tab.key)"
      >
        {{ tab.label }}
      </view>
    </view>

    <!-- 任务列表 -->
    <scroll-view scroll-y class="task-list">
      <view v-if="filteredTasks.length === 0" class="empty-tip">
        暂无日程，去课表里添加任务吧～
      </view>
      <view v-for="task in filteredTasks" :key="task._id" class="task-card" :class="task.type">
        <view class="task-type-badge">{{ task.type === 'exam' ? '考试' : '大作业' }}</view>
        <view class="task-info">
          <text class="task-title">{{ task.title }}</text>
          <text class="task-course">{{ task.courseName }}</text>
          <text class="task-deadline">截止：{{ formatDate(task.deadline) }}</text>
        </view>
        <checkbox :checked="task.completed" @click="toggleTask(task._id)" />
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const tabs = [
  { key: 'today', label: '今天' },
  { key: 'week', label: '本周' },
  { key: 'all', label: '全部' }
]
const currentTab = ref('week')
const allTasks = ref([]) // 后续从云数据库加载

const filteredTasks = computed(() => {
  // 以后写过滤逻辑，现在返回空数组占位
  return allTasks.value
})

function switchTab(key) { currentTab.value = key }
function formatDate(dateStr) {
  if (!dateStr) return ''
  return dateStr.slice(0, 10)
}
async function toggleTask(id) {
  // 以后写
}
</script>

<style scoped>
.container { height: 100vh; background: #f5f6fa; display: flex; flex-direction: column; }
.top-tabs { display: flex; background: #fff; border-bottom: 1px solid #eee; }
.tab-item { flex: 1; text-align: center; padding: 25rpx 0; font-size: 28rpx; color: #666; }
.tab-item.active { color: #4A90E2; font-weight: bold; border-bottom: 4rpx solid #4A90E2; }
.task-list { flex: 1; padding: 20rpx; }
.empty-tip { text-align: center; margin-top: 200rpx; color: #999; font-size: 28rpx; }
.task-card { display: flex; align-items: center; background: #fff; border-radius: 12rpx; padding: 20rpx; margin-bottom: 15rpx; box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05); }
.task-type-badge { width: 100rpx; height: 50rpx; line-height: 50rpx; text-align: center; border-radius: 25rpx; font-size: 22rpx; color: #fff; margin-right: 15rpx; }
.exam .task-type-badge { background: #E85D75; }
.assignment .task-type-badge { background: #F5A623; }
.task-info { flex: 1; }
.task-title { font-size: 30rpx; font-weight: bold; display: block; }
.task-course { font-size: 24rpx; color: #999; display: block; margin-top: 4rpx; }
.task-deadline { font-size: 24rpx; color: #E85D75; display: block; margin-top: 4rpx; }
</style>