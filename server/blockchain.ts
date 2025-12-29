import { ethers } from "ethers";
import QRCode from "qrcode";

// Variables de entorno o valores por defecto
const RPC_URL =
  process.env.BLOCKCHAIN_RPC_URL || "https://rpc-amoy.polygon.technology";
const PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.BLOCKCHAIN_CONTRACT_ADDRESS;

// ABI Mínimo necesario
const CONTRACT_ABI = [
  "function registerTraceabilityEvent(string _batchCode, string _productType, string _stage) public",
  "function certifyQuality(string _batchCode, bool _approved) public",
  "function getBatchHistory(string _batchCode) public view returns (tuple(string batchCode, string productType, string currentStage, bool isQualityVerified, uint256 timestamp, address certifier)[])",
];

let contract: any = null;
let isSimulationMode = false;

// ALMACÉN LOCAL PARA SIMULACIÓN (Cuando no hay claves)
const localBlockchainStorage: Record<string, any[]> = {};

export async function initBlockchain() {
  if (!PRIVATE_KEY || !CONTRACT_ADDRESS) {
    console.warn(
      "⚠️ Blockchain: Faltan credenciales. ACTIVANDO MODO SIMULACIÓN (Mock Mode).",
    );
    isSimulationMode = true;
    return;
  }
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
    console.log("✅ Blockchain: Servicio Conectado a la red real.");
  } catch (error) {
    console.error(
      "❌ Blockchain: Error al conectar. Pasando a simulación.",
      error,
    );
    isSimulationMode = true;
  }
}

export async function recordBatchOnChain(
  batchCode: string,
  productType: string,
  stage: string,
) {
  // MODO SIMULACIÓN
  if (isSimulationMode || !contract) {
    console.log(
      `[SIMULACIÓN] 🔗 Registrando en bloque simulado: ${batchCode} - ${stage}`,
    );

    if (!localBlockchainStorage[batchCode]) {
      localBlockchainStorage[batchCode] = [];
    }

    localBlockchainStorage[batchCode].push({
      batchCode,
      productType,
      currentStage: stage,
      isQualityVerified: false,
      timestamp: Math.floor(Date.now() / 1000), // Unix timestamp
      certifier: "0x000000000000000000000000000000000000dEaD", // Dirección fake
    });

    return "0x-hash-simulado-" + Math.random().toString(36).substring(7);
  }

  // MODO REAL
  try {
    console.log(`🔗 Blockchain Real: Enviando tx para ${batchCode}...`);
    const tx = await contract.registerTraceabilityEvent(
      batchCode,
      productType,
      stage,
    );
    return tx.hash;
  } catch (error) {
    console.error("❌ Blockchain Error:", error);
    return null;
  }
}

export async function certifyBatchOnChain(
  batchCode: string,
  approved: boolean,
) {
  // MODO SIMULACIÓN
  if (isSimulationMode || !contract) {
    console.log(
      `[SIMULACIÓN] 🔗 Certificando calidad: ${batchCode} = ${approved}`,
    );
    if (
      localBlockchainStorage[batchCode] &&
      localBlockchainStorage[batchCode].length > 0
    ) {
      const lastRecord =
        localBlockchainStorage[batchCode][
          localBlockchainStorage[batchCode].length - 1
        ];
      lastRecord.isQualityVerified = approved;
    }
    return "0x-hash-cert-simulado-" + Math.random().toString(36).substring(7);
  }

  // MODO REAL
  try {
    const tx = await contract.certifyQuality(batchCode, approved);
    return tx.hash;
  } catch (error) {
    console.error("❌ Blockchain Error:", error);
    return null;
  }
}

// NUEVA FUNCIÓN: Obtener historial (sea real o simulado)
export async function getBatchHistory(batchCode: string) {
  // MODO SIMULACIÓN
  if (isSimulationMode || !contract) {
    return (localBlockchainStorage[batchCode] || []).map((record) => ({
      stage: record.currentStage,
      product: record.productType,
      verified: record.isQualityVerified,
      timestamp: record.timestamp,
      txHash: "simulated-tx",
    }));
  }

  // MODO REAL
  try {
    const data = await contract.getBatchHistory(batchCode);
    // Convertir respuesta de Solidity a objeto JS limpio
    return data.map((item: any) => ({
      stage: item.currentStage,
      product: item.productType,
      verified: item.isQualityVerified,
      timestamp: Number(item.timestamp),
      txHash: "real-tx", // En lecturas simples no siempre tenemos el hash de creación a mano
    }));
  } catch (error) {
    console.error("Error leyendo blockchain:", error);
    return [];
  }
}

export async function generateTraceabilityQR(batchCode: string) {
  // En Replit, usamos la URL dinámica del entorno
  const domain = `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
  // O fallback a localhost si estás en local
  const baseUrl = process.env.REPL_SLUG ? domain : "http://localhost:5000";

  const verificationUrl = `${baseUrl}/verify/${batchCode}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(verificationUrl);
    return { qrCode: qrDataUrl, url: verificationUrl };
  } catch (err) {
    console.error(err);
    return null;
  }
}
