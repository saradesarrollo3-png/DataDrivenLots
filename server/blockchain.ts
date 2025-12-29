import { ethers } from "ethers";
import QRCode from "qrcode";

// Configuración básica (Deberías usar variables de entorno)
const RPC_URL = process.env.BLOCKCHAIN_RPC_URL || "https://polygon-rpc.com"; // Ejemplo Polygon
const PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.BLOCKCHAIN_CONTRACT_ADDRESS;

// ABI simplificado del contrato de arriba
const CONTRACT_ABI = [
  "function registerTraceabilityEvent(string _batchCode, string _productType, string _stage) public",
  "function certifyQuality(string _batchCode, bool _approved) public",
  "function getBatchHistory(string _batchCode) public view returns (tuple(string batchCode, string productType, string currentStage, bool isQualityVerified, uint256 timestamp, address certifier)[])",
];

let contract: ethers.Contract | null = null;

export async function initBlockchain() {
  if (!PRIVATE_KEY || !CONTRACT_ADDRESS) {
    console.warn("Blockchain credentials not found. Skipping initialization.");
    return;
  }
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
  console.log("Blockchain Service Initialized");
}

export async function recordBatchOnChain(
  batchCode: string,
  productType: string,
  stage: string,
) {
  if (!contract) return;
  try {
    const tx = await contract.registerTraceabilityEvent(
      batchCode,
      productType,
      stage,
    );
    console.log(`Transaction sent: ${tx.hash}`);
    // No esperamos la confirmación (tx.wait()) para no bloquear la respuesta HTTP,
    // pero en producción deberías manejar esto con una cola de tareas.
    return tx.hash;
  } catch (error) {
    console.error("Blockchain Error:", error);
    return null;
  }
}

export async function certifyBatchOnChain(
  batchCode: string,
  approved: boolean,
) {
  if (!contract) return;
  try {
    const tx = await contract.certifyQuality(batchCode, approved);
    console.log(`Quality certification sent: ${tx.hash}`);
    return tx.hash;
  } catch (error) {
    console.error("Blockchain Certification Error:", error);
    return null;
  }
}

// 3. Generación de Códigos QR
export async function generateTraceabilityQR(batchCode: string) {
  // La URL apuntaría a una página pública de tu app que consulta la blockchain
  const verificationUrl = `https://tu-app.com/verify/${batchCode}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(verificationUrl);
    return qrDataUrl;
  } catch (err) {
    console.error(err);
    return null;
  }
}
