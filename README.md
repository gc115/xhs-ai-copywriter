# 🤖 AI 小红书文案生成器

基于 AI 的微信小程序，一键生成小红书风格爆款文案。

## 🚀 快速开始

### 后端
```bash
cd backend
pip install -r requirements.txt

# 设置 AI API Key
export AI_API_KEY="sk-your-key"
export AI_API_BASE="https://api.deepseek.com/v1"

python main.py
```

### 小程序
1. 下载[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 导入 `miniprogram/` 目录
3. 修改 `app.js` 中的 `apiBase` 为后端地址
4. 编译预览

## 📂 项目结构

```
xhs-copywriter/
├── backend/
│   ├── main.py          # FastAPI 后端
│   └── requirements.txt
├── miniprogram/
│   ├── app.js/json/wxss # 全局配置
│   ├── pages/
│   │   ├── index/       # 首页 - 产品输入
│   │   ├── generate/    # 生成中
│   │   ├── result/      # 文案展示
│   │   └── user/        # 个人中心
│   └── utils/
│       └── api.js       # API 封装
└── README.md
```

## 🎨 功能

- 6 种文案风格：种草、测评、教程、好物推荐、探店打卡、Vlog口播
- 3 种长度：短/中/长
- 1-5 条批量生成
- 免费版 3次/天，Pro版 ¥9.9/月无限

## 🔑 注册小程序

1. https://mp.weixin.qq.com 注册小程序账号
2. 获取 AppID → 填入 `project.config.json`
3. 开通微信支付（可选，用于 Pro 订阅）
