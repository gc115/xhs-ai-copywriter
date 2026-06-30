// 首页 - 产品输入 + 风格选择
const app = getApp();
const api = require('../../utils/api');

Page({
  data: {
    product: '',
    styleIndex: 0,
    lengthIndex: 1,
    count: 3,
    styles: [],
    lengths: [
      { id: 'short', name: '短文案', desc: '~100字' },
      { id: 'medium', name: '中文案', desc: '~250字' },
      { id: 'long', name: '长文案', desc: '~500字' },
    ],
    generating: false,
    remaining: 3,
    tier: 'free',
    productPlaceholder: '输入产品名称和特点...\n\n例如：一款适合干皮的气垫粉底，遮瑕力强，持妆8小时不脱妆',
  },

  onLoad() {
    this.loadStyles();
    this.loadUserStatus();
  },

  onShow() {
    this.loadUserStatus();
  },

  async loadStyles() {
    try {
      const res = await api.getStyles();
      this.setData({ styles: res.styles });
    } catch (e) {
      // 使用默认风格
      this.setData({
        styles: [
          { id: '种草', name: '种草文案', icon: '🔥' },
          { id: '测评', name: '测评文案', icon: '📊' },
          { id: '教程', name: '教程文案', icon: '📖' },
          { id: '好物推荐', name: '好物推荐', icon: '⭐' },
          { id: '探店打卡', name: '探店打卡', icon: '📍' },
          { id: 'vlog口播', name: 'Vlog口播', icon: '🎬' },
        ]
      });
    }
  },

  async loadUserStatus() {
    const openid = app.globalData.openid;
    if (!openid) return;
    try {
      const res = await api.getUser(openid);
      this.setData({
        remaining: res.remaining,
        tier: res.tier,
      });
    } catch (e) {}
  },

  onProductInput(e) {
    this.setData({ product: e.detail.value });
  },

  selectStyle(e) {
    this.setData({ styleIndex: e.currentTarget.dataset.index });
  },

  selectLength(e) {
    this.setData({ lengthIndex: e.currentTarget.dataset.index });
  },

  changeCount(e) {
    this.setData({ count: e.detail.value });
  },

  async startGenerate() {
    const { product, styles, styleIndex, lengths, lengthIndex, count } = this.data;
    
    if (!product.trim()) {
      wx.showToast({ title: '请输入产品描述', icon: 'none' });
      return;
    }

    if (this.data.generating) return;
    
    this.setData({ generating: true });

    // 跳转到生成页面
    wx.navigateTo({
      url: `/pages/generate/generate?product=${encodeURIComponent(product)}&style=${styles[styleIndex]?.id || '种草'}&length=${lengths[lengthIndex]?.id || 'medium'}&count=${count}`,
      fail: () => {
        this.setData({ generating: false });
        wx.showToast({ title: '跳转失败', icon: 'none' });
      }
    });
  },

  goPro() {
    wx.showModal({
      title: '升级 Pro',
      content: '¥9.9/月，每日无限生成，解锁全部风格。即将上线，敬请期待！',
      showCancel: false,
    });
  },
});
