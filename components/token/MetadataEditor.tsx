import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Info, Upload, Trash2, X, Image as ImageIcon } from "lucide-react";
import { useFileUpload } from "@/hooks/use-file-upload";

export interface TokenMetadataValues {
  mint: string;
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  image?: File | null;
  websiteUrl: string;
  twitterUrl: string;
  telegramUrl: string;
  discordUrl: string;
  additionalMetadata: Record<string, string>;
}

interface MetadataEditorProps {
  metadata: TokenMetadataValues;
  onMetadataChange: (newValues: Partial<TokenMetadataValues>) => void;
  onCustomFieldAdd?: (key: string, value: string) => void;
  onCustomFieldRemove?: (key: string) => void;
  onCustomFieldUpdate?: (key: string, value: string) => void;
  imageNamePrefix?: string;
  readOnly?: boolean;
}

export function MetadataEditor({
  metadata,
  onMetadataChange,
  onCustomFieldAdd,
  onCustomFieldRemove,
  onCustomFieldUpdate,
  imageNamePrefix = "token",
  readOnly = false
}: MetadataEditorProps) {
  const [customKey, setCustomKey] = useState("");
  const [customValue, setCustomValue] = useState("");
  const [imageError, setImageError] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [gatewayIndex, setGatewayIndex] = useState(0);
  const ipfsGateways = useRef([
    "https://cloudflare-ipfs.com/ipfs/",
    "https://nftstorage.link/ipfs/",
    "https://gateway.ipfs.io/ipfs/",
    "https://ipfs.io/ipfs/",
    "https://dweb.link/ipfs/"
  ]);

  const { uploadFile, isUploading, fileUrl } = useFileUpload({
    namePrefix: imageNamePrefix,
    onSuccess: (url: string) => {
      onMetadataChange({ imageUrl: url });
    }
  });

  const tryDifferentGateway = () => {
    if (!metadata.imageUrl) return;

    if (!metadata.imageUrl.includes('/ipfs/') && !metadata.imageUrl.startsWith('ipfs://')) {
      return;
    }

    const nextIndex = (gatewayIndex + 1) % ipfsGateways.current.length;
    setGatewayIndex(nextIndex);
    
    let cid = '';
    if (metadata.imageUrl.includes('/ipfs/')) {
      const parts = metadata.imageUrl.split('/ipfs/');
      if (parts.length > 1) cid = parts[1];
    } else if (metadata.imageUrl.startsWith('ipfs://')) {
      cid = metadata.imageUrl.replace('ipfs://', '');
    }
    
    if (cid) {
      const newUrl = `${ipfsGateways.current[nextIndex]}${cid}`;
      const img = new Image();
      img.onload = () => {
        onMetadataChange({ imageUrl: newUrl });
        setImageError(false);
        setIsLoadingImage(false);
      };
      img.onerror = () => {
        if (nextIndex < ipfsGateways.current.length - 1) {
          setTimeout(() => tryDifferentGateway(), 500);
        } else {
          setImageError(true);
          setIsLoadingImage(false);
        }
      };
      img.src = newUrl;
      setIsLoadingImage(true);
    }
  };

  useEffect(() => {
    setImageError(false);
    setIsLoadingImage(true);
    setGatewayIndex(0);

    if (!metadata.imageUrl) {
      setIsLoadingImage(false);
      return;
    }

    const img = new Image();
    
    img.onload = () => {
      setIsLoadingImage(false);
      setImageError(false);
    };
    
    img.onerror = () => {
      setIsLoadingImage(false);
      setImageError(true);
    };
    
    img.src = metadata.imageUrl;
    
    const timeout = setTimeout(() => {
      if (isLoadingImage) {
        setIsLoadingImage(false);
      }
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, [metadata.imageUrl]);

  const handleImageUpload = async (file: File) => {
    await uploadFile(file);
  };

  const addCustomField = () => {
    if (!customKey.trim() || !customValue.trim()) {
      return;
    }
    
    onCustomFieldAdd?.(customKey, customValue);
    setCustomKey("");
    setCustomValue("");
  };

  const getAvatarFallback = () => {
    const letter = metadata.symbol?.charAt(0) || metadata.name?.charAt(0) || '?';
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/30 to-pink-500/30">
        <span className="text-white text-2xl font-bold">{letter}</span>
      </div>
    );
  };

  const isDirectImageUrl = (url: string) => {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
    return imageExtensions.some(ext => url.toLowerCase().endsWith(ext));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="token-name" className="text-white">Token Name</Label>
          <Input
            id="token-name" 
            placeholder="Token name" 
            className="bg-gray-800 border-gray-700 text-white"
            value={metadata.name}
            disabled={true}
          />
          <p className="text-xs text-gray-500">* Cannot change token name</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="token-symbol" className="text-white">Token Symbol</Label>
          <Input 
            id="token-symbol" 
            placeholder="Token symbol" 
            className="bg-gray-800 border-gray-700 text-white"
            value={metadata.symbol}
            disabled={true}
          />
          <p className="text-xs text-gray-500">* Cannot change token symbol</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="token-description" className="text-white">Description</Label>
          <Textarea 
            id="token-description" 
            placeholder="Describe your token" 
            className="bg-gray-800 border-gray-700 text-white min-h-[80px]"
            value={metadata.description}
            onChange={(e) => onMetadataChange({ description: e.target.value })}
            disabled={readOnly}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="token-image" className="text-white">Token Image</Label>
          <div className="relative flex items-center justify-center">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-purple-500/30 flex items-center justify-center bg-gray-800">
              {metadata.imageUrl && !imageError ? (
                <img 
                  src={metadata.imageUrl} 
                  alt={metadata.name || "Token Preview"} 
                  className="h-full w-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                getAvatarFallback()
              )}
              
              {isLoadingImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800/80">
                  <div className="animate-pulse">
                    <ImageIcon size={24} className="text-purple-400/70" />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {metadata.imageUrl && (
            <div className="mt-2 text-xs text-gray-500 overflow-hidden text-ellipsis">
              {metadata.imageUrl}
            </div>
          )}
          
          {!metadata.imageUrl && (
            <div className="mt-2 text-center text-xs text-gray-500">
              No token image found
            </div>
          )}
        </div>
      </div>
      
      <div className="pt-2">
        <h3 className="text-white font-medium mb-3">Social Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm6.5 8.5-3-2.5a1 1 0 0 0-1.5 1V12a1 1 0 0 0 1.5 1l3-2.5a1 1 0 0 0 0-2Z"/>
            </svg>
            <Input
              placeholder="Website URL" 
              className="bg-gray-800 border-gray-700 text-white"
              value={metadata.websiteUrl}
              onChange={(e) => onMetadataChange({ websiteUrl: e.target.value })}
              disabled={readOnly}
            />
          </div>
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
              <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
            </svg>
            <Input
              placeholder="Twitter URL" 
              className="bg-gray-800 border-gray-700 text-white"
              value={metadata.twitterUrl}
              onChange={(e) => onMetadataChange({ twitterUrl: e.target.value })}
              disabled={readOnly}
            />
          </div>
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
              <path d="m22 8-5 5-5-5 5-5-5 5-5-5 5 5-5 5 5-5"/>
              <path d="M2 12h10"/>
              <path d="M17 22v-8.3a4 4 0 0 0-4-4h-1.7"/>
            </svg>
            <Input
              placeholder="Telegram URL" 
              className="bg-gray-800 border-gray-700 text-white"
              value={metadata.telegramUrl}
              onChange={(e) => onMetadataChange({ telegramUrl: e.target.value })}
              disabled={readOnly}
            />
          </div>
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400">
              <path d="M18 20a3 3 0 0 0-3-3H9a3 3 0 0 0-3 3"/>
              <path d="M12 15a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
              <path d="M18 9a5 5 0 0 0-6-5 5 5 0 0 0-6 5v1a2 2 0 1 0 0 4"/>
            </svg>
            <Input
              placeholder="Discord URL" 
              className="bg-gray-800 border-gray-700 text-white"
              value={metadata.discordUrl}
              onChange={(e) => onMetadataChange({ discordUrl: e.target.value })}
              disabled={readOnly}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-white font-medium mb-3">Custom Metadata Fields</h3>
        
        {Object.keys(metadata.additionalMetadata).length > 0 ? (
          <div className="space-y-2 mb-4">
            <h4 className="text-sm font-medium text-gray-300">Current metadata fields</h4>
            <div className="space-y-2">
              {Object.entries(metadata.additionalMetadata).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 bg-gray-800/70 p-2 rounded-md">
                  <div className="flex-grow grid grid-cols-2 gap-2">
                    <Input
                      value={key}
                      disabled
                      className="bg-gray-800 border-gray-700 text-gray-400"
                    />
                    <Input
                      value={value}
                      onChange={(e) => onCustomFieldUpdate?.(key, e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                      disabled={readOnly}
                    />
                  </div>
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                      onClick={() => onCustomFieldRemove?.(key)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-400 mb-4">
            <Info className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>No custom metadata fields yet</p>
          </div>
        )}
        
        {!readOnly && (
          <div className="pt-4">
            <h4 className="text-sm font-medium text-white mb-2">Add new metadata field</h4>
            <div className="flex items-end gap-2">
              <div className="flex-grow grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="custom-key" className="text-xs text-gray-400">Field name</Label>
                  <Input
                    id="custom-key"
                    placeholder="Example: team, roadmap..."
                    className="bg-gray-800 border-gray-700 text-white h-9"
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="custom-value" className="text-xs text-gray-400">Value</Label>
                  <Input
                    id="custom-value"
                    placeholder="Enter value for metadata field"
                    className="bg-gray-800 border-gray-700 text-white h-9"
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                  />
                </div>
              </div>
              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white h-9"
                onClick={addCustomField}
                disabled={!customKey.trim() || !customValue.trim()}
              >
                Add
              </Button>
            </div>
          </div>
        )}
        
        <div className="bg-gray-800/50 rounded-lg p-3 text-gray-400 text-xs mt-3">
          <div className="flex items-start">
            <Info className="w-3 h-3 mr-1 mt-0.5 shrink-0" />
            <span>
              You can add custom metadata fields to provide more information about your token.
              These fields will be stored on the blockchain and can be accessed by other applications.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 