import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flame, Scissors, Package as PackageIcon, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";

interface ProductionBatch {
  id: string;
  code: string;
  product: string;
  quantity: number;
  unit: string;
  stage: string;
  createdAt: string;
}

export default function Produccion() {
  const { data: asadoRecords = [] } = useQuery<any[]>({
    queryKey: ['/api/production-records/stage/ASADO'],
  });

  const { data: peladoRecords = [] } = useQuery<any[]>({
    queryKey: ['/api/production-records/stage/PELADO'],
  });

  const { data: envasadoRecords = [] } = useQuery<any[]>({
    queryKey: ['/api/production-records/stage/ENVASADO'],
  });

  const { data: esterilizadoRecords = [] } = useQuery<any[]>({
    queryKey: ['/api/production-records/stage/ESTERILIZADO'],
  });

  const mapRecords = (records: any[]): ProductionBatch[] => 
    records.map(r => ({
      id: r.id,
      code: r.outputBatchCode,
      product: r.inputBatchCode,
      quantity: parseFloat(r.outputQuantity),
      unit: r.unit,
      stage: r.completedAt ? "Completado" : "Pendiente",
      createdAt: new Date(r.createdAt).toLocaleDateString('es-ES')
    }));

  const asadoBatches = mapRecords(asadoRecords);
  const peladoBatches = mapRecords(peladoRecords);
  const envasadoBatches = mapRecords(envasadoRecords);
  const esterilizadoBatches = mapRecords(esterilizadoRecords);

  const columns: Column<ProductionBatch>[] = [
    { 
      key: "code", 
      label: "Código Lote",
      render: (value) => <span className="font-mono font-medium">{value}</span>
    },
    { key: "product", label: "Producto" },
    { 
      key: "quantity", 
      label: "Cantidad",
      render: (value, row) => `${value} ${row.unit}`
    },
    { key: "createdAt", label: "Fecha" },
    { 
      key: "stage", 
      label: "Estado",
      render: (value) => (
        <StatusBadge 
          status={value === "Completado" ? "APROBADO" : "EN_PROCESO"} 
        />
      )
    },
  ];

  const stages = [
    {
      id: "asado",
      title: "Asado",
      icon: Flame,
      description: "Proceso de asado de materia prima",
      data: asadoBatches,
      color: "text-orange-600 dark:text-orange-400",
    },
    {
      id: "pelado",
      title: "Pelado y Corte",
      icon: Scissors,
      description: "Pelado y corte del producto asado",
      data: peladoBatches,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      id: "envasado",
      title: "Envasado",
      icon: PackageIcon,
      description: "Conversión a tarros y envasado",
      data: envasadoBatches,
      color: "text-green-600 dark:text-green-400",
    },
    {
      id: "esterilizado",
      title: "Esterilizado",
      icon: Droplets,
      description: "Esterilización y sellado final",
      data: esterilizadoBatches,
      color: "text-purple-600 dark:text-purple-400",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Producción</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestión de las 4 etapas del proceso productivo
        </p>
      </div>

      <Tabs defaultValue="asado" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          {stages.map((stage) => {
            const Icon = stage.icon;
            return (
              <TabsTrigger 
                key={stage.id} 
                value={stage.id}
                data-testid={`tab-${stage.id}`}
              >
                <Icon className={`h-4 w-4 mr-2 ${stage.color}`} />
                {stage.title}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {stages.map((stage) => (
          <TabsContent key={stage.id} value={stage.id} className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <stage.icon className={`h-5 w-5 ${stage.color}`} />
                      {stage.title}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {stage.description}
                    </CardDescription>
                  </div>
                  <Button data-testid={`button-new-${stage.id}`}>
                    Nuevo Proceso
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={columns}
                  data={stage.data}
                  onView={(row) => console.log(`View ${stage.id}:`, row)}
                  onEdit={(row) => console.log(`Edit ${stage.id}:`, row)}
                  emptyMessage={`No hay lotes en la etapa de ${stage.title.toLowerCase()}`}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
