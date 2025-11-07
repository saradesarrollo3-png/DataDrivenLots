import { db } from "./db";
import {
  suppliers, products, locations, customers, packageTypes, batches,
  productionRecords, qualityChecks, shipments, batchHistory, productStock,
  qualityChecklistTemplates, traceabilityEvents, // Import the new table
  type Supplier, type Product, type Location, type Customer, type PackageType,
  type Batch, type ProductionRecord, type QualityCheck, type Shipment, type BatchHistory, type ProductStock,
  type QualityChecklistTemplate
} from "@shared/schema";
import { eq, desc, sql, and } from "drizzle-orm";

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
  async updateSupplier(id: string, data: Partial<typeof suppliers.$inferInsert>) {
    const [supplier] = await db.update(suppliers).set(data).where(eq(suppliers.id, id)).returning();
    return supplier;
  },
  async deleteSupplier(id: string) {
    await db.delete(suppliers).where(eq(suppliers.id, id));
    return { success: true }; // Ensure JSON response
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
    return { success: true }; // Ensure JSON response
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
    return { success: true }; // Ensure JSON response
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
    return { success: true }; // Ensure JSON response
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
    return { success: true }; // Ensure JSON response
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
  async getBatchesByStatus(status: string, organizationId: string) {
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
    .where(
      sql`${batches.organizationId} = ${organizationId} AND ${batches.status} = ${status}`
    )
    .orderBy(desc(batches.createdAt));
  },
  async insertBatch(data: typeof batches.$inferInsert) {
    const [batch] = await db.insert(batches).values(data).returning();
    return batch;
  },
  async updateBatch(id: string, data: Partial<Batch>) { // Assuming Batch type is available
    const [batch] = await db.update(batches)
      .set(data)
      .where(eq(batches.id, id))
      .returning();
    return batch;
  },

  async deleteBatch(id: string) {
    // First delete related production records
    await db.delete(productionRecords).where(eq(productionRecords.batchId, id));
    // Then delete related batch history records
    await db.delete(batchHistory).where(eq(batchHistory.batchId, id));
    // Finally delete the batch
    await db.delete(batches).where(eq(batches.id, id));
    return { success: true }; // Ensure JSON response
  },

  // Production Records
  async getProductionRecords(organizationId: string) {
    return db.select({
      record: productionRecords,
      batch: batches,
      product: products
    })
    .from(productionRecords)
    .leftJoin(batches, eq(productionRecords.batchId, batches.id))
    .leftJoin(products, eq(batches.productId, products.id))
    .where(eq(productionRecords.organizationId, organizationId))
    .orderBy(desc(productionRecords.createdAt));
  },
  async getProductionRecordsByStage(stage: string, organizationId: string) {
    return db.select({
      record: productionRecords,
      batch: batches,
      product: products
    })
    .from(productionRecords)
    .leftJoin(batches, eq(productionRecords.batchId, batches.id))
    .leftJoin(products, eq(batches.productId, products.id))
    .where(
      sql`${productionRecords.stage} = ${stage} AND ${productionRecords.organizationId} = ${organizationId}`
    )
    .orderBy(desc(productionRecords.createdAt));
  },
  async getProductionRecordsByBatch(batchId: string, organizationId: string) {
    return db.select({
      record: productionRecords,
      batch: batches,
      product: products
    })
    .from(productionRecords)
    .leftJoin(batches, eq(productionRecords.batchId, batches.id))
    .leftJoin(products, eq(batches.productId, products.id))
    .where(
      sql`${productionRecords.batchId} = ${batchId} AND ${productionRecords.organizationId} = ${organizationId}`
    )
    .orderBy(desc(productionRecords.createdAt));
  },
  async insertProductionRecord(data: typeof productionRecords.$inferInsert) {
    const [record] = await db.insert(productionRecords).values(data).returning();
    return record;
  },

  // Quality Checklist Templates
  async getQualityChecklistTemplates(organizationId: string) {
    return db.select().from(qualityChecklistTemplates)
      .where(eq(qualityChecklistTemplates.organizationId, organizationId))
      .orderBy(qualityChecklistTemplates.order);
  },
  async insertQualityChecklistTemplate(data: typeof qualityChecklistTemplates.$inferInsert) {
    const [template] = await db.insert(qualityChecklistTemplates).values(data).returning();
    return template;
  },
  async updateQualityChecklistTemplate(id: string, data: Partial<QualityChecklistTemplate>) {
    const [template] = await db.update(qualityChecklistTemplates)
      .set(data)
      .where(eq(qualityChecklistTemplates.id, id))
      .returning();
    return template;
  },
  async deleteQualityChecklistTemplate(id: string) {
    await db.delete(qualityChecklistTemplates).where(eq(qualityChecklistTemplates.id, id));
    return { success: true };
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
    .where(eq(batches.status, 'ESTERILIZADO'), eq(batches.organizationId, organizationId));
  },
  async insertQualityCheck(data: typeof qualityChecks.$inferInsert) {
    const [check] = await db.insert(qualityChecks).values(data).returning();
    return check;
  },

  // Shipments
  async getShipments(organizationId: string) {
    const result = await db.select({
      shipment: shipments,
      batch: batches,
      customer: customers,
      product: products,
    })
    .from(shipments)
    .leftJoin(batches, eq(shipments.batchId, batches.id))
    .leftJoin(customers, eq(shipments.customerId, customers.id))
    .leftJoin(products, eq(batches.productId, products.id))
    .where(eq(shipments.organizationId, organizationId))
    .orderBy(desc(shipments.shippedAt));

    return result;
  }

  async getShipmentById(id: string, organizationId: string) {
    const [result] = await db.select({
      shipment: shipments,
      batch: batches,
      customer: customers,
      product: products,
    })
    .from(shipments)
    .leftJoin(batches, eq(shipments.batchId, batches.id))
    .leftJoin(customers, eq(shipments.customerId, customers.id))
    .leftJoin(products, eq(batches.productId, products.id))
    .where(and(eq(shipments.id, id), eq(shipments.organizationId, organizationId)));

    return result;
  }

  async deleteShipment(id: string) {
    await db.delete(shipments).where(eq(shipments.id, id));
  }

  async deleteTraceabilityEventsByShipment(shipmentId: string) {
    await db.delete(traceabilityEvents).where(eq(traceabilityEvents.shipmentId, shipmentId));
  }

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

  // Traceability Events
  async getTraceabilityEvents(organizationId: string) {
    return db.select()
      .from(traceabilityEvents)
      .where(eq(traceabilityEvents.organizationId, organizationId))
      .orderBy(desc(traceabilityEvents.performedAt));
  },
  async getTraceabilityEventsByBatch(batchCode: string, organizationId: string) {
    return db.select()
      .from(traceabilityEvents)
      .where(
        eq(traceabilityEvents.organizationId, organizationId),
        sql`${traceabilityEvents.outputBatchCode} = ${batchCode} OR ${traceabilityEvents.inputBatchCodes}::text LIKE '%${batchCode}%'`
      )
      .orderBy(traceabilityEvents.performedAt);
  },
  async getTraceabilityEventsByShipment(shipmentId: string, organizationId: string) {
    return db.select()
      .from(traceabilityEvents)
      .where(
        eq(traceabilityEvents.organizationId, organizationId),
        eq(traceabilityEvents.shipmentId, shipmentId)
      )
      .orderBy(desc(traceabilityEvents.performedAt));
  },
  async insertTraceabilityEvent(data: typeof traceabilityEvents.$inferInsert) {
    const [event] = await db.insert(traceabilityEvents).values(data).returning();
    return event;
  },
  async deleteTraceabilityEventsByBatch(batchId: string) {
    await db.delete(traceabilityEvents)
      .where(eq(traceabilityEvents.outputBatchId, batchId));
  },

  // Product Stock
  async getProductStock(organizationId: string) {
    // Calcular stock desde lotes en RECEPCION únicamente
    const result = await db.select({
      productId: batches.productId,
      productName: products.name,
      productCode: products.code,
      unit: batches.unit,
      totalQuantity: sql<string>`SUM(CAST(${batches.quantity} AS DECIMAL))`,
    })
    .from(batches)
    .leftJoin(products, eq(batches.productId, products.id))
    .where(
      sql`${batches.organizationId} = ${organizationId} AND ${batches.status} = 'RECEPCION'`
    )
    .groupBy(batches.productId, products.name, products.code, batches.unit);

    return result.map(item => ({
      stock: {
        id: item.productId || '',
        organizationId,
        productId: item.productId || '',
        unit: item.unit,
        quantity: item.totalQuantity || '0',
        updatedAt: new Date(),
      },
      product: {
        name: item.productName,
        code: item.productCode,
      }
    }));
  },

  async updateProductStock(organizationId: string, productId: string, unit: string, quantityChange: number) {
    // Buscar stock existente
    const [existingStock] = await db.select()
      .from(productStock)
      .where(
        sql`${productStock.organizationId} = ${organizationId} AND ${productStock.productId} = ${productId} AND ${productStock.unit} = ${unit}`
      );

    if (existingStock) {
      // Actualizar stock existente
      const currentQuantity = parseFloat(existingStock.quantity);
      const newQuantity = currentQuantity + quantityChange;
      const [updated] = await db.update(productStock)
        .set({ 
          quantity: newQuantity.toFixed(2),
          updatedAt: new Date()
        })
        .where(eq(productStock.id, existingStock.id))
        .returning();
      return updated;
    } else {
      // Crear nuevo registro de stock
      const [created] = await db.insert(productStock)
        .values({
          organizationId,
          productId,
          unit,
          quantity: quantityChange.toFixed(2)
        })
        .returning();
      return created;
    }
  },
};