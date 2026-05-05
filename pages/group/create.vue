<template>
  <view class="container">
    <view class="title">创建小组</view>
    <form @submit="onSubmit">
      <!-- 小组名称 -->
      <input name="name" placeholder="小组名称" class="big-input" />
      
      <!-- 成员列表 -->
      <view class="member-section">
        <text class="label">小组成员</text>
        <view v-for="(member, index) in members" :key="index" class="member-item">
          <text class="member-name">{{ member }}</text>
          <text class="remove-member" @click="removeMember(index)">✕</text>
        </view>
        <view class="add-member-row">
          <input class="member-input" v-model="newMember" placeholder="输入成员昵称/ID" />
          <button class="btn-add-member" size="mini" type="primary" @click="addMember">添加</button>
        </view>
        <text class="hint">至少包含创建者本人，暂用 test_user_openid 代替</text>
      </view>

      <button class="submit-btn" form-type="submit">创建小组</button>
    </form>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getDatabase } from '@/common/cloud.js'

const db = getDatabase()
const courseId = ref('')
const members = ref(['test_user_openid']) // 默认包含创建者
const newMember = ref('')

onMounted(() => {
  const pages = getCurrentPages()
  if (pages.length > 0) {
    const currentPage = pages[pages.length - 1]
    if (currentPage.options && currentPage.options.courseId) {
      courseId.value = currentPage.options.courseId
    } else {
      uni.showToast({ title: '参数错误', icon: 'none' })
    }
  } else {
    uni.showToast({ title: '无法获取页面参数', icon: 'none' })
  }
})

function addMember() {
  const name = newMember.value.trim()
  if (!name) return
  if (members.value.includes(name)) {
    uni.showToast({ title: '成员已存在', icon: 'none' })
    return
  }
  members.value.push(name)
  newMember.value = ''
}

function removeMember(index) {
  if (members.value.length <= 1) {
    uni.showToast({ title: '至少保留一个成员', icon: 'none' })
    return
  }
  members.value.splice(index, 1)
}

async function onSubmit(e) {
  const { name } = e.detail.value
  if (!name || !name.trim()) return uni.showToast({ title: '请输入小组名称', icon: 'none' })
  if (!courseId.value) return uni.showToast({ title: '课程信息丢失，请返回重试', icon: 'none' })
  
  try {
    await db.collection('groups').add({
      data: {
        courseId: courseId.value,
        name: name.trim(),
        creatorId: 'test_user_openid',
        members: [...members.value]
      }
    })
    uni.showToast({ title: '创建成功' })
    setTimeout(() => uni.navigateBack(), 800)
  } catch (err) {
    console.error('创建小组失败', err)
    uni.showToast({ title: '创建失败，请重试', icon: 'none' })
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
.label { font-size: 30rpx; color: #333; display: block; margin-bottom: 10rpx; }
.member-section { margin-bottom: 20rpx; }
.member-item { display: flex; align-items: center; padding: 15rpx; background: #f5f5f5; border-radius: 8rpx; margin-bottom: 10rpx; }
.member-name { flex: 1; font-size: 28rpx; }
.remove-member { color: #E85D75; font-size: 32rpx; padding: 0 10rpx; }
.add-member-row { display: flex; gap: 10rpx; margin-top: 10rpx; }
.member-input {
  flex: 1; border: 1px solid #ddd; padding: 15rpx 15rpx; border-radius: 8rpx;
  font-size: 28rpx; background: #fff; min-height: 60rpx;
}
.btn-add-member { font-size: 24rpx; background: #4A90E2; color: #fff; border: none; border-radius: 8rpx; }
.hint { font-size: 22rpx; color: #999; margin-top: 10rpx; display: block; }
.submit-btn { background: #4A90E2; color: #fff; margin-top: 40rpx; border-radius: 50rpx; font-size: 32rpx; }
</style>