<template>
  <view class="timetable-container">
    <!-- 顶部信息栏 -->
    <view class="top-bar">
      <view class="top-left">
        <text class="week-info">
          第{{ activeWeek }}周
          <text v-if="!isCurrentWeek" class="non-current-tag">（非本周）</text>
        </text>
        <text class="date-info">{{ activeWeekDateRange }}</text>
      </view>
      <view class="top-right">
        <text class="top-btn" @click="addCourse">➕ 添加</text>
        <text class="top-btn" @click="importCourse">📥 导入</text>
        <text class="top-btn" @click="shareSchedule">📤 分享</text>
        <text class="top-btn" @click="showMore">⋯</text>
      </view>
    </view>

    <!-- 整页滑动课表（swiper 方案） -->
    <swiper
      class="schedule-swiper"
      :current="swiperCurrent"
      :duration="250"
      :easing-function="'easeInOutCubic'"
      @change="onSwiperChange"
      @animationfinish="onAnimationFinish"
      :style="{ height: swiperHeight }"
    >
      <swiper-item v-for="week in weekViewList" :key="week.weekNum">
        <scroll-view scroll-y style="height: 100%;" enable-flex>
          <view class="week-block" :style="{ width: screenWidth + 'px' }">
            <!-- 月份 + 日期行 -->
            <view class="date-header-bar">
              <view class="date-header-left" :style="{ width: timeAxisWidth + 'px' }">
                <text class="month-big">{{ week.month }}月</text>
              </view>
              <view class="date-header-days">
                <view
                  v-for="(day, di) in week.days"
                  :key="di"
                  class="date-header-item"
                  :style="{ width: dayColWidth + 'px' }"
                >
                  <text class="day-name">{{ day.name }}</text>
                  <text class="day-date">{{ day.date }}</text>
                </view>
              </view>
            </view>

            <!-- 课表网格：时间轴 + 七天列 -->
            <view class="schedule-grid">
              <view class="time-axis" :style="{ width: timeAxisWidth + 'px' }">
                <view
                  v-for="p in periods"
                  :key="p.id"
                  class="time-slot"
                  @click="editPeriod(p)"
                >
                  <text class="period-num">{{ p.id }}</text>
                  <text class="period-time">{{ p.start }}-{{ p.end }}</text>
                </view>
              </view>
              <view class="day-columns">
                <view
                  v-for="(day, di) in week.days"
                  :key="di"
                  class="day-column"
                  :style="{ width: dayColWidth + 'px' }"
                >
                  <view
                    v-for="course in day.courses"
                    :key="course._id"
                    class="course-card"
                    :class="{ inactive: !isCourseActive(course, week.weekNum) }"
                    :style="getCardStyle(course)"
                    @click="goDetail(course._id)"
                  >
                    <text class="course-name">{{ course.name }}</text>
                    <text class="course-location">{{ course.teacher || course.location }}</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </scroll-view>
      </swiper-item>
    </swiper>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getDatabase } from '@/common/cloud.js'

const db = getDatabase()
const allCourses = ref([])

const defaultPeriods = [
  { id: 1, start: '08:45', end: '09:30' }, { id: 2, start: '09:00', end: '09:45' },
  { id: 3, start: '10:25', end: '11:10' }, { id: 4, start: '14:00', end: '14:45' },
  { id: 5, start: '14:00', end: '14:45' }, { id: 6, start: '15:15', end: '16:00' },
  { id: 7, start: '16:25', end: '17:10' }, { id: 8, start: '19:15', end: '20:00' },
  { id: 9, start: '20:10', end: '20:55' }, { id: 10, start: '21:05', end: '21:50' },
  { id: 11, start: '21:55', end: '22:40' }
]
const periods = ref([...defaultPeriods])
const weekConfig = ref({ current: 1, total: 20, startDate: '2026-02-23' })

// 屏幕尺寸
const systemInfo = uni.getSystemInfoSync()
const screenWidth = systemInfo.screenWidth
const swiperHeight = systemInfo.windowHeight - uni.upx2px(88) + 'px'
const timeAxisWidth = 60
const dayColWidth = Math.floor((screenWidth - timeAxisWidth) / 7)

const SLOT_HEIGHT = 90

// swiper 当前索引
const swiperCurrent = ref(0)
// 顶部显示的当前周数
const activeWeek = ref(1)
const isCurrentWeek = ref(false)
const weekViewList = ref([])

// 当前真实周（基于学期起始日计算）
function getRealCurrentWeek() {
  if (!weekConfig.value.startDate) return 1
  const [y, m, d] = weekConfig.value.startDate.split('-').map(Number)
  const startMonday = new Date(y, m - 1, d)
  const now = new Date()
  const diffDays = Math.floor((now - startMonday) / (1000 * 60 * 60 * 24))
  return Math.floor(diffDays / 7) + 1
}

function isCourseActive(course, weekNum) {
  // 优先使用 weeks 数组
  if (course.weeks && Array.isArray(course.weeks) && course.weeks.length > 0) {
    return course.weeks.map(Number).includes(weekNum)
  }
  // 兼容旧数据
  const start = Number(course.weekStart) || 1
  const end = Number(course.weekEnd) || weekConfig.value.total
  return weekNum >= start && weekNum <= end
}

function buildWeekData(weekNum) {
  const dayNames = ['周一','周二','周三','周四','周五','周六','周日']
  if (!weekConfig.value.startDate) return []
  const [y, m, d] = weekConfig.value.startDate.split('-').map(Number)
  const startMonday = new Date(y, m - 1, d)
  const monday = new Date(startMonday)
  monday.setDate(startMonday.getDate() + (weekNum - 1) * 7)

  const days = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    days.push({
      name: dayNames[i],
      date: date.getDate(),
      month: date.getMonth() + 1,
      courses: []
    })
  }

  allCourses.value.forEach(course => {
    const dayIdx = Number(course.day) - 1
    if (dayIdx >= 0 && dayIdx < 7) {
      days[dayIdx].courses.push(course)
    }
  })

  const monthCount = {}
  days.forEach(d => monthCount[d.month] = (monthCount[d.month] || 0) + 1)
  const mainMonth = Object.keys(monthCount).reduce((a, b) => monthCount[a] > monthCount[b] ? a : b)

  return { weekNum, month: mainMonth, days }
}

function rebuildAllWeeks() {
  const total = weekConfig.value.total
  const newWeeks = []
  for (let w = 1; w <= total; w++) {
    newWeeks.push(buildWeekData(w))
  }
  weekViewList.value = newWeeks
}

const activeWeekDateRange = computed(() => {
  const week = weekViewList.value.find(w => w.weekNum === activeWeek.value)
  if (week && week.days.length) {
    return `${week.days[0].date}日 - ${week.days[6].date}日`
  }
  return ''
})

// swiper 切换事件：滑动过程中实时更新顶部周数
function onSwiperChange(e) {
  const index = e.detail.current
  const week = weekViewList.value[index]?.weekNum || 1
  activeWeek.value = week
  isCurrentWeek.value = (week === getRealCurrentWeek())
}

// 动画完成事件：兜底确保当前周正确
function onAnimationFinish(e) {
  const index = e.detail.current
  const week = weekViewList.value[index]?.weekNum || 1
  activeWeek.value = week
  isCurrentWeek.value = (week === getRealCurrentWeek())
}

// 初始化
async function initAll() {
  try {
    const res = await db.collection('courses').get()
    allCourses.value = res.data
  } catch (e) {
    console.error('加载课程失败', e)
  }

  const cache = uni.getStorageSync('periods')
  if (cache) periods.value = cache
  const weekCache = uni.getStorageSync('weekConfig')
  if (weekCache) weekConfig.value = weekCache

  rebuildAllWeeks()

  const realWeek = getRealCurrentWeek()
  // 计算真实本周在数组中的索引（索引 = 周数 - 1）
  const targetIndex = realWeek - 1
  swiperCurrent.value = Math.max(0, Math.min(targetIndex, weekViewList.value.length - 1))
  activeWeek.value = realWeek
  isCurrentWeek.value = true
}

onMounted(() => {
  initAll()
  uni.$on('courseUpdated', initAll)
})

onBeforeUnmount(() => {
  uni.$off('courseUpdated')
})

onShow(async () => {
  try {
    const res = await db.collection('courses').get()
    allCourses.value = res.data
    rebuildAllWeeks()
  } catch (e) {
    console.error('刷新课程失败', e)
  }
})

// 节次编辑
function editPeriod(p) {
  uni.showModal({
    title: `修改第${p.id}节`,
    editable: true,
    placeholderText: '08:00-08:45',
    content: `${p.start}-${p.end}`,
    success: (res) => {
      if (res.confirm && res.content) {
        const parts = res.content.split('-')
        if (parts.length === 2 && parts[0].trim().length === 5 && parts[1].trim().length === 5) {
          p.start = parts[0].trim()
          p.end = parts[1].trim()
          uni.setStorageSync('periods', periods.value)
        }
      }
    }
  })
}

function getCardStyle(course) {
  const p = course.periods && course.periods.length ? course.periods : [1]
  const sorted = [...p].sort((a, b) => a - b)
  const top = (sorted[0] - 1) * SLOT_HEIGHT
  const height = (sorted[sorted.length - 1] - sorted[0] + 1) * SLOT_HEIGHT
  return {
    top: top + 'px',
    height: height + 'px',
    backgroundColor: course.color || '#4A90E2'
  }
}

// 按钮操作
function goDetail(id) {
  uni.navigateTo({ url: `/pages/course-detail/index?id=${id}` })
}
function addCourse() { uni.navigateTo({ url: '/pages/add-course/index' }) }
function importCourse() { uni.showToast({ title: '教务导入尚未开放', icon: 'none' }) }
function shareSchedule() { uni.showToast({ title: '分享功能预留', icon: 'none' }) }
function showMore() {
  uni.showActionSheet({
    itemList: ['设置', '关于'],
    success(res) {
      if (res.tapIndex === 0) uni.navigateTo({ url: '/pages/settings/index' })
    }
  })
}
</script>

<style scoped>
.timetable-container { height: 100vh; display: flex; flex-direction: column; background: #f5f6fa; }
.top-bar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 15rpx 20rpx; background: #4A90E2; color: #fff; flex-shrink: 0;
}
.top-left { display: flex; flex-direction: column; }
.week-info { font-size: 30rpx; font-weight: bold; }
.non-current-tag { font-size: 22rpx; color: #FFE66D; margin-left: 8rpx; }
.date-info { font-size: 24rpx; opacity: 0.9; margin-top: 2rpx; }
.top-right { display: flex; gap: 15rpx; }
.top-btn {
  font-size: 26rpx; padding: 6rpx 12rpx;
  background: rgba(255,255,255,0.2); border-radius: 8rpx;
}

.schedule-swiper { flex: 1; overflow: hidden; }

.week-block {
  display: flex;
  flex-direction: column;
  height: auto;
}

.date-header-bar { display: flex; align-items: center; background: #fff; border-bottom: 1px solid #eee; flex-shrink: 0; }
.date-header-left { padding: 5px 0; text-align: center; border-right: 1px solid #eee; }
.month-big { font-size: 24px; font-weight: bold; color: #333; }
.date-header-days { flex: 1; display: flex; }
.date-header-item { text-align: center; padding: 5px 0; }
.day-name { font-size: 14px; color: #666; display: block; }
.day-date { font-size: 20px; font-weight: bold; color: #333; display: block; margin-top: 2px; }

.schedule-grid { display: flex; flex: 1; }
.time-axis { flex-shrink: 0; background: #f9f9f9; }
.time-slot {
  height: 90px; display: flex; flex-direction: column;
  align-items: center; justify-content: center; border-bottom: 1px solid #eee;
}
.period-num { font-size: 18px; font-weight: bold; color: #4A90E2; }
.period-time { font-size: 11px; color: #999; margin-top: 2px; }
.day-columns { display: flex; flex: 1; }
.day-column { position: relative; height: 990px; border-right: 1px solid #eee; }

.course-card {
  position: absolute; left: 1px; right: 1px; border-radius: 4px;
  padding: 2px 2px; overflow: hidden; display: flex;
  flex-direction: column; justify-content: center;
}
.course-name { font-size: 12px; font-weight: bold; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.course-location { font-size: 10px; color: rgba(255,255,255,0.85); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.inactive { opacity: 0.4; filter: grayscale(100%); }
</style>