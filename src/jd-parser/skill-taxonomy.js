/**
 * AI Job Assistant - Skill Taxonomy
 * 13 categories, 300+ keywords covering AI industry job skills
 */
(function () {
  const SKILL_TAXONOMY = {
    "ai-frameworks": {
      label: "AI/ML框架",
      color: "#2f54eb",
      keywords: [
        { en: "PyTorch", zh: "PyTorch", aliases: [], weight: 2 },
        { en: "TensorFlow", zh: "TensorFlow", aliases: ["tf"], weight: 2 },
        { en: "JAX", zh: "JAX", aliases: [], weight: 1.5 },
        { en: "Keras", zh: "Keras", aliases: [], weight: 1.5 },
        { en: "Scikit-learn", zh: "Scikit-learn", aliases: ["sklearn"], weight: 1.5 },
        { en: "XGBoost", zh: "XGBoost", aliases: [], weight: 1 },
        { en: "ONNX", zh: "ONNX", aliases: [], weight: 1 },
        { en: "OpenCV", zh: "OpenCV", aliases: [], weight: 1.5 },
        { en: "HuggingFace", zh: "HuggingFace", aliases: ["Hugging Face", "huggingface"], weight: 2 },
        { en: "Transformers", zh: "Transformers", aliases: [], weight: 1.5 },
        { en: "Diffusers", zh: "Diffusers", aliases: [], weight: 1 },
        { en: "CUDA", zh: "CUDA", aliases: ["cuda"], weight: 1 },
        { en: "Ollama", zh: "Ollama", aliases: [], weight: 1 },
        { en: "vLLM", zh: "vLLM", aliases: [], weight: 1 },
        { en: "OpenAI API", zh: "OpenAI API", aliases: ["openai"], weight: 1.5 },
        { en: "机器学习", zh: "机器学习", aliases: ["Machine Learning", "ML"], weight: 2 },
        { en: "深度学习", zh: "深度学习", aliases: ["Deep Learning", "DL"], weight: 2 },
        { en: "自然语言处理", zh: "自然语言处理", aliases: ["NLP"], weight: 1.5 },
        { en: "计算机视觉", zh: "计算机视觉", aliases: ["CV", "Computer Vision"], weight: 1.5 },
        { en: "强化学习", zh: "强化学习", aliases: ["RL"], weight: 1 },
        { en: "模型训练", zh: "模型训练", aliases: ["模型微调", "Fine-tuning", "finetune"], weight: 2 },
        { en: "模型部署", zh: "模型部署", aliases: ["模型上线"], weight: 1.5 },
        { en: "模型评估", zh: "模型评估", aliases: ["模型测试", "模型评测"], weight: 1.5 }
      ]
    },
    "llm-tools": {
      label: "大模型工具链",
      color: "#722ed1",
      keywords: [
        { en: "LangChain", zh: "LangChain", aliases: ["langchain"], weight: 2 },
        { en: "LlamaIndex", zh: "LlamaIndex", aliases: ["llamaindex"], weight: 1.5 },
        { en: "AutoGPT", zh: "AutoGPT", aliases: [], weight: 1 },
        { en: "CrewAI", zh: "CrewAI", aliases: [], weight: 1 },
        { en: "Semantic Kernel", zh: "Semantic Kernel", aliases: [], weight: 1 },
        { en: "PromptFlow", zh: "PromptFlow", aliases: [], weight: 1 },
        { en: "RAG", zh: "RAG检索增强生成", aliases: ["检索增强生成"], weight: 2 },
        { en: "AI Agent", zh: "AI Agent", aliases: ["Agent", "智能体", "AI智能体"], weight: 2 },
        { en: "VectorDB", zh: "向量数据库", aliases: ["向量检索", "向量库"], weight: 1.5 },
        { en: "Pinecone", zh: "Pinecone", aliases: [], weight: 1 },
        { en: "Chroma", zh: "Chroma", aliases: ["ChromaDB"], weight: 1 },
        { en: "Milvus", zh: "Milvus", aliases: [], weight: 1 },
        { en: "Dify", zh: "Dify", aliases: [], weight: 1.5 },
        { en: "Coze", zh: "Coze", aliases: ["扣子"], weight: 1.5 },
        { en: "大模型应用", zh: "大模型应用", aliases: ["LLM应用", "大模型落地"], weight: 2 },
        { en: "模型训练平台", zh: "模型训练平台", aliases: [], weight: 1 }
      ]
    },
    "ai-apps": {
      label: "AI应用工具",
      color: "#eb2f96",
      keywords: [
        { en: "ChatGPT", zh: "ChatGPT", aliases: ["chatgpt", "GPT", "GPT-4", "GPT4"], weight: 2 },
        { en: "Claude", zh: "Claude", aliases: ["claude", "Claude AI", "Claude Code"], weight: 2 },
        { en: "Claude Code", zh: "Claude Code", aliases: ["claude code"], weight: 2 },
        { en: "Cursor", zh: "Cursor", aliases: ["cursor"], weight: 2 },
        { en: "Copilot", zh: "GitHub Copilot", aliases: ["GitHub Copilot", "copilot"], weight: 1.5 },
        { en: "Codex", zh: "Codex", aliases: [], weight: 1 },
        { en: "Midjourney", zh: "Midjourney", aliases: ["midjourney", "MJ"], weight: 2 },
        { en: "Stable Diffusion", zh: "Stable Diffusion", aliases: ["SD", "stable diffusion"], weight: 2 },
        { en: "DALL-E", zh: "DALL-E", aliases: ["DALL·E", "DALL-E 3"], weight: 1.5 },
        { en: "ComfyUI", zh: "ComfyUI", aliases: ["comfyui"], weight: 2 },
        { en: "WebUI", zh: "Stable Diffusion WebUI", aliases: ["SD WebUI", "AUTOMATIC1111"], weight: 1 },
        { en: "Kling", zh: "可灵(Kling)", aliases: ["可灵", "Kling", "KLING"], weight: 2 },
        { en: "即梦", zh: "即梦", aliases: ["即梦AI", "Jimeng"], weight: 1.5 },
        { en: "海螺AI", zh: "海螺AI", aliases: ["海螺", "Hailuo"], weight: 1.5 },
        { en: "豆包", zh: "豆包", aliases: ["豆包AI", "Doubao"], weight: 1 },
        { en: "Sora", zh: "Sora", aliases: ["sora"], weight: 1.5 },
        { en: "NanoBanana", zh: "NanoBanana", aliases: ["nanobanana", "Nano Banana"], weight: 1.5 },
        { en: "AI工作流", zh: "AI工作流", aliases: ["AI workflow", "AI pipeline"], weight: 1.5 }
      ]
    },
    "ai-video": {
      label: "AI视频生成",
      color: "#fa541c",
      keywords: [
        { en: "Runway", zh: "Runway", aliases: ["RunwayML", "Runway ML"], weight: 2 },
        { en: "Pika", zh: "Pika", aliases: ["Pika Labs", "PikaLabs", "pika"], weight: 2 },
        { en: "Luma", zh: "Luma AI", aliases: ["Luma AI", "LumaAI"], weight: 1.5 },
        { en: "AI视频生成", zh: "AI视频生成", aliases: ["AI视频制作", "AI视频", "AI生成视频"], weight: 2 },
        { en: "AI短剧", zh: "AI短剧", aliases: ["AI短剧制作"], weight: 1 },
        { en: "CapCut", zh: "CapCut", aliases: ["capcut"], weight: 1 },
        { en: "剪映", zh: "剪映", aliases: ["Jianying"], weight: 1.5 },
        { en: "视频生成模型", zh: "视频生成模型", aliases: [], weight: 1.5 }
      ]
    },
    "programming": {
      label: "编程语言",
      color: "#52c41a",
      keywords: [
        { en: "Python", zh: "Python", aliases: ["python"], weight: 2 },
        { en: "Java", zh: "Java", aliases: ["java"], weight: 1.5 },
        { en: "C++", zh: "C++", aliases: ["cpp", "CPlusPlus"], weight: 1.5 },
        { en: "Go", zh: "Go", aliases: ["Golang", "golang"], weight: 1.5 },
        { en: "JavaScript", zh: "JavaScript", aliases: ["JS", "javascript"], weight: 1.5 },
        { en: "TypeScript", zh: "TypeScript", aliases: ["TS", "typescript"], weight: 1.5 },
        { en: "SQL", zh: "SQL", aliases: ["sql"], weight: 1.5 },
        { en: "Rust", zh: "Rust", aliases: ["rust"], weight: 1 },
        { en: "Swift", zh: "Swift", aliases: ["swift"], weight: 1 },
        { en: "Kotlin", zh: "Kotlin", aliases: ["kotlin"], weight: 1 },
        { en: "R", zh: "R语言", aliases: ["R", "R语言"], weight: 1 },
        { en: "MATLAB", zh: "MATLAB", aliases: ["matlab"], weight: 1 },
        { en: "Shell", zh: "Shell", aliases: ["Bash", "shell"], weight: 1 },
        { en: "编程基础", zh: "编程基础", aliases: ["编程能力", "代码能力"], weight: 1.5 }
      ]
    },
    "design-tools": {
      label: "设计工具",
      color: "#13c2c2",
      keywords: [
        { en: "Photoshop", zh: "Photoshop", aliases: ["PS", "Adobe PS", "Adobe Photoshop"], weight: 2 },
        { en: "Illustrator", zh: "Illustrator", aliases: ["Adobe Illustrator"], weight: 1.5 },
        { en: "Figma", zh: "Figma", aliases: ["figma"], weight: 2 },
        { en: "Sketch", zh: "Sketch", aliases: ["sketch"], weight: 1 },
        { en: "After Effects", zh: "After Effects", aliases: ["AE", "Adobe AE"], weight: 2 },
        { en: "Premiere", zh: "Premiere", aliases: ["PR", "Adobe PR", "Premiere Pro", "Adobe Premiere"], weight: 2 },
        { en: "Final Cut", zh: "Final Cut Pro", aliases: ["Final Cut Pro", "FCP", "FCPX"], weight: 1.5 },
        { en: "DaVinci", zh: "DaVinci Resolve", aliases: ["达芬奇", "DaVinci Resolve"], weight: 1 },
        { en: "Blender", zh: "Blender", aliases: ["blender"], weight: 1.5 },
        { en: "C4D", zh: "Cinema 4D", aliases: ["Cinema 4D", "C4D"], weight: 1 },
        { en: "Spline", zh: "Spline", aliases: ["spline"], weight: 1 },
        { en: "Maya", zh: "Maya", aliases: ["maya"], weight: 1 },
        { en: "3ds Max", zh: "3ds Max", aliases: ["3dsMax"], weight: 1 },
        { en: "设计能力", zh: "设计能力", aliases: ["美术功底", "审美能力"], weight: 1.5 }
      ]
    },
    "cloud-devops": {
      label: "云与DevOps",
      color: "#faad14",
      keywords: [
        { en: "Docker", zh: "Docker", aliases: ["docker"], weight: 1.5 },
        { en: "Kubernetes", zh: "Kubernetes", aliases: ["K8s", "k8s", "K8S"], weight: 1.5 },
        { en: "AWS", zh: "AWS", aliases: ["aws"], weight: 1.5 },
        { en: "Azure", zh: "Azure", aliases: ["azure"], weight: 1 },
        { en: "GCP", zh: "GCP", aliases: ["Google Cloud", "gcp"], weight: 1 },
        { en: "阿里云", zh: "阿里云", aliases: ["Alibaba Cloud", "AlibabaCloud"], weight: 1 },
        { en: "腾讯云", zh: "腾讯云", aliases: ["Tencent Cloud"], weight: 1 },
        { en: "CI/CD", zh: "CI/CD", aliases: ["CICD", "持续集成", "持续部署"], weight: 1 },
        { en: "Jenkins", zh: "Jenkins", aliases: ["jenkins"], weight: 0.5 },
        { en: "Git", zh: "Git", aliases: ["git"], weight: 1.5 },
        { en: "Linux", zh: "Linux", aliases: ["linux"], weight: 1.5 },
        { en: "API开发", zh: "API开发", aliases: ["API设计", "RESTful", "接口开发"], weight: 1 }
      ]
    },
    "data-engineering": {
      label: "数据工程",
      color: "#2f54eb",
      keywords: [
        { en: "Spark", zh: "Spark", aliases: ["Apache Spark"], weight: 1 },
        { en: "Hadoop", zh: "Hadoop", aliases: [], weight: 0.5 },
        { en: "Flink", zh: "Flink", aliases: [], weight: 1 },
        { en: "Kafka", zh: "Kafka", aliases: [], weight: 1 },
        { en: "Airflow", zh: "Airflow", aliases: [], weight: 0.5 },
        { en: "pandas", zh: "pandas", aliases: [], weight: 1.5 },
        { en: "NumPy", zh: "NumPy", aliases: ["numpy"], weight: 1.5 },
        { en: "Matplotlib", zh: "Matplotlib", aliases: [], weight: 0.5 },
        { en: "Tableau", zh: "Tableau", aliases: [], weight: 0.5 },
        { en: "PowerBI", zh: "Power BI", aliases: ["Power BI"], weight: 0.5 },
        { en: "Excel", zh: "Excel", aliases: [], weight: 1 },
        { en: "数据分析", zh: "数据分析", aliases: ["数据处理", "数据统计"], weight: 2 },
        { en: "SQL查询", zh: "SQL查询", aliases: ["数据查询"], weight: 1.5 },
        { en: "数据可视化", zh: "数据可视化", aliases: [], weight: 1 }
      ]
    },
    "soft-skills": {
      label: "软技能",
      color: "#1a1a2e",
      keywords: [
        { en: "沟通能力", zh: "沟通能力", aliases: ["沟通协作", "善于沟通"], weight: 1.5 },
        { en: "团队协作", zh: "团队协作", aliases: ["团队合作", "协作能力"], weight: 1.5 },
        { en: "跨部门沟通", zh: "跨部门沟通", aliases: ["跨团队协作", "跨部门协作"], weight: 1.5 },
        { en: "逻辑思维", zh: "逻辑思维", aliases: ["逻辑分析", "逻辑清晰"], weight: 1.5 },
        { en: "问题解决", zh: "问题解决", aliases: ["解决问题", "解决能力"], weight: 1.5 },
        { en: "自驱力", zh: "自驱力", aliases: ["自我驱动", "自驱", "主动性强"], weight: 1 },
        { en: "学习能力", zh: "学习能力", aliases: ["快速学习", "学习意愿"], weight: 1.5 },
        { en: "创造力", zh: "创造力", aliases: ["创意能力", "创新能力"], weight: 1 },
        { en: "执行能力", zh: "执行能力", aliases: ["执行力", "落地能力"], weight: 1 },
        { en: "领导力", zh: "领导力", aliases: ["管理能力", "带团队"], weight: 0.5 },
        { en: "项目管理", zh: "项目管理", aliases: ["项目推进", "项目协调"], weight: 1.5 },
        { en: "时间管理", zh: "时间管理", aliases: ["多任务处理"], weight: 0.5 },
        { en: "抗压能力", zh: "抗压能力", aliases: ["抗压", "承压能力"], weight: 1 },
        { en: "复盘总结", zh: "复盘总结", aliases: ["复盘", "总结归纳"], weight: 0.5 }
      ]
    },
    "product-skills": {
      label: "产品能力",
      color: "#0f3460",
      keywords: [
        { en: "PRD", zh: "PRD撰写", aliases: ["PRD", "产品需求文档"], weight: 2 },
        { en: "需求分析", zh: "需求分析", aliases: ["需求调研", "需求挖掘", "用户需求"], weight: 2 },
        { en: "用户研究", zh: "用户研究", aliases: ["用户调研", "用户访谈", "用户洞察"], weight: 2 },
        { en: "竞品分析", zh: "竞品分析", aliases: ["竞品调研", "市场分析"], weight: 1.5 },
        { en: "产品设计", zh: "产品设计", aliases: ["产品方案", "产品策划"], weight: 2 },
        { en: "原型设计", zh: "原型设计", aliases: ["原型搭建", "原型图"], weight: 1.5 },
        { en: "产品规划", zh: "产品规划", aliases: ["产品策略", "产品路线图"], weight: 1.5 },
        { en: "A/B测试", zh: "A/B测试", aliases: ["AB测试", "AB实验"], weight: 1 },
        { en: "用户增长", zh: "用户增长", aliases: ["增长策略", "增长运营"], weight: 1 },
        { en: "用户画像", zh: "用户画像", aliases: ["用户分层"], weight: 1 },
        { en: "产品运营", zh: "产品运营", aliases: ["产品推广"], weight: 1 },
        { en: "AI产品", zh: "AI产品", aliases: ["AI产品设计", "AI产品经理", "AI产品工程"], weight: 2 }
      ]
    },
    "content-creation": {
      label: "内容创作",
      color: "#fa8c16",
      keywords: [
        { en: "内容创作", zh: "内容创作", aliases: ["内容制作", "内容生产"], weight: 1.5 },
        { en: "内容运营", zh: "内容运营", aliases: ["内容策划", "内容策略"], weight: 1.5 },
        { en: "文案写作", zh: "文案写作", aliases: ["文案撰写", "文案", "写作能力", "文字功底"], weight: 1.5 },
        { en: "脚本撰写", zh: "脚本撰写", aliases: ["脚本创作", "脚本策划"], weight: 1.5 },
        { en: "漫画创作", zh: "漫画创作", aliases: ["漫画制作", "漫画绘制", "漫画"], weight: 1.5 },
        { en: "分镜设计", zh: "分镜设计", aliases: ["分镜", "故事板", "storyboard"], weight: 1.5 },
        { en: "色彩搭配", zh: "色彩搭配", aliases: ["配色", "调色", "色彩调整"], weight: 1.5 },
        { en: "细节优化", zh: "细节优化", aliases: ["细节调整", "精细化", "细节把控"], weight: 1.2 },
        { en: "视频剪辑", zh: "视频剪辑", aliases: ["视频制作", "视频编辑", "剪辑"], weight: 2 },
        { en: "短视频", zh: "短视频", aliases: ["短视频运营", "短视频制作"], weight: 1.5 },
        { en: "社媒运营", zh: "社媒运营", aliases: ["社交媒体运营", "社交媒体"], weight: 1.5 },
        { en: "公众号", zh: "公众号", aliases: ["微信公众号", "公众号运营"], weight: 1 },
        { en: "小红书", zh: "小红书", aliases: ["RED", "小红书运营"], weight: 1.5 },
        { en: "抖音", zh: "抖音", aliases: ["Douyin", "TikTok国内"], weight: 1.5 },
        { en: "bilibili", zh: "bilibili", aliases: ["B站", "Bilibili"], weight: 1.5 },
        { en: "Instagram", zh: "Instagram", aliases: ["INS", "IG"], weight: 1 },
        { en: "TikTok", zh: "TikTok", aliases: ["tiktok", "TK"], weight: 1.5 },
        { en: "YouTube", zh: "YouTube", aliases: ["youtube", "YT"], weight: 1 },
        { en: "活动策划", zh: "活动策划", aliases: ["活动运营"], weight: 1 },
        { en: "社群运营", zh: "社群运营", aliases: ["社区运营"], weight: 1 }
      ]
    },
    "domain-knowledge": {
      label: "领域知识",
      color: "#722ed1",
      keywords: [
        { en: "游戏理解", zh: "游戏理解", aliases: ["游戏行业", "游戏经验", "游戏热爱"], weight: 2 },
        { en: "游戏设计", zh: "游戏设计", aliases: ["游戏策划", "游戏玩法"], weight: 1.5 },
        { en: "游戏美术", zh: "游戏美术", aliases: ["游戏原画", "游戏风格"], weight: 1 },
        { en: "游戏运营", zh: "游戏运营", aliases: ["游戏发行", "游戏推广"], weight: 1 },
        { en: "海外市场", zh: "海外市场", aliases: ["出海", "海外经验", "全球化"], weight: 1.5 },
        { en: "海外发行", zh: "海外发行", aliases: ["出海发行"], weight: 1 },
        { en: "英语", zh: "英语能力", aliases: ["英语", "英文", "English"], weight: 2 },
        { en: "日语", zh: "日语能力", aliases: ["日语", "日文", "Japanese"], weight: 1 },
        { en: "韩语", zh: "韩语能力", aliases: ["韩语", "韩文", "Korean"], weight: 1 },
        { en: "多语种", zh: "多语种能力", aliases: ["多语言"], weight: 1.5 },
        { en: "电商", zh: "电商", aliases: ["电商运营", "电子商务"], weight: 1 },
        { en: "广告投放", zh: "广告投放", aliases: ["广告优化", "投放策略"], weight: 1 },
        { en: "信息流", zh: "信息流广告", aliases: ["feed广告", "信息流"], weight: 1 },
        { en: "KOL营销", zh: "KOL营销", aliases: ["达人运营", "KOL运营"], weight: 1.5 },
        { en: "Google/Meta", zh: "Google/Meta广告", aliases: ["Google广告", "Meta广告", "Facebook广告"], weight: 1 },
        { en: "文学创作", zh: "文学创作", aliases: ["文字创作", "写作"], weight: 1 },
        { en: "乙女游戏", zh: "乙女游戏", aliases: [], weight: 0.5 }
      ]
    },
    "prompt-engineering": {
      label: "提示词工程",
      color: "#eb2f96",
      keywords: [
        { en: "Prompt Engineering", zh: "Prompt Engineering", aliases: ["Prompt工程", "提示词工程"], weight: 2 },
        { en: "提示词优化", zh: "提示词优化", aliases: ["Prompt优化", "Prompt调试", "Prompt Tuning"], weight: 2 },
        { en: "提示词撰写", zh: "提示词撰写", aliases: ["Prompt撰写", "写Prompt"], weight: 2 },
        { en: "Prompt", zh: "Prompt", aliases: ["prompt", "提示词"], weight: 1.5 },
        { en: "工作流设计", zh: "工作流设计", aliases: ["AI工作流设计", "Prompt工作流"], weight: 1 }
      ]
    }
  };

  const JOB_DIRECTIONS = {
    "ai-product": {
      label: "AI产品/应用",
      icon: "📱",
      color: "#2f54eb",
      strong: [
        "PRD", "需求分析", "用户研究", "产品设计", "产品经理", "AI产品", "产品运营",
        "原型设计", "产品规划", "AI产品设计", "AI产品工程", "AI产品经理"
      ],
      moderate: [
        "数据分析", "竞品分析", "跨部门沟通", "用户画像", "A/B测试", "AI工作流",
        "大模型应用", "产品策略"
      ],
      weak: ["ChatGPT", "Claude", "Python"]
    },
    "aigc-design": {
      label: "AIGC/视频/设计",
      icon: "🎨",
      color: "#eb2f96",
      strong: [
        "Midjourney", "Stable Diffusion", "Runway", "ComfyUI", "AIGC工具", "AI视频生成",
        "AI视频制作", "AI短剧", "视频剪辑", "素材设计", "Kling", "可灵", "即梦",
        "DALL-E", "Pika", "Luma", "Sora", "海螺AI", "Dify"
      ],
      moderate: [
        "Photoshop", "PS", "AE", "After Effects", "Premiere", "PR", "CapCut", "剪映",
        "创意策划", "Prompt", "提示词", "提示词工程", "Figma", "设计能力",
        "Final Cut", "DaVinci", "Blender", "C4D", "Maya", "3ds Max", "Spline"
      ],
      weak: ["游戏美术", "Python", "AI工作流"]
    },
    "ai-engineer": {
      label: "AI/大模型算法",
      icon: "🤖",
      color: "#722ed1",
      strong: [
        "PyTorch", "TensorFlow", "大模型", "LLM", "NLP", "机器学习", "深度学习",
        "Transformer", "模型训练", "模型微调", "Fine-tuning", "RAG", "Agent",
        "LangChain", "LlamaIndex", "HuggingFace", "VectorDB", "算法"
      ],
      moderate: [
        "Python", "CUDA", "模型部署", "模型评估", "数据工程", "Docker", "Kubernetes",
        "Prompt Engineering", "vLLM", "Ollama", "自然语言处理", "计算机视觉"
      ],
      weak: ["Git", "Linux", "SQL"]
    },
    "ai-content-ops": {
      label: "AI内容运营",
      icon: "📝",
      color: "#fa8c16",
      strong: [
        "内容创作", "内容运营", "文案写作", "小红书", "抖音", "公众号", "bilibili",
        "社媒运营", "KOL营销", "KOL运营", "社群运营", "短视频", "写作"
      ],
      moderate: [
        "ChatGPT", "Claude", "AI工具", "数据分析", "视频剪辑", "Instagram", "TikTok",
        "YouTube", "活动策划", "剪映", "CapCut"
      ],
      weak: ["英语", "Python"]
    },
    "overseas": {
      label: "AI出海/国际化",
      icon: "🌍",
      color: "#13c2c2",
      strong: [
        "海外市场", "出海", "海外发行", "全球化", "海外经验", "多语种"
      ],
      moderate: [
        "英语", "日语", "韩语", "Google/Meta", "广告投放", "信息流", "KOL营销",
        "TikTok", "Instagram", "YouTube", "跨文化理解"
      ],
      weak: ["AI产品", "数据分析", "内容创作"]
    }
  };

  const COMPETENCY_PATTERNS = [
    { pattern: /具备[^，。；\n]{2,30}(?:能力|经验|思维|意识)/g, importance: "required" },
    { pattern: /有(?:较强|良好|优秀|扎实|一定)[^，。；\n]{0,20}(?:能力|功底|基础)/g, importance: "required" },
    { pattern: /熟悉[^，。；\n]{2,40}(?:优先|者优先|加分)/g, importance: "preferred" },
    { pattern: /熟悉[^，。；\n]{2,40}/g, importance: "preferred" },
    { pattern: /精通[^，。；\n]{2,30}(?:者|优先|者优先)?/g, importance: "preferred" },
    { pattern: /(?:熟练|掌握)[^，。；\n]{2,40}(?:者优先|优先)?/g, importance: "preferred" },
    { pattern: /(?:具备|拥有)[^，。；\n]{2,30}(?:经验|经历|背景)/g, importance: "required" },
    { pattern: /(?:有|具有)(?:良好|优秀|较强|出色)[^，。；\n]{0,15}(?:沟通|协作|逻辑|表达|组织|学习|执行|解决问题|抗压)/g, importance: "required" },
    { pattern: /善于[^，。；\n]{2,30}/g, importance: "required" }
  ];

  window.JDParserData = {
    SKILL_TAXONOMY,
    JOB_DIRECTIONS,
    COMPETENCY_PATTERNS
  };
})();
