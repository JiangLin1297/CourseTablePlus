<template>
  <view class="container">
    <!-- 头像区 -->
    <view class="header">
     <view class="avatar" style="background: #4A90E2; display: flex; align-items: center; justify-content: center;">
       <text style="color: white; font-size: 60rpx;">👤</text>
     </view>
      <text class="nickname">点击登录</text>
    </view>

    <!-- 功能列表 -->
    <view class="menu-list">
      <view class="menu-item" @click="goSettings">
        <text>⚙️ 设置</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @click="goAbout">
        <text>ℹ️ 关于课程表Plus</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @click="handleLogin">
        <text>🔐 微信一键登录（预留）</text>
        <text class="arrow">›</text>
      </view>
    </view>
  </view>
</template>

<script setup>
function goSettings() {
  uni.navigateTo({ url: '/pages/settings/index' })
}
function goAbout() {
  uni.showToast({ title: '课程表Plus v1.0', icon: 'none' })
}
function handleLogin() {
  uni.showToast({ title: '登录功能预留，三个月后对接教务系统', icon: 'none' })
}
</script>

<style scoped>
.container { height: 100vh; background: #f5f6fa; }
.header { display: flex; flex-direction: column; align-items: center; padding: 60rpx 0 40rpx; background: #4A90E2; }
.avatar { width: 140rpx; height: 140rpx; border-radius: 50%; background: #fff; margin-bottom: 15rpx; }
.nickname { color: #fff; font-size: 32rpx; }
.menu-list { margin-top: 20rpx; background: #fff; border-radius: 12rpx; margin: 20rpx; }
.menu-item { display: flex; justify-content: space-between; padding: 30rpx; border-bottom: 1px solid #f0f0f0; font-size: 30rpx; }
.arrow { color: #ccc; font-size: 36rpx; }
</style>