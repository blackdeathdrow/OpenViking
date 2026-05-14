import React from 'react';
import {
  A, Callout, Col, Cols, H3, H4, Lead, Li, Mark, P, Pre, Quote, Small, Strong,
  Table, Tag, Ul,
} from '../../blog-components';

const GITHUB_URL = 'https://github.com/volcengine/OpenViking';
const DOCS_URL = 'https://docs.openviking.ai/';
const DISCORD_URL = 'https://discord.gg/FyTkZ3ZKKm';
const OPENCLAW_GUIDE_URL = 'https://github.com/volcengine/OpenViking/blob/main/examples/openclaw-plugin/INSTALL-ZH.md';

const resourceSections = [
  {
    key: 'resources',
    label: '资源入口',
    title: '把代码、文档和实践入口放在同一处',
    copy: 'OpenViking 已提供开源代码、技术文档、社区讨论和 OpenClaw 集成指南。读者可以直接查看实现、接口和使用路径。',
    bullets: [
      ['阅读代码和提 Issue', <A href={GITHUB_URL}>volcengine/OpenViking</A>],
      ['技术文档站', <A href={DOCS_URL}>docs.openviking.ai</A>],
      ['社区反馈', <>加入 <A href={DISCORD_URL}>Discord 社区</A>，反馈使用问题、bug 和产品预期。</>],
      ['OpenClaw 集成指南', <A href={OPENCLAW_GUIDE_URL}>OpenViking memory plugin guide</A>],
    ],
  },
  {
    key: 'background',
    label: '问题背景',
    title: 'OpenViking 被定位为面向 AI Agent 的上下文数据库',
    copy: 'OpenViking 开源早期迅速获得数千 GitHub stars，说明 Agent 上下文管理已经成为明确需求：上下文需要被组织、查询、摘要、更新和复用。',
    bullets: [
      ['核心价值', '围绕上下文工程的核心痛点，解决信息组织、上下文推荐和长期记忆基础设施问题。'],
      ['技术视角', '梳理它与向量库、文件系统、OpenClaw 自主智能体之间的区别和联系。'],
      ['落地视角', '讨论团队 AI 应用如何把代码仓库、文档、聊天记录、会议纪要和外部资料接入同一上下文层。'],
      ['实践视角', '通过 OpenViking Skill 与插件集成，展示它如何增强 OpenClaw 的复杂任务上下文管理能力。'],
    ],
  },
  {
    key: 'focus',
    label: '文章主线',
    title: '从上下文工程痛点走向数据库解法',
    copy: '这一节建立问题空间：上下文工程现状、六类上下文原语、四类近期痛点，以及上下文工程公式。',
    bullets: [
      ['发展现状与核心痛点', 'Prompt Engineering 之后，RAG、Web Search、Tools、Skills、Memory 共同构成上下文工程栈。'],
      ['设计理念与技术原理', 'OpenViking 将上下文看作需要组织、索引、查询、摘要、更新和治理的数据。'],
      ['区别与联系', '向量库、文件系统、表格和图谱可以是底层组织形态；Agent 需要的是可操作、可追溯的数据接口。'],
      ['团队 AI 能力提升', '目标是降低跨仓库、跨文档、跨人协作时的信息编排成本。'],
      ['OpenClaw 最佳实践', '把长期记忆、技能和插件串起来，减少重复补充上下文。'],
    ],
  },
];

const primitives = [
  {
    key: 'prompt',
    label: 'Prompt',
    fullName: 'Prompt Engineering',
    tone: '#1B365D',
    summary: '用提示词把角色、背景、规则和输出目标写给模型，是所有上下文工程的起点。',
    description: '通过前缀提示词或提示词模板，将模型完成任务所需的角色定义、任务背景、执行规则、输出目标等，以主要是纯文本的形式提供给 LLM。',
    advantage: '泛化和激活了 LLM 能力，使训练一个通用 LLM 后仍能通过调整提示词解决各类场景的数据处理问题。',
    limitation: '提示词编写和版本管理复杂。任务不再简单直接时，维护成本会快速上升，任务适应性下降，也很难判断能力改进来自提示词还是系统其他部分。',
    openvikingAngle: '提示词适合激活能力，但不能长期承载团队级知识组织。它需要被更稳定的上下文数据层支撑。',
  },
  {
    key: 'rag',
    label: 'RAG',
    fullName: 'RAG / KnowledgeBase',
    tone: '#4A8C5A',
    summary: '在生成前检索私有知识，让模型处理非公开领域问题。',
    description: '在 Prompt Engineering 基础上进行一轮或多轮私有知识库检索，通过命中的内容切片获得任务相关知识、约束和示例。',
    advantage: '提供私有知识领域的简单问题解决能力，例如问答和参考生成，使模型可以使用最新的、私有的知识。',
    limitation: '狭义 RAG 通常不是知识闭环，仍依赖人工整理和注入已有知识，需要持续编排知识以提高命中率和使用率。',
    openvikingAngle: 'OpenViking 关注 RAG 前后的知识组织问题：资料如何进入、被解析、被拆分、被摘要、被更新。',
  },
  {
    key: 'web',
    label: 'Web Search',
    fullName: 'Web Search',
    tone: '#8B6F2F',
    summary: '接入公域搜索，让模型访问最新公开信息。',
    description: '通过搜索引擎获取全网最新公开信息，并将搜索结果转换为 LLM/VLM 易于读取的形态，提升调研和公开领域问题解决效率。',
    advantage: '集成实时公开信息访问能力，使模型可以使用最新的、公开的知识。',
    limitation: '公开信息不稳定且存在安全风险，容易受到 SEO、提示词注入和信源污染影响，企业服务需要筛选和过滤。',
    openvikingAngle: 'Web Search 补足外部信息，但企业 Agent 仍需要一层可信上下文数据库来沉淀、隔离和复用筛选后的材料。',
  },
  {
    key: 'tools',
    label: 'Tools',
    fullName: 'Tools / MCP',
    tone: '#7A4F9A',
    summary: '把系统接口、函数和外部动作暴露给模型。',
    description: '工具调用通过多种范式把系统接口和函数实现暴露给大模型调用，提供初步系统集成能力。',
    advantage: '可以在工具层加入校验、检查、约束和可观测能力，让模型初步具备与真实复杂环境交互的能力。',
    limitation: '实现复杂，依赖人工包装调用函数。工具数量扩展后，子流程可控不等于宏观决策可靠。',
    openvikingAngle: '工具让 Agent 能行动，但行动前仍要知道读什么、信什么、为什么调用。上下文数据库补的是决策材料。',
  },
  {
    key: 'skills',
    label: 'Skills',
    fullName: 'Skills',
    tone: '#B5533F',
    summary: '把 SOP 文件化，给 Agent 层次化流程和工具入口。',
    description: '基于文件系统概念设计，把流程、规则、工具入口和上下文暴露方式写成可读取的技能文件，接近人工 SOP。',
    advantage: '适合中长任务的流程封装和 SOP 描述，相比代码允许模型根据实际条件开展有边界的探索。',
    limitation: '主要依赖规则编写，缺乏自我迭代。当资料空间变大时，层次化暴露可能召回不足，调用确定性也无法保证。',
    openvikingAngle: 'Skills 是 Agent 读懂流程的方式，OpenViking 可以为 Skill 提供更大的资料空间、摘要层级和检索能力。',
  },
  {
    key: 'memory',
    label: 'Memory',
    fullName: 'Memory',
    tone: '#2F6F73',
    summary: '把长期经验、偏好和知识沉淀为后续任务可复用的上下文。',
    description: '研究后天学习和记忆的信息加工方式，通过摘要、压缩、重组解决智能体全生命周期的信息沉淀和复用需求。',
    advantage: '提供接近无限延展的上下文能力，支持自进化和个性化，让后续任务基于前序经验改善结果。',
    limitation: '记忆信息的组织和检索极其复杂。记录或检索方式不合理时可能产生负向作用，需要结合应用场景深度调优。',
    openvikingAngle: 'OpenViking 为 Memory 提供底层组织、查询、隔离和生命周期管理能力。',
  },
];

const agiGoals = [
  {
    key: 'lifecycle',
    label: '超长生命周期',
    title: '月级到年级的持续工作',
    copy: '智能体需要长期陪伴、连续记忆和长期约束有效性，而不是每个任务都从零开始补充背景。',
  },
  {
    key: 'coordination',
    label: '跨越认知边界',
    title: '万人规模协作和跨文化任务',
    copy: '未来 Agent 需要帮助人协调任务编排、信息同步和结果评价，处理不同语言和文化背景下的复杂工作。',
  },
  {
    key: 'learning',
    label: '持续学习',
    title: '领域认知不断加强',
    copy: '智能体要能长期研究、跟踪进展，并在特定领域沉淀越来越强的认知结构。',
  },
  {
    key: 'constraint',
    label: '行动约束',
    title: '自省、SLA/SLO 与合作能力',
    copy: '面对有合规、时间和质量标准的任务，Agent 必须能约束自身行动，并把承诺落实到可检查的工作流。',
  },
];

const painPoints = [
  {
    key: 'coding',
    label: 'AI Coding',
    tone: '#1B365D',
    title: '跨仓库上下游串联困难',
    question: 'Agent 能否串联团队上下游的多个代码仓库，并减少需求、协议和历史实现的沟通成本？',
    context: '真实研发任务很少只发生在当前目录。需求、接口协议、历史实现、依赖服务、测试脚本可能分散在多个仓库和文档里。',
    gap: '单仓库上下文会让 Agent 给出局部正确但整体不可交付的修改，最后仍然需要人去同步信息、解释背景和修正接口误判。',
    desired: '上下文系统需要跨资源定位证据，保留目录结构，并允许 Agent 从摘要逐步展开到原始材料和代码。',
  },
  {
    key: 'openclaw',
    label: 'OpenClaw',
    tone: '#4A8C5A',
    title: '刚说过的要求没有成为长期约束',
    question: 'OpenClaw Agent 能否记住昨天刚确认过的约束，而不是每次都要求用户重新补充背景？',
    context: '自主智能体要完成中长周期任务，必须记住偏好、约束、修正历史和失败经验。',
    gap: '如果记忆只是对话记录或一次性摘要，Agent 很容易在新任务里丢掉关键约束，导致用户反复补充同一批上下文。',
    desired: '记忆应当被组织成可检索、可更新、可隔离的资源，而不是越来越长的聊天历史。',
  },
  {
    key: 'knowledge',
    label: '知识编排',
    tone: '#8B6F2F',
    title: '知识散落在太多来源里',
    question: '当代码仓库、协作文档、聊天记录、会议纪要、外部文献和团队标准散落各处，Agent 是在管理知识，还是用户在管理 Agent？',
    context: '团队知识不是单一知识库。它会跨文件、跨工具、跨组织边界存在，并且格式、权限和更新节奏都不同。',
    gap: '如果每次任务都靠人手动提供资料，Agent 只是把信息编排压力转移给用户，复杂任务反而更累。',
    desired: '上下文数据库应当统一接入多种来源，并提供搜索、摘要、层级浏览和按需读取能力。',
  },
  {
    key: 'alignment',
    label: '观点对齐',
    tone: '#7A4F9A',
    title: '交付前没有充分理解人的真实标准',
    question: 'Agent 能否在交付前理解负责人真正关心的标准，并把这些标准转化为执行约束？',
    context: '很多工作失败源于模型没有掌握决策者的评价标准、历史偏好和上下文暗线。',
    gap: '只凭感觉迭代出的结果可能表面完整，但与组织语境、质量标准或具体偏好错位，交付时才暴露风险。',
    desired: '上下文系统需要沉淀人和团队的观点、标准、历史反馈，并在任务前推荐相关约束。',
  },
];

const formulaTerms = [
  {
    key: 'constraint',
    label: '约束',
    title: '可靠的推理流程约束',
    tone: '#1B365D',
    copy: '让 Agent 在长任务里有可遵循的流程、校验点和失败边界。Prompt、Tools 和 Skills 都能贡献约束，但约束需要被版本化和复用。',
    openviking: 'OpenViking 不直接替代推理框架，它为流程约束提供可被引用的背景、规则、案例和检查材料。',
  },
  {
    key: 'organization',
    label: '组织',
    title: '完整的信息组织',
    tone: '#4A8C5A',
    copy: '把上下文从散乱文本变成可增加、删除、查询、更新的数据。组织方式要同时保留语义相关性、层级结构和来源边界。',
    openviking: '这是 OpenViking 的主战场：把代码、文档、图片、PDF、压缩包和对话历史纳入统一资源空间。',
  },
  {
    key: 'recommendation',
    label: '推荐',
    title: '有效的上下文推荐',
    tone: '#8B6F2F',
    copy: 'Agent 不应该一次性吞下所有材料。它需要在不同任务阶段获得最可能相关的上下文，再逐步展开细节。',
    openviking: 'OpenViking 的索引、摘要和目录结构为推荐提供候选空间，让 Agent 先看方向，再看证据。',
  },
  {
    key: 'memory',
    label: '记忆',
    title: '全生命周期记忆',
    tone: '#7A4F9A',
    copy: '记忆要把经验、偏好、约束和结论加工成后续任务能找到、能理解、能更新的资源。',
    openviking: 'OpenViking 可作为 Memory 的底层存储与检索设施，支撑长期任务连续性和个性化。',
  },
  {
    key: 'learning',
    label: '学习',
    title: '可跟踪的自进化学习',
    tone: '#B5533F',
    copy: '系统要能解释为什么推荐这些上下文，也要允许团队修正知识组织方式，让下一次任务从反馈中受益。',
    openviking: 'OpenViking 提供可追溯的资源路径、摘要层级和命令式接口，便于把使用反馈沉淀回上下文系统。',
  },
];

function AnchorStrip({ items, prefix, label }) {
  return (
    <nav className="ovb-anchor-strip" aria-label={label}>
      {items.map(item => (
        <a
          key={item.key}
          className="ovb-tab"
          href={`#${prefix}-${item.key}`}
          style={{ '--tone': item.tone || '#1B365D' }}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}

export function ContextBlockStyles() {
  return (
    <style>{`
      .ovb-section { margin: 36px 0; }
      .ovb-kicker { font-family: var(--th-font-mono); font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--th-mute); margin-bottom: 8px; }
      .ovb-anchor-strip { align-items: center; border-bottom: 1px solid var(--th-line); border-top: 1px solid var(--th-line); display: flex; gap: 8px; margin: 18px 0 22px; overflow-x: auto; padding: 8px 0; scrollbar-width: thin; }
      .ovb-tab { border: 1px solid var(--th-line); border-radius: 999px; color: var(--th-mute); cursor: pointer; display: inline-flex; flex: 0 0 auto; font-family: var(--th-font-mono); font-size: 12px; line-height: 1.2; padding: 7px 12px; text-decoration: none; transition: background 150ms ease, border-color 150ms ease, color 150ms ease, transform 150ms ease; white-space: nowrap; }
      .ovb-tab:hover, .ovb-tab:focus-visible { background: color-mix(in oklab, var(--tone, var(--th-ink)) 8%, transparent); border-color: var(--tone, var(--th-ink)); color: var(--th-ink); outline: none; }
      .ovb-tab:active { transform: scale(0.98); }
      .ovb-stack { display: grid; gap: 16px; margin: 22px 0; }
      .ovb-panel { border: 1px solid var(--th-line); border-left: 3px solid var(--tone, var(--th-ink)); border-radius: 6px; background: color-mix(in oklab, var(--tone, var(--th-ink)) 7%, transparent); padding: 18px; scroll-margin-top: 132px; }
      .ovb-panel :is(h3, h4) { margin-top: 0; }
      .ovb-resource-list { display: grid; gap: 10px; margin-top: 16px; }
      .ovb-resource-row { display: grid; grid-template-columns: minmax(120px, 0.34fr) minmax(0, 1fr); gap: 12px; border-top: 1px solid var(--th-line); padding-top: 10px; }
      .ovb-resource-row strong { font-size: 14px; }
      .ovb-resource-row span { color: var(--th-mute); font-size: 14px; line-height: 1.5; }
      .ovb-stat-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 22px 0; }
      .ovb-stat { border: 1px solid var(--th-line); border-radius: 6px; padding: 14px; min-height: 154px; background: var(--th-bg-2); }
      .ovb-stat :is(h3, h4) { margin: 8px 0 6px; font-size: 17px; line-height: 1.25; }
      .ovb-stat p { margin: 0; color: var(--th-mute); font-size: 14px; line-height: 1.5; }
      .ovb-stat-label { font-family: var(--th-font-mono); font-size: 11px; color: var(--th-mute); text-transform: uppercase; }
      .ovb-matrix-title { display: grid; gap: 8px; align-items: start; margin-bottom: 8px; }
      .ovb-matrix-title :is(h3, h4) { margin: 0; font-size: 25px; line-height: 1.2; }
      .ovb-primitive-card { scroll-margin-top: 132px; }
      .ovb-mini-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 18px; }
      .ovb-mini { border-top: 1px solid var(--th-line); padding-top: 12px; }
      .ovb-mini-label { color: var(--th-mute); font-family: var(--th-font-mono); font-size: 11px; text-transform: uppercase; margin-bottom: 5px; }
      .ovb-mini p { margin: 0; font-size: 14px; line-height: 1.5; }
      .ovb-pain-card { border: 1px solid var(--th-line); border-left: 3px solid var(--tone); border-radius: 6px; padding: 20px; background: color-mix(in oklab, var(--tone) 7%, transparent); scroll-margin-top: 132px; }
      .ovb-pain-question { font-size: 18px; line-height: 1.45; margin: 0 0 16px; color: var(--th-ink); }
      .ovb-formula { margin: 22px 0; }
      .ovb-formula-line { align-items: center; border-bottom: 1px solid var(--th-line); border-top: 1px solid var(--th-line); display: flex; gap: 8px; margin: 18px 0 16px; overflow-x: auto; padding: 8px 0; scrollbar-width: thin; }
      .ovb-formula-line .ovb-tab { scroll-snap-align: start; }
      .ovb-plus { color: var(--th-mute); font-family: var(--th-font-mono); }
      .ovb-formula-panel { border: 1px solid var(--th-line); border-left: 3px solid var(--tone); border-radius: 6px; padding: 20px; background: color-mix(in oklab, var(--tone) 8%, transparent); scroll-margin-top: 132px; }
      .ovb-formula-panel :is(h3, h4) { margin: 0 0 8px; font-size: 24px; }
      .ovb-claim { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; }
      .ovb-claim div { border-top: 1px solid var(--th-line); padding-top: 12px; }
      .ovb-code-note { margin-top: 18px; }
      @media (max-width: 820px) {
        .ovb-stat-grid, .ovb-mini-grid, .ovb-claim { grid-template-columns: 1fr; }
        .ovb-resource-row { grid-template-columns: 1fr; gap: 4px; }
      }
    `}</style>
  );
}

export function ResourceDeck() {
  return (
    <section className="ovb-section" aria-labelledby="resource-deck-title">
      <div className="ovb-kicker">resources and thesis</div>
      <H3 id="resource-deck-title">资源入口、问题背景与文章主线</H3>
      <Lead>
        OpenViking 是开源项目，也是一套给 Agent 管理上下文的数据库范式。先看资源入口、问题背景和文章主线。
      </Lead>
      <AnchorStrip items={resourceSections} prefix="ovb-resource" label="资源与问题背景导航" />
      <div className="ovb-stack">
        {resourceSections.map(section => (
          <article
            className="ovb-panel"
            id={`ovb-resource-${section.key}`}
            key={section.key}
            style={{ '--tone': '#1B365D' }}
          >
            <H4>{section.title}</H4>
            <P>{section.copy}</P>
            <div className="ovb-resource-list">
              {section.bullets.map(([label, value]) => (
                <div className="ovb-resource-row" key={label}>
                  <Strong>{label}</Strong>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
      <Callout type="info" title="阅读线索">
        <P>
          代码说明实现方式，文档说明接口边界，社区反馈暴露真实问题，OpenClaw 集成展示 Agent 如何使用这层上下文基础设施。
          实现细节见 <A href={DOCS_URL}>OpenViking 技术文档</A>。
        </P>
      </Callout>
    </section>
  );
}

export function ContextStatusBackdrop() {
  return (
    <section className="ovb-section" aria-labelledby="context-status-title">
      <div className="ovb-kicker">why context engineering matters</div>
      <H3 id="context-status-title">上下文工程发展现状与痛点背景</H3>
      <P>
        上下文工程从 LLM 诞生时就存在：把模型能读取的信息放到合适位置，用它影响生成结果。
        Prompt Engineering 是最早、最轻的形态；当任务变长、资料变多、Agent 开始调用工具并沉淀记忆，问题就不再只是提示词怎么写。
      </P>
      <Quote cite="OpenViking 对上下文工程的判断">
        上下文工程的本质，是让大模型具备调度眼、手、脚的能力：观察信息、记录经验、采取行动。
      </Quote>
      <Cols count={2}>
        <Col>
          <H4>现状</H4>
          <P>
            Prompt、RAG、Web Search、Tools/MCP、Skills 和 Memory 看似属于不同工程模块，但在 Agent 视角里都变成
            “下一步应该读什么、相信什么、调用什么、记住什么”的上下文问题。
          </P>
        </Col>
        <Col>
          <H4>痛点</H4>
          <P>
            当团队知识散落在代码仓库、协作文档、聊天记录、会议纪要、外部文献和团队标准里，人会被迫充当上下文路由器。
            OpenViking 的切入点就是把这件事数据库化。
          </P>
        </Col>
      </Cols>
      <div className="ovb-stat-grid" aria-label="AGI 目标牵引下的上下文需求">
        {agiGoals.map(goal => (
          <div className="ovb-stat" key={goal.key}>
            <div className="ovb-stat-label">{goal.label}</div>
            <H4>{goal.title}</H4>
            <P>{goal.copy}</P>
          </div>
        ))}
      </div>
      <Callout type="note" title="从终局目标回到近期问题">
        <P>
          长期目标很宏大，但问题已经落在四类近期场景里：跨仓库编码、OpenClaw 长期记忆、多来源知识编排、
          以及人与 Agent 的观点对齐。
        </P>
      </Callout>
    </section>
  );
}

export function ContextPrimitiveMatrix() {
  return (
    <section className="ovb-section" aria-labelledby="primitive-matrix-title">
      <div className="ovb-kicker">context primitives</div>
      <H3 id="primitive-matrix-title">Prompt / RAG / Web Search / Tools / Skills / Memory 对比</H3>
      <P>
        这六类能力并非逐层替代。它们是 Agent 上下文系统里的不同入口，共同把信息、规则、动作和经验交给模型，
        但各自的边界和失败模式不同。
      </P>
      <AnchorStrip items={primitives} prefix="ovb-primitive" label="上下文工程技术对比导航" />
      <div className="ovb-stack">
        {primitives.map(item => (
          <article
            className="ovb-panel ovb-primitive-card"
            id={`ovb-primitive-${item.key}`}
            key={item.key}
            style={{ '--tone': item.tone }}
          >
            <div className="ovb-matrix-title">
              <Tag>{item.fullName}</Tag>
              <H4>{item.summary}</H4>
            </div>
            <P>{item.description}</P>
            <div className="ovb-mini-grid">
              <div className="ovb-mini">
                <div className="ovb-mini-label">优点</div>
                <P>{item.advantage}</P>
              </div>
              <div className="ovb-mini">
                <div className="ovb-mini-label">缺点</div>
                <P>{item.limitation}</P>
              </div>
              <div className="ovb-mini">
                <div className="ovb-mini-label">OpenViking 视角</div>
                <P>{item.openvikingAngle}</P>
              </div>
            </div>
          </article>
        ))}
      </div>
      <Table
        caption="六类上下文能力对照"
        headers={['技术', '主要贡献', '核心风险']}
        rows={primitives.map(item => [
          <Strong>{item.fullName}</Strong>,
          item.advantage,
          item.limitation,
        ])}
      />
    </section>
  );
}

export function PainPointCards() {
  return (
    <section className="ovb-section" aria-labelledby="pain-point-title">
      <div className="ovb-kicker">near-term pain points</div>
      <H3 id="pain-point-title">四个中短期痛点：上下文能力不足怎样发生</H3>
      <P>
        从 AGI 的长期目标回到日常工作，上下文能力不足已经出现在 AI Coding、OpenClaw、团队知识和管理沟通里。
      </P>
      <AnchorStrip items={painPoints} prefix="ovb-pain" label="中短期痛点导航" />
      <div className="ovb-stack">
        {painPoints.map(item => (
          <article
            className="ovb-pain-card"
            id={`ovb-pain-${item.key}`}
            key={item.key}
            style={{ '--tone': item.tone }}
          >
            <div className="ovb-kicker">{item.label}</div>
            <H4>{item.title}</H4>
            <p className="ovb-pain-question">{item.question}</p>
            <div className="ovb-mini-grid">
              <div className="ovb-mini">
                <div className="ovb-mini-label">场景</div>
                <P>{item.context}</P>
              </div>
              <div className="ovb-mini">
                <div className="ovb-mini-label">缺口</div>
                <P>{item.gap}</P>
              </div>
              <div className="ovb-mini">
                <div className="ovb-mini-label">需要的能力</div>
                <P>{item.desired}</P>
              </div>
            </div>
          </article>
        ))}
      </div>
      <Ul marker="check">
        <Li>这些问题的共同点在于上下文来源、结构、召回和记忆无法稳定服务任务。</Li>
        <Li>当人需要反复解释背景时，Agent 的自动化收益会被信息编排成本抵消。</Li>
        <Li>OpenViking 的答案是先把上下文变成数据，再让 Agent 通过稳定接口读取和更新。</Li>
      </Ul>
    </section>
  );
}

export function ContextFormulaDeepDive() {
  return (
    <section className="ovb-section" aria-labelledby="formula-title">
      <div className="ovb-kicker">working formula</div>
      <H3 id="formula-title">上下文工程公式：五个条件组成一个系统</H3>
      <P>
        上下文工程可以收敛为一个工作公式。Agent 要稳定完成长任务，需要同时具备流程约束、信息组织、上下文推荐、生命周期记忆和可跟踪学习。
      </P>
      <Quote cite="上下文工程工作公式">
        上下文工程 = 可靠的推理流程约束 + 完整的信息组织 + 有效的上下文推荐 + 全生命周期记忆 + 可跟踪的自进化学习。
      </Quote>
      <div className="ovb-formula">
        <div className="ovb-formula-line" aria-label="上下文工程公式">
          {formulaTerms.map((term, index) => (
            <React.Fragment key={term.key}>
              <a
                className="ovb-tab"
                href={`#ovb-formula-${term.key}`}
                style={{ '--tone': term.tone }}
              >
                {term.label}
              </a>
              {index < formulaTerms.length - 1 ? <span className="ovb-plus">+</span> : null}
            </React.Fragment>
          ))}
        </div>
        <div className="ovb-stack">
          {formulaTerms.map(term => (
            <article
              className="ovb-formula-panel"
              id={`ovb-formula-${term.key}`}
              key={term.key}
              style={{ '--tone': term.tone }}
            >
              <H4>{term.title}</H4>
              <P>{term.copy}</P>
              <div className="ovb-claim">
                <div>
                  <div className="ovb-mini-label">OpenViking 在公式中的位置</div>
                  <P>{term.openviking}</P>
                </div>
                <div>
                  <div className="ovb-mini-label">需要判断的问题</div>
                  <P>
                    当前团队的 Agent 是靠人临时塞资料，还是已经有一层可查询、可更新、可追踪的上下文基础设施？
                  </P>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
      <Callout type="tip" title="OpenViking 的定位">
        <P>
          OpenViking 主要提供 <Mark>完整的信息组织</Mark> 方案，并作为
          <Mark>有效的上下文推荐</Mark> 与 <Mark>全生命周期记忆</Mark> 的基础设施。
        </P>
      </Callout>
      <div className="ovb-code-note">
        <Pre lang="js" filename="context-formula.txt" lineNumbers={false}>{`context_engineering =
  reliable_reasoning_constraints
  + complete_information_organization
  + effective_context_recommendation
  + full_lifecycle_memory
  + traceable_self_evolving_learning`}</Pre>
      </div>
      <Small>
        这个公式把“为什么需要 OpenViking”从单点功能需求，提升为上下文系统的基础设施需求。
      </Small>
    </section>
  );
}

export function ContextFrontHalfBlocks() {
  return (
    <>
      <ContextBlockStyles />
      <ResourceDeck />
      <ContextStatusBackdrop />
      <ContextPrimitiveMatrix />
      <PainPointCards />
      <ContextFormulaDeepDive />
    </>
  );
}
