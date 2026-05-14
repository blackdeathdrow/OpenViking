# Case Study: OpenViking Context Database Blog Post

This case study records the practical decisions from converting a Lark document into the blog post `openviking-context-database`. Use it when building future long-form blog posts from source documents.

## Source And Outputs

- Source: Lark wiki document about OpenViking as a context database for context engineering.
- Human page: `/post/openviking-context-database/`.
- Agent page: `/post/openviking-context-database/llm.txt`.
- Cover assets: high-resolution post/OG image plus smaller index-card image.
- Final commit from the original implementation pass: `92ad5883 feat(blog): publish OpenViking context post`.

## Core Method

1. Split the work by reader: HTML is for humans; `llm.txt` is for agents. The HTML can use layout, interaction, visual rhythm, and progressive reading. The `llm.txt` should be clean, source-like, low-token, and only contain the requested language/content.
2. Design the heading taxonomy before rendering. Use `H2` for major sections, `H3` for TOC-level blocks, and `H4` inside cards or panels. Let TOC query only headings explicitly marked for TOC.
3. Prefer visible scroll-based interfaces over hidden click-to-reveal content. Sticky tabs, chips, and rails should help readers jump and orient, not hide the only copy behind buttons.
4. Keep machine-readable routing out of the human article. Put discovery in HTML metadata, `link rel="alternate"`, and `/llms.txt`.
5. Treat the cover as an editorial signal. Use one abstract insight instead of a diagram that tries to explain every system component.
6. Make language switching affect everything visible near the article, including the TOC, dates, labels, and fold controls. It should not require a refresh.

Cover preference learned from review: watercolor on cream paper works well when it preserves space and abstraction. For OpenViking covers, use the OV sail/crescent logo only as a small structural hint, not a large badge. Prefer warm gold, muted sage, graphite, and light umber with only minimal indigo depth; avoid literal keys, locks, oversized logos, and blue/purple-dominant brand art.

## Second-Round Filling Method

The first implementation pass should establish the article frame, not pretend to be final. For long technical posts, the stronger workflow is:

1. Build the skeleton from source material: thesis, section order, metadata, cover, core examples, and the clean `llm.txt`.
2. Run parallel agents once the skeleton exists. Split them by concern: source/content gaps, frontend rendering blocks, and terminology/translation QA.
3. Fill the article from the content-gap pass before adding visual complexity. A pretty block that hides a missing argument does not solve the review problem.
4. Add interactive blocks only when the same information is also discoverable by scrolling. Buttons and tabs can focus attention, but should not be the only place where critical content exists.
5. Translate after the structure and components stabilize. Custom component labels, sticky nav, tables, and active states need the same language discipline as paragraphs.
6. Re-run build and static checks after the second pass, including generated HTML, `/llms.txt`, and the post-level `llm.txt`.

## Specific Implementation Notes

- The article is split into scoped block files under `src/posts/openviking-context-database/` because one monolithic `index.jsx` became too hard to review.
- The post supports English and Chinese in the human page, while `llm.txt` was constrained to English only.
- The TOC keeps its fold behavior as an opt-in capability (`foldable`), but defaults to expanded because long hidden navigation was a worse default for this post.
- The page uses `cardCover || cover` so large hero/OG artwork does not have to be used on the index card.
- The official docs entry should point to `https://docs.openviking.ai/`. Specific examples may still reference exact GitHub paths such as `docs/zh/concepts/...` when the source requires them.

## Public Cleanup Pass — 2026-05-14

- Treat "compressed" capability tables as public-facing summaries, not as permission to drop important product boundaries. For this post, zh, en, and `llm.txt` now use the same public OpenViking / vector database / filesystem comparison shape and link to public docs for deeper implementation detail.
- "Softened demo framing" means the first public rewrite turned explicit Demo A/B/C sections into more general prose. The cleanup pass restored public demo labels for the multi-repository technical question, OpenClaw memory, and VikingBot so readers can see the original talk structure without exposing internal-only artifacts.
- The public-safety pass must cover generated agent text, not only the React article. Remove internal deployment routes, private platform names, proxy commands, private source links, local employee home paths, and speaker/person rosters from `llm.txt` when they are not also intended for the public zh/en article.
- Public provenance should point readers to GitHub, `docs.openviking.ai`, public discussions, and public install guides. Private Lark URLs may be useful while authoring, but should not appear in public page metadata or `/llms.txt` unless explicitly approved.

## Review Challenges To Expect

- If the first version is too short, the user may expect deeper block-by-block rendering rather than a summary page.
- If content is hidden behind buttons, the user may object that many readers will never discover it.
- If TOC contains every nested heading, structure will look broken. Headings inside cards should usually be `H4`.
- If TOC has decorative index numbers, it can feel noisy and distract from scanning.
- If switching languages leaves sidebar content stale, it is a real product bug, not a cosmetic issue.
- If `llm.txt` contains routing notes, summaries, or agent instructions when the user asked for a translation/source twin, it is polluted.
- If cover prompts try to deliver too much information, simplify toward the one critical insight.

## Verification Used

- `npm run build`.
- Check generated article HTML for dates, cover paths, official docs links, and TOC language.
- Check `/post/openviking-context-database/llm.txt` for English-only content when required.
- Check index page uses the smaller `cardCover`.
- Check post page, Open Graph, Twitter image, and JSON-LD use the high-resolution cover.
