// 云开发初始化，多端统一
let cloud = null

// #ifdef MP-WEIXIN
// 小程序环境：直接用 wx.cloud，方便又快捷
wx.cloud.init({
  env: '你的云环境ID',  // 记得改成你自己的
})
cloud = wx.cloud
// #endif

// #ifndef MP-WEIXIN
// APP、H5 环境：用腾讯云Web SDK，需先安装 npm install @cloudbase/js-sdk
import cloudbase from '@cloudbase/js-sdk'
const app   = cloudbase.init({
  env: '你的云环境ID'
})
// 匿名登录，权限仅限数据库读
const auth = app.auth({ persistence: 'local' })
auth.anonymousAuthProvider().signIn().then(() => {
  cloud = app
})
// #endif

export function getDatabase() {
  return cloud.database()
}

export function callFunction(name, data) {
  return cloud.callFunction({ name, data })
}

export async function uploadFile(path) {
  const res = await cloud.uploadFile({ cloudPath: `images/${Date.now()}.png`, filePath: path })
  return res.fileID
}