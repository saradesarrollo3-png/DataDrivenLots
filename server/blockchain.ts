import { ethers } from "ethers";
import QRCode from "qrcode";

// 1. Configuración de la red (CAMBIADO A SEPOLIA)
const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";

// 2. Leemos las claves de Replit Secrets
const PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.BLOCKCHAIN_CONTRACT_ADDRESS;

// ABI del contrato
const CONTRACT_ABI = [
  "function registerTraceabilityEvent(string _batchCode, string _productType, string _stage) public",
  "function certifyQuality(string _batchCode, bool _approved) public",
  "function getBatchHistory(string _batchCode) public view returns (tuple(string batchCode, string productType, string currentStage, bool isQualityVerified, uint256 timestamp, address certifier)[])",
];

let contract: any = null;

export async function initBlockchain() {
  if (!PRIVATE_KEY || !CONTRACT_ADDRESS) {
    console.error(
      "❌ ERROR: Faltan las claves en Secrets. Revisa BLOCKCHAIN_PRIVATE_KEY y BLOCKCHAIN_CONTRACT_ADDRESS",
    );
    return;
  }

  try {
    // Conectamos a Sepolia
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

    console.log("✅ Blockchain: Conectado a SEPOLIA (Ethereum)");

    // Verificamos el saldo
    const balance = await provider.getBalance(wallet.address);
    const balanceEnEth = ethers.formatEther(balance);
    console.log(`💰 Saldo disponible: ${balanceEnEth} ETH`);

    if (parseFloat(balanceEnEth) === 0) {
      console.warn(
        "⚠️ ALERTA: Tienes 0 ETH. No podrás escribir datos en la blockchain.",
      );
    }
  } catch (error) {
    console.error("❌ Error conectando a la blockchain:", error);
  }
}

export async function recordBatchOnChain(
  batchCode: string,
  productType: string,
  stage: string,
) {
  if (!contract) return null;
  try {
    console.log(`🔗 Enviando a Sepolia: ${batchCode} (${stage})...`);
    const tx = await contract.registerTraceabilityEvent(
      batchCode,
      productType,
      stage,
    );
    console.log(`   ✅ Transacción enviada. Hash: ${tx.hash}`);
    return tx.hash;
  } catch (error) {
    console.error("❌ Error escribiendo en Blockchain:", error);
    return null;
  }
}

export async function certifyBatchOnChain(
  batchCode: string,
  approved: boolean,
) {
  if (!contract) return null;
  try {
    console.log(`🔗 Certificando en Sepolia: ${batchCode}...`);
    const tx = await contract.certifyQuality(batchCode, approved);
    console.log(`   ✅ Certificación enviada. Hash: ${tx.hash}`);
    return tx.hash;
  } catch (error) {
    console.error("❌ Error certificando:", error);
    return null;
  }
}

export async function getBatchHistory(batchCode: string) {
  if (!CONTRACT_ADDRESS) return [];
  const readProvider = new ethers.JsonRpcProvider(RPC_URL);
  const readContract = new ethers.Contract(
    CONTRACT_ADDRESS,
    CONTRACT_ABI,
    readProvider,
  );

  try {
    const data = await readContract.getBatchHistory(batchCode);
    return data.map((item: any) => ({
      stage: item.currentStage,
      product: item.productType,
      verified: item.isQualityVerified,
      timestamp: Number(item.timestamp),
    }));
  } catch (error) {
    console.error("Error leyendo historial:", error);
    return [];
  }
}

export async function generateTraceabilityQR(batchCode: string) {
  const domain = `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
  const verificationUrl = `${domain}/verify/${batchCode}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(verificationUrl);
    return { qrCode: qrDataUrl, url: verificationUrl };
  } catch (err) {
    console.error(err);
    return null;
  }
}
