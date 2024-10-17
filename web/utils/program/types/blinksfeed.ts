/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/blinksfeed.json`.
 */
export type Blinksfeed = {
  address: 'EDZUd3KXWct3qZnCgBz6BSxoee22abojb1shEYZmKHH';
  metadata: {
    name: 'blinksfeed';
    version: '0.1.0';
    spec: '0.1.0';
    description: 'Created with Anchor';
  };
  instructions: [
    {
      name: 'buy';
      discriminator: [102, 6, 61, 18, 1, 218, 235, 234];
      accounts: [
        {
          name: 'dexConfigurationAccount';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
                  67,
                  117,
                  114,
                  118,
                  101,
                  67,
                  111,
                  110,
                  102,
                  105,
                  103,
                  117,
                  114,
                  97,
                  116,
                  105,
                  111,
                  110
                ];
              }
            ];
          };
        },
        {
          name: 'pool';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
                  108,
                  105,
                  113,
                  117,
                  105,
                  100,
                  105,
                  116,
                  121,
                  95,
                  112,
                  111,
                  111,
                  108
                ];
              },
              {
                kind: 'account';
                path: 'memberMint';
              }
            ];
          };
        },
        {
          name: 'poolSolVault';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
                  108,
                  105,
                  113,
                  117,
                  105,
                  100,
                  105,
                  116,
                  121,
                  95,
                  112,
                  111,
                  111,
                  108,
                  95,
                  115,
                  111,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ];
              },
              {
                kind: 'account';
                path: 'memberMint';
              }
            ];
          };
        },
        {
          name: 'memberMint';
        },
        {
          name: 'poolTokenAccount';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'pool';
              },
              {
                kind: 'const';
                value: [
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
                ];
              },
              {
                kind: 'account';
                path: 'memberMint';
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
          name: 'userTokenAccount';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'user';
              },
              {
                kind: 'const';
                value: [
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
                ];
              },
              {
                kind: 'account';
                path: 'memberMint';
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
          name: 'user';
          writable: true;
          signer: true;
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
        {
          name: 'tokenProgram';
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        },
        {
          name: 'associatedTokenProgram';
          address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
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
      name: 'collectFees';
      discriminator: [164, 152, 207, 99, 30, 186, 19, 182];
      accounts: [
        {
          name: 'pool';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
                  108,
                  105,
                  113,
                  117,
                  105,
                  100,
                  105,
                  116,
                  121,
                  95,
                  112,
                  111,
                  111,
                  108
                ];
              },
              {
                kind: 'account';
                path: 'memberMint';
              }
            ];
          };
        },
        {
          name: 'collectionMint';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [109, 105, 110, 116];
              },
              {
                kind: 'account';
                path: 'creator';
              }
            ];
          };
        },
        {
          name: 'memberMint';
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'collectionMint';
              },
              {
                kind: 'const';
                value: [0, 0, 0, 0, 0, 0, 0, 0];
              }
            ];
          };
        },
        {
          name: 'poolTokenAccount';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'pool';
              },
              {
                kind: 'const';
                value: [
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
                ];
              },
              {
                kind: 'account';
                path: 'memberMint';
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
          name: 'poolSolVault';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
                  108,
                  105,
                  113,
                  117,
                  105,
                  100,
                  105,
                  116,
                  121,
                  95,
                  112,
                  111,
                  111,
                  108,
                  95,
                  115,
                  111,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ];
              },
              {
                kind: 'account';
                path: 'memberMint';
              }
            ];
          };
        },
        {
          name: 'creatorTokenAccount';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'creator';
              },
              {
                kind: 'const';
                value: [
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
                ];
              },
              {
                kind: 'account';
                path: 'memberMint';
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
          name: 'mintVaultForAirdrop';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'escrow';
              },
              {
                kind: 'const';
                value: [
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
                ];
              },
              {
                kind: 'account';
                path: 'memberMint';
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
          name: 'escrow';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [101, 115, 99, 114, 111, 119];
              },
              {
                kind: 'account';
                path: 'pool.creator';
                account: 'liquidityPool';
              }
            ];
          };
        },
        {
          name: 'creator';
          writable: true;
        },
        {
          name: 'protocol';
          writable: true;
          address: 'FjsF2dg1njhxL9Cv1VezzHropmUDTWRQpcWLANv3jVR2';
        },
        {
          name: 'payer';
          writable: true;
          signer: true;
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
        {
          name: 'tokenProgram';
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        },
        {
          name: 'associatedTokenProgram';
          address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
        }
      ];
      args: [];
    },
    {
      name: 'createCollectionMint';
      discriminator: [234, 185, 122, 10, 65, 167, 91, 11];
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
          name: 'escrow';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [101, 115, 99, 114, 111, 119];
              },
              {
                kind: 'account';
                path: 'admin';
              }
            ];
          };
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
          name: 'metadata';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [109, 101, 116, 97, 100, 97, 116, 97];
              },
              {
                kind: 'const';
                value: [
                  11,
                  112,
                  101,
                  177,
                  227,
                  209,
                  124,
                  69,
                  56,
                  157,
                  82,
                  127,
                  107,
                  4,
                  195,
                  205,
                  88,
                  184,
                  108,
                  115,
                  26,
                  160,
                  253,
                  181,
                  73,
                  182,
                  209,
                  188,
                  3,
                  248,
                  41,
                  70
                ];
              },
              {
                kind: 'account';
                path: 'mint';
              }
            ];
            program: {
              kind: 'const';
              value: [
                11,
                112,
                101,
                177,
                227,
                209,
                124,
                69,
                56,
                157,
                82,
                127,
                107,
                4,
                195,
                205,
                88,
                184,
                108,
                115,
                26,
                160,
                253,
                181,
                73,
                182,
                209,
                188,
                3,
                248,
                41,
                70
              ];
            };
          };
        },
        {
          name: 'masterEditionMetadata';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [109, 101, 116, 97, 100, 97, 116, 97];
              },
              {
                kind: 'const';
                value: [
                  11,
                  112,
                  101,
                  177,
                  227,
                  209,
                  124,
                  69,
                  56,
                  157,
                  82,
                  127,
                  107,
                  4,
                  195,
                  205,
                  88,
                  184,
                  108,
                  115,
                  26,
                  160,
                  253,
                  181,
                  73,
                  182,
                  209,
                  188,
                  3,
                  248,
                  41,
                  70
                ];
              },
              {
                kind: 'account';
                path: 'mint';
              },
              {
                kind: 'const';
                value: [101, 100, 105, 116, 105, 111, 110];
              }
            ];
            program: {
              kind: 'const';
              value: [
                11,
                112,
                101,
                177,
                227,
                209,
                124,
                69,
                56,
                157,
                82,
                127,
                107,
                4,
                195,
                205,
                88,
                184,
                108,
                115,
                26,
                160,
                253,
                181,
                73,
                182,
                209,
                188,
                3,
                248,
                41,
                70
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
          name: 'tokenProgramMint';
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        },
        {
          name: 'metadataProgram';
          address: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s';
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
      name: 'createMemberMint';
      discriminator: [96, 200, 54, 190, 197, 241, 46, 40];
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
          name: 'distributor';
          signer: true;
        },
        {
          name: 'admin';
        },
        {
          name: 'metadata';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [109, 101, 116, 97, 100, 97, 116, 97];
              },
              {
                kind: 'const';
                value: [
                  11,
                  112,
                  101,
                  177,
                  227,
                  209,
                  124,
                  69,
                  56,
                  157,
                  82,
                  127,
                  107,
                  4,
                  195,
                  205,
                  88,
                  184,
                  108,
                  115,
                  26,
                  160,
                  253,
                  181,
                  73,
                  182,
                  209,
                  188,
                  3,
                  248,
                  41,
                  70
                ];
              },
              {
                kind: 'account';
                path: 'memberMint';
              }
            ];
            program: {
              kind: 'const';
              value: [
                11,
                112,
                101,
                177,
                227,
                209,
                124,
                69,
                56,
                157,
                82,
                127,
                107,
                4,
                195,
                205,
                88,
                184,
                108,
                115,
                26,
                160,
                253,
                181,
                73,
                182,
                209,
                188,
                3,
                248,
                41,
                70
              ];
            };
          };
        },
        {
          name: 'collectionMint';
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
          name: 'memberMint';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'collectionMint';
              },
              {
                kind: 'arg';
                path: 'index';
              }
            ];
          };
        },
        {
          name: 'adminEscrow';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [101, 115, 99, 114, 111, 119];
              },
              {
                kind: 'account';
                path: 'admin';
              }
            ];
          };
        },
        {
          name: 'escrow';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [101, 115, 99, 114, 111, 119];
              },
              {
                kind: 'account';
                path: 'creator';
              }
            ];
          };
        },
        {
          name: 'collectionMetadata';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [109, 101, 116, 97, 100, 97, 116, 97];
              },
              {
                kind: 'const';
                value: [
                  11,
                  112,
                  101,
                  177,
                  227,
                  209,
                  124,
                  69,
                  56,
                  157,
                  82,
                  127,
                  107,
                  4,
                  195,
                  205,
                  88,
                  184,
                  108,
                  115,
                  26,
                  160,
                  253,
                  181,
                  73,
                  182,
                  209,
                  188,
                  3,
                  248,
                  41,
                  70
                ];
              },
              {
                kind: 'account';
                path: 'collectionMint';
              }
            ];
            program: {
              kind: 'const';
              value: [
                11,
                112,
                101,
                177,
                227,
                209,
                124,
                69,
                56,
                157,
                82,
                127,
                107,
                4,
                195,
                205,
                88,
                184,
                108,
                115,
                26,
                160,
                253,
                181,
                73,
                182,
                209,
                188,
                3,
                248,
                41,
                70
              ];
            };
          };
        },
        {
          name: 'collectionMasterEditionMetadata';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [109, 101, 116, 97, 100, 97, 116, 97];
              },
              {
                kind: 'const';
                value: [
                  11,
                  112,
                  101,
                  177,
                  227,
                  209,
                  124,
                  69,
                  56,
                  157,
                  82,
                  127,
                  107,
                  4,
                  195,
                  205,
                  88,
                  184,
                  108,
                  115,
                  26,
                  160,
                  253,
                  181,
                  73,
                  182,
                  209,
                  188,
                  3,
                  248,
                  41,
                  70
                ];
              },
              {
                kind: 'account';
                path: 'collectionMint';
              },
              {
                kind: 'const';
                value: [101, 100, 105, 116, 105, 111, 110];
              }
            ];
            program: {
              kind: 'const';
              value: [
                11,
                112,
                101,
                177,
                227,
                209,
                124,
                69,
                56,
                157,
                82,
                127,
                107,
                4,
                195,
                205,
                88,
                184,
                108,
                115,
                26,
                160,
                253,
                181,
                73,
                182,
                209,
                188,
                3,
                248,
                41,
                70
              ];
            };
          };
        },
        {
          name: 'tokenProgramMint';
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        },
        {
          name: 'metadataProgram';
          address: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s';
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
          name: 'sysvarInstruction';
        }
      ];
      args: [
        {
          name: 'index';
          type: 'u64';
        },
        {
          name: 'args';
          type: {
            defined: {
              name: 'createMintArgs';
            };
          };
        },
        {
          name: 'decimals';
          type: 'u8';
        }
      ];
    },
    {
      name: 'distributeTokens';
      discriminator: [105, 69, 130, 52, 196, 28, 176, 120];
      accounts: [
        {
          name: 'payer';
          writable: true;
          signer: true;
        },
        {
          name: 'admin';
        },
        {
          name: 'distributor';
          signer: true;
        },
        {
          name: 'collectionMint';
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
          name: 'escrow';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [101, 115, 99, 114, 111, 119];
              },
              {
                kind: 'account';
                path: 'admin';
              }
            ];
          };
        },
        {
          name: 'mintToSend';
        },
        {
          name: 'mintVaultForAirdrop';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'escrow';
              },
              {
                kind: 'account';
                path: 'tokenProgramMint';
              },
              {
                kind: 'account';
                path: 'mintToSend';
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
                path: 'mintToSend';
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
        },
        {
          name: 'associatedTokenProgram';
          address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        }
      ];
      args: [
        {
          name: 'amount';
          type: 'u64';
        },
        {
          name: 'event';
          type: 'u8';
        },
        {
          name: 'id';
          type: 'u64';
        }
      ];
    },
    {
      name: 'graduate';
      discriminator: [45, 235, 225, 181, 17, 218, 64, 130];
      accounts: [
        {
          name: 'memberMint';
        },
        {
          name: 'wsol';
          address: 'So11111111111111111111111111111111111111112';
        },
        {
          name: 'pool';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
                  108,
                  105,
                  113,
                  117,
                  105,
                  100,
                  105,
                  116,
                  121,
                  95,
                  112,
                  111,
                  111,
                  108
                ];
              },
              {
                kind: 'account';
                path: 'memberMint';
              }
            ];
          };
        },
        {
          name: 'poolSolVault';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
                  108,
                  105,
                  113,
                  117,
                  105,
                  100,
                  105,
                  116,
                  121,
                  95,
                  112,
                  111,
                  111,
                  108,
                  95,
                  115,
                  111,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ];
              },
              {
                kind: 'account';
                path: 'memberMint';
              }
            ];
          };
        },
        {
          name: 'poolTokenAccount';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'pool';
              },
              {
                kind: 'const';
                value: [
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
                ];
              },
              {
                kind: 'account';
                path: 'memberMint';
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
          name: 'poolWsolTokenAccount';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'pool';
              },
              {
                kind: 'const';
                value: [
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
                ];
              },
              {
                kind: 'account';
                path: 'wsol';
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
          name: 'userTokenAccount';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'user';
              },
              {
                kind: 'const';
                value: [
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
                ];
              },
              {
                kind: 'account';
                path: 'memberMint';
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
          name: 'userWsolTokenAccount';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'user';
              },
              {
                kind: 'const';
                value: [
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
                ];
              },
              {
                kind: 'account';
                path: 'wsol';
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
          name: 'user';
          writable: true;
          signer: true;
        },
        {
          name: 'escrow';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [101, 115, 99, 114, 111, 119];
              },
              {
                kind: 'account';
                path: 'pool.creator';
                account: 'liquidityPool';
              }
            ];
          };
        },
        {
          name: 'distributor';
          signer: true;
        },
        {
          name: 'rent';
          address: 'SysvarRent111111111111111111111111111111111';
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
        {
          name: 'tokenProgram';
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        },
        {
          name: 'associatedTokenProgram';
          address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
        }
      ];
      args: [];
    },
    {
      name: 'initialize';
      discriminator: [175, 175, 109, 31, 13, 152, 155, 237];
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
          name: 'pool';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
                  108,
                  105,
                  113,
                  117,
                  105,
                  100,
                  105,
                  116,
                  121,
                  95,
                  112,
                  111,
                  111,
                  108
                ];
              },
              {
                kind: 'account';
                path: 'memberMint';
              }
            ];
          };
        },
        {
          name: 'poolSolVault';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
                  108,
                  105,
                  113,
                  117,
                  105,
                  100,
                  105,
                  116,
                  121,
                  95,
                  112,
                  111,
                  111,
                  108,
                  95,
                  115,
                  111,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ];
              },
              {
                kind: 'account';
                path: 'memberMint';
              }
            ];
          };
        },
        {
          name: 'poolTokenAccount';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'pool';
              },
              {
                kind: 'const';
                value: [
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
                ];
              },
              {
                kind: 'account';
                path: 'memberMint';
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
          name: 'mintVaultForAirdrop';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'escrow';
              },
              {
                kind: 'const';
                value: [
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
                ];
              },
              {
                kind: 'account';
                path: 'memberMint';
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
          name: 'collectionMint';
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
          name: 'memberMint';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'collectionMint';
              },
              {
                kind: 'const';
                value: [0, 0, 0, 0, 0, 0, 0, 0];
              }
            ];
          };
        },
        {
          name: 'escrow';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [101, 115, 99, 114, 111, 119];
              },
              {
                kind: 'account';
                path: 'admin';
              }
            ];
          };
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
        }
      ];
      args: [
        {
          name: 'amountAirdrop';
          type: 'u64';
        },
        {
          name: 'amountToBondingCurve';
          type: 'u64';
        }
      ];
    },
    {
      name: 'mintMemberMint';
      discriminator: [53, 130, 94, 6, 220, 51, 105, 196];
      accounts: [
        {
          name: 'payer';
          writable: true;
          signer: true;
        },
        {
          name: 'distributor';
          signer: true;
        },
        {
          name: 'creator';
        },
        {
          name: 'escrow';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [101, 115, 99, 114, 111, 119];
              },
              {
                kind: 'account';
                path: 'creator';
              }
            ];
          };
        },
        {
          name: 'collectionMint';
        },
        {
          name: 'memberMint';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'collectionMint';
              },
              {
                kind: 'arg';
                path: 'index';
              }
            ];
          };
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
                path: 'memberMint';
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
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        },
        {
          name: 'associatedTokenProgram';
          address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        }
      ];
      args: [
        {
          name: 'index';
          type: 'u64';
        },
        {
          name: 'amount';
          type: 'u64';
        }
      ];
    },
    {
      name: 'proxyInitialize';
      discriminator: [185, 41, 170, 16, 237, 245, 76, 134];
      accounts: [
        {
          name: 'creator';
          docs: ['Address paying to create the pool. Can be anyone'];
          writable: true;
          signer: true;
        },
        {
          name: 'ammConfig';
        },
        {
          name: 'authority';
        },
        {
          name: 'poolState';
          writable: true;
        },
        {
          name: 'token0Mint';
          docs: ['Token_0 mint, the key must smaller then token_1 mint.'];
        },
        {
          name: 'token1Mint';
          docs: ['Token_1 mint, the key must grater then token_0 mint.'];
        },
        {
          name: 'lpMint';
          writable: true;
        },
        {
          name: 'creatorToken0';
          docs: ['payer token0 account'];
          writable: true;
        },
        {
          name: 'creatorToken1';
          docs: ['creator token1 account'];
          writable: true;
        },
        {
          name: 'creatorLpToken';
          writable: true;
        },
        {
          name: 'token0Vault';
          writable: true;
        },
        {
          name: 'token1Vault';
          writable: true;
        },
        {
          name: 'createPoolFee';
          docs: ['create pool fee account'];
          writable: true;
        },
        {
          name: 'observationState';
          writable: true;
        },
        {
          name: 'tokenProgram';
          docs: ['Program to create mint account and mint tokens'];
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        },
        {
          name: 'token0Program';
          docs: ['Spl token program or token program 2022'];
        },
        {
          name: 'token1Program';
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
          name: 'cpSwapProgram';
          address: 'CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C';
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
      name: 'sell';
      discriminator: [51, 230, 133, 164, 1, 127, 131, 173];
      accounts: [
        {
          name: 'dexConfigurationAccount';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
                  67,
                  117,
                  114,
                  118,
                  101,
                  67,
                  111,
                  110,
                  102,
                  105,
                  103,
                  117,
                  114,
                  97,
                  116,
                  105,
                  111,
                  110
                ];
              }
            ];
          };
        },
        {
          name: 'pool';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
                  108,
                  105,
                  113,
                  117,
                  105,
                  100,
                  105,
                  116,
                  121,
                  95,
                  112,
                  111,
                  111,
                  108
                ];
              },
              {
                kind: 'account';
                path: 'memberMint';
              }
            ];
          };
        },
        {
          name: 'poolSolVault';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
                  108,
                  105,
                  113,
                  117,
                  105,
                  100,
                  105,
                  116,
                  121,
                  95,
                  112,
                  111,
                  111,
                  108,
                  95,
                  115,
                  111,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ];
              },
              {
                kind: 'account';
                path: 'memberMint';
              }
            ];
          };
        },
        {
          name: 'memberMint';
        },
        {
          name: 'poolTokenAccount';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'pool';
              },
              {
                kind: 'const';
                value: [
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
                ];
              },
              {
                kind: 'account';
                path: 'memberMint';
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
          name: 'userTokenAccount';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'user';
              },
              {
                kind: 'const';
                value: [
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
                ];
              },
              {
                kind: 'account';
                path: 'memberMint';
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
          name: 'user';
          writable: true;
          signer: true;
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
        {
          name: 'tokenProgram';
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        },
        {
          name: 'associatedTokenProgram';
          address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
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
      name: 'setFees';
      discriminator: [137, 178, 49, 58, 0, 245, 242, 190];
      accounts: [
        {
          name: 'dexConfigurationAccount';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
                  67,
                  117,
                  114,
                  118,
                  101,
                  67,
                  111,
                  110,
                  102,
                  105,
                  103,
                  117,
                  114,
                  97,
                  116,
                  105,
                  111,
                  110
                ];
              }
            ];
          };
        },
        {
          name: 'admin';
          writable: true;
          signer: true;
          address: 'FjsF2dg1njhxL9Cv1VezzHropmUDTWRQpcWLANv3jVR2';
        },
        {
          name: 'rent';
          address: 'SysvarRent111111111111111111111111111111111';
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        }
      ];
      args: [
        {
          name: 'fees';
          type: 'u16';
        }
      ];
    },
    {
      name: 'unverifyMemberMint';
      discriminator: [93, 131, 66, 36, 42, 196, 10, 67];
      accounts: [
        {
          name: 'admin';
          signer: true;
        },
        {
          name: 'metadata';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [109, 101, 116, 97, 100, 97, 116, 97];
              },
              {
                kind: 'const';
                value: [
                  11,
                  112,
                  101,
                  177,
                  227,
                  209,
                  124,
                  69,
                  56,
                  157,
                  82,
                  127,
                  107,
                  4,
                  195,
                  205,
                  88,
                  184,
                  108,
                  115,
                  26,
                  160,
                  253,
                  181,
                  73,
                  182,
                  209,
                  188,
                  3,
                  248,
                  41,
                  70
                ];
              },
              {
                kind: 'account';
                path: 'memberMint';
              }
            ];
            program: {
              kind: 'const';
              value: [
                11,
                112,
                101,
                177,
                227,
                209,
                124,
                69,
                56,
                157,
                82,
                127,
                107,
                4,
                195,
                205,
                88,
                184,
                108,
                115,
                26,
                160,
                253,
                181,
                73,
                182,
                209,
                188,
                3,
                248,
                41,
                70
              ];
            };
          };
        },
        {
          name: 'collectionMetadata';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [109, 101, 116, 97, 100, 97, 116, 97];
              },
              {
                kind: 'const';
                value: [
                  11,
                  112,
                  101,
                  177,
                  227,
                  209,
                  124,
                  69,
                  56,
                  157,
                  82,
                  127,
                  107,
                  4,
                  195,
                  205,
                  88,
                  184,
                  108,
                  115,
                  26,
                  160,
                  253,
                  181,
                  73,
                  182,
                  209,
                  188,
                  3,
                  248,
                  41,
                  70
                ];
              },
              {
                kind: 'account';
                path: 'collectionMint';
              }
            ];
            program: {
              kind: 'const';
              value: [
                11,
                112,
                101,
                177,
                227,
                209,
                124,
                69,
                56,
                157,
                82,
                127,
                107,
                4,
                195,
                205,
                88,
                184,
                108,
                115,
                26,
                160,
                253,
                181,
                73,
                182,
                209,
                188,
                3,
                248,
                41,
                70
              ];
            };
          };
        },
        {
          name: 'collectionMint';
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
          name: 'escrow';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [101, 115, 99, 114, 111, 119];
              },
              {
                kind: 'account';
                path: 'admin';
              }
            ];
          };
        },
        {
          name: 'memberMint';
        },
        {
          name: 'metadataProgram';
          address: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s';
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
        {
          name: 'sysvarInstruction';
        }
      ];
      args: [
        {
          name: 'index';
          type: {
            option: 'u64';
          };
        }
      ];
    },
    {
      name: 'updateMintMetadata';
      discriminator: [46, 244, 2, 123, 67, 219, 22, 121];
      accounts: [
        {
          name: 'creator';
          signer: true;
        },
        {
          name: 'collectionMint';
        },
        {
          name: 'metadataMint';
          writable: true;
        },
        {
          name: 'metadata';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [109, 101, 116, 97, 100, 97, 116, 97];
              },
              {
                kind: 'const';
                value: [
                  11,
                  112,
                  101,
                  177,
                  227,
                  209,
                  124,
                  69,
                  56,
                  157,
                  82,
                  127,
                  107,
                  4,
                  195,
                  205,
                  88,
                  184,
                  108,
                  115,
                  26,
                  160,
                  253,
                  181,
                  73,
                  182,
                  209,
                  188,
                  3,
                  248,
                  41,
                  70
                ];
              },
              {
                kind: 'account';
                path: 'metadataMint';
              }
            ];
            program: {
              kind: 'const';
              value: [
                11,
                112,
                101,
                177,
                227,
                209,
                124,
                69,
                56,
                157,
                82,
                127,
                107,
                4,
                195,
                205,
                88,
                184,
                108,
                115,
                26,
                160,
                253,
                181,
                73,
                182,
                209,
                188,
                3,
                248,
                41,
                70
              ];
            };
          };
        },
        {
          name: 'escrow';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [101, 115, 99, 114, 111, 119];
              },
              {
                kind: 'account';
                path: 'creator';
              }
            ];
          };
        },
        {
          name: 'tokenProgramMint';
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        },
        {
          name: 'metadataProgram';
          address: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s';
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        }
      ];
      args: [
        {
          name: 'index';
          type: {
            option: 'u64';
          };
        },
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
      name: 'verifyMemberMint';
      discriminator: [70, 3, 238, 106, 85, 116, 13, 226];
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
          name: 'metadata';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [109, 101, 116, 97, 100, 97, 116, 97];
              },
              {
                kind: 'const';
                value: [
                  11,
                  112,
                  101,
                  177,
                  227,
                  209,
                  124,
                  69,
                  56,
                  157,
                  82,
                  127,
                  107,
                  4,
                  195,
                  205,
                  88,
                  184,
                  108,
                  115,
                  26,
                  160,
                  253,
                  181,
                  73,
                  182,
                  209,
                  188,
                  3,
                  248,
                  41,
                  70
                ];
              },
              {
                kind: 'account';
                path: 'memberMint';
              }
            ];
            program: {
              kind: 'const';
              value: [
                11,
                112,
                101,
                177,
                227,
                209,
                124,
                69,
                56,
                157,
                82,
                127,
                107,
                4,
                195,
                205,
                88,
                184,
                108,
                115,
                26,
                160,
                253,
                181,
                73,
                182,
                209,
                188,
                3,
                248,
                41,
                70
              ];
            };
          };
        },
        {
          name: 'collectionMetadata';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [109, 101, 116, 97, 100, 97, 116, 97];
              },
              {
                kind: 'const';
                value: [
                  11,
                  112,
                  101,
                  177,
                  227,
                  209,
                  124,
                  69,
                  56,
                  157,
                  82,
                  127,
                  107,
                  4,
                  195,
                  205,
                  88,
                  184,
                  108,
                  115,
                  26,
                  160,
                  253,
                  181,
                  73,
                  182,
                  209,
                  188,
                  3,
                  248,
                  41,
                  70
                ];
              },
              {
                kind: 'account';
                path: 'collectionMint';
              }
            ];
            program: {
              kind: 'const';
              value: [
                11,
                112,
                101,
                177,
                227,
                209,
                124,
                69,
                56,
                157,
                82,
                127,
                107,
                4,
                195,
                205,
                88,
                184,
                108,
                115,
                26,
                160,
                253,
                181,
                73,
                182,
                209,
                188,
                3,
                248,
                41,
                70
              ];
            };
          };
        },
        {
          name: 'collectionMasterEditionMetadata';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [109, 101, 116, 97, 100, 97, 116, 97];
              },
              {
                kind: 'const';
                value: [
                  11,
                  112,
                  101,
                  177,
                  227,
                  209,
                  124,
                  69,
                  56,
                  157,
                  82,
                  127,
                  107,
                  4,
                  195,
                  205,
                  88,
                  184,
                  108,
                  115,
                  26,
                  160,
                  253,
                  181,
                  73,
                  182,
                  209,
                  188,
                  3,
                  248,
                  41,
                  70
                ];
              },
              {
                kind: 'account';
                path: 'collectionMint';
              },
              {
                kind: 'const';
                value: [101, 100, 105, 116, 105, 111, 110];
              }
            ];
            program: {
              kind: 'const';
              value: [
                11,
                112,
                101,
                177,
                227,
                209,
                124,
                69,
                56,
                157,
                82,
                127,
                107,
                4,
                195,
                205,
                88,
                184,
                108,
                115,
                26,
                160,
                253,
                181,
                73,
                182,
                209,
                188,
                3,
                248,
                41,
                70
              ];
            };
          };
        },
        {
          name: 'collectionMint';
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
          name: 'escrow';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [101, 115, 99, 114, 111, 119];
              },
              {
                kind: 'account';
                path: 'admin';
              }
            ];
          };
        },
        {
          name: 'memberMint';
        },
        {
          name: 'metadataProgram';
          address: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s';
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
        {
          name: 'sysvarInstruction';
        }
      ];
      args: [
        {
          name: 'index';
          type: {
            option: 'u64';
          };
        }
      ];
    }
  ];
  accounts: [
    {
      name: 'curveConfiguration';
      discriminator: [225, 242, 252, 198, 63, 77, 56, 255];
    },
    {
      name: 'escrowPda';
      discriminator: [168, 217, 30, 14, 248, 197, 118, 128];
    },
    {
      name: 'liquidityPool';
      discriminator: [66, 38, 17, 64, 188, 80, 68, 129];
    }
  ];
  events: [
    {
      name: 'buy';
      discriminator: [104, 229, 167, 8, 240, 133, 178, 57];
    },
    {
      name: 'collectFees';
      discriminator: [68, 188, 11, 82, 41, 135, 51, 12];
    },
    {
      name: 'createCollectionMint';
      discriminator: [180, 201, 55, 11, 109, 48, 248, 1];
    },
    {
      name: 'createMemberMint';
      discriminator: [180, 101, 42, 231, 68, 149, 199, 229];
    },
    {
      name: 'distributeTokens';
      discriminator: [24, 48, 119, 72, 221, 243, 194, 207];
    },
    {
      name: 'graduate';
      discriminator: [160, 148, 253, 203, 114, 211, 250, 131];
    },
    {
      name: 'initializeMint';
      discriminator: [227, 163, 208, 22, 174, 191, 7, 162];
    },
    {
      name: 'mintMemberMint';
      discriminator: [239, 88, 225, 151, 26, 243, 20, 130];
    },
    {
      name: 'refreshMintMetadata';
      discriminator: [34, 38, 109, 231, 45, 105, 118, 78];
    },
    {
      name: 'sell';
      discriminator: [208, 253, 142, 56, 83, 4, 87, 225];
    },
    {
      name: 'unverifyMemberMint';
      discriminator: [175, 55, 170, 185, 43, 200, 241, 113];
    },
    {
      name: 'verifyMemberMint';
      discriminator: [59, 220, 58, 218, 108, 241, 236, 114];
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
      name: 'invalidAmount';
      msg: 'Amount cannot be zero!';
    },
    {
      code: 6002;
      name: 'notEnoughTokenInVault';
      msg: 'Not enough token in vault!';
    },
    {
      code: 6003;
      name: 'thresholdNotMetYet';
      msg: 'Threshold to move to dex is not met yet.';
    },
    {
      code: 6004;
      name: 'thresholdReached';
      msg: 'Migrating Trading to Dex.';
    },
    {
      code: 6005;
      name: 'notEnoughSolInVault';
      msg: 'Not enough Sol in vault!';
    },
    {
      code: 6006;
      name: 'overflow';
      msg: 'overflow';
    },
    {
      code: 6007;
      name: 'invalidFees';
      msg: 'Fees is out of range';
    },
    {
      code: 6008;
      name: 'mintSupplyNotZero';
      msg: 'Mint Supply must be zero to trigger initialize a pool';
    },
    {
      code: 6009;
      name: 'mintDecimalsIsIncorrect';
      msg: 'Mint Decimals must be 2';
    },
    {
      code: 6010;
      name: 'notAuthorisedBecauseYouAreNotTheCreator';
      msg: 'You are not the creator for the mint!';
    }
  ];
  types: [
    {
      name: 'buy';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'collectionMint';
            type: 'pubkey';
          },
          {
            name: 'memberMint';
            type: 'pubkey';
          },
          {
            name: 'amount';
            type: 'u64';
          },
          {
            name: 'amountOut';
            type: 'u64';
          },
          {
            name: 'timestamp';
            type: 'i64';
          },
          {
            name: 'reserveSol';
            type: 'u64';
          },
          {
            name: 'reserveTokensSold';
            type: 'u64';
          },
          {
            name: 'thresholdReached';
            type: 'bool';
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
            name: 'amountSolToCreator';
            type: 'u64';
          },
          {
            name: 'amountTokenToCreator';
            type: 'u64';
          },
          {
            name: 'amountSolToProtocol';
            type: 'u64';
          },
          {
            name: 'amountTokenToProtocol';
            type: 'u64';
          },
          {
            name: 'collectionMint';
            type: 'pubkey';
          },
          {
            name: 'memberMint';
            type: 'pubkey';
          }
        ];
      };
    },
    {
      name: 'createCollectionMint';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'collectionMint';
            type: 'pubkey';
          },
          {
            name: 'admin';
            type: 'pubkey';
          }
        ];
      };
    },
    {
      name: 'createMemberMint';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'collectionMint';
            type: 'pubkey';
          },
          {
            name: 'distributor';
            type: 'pubkey';
          },
          {
            name: 'index';
            type: 'u64';
          },
          {
            name: 'decimals';
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
          }
        ];
      };
    },
    {
      name: 'curveConfiguration';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'fees';
            type: 'u16';
          }
        ];
      };
    },
    {
      name: 'distributeTokens';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'collectionMint';
            type: 'pubkey';
          },
          {
            name: 'mintToSend';
            type: 'pubkey';
          },
          {
            name: 'to';
            type: 'pubkey';
          },
          {
            name: 'amount';
            type: 'u64';
          },
          {
            name: 'event';
            type: 'u8';
          },
          {
            name: 'id';
            type: 'u64';
          },
          {
            name: 'mintToSendDecimals';
            type: 'u8';
          }
        ];
      };
    },
    {
      name: 'escrowPda';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'admin';
            type: 'pubkey';
          },
          {
            name: 'delegate';
            type: 'pubkey';
          },
          {
            name: 'bump';
            type: 'u8';
          },
          {
            name: 'padding';
            type: {
              array: ['u8', 8];
            };
          }
        ];
      };
    },
    {
      name: 'graduate';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'collectionMint';
            type: 'pubkey';
          },
          {
            name: 'memberMint';
            type: 'pubkey';
          },
          {
            name: 'amountToken';
            type: 'u64';
          },
          {
            name: 'amountSol';
            type: 'u64';
          },
          {
            name: 'timestamp';
            type: 'i64';
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
            name: 'collectionMint';
            type: 'pubkey';
          },
          {
            name: 'memberMint';
            type: 'pubkey';
          },
          {
            name: 'amountToBondingCurve';
            type: 'u64';
          },
          {
            name: 'amountForAirdrop';
            type: 'u64';
          }
        ];
      };
    },
    {
      name: 'liquidityPool';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'reserveTokenSold';
            type: 'u64';
          },
          {
            name: 'totalSupply';
            type: 'u64';
          },
          {
            name: 'reserveSol';
            type: 'u64';
          },
          {
            name: 'feesToken';
            type: 'u64';
          },
          {
            name: 'feesSol';
            type: 'u64';
          },
          {
            name: 'bump';
            type: 'u8';
          },
          {
            name: 'creator';
            type: 'pubkey';
          },
          {
            name: 'token';
            type: 'pubkey';
          },
          {
            name: 'thresholdReached';
            type: 'bool';
          },
          {
            name: 'collectionMint';
            type: 'pubkey';
          },
          {
            name: 'decimals';
            type: 'u8';
          }
        ];
      };
    },
    {
      name: 'mintMemberMint';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'collectionMint';
            type: 'pubkey';
          },
          {
            name: 'memberMint';
            type: 'pubkey';
          },
          {
            name: 'amount';
            type: 'u64';
          },
          {
            name: 'to';
            type: 'pubkey';
          },
          {
            name: 'index';
            type: 'u64';
          }
        ];
      };
    },
    {
      name: 'refreshMintMetadata';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'collectionMint';
            type: 'pubkey';
          },
          {
            name: 'metadataMint';
            type: 'pubkey';
          }
        ];
      };
    },
    {
      name: 'sell';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'collectionMint';
            type: 'pubkey';
          },
          {
            name: 'memberMint';
            type: 'pubkey';
          },
          {
            name: 'amount';
            type: 'u64';
          },
          {
            name: 'amountOut';
            type: 'u64';
          },
          {
            name: 'timestamp';
            type: 'i64';
          },
          {
            name: 'reserveSol';
            type: 'u64';
          },
          {
            name: 'reserveTokensSold';
            type: 'u64';
          }
        ];
      };
    },
    {
      name: 'unverifyMemberMint';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'collectionMint';
            type: 'pubkey';
          },
          {
            name: 'memberMint';
            type: 'pubkey';
          },
          {
            name: 'index';
            type: {
              option: 'u64';
            };
          }
        ];
      };
    },
    {
      name: 'verifyMemberMint';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'collectionMint';
            type: 'pubkey';
          },
          {
            name: 'memberMint';
            type: 'pubkey';
          },
          {
            name: 'index';
            type: {
              option: 'u64';
            };
          }
        ];
      };
    }
  ];
};
