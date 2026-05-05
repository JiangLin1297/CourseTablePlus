<template>
  <view class="container">
    <view class="title">{{ isEdit ? '编辑课程' : '添加新课程' }}</view>
    <form @submit="onSubmit">
      <input name="name" placeholder="课程名称" class="big-input" :value="form.name" />
      <input name="teacher" placeholder="任课老师" class="big-input" :value="form.teacher" />
      <input name="location" placeholder="上课地点" class="big-input" :value="form.location" />

      <!-- 星期选择 -->
      <picker mode="selector" :range="weekDayOptions" :value="selectedDayIndex" @change="onDayChange">
        <view class="picker-display">
          <text>星期</text>
          <text class="picker-value">{{ weekDayOptions[selectedDayIndex] || '选择' }}</text>
        </view>
      </picker>

      <!-- 节次选择 -->
      <view class="periods-selector">
        <text class="label">选择节次（可多选）</text>
        <view class="periods-grid">
          <view
            v-for="p in allPeriods" :key="p"
            class="period-box"
            :class="{ selected: form.periods.includes(Number(p)) }"
            @click="togglePeriod(Number(p))"
          >{{ p }}</view>
        </view>
      </view>

      <!-- 上课周次选择（替代原来的起始周/结束周） -->
      <view class="weeks-selector">
        <text class="label">上课周次（可多选，留空则覆盖全学期）</text>
        <view class="weeks-actions">
          <button class="quick-btn" size="mini" @click="selectAllWeeks">全选</button>
          <button class="quick-btn" size="mini" @click="selectOddWeeks">单周</button>
          <button class="quick-btn" size="mini" @click="selectEvenWeeks">双周</button>
        </view>
        <view class="weeks-grid">
          <view
            v-for="w in totalWeeks" :key="w"
            class="week-box"
            :class="{ selected: form.weeks.includes(w) }"
            @click="toggleWeek(w)"
          >{{ w }}</view>
        </view>
      </view>

      <button class="submit-btn" form-type="submit">{{ isEdit ? '保存修改' : '保存课程' }}</button>
    </form>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getDatabase } from '@/common/cloud.js'

const db = getDatabase()
const isEdit = ref(false)
const editId = ref('')

const weekDayOptions = ['周一','周二','周三','周四','周五','周六','周日']
const allPeriods = ref([1,2,3,4,5,6,7,8,9,10,11])

const selectedDayIndex = ref(0)

// 学期总周数（可在设置中修改）
const totalWeeks = ref(20)

const form = reactive({
  name: '',
  teacher: '',
  location: '',
  day: 1,
  periods: [],
  weeks: [],          // 新增：上课的具体周次数组
  weekStart: 1,       // 兼容旧数据
  weekEnd: 16,
  color: ''
})

onMounted(async () => {
  const cache = uni.getStorageSync('periods')
  if (cache && cache.length) {
    allPeriods.value = cache.map(p => (typeof p === 'object' ? p.id : p)).filter(v => !isNaN(v))
  }

  const weekCache = uni.getStorageSync('weekConfig')
  if (weekCache) {
    totalWeeks.value = weekCache.total || 20
  }

  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const id = currentPage?.options?.id

  if (id) {
    isEdit.value = true
    editId.value = id
    try {
      const res = await db.collection('courses').doc(id).get()
      const data = res.data || {}
      
      form.name = data.name || ''
      form.teacher = data.teacher || ''
      form.location = data.location || ''
      form.day = Number(data.day) || 1
      selectedDayIndex.value = form.day - 1
      form.periods = Array.isArray(data.periods) ? data.periods.map(Number).filter(v => !isNaN(v)).sort((a,b)=>a-b) : []
      
      // 优先使用 weeks，否则用 weekStart/weekEnd 生成
      if (Array.isArray(data.weeks) && data.weeks.length > 0) {
        form.weeks = data.weeks.map(Number).filter(v => !isNaN(v)).sort((a,b)=>a-b)
      } else {
        const start = Number(data.weekStart) || 1
        const end = Number(data.weekEnd) || totalWeeks.value
        form.weeks = []
        for (let w = start; w <= end; w++) form.weeks.push(w)
      }
      
      form.weekStart = Number(data.weekStart) || 1
      form.weekEnd = Number(data.weekEnd) || totalWeeks.value
      form.color = data.color || ''
    } catch (e) {
      console.error('加载课程失败', e)
      uni.showToast({ title: '加载课程数据失败', icon: 'none' })
    }
  } else {
    form.color = getRandomColor()
  }
})

function onDayChange(e) {
  selectedDayIndex.value = e.detail.value
  form.day = e.detail.value + 1
}

function togglePeriod(period) {
  const idx = form.periods.indexOf(period)
  if (idx >= 0) form.periods.splice(idx, 1)
  else form.periods.push(period)
  form.periods.sort((a,b)=>a-b)
}

function toggleWeek(week) {
  const idx = form.weeks.indexOf(week)
  if (idx >= 0) form.weeks.splice(idx, 1)
  else form.weeks.push(week)
  form.weeks.sort((a,b)=>a-b)
}

function selectAllWeeks() {
  form.weeks = Array.from({length: totalWeeks.value}, (_, i) => i + 1)
}
function selectOddWeeks() {
  form.weeks = []
  for (let w = 1; w <= totalWeeks.value; w += 2) form.weeks.push(w)
}
function selectEvenWeeks() {
  form.weeks = []
  for (let w = 2; w <= totalWeeks.value; w += 2) form.weeks.push(w)
}

async function onSubmit(e) {
  const { name: formName, teacher: formTeacher, location: formLocation } = e.detail.value || {}
  const finalName = formName || form.name
  const finalLocation = formLocation || form.location

  if (!finalName) return uni.showToast({ title: '请输入课程名称', icon: 'none' })
  if (!finalLocation) return uni.showToast({ title: '请输入上课地点', icon: 'none' })
  if (form.periods.length === 0) return uni.showToast({ title: '至少选择一个节次', icon: 'none' })

  // 如果没选周次，设为全学期
  if (form.weeks.length === 0) {
    form.weeks = Array.from({length: totalWeeks.value}, (_, i) => i + 1)
    form.weekStart = 1
    form.weekEnd = totalWeeks.value
  } else {
    form.weekStart = Math.min(...form.weeks)
    form.weekEnd = Math.max(...form.weeks)
  }

  const data = {
    name: finalName,
    teacher: formTeacher || form.teacher,
    location: finalLocation,
    day: Number(form.day),
    periods: [...form.periods],
    weeks: [...form.weeks],
    weekStart: Number(form.weekStart),
    weekEnd: Number(form.weekEnd),
    color: form.color || getRandomColor(),
    userId: 'test_user_openid'
  }

  try {
    if (isEdit.value) {
      await db.collection('courses').doc(editId.value).update({ data })
      uni.showToast({ title: '修改已保存' })
    } else {
      await db.collection('courses').add({ data })
      uni.showToast({ title: '课程添加成功' })
    }
    uni.$emit('courseUpdated')
    setTimeout(() => uni.navigateBack(), 800)
  } catch (err) {
    console.error('保存失败', err)
    uni.showToast({ title: '保存失败，请重试', icon: 'none' })
  }
}

function getRandomColor() {
  const colors = ['#FF6B6B','#4ECDC4','#FFE66D','#2ecc71','#9b59b6','#3498db']
  return colors[Math.floor(Math.random() * colors.length)]
}
</script>

<style scoped>
.container { padding:30rpx; }
.title { font-size:40rpx; font-weight:bold; margin-bottom:30rpx; }
.big-input {
  border: 1px solid #ddd; padding: 24rpx 20rpx; margin-bottom: 20rpx;
  border-radius: 12rpx; background: #fff; font-size: 32rpx; width: 100%;
  box-sizing: border-box; min-height: 88rpx; line-height: 1.5;
}
.picker-display {
  border: 1px solid #ddd; padding: 24rpx 20rpx; margin-bottom: 20rpx;
  border-radius: 12rpx; background: #fff; font-size: 32rpx; width: 100%;
  box-sizing: border-box; display: flex; justify-content: space-between; align-items: center;
}
.picker-value { color: #4A90E2; }
.periods-selector { margin-bottom: 20rpx; }
.label { font-size: 30rpx; color: #333; display: block; margin-bottom: 10rpx; }
.periods-grid { display: flex; flex-wrap: wrap; gap: 10rpx; margin-bottom: 20rpx; }
.period-box {
  width: 80rpx; height: 70rpx; line-height: 70rpx; text-align: center;
  border: 1px solid #ddd; border-radius: 12rpx; font-size: 28rpx; background: #f5f5f5;
}
.period-box.selected { background: #4A90E2; color: #fff; border-color: #4A90E2; }

.weeks-selector { margin-bottom: 20rpx; }
.weeks-actions { display: flex; gap: 10rpx; margin-bottom: 10rpx; }
.quick-btn { font-size: 22rpx; background: #4A90E2; color: #fff; border: none; border-radius: 20rpx; padding: 6rpx 18rpx; }
.weeks-grid { display: flex; flex-wrap: wrap; gap: 10rpx; }
.week-box {
  width: 70rpx; height: 60rpx; line-height: 60rpx; text-align: center;
  border: 1px solid #ddd; border-radius: 10rpx; font-size: 24rpx; background: #f5f5f5;
}
.week-box.selected { background: #4A90E2; color: #fff; border-color: #4A90E2; }
.submit-btn { background: #4A90E2; color: #fff; margin-top: 30rpx; border-radius: 50rpx; font-size: 32rpx; padding: 20rpx; }
</style>