<script>
export default {
  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({
        env: '你的云环境ID', // 直接把那串ID黏贴过来
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
