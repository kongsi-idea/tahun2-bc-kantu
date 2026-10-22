# 心愿瓶看图写话 · 交接

## ⏯️ 目前做到哪
v1.3 已上线（2026-10-22，454498e）：https://tahun2-bc-kantu.vercel.app ，GitHub kongsi-idea/tahun2-bc-kantu，push 到 main 自动部署。**10-22 已上 Hub**（kongsi-idea 93e6ac9，`npm run check` 全过）：封面 draw B 构图（design/cover-final.png，Hub 裁 4:3、og.jpg 1200×900）；DSKP 二年级华文 3.2 写话（dskp-index 新增，topic「写话」）；开场 splash 仍用老师 PPT 第 1 页（刻意保留）。**Hub 署名「李老师」**（10-22 老师说这个工具是李老师的；PPT 也是李老师的课）。
用途：老师 10-23（周五）Google Meet 分享屏幕上二年级看图写话，取代他的 PPT（~/Downloads/看图写话.pptx.pdf）。只有老师操作，无语音、无学生引导（老师自己讲课）。规格见 SPEC.md（原 8 步，现 9 步，见下）。

## 🚦 目前状态
- 9 步：今天写什么／看图找一找（手电筒，12 热区，优先未找到、12 格、提示钮）／心愿瓶的样子／五根手指说一说／范文排一排／我们的段落（盖住）／自己写（横格纸段落＋空格灰字提示＋13 分计时＋无色词语库）／看范文（范文一二三＋全班段落，按手指标色、连接词）／写完检查（三问）。
- 老师 10-22 定的规矩：①**「因为」不放句子开头**（句型改「我（想怎样），因为（为什么）」，老师范文第 4 句改成「我希望大家每天都平安快乐，因为家人一直爱护我。」；他 PPT 第 6、10 页还是旧写法）②**学生要抄的字一律规范楷体**：霞鹜文楷 GB（jsDelivr lxgw-wenkai-gb-web@1.522.0 medium，font-synthesis:none），不用普通文楷 ③词语库词卡不上颜色（免得学生以为要放进同色格）④空格前两个字与空格绑定，不落行首。
- 10-22 老师说不再加功能（建议过的「词卡放大成田字格」「问题变句子」留作下次候选）。
- 2026-10-22：index.html／style.css／app.js／data.js 已实作并本机验收（8 步、三种视窗、拖拽、计时、localStorage）；未部署、未 git init、未上 Hub。截图在 playwright-to-delete/tahun2-bc-kantu/
- 课本出处：待补（页码／单元）
- DSKP 对照：待补（只写本机官方 PDF 核对过的代码）

## ➡️ 下一步
1. 10-23 课后问老师实际使用情况（手电筒在 Meet 里看不看得清、五指选项难度、13 分钟够不够），改版。
2. 学生作业照片 → essay-markup 批改＋整理全班最常见 3 个问题。
3. 候选：词卡点开放大成田字格；第 4 步「问题变句子」高亮；改成可换图／题的看图写话模板（每周换内容、支架逐周减少）。
4. 改版时照 agents.md「改版同步五步」同步 Hub（version／changelog／缩图）。
5. 图片来自老师 PPT（assets/src/ 原图不进 git、不部署）。

## 📋 上架前要备齐（Hub 登记在 kongsi-idea/data/tools.js，规则见 teaching-tools/agents.md）
- [ ] `standards` 能解析出主题（主题标在 dskp-index.js 节点上，同一内容跨年级同一个词；综合复习等例外才用 `topicOverride`）
- [ ] `modes`（全班投影／上台对战／各自练习／回家练习，1–3 个，第一个是主要方式）
- [ ] 缩略图 4 张：封面（看得到教的内容）→ 玩法 → 答对／答错反馈 → 老师端；按 4:3 截
- [ ] 展示名带内容词，同年级套路词不重复；slug／展示名不放月份
- [ ] 复习卷：`collection`／`setLabel` 并登记 TOOL_COLLECTIONS
- [ ] 要老师后台：data/teacher/{slug}.js ＋ TEACHER_TOOLS（不再复制 *-admin.html）

## ⚠️ 注意事项
- 本机测试：`python3 -m http.server 8791 --bind 127.0.0.1`，开 http://127.0.0.1:8791（8765 常被 Hub 本机服务占用）

## 🕐 最后更新
2026-10-22｜Claude Code (Opus 5.5)｜Git：✅ 已推
