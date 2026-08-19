import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const components: Components = {
  blockquote({ children }) {
    return <blockquote>{children}</blockquote>;
  },
  img({ src, alt, title }) {
    if (!src || typeof src !== "string") return null;
    const caption = title?.trim() || (alt && alt !== "image" ? alt : null);
    if (caption) {
      return (
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element -- markdown remote images */}
          <img src={src} alt={alt ?? ""} />
          <figcaption>{caption}</figcaption>
        </figure>
      );
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element -- markdown remote images
      <img src={src} alt={alt ?? ""} />
    );
  },
  hr() {
    return <hr />;
  },
};

export function ArticleBody({ markdown }: { markdown: string }) {
  return (
    <div className="article-prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
