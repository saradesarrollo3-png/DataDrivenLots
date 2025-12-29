import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { ethers } from "ethers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Box, ShieldCheck, XCircle } from "lucide-react";

// ABI mínimo para lectura (debe coincidir con el del server)
const ABI = [
  "function getBatchHistory(string _batchCode) public view returns (tuple(string batchCode, string productType, string currentStage, bool isQualityVerified, uint256 timestamp, address certifier)[])",
];

// Dirección del contrato (LA MISMA QUE EN EL SERVER)
const CONTRACT_ADDRESS = "0x...PON_TU_DIRECCION_AQUI...";

export default function VerifyBatch() {
  const [, params] = useRoute("/verify/:batchCode");
  const batchCode = params?.batchCode;

  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!batchCode) return;

    const fetchBlockchain = async () => {
      try {
        // Usamos un proveedor público (no requiere wallet del usuario)
        // Ejemplo para Polygon Amoy Testnet. Cambiar si usas otra red.
        const provider = new ethers.JsonRpcProvider(
          "https://rpc-amoy.polygon.technology",
        );
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

        const data = await contract.getBatchHistory(batchCode);
        // Convertir datos a formato usable
        const formatted = data.map((item: any) => ({
          stage: item.currentStage,
          product: item.productType,
          verified: item.isQualityVerified,
          timestamp: new Date(Number(item.timestamp) * 1000),
        }));

        setHistory(formatted);
      } catch (err: any) {
        console.error(err);
        setError(
          "No se pudo obtener la información de la cadena de bloques. Verifica tu conexión.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBlockchain();
  }, [batchCode]);

  if (loading)
    return <div className="p-8 text-center">Cargando datos inmutables...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">
            Certificado de Trazabilidad
          </h1>
          <p className="text-slate-500">
            Información verificada por Blockchain
          </p>
          <Badge
            variant="outline"
            className="text-lg px-4 py-1 border-primary text-primary"
          >
            Lote: {batchCode}
          </Badge>
        </div>

        <div className="grid gap-4">
          {history.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                No hay registros en blockchain para este lote.
              </CardContent>
            </Card>
          ) : (
            history.map((record, i) => (
              <Card
                key={i}
                className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Box className="w-5 h-5 text-slate-500" />
                      {record.stage}
                    </CardTitle>
                    <div className="flex flex-col items-end text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {record.timestamp.toLocaleDateString()}
                      </span>
                      <span>{record.timestamp.toLocaleTimeString()}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-slate-600">
                      Producto: <strong>{record.product}</strong>
                    </p>

                    {/* Mostrar sello de calidad si está verificado */}
                    {record.verified ? (
                      <div className="flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded-md mt-2 w-fit">
                        <ShieldCheck className="w-5 h-5" />
                        <span className="font-semibold text-sm">
                          Calidad Certificada en Blockchain
                        </span>
                      </div>
                    ) : record.stage === "CALIDAD" ? (
                      <div className="flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded-md mt-2 w-fit">
                        <XCircle className="w-5 h-5" />
                        <span className="font-semibold text-sm">
                          No Aprobado / Pendiente
                        </span>
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
