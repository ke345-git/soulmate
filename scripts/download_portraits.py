# -*- coding: utf-8 -*-
"""下载内置立绘（DiceBear 开源头像，核心样式 CC0 公有领域）。

用法：python scripts/download_portraits.py
输出：backend/portraits/*.svg + manifest.json
说明：下载到本地，桌面版/离线环境无需联网。
来源：https://www.dicebear.com  (API: api.dicebear.com/9.x/{style}/svg?seed=...)
"""
import json
import os
import time
import urllib.parse
import urllib.request

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "backend", "portraits")
API = "https://api.dicebear.com/9.x/{style}/svg?seed={seed}&backgroundColor={bg}"

# 12 个预设角色原型（与 PRESET_CHARACTERS 的 archetype 对应）
THEMES = [
    {"id": "xuejie",    "name": "温柔学姐",   "emoji": "📚", "style": "lorelei",           "seed": "YueYao",      "bg": "ffd9e8"},
    {"id": "yuanqi",    "name": "元气少女",   "emoji": "✨", "style": "adventurer",         "seed": "XingYe",      "bg": "ffe3b3"},
    {"id": "vampire",   "name": "吸血鬼贵族", "emoji": "🦇", "style": "lorelei",           "seed": "Lilith",      "bg": "5c3d6e"},
    {"id": "scientist", "name": "理工博士",   "emoji": "🔬", "style": "micah",             "seed": "ChenMo",      "bg": "cfe0ff"},
    {"id": "healing",   "name": "治愈花店",   "emoji": "🌸", "style": "lorelei",           "seed": "Ying",        "bg": "ffe4ee"},
    {"id": "ojousama",  "name": "名门大小姐", "emoji": "❄️", "style": "lorelei",           "seed": "Yukino",      "bg": "e3efff"},
    {"id": "catgirl",   "name": "猫娘",       "emoji": "🐱", "style": "adventurer",         "seed": "Mimi",        "bg": "ffe9d6"},
    {"id": "elf",       "name": "精灵王子",   "emoji": "🏹", "style": "adventurer-neutral", "seed": "Allen",       "bg": "d5f5d8"},
    {"id": "ojou",      "name": "优雅御姐",   "emoji": "👑", "style": "lorelei",           "seed": "Victoria",    "bg": "f3d9e2"},
    {"id": "robot",     "name": "仿生人",     "emoji": "🤖", "style": "bottts",            "seed": "Zero",        "bg": "d9f0f5"},
    {"id": "yandere",   "name": "病娇妹妹",   "emoji": "🖤", "style": "lorelei",           "seed": "An",          "bg": "5a2330"},
    {"id": "nurse",     "name": "温柔护士",   "emoji": "💉", "style": "lorelei",           "seed": "Nana",        "bg": "ffe0e6"},
]

# 额外通用立绘（供用户自定义角色选择）
EXTRAS = [
    {"id": "extra-luna",  "name": "月夜少女",   "emoji": "🌙", "style": "lorelei",           "seed": "Luna",   "bg": "d7d9ff"},
    {"id": "extra-robin", "name": "阳光少年",   "emoji": "⚡", "style": "adventurer-neutral", "seed": "Robin",  "bg": "d8ecff"},
    {"id": "extra-melody","name": "音乐少女",   "emoji": "🎵", "style": "lorelei",           "seed": "Melody", "bg": "ffe9f0"},
    {"id": "extra-pixel", "name": "像素冒险家", "emoji": "🕹️", "style": "pixel-art",          "seed": "PixelHero", "bg": "e8e0ff"},
    {"id": "extra-peep",  "name": "手绘伙伴",   "emoji": "✏️", "style": "open-peeps",         "seed": "Peep",   "bg": "fff3e0"},
    {"id": "extra-nova",  "name": "极简主义",   "emoji": "🎨", "style": "notionists-neutral", "seed": "Nova",   "bg": "e8e4f5"},
    {"id": "extra-ava",   "name": "扁平插画",   "emoji": "🖼️", "style": "avataaars",          "seed": "Ava",    "bg": "ffe8e8"},
    {"id": "extra-bear",  "name": "大耳朵伙伴", "emoji": "🐻", "style": "big-ears",          "seed": "Bear",   "bg": "e8f5e9"},
    {"id": "extra-unit",  "name": "机器人二号", "emoji": "⚙️", "style": "bottts-neutral",     "seed": "Unit",   "bg": "e0e7e7"},
    {"id": "extra-mage",  "name": "魔法少女",   "emoji": "🔮", "style": "lorelei",           "seed": "Mage",   "bg": "f3e8ff"},
]

# 其余预设角色的专属立绘（与 PRESET_CHARACTERS 一一对应）
PRESET_EXTRAS = [
    {"id": "preset-baiqi",  "name": "霸道总裁",   "emoji": "👔", "style": "micah",             "seed": "BaiQi",   "bg": "e8dff0"},
    {"id": "preset-ye",     "name": "完美执事",   "emoji": "🎩", "style": "micah",             "seed": "Ye",      "bg": "3a3a4a"},
    {"id": "preset-xialuo", "name": "元气学妹",   "emoji": "🎀", "style": "adventurer",         "seed": "Charlotte", "bg": "ffe9f0"},
    {"id": "preset-xiaozhi","name": "邻家弟弟",   "emoji": "⚡", "style": "adventurer-neutral", "seed": "XiaoZhi", "bg": "fff3d8"},
    {"id": "preset-laochen","name": "茶馆大叔",   "emoji": "🍵", "style": "micah",             "seed": "LaoChen", "bg": "e8e0d0"},
    {"id": "preset-athena", "name": "智慧女神",   "emoji": "🦉", "style": "lorelei",           "seed": "Athena",  "bg": "e8e8ff"},
    {"id": "preset-huayin", "name": "音乐少女",   "emoji": "🎵", "style": "lorelei",           "seed": "Huayin",  "bg": "e8f5ff"},
    {"id": "preset-qingfeng","name": "修仙道者",  "emoji": "🏔️", "style": "adventurer-neutral", "seed": "QingFeng", "bg": "e8f0e8"},
]


def fetch(url: str, retries: int = 4) -> bytes:
    last = None
    for i in range(retries):
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) SoulMate/1.0"},
            )
            with urllib.request.urlopen(req, timeout=40) as r:
                data = r.read()
                if b"<svg" in data[:100]:
                    return data
                raise ValueError(f"非 SVG 内容: {data[:60]!r}")
        except Exception as e:  # noqa: BLE001
            last = e
            time.sleep(1 + i * 2)
    raise last


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    manifest = []
    items = THEMES + EXTRAS + PRESET_EXTRAS
    force = "--force" in __import__("sys").argv
    for t in items:
        url = API.format(style=t["style"], seed=urllib.parse.quote(t["seed"]), bg=t["bg"])
        path = os.path.join(OUT_DIR, f"{t['id']}.svg")
        if os.path.exists(path) and not force:
            manifest.append({"id": t["id"], "name": t["name"], "emoji": t["emoji"], "path": f"/portraits/{t['id']}.svg"})
            print(f"SKIP {t['id']:>16} (已存在)")
            continue
        try:
            data = fetch(url)
            with open(path, "wb") as f:
                f.write(data)
            manifest.append({"id": t["id"], "name": t["name"], "emoji": t["emoji"], "path": f"/portraits/{t['id']}.svg"})
            print(f"OK   {t['id']:>14} {t['style']:<18} {len(data):>6}B")
        except Exception as e:  # noqa: BLE001
            print(f"FAIL {t['id']:>14} :: {e}")

    # 清单按 id 排序
    manifest.sort(key=lambda x: x["id"])
    with open(os.path.join(OUT_DIR, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print(f"\n完成：{len(manifest)}/{len(items)} 张 -> backend/portraits/")

    # 许可说明
    with open(os.path.join(OUT_DIR, "README.txt"), "w", encoding="utf-8") as f:
        f.write(
            "SoulMate 内置立绘\n"
            "来源：DiceBear (https://www.dicebear.com) 开源 SVG 头像库\n"
            "许可：DiceBear 核心样式为 CC0 公有领域 / MIT，可自由商用\n"
            "重新生成：python scripts/download_portraits.py（需联网）\n"
        )


if __name__ == "__main__":
    main()
