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
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                {token.image ? (
                  <img 
                    src={token.image}
                    alt={token.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                    <span className="text-white text-xs sm:text-base font-bold">{token.symbol.charAt(0)}</span>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-white font-medium text-sm sm:text-base truncate">{token.name}</h3>
                <div className="flex items-center flex-wrap gap-1 sm:gap-2">
                  <span className="text-xs sm:text-sm text-gray-400">{token.symbol}</span>
                  <span className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 bg-gray-800 text-gray-300 rounded">
                    {formatTokenBalance(token.balance, token.decimals)} {token.symbol}
                  </span>
                </div>
                <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 truncate">
                  {formatMintAddress(token.id)}
                </div>
              </div>
            </div>
            
            <div className="text-right ml-2 sm:ml-3 flex-shrink-0">
              {token.value && (
                <div className="text-white font-medium text-sm sm:text-base">{token.value}</div>
              )}
              {token.price && (
                <div className={`text-xs sm:text-sm flex items-center justify-end ${token.positive ? 'text-green-400' : 'text-red-400'}`}>
                  {token.price}
                  {token.change && <span className="ml-1 sm:ml-2">{token.change}</span>}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}; 