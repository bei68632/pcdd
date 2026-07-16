# 自定义修改版 —— 与原版差异说明

本分支 (`my-custom`) 基于原项目 [iori-nav](https://github.com/jy02739244/iori-nav) 进行了以下功能增强和修改。

---

## 1. 新增卡片风格

原版只有风格一/二/三，本分支新增两种风格。

### 风格四

基于风格二（垂直居中布局），**Logo 放大至 104px**。适用于需要突出图标的场景。

> 后台设置路径：系统设置 → 卡片设置 → 桌面/手机卡片 → 风格四

### 风格五

仿 [pcdd.in](https://pcdd.in) 的卡片设计：

```
┌── 上色块（6种随机颜色）──┐
│                          │
│       ┌────────┐         │
│       │  LOGO  │         │  ← 104px，跨越色块边界
│       └────────┘         │
├── 白色区域 ──────────────┤
│       网站名称            │
│       分类标签            │
├──────────────────────────┤
│      访问网站 按钮        │  ← 底部色条，颜色与上色块一致
└──────────────────────────┘
```

特点：
- 上色块和底部按钮颜色一致，6 种预设配色按站点 ID 自动分配
- Logo 104px，圆角 20px，悬停时弹跳放大
- 书签名称的字号/颜色/字体可通过**后台卡片设置**调整

> 后台设置路径：系统设置 → 卡片设置 → 桌面/手机卡片 → 风格五

---

## 2. 父分类分组展示

### 原版行为

选择父级分类时，只显示 **直接归属于该分类** 的书签（通常为 0 条），无法查看子分类下的书签。

### 修改后行为

选择父分类时：
- **先列出父分类直属的书签**
- **再按各个子分类分组展示**，每组有分类名称标题

选择"全部"时：
- **所有书签按直属分类分组展示**

选择叶子分类（无子分类）时：
- 行为不变，平铺展示

### URL 访问分类

```
https://你的域名/?catalog=分类ID
```

| 场景 | URL 示例 |
|------|---------|
| 查看"全部" | `/?catalog=all` |
| 查看分类 ID=5 | `/?catalog=5` |
| 查看分类"前端开发" | `/?catalog=前端开发`（需后台设置默认分类时用名称） |

### 关于分类 ID

在后台管理 → 分类管理页面，每个分类旁边会显示其 ID。也可以直接看前端分类链接的 `data-id` 属性。

---

## 3. Logo 尺寸

- 风格一/二/三：保持原版尺寸（40px / 48px / 25px）
- **风格四/五：统一 104px**

如需在风格四/五中进一步调整 Logo 尺寸，修改以下两处：
- `functions/lib/card-model.js` 中 `logoClass` 的 `card-logo-img` 类（图片元素）
- `public/css/style.css` 中 `.site-card.style-4 .site-icon` 和 `.style-5 .card-logo-img`（CSS 容器）

---

## 4. 页脚修改

左侧 Github 图标+链接 → **改为显示网站名称，链接到首页 `/`**。

网站名称可通过后台「首页设置 → 站点名称」修改。

---

## 5. 搜索框隐藏功能

### 前端开关

右上角新增**放大镜图标按钮**，点击可切换搜索框显隐。状态保存在浏览器 localStorage，刷新不丢失。

### 后台强制隐藏

后台 → 首页设置 → 功能图标 → **「隐藏搜索框」开关**

开启后前台完全不显示搜索框区域和切换按钮。

---

## 改动文件清单

| 文件 | 改动内容 |
|------|---------|
| `functions/constants.js` | `HOME_CACHE_VERSION` → v37 |
| `functions/index.js` | 分组渲染逻辑、`home_hide_search` 控制、`IORI_CATEGORIES` 注入、风格四/五 grid class |
| `functions/lib/card-model.js` | 风格四/五 `cardStyleClass` 映射、大 Logo `logoClass` |
| `functions/lib/card-renderer.js` | `renderGroupedSiteCards` 分组渲染、风格五 HTML 结构 |
| `functions/lib/settings-parser.js` | `home_hide_search` 设置项、风格四/五合法值 |
| `public/admin/index.html` | 风格四/五按钮、隐藏搜索框开关 |
| `public/css/style.css` | 风格四/五完整样式、6 色配色、分组标题样式、搜索切换图标 |
| `public/js/admin-settings-preview-controls.js` | 风格四/五按钮事件、`hideSearchSwitch` 预览监听 |
| `public/js/admin-settings-form.js` | 风格四/五取值、`hideSearchSwitch` 保存/回填 |
| `public/js/admin-settings-defaults.js` | `home_hide_search` 默认值 |
| `public/js/home-cards.js` | 客户端分组渲染、`createSingleCard`、风格五客户端渲染 |
| `public/js/home-category-nav.js` | 分组数据标题计数修复 |
| `public/js/home-search.js` | 搜索时隐藏分组标题 |
| `public/js/home-ui.js` | `initSearchToggle` 搜索切换按钮 |
| `public/index.html` | 页脚 Github → 网站名称 |

---

## 与原版保持同步

```bash
# 拉取上游原版更新
git fetch upstream
git checkout master
git merge upstream/master

# 合并到自定义分支
git checkout my-custom
git merge master
```
