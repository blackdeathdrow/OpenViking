import React from 'react';
import {
  A, Callout, Col, Cols, H2, H3, H4, Lead, Li, Mark, P, Pre, Quote,
  Table, Tag, Ul, Ol,
} from '../../blog-components';

const GITHUB_URL = 'https://github.com/volcengine/OpenViking';
const DOCS_URL = 'https://docs.openviking.ai/';
const OPENCLAW_GUIDE_URL = 'https://github.com/volcengine/OpenViking/blob/main/examples/openclaw-plugin/INSTALL-ZH.md';

const foundation = [
  {
    key: 'resources',
    label: 'Resources',
    title: 'Start from the runnable project, not the slogan',
    body: 'The public article frames OpenViking as both an open-source project and a new interface for agent context management. The useful entry points are the repository, the technical docs, the community feedback channel, and the OpenClaw integration guide.',
    items: [
      ['Code and issues', <A href={GITHUB_URL}>volcengine/OpenViking</A>],
      ['Technical docs', <A href={DOCS_URL}>docs.openviking.ai</A>],
      ['Community feedback', 'Used to collect usage questions, bug reports, and product expectations.'],
      ['OpenClaw integration', <A href={OPENCLAW_GUIDE_URL}>OpenViking memory plugin guide</A>],
    ],
  },
  {
    key: 'background',
    label: 'Background',
    title: 'OpenViking is positioned as a context database for AI agents',
    body: 'The argument is not that agents need one more memory plugin. The argument is that context has become data: it needs ingestion, indexing, hierarchy, summaries, isolation, retrieval, updates, and a lifecycle.',
    items: [
      ['Project signal', 'The project reached 4k GitHub stars shortly after release, which created a good moment to explain the category.'],
      ['Technical lens', 'The talk compares OpenViking with vector databases, file systems, tools, skills, and memory systems.'],
      ['Adoption lens', 'Team AI work depends on code, documents, chats, meeting notes, external references, and local conventions.'],
      ['Agent lens', 'The interface is designed for agents to explore context incrementally rather than consume giant prompts.'],
    ],
  },
  {
    key: 'focus',
    label: 'Focus',
    title: 'The page follows the path from context pain to database-shaped design',
    body: 'The first half explains why Prompt, RAG, web search, tools, skills, and memory are all context primitives. The second half explains why a database-like layer is needed to make those primitives reliable.',
    items: [
      ['Context primitives', 'Prompt, RAG, web search, tools, skills, and memory each expose a different part of the problem.'],
      ['System gap', 'The weak point is not only model capability. It is how information is organized, recalled, trusted, and updated.'],
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
    need: 'The context layer must preserve structure and let the agent move from summary to source evidence.',
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
    title: 'Find the entry point before reading the source',
    code: `ov ls
ov find "How does OpenViking use VikingDB?" --uri=viking://resources/code/volcengine/OpenViking
ov tree viking://resources/code/volcengine/OpenViking/examples/ -L 2
ov abstract viking://resources/code/volcengine/OpenViking
ov read viking://resources/code/volcengine/OpenViking/examples/cloud/GUIDE.md`,
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

const adoptionSteps = [
  ['Deploy the service', 'Start with server mode on a local workstation, cloud VM, or ECS instance. Validate status and logs before adding team data.'],
  ['Ingest stable sources', 'Start with code repositories and durable documents. Add meeting notes, chats, and external materials later.'],
  ['Teach agents the reading path', 'Prefer ls and find first, then tree, abstract, overview, and only then read.'],
  ['Operationalize skills and memory', 'Treat workflows and memories as context resources instead of scattered agent settings.'],
];

function StickyNav({ label, items, prefix }) {
  return (
    <nav className="ovx-sticky-tabs" aria-label={label}>
      <div className="ovx-sticky-tabs__label">{label}</div>
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
      <H3 id="en-resources">Resources, Background, and What This Talk Is Really About</H3>
      <Lead>
        The useful framing is practical: OpenViking is not just an idea about memory. It is an attempt to make context manageable as data.
      </Lead>
      <StickyNav label="section shortcuts" items={foundation} prefix="en-foundation" />
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
        These are not mutually exclusive layers. They are different ways to put information, rules, actions, and experience into the model loop.
      </P>
      <StickyNav label="context primitives" items={navItems} prefix="en-primitive" />
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
        headers={['Primitive', 'What it contributes', 'Why it is not enough alone']}
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
          <Li>The common failure is not only model quality; it is context routing, structure, trust, and memory.</Li>
          <Li>If humans repeatedly paste background into the model, automation gains disappear into information orchestration.</Li>
          <Li>OpenViking starts by making context a managed data layer, then lets agents read and update it through stable commands.</Li>
        </Ul>
      </section>

      <section>
        <H3 id="en-context-formula">The Context Engineering Formula</H3>
        <Quote cite="OpenViking talk">
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
        <div className="ovx-compare-grid ovx-compare-grid--three">
          {paradigms.map(([name, strength, limit]) => (
            <article className="ovx-compare-card" key={name}>
              <div className="ovx-compare-card__label">{name}</div>
              <h4 className="ovx-compare-card__title">{strength}</h4>
              <p className="ovx-compare-card__body">{limit}</p>
            </article>
          ))}
        </div>
        <Callout type="note" title="OpenViking's combination">
          <P>
            Vector search helps agents find semantically relevant material. File-system structure helps them navigate. Metadata and relations add governance and discovery without turning the whole product into a graph modeling exercise.
          </P>
        </Callout>
      </section>

      <section>
        <H3 id="en-ranking-lab">Paradigm Ranking: There Is No Silver Bullet</H3>
        <P>
          The talk compares vector indexes, graph, file-system organization, and table-style metadata across several dimensions. The point is not to pick one winner. The point is to combine their strengths for agent work.
        </P>
        <Table
          headers={['Dimension', 'Best fit', 'OpenViking implication']}
          rows={[
            ['Semantic matching', 'Vector index', 'Use vectors as the primary entry point for unstructured context.'],
            ['Hierarchy and traversal', 'File system', 'Expose a path-based interface agents already understand.'],
            ['Filtering and governance', 'Table metadata', 'Use limited schemas for owner, type, permission, time, and source.'],
            ['Relationship discovery', 'Graph', 'Add relations where they are useful, but keep modeling cost low.'],
          ]}
        />
      </section>

      <section>
        <H3 id="en-vikingdb-evolution">From VikingDB to a Context Database</H3>
        <P>
          OpenViking is not designed from a blank page. It grows out of VikingDB's experience with semantic retrieval, table-like metadata, graph exploration, and file-system-like organization.
        </P>
        <div className="ovx-roadmap ovx-roadmap--rail">
          {[
            ['2023', 'Vector search', 'Large-scale semantic retrieval becomes the foundation.'],
            ['2024', 'Table and sparse retrieval', 'Filtering, keyword signals, and metadata become more important.'],
            ['2025', 'Graph and file-system semantics', 'Relations and navigable structures become useful for agents.'],
            ['Now', 'Context database', 'Expose these capabilities as an agent-friendly data interface.'],
          ].map(([date, title, copy]) => (
            <div className="ovx-roadmap__phase" key={title}>
              <div className="ovx-roadmap__date">{date}</div>
              <div className="ovx-roadmap__title">{title}</div>
              <p className="ovx-roadmap__copy">{copy}</p>
            </div>
          ))}
        </div>
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
          The command line is not a side feature. It is the surface through which agents can learn to explore the context database.
        </P>
        <StickyNav label="CLI paths" items={cliFlows.map(item => [item.label])} prefix="en-cli" />
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
        The practical half of the talk clarifies product boundaries, document decomposition, team adoption, OpenClaw memory, and VikingBot.
      </Lead>

      <section>
        <H3 id="en-database-boundary">How OpenViking Differs From Vector Databases and File Systems</H3>
        <P>
          A vector database answers semantic ranking questions. A file system gives humans and agents a familiar traversal model. OpenViking uses both ideas, but exposes a higher-level interface for agent context.
        </P>
        <Table
          caption="A public-facing product boundary summary."
          headers={['Capability', 'OpenViking context database', 'Vector database', 'File system']}
          rows={comparisonRows}
        />
        <Callout type="info" title="More implementation detail">
          <P>
            The public article keeps the product boundary in view and leaves environment-specific deployment detail to the
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
          A long document should not always remain one giant file. OpenViking can decompose and reorganize documents so agents can read from coarse summaries to precise evidence.
        </P>
        <div className="ovx-loop">
          {[
            ['01', 'Source', 'A docx, pdf, markdown file, web page, folder, or archive is added.'],
            ['02', 'Chapters', 'Structure is preserved as navigable sections and paths.'],
            ['03', 'Modules', 'Content is split into semantically coherent units.'],
            ['04', 'Elements', 'Tables, images, code blocks, links, and attachments become context elements.'],
            ['05', 'Summaries', 'L0 summaries, abstracts, overview, and source text form a reading ladder.'],
          ].map(([n, title, copy]) => (
            <div className="ovx-loop__step" key={title}>
              <div className="ovx-loop__n">{n}</div>
              <div className="ovx-loop__title">{title}</div>
              <p className="ovx-loop__copy">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <H3 id="en-team-adoption">Using OpenViking to Improve Team AI Capability</H3>
        <P>
          The talk's team-level claim is direct: information flow efficiency, which is context processing efficiency, becomes an individual and organizational advantage.
        </P>
        <div className="ovx-section-stack">
          {adoptionSteps.map(([title, body]) => (
            <article className="ovx-tab-panel" key={title}>
              <H4>{title}</H4>
              <P>{body}</P>
            </article>
          ))}
        </div>
        <Cols count={2}>
          <Col>
            <H4>Demo A: multi-repository technical question</H4>
            <P>
              The motivating case is answering a real engineering question across historical repositories and design documents, not a toy single-repo code search task.
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
          OpenClaw is a good example of the memory problem. When an agent works across longer periods, user preferences and corrections must become retrievable resources, not just messages in the current chat.
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
          <P>Give OpenClaw better memory by turning useful preferences, constraints, facts, and outcomes into searchable context resources.</P>
        </Callout>
        <Pre lang="bash" filename="openclaw-memory.sh">{`curl -fSL https://openclaw.ai/install.sh | bash
# Follow the OpenViking memory plugin guide:
# ${OPENCLAW_GUIDE_URL}
ov add-memory ./2026-03-04/memory-2026-03-04.md`}</Pre>
      </section>

      <section>
        <H3 id="en-vikingbot">Demo C: VikingBot and Feedback Loop</H3>
        <P>
          VikingBot demonstrates the same context layer through a native agent interface. It lets a team test ingestion quality, retrieval quality, summaries, and reading paths through conversation.
        </P>
        <Pre lang="bash" filename="vikingbot.sh">{`openviking-server --with-bot
ov chat -m "Ask your question"
ov status
ov observer vlm`}</Pre>
      </section>

      <section>
        <H3 id="en-takeaways">Takeaways and Roadmap</H3>
        <Ul marker="check">
          <Li>The larger the context corpus, the more important retrieval quality and organization become.</Li>
          <Li>Every high-efficiency team should have its own context database for full-domain information integration.</Li>
          <Li>Vectors, file systems, graphs, and tables are forms. Agents need an operable data interface.</Li>
          <Li>OpenViking is not only a memory component. It is a context database for complex agent tasks.</Li>
          <Li>The future capability of agents is largely a context capability: knowledge, memory, tools, and organization.</Li>
        </Ul>
        <Callout type="note" title="Roadmap">
          <P>
            The roadmap points toward community standards, stronger single-machine operations, multimodal context, memory and skill retrieval, and eventually distributed deployment.
          </P>
        </Callout>
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
      <H2>I. Why Context Engineering Becomes a Database Problem</H2>
      <EnglishContextBlocks />

      <H2>II. OpenViking&apos;s Design Philosophy and Technical Model</H2>
      <EnglishArchitectureBlocks />

      <H2>III. Product Boundaries and Team Adoption</H2>
      <EnglishPracticeBlocks />
    </>
  );
}
