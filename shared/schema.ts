import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  decimal,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const batchStatusEnum = pgEnum("batch_status", [
  "RECEPCION",
  "EN_PROCESO",
  "ASADO",
  "PELADO",
  "ENVASADO",
  "ESTERILIZADO",
  "RETENIDO",
  "APROBADO",
  "BLOQUEADO",
  "EXPEDIDO",
]);

export const locationTypeEnum = pgEnum("location_type", [
  "RECEPCION",
  "PRODUCCION",
  "CALIDAD",
  "EXPEDICION",
]);

export const productionStageEnum = pgEnum("production_stage", [
  "ASADO",
  "PELADO",
  "ENVASADO",
  "ESTERILIZADO",
]);

// Organizations
export const organizations = pgTable("organizations", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Users
export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  organizationId: varchar("organization_id")
    .references(() => organizations.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Suppliers
export const suppliers = pgTable("suppliers", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id")
    .references(() => organizations.id)
    .notNull(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  contact: text("contact"),
  phone: text("phone"),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Products
export const products = pgTable("products", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id")
    .references(() => organizations.id)
    .notNull(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  format: text("format"),
  shelfLife: integer("shelf_life").notNull(), // days
  createdAt: timestamp("created_at").defaultNow(),
});

// Locations
export const locations = pgTable("locations", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id")
    .references(() => organizations.id)
    .notNull(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  type: locationTypeEnum("type").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Customers
export const customers = pgTable("customers", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id")
    .references(() => organizations.id)
    .notNull(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  contact: text("contact"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Package Types
export const packageTypes = pgTable("package_types", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id")
    .references(() => organizations.id)
    .notNull(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  capacity: decimal("capacity", { precision: 10, scale: 2 }),
  unit: text("unit"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Batches
export const batches = pgTable("batches", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id")
    .references(() => organizations.id)
    .notNull(),
  batchCode: text("batch_code").notNull(),
  supplierId: varchar("supplier_id").references(() => suppliers.id),
  productId: varchar("product_id")
    .references(() => products.id)
    .notNull(),
  initialQuantity: decimal("initial_quantity", {
    precision: 10,
    scale: 2,
  }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  temperature: decimal("temperature", { precision: 5, scale: 2 }),
  truckPlate: text("truck_plate"),
  deliveryNote: text("delivery_note"),
  locationId: varchar("location_id").references(() => locations.id),
  status: batchStatusEnum("status").notNull().default("RECEPCION"),
  manufactureDate: timestamp("manufacture_date"),
  expiryDate: timestamp("expiry_date"),
  arrivedAt: timestamp("arrived_at").defaultNow(),
  processedDate: timestamp("processed_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Production Records
export const productionRecords = pgTable("production_records", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id")
    .references(() => organizations.id)
    .notNull(),
  batchId: varchar("batch_id")
    .references(() => batches.id)
    .notNull(),
  stage: productionStageEnum("stage").notNull(),
  inputBatchCode: text("input_batch_code").notNull(),
  outputBatchCode: text("output_batch_code").notNull(),
  inputQuantity: decimal("input_quantity", {
    precision: 10,
    scale: 2,
  }).notNull(),
  outputQuantity: decimal("output_quantity", {
    precision: 10,
    scale: 2,
  }).notNull(),
  unit: text("unit").notNull(),
  inputBatchDetails: text("input_batch_details"), // JSON: [{batchId, batchCode, quantity}]
  notes: text("notes"),
  processedDate: timestamp("processed_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Quality Checklist Templates
export const qualityChecklistTemplates = pgTable(
  "quality_checklist_templates",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    organizationId: varchar("organization_id")
      .references(() => organizations.id)
      .notNull(),
    label: text("label").notNull(),
    order: integer("order").notNull().default(0),
    isActive: integer("is_active").notNull().default(1),
    createdAt: timestamp("created_at").defaultNow(),
  },
);

// Quality Checks
export const qualityChecks = pgTable("quality_checks", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id")
    .references(() => organizations.id)
    .notNull(),
  batchId: varchar("batch_id")
    .references(() => batches.id)
    .notNull(),
  checkedBy: varchar("checked_by").references(() => users.id),
  approved: integer("approved").notNull().default(0), // 0 = pending, 1 = approved, -1 = rejected
  notes: text("notes"),
  checklistData: text("checklist_data"), // JSON string
  processedDate: timestamp("processed_date"), // Fecha y hora de revisión ingresada manualmente
  checkedAt: timestamp("checked_at").defaultNow(),
});

// Shipments
export const shipments = pgTable("shipments", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id")
    .references(() => organizations.id)
    .notNull(),
  shipmentCode: text("shipment_code").notNull().unique(),
  customerId: varchar("customer_id")
    .references(() => customers.id)
    .notNull(),
  batchId: varchar("batch_id")
    .references(() => batches.id)
    .notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  truckPlate: text("truck_plate"),
  deliveryNote: text("delivery_note"),
  shippedAt: timestamp("shipped_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Batch History/Traceability
export const batchHistory = pgTable("batch_history", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id")
    .references(() => organizations.id)
    .notNull(),
  batchId: varchar("batch_id")
    .references(() => batches.id)
    .notNull(),
  action: text("action").notNull(), // 'created', 'moved', 'processed', 'quality_check', 'shipped'
  fromStatus: batchStatusEnum("from_status"),
  toStatus: batchStatusEnum("to_status"),
  fromLocation: varchar("from_location").references(() => locations.id),
  toLocation: varchar("to_location").references(() => locations.id),
  notes: text("notes"),
  performedBy: varchar("performed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Product Stock
export const productStock = pgTable("product_stock", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id")
    .references(() => organizations.id)
    .notNull(),
  productId: varchar("product_id")
    .references(() => products.id)
    .notNull(),
  unit: text("unit").notNull(),
  quantity: decimal("quantity", { precision: 15, scale: 2 })
    .notNull()
    .default("0"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Traceability Events
export const traceabilityEvents = pgTable("traceability_events", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id")
    .references(() => organizations.id)
    .notNull(),
  eventType: text("event_type").notNull(), // 'RECEPCION', 'ASADO', 'PELADO', 'ENVASADO', 'ESTERILIZADO', 'CALIDAD', 'EXPEDICION'
  fromStage: batchStatusEnum("from_stage"),
  toStage: batchStatusEnum("to_stage"),

  // Lotes involucrados
  inputBatchIds: text("input_batch_ids"), // JSON array de IDs
  inputBatchCodes: text("input_batch_codes"), // JSON array de códigos
  outputBatchId: varchar("output_batch_id").references(() => batches.id),
  outputBatchCode: text("output_batch_code"),

  // Cantidades
  inputQuantities: text("input_quantities"), // JSON: [{batchId, batchCode, quantity, unit}]
  outputQuantity: decimal("output_quantity", { precision: 10, scale: 2 }),
  outputUnit: text("output_unit"),

  // Contexto adicional
  supplierId: varchar("supplier_id").references(() => suppliers.id),
  supplierName: text("supplier_name"),
  productId: varchar("product_id").references(() => products.id),
  productName: text("product_name"),
  packageType: text("package_type"), // Tipo de envase si aplica

  // Control de calidad
  qualityCheckId: varchar("quality_check_id").references(
    () => qualityChecks.id,
  ),
  qualityApproved: integer("quality_approved"), // 1=aprobado, -1=rechazado, 0=pendiente

  // Expedición
  shipmentId: varchar("shipment_id").references(() => shipments.id),
  shipmentCode: text("shipment_code"),
  customerId: varchar("customer_id").references(() => customers.id),
  customerName: text("customer_name"),
  deliveryNote: text("delivery_note"),

  // Trazabilidad de temperatura y otros datos
  temperature: decimal("temperature", { precision: 5, scale: 2 }),
  notes: text("notes"),

  // Auditoría
  performedBy: varchar("performed_by").references(() => users.id),
  performedAt: timestamp("performed_at").defaultNow(),
  processedDate: timestamp("processed_date"),
  txHash: text("tx_hash"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  organizationName: z.string().min(3),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
});
export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});
export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
  createdAt: true,
});
export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});
export const insertPackageTypeSchema = createInsertSchema(packageTypes).omit({
  id: true,
  createdAt: true,
});
export const insertBatchSchema = createInsertSchema(batches)
  .omit({ id: true, createdAt: true })
  .extend({
    productId: z.string().optional().nullable(),
    supplierId: z.string().optional().nullable(),
    temperature: z.string().optional().nullable(),
    truckPlate: z.string().optional().nullable(),
    locationId: z.string().optional().nullable(),
    processedDate: z.string().optional(),
  });
export const insertProductionRecordSchema = createInsertSchema(
  productionRecords,
)
  .omit({ id: true, createdAt: true, organizationId: true })
  .extend({
    completedAt: z.string().optional(),
    processedDate: z.string().optional(),
  });
export const insertQualityChecklistTemplateSchema = createInsertSchema(
  qualityChecklistTemplates,
).omit({ id: true, createdAt: true });
export const insertQualityCheckSchema = createInsertSchema(qualityChecks)
  .omit({ id: true, organizationId: true })
  .extend({
    processedDate: z.string().optional(),
  });
export const insertShipmentSchema = createInsertSchema(shipments).omit({
  id: true,
  createdAt: true,
  organizationId: true,
});
export const insertBatchHistorySchema = createInsertSchema(batchHistory).omit({
  id: true,
  createdAt: true,
  organizationId: true,
});
export const insertProductStockSchema = createInsertSchema(productStock).omit({
  id: true,
  updatedAt: true,
});
export const insertTraceabilityEventSchema = createInsertSchema(
  traceabilityEvents,
).omit({
  id: true,
  createdAt: true,
  organizationId: true,
});

// Types
export type Organization = typeof organizations.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type RegisterData = z.infer<typeof registerSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type Supplier = typeof suppliers.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Location = typeof locations.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type PackageType = typeof packageTypes.$inferSelect;
export type Batch = typeof batches.$inferSelect;
export type ProductionRecord = typeof productionRecords.$inferSelect;
export type QualityChecklistTemplate =
  typeof qualityChecklistTemplates.$inferSelect;
export type QualityCheck = typeof qualityChecks.$inferSelect;
export type Shipment = typeof shipments.$inferSelect;
export type BatchHistory = typeof batchHistory.$inferSelect;
export type ProductStock = typeof productStock.$inferSelect;
export type TraceabilityEvent = typeof traceabilityEvents.$inferSelect;
