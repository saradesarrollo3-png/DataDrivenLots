
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, FileSpreadsheet, ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function Auditoria() {
  const { toast } = useToast();
  const [reportType, setReportType] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [excelReportType, setExcelReportType] = useState<string>("");
  const [excelStartDate, setExcelStartDate] = useState<string>("");
  const [excelEndDate, setExcelEndDate] = useState<string>("");

  const handleDownloadPDF = async () => {
    if (!reportType) {
      toast({
        title: "Error",
        description: "Selecciona un tipo de reporte",
        variant: "destructive"
      });
      return;
    }

    try {
      const sessionId = localStorage.getItem('sessionId');
      const params = new URLSearchParams({
        type: reportType,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });

      const response = await fetch(`/api/admin/audit/pdf?${params}`, {
        headers: {
          'Authorization': `Bearer ${sessionId}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al generar el PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `auditoria_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "PDF generado",
        description: "El reporte se ha descargado correctamente"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo generar el PDF",
        variant: "destructive"
      });
    }
  };

  const handleDownloadExcel = async () => {
    if (!excelReportType) {
      toast({
        title: "Error",
        description: "Selecciona un tipo de reporte",
        variant: "destructive"
      });
      return;
    }

    try {
      const sessionId = localStorage.getItem('sessionId');
      const params = new URLSearchParams({
        type: excelReportType,
        ...(excelStartDate && { startDate: excelStartDate }),
        ...(excelEndDate && { endDate: excelEndDate }),
      });

      const response = await fetch(`/api/admin/audit/excel?${params}`, {
        headers: {
          'Authorization': `Bearer ${sessionId}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al generar el Excel');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `auditoria_${excelReportType}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Excel generado",
        description: "El reporte se ha descargado correctamente"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo generar el Excel",
        variant: "destructive"
      });
    }
  };

  const reportTypes = [
    { value: "batches", label: "Historial de Lotes" },
    { value: "production", label: "Registros de Producción" },
    { value: "quality", label: "Controles de Calidad" },
    { value: "shipments", label: "Expediciones" },
    { value: "delivery_notes", label: "Reportes por Albarán" },
    { value: "traceability", label: "Trazabilidad Completa" },
    { value: "stock", label: "Stock de Productos" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Auditoría</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Genera y descarga reportes en PDF y Excel para auditoría
        </p>
      </div>

      <Collapsible defaultOpen={true}>
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900">
          <CardHeader>
            <CollapsibleTrigger className="flex items-center justify-between w-full hover:opacity-80 transition-opacity">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                ℹ️ ¿Cómo usar la Auditoría?
              </CardTitle>
              <ChevronDown className="h-5 w-5 text-blue-600 dark:text-blue-400 transition-transform duration-200 data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium mb-2">🎯 Propósito</p>
            <p className="text-muted-foreground">
              La sección de Auditoría te permite generar reportes completos en <strong>PDF</strong> o <strong>Excel</strong> para revisiones internas, auditorías externas o análisis de datos históricos.
            </p>
          </div>
          
          <div>
            <p className="font-medium mb-2">📋 Pasos para generar un reporte</p>
            <ol className="list-decimal list-inside text-muted-foreground ml-4 space-y-1">
              <li>Selecciona el <strong>tipo de reporte</strong> que necesitas (historial de lotes, producción, calidad, etc.)</li>
              <li>Opcionalmente, filtra por <strong>rango de fechas</strong> (desde - hasta) para limitar el período del reporte</li>
              <li>Haz clic en <strong>"Descargar PDF"</strong> o <strong>"Descargar Excel"</strong> según prefieras</li>
              <li>El archivo se descargará automáticamente a tu dispositivo</li>
            </ol>
          </div>

          <div>
            <p className="font-medium mb-2">📊 Tipos de reportes disponibles</p>
            <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
              <li><strong>Historial de Lotes:</strong> Todos los movimientos y cambios de estado de cada lote</li>
              <li><strong>Registros de Producción:</strong> Detalles de asado, pelado, envasado y esterilizado</li>
              <li><strong>Controles de Calidad:</strong> Revisiones realizadas con sus resultados y fechas de caducidad</li>
              <li><strong>Expediciones:</strong> Albaranes de envío a clientes con trazabilidad completa</li>
              <li><strong>Reportes por Albarán:</strong> Búsqueda específica por número de albarán de recepción o expedición</li>
              <li><strong>Trazabilidad Completa:</strong> Registro cronológico de todos los eventos de trazabilidad</li>
              <li><strong>Stock de Productos:</strong> Inventario actual de todos los productos en almacén</li>
            </ul>
          </div>

          <div>
            <p className="font-medium mb-2">💡 Consejos de uso</p>
            <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
              <li>Si no especificas fechas, el reporte incluirá <strong>todos los registros históricos</strong></li>
              <li>Usa <strong>PDF</strong> para documentación oficial y presentaciones</li>
              <li>Usa <strong>Excel</strong> cuando necesites analizar o filtrar datos con mayor detalle</li>
              <li>Los reportes incluyen el nombre de tu organización y la fecha de generación automáticamente</li>
            </ul>
          </div>

          <div className="pt-2 border-t">
            <p className="text-muted-foreground italic">
              <strong>Nota:</strong> Los reportes reflejan el estado actual de la base de datos. Para auditorías oficiales, genera y archiva los reportes regularmente.
            </p>
          </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generar Reporte PDF
            </CardTitle>
            <CardDescription>
              Selecciona el tipo de reporte y el período para generar el PDF
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="report-type">Tipo de Reporte *</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger id="report-type">
                  <SelectValue placeholder="Seleccionar tipo de reporte" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-date">Fecha de Inicio</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">Fecha de Fin</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <Button 
              onClick={handleDownloadPDF} 
              className="w-full"
              disabled={!reportType}
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar PDF
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Generar Reporte Excel
            </CardTitle>
            <CardDescription>
              Selecciona el tipo de reporte y el período para generar el Excel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="excel-report-type">Tipo de Reporte *</Label>
              <Select value={excelReportType} onValueChange={setExcelReportType}>
                <SelectTrigger id="excel-report-type">
                  <SelectValue placeholder="Seleccionar tipo de reporte" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excel-start-date">Fecha de Inicio</Label>
              <Input
                id="excel-start-date"
                type="date"
                value={excelStartDate}
                onChange={(e) => setExcelStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="excel-end-date">Fecha de Fin</Label>
              <Input
                id="excel-end-date"
                type="date"
                value={excelEndDate}
                onChange={(e) => setExcelEndDate(e.target.value)}
              />
            </div>

            <Button 
              onClick={handleDownloadExcel} 
              className="w-full"
              disabled={!excelReportType}
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar Excel
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tipos de Reportes Disponibles</CardTitle>
            <CardDescription>
              Información incluida en cada tipo de reporte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium mb-1">Historial de Lotes</h4>
                <p className="text-muted-foreground">
                  Todos los movimientos y cambios de estado de los lotes
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Registros de Producción</h4>
                <p className="text-muted-foreground">
                  Detalles de todas las etapas de producción (asado, pelado, envasado, esterilizado)
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Controles de Calidad</h4>
                <p className="text-muted-foreground">
                  Revisiones de calidad realizadas con sus resultados
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Expediciones</h4>
                <p className="text-muted-foreground">
                  Historial de expediciones a clientes
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Reportes por Albarán</h4>
                <p className="text-muted-foreground">
                  Búsqueda y reporte detallado por número de albarán de recepción o expedición
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Trazabilidad Completa</h4>
                <p className="text-muted-foreground">
                  Registro completo de eventos de trazabilidad de todos los lotes
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Stock de Productos</h4>
                <p className="text-muted-foreground">
                  Estado actual del inventario de productos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
