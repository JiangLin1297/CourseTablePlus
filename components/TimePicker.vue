<template>
  <view class="time-picker-container">
    <view class="time-display" @click="toggleMode">
      <text v-if="!isEditing" class="time-text">{{ modelValue }}</text>
      <input 
        v-else 
        class="time-input" 
        :value="modelValue" 
        placeholder="HH:MM"
        @blur="onManualInput"
        @confirm="onManualInput"
        focus
      />
      <text class="mode-hint">{{ isEditing ? '完成' : '点我输入' }}</text>
    </view>
    <view class="quick-buttons" v-if="!isEditing">
      <button class="quick-btn" @click="adjustTime(-5)">-5分钟</button>
      <button class="quick-btn" @click="adjustTime(5)">+5分钟</button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '08:00' }
})
const emit = defineEmits(['update:modelValue'])

const isEditing = ref(false)

function toggleMode() {
  isEditing.value = !isEditing.value
}

function adjustTime(deltaMinutes) {
  const [h, m] = props.modelValue.split(':').map(Number)
  let totalMinutes = h * 60 + m + deltaMinutes
  if (totalMinutes < 0) totalMinutes += 24 * 60
  if (totalMinutes >= 24 * 60) totalMinutes -= 24 * 60
  const newH = Math.floor(totalMinutes / 60)
  const newM = totalMinutes % 60
  emit('update:modelValue', `${pad(newH)}:${pad(newM)}`)
}

function onManualInput(e) {
  const val = e.detail.value || e.target.value
  if (/^\d{1,2}:\d{2}$/.test(val)) {
    const [h, m] = val.split(':').map(Number)
    if (h >= 0 && h < 24 && m >= 0 && m < 60) {
      emit('update:modelValue', `${pad(h)}:${pad(m)}`)
    }
  }
  isEditing.value = false
}

function pad(num) { return num < 10 ? '0' + num : '' + num }
</script>

<style scoped>
.time-picker-container { margin-bottom: 15rpx; }
.time-display { display: flex; align-items: center; background: #f9f9f9; border-radius: 12rpx; padding: 20rpx; margin-bottom: 10rpx; }
.time-text { font-size: 36rpx; font-weight: bold; flex: 1; }
.time-input { flex: 1; font-size: 36rpx; font-weight: bold; border-bottom: 2rpx solid #4A90E2; padding: 10rpx 0; }
.mode-hint { font-size: 22rpx; color: #4A90E2; margin-left: 15rpx; }
.quick-buttons { display: flex; gap: 10rpx; }
.quick-btn { background: #4A90E2; color: #fff; font-size: 24rpx; padding: 8rpx 16rpx; border-radius: 30rpx; }
</style>