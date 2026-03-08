import { renderMarkdownToHtml } from "@/lib/content/markdown";

export async function MarkdownContent({ markdown }: { markdown: string }) {
  const html = await renderMarkdownToHtml(markdown);
  return <article className="prose-content" dangerouslySetInnerHTML={{ __html: html }} />;
}
