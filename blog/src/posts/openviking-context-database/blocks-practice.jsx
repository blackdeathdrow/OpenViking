import React, { useEffect, useMemo, useState } from 'react';
import {
  Lead, P, H3, H4, Pre, Quote, Pull, Callout, Hr,
  Cols, Col, Ol, Li, Ul, Table, A, InlineCode, Strong, Tag,
} from '../../blog-components';

const LLM_PATH = '/post/openviking-context-database/llm.txt';
const HUMAN_PATH = '/post/openviking-context-database/';
const OPENVIKING_REPO = 'https://github.com/volcengine/OpenViking';
const OPENVIKING_DOCS = 'https://docs.openviking.ai/';
const OPENCLAW_GUIDE = 'https://github.com/volcengine/OpenViking/blob/main/examples/openclaw-plugin/INSTALL-ZH.md';

function useStackNav(items, idPrefix) {
  const keys = useMemo(() => items.map(item => item.key), [items]);
  const [activeKey, setActiveKey] = useState(keys[0] || '');
  const idFor = key => `${idPrefix}-${key}`;

  useEffect(() => {
    const update = () => {
      let current = keys[0] || '';
      for (const key of keys) {
        const el = document.getElementById(idFor(key));
        if (el && el.getBoundingClientRect().top <= 150) current = key;
      }
      setActiveKey(current);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [idPrefix, keys]);

  const jumpTo = (key) => {
    setActiveKey(key);
    const el = document.getElementById(idFor(key));
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return { activeKey, idFor, jumpTo };
}

export function PracticeBlockStyle() {
  return (
    <style>{`
      .ovp-section { margin: 46px 0; }
      .ovp-kicker { font-family: var(--th-font-mono); font-size: 11px; color: var(--th-mute); letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 10px; }
      .ovp-subtle { color: var(--th-mute); }
      .ovp-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin: 18px 0; }
      .ovp-jumpbar { position: sticky; top: 68px; z-index: 4; margin-left: -2px; margin-right: -2px; padding: 9px 2px; background: color-mix(in oklab, var(--th-bg) 92%, transparent); backdrop-filter: blur(12px); border-top: 1px solid color-mix(in oklab, var(--th-line) 70%, transparent); border-bottom: 1px solid color-mix(in oklab, var(--th-line) 70%, transparent); }
      .ovp-tabs button { border: 1px solid var(--th-line); border-radius: 999px; background: transparent; color: var(--th-mute); cursor: pointer; font-family: var(--th-font-mono); font-size: 12px; min-height: 34px; padding: 7px 12px; transition: background 150ms ease, border-color 150ms ease, color 150ms ease, transform 150ms ease; }
      .ovp-tabs button:hover { border-color: var(--tone, var(--th-ink)); color: var(--th-ink); }
      .ovp-tabs button:active { transform: scale(0.98); }
      .ovp-tabs button.is-active { background: var(--tone, var(--th-ink)); border-color: var(--tone, var(--th-ink)); color: var(--th-bg); }
      .ovp-panel { border: 1px solid var(--th-line); border-left: 3px solid var(--tone, var(--th-ink)); border-radius: 6px; background: color-mix(in oklab, var(--tone, var(--th-ink)) 7%, transparent); padding: 18px; margin: 16px 0 22px; }
      .ovp-stack { display: grid; gap: 18px; margin: 18px 0 24px; }
      .ovp-stack__item { scroll-margin-top: 124px; }
      .ovp-stack__item.is-active .ovp-panel, .ovp-stack__item.is-active .ovp-flow__detail { box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--tone, var(--th-ink)) 45%, transparent); }
      .ovp-panel :is(h3, h4) { margin-top: 0; }
      .ovp-panel__meta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
      .ovp-grid { display: grid; gap: 14px; margin: 22px 0; }
      .ovp-grid--2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .ovp-grid--3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .ovp-tile { border-top: 2px solid var(--tone, var(--th-line)); padding-top: 12px; min-width: 0; }
      .ovp-tile__label { font-family: var(--th-font-mono); font-size: 11px; color: var(--th-mute); text-transform: uppercase; margin-bottom: 6px; }
      .ovp-tile__title { font-weight: 700; line-height: 1.3; margin-bottom: 5px; }
      .ovp-tile p { margin: 0; color: var(--th-mute); font-size: 15px; line-height: 1.5; }
      .ovp-matrix { display: grid; grid-template-columns: 220px minmax(0, 1fr); border: 1px solid var(--th-line); border-radius: 6px; overflow: hidden; margin: 22px 0; }
      .ovp-matrix__nav { background: var(--th-bg-2); border-right: 1px solid var(--th-line); }
      .ovp-matrix__nav button { display: block; width: 100%; border: 0; border-bottom: 1px solid var(--th-line); background: transparent; color: var(--th-mute); cursor: pointer; font-family: var(--th-font-mono); font-size: 12px; min-height: 54px; padding: 12px 14px; text-align: left; }
      .ovp-matrix__nav button:last-child { border-bottom: 0; }
      .ovp-matrix__nav button:hover, .ovp-matrix__nav button.is-active { background: var(--th-bg); color: var(--th-ink); }
      .ovp-matrix__body { padding: 22px; min-height: 310px; }
      .ovp-path { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; margin: 20px 0; }
      .ovp-path__step { border: 1px solid var(--th-line); border-top: 3px solid var(--tone); border-radius: 6px; padding: 12px; background: color-mix(in oklab, var(--tone) 5%, transparent); min-height: 132px; }
      .ovp-path__n { font-family: var(--th-font-mono); color: var(--th-mute); font-size: 11px; }
      .ovp-path__title { font-weight: 700; margin: 6px 0 4px; line-height: 1.25; }
      .ovp-path__copy { color: var(--th-mute); font-size: 14px; line-height: 1.45; margin: 0; }
      .ovp-flow { display: grid; grid-template-columns: 190px minmax(0, 1fr); gap: 14px; align-items: stretch; margin: 24px 0; }
      .ovp-flow__rail { display: grid; gap: 8px; }
      .ovp-flow__rail button { border: 1px solid var(--th-line); border-radius: 6px; background: var(--th-bg); color: var(--th-mute); cursor: pointer; font-family: var(--th-font-mono); min-height: 46px; padding: 10px 12px; text-align: left; }
      .ovp-flow__rail button.is-active { border-color: var(--tone); color: var(--th-ink); background: color-mix(in oklab, var(--tone) 8%, transparent); }
      .ovp-flow__detail { border: 1px solid var(--th-line); border-left: 3px solid var(--tone); border-radius: 6px; padding: 18px; min-height: 250px; }
      .ovp-command { margin: 18px 0; }
      .ovp-command .b-pre { margin: 0; }
      .ovp-route { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 20px 0; }
      .ovp-route__item { border: 1px solid var(--th-line); border-radius: 6px; padding: 14px; background: var(--th-bg-2); min-width: 0; }
      .ovp-route__value { margin-top: 8px; word-break: break-word; }
      .ovp-route__value code { white-space: normal; }
      .ovp-stage-note { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 18px; }
      .ovp-stage-note > div { border-top: 1px solid var(--th-line); padding-top: 12px; }
      .ovp-compact-list { margin-top: 8px; }
      .ovp-compact-list .b-li { margin: 6px 0; }
      @media (max-width: 800px) {
        .ovp-grid--2, .ovp-grid--3, .ovp-matrix, .ovp-path, .ovp-flow, .ovp-route, .ovp-stage-note { grid-template-columns: 1fr; }
        .ovp-matrix__nav { display: flex; overflow-x: auto; border-right: 0; border-bottom: 1px solid var(--th-line); }
        .ovp-matrix__nav button { min-width: 168px; border-bottom: 0; border-right: 1px solid var(--th-line); }
        .ovp-path__step { min-height: auto; }
      }
    `}</style>
  );
}

const comparisonProducts = [
  {
    key: 'openviking',
    label: 'OpenViking',
    tone: '#4a8c5a',
    title: '上下文数据库：把上下文当作 Agent 可操作的数据',
    summary: '管理对象是文件、文本、链接、对话历史和派生摘要。能力重点不是单点检索，而是增删查改、语义检索、层次保留、自动解析、自动摘要、数据隔离、原生记忆插件和内置 bot/RAG。',
    relation: '它会用到向量检索，也借鉴文件系统范式，但对 Agent 暴露的是更完整的数据管理接口。',
    tags: ['增删查改', '语义检索', '层次结构', '自动摘要', 'Memory', 'Bot'],
  },
  {
    key: 'vector',
    label: 'VikingDB / 向量库',
    tone: '#1B365D',
    title: '向量库：语义相关性排序的基础设施',
    summary: '管理对象主要是向量、标量，以及容易转为向量的特定模态内容。优势是语义检索、稀疏/关键词索引、规模化索引和云上托管。',
    relation: '它是 OpenViking 的关键底层能力之一，但不会天然保留文档层次，也不会给 Agent 提供阅读、摘要、记忆和 bot 工作流。',
    tags: ['向量', '标量', '语义排序', '稀疏检索', '云服务'],
  },
  {
    key: 'filesystem',
    label: 'LocalFS / AGFS / TOS',
    tone: '#8b6f2f',
    title: '文件系统：人和 Agent 都容易理解的组织范式',
    summary: '管理对象是文件，天然保留目录层次，适合遍历、移动、重命名、权限隔离和原始文件保留。查询往往依赖 grep 或其他应用。',
    relation: 'OpenViking 借用了文件系统范式，让 Agent 能用 ov ls、ov tree、ov read 等命令探索上下文；但它补上了语义检索、摘要、解析和记忆能力。',
    tags: ['文件', '目录', '遍历', 'Grep', '原始文件'],
  },
];

const comparisonRows = [
  ['数据操作', '增删查改', '增删查改', '增删改，查询依赖其他应用'],
  ['输入格式', '文件、文本内容、链接、对话历史', '向量、标量、易向量化内容', '文件'],
  ['语义检索', '是，基于向量', '是，基于向量', '否'],
  ['关键词检索', '是，基于稀疏向量或 Grep', '是，基于稀疏向量和关键词索引', '是，基于 Grep'],
  ['层次结构', '保留并可被 Agent 遍历', '通常不保留', '天然保留'],
  ['自动解析和摘要', '支持自动解析、L0 摘要、overview', '不内置', '不内置'],
  ['Agentic 阅读', '支持 ls/tree/find/abstract/overview/read', '不直接支持', '支持遍历，但缺少语义加工'],
  ['数据隔离', '账号、用户、智能体维度', '基于标量', '部分基于 user/group'],
  ['内置能力', '原生记忆插件、Bot、原生 RAG', '不内置', '不内置'],
  ['部署形态', '本地部署已支持，云托管计划内', '云上托管', '本地或对象存储，能力不完整'],
  ['原始文件', '默认不保留，后续继续细化', '不保留', '保留'],
];

export function DatabaseComparison() {
  const nav = useStackNav(comparisonProducts, 'ovp-comparison');
  const active = comparisonProducts.find(item => item.key === nav.activeKey) || comparisonProducts[0];

  return (
    <section className="ovp-section" id="database-comparison">
      <div className="ovp-kicker">database boundary</div>
      <H3>与向量库、文件系统的区别与联系</H3>
      <P>
        原文把 OpenViking 定义为“上下文数据库”。这个定义的关键在于：它面向 AI Agent
        按特定范式存储、管理、检索上下文信息，并具备自动数据处理和计算能力。
      </P>

      <div className="ovp-tabs ovp-jumpbar" style={{ '--tone': active.tone }} aria-label="上下文数据库能力对比快速跳转">
        {comparisonProducts.map(item => (
          <button
            type="button"
            key={item.key}
            className={item.key === nav.activeKey ? 'is-active' : ''}
            onClick={() => nav.jumpTo(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="ovp-stack">
        {comparisonProducts.map(item => (
          <article
            className={`ovp-stack__item ${item.key === nav.activeKey ? 'is-active' : ''}`}
            id={nav.idFor(item.key)}
            key={item.key}
            style={{ '--tone': item.tone }}
          >
            <div className="ovp-panel">
              <div className="ovp-kicker">{item.label}</div>
              <H4>{item.title}</H4>
              <P>{item.summary}</P>
              <P>{item.relation}</P>
              <div className="ovp-panel__meta">
                {item.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
              </div>
            </div>
          </article>
        ))}
      </div>

      <Table
        caption="公开文章摘要版：重点保留 OpenViking、向量库、文件系统的产品边界。"
        headers={['产品特性', 'OpenViking 上下文数据库', 'VikingDB 向量库', 'LocalFS / AGFS / TOS 文件系统']}
        rows={comparisonRows}
      />

      <Callout type="info" title="更多实现细节">
        <P>
          相关实现细节可继续阅读 <A href={OPENVIKING_DOCS}>OpenViking 技术文档</A>。公开文章保留产品边界，
          避免把部署环境或特定平台细节混进核心概念。
        </P>
      </Callout>

      <Pull>
        向量库解决“语义怎么排”，文件系统解决“结构怎么走”，OpenViking 解决“Agent 如何把上下文当作数据使用”。
      </Pull>
    </section>
  );
}

const documentStages = [
  {
    key: 'source',
    label: '原始长文档',
    tone: '#1B365D',
    title: '一个文件不再是唯一边界',
    body: '在普通文件系统中，一个长文档通常是单个文件。Agent 要么一次性读入，要么依赖外部工具切片，窗口占用和语义边界都不可控。',
    output: '输入可以是 docx、pdf、markdown、网页、压缩包或团队目录。',
    agentAction: '先用 ov add-resource 写入资源，而不是把全文粘进提示词。',
  },
  {
    key: 'chapter',
    label: '章节子目录',
    tone: '#4a8c5a',
    title: '按章节顺序组织子目录',
    body: 'OpenViking 会把长文档组织成子目录，保留章节顺序和上下级关系，让 Agent 能先看树，再决定展开哪一段。',
    output: '目录结构变成可遍历资源，例如 viking://resources/docs/project/03-design/。',
    agentAction: '用 ov tree 或 ov ls 先理解结构，减少盲读。',
  },
  {
    key: 'module',
    label: '内容模块',
    tone: '#8b6f2f',
    title: '拆成语义相对独立的内容模块',
    body: '章节继续拆成更小模块，保证每个模块可以直接向量化，语义相对独立，并能被低成本放入模型窗口。',
    output: '模块通常承载一个观点、流程、接口说明、案例或决策。',
    agentAction: '用 ov find 定位入口，再用 ov overview 判断是否需要读原文。',
  },
  {
    key: 'modal',
    label: '模态元素',
    tone: '#7a4f9a',
    title: '图片、表格、代码和附件被转成上下文元素',
    body: '上下文没有固定数据类型。OpenViking 的目标是把不同模态转成 Agent 易读、易检索、可引用的元素。',
    output: '表格、图片、代码块、链接和附件不只是文件附属物，而是可检索的上下文。',
    agentAction: 'Agent 可以从摘要进入，再按 URI 追到具体元素。',
  },
  {
    key: 'summary',
    label: '摘要层级',
    tone: '#b5533f',
    title: 'L0 摘要、overview 和原文组成阅读路径',
    body: 'ls、tree、find 等命令会返回轻量摘要；abstract 给完整摘要；overview 帮助了解内容结构；read 才进入原文。',
    output: '上下文读取路径从粗到细，避免“读窗口陷阱”。',
    agentAction: '先摘要，后 overview，最后 read。只有证据不足时才展开全文。',
  },
];

export function DocumentDecomposition() {
  const nav = useStackNav(documentStages, 'ovp-document-stage');
  const active = documentStages.find(stage => stage.key === nav.activeKey) || documentStages[0];

  return (
    <section className="ovp-section" id="document-decomposition">
      <div className="ovp-kicker">document as context</div>
      <H3>长文档拆解和重组为上下文的例子</H3>
      <P>
        原文强调，OpenViking 与典型文件系统的一个较大差异，是文件可能被拆解和重组后再进行存储。
        目标是让资料更容易被直接访问、提取、向量化和逐级阅读。
      </P>

      <div className="ovp-tabs ovp-jumpbar" style={{ '--tone': active.tone }} aria-label="长文档处理阶段快速跳转">
        {documentStages.map(stage => (
          <button
            type="button"
            key={stage.key}
            className={stage.key === nav.activeKey ? 'is-active' : ''}
            onClick={() => nav.jumpTo(stage.key)}
          >
            {stage.label}
          </button>
        ))}
      </div>

      <div className="ovp-stack">
        {documentStages.map(stage => (
          <article
            className={`ovp-stack__item ${stage.key === nav.activeKey ? 'is-active' : ''}`}
            id={nav.idFor(stage.key)}
            key={stage.key}
            style={{ '--tone': stage.tone }}
          >
            <div className="ovp-flow__detail">
              <div className="ovp-kicker">{stage.label}</div>
              <H4>{stage.title}</H4>
              <P>{stage.body}</P>
              <div className="ovp-stage-note">
                <div>
                  <div className="ovp-tile__label">输出形态</div>
                  <P>{stage.output}</P>
                </div>
                <div>
                  <div className="ovp-tile__label">Agent 动作</div>
                  <P>{stage.agentAction}</P>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="ovp-path" aria-label="长文档到上下文的路径">
        {documentStages.map((stage, index) => (
          <div className="ovp-path__step" key={stage.key} style={{ '--tone': stage.tone }}>
            <div className="ovp-path__n">{String(index + 1).padStart(2, '0')}</div>
            <div className="ovp-path__title">{stage.label}</div>
            <p className="ovp-path__copy">{stage.output}</p>
          </div>
        ))}
      </div>

      <Callout type="tip" title="阅读窗口策略">
        <P>
          OpenViking 的拆解不是为了制造更多碎片，而是为了同时满足三个条件：
          <Strong> 可直接向量化</Strong>、<Strong>语义相对独立</Strong>、<Strong>阅读窗口占用低</Strong>。
        </P>
      </Callout>
    </section>
  );
}

const adoptionSteps = [
  {
    key: 'deploy',
    label: 'Server mode',
    tone: '#4a8c5a',
    title: '优先用服务化方式快速验证',
    body: 'OpenViking 可以嵌入 Python 程序，也可以用 Server mode 快速验证。本地机器、云主机或 ECS 都适合先跑通服务。',
    command: `uv venv openviking-env
source openviking-env/bin/activate
uv pip install openviking --upgrade
# config ~/.openviking/ov.conf, follow README in repo
nohup openviking-server > ~/.openviking/openviking.log 2>&1 &`,
    check: '启动后先用 ov status 确认服务可用。',
  },
  {
    key: 'source',
    label: '接入资料',
    tone: '#1B365D',
    title: '把团队知识接到同一个上下文层',
    body: '资料来源可以是代码仓库、私有 GitLab、论文、图片、PDF、项目文档、团队目录或压缩包。',
    command: `ov add-resource https://github.com/volcengine/OpenViking
ov add-resource https://arxiv.org/pdf/2602.09540
ov add-resource ./team_building.jpg
ov add-resource ./project.docx
ov add-resource ./team-docs.zip`,
    check: '私有仓库要确认服务端具备访问权限，并按部署文档配置 Git 域名和凭证。',
  },
  {
    key: 'discover',
    label: '发现上下文',
    tone: '#8b6f2f',
    title: '先找入口，再展开证据',
    body: 'Agent 不应该一次读完所有资料。它可以从根目录、语义检索、目录树、摘要和原文逐级深入。',
    command: `ov ls
ov find "How does OpenViking use VikingDB?" --uri=viking://resources/code/volcengine/OpenViking
ov tree viking://resources/code/volcengine/OpenViking/examples/ -L 2
ov abstract viking://resources/code/volcengine/OpenViking
ov read viking://resources/code/volcengine/OpenViking/examples/cloud/GUIDE.md`,
    check: 'ls、tree、find 会自动返回 L0 摘要，先用摘要判断是否继续读。',
  },
  {
    key: 'operate',
    label: '运维和观察',
    tone: '#7a4f9a',
    title: '让上下文服务可观察、可维护',
    body: '团队落地时，服务状态、日志、资源更新、技能和记忆都需要进入日常运维视角。',
    command: `ov status
ov observer vlm
ov add-skill ./my-skill/examples/openviking-cli-skills
ov find "OpenViking 使用技巧" --uri=viking://agent/skills
ov add-memory ./2026-03-04/memory-2026-03-04.md`,
    check: '把技能和记忆也当成上下文资源管理，而不是散落在不同 Agent 配置里。',
  },
];

export function TeamAdoptionPlaybook() {
  const nav = useStackNav(adoptionSteps, 'ovp-adoption-step');
  const active = adoptionSteps.find(step => step.key === nav.activeKey) || adoptionSteps[0];

  return (
    <section className="ovp-section" id="team-adoption-playbook">
      <div className="ovp-kicker">team adoption</div>
      <H3>用 OpenViking 改善团队 AI 能力</H3>
      <P>
        原文的判断很直接：信息处理流转效率，也就是上下文处理效率，决定个体和组织的竞争力。
        大规模信息集成和组织能力，是 OpenViking 提供给团队的新武器。
      </P>

      <div className="ovp-tabs ovp-jumpbar" style={{ '--tone': active.tone }} aria-label="团队落地步骤快速跳转">
        {adoptionSteps.map(step => (
          <button
            type="button"
            key={step.key}
            className={step.key === nav.activeKey ? 'is-active' : ''}
            onClick={() => nav.jumpTo(step.key)}
          >
            {step.label}
          </button>
        ))}
      </div>

      <div className="ovp-stack">
        {adoptionSteps.map(step => (
          <article
            className={`ovp-stack__item ${step.key === nav.activeKey ? 'is-active' : ''}`}
            id={nav.idFor(step.key)}
            key={step.key}
            style={{ '--tone': step.tone }}
          >
            <div className="ovp-panel">
              <div className="ovp-kicker">{step.label}</div>
              <H4>{step.title}</H4>
              <P>{step.body}</P>
              <div className="ovp-command">
                <Pre lang="bash" filename={`${step.key}.sh`}>{step.command}</Pre>
              </div>
              <Callout type="note" title="检查点">
                <P>{step.check}</P>
              </Callout>
            </div>
          </article>
        ))}
      </div>

      <Cols count={2}>
        <Col>
          <H4>综合案例 A：多仓库业务技术问题</H4>
          <P>
            原文的推荐方向案例，是在大规模历史仓库下回答实际业务技术问题。关键不是单仓库代码问答，
            而是让 Agent 跨多个仓库、文档和历史设计记录定位上下文。
          </P>
        </Col>
        <Col>
          <H4>团队建设顺序</H4>
          <Ol>
            <Li>先把核心代码仓库和稳定文档接入。</Li>
            <Li>再接入会议纪要、聊天记录、项目沉淀和外部材料。</Li>
            <Li>最后把常用 SOP 做成 Skills，把重复偏好沉淀为 Memory。</Li>
          </Ol>
        </Col>
      </Cols>
    </section>
  );
}

const memoryRows = [
  ['重复解释偏好', '把用户要求、团队规范、任务偏好沉淀为可检索记忆。'],
  ['任务重试成本高', '用 Session 自动摘要和 add-memory 保留有效经验，减少下一次从零开始。'],
  ['OpenClaw 宏观任务变长', '让 OpenClaw 通过 OpenViking 读取长期上下文，而不是只依赖当前对话。'],
  ['团队知识分散', '把代码、文档、会议、聊天和外部材料放到统一的上下文数据库中。'],
];

export function OpenClawMemoryPractice() {
  return (
    <section className="ovp-section" id="openclaw-memory-practice">
      <div className="ovp-kicker">openclaw memory</div>
      <H3>OpenViking 与 OpenClaw 的最佳实践</H3>
      <P>
        原文把 OpenClaw 作为一个典型自主智能体场景：当任务周期变长，用户会明显感受到“刚说过的要求又被忘了”。
        OpenViking 的角色，是把 OpenClaw 的长期记忆组件变成可管理、可检索、可更新的上下文数据库。
      </P>

      <Table
        headers={['OpenClaw 场景痛点', 'OpenViking 实践方式']}
        rows={memoryRows}
      />

      <Callout type="info" title="安装和集成路径">
        <P>
          如果还没有安装 OpenClaw，可以按官方安装方式先完成本地验证。
          安装后，把 OpenViking 的 OpenClaw memory plugin 安装文档交给 OpenClaw，让它按文档部署为内置记忆组件。
        </P>
      </Callout>

      <Pre lang="bash" filename="openclaw-openviking-memory.sh">{`curl -fSL https://openclaw.ai/install.sh | bash

# Tell OpenClaw to follow this guide:
# ${OPENCLAW_GUIDE}

ov add-memory ./2026-03-04/memory-2026-03-04.md`}</Pre>

      <Quote cite="OpenViking 分享原文">
        演示 B：让 OpenClaw 具备更好的记忆。
      </Quote>

      <div className="ovp-grid ovp-grid--3">
        <div className="ovp-tile" style={{ '--tone': '#4a8c5a' }}>
          <div className="ovp-tile__label">记忆输入</div>
          <div className="ovp-tile__title">文件接口和 Session 摘要</div>
          <P>既可以显式 add-memory，也可以读取 Session 自动摘要文档进行长期沉淀。</P>
        </div>
        <div className="ovp-tile" style={{ '--tone': '#1B365D' }}>
          <div className="ovp-tile__label">记忆读取</div>
          <div className="ovp-tile__title">像查上下文一样查记忆</div>
          <P>OpenClaw 不需要把历史对话全塞进窗口，而是按任务检索相关记忆。</P>
        </div>
        <div className="ovp-tile" style={{ '--tone': '#8b6f2f' }}>
          <div className="ovp-tile__label">实践边界</div>
          <div className="ovp-tile__title">不是无限保存对话</div>
          <P>有效记忆应该被摘要、压缩、重组，并能解释为什么被召回。</P>
        </div>
      </div>
    </section>
  );
}

export function VikingBotAndCommunity() {
  return (
    <section className="ovp-section" id="vikingbot-community">
      <div className="ovp-kicker">native bot and q&a</div>
      <H3>VikingBot、提问环节和社区反馈</H3>
      <P>
        原文后半段还展示了原生工具封装的 OpenViking VikingBot。它不是外部附加 demo，
        而是以 OpenViking 为基础，把全部上下文能力封进一个可以直接提问的内嵌智能体。
      </P>

      <Pre lang="bash" filename="vikingbot.sh">{`openviking-server --with-bot
ov chat -m "提出你的问题"

ov status
ov observer vlm`}</Pre>

      <Cols count={2}>
        <Col>
          <H4>演示 C：内嵌智能体探索</H4>
          <P>
            通过 <InlineCode>--with-bot</InlineCode> 启动服务后，
            <InlineCode>ov chat</InlineCode> 可以直接使用 OpenViking 已接入的资料、技能、摘要和检索能力。
          </P>
        </Col>
        <Col>
          <H4>Q&A 和反馈入口</H4>
          <div className="ovp-compact-list">
            <Ul marker="check">
              <Li>阅读代码、提 Issue 和问题反馈：<A href={OPENVIKING_REPO}>OpenViking GitHub</A>。</Li>
              <Li>完整技术文档：<A href={OPENVIKING_DOCS}>OpenViking 文档站</A>。</Li>
              <Li>原文提到 LLM 学习季系列分享 Q&A 合集和 OpenViking 外部技术社区，用于持续收集问题与进展。</Li>
            </Ul>
          </div>
        </Col>
      </Cols>

      <Callout type="tip" title="VikingBot 的定位">
        <P>
          如果 OpenViking 是上下文数据库，VikingBot 就是一个直接证明接口可用性的 Agent。
          它让团队能用自然语言检查资料接入、检索质量、摘要质量和上下文组织效果。
        </P>
      </Callout>
    </section>
  );
}

const wrapSections = {
  takeaways: {
    label: '核心观点',
    tone: '#4a8c5a',
    title: '带走的五个判断',
    body: (
      <Ul marker="check">
        <Li>上下文数据规模越大，检索效率越高，自动化上限越高。</Li>
        <Li>每个高效率团队都应该配备自己的上下文数据库，实现全域信息集成。</Li>
        <Li>向量、文件系统、知识图谱、表格只是形式；Agent 需要趁手的数据交互接口。</Li>
        <Li>OpenViking 定位是上下文数据库，面向 Agent 处理复杂信息的场景设计，not only 记忆组件。</Li>
        <Li>未来智能体能力的核心是上下文能力，包括知识、记忆、工具和组织方式。</Li>
      </Ul>
    ),
  },
  deployment: {
    label: '部署演进',
    tone: '#1B365D',
    title: '从本地验证走向托管和分布式部署',
    body: (
      <>
        <P>
          公开文章不展开特定平台路线，而是保留更通用的产品方向：
          OpenViking 当前适合先用本地或自托管服务验证，后续会继续增强云托管、分布式和稳定升级能力。
        </P>
        <P>
          这部分信息的重点，是把上下文数据库从个人工具变成团队和组织级基础设施：
          有部署规范、反馈入口、权限边界，也能接入现有检索和推荐底座。
        </P>
      </>
    ),
  },
  roadmap: {
    label: '后续规划',
    tone: '#b5533f',
    title: 'OpenViking 后续规划',
    body: (
      <Ol>
        <Li>社区生态建设、标准和协议推广。</Li>
        <Li>增强单机运维能力，推出稳定版本，支持平滑升级。</Li>
        <Li>增强多模态、记忆和技能检索能力，打通更完整的内容理解接口。</Li>
        <Li>建设分布式能力，对接公有云，实现更可靠的分布式一致性。</Li>
      </Ol>
    ),
  },
};

const wrapNavItems = Object.entries(wrapSections).map(([key, item]) => ({ key, ...item }));

export function CoreTakeawaysAndRoadmap() {
  const nav = useStackNav(wrapNavItems, 'ovp-wrap');
  const active = wrapNavItems.find(item => item.key === nav.activeKey) || wrapNavItems[0];

  return (
    <section className="ovp-section" id="core-takeaways-roadmap">
      <div className="ovp-kicker">wrap up</div>
      <H3>带走核心观点和后续规划</H3>
      <P>
        原文结尾把观点收束到上下文数据库的组织价值，并给出社区、稳定性、多模态、记忆、技能检索和分布式能力的后续方向。
      </P>

      <div className="ovp-tabs ovp-jumpbar" style={{ '--tone': active.tone }} aria-label="结尾内容快速跳转">
        {wrapNavItems.map(item => (
          <button
            type="button"
            key={item.key}
            className={item.key === nav.activeKey ? 'is-active' : ''}
            onClick={() => nav.jumpTo(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="ovp-stack">
        {wrapNavItems.map(item => (
          <article
            className={`ovp-stack__item ${item.key === nav.activeKey ? 'is-active' : ''}`}
            id={nav.idFor(item.key)}
            key={item.key}
            style={{ '--tone': item.tone }}
          >
            <div className="ovp-panel">
              <div className="ovp-kicker">{item.label}</div>
              <H4>{item.title}</H4>
              {item.body}
            </div>
          </article>
        ))}
      </div>

      <Quote cite="OpenViking 分享原文">
        未来智能体能力的核心是上下文能力，OpenViking 的核心使命是推动智能体技术蓬勃发展。
      </Quote>
    </section>
  );
}

export function AgentReadableContract() {
  return (
    <section className="ovp-section" id="agent-readable-contract" data-llm-txt={LLM_PATH} data-docs-url={OPENVIKING_DOCS}>
      <div className="ovp-kicker">human html and agent text</div>
      <H3>人读 HTML，Agent 读 llm.txt</H3>
      <P>
        这篇文章需要同时服务两类读者：人类需要重新编排后的叙事、节奏和交互；
        Agent 需要低噪声、可直接引用、并与中英文正文保持内容一致的 markdown。
      </P>

      <div className="ovp-route">
        <div className="ovp-route__item">
          <div className="ovp-tile__label">human html</div>
          <div className="ovp-route__value"><InlineCode>{HUMAN_PATH}</InlineCode></div>
        </div>
        <div className="ovp-route__item">
          <div className="ovp-tile__label">agent markdown</div>
          <div className="ovp-route__value">
            <a href={LLM_PATH} rel="alternate noreferrer" type="text/markdown">{LLM_PATH}</a>
          </div>
        </div>
        <div className="ovp-route__item">
          <div className="ovp-tile__label">public docs</div>
          <div className="ovp-route__value"><A href={OPENVIKING_DOCS}>docs.openviking.ai</A></div>
        </div>
      </div>

      <Table
        headers={['发现方式', '给 Agent 的含义']}
        rows={[
          [<InlineCode key="link">link rel="alternate" type="text/markdown"</InlineCode>, 'HTML 头部声明同一篇文章的 markdown twin。'],
          [<InlineCode key="meta">meta name="llm:content"</InlineCode>, '显式告诉 Agent 当前页面的 llm.txt 路径。'],
          [<InlineCode key="data">data-llm-txt</InlineCode>, '文章主体节点保留可被页面解析器读取的路径。'],
          [<InlineCode key="llms">/llms.txt</InlineCode>, '站点级索引可以列出可供 Agent 读取的文章清单。'],
          [<InlineCode key="docs">docs.openviking.ai</InlineCode>, '公开技术文档承接安装、部署和实现细节。'],
        ]}
      />

      <Callout type="note" title="路由约定">
        <P>
          当 Agent 收到人类 HTML URL 时，应优先读取同路径下的 <InlineCode>llm.txt</InlineCode>。
          HTML 页面负责人类体验，markdown twin 负责机器可读、可引用和可追踪。
        </P>
      </Callout>
    </section>
  );
}

export function OpenVikingPracticeBlocks() {
  return (
    <>
      <PracticeBlockStyle />
      <Lead>
        以下区块细化原文后半部分：从产品边界、长文档处理、团队落地，到 OpenClaw 记忆、VikingBot、结尾观点和 Agent 可读契约。
      </Lead>
      <DatabaseComparison />
      <DocumentDecomposition />
      <TeamAdoptionPlaybook />
      <OpenClawMemoryPractice />
      <VikingBotAndCommunity />
      <CoreTakeawaysAndRoadmap />
      <Hr ornament />
      <P>
        相关资源：<A href={OPENVIKING_REPO}>OpenViking GitHub</A>、
        <A href={OPENVIKING_DOCS}>文档站</A>。
      </P>
    </>
  );
}
