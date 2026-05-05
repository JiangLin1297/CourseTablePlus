<template>
  <scroll-view scroll-y class="container">
    <!-- 学期核心设置 -->
    <view class="section">
      <text class="section-title">📅 学期核心设置</text>
      <view class="form-row">
        <text>当前第</text>
        <input class="num-input" v-model.number="currentWeek" type="number" />
        <text>周 / 共</text>
        <input class="num-input" v-model.number="totalWeeks" type="number" />
        <text>周</text>
      </view>
      <view class="form-row">
        <text>学期开始于</text>
        <picker mode="date" :value="startDate" @change="onStartDateChange">
          {{ startDate }}
        </picker>
      </view>
      <text class="auto-tip">正确设置后，每周边能与真实日期对应</text>
    </view>

    <!-- 一键生成节次 -->
    <view class="section">
      <text class="section-title">⚙️ 一键生成节次时间</text>
      <view class="auto-row">
        <text>每节课</text>
        <input class="num-input" v-model.number="autoDuration" type="number" />
        <text>分钟</text>
      </view>
      <view class="auto-row">
        <text>课间</text>
        <input class="num-input" v-model.number="autoBreak" type="number" />
        <text>分钟</text>
      </view>
      <view class="auto-row">
        <text>第一节开始</text>
        <TimePicker v-model="autoStartTime" />
      </view>
      <button class="auto-btn" @click="autoGenerate">✨ 一键生成并更新列表</button>
      <text class="auto-tip">生成后下方列表自动刷新，可手动微调</text>
    </view>

    <!-- 手动微调节次 -->
    <view class="section">
      <text class="section-title">🕐 手动调整（当前：第{{ editingPeriod }}节）</text>
      <view class="form-row">
        <text>开始</text>
        <TimePicker v-model="editingStart" @update:modelValue="onStartChange" />
      </view>
      <view class="form-row">
        <text>结束</text>
        <TimePicker v-model="editingEnd" @update:modelValue="onEndChange" />
      </view>
      
      <view class="period-list">
        <view 
          v-for="p in periods" :key="p.id"
          class="period-item" :class="{ active: editingPeriod === p.id }"
          @click="selectPeriod(p)"
        >
          <text class="period-id">{{ p.id }}</text>
          <text class="period-time">{{ p.start }} - {{ p.end }}</text>
        </view>
      </view>
    </view>

    <button class="save-btn" @click="saveAll">💾 保存并应用到课表</button>
    <view style="height: 30rpx;"></view>
  </scroll-view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import TimePicker from '@/components/TimePicker.vue'

const currentWeek = ref(9)
const totalWeeks = ref(16)
const startDate = ref('2026-02-23')

const autoDuration = ref(45)
const autoBreak = ref(5)
const autoStartTime = ref('08:00')

const editingPeriod = ref(1)
const editingStart = ref('08:45')
const editingEnd = ref('09:30')

const defaultPeriods = [
  { id: 1, start: '08:45', end: '09:30' }, { id: 2, start: '09:00', end: '09:45' },
  { id: 3, start: '10:25', end: '11:10' }, { id: 4, start: '14:00', end: '14:45' },
  { id: 5, start: '14:00', end: '14:45' }, { id: 6, start: '15:15', end: '16:00' },
  { id: 7, start: '16:25', end: '17:10' }, { id: 8, start: '19:15', end: '20:00' },
  { id: 9, start: '20:10', end: '20:55' }, { id: 10, start: '21:05', end: '21:50' },
  { id: 11, start: '21:55', end: '22:40' }
]
const periods = ref([])

onMounted(() => {
  const cachePeriods = uni.getStorageSync('periods')
  periods.value = cachePeriods && cachePeriods.length ? cachePeriods : [...defaultPeriods]
  const weekCache = uni.getStorageSync('weekConfig')
  if (weekCache) {
    currentWeek.value = weekCache.current || 9
    totalWeeks.value = weekCache.total || 16
    startDate.value = weekCache.startDate || '2026-02-23'
  }
  if (periods.value.length > 0) selectPeriod(periods.value[0])
})

function selectPeriod(p) {
  editingPeriod.value = p.id
  editingStart.value = p.start
  editingEnd.value = p.end
}

function onStartChange(val) { 
  editingStart.value = val
  const p = periods.value.find(p => p.id === editingPeriod.value)
  if (p) p.start = val
}
function onEndChange(val) {
  editingEnd.value = val
  const p = periods.value.find(p => p.id === editingPeriod.value)
  if (p) p.end = val
}
function onStartDateChange(e) { startDate.value = e.detail.value }

function autoGenerate() {
  const duration = autoDuration.value
  const breakTime = autoBreak.value
  const startStr = autoStartTime.value
  if (!duration || duration < 1) {
    uni.showToast({ title: '请填写课程时长', icon: 'none' })
    return
  }
  const [startH, startM] = startStr.split(':').map(Number)
  let currentMinutes = startH * 60 + startM
  const newPeriods = []
  for (let i = 1; i <= 11; i++) {
    const startMin = currentMinutes
    const endMin = startMin + duration
    newPeriods.push({
      id: i,
      start: `${pad(Math.floor(startMin / 60))}:${pad(startMin % 60)}`,
      end: `${pad(Math.floor(endMin / 60))}:${pad(endMin % 60)}`
    })
    currentMinutes = endMin + breakTime
  }
  periods.value = newPeriods
  selectPeriod(newPeriods[0])
  uni.showToast({ title: '已生成并更新列表', icon: 'success' })
}

function pad(num) { return num < 10 ? '0' + num : '' + num }

function saveAll() {
  for (let i = 0; i < periods.value.length - 1; i++) {
    if (periods.value[i].start >= periods.value[i].end) {
      uni.showToast({ title: `第${periods.value[i].id}节时间错误`, icon: 'none' })
      return
    }
  }
  uni.setStorageSync('periods', periods.value)
  uni.setStorageSync('weekConfig', {
    current: currentWeek.value,
    total: totalWeeks.value,
    startDate: startDate.value
  })
  uni.showToast({ title: '设置已保存', icon: 'success' })
  setTimeout(() => uni.navigateBack(), 800)
}
</script>

<style scoped>
.container { padding: 20rpx; height: 100vh; background: #f5f6fa; }
.section { background: #fff; border-radius: 12rpx; padding: 25rpx; margin-bottom: 20rpx; }
.section-title { font-size: 30rpx; font-weight: bold; display: block; margin-bottom: 20rpx; }
.form-row { display: flex; align-items: center; font-size: 26rpx; margin-bottom: 15rpx; }
.num-input { width: 100rpx; border: 1px solid #ddd; border-radius: 8rpx; text-align: center; margin: 0 8rpx; padding: 6rpx; font-size: 26rpx; }
.auto-row { display: flex; align-items: center; margin-bottom: 15rpx; font-size: 26rpx; }
.auto-btn { background: #4A90E2; color: #fff; margin-top: 20rpx; border-radius: 40rpx; font-size: 28rpx; }
.auto-tip { display: block; font-size: 22rpx; color: #999; margin-top: 10rpx; }
.period-list { display: flex; flex-wrap: wrap; margin-top: 15rpx; }
.period-item { width: 30%; padding: 15rpx 0; text-align: center; border-radius: 8rpx; margin: 5rpx; background: #f0f0f0; }
.period-item.active { background: #4A90E2; color: #fff; }
.period-id { font-size: 28rpx; font-weight: bold; display: block; }
.period-time { font-size: 20rpx; display: block; }
.save-btn { background: #4A90E2; color: #fff; margin: 10rpx 20rpx; border-radius: 50rpx; }
</style>