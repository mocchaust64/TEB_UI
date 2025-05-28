'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Settings2Icon } from 'lucide-react';
import { useNetwork } from '@/lib/hooks/use-network';
import { Label } from '@/components/ui/label';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

// Custom network type
type NetworkType = WalletAdapterNetwork | 'custom';

export function EndpointSettings() {
  const { 
    selectedNetwork, 
    setSelectedNetwork, 
    endpoint,
    networkOptions,
    currentNetworkOption
  } = useNetwork();
  
  const [networkType, setNetworkType] = useState<NetworkType>(
    selectedNetwork as NetworkType
  );
  const [customEndpoint, setCustomEndpoint] = useState("");
  const [open, setOpen] = useState(false);

  const handleNetworkChange = (value: string) => {
    setNetworkType(value as NetworkType);
    
    // Chuyển đổi giá trị thành WalletAdapterNetwork nếu không phải custom
    if (value !== 'custom') {
      setSelectedNetwork(value as WalletAdapterNetwork);
    }
  };

  const handleCustomEndpointChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomEndpoint(e.target.value);
  };

  const handleSaveEndpoint = () => {
    // Xử lý lưu custom endpoint ở đây nếu cần
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full"
          aria-label="Cài đặt mạng"
          title="Cài đặt mạng"
        >
          <Settings2Icon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Cài đặt mạng</h4>
            <p className="text-sm text-muted-foreground">
              Chọn mạng Solana để kết nối
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="network">Mạng</Label>
            <Select value={networkType} onValueChange={handleNetworkChange}>
              <SelectTrigger id="network">
                <SelectValue placeholder="Chọn mạng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={WalletAdapterNetwork.Devnet}>Devnet</SelectItem>
                <SelectItem value={WalletAdapterNetwork.Mainnet}>Mainnet</SelectItem>
                <SelectItem value="custom">RPC tùy chỉnh</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {networkType === 'custom' && (
            <div className="grid gap-2">
              <Label htmlFor="custom-rpc">RPC URL tùy chỉnh</Label>
              <div className="flex gap-2">
                <Input
                  id="custom-rpc"
                  placeholder="https://api.example.com"
                  value={customEndpoint}
                  onChange={handleCustomEndpointChange}
                />
                <Button onClick={handleSaveEndpoint}>Lưu</Button>
              </div>
              <p className="text-[0.8rem] text-muted-foreground">
                Nhập URL của RPC node Solana
              </p>
            </div>
          )}
          <div className="rounded-md bg-secondary p-2 text-xs">
            <div className="font-semibold">Đang kết nối tới:</div>
            <div className="mt-1 break-all">
              {currentNetworkOption ? currentNetworkOption.label : 'Không xác định'}: {endpoint}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default EndpointSettings; 