const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const {
  Connection,
  Keypair,
  clusterApiUrl,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} = require("@solana/web3.js");
const { Program, AnchorProvider } = require("@project-serum/anchor");
const { PROGRAM_ID, NFT_MINTER_IDL } = require("./constants");
const {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} = require("@solana/spl-token");
const { Metaplex } = require("@metaplex-foundation/js");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const upload = multer({ dest: "uploads/" });

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;
const SOLANA_NETWORK = process.env.SOLANA_NETWORK || "devnet";
const secretKey = Uint8Array.from(JSON.parse(process.env.WALLET_SECRET_KEY));

// Cria uma conexão com o cluster Devnet
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// Cria um Keypair a partir da chave secreta
const wallet = Keypair.fromSecretKey(secretKey);

// Exibe o endereço público da carteira
console.log("Endereço da carteira:", wallet.publicKey.toBase58());

const provider = new AnchorProvider(
  connection,
  {
    publicKey: wallet.publicKey,
    signTransaction: async (tx) => {
      tx.sign(wallet);
      return tx;
    },
    signAllTransactions: async (txs) => {
      txs.forEach((tx) => tx.sign(wallet));
      return txs;
    },
  },
  { commitment: "confirmed" }
);

// Primeiro, vamos fazer um log do IDL e do PROGRAM_ID
console.log("IDL:", NFT_MINTER_IDL);
console.log("PROGRAM_ID:", PROGRAM_ID);

// Depois, inicializamos o programa
const program = new Program(
  NFT_MINTER_IDL,
  new PublicKey(PROGRAM_ID),
  provider
);

// Vamos fazer um log dos métodos disponíveis
console.log("Program methods:", Object.keys(program.methods));

const NFT_MINT_ADDRESS = process.env.NFT_MINT_ADDRESS;

// Função para upload da imagem no Pinata
async function uploadToPinata(filePath, fileName) {
  const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";
  const data = new FormData();
  data.append("file", fs.createReadStream(filePath), fileName);

  const headers = {
    ...data.getHeaders(),
    pinata_api_key: PINATA_API_KEY,
    pinata_secret_api_key: PINATA_SECRET_API_KEY,
  };

  const response = await axios.post(url, data, { headers });
  return response.data;
}

// Função para upload dos metadados JSON no Pinata
async function uploadJSONToPinata(jsonData) {
  const url = "https://api.pinata.cloud/pinning/pinJSONToIPFS";
  const headers = {
    "Content-Type": "application/json",
    pinata_api_key: PINATA_API_KEY,
    pinata_secret_api_key: PINATA_SECRET_API_KEY,
  };

  const response = await axios.post(url, jsonData, { headers });
  return response.data;
}

// Rota para upload da imagem
app.post("/upload-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhuma imagem enviada" });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;

    const pinataResponse = await uploadToPinata(filePath, fileName);
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      imageUrl: `ipfs://${pinataResponse.IpfsHash}`,
    });
  } catch (error) {
    console.error("Erro no upload da imagem:", error);
    res
      .status(500)
      .json({ error: "Erro no upload da imagem", details: error.message });
  }
});

// Rota para mintar o NFT de certificação com metadados
app.post("/mint-certification", async (req, res) => {
  try {
    const {
      imageUrl,
      vegetationCoverage,
      hectaresNumber,
      specificAttributes,
      waterBodiesCount,
      springsCount,
      ongoingProjects,
      carRegistry,
    } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: "URL da imagem é necessária" });
    }

    const metadata = {
      name: "Certificado de Preservação",
      symbol: "CPNFT",
      description: "Certificado de Preservação Ambiental",
      image: imageUrl,
      attributes: [
        { trait_type: "Cobertura Vegetal", value: vegetationCoverage },
        { trait_type: "Número de Hectares", value: hectaresNumber },
        { trait_type: "Atributos Específicos", value: specificAttributes },
        { trait_type: "Corpos d'água", value: waterBodiesCount },
        { trait_type: "Nascentes", value: springsCount },
        { trait_type: "Projetos em Andamento", value: ongoingProjects },
        { trait_type: "Registro CAR", value: carRegistry },
      ],
    };

    const pinataResponse = await uploadJSONToPinata(metadata);
    const metadataUrl = `ipfs://${pinataResponse.IpfsHash}`;

    const mintKeypair = Keypair.generate();

    const tx = await program.methods
      .mintCertificationNft({
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadataUrl,
        vegetation_coverage: vegetationCoverage,
        hectares_number: hectaresNumber,
        specific_attributes: specificAttributes,
        water_bodies_count: waterBodiesCount,
        springs_count: springsCount,
        ongoing_projects: ongoingProjects,
        car_registry: carRegistry,
      })
      .accounts({
        metadata_account: PublicKey.findProgramAddressSync(
          [
            Buffer.from("metadata"),
            new PublicKey(
              "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
            ).toBuffer(),
            mintKeypair.publicKey.toBuffer(),
          ],
          new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
        )[0],
        edition_account: PublicKey.findProgramAddressSync(
          [
            Buffer.from("metadata"),
            new PublicKey(
              "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
            ).toBuffer(),
            mintKeypair.publicKey.toBuffer(),
            Buffer.from("edition"),
          ],
          new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
        )[0],
        mint_account: mintKeypair.publicKey,
        associated_token_account: await getAssociatedTokenAddress(
          mintKeypair.publicKey,
          wallet.publicKey
        ),
        token_program: TOKEN_PROGRAM_ID,
        token_metadata_program: new PublicKey(
          "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
        ),
        associated_token_program: new PublicKey(
          "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        ),
        system_program: SystemProgram.programId,
        payer: wallet.publicKey,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([wallet, mintKeypair])
      .rpc();

    console.log("Metadata:", {
      name: metadata.name,
      symbol: metadata.symbol,
      uri: metadataUrl,
      vegetationCoverage,
      hectaresNumber,
      specificAttributes,
      waterBodiesCount,
      springsCount,
      ongoingProjects,
      carRegistry,
    });

    console.log("Accounts:", {
      payer: wallet.publicKey.toString(),
      metadataAccount: PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          new PublicKey(
            "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
          ).toBuffer(),
          mintKeypair.publicKey.toBuffer(),
        ],
        new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
      )[0].toString(),
      editionAccount: PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          new PublicKey(
            "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
          ).toBuffer(),
          mintKeypair.publicKey.toBuffer(),
          Buffer.from("edition"),
        ],
        new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
      )[0].toString(),
      mintAccount: mintKeypair.publicKey.toString(),
      associatedTokenAccount: await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        wallet.publicKey
      ).toString(),
      tokenProgram: TOKEN_PROGRAM_ID,
      tokenMetadataProgram: new PublicKey(
        "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
      ).toString(),
      associatedTokenProgram: new PublicKey(
        "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
      ).toString(),
      systemProgram: SystemProgram.programId.toString(),
      rent: SYSVAR_RENT_PUBKEY.toString(),
    });

    res.json({
      success: true,
      signature: tx,
      mintAddress: mintKeypair.publicKey.toString(),
      metadataUrl,
    });
  } catch (error) {
    console.error("Erro ao mintar NFT:", error);
    res
      .status(500)
      .json({ error: "Erro ao mintar NFT", details: error.message });
  }
});

// Rota para mintar o NFT de coleção (versão simplificada)
app.post("/mint-collection", async (req, res) => {
  try {
    const { name, symbol, uri } = req.body;
    const mintKeypair = Keypair.generate();

    const tx = await program.methods
      .mintCollectionNft(name, symbol, uri)
      .accounts({
        payer: wallet.publicKey,
        mintAccount: mintKeypair.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([wallet, mintKeypair])
      .rpc();

    res.json({
      success: true,
      signature: tx,
      mintAddress: mintKeypair.publicKey.toString(),
    });
  } catch (error) {
    console.error("Erro ao mintar NFT de coleção:", error);
    res
      .status(500)
      .json({ error: "Erro ao mintar NFT de coleção", details: error.message });
  }
});

// Rota para transferir NFT
app.post("/transfer-nft", async (req, res) => {
  try {
    const { recipientAddress } = req.body;

    if (!NFT_MINT_ADDRESS) {
      return res.status(400).json({
        error:
          "NFT_MINT_ADDRESS não está configurado nas variáveis de ambiente",
      });
    }

    if (!recipientAddress) {
      return res.status(400).json({
        error: "Endereço do destinatário é necessário",
      });
    }

    // Converter endereços para PublicKey
    const mintPublicKey = new PublicKey(NFT_MINT_ADDRESS);
    const recipientPublicKey = new PublicKey(recipientAddress);

    // Obter endereço da conta de token associada do remetente (nossa carteira)
    const fromATA = await getAssociatedTokenAddress(
      mintPublicKey,
      wallet.publicKey
    );

    // Obter endereço da conta de token associada do destinatário
    const toATA = await getAssociatedTokenAddress(
      mintPublicKey,
      recipientPublicKey
    );

    // Criar instrução de transferência
    const tx = await program.methods
      .transfer()
      .accounts({
        from: fromATA,
        to: toATA,
        authority: wallet.publicKey,
        mint: mintPublicKey,
        recipient: recipientPublicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([wallet])
      .rpc();

    res.json({
      success: true,
      signature: tx,
    });
  } catch (error) {
    console.error("Erro ao transferir NFT:", error);
    res.status(500).json({
      error: "Erro ao transferir NFT",
      details: error.message,
    });
  }
});

// Rota para buscar NFTs de um endereço
app.get("/nfts", async (req, res) => {
  try {
    const { wallet } = req.query;

    if (!wallet) {
      return res.status(400).json({
        error: "Endereço da carteira é necessário",
      });
    }

    const metaplex = new Metaplex(connection);
    const ownerPublicKey = new PublicKey(wallet);

    // Busca todas as NFTs do endereço
    const nfts = await metaplex.nfts().findAllByOwner({
      owner: ownerPublicKey,
    });

    // Filtra apenas as NFTs do nosso programa
    const programNfts = nfts.filter((nft) =>
      nft.creators?.some((creator) => creator.address.toString() === PROGRAM_ID)
    );

    // Formata a resposta
    const formattedNfts = await Promise.all(
      programNfts.map(async (nft) => {
        try {
          return {
            address: nft.address.toString(),
            name: nft.name,
            symbol: nft.symbol,
            uri: nft.uri,
            image: nft.json?.image || null,
            attributes: nft.json?.attributes || [],
          };
        } catch (error) {
          console.error(
            `Erro ao formatar NFT ${nft.address.toString()}:`,
            error
          );
          return {
            address: nft.address.toString(),
            name: nft.name,
            symbol: nft.symbol,
            uri: nft.uri,
          };
        }
      })
    );

    res.json(formattedNfts);
  } catch (error) {
    console.error("Erro ao buscar NFTs:", error);
    res.status(500).json({
      error: "Erro ao buscar NFTs",
      details: error.message,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
