import { db } from "./db";
import {
  suppliers, products, locations, customers, packageTypes, batches,
  productionRecords, qualityChecks, shipments, batchHistory,
  type Supplier, type Product, type Location, type Customer, type PackageType,
  type Batch, type ProductionRecord, type QualityCheck, type Shipment, type BatchHistory
} from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";

export const storage = {
  // Suppliers
  async getSuppliers(organizationId: string) {
    return db.select().from(suppliers).where(eq(suppliers.organizationId, organizationId)).orderBy(suppliers.name);
  },
  async getSupplierById(id: string, organizationId: string) {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id), eq(suppliers.organizationId, organizationId));
    return supplier;
  },
  async insertSupplier(data: typeof suppliers.$inferInsert) {
    const [supplier] = await db.insert(suppliers).values(data).returning();
    return supplier;
  },
  async updateSupplier(id: string, data: Partial<typeof suppliers.$inferInsert>, organizationId: string) {
    const [supplier] = await db.update(suppliers).set(data).where(eq(suppliers.id, id), eq(suppliers.organizationId, organizationId)).returning();
    return supplier;
  },
  async deleteSupplier(id: string, organizationId: string) {
    await db.delete(suppliers).where(eq(suppliers.id, id), eq(suppliers.organizationId, organizationId));
  },

  // Products
  async getProducts(organizationId: string) {
    return db.select().from(products).where(eq(products.organizationId, organizationId)).orderBy(products.name);
  },
  async getProductById(id: string, organizationId: string) {
    const [product] = await db.select().from(products).where(eq(products.id, id), eq(products.organizationId, organizationId));
    return product;
  },
  async insertProduct(data: typeof products.$inferInsert) {
    const [product] = await db.insert(products).values(data).returning();
    return product;
  },
  async updateProduct(id: string, data: Partial<typeof products.$inferInsert>, organizationId: string) {
    const [product] = await db.update(products).set(data).where(eq(products.id, id), eq(products.organizationId, organizationId)).returning();
    return product;
  },
  async deleteProduct(id: string, organizationId: string) {
    await db.delete(products).where(eq(products.id, id), eq(products.organizationId, organizationId));
  },

  // Locations
  async getLocations(organizationId: string) {
    return db.select().from(locations).where(eq(locations.organizationId, organizationId)).orderBy(locations.name);
  },
  async getLocationById(id: string, organizationId: string) {
    const [location] = await db.select().from(locations).where(eq(locations.id, id), eq(locations.organizationId, organizationId));
    return location;
  },
  async insertLocation(data: typeof locations.$inferInsert) {
    const [location] = await db.insert(locations).values(data).returning();
    return location;
  },
  async updateLocation(id: string, data: Partial<typeof locations.$inferInsert>, organizationId: string) {
    const [location] = await db.update(locations).set(data).where(eq(locations.id, id), eq(locations.organizationId, organizationId)).returning();
    return location;
  },
  async deleteLocation(id: string, organizationId: string) {
    await db.delete(locations).where(eq(locations.id, id), eq(locations.organizationId, organizationId));
  },

  // Customers
  async getCustomers(organizationId: string) {
    return db.select().from(customers).where(eq(customers.organizationId, organizationId)).orderBy(customers.name);
  },
  async getCustomerById(id: string, organizationId: string) {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id), eq(customers.organizationId, organizationId));
    return customer;
  },
  async insertCustomer(data: typeof customers.$inferInsert) {
    const [customer] = await db.insert(customers).values(data).returning();
    return customer;
  },
  async updateCustomer(id: string, data: Partial<typeof customers.$inferInsert>, organizationId: string) {
    const [customer] = await db.update(customers).set(data).where(eq(customers.id, id), eq(customers.organizationId, organizationId)).returning();
    return customer;
  },
  async deleteCustomer(id: string, organizationId: string) {
    await db.delete(customers).where(eq(customers.id, id), eq(customers.organizationId, organizationId));
  },

  // Package Types
  async getPackageTypes(organizationId: string) {
    return db.select().from(packageTypes).where(eq(packageTypes.organizationId, organizationId)).orderBy(packageTypes.name);
  },
  async getPackageTypeById(id: string, organizationId: string) {
    const [packageType] = await db.select().from(packageTypes).where(eq(packageTypes.id, id), eq(packageTypes.organizationId, organizationId));
    return packageType;
  },
  async insertPackageType(data: typeof packageTypes.$inferInsert) {
    const [packageType] = await db.insert(packageTypes).values(data).returning();
    return packageType;
  },
  async updatePackageType(id: string, data: Partial<typeof packageTypes.$inferInsert>, organizationId: string) {
    const [packageType] = await db.update(packageTypes).set(data).where(eq(packageTypes.id, id), eq(packageTypes.organizationId, organizationId)).returning();
    return packageType;
  },
  async deletePackageType(id: string, organizationId: string) {
    await db.delete(packageTypes).where(eq(packageTypes.id, id), eq(packageTypes.organizationId, organizationId));
  },

  // Batches
  async getBatches(organizationId: string) {
    return db.select({
      batch: batches,
      supplier: suppliers,
      product: products,
      location: locations
    })
    .from(batches)
    .leftJoin(suppliers, eq(batches.supplierId, suppliers.id))
    .leftJoin(products, eq(batches.productId, products.id))
    .leftJoin(locations, eq(batches.locationId, locations.id))
    .where(eq(batches.organizationId, organizationId))
    .orderBy(desc(batches.createdAt));
  },
  async getBatchById(id: string, organizationId: string) {
    const [result] = await db.select({
      batch: batches,
      supplier: suppliers,
      product: products,
      location: locations
    })
    .from(batches)
    .leftJoin(suppliers, eq(batches.supplierId, suppliers.id))
    .leftJoin(products, eq(batches.productId, products.id))
    .leftJoin(locations, eq(batches.locationId, locations.id))
    .where(eq(batches.id, id), eq(batches.organizationId, organizationId));
    return result;
  },
  async getBatchByCode(batchCode: string, organizationId: string) {
    const [result] = await db.select({
      batch: batches,
      supplier: suppliers,
      product: products,
      location: locations
    })
    .from(batches)
    .leftJoin(suppliers, eq(batches.supplierId, suppliers.id))
    .leftJoin(products, eq(batches.productId, products.id))
    .leftJoin(locations, eq(batches.locationId, locations.id))
    .where(eq(batches.batchCode, batchCode), eq(batches.organizationId, organizationId));
    return result;
  },
  async insertBatch(data: typeof batches.$inferInsert) {
    const [batch] = await db.insert(batches).values(data).returning();
    return batch;
  },
  async updateBatch(id: string, data: Partial<typeof batches.$inferInsert>, organizationId: string) {
    const [batch] = await db.update(batches).set(data).where(eq(batches.id, id), eq(batches.organizationId, organizationId)).returning();
    return batch;
  },

  // Production Records
  async getProductionRecords(organizationId: string) {
    return db.select().from(productionRecords).where(eq(productionRecords.organizationId, organizationId)).orderBy(desc(productionRecords.createdAt));
  },
  async getProductionRecordsByStage(stage: string, organizationId: string) {
    return db.select().from(productionRecords).where(eq(productionRecords.stage, stage), eq(productionRecords.organizationId, organizationId));
  },
  async insertProductionRecord(data: typeof productionRecords.$inferInsert) {
    const [record] = await db.insert(productionRecords).values(data).returning();
    return record;
  },

  // Quality Checks
  async getQualityChecks(organizationId: string) {
    return db.select({
      check: qualityChecks,
      batch: batches,
      product: products
    })
    .from(qualityChecks)
    .leftJoin(batches, eq(qualityChecks.batchId, batches.id))
    .leftJoin(products, eq(batches.productId, products.id))
    .where(eq(qualityChecks.organizationId, organizationId))
    .orderBy(desc(qualityChecks.checkedAt));
  },
  async getPendingQualityChecks(organizationId: string) {
    return db.select({
      batch: batches,
      product: products
    })
    .from(batches)
    .leftJoin(products, eq(batches.productId, products.id))
    .where(eq(batches.status, 'RETENIDO'), eq(batches.organizationId, organizationId));
  },
  async insertQualityCheck(data: typeof qualityChecks.$inferInsert) {
    const [check] = await db.insert(qualityChecks).values(data).returning();
    return check;
  },

  // Shipments
  async getShipments(organizationId: string) {
    return db.select({
      shipment: shipments,
      customer: customers,
      batch: batches,
      product: products
    })
    .from(shipments)
    .leftJoin(customers, eq(shipments.customerId, customers.id))
    .leftJoin(batches, eq(shipments.batchId, batches.id))
    .leftJoin(products, eq(batches.productId, products.id))
    .where(eq(shipments.organizationId, organizationId))
    .orderBy(desc(shipments.shippedAt));
  },
  async insertShipment(data: typeof shipments.$inferInsert) {
    const [shipment] = await db.insert(shipments).values(data).returning();
    return shipment;
  },

  // Batch History
  async getBatchHistory(batchId: string, organizationId: string) {
    return db.select({
      history: batchHistory,
      fromLocation: locations,
      toLocation: locations
    })
    .from(batchHistory)
    .leftJoin(locations, eq(batchHistory.fromLocation, locations.id))
    .leftJoin(locations, eq(batchHistory.toLocation, locations.id))
    .where(eq(batchHistory.batchId, batchId), eq(batchHistory.organizationId, organizationId))
    .orderBy(desc(batchHistory.createdAt));
  },
  async getAllBatchHistory(organizationId: string) {
    return db.select({
      history: batchHistory,
      batch: batches,
      product: products
    })
    .from(batchHistory)
    .leftJoin(batches, eq(batchHistory.batchId, batches.id))
    .leftJoin(products, eq(batches.productId, products.id))
    .where(eq(batchHistory.organizationId, organizationId))
    .orderBy(desc(batchHistory.createdAt));
  },
  async insertBatchHistory(data: typeof batchHistory.$inferInsert) {
    const [history] = await db.insert(batchHistory).values(data).returning();
    return history;
  },
};