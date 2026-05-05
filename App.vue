<script>
export default {
  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloud1-d6gpi1iuo4990c753', // 直接把那串ID黏贴过来
        traceUser: true
      })
      console.log('云开发初始化完成')
    }
  }
}
</script>

<style>
	/*每个页面公共css */
</style>
