import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";
import { PublicKey } from "@solana/web3.js";

interface TokenMintInputProps {
  onLoadMetadata: (mintAddress: string) => Promise<void>;
  onChange?: (mintAddress: string) => void;
  value?: string;
  error?: string;
  className?: string;
}

export function TokenMintInput({ 
  onLoadMetadata, 
  onChange, 
  value = "", 
  error,
  className = "" 
}: TokenMintInputProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [mintAddress, setMintAddress] = useState(value);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMintAddress(e.target.value);
    onChange?.(e.target.value);
  };
  
  const handleLoadMetadata = async () => {
    setIsLoading(true);
    try {
      await onLoadMetadata(mintAddress);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-end gap-4">
        <div className="flex-grow space-y-2">
          <Label htmlFor="token-mint" className="text-white">
             Mint address<span className="text-red-500 ml-1">*</span>
          </Label>
          <Input 
            id="token-mint" 
            placeholder="Your mint token address" 
            className={`bg-gray-800 border-gray-700 text-white ${error ? 'border-red-500' : ''}`}
            value={mintAddress}
            onChange={handleChange}
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <Button 
          onClick={handleLoadMetadata}
          disabled={isLoading || !mintAddress.trim()}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang tải...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Tải Metadata
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 