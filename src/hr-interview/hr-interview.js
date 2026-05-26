/**
 * AI Job Assistant - HR Interview Simulator
 * Generates contextual interview questions, analyzes answers, scores performance
 * Depends on: skill-taxonomy.js (for category labels), match result data format
 */
(function () {

  // ====== Question Templates ======
  const QUESTION_TEMPLATES = {
    behavioral: [
      {
        template: '请介绍一个你使用{skill}的完整项目经历。从项目背景、你的角色、具体执行到最终成果，尽量详细说明。',
        target: '项目经验',
        fillKey: 'skill'
      },
      {
        template: '在你过往的项目中，最有挑战性的一次是什么？你当时是如何应对的？',
        target: '问题解决',
        fillKey: null
      },
      {
        template: '请描述一次你与团队成员产生分歧的经历，你是如何处理并推动项目前进的？',
        target: '沟通协作',
        fillKey: null
      },
      {
        template: '举一个你主动发现并解决了一个其他人没注意到的问题的例子。',
        target: '主动性',
        fillKey: null
      },
      {
        template: '你如何平衡{skill}的学习深度和广度？请分享你的学习方法和时间管理策略。',
        target: '学习能力',
        fillKey: 'skill'
      }
    ],
    'product-design': [
      {
        template: '{company}目前的核心产品是{domain}相关，如果让你设计一个新的AI功能来提升用户留存，你会如何着手？请从用户调研、需求分析到方案设计完整说明。',
        target: '产品设计',
        fillKey: 'context'
      },
      {
        template: '请用{skill}举例，说明你会如何判断一个需求该不该做？参考什么指标？',
        target: '需求判断',
        fillKey: 'skill'
      },
      {
        template: '如果你要为一款面向{domain}领域的AI产品定义核心指标，你会选择哪些？为什么？',
        target: '数据思维',
        fillKey: 'context'
      },
      {
        template: '设计一个面向{domain}场景的AI产品，你会优先考虑什么？请从用户价值、技术可行性和商业价值三个维度分析。',
        target: '产品思维',
        fillKey: 'context'
      }
    ],
    'case-study': [
      {
        template: '假设你负责的AI产品DAU在过去两周下降了15%，请描述你的分析框架和具体排查步骤。',
        target: '数据分析',
        fillKey: null
      },
      {
        template: '{company}想用AI改造他们的核心业务流程，你认为应该从哪个环节切入？为什么？请给出具体的MVP方案。',
        target: '策略思维',
        fillKey: 'context'
      },
      {
        template: 'ChatGPT的流量最近在下降，作为产品经理，你认为可能的原因是什么？你会建议什么策略？',
        target: '行业洞察',
        fillKey: null
      }
    ],
    situational: [
      {
        template: '研发团队反馈{skill}的技术方案需要额外2周开发时间，但业务方希望在原定日期前上线。作为PM你会如何处理？',
        target: '沟通协调',
        fillKey: 'skill'
      },
      {
        template: '你发现竞品上线了一个和你们规划中几乎一样的功能，而且做得很好。你会建议团队怎么做？',
        target: '竞品应对',
        fillKey: null
      },
      {
        template: '领导要求你在1周内完成一个通常需要3周的项目分析，资源有限。你会如何设定优先级并管理预期？',
        target: '项目管理',
        fillKey: null
      },
      {
        template: '用户反馈{skill}相关的功能很难用，但数据显示使用率并不低。你会如何判断这个问题的严重性并制定方案？',
        target: '用户洞察',
        fillKey: 'skill'
      }
    ],
    technical: [
      {
        template: '请用通俗的语言解释{skill}的核心原理。假设听众没有技术背景。',
        target: '技术理解',
        fillKey: 'skill'
      },
      {
        template: '{skill}在实际落地中常见的挑战有哪些？你认为如何解决？',
        target: '技术落地',
        fillKey: 'skill'
      },
      {
        template: '如果让你评估一个{skill}项目的技术可行性，你会关注哪些维度？',
        target: '技术评估',
        fillKey: 'skill'
      },
      {
        template: '请比较{skill1}和{skill2}在不同场景下的优劣，你如何做技术选型？',
        target: '技术判断',
        fillKey: 'multiSkill'
      }
    ]
  };

  // ====== Analysis Patterns ======
  // Keywords that indicate good answer quality
  const QUALITY_INDICATORS = {
    structure: {
      positive: ['首先', '然后', '最后', '总结', '第一', '第二', '第三', '背景是', '目标是', '结果是', '综上所述'],
      negative: ['嗯', '就是', '那个', '怎么说呢', '大概', '可能吧', '应该是']
    },
    productThinking: {
      positive: ['用户', '需求', '价值', '场景', '痛点', '调研', '数据', '指标', '留存', '转化', '体验', '反馈'],
      negative: ['就这样做', '我觉得', '应该可以', '差不多']
    },
    dataMindset: {
      positive: ['数据', '指标', '百分比', '提升了', '降低了', '转化率', '用户量', 'DAU', 'MAU', '留存率', 'A/B测试'],
      negative: []
    },
    aiUnderstanding: {
      positive: ['模型', '算法', '训练', '推理', 'Prompt', 'RAG', '向量', 'embedding', 'token', 'fine-tune', 'API', '部署'],
      negative: ['AI很厉害', '自动完成', 'AI搞定', '黑科技']
    },
    projectDepth: {
      positive: ['具体', '我负责', '我设计', '我实现', '挑战', '困难', '解决', '优化', '迭代', '上线', '效果'],
      negative: ['参与了', '帮忙', '协助', '团队一起']
    }
  };

  // ====== Follow-up templates ======
  const FOLLOW_UP_TEMPLATES = [
    { template: '你刚才提到了{keyword}，能展开说说具体是怎么做到的吗？', reason: '深入了解执行细节' },
    { template: '关于{keyword}，你当时遇到了什么具体的困难？如何解决的？', reason: '探测问题解决能力' },
    { template: '你提到的{keyword}方案，有没有考虑过其他替代方案？为什么最终选择了这个？', reason: '考察决策思维' },
    { template: '如果让你重新做一次{keyword}相关的决策，你会做出什么不同的选择？', reason: '考察反思能力' },
    { template: '你从{keyword}这个经历中，最大的收获或教训是什么？', reason: '考察成长心态和学习能力' },
    { template: '你提到的{keyword}，具体的数据表现是怎样的？有量化指标吗？', reason: '考察数据意识' },
    { template: '关于{keyword}，用户/团队的反馈如何？你是如何衡量成功的？', reason: '考察用户/业务思维' }
  ];

  // ====== Helpers ======
  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function extPick(arr, n) {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
  }

  function normalize(s) { return s.toLowerCase().replace(/[-\s_]/g, '').trim(); }

  // ====== Template Filling ======
  function fillTemplate(template, session) {
    const gaps = session.candidateProfile.gaps;
    const strengths = session.candidateProfile.strengths;
    const jdAnalysis = session._jdAnalysis;
    const competencies = session.candidateProfile.competencies;

    let text = template.template;

    // Fill {skill} from gaps or strengths
    if (text.includes('{skill}')) {
      const skillPool = [...gaps.map(g => g.skill), ...strengths.map(s => s.skill)];
      const skill = skillPool[Math.floor(Math.random() * Math.min(skillPool.length, 5))] || 'AI工具';
      text = text.replace(/\{skill\}/g, skill);
    }

    // Fill {skill1} and {skill2} for comparison questions
    if (text.includes('{skill1}')) {
      const pool = [...gaps.map(g => g.skill), ...strengths.map(s => s.skill)];
      const s1 = pool[0] || 'LangChain';
      const s2 = pool[1] || pool[2] || 'LlamaIndex';
      text = text.replace('{skill1}', s1).replace('{skill2}', s2);
    }

    // Fill {company} from JD meta
    if (text.includes('{company}')) {
      const company = (jdAnalysis.meta && jdAnalysis.meta.company) ? jdAnalysis.meta.company : '某互联网公司';
      text = text.replace(/\{company\}/g, company);
    }

    // Fill {domain} from direction label
    if (text.includes('{domain}')) {
      const dirLabel = (jdAnalysis.direction && jdAnalysis.direction.primary)
        ? jdAnalysis.direction.primary.label : 'AI';
      text = text.replace(/\{domain\}/g, dirLabel);
    }

    return text;
  }

  // ====== Session Init ======
  function initSession(jdAnalysis, matchResult) {
    const gaps = matchResult.gaps || [];
    const strengths = matchResult.strengths || [];
    const competencies = jdAnalysis.competencies || [];
    const direction = (jdAnalysis.direction && jdAnalysis.direction.primary)
      ? jdAnalysis.direction.primary : {};
    const meta = jdAnalysis.meta || {};

    return {
      _jdAnalysis: jdAnalysis,
      meta: {
        jobTitle: meta.title || '目标岗位',
        company: meta.company || '',
        directionLabel: direction.label || '综合',
        startedAt: new Date().toISOString()
      },
      candidateProfile: {
        matchScore: matchResult.score || 0,
        strengths: strengths.slice(0, 4),
        gaps: gaps.slice(0, 6),
        competencies: competencies.slice(0, 5)
      },
      rounds: [],
      askedTopics: new Set(),
      askedTypes: [],
      currentRound: 0,
      maxRounds: 5,
      status: 'ready' // ready | asking | waiting | analyzing | finished
    };
  }

  // ====== Question Generation ======
  function getNextQuestion(session) {
    const gaps = session.candidateProfile.gaps;
    const competencies = session.candidateProfile.competencies;
    const strengths = session.candidateProfile.strengths;
    const askedTopics = session.askedTopics;

    // Determine question type (rotate through types, prioritize behavioral for round 1)
    const typeOrder = ['behavioral', 'product-design', 'technical', 'situational', 'case-study'];
    let qType;

    if (session.rounds.length === 0) {
      qType = 'behavioral';
    } else {
      // Prefer types not yet used
      const usedTypes = session.askedTypes;
      const unusedTypes = typeOrder.filter(t => !usedTypes.includes(t));
      qType = unusedTypes.length > 0 ? pick(unusedTypes) : pick(typeOrder);
    }

    session.askedTypes.push(qType);

    // Get templates for this type
    const templates = QUESTION_TEMPLATES[qType] || QUESTION_TEMPLATES.behavioral;

    // Pick a template, preferring ones not yet used for this type
    const unusedTemplates = templates.filter(t => !askedTopics.has(t.target));
    const templatePool = unusedTemplates.length > 0 ? unusedTemplates : templates;
    const chosenTemplate = pick(templatePool);

    // Fill the template
    const questionText = fillTemplate(chosenTemplate, session);

    // Mark as asked
    askedTopics.add(chosenTemplate.target);

    // Pick a relevant gap skill for context
    const relevantSkill = gaps.length > 0 ? pick(gaps.slice(0, 4)).skill : (competencies[0] ? competencies[0].name : 'AI');

    const question = {
      text: questionText,
      type: qType,
      targetCompetency: chosenTemplate.target,
      sourceGap: relevantSkill,
      difficulty: session.rounds.length < 2 ? 'medium' : 'hard'
    };

    session.currentRound++;
    session.status = 'asking';

    return question;
  }

  // ====== Answer Analysis ======
  function analyzeAnswer(session, roundIndex, answer) {
    if (!answer || answer.trim().length < 10) {
      return {
        error: true,
        message: '回答过于简短，请至少用2-3句话详细描述。面试官希望能了解你的思考过程。'
      };
    }

    const answerLower = answer.toLowerCase();
    const wordCount = answer.length;

    // ---- Score each dimension ----
    function scoreDim(dimName) {
      const indicators = QUALITY_INDICATORS[dimName];
      if (!indicators) return { score: 3, comment: '回答质量中等' };

      const posCount = indicators.positive.filter(k => answerLower.includes(k.toLowerCase())).length;
      const negCount = indicators.negative.filter(k => answerLower.includes(k.toLowerCase())).length;

      const posRate = indicators.positive.length > 0 ? posCount / Math.min(indicators.positive.length, 10) : 0.5;
      const negPenalty = indicators.negative.length > 0 ? negCount * 0.15 : 0;

      let score = Math.round(posRate * 5) - negPenalty;
      score = Math.max(1, Math.min(5, score));

      return { score, posCount, negCount };
    }

    const logicScore = scoreDim('structure');
    const productScore = scoreDim('productThinking');
    const dataScore = scoreDim('dataMindset');
    const aiScore = scoreDim('aiUnderstanding');
    const depthScore = scoreDim('projectDepth');

    // Length bonus (substantial answers get credit)
    const lengthBonus = wordCount > 300 ? 0.5 : wordCount > 150 ? 0.3 : wordCount < 60 ? -0.5 : 0;

    // ---- Generate dimension comments ----
    const dimComments = {
      logic: makeDimComment(logicScore.score, '逻辑结构', [
        '回答缺乏清晰的结构，建议使用\'首先-然后-最后\'或STAR框架组织思路',
        '结构可以更清晰一些，可以尝试先用一句话总结核心观点',
        '结构基本清晰，但在过渡和衔接上可以更自然',
        '逻辑结构清晰，能够较好地组织信息',
        '逻辑严密，结构完整，论述层次分明，展现优秀的思维组织能力'
      ]),
      structure: makeDimComment(logicScore.score, '表达结构', [
        '表达较为碎片化，建议使用STAR原则（情境-任务-行动-结果）重新组织',
        '表达有一定框架但不够完整，可以补充更多背景或结果',
        '表达结构基本完整，可以在细节过渡上更流畅',
        '表达结构清晰，总分总结构运用得当',
        '表达结构优秀，叙事有节奏感，能够有效引导面试官理解'
      ]),
      productThinking: makeDimComment(productScore.score, '产品思维', [
        '回答偏执行和技术层，较少提及用户需求和产品价值，建议补充用户视角',
        '有一定的用户意识但不够深入，可以加入用户场景和需求分析',
        '能够从用户角度思考，但可以更系统地阐述产品价值',
        '产品思维较好，能够平衡用户需求和技术实现',
        '产品思维优秀，用户价值导向清晰，能够从用户、市场、技术三维度全面分析'
      ]),
      aiUnderstanding: makeDimComment(aiScore.score, 'AI理解', [
        '对AI概念的理解较为模糊，建议加强对基础AI概念的学习',
        '对AI有一定了解但深度不够，建议深入学习1-2个具体方向',
        'AI理解基本到位，能够准确使用相关术语',
        'AI理解较深入，能够结合实践谈论技术细节',
        'AI理解非常深入，展现了对AI技术和产品的深刻洞察'
      ]),
      authenticity: makeDimComment(depthScore.score, '项目真实性', [
        '回答过于概括，缺少具体细节，建议补充更具体的项目场景和个人贡献',
        '有一些细节但不够充分，面试官可能会追问更多',
        '项目描述有一定可信度，能够说明自己的角色和贡献',
        '项目描述具体可信，细节丰富，展现了真实的项目参与度',
        '项目描述非常具体，细节丰富，个人贡献清晰可辨，可信度很高'
      ]),
      communication: makeDimComment(
        Math.round((logicScore.score + productScore.score + dataScore.score) / 3),
        '沟通表达',
        [
          '表达不够流畅，建议多加练习用简洁清晰的语言描述项目',
          '表达基本通顺，但可以更简洁有力，减少冗余',
          '沟通表达顺畅，能够清晰传达核心信息',
          '沟通表达高效，语言简洁准确，展现了良好的沟通能力',
          '沟通表达极为出色，语言精炼有力，能够有效引导对话方向'
        ]
      )
    };

    // ---- Dimension scores (1-5 scale) ----
    const rawScores = {
      logic: logicScore.score,
      structure: logicScore.score,
      productThinking: productScore.score,
      aiUnderstanding: aiScore.score,
      authenticity: depthScore.score,
      communication: Math.round((logicScore.score + productScore.score + dataScore.score) / 3)
    };

    // Normalize to 1-5 range
    function clamp(v) { return Math.max(1, Math.min(5, Math.round(v + lengthBonus))); }

    // ---- Overall scores (0-100 scale) ----
    const dimensionScores = {
      productThinking: ((clamp(productScore.score + lengthBonus)) / 5) * 100,
      aiUnderstanding: ((clamp(aiScore.score + lengthBonus)) / 5) * 100,
      communication: ((clamp(Math.round((logicScore.score + productScore.score) / 2) + lengthBonus)) / 5) * 100,
      projectAnalysis: ((clamp(depthScore.score + lengthBonus)) / 5) * 100,
      logicAbility: ((clamp(logicScore.score + lengthBonus)) / 5) * 100
    };

    // ---- Generate suggestions ----
    const suggestions = [];
    if (logicScore.score <= 2) suggestions.push('建议使用STAR法则（情境-任务-行动-结果）重新组织回答，让逻辑更清晰');
    if (productScore.score <= 2) suggestions.push('回答偏执行层面，建议补充用户价值分析和产品目标，展现产品思维');
    if (dataScore.score <= 2) suggestions.push('建议在回答中加入具体的数据指标（如提升了X%），增强说服力');
    if (aiScore.score <= 2) suggestions.push('建议深化对相关AI技术的理解，能够解释核心技术原理和适用场景');
    if (depthScore.score <= 2) suggestions.push('建议补充更多项目的具体细节，展示你在项目中的个人贡献和思考过程');
    if (wordCount < 100) suggestions.push('回答可以更详细一些，面试官希望通过你的描述了解你的思考深度');
    if (suggestions.length === 0) suggestions.push('回答整体不错！可以考虑增加一些量化的成果数据来进一步增强说服力');

    // ---- Detect keywords for follow-up ----
    const keywords = extractKeywords(answer, session);

    // ---- Build analysis result ----
    const analysis = {
      dimensions: dimComments,
      suggestions: suggestions.slice(0, 4),
      dimensionScores,
      positivePoints: getPositivePoints(rawScores, wordCount),
      keywords,
      wordCount
    };

    // ---- Build full round result ----
    const round = session.rounds[roundIndex];
    round.answer = answer;
    round.analysis = analysis;

    // Determine follow-up
    round.hasFollowUp = shouldFollowUp(session, analysis);
    if (round.hasFollowUp && keywords.length > 0) {
      const fuTemplate = pick(FOLLOW_UP_TEMPLATES);
      const kw = pick(keywords);
      round.followUp = {
        text: fuTemplate.template.replace('{keyword}', kw.word),
        reason: fuTemplate.reason
      };
    }

    session.status = 'feedback';
    return round;
  }

  // ---- Extract meaningful keywords from answer for follow-up ----
  function extractKeywords(answer, session) {
    const candidateKeywords = [
      ...session.candidateProfile.gaps.map(g => g.skill),
      ...session.candidateProfile.strengths.map(s => s.skill),
      ...session.candidateProfile.competencies.map(c => c.name)
    ];

    const found = [];
    for (const kw of candidateKeywords) {
      if (answer.toLowerCase().includes(kw.toLowerCase())) {
        found.push({ word: kw, confidence: 'high' });
      }
    }

    // Add generic project keywords
    const genericKeywords = ['工作流', '效率', '团队协作', '数据处理', '优化', '迭代', '用户', '设计', '开发', '部署'];
    for (const kw of genericKeywords) {
      if (answer.includes(kw) && !found.find(f => f.word === kw)) {
        found.push({ word: kw, confidence: 'medium' });
      }
    }

    return found.slice(0, 5);
  }

  // ---- Should AI follow up? ----
  function shouldFollowUp(session, analysis) {
    // Follow up ~65% of the time, unless max rounds approaching
    if (session.currentRound >= session.maxRounds) return false;
    if (analysis.wordCount < 40) return true; // Short answer always gets follow-up
    const avgScore = Object.values(analysis.dimensionScores).reduce((a, b) => a + b, 0) / 5;
    if (avgScore < 50) return true; // Weak answer gets follow-up to probe deeper
    return Math.random() < 0.6;
  }

  // ---- Dimension comment helper ----
  function makeDimComment(score, dimName, comments) {
    const idx = Math.max(0, Math.min(comments.length - 1, score - 1));
    return {
      score,
      comment: comments[idx],
      dimName
    };
  }

  function getPositivePoints(rawScores, wordCount) {
    const points = [];
    if (rawScores.logic >= 4) points.push('逻辑结构清晰，展现了良好的思维组织能力');
    if (rawScores.productThinking >= 4) points.push('产品思维突出，能够从用户价值角度分析问题');
    if (rawScores.aiUnderstanding >= 4) points.push('AI技术理解深入，能够准确阐述技术细节');
    if (rawScores.projectDepth >= 4) points.push('项目细节丰富，展现了真实的实践经验和深度参与');
    if (wordCount >= 200) points.push('回答内容充实，展现了良好的表达意愿');
    return points;
  }

  // ====== Report Generation ======
  function generateReport(session) {
    const rounds = session.rounds || [];
    const completedRounds = rounds.filter(r => r.answer && r.analysis);

    if (completedRounds.length === 0) {
      return { error: true, message: '没有足够的面试数据生成报告' };
    }

    // Aggregate scores across rounds
    const dimKeys = ['productThinking', 'aiUnderstanding', 'communication', 'projectAnalysis', 'logicAbility'];
    const dimLabels = {
      productThinking: '产品思维',
      aiUnderstanding: 'AI理解',
      communication: '沟通表达',
      projectAnalysis: '项目分析',
      logicAbility: '逻辑能力'
    };

    const avgScores = {};
    for (const key of dimKeys) {
      const scores = completedRounds.map(r => (r.analysis && r.analysis.dimensionScores) ? r.analysis.dimensionScores[key] : 0);
      avgScores[key] = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }

    const totalScore = Math.round(Object.values(avgScores).reduce((a, b) => a + b, 0) / dimKeys.length);

    // Collect all suggestions
    const allSuggestions = [];
    for (const round of completedRounds) {
      if (round.analysis && round.analysis.suggestions) {
        allSuggestions.push(...round.analysis.suggestions);
      }
    }

    // Find common patterns
    const suggestionFreq = {};
    for (const s of allSuggestions) {
      const key = s.substring(0, 20);
      suggestionFreq[key] = (suggestionFreq[key] || 0) + 1;
    }
    const commonIssues = Object.entries(suggestionFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([key, count]) => {
        const s = allSuggestions.find(s => s.substring(0, 20) === key);
        return s || key;
      });

    // Strengths (highest scoring dimensions)
    const sortedDims = Object.entries(avgScores).sort((a, b) => b[1] - a[1]);
    const strengths = sortedDims.slice(0, 2).map(([key, score]) => dimLabels[key] || key);
    const weaknesses = sortedDims.slice(-2).map(([key, score]) => dimLabels[key] || key);

    // Personalized recommendations
    const recommendations = buildRecommendations(avgScores, dimLabels, commonIssues, session);
    const nextSteps = buildNextSteps(recommendations, session);

    return {
      totalScore,
      dimensionScores: avgScores,
      dimensionLabels: dimLabels,
      strengths,
      weaknesses,
      coreIssues: commonIssues.slice(0, 3),
      commonMistakes: detectCommonMistakes(completedRounds),
      recommendations,
      nextSteps,
      roundsCompleted: completedRounds.length,
      totalRounds: session.maxRounds
    };
  }

  function buildRecommendations(avgScores, dimLabels, commonIssues, session) {
    const recs = [];

    // Low scores need recommendations
    const sortedDims = Object.entries(avgScores).sort((a, b) => a[1] - b[1]);

    for (const [key, score] of sortedDims) {
      if (score < 60) {
        recs.push({
          area: dimLabels[key] || key,
          action: getActionForDim(key, score),
          priority: 'high'
        });
      } else if (score < 75) {
        recs.push({
          area: dimLabels[key] || key,
          action: getActionForDim(key, score),
          priority: 'medium'
        });
      }
    }

    return recs.slice(0, 4);
  }

  function getActionForDim(dimKey, score) {
    const actions = {
      productThinking: '学习用户价值分析方法论，完成1个产品的用户价值分析报告',
      aiUnderstanding: '深入学习主流AI工具的原理和适用场景，建立技术判断框架',
      communication: '用STAR原则练习结构化表达，录制回答并自我复盘',
      projectAnalysis: '整理过往项目经历，用CAR（挑战-行动-结果）框架重新梳理',
      logicAbility: '练习用金字塔原理组织思路，每个观点先给结论再展开论述'
    };
    return actions[dimKey] || '针对该维度进行专项提升练习';
  }

  function buildNextSteps(recommendations, session) {
    const steps = [
      {
        label: '针对性练习',
        desc: recommendations[0] ? `重点训练${recommendations[0].area}` : '根据报告建议进行专项练习',
        icon: '🎯'
      },
      {
        label: 'STAR法则复习',
        desc: '用STAR模板重写本次面试中分数最低的3个回答',
        icon: '📝'
      },
      {
        label: '再次模拟面试',
        desc: '一周后重新进行模拟面试，对比两次评估分数',
        icon: '🔄'
      }
    ];
    if (session._jdAnalysis) {
      steps.push({
        label: '查看学习路线',
        desc: '基于面试暴露的能力短板，重新优化学习计划',
        icon: '📚',
        action: 'learning-path'
      });
    }
    return steps;
  }

  function detectCommonMistakes(rounds) {
    const patterns = [];
    const allSuggestions = [];

    for (const round of rounds) {
      if (round.analysis && round.analysis.suggestions) {
        allSuggestions.push(...round.analysis.suggestions);
      }
    }

    if (allSuggestions.some(s => s.includes('STAR') || s.includes('逻辑'))) {
      patterns.push('回答缺乏结构化框架，多次出现逻辑松散的问题');
    }
    if (allSuggestions.some(s => s.includes('数据') || s.includes('指标'))) {
      patterns.push('缺少具体数据支撑，倾向于定性描述而非定量分析');
    }
    if (allSuggestions.some(s => s.includes('执行') || s.includes('用户价值'))) {
      patterns.push('过于关注执行细节，较少主动关联用户价值和产品目标');
    }

    return patterns.length > 0 ? patterns : ['未发现明显的系统性问题，建议持续练习以巩固面试技巧'];
  }

  window.HRInterview = {
    initSession,
    getNextQuestion,
    analyzeAnswer,
    generateReport
  };
})();
