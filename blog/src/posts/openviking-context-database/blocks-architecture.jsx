import React, { useState } from 'react';
import {
  P, H3, H4, Pre, Quote, Pull, Callout, Hr,
  Li, Ul, Table, InlineCode, Strong,
} from '../../blog-components';

const paradigms = [
  {
    key: 'vector',
    name: 'Vector Index',
    tone: '#4a8c5a',
    short: '语义相关性和全模态表征',
    shape: '把文本、图片、代码、PDF、对话等内容压到同一个语义空间，用相似度找到“意思接近”的上下文。',
    strength: '最适合自动处理没有固定 Schema 的内容，尤其适合 Agent 在不知道精确关键词时先定位入口。',
    limit: '天然不擅长强过滤、精确枚举和关系解释，所以需要与目录、元数据或关系层组合使用。',
  },
  {
    key: 'graph',
    name: 'Graph',
    tone: '#1B365D',
    short: '实体和关系发现',
    shape: '把人、项目、文档、仓库、概念和事件建成节点，把引用、依赖、讨论和归属建成边。',
    strength: '适合解释“谁和谁有关”“为什么这个线索要被追踪”，能作为语义检索之后的关系补充。',
    limit: '建模和维护成本高，多模态内容很难自动稳定抽取成图，因此原文把它定位为辅助关系发现。',
  },
  {
    key: 'filesystem',
    name: 'File System',
    tone: '#8b6f2f',
    short: '层次化浏览和 Agent 接口',
    shape: '用目录、路径、文件名和 glob 表达信息的归属、层级和阅读顺序，让 Agent 像操作文件一样操作上下文。',
    strength: '学习门槛低，天然支持逐级探索，适合 ls、tree、read、overview 这类 Agentic 阅读路径。',
    limit: '单靠目录不解决语义召回，也不适合大规模相关性排序，需要底层索引帮它找到入口。',
  },
  {
    key: 'table',
    name: 'Table',
    tone: '#7a4f9a',
    short: '过滤、标量和维度扩展',
    shape: '用行列、字段、DSL 和索引组织可枚举属性，适合按时间、作者、类型、权限、空间等条件筛选。',
    strength: '查询筛选能力最强，维度扩展明确，是规模化数据治理和权限隔离的重要补充。',
    limit: '要求事先定义字段。面对任意上下文、任意模态和任意团队资料时，建表成本会回到用户身上。',
  },
];

const rankings = [
  {
    key: 'semantic',
    label: '语义相关性',
    reading: '谁更能在“表达不同但意思接近”的情况下命中资料入口。',
    order: ['Vector Index', 'Graph', 'File System', 'Table'],
    note: '这也是 OpenViking 选择自动向量索引作为底层默认能力的核心理由。',
  },
  {
    key: 'scale',
    label: '规模适应性',
    reading: '谁更容易支撑大规模资源集合下的持续写入、召回和查询。',
    order: ['Vector Index', 'Table', 'Graph', 'File System'],
    note: '向量和表格都能依靠成熟索引扩大规模；图和目录在规模上更依赖建模质量。',
  },
  {
    key: 'agent',
    label: '智能体适应性',
    reading: '谁更容易被 Agent 学会、组合和持续探索。',
    order: ['Vector Index', 'File System', 'Table', 'Graph'],
    note: 'Vector Index 负责“找得到”，File System 负责“读得懂、走得动”。',
  },
  {
    key: 'modeling',
    label: '自动化建模友好度',
    reading: '谁更能在少人工建模的前提下自动把资料变成可检索资源。',
    order: ['Vector Index', 'Graph', 'File System', 'Table'],
    note: '原文写作“自动化建模难度”的排序，这里按“更适合自动化建模”的方向展示。',
  },
  {
    key: 'modal',
    label: '模态通用性',
    reading: '谁更容易跨文本、代码、图片、PDF、网页、对话等输入格式。',
    order: ['Vector Index', 'File System', 'Table', 'Graph'],
    note: '全模态语义要求系统先接受多种输入，再把它们转成 Agent 可读的上下文单元。',
  },
  {
    key: 'efficiency',
    label: '索引查询效率',
    reading: '谁更适合在大量数据上快速完成索引和查询。',
    order: ['Vector Index', 'Table', 'Graph', 'File System'],
    note: 'VikingDB 的长期积累主要沉淀在这一层，OpenViking 继承的是这套检索基础设施能力。',
  },
  {
    key: 'filter',
    label: '查询筛选能力',
    reading: '谁更适合按确定字段过滤、排序、组合条件。',
    order: ['Table', 'File System', 'Graph', 'Vector Index'],
    note: '这解释了为什么上下文数据库不能只有向量，还需要路径、元信息和有限 Schema。',
  },
  {
    key: 'dimension',
    label: '维度扩展能力',
    reading: '谁更容易持续新增业务维度、权限维度和治理字段。',
    order: ['Table', 'Vector Index', 'Graph', 'File System'],
    note: 'OpenViking 选择有限预设 Schema，是在扩展能力和使用简单之间做约束。',
  },
];

const evolution = [
  {
    key: 'vector',
    name: '向量',
    years: '2019-2025',
    value: '语义和相关性排序',
    capability: '从非结构化检索出发，沉淀稠密、稀疏和混合检索能力，为语义入口和多模态索引提供基础。',
  },
  {
    key: 'table',
    name: '表格',
    years: '2021-2024',
    value: '高效筛选过滤',
    capability: '在 DSL、UDF、正倒排和空间索引上补齐标量过滤能力，让语义检索可以和确定性条件组合。',
  },
  {
    key: 'graph',
    name: '图谱',
    years: '2023-2024',
    value: '辅助关系发现',
    capability: '探索用图谱表达实体和关系，但在上下文自动建模中实用性受限，因此更适合作为关系辅助层。',
  },
  {
    key: 'filesystem',
    name: '文件系统',
    years: '2024-2025',
    value: '有效的信息组织方法',
    capability: '把目录语义、路径和树形遍历作为 Agent 友好的接口，让上下文能被逐级展开、摘要和阅读。',
  },
];

const principles = [
  {
    key: 'modal',
    label: '全模态语义',
    priority: 'P0',
    thought: 'Agent 的上下文来源不是单一文本，可能是代码仓库、图片、PDF、Office 文档、网页、会议纪要和对话历史。',
    method: '用自动无感的向量索引承接多模态输入，让系统先把资料转成可召回的语义资源。',
    result: '用户不必先思考“这类文件怎么建表”，Agent 可以用自然语言从异构资料里找到起点。',
  },
  {
    key: 'simple',
    label: '使用简单',
    priority: 'P1',
    thought: '上下文数据库服务的是团队资料和 Agent 工作流，如果要求用户先设计复杂 Schema，系统就回到了传统数据治理成本。',
    method: '限制建模自由度，保留有限预设 Schema，把复杂处理放到解析、摘要和索引流水线里。',
    result: '添加资料接近“丢进资源空间”，而不是“先做数据仓库项目”。',
  },
  {
    key: 'agent',
    label: 'AI 友好',
    priority: 'P1',
    thought: 'Agent 天然会操作路径、命令、目录树和文件。越接近文件系统范式，越容易被模型理解和组合。',
    method: 'CLI、URI 和数据表征遵循文件系统范式，核心动作收敛到 ls、find、tree、abstract、overview、read。',
    result: 'Agent 可以先看全局，再语义定位，再树形探索，最后读取原文，形成稳定的阅读策略。',
  },
  {
    key: 'token',
    label: '节省 Token',
    priority: 'P2',
    thought: '长文档、代码仓库和图片集合不能一次性塞进窗口，否则会造成读窗口浪费和相关证据被噪声淹没。',
    method: '通过预处理、模态转换和三级摘要，让目录、L0 摘要、overview 和原文形成从粗到细的展开路径。',
    result: '模型先拿到低成本摘要和结构线索，只在必要时读取更长内容。',
  },
  {
    key: 'relations',
    label: '关系发现',
    priority: 'P2',
    thought: '上下文里确实存在引用、依赖、归属和跳转关系，但完整知识图谱建模成本过高。',
    method: '用 relations 和超链接表达必要关系，用轻量关系替代复杂图谱。',
    result: '系统保留跨资源发现能力，又避免把自动抽图变成主要瓶颈。',
  },
];

const cliFlows = [
  {
    key: 'add',
    label: '数据添加',
    title: '把不同来源收进同一资源空间',
    body: 'add-resource 覆盖仓库、论文、图片、本地文档、目录和压缩包。重点不是文件上传，而是触发解析、摘要、索引和目录组织。',
    filename: 'resources.sh',
    code: `# 添加资料和文件
ov add-resource https://github.com/volcengine/OpenViking
ov add-resource https://arxiv.org/pdf/2602.09540

ov add-resource ./team_building.jpg
ov add-resource ./profile.pdf
ov add-resource ./project.docx
ov add-resource ./photos/2026/ --include "*.jpg,*.jpeg,*.png"
ov add-resource ./team-docs.zip`,
  },
  {
    key: 'manage',
    label: '数据管理',
    title: '用 URI 管理上下文资源',
    body: '资源进入 OpenViking 后拥有 viking:// URI。移动、重命名和删除都围绕上下文地址进行，而不是只围绕本地路径。',
    filename: 'manage.sh',
    code: `# 移动和重命名
ov mv viking://resources/photo/20260102/selfish.jpg viking://resources/photo/20260103/

# 删除数据
ov rm viking://resources/photo/20260102/selfish.jpg
ov rm -r viking://resources/photo/20260102/`,
  },
  {
    key: 'query',
    label: '数据查询',
    title: '从全局结构到语义入口',
    body: 'Agent 先用 ls 建立资源地图，用 find 做语义定位，再用 tree、glob、abstract、overview 和 read 逐级展开。',
    filename: 'query.sh',
    code: `# 查看根目录，了解整体文件结构
ov ls

# 语义查找信息入口
ov find "Which design notes explain OpenViking memory?"
ov find "OpenViking AGFSClient"
ov find "How does OpenViking use VikingDB?" --uri=viking://resources/code/volcengine/OpenViking

# 进一步探索和发现相关文件
ov ls viking://resources/code/volcengine/OpenViking/docs/zh
ov tree viking://resources/code/volcengine/OpenViking/examples/openclaw-plugin/
ov glob "openclaw*" --uri viking://resources/code/volcengine/OpenViking/examples/ -n 10`,
  },
  {
    key: 'read',
    label: '摘要阅读',
    title: '用摘要层级节省上下文窗口',
    body: 'ls、tree、find 会自动返回 L0 摘要。abstract 和 overview 用于读结构化摘要，read 才进入原文。',
    filename: 'reading.sh',
    code: `# 阅读完整摘要
ov abstract viking://resources/code/volcengine/OpenViking
ov abstract viking://resources/photo/20260102/

# 阅读概述了解内容结构
ov overview viking://resources/photo/20260102/
ov overview viking://resources/code/volcengine/OpenViking/examples/

# 阅读原文
ov read viking://resources/code/volcengine/OpenViking/examples/cloud/GUIDE.md | head`,
  },
  {
    key: 'skills',
    label: '技能',
    title: '把 SOP 和工具入口变成可检索资源',
    body: 'Skill 不是额外说明文档，而是 Agent 能查找、读取和执行的上下文资产。它补齐流程约束和工具暴露。',
    filename: 'skills.sh',
    code: `ov add-skill ./my-skill/examples/openviking-cli-skills
ov find "OpenViking 使用技巧" --uri=viking://agent/skills
ov ls viking://agent/skills/openviking-cli-skills/searching-context
ov read viking://agent/skills/openviking-cli-skills/searching-context/SKILL.md`,
  },
  {
    key: 'memory',
    label: '记忆',
    title: '用文件接口和 Session 摘要沉淀经验',
    body: '记忆可以显式添加，也可以来自 Session 自动摘要。关键是把一次任务中的偏好、事实和约束变成后续可检索资源。',
    filename: 'memory.sh',
    code: `# 记忆管理，文件接口
ov add-memory ./2026-03-04/memory-2026-03-04.md

# Session 自动摘要
# docs/zh/concepts/08-session.md`,
  },
  {
    key: 'bot',
    label: 'Bot',
    title: '启动内置智能体并继承上下文能力',
    body: '服务启动时打开 bot，Agent 可以直接用 ov chat 提问，并使用同一套上下文数据库能力。',
    filename: 'bot.sh',
    code: `openviking-server --with-bot
ov chat -m "提出你的问题"

# 可观测性工具
ov status
ov observer vlm`,
  },
];

function ArchitectureBlockStyle() {
  return (
    <style>{`
      .ovarch { margin: 34px 0; }
      .ovarch-kicker { font-family: var(--th-font-mono); font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--th-mute); margin-bottom: 10px; }
      .ovarch-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 20px 0; }
      .ovarch-card { border: 1px solid var(--th-line); border-top: 3px solid var(--tone); border-radius: 6px; padding: 14px; min-height: 230px; background: color-mix(in oklab, var(--th-bg-2) 72%, transparent); }
      .ovarch-card__name { display: flex; align-items: center; gap: 8px; font-family: var(--th-font-display); font-size: 18px; line-height: 1.2; margin-bottom: 8px; }
      .ovarch-card__dot { width: 8px; height: 8px; border-radius: 999px; background: var(--tone); flex: 0 0 auto; }
      .ovarch-card__short { font-weight: 700; font-size: 14px; line-height: 1.35; margin-bottom: 10px; }
      .ovarch-card p { margin: 8px 0 0; font-size: 14px; line-height: 1.5; color: var(--th-mute); }
      .ovarch-lab { border: 1px solid var(--th-line); border-radius: 6px; overflow: hidden; margin: 24px 0; background: var(--th-bg); }
      .ovarch-tabs { display: flex; flex-wrap: wrap; gap: 0; border-bottom: 1px solid var(--th-line); background: var(--th-bg-2); }
      .ovarch-tabs--sticky { position: sticky; top: 10px; z-index: 3; background: var(--th-bg-2); }
      .ovarch-tabs button { border: 0; border-right: 1px solid var(--th-line); background: transparent; color: var(--th-mute); padding: 11px 13px; cursor: pointer; font-family: var(--th-font-mono); font-size: 12px; line-height: 1; }
      .ovarch-tabs button:hover, .ovarch-tabs button.is-active { background: var(--th-bg); color: var(--th-ink); }
      .ovarch-section-list { display: grid; gap: 16px; padding: 18px; }
      .ovarch-lab__body { padding: 20px; display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(260px, 0.95fr); gap: 24px; align-items: start; }
      .ovarch-lab__body.is-active, .ovarch-principle.is-active, .ovarch-evolution__body.is-active, .ovarch-cli__section.is-active { border-color: var(--th-ink); box-shadow: 0 0 0 1px var(--th-ink) inset; }
      .ovarch-rank { display: grid; gap: 11px; margin-top: 14px; }
      .ovarch-rank__row { display: grid; grid-template-columns: 128px minmax(0, 1fr) 36px; gap: 10px; align-items: center; font-size: 14px; }
      .ovarch-rank__label { font-weight: 700; word-break: break-word; }
      .ovarch-rank__track { height: 10px; border: 1px solid var(--th-line); border-radius: 999px; overflow: hidden; background: var(--th-bg-2); }
      .ovarch-rank__fill { width: calc(var(--score) * 1%); height: 100%; background: var(--tone); }
      .ovarch-lab__note { border-left: 3px solid var(--th-accent); padding: 12px 14px; background: color-mix(in oklab, var(--th-accent) 8%, transparent); color: var(--th-mute); font-size: 14px; line-height: 1.55; }
      .ovarch-anchor { scroll-margin-top: 96px; }
      .ovarch-evolution { border: 1px solid var(--th-line); border-radius: 6px; overflow: hidden; margin: 22px 0; background: var(--th-bg-2); }
      .ovarch-evolution__rail { display: flex; overflow-x: auto; background: var(--th-bg-2); border-bottom: 1px solid var(--th-line); }
      .ovarch-evolution__rail--sticky { position: sticky; top: 10px; z-index: 3; }
      .ovarch-evolution__rail button { flex: 1 0 120px; border: 0; border-right: 1px solid var(--th-line); background: transparent; color: var(--th-mute); text-align: left; padding: 13px 14px; cursor: pointer; font-family: var(--th-font-mono); font-size: 12px; }
      .ovarch-evolution__rail button:last-child { border-right: 0; }
      .ovarch-evolution__rail button:hover, .ovarch-evolution__rail button.is-active { background: var(--th-bg); color: var(--th-ink); }
      .ovarch-evolution__list { display: grid; gap: 14px; padding: 18px; }
      .ovarch-evolution__body { border: 1px solid var(--th-line); border-radius: 6px; padding: 18px; background: var(--th-bg); }
      .ovarch-meta { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0 16px; }
      .ovarch-meta span { border: 1px solid var(--th-line); border-radius: 999px; padding: 5px 10px; font-family: var(--th-font-mono); font-size: 12px; color: var(--th-mute); }
      .ovarch-principles { display: grid; gap: 14px; margin: 24px 0; }
      .ovarch-principles__nav { display: flex; overflow-x: auto; gap: 0; align-content: start; position: sticky; top: 10px; z-index: 3; border: 1px solid var(--th-line); border-radius: 6px; background: var(--th-bg-2); }
      .ovarch-principles__nav button { flex: 1 0 138px; border: 0; border-right: 1px solid var(--th-line); background: transparent; color: var(--th-mute); text-align: left; cursor: pointer; padding: 11px 12px; display: flex; justify-content: space-between; gap: 8px; align-items: center; font-size: 14px; }
      .ovarch-principles__nav button:last-child { border-right: 0; }
      .ovarch-principles__nav button.is-active { border-color: var(--th-ink); color: var(--th-ink); background: var(--th-bg-2); }
      .ovarch-principle-list { display: grid; gap: 14px; }
      .ovarch-principle { border: 1px solid var(--th-line); border-radius: 6px; padding: 18px; background: color-mix(in oklab, var(--th-bg-2) 68%, transparent); }
      .ovarch-principle__head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; border-bottom: 1px solid var(--th-line); padding-bottom: 12px; margin-bottom: 14px; }
      .ovarch-principle__head :is(h3, h4) { margin: 0; }
      .ovarch-principle__priority { font-family: var(--th-font-mono); font-size: 12px; color: var(--th-mute); }
      .ovarch-principle__grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
      .ovarch-mini { border-top: 1px solid var(--th-line); padding-top: 10px; }
      .ovarch-mini__label { font-family: var(--th-font-mono); font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--th-mute); margin-bottom: 6px; }
      .ovarch-mini p { margin: 0; color: var(--th-mute); font-size: 14px; line-height: 1.5; }
      .ovarch-cli { border: 1px solid var(--th-line); border-radius: 6px; overflow: hidden; margin: 24px 0; background: var(--th-bg-2); }
      .ovarch-cli__tabs { display: flex; overflow-x: auto; border-bottom: 1px solid var(--th-line); position: sticky; top: 10px; z-index: 3; background: var(--th-bg-2); }
      .ovarch-cli__tabs button { flex: 1 0 auto; border: 0; border-right: 1px solid var(--th-line); background: transparent; color: var(--th-mute); cursor: pointer; padding: 10px 14px; font-family: var(--th-font-mono); font-size: 12px; }
      .ovarch-cli__tabs button:last-child { border-right: 0; }
      .ovarch-cli__tabs button:hover, .ovarch-cli__tabs button.is-active { background: var(--th-bg); color: var(--th-ink); }
      .ovarch-cli__intro { padding: 18px 20px 0; }
      .ovarch-cli__section { margin: 16px; border: 1px solid var(--th-line); border-radius: 6px; overflow: hidden; background: var(--th-bg); }
      .ovarch-cli .b-pre { margin: 16px 0 0; border-left: 0; border-right: 0; border-bottom: 0; border-radius: 0; }
      .ovarch-flow { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; margin: 22px 0; }
      .ovarch-flow__step { border: 1px solid var(--th-line); border-top: 3px solid var(--tone); border-radius: 6px; padding: 12px; min-height: 122px; background: var(--th-bg); }
      .ovarch-flow__n { font-family: var(--th-font-mono); font-size: 11px; color: var(--th-mute); }
      .ovarch-flow__title { font-weight: 700; margin: 6px 0 4px; line-height: 1.25; }
      .ovarch-flow__copy { margin: 0; color: var(--th-mute); font-size: 14px; line-height: 1.45; }
      @media (max-width: 840px) {
        .ovarch-grid, .ovarch-lab__body, .ovarch-principle__grid, .ovarch-flow { grid-template-columns: 1fr; }
        .ovarch-card, .ovarch-flow__step { min-height: auto; }
      }
    `}</style>
  );
}

function RankingBars({ order }) {
  const scoreByIndex = [100, 84, 66, 48];
  return (
    <div className="ovarch-rank">
      {order.map((name, index) => {
        const paradigm = paradigms.find(item => item.name === name);
        return (
          <div className="ovarch-rank__row" key={`${name}-${index}`} style={{ '--score': scoreByIndex[index], '--tone': paradigm?.tone || 'var(--th-accent)' }}>
            <div className="ovarch-rank__label">{name}</div>
            <div className="ovarch-rank__track"><div className="ovarch-rank__fill" /></div>
            <div>{index + 1}</div>
          </div>
        );
      })}
    </div>
  );
}

function jumpTo(id, setActive, key) {
  setActive(key);
  if (typeof document === 'undefined') return;
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function InformationTopology() {
  return (
    <section className="ovarch">
      <ArchitectureBlockStyle />
      <div className="ovarch-kicker">information organization</div>
      <H3>信息组织形态：上下文不是普通对象存储</H3>
      <P>
        原文先从 Viking 团队的长期问题意识切入：信息的组织是否就是信息检索的本质。
        面向实体对象时，很多存储结构围绕标量属性优化；但上下文没有稳定的数据类型，
        它可能来自代码、文档、图片、会议或对话，所以必须先按语义组织，再把可遍历结构交给 Agent。
      </P>
      <Quote cite="OpenViking 分享原文">
        OpenViking 不是一时突发奇想，而是 Viking 团队基于非结构化信息检索长期探索之后的最佳实践用例。
      </Quote>
      <div className="ovarch-grid">
        {paradigms.map(item => (
          <article className="ovarch-card" key={item.key} style={{ '--tone': item.tone }}>
            <div className="ovarch-card__name"><span className="ovarch-card__dot" />{item.name}</div>
            <div className="ovarch-card__short">{item.short}</div>
            <p>{item.shape}</p>
            <p><Strong>优势：</Strong>{item.strength}</p>
            <p><Strong>限制：</Strong>{item.limit}</p>
          </article>
        ))}
      </div>
      <Callout type="note" title="OpenViking 的组合判断">
        <P>
          向量索引解决“找得到”，文件系统解决“读得懂”，表格补齐“筛得准”，关系表达补齐“能跳转和发现”。
          这也是上下文数据库区别于单纯向量库或普通文件系统的地方。
        </P>
      </Callout>
    </section>
  );
}

export function ParadigmRankingLab() {
  const [activeKey, setActiveKey] = useState('semantic');

  return (
    <section className="ovarch">
      <ArchitectureBlockStyle />
      <div className="ovarch-kicker">paradigm ranking lab</div>
      <H3>范式排序实验：不同维度下没有银弹</H3>
      <P>
        原文给出的是“一家之言”的路线有效性排序。把它做成交互块后，可以更清楚看到：
        OpenViking 不是在四种范式里选一个，而是在 Agent 场景下把优势互补的几层叠起来。
      </P>
      <div className="ovarch-lab">
        <div className="ovarch-tabs ovarch-tabs--sticky" aria-label="信息组织维度">
          {rankings.map(item => (
            <button
              type="button"
              key={item.key}
              className={activeKey === item.key ? 'is-active' : ''}
              onClick={() => jumpTo(`ovarch-ranking-${item.key}`, setActiveKey, item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="ovarch-section-list">
          {rankings.map(item => (
            <section
              id={`ovarch-ranking-${item.key}`}
              className={`ovarch-lab__body ovarch-anchor ${activeKey === item.key ? 'is-active' : ''}`}
              key={item.key}
            >
              <div>
                <H4>{item.label}</H4>
                <P>{item.reading}</P>
                <RankingBars order={item.order} />
              </div>
              <div className="ovarch-lab__note">
                <Strong>解读：</Strong>{item.note}
                <Hr />
                <P>
                  这组排序能解释 OpenViking 的核心折中：底层尽量用向量索引覆盖语义和模态，
                  对外尽量用文件系统范式降低 Agent 学习成本，再用有限 Schema、URI、relations 和超链接补齐治理与关系。
                </P>
              </div>
            </section>
          ))}
        </div>
      </div>
      <Table
        headers={['维度', '原文排序']}
        rows={rankings.map(item => [item.label, item.order.join(' > ')])}
      />
    </section>
  );
}

export function VikingDbEvolution() {
  const [activeKey, setActiveKey] = useState('vector');

  return (
    <section className="ovarch">
      <ArchitectureBlockStyle />
      <div className="ovarch-kicker">VikingDB evolution</div>
      <H3>VikingDB 的演进背景：从向量到上下文数据库</H3>
      <P>
        OpenViking 的设计不是从空白处开始。VikingDB 在 2023 年起成为广泛使用的语义检索基础设施，
        后续演进补齐了表格建模、图谱探索和文件系统语义。OpenViking 把这些经验收束到 Agent 时代的数据管理接口上。
      </P>
      <div className="ovarch-evolution">
        <div className="ovarch-evolution__rail ovarch-evolution__rail--sticky" aria-label="VikingDB 演进阶段">
          {evolution.map(item => (
            <button
              type="button"
              key={item.key}
              className={activeKey === item.key ? 'is-active' : ''}
              onClick={() => jumpTo(`ovarch-evolution-${item.key}`, setActiveKey, item.key)}
            >
              {item.name}
            </button>
          ))}
        </div>
        <div className="ovarch-evolution__list">
          {evolution.map(item => (
            <section
              id={`ovarch-evolution-${item.key}`}
              className={`ovarch-evolution__body ovarch-anchor ${activeKey === item.key ? 'is-active' : ''}`}
              key={item.key}
            >
              <div className="ovarch-kicker">organization paradigm</div>
              <H4>{item.name}</H4>
              <div className="ovarch-meta">
                <span>{item.years}</span>
                <span>{item.value}</span>
              </div>
              <P>{item.capability}</P>
              <Pull side="left">
                OpenViking 的产品化问题变成：如何把这些底层组织能力包装成 Agent 能自然使用的数据接口。
              </Pull>
            </section>
          ))}
          </div>
      </div>
      <Table
        headers={['组织范式', '价值', '能力介绍', '年代']}
        rows={evolution.map(item => [item.name, item.value, item.capability, item.years])}
      />
    </section>
  );
}

export function DesignPrinciples() {
  const [activeKey, setActiveKey] = useState('modal');

  return (
    <section className="ovarch">
      <ArchitectureBlockStyle />
      <div className="ovarch-kicker">design constraints</div>
      <H3>OpenViking 的设计约束：把复杂性从用户侧移到系统侧</H3>
      <P>
        原文按优先级列出五个约束：全模态语义、使用简单、AI 友好、节省 Token、关系发现。
        它们共同指向一个产品边界：Agent 要能快速学会，团队要能低成本接入，底层又不能放弃语义检索、摘要和关系表达。
      </P>
      <div className="ovarch-principles">
        <div className="ovarch-principles__nav" aria-label="设计约束">
          {principles.map(item => (
            <button
              type="button"
              key={item.key}
              className={activeKey === item.key ? 'is-active' : ''}
              onClick={() => jumpTo(`ovarch-principle-${item.key}`, setActiveKey, item.key)}
            >
              <span>{item.label}</span>
              <span>{item.priority}</span>
            </button>
          ))}
        </div>
        <div className="ovarch-principle-list">
          {principles.map(item => (
            <article
              id={`ovarch-principle-${item.key}`}
              className={`ovarch-principle ovarch-anchor ${activeKey === item.key ? 'is-active' : ''}`}
              key={item.key}
            >
              <div className="ovarch-principle__head">
                <H4>{item.label}</H4>
                <span className="ovarch-principle__priority">{item.priority}</span>
              </div>
              <div className="ovarch-principle__grid">
                <div className="ovarch-mini">
                  <div className="ovarch-mini__label">考虑</div>
                  <p>{item.thought}</p>
                </div>
                <div className="ovarch-mini">
                  <div className="ovarch-mini__label">做法</div>
                  <p>{item.method}</p>
                </div>
                <div className="ovarch-mini">
                  <div className="ovarch-mini__label">效果</div>
                  <p>{item.result}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
      <Ul marker="check">
        <Li><Strong>全模态语义</Strong>：自动无感向量索引，避免用户先做模态和 Schema 选择。</Li>
        <Li><Strong>使用简单</Strong>：有限预设 Schema，把建模负担从用户侧转移到系统处理流水线。</Li>
        <Li><Strong>AI 友好</Strong>：CLI 和数据表征遵循文件系统范式，降低 Agent 学习门槛。</Li>
        <Li><Strong>节省 Token</Strong>：三级摘要和预处理能力，让 Agent 逐级展开上下文。</Li>
        <Li><Strong>关系发现</Strong>：用 relations 和超链接表达必要关系，而不是强依赖复杂图谱。</Li>
      </Ul>
    </section>
  );
}

export function AgentCliWorkbench() {
  const [activeKey, setActiveKey] = useState('query');

  return (
    <section className="ovarch">
      <ArchitectureBlockStyle />
      <div className="ovarch-kicker">agent CLI workbench</div>
      <H3>数据添加、查询、技能、记忆和 Bot 的 CLI 路径</H3>
      <P>
        原文强调：OpenViking 面向 AI Agent 呈现的是上下文管理路径，前提是先启动
        <InlineCode>openviking-server</InlineCode>。CLI 不是附属功能，而是 Agent 学习和调用上下文数据库的主要界面。
      </P>
      <div className="ovarch-flow">
        {[
          ['01', '接入', 'add-resource 把多源资料送入解析、摘要和索引流程。', '#4a8c5a'],
          ['02', '定位', 'ls 和 find 先建立资源地图和语义入口。', '#1B365D'],
          ['03', '展开', 'tree、glob、abstract、overview 控制阅读粒度。', '#8b6f2f'],
          ['04', '沉淀', 'skills 和 memory 把流程与经验变成可复用资源。', '#7a4f9a'],
          ['05', '对话', 'bot 与 ov chat 复用同一套上下文能力。', '#b5533f'],
        ].map(([n, title, copy, tone]) => (
          <div className="ovarch-flow__step" key={n} style={{ '--tone': tone }}>
            <div className="ovarch-flow__n">{n}</div>
            <div className="ovarch-flow__title">{title}</div>
            <p className="ovarch-flow__copy">{copy}</p>
          </div>
        ))}
      </div>
      <div className="ovarch-cli">
        <div className="ovarch-cli__tabs" aria-label="OpenViking CLI 路径">
          {cliFlows.map(item => (
            <button
              type="button"
              key={item.key}
              className={activeKey === item.key ? 'is-active' : ''}
              onClick={() => jumpTo(`ovarch-cli-${item.key}`, setActiveKey, item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
        {cliFlows.map(item => (
          <section
            id={`ovarch-cli-${item.key}`}
            className={`ovarch-cli__section ovarch-anchor ${activeKey === item.key ? 'is-active' : ''}`}
            key={item.key}
          >
            <div className="ovarch-cli__intro">
              <H4>{item.title}</H4>
              <P>{item.body}</P>
            </div>
            <Pre lang="js" filename={item.filename}>{item.code}</Pre>
          </section>
        ))}
      </div>
      <Callout type="tip" title="Agent 读取策略">
        <P>
          推荐路径是先用 <InlineCode>ov ls</InlineCode> 和 <InlineCode>ov find</InlineCode> 找入口，
          再用 <InlineCode>ov tree</InlineCode>、<InlineCode>ov abstract</InlineCode>、
          <InlineCode>ov overview</InlineCode> 控制粒度，最后才用 <InlineCode>ov read</InlineCode> 读取原文。
          这条路径正好对应 OpenViking 的节省 Token 和 AI 友好设计。
        </P>
      </Callout>
    </section>
  );
}

export function OpenVikingArchitectureBlocks() {
  return (
    <>
      <InformationTopology />
      <ParadigmRankingLab />
      <VikingDbEvolution />
      <DesignPrinciples />
      <AgentCliWorkbench />
    </>
  );
}

export default OpenVikingArchitectureBlocks;
