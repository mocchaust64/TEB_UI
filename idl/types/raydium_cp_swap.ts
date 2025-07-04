/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/raydium_cp_swap.json`.
 */
export type RaydiumCpSwap = {
  "address": "WFHgqbEBAESXYu9EWcnpDcLoG9L5kDyQJjCG3a5AGqL",
  "metadata": {
    "name": "raydiumCpSwap",
    "version": "0.2.0",
    "spec": "0.1.0",
    "description": "Raydium constant product AMM, supports Token2022 and without Openbook"
  },
  "instructions": [
    {
      "name": "collectFundFee",
      "docs": [
        "Collect the fund fee accrued to the pool",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context of accounts",
        "* `amount_0_requested` - The maximum amount of token_0 to send, can be 0 to collect fees in only token_1",
        "* `amount_1_requested` - The maximum amount of token_1 to send, can be 0 to collect fees in only token_0",
        ""
      ],
      "discriminator": [
        167,
        138,
        78,
        149,
        223,
        194,
        6,
        126
      ],
      "accounts": [
        {
          "name": "owner",
          "docs": [
            "Only admin or fund_owner can collect fee now"
          ],
          "signer": true
        },
        {
          "name": "authority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  95,
                  97,
                  110,
                  100,
                  95,
                  108,
                  112,
                  95,
                  109,
                  105,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  95,
                  115,
                  101,
                  101,
                  100
                ]
              }
            ]
          }
        },
        {
          "name": "poolState",
          "docs": [
            "Pool state stores accumulated protocol fee amount"
          ],
          "writable": true
        },
        {
          "name": "ammConfig",
          "docs": [
            "Amm config account stores fund_owner"
          ]
        },
        {
          "name": "token0Vault",
          "docs": [
            "The address that holds pool tokens for token_0"
          ],
          "writable": true
        },
        {
          "name": "token1Vault",
          "docs": [
            "The address that holds pool tokens for token_1"
          ],
          "writable": true
        },
        {
          "name": "vault0Mint",
          "docs": [
            "The mint of token_0 vault"
          ]
        },
        {
          "name": "vault1Mint",
          "docs": [
            "The mint of token_1 vault"
          ]
        },
        {
          "name": "recipientToken0Account",
          "docs": [
            "The address that receives the collected token_0 fund fees"
          ],
          "writable": true
        },
        {
          "name": "recipientToken1Account",
          "docs": [
            "The address that receives the collected token_1 fund fees"
          ],
          "writable": true
        },
        {
          "name": "tokenProgram",
          "docs": [
            "The SPL program to perform token transfers"
          ],
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "tokenProgram2022",
          "docs": [
            "The SPL program 2022 to perform token transfers"
          ],
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": [
        {
          "name": "amount0Requested",
          "type": "u64"
        },
        {
          "name": "amount1Requested",
          "type": "u64"
        }
      ]
    },
    {
      "name": "collectProtocolFee",
      "docs": [
        "Collect the protocol fee accrued to the pool",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context of accounts",
        "* `amount_0_requested` - The maximum amount of token_0 to send, can be 0 to collect fees in only token_1",
        "* `amount_1_requested` - The maximum amount of token_1 to send, can be 0 to collect fees in only token_0",
        ""
      ],
      "discriminator": [
        136,
        136,
        252,
        221,
        194,
        66,
        126,
        89
      ],
      "accounts": [
        {
          "name": "owner",
          "docs": [
            "Only admin or owner can collect fee now"
          ],
          "signer": true
        },
        {
          "name": "authority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  95,
                  97,
                  110,
                  100,
                  95,
                  108,
                  112,
                  95,
                  109,
                  105,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  95,
                  115,
                  101,
                  101,
                  100
                ]
              }
            ]
          }
        },
        {
          "name": "poolState",
          "docs": [
            "Pool state stores accumulated protocol fee amount"
          ],
          "writable": true
        },
        {
          "name": "ammConfig",
          "docs": [
            "Amm config account stores owner"
          ]
        },
        {
          "name": "token0Vault",
          "docs": [
            "The address that holds pool tokens for token_0"
          ],
          "writable": true
        },
        {
          "name": "token1Vault",
          "docs": [
            "The address that holds pool tokens for token_1"
          ],
          "writable": true
        },
        {
          "name": "vault0Mint",
          "docs": [
            "The mint of token_0 vault"
          ]
        },
        {
          "name": "vault1Mint",
          "docs": [
            "The mint of token_1 vault"
          ]
        },
        {
          "name": "recipientToken0Account",
          "docs": [
            "The address that receives the collected token_0 protocol fees"
          ],
          "writable": true
        },
        {
          "name": "recipientToken1Account",
          "docs": [
            "The address that receives the collected token_1 protocol fees"
          ],
          "writable": true
        },
        {
          "name": "tokenProgram",
          "docs": [
            "The SPL program to perform token transfers"
          ],
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "tokenProgram2022",
          "docs": [
            "The SPL program 2022 to perform token transfers"
          ],
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": [
        {
          "name": "amount0Requested",
          "type": "u64"
        },
        {
          "name": "amount1Requested",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createAmmConfig",
      "docs": [
        "# Arguments",
        "",
        "* `ctx`- The accounts needed by instruction.",
        "* `index` - The index of amm config, there may be multiple config.",
        "* `trade_fee_rate` - Trade fee rate, can be changed.",
        "* `protocol_fee_rate` - The rate of protocol fee within trade fee.",
        "* `fund_fee_rate` - The rate of fund fee within trade fee.",
        ""
      ],
      "discriminator": [
        137,
        52,
        237,
        212,
        215,
        117,
        108,
        104
      ],
      "accounts": [
        {
          "name": "owner",
          "docs": [
            "Address to be set as protocol owner."
          ],
          "writable": true,
          "signer": true,
          "address": "2p3CiCssv21WeTyQDVZZL66UyXByJZd4oqrPyV7tz3qu"
        },
        {
          "name": "ammConfig",
          "docs": [
            "Initialize config state account to store protocol owner address and fee rates."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  109,
                  109,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "arg",
                "path": "index"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "index",
          "type": "u16"
        },
        {
          "name": "tradeFeeRate",
          "type": "u64"
        },
        {
          "name": "protocolFeeRate",
          "type": "u64"
        },
        {
          "name": "fundFeeRate",
          "type": "u64"
        },
        {
          "name": "createPoolFee",
          "type": "u64"
        }
      ]
    },
    {
      "name": "deposit",
      "docs": [
        "Deposit lp token to the pool",
        "",
        "# Arguments",
        "",
        "* `ctx`- The context of accounts",
        "* `lp_token_amount` - Pool token amount to transfer. token_a and token_b amount are set by the current exchange rate and size of the pool",
        "* `maximum_token_0_amount` -  Maximum token 0 amount to deposit, prevents excessive slippage",
        "* `maximum_token_1_amount` - Maximum token 1 amount to deposit, prevents excessive slippage",
        ""
      ],
      "discriminator": [
        242,
        35,
        198,
        137,
        82,
        225,
        242,
        182
      ],
      "accounts": [
        {
          "name": "owner",
          "docs": [
            "Pays to mint the position"
          ],
          "signer": true
        },
        {
          "name": "authority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  95,
                  97,
                  110,
                  100,
                  95,
                  108,
                  112,
                  95,
                  109,
                  105,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  95,
                  115,
                  101,
                  101,
                  100
                ]
              }
            ]
          }
        },
        {
          "name": "poolState",
          "writable": true
        },
        {
          "name": "ownerLpToken",
          "docs": [
            "Owner lp token account"
          ],
          "writable": true
        },
        {
          "name": "token0Account",
          "docs": [
            "The payer's token account for token_0"
          ],
          "writable": true
        },
        {
          "name": "token1Account",
          "docs": [
            "The payer's token account for token_1"
          ],
          "writable": true
        },
        {
          "name": "token0Vault",
          "docs": [
            "The address that holds pool tokens for token_0"
          ],
          "writable": true
        },
        {
          "name": "token1Vault",
          "docs": [
            "The address that holds pool tokens for token_1"
          ],
          "writable": true
        },
        {
          "name": "tokenProgram",
          "docs": [
            "token Program"
          ],
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "tokenProgram2022",
          "docs": [
            "Token program 2022"
          ],
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "vault0Mint",
          "docs": [
            "The mint of token_0 vault"
          ]
        },
        {
          "name": "vault1Mint",
          "docs": [
            "The mint of token_1 vault"
          ]
        },
        {
          "name": "lpMint",
          "docs": [
            "Lp token mint"
          ],
          "writable": true
        }
      ],
      "args": [
        {
          "name": "lpTokenAmount",
          "type": "u64"
        },
        {
          "name": "maximumToken0Amount",
          "type": "u64"
        },
        {
          "name": "maximumToken1Amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initialize",
      "docs": [
        "Creates a pool for the given token pair and the initial price",
        "",
        "# Arguments",
        "",
        "* `ctx`- The context of accounts",
        "* `init_amount_0` - the initial amount_0 to deposit",
        "* `init_amount_1` - the initial amount_1 to deposit",
        "* `open_time` - the timestamp allowed for swap",
        ""
      ],
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "creator",
          "docs": [
            "Address paying to create the pool. Can be anyone"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "ammConfig",
          "docs": [
            "Which config the pool belongs to."
          ]
        },
        {
          "name": "authority",
          "docs": [
            "pool vault and lp mint authority"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  95,
                  97,
                  110,
                  100,
                  95,
                  108,
                  112,
                  95,
                  109,
                  105,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  95,
                  115,
                  101,
                  101,
                  100
                ]
              }
            ]
          }
        },
        {
          "name": "poolState",
          "writable": true
        },
        {
          "name": "token0Mint",
          "docs": [
            "Token_0 mint, the key must smaller than token_1 mint."
          ]
        },
        {
          "name": "token1Mint",
          "docs": [
            "Token_1 mint, the key must grater then token_0 mint."
          ]
        },
        {
          "name": "lpMint",
          "docs": [
            "pool lp mint"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108,
                  95,
                  108,
                  112,
                  95,
                  109,
                  105,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "poolState"
              }
            ]
          }
        },
        {
          "name": "creatorToken0",
          "docs": [
            "payer token0 account"
          ],
          "writable": true
        },
        {
          "name": "creatorToken1",
          "docs": [
            "creator token1 account"
          ],
          "writable": true
        },
        {
          "name": "creatorLpToken",
          "docs": [
            "creator lp token account"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "creator"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "lpMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "token0Vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "poolState"
              },
              {
                "kind": "account",
                "path": "token0Mint"
              }
            ]
          }
        },
        {
          "name": "token1Vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "poolState"
              },
              {
                "kind": "account",
                "path": "token1Mint"
              }
            ]
          }
        },
        {
          "name": "createPoolFee",
          "writable": true,
          "address": "2p3CiCssv21WeTyQDVZZL66UyXByJZd4oqrPyV7tz3qu"
        },
        {
          "name": "observationState",
          "docs": [
            "an account to store oracle observations"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  98,
                  115,
                  101,
                  114,
                  118,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "poolState"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "docs": [
            "Program to create mint account and mint tokens"
          ],
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "token0Program",
          "docs": [
            "Spl token program or token program 2022"
          ]
        },
        {
          "name": "token1Program",
          "docs": [
            "Spl token program or token program 2022"
          ]
        },
        {
          "name": "associatedTokenProgram",
          "docs": [
            "Program to create an ATA for receiving position NFT"
          ],
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "docs": [
            "To create a new program account"
          ],
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "docs": [
            "Sysvar for program account"
          ],
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "initAmount0",
          "type": "u64"
        },
        {
          "name": "initAmount1",
          "type": "u64"
        },
        {
          "name": "openTime",
          "type": "u64"
        }
      ]
    },
    {
      "name": "swapBaseInput",
      "docs": [
        "Swap the tokens in the pool base input amount",
        "",
        "# Arguments",
        "",
        "* `ctx`- The context of accounts",
        "* `amount_in` -  input amount to transfer, output to DESTINATION is based on the exchange rate",
        "* `minimum_amount_out` -  Minimum amount of output token, prevents excessive slippage",
        ""
      ],
      "discriminator": [
        143,
        190,
        90,
        218,
        196,
        30,
        51,
        222
      ],
      "accounts": [
        {
          "name": "payer",
          "docs": [
            "The user performing the swap"
          ],
          "signer": true
        },
        {
          "name": "authority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  95,
                  97,
                  110,
                  100,
                  95,
                  108,
                  112,
                  95,
                  109,
                  105,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  95,
                  115,
                  101,
                  101,
                  100
                ]
              }
            ]
          }
        },
        {
          "name": "ammConfig",
          "docs": [
            "The factory state to read protocol fees"
          ]
        },
        {
          "name": "poolState",
          "docs": [
            "The program account of the pool in which the swap will be performed"
          ],
          "writable": true
        },
        {
          "name": "inputTokenAccount",
          "docs": [
            "The user token account for input token"
          ],
          "writable": true
        },
        {
          "name": "outputTokenAccount",
          "docs": [
            "The user token account for output token"
          ],
          "writable": true
        },
        {
          "name": "inputVault",
          "docs": [
            "The vault token account for input token"
          ],
          "writable": true
        },
        {
          "name": "outputVault",
          "docs": [
            "The vault token account for output token"
          ],
          "writable": true
        },
        {
          "name": "inputTokenProgram",
          "docs": [
            "SPL program for input token transfers"
          ]
        },
        {
          "name": "outputTokenProgram",
          "docs": [
            "SPL program for output token transfers"
          ]
        },
        {
          "name": "inputTokenMint",
          "docs": [
            "The mint of input token"
          ]
        },
        {
          "name": "outputTokenMint",
          "docs": [
            "The mint of output token"
          ]
        },
        {
          "name": "observationState",
          "docs": [
            "The program account for the most recent oracle observation"
          ],
          "writable": true
        }
      ],
      "args": [
        {
          "name": "amountIn",
          "type": "u64"
        },
        {
          "name": "minimumAmountOut",
          "type": "u64"
        }
      ]
    },
    {
      "name": "swapBaseOutput",
      "docs": [
        "Swap the tokens in the pool base output amount",
        "",
        "# Arguments",
        "",
        "* `ctx`- The context of accounts",
        "* `max_amount_in` -  input amount prevents excessive slippage",
        "* `amount_out` -  amount of output token",
        ""
      ],
      "discriminator": [
        55,
        217,
        98,
        86,
        163,
        74,
        180,
        173
      ],
      "accounts": [
        {
          "name": "payer",
          "docs": [
            "The user performing the swap"
          ],
          "signer": true
        },
        {
          "name": "authority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  95,
                  97,
                  110,
                  100,
                  95,
                  108,
                  112,
                  95,
                  109,
                  105,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  95,
                  115,
                  101,
                  101,
                  100
                ]
              }
            ]
          }
        },
        {
          "name": "ammConfig",
          "docs": [
            "The factory state to read protocol fees"
          ]
        },
        {
          "name": "poolState",
          "docs": [
            "The program account of the pool in which the swap will be performed"
          ],
          "writable": true
        },
        {
          "name": "inputTokenAccount",
          "docs": [
            "The user token account for input token"
          ],
          "writable": true
        },
        {
          "name": "outputTokenAccount",
          "docs": [
            "The user token account for output token"
          ],
          "writable": true
        },
        {
          "name": "inputVault",
          "docs": [
            "The vault token account for input token"
          ],
          "writable": true
        },
        {
          "name": "outputVault",
          "docs": [
            "The vault token account for output token"
          ],
          "writable": true
        },
        {
          "name": "inputTokenProgram",
          "docs": [
            "SPL program for input token transfers"
          ]
        },
        {
          "name": "outputTokenProgram",
          "docs": [
            "SPL program for output token transfers"
          ]
        },
        {
          "name": "inputTokenMint",
          "docs": [
            "The mint of input token"
          ]
        },
        {
          "name": "outputTokenMint",
          "docs": [
            "The mint of output token"
          ]
        },
        {
          "name": "observationState",
          "docs": [
            "The program account for the most recent oracle observation"
          ],
          "writable": true
        }
      ],
      "args": [
        {
          "name": "maxAmountIn",
          "type": "u64"
        },
        {
          "name": "amountOut",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateAmmConfig",
      "docs": [
        "Updates the owner of the amm config",
        "Must be called by the current owner or admin",
        "",
        "# Arguments",
        "",
        "* `ctx`- The context of accounts",
        "* `trade_fee_rate`- The new trade fee rate of amm config, be set when `param` is 0",
        "* `protocol_fee_rate`- The new protocol fee rate of amm config, be set when `param` is 1",
        "* `fund_fee_rate`- The new fund fee rate of amm config, be set when `param` is 2",
        "* `new_owner`- The config's new owner, be set when `param` is 3",
        "* `new_fund_owner`- The config's new fund owner, be set when `param` is 4",
        "* `param`- The value can be 0 | 1 | 2 | 3 | 4, otherwise will report a error",
        ""
      ],
      "discriminator": [
        49,
        60,
        174,
        136,
        154,
        28,
        116,
        200
      ],
      "accounts": [
        {
          "name": "owner",
          "docs": [
            "The amm config owner or admin"
          ],
          "signer": true,
          "address": "2p3CiCssv21WeTyQDVZZL66UyXByJZd4oqrPyV7tz3qu"
        },
        {
          "name": "ammConfig",
          "docs": [
            "Amm config account to be changed"
          ],
          "writable": true
        }
      ],
      "args": [
        {
          "name": "param",
          "type": "u8"
        },
        {
          "name": "value",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updatePoolStatus",
      "docs": [
        "Update pool status for given value",
        "",
        "# Arguments",
        "",
        "* `ctx`- The context of accounts",
        "* `status` - The value of status",
        ""
      ],
      "discriminator": [
        130,
        87,
        108,
        6,
        46,
        224,
        117,
        123
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true,
          "address": "2p3CiCssv21WeTyQDVZZL66UyXByJZd4oqrPyV7tz3qu"
        },
        {
          "name": "poolState",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "status",
          "type": "u8"
        }
      ]
    },
    {
      "name": "withdraw",
      "docs": [
        "Withdraw lp for token0 and token1",
        "",
        "# Arguments",
        "",
        "* `ctx`- The context of accounts",
        "* `lp_token_amount` - Amount of pool tokens to burn. User receives an output of token a and b based on the percentage of the pool tokens that are returned.",
        "* `minimum_token_0_amount` -  Minimum amount of token 0 to receive, prevents excessive slippage",
        "* `minimum_token_1_amount` -  Minimum amount of token 1 to receive, prevents excessive slippage",
        ""
      ],
      "discriminator": [
        183,
        18,
        70,
        156,
        148,
        109,
        161,
        34
      ],
      "accounts": [
        {
          "name": "owner",
          "docs": [
            "Pays to mint the position"
          ],
          "signer": true
        },
        {
          "name": "authority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  95,
                  97,
                  110,
                  100,
                  95,
                  108,
                  112,
                  95,
                  109,
                  105,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  95,
                  115,
                  101,
                  101,
                  100
                ]
              }
            ]
          }
        },
        {
          "name": "poolState",
          "docs": [
            "Pool state account"
          ],
          "writable": true
        },
        {
          "name": "ownerLpToken",
          "docs": [
            "Owner lp token account"
          ],
          "writable": true
        },
        {
          "name": "token0Account",
          "docs": [
            "The token account for receive token_0,"
          ],
          "writable": true
        },
        {
          "name": "token1Account",
          "docs": [
            "The token account for receive token_1"
          ],
          "writable": true
        },
        {
          "name": "token0Vault",
          "docs": [
            "The address that holds pool tokens for token_0"
          ],
          "writable": true
        },
        {
          "name": "token1Vault",
          "docs": [
            "The address that holds pool tokens for token_1"
          ],
          "writable": true
        },
        {
          "name": "tokenProgram",
          "docs": [
            "token Program"
          ],
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "tokenProgram2022",
          "docs": [
            "Token program 2022"
          ],
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "vault0Mint",
          "docs": [
            "The mint of token_0 vault"
          ]
        },
        {
          "name": "vault1Mint",
          "docs": [
            "The mint of token_1 vault"
          ]
        },
        {
          "name": "lpMint",
          "docs": [
            "Pool lp token mint"
          ],
          "writable": true
        },
        {
          "name": "memoProgram",
          "docs": [
            "memo program"
          ],
          "address": "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
        }
      ],
      "args": [
        {
          "name": "lpTokenAmount",
          "type": "u64"
        },
        {
          "name": "minimumToken0Amount",
          "type": "u64"
        },
        {
          "name": "minimumToken1Amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "ammConfig",
      "discriminator": [
        218,
        244,
        33,
        104,
        203,
        203,
        43,
        111
      ]
    },
    {
      "name": "observationState",
      "discriminator": [
        122,
        174,
        197,
        53,
        129,
        9,
        165,
        132
      ]
    },
    {
      "name": "poolState",
      "discriminator": [
        247,
        237,
        227,
        245,
        215,
        195,
        222,
        70
      ]
    }
  ],
  "events": [
    {
      "name": "lpChangeEvent",
      "discriminator": [
        121,
        163,
        205,
        201,
        57,
        218,
        117,
        60
      ]
    },
    {
      "name": "swapEvent",
      "discriminator": [
        64,
        198,
        205,
        232,
        38,
        8,
        113,
        226
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "notApproved",
      "msg": "Not approved"
    },
    {
      "code": 6001,
      "name": "invalidOwner",
      "msg": "Input account owner is not the program address"
    },
    {
      "code": 6002,
      "name": "emptySupply",
      "msg": "Input token account empty"
    },
    {
      "code": 6003,
      "name": "invalidInput",
      "msg": "invalidInput"
    },
    {
      "code": 6004,
      "name": "incorrectLpMint",
      "msg": "Address of the provided lp token mint is incorrect"
    },
    {
      "code": 6005,
      "name": "exceededSlippage",
      "msg": "Exceeds desired slippage limit"
    },
    {
      "code": 6006,
      "name": "zeroTradingTokens",
      "msg": "Given pool token amount results in zero trading tokens"
    },
    {
      "code": 6007,
      "name": "notSupportMint",
      "msg": "Not support token_2022 mint extension"
    },
    {
      "code": 6008,
      "name": "invalidVault",
      "msg": "invaild vault"
    },
    {
      "code": 6009,
      "name": "initLpAmountTooLess",
      "msg": "Init lp amount is too less(Because 100 amount lp will be locked)"
    },
    {
      "code": 6010,
      "name": "transferFeeCalculateNotMatch",
      "msg": "TransferFee calculate not match"
    }
  ],
  "types": [
    {
      "name": "ammConfig",
      "docs": [
        "Holds the current owner of the factory"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "docs": [
              "Bump to identify PDA"
            ],
            "type": "u8"
          },
          {
            "name": "disableCreatePool",
            "docs": [
              "Status to control if new pool can be create"
            ],
            "type": "bool"
          },
          {
            "name": "index",
            "docs": [
              "Config index"
            ],
            "type": "u16"
          },
          {
            "name": "tradeFeeRate",
            "docs": [
              "The trade fee, denominated in hundredths of a bip (10^-6)"
            ],
            "type": "u64"
          },
          {
            "name": "protocolFeeRate",
            "docs": [
              "The protocol fee"
            ],
            "type": "u64"
          },
          {
            "name": "fundFeeRate",
            "docs": [
              "The fund fee, denominated in hundredths of a bip (10^-6)"
            ],
            "type": "u64"
          },
          {
            "name": "createPoolFee",
            "docs": [
              "Fee for create a new pool"
            ],
            "type": "u64"
          },
          {
            "name": "protocolOwner",
            "docs": [
              "Address of the protocol fee owner"
            ],
            "type": "pubkey"
          },
          {
            "name": "fundOwner",
            "docs": [
              "Address of the fund fee owner"
            ],
            "type": "pubkey"
          },
          {
            "name": "padding",
            "docs": [
              "padding"
            ],
            "type": {
              "array": [
                "u64",
                16
              ]
            }
          }
        ]
      }
    },
    {
      "name": "lpChangeEvent",
      "docs": [
        "Emitted when deposit and withdraw"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "poolId",
            "type": "pubkey"
          },
          {
            "name": "lpAmountBefore",
            "type": "u64"
          },
          {
            "name": "token0VaultBefore",
            "docs": [
              "pool vault sub trade fees"
            ],
            "type": "u64"
          },
          {
            "name": "token1VaultBefore",
            "docs": [
              "pool vault sub trade fees"
            ],
            "type": "u64"
          },
          {
            "name": "token0Amount",
            "docs": [
              "calculate result without transfer fee"
            ],
            "type": "u64"
          },
          {
            "name": "token1Amount",
            "docs": [
              "calculate result without transfer fee"
            ],
            "type": "u64"
          },
          {
            "name": "token0TransferFee",
            "type": "u64"
          },
          {
            "name": "token1TransferFee",
            "type": "u64"
          },
          {
            "name": "changeType",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "observation",
      "docs": [
        "The element of observations in ObservationState"
      ],
      "serialization": "bytemuckunsafe",
      "repr": {
        "kind": "c",
        "packed": true
      },
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "blockTimestamp",
            "docs": [
              "The block timestamp of the observation"
            ],
            "type": "u64"
          },
          {
            "name": "cumulativeToken0PriceX32",
            "docs": [
              "the cumulative of token0 price during the duration time, Q32.32, the remaining 64 bit for overflow"
            ],
            "type": "u128"
          },
          {
            "name": "cumulativeToken1PriceX32",
            "docs": [
              "the cumulative of token1 price during the duration time, Q32.32, the remaining 64 bit for overflow"
            ],
            "type": "u128"
          }
        ]
      }
    },
    {
      "name": "observationState",
      "serialization": "bytemuckunsafe",
      "repr": {
        "kind": "c",
        "packed": true
      },
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "initialized",
            "docs": [
              "Whether the ObservationState is initialized"
            ],
            "type": "bool"
          },
          {
            "name": "observationIndex",
            "docs": [
              "the most-recently updated index of the observations array"
            ],
            "type": "u16"
          },
          {
            "name": "poolId",
            "type": "pubkey"
          },
          {
            "name": "observations",
            "docs": [
              "observation array"
            ],
            "type": {
              "array": [
                {
                  "defined": {
                    "name": "observation"
                  }
                },
                100
              ]
            }
          },
          {
            "name": "padding",
            "docs": [
              "padding for feature update"
            ],
            "type": {
              "array": [
                "u64",
                4
              ]
            }
          }
        ]
      }
    },
    {
      "name": "poolState",
      "serialization": "bytemuckunsafe",
      "repr": {
        "kind": "c",
        "packed": true
      },
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "ammConfig",
            "docs": [
              "Which config the pool belongs"
            ],
            "type": "pubkey"
          },
          {
            "name": "poolCreator",
            "docs": [
              "pool creator"
            ],
            "type": "pubkey"
          },
          {
            "name": "token0Vault",
            "docs": [
              "Token A"
            ],
            "type": "pubkey"
          },
          {
            "name": "token1Vault",
            "docs": [
              "Token B"
            ],
            "type": "pubkey"
          },
          {
            "name": "lpMint",
            "docs": [
              "Pool tokens are issued when A or B tokens are deposited.",
              "Pool tokens can be withdrawn back to the original A or B token."
            ],
            "type": "pubkey"
          },
          {
            "name": "token0Mint",
            "docs": [
              "Mint information for token A"
            ],
            "type": "pubkey"
          },
          {
            "name": "token1Mint",
            "docs": [
              "Mint information for token B"
            ],
            "type": "pubkey"
          },
          {
            "name": "token0Program",
            "docs": [
              "token_0 program"
            ],
            "type": "pubkey"
          },
          {
            "name": "token1Program",
            "docs": [
              "token_1 program"
            ],
            "type": "pubkey"
          },
          {
            "name": "observationKey",
            "docs": [
              "observation account to store oracle data"
            ],
            "type": "pubkey"
          },
          {
            "name": "authBump",
            "type": "u8"
          },
          {
            "name": "status",
            "docs": [
              "Bitwise representation of the state of the pool",
              "bit0, 1: disable deposit(value is 1), 0: normal",
              "bit1, 1: disable withdraw(value is 2), 0: normal",
              "bit2, 1: disable swap(value is 4), 0: normal"
            ],
            "type": "u8"
          },
          {
            "name": "lpMintDecimals",
            "type": "u8"
          },
          {
            "name": "mint0Decimals",
            "docs": [
              "mint0 and mint1 decimals"
            ],
            "type": "u8"
          },
          {
            "name": "mint1Decimals",
            "type": "u8"
          },
          {
            "name": "lpSupply",
            "docs": [
              "True circulating supply without burns and lock ups"
            ],
            "type": "u64"
          },
          {
            "name": "protocolFeesToken0",
            "docs": [
              "The amounts of token_0 and token_1 that are owed to the liquidity provider."
            ],
            "type": "u64"
          },
          {
            "name": "protocolFeesToken1",
            "type": "u64"
          },
          {
            "name": "fundFeesToken0",
            "type": "u64"
          },
          {
            "name": "fundFeesToken1",
            "type": "u64"
          },
          {
            "name": "openTime",
            "docs": [
              "The timestamp allowed for swap in the pool."
            ],
            "type": "u64"
          },
          {
            "name": "recentEpoch",
            "docs": [
              "recent epoch"
            ],
            "type": "u64"
          },
          {
            "name": "padding",
            "docs": [
              "padding for future updates"
            ],
            "type": {
              "array": [
                "u64",
                31
              ]
            }
          }
        ]
      }
    },
    {
      "name": "swapEvent",
      "docs": [
        "Emitted when swap"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "poolId",
            "type": "pubkey"
          },
          {
            "name": "inputVaultBefore",
            "docs": [
              "pool vault sub trade fees"
            ],
            "type": "u64"
          },
          {
            "name": "outputVaultBefore",
            "docs": [
              "pool vault sub trade fees"
            ],
            "type": "u64"
          },
          {
            "name": "inputAmount",
            "docs": [
              "calculate result without transfer fee"
            ],
            "type": "u64"
          },
          {
            "name": "outputAmount",
            "docs": [
              "calculate result without transfer fee"
            ],
            "type": "u64"
          },
          {
            "name": "inputTransferFee",
            "type": "u64"
          },
          {
            "name": "outputTransferFee",
            "type": "u64"
          },
          {
            "name": "baseInput",
            "type": "bool"
          }
        ]
      }
    }
  ]
};
