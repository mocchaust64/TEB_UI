import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { TokenItem as TokenItemType } from "@/lib/services/tokenList";
import { formatMintAddress, formatTokenBalance } from "@/lib/utils/format-utils";

interface TokenItemProps {
  token: TokenItemType;
}

/**
 * Component hiển thị thông tin một token trong danh sách
 */
export const TokenItem: React.FC<TokenItemProps> = ({ token }) => {
  return (
    <Link href={`/tokens/${token.id}`}>
      <Card className="bg-gray-900/50 border-gray-700 hover:border-purple-500/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center mr-3">
                {token.image ? (
                  <img 
                    src={token.image}
                    alt={token.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                    <span className="text-white font-bold">{token.symbol.charAt(0)}</span>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-white font-medium">{token.name}</h3>
                <div className="flex items-center">
                  <span className="text-sm text-gray-400 mr-2">{token.symbol}</span>
                  <span className="text-xs px-1.5 py-0.5 bg-gray-800 text-gray-300 rounded">
                    {formatTokenBalance(token.balance, token.decimals)} {token.symbol}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatMintAddress(token.id)}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              {token.value && (
                <div className="text-white font-medium">{token.value}</div>
              )}
              {token.price && (
                <div className={`text-sm flex items-center justify-end ${token.positive ? 'text-green-400' : 'text-red-400'}`}>
                  {token.price}
                  {token.change && <span className="ml-2">{token.change}</span>}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}; 