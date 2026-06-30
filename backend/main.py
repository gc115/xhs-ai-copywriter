"""
小红书AI文案生成器 - 后端 API
FastAPI + DeepSeek/OpenAI 兼容接口
"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import httpx
import json
import os
import time
from datetime import datetime

app = FastAPI(title="小红书AI文案生成器", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# 配置
# ============================================================
AI_API_KEY = os.getenv("AI_API_KEY", "sk-your-api-key-here")
AI_API_BASE = os.getenv("AI_API_BASE", "https://api.deepseek.com/v1")
AI_MODEL = os.getenv("AI_MODEL", "deepseek-chat")

FREE_DAILY_LIMIT = 3  # 免费用户每天3次
PRO_DAILY_LIMIT = 100  # 付费用户每天100次

# 简单内存存储（生产环境换 Redis/DB）
users = {}  # {openid: {tier, daily_count, last_reset}}

# ============================================================
# 模型
# ============================================================
class GenerateRequest(BaseModel):
    openid: str
    product: str          # 产品描述
    style: str = "种草"    # 文案风格
    length: str = "medium" # short/medium/long
    count: int = 3         # 生成条数（1-5）

class GenerateResponse(BaseModel):
    copies: list[str]
    remaining: int
    tier: str

# ============================================================
# 文案风格模板
# ============================================================
STYLE_PROMPTS = {
    "种草": "你是一个小红书爆款文案写手。用热情、真诚的语气写种草文案，突出产品亮点和使用感受，多用emoji，让人看完就想买。不要提及'小红书'这个词。",
    "测评": "你是一个专业的产品测评人。客观分析产品优缺点，用数据和实际体验说话，给出真实的使用感受和建议。理性但不枯燥。",
    "教程": "你是一个耐心的教程博主。用清晰易懂的步骤讲解，像朋友在教你一样，带emoji和tips，让新手也能轻松上手。",
    "好物推荐": "你是一个生活好物推荐官。精选优质好物，用简洁有力的语言介绍，突出性价比和独特卖点，让人感觉物超所值。",
    "探店打卡": "你是一个探店博主。用生动的语言描述场景、氛围和体验，带emoji和打卡tips，让人身临其境。",
    "vlog口播": "你是一个vlog博主。用口语化、轻松自然的语气写口播稿，像在跟朋友聊天一样，有节奏感，适合视频配音。",
}

LENGTH_GUIDE = {
    "short": "控制在100字以内，短小精悍。",
    "medium": "控制在200-300字，内容丰富但不啰嗦。",
    "long": "500字左右，详细深入，适合深度种草。",
}

# ============================================================
# 用户管理
# ============================================================
def get_user(openid: str) -> dict:
    """获取或创建用户"""
    if openid not in users:
        users[openid] = {"tier": "free", "daily_count": 0, "last_reset": ""}
    
    # 每天重置计数
    today = datetime.now().strftime("%Y-%m-%d")
    if users[openid]["last_reset"] != today:
        users[openid]["daily_count"] = 0
        users[openid]["last_reset"] = today
    
    return users[openid]

def check_limit(openid: str) -> tuple[bool, int, str]:
    """检查使用限制"""
    user = get_user(openid)
    limit = PRO_DAILY_LIMIT if user["tier"] == "pro" else FREE_DAILY_LIMIT
    remaining = max(0, limit - user["daily_count"])
    return remaining > 0, remaining, user["tier"]

def increment_usage(openid: str):
    """增加使用计数"""
    get_user(openid)["daily_count"] += 1

# ============================================================
# AI 生成
# ============================================================
async def generate_copy(product: str, style: str, length: str, count: int) -> list[str]:
    """调用 AI 生成文案"""
    style_prompt = STYLE_PROMPTS.get(style, STYLE_PROMPTS["种草"])
    length_guide = LENGTH_GUIDE.get(length, LENGTH_GUIDE["medium"])
    
    system_prompt = f"""{style_prompt}

格式要求：
- {length_guide}
- 每段文案独立完整，包含标题
- 使用 emoji 增加可读性
- 自然融入热门话题标签
- 语气真实，避免广告腔
- 用"我"的第一人称视角"""

    user_prompt = f"请为以下产品生成 {count} 条小红书文案：\n\n产品：{product}"

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{AI_API_BASE}/chat/completions",
            headers={
                "Authorization": f"Bearer {AI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": AI_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.8,
                "max_tokens": 2000,
            },
        )
        result = response.json()
    
    # 解析返回的文案
    content = result["choices"][0]["message"]["content"]
    
    # 按数字编号或空行分割
    copies = []
    current = []
    for line in content.split("\n"):
        line = line.strip()
        if not line:
            if current:
                copies.append("\n".join(current))
                current = []
        elif line[0].isdigit() and (". " in line or "、" in line or "．" in line):
            if current:
                copies.append("\n".join(current))
            current = [line]
        else:
            current.append(line)
    if current:
        copies.append("\n".join(current))
    
    # 去重、去空、限制数量
    copies = [c.strip() for c in copies if c.strip()][:count]
    
    # 如果 AI 返回的条数不够，用 fallback
    while len(copies) < count:
        copies.append(f"✨ {product}也太好用了吧！姐妹们冲！ #好物推荐")
    
    return copies

# ============================================================
# API 路由
# ============================================================
@app.get("/")
def root():
    return {"service": "小红书AI文案生成器", "version": "1.0.0"}

@app.post("/api/generate", response_model=GenerateResponse)
async def api_generate(req: GenerateRequest):
    # 检查限制
    can_use, remaining, tier = check_limit(req.openid)
    if not can_use:
        raise HTTPException(
            status_code=429,
            detail=f"今日免费次数已用完（{FREE_DAILY_LIMIT}次/天）。升级Pro版无限使用！"
        )
    
    # 生成文案
    try:
        copies = await generate_copy(req.product, req.style, req.length, req.count)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI 生成失败: {str(e)}")
    
    # 更新计数
    increment_usage(req.openid)
    remaining -= 1
    
    return GenerateResponse(copies=copies, remaining=remaining, tier=tier)

@app.get("/api/user/{openid}")
def api_user(openid: str):
    user = get_user(openid)
    limit = PRO_DAILY_LIMIT if user["tier"] == "pro" else FREE_DAILY_LIMIT
    remaining = max(0, limit - user["daily_count"])
    return {
        "tier": user["tier"],
        "daily_limit": limit,
        "used": user["daily_count"],
        "remaining": remaining,
    }

@app.get("/api/styles")
def api_styles():
    return {
        "styles": [
            {"id": k, "name": k, "icon": i, "desc": v[:30]}
            for i, (k, v) in enumerate(STYLE_PROMPTS.items())
        ],
        "lengths": [
            {"id": "short", "name": "短文案", "desc": "~100字"},
            {"id": "medium", "name": "中文案", "desc": "~250字"},
            {"id": "long", "name": "长文案", "desc": "~500字"},
        ],
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
