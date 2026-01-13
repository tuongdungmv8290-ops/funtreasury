import { Sparkles, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ComingSoonProps {
  title: string;
  description?: string;
}

export default function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="container py-12 md:py-20">
      <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
        {/* Icon with gold glow */}
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center shadow-[0_0_40px_rgba(201,162,39,0.4)]">
            <Sparkles className="w-12 h-12 text-primary animate-pulse" />
          </div>
          <div className="absolute inset-0 -z-10 w-24 h-24 rounded-full bg-primary/20 blur-2xl" />
        </div>

        {/* Title */}
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3">
          {title}
        </h1>

        {/* Coming Soon Badge */}
        <Badge
          variant="outline"
          className="mb-6 px-4 py-1.5 text-sm border-primary/50 bg-primary/10 text-primary"
        >
          Coming Soon
        </Badge>

        {/* Description */}
        <p className="font-body text-muted-foreground mb-8">
          {description ||
            'Tính năng này đang được phát triển. Vui lòng quay lại sau!'}
        </p>

        {/* Back button */}
        <Button variant="outline" asChild>
          <Link to="/" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Quay về Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
