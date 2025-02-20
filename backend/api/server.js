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
const { Metaplex, keypairIdentity } = require("@metaplex-foundation/js");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const upload = multer({ dest: "uploads/" });

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;
const secretKey = Uint8Array.from(JSON.parse(process.env.WALLET_SECRET_KEY));

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
const wallet = Keypair.fromSecretKey(secretKey);

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

const program = new Program(
  NFT_MINTER_IDL,
  new PublicKey(PROGRAM_ID),
  provider
);

const NFT_MINT_ADDRESS = process.env.NFT_MINT_ADDRESS;

// Function to upload image to Pinata
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

// Function to upload JSON metadata to Pinata
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

app.post("/upload-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
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
    console.error("Error uploading image:", error);
    res
      .status(500)
      .json({ error: "Error uploading image", details: error.message });
  }
});

async function transferNFT(recipientAddress, mintAddress) {
  try {
    const metaplex = new Metaplex(connection);
    metaplex.use(keypairIdentity(wallet));

    const mintPublicKey = new PublicKey(mintAddress);
    const recipientPublicKey = new PublicKey(recipientAddress);

    const nft = await metaplex
      .nfts()
      .findByMint({ mintAddress: mintPublicKey });

    const { response } = await metaplex.nfts().transfer({
      nftOrSft: {
        address: mintPublicKey,
        tokenStandard: nft.tokenStandard,
      },
      fromOwner: wallet.publicKey,
      toOwner: recipientPublicKey,
    });

    return {
      success: true,
      signature: response.signature,
    };
  } catch (error) {
    console.error("Detailed error transferring NFT:", error);
    throw error;
  }
}

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
      recipientAddress,
    } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: "Image URL is required" });
    }

    if (!recipientAddress) {
      return res.status(400).json({ error: "Recipient address is required" });
    }

    // Create and upload complete metadata to IPFS
    const nftMetadata = {
      name: "Preservation Certificate",
      symbol: "CPNFT",
      description: "Environmental Preservation Certificate",
      image: imageUrl,
      attributes: [
        { trait_type: "Vegetation Coverage", value: vegetationCoverage },
        { trait_type: "Hectares Number", value: hectaresNumber },
        { trait_type: "Specific Attributes", value: specificAttributes },
        { trait_type: "Water Bodies", value: waterBodiesCount },
        { trait_type: "Springs", value: springsCount },
        { trait_type: "Ongoing Projects", value: ongoingProjects },
        { trait_type: "CAR Registry", value: carRegistry },
      ],
    };

    // Upload to IPFS
    const pinataResponse = await uploadJSONToPinata(nftMetadata);
    const metadataUrl = `ipfs://${pinataResponse.IpfsHash}`;

    // For the NFT, we send only the necessary fields (keeping original values)
    const mintKeypair = Keypair.generate();

    const tx = await program.methods
      .mintCertificationNft({
        name: "Preservation Certificate",
        symbol: "CPNFT",
        uri: metadataUrl,
      })
      .accounts({
        payer: wallet.publicKey,
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
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([wallet, mintKeypair])
      .rpc({
        commitment: "processed",
      });

    console.log("Metadata:", {
      name: "Preservation Certificate",
      symbol: "CPNFT",
      uri: metadataUrl,
      vegetationCoverage,
      hectaresNumber,
      specificAttributes,
      waterBodiesCount,
      springsCount,
      ongoingProjects,
      carRegistry,
    });

    // After successful mint, transfer the NFT using the correct mintAddress
    try {
      await transferNFT(recipientAddress, mintKeypair.publicKey.toString());
      console.log("NFT transferred successfully to:", recipientAddress);
    } catch (transferError) {
      console.error("Error transferring NFT:", transferError);
      // Even if the transfer fails, we return success of the mint
    }

    res.json({
      success: true,
      mintAddress: mintKeypair.publicKey.toString(),
      metadataUrl,
      signature: tx,
    });
  } catch (error) {
    console.error("Error minting NFT:", error);
    res.status(500).json({
      error: "Error minting NFT",
      details: error.message,
    });
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
    console.error("Error minting NFT of collection:", error);
    res.status(500).json({
      error: "Error minting NFT of collection",
      details: error.message,
    });
  }
});

// Function to get metadata from Pinata
async function getPinataMetadata(uri) {
  try {
    const cleanedHash = uri.replace(/^ipfs:\/\//, "").replace(/^ipfs:/, "");
    const metadataIPFS = `https://gateway.pinata.cloud/ipfs/${cleanedHash}`;

    const response = await axios.get(metadataIPFS);
    const data = response.data;

    // Clean up image hash
    const cleanedImg = data.image
      .replace(/^ipfs:\/\//, "")
      .replace(/^ipfs:/, "");

    return {
      image: `https://gateway.pinata.cloud/ipfs/${cleanedImg}`,
      attributes: data.attributes || [],
      description: data.description,
    };
  } catch (error) {
    console.error("Error getting metadata from Pinata:", error);
    return {
      image: null,
      attributes: [],
      description: null,
    };
  }
}

// Rota para buscar NFTs de um endereço
app.get("/nfts", async (req, res) => {
  try {
    const { wallet } = req.query;

    if (!wallet) {
      return res.status(400).json({
        error: "Wallet address is required",
      });
    }

    const metaplex = new Metaplex(connection);
    const ownerPublicKey = new PublicKey(wallet);

    const nfts = await metaplex.nfts().findAllByOwner({
      owner: ownerPublicKey,
    });

    const programNfts = nfts.filter((nft) => {
      return (
        nft.creators?.some(
          (creator) => creator.address.toString() === PROGRAM_ID
        ) || nft.symbol === "CPNFT"
      );
    });

    // Format the response including Pinata metadata
    const formattedNfts = await Promise.all(
      programNfts.map(async (nft) => {
        try {
          const metadata = await getPinataMetadata(nft.uri);

          return {
            address: nft.address.toString(),
            name: nft.name,
            symbol: nft.symbol,
            uri: nft.uri,
            image: metadata.image,
            attributes: metadata.attributes,
            description: metadata.description,
          };
        } catch (error) {
          console.error(
            `Error formatting NFT ${nft.address.toString()}:`,
            error
          );
          return {
            address: nft.address.toString(),
            name: nft.name,
            symbol: nft.symbol,
            uri: nft.uri,
            image: null,
            attributes: [],
            description: null,
          };
        }
      })
    );

    res.json(formattedNfts);
  } catch (error) {
    console.error("Error getting NFTs:", error);
    res.status(500).json({
      error: "Error getting NFTs",
      details: error.message,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
