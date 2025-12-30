import * as React from "react";
import { ClipboardPaste } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface InputWithPasteProps extends React.ComponentProps<"input"> {
  onPasteSuccess?: (value: string) => void;
}

const InputWithPaste = React.forwardRef<HTMLInputElement, InputWithPasteProps>(
  ({ className, type, onPasteSuccess, onChange, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Combine refs
    React.useImperativeHandle(ref, () => inputRef.current!);

    const handlePasteFromClipboard = async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text && inputRef.current) {
          // Create a synthetic event
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
          )?.set;
          
          if (nativeInputValueSetter) {
            nativeInputValueSetter.call(inputRef.current, text);
            const event = new Event('input', { bubbles: true });
            inputRef.current.dispatchEvent(event);
          }
          
          // Call onChange manually if provided
          if (onChange) {
            const syntheticEvent = {
              target: { value: text },
              currentTarget: { value: text },
            } as React.ChangeEvent<HTMLInputElement>;
            onChange(syntheticEvent);
          }
          
          onPasteSuccess?.(text);
          toast.success("Đã paste thành công!", {
            description: "Nhấn Save để lưu vĩnh viễn"
          });
        }
      } catch (err) {
        console.error('Failed to read clipboard:', err);
        toast.error("Không thể đọc clipboard", {
          description: "Vui lòng dùng Ctrl+V để paste"
        });
      }
    };

    return (
      <div className="relative flex items-center">
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pr-10 transition-all duration-200",
            className,
          )}
          ref={inputRef}
          onChange={onChange}
          {...props}
        />
        <button
          type="button"
          onClick={handlePasteFromClipboard}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-primary/10 text-primary/60 hover:text-primary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
          title="Paste từ clipboard"
        >
          <ClipboardPaste className="w-4 h-4" />
        </button>
      </div>
    );
  },
);
InputWithPaste.displayName = "InputWithPaste";

export { InputWithPaste };
