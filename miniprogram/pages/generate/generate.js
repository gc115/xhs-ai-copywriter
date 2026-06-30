// 生成中页面
const app = getApp();
const api = require('../../utils/api');

Page({
  data: {
    product: '',
    style: '',
    length: '',
    count: 3,
    progress: 0,
    statusText: '正在分析产品特点...',
    statuses: ['正在分析产品特点...', '匹配文案风格模板...', '✨ AI 正在撰写文案...', '即将完成...'],
    error: '',
  },

  onLoad(options) {
    this.setData({
      product: decodeURIComponent(options.product || ''),
      style: options.style || '种草',
      length: options.length || 'medium',
      count: parseInt(options.count) || 3,
    });
    this.startGeneration();
  },

  async startGeneration() {
    const { product, style, length, count } = this.data;
    const openid = app.globalData.openid || 'device_' + Date.now();

    // 模拟进度
    let step = 0;
    const timer = setInterval(() => {
      if (step < this.data.statuses.length - 1) {
        step++;
        this.setData({
          progress: (step / this.data.statuses.length) * 60,
          statusText: this.data.statuses[step],
        });
      }
    }, 800);

    try {
      const res = await api.generate(openid, product, style, length, count);
      clearInterval(timer);
      
      this.setData({ progress: 100, statusText: '✅ 生成完成！' });
      
      // 跳转结果页
      setTimeout(() => {
        wx.redirectTo({
          url: `/pages/result/result?data=${encodeURIComponent(JSON.stringify({
            copies: res.copies,
            remaining: res.remaining,
            tier: res.tier,
            product,
            style,
          }))}`
        });
      }, 500);

    } catch (e) {
      clearInterval(timer);
      const msg = e.message || '生成失败，请重试';
      this.setData({ error: msg, progress: 0, statusText: msg });
    }
  },

  retry() {
    this.setData({ error: '', progress: 0 });
    this.startGeneration();
  },

  goBack() {
    wx.navigateBack();
  },
});
