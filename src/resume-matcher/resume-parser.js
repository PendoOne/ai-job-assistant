/**
 * AI Job Assistant - Resume Parser
 * Extracts structured info from resume text
 * Depends on: skill-taxonomy.js (window.JDParserData)
 */
(function () {
  const { SKILL_TAXONOMY } = window.JDParserData;

  // ---- Section Detection ----
  function detectSections(text) {
    const sections = {};
    const patterns = {
      personal: /(?:个人简介|个人总结|自我介绍|自我评价|关于我)[：:\s]*([\s\S]*?)(?=(?:教育|学历|学校|工作|实习|项目|技能|证书|语言|联系方式|$))/i,
      education: /(?:教育背景|教育经历|学历|学校)[：:\s]*([\s\S]*?)(?=(?:工作|实习|项目|技能|证书|个人|自我|联系方式|$))/i,
      experience: /(?:工作经历|实习经历|工作|实习|项目经[历验]|项目)[：:\s]*([\s\S]*?)(?=(?:教育|学历|学校|技能|证书|个人|自我|联系方式|$))/i,
      skills: /(?:技能|技术栈|专业技能|掌握技能|核心能力)[：:\s]*([\s\S]*?)(?=(?:教育|工作|实习|项目|证书|个人|自我|联系方式|$))/i,
      projects: /(?:项目经验|项目经历|项目|个人项目)[：:\s]*([\s\S]*?)(?=(?:教育|学历|学校|工作|实习|技能|证书|个人|$))/i
    };

    for (const [key, pattern] of Object.entries(patterns)) {
      const m = text.match(pattern);
      if (m) sections[key] = m[1].trim();
    }

    // If no sections detected, treat entire text as a flat resume
    if (Object.keys(sections).length === 0) {
      sections.raw = text;
    }

    return sections;
  }

  // ---- Extract skills using taxonomy ----
  function extractSkills(text) {
    const found = new Map(); // canonical -> { categoryId, zh, weight }

    for (const [catId, cat] of Object.entries(SKILL_TAXONOMY)) {
      for (const kw of cat.keywords) {
        const patterns = [kw.en, kw.zh, ...(kw.aliases || [])];
        for (const p of patterns) {
          if (!p || p.length < 1) continue;
          const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const isShortEnglish = /^[a-zA-Z]{1,2}$/.test(p);
          const patternStr = isShortEnglish ? '\\b' + escaped + '\\b' : escaped;
          const regex = new RegExp(patternStr, 'gi');
          const matches = text.match(regex);
          if (matches && matches.length > 0) {
            const canonical = kw.en;
            if (!found.has(canonical) || found.get(canonical).weight < kw.weight) {
              found.set(canonical, { categoryId: catId, zh: kw.zh, weight: kw.weight });
            }
          }
        }
      }
    }
    return found;
  }

  // ---- Parse resume text ----
  function parse(text) {
    if (!text || typeof text !== 'string') {
      return { skills: [], sections: {}, rawText: '', error: 'Empty input' };
    }

    // Normalize
    let t = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    const sections = detectSections(t);
    const skillsMap = extractSkills(t);

    // Format skills as categorized list
    const skillsByCat = {};
    for (const [canonical, info] of skillsMap) {
      if (!skillsByCat[info.categoryId]) {
        skillsByCat[info.categoryId] = {
          label: SKILL_TAXONOMY[info.categoryId].label,
          color: SKILL_TAXONOMY[info.categoryId].color,
          keywords: []
        };
      }
      skillsByCat[info.categoryId].keywords.push({ name: canonical, zh: info.zh, weight: info.weight });
    }

    // Sort keywords by weight
    for (const catId of Object.keys(skillsByCat)) {
      skillsByCat[catId].keywords.sort((a, b) => b.weight - a.weight);
    }

    const allSkillNames = [...skillsMap.keys()];

    return {
      skills: allSkillNames,
      skillsByCat,
      sections,
      rawText: t,
      summary: {
        totalSkills: allSkillNames.length,
        totalCategories: Object.keys(skillsByCat).length,
        hasEducation: !!sections.education,
        hasExperience: !!(sections.experience || sections.projects),
        textLength: t.length
      }
    };
  }

  window.ResumeParser = { parse, extractSkills, detectSections };
})();
