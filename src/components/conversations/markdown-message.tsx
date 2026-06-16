import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

// Renders untrusted LLM markdown (GFM: bold, lists, tables, links, fenced code) as formatted
// HTML inside an assistant chat bubble. Output is NOT trusted, so rehype-sanitize strips any
// raw HTML / script / event-handler before it reaches the DOM — this is the XSS boundary and is
// non-optional. No syntax highlighting (keeps the bundle small); code is plain styled <pre>.
//
// `.prose prose-sm` (Tailwind Typography) provides block spacing; color overrides below map the
// prose palette onto the design tokens so markdown matches the surface bubble in any theme.
// Memoized so streaming (one new token per render in the parent) only re-parses when `content`
// actually changes, and partial/mid-token markdown re-parses safely without throwing.
export const MarkdownMessage = memo(function MarkdownMessage({ content }: { content: string }) {
  return (
    <div
      className="prose prose-sm max-w-none break-words text-text-primary
        prose-headings:text-text-primary prose-strong:text-text-primary
        prose-a:text-brand-700 prose-code:text-text-primary
        prose-pre:overflow-x-auto prose-pre:rounded-lg prose-pre:bg-surface-2
        prose-pre:p-3 prose-pre:text-text-primary prose-code:before:content-none
        prose-code:after:content-none prose-th:text-text-primary
        prose-blockquote:text-text-secondary prose-blockquote:border-border
        prose-hr:border-border marker:text-text-dim"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noreferrer" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

export default MarkdownMessage;
