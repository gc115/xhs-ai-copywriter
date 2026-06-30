// 结果页
Page({
  data: {
    copies: [],
    remaining: 0,
    tier: 'free',
    product: '',
    style: '',
  },

  onLoad(options) {
    try {
      const data = JSON.parse(decodeURIComponent(options.data || '{}'));
      this.setData({
        copies: data.copies || [],
        remaining: data.remaining || 0,
        tier: data.tier || 'free',
        product: data.product || '',
        style: data.style || '',
      });
    } catch (e) {
      wx.showToast({ title: '数据错误', icon: 'none' });
    }
  },

  copyOne(e) {
    const index = e.currentTarget.dataset.index;
    const text = this.data.copies[index];
    wx.setClipboardData({
      data: text,
      success: () => wx.showToast({ title: '已复制', icon: 'success' }),
    });
  },

  copyAll() {
    const all = this.data.copies.map((c, i) => `【文案${i + 1}】\n${c}`).join('\n\n---\n\n');
    wx.setClipboardData({
      data: all,
      success: () => wx.showToast({ title: '全部已复制', icon: 'success' }),
    });
  },

  regenerate() {
    wx.navigateBack();
  },
});
