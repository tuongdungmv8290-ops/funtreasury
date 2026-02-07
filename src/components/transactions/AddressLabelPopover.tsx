import { useState } from 'react';
import { Tag } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAddressLabels } from '@/hooks/useAddressLabels';
import { toast } from '@/hooks/use-toast';

interface AddressLabelPopoverProps {
  address: string;
  currentLabel?: string;
}

export function AddressLabelPopover({ address, currentLabel }: AddressLabelPopoverProps) {
  const [open, setOpen] = useState(false);
  const [newLabel, setNewLabel] = useState(currentLabel || '');
  const { addLabel } = useAddressLabels();

  const handleSave = () => {
    if (!newLabel.trim()) return;
    addLabel.mutate(
      { address, label: newLabel.trim() },
      {
        onSuccess: () => {
          toast({ title: '✅ Đã lưu tên!', description: `${address.slice(0, 6)}...${address.slice(-4)} → ${newLabel.trim()}` });
          setOpen(false);
        },
      }
    );
  };

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (v) setNewLabel(currentLabel || ''); }}>
      <PopoverTrigger asChild>
        <button
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-treasury-gold/10 rounded"
          title="Đặt tên cho địa chỉ"
        >
          <Tag className="w-3.5 h-3.5 text-treasury-gold" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <p className="text-xs text-muted-foreground mb-2 font-mono">
          {address.slice(0, 10)}...{address.slice(-6)}
        </p>
        <div className="flex gap-2">
          <Input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Nhập tên..."
            className="h-8 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
          />
          <Button
            size="sm"
            className="h-8 px-3"
            onClick={handleSave}
            disabled={!newLabel.trim() || addLabel.isPending}
          >
            Lưu
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
