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
    // "Al" (A + lowercase L) and "At" (A + lowercase T) → "AI"
    t = t.replace(/\bAl\b/g, 'AI');
    t = t.replace(/\bAt\b/g, 'AI');             // OCR misreads bold "I" as "t"
    t = t.replace(/AlIlGC/gi, 'AIGC');
    t = t.replace(/\bAlGC\b/gi, 'AIGC');
    t = t.replace(/\bAlgc\b/g, 'AIGC');
    t = t.replace(/\bAtGC\b/gi, 'AIGC');        // "AtGC" → "AIGC"

    // Fix garbled salary characters from OCR: 元/天 → 云/叉, #/, f/, 五/天, /> etc.
    // Comprehensive normalization of OCR-garbled salary patterns
    // Use [^\S\n] (whitespace excluding newlines) to avoid merging lines
    // "200-220云/叉" "240-260#/" "00-350f/" "200-400五/天" "50-180/>" → "200-220元/天"
    t = t.replace(/(\d+[-~至]\d+)[^\S\n]*[云五元#＃fF><]?[^\S\n]*\/[^\S\n]*[叉天又大爻><]?[^\S\n]*(?=[\s@一-鿿])/g, '$1元/天 ');
    t = t.replace(/(\d+[-~至]\d+)[^\S\n]*[云五元#＃fF><](?!\/)[^\S\n]*(?=[\s@一-鿿])/g, '$1元 ');
    t = t.replace(/\/\s*[月目自日]/g, '/月');

    // Join CJK chars separated by spaces: "漫 画 制 作" -> "漫画制作"
    // Loop until stable to handle chains of any length
    var prevT;
    do {
      prevT = t;
      t = t.replace(/([一-鿿㐀-䶿])[  ]+([一-鿿㐀-䶿])/g, '$1$2');
    } while (t !== prevT);

    // Post-CJK-join normalization: join very short CJK fragments split across lines
    // OCR often splits "实习生" as: line N: "...实", line N+1: "习 生"
    // Also handles "习 生 (A97360)" — short CJK with trailing parenthetical
    // Only merge lines that are primarily CJK (< 8 CJK chars) with optional trailing ASCII
    var joinLoop;
    do {
      joinLoop = false;
      t = t.replace(/\n([一-鿿㐀-䶿][一-鿿㐀-䶿\s]{0,6}(?:[\(（][^)\n]{0,15}[\)）])?)\s*\n/g, function(match, p1) {
        var trimmed = p1.replace(/[\(（][^)\n]{0,15}[\)）]/g, '').replace(/\s+/g, '');
        // Skip standalone words: city names, common metadata
        if (/^(?:北京|上海|广州|深圳|杭州|成都|武汉|南京|苏州|西安|长沙|重庆|厦门|天津|合肥|郑州|济南|青岛|大连|本科|硕士|博士|大专|在校|应届|现场|远程|混合|实习|全职)$/.test(trimmed)) {
          return match;
        }
        if (trimmed.length >= 1 && trimmed.length <= 7) {
          joinLoop = true;
          return '' + p1.replace(/\s+/g, '') + '\n';
        }
        return match;
      });
    } while (joinLoop);

    // Re-run CJK joining for merged content (e.g., "实" + "习 生" → "实习生")
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
      // Search bar / nav bar noise: "< Q", "C O Q", "<留口一", "《Q" patterns
      if (/^[<CKck〈《]\s*[Q〇O0留口]/.test(line) && line.length < 40) continue;
      // Pure garbled: lines that are < 10 chars and mostly non-CJK/non-ASCII
      if (line.length < 10) {
        var meaningfulChars = line.replace(/[^a-zA-Z0-9一-鿿㐀-䶿]/g, '');
        if (meaningfulChars.length < 3) continue;
      }
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

    // Early title detection: scan raw lines (before noise filtering) for title
    // In Boss直聘 screenshots, the title is always in the first ~8 raw lines
    var rawTitleLines = t.split('\n');
    for (var rti = 0; rti < Math.min(10, rawTitleLines.length); rti++) {
      var rawLine = rawTitleLines[rti].trim();
      if (!rawLine || rawLine.length < 4) continue;
      if (/^\d{1,2}:\d{2}/.test(rawLine)) continue;  // status bar
      if (/^[<CKck〈《]\s*[Q〇O0留口]/.test(rawLine)) continue;  // search bar
      // Try to clean and see if it looks like a title
      var rawClean = rawLine
        .replace(/[\d,.]+\s*[-~至]\s*[\d,.]+\s*(?:[元块Kk云f五#＃])?\s*\/?\s*(?:[天日月年叉又大爻><]+)?\s*/g, '')
        .replace(/[\(（][^)）]{0,25}[\)）]?/g, '')
        .replace(/[@＠].*$/g, '')
        .replace(/[①②③④⑤⑥⑦⑧⑨⑩●◉○◎∗*#＃fF><\/\\|｜]/g, '')
        .replace(/\s+/g, '')
        .replace(/[：:].*$/g, '')
        .trim();
      if (rawClean.length >= 4 && rawClean.length <= 25) {
        var titleKeys = /实习生|工程师|经理|专员|专家|助理|管培生|设计师|运营|编辑|策划|制作人|产品|Architect|Engineer|Manager|Designer|Specialist|Analyst|Lead|Director|Head|Producer|Developer/;
        if (titleKeys.test(rawClean)) {
          sections.title = rawClean;
          break;
        }
      }
    }

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

  // ---- 4. Extract Competencies (enhanced AI capability semantic mapping) ----
  var CAPABILITY_MAP = {
    'AI工具能力': ['AI工具', 'AI创作', 'AIGC工具', 'AI绘画', 'AI漫画', 'AI生成', 'Midjourney', 'Stable Diffusion', 'ComfyUI', '即梦', '可灵', 'Kling', 'NanoBanana', 'ChatGPT', 'Claude', 'Cursor', 'AI辅助', '智能工具', 'AI视频', 'Runway', 'Pika', 'AI技术', '大模型', 'LLM'],
    '产品能力': ['产品思维', '用户需求', '用户价值', '产品设计', 'PRD', '需求分析', '用户研究', '产品方案', '产品策划', '用户体验', '产品原型', '交互设计'],
    '沟通协作': ['沟通能力', '团队协作', '配合团队', '跨部门', '协调', '对接', '协作能力', '团队配合', '团队合作', '沟通表达', '表述能力', '表达清晰', '跨团队', '协同工作', '团队沟通', '协作完成'],
    '学习能力': ['主动学习', '快速学习', '学习能力', '自驱力', '自我驱动', '学习意愿', '好奇心', '钻研', '探索', '求知', '自学', '善于学习', '乐于学习', '持续学习', '学习新', '拥抱变化', '保持学习'],
    '审美能力': ['审美能力', '视觉审美', '美术功底', '设计感', '美感', '艺术感', '色彩搭配', '画面', '视觉表达', '构图', '配色', '美学', '风格把控', '画面美感', '色彩感觉', '视觉设计', '调色', '画面效果'],
    '内容创作': ['内容创作', '内容制作', '内容生产', '漫画创作', '脚本撰写', '分镜设计', '分镜', '故事创作', '剧情设计', '角色设计', '文案写作', '内容策划', '创意策划', '内容输出', '创作能力', '视频制作', '短视频'],
    '执行能力': ['执行力', '执行能力', '落地能力', '强执行', '不等不靠', '快速推进', '项目推进', '按时交付', '准时完成', '高效执行', '动手能力', '快速落地', '产出能力', '闭环能力', '跟进', '推进'],
    '逻辑能力': ['逻辑思维', '逻辑分析', '逻辑清晰', '思维清晰', '问题解决', '分析能力', '条理清晰', '结构化思维', '推理能力', '归纳总结', '批判性思维'],
    '细节把控': ['细节', '注重细节', '精益求精', '细节调整', '画面细节', '细节优化', '细节把控', '修正', '打磨', '小瑕疵', '精细', '注重质量', '严谨', '细节处理', '修正画面', '细致'],
    '创新能力': ['创新能力', '创造力', '创意能力', '创新意识', '创新思维', '脑洞', '想象力', '创意输出', '灵感', '原创', '独立思考', '突破', '打破常规', '创新精神'],
    '数据能力': ['数据分析', '数据驱动', '数据敏感', '数据指标', '数据处理', '数据复盘', '量化', 'AB测试', '数据导向', '数据优化'],
    '抗压能力': ['抗压能力', '承压能力', '多任务处理', '时间管理', '高强度', '快节奏', '适应能力', '应变能力']
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
      if (cap.count >= 1) {
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

    // ---- Title extraction: Boss直聘 screenshot format ----
    // Title is ALWAYS in the first ~8 lines, before "职位详情"/"岗位职责"
    // Title is SHORT (<25 chars), contains a job keyword, and is NOT body text
    var detailIdx = -1;
    for (var di = 0; di < nonEmpty.length; di++) {
      if (/职位详情|职位描述|岗位职责|工作内容/.test(nonEmpty[di])) {
        detailIdx = di;
        break;
      }
    }
    // Only search BEFORE "职位详情" — title is always in the header area
    var searchEnd = detailIdx > 0 ? detailIdx : Math.min(8, nonEmpty.length);
    var titleKeywords = /实习生|工程师|经理|专员|专家|助理|管培生|设计师|运营|编辑|策划|制作人|产品|Architect|Engineer|Manager|Designer|Specialist|Analyst|Lead|Director|Head|Producer|Developer/;

    for (var ti = 0; ti < searchEnd; ti++) {
      var line = nonEmpty[ti].trim();

      // Skip obvious non-title lines quickly
      if (line.length < 3) continue;
      if (/^[@＠]/.test(line)) continue;
      if (/(?:岗位职责|任职要求|工作内容|职位描述|我们提供|你将获得|你将收获)/.test(line)) continue;
      if (/女士|先生|人事|HR/.test(line)) continue;
      if (/活跃|在线|内推/.test(line)) continue;
      if (/(?:公司|科技|集团|有限|网络|互娱|融资|B轮|A轮|C轮|不需要融资)/.test(line)) continue;
      if (/招聘|HR|人事/.test(line) && /专员|经理|主管|HRBP/i.test(line)) continue;
      if (/(?:转正|表现优秀|福利|待遇|奖金|补贴|年终|五险|公积金|双休)/.test(line)) continue;
      if (/^[一二三四五六七八九十][\.\、]/.test(line)) continue;
      // Numbered lists: skip but only if clearly a list item (not salary mixed in title)
      if (/^\d+[\.\、]/.test(line) && line.length > 25) continue;

      // Check if title wraps to next very short line
      // Only merge if the next line looks like a legitimate title fragment
      if (ti + 1 < searchEnd) {
        var nextLine = nonEmpty[ti + 1].trim();
        if (nextLine.length >= 1 && nextLine.length < 12 &&
            !/^[@＠\d]/.test(nextLine) &&
            !/职位详情|岗位职责|员工福利/.test(nextLine) &&
            !/[|｜\[【\]】{}\\]/.test(nextLine) &&
            !/(.)\1{2,}/.test(nextLine) && // no 3+ repeated chars (OCR noise like 一一一)
            titleKeywords.test(nextLine)) { // must contain a title keyword
          line = line + ' ' + nextLine;
        }
      }

      // Strip salary and noise FIRST, then validate
      var title = line
        .replace(/[\d,.]+\s*[-~至]\s*[\d,.]+\s*(?:[元块Kk云f五])?\s*\/?\s*(?:[天日月年叉又大爻><]+)?\s*/g, '')
        .replace(/@.*$/g, '')
        .replace(/[|｜]\s*.{0,10}$/g, '')
        .replace(/[\(（][^)）]{0,25}[\)）]?$/g, '')
        .replace(/[\(（][^)）]{0,6}$/g, '')
        .replace(/[①②③④⑤⑥⑦⑧⑨⑩●◉○◎∗*#＃fF><\/\\]/g, '')
        .replace(/[：:].*$/g, '')
        .replace(/\s+/g, '')
        .replace(/[^a-zA-Z0-9一-鿿㐀-䶿+\-/#&|]/g, '')
        .trim();

      // REJECT: too short or too long
      if (title.length < 3 || title.length > 30) continue;

      // REJECT: body text patterns (on cleaned title)
      if (/^[一二三四五六七八九十][\.\、]/.test(title)) continue;

      // MUST contain a title keyword OR be in the first 3 non-noise lines
      var isEarlyLine = ti < 3;
      var hasKeyword = titleKeywords.test(title);

      if (hasKeyword) {
        meta.title = title;
        break;
      }

      // First-line heuristic: in Boss直聘, the first non-noise line IS the title
      // Even if OCR garbled the keyword, try to salvage
      // But require structural integrity: starts with CJK or AI, has 3+ consecutive CJK
      if (isEarlyLine && title.length >= 4 && title.length <= 25) {
        var hasCjkWord = /[一-鿿㐀-䶿]{3,}/.test(title);
        var hasAiPrefix = /^AI/i.test(title) || /AIGC/i.test(title);
        var startsWithCjk = /^[一-鿿㐀-䶿]/.test(title);
        if ((hasCjkWord || hasAiPrefix) && (startsWithCjk || hasAiPrefix) && !/[。，；！？,;!?]/.test(title) && !/^[\d一二三]/.test(title)) {
          meta.title = title;
          break;
        }
      }
    }

    // Fallback: if title not found in header area, scan full text with stricter rules
    if (!meta.title) {
      for (var fi = 0; fi < Math.min(12, nonEmpty.length); fi++) {
        var fline = nonEmpty[fi].trim();
        if (fline.length < 4 || fline.length > 25) continue;
        if (!titleKeywords.test(fline)) continue;
        if (/[:：]/.test(fline) && fline.length > 12) continue;
        if (/^\d/.test(fline)) continue;
        if (/(?:岗位|职责|要求|福利|薪资|公司|地址)/.test(fline)) continue;
        var ftitle = fline
        .replace(/[\d,.]+\s*[-~至]\s*[\d,.]+\s*(?:[元块Kk云f五])\s*\/?\s*(?:[天日月年]+)?\s*/g, '')
        .replace(/\s+/g, '')
        .trim();
        if (ftitle.length >= 4 && ftitle.length <= 25) {
          meta.title = ftitle;
          break;
        }
      }
    }

    // Post-extraction title cleanup: strip OCR noise and merged metadata
    if (meta.title) {
      // Truncate at common metadata that gets merged into title line
      var truncateAt = meta.title.search(/[一-鿿]{0,2}(?:北京|上海|广州|深圳|杭州|成都|武汉|南京|苏州|西安|长沙|重庆|厦门|天津|合肥|郑州|济南|青岛|大连|本科|硕士|博士|大专|在校|应届|现场|远程|混合|实习|全职)\b/);
      if (truncateAt === -1) {
        // Truncate at schedule patterns (e.g., "5天/周")
        truncateAt = meta.title.search(/\d+天\s*\/\s*周/);
      }
      if (truncateAt === -1) {
        // Truncate at 3+ repeated CJK chars (OCR noise like "一一一一")
        truncateAt = meta.title.search(/([一-鿿])\1{2,}/);
      }
      if (truncateAt === -1) {
        // Truncate at garbled: 2+ consecutive non-CJK non-alpha chars
        truncateAt = meta.title.search(/[^\sa-zA-Z0-9一-鿿㐀-䶿+/\-#&]{2,}/);
      }
      if (truncateAt > 3) {
        meta.title = meta.title.slice(0, truncateAt);
      }

      // If title contains a job keyword, check if trailing content is garbage
      // Only truncate at keyword if the content after it looks like OCR noise
      var jobKwMatch = meta.title.match(/(实习生|工程师|经理|专员|专家|助理|管培生|设计师|运营|编辑|策划|制作人|产品经理)/g);
      if (jobKwMatch) {
        // Use the LAST keyword match (closest to end of real title)
        var lastKw = jobKwMatch[jobKwMatch.length - 1];
        var lastIdx = meta.title.lastIndexOf(lastKw);
        var keywordEnd = lastIdx + lastKw.length;
        var afterKw = meta.title.slice(keywordEnd);
        // Only truncate if after-keyword clearly looks like garbage:
        // has repeated chars, non-standard chars, or is too long (>4 clean CJK)
        var hasGarbage = /([一-鿿])\1{2,}|[^\sa-zA-Z0-9一-鿿㐀-䶿+/\-#&]{2,}/.test(afterKw);
        var cleanAfter = afterKw.replace(/[^a-zA-Z0-9一-鿿㐀-䶿]/g, '');
        // Also detect: "AI" + 1-2 random CJK chars (common OCR artifact)
        var aiCjkGarbage = /^AI[A-Z]?[一-鿿]{1,2}$/i.test(cleanAfter) && cleanAfter.length <= 4;
        if (hasGarbage || cleanAfter.length > 4 || aiCjkGarbage) {
          meta.title = meta.title.slice(0, keywordEnd);
        }
      }

      meta.title = meta.title.replace(/[_\s\-—–—]+$/g, '').trim();
      // Strip trailing lowercase ASCII OCR noise after CJK (e.g., "实习生ee" → "实习生")
      meta.title = meta.title.replace(/([一-鿿])[a-z]{1,4}$/g, '$1').trim();
      if (meta.title.length < 3 || /^[0-9\s\.\,、。；：！？]+$/.test(meta.title)) {
        delete meta.title;
      }
    }
    var companyPatterns = [
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
    // Clean company name: strip recruiter/job info noise
    if (meta.company) {
      meta.company = meta.company
        .replace(/[\s]*[货负]责人.*$/g, '')         // "负责人与BOSS随时沟通"
        .replace(/[\s]*[与和跟].*BOSS.*$/gi, '')    // "与BOSS随时沟通"
        .replace(/[\s]*(?:HR|人事|招聘[者]?|内推|在线|活跃|随时|沟通).*$/gi, '')
        .replace(/[\s]*招[着署者][者]?.*$/g, '')    // OCR garbled "招聘者" → "招着者"/"招署者"
        .replace(/[\s]*[|｜].*$/g, '')
        .replace(/[货负]责人/g, '')                 // OCR garbled "负责人"
        .trim();
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

    // Last-resort: in Boss直聘, the first non-noise line IS the job title
    // If all extraction methods failed, take first plausible line
    if (!meta.title) {
      var fallbackLines = clean.split('\n').filter(function(l) { return l.trim(); });
      for (var fl = 0; fl < Math.min(6, fallbackLines.length); fl++) {
        var fline = fallbackLines[fl].trim();
        // Skip obvious non-title stuff
        if (fline.length < 4 || fline.length > 35) continue;
        if (/^[@＠\d]/.test(fline)) continue;
        if (/职位详情|岗位职责|任职要求|员工福利/.test(fline)) continue;
        if (/女士|先生|招聘|活跃|在线/.test(fline)) continue;
        if (/(?:公司|科技|集团|有限|融资|B轮|A轮)/.test(fline)) continue;
        // Skip lines that are mostly garbled symbols
        var qualityChars = fline.replace(/[^a-zA-Z0-9一-鿿㐀-䶿\s]/g, '');
        if (qualityChars.length < fline.length * 0.5) continue;
        // Aggressive cleaning
        var ftitle = fline
          .replace(/[\d,.]+\s*[-~至]\s*[\d,.]+\s*(?:[元块Kk云f五#＃])?\s*\/?\s*(?:[天日月年叉又大爻><]+)?\s*/g, '')
          .replace(/[@＠].*$/g, '')
          .replace(/[\(（][^)）]{0,25}[\)）]?/g, '')
          .replace(/[①②③④⑤⑥⑦⑧⑨⑩●◉○◎∗*#＃fF><\/\\|｜]/g, '')
          .replace(/[：:].*$/g, '')
          .replace(/\s+/g, '')
          .replace(/[^a-zA-Z0-9一-鿿㐀-䶿+\-#&]/g, '')
          .trim();
        if (ftitle.length >= 4 && ftitle.length <= 25) {
          meta.title = ftitle;
          break;
        }
      }
    }
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
