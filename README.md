# 🌅 逐光手帐

一款可爱的恐龙主题每日打卡桌面应用，帮助你逐光前行，记录每一天。

## ✨ 功能特色

- 📅 **每日打卡** — 连续打卡奖励金币，养成好习惯
- 📝 **心情日记** — 记录每天的心情和想法
- 🎯 **成就系统** — 基础、进阶、挑战、传说多档成就等你解锁
- 🎰 **抽卡系统** — 普通/高级抽奖，获取限定物品
- 🛒 **主题商店** — 主题、特效、相框、音效、语录包等丰富商品
- 🎭 **隐藏台词** — 购买商品或打卡触发隐藏对话
- 📮 **时光邮箱** — 给未来的自己写一封信
- 📊 **周报统计** — 查看打卡数据和心情趋势
- 🎉 **节日彩蛋** — 25+ 中西节日活动和限定奖励
- 🌙 **深色模式** — 护眼深色主题

## 🛠️ 技术栈

- **前端框架**：Vue 3 + Pinia
- **构建工具**：Vite
- **桌面框架**：Electron
- **打包工具**：electron-builder

## 📦 安装与运行

```bash
# 克隆项目
git clone https://github.com/your-username/dino-app.git
cd dino-app

# 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建安装包
npm run build
```

## 📁 项目结构

```
dino-app/
├── electron/          # Electron 主进程
│   ├── main.cjs
│   └── preload.cjs
├── public/            # 静态资源
├── src/
│   ├── assets/        # 图片资源
│   ├── components/    # 公共组件
│   ├── composables/   # 组合式函数
│   ├── data/          # 数据文件
│   ├── pages/         # 页面组件
│   ├── stores/        # Pinia 状态管理
│   └── styles/        # 全局样式
├── package.json
└── vite.config.js
```

## 📄 开源许可

本项目基于 [GPL-3.0](./LICENSE) 许可证开源。
