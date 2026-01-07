import * as React from "react";
import { ClipboardPaste } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface InputWithPasteProps {
  id?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  type?: string;
  disabled?: boolean;
}

function InputWithPaste({ 
  id,
  value, 
  onChange, 
  placeholder, 
  className,
  type = "text",
  disabled = false
}: InputWithPasteProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        // Create synthetic event with the pasted text
        const syntheticEvent = {
          target: { value: text.trim() },
          currentTarget: { value: text.trim() },
        } as React.ChangeEvent<HTMLInputElement>;
        
        onChange(syntheticEvent);
        
        toast.success("Đã paste thành công!", {
          description: "Nhấn Save để lưu vĩnh viễn"
        });

        // Focus the input after paste
        inputRef.current?.focus();
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err);
      toast.error("Không thể đọc clipboard", {
        description: "Vui lòng dùng Ctrl+V để paste"
      });
    }
  };

  // Handle native paste (Ctrl+V)
  const handleNativePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText) {
      e.preventDefault();
      const syntheticEvent = {
        target: { value: pastedText.trim() },
        currentTarget: { value: pastedText.trim() },
      } as React.ChangeEvent<HTMLInputElement>;
      
      onChange(syntheticEvent);
      
      toast.success("Đã paste thành công!", {
        description: "Nhấn Save để lưu vĩnh viễn"
      });
    }
  };

  return (
    <div className="relative flex items-center w-full">
      <input
        ref={inputRef}
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onPaste={handleNativePaste}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pr-10 transition-all duration-200",
          className,
        )}
      />
      {!disabled && (
        <button
          type="button"
          onClick={handlePasteFromClipboard}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-primary/10 text-primary/60 hover:text-primary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
          title="Paste từ clipboard"
        >
          <ClipboardPaste className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export { InputWithPaste };
