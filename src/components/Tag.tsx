export function Tag({ text, tone = 'muted' }: { text: string; tone?: 'muted' | 'accent' }) {
  return <span className={`tag ${tone === 'accent' ? 'tag-accent' : 'tag-muted'}`}>{text}</span>;
}
