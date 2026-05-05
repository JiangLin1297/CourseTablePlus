<template>
  <view class="container">
    <view class="title">添加任务 / 考试</view>
    <form @submit="onSubmit">
      <!-- 任务标题 -->
      <input name="title" placeholder="任务名称（如：期末大作业）" class="big-input" />
      
      <!-- 任务描述 -->
      <textarea name="description" placeholder="描述（选填）" class="big-textarea" />
      
      <!-- 类型选择 -->
      <picker mode="selector" :range="typeOptions" :value="typeIndex" @change="onTypeChange">
        <view class="picker-display">
          <text>类型</text>
          <text class="picker-value">{{ typeOptions[typeIndex] }}</text>
        </view>
      </picker>
      
      <!-- 截止时间 -->
      <view class="deadline-row">
        <text class="deadline-label">截止时间</text>
        <picker mode="multiSelector" :range="dateTimeRange" :value="dateTimeValue" @change="onDateTimeChange" @columnchange="onColumnChange">
          <view class="picker-display deadline-picker">
            <text>{{ deadlineStr || '请选择' }}</text>
          </view>
        </picker>
      </view>
      
      <button class="submit-btn" form-type="submit">保存任务</button>
    </form>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getDatabase } from '@/common/cloud.js'

const db = getDatabase()
const typeOptions = ['大作业', '考试']
const typeIndex = ref(0)
const courseId = ref('')

const now = new Date()
const dateTimeRange = reactive([
  [], // 日期列表
  ['00','01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23'],
  ['00','05','10','15','20','25','30','35','40','45','50','55']
])
const dateTimeValue = ref([0, 8, 0])
const deadlineStr = ref('')

onMounted(() => {
  // 获取课程ID
  const pages = getCurrentPages()
  if (pages.length > 0) {
    const currentPage = pages[pages.length - 1]
    if (currentPage.options && currentPage.options.courseId) {
      courseId.value = currentPage.options.courseId
    }
  }
  
  // 生成未来30天日期
  for (let i = 0; i < 30; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() + i)
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    dateTimeRange[0].push(`${d.getFullYear()}-${month}-${day}`)
  }
  
  updateDeadlineStr()
})

function pad(num) { return num < 10 ? '0' + num : '' + num }

function updateDeadlineStr() {
  const d = dateTimeRange[0][dateTimeValue.value[0]]
  const h = dateTimeRange[1][dateTimeValue.value[1]]
  const m = dateTimeRange[2][dateTimeValue.value[2]]
  if (d) deadlineStr.value = `${d} ${h}:${m}`
}

function onTypeChange(e) { typeIndex.value = e.detail.value }
function onColumnChange(e) {
  dateTimeValue.value[e.detail.column] = e.detail.value
  updateDeadlineStr()
}
function onDateTimeChange(e) {
  dateTimeValue.value = e.detail.value
  updateDeadlineStr()
}

async function onSubmit(e) {
  const { title, description } = e.detail.value
  if (!title || !title.trim()) return uni.showToast({ title: '请输入任务名称', icon: 'none' })
  if (!courseId.value) return uni.showToast({ title: '课程信息丢失，请返回重试', icon: 'none' })
  if (!deadlineStr.value) return uni.showToast({ title: '请选择截止时间', icon: 'none' })
  
  try {
    const deadlineDate = new Date(deadlineStr.value.replace(' ', 'T'))
    await db.collection('tasks').add({
      data: {
        courseId: courseId.value,
        title: title.trim(),
        description: description || '',
        type: typeIndex.value === 1 ? 'exam' : 'assignment',
        deadline: deadlineDate.toISOString(),
        completed: false,
        userId: 'test_user_openid',
        reminders: [24, 2]
      }
    })
    uni.showToast({ title: '添加成功' })
    setTimeout(() => uni.navigateBack(), 800)
  } catch (err) {
    console.error('添加任务失败', err)
    uni.showToast({ title: '添加失败，请重试', icon: 'none' })
  }
}
</script>

<style scoped>
.container { padding: 30rpx; }
.title { font-size: 40rpx; font-weight: bold; margin-bottom: 30rpx; }
.big-input {
  border: 1px solid #ddd; padding: 24rpx 20rpx; margin-bottom: 20rpx;
  border-radius: 12rpx; background: #fff; font-size: 32rpx; width: 100%;
  box-sizing: border-box; min-height: 88rpx; line-height: 1.5;
}
.big-textarea {
  border: 1px solid #ddd; padding: 24rpx 20rpx; margin-bottom: 20rpx;
  border-radius: 12rpx; background: #fff; font-size: 32rpx; width: 100%;
  min-height: 150rpx; box-sizing: border-box; line-height: 1.5;
}
.picker-display {
  border: 1px solid #ddd; padding: 24rpx 20rpx; margin-bottom: 20rpx;
  border-radius: 12rpx; background: #fff; font-size: 32rpx;
  display: flex; justify-content: space-between; align-items: center;
}
.picker-value { color: #4A90E2; }
.deadline-row { display: flex; align-items: center; margin-bottom: 20rpx; }
.deadline-label { font-size: 28rpx; margin-right: 15rpx; }
.deadline-picker { flex: 1; margin-bottom: 0; }
.submit-btn { background: #4A90E2; color: #fff; margin-top: 40rpx; border-radius: 50rpx; font-size: 32rpx; padding: 20rpx; }
</style>