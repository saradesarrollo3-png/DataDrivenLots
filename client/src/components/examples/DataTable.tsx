import { DataTable } from "../data-table";
import { StatusBadge } from "../status-badge";

const mockData = [
  { id: "1", code: "MP-20250104-0001", product: "Pimiento Asado", quantity: 250, unit: "kg", status: "RECEPCION" },
  { id: "2", code: "MP-20250104-0002", product: "Pimiento Rojo", quantity: 180, unit: "kg", status: "EN_PROCESO" },
  { id: "3", code: "EN-20250103-0045", product: "Pimiento Asado", quantity: 450, unit: "tarros", status: "RETENIDO" },
  { id: "4", code: "EN-20250103-0044", product: "Pimiento Verde", quantity: 380, unit: "tarros", status: "APROBADO" },
  { id: "5", code: "EN-20250102-0038", product: "Pimiento Asado", quantity: 520, unit: "tarros", status: "EXPEDIDO" },
];

export default function DataTableExample() {
  return (
    <div className="p-8">
      <DataTable
        columns={[
          { key: "code", label: "Código Lote" },
          { key: "product", label: "Producto" },
          { 
            key: "quantity", 
            label: "Cantidad",
            render: (value, row) => `${value} ${row.unit}`
          },
          { 
            key: "status", 
            label: "Estado",
            render: (value) => <StatusBadge status={value} />
          },
        ]}
        data={mockData}
        onView={(row) => console.log("View:", row)}
        onEdit={(row) => console.log("Edit:", row)}
        onDelete={(row) => console.log("Delete:", row)}
      />
    </div>
  );
}
