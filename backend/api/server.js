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
} = require("@solana/web3.js");
const { Program, AnchorProvider } = require("@project-serum/anchor");
const { PROGRAM_ID, NFT_MINTER_IDL } = require("../constants");
const {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} = require("@solana/spl-token");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const upload = multer({ dest: "uploads/" });

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;
const SOLANA_NETWORK = process.env.SOLANA_NETWORK || "devnet";
const WALLET_SECRET_KEY = Uint8Array.from(
  JSON.parse(process.env.WALLET_SECRET_KEY)
);

const connection = new Connection(clusterApiUrl(SOLANA_NETWORK));
const wallet = Keypair.fromSecretKey(WALLET_SECRET_KEY);

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

const program = new Program(NFT_MINTER_IDL, PROGRAM_ID, provider);

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
        vegetationCoverage,
        hectaresNumber,
        specificAttributes,
        waterBodiesCount,
        springsCount,
        ongoingProjects,
        carRegistry,
      })
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
