// 全局配置
App({
  globalData: {
    apiBase: 'https://your-server.com',  // 替换为实际后端地址
    userInfo: null,
    openid: '',
  },

  onLaunch() {
    // 微信登录获取 openid
    this.wxLogin();
  },

  wxLogin() {
    wx.login({
      success: (res) => {
        if (res.code) {
          // 将 code 发送到后端换取 openid
          wx.request({
            url: `${this.globalData.apiBase}/api/wx-login`,
            data: { code: res.code },
            success: (resp) => {
              this.globalData.openid = resp.data.openid;
              this.globalData.userInfo = resp.data;
            },
            fail: () => {
              // 降级：使用设备ID
              this.globalData.openid = 'device_' + Date.now();
            }
          });
        }
      }
    });
  }
});
