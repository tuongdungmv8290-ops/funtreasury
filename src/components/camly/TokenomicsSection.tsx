import { Copy, ExternalLink, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CAMLY_CONTRACT = "0x0910320181889fefde0bb1ca63962b0a8882e413";
const BSCSCAN_URL = `https://bscscan.com/token/${CAMLY_CONTRACT}`;

interface TokenInfoRowProps {
  label: string;
  value: string;
  copyable?: boolean;
  link?: string;
}

function TokenInfoRow({ label, value, copyable, link }: TokenInfoRowProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b border-border/50 last:border-0 gap-2">
      <span className="text-muted-foreground font-body text-sm uppercase tracking-wider">
        {label}
      </span>
      <div className="flex items-center gap-2">
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-sm text-primary hover:underline flex items-center gap-1"
          >
            {value}
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        ) : (
          <span className={cn("font-mono text-sm", copyable && "text-foreground")}>
            {value}
          </span>
        )}
        {copyable && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 w-7 p-0 hover:bg-primary/10"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-inflow" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

export function TokenomicsSection() {
  return (
    <section className="py-12">
      <h2 className="text-2xl md:text-3xl font-heading font-bold text-center mb-4">
        Tokenomics
      </h2>
      <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto font-body">
        Technical details and on-chain information about CAMLY token
      </p>

      <div
        className={cn(
          "max-w-2xl mx-auto rounded-2xl overflow-hidden",
          "border border-primary/30",
          "bg-gradient-to-br from-card via-background to-primary/5",
          "shadow-[0_0_30px_rgba(212,175,55,0.1)]"
        )}
      >
        <div className="bg-primary/10 px-6 py-4 border-b border-primary/30">
          <h3 className="font-heading font-semibold text-lg gold-text">
            Token Information
          </h3>
        </div>
        
        <div className="px-6">
          <TokenInfoRow label="Token Name" value="CAMLY Coin" />
          <TokenInfoRow label="Symbol" value="CAMLY" />
          <TokenInfoRow label="Network" value="BNB Smart Chain (BEP-20)" />
          <TokenInfoRow 
            label="Contract Address" 
            value={`${CAMLY_CONTRACT.slice(0, 10)}...${CAMLY_CONTRACT.slice(-8)}`}
            copyable
          />
          <TokenInfoRow label="Decimals" value="18" />
          <TokenInfoRow 
            label="View on BSCScan" 
            value="BSCScan Explorer"
            link={BSCSCAN_URL}
          />
        </div>
      </div>

      {/* Security Notice */}
      <div className="max-w-2xl mx-auto mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
        <p className="text-sm text-center text-muted-foreground">
          <span className="text-primary font-medium">Security Tip:</span> Always verify the contract address before trading. 
          Only use official links from trusted sources.
        </p>
      </div>
    </section>
  );
}
