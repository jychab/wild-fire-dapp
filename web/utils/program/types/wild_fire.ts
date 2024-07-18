/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/wild_fire.json`.
 */
export type WildFire = {
  address: 'J1HDuTjmb4S3X3uapPT68vWY8FzJhzCMNERKajs6GNNi';
  metadata: {
    name: 'wildFire';
    version: '0.1.0';
    spec: '0.1.0';
    description: 'Created with Anchor';
  };
  instructions: [
    {
      name: 'changeAdmin';
      discriminator: [193, 151, 203, 161, 200, 202, 32, 146];
      accounts: [
        {
          name: 'payer';
          writable: true;
          signer: true;
        },
        {
          name: 'poolState';
          writable: true;
        },
        {
          name: 'newAdminMint';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [109, 105, 110, 116];
              },
              {
                kind: 'arg';
                path: 'newAdmin';
              }
            ];
          };
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
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
          name: 'newAdmin';
          type: 'pubkey';
        }
      ];
    },
    {
      name: 'changeDistributor';
      discriminator: [165, 66, 159, 81, 14, 26, 77, 145];
      accounts: [
        {
          name: 'payer';
          writable: true;
          signer: true;
        },
        {
          name: 'poolState';
          writable: true;
        }
      ];
      args: [
        {
          name: 'newDistributor';
          type: 'pubkey';
        }
      ];
    },
    {
      name: 'changePoolConfig';
      discriminator: [209, 105, 144, 240, 5, 149, 98, 243];
      accounts: [
        {
          name: 'payer';
          writable: true;
          signer: true;
          address: 'G6kBnedts6uAivtY72ToaFHBs1UVbT9udiXmQZgMEjoF';
        },
        {
          name: 'poolState';
          writable: true;
        },
        {
          name: 'ammConfig';
          docs: ['Amm config account to be changed'];
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
      name: 'changeTransferFee';
      discriminator: [80, 16, 175, 186, 185, 22, 46, 194];
      accounts: [
        {
          name: 'payer';
          writable: true;
          signer: true;
        },
        {
          name: 'poolState';
        },
        {
          name: 'mint';
          writable: true;
        },
        {
          name: 'tokenProgramMint';
          address: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
        }
      ];
      args: [
        {
          name: 'feeBasisPts';
          type: 'u16';
        },
        {
          name: 'maxFee';
          type: 'u64';
        }
      ];
    },
    {
      name: 'changeVerifiedStatus';
      discriminator: [84, 158, 113, 105, 220, 157, 204, 173];
      accounts: [
        {
          name: 'payer';
          writable: true;
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
          name: 'verified';
          type: 'bool';
        }
      ];
    },
    {
      name: 'closeAccount';
      discriminator: [125, 255, 149, 14, 110, 34, 72, 24];
      accounts: [
        {
          name: 'payer';
          writable: true;
          signer: true;
        },
        {
          name: 'poolState';
          writable: true;
        },
        {
          name: 'mint';
          writable: true;
        }
      ];
      args: [];
    },
    {
      name: 'collectFee';
      discriminator: [60, 173, 247, 103, 4, 93, 130, 48];
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
          name: 'tokenWsolVault';
          docs: ['The address that holds pool tokens for token_1'];
          writable: true;
        },
        {
          name: 'vaultMint';
          docs: ['The mint of token_0 vault'];
        },
        {
          name: 'vaultWsolMint';
          docs: ['The mint of token_1 vault'];
          address: 'So11111111111111111111111111111111111111112';
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
          name: 'recipientTokenWsolAccount';
          docs: ['The address that receives the collected token_1 fund fees'];
          writable: true;
        },
        {
          name: 'protocolTokenWsolAccount';
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
                path: 'vaultWsolMint';
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
        }
      ];
    },
    {
      name: 'createMint';
      discriminator: [69, 44, 215, 132, 253, 214, 41, 45];
      accounts: [
        {
          name: 'payer';
          writable: true;
          signer: true;
        },
        {
          name: 'admin';
          signer: true;
        },
        {
          name: 'mint';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [109, 105, 110, 116];
              },
              {
                kind: 'account';
                path: 'admin';
              }
            ];
          };
        },
        {
          name: 'poolState';
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
          name: 'tokenProgramMint';
          address: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
        },
        {
          name: 'associatedTokenProgram';
          address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
        {
          name: 'rent';
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
          name: 'args';
          type: {
            defined: {
              name: 'createMintArgs';
            };
          };
        }
      ];
    },
    {
      name: 'createMintMetadata';
      discriminator: [13, 70, 168, 41, 250, 100, 148, 90];
      accounts: [
        {
          name: 'payer';
          writable: true;
          signer: true;
        },
        {
          name: 'admin';
          signer: true;
        },
        {
          name: 'mint';
          writable: true;
        },
        {
          name: 'poolState';
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
          name: 'tokenProgramMint';
          address: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        }
      ];
      args: [
        {
          name: 'lamports';
          type: 'u64';
        },
        {
          name: 'name';
          type: 'string';
        },
        {
          name: 'symbol';
          type: 'string';
        },
        {
          name: 'uri';
          type: 'string';
        },
        {
          name: 'field';
          type: {
            option: 'string';
          };
        },
        {
          name: 'value';
          type: {
            option: 'string';
          };
        }
      ];
    },
    {
      name: 'createOracle';
      discriminator: [51, 172, 229, 240, 44, 41, 104, 9];
      accounts: [
        {
          name: 'payer';
          writable: true;
          signer: true;
        },
        {
          name: 'poolState';
          docs: ['Initialize an account to store the pool state'];
          writable: true;
        },
        {
          name: 'observationState';
          docs: ['an account to store oracle observations'];
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [111, 98, 115, 101, 114, 118, 97, 116, 105, 111, 110];
              },
              {
                kind: 'account';
                path: 'poolState';
              }
            ];
          };
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        }
      ];
      args: [];
    },
    {
      name: 'distributeFees';
      discriminator: [120, 56, 27, 7, 53, 176, 113, 186];
      accounts: [
        {
          name: 'payer';
          writable: true;
          signer: true;
        },
        {
          name: 'mint';
        },
        {
          name: 'poolState';
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
          name: 'distributorMintTokenAccount';
          writable: true;
        },
        {
          name: 'destinationWallet';
        },
        {
          name: 'destinationMintTokenAccount';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'destinationWallet';
              },
              {
                kind: 'account';
                path: 'tokenProgramMint';
              },
              {
                kind: 'account';
                path: 'mint';
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
          name: 'tokenProgramMint';
          address: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
        },
        {
          name: 'associatedTokenProgram';
          address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
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
          name: 'amount';
          type: 'u64';
        }
      ];
    },
    {
      name: 'initializeMint';
      discriminator: [209, 42, 195, 4, 129, 85, 209, 44];
      accounts: [
        {
          name: 'payer';
          writable: true;
          signer: true;
        },
        {
          name: 'admin';
          signer: true;
        },
        {
          name: 'ammConfig';
          docs: ['Which config the pool belongs to.'];
        },
        {
          name: 'mint';
          writable: true;
        },
        {
          name: 'tokenMintVault';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'poolState';
              },
              {
                kind: 'account';
                path: 'tokenProgramMint';
              },
              {
                kind: 'account';
                path: 'mint';
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
          name: 'adminMintTokenAccount';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'admin';
              },
              {
                kind: 'account';
                path: 'tokenProgramMint';
              },
              {
                kind: 'account';
                path: 'mint';
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
          name: 'poolState';
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
          name: 'tokenProgramMint';
          address: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
        },
        {
          name: 'tokenProgram';
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        },
        {
          name: 'associatedTokenProgram';
          address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
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
          name: 'amountToCurve';
          type: 'u64';
        },
        {
          name: 'amountToCreator';
          type: 'u64';
        },
        {
          name: 'offset';
          type: 'u64';
        }
      ];
    },
    {
      name: 'removeKeyFromMetadata';
      discriminator: [212, 198, 93, 174, 2, 22, 50, 81];
      accounts: [
        {
          name: 'payer';
          writable: true;
          signer: true;
        },
        {
          name: 'mint';
          writable: true;
        },
        {
          name: 'poolState';
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
          name: 'tokenProgramMint';
          address: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        }
      ];
      args: [
        {
          name: 'field';
          type: 'string';
        }
      ];
    },
    {
      name: 'setToImmutable';
      discriminator: [45, 78, 226, 162, 241, 210, 225, 177];
      accounts: [
        {
          name: 'payer';
          writable: true;
          signer: true;
        },
        {
          name: 'poolState';
          writable: true;
        },
        {
          name: 'mint';
          writable: true;
        },
        {
          name: 'tokenProgramMint';
          address: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
        }
      ];
      args: [];
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
          writable: true;
          signer: true;
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
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'poolState';
              },
              {
                kind: 'account';
                path: 'inputTokenProgram';
              },
              {
                kind: 'account';
                path: 'inputTokenMint';
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
          name: 'outputVault';
          docs: ['The vault token account for output token'];
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'poolState';
              },
              {
                kind: 'account';
                path: 'outputTokenProgram';
              },
              {
                kind: 'account';
                path: 'outputTokenMint';
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
          name: 'associatedTokenProgram';
          address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
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
          writable: true;
          signer: true;
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
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'poolState';
              },
              {
                kind: 'account';
                path: 'inputTokenProgram';
              },
              {
                kind: 'account';
                path: 'inputTokenMint';
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
          name: 'outputVault';
          docs: ['The vault token account for output token'];
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'poolState';
              },
              {
                kind: 'account';
                path: 'outputTokenProgram';
              },
              {
                kind: 'account';
                path: 'outputTokenMint';
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
          name: 'associatedTokenProgram';
          address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
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
      name: 'updateMintMetadata';
      discriminator: [46, 244, 2, 123, 67, 219, 22, 121];
      accounts: [
        {
          name: 'payer';
          writable: true;
          signer: true;
        },
        {
          name: 'admin';
          signer: true;
        },
        {
          name: 'mint';
          writable: true;
        },
        {
          name: 'poolState';
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
          name: 'tokenProgramMint';
          address: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        }
      ];
      args: [
        {
          name: 'field';
          type: 'string';
        },
        {
          name: 'value';
          type: 'string';
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
    },
    {
      name: 'withdrawFees';
      discriminator: [198, 212, 171, 109, 144, 215, 174, 89];
      accounts: [
        {
          name: 'payer';
          writable: true;
          signer: true;
        },
        {
          name: 'mint';
          writable: true;
        },
        {
          name: 'poolState';
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
          name: 'distributorMintTokenAccount';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'payer';
              },
              {
                kind: 'account';
                path: 'tokenProgramMint';
              },
              {
                kind: 'account';
                path: 'mint';
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
          name: 'tokenProgramMint';
          address: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
        },
        {
          name: 'associatedTokenProgram';
          address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
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
    }
  ];
  accounts: [
    {
      name: 'ammConfig';
      discriminator: [218, 244, 33, 104, 203, 203, 43, 111];
    },
    {
      name: 'observationState';
      discriminator: [122, 174, 197, 53, 129, 9, 165, 132];
    },
    {
      name: 'poolState';
      discriminator: [247, 237, 227, 245, 215, 195, 222, 70];
    }
  ];
  events: [
    {
      name: 'changeAdmin';
      discriminator: [231, 73, 8, 168, 43, 125, 226, 99];
    },
    {
      name: 'collectFees';
      discriminator: [68, 188, 11, 82, 41, 135, 51, 12];
    },
    {
      name: 'createMint';
      discriminator: [174, 206, 148, 3, 212, 221, 222, 175];
    },
    {
      name: 'distributeFees';
      discriminator: [95, 195, 209, 77, 107, 12, 209, 65];
    },
    {
      name: 'initializeMint';
      discriminator: [227, 163, 208, 22, 174, 191, 7, 162];
    },
    {
      name: 'swapEvent';
      discriminator: [64, 198, 205, 232, 38, 8, 113, 226];
    },
    {
      name: 'withdrawFees';
      discriminator: [17, 172, 54, 97, 45, 29, 0, 76];
    }
  ];
  errors: [
    {
      code: 6000;
      name: 'incorrectMint';
      msg: "Mint account doesn't match";
    },
    {
      code: 6001;
      name: 'mintIsImmutable';
      msg: 'Mint account can no longer be changed';
    },
    {
      code: 6002;
      name: 'mintIsNotZero';
      msg: 'Mint supply that is non zero is not allowed to close this account';
    },
    {
      code: 6003;
      name: 'notApproved';
      msg: 'Not approved';
    },
    {
      code: 6004;
      name: 'invalidOwner';
      msg: 'Input account owner is not the program address';
    },
    {
      code: 6005;
      name: 'emptySupply';
      msg: 'Input token account empty';
    },
    {
      code: 6006;
      name: 'invalidInput';
      msg: 'invalidInput';
    },
    {
      code: 6007;
      name: 'exceededSlippage';
      msg: 'Exceeds desired slippage limit';
    },
    {
      code: 6008;
      name: 'zeroTradingTokens';
      msg: 'Given pool token amount results in zero trading tokens';
    },
    {
      code: 6009;
      name: 'notSupportMint';
      msg: 'Not support token_2022 mint extension';
    },
    {
      code: 6010;
      name: 'invalidVault';
      msg: 'invaild vault';
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
            name: 'protocolOwner';
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
      name: 'changeAdmin';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'mint';
            type: 'pubkey';
          },
          {
            name: 'newAdmin';
            type: 'pubkey';
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
            name: 'creatorSolFees';
            type: 'u64';
          },
          {
            name: 'protocolMintFees';
            type: 'u64';
          },
          {
            name: 'protocolSolFees';
            type: 'u64';
          }
        ];
      };
    },
    {
      name: 'createMint';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'mint';
            type: 'pubkey';
          },
          {
            name: 'distributor';
            type: 'pubkey';
          },
          {
            name: 'decimal';
            type: 'u8';
          }
        ];
      };
    },
    {
      name: 'createMintArgs';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'distributor';
            type: 'pubkey';
          },
          {
            name: 'transferFeeArgs';
            type: {
              defined: {
                name: 'transferFeeArgs';
              };
            };
          },
          {
            name: 'decimal';
            type: 'u8';
          }
        ];
      };
    },
    {
      name: 'distributeFees';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'mint';
            type: 'pubkey';
          },
          {
            name: 'amount';
            type: 'u64';
          },
          {
            name: 'to';
            type: 'pubkey';
          }
        ];
      };
    },
    {
      name: 'initializeMint';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'mint';
            type: 'pubkey';
          },
          {
            name: 'amountCurve';
            type: 'u64';
          },
          {
            name: 'amountCreator';
            type: 'u64';
          },
          {
            name: 'poolState';
            type: 'pubkey';
          },
          {
            name: 'offset';
            type: 'u64';
          }
        ];
      };
    },
    {
      name: 'observation';
      docs: ['The element of observations in ObservationState'];
      serialization: 'bytemuckunsafe';
      repr: {
        kind: 'rust';
        packed: true;
      };
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'blockTimestamp';
            docs: ['The block timestamp of the observation'];
            type: 'u64';
          },
          {
            name: 'cumulativeToken0PriceX32';
            docs: [
              'the cumulative of token0 price during the duration time, Q32.32, the remaining 64 bit for overflow'
            ];
            type: 'u128';
          },
          {
            name: 'cumulativeToken1PriceX32';
            docs: [
              'the cumulative of token1 price during the duration time, Q32.32, the remaining 64 bit for overflow'
            ];
            type: 'u128';
          }
        ];
      };
    },
    {
      name: 'observationState';
      serialization: 'bytemuckunsafe';
      repr: {
        kind: 'rust';
        packed: true;
      };
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'initialized';
            docs: ['Whether the ObservationState is initialized'];
            type: 'bool';
          },
          {
            name: 'observationIndex';
            docs: ['the most-recently updated index of the observations array'];
            type: 'u16';
          },
          {
            name: 'poolId';
            type: 'pubkey';
          },
          {
            name: 'observations';
            docs: ['observation array'];
            type: {
              array: [
                {
                  defined: {
                    name: 'observation';
                  };
                },
                100
              ];
            };
          },
          {
            name: 'padding';
            docs: ['padding for feature update'];
            type: {
              array: ['u64', 4];
            };
          }
        ];
      };
    },
    {
      name: 'poolState';
      serialization: 'bytemuck';
      repr: {
        kind: 'c';
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
            name: 'admin';
            docs: ['pool creator'];
            type: 'pubkey';
          },
          {
            name: 'mint';
            docs: ['Mint information'];
            type: 'pubkey';
          },
          {
            name: 'observationKey';
            docs: ['observation account to store oracle data'];
            type: 'pubkey';
          },
          {
            name: 'distributor';
            docs: [
              'distributor to handle the withdrawing and distirbuting of transfer fees'
            ];
            type: 'pubkey';
          },
          {
            name: 'padding';
            type: {
              array: ['u8', 4];
            };
          },
          {
            name: 'verified';
            type: 'u8';
          },
          {
            name: 'bump';
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
            name: 'mutable';
            docs: ['state to check if token mint metadata is editable'];
            type: 'u8';
          },
          {
            name: 'protocolFeesTokenMint';
            docs: [
              'The amounts of token_0 and token_1 that are owed to the protocol.'
            ];
            type: 'u64';
          },
          {
            name: 'protocolFeesTokenWsol';
            type: 'u64';
          },
          {
            name: 'creatorFeesTokenMint';
            docs: [
              'The amounts of token_0 and token_1 that are owed to the creator.'
            ];
            type: 'u64';
          },
          {
            name: 'creatorFeesTokenWsol';
            type: 'u64';
          },
          {
            name: 'offset';
            docs: ['offset for each token'];
            type: 'u64';
          }
        ];
      };
    },
    {
      name: 'swapEvent';
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
            docs: ['pool vault sub trade fees'];
            type: 'u128';
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
    },
    {
      name: 'transferFeeArgs';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'feeBasisPts';
            type: 'u16';
          },
          {
            name: 'maxFee';
            type: 'u64';
          }
        ];
      };
    },
    {
      name: 'withdrawFees';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'mint';
            type: 'pubkey';
          },
          {
            name: 'amount';
            type: 'u64';
          }
        ];
      };
    }
  ];
};
