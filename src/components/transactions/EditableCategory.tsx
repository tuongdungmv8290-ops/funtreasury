import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditableCategoryProps {
  value: string | null;
  onSave: (value: string | null) => void;
  isLoading?: boolean;
}

export function EditableCategory({ value, onSave, isLoading }: EditableCategoryProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = editValue.trim();
    const newValue = trimmed || null;
    if (newValue !== value) {
      onSave(newValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value || '');
      setIsEditing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-1">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
      </div>
    );
  }

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="h-7 w-28 text-sm bg-white border-primary/50 focus:border-primary"
        placeholder="Category..."
      />
    );
  }

  return (
    <button
      onClick={() => {
        setEditValue(value || '');
        setIsEditing(true);
      }}
      className={cn(
        "group/edit flex items-center gap-1.5 px-2 py-1 rounded text-sm transition-all",
        "hover:bg-primary/10 border border-transparent hover:border-primary/20",
        value ? "text-foreground" : "text-muted-foreground"
      )}
    >
      <span>{value || 'Add category'}</span>
      <Pencil className="w-3 h-3 opacity-0 group-hover/edit:opacity-100 transition-opacity text-primary" />
    </button>
  );
}
