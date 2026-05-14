import React from 'react';
import {
  Article, H2, Lead, Quote,
} from '../../blog-components';
import './blocks.css';
import { ContextFrontHalfBlocks } from './blocks-context.jsx';
import { OpenVikingArchitectureBlocks } from './blocks-architecture.jsx';
import { OpenVikingPracticeBlocks } from './blocks-practice.jsx';
import OpenVikingEnglishBlocks from './blocks-en.jsx';

const LLM_PATH = '/post/openviking-context-database/llm.txt';

const OpenVikingContextDatabaseZh = () => (
  <Article className="ovx-article">
    <Lead>
      OpenViking 把上下文工程从 Prompt、RAG、Tools、Skills 和 Memory 的松散组合，推进到一个面向 Agent 的数据库范式：
      资料要能被组织、索引、摘要、推荐、记忆和持续更新，而不是每次都靠人把背景塞进窗口。
    </Lead>

    <Quote cite="OpenViking 分享原文">
      上下文工程 = 可靠的推理流程约束 + 完整的信息组织 + 有效的上下文推荐 + 全生命周期记忆 + 可跟踪的自进化学习。
    </Quote>

    <H2>I. 上下文工程为什么变成数据库问题</H2>
    <ContextFrontHalfBlocks />

    <H2>II. OpenViking 的设计理念与技术原理</H2>
    <OpenVikingArchitectureBlocks />

    <H2>III. 从产品边界到团队落地</H2>
    <OpenVikingPracticeBlocks />
  </Article>
);

const OpenVikingContextDatabaseEn = () => (
  <Article className="ovx-article">
    <Lead>
      OpenViking moves context engineering beyond a loose mix of Prompt, RAG, Tools, Skills, and Memory.
      It treats context as data for agents: something that can be ingested, organized, indexed, summarized, recommended, remembered, and continuously updated.
    </Lead>

    <Quote cite="OpenViking talk">
      Context engineering = reliable reasoning constraints + complete information organization + effective context recommendation + full-lifecycle memory + traceable self-evolving learning.
    </Quote>

    <OpenVikingEnglishBlocks />
  </Article>
);

const OpenVikingContextDatabase = ({ lang }) => (
  lang === 'en' ? <OpenVikingContextDatabaseEn /> : <OpenVikingContextDatabaseZh />
);

export default {
  id: 'openviking-context-database',
  Component: OpenVikingContextDatabase,
  meta: {
    title: { zh: 'OpenViking：上下文工程的数据库范式', en: 'OpenViking: The Database Paradigm for Context Engineering' },
    description: {
      zh: '从 Prompt、RAG、Tools、Skills 到 Memory，OpenViking 如何把上下文工程推进到面向 Agent 的数据库范式。',
      en: 'How OpenViking turns context engineering into a database-shaped interface for agents.',
    },
    cover: '/assets/covers/openviking-context-database.png',
    cardCover: '/assets/covers/openviking-context-database-card.png',
    publishedAt: '2026-03-10',
    updatedAt: '2026-05-14',
    readingTime: 28,
    category: { zh: '上下文工程', en: 'Context Engineering' },
    tags: ['openviking', 'context', 'agent'],
    languages: ['en', 'zh'],
    llmPath: LLM_PATH,
    authors: [
      { name: 'maojia', github: 'MaojiaSheng' },
    ],
  },
};
