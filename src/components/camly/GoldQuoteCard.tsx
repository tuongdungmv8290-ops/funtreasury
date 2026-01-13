import { cn } from "@/lib/utils";

interface GoldQuoteCardProps {
  quote: string;
  author?: string;
  className?: string;
}

export function GoldQuoteCard({ quote, author, className }: GoldQuoteCardProps) {
  return (
    <blockquote
      className={cn(
        "border-l-4 border-primary pl-6 pr-4 py-6 my-8",
        "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent",
        "rounded-r-xl",
        "shadow-[0_0_30px_rgba(212,175,55,0.1)]",
        className
      )}
    >
      <p className="font-story text-xl md:text-2xl italic text-foreground leading-relaxed">
        "{quote}"
      </p>
      {author && (
        <footer className="text-primary font-medium mt-4 text-sm">
          — {author}
        </footer>
      )}
    </blockquote>
  );
}
