import React from 'react';
import {
  A, Callout, Col, Cols, H2, H3, H4, Lead, Li, Mark, P, Pre, Quote,
  Table, Tag, Ul, Ol,
} from '../../blog-components';

const GITHUB_URL = 'https://github.com/volcengine/OpenViking';
const DOCS_URL = 'https://docs.openviking.ai/';
const DISCORD_URL = 'https://discord.gg/FyTkZ3ZKKm';
const OPENCLAW_GUIDE_URL = 'https://github.com/volcengine/OpenViking/blob/main/examples/openclaw-plugin/INSTALL-ZH.md';

const foundation = [
  {
    key: 'resources',
    label: 'Resources',
    title: 'Start from the runnable project, not the slogan',
    body: 'OpenViking is an open-source context database for agents. Start from the repository, docs, public feedback channels, and OpenClaw integration guide.',
    items: [
      ['Code and issues', <A href={GITHUB_URL}>volcengine/OpenViking</A>],
      ['Technical docs', <A href={DOCS_URL}>docs.openviking.ai</A>],
      ['Community feedback', <>Join the <A href={DISCORD_URL}>Discord community</A> for usage questions, bug reports, and product expectations.</>],
      ['OpenClaw integration', <A href={OPENCLAW_GUIDE_URL}>OpenViking memory plugin guide</A>],
    ],
  },
  {
    key: 'background',
    label: 'Background',
    title: 'OpenViking is positioned as a context database for AI agents',
    body: 'OpenViking extends beyond memory plugins. It treats context as data: ingested, indexed, summarized, scoped, retrieved, updated, and preserved across a lifecycle.',
    items: [
      ['Project signal', 'The project reached 4k GitHub stars shortly after release, which created a good moment to explain the category.'],
      ['Technical lens', 'OpenViking is compared with vector databases, file systems, tools, skills, and memory systems.'],
      ['Adoption lens', 'Team AI work depends on code, documents, chats, meeting notes, external references, and local conventions.'],
      ['Agent lens', 'The interface is designed for agents to explore context incrementally rather than consume giant prompts.'],
    ],
  },
  {
    key: 'focus',
    label: 'Focus',
    title: 'Context pain leads to database-shaped design',
    body: 'Prompt, RAG, web search, tools, skills, and memory are context primitives. A database-like layer makes them easier to organize, retrieve, update, and scope.',
    items: [
      ['Context primitives', 'Prompt, RAG, web search, tools, skills, and memory each expose a different part of the problem.'],
      ['System gap', 'Information organization, recall, trust, and updates become the main bottleneck.'],
      ['OpenViking answer', 'Treat context as managed data with command-line operations that agents can learn.'],
      ['Team value', 'Reduce the work humans spend routing background information into agents.'],
    ],
  },
];

const primitives = [
  ['Prompt', 'Activates behavior through instructions, role definitions, rules, examples, and output targets.', 'Fast and flexible, but brittle when prompts become long-lived team knowledge.'],
  ['RAG', 'Retrieves private or domain knowledge before generation.', 'Useful for question answering, but still depends on how knowledge is ingested, chunked, summarized, and refreshed.'],
  ['Web Search', 'Gives the model access to public, recent information.', 'Expands reach, but introduces source quality, injection, SEO, and trust problems.'],
  ['Tools / MCP', 'Lets the model call functions, APIs, and systems.', 'Enables action, but action still depends on knowing what to read and why to call a tool.'],
  ['Skills', 'Turns workflows, SOPs, and tool usage patterns into files an agent can read.', 'Good for process constraints, but needs a broader context layer for retrieval and evidence.'],
  ['Memory', 'Stores experience, preferences, facts, and task outcomes for future turns.', 'Powerful only when memories are organized, compressed, scoped, retrieved, and updated correctly.'],
];

const pains = [
  {
    title: 'Cross-repository coding breaks local context',
    body: 'Real engineering tasks often cross repositories, design docs, API contracts, historical decisions, and tests. A single working directory gives the agent only a local view.',
    need: 'The context layer must preserve structure and let the agent move from summary to evidence.',
  },
  {
    title: 'Long-running agents forget recent constraints',
    body: 'Autonomous agents need preferences, corrections, failures, and task-specific requirements to survive across sessions.',
    need: 'Memory should be searchable, updatable, scoped, and explainable rather than a raw chat transcript.',
  },
  {
    title: 'Team knowledge is scattered across too many surfaces',
    body: 'Important context may live in Git, docs, chat history, meeting notes, PDFs, images, and external references.',
    need: 'A database-shaped layer should ingest multiple sources and expose search, summaries, hierarchy, and selective reading.',
  },
  {
    title: 'Agents miss human judgment and organizational taste',
    body: 'Many failures come from missing standards, leader preferences, historical tradeoffs, or local delivery expectations.',
    need: 'The system should recommend the relevant constraints before the agent starts producing output.',
  },
];

const formula = [
  ['Constraints', 'Reliable reasoning constraints', 'Long tasks need processes, checkpoints, failure boundaries, and reusable rules.'],
  ['Organization', 'Complete information organization', 'Context must be addable, searchable, updateable, scoped, and structured.'],
  ['Recommendation', 'Effective context recommendation', 'Agents need the right context at the right phase, then a path to expand evidence.'],
  ['Memory', 'Full-lifecycle memory', 'Experience and preferences must be compressed into resources that future tasks can find.'],
  ['Learning', 'Traceable self-improvement', 'The system should explain why a context was recalled and accept feedback into the next cycle.'],
];

const paradigms = [
  ['Vector index', 'Best for semantic matching and modality-agnostic retrieval.', 'Weak at exact filtering, hierarchy, and relationship explanation.'],
  ['File system', 'Best for hierarchy, traversal, and interfaces agents already understand.', 'Weak at semantic discovery without an index beneath it.'],
  ['Table', 'Best for scalar fields, metadata, filtering, and governance dimensions.', 'Hard to use as the primary shape for messy multimodal context.'],
  ['Graph', 'Best for explaining entity relationships and paths of relevance.', 'Expensive to build and maintain from unstructured sources.'],
];

const designPrinciples = [
  ['Semantic by default', 'Users should not have to choose schemas or modalities before adding data. OpenViking should parse and index resources automatically.'],
  ['Simple enough to learn', 'Agents and humans should see a small, filesystem-like surface rather than a complex modeling language.'],
  ['Agent-friendly commands', 'Commands such as ov ls, ov find, ov tree, ov abstract, ov overview, and ov read make context exploration explicit.'],
  ['Token discipline', 'Summaries and staged reading help agents avoid pulling entire documents into the model window.'],
  ['Relations without graph burden', 'Relations and links are useful, but the product avoids making graph modeling the entry cost.'],
];

const cliFlows = [
  {
    label: 'Ingest',
    title: 'Add resources from code, papers, images, documents, folders, and archives',
    code: `ov add-resource https://github.com/volcengine/OpenViking
ov add-resource https://arxiv.org/pdf/2602.09540
ov add-resource ./team_building.jpg
ov add-resource ./project.docx
ov add-resource ./team-docs.zip`,
  },
  {
    label: 'Discover',
    title: 'Find the entry point before reading full evidence',
    code: `ov ls
ov find "How does OpenViking use VikingDB?" --uri=viking://resources/code/volcengine/OpenViking
ov tree viking://resources/code/volcengine/OpenViking/examples/ -L 2
ov abstract viking://resources/code/volcengine/OpenViking
ov read viking://resources/code/volcengine/OpenViking/examples/cloud/GUIDE.md`,
  },
  {
    label: 'Maintain',
    title: 'Move, rename, and delete context resources',
    code: `ov mv viking://resources/photo/20260102/example.jpg viking://resources/photo/20260103/
ov rm viking://resources/photo/20260102/example.jpg
ov rm -r viking://resources/photo/20260102/`,
  },
  {
    label: 'Reuse',
    title: 'Turn skills and memory into managed context assets',
    code: `ov add-skill ./my-skill/examples/openviking-cli-skills
ov find "OpenViking usage tips" --uri=viking://agent/skills
ov add-memory ./2026-03-04/memory-2026-03-04.md
ov status`,
  },
];

const comparisonRows = [
  ['Data operations', 'Add, delete, query, update', 'Add, delete, query, update', 'Add, delete, update; query depends on other applications'],
  ['Input format', 'Files, text, links, conversation history', 'Vectors, scalar metadata, and vectorizable content', 'Files'],
  ['Semantic retrieval', 'Yes, backed by vector search', 'Yes, core capability', 'No'],
  ['Keyword retrieval', 'Yes, through sparse vectors or grep', 'Yes, through sparse vectors and keyword indexes', 'Yes, through grep'],
  ['Hierarchy', 'Preserved and exposed to agents', 'Usually not preserved', 'Native capability'],
  ['Automatic parsing and summaries', 'Automatic parsing, L0 summaries, and overview paths', 'Usually outside the vector database', 'Not built in'],
  ['Agentic reading', 'ls, tree, find, abstract, overview, read', 'Not directly exposed', 'Traversal works, but semantic processing is missing'],
  ['Data isolation', 'Account, user, and agent dimensions', 'Scalar metadata', 'Partly through user/group controls'],
  ['Built-in capabilities', 'Native memory plugin, bot, and native RAG direction', 'Not included', 'Not included'],
  ['Deployment shape', 'Local/self-hosted today; managed and distributed options are roadmap items', 'Managed cloud service', 'Local or object storage'],
  ['Original files', 'Not retained by default; still being refined', 'Not retained', 'Retained'],
];

const documentStages = [
  {
    n: '01',
    title: 'Input document',
    copy: 'A docx, pdf, markdown file, web page, folder, or archive is added.',
    output: 'The resource enters OpenViking as a managed context object.',
    action: 'Use ov add-resource instead of pasting the whole document into a prompt.',
  },
  {
    n: '02',
    title: 'Chapter paths',
    copy: 'Structure is preserved as navigable sections and paths.',
    output: 'Sections become paths such as viking://resources/docs/project/03-design/.',
    action: 'Use ov tree or ov ls first to understand shape before reading.',
  },
  {
    n: '03',
    title: 'Content modules',
    copy: 'Content is split into semantically coherent units.',
    output: 'Each unit carries a point, process, interface, case, or decision.',
    action: 'Use ov find to locate entry points and ov overview to decide whether to expand.',
  },
  {
    n: '04',
    title: 'Modal elements',
    copy: 'Tables, images, code blocks, links, and attachments become context elements.',
    output: 'Non-text material becomes searchable and referable context.',
    action: 'Start from summaries, then follow URIs into specific elements.',
  },
  {
    n: '05',
    title: 'Summary ladder',
    copy: 'L0 summaries, abstracts, overview, and full content form a reading ladder.',
    output: 'The agent can move from coarse signals to precise evidence.',
    action: 'Read summaries first; call ov read only when the evidence is insufficient.',
  },
];

const adoptionSteps = [
  {
    title: 'Deploy the service',
    body: 'Use server mode on a local or self-hosted machine before adding team data.',
    code: `uv venv openviking-env
source openviking-env/bin/activate
uv pip install openviking --upgrade
# Configure OpenViking according to the repository README.
nohup openviking-server > openviking.log 2>&1 &`,
    check: 'Run ov status first.',
  },
  {
    title: 'Ingest stable resources',
    body: 'Start with repositories and durable documents, then add meetings, chats, project records, and references.',
    code: `ov add-resource https://github.com/volcengine/OpenViking
ov add-resource https://arxiv.org/pdf/2602.09540
ov add-resource ./team_building.jpg
ov add-resource ./project.docx
ov add-resource ./team-docs.zip`,
    check: 'Configure access and credentials before adding private repositories.',
  },
  {
    title: 'Teach agents the reading path',
    body: 'Agents should move from root structure to search, tree, abstract, overview, and full content only when needed.',
    code: `ov ls
ov find "How does OpenViking use VikingDB?" --uri=viking://resources/code/volcengine/OpenViking
ov tree viking://resources/code/volcengine/OpenViking/examples/ -L 2
ov abstract viking://resources/code/volcengine/OpenViking
ov read viking://resources/code/volcengine/OpenViking/examples/cloud/GUIDE.md`,
    check: 'ls, tree, and find return L0 summaries.',
  },
  {
    title: 'Operationalize skills and memory',
    body: 'Manage workflows, preferences, and durable lessons as context resources.',
    code: `ov status
ov observer vlm
ov add-skill ./my-skill/examples/openviking-cli-skills
ov find "OpenViking usage tips" --uri=viking://agent/skills
ov add-memory ./2026-03-04/memory-2026-03-04.md`,
    check: 'Make status, logs, skills, and memory observable.',
  },
];

function EnglishLocalNavStyle() {
  return (
    <style>{`
      .ovx-local-tabs { margin: 30px 0 18px; padding: 8px 0; border-top: 1px solid var(--th-line); border-bottom: 1px solid var(--th-line); background: color-mix(in oklab, var(--th-bg) 94%, transparent); }
      .ovx-local-tabs__label { margin-bottom: 6px; color: var(--th-mute); font-family: var(--th-font-mono); font-size: 11px; letter-spacing: 0.12em; line-height: 1.4; text-transform: uppercase; }
      .ovx-ranking-widget { border: 1px solid var(--th-line); border-radius: 6px; max-height: min(460px, 68vh); overflow-y: auto; overscroll-behavior: contain; margin: 22px 0; background: var(--th-bg); }
      .ovx-ranking-widget .b-table-wrap { margin: 0; border: 0; border-radius: 0; }
      @media (max-width: 760px) {
        .ovx-local-tabs { margin: 24px 0 14px; padding: 6px 0; }
        .ovx-local-tabs__label { margin-bottom: 4px; }
      }
    `}</style>
  );
}

function LocalNav({ label, items, prefix }) {
  return (
    <nav className="ovx-local-tabs" aria-label={label}>
      <div className="ovx-local-tabs__label">{label}</div>
      <div className="ovx-tab-strip">
        {items.map(item => (
          <a className="ovx-tab" href={`#${prefix}-${item.key || item[0].toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} key={item.key || item[0]}>
            {item.label || item[0]}
          </a>
        ))}
      </div>
    </nav>
  );
}

function ResourceSection() {
  return (
    <section>
      <H3 id="en-resources">Resources, Background, and What OpenViking Is For</H3>
      <Lead>
        OpenViking turns context into data agents can manage.
      </Lead>
      <LocalNav label="section shortcuts" items={foundation} prefix="en-foundation" />
      <div className="ovx-section-stack">
        {foundation.map(section => (
          <article className="ovx-tab-panel" id={`en-foundation-${section.key}`} key={section.key}>
            <div className="ovx-kicker">{section.label}</div>
            <H4>{section.title}</H4>
            <P>{section.body}</P>
            <div className="ovx-compare-card__rows">
              {section.items.map(([key, value]) => (
                <div className="ovx-compare-card__row" key={key}>
                  <div className="ovx-compare-card__key">{key}</div>
                  <div>{value}</div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ContextPrimitiveSection() {
  const navItems = primitives.map(([label]) => [label]);
  return (
    <section>
      <H3 id="en-context-primitives">Prompt, RAG, Web Search, Tools, Skills, and Memory</H3>
      <P>
        These layers are complementary ways to put information, rules, actions, and experience into the model loop.
      </P>
      <LocalNav label="context primitives" items={navItems} prefix="en-primitive" />
      <div className="ovx-section-stack">
        {primitives.map(([label, contribution, risk]) => (
          <article className="ovx-tab-panel" id={`en-primitive-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} key={label}>
            <Tag>{label}</Tag>
            <H4>{contribution}</H4>
            <P>{risk}</P>
          </article>
        ))}
      </div>
      <Table
        caption="The same problem appears through six different context primitives."
        headers={['Primitive', 'What it contributes', 'Where it needs support']}
        rows={primitives}
      />
    </section>
  );
}

function PainAndFormulaSection() {
  return (
    <>
      <section>
        <H3 id="en-pain-points">Four Near-Term Pain Points</H3>
        <div className="ovx-pain-grid ovx-pain-grid--two">
          {pains.map((pain, index) => (
            <article className="ovx-pain-card" key={pain.title}>
              <div className="ovx-pain-card__index">pain {index + 1}</div>
              <h4 className="ovx-pain-card__title">{pain.title}</h4>
              <p className="ovx-pain-card__body">{pain.body}</p>
              <p className="ovx-pain-card__impact">{pain.need}</p>
            </article>
          ))}
        </div>
        <Ul marker="check">
          <Li>Context routing, structure, trust, and memory are the common failure points.</Li>
          <Li>If humans repeatedly paste background into the model, automation gains disappear into information orchestration.</Li>
          <Li>OpenViking starts by making context a managed data layer, then lets agents read and update it through stable commands.</Li>
        </Ul>
      </section>

      <section>
        <H3 id="en-context-formula">The Context Engineering Formula</H3>
        <Quote cite="Context engineering formula">
          Context engineering = reliable reasoning constraints + complete information organization + effective context recommendation + full-lifecycle memory + traceable self-evolving learning.
        </Quote>
        <div className="ovx-formula">
          <div className="ovx-formula__rail">
            {formula.map(([label], index) => (
              <React.Fragment key={label}>
                <a className="ovx-formula__chip" href={`#en-formula-${label.toLowerCase()}`}>{label}</a>
                {index < formula.length - 1 ? <span className="ovx-formula__plus">+</span> : null}
              </React.Fragment>
            ))}
          </div>
          <div className="ovx-section-stack">
            {formula.map(([label, title, body]) => (
              <article className="ovx-formula__panel" id={`en-formula-${label.toLowerCase()}`} key={label}>
                <H4>{title}</H4>
                <P>{body}</P>
              </article>
            ))}
          </div>
        </div>
        <Callout type="tip" title="Positioning">
          <P>
            OpenViking mainly provides <Mark>complete information organization</Mark>,
            and serves as the infrastructure for <Mark>effective context recommendation</Mark> and <Mark>full-lifecycle memory</Mark>.
          </P>
        </Callout>
      </section>
    </>
  );
}

export function EnglishContextBlocks() {
  return (
    <>
      <ResourceSection />
      <ContextPrimitiveSection />
      <PainAndFormulaSection />
    </>
  );
}

export function EnglishArchitectureBlocks() {
  return (
    <>
      <section>
        <H3 id="en-information-organization">Information Organization: Context Is Not Object Storage</H3>
        <P>
          The design starts from a simple question: is information organization the essence of information retrieval?
          For structured business entities, scalar fields and schemas are often enough. Context is messier. It may be code, docs, images, meetings, conversations, or links.
        </P>
        <Table
          headers={['Organization form', 'Strength', 'Limit']}
          rows={paradigms}
        />
      </section>

      <section>
        <H3 id="en-ranking-lab">Paradigm Ranking: Tradeoffs by Dimension</H3>
        <P>
          Vector indexes, graph, file-system organization, and table-style metadata each solve a different part of information organization.
          OpenViking combines their strengths for agent work.
        </P>
        <div className="ovx-ranking-widget">
          <Table
            headers={['Dimension', 'Best fit', 'OpenViking implication']}
            rows={[
              ['Semantic matching', 'Vector index', 'Use vectors as the primary entry point for unstructured context.'],
              ['Scale adaptation', 'Vector index / table metadata', 'Lean on mature indexes for large resource sets.'],
              ['Agent adaptation', 'Vector index / file system', 'Find semantically, then expose paths agents can navigate.'],
              ['Automated modeling', 'Vector index', 'Avoid forcing users to model every resource before ingestion.'],
              ['Modality coverage', 'Vector index / file system', 'Accept many inputs, then turn them into readable context units.'],
              ['Index and query efficiency', 'Vector index / table metadata', 'Combine semantic retrieval with deterministic filters.'],
              ['Filtering and governance', 'Table metadata', 'Use limited schemas for owner, type, permission, time, and source.'],
              ['Relationship discovery', 'Graph', 'Add relations where useful while keeping modeling cost low.'],
            ]}
          />
        </div>
      </section>

      <section>
        <H3 id="en-vikingdb-evolution">From VikingDB to a Context Database</H3>
        <P>
          OpenViking is not designed from a blank page. It grows out of VikingDB's experience with semantic retrieval, table-like metadata, graph exploration, and file-system-like organization.
        </P>
        <Table
          headers={['Period', 'Organization form', 'Capability']}
          rows={[
            ['2019-2025', 'Vector search', 'Large-scale semantic retrieval becomes the foundation.'],
            ['2021-2024', 'Table and sparse retrieval', 'Filtering, keyword signals, and metadata become more important.'],
            ['2023-2024', 'Graph exploration', 'Relations help explain how context items connect.'],
            ['2024-2025', 'File-system semantics', 'Navigable structures become useful for agents.'],
          ]}
        />
      </section>

      <section>
        <H3 id="en-design-principles">Design Constraints: Move Complexity Away From the User</H3>
        <div className="ovx-section-stack">
          {designPrinciples.map(([title, body]) => (
            <article className="ovx-tab-panel" key={title}>
              <H4>{title}</H4>
              <P>{body}</P>
            </article>
          ))}
        </div>
      </section>

      <section>
        <H3 id="en-cli-path">CLI Path for Data, Query, Skills, Memory, and Bot</H3>
        <P>
          The CLI is the agent-facing surface for exploring the context database.
        </P>
        <LocalNav label="CLI paths" items={cliFlows.map(item => [item.label])} prefix="en-cli" />
        <div className="ovx-section-stack">
          {cliFlows.map(flow => (
            <article className="ovx-tab-panel" id={`en-cli-${flow.label.toLowerCase()}`} key={flow.label}>
              <H4>{flow.title}</H4>
              <Pre lang="bash" filename={`${flow.label.toLowerCase()}.sh`}>{flow.code}</Pre>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

export function EnglishPracticeBlocks() {
  return (
    <>
      <Lead>
        Practice focuses on product boundaries, long documents, team adoption, OpenClaw memory, VikingBot, core judgments, and the roadmap.
      </Lead>

      <section>
        <H3 id="en-database-boundary">How OpenViking Differs From Vector Databases and File Systems</H3>
        <P>
          A vector database ranks semantic matches. A file system provides traversal. OpenViking exposes a data interface for agent context.
        </P>
        <Table
          caption="Product boundaries across OpenViking, vector databases, and file systems."
          headers={['Capability', 'OpenViking context database', 'Vector database', 'File system']}
          rows={comparisonRows}
        />
        <Callout type="info" title="More implementation detail">
          <P>
            Product boundaries are summarized here. Installation, deployment, and implementation details live in the
            {' '}<A href={DOCS_URL}>OpenViking technical docs</A>.
          </P>
        </Callout>
        <Quote cite="Product boundary">
          Vector search answers what is semantically close. File systems answer where something lives. A context database answers how an agent should use the material.
        </Quote>
      </section>

      <section>
        <H3 id="en-document-decomposition">How Long Documents Become Context</H3>
        <P>
          OpenViking does not force a long document to stay as one file. It decomposes, reorganizes, and summarizes it for staged reading.
        </P>
        <Table
          headers={['Stage', 'Output shape', 'Agent action']}
          rows={documentStages.map(stage => [stage.title, stage.output, stage.action])}
        />
        <Callout type="tip" title="Reading-window strategy">
          <P>
            The goal is simple: vectorizable units, coherent meaning, and lower model-window cost.
          </P>
        </Callout>
      </section>

      <section>
        <H3 id="en-team-adoption">Using OpenViking to Improve Team AI Capability</H3>
        <P>
          Context processing efficiency sets the ceiling for team AI work.
        </P>
        <div className="ovx-section-stack">
          {adoptionSteps.map(step => (
            <article className="ovx-tab-panel" key={step.title}>
              <H4>{step.title}</H4>
              <P>{step.body}</P>
              <Pre lang="bash" filename={`${step.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.sh`}>{step.code}</Pre>
              <Callout type="note" title="Checkpoint">
                <P>{step.check}</P>
              </Callout>
            </article>
          ))}
        </div>
        <Cols count={2}>
          <Col>
            <H4>Demo A: multi-repository technical question</H4>
            <P>
              It gives agents cross-repo, cross-doc context for real engineering questions.
            </P>
          </Col>
          <Col>
            <H4>Suggested rollout order</H4>
            <Ol>
              <Li>Connect core repositories and stable documents first.</Li>
              <Li>Add meeting notes, chats, project records, and external references after that.</Li>
              <Li>Turn repeated workflows into skills and repeated preferences into memory.</Li>
            </Ol>
          </Col>
        </Cols>
      </section>

      <section>
        <H3 id="en-openclaw-memory">OpenViking and OpenClaw Memory Practice</H3>
        <P>
          OpenClaw shows the memory problem clearly. Longer tasks need preferences and corrections as retrievable context instead of raw chat messages.
        </P>
        <Table
          headers={['Pain point', 'OpenViking practice']}
          rows={[
            ['Repeatedly explaining preferences', 'Store team conventions and user requirements as searchable memory.'],
            ['High retry cost', 'Use session summaries and add-memory to carry valid experience into the next task.'],
            ['Longer autonomous tasks', 'Let OpenClaw retrieve long-term context through OpenViking instead of the current conversation only.'],
            ['Scattered team knowledge', 'Unify code, documents, meetings, chats, and references in the context database.'],
          ]}
        />
        <Callout type="note" title="Demo B">
          <P>Turn useful preferences, constraints, facts, and outcomes into searchable memory.</P>
        </Callout>
        <Pre lang="bash" filename="openclaw-memory.sh">{`curl -fSL https://openclaw.ai/install.sh | bash
# Follow the OpenViking memory plugin guide:
# ${OPENCLAW_GUIDE_URL}
ov add-memory ./2026-03-04/memory-2026-03-04.md`}</Pre>
        <div className="ovx-compare-grid ovx-compare-grid--three">
          {[
            ['Memory input', 'File interface and session summaries', 'Memory can be added explicitly or distilled from session summaries.'],
            ['Memory retrieval', 'Search memory like context', 'OpenClaw retrieves relevant long-term memory instead of carrying every past turn.'],
            ['Practice boundary', 'Not infinite chat retention', 'Useful memory is summarized, compressed, reorganized, scoped, and explainable.'],
          ].map(([label, title, body]) => (
            <article className="ovx-compare-card" key={label}>
              <div className="ovx-compare-card__label">{label}</div>
              <h4 className="ovx-compare-card__title">{title}</h4>
              <p className="ovx-compare-card__body">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <H3 id="en-vikingbot">Demo C: VikingBot</H3>
        <P>
          VikingBot is a native agent interface for testing ingestion, retrieval, summaries, and reading paths.
        </P>
        <Pre lang="bash" filename="vikingbot.sh">{`openviking-server --with-bot
ov chat -m "Ask your question"
ov status
ov observer vlm`}</Pre>
        <H4>Native agent exploration</H4>
        <P>
          With <code>--with-bot</code>, <code>ov chat</code> can use connected resources, skills, summaries, retrieval, and memory context.
        </P>
      </section>

      <section>
        <H3 id="en-core-judgments">Core Judgments and Roadmap</H3>
        <Ul marker="check">
          <Li>The larger the context corpus, the more important retrieval quality and organization become.</Li>
          <Li>Every high-efficiency team should have its own context database for full-domain information integration.</Li>
          <Li>Vectors, file systems, graphs, and tables are forms. Agents need an operable data interface.</Li>
          <Li>OpenViking is a context database for complex agent tasks, with memory as one built-in use case.</Li>
          <Li>The future capability of agents is largely a context capability: knowledge, memory, tools, and organization.</Li>
        </Ul>
        <Callout type="note" title="Deployment evolution">
          <P>
            OpenViking starts with local and self-hosted validation, then moves toward managed, distributed, and stable-upgrade options.
          </P>
        </Callout>
        <H4>Roadmap</H4>
        <Ol>
          <Li>Build ecosystem standards and promote reusable protocols.</Li>
          <Li>Strengthen single-machine operations, stable releases, and smooth upgrades.</Li>
          <Li>Improve multimodal context, memory retrieval, skill retrieval, and content-understanding interfaces.</Li>
          <Li>Build distributed capabilities and public-cloud integrations for more reliable consistency.</Li>
        </Ol>
      </section>

      <P>
        Related resources: <A href={GITHUB_URL}>OpenViking GitHub</A>, <A href={DOCS_URL}>technical documentation</A>.
      </P>
    </>
  );
}

export default function OpenVikingEnglishBlocks() {
  return (
    <>
      <EnglishLocalNavStyle />
      <H2>Why Context Engineering Becomes a Database Problem</H2>
      <EnglishContextBlocks />

      <H2>OpenViking&apos;s Design Philosophy and Technical Model</H2>
      <EnglishArchitectureBlocks />

      <H2>Product Boundaries and Team Adoption</H2>
      <EnglishPracticeBlocks />
    </>
  );
}
