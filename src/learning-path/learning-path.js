/**
 * AI Job Assistant - Learning Path Generator
 * Generates personalized AI Learning Journey from JD analysis + match gaps
 */
(function () {

  // ---- Phase templates by job direction ----
  const PHASE_TEMPLATES = {
    'ai-product': {
      phases: [
        {
          id: 'phase-1',
          title: '第一阶段：AI工具基础',
          duration: '2-3周',
          goals: ['掌握主流AI应用工具', '建立AI产品思维框架', '理解AI能力边界'],
          focusCategories: ['ai-apps', 'prompt-engineering', 'ai-frameworks']
        },
        {
          id: 'phase-2',
          title: '第二阶段：核心产品能力',
          duration: '3-4周',
          goals: ['掌握PRD撰写方法', '建立用户研究体系', '理解AI产品设计流程'],
          focusCategories: ['product-skills', 'soft-skills', 'domain-knowledge']
        },
        {
          id: 'phase-3',
          title: '第三阶段：综合实战',
          duration: '2-3周',
          goals: ['完成端到端AI产品项目', '建立个人作品集', '模拟面试准备'],
          focusCategories: ['product-skills', 'ai-apps', 'data-engineering']
        }
      ]
    },
    'aigc-design': {
      phases: [
        {
          id: 'phase-1',
          title: '第一阶段：AIGC工具基础',
          duration: '2-3周',
          goals: ['掌握主流AIGC工具', '建立AI视觉审美', '理解AIGC工作流'],
          focusCategories: ['ai-video', 'ai-apps', 'design-tools']
        },
        {
          id: 'phase-2',
          title: '第二阶段：创意与设计能力',
          duration: '3-4周',
          goals: ['提升视觉审美与创意策划', '掌握ComfyUI工作流搭建', '学习视频后期制作'],
          focusCategories: ['design-tools', 'content-creation', 'ai-video']
        },
        {
          id: 'phase-3',
          title: '第三阶段：作品集实战',
          duration: '2-3周',
          goals: ['完成完整AIGC视频项目', '建立作品集', '模拟面试准备'],
          focusCategories: ['ai-video', 'content-creation', 'design-tools']
        }
      ]
    },
    'ai-engineer': {
      phases: [
        {
          id: 'phase-1',
          title: '第一阶段：AI工程基础',
          duration: '3-4周',
          goals: ['掌握Python与深度学习框架', '理解Transformer架构', '熟悉LLM生态'],
          focusCategories: ['ai-frameworks', 'programming', 'llm-tools']
        },
        {
          id: 'phase-2',
          title: '第二阶段：LLM应用开发',
          duration: '3-4周',
          goals: ['掌握RAG系统设计', '学习Agent开发', '理解模型微调与部署'],
          focusCategories: ['llm-tools', 'cloud-devops', 'ai-frameworks']
        },
        {
          id: 'phase-3',
          title: '第三阶段：项目实战',
          duration: '2-3周',
          goals: ['完成完整LLM应用项目', '开源贡献', '模拟面试准备'],
          focusCategories: ['llm-tools', 'ai-frameworks', 'data-engineering']
        }
      ]
    },
    'ai-content-ops': {
      phases: [
        {
          id: 'phase-1',
          title: '第一阶段：AI内容工具',
          duration: '2-3周',
          goals: ['掌握AI内容创作工具', '建立内容策略思维', '理解AIGC能力边界'],
          focusCategories: ['ai-apps', 'content-creation', 'prompt-engineering']
        },
        {
          id: 'phase-2',
          title: '第二阶段：内容运营能力',
          duration: '3-4周',
          goals: ['掌握内容策划与运营', '学习数据分析', '建立品牌传播认知'],
          focusCategories: ['content-creation', 'data-engineering', 'soft-skills']
        },
        {
          id: 'phase-3',
          title: '第三阶段：综合实战',
          duration: '2-3周',
          goals: ['完成内容运营项目', '建立作品集', '模拟面试准备'],
          focusCategories: ['content-creation', 'ai-apps', 'data-engineering']
        }
      ]
    }
  };

  // Default template for unrecognized directions
  const DEFAULT_PHASES = [
    {
      id: 'phase-1',
      title: '第一阶段：AI基础能力',
      duration: '2-3周',
      goals: ['掌握主流AI工具', '建立AI思维框架', '理解AI行业趋势'],
      focusCategories: ['ai-apps', 'prompt-engineering', 'ai-frameworks']
    },
    {
      id: 'phase-2',
      title: '第二阶段：核心专业能力',
      duration: '3-4周',
      goals: ['深入岗位核心技能', '建立专业方法论', '积累实践经验'],
      focusCategories: ['product-skills', 'soft-skills', 'domain-knowledge']
    },
    {
      id: 'phase-3',
      title: '第三阶段：项目实战与求职',
      duration: '2-3周',
      goals: ['完成综合项目', '建立个人品牌', '面试准备'],
      focusCategories: ['product-skills', 'ai-apps', 'content-creation']
    }
  ];

  // ---- Learning tips by skill name ----
  const SKILL_TIPS = {
    'ChatGPT': '通过每日使用积累 Prompt 经验，关注官方博客了解最新功能',
    'Claude': '学习 Claude 的 Projects 和 Artifacts 功能，实践长文本处理',
    'Midjourney': '学习参数控制和风格参考，参与社区挑战提升审美',
    'Stable Diffusion': '从基础 prompt 开始，逐步学习 ControlNet 和图像到图像',
    'ComfyUI': '从社区模板开始，逐步理解节点工作流逻辑',
    'Runway': '了解视频生成的基本流程，尝试文字转视频功能',
    'Pika': '从简短 prompt 开始，实验不同风格和时长',
    '可灵(Kling)': '熟悉中文 Prompt 编写技巧，对比国际工具差异',
    'LangChain': '从官方 Quickstart 开始，学习 Chain 和 Agent 概念',
    'RAG': '从简单的文档问答 Demo 开始，理解 Embedding + 检索 + 生成的 Pipeline',
    'Prompt Engineering': '学习思维链(Chain-of-Thought)和少样本提示等核心技巧',
    'Python': '通过 LeetCode 刷题或数据分析项目实践，重点掌握数据处理相关库',
    'PyTorch': '从官方教程开始，完成图像分类和文本生成两个实战项目',
    'TensorFlow': '学习 Keras API，通过迁移学习项目掌握基本用法',
    'Docker': '从容器化一个简单 Web 应用开始，学习 Dockerfile 和 docker-compose',
    'Git': '学习分支管理，通过参与开源项目练习协作流程',
    'SQL': '在 LeetCode 或牛客网刷 SQL 题，掌握查询和聚合操作',
    '数据分析': '用 Kaggle 数据集做分析练习，学习 pandas 和数据可视化',
    'PRD撰写': '阅读优秀 PRD 范例，尝试为熟悉的产品撰写完整 PRD',
    '需求分析': '参与开源项目 Issue 讨论，练习从用户反馈中提取需求',
    '用户研究': '学习用户访谈方法，完成一份完整的用户调研报告',
    '产品设计': '学习 Figma 基础，尝试设计一个功能的交互原型',
    '跨部门沟通': '在项目中主动承担跨角色协调任务，培养沟通和推动能力',
    '项目管理': '学习敏捷开发流程（Scrum），在团队中尝试担任 PM 角色',
    '创意策划': '每周完成一个创意作品，建立灵感收集和策划文档习惯',
    '视觉审美': '建立审美参考库，学习基础设计原则（排版、配色、构图）',
    '逻辑思维': '通过结构化思维训练和案例拆解，锻炼分析和推理能力',
    'AE': '从基础动画和合成开始，学习常用的特效和表达式',
    'Premiere': '掌握基本剪辑流程，学习色彩校正和音频处理',
    '剪映': '从手机版入手熟悉界面，逐步过渡到专业功能',
    '游戏理解': '系统分析不同品类游戏的设计理念，建立游戏设计文档阅读习惯',
    '机器学习': '从吴恩达课程开始，完成经典数据集项目',
    '深度学习': '学习 CNN/RNN/Transformer 等核心架构，完成论文复现项目',
    '自然语言处理': '从文本分类和命名实体识别开始，逐步学习预训练模型',
    'HuggingFace': '学习 Transformers 库，使用 Model Hub 快速搭建 Demo'
  };

  // ---- Resource library ----
  function getResourcesForSkills(skills, directionLabel) {
    const resourceMap = {
      'ChatGPT': [
        { type: 'article', title: 'OpenAI Prompt Engineering Guide', url: 'https://platform.openai.com/docs/guides/prompt-engineering', desc: '官方 Prompt 工程最佳实践' },
        { type: 'course', title: 'ChatGPT Prompt Engineering for Developers', url: 'https://www.deeplearning.ai/short-courses/chatgpt-prompt-engineering-for-developers/', desc: '吴恩达与 OpenAI 合作的免费课程' }
      ],
      'Claude': [
        { type: 'article', title: 'Anthropic Prompt Library', url: 'https://docs.anthropic.com/en/docs/prompt-library', desc: 'Anthropic 官方 Prompt 示例库' },
        { type: 'article', title: 'Claude Code 使用指南', url: 'https://docs.anthropic.com/en/docs/claude-code', desc: 'Claude Code CLI 工具文档' }
      ],
      'Prompt Engineering': [
        { type: 'course', title: 'ChatGPT Prompt Engineering for Developers', url: 'https://www.deeplearning.ai/short-courses/', desc: 'DeepLearning.AI 免费短课程' },
        { type: 'article', title: 'Prompt Engineering Guide', url: 'https://www.promptingguide.ai/', desc: '综合 Prompt 工程学习指南' }
      ],
      'ComfyUI': [
        { type: 'video', title: 'ComfyUI 入门教程系列', url: 'https://www.youtube.com/results?search_query=comfyui+tutorial', desc: 'YouTube 上最受欢迎的 ComfyUI 教程' },
        { type: 'project', title: 'ComfyUI 工作流模板', url: 'https://comfyanonymous.github.io/ComfyUI_examples/', desc: '官方示例工作流集合' }
      ],
      'LangChain': [
        { type: 'article', title: 'LangChain 官方文档', url: 'https://python.langchain.com/docs/', desc: '完整的 LangChain 学习路径' },
        { type: 'course', title: 'LangChain for LLM Application Development', url: 'https://www.deeplearning.ai/short-courses/', desc: 'DeepLearning.AI 免费课程' }
      ],
      'RAG': [
        { type: 'article', title: 'RAG 入门指南', url: 'https://www.promptingguide.ai/techniques/rag', desc: 'RAG 概念与实践指南' },
        { type: 'project', title: 'Build a RAG Chatbot', url: 'https://github.com/langchain-ai/langchain/tree/master/cookbook', desc: 'LangChain Cookbook RAG 示例' }
      ],
      'Python': [
        { type: 'course', title: 'Python for Everybody', url: 'https://www.py4e.com/', desc: '最受欢迎的 Python 入门课程' },
        { type: 'article', title: 'Real Python Tutorials', url: 'https://realpython.com/', desc: '高质量 Python 实战教程' }
      ],
      'PyTorch': [
        { type: 'course', title: 'PyTorch 入门实战', url: 'https://pytorch.org/tutorials/', desc: 'PyTorch 官方教程，从基础到进阶' },
        { type: 'project', title: '动手学深度学习 (D2L)', url: 'https://d2l.ai/', desc: '李沐等人的经典在线教材' }
      ],
      'PRD撰写': [
        { type: 'article', title: '产品需求文档（PRD）撰写指南', url: 'https://zhuanlan.zhihu.com/p/37348804', desc: '知乎高质量 PRD 撰写教程' },
        { type: 'project', title: '优秀 PRD 案例集', url: 'https://www.productplan.com/learn/product-requirements-document/', desc: 'ProductPlan PRD 范例库' }
      ],
      '用户研究': [
        { type: 'article', title: '用户研究方法全景图', url: 'https://www.nngroup.com/articles/which-ux-research-methods/', desc: 'Nielsen Norman Group 方法论' },
        { type: 'course', title: 'UX Design & Research', url: 'https://www.coursera.org/learn/user-research', desc: 'Coursera 用户研究课程' }
      ],
      '数据分析': [
        { type: 'course', title: 'Google Data Analytics Certificate', url: 'https://www.coursera.org/professional-certificates/google-data-analytics', desc: '谷歌数据分析认证课程' },
        { type: 'article', title: 'Kaggle Learn', url: 'https://www.kaggle.com/learn', desc: 'Kaggle 免费数据科学微课程' }
      ],
      'Midjourney': [
        { type: 'article', title: 'Midjourney 官方文档', url: 'https://docs.midjourney.com/', desc: 'Midjourney 完整参数和命令参考' },
        { type: 'video', title: 'Midjourney 进阶技巧', url: 'https://www.youtube.com/results?search_query=midjourney+advanced+tips', desc: 'YouTube 进阶创作技巧合集' }
      ],
      'Stable Diffusion': [
        { type: 'article', title: 'Stable Diffusion WebUI 文档', url: 'https://github.com/AUTOMATIC1111/stable-diffusion-webui/wiki', desc: '最流行的 SD WebUI 文档' },
        { type: 'project', title: 'CivitAI 模型库', url: 'https://civitai.com/', desc: 'AI 模型和作品社区' }
      ],
      'Git': [
        { type: 'article', title: 'Git 分支管理最佳实践', url: 'https://learngitbranching.js.org/', desc: '交互式 Git 学习工具' },
        { type: 'project', title: 'First Contributions', url: 'https://github.com/firstcontributions/first-contributions', desc: '开源项目新手贡献指南' }
      ],
      'Docker': [
        { type: 'course', title: 'Docker 从入门到实践', url: 'https://yeasy.gitbook.io/docker_practice/', desc: '中文 Docker 实践指南' }
      ],
      'SQL': [
        { type: 'course', title: 'SQL for Data Analysis', url: 'https://mode.com/sql-tutorial/', desc: 'Mode Analytics SQL 教程' },
        { type: 'article', title: '牛客网 SQL 实战', url: 'https://www.nowcoder.com/ta/sql', desc: '中文 SQL 刷题平台' }
      ],
      '机器学习': [
        { type: 'course', title: 'Machine Learning Specialization', url: 'https://www.coursera.org/specializations/machine-learning-introduction', desc: '吴恩达机器学习课程' }
      ],
      'HuggingFace': [
        { type: 'article', title: 'HuggingFace Course', url: 'https://huggingface.co/learn/nlp-course', desc: 'HuggingFace 官方 NLP 课程' }
      ]
    };

    const collected = [];
    const seen = new Set();

    for (const skill of skills) {
      const resources = resourceMap[skill];
      if (resources) {
        for (const r of resources) {
          if (!seen.has(r.title)) {
            seen.add(r.title);
            collected.push({ ...r, forSkill: skill });
          }
        }
      }
    }

    // Add general resources if not enough
    if (collected.length < 6) {
      const general = [
        { type: 'article', title: 'AI 行业日报 — The Batch', url: 'https://www.deeplearning.ai/the-batch/', desc: '吴恩达团队的 AI 行业周报', forSkill: '综合' },
        { type: 'project', title: 'Product Hunt AI 产品', url: 'https://www.producthunt.com/topics/artificial-intelligence', desc: '最新 AI 产品发现平台', forSkill: '综合' },
        { type: 'article', title: '通往 AGI 之路', url: 'https://waytoagi.feishu.cn/', desc: '中文 AI 学习知识库', forSkill: '综合' }
      ];
      for (const g of general) {
        if (!seen.has(g.title)) {
          seen.add(g.title);
          collected.push(g);
        }
      }
    }

    return collected.slice(0, 10);
  }

  // ---- Generate learning tip for a skill ----
  function getLearningTip(skillName) {
    if (SKILL_TIPS[skillName]) return SKILL_TIPS[skillName];
    return `建议通过在线教程或实战项目系统学习 ${skillName}，建立基础认知后再深入实践`;
  }

  // ---- Generate AI reasoning for a phase ----
  function generatePhaseAiReason(phase, gaps, strengths, directionLabel) {
    const phaseGaps = gaps.filter(g => phase.assignedSkills.some(s => s.name === g.skill));
    const criticalGaps = phaseGaps.filter(g => g.importance === 'critical');

    const reasons = [];

    if (criticalGaps.length > 0) {
      reasons.push(`岗位要求的 ${criticalGaps.map(g => g.skill).join('、')} 为核心技能，优先掌握这些能力是缩小匹配差距的关键`);
    }

    if (phase.id === 'phase-1') {
      reasons.push('从基础工具入手可以快速建立信心和实践手感，为后续深入学习打下扎实基础');
    } else if (phase.id === 'phase-2') {
      reasons.push('在工具基础上，深入到专业方法论层面，培养独立分析和解决问题的能力');
      if (strengths.length > 0) {
        reasons.push(`可以结合你已有的 ${strengths.slice(0, 2).map(s => s.skill).join('、')} 基础，形成复合能力优势`);
      }
    } else {
      reasons.push('通过综合项目展示端到端能力，这是简历和面试中最有说服力的部分');
    }

    return reasons.join('。') + '。';
  }

  // ---- Generate expected outcome ----
  function generateExpectedOutcome(phase, gaps, directionLabel) {
    const skillNames = phase.assignedSkills.map(s => s.name);
    if (phase.id === 'phase-1') {
      return `能够独立使用 ${skillNames.slice(0, 2).join('、')} 等工具完成基础任务，建立 AI 工作流的基本认知`;
    } else if (phase.id === 'phase-2') {
      return `在${directionLabel}方向建立系统的专业方法论，具备独立分析和解决中等复杂度问题的能力`;
    } else {
      return `拥有 1-2 个完整的${directionLabel}方向项目作品，达到投递${directionLabel}岗位的基本门槛`;
    }
  }

  // ---- Generate project suggestion ----
  function generateProjects(phase, gaps, directionLabel) {
    const projects = [];
    const phaseSkills = phase.assignedSkills.map(s => s.name);

    if (phase.id === 'phase-1') {
      projects.push({
        name: 'AI工具能力地图',
        desc: `梳理 ${phaseSkills.slice(0, 3).join('、')} 等工具的功能矩阵，输出一份个人 AI 工具能力评估报告`,
        whyRecommended: '建立系统性认知，发现工具之间的互补关系'
      });
    } else if (phase.id === 'phase-2') {
      if (directionLabel.includes('产品')) {
        projects.push({
          name: 'AI产品功能分析报告',
          desc: '选择一个 AI 产品，完成竞品分析、用户研究、PRD 撰写和原型设计',
          whyRecommended: '覆盖产品经理核心工作流程，展示端到端产品能力'
        });
      } else if (directionLabel.includes('设计') || directionLabel.includes('AIGC')) {
        projects.push({
          name: 'AIGC主题作品集',
          desc: '围绕一个主题（如品牌视觉/短视频系列），用多种 AI 工具完成完整创作',
          whyRecommended: '展示跨工具协作能力和完整的创意思维流程'
        });
      } else {
        projects.push({
          name: `${directionLabel}方向专项实践`,
          desc: `针对 ${phaseSkills.slice(0, 2).join('、')} 等核心技能，完成一个端到端的实践项目`,
          whyRecommended: '通过实践将理论转化为实际能力'
        });
      }
    } else {
      projects.push({
        name: 'AI求职助手个人版',
        desc: '基于当前产品思路，搭建一个个性化的 AI 求职分析工具',
        whyRecommended: '整合所有学习成果，产出一个可展示的完整项目作品'
      });
      projects.push({
        name: '模拟面试复盘文档',
        desc: '记录至少 3 次模拟面试的完整复盘，包含问题、回答、改进方案',
        whyRecommended: '面试是检验学习成果的最佳方式，复盘能快速发现盲区'
      });
    }

    return projects;
  }

  // ---- Main generate function ----
  function generate(jdAnalysis, matchResult) {
    const gaps = matchResult.gaps || [];
    const strengths = matchResult.strengths || [];
    const extraSkills = matchResult.extraSkills || [];
    const suggestions = matchResult.suggestions || {};

    const direction = (jdAnalysis.direction && jdAnalysis.direction.primary)
      ? jdAnalysis.direction.primary : {};
    const directionId = direction.id || 'ai-product';
    const directionLabel = direction.label || 'AI综合';
    const jobTitle = (jdAnalysis.meta && jdAnalysis.meta.title) ? jdAnalysis.meta.title : '目标岗位';

    // Get phase templates for this direction
    const templates = PHASE_TEMPLATES[directionId] || { phases: DEFAULT_PHASES };
    const phaseTemplates = templates.phases || DEFAULT_PHASES;

    // ---- Build AI Growth Summary ----
    const criticalGaps = gaps.filter(g => g.importance === 'critical');
    const importantGaps = gaps.filter(g => g.importance === 'important');
    const topGaps = [...criticalGaps, ...importantGaps].slice(0, 4);

    const summaryTopGaps = topGaps.map(g => ({
      skill: g.skill,
      category: g.category,
      reason: g.suggestion
    }));

    let aiInsight;
    if (criticalGaps.length > 0) {
      aiInsight = `由于岗位对 ${criticalGaps.map(g => g.skill).join('、')} 的要求较高，建议优先补齐这些核心技能。同时利用你已有的 ${strengths.slice(0, 2).map(s => s.skill).join('、')} 基础，在 Phase 2 中形成差异化优势。`;
    } else if (importantGaps.length > 0) {
      aiInsight = `你的基础与岗位要求接近，主要是 ${importantGaps.slice(0, 3).map(g => g.skill).join('、')} 等方向需要加强。建议重点关注 Phase 2 的专业能力提升，用项目经验弥补技能差距。`;
    } else {
      aiInsight = `你的技能匹配度较好，接下来的学习重点是深化已有技能并积累项目经验。Phase 3 的综合项目将是简历中最有说服力的部分。`;
    }

    const summary = {
      title: `为了匹配「${jobTitle}」岗位，你目前最需要补充的是：`,
      topGaps: summaryTopGaps,
      estimatedWeeks: (phaseTemplates.length * 3) + '周',
      aiInsight
    };

    // ---- Build Phases ----
    const phases = phaseTemplates.map((template, index) => {
      // Assign gaps to this phase based on focus categories
      const assignedSkills = [];
      const usedSkills = new Set();

      // First pass: assign gaps that match this phase's focus categories
      for (const gap of gaps) {
        if (usedSkills.has(gap.skill)) continue;
        // Check if this gap's category is relevant to the phase
        // We don't have category ID in gaps, so we check by skill name
        if (index === 0 && gap.importance === 'critical') {
          assignedSkills.push({
            name: gap.skill,
            category: gap.category,
            priority: 'high',
            learningTip: getLearningTip(gap.skill)
          });
          usedSkills.add(gap.skill);
        } else if (index === 1 && gap.importance === 'important') {
          assignedSkills.push({
            name: gap.skill,
            category: gap.category,
            priority: 'medium',
            learningTip: getLearningTip(gap.skill)
          });
          usedSkills.add(gap.skill);
        } else if (index === 2 && gap.importance === 'nice-to-have') {
          assignedSkills.push({
            name: gap.skill,
            category: gap.category,
            priority: 'low',
            learningTip: getLearningTip(gap.skill)
          });
          usedSkills.add(gap.skill);
        }
      }

      // If not enough skills assigned to phase 1, pull from strengths
      if (assignedSkills.length === 0 && strengths.length > 0) {
        const pick = strengths.slice(0, 3 - assignedSkills.length);
        for (const s of pick) {
          assignedSkills.push({
            name: s.skill,
            category: s.category,
            priority: 'medium',
            learningTip: `在已有基础上深化 ${s.skill} 能力，从会用提升到精通`
          });
        }
      }

      const phaseWithSkills = { ...template, assignedSkills };

      return {
        id: template.id,
        title: template.title,
        duration: template.duration,
        goals: template.goals,
        skills: assignedSkills,
        projects: generateProjects(phaseWithSkills, gaps, directionLabel),
        aiReason: generatePhaseAiReason(phaseWithSkills, gaps, strengths, directionLabel),
        expectedOutcome: generateExpectedOutcome(phaseWithSkills, gaps, directionLabel)
      };
    });

    // ---- Collect Resources ----
    const allGapSkills = gaps.map(g => g.skill);
    const allPhaseSkills = phases.flatMap(p => p.skills.map(s => s.name));
    const skillsForResources = [...new Set([...allGapSkills, ...allPhaseSkills])];
    const resources = getResourcesForSkills(skillsForResources, directionLabel);

    return {
      summary,
      phases,
      resources,
      meta: {
        jobTitle,
        directionLabel,
        score: matchResult.score,
        generatedAt: new Date().toISOString()
      }
    };
  }

  window.LearningPath = { generate };
})();
