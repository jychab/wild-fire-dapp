export type WildFire = {
  version: '0.1.0';
  name: 'wild_fire';
  instructions: [
    {
      name: 'setToImmutable';
      accounts: [
        {
          name: 'payer';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'authority';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'mint';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'tokenProgramMint';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: 'changeAdmin';
      accounts: [
        {
          name: 'payer';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'authority';
          isMut: true;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'newAdmin';
          type: 'publicKey';
        }
      ];
    },
    {
      name: 'closeAccount';
      accounts: [
        {
          name: 'payer';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'authority';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'mint';
          isMut: true;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: 'createMint';
      accounts: [
        {
          name: 'payer';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'mint';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'authority';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'tokenProgramMint';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'associatedTokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'rent';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'eventAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'program';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'args';
          type: {
            defined: 'CreateMintArgs';
          };
        }
      ];
    },
    {
      name: 'createMintMetadata';
      accounts: [
        {
          name: 'payer';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'mint';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'authority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'tokenProgramMint';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
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
      name: 'updateMintMetadata';
      accounts: [
        {
          name: 'payer';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'mint';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'authority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'tokenProgramMint';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
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
      name: 'changeTransferFee';
      accounts: [
        {
          name: 'payer';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'authority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'mint';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'tokenProgramMint';
          isMut: false;
          isSigner: false;
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
      name: 'withdrawFees';
      accounts: [
        {
          name: 'payer';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'mint';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'authority';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'authorityMintTokenAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'tokenProgramMint';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'associatedTokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'eventAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'program';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: 'distributeFees';
      accounts: [
        {
          name: 'payer';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'mint';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'authority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'authorityMintTokenAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'destinationWallet';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'destinationMintTokenAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'tokenProgramMint';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'eventAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'program';
          isMut: false;
          isSigner: false;
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
      accounts: [
        {
          name: 'payer';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'payerMintTokenAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'mint';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'authority';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'tokenProgramMint';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'associatedTokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'eventAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'program';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'amount';
          type: 'u64';
        }
      ];
    }
  ];
  accounts: [
    {
      name: 'authority';
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
            type: 'publicKey';
          },
          {
            name: 'distributor';
            type: 'publicKey';
          },
          {
            name: 'admin';
            type: 'publicKey';
          }
        ];
      };
    }
  ];
  types: [
    {
      name: 'CreateMintArgs';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'admin';
            type: 'publicKey';
          },
          {
            name: 'distributor';
            type: 'publicKey';
          },
          {
            name: 'transferFeeArgs';
            type: {
              defined: 'TransferFeeArgs';
            };
          }
        ];
      };
    },
    {
      name: 'TransferFeeArgs';
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
  events: [
    {
      name: 'CreateMint';
      fields: [
        {
          name: 'mint';
          type: 'publicKey';
          index: false;
        },
        {
          name: 'distributor';
          type: 'publicKey';
          index: false;
        }
      ];
    },
    {
      name: 'DistributeFees';
      fields: [
        {
          name: 'mint';
          type: 'publicKey';
          index: false;
        },
        {
          name: 'amount';
          type: 'u64';
          index: false;
        },
        {
          name: 'to';
          type: 'publicKey';
          index: false;
        }
      ];
    },
    {
      name: 'IssueMint';
      fields: [
        {
          name: 'mint';
          type: 'publicKey';
          index: false;
        },
        {
          name: 'amount';
          type: 'u64';
          index: false;
        }
      ];
    },
    {
      name: 'WithdrawFees';
      fields: [
        {
          name: 'mint';
          type: 'publicKey';
          index: false;
        },
        {
          name: 'amount';
          type: 'u64';
          index: false;
        }
      ];
    }
  ];
  errors: [
    {
      code: 6000;
      name: 'IncorrectMint';
      msg: 'Mint account is different from the one defined in the authority';
    },
    {
      code: 6001;
      name: 'MintIsImmutable';
      msg: 'Mint account can no longer be changed';
    },
    {
      code: 6002;
      name: 'MintIsNotZero';
      msg: 'Mint supply that is non zero is not allowed to close this account';
    }
  ];
};

export const IDL: WildFire = {
  version: '0.1.0',
  name: 'wild_fire',
  instructions: [
    {
      name: 'setToImmutable',
      accounts: [
        {
          name: 'payer',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'authority',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'mint',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'tokenProgramMint',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: 'changeAdmin',
      accounts: [
        {
          name: 'payer',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'authority',
          isMut: true,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'newAdmin',
          type: 'publicKey',
        },
      ],
    },
    {
      name: 'closeAccount',
      accounts: [
        {
          name: 'payer',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'authority',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'mint',
          isMut: true,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: 'createMint',
      accounts: [
        {
          name: 'payer',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'mint',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'tokenProgramMint',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'associatedTokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'rent',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'eventAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'program',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'args',
          type: {
            defined: 'CreateMintArgs',
          },
        },
      ],
    },
    {
      name: 'createMintMetadata',
      accounts: [
        {
          name: 'payer',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'mint',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenProgramMint',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'lamports',
          type: 'u64',
        },
        {
          name: 'name',
          type: 'string',
        },
        {
          name: 'symbol',
          type: 'string',
        },
        {
          name: 'uri',
          type: 'string',
        },
      ],
    },
    {
      name: 'updateMintMetadata',
      accounts: [
        {
          name: 'payer',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'mint',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenProgramMint',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'field',
          type: 'string',
        },
        {
          name: 'value',
          type: 'string',
        },
      ],
    },
    {
      name: 'changeTransferFee',
      accounts: [
        {
          name: 'payer',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'mint',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'tokenProgramMint',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'feeBasisPts',
          type: 'u16',
        },
        {
          name: 'maxFee',
          type: 'u64',
        },
      ],
    },
    {
      name: 'withdrawFees',
      accounts: [
        {
          name: 'payer',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'mint',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authorityMintTokenAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'tokenProgramMint',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'associatedTokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'eventAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'program',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: 'distributeFees',
      accounts: [
        {
          name: 'payer',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'mint',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'authorityMintTokenAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'destinationWallet',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'destinationMintTokenAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'tokenProgramMint',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'eventAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'program',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'amount',
          type: 'u64',
        },
      ],
    },
    {
      name: 'issueMint',
      accounts: [
        {
          name: 'payer',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'payerMintTokenAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'mint',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'tokenProgramMint',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'associatedTokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'eventAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'program',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'amount',
          type: 'u64',
        },
      ],
    },
  ],
  accounts: [
    {
      name: 'authority',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'feesCollected',
            type: 'u64',
          },
          {
            name: 'bump',
            type: 'u8',
          },
          {
            name: 'mutable',
            type: 'u8',
          },
          {
            name: 'padding',
            type: {
              array: ['u8', 6],
            },
          },
          {
            name: 'mint',
            type: 'publicKey',
          },
          {
            name: 'distributor',
            type: 'publicKey',
          },
          {
            name: 'admin',
            type: 'publicKey',
          },
        ],
      },
    },
  ],
  types: [
    {
      name: 'CreateMintArgs',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'admin',
            type: 'publicKey',
          },
          {
            name: 'distributor',
            type: 'publicKey',
          },
          {
            name: 'transferFeeArgs',
            type: {
              defined: 'TransferFeeArgs',
            },
          },
        ],
      },
    },
    {
      name: 'TransferFeeArgs',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'feeBasisPts',
            type: 'u16',
          },
          {
            name: 'maxFee',
            type: 'u64',
          },
        ],
      },
    },
  ],
  events: [
    {
      name: 'CreateMint',
      fields: [
        {
          name: 'mint',
          type: 'publicKey',
          index: false,
        },
        {
          name: 'distributor',
          type: 'publicKey',
          index: false,
        },
      ],
    },
    {
      name: 'DistributeFees',
      fields: [
        {
          name: 'mint',
          type: 'publicKey',
          index: false,
        },
        {
          name: 'amount',
          type: 'u64',
          index: false,
        },
        {
          name: 'to',
          type: 'publicKey',
          index: false,
        },
      ],
    },
    {
      name: 'IssueMint',
      fields: [
        {
          name: 'mint',
          type: 'publicKey',
          index: false,
        },
        {
          name: 'amount',
          type: 'u64',
          index: false,
        },
      ],
    },
    {
      name: 'WithdrawFees',
      fields: [
        {
          name: 'mint',
          type: 'publicKey',
          index: false,
        },
        {
          name: 'amount',
          type: 'u64',
          index: false,
        },
      ],
    },
  ],
  errors: [
    {
      code: 6000,
      name: 'IncorrectMint',
      msg: 'Mint account is different from the one defined in the authority',
    },
    {
      code: 6001,
      name: 'MintIsImmutable',
      msg: 'Mint account can no longer be changed',
    },
    {
      code: 6002,
      name: 'MintIsNotZero',
      msg: 'Mint supply that is non zero is not allowed to close this account',
    },
  ],
};
