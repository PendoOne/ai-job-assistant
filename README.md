# AI Job Assistant

帮助AI求职者分析岗位、匹配技能、生成学习路线的AI产品。

## 项目结构

```
ai-job-assistant/
├── claude.md              # Claude Code 项目配置
├── README.md              # 项目说明
├── docs/                  # 文档
├── data/                  # 数据文件（岗位要求、OCR数据等）
│   ├── job-requirements/  # 原始岗位要求图片和OCR结果
│   └── tessdata/          # Tesseract OCR 语言数据
├── prompts/               # Prompt 模板
├── src/                   # 核心源码模块
│   ├── jd-parser/         # 岗位JD解析
│   ├── skill-extractor/   # 技能标签提取
│   ├── requirement-analyzer/ # 岗位要求分析
│   ├── resume-matcher/    # 简历匹配
│   ├── learning-path/     # 学习建议生成
│   └── hr-scorer/         # AI模拟HR评分
├── ui/                    # 前端界面
│   ├── compare.html       # AI岗位对比工具
│   └── job-list.html      # 岗位整理报告
└── workflow/              # 工作流定义
```

## 技术栈

- HTML/CSS/JS
- Claude Code
- Prompt Engineering
- Tesseract.js (OCR)

## 当前阶段

MVP 开发阶段
