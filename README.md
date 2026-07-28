# Flowloom

Flowloom 是一个浏览器原生、可静态部署的流程图编辑器。它把手工绘图、结构化格式迁移、视觉参考层和 OpenAI 兼容 AI 生成统一到同一套图模型中。

## 最高精度能保证到什么程度

不能用一个百分比概括所有格式。可保证的最高等级取决于源文件是否包含图元结构：

| 场景 | 最高可保证等级 | 明确边界 |
| --- | --- | --- |
| Flowloom JSON v1 在同版本应用中导出再导入 | 字段级结构无损往返 | 支持字段中的节点、连线、坐标、尺寸和样式可恢复；浏览器字体渲染仍可能存在平台差异 |
| PNG、JPG、WebP、SVG | 原貌视觉参考 | 原稿作为一个整体对象移动和缩放，不谎称内部元素可独立编辑 |
| PDF | 逐页高分辨率视觉参考 | 使用 PDF.js 渲染全部页面；页面整体可编辑，内部文字和线条不是独立图元 |
| Mermaid、DOT、PlantUML、CSV | 语义结构保真 | 节点和关系可编辑，布局和字体不承诺与其他软件逐像素相同 |
| draw.io、BPMN、Excalidraw、VSDX | 结构或混合保真 | 常见图元可编辑；专有母版、自由曲线、插件图元和复杂效果可能近似 |
| AI 重建图片或文档 | 可编辑近似 | AI 输出具有不确定性，不能承诺固定百分比或逐像素一致 |

因此，当前能够诚实保证的最高精度是：

- 要“完全可编辑且无损往返”，使用 Flowloom JSON。
- 要“原貌不被错误重建”，使用视觉参考导入，原稿作为整体对象保留。
- 对缺少结构信息的图片或普通 PDF，无法同时保证逐像素一致和每个元素独立可编辑。

画布几何方面，尺寸输入可稳定控制到 `1 CSS px`；拖动坐标内部使用浮点数。默认开启 `12 px` 网格吸附，关闭底部网格按钮后可自由定位。需要缩放无损的发布文件时优先导出 SVG。

## 本地启动

需要 Node.js 20 或更高版本。本地地址只有在开发服务器运行时才能打开，它不是永久在线网址。

### 方法一：双击启动

双击项目根目录的 `start-flowloom.cmd`：

1. 首次运行会自动安装依赖。
2. 脚本会启动本地服务器并打开浏览器。
3. 默认地址是 <http://127.0.0.1:5173/>。
4. 启动窗口必须保持打开；按 `Ctrl+C` 或关闭窗口即可停止服务。

### 方法二：PowerShell 启动

```powershell
cd D:\draw
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

终端出现 `Local: http://127.0.0.1:5173/` 后再用浏览器打开该地址。以后已经安装过依赖时，只需要运行最后一条命令。

如果 `5173` 被占用，可以改用其他端口：

```powershell
npm run dev -- --host 127.0.0.1 --port 5174
```

然后访问 <http://127.0.0.1:5174/>。

## 完整使用方法

### 1. 新建和编辑图形

1. 从左侧图形库单击图形，或把图形拖到画布。
2. 双击非图片节点可直接修改文字。
3. 拖动节点四周的连接点建立连线。
4. 单击节点或连线后，在右侧属性面板修改文字、尺寸、颜色、圆角、透明度、线型和路径。
5. 多选节点后可进行左对齐、居中、右对齐、顶部/底部对齐和等距分布。
6. 未选择对象时，右侧面板可执行纵向或横向自动布局。
7. 底部控制条用于缩放、适合画布、网格吸附和缩略图开关。

手机和平板上，左右面板会变成互斥抽屉。打开图形库会自动关闭属性面板，反之亦然。

### 2. 选择、移动和恢复操作

- 顶部箭头为选择工具，手掌为平移工具。
- 选择工具下可以框选；按住 `Shift` 可以多选。
- 按住空格可临时拖动画布。
- 顶部撤销/重做按钮可恢复编辑操作。
- 草稿会自动保存到当前浏览器的 localStorage。
- 大型图片或多页 PDF 可能超过浏览器存储限额，此时应立即导出 Flowloom JSON 备份。

### 3. 导入文件

1. 单击顶部“导入”。
2. 选择文件，或把单个文件拖入导入窗口。
3. 等待解析结果，并查看“结构保真 / 混合保真 / 视觉保真”标记和警告。
4. 单击“导入到画布”。
5. 导入后检查连接关系、字体、专有图形和页面尺寸，再继续编辑。

当前支持：Flowloom JSON/YAML、draw.io XML、Mermaid、Graphviz DOT、PlantUML、BPMN 2.0、Excalidraw、CSV、基础 Visio VSDX、SVG、PNG、JPG、WebP 和 PDF。

### 4. 使用 AI 生成流程图

1. 单击顶部“AI 生成”。
2. 选择场景，并输入业务过程、角色、条件、异常路径和期望输出。
3. 可以添加最多 8 个文本、数据或图片附件。
4. 展开“接口设置”，填写 `Base URL`、模型名称和可选的 `API Key`。
5. 单击“生成流程图”。生成结果会进入画布，并可继续手工编辑。

更稳定的提示词应明确包含：起点、终点、步骤、决策条件、失败路径、参与角色和布局方向。例如：

```text
生成一个横向的软件发布审批流程。包含提交申请、自动化检查、负责人审批、灰度发布、指标判断、全量发布和回滚路径。每个判断必须包含“是/否”分支。
```

### 5. 配置 CCSwitch

Flowloom 调用的是浏览器可访问的 OpenAI Chat Completions 兼容 HTTP 接口。CCSwitch 只切换本机 CLI 配置时，浏览器不能自动读取它；必须确认当前提供方实际暴露了 HTTP 端点。

- `Base URL` 示例：`http://127.0.0.1:3000/v1`
- `模型`：填写该端点实际提供的模型 ID
- `API Key`：端点不要求时可以留空
- “在此浏览器保存 Key”默认关闭；不要把密钥写进 `VITE_*` 环境变量

也可以创建 `.env.local`：

```dotenv
VITE_AI_BASE_URL=http://127.0.0.1:3000/v1
VITE_AI_MODEL=你的模型ID
```

修改 `.env.local` 后必须重启 Flowloom。若出现“无法访问 AI 接口”，依次检查端点是否运行、URL 是否包含正确的 `/v1`、模型 ID、CORS 和浏览器网络限制。

从 GitHub Pages 的 HTTPS 页面访问本机 HTTP 接口时，可能受混合内容、CORS 或 Private Network Access 限制。正式部署建议使用允许目标域名访问的 HTTPS AI 网关。

### 6. 导出和备份

顶部“导出”菜单包含：

- 可继续编辑：Flowloom JSON、draw.io XML、Mermaid、DOT、CSV。
- 用于发布：SVG、PNG、PDF。

Flowloom JSON 是项目主备份格式。PNG/PDF 适合查看和发布，不应作为后续无损编辑的唯一源文件。

### 7. 快捷键

| 快捷键 | 操作 |
| --- | --- |
| `Ctrl+K` | 打开命令面板 |
| `Ctrl+J` | 打开 AI 生成 |
| `Ctrl+O` | 导入文件 |
| `Ctrl+S` | 导出 Flowloom JSON |
| `Ctrl+N` | 新建空白流程图 |
| `Ctrl+Z` / `Ctrl+Shift+Z` | 撤销 / 重做 |
| `Ctrl+Y` | 重做 |
| `Ctrl+C` / `Ctrl+V` | 复制 / 粘贴所选图形 |
| `Ctrl+D` | 复制所选图形 |
| `Ctrl+A` | 全选 |
| `Delete` / `Backspace` | 删除选择 |
| `F` | 适合全部内容 |
| `1` / `2` | 选择工具 / 平移工具 |

## GitHub Pages 发布

项目包含 `.github/workflows/deploy-pages.yml`，工作流会运行 `npm ci`、`npm run build` 并发布 `dist`。

首次创建仓库的命令示例：

```powershell
cd D:\draw
git init
git add .
git commit -m "feat: build Flowloom editor"
git branch -M main
gh repo create flowloom --public --source . --remote origin --push
```

然后在 GitHub 仓库进入 **Settings > Pages**，将 **Source** 设为 **GitHub Actions**。工作流成功后，默认地址为：

```text
https://<GitHub用户名>.github.io/flowloom/
```

Vite 使用相对资源路径，因此项目站点和自定义域名均不需要修改 `base`。

## 常见问题

### `127.0.0.1:5173` 打不开

本地服务器没有运行或启动窗口已关闭。重新双击 `start-flowloom.cmd`，或在 `D:\draw` 执行启动命令。确认终端没有端口占用或依赖安装错误。

### 导入结果和原软件外观不同

先看底部保真状态。结构保真表示图关系可靠，不等于字体和渲染引擎逐像素一致；混合保真表示部分专有能力被近似；视觉保真表示原稿整体保留而未拆图元。

### 草稿保存失败

浏览器 localStorage 容量有限。多页 PDF 和大图片应及时导出 Flowloom JSON；必要时先压缩来源文件。

### GitHub Pages 页面能打开但 AI 失败

静态页面本身正常，但 AI 端点不可从公网 HTTPS 页面访问。需要启用 CORS、HTTPS 和相应网络访问头，或使用部署在公网的兼容网关。

## 开发与验证

```powershell
npm test
npm run lint
npm run build
npm run preview
```

主要格式适配器位于 `src/lib/fileAdapters.ts`。新增格式时必须准确标记：

- `structural`：源结构可可靠编辑。
- `hybrid`：大部分结构可编辑，但存在近似或跳过项。
- `visual`：原貌作为整体参考对象保留。
