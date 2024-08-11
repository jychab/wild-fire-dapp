/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/wild_fire.json`.
 */
export type WildFire = {
  address: '2fuSFHGb38TefYzzNmqCLE6iXffQ2HhgAS3cvsmgmGUR';
  metadata: {
    name: 'wildFire';
    version: '0.1.0';
    spec: '0.1.0';
    description: 'Created with Anchor';
  };
  instructions: [
    {
      name: 'changeDistributor';
      discriminator: [165, 66, 159, 81, 14, 26, 77, 145];
      accounts: [
        {
          name: 'protocol';
          signer: true;
          address: 'G6kBnedts6uAivtY72ToaFHBs1UVbT9udiXmQZgMEjoF';
        },
        {
          name: 'tokenState';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [116, 111, 107, 101, 110];
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
          name: 'protocol';
          signer: true;
          address: 'G6kBnedts6uAivtY72ToaFHBs1UVbT9udiXmQZgMEjoF';
        },
        {
          name: 'tokenState';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [116, 111, 107, 101, 110];
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
          writable: true;
        },
        {
          name: 'tokenProgramMint';
          address: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
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
          name: 'protocol';
          signer: true;
          address: 'G6kBnedts6uAivtY72ToaFHBs1UVbT9udiXmQZgMEjoF';
        },
        {
          name: 'tokenState';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [116, 111, 107, 101, 110];
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
          name: 'tokenState';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [116, 111, 107, 101, 110];
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
          name: 'tokenState';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [116, 111, 107, 101, 110];
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
          name: 'tokenState';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [116, 111, 107, 101, 110];
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
      name: 'distributeFees';
      discriminator: [120, 56, 27, 7, 53, 176, 113, 186];
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
          name: 'mint';
        },
        {
          name: 'tokenState';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [116, 111, 107, 101, 110];
              },
              {
                kind: 'account';
                path: 'mint';
              }
            ];
          };
        },
        {
          name: 'tokenStateMintTokenAccount';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'tokenState';
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
        },
        {
          name: 'id';
          type: 'string';
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
          name: 'mint';
          writable: true;
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
          name: 'tokenStateMintTokenAccount';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'tokenState';
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
          name: 'tokenState';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [116, 111, 107, 101, 110];
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
          name: 'amountReserve';
          type: 'u64';
        },
        {
          name: 'amountToCreator';
          type: 'u64';
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
          name: 'tokenState';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [116, 111, 107, 101, 110];
              },
              {
                kind: 'account';
                path: 'mint';
              }
            ];
          };
        },
        {
          name: 'tokenStateMintTokenAccount';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'tokenState';
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
      name: 'tokenState';
      discriminator: [218, 112, 6, 149, 55, 186, 168, 163];
    }
  ];
  events: [
    {
      name: 'changeDistributor';
      discriminator: [226, 198, 51, 180, 136, 197, 218, 191];
    },
    {
      name: 'changeTransferFee';
      discriminator: [214, 104, 141, 21, 224, 89, 200, 44];
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
      name: 'verifedStatus';
      discriminator: [249, 11, 69, 153, 222, 216, 160, 43];
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
      name: 'mintIsNotZero';
      msg: 'Mint supply that is non zero is not allowed to close this account';
    }
  ];
  types: [
    {
      name: 'changeDistributor';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'mint';
            type: 'pubkey';
          },
          {
            name: 'newDistributor';
            type: 'pubkey';
          }
        ];
      };
    },
    {
      name: 'changeTransferFee';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'mint';
            type: 'pubkey';
          },
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
            name: 'distributor';
            type: 'pubkey';
          },
          {
            name: 'payer';
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
            name: 'id';
            type: 'string';
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
            name: 'amountToCreator';
            type: 'u64';
          },
          {
            name: 'amountReserve';
            type: 'u64';
          }
        ];
      };
    },
    {
      name: 'tokenState';
      serialization: 'bytemuck';
      repr: {
        kind: 'c';
      };
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'admin';
            docs: ['pubkey that controls the token'];
            type: 'pubkey';
          },
          {
            name: 'mint';
            docs: ['Mint information'];
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
            name: 'verified';
            type: 'u8';
          },
          {
            name: 'bump';
            type: 'u8';
          },
          {
            name: 'padding';
            type: {
              array: ['u8', 17];
            };
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
      name: 'verifedStatus';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'mint';
            type: 'pubkey';
          },
          {
            name: 'verified';
            type: 'bool';
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
