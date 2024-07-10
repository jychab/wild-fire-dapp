/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/wild_fire.json`.
 */
export type WildFire = {
  address: '7F7zr8aB4NFkF8DDxNstX5oU8X9w4ohgJyEqfXU5dnLX';
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
          name: 'authority';
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
          name: 'authority';
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
      name: 'changeTransferFee';
      discriminator: [80, 16, 175, 186, 185, 22, 46, 194];
      accounts: [
        {
          name: 'payer';
          writable: true;
          signer: true;
        },
        {
          name: 'authority';
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
      name: 'closeAccount';
      discriminator: [125, 255, 149, 14, 110, 34, 72, 24];
      accounts: [
        {
          name: 'payer';
          writable: true;
          signer: true;
        },
        {
          name: 'authority';
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
          name: 'authority';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [97, 117, 116, 104, 111, 114, 105, 116, 121];
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
          name: 'authority';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [97, 117, 116, 104, 111, 114, 105, 116, 121];
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
        }
      ];
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
          name: 'authority';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [97, 117, 116, 104, 111, 114, 105, 116, 121];
              },
              {
                kind: 'account';
                path: 'mint';
              }
            ];
          };
        },
        {
          name: 'authorityMintTokenAccount';
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
      name: 'issueMint';
      discriminator: [32, 116, 128, 230, 104, 245, 249, 124];
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
          name: 'mint';
          writable: true;
        },
        {
          name: 'authority';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [97, 117, 116, 104, 111, 114, 105, 116, 121];
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
          name: 'authority';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [97, 117, 116, 104, 111, 114, 105, 116, 121];
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
          name: 'authority';
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
          name: 'authority';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [97, 117, 116, 104, 111, 114, 105, 116, 121];
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
          name: 'authority';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [97, 117, 116, 104, 111, 114, 105, 116, 121];
              },
              {
                kind: 'account';
                path: 'mint';
              }
            ];
          };
        },
        {
          name: 'authorityMintTokenAccount';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'authority';
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
      name: 'authority';
      discriminator: [36, 108, 254, 18, 167, 144, 27, 36];
    }
  ];
  events: [
    {
      name: 'changeAdmin';
      discriminator: [231, 73, 8, 168, 43, 125, 226, 99];
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
      name: 'issueMint';
      discriminator: [170, 197, 128, 166, 137, 83, 125, 3];
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
      msg: 'Mint account is different from the one defined in the authority';
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
    }
  ];
  types: [
    {
      name: 'authority';
      serialization: 'bytemuck';
      repr: {
        kind: 'c';
      };
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'feesCollected';
            type: 'u64';
          },
          {
            name: 'bump';
            type: 'u8';
          },
          {
            name: 'mutable';
            type: 'u8';
          },
          {
            name: 'padding';
            type: {
              array: ['u8', 6];
            };
          },
          {
            name: 'mint';
            type: 'pubkey';
          },
          {
            name: 'distributor';
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
      name: 'issueMint';
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
