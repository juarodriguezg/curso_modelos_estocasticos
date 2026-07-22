"use client"

import { InlineMath, BlockMath } from "react-katex"
import "katex/dist/katex.min.css"

type Segment =
  | { type: 'html'; value: string }
  | { type: 'inline'; value: string }
  | { type: 'block'; value: string }

function parseInline(text: string): Segment[] {
  const inlineRegex = /\$([^$\n]+?)\$/g
  const segments: Segment[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = inlineRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'html', value: text.slice(lastIndex, match.index) })
    }
    segments.push({ type: 'inline', value: match[1] })
    lastIndex = inlineRegex.lastIndex
  }
  if (lastIndex < text.length) {
    segments.push({ type: 'html', value: text.slice(lastIndex) })
  }
  return segments
}

function parseContent(content: string): Segment[] {
  const blockRegex = /\$\$([\s\S]+?)\$\$/g
  const segments: Segment[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = blockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push(...parseInline(content.slice(lastIndex, match.index)))
    }
    segments.push({ type: 'block', value: match[1].trim() })
    lastIndex = blockRegex.lastIndex
  }
  if (lastIndex < content.length) {
    segments.push(...parseInline(content.slice(lastIndex)))
  }
  return segments
}

export default function LatexContent({ content, className, style }: { content: string; className?: string; style?: React.CSSProperties }) {
  const segments = parseContent(content)

  return (
    <div className={className} style={style}>
      {segments.map((segment, i) => {
        if (segment.type === 'block') {
          return <BlockMath key={i} errorColor="#cc0000">{segment.value}</BlockMath>
        }
        if (segment.type === 'inline') {
          return <InlineMath key={i} errorColor="#cc0000">{segment.value}</InlineMath>
        }
        return <span key={i} dangerouslySetInnerHTML={{ __html: segment.value }} />
      })}
    </div>
  )
}
