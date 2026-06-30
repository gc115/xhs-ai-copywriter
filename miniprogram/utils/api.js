// API 工具
const app = getApp();

const request = (url, method = 'GET', data = {}) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: app.globalData.apiBase + url,
      method,
      data,
      header: { 'Content-Type': 'application/json' },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(new Error(res.data?.detail || `请求失败 (${res.statusCode})`));
        }
      },
      fail: (err) => reject(new Error('网络错误，请检查网络')),
    });
  });
};

module.exports = {
  // 生成文案
  generate(openid, product, style, length, count) {
    return request('/api/generate', 'POST', { openid, product, style, length, count });
  },

  // 获取用户状态
  getUser(openid) {
    return request(`/api/user/${openid}`);
  },

  // 获取风格列表
  getStyles() {
    return request('/api/styles');
  },
};
