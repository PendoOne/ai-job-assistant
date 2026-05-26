/**
 * AI Job Assistant - Resume Matcher
 * Compares resume skills against JD requirements, identifies strengths & gaps
 * Depends on: skill-taxonomy.js, resume-parser.js (for the parse result format)
 */
(function () {

  // Category importance weights for scoring (how critical each category is for matching)
  const CATEGORY_WEIGHTS = {
    'ai-frameworks': 1.2,
    'llm-tools': 1.2,
    'ai-apps': 1.0,
    'ai-video': 0.9,
    'programming': 1.3,
    'design-tools': 0.9,
    'cloud-devops': 0.8,
    'data-engineering': 0.8,
    'soft-skills': 0.7,
    'product-skills': 1.0,
    'content-creation': 0.7,
    'domain-knowledge': 0.8,
    'prompt-engineering': 1.1
  };

  // ---- Normalize skill name for comparison ----
  function normalize(s) {
    return s.toLowerCase().replace(/[-\s_]/g, '').trim();
  }

  // ---- Check if two skills match (exact or fuzzy) ----
  function skillsMatch(s1, s2) {
    const n1 = normalize(s1);
    const n2 = normalize(s2);
    if (n1 === n2) return true;
    if (n1.includes(n2) || n2.includes(n1)) return true;
    return false;
  }

  // ---- Main match function ----
  function match(jdAnalysis, resumeAnalysis) {
    const jdSkills = jdAnalysis.skills || {};
    const jdComps = jdAnalysis.competencies || [];
    const jdDirection = (jdAnalysis.direction && jdAnalysis.direction.primary) ? jdAnalysis.direction.primary.label : '综合';
    const resumeSkills = resumeAnalysis.skills || [];
    const resumeSkillsByCat = resumeAnalysis.skillsByCat || {};

    // Flatten JD skills into { name, categoryId, categoryLabel, color } array
    const jdSkillList = [];
    for (const [catId, cat] of Object.entries(jdSkills)) {
      for (const kw of (cat.keywords || [])) {
        jdSkillList.push({ name: kw, categoryId: catId, categoryLabel: cat.label, color: cat.color, weight: CATEGORY_WEIGHTS[catId] || 0.8 });
      }
    }

    // Match each JD skill against resume skills
    const matched = [];     // JD skills found in resume
    const unmatched = [];   // JD skills NOT found in resume
    const extraSkills = []; // Resume skills NOT in JD

    for (const jdSkill of jdSkillList) {
      let found = false;
      for (const rSkill of resumeSkills) {
        if (skillsMatch(jdSkill.name, rSkill)) {
          matched.push({ ...jdSkill, matchedWith: rSkill });
          found = true;
          break;
        }
      }
      if (!found) {
        unmatched.push(jdSkill);
      }
    }

    // Extra skills: resume skills not in JD
    for (const rSkill of resumeSkills) {
      let found = false;
      for (const jdSkill of jdSkillList) {
        if (skillsMatch(jdSkill.name, rSkill)) { found = true; break; }
      }
      if (!found) {
        // Find which category this resume skill belongs to
        let catLabel = '其他';
        let color = '#888';
        for (const [catId, cat] of Object.entries(resumeSkillsByCat)) {
          if (cat.keywords.some(k => normalize(k.name) === normalize(rSkill))) {
            catLabel = cat.label;
            color = cat.color;
            break;
          }
        }
        extraSkills.push({ name: rSkill, categoryLabel: catLabel, color });
      }
    }

    // ---- Score Calculation ----
    let totalWeight = 0;
    let matchedWeight = 0;
    for (const s of jdSkillList) {
      totalWeight += s.weight;
    }
    for (const s of matched) {
      matchedWeight += s.weight;
    }
    const rawScore = totalWeight > 0 ? matchedWeight / totalWeight : 0;

    // Adjust score: high-value categories get extra boost
    const highValueCats = ['ai-frameworks', 'llm-tools', 'programming', 'prompt-engineering'];
    let highValueTotal = 0;
    let highValueMatched = 0;
    for (const s of jdSkillList) {
      if (highValueCats.includes(s.categoryId)) {
        highValueTotal++;
        if (matched.some(m => m.categoryId === s.categoryId && skillsMatch(m.name, s.name))) {
          highValueMatched++;
        }
      }
    }
    const highValueBonus = highValueTotal > 0 ? (highValueMatched / highValueTotal) * 0.15 : 0;

    // Extra skills bonus (diverse skill set is good)
    const extraBonus = Math.min(0.1, extraSkills.length * 0.02);

    // Competency match
    let compCoverage = 0;
    if (jdComps.length > 0) {
      const reqComps = jdComps.filter(c => c.importance === 'required');
      let compMatched = 0;
      for (const comp of reqComps) {
        for (const rSkill of resumeSkills) {
          if (skillsMatch(comp.name, rSkill)) { compMatched++; break; }
        }
      }
      compCoverage = reqComps.length > 0 ? (compMatched / reqComps.length) * 0.1 : 0;
    }

    const score = Math.min(100, Math.round((rawScore + highValueBonus + extraBonus + compCoverage) * 100));

    // ---- Verdict ----
    let verdict, verdictColor;
    if (score >= 80) { verdict = '强烈建议投递'; verdictColor = '#10b981'; }
    else if (score >= 65) { verdict = '建议尝试投递'; verdictColor = '#4f46e5'; }
    else if (score >= 50) { verdict = '可尝试，建议针对性提升'; verdictColor = '#f59e0b'; }
    else { verdict = '差距较大，建议提升后再投递'; verdictColor = '#ef4444'; }

    // ---- Strengths (top matched) ----
    const strengths = matched
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 6)
      .map(s => ({
        skill: s.name,
        category: s.categoryLabel,
        color: s.color,
        matchedWith: s.matchedWith
      }));

    // ---- Gaps (top unmatched, sorted by importance) ----
    const gaps = unmatched
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 8)
      .map(s => ({
        skill: s.name,
        category: s.categoryLabel,
        color: s.color,
        importance: s.weight >= 1.2 ? 'critical' : s.weight >= 0.9 ? 'important' : 'nice-to-have',
        suggestion: generateGapSuggestion(s)
      }));

    // ---- AI Reasoning ----
    const reasoning = generateReasoning(score, jdDirection, strengths, gaps, extraSkills);

    // ---- Suggestions ----
    const suggestions = generateSuggestions(score, strengths, gaps, jdDirection, extraSkills);

    // ---- Next Steps ----
    const nextSteps = [
      { label: '生成学习路线', action: 'learning-path', icon: '📚', desc: '基于能力差距定制学习计划' },
      { label: '模拟HR面试', action: 'hr-interview', icon: '🎯', desc: 'AI模拟面试，检验岗位匹配度' }
    ];

    return {
      score,
      verdict,
      verdictColor,
      strengths,
      gaps,
      extraSkills: extraSkills.slice(0, 6),
      reasoning,
      suggestions,
      nextSteps,
      stats: {
        totalJD: jdSkillList.length,
        matched: matched.length,
        unmatched: unmatched.length,
        extra: extraSkills.length
      }
    };
  }

  // ---- Gap suggestions ----
  function generateGapSuggestion(jdSkill) {
    const suggestions = {
      'Python': '可通过 LeetCode 刷题或做一个小型数据分析项目来学习 Python',
      'PyTorch': '建议学习 PyTorch 基础教程，完成图像分类或文本生成实战项目',
      'PRD': '建议阅读产品需求文档范例，尝试为自己熟悉的产品写一份 PRD',
      '需求分析': '可通过参与开源项目或产品社区来锻炼需求分析能力',
      '用户研究': '学习用户访谈方法，尝试做一份用户调研报告',
      '数据分析': '学习 SQL 和 pandas，用 Kaggle 数据集做分析练习',
      'LangChain': '参考 LangChain 官方文档，搭建一个简单的 RAG 问答系统',
      'RAG': '学习 RAG 架构原理，用 LangChain + 向量数据库搭建 Demo',
      'ComfyUI': '下载 ComfyUI，参考社区工作流模板进行实践',
      'Prompt Engineering': '学习 Prompt 设计模式，实际调试优化几个复杂 Prompt',
      '跨部门沟通': '在项目中主动承担跨角色协调任务，培养沟通能力',
      '项目管理': '学习敏捷开发流程，在团队中尝试担任 Scrum Master',
      'Docker': '通过 Docker 官方教程学习容器化部署流程',
      'SQL': '在 LeetCode 或牛客网刷 SQL 题目，掌握基本查询语句',
      'Git': '学习 Git 分支管理，参与开源项目练习协作流程'
    };
    return suggestions[jdSkill.name] || `建议通过在线课程或实战项目学习 ${jdSkill.name} 相关知识`;
  }

  // ---- AI Reasoning generation ----
  function generateReasoning(score, direction, strengths, gaps, extraSkills) {
    const parts = [];

    // Opening: overall assessment
    if (score >= 80) {
      parts.push(`你的简历与${direction}岗位高度匹配。`);
    } else if (score >= 65) {
      parts.push(`你的简历与${direction}岗位有较好的匹配基础。`);
    } else if (score >= 50) {
      parts.push(`你的简历与${direction}岗位存在一定差距，但有提升空间。`);
    } else {
      parts.push(`你的简历目前与${direction}岗位差距较大。`);
    }

    // Strengths observation
    if (strengths.length >= 3) {
      const topStrengths = strengths.slice(0, 3).map(s => s.skill);
      parts.push(`你的优势在于 ${topStrengths.join('、')} 等方面的积累`);
      // Deep insight: link related strengths
      if (strengths.some(s => s.category === 'AI应用工具') && strengths.some(s => s.category === 'AI视频生成')) {
        parts.push('，尤其是 AI 工具链和 AI 视频相关的复合能力，这在当前 AIGC 岗位中较为稀缺');
      }
      parts.push('。');
    }

    // Gaps observation with reasoning
    if (gaps.length > 0) {
      const criticalGaps = gaps.filter(g => g.importance === 'critical');
      const importantGaps = gaps.filter(g => g.importance === 'important');
      if (criticalGaps.length > 0) {
        parts.push(`但岗位要求的 ${criticalGaps.map(g => g.skill).join('、')} 在简历中未体现，属于核心差距，建议优先补充。`);
      }
      if (importantGaps.length > 0 && criticalGaps.length === 0) {
        parts.push(`岗位期望的 ${importantGaps.slice(0, 3).map(g => g.skill).join('、')} 等能力在简历中尚未体现，建议在简历中突出相关经验。`);
      }
    }

    // Extra skills potential
    if (extraSkills.length >= 2) {
      const extraNames = extraSkills.slice(0, 3).map(s => s.name);
      parts.push(`值得注意的是，你具备 ${extraNames.join('、')} 等岗位未明确要求的能力，`);
      if (extraSkills.some(s => s.categoryLabel === '设计工具' || s.categoryLabel === 'AI视频生成')) {
        parts.push('这些在设计/创意类岗位中会是加分项，');
      }
      parts.push('可在面试中作为差异化优势展示。');
    }

    // Direction-specific insight
    if (direction.includes('产品') && strengths.some(s => s.category === 'AI应用工具')) {
      parts.push('虽然岗位强调产品能力，但你的 AI 工具实践经验意味着你更理解 AI 产品的实际能力边界，这在 AI 产品设计中是独特优势。');
    }
    if (direction.includes('AIGC') && strengths.length >= 3) {
      parts.push('AIGC 领域变化快速，你已掌握多个主流工具，保持对新工具的学习敏锐度比单纯补齐某一项技能更重要。');
    }
    if (direction.includes('算法') && gaps.some(g => g.skill === 'PyTorch' || g.skill === 'TensorFlow')) {
      parts.push('算法岗位对框架熟练度要求较高，建议通过实际项目而非仅通过教程来积累框架使用经验。');
    }

    return parts.join('');
  }

  // ---- Suggestions generation ----
  function generateSuggestions(score, strengths, gaps, direction, extraSkills) {
    const resumeTips = [];
    const projectTips = [];
    const skillTips = [];

    // Resume optimization tips
    if (strengths.length > 0) {
      resumeTips.push(`将 ${strengths.slice(0, 3).map(s => s.skill).join('、')} 等核心技能放在简历前1/3位置，确保HR快速看到`);
    }
    if (gaps.length > 0) {
      const canLearn = gaps.filter(g => g.importance !== 'critical');
      if (canLearn.length > 0) {
        resumeTips.push(`${canLearn.slice(0, 2).map(g => g.skill).join('、')} 可通过短期学习后在简历中添加相关关键词（注明"学习了解中"）`);
      }
    }
    resumeTips.push(`在简历中添加具体的数据指标（如"提升了X%"、"完成了Y个项目"），增强说服力`);

    // Project tips
    const criticalGaps = gaps.filter(g => g.importance === 'critical');
    if (criticalGaps.length > 0) {
      projectTips.push(`建议做一个 ${criticalGaps[0].skill} 相关的个人项目，放在 GitHub 上并体现在简历中`);
    }
    if (gaps.length >= 2) {
      projectTips.push(`尝试将岗位要求的技能组合在一个综合项目中，展示端到端的能力`);
    }
    if (extraSkills.length >= 2) {
      projectTips.push(`在项目描述中整合 ${extraSkills.slice(0, 2).map(s => s.name).join(' + ')} 的交叉应用经验，体现技术广度`);
    }
    if (projectTips.length === 0) {
      projectTips.push('持续参与开源项目或 Hackathon，保持技术活跃度');
    }

    // Skill improvement tips
    const allGapSkills = gaps.map(g => g.skill);
    if (allGapSkills.length > 0) {
      skillTips.push(`优先学习：${allGapSkills.slice(0, 3).join('、')}（约2-4周可建立基础认知）`);
    }
    if (score < 70) {
      skillTips.push(`建议每天投入1-2小时系统性学习，4-6周后重新评估匹配度可提升10-20%`);
    }
    if (strengths.length > 0) {
      skillTips.push(`在已有基础上，将 ${strengths[0].skill} 从"会用"提升到"熟练"，成为面试中的核心竞争力`);
    }
    if (skillTips.length === 0) {
      skillTips.push('关注行业动态，保持对新工具的敏感度是AI领域最重要的能力');
    }

    return {
      resume: resumeTips.slice(0, 3),
      project: projectTips.slice(0, 3),
      skill: skillTips.slice(0, 3)
    };
  }

  window.ResumeMatcher = { match };
})();
