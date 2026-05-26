# 项目名称
AI Job Assistant

# 项目目标
这是一个帮助AI求职者分析岗位、匹配技能、生成学习路线的AI产品项目。

# 产品核心功能
1. 解析岗位JD
2. 提取技能标签
3. 分析岗位要求
4. 匹配用户简历
5. 生成学习建议
6. AI模拟HR评分

# 技术方向
- Claude Code
- Cursor
- HTML/CSS/JS
- Prompt Engineering

# UI风格
简洁、现代、AI产品风格
参考：
- Notion
- Linear
- Claude
- Lovable

# 代码规范
- 组件化
- 文件命名清晰
- 保持代码可读性
- 每个功能单独模块

# Prompt规范
- 输出结构化
- 尽量JSON格式
- 保持稳定输出

# 项目结构
```
ai-job-assistant/
├── claude.md              # Claude Code 项目配置
├── README.md              # 项目说明
├── docs/                  # 文档
├── data/                  # 数据文件
│   ├── job-requirements/  # 原始岗位要求图片和OCR结果
│   └── tessdata/          # Tesseract OCR 语言数据
├── prompts/               # Prompt 模板
│   ├── jd-parser.md
│   ├── skill-extractor.md
│   ├── requirement-analyzer.md
│   ├── resume-matcher.md
│   ├── learning-path.md
│   └── hr-scorer.md
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

# 当前阶段
MVP开发阶段

# 当前任务
完成岗位JD解析功能
