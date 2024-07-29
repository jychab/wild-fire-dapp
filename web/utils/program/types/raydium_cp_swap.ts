/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/raydium_cp_swap.json`.
 */
export type RaydiumCpSwap = {
  address: 'PkNZ3YjzrtxV16wdfcZPVKaA71dp3kAdhyHb72L2X4k';
  metadata: {
    name: 'raydiumCpSwap';
    version: '0.1.0';
    spec: '0.1.0';
    description: 'Created with Anchor';
  };
  instructions: [
    {
      name: 'collectFees';
      docs: [
        'Collect the fund fee accrued to the pool',
        '',
        '# Arguments',
        '',
        '* `ctx` - The context of accounts',
        '* `amount_0_requested` - The maximum amount of token_0 to send, can be 0 to collect fees in only token_1',
        '* `amount_1_requested` - The maximum amount of token_1 to send, can be 0 to collect fees in only token_0',
        ''
      ];
      discriminator: [164, 152, 207, 99, 30, 186, 19, 182];
      accounts: [
        {
          name: 'payer';
          docs: ['Only admin or fund_owner can collect fee now'];
          writable: true;
          signer: true;
        },
        {
          name: 'poolCreator';
        },
        {
          name: 'protocolOwner';
          address: 'G6kBnedts6uAivtY72ToaFHBs1UVbT9udiXmQZgMEjoF';
        },
        {
          name: 'authority';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
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
                ];
              }
            ];
          };
        },
        {
          name: 'poolState';
          docs: ['Pool state stores accumulated protocol fee amount'];
          writable: true;
        },
        {
          name: 'ammConfig';
          docs: ['Amm config account stores fund_owner'];
        },
        {
          name: 'tokenMintVault';
          docs: ['The address that holds pool tokens for token_0'];
          writable: true;
        },
        {
          name: 'tokenUsdcVault';
          docs: ['The address that holds pool tokens for token_1'];
          writable: true;
        },
        {
          name: 'vaultMint';
          docs: ['The mint of token_0 vault'];
        },
        {
          name: 'vaultUsdcMint';
          docs: ['The mint of token_1 vault'];
          address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
        },
        {
          name: 'recipientTokenMintAccount';
          docs: ['The address that receives the collected token_0 fund fees'];
          writable: true;
        },
        {
          name: 'protocolTokenMintAccount';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'protocolOwner';
              },
              {
                kind: 'account';
                path: 'tokenProgram2022';
              },
              {
                kind: 'account';
                path: 'vaultMint';
              }
            ];
            program: {
              kind: 'const';
              value: [
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
              ];
            };
          };
        },
        {
          name: 'recipientTokenUsdcAccount';
          docs: ['The address that receives the collected token_1 fund fees'];
          writable: true;
        },
        {
          name: 'protocolTokenUsdcAccount';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'protocolOwner';
              },
              {
                kind: 'account';
                path: 'tokenProgram';
              },
              {
                kind: 'account';
                path: 'vaultUsdcMint';
              }
            ];
            program: {
              kind: 'const';
              value: [
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
              ];
            };
          };
        },
        {
          name: 'tokenProgram';
          docs: ['The SPL program to perform token transfers'];
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        },
        {
          name: 'tokenProgram2022';
          docs: ['The SPL program 2022 to perform token transfers'];
          address: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
        {
          name: 'associatedTokenProgram';
          address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
        },
        {
          name: 'eventAuthority';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ];
              }
            ];
          };
        },
        {
          name: 'program';
        }
      ];
      args: [];
    },
    {
      name: 'createAmmConfig';
      docs: [
        '# Arguments',
        '',
        '* `ctx`- The accounts needed by instruction.',
        '* `index` - The index of amm config, there may be multiple config.',
        '* `trade_fee_rate` - Trade fee rate, can be changed.',
        '* `protocol_fee_rate` - The rate of protocol fee within tarde fee.',
        '* `fund_fee_rate` - The rate of fund fee within tarde fee.',
        ''
      ];
      discriminator: [137, 52, 237, 212, 215, 117, 108, 104];
      accounts: [
        {
          name: 'owner';
          docs: ['Address to be set as protocol owner.'];
          writable: true;
          signer: true;
          address: 'G6kBnedts6uAivtY72ToaFHBs1UVbT9udiXmQZgMEjoF';
        },
        {
          name: 'ammConfig';
          docs: [
            'Initialize config state account to store protocol owner address and fee rates.'
          ];
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [97, 109, 109, 95, 99, 111, 110, 102, 105, 103];
              },
              {
                kind: 'arg';
                path: 'index';
              }
            ];
          };
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        }
      ];
      args: [
        {
          name: 'index';
          type: 'u16';
        },
        {
          name: 'tradeFeeRate';
          type: 'u64';
        },
        {
          name: 'protocolFeeRate';
          type: 'u64';
        },
        {
          name: 'protocolOwner';
          type: 'pubkey';
        }
      ];
    },
    {
      name: 'initialize';
      docs: [
        'Creates a pool for the given token pair and the initial price',
        '',
        '# Arguments',
        '',
        '* `ctx`- The context of accounts',
        '* `init_amount_0` - the initial amount_0 to deposit',
        '* `init_amount_1` - the initial amount_1 to deposit',
        '* `open_time` - the timestamp allowed for swap',
        ''
      ];
      discriminator: [175, 175, 109, 31, 13, 152, 155, 237];
      accounts: [
        {
          name: 'payer';
          writable: true;
          signer: true;
        },
        {
          name: 'creator';
          signer: true;
        },
        {
          name: 'ammConfig';
          docs: ['Which config the pool belongs to.'];
        },
        {
          name: 'authority';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
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
                ];
              }
            ];
          };
        },
        {
          name: 'poolState';
          docs: ['Initialize an account to store the pool state'];
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [112, 111, 111, 108];
              },
              {
                kind: 'account';
                path: 'mint';
              }
            ];
          };
        },
        {
          name: 'mint';
          docs: ['Token_0 mint, the key must smaller then token_1 mint.'];
        },
        {
          name: 'usdc';
          docs: ['Token_1 mint, the key must grater then token_0 mint.'];
          address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
        },
        {
          name: 'creatorTokenMint';
          docs: ['payer token0 account'];
          writable: true;
        },
        {
          name: 'creatorTokenUsdc';
          docs: ['creator token1 account'];
          writable: true;
        },
        {
          name: 'tokenMintVault';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [112, 111, 111, 108, 95, 118, 97, 117, 108, 116];
              },
              {
                kind: 'account';
                path: 'poolState';
              },
              {
                kind: 'account';
                path: 'mint';
              }
            ];
          };
        },
        {
          name: 'tokenUsdcVault';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [112, 111, 111, 108, 95, 118, 97, 117, 108, 116];
              },
              {
                kind: 'account';
                path: 'poolState';
              },
              {
                kind: 'account';
                path: 'usdc';
              }
            ];
          };
        },
        {
          name: 'tokenProgram';
          docs: [
            'an account to store oracle observations',
            'Program to create mint account and mint tokens'
          ];
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        },
        {
          name: 'mintTokenProgram';
          docs: ['Spl token program or token program 2022'];
        },
        {
          name: 'associatedTokenProgram';
          docs: ['Program to create an ATA for receiving position NFT'];
          address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
        },
        {
          name: 'systemProgram';
          docs: ['To create a new program account'];
          address: '11111111111111111111111111111111';
        },
        {
          name: 'rent';
          docs: ['Sysvar for program account'];
          address: 'SysvarRent111111111111111111111111111111111';
        },
        {
          name: 'eventAuthority';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ];
              }
            ];
          };
        },
        {
          name: 'program';
        }
      ];
      args: [
        {
          name: 'initAmount0';
          type: 'u64';
        },
        {
          name: 'initAmount1';
          type: 'u64';
        },
        {
          name: 'openTime';
          type: 'u64';
        }
      ];
    },
    {
      name: 'swapBaseInput';
      docs: [
        'Swap the tokens in the pool base input amount',
        '',
        '# Arguments',
        '',
        '* `ctx`- The context of accounts',
        '* `amount_in` -  input amount to transfer, output to DESTINATION is based on the exchange rate',
        '* `minimum_amount_out` -  Minimum amount of output token, prevents excessive slippage',
        ''
      ];
      discriminator: [143, 190, 90, 218, 196, 30, 51, 222];
      accounts: [
        {
          name: 'payer';
          docs: ['The user performing the swap'];
          signer: true;
        },
        {
          name: 'authority';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
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
                ];
              }
            ];
          };
        },
        {
          name: 'ammConfig';
          docs: ['The factory state to read protocol fees'];
        },
        {
          name: 'poolState';
          docs: [
            'The program account of the pool in which the swap will be performed'
          ];
          writable: true;
        },
        {
          name: 'inputTokenAccount';
          docs: ['The user token account for input token'];
          writable: true;
        },
        {
          name: 'outputTokenAccount';
          docs: ['The user token account for output token'];
          writable: true;
        },
        {
          name: 'inputVault';
          docs: ['The vault token account for input token'];
          writable: true;
        },
        {
          name: 'outputVault';
          docs: ['The vault token account for output token'];
          writable: true;
        },
        {
          name: 'inputTokenProgram';
          docs: ['SPL program for input token transfers'];
        },
        {
          name: 'outputTokenProgram';
          docs: ['SPL program for output token transfers'];
        },
        {
          name: 'inputTokenMint';
          docs: ['The mint of input token'];
        },
        {
          name: 'outputTokenMint';
          docs: ['The mint of output token'];
        },
        {
          name: 'eventAuthority';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ];
              }
            ];
          };
        },
        {
          name: 'program';
        }
      ];
      args: [
        {
          name: 'amountIn';
          type: 'u64';
        },
        {
          name: 'minimumAmountOut';
          type: 'u64';
        }
      ];
    },
    {
      name: 'swapBaseOutput';
      docs: [
        'Swap the tokens in the pool base output amount',
        '',
        '# Arguments',
        '',
        '* `ctx`- The context of accounts',
        '* `max_amount_in` -  input amount prevents excessive slippage',
        '* `amount_out` -  amount of output token',
        ''
      ];
      discriminator: [55, 217, 98, 86, 163, 74, 180, 173];
      accounts: [
        {
          name: 'payer';
          docs: ['The user performing the swap'];
          signer: true;
        },
        {
          name: 'authority';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
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
                ];
              }
            ];
          };
        },
        {
          name: 'ammConfig';
          docs: ['The factory state to read protocol fees'];
        },
        {
          name: 'poolState';
          docs: [
            'The program account of the pool in which the swap will be performed'
          ];
          writable: true;
        },
        {
          name: 'inputTokenAccount';
          docs: ['The user token account for input token'];
          writable: true;
        },
        {
          name: 'outputTokenAccount';
          docs: ['The user token account for output token'];
          writable: true;
        },
        {
          name: 'inputVault';
          docs: ['The vault token account for input token'];
          writable: true;
        },
        {
          name: 'outputVault';
          docs: ['The vault token account for output token'];
          writable: true;
        },
        {
          name: 'inputTokenProgram';
          docs: ['SPL program for input token transfers'];
        },
        {
          name: 'outputTokenProgram';
          docs: ['SPL program for output token transfers'];
        },
        {
          name: 'inputTokenMint';
          docs: ['The mint of input token'];
        },
        {
          name: 'outputTokenMint';
          docs: ['The mint of output token'];
        },
        {
          name: 'eventAuthority';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ];
              }
            ];
          };
        },
        {
          name: 'program';
        }
      ];
      args: [
        {
          name: 'maxAmountIn';
          type: 'u64';
        },
        {
          name: 'amountOut';
          type: 'u64';
        }
      ];
    },
    {
      name: 'updateAmmConfig';
      docs: [
        'Updates the owner of the amm config',
        'Must be called by the current owner or admin',
        '',
        '# Arguments',
        '',
        '* `ctx`- The context of accounts',
        '* `trade_fee_rate`- The new trade fee rate of amm config, be set when `param` is 0',
        '* `protocol_fee_rate`- The new protocol fee rate of amm config, be set when `param` is 1',
        '* `fund_fee_rate`- The new fund fee rate of amm config, be set when `param` is 2',
        "* `new_owner`- The config's new owner, be set when `param` is 3",
        "* `new_fund_owner`- The config's new fund owner, be set when `param` is 4",
        '* `param`- The vaule can be 0 | 1 | 2 | 3 | 4, otherwise will report a error',
        ''
      ];
      discriminator: [49, 60, 174, 136, 154, 28, 116, 200];
      accounts: [
        {
          name: 'owner';
          docs: ['The amm config owner or admin'];
          signer: true;
          address: 'G6kBnedts6uAivtY72ToaFHBs1UVbT9udiXmQZgMEjoF';
        },
        {
          name: 'ammConfig';
          docs: ['Amm config account to be changed'];
          writable: true;
        }
      ];
      args: [
        {
          name: 'param';
          type: 'u8';
        },
        {
          name: 'value';
          type: 'u64';
        }
      ];
    },
    {
      name: 'updatePoolOffset';
      discriminator: [239, 50, 32, 14, 77, 74, 163, 137];
      accounts: [
        {
          name: 'authority';
          signer: true;
          address: 'G6kBnedts6uAivtY72ToaFHBs1UVbT9udiXmQZgMEjoF';
        },
        {
          name: 'poolState';
          writable: true;
        }
      ];
      args: [
        {
          name: 'offset';
          type: 'u64';
        }
      ];
    },
    {
      name: 'updatePoolStatus';
      docs: [
        'Update pool status for given vaule',
        '',
        '# Arguments',
        '',
        '* `ctx`- The context of accounts',
        '* `status` - The vaule of status',
        ''
      ];
      discriminator: [130, 87, 108, 6, 46, 224, 117, 123];
      accounts: [
        {
          name: 'authority';
          signer: true;
          address: 'G6kBnedts6uAivtY72ToaFHBs1UVbT9udiXmQZgMEjoF';
        },
        {
          name: 'poolState';
          writable: true;
        }
      ];
      args: [
        {
          name: 'status';
          type: 'u8';
        }
      ];
    }
  ];
  accounts: [
    {
      name: 'ammConfig';
      discriminator: [218, 244, 33, 104, 203, 203, 43, 111];
    },
    {
      name: 'poolState';
      discriminator: [247, 237, 227, 245, 215, 195, 222, 70];
    }
  ];
  events: [
    {
      name: 'collectFees';
      discriminator: [68, 188, 11, 82, 41, 135, 51, 12];
    },
    {
      name: 'initializePool';
      discriminator: [145, 104, 208, 79, 8, 159, 145, 240];
    },
    {
      name: 'swapPriceEvent';
      discriminator: [120, 100, 91, 83, 175, 75, 192, 102];
    }
  ];
  errors: [
    {
      code: 6000;
      name: 'notApproved';
      msg: 'Not approved';
    },
    {
      code: 6001;
      name: 'invalidOwner';
      msg: 'Input account owner is not the program address';
    },
    {
      code: 6002;
      name: 'emptySupply';
      msg: 'Input token account empty';
    },
    {
      code: 6003;
      name: 'invalidInput';
      msg: 'invalidInput';
    },
    {
      code: 6004;
      name: 'incorrectLpMint';
      msg: 'Address of the provided lp token mint is incorrect';
    },
    {
      code: 6005;
      name: 'exceededSlippage';
      msg: 'Exceeds desired slippage limit';
    },
    {
      code: 6006;
      name: 'zeroTradingTokens';
      msg: 'Given pool token amount results in zero trading tokens';
    },
    {
      code: 6007;
      name: 'notSupportMint';
      msg: 'Not support token_2022 mint extension';
    },
    {
      code: 6008;
      name: 'invalidVault';
      msg: 'invaild vault';
    },
    {
      code: 6009;
      name: 'initLpAmountTooLess';
      msg: 'Init lp amount is too less(Because 100 amount lp will be locked)';
    }
  ];
  types: [
    {
      name: 'ammConfig';
      docs: ['Holds the current owner of the factory'];
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'bump';
            docs: ['Bump to identify PDA'];
            type: 'u8';
          },
          {
            name: 'disableCreatePool';
            docs: ['Status to control if new pool can be create'];
            type: 'bool';
          },
          {
            name: 'index';
            docs: ['Config index'];
            type: 'u16';
          },
          {
            name: 'tradeFeeRate';
            docs: ['The trade fee, denominated in hundredths of a bip (10^-6)'];
            type: 'u64';
          },
          {
            name: 'protocolFeeRate';
            docs: ['The protocol fee'];
            type: 'u64';
          },
          {
            name: 'protocolFeeCollector';
            docs: ['Address of the protocol fee owner'];
            type: 'pubkey';
          },
          {
            name: 'padding';
            docs: ['padding'];
            type: {
              array: ['u64', 16];
            };
          }
        ];
      };
    },
    {
      name: 'collectFees';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'mint';
            type: 'pubkey';
          },
          {
            name: 'creatorMintFees';
            type: 'u64';
          },
          {
            name: 'creatorUsdcFees';
            type: 'u64';
          },
          {
            name: 'protocolMintFees';
            type: 'u64';
          },
          {
            name: 'protocolUsdcFees';
            type: 'u64';
          }
        ];
      };
    },
    {
      name: 'initializePool';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'mint';
            type: 'pubkey';
          },
          {
            name: 'mintAmount';
            type: 'u64';
          },
          {
            name: 'openTime';
            type: 'u64';
          },
          {
            name: 'poolCreator';
            type: 'pubkey';
          },
          {
            name: 'ammConfig';
            type: 'pubkey';
          },
          {
            name: 'offSet';
            type: 'u64';
          }
        ];
      };
    },
    {
      name: 'poolState';
      serialization: 'bytemuckunsafe';
      repr: {
        kind: 'rust';
        packed: true;
      };
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'ammConfig';
            docs: ['Which config the pool belongs'];
            type: 'pubkey';
          },
          {
            name: 'poolCreator';
            docs: ['pool creator'];
            type: 'pubkey';
          },
          {
            name: 'tokenMintVault';
            docs: ['Token A'];
            type: 'pubkey';
          },
          {
            name: 'tokenUsdcVault';
            docs: ['Token B'];
            type: 'pubkey';
          },
          {
            name: 'mint';
            docs: ['Mint information for token A'];
            type: 'pubkey';
          },
          {
            name: 'mintTokenProgram';
            docs: ['token_0 program'];
            type: 'pubkey';
          },
          {
            name: 'observationKey';
            docs: ['observation account to store oracle data'];
            type: 'pubkey';
          },
          {
            name: 'authBump';
            type: 'u8';
          },
          {
            name: 'status';
            docs: [
              'Bitwise representation of the state of the pool',
              'bit0, 1: disable deposit(vaule is 1), 0: normal',
              'bit1, 1: disable withdraw(vaule is 2), 0: normal',
              'bit2, 1: disable swap(vaule is 4), 0: normal'
            ];
            type: 'u8';
          },
          {
            name: 'mintDecimals';
            docs: ['mint0 and mint1 decimals'];
            type: 'u8';
          },
          {
            name: 'protocolFeesTokenMint';
            type: 'u64';
          },
          {
            name: 'protocolFeesTokenUsdc';
            type: 'u64';
          },
          {
            name: 'creatorFeesTokenMint';
            type: 'u64';
          },
          {
            name: 'creatorFeesTokenUsdc';
            type: 'u64';
          },
          {
            name: 'openTime';
            docs: ['The timestamp allowed for swap in the pool.'];
            type: 'u64';
          },
          {
            name: 'recentEpoch';
            docs: ['recent epoch'];
            type: 'u64';
          },
          {
            name: 'offSet';
            type: 'u64';
          },
          {
            name: 'padding';
            docs: ['padding for future updates'];
            type: {
              array: ['u64', 4];
            };
          }
        ];
      };
    },
    {
      name: 'swapPriceEvent';
      docs: ['Emitted when swap'];
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'timestamp';
            type: 'u64';
          },
          {
            name: 'mint';
            type: 'pubkey';
          },
          {
            name: 'price';
            type: 'u128';
          },
          {
            name: 'liquidityBefore';
            type: 'u64';
          },
          {
            name: 'liquidityAfter';
            type: 'u64';
          },
          {
            name: 'inputAmount';
            docs: ['cacluate result without transfer fee'];
            type: 'u64';
          },
          {
            name: 'outputAmount';
            docs: ['cacluate result without transfer fee'];
            type: 'u64';
          },
          {
            name: 'buy';
            type: 'bool';
          },
          {
            name: 'user';
            type: 'pubkey';
          }
        ];
      };
    }
  ];
};
