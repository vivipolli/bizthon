// ID do programa implantado na Solana
const PROGRAM_ID = "35GtXHKY4m9q9735friqSn8G73QYFZcBf5qzRp3bwGmV";
// IDL gerado do programa Anchor
const NFT_MINTER_IDL = {
  version: "0.1.0",
  name: "nft_minter",
  instructions: [
    {
      name: "mint_certification_nft",
      accounts: [
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "metadata_account",
          isMut: true,
          isSigner: false,
        },
        {
          name: "edition_account",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mint_account",
          isMut: true,
          isSigner: true,
        },
        {
          name: "associated_token_account",
          isMut: true,
          isSigner: false,
        },
        {
          name: "token_program",
          isMut: false,
          isSigner: false,
        },
        {
          name: "token_metadata_program",
          isMut: false,
          isSigner: false,
        },
        {
          name: "associated_token_program",
          isMut: false,
          isSigner: false,
        },
        {
          name: "system_program",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "metadata",
          type: {
            defined: "CertificationMetadata",
          },
        },
      ],
    },
    {
      name: "mint_collection_nft",
      accounts: [
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "metadata_account",
          isMut: true,
          isSigner: false,
        },
        {
          name: "edition_account",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mint_account",
          isMut: true,
          isSigner: true,
        },
        {
          name: "associated_token_account",
          isMut: true,
          isSigner: false,
        },
        {
          name: "token_program",
          isMut: false,
          isSigner: false,
        },
        {
          name: "token_metadata_program",
          isMut: false,
          isSigner: false,
        },
        {
          name: "associated_token_program",
          isMut: false,
          isSigner: false,
        },
        {
          name: "system_program",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "name",
          type: "string",
        },
        {
          name: "symbol",
          type: "string",
        },
        {
          name: "uri",
          type: "string",
        },
      ],
    },
    {
      name: "transfer_nft",
      accounts: [
        {
          name: "from",
          isMut: true,
          isSigner: false,
        },
        {
          name: "to",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: true,
          isSigner: true,
        },
        {
          name: "metadata",
          isMut: true,
          isSigner: false,
        },
        {
          name: "token_program",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
  ],
  accounts: [],
  types: [
    {
      name: "CertificationMetadata",
      type: {
        kind: "struct",
        fields: [
          {
            name: "name",
            type: "string",
          },
          {
            name: "symbol",
            type: "string",
          },
          {
            name: "uri",
            type: "string",
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: "AlreadyTransferred",
      msg: "Este NFT de certificação já foi transferido e não pode ser transferido novamente",
    },
  ],
};

module.exports = {
  PROGRAM_ID,
  NFT_MINTER_IDL,
};
