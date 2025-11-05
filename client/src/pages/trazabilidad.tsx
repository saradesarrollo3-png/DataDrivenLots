
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { StatusBadge } from "@/components/status-badge";

export default function Trazabilidad() {
  const [searchCode, setSearchCode] = useState("");
  const [selectedBatchCode, setSelectedBatchCode] = useState<string | null>(null);

  const { data: batchData, isLoading } = useQuery<any>({
    queryKey: ['/api/batches/code', selectedBatchCode],
    enabled: !!selectedBatchCode,
  });

  const { data: historyData = [] } = useQuery<any[]>({
    queryKey: ['/api/batch-history', batchData?.batch?.id],
    enabled: !!batchData?.batch?.id,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchCode.trim()) {
      setSelectedBatchCode(searchCode.trim());
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Trazabilidad</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Consulta el historial completo de cualquier lote
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Introduce el código de lote (ej: MP-20250104-0001)..."
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            className="pl-9"
            data-testid="input-search-batch"
          />
        </div>
        <Button type="submit" data-testid="button-search">
          Buscar
        </Button>
      </form>

      {isLoading && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Cargando...
          </CardContent>
        </Card>
      )}

      {!isLoading && selectedBatchCode && !batchData && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No se encontró ningún lote con el código "{selectedBatchCode}"
          </CardContent>
        </Card>
      )}

      {batchData && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información del Lote</CardTitle>
              <CardDescription>Código: {batchData.batch.batchCode}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Producto</p>
                  <p className="font-medium">{batchData.product?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Proveedor</p>
                  <p className="font-medium">{batchData.supplier?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cantidad</p>
                  <p className="font-medium">{batchData.batch.quantity} {batchData.batch.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <StatusBadge status={batchData.batch.status} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ubicación</p>
                  <p className="font-medium">{batchData.location?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Temperatura</p>
                  <p className="font-medium">
                    {batchData.batch.temperature ? `${parseFloat(batchData.batch.temperature).toFixed(1)}°C` : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha Recepción</p>
                  <p className="font-medium">
                    {new Date(batchData.batch.arrivedAt).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Albarán</p>
                  <p className="font-medium">{batchData.batch.deliveryNote || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historial de Movimientos</CardTitle>
              <CardDescription>
                Trazabilidad completa del lote desde su entrada
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay historial registrado para este lote
                </p>
              ) : (
                <div className="space-y-4">
                  {historyData.map((item: any) => (
                    <div key={item.history.id} className="flex gap-4 border-l-2 border-muted pl-4 pb-4">
                      <div className="flex-1">
                        <p className="font-medium capitalize">{item.history.action}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(item.history.createdAt).toLocaleString('es-ES')}
                        </p>
                        {item.history.notes && (
                          <p className="text-sm mt-1">{item.history.notes}</p>
                        )}
                        <div className="flex gap-4 mt-2">
                          {item.history.fromStatus && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Estado anterior: </span>
                              <StatusBadge status={item.history.fromStatus} />
                            </div>
                          )}
                          {item.history.toStatus && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Nuevo estado: </span>
                              <StatusBadge status={item.history.toStatus} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
