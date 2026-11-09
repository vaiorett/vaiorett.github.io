# Vaiorett · 个人作品集网站

> 专注于 **三维视觉表现 / 建筑可视化 / 数字资产制作** 的现代化双语个人作品集网站。  
> 基于纯静态架构构建，零服务器成本，通过 GitHub Pages 自动部署，极速加载。

---

## ✨ 核心特性

- 🌐 **智能双语无缝切换**
  - 中文（默认）与 English 双语独立维护。
  - 初次访问自动读取浏览器语言进行匹配；用户手动切换后，永久记住语言偏好。
- 🌓 **深浅色主题自由切换**
  - 内置浅色（Light）与深色（Dark）双模式，支持系统偏好自适应与手动切换，状态跨页面持久保存。
- 🖼️ **极致性能图片画廊**
  - 全站图片自动化 WebP 格式支持，包含多分辨率响应式加载（800w / 1600w / 原图）。
  - 支持全宽展示、双列排版，内置极简全屏沉浸式灯箱（Lightbox）。
- 🎬 **多平台视频深度集成**
  - 支持 **Bilibili（B站）**、**YouTube** 及 **HTTPS MP4 / WebM 直链视频**。
  - 自动获取视频官方封面，按需加载播放器，首屏秒开不卡顿。
- 🛠️ **内置网页可视化管理后台（零代码）**
  - 自带 `manage.html` 管理后台，普通用户无需打开代码编辑器，直接在浏览器中拖拽上传图片、修改介绍、调整项目展示顺序、设置封面。
  - 支持直接连接 GitHub 个人令牌一键发布，或一键导出 ZIP 增量备份包。
- 🔒 **隐私保护与合规设计**
  - 全站预设 `noindex` 标识，避免搜索引擎过度抓取敏感信息；管理后台令牌仅保存在浏览器临时内存中，绝不写入代码或草稿。

---

## 🚀 新手极速上手指南

### 方式一：日常维护（最推荐，零代码在网页中操作）

平时更新作品、添加新项目、修改文字介绍，**完全不需要懂编程或在终端敲命令**：

1. **打开管理后台**：
   - 线上访问：`https://<你的用户名>.github.io/manage.html`
   - 或者本地双击打开 `manage.html` 文件。
2. **编辑内容**：
   - **新增/管理项目**：在左侧列表点击“＋ 新增项目”或选择已有项目；点击 `↑` / `↓` 按钮可一键调整项目在首页的排序。
   - **添加图片**：将渲染图直接拖拽到上传区，系统会自动在本地将图片转换为高画质 WebP 并生成缩略图。
   - **添加视频**：切换到“项目视频”标签页，粘贴 B站或 YouTube 链接即可。
   - **修改文字**：在中英文标签页下分别填写项目简介、个人职责、使用软件等。
3. **一键发布**：
   - 点击底部的“连接 GitHub”，填入您的 GitHub 访问令牌（Personal Access Token，需具备 `Contents: Read and write` 权限）。
   - 点击“发布所有修改”，系统会自动提交代码至仓库，GitHub Pages 将在 1~3 分钟内自动部署上线！

---

### 方式二：本地运行与预览（本地调试）

如果您希望在电脑本地查看网站效果：

```bash
# 1. 克隆仓库到本地
git clone https://github.com/vaiorett/vaiorett.github.io.git
cd vaiorett.github.io

# 2. 启动本地静态服务器（电脑自带 Python 即可运行）
python3 -m http.server 8770
```

打开浏览器访问以下地址即可预览：
- **作品集首页**：`http://localhost:8770/index.html`
- **英文首页**：`http://localhost:8770/en/index.html`
- **可视化管理后台**：`http://localhost:8770/manage.html`

---

### 方式三：开发者完整构建与测试（进阶）

如果您修改了底层 Astro 模板、SCSS 样式或 Python 构建核心，可进行全量编译：

```bash
# 1. 安装开发构建依赖（需要 Node.js 18+）
npm ci

# 2. 执行全量静态编译
# 会自动构建 Astro 模板、编译 SCSS 压缩样式、并通过 Python 生成 26 个双语 HTML 静态页面
npm run build

# 3. 运行全套自动化测试
# 包含 62 项单元测试、多语言校验、视频卡片及 700+ 本地静态资源完整性检查
npm test
```

---

## 📂 仓库目录结构全景

```text
vaiorett.github.io/
├── .github/workflows/          # 自动化构建与部署工作流（GitHub Actions 持续集成）
│   ├── deploy.yml              # 自动静态编译、测试并发布至 GitHub Pages
│   └── video-covers.yml        # 视频平台官方封面自动抓取与同步
│
├── index.html                  # 网站首页入口
├── manage.html                 # 网页可视化管理后台（核心入口）
├── manage.js                   # 管理后台业务交互逻辑（图片上传、排序、发布等）
├── manage.css                  # 管理后台界面样式
│
├── content-data.js             # 网站文本数据库（简介、工具、项目中文与英文描述）
├── gallery-data.js             # 媒体资源数据库（图片路径、封面、尺寸、视频配置）
├── content-templates.js        # 静态 HTML 骨架模板集合
│
├── content-core.js             # 多语言内容解析与发布合并核心
├── gallery-core.js             # 图库校验、封面提取与媒体合并核心
├── video-core.js               # 视频平台解析与播放器渲染逻辑
├── layout-core.js              # 画廊排版计算与 HTML 标记生成
│
├── app.js                      # 首页分类筛选、画廊灯箱大图浏览交互
├── ui.js                       # 软件工具图标动态加载、交互辅助脚本
├── theme.js                    # 浏览器语言初次自适应、主题模式记忆与持久化
│
├── portfolio.css               # 主样式表（由 SCSS 编译压缩而成）
├── style.css                   # 全局基础重置与排版样式
├── theme.css                   # 主题色变量与备用色盘
│
├── assets/                     # 本地静态资源库
│   ├── fonts/                  # 本地托管字体（IBM Plex Sans、Comic Neue 等）
│   └── icons/                  # 软件品牌矢量 SVG 图标（Blender、3ds Max、UE5 等）
├── images/                     # 图片存储库
│   ├── uploads/                # 管理后台上传的高清作品图与封面缩略图
│   └── responsive/             # 自动切片的多分辨率 WebP 响应式图片
│
├── src/                        # 模板与样式源代码
│   ├── components/             # Astro 页面组件（Home、Project、ProjectCard）
│   ├── layouts/                # Astro 基础布局模板
│   └── styles/                 # SCSS 样式源文件（_fonts.scss, portfolio.scss 等）
│
├── scripts/                    # 自动化脚本工具
│   ├── build.py                # 静态页面核心渲染生成脚本
│   ├── check.py                # 链接、多语言与资源完整性自动化检查脚本
│   ├── collect-templates.mjs   # Astro 模板提取打包脚本
│   └── refresh_video_posters.py# 视频平台官方封面自动抓取与同步脚本
│
├── tests/                      # 自动化测试套件（62+ 项端到端及单元测试）
├── docs/                       # 历史架构文档、开源许可证与优化评测记录
│
├── package.json                # 项目依赖与构建指令配置
├── astro.config.mjs            # Astro 构建配置文件
├── robots.txt / sitemap.xml    # 搜索引擎索引控制文件
└── THIRD_PARTY_NOTICES.md      # 第三方开源项目、字体及图标授权许可声明
```

---

## ❓ 常见问题解答（FAQ）

#### Q1: 为什么仓库主页如此清爽整洁，看不到堆积的 `work-*.html` 文件？
> **答**：本项目采用了**专业级「源码与构建产物彻底分离」架构**。仓库 `main` 分支仅保留干净纯粹的源代码与配置，避免几十个生成的静态 HTML 页面刷屏堆积在 GitHub 首页。当您推送代码或在管理后台一键发布时，**GitHub Actions 会自动触发云端静态构建**，自动生成全部双语页面并秒级发布至 GitHub Pages。如果您需要离线浏览完整静态网页，也可以直接在管理后台点击“导出更新文件”，即可获得包含所有生成的 HTML 网页压缩包。

#### Q2: 我在管理后台点击“发布所有修改”后，为什么线上网页没有立刻更新？
> **答**：GitHub 接收到提交后，GitHub Pages 需要约 1 ~ 3 分钟进行全网静态分发；同时浏览器本地会有短时间缓存。如果未看到更新，可以按 `Ctrl + F5`（Mac 上为 `Cmd + Shift + R`）强制刷新浏览器。

#### Q3: 如何备份我的全部作品与文字？
> **答**：在管理后台（`manage.html`）右下角点击“**导出更新文件 ↓**”，系统会自动将所有修改后的数据文件及新上传的图片打包成一个 ZIP 压缩包下载到您的电脑本地，随时可以作为完整备份保存。

#### Q4: 管理后台填写的 GitHub 令牌（Token）安全吗？
> **答**：非常安全。管理后台的令牌**仅保存在当前浏览器的运行内存中**，用于直接与 GitHub 官方安全 API 通信；该令牌绝不会被保存到本地存储、绝不会写入代码仓库、也绝不会随着网页发布出去。页面刷新或关闭后令牌即自动销毁。

---

## 📄 开源许可与鸣谢

- 视觉设计与卡片交互参考自 [Koibumi Design](https://github.com/haruki-nikaidou/koibumi-blog)（遵循 MIT 协议）。
- 字体与矢量图标均来自开源项目，具体许可证请查阅 [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md)。
- 本仓库中的所有个人三维渲染作品、设计方案及文字版权归作者所有，未经许可请勿商用。
