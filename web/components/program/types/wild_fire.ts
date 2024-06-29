/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/wild_fire.json`.
 */
export type WildFire = {
  address: '2L4rVgwdUgb8KbXyk7VgmrTGtY6XSayaMofF3HMj833E';
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
          name: 'distributor';
          writable: true;
        },
        {
          name: 'protocolWallet';
          writable: true;
          address: '73hCTYpoZNdFiwbh2PrW99ykAyNcQVfUwPMUhu9ogNTg';
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
          name: 'destinationMintTokenAccount';
          writable: true;
        },
        {
          name: 'tokenProgramMint';
          address: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
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
          name: 'payerMintTokenAccount';
          writable: true;
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
  errors: [
    {
      code: 6000;
      name: 'incorrectUpdateAuthority';
    },
    {
      code: 6001;
      name: 'incorrectMint';
    },
    {
      code: 6002;
      name: 'incorrectFeeCollector';
    },
    {
      code: 6003;
      name: 'unauthorizedBaseCoin';
    },
    {
      code: 6004;
      name: 'insufficientAmount';
    },
    {
      code: 6005;
      name: 'mintRatioCannotBeZero';
    },
    {
      code: 6006;
      name: 'issuanceFeeBasisPtsCannotExceed100';
    },
    {
      code: 6007;
      name: 'redemptionFeeBasisPtsCannotExceed100';
    },
    {
      code: 6008;
      name: 'mintIsImmutable';
    },
    {
      code: 6009;
      name: 'mintIsNotZero';
    },
    {
      code: 6010;
      name: 'baseCoinIsNotZero';
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
      name: 'createMintArgs';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'admin';
            type: 'pubkey';
          },
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
    }
  ];
};
