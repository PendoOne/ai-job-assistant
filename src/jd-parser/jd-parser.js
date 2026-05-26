/**
 * AI Job Assistant - JD Parser Engine
 * Extracts skills, classifies job direction, analyzes competencies from Boss直聘 JD text
 * Depends on: skill-taxonomy.js (window.JDParserData)
 */
(function () {
  const { SKILL_TAXONOMY, JOB_DIRECTIONS, COMPETENCY_PATTERNS } = window.JDParserData;

  // ---- Internal: Keyword Index (built once) ----
  let _keywordIndex = null;

  function getKeywordIndex() {
    if (_keywordIndex) return _keywordIndex;
    _keywordIndex = new Map();
    for (const [catId, cat] of Object.entries(SKILL_TAXONOMY)) {
      for (const kw of cat.keywords) {
        const entry = { canonical: kw.en, zh: kw.zh, categoryId: catId, weight: kw.weight || 1 };
        addToIndex(kw.en, entry);
        addToIndex(kw.zh, entry);
        for (const alias of (kw.aliases || [])) {
          addToIndex(alias, entry);
        }
      }
    }
    return _keywordIndex;
  }

  function addToIndex(key, entry) {
    const idx = getKeywordIndex();
    const norm = key.toLowerCase().trim();
    if (!idx.has(norm) || idx.get(norm).weight < entry.weight) {
      idx.set(norm, entry);
    }
  }

  // ---- 1. Preprocess ----
  function preprocess(text) {
    if (!text || typeof text !== 'string') return { clean: '', sections: {} };

    var t = text;

    // Normalize line endings
    t = t.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Fix common OCR errors in AI/tech job context
    // "Al" (A + lowercase L) is almost always "AI" in tech job postings
    t = t.replace(/\bAl\b/g, 'AI');
    t = t.replace(/AlIlGC/gi, 'AIGC');

    // Join CJK chars separated by spaces: "漫 画 制 作" -> "漫画制作"
    // Loop until stable to handle chains of any length
    var prevT;
    do {
      prevT = t;
      t = t.replace(/([一-鿿㐀-䶿])[  ]+([一-鿿㐀-䶿])/g, '$1$2');
    } while (t !== prevT);

    // Line-level noise filtering
    var rawLines = t.split('\n');
    var cleaned = [];
    for (var i = 0; i < rawLines.length; i++) {
      var line = rawLines[i].trim();
      if (!line) continue;

      // Status bar noise: time pattern + garbled, short lines
      if (/^\d{1,2}:\d{2}/.test(line) && line.length < 30) continue;
      // Search bar noise: "< Q", "C O Q" patterns
      if (/^[<CKck]\s*[Q〇O0]/.test(line) && line.length < 40) continue;
      // Heavily garbled: >45% non-standard chars in short lines (<20)
      var badChars = line.replace(/[a-zA-Z0-9一-鿿㐀-䶿\s@.,，、。；：！？()（）《》\-\/+#·|｜℃•¥$%%一-鿿]/g, '');
      if (badChars.length > line.length * 0.45 && line.length < 20) continue;
      if (line.length < 12 && badChars.length > 3) continue;

      cleaned.push(line);
    }
    t = cleaned.join('\n');

    // Normalize whitespace
    t = t.replace(/[ \t]+/g, ' ');
    t = t.replace(/\n{3,}/g, '\n\n');

    // ---- Section detection (on preprocessed text) ----
    var sections = {};
    var sectionHeaders = [
      { key: 'title', patterns: [/^(.{4,50}(?:实习生|工程师|经理|专员|专家|助理|管培生|设计师|运营|编辑|策划|制作人|产品).*)$/m] },
      { key: 'company', patterns: [
        /^(.{2,30}(?:公司|科技|集团|有限|网络|互娱|传媒|信息|数据).*)$/m,
        /(?:公司|企业)[：:\s]*(.{2,30}(?:公司|科技|集团|有限|网络|互娱|传媒|信息|数据))/
      ]},
      { key: 'responsibilities', patterns: [
        /(?:岗位职责|工作职责|职位描述|工作内容|职责描述|你将深度参与)[：:]\s*([\s\S]*?)(?=(?:任职要求|岗位要求|职位要求|我们希望你|员工福利|你将收获|加分项|薪资|工作地点|$))/i
      ]},
      { key: 'requirements', patterns: [
        /(?:任职要求|岗位要求|职位要求|工作要求|我们希望你)[：:]\s*([\s\S]*?)(?=(?:员工福利|薪资福利|福利待遇|你将收获|加分项|工作地点|薪资|公司介绍|我们提供|$))/i
      ]},
      { key: 'welfare', patterns: [
        /(?:员工福利|薪资福利|福利待遇|我们提供|你将收获)[：:]\s*([\s\S]*?)(?=(?:工作地点|公司地址|公司介绍|联系方式|$))/i
      ]},
      { key: 'location', patterns: [/工作地点[：:]\s*(.+)/i, /上班地点[：:]\s*(.+)/i] },
      { key: 'salary', patterns: [/(\d+[Kk]?\s*[-~至]\s*\d+[Kk]?\s*(?:元|块)?(?:\/\s*(?:月|天|日|年))?)/, /(\d+[-~至]\d+\s*(?:元|块)?\/\s*(?:天|日|月))/] }
    ];

    for (var si = 0; si < sectionHeaders.length; si++) {
      var sh = sectionHeaders[si];
      for (var pj = 0; pj < sh.patterns.length; pj++) {
        var m = t.match(sh.patterns[pj]);
        if (m) {
          sections[sh.key] = (m[1] || m[0]).trim();
          break;
        }
      }
    }

    return { clean: t.trim(), sections: sections };
  }

  // ---- Tokenize for n-gram matching ----
  function tokenize(text) {
    var tokens = [];
    var words = text.split(/[\s,，、。；：！？\n\/\(\)（）\[\]【】]+/);
    for (var wi = 0; wi < words.length; wi++) {
      var word = words[wi];
      if (!word) continue;
      if (/[一-鿿]/.test(word)) {
        for (var len = 6; len >= 1; len--) {
          for (var i = 0; i <= word.length - len; i++) {
            tokens.push(word.slice(i, i + len));
          }
        }
      }
      if (/[a-zA-Z]/.test(word)) {
        tokens.push(word);
      }
    }
    return tokens;
  }

  // ---- 2. Extract Skills ----
  function extractSkills(text) {
    var idx = getKeywordIndex();
    var tokens = tokenize(text);
    var found = new Map();

    for (var catId in SKILL_TAXONOMY) {
      if (!SKILL_TAXONOMY.hasOwnProperty(catId)) continue;
      var cat = SKILL_TAXONOMY[catId];
      for (var ki = 0; ki < cat.keywords.length; ki++) {
        var kw = cat.keywords[ki];
        var patterns = [kw.en, kw.zh].concat(kw.aliases || []);
        for (var pi = 0; pi < patterns.length; pi++) {
          var p = patterns[pi];
          if (!p || p.length < 1) continue;
          var escaped = p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          var isShortEnglish = /^[a-zA-Z]{1,2}$/.test(p);
          var pattern = isShortEnglish ? '\\b' + escaped + '\\b' : escaped;
          var regex = new RegExp(pattern, 'gi');
          var matches = text.match(regex);
          if (matches && matches.length > 0) {
            var canonical = kw.en;
            var existing = found.get(canonical);
            if (!existing || existing.weight < kw.weight) {
              found.set(canonical, {
                categoryId: catId,
                zh: kw.zh,
                weight: kw.weight,
                count: matches.length
              });
            } else if (existing) {
              existing.count += matches.length;
            }
          }
        }
      }
    }

    var result = {};
    var foundIter = found.entries();
    var entry = foundIter.next();
    while (!entry.done) {
      var canonical = entry.value[0];
      var info = entry.value[1];
      if (!result[info.categoryId]) {
        result[info.categoryId] = { label: SKILL_TAXONOMY[info.categoryId].label, color: SKILL_TAXONOMY[info.categoryId].color, keywords: [] };
      }
      result[info.categoryId].keywords.push(canonical);
      entry = foundIter.next();
    }

    for (var catId2 in result) {
      if (!result.hasOwnProperty(catId2)) continue;
      result[catId2].keywords.sort(function(a, b) {
        var wa = found.get(a) ? found.get(a).weight : 0;
        var wb = found.get(b) ? found.get(b).weight : 0;
        return wb - wa;
      });
    }

    return { skills: result, found: found };
  }

  // ---- 3. Classify Direction ----
  function classifyDirection(skillsResult, text) {
    var found = skillsResult.found;
    var scores = {};

    for (var dirId in JOB_DIRECTIONS) {
      if (!JOB_DIRECTIONS.hasOwnProperty(dirId)) continue;
      var dir = JOB_DIRECTIONS[dirId];
      var score = 0;
      var matchedStrong = [];
      var matchedModerate = [];

      for (var si = 0; si < dir.strong.length; si++) {
        var kw = dir.strong[si];
        var norm = kw.toLowerCase();
        var foundIter2 = found.entries();
        var fEntry = foundIter2.next();
        while (!fEntry.done) {
          var canonical = fEntry.value[0];
          var info = fEntry.value[1];
          var canonLow = canonical.toLowerCase();
          var zhLow = info.zh.toLowerCase();
          if (canonLow === norm || zhLow === norm || canonLow.indexOf(norm) !== -1 || zhLow.indexOf(norm) !== -1) {
            score += 3 * info.weight;
            matchedStrong.push(canonical);
          }
          fEntry = foundIter2.next();
        }
        if (/[一-鿿]/.test(kw) && text.indexOf(kw) !== -1) {
          score += 3;
          if (matchedStrong.indexOf(kw) === -1) matchedStrong.push(kw);
        }
      }

      for (var mi = 0; mi < dir.moderate.length; mi++) {
        var mkw = dir.moderate[mi];
        var mnorm = mkw.toLowerCase();
        var mIter = found.entries();
        var mEntry = mIter.next();
        while (!mEntry.done) {
          var mcanonical = mEntry.value[0];
          var minfo = mEntry.value[1];
          if (mcanonical.toLowerCase() === mnorm || minfo.zh.toLowerCase() === mnorm ||
              mcanonical.toLowerCase().indexOf(mnorm) !== -1 || minfo.zh.toLowerCase().indexOf(mnorm) !== -1) {
            score += 1.5 * minfo.weight;
            matchedModerate.push(mcanonical);
          }
          mEntry = mIter.next();
        }
        if (/[一-鿿]/.test(mkw) && text.indexOf(mkw) !== -1) {
          score += 1.5;
          if (matchedModerate.indexOf(mkw) === -1) matchedModerate.push(mkw);
        }
      }

      for (var wi = 0; wi < dir.weak.length; wi++) {
        var wkw = dir.weak[wi].toLowerCase();
        var wIter = found.entries();
        var wEntry = wIter.next();
        while (!wEntry.done) {
          if (wEntry.value[0].toLowerCase().indexOf(wkw) !== -1) {
            score += 0.5;
          }
          wEntry = wIter.next();
        }
      }

      scores[dirId] = { score: score, label: dir.label, icon: dir.icon, color: dir.color, matchedStrong: matchedStrong, matchedModerate: matchedModerate };
    }

    var sorted = Object.entries(scores).sort(function(a, b) { return b[1].score - a[1].score; });

    if (sorted.length === 0 || sorted[0][1].score === 0) {
      return { primary: { label: '综合/通用', icon: '💼', color: '#1a1a2e', confidence: 0 }, related: [] };
    }

    var top = sorted[0];
    var maxPossible = 15;
    var confidence = Math.min(1, Math.round((top[1].score / maxPossible) * 100) / 100);

    var primary = {
      id: top[0],
      label: top[1].label,
      icon: top[1].icon,
      color: top[1].color,
      confidence: confidence,
      matchedStrong: top[1].matchedStrong,
      matchedModerate: top[1].matchedModerate
    };

    var related = sorted.slice(1)
      .filter(function(s) { return s[1].score > 0 && s[1].score >= top[1].score * 0.4; })
      .map(function(s) { return { id: s[0], label: s[1].label, icon: s[1].icon, color: s[1].color, score: Math.round(s[1].score * 100) / 100 }; });

    return { primary: primary, related: related };
  }

  // ---- 4. Extract Competencies (improved with capability keyword mapping) ----
  var CAPABILITY_MAP = {
    '协作能力': ['团队协作', '跨部门沟通', '协作', '沟通协作', '跨团队', '协调'],
    '沟通能力': ['沟通能力', '善于沟通', '沟通表达', '表达能力', '清晰表达'],
    '学习能力': ['主动学习', '快速学习', '学习能力', '自驱力', '自我驱动', '学习意愿', '好奇心'],
    '执行能力': ['执行力', '执行能力', '落地能力', '强执行', '不等不靠', '快速推进', '项目推进'],
    '逻辑思维': ['逻辑思维', '逻辑分析', '逻辑清晰', '思维清晰', '问题解决'],
    '创新能力': ['创新能力', '创造力', '创意能力', '创新意识', '创新思维'],
    '审美能力': ['审美能力', '视觉审美', '美术功底', '设计感', '美感', '艺术感', '细节调整', '视觉表达'],
    '数据能力': ['数据分析', '数据驱动', '数据敏感', '数据指标', '数据处理'],
    '产品能力': ['产品思维', '用户研究', '用户体验', '用户价值', '需求分析', '产品设计'],
    '抗压能力': ['抗压能力', '承压能力', '多任务处理', '时间管理']
  };

  function extractCompetencies(text) {
    var competencies = [];
    var seen = new Set();

    // 1. Standard pattern-based extraction
    for (var ci = 0; ci < COMPETENCY_PATTERNS.length; ci++) {
      var cp = COMPETENCY_PATTERNS[ci];
      var regex = new RegExp(cp.pattern.source, cp.pattern.flags);
      var match;
      while ((match = regex.exec(text)) !== null) {
        var raw = match[0].trim();
        var cleaned = raw
          .replace(/[：:]/g, '')
          .replace(/优先|者优先|加分/g, '')
          .trim();
        if (cleaned.length < 3 || cleaned.length > 60) continue;
        var key = cleaned.slice(0, 6);
        if (seen.has(key)) continue;
        seen.add(key);
        competencies.push({
          name: cleaned,
          evidence: raw,
          importance: cp.importance
        });
      }
    }

    // 2. Capability keyword mapping: map specific phrases to capability categories
    var capabilityScores = {};
    for (var capName in CAPABILITY_MAP) {
      if (!CAPABILITY_MAP.hasOwnProperty(capName)) continue;
      var keywords = CAPABILITY_MAP[capName];
      for (var ki = 0; ki < keywords.length; ki++) {
        if (text.indexOf(keywords[ki]) !== -1) {
          if (!capabilityScores[capName]) capabilityScores[capName] = { name: capName, count: 0, matches: [] };
          capabilityScores[capName].count++;
          if (capabilityScores[capName].matches.indexOf(keywords[ki]) === -1) {
            capabilityScores[capName].matches.push(keywords[ki]);
          }
        }
      }
    }

    // Add capability-based competencies if not already covered by patterns
    var capKeys = Object.keys(capabilityScores).sort(function(a, b) {
      return capabilityScores[b].count - capabilityScores[a].count;
    });

    for (var ck = 0; ck < capKeys.length; ck++) {
      var cap = capabilityScores[capKeys[ck]];
      if (cap.count >= 2) {
        var capKey = cap.name.slice(0, 4);
        if (!seen.has(capKey)) {
          seen.add(capKey);
          competencies.push({
            name: cap.name,
            evidence: cap.matches.slice(0, 3).join('、'),
            importance: cap.count >= 3 ? 'required' : 'preferred'
          });
        }
      }
    }

    // Sort: required first, then preferred
    competencies.sort(function(a, b) {
      if (a.importance === 'required' && b.importance === 'preferred') return -1;
      if (a.importance === 'preferred' && b.importance === 'required') return 1;
      return 0;
    });

    return competencies.slice(0, 25);
  }

  // ---- 5. Extract Meta (from CLEANED text) ----
  function extractMeta(cleanText) {
    var meta = {};
    var lines = cleanText.split('\n');
    // Filter empty lines
    var nonEmpty = [];
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].trim()) nonEmpty.push(lines[i].trim());
    }

    // ---- Title extraction: scan first ~15 lines for job title patterns ----
    var detailIdx = -1;
    for (var di = 0; di < nonEmpty.length; di++) {
      if (/职位详情|职位描述|岗位职责|工作内容/.test(nonEmpty[di])) {
        detailIdx = di;
        break;
      }
    }
    var searchEnd = detailIdx > 0 ? detailIdx : Math.min(15, nonEmpty.length);
    var titleKeywords = /实习生|工程师|经理|专员|专家|助理|管培生|设计师|运营|编辑|策划|制作人|产品/;

    for (var ti = 0; ti < searchEnd; ti++) {
      var line = nonEmpty[ti].trim();

      // Skip lines that are clearly not titles
      if (line.length < 4) continue;
      if (/^[@＠]/.test(line)) continue;  // @ location line
      if (/女士|先生|招聘|人事|HR/.test(line) && !titleKeywords.test(line)) continue;
      if (/活跃|在线|内推/.test(line)) continue;
      if (/公司|科技|集团|有限|网络|互娱|融资/.test(line) && line.length > 20) continue;

      if (!titleKeywords.test(line)) continue;

      // Check if title wraps to next line (e.g., "AIGC视频设计实" + "习生(A97360)")
      if (ti + 1 < searchEnd) {
        var nextLine = nonEmpty[ti + 1].trim();
        var wrapPattern = /^(?:习|生|员|师|理|家|助)\s*[\(（]/;
        var isContinuation = wrapPattern.test(nextLine) ||
          (nextLine.length < 20 && !/^[@＠]/.test(nextLine) &&
           !/女士|先生|招聘/.test(nextLine) &&
           !titleKeywords.test(nextLine));
        if (isContinuation) {
          line = line + nextLine;
        }
      }

      // Clean up: remove salary, location, OCR noise from title
      var title = line
        .replace(/[\d,.]+\s*[-~至]\s*[\d,.]+\s*(?:[元块Kk云f])\s*\/?\s*(?:[天日月年])?.*$/g, '')
        .replace(/@.*$/g, '')
        .replace(/[|｜]\s*.{0,10}$/g, '')
        .replace(/[\(（][^)）]{0,25}[\)）]?$/g, '')
        .replace(/[①②③④⑤⑥⑦⑧⑨⑩●◉○◎]/g, '')
        .replace(/\s+/g, '')
        .trim();

      if (title.length >= 4 && title.length <= 50) {
        meta.title = title;
        break;
      }
    }

    // Fallback: use section-detected title
    if (!meta.title) {
      // Will be filled from sections below
    }

    // ---- Company ----
    var companyPatterns = [
      /([^\s]{2,30}(?:公司|科技|集团|有限|网络|互娱|传媒|信息|数据))$/m,
      /([^\s]{2,30}(?:公司|科技|集团|有限|网络|互娱|传媒|信息|数据))[\s,，]/
    ];
    for (var cpi = 0; cpi < companyPatterns.length; cpi++) {
      var cm = cleanText.match(companyPatterns[cpi]);
      if (cm) { meta.company = cm[1].trim(); break; }
    }
    // Also check in the last few lines (company info usually at bottom)
    if (!meta.company) {
      for (var bi = nonEmpty.length - 1; bi >= Math.max(0, nonEmpty.length - 10); bi--) {
        var bline = nonEmpty[bi];
        if (/公司|科技|集团|有限|网络|互娱/.test(bline) && bline.length > 6 && bline.length < 50) {
          meta.company = bline.replace(/[\,，].*$/, '').trim();
          break;
        }
      }
    }

    // ---- Location ----
    var locMatch = cleanText.match(/@\s*([^\s·]{2,20}(?:市|区|县|路|街|大厦|中心|园|楼|层)?)/);
    if (locMatch) {
      meta.location = locMatch[1].trim();
    } else {
      var locPatterns = [
        /工作地点[：:\s]*(.{2,20}(?:市|区|县|路|街|大厦|中心|园|楼|层))/,
        /(?:北京|上海|广州|深圳|杭州|成都|武汉|南京|苏州|西安|长沙|重庆|厦门|天津|合肥|郑州|济南|青岛|大连)(?:市?.{0,10}(?:区|新区))?/
      ];
      for (var lpi = 0; lpi < locPatterns.length; lpi++) {
        var lm = cleanText.match(locPatterns[lpi]);
        if (lm) { meta.location = lm[0].trim(); break; }
      }
    }

    // ---- Salary ----
    var salaryPatterns = [
      /(\d+[Kk]?\s*[-~至]\s*\d+[Kk]?\s*(?:元|块)?(?:\/\s*(?:月|天|日|年))?)/,
      /(\d+[-~至]\d+\s*(?:元|块)?\/\s*(?:天|日|月))/
    ];
    for (var spi = 0; spi < salaryPatterns.length; spi++) {
      var sm = cleanText.match(salaryPatterns[spi]);
      if (sm) { meta.salary = sm[1].trim(); break; }
    }

    // ---- Education ----
    var eduMatch = cleanText.match(/(?:本科|硕士|博士|专科|大专|研究生|在校)/);
    if (eduMatch) meta.education = eduMatch[0];

    // ---- Work schedule ----
    var schedMatch = cleanText.match(/(\d+天\s*\/\s*周\s*\d+\s*(?:个月|个月)?)/);
    if (schedMatch) meta.schedule = schedMatch[1].trim();

    return meta;
  }

  // ---- 6. Main Parse Entry ----
  function parse(text) {
    var startTime = performance.now();

    // Preprocess (aggressive OCR cleaning)
    var pp = preprocess(text);
    var clean = pp.clean;

    // Extract skills from cleaned text
    var skillsResult = extractSkills(clean);

    // Classify direction
    var direction = classifyDirection(skillsResult, clean);

    // Extract competencies from cleaned text
    var competencies = extractCompetencies(clean);

    // Extract meta from cleaned text (NOT original noisy text)
    var meta = extractMeta(clean);

    // Merge section-detected fields as fallback
    if (!meta.title && pp.sections.title) meta.title = pp.sections.title;
    if (!meta.company && pp.sections.company) meta.company = pp.sections.company;
    if (!meta.location && pp.sections.location) meta.location = pp.sections.location;
    if (!meta.salary && pp.sections.salary) meta.salary = pp.sections.salary;

    var elapsed = Math.round(performance.now() - startTime);

    return {
      skills: skillsResult.skills,
      direction: direction,
      competencies: competencies,
      meta: meta,
      stats: {
        totalSkills: Object.values(skillsResult.skills).reduce(function(sum, c) { return sum + c.keywords.length; }, 0),
        totalCategories: Object.keys(skillsResult.skills).length,
        parseTimeMs: elapsed,
        textLength: clean.length
      }
    };
  }

  // ---- Export ----
  window.JDParser = { parse: parse, preprocess: preprocess, extractSkills: extractSkills, classifyDirection: classifyDirection, extractCompetencies: extractCompetencies, extractMeta: extractMeta };
})();
