import { useState, useRef, useEffect } from 'react';
import { Loader2, Tag, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useViewMode } from '@/contexts/ViewModeContext';

interface EditableTagsProps {
  value: string[] | null;
  onSave: (value: string[] | null) => void;
  isLoading?: boolean;
}

const SUGGESTED_TAGS = [
  'Treasury',
  'Salary',
  'Marketing',
  'Development',
  'Operations',
  'Investment',
  'Revenue',
  'Fee',
  'Refund',
  'Grant',
];

export function EditableTags({ value, onSave, isLoading }: EditableTagsProps) {
  const { isViewOnly } = useViewMode();
  const [isOpen, setIsOpen] = useState(false);
  const [tags, setTags] = useState<string[]>(value || []);
  const [newTag, setNewTag] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTags(value || []);
  }, [value]);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setNewTag('');
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSave = () => {
    const newValue = tags.length > 0 ? tags : null;
    onSave(newValue);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      addTag(newTag);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-1">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
      </div>
    );
  }

  // View only mode - just display the tags
  if (isViewOnly) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1">
        {value && value.length > 0 ? (
          <div className="flex items-center gap-1 flex-wrap max-w-[150px]">
            {value.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-primary/20 text-primary border border-primary/30"
              >
                {tag}
              </span>
            ))}
            {value.length > 2 && (
              <span className="text-xs text-muted-foreground">+{value.length - 2}</span>
            )}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </div>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "group/tags flex items-center gap-1.5 px-2 py-1 rounded text-sm transition-all",
            "hover:bg-primary/10 border border-transparent hover:border-primary/20"
          )}
        >
          {value && value.length > 0 ? (
            <div className="flex items-center gap-1 flex-wrap max-w-[150px]">
              {value.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-primary/20 text-primary border border-primary/30"
                >
                  {tag}
                </span>
              ))}
              {value.length > 2 && (
                <span className="text-xs text-muted-foreground">+{value.length - 2}</span>
              )}
            </div>
          ) : (
            <>
              <Tag className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Add tags</span>
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-foreground">Transaction Tags</h4>
          
          {/* Current Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 gap-1"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-0.5 hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Add New Tag */}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a new tag..."
              className="h-8 text-sm"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => addTag(newTag)}
              disabled={!newTag.trim()}
              className="h-8 px-2"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Suggested Tags */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Suggested tags:</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).slice(0, 6).map((tag) => (
                <button
                  key={tag}
                  onClick={() => addTag(tag)}
                  className="px-2 py-0.5 text-xs rounded border border-border bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTags(value || []);
                setIsOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save Tags
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
