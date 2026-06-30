// 我的页面
const app = getApp();
const api = require('../../utils/api');

Page({
  data: {
    tier: 'free',
    remaining: 3,
    used: 0,
    dailyLimit: 3,
    history: [],
  },

  onShow() {
    this.loadStatus();
  },

  async loadStatus() {
    try {
      const res = await api.getUser(app.globalData.openid || 'device_' + Date.now());
      this.setData({
        tier: res.tier,
        remaining: res.remaining,
        used: res.used,
        dailyLimit: res.daily_limit,
      });
    } catch (e) {
      // 离线状态
    }
  },

  goPro() {
    wx.showModal({
      title: '升级 Pro',
      content: '即将支持微信支付，敬请期待！',
      showCancel: false,
    });
  },
});
