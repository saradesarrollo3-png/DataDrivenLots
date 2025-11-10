
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

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
          Genera y descarga reportes en PDF para auditoría
        </p>
      </div>

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
