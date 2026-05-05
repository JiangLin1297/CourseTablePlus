<template>
  <view class="container">
    <!-- 课程基本信息 -->
    <view class="info-card">
      <text class="course-name">{{ course.name }}</text>
      <view class="info-row">
        <text>👨‍🏫 {{ course.teacher || '未设置' }}</text>
        <text>📍 {{ course.location || '未设置' }}</text>
      </view>
      <view class="info-row">
        <text>📅 {{ dayName }}</text>
        <text>🕐 第{{ periodStr }}节</text>
      </view>
      <view class="info-row">
        <text>📆 第{{ course.weekStart || 1 }}-{{ course.weekEnd || 16 }}周</text>
      </view>
      <view class="action-btns">
        <button class="btn-small" @click="editCourse">编辑</button>
        <button class="btn-small btn-danger" @click="deleteCourse">删除</button>
      </view>
    </view>

    <!-- 小组区 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">👥 小组</text>
        <button class="btn-add" @click="createGroup">+ 创建小组</button>
      </view>
      <view v-if="groups.length === 0" class="empty">暂无小组，点击上方创建一个吧</view>
      <view v-for="g in groups" :key="g._id" class="group-item" @click="goGroup(g._id)">
        <view class="group-avatar">{{ g.name[0] }}</view>
        <view class="group-info">
          <text class="group-name">{{ g.name }}</text>
          <text class="group-members">{{ g.members ? g.members.length : 0 }} 位成员</text>
        </view>
        <text class="arrow">›</text>
      </view>
    </view>

    <!-- 任务/考试区 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">📋 任务 & 考试</text>
        <button class="btn-add" @click="addTask">+ 添加任务</button>
      </view>
      <view v-if="tasks.length === 0" class="empty">暂无任务，点击上方添加吧</view>
      <view v-for="t in tasks" :key="t._id" class="task-item" :class="t.type">
        <view class="task-type-badge">{{ t.type === 'exam' ? '考试' : '作业' }}</view>
        <view class="task-info">
          <text class="task-title">{{ t.title }}</text>
          <text class="task-desc" v-if="t.description">{{ t.description }}</text>
          <text class="task-deadline">⏰ 截止：{{ formatDeadline(t.deadline) }}</text>
        </view>
        <checkbox :checked="t.completed" @click="toggleTask(t)" />
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getDatabase } from '@/common/cloud.js'

const db = getDatabase()

const courseId = ref('')
const course = ref({})
const groups = ref([])
const tasks = ref([])

const dayNames = ['周一','周二','周三','周四','周五','周六','周日']

const dayName = computed(() => {
  return dayNames[Number(course.value.day) - 1] || '未知'
})

const periodStr = computed(() => {
  if (!course.value.periods || course.value.periods.length === 0) return '未设置'
  const sorted = [...course.value.periods].sort((a,b)=> a-b)
  if (sorted.length === 1) return `${sorted[0]}`
  return `${sorted[0]}-${sorted[sorted.length-1]}`
})

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  courseId.value = currentPage.options.id
  loadAll()
})

onShow(() => {
  loadTasks()
})

async function loadAll() {
  try {
    const courseRes = await db.collection('courses').doc(courseId.value).get()
    course.value = courseRes.data
  } catch (e) {
    console.error('加载课程失败', e)
  }

  // 加载小组（容错）
  try {
    const groupRes = await db.collection('groups')
      .where({ courseId: courseId.value })
      .get()
    groups.value = groupRes.data
  } catch (e) {
    console.error('加载小组失败', e)
    groups.value = []
  }

  // 加载任务（容错）
  try {
    const taskRes = await db.collection('tasks')
      .where({ courseId: courseId.value })
      .orderBy('deadline', 'asc')
      .get()
    tasks.value = taskRes.data
  } catch (e) {
    console.error('加载任务失败', e)
    tasks.value = []
  }
}

async function loadTasks() {
  if (!courseId.value) return
  const taskRes = await db.collection('tasks')
    .where({ courseId: courseId.value })
    .orderBy('deadline', 'asc')
    .get()
  tasks.value = taskRes.data
}

function formatDeadline(dateStr) {
  if (!dateStr) return '未设置'
  const d = new Date(dateStr)
  return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function pad(num) { return num < 10 ? '0' + num : '' + num }

async function toggleTask(task) {
  try {
    await db.collection('tasks').doc(task._id).update({
      data: { completed: !task.completed }
    })
    task.completed = !task.completed
    uni.showToast({ title: task.completed ? '已完成' : '已取消完成', icon: 'none' })
  } catch (e) {
    console.error('更新失败', e)
  }
}

function createGroup() {
  uni.navigateTo({ url: `/pages/group/create?courseId=${courseId.value}` })
}

function goGroup(groupId) {
  uni.navigateTo({ url: `/pages/group/detail?groupId=${groupId}` })
}

function addTask() {
  uni.navigateTo({ url: `/pages/add-task/index?courseId=${courseId.value}` })
}

function editCourse() {
  uni.navigateTo({ url: `/pages/add-course/index?id=${courseId.value}` })
}

function deleteCourse() {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这门课程吗？同时会删除关联的小组和任务。',
    success: async (res) => {
      if (res.confirm) {
        await db.collection('courses').doc(courseId.value).remove()
        for (const g of groups.value) {
          await db.collection('groups').doc(g._id).remove()
        }
        for (const t of tasks.value) {
          await db.collection('tasks').doc(t._id).remove()
        }
        uni.showToast({ title: '已删除' })
        setTimeout(() => uni.navigateBack(), 800)
      }
    }
  })
}
</script>

<style scoped>
.container { padding: 20rpx; background: #f5f6fa; min-height: 100vh; }
.info-card { background: #fff; border-radius: 16rpx; padding: 30rpx; margin-bottom: 20rpx; }
.course-name { font-size: 40rpx; font-weight: bold; color: #333; display: block; margin-bottom: 15rpx; }
.info-row { display: flex; justify-content: space-between; font-size: 28rpx; color: #666; margin-bottom: 8rpx; }
.action-btns { display: flex; gap: 15rpx; margin-top: 20rpx; }
.btn-small { flex: 1; background: #4A90E2; color: #fff; border-radius: 8rpx; font-size: 26rpx; padding: 12rpx 0; }
.btn-danger { background: #E85D75; }

.section { background: #fff; border-radius: 16rpx; padding: 25rpx; margin-bottom: 20rpx; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15rpx; }
.section-title { font-size: 32rpx; font-weight: bold; }
.btn-add { background: #4A90E2; color: #fff; font-size: 24rpx; padding: 8rpx 20rpx; border-radius: 30rpx; }
.empty { text-align: center; color: #999; padding: 30rpx 0; font-size: 26rpx; }

.group-item { display: flex; align-items: center; padding: 20rpx 0; border-bottom: 1px solid #f0f0f0; }
.group-avatar { width: 70rpx; height: 70rpx; border-radius: 50%; background: #4A90E2; color: #fff; text-align: center; line-height: 70rpx; font-size: 32rpx; margin-right: 15rpx; }
.group-info { flex: 1; }
.group-name { font-size: 28rpx; font-weight: bold; display: block; }
.group-members { font-size: 24rpx; color: #999; }
.arrow { font-size: 36rpx; color: #ccc; }

.task-item { display: flex; align-items: center; padding: 20rpx 0; border-bottom: 1px solid #f0f0f0; }
.task-type-badge { width: 90rpx; height: 50rpx; line-height: 50rpx; text-align: center; border-radius: 25rpx; font-size: 22rpx; color: #fff; margin-right: 15rpx; }
.exam .task-type-badge { background: #E85D75; }
.assignment .task-type-badge { background: #F5A623; }
.task-info { flex: 1; }
.task-title { font-size: 28rpx; font-weight: bold; display: block; }
.task-desc { font-size: 24rpx; color: #999; display: block; margin-top: 4rpx; }
.task-deadline { font-size: 24rpx; color: #E85D75; display: block; margin-top: 4rpx; }
</style>