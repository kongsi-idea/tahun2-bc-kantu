# 心愿瓶看图写话 · 交接

## ⏯️ 目前做到哪
v1.0 已上线（2026-10-22）：https://tahun2-bc-kantu.vercel.app ，GitHub kongsi-idea/tahun2-bc-kantu，push 到 main 自动部署。**未上 Hub**。
用途：老师 10-23（周五）Google Meet 分享屏幕上二年级看图写话，取代他的 PPT（~/Downloads/看图写话.pptx.pdf）。只有老师操作，无语音、无学生引导（老师自己讲课）。规格见 SPEC.md。

## 🚦 目前状态
- 2026-10-22：index.html／style.css／app.js／data.js 已实作并本机验收（8 步、三种视窗、拖拽、计时、localStorage）；未部署、未 git init、未上 Hub。截图在 playwright-to-delete/tahun2-bc-kantu/
- 课本出处：待补（页码／单元）
- DSKP 对照：待补（只写本机官方 PDF 核对过的代码）

## ➡️ 下一步
1. 10-23 课后问老师实际使用情况（手电筒在 Meet 里看不看得清、五指选项难度、13 分钟够不够），改版。
2. 上 Hub：draw 生成封面（先 1 张 low 三构图对照）、og.jpg、DSKP 对照（3.2 写话，查 kongsi-idea/docs/dskp/tahun2/bahasa-cina.md）、4 张缩图、modes=全班投影。
3. 图片来自老师 PPT（assets/src/ 原图不进 git、不部署）。

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
