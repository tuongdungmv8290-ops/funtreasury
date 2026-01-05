import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useViewMode } from '@/contexts/ViewModeContext';

interface EditableNoteProps {
  value: string | null;
  onSave: (value: string | null) => void;
  isLoading?: boolean;
}

export function EditableNote({ value, onSave, isLoading }: EditableNoteProps) {
  const { isViewOnly } = useViewMode();
  const [isOpen, setIsOpen] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  const handleSave = () => {
    const trimmed = editValue.trim();
    const newValue = trimmed || null;
    if (newValue !== value) {
      onSave(newValue);
    }
    setIsOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-1">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
      </div>
    );
  }

  // View only mode - just display the value
  if (isViewOnly) {
    return (
      <div className={cn(
        "flex items-center gap-1.5 px-2 py-1 text-sm",
        value ? "text-foreground" : "text-muted-foreground"
      )}>
        <FileText className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate max-w-[120px]">{value || '-'}</span>
      </div>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "group/note flex items-center gap-1.5 px-2 py-1 rounded text-sm transition-all max-w-[120px]",
            "hover:bg-primary/10 border border-transparent hover:border-primary/20",
            value ? "text-foreground" : "text-muted-foreground"
          )}
        >
          <FileText className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{value || 'Add note'}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-foreground">Transaction Note</h4>
          <Textarea
            ref={textareaRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="Add a note about this transaction..."
            className="min-h-[80px] text-sm resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditValue(value || '');
                setIsOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
