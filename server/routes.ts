
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertSupplierSchema, insertProductSchema, insertLocationSchema,
  insertCustomerSchema, insertPackageTypeSchema, insertBatchSchema,
  insertProductionRecordSchema, insertQualityCheckSchema, insertShipmentSchema,
  insertBatchHistorySchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Suppliers
  app.get("/api/suppliers", async (_req, res) => {
    const suppliers = await storage.getSuppliers();
    res.json(suppliers);
  });

  app.post("/api/suppliers", async (req, res) => {
    const data = insertSupplierSchema.parse(req.body);
    const supplier = await storage.insertSupplier(data);
    res.json(supplier);
  });

  app.put("/api/suppliers/:id", async (req, res) => {
    const supplier = await storage.updateSupplier(req.params.id, req.body);
    res.json(supplier);
  });

  app.delete("/api/suppliers/:id", async (req, res) => {
    await storage.deleteSupplier(req.params.id);
    res.json({ success: true });
  });

  // Products
  app.get("/api/products", async (_req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  app.post("/api/products", async (req, res) => {
    const data = insertProductSchema.parse(req.body);
    const product = await storage.insertProduct(data);
    res.json(product);
  });

  app.put("/api/products/:id", async (req, res) => {
    const product = await storage.updateProduct(req.params.id, req.body);
    res.json(product);
  });

  app.delete("/api/products/:id", async (req, res) => {
    await storage.deleteProduct(req.params.id);
    res.json({ success: true });
  });

  // Locations
  app.get("/api/locations", async (_req, res) => {
    const locations = await storage.getLocations();
    res.json(locations);
  });

  app.post("/api/locations", async (req, res) => {
    const data = insertLocationSchema.parse(req.body);
    const location = await storage.insertLocation(data);
    res.json(location);
  });

  app.put("/api/locations/:id", async (req, res) => {
    const location = await storage.updateLocation(req.params.id, req.body);
    res.json(location);
  });

  app.delete("/api/locations/:id", async (req, res) => {
    await storage.deleteLocation(req.params.id);
    res.json({ success: true });
  });

  // Customers
  app.get("/api/customers", async (_req, res) => {
    const customers = await storage.getCustomers();
    res.json(customers);
  });

  app.post("/api/customers", async (req, res) => {
    const data = insertCustomerSchema.parse(req.body);
    const customer = await storage.insertCustomer(data);
    res.json(customer);
  });

  app.put("/api/customers/:id", async (req, res) => {
    const customer = await storage.updateCustomer(req.params.id, req.body);
    res.json(customer);
  });

  app.delete("/api/customers/:id", async (req, res) => {
    await storage.deleteCustomer(req.params.id);
    res.json({ success: true });
  });

  // Package Types
  app.get("/api/package-types", async (_req, res) => {
    const packageTypes = await storage.getPackageTypes();
    res.json(packageTypes);
  });

  app.post("/api/package-types", async (req, res) => {
    const data = insertPackageTypeSchema.parse(req.body);
    const packageType = await storage.insertPackageType(data);
    res.json(packageType);
  });

  app.put("/api/package-types/:id", async (req, res) => {
    const packageType = await storage.updatePackageType(req.params.id, req.body);
    res.json(packageType);
  });

  app.delete("/api/package-types/:id", async (req, res) => {
    await storage.deletePackageType(req.params.id);
    res.json({ success: true });
  });

  // Batches
  app.get("/api/batches", async (_req, res) => {
    const batches = await storage.getBatches();
    res.json(batches);
  });

  app.get("/api/batches/code/:code", async (req, res) => {
    const batch = await storage.getBatchByCode(req.params.code);
    res.json(batch);
  });

  app.post("/api/batches", async (req, res) => {
    const data = insertBatchSchema.parse(req.body);
    const batch = await storage.insertBatch(data);
    
    // Create history entry
    await storage.insertBatchHistory({
      batchId: batch.id,
      action: 'created',
      toStatus: batch.status,
      toLocation: batch.locationId,
      notes: 'Batch created'
    });
    
    res.json(batch);
  });

  app.put("/api/batches/:id", async (req, res) => {
    const oldBatch = await storage.getBatchById(req.params.id);
    const batch = await storage.updateBatch(req.params.id, req.body);
    
    // Create history entry if status or location changed
    if (oldBatch && (oldBatch.batch.status !== batch.status || oldBatch.batch.locationId !== batch.locationId)) {
      await storage.insertBatchHistory({
        batchId: batch.id,
        action: 'moved',
        fromStatus: oldBatch.batch.status,
        toStatus: batch.status,
        fromLocation: oldBatch.batch.locationId,
        toLocation: batch.locationId,
        notes: 'Batch updated'
      });
    }
    
    res.json(batch);
  });

  // Production Records
  app.get("/api/production-records", async (_req, res) => {
    const records = await storage.getProductionRecords();
    res.json(records);
  });

  app.get("/api/production-records/stage/:stage", async (req, res) => {
    const records = await storage.getProductionRecordsByStage(req.params.stage);
    res.json(records);
  });

  app.post("/api/production-records", async (req, res) => {
    const data = insertProductionRecordSchema.parse(req.body);
    const record = await storage.insertProductionRecord(data);
    res.json(record);
  });

  // Quality Checks
  app.get("/api/quality-checks", async (_req, res) => {
    const checks = await storage.getQualityChecks();
    res.json(checks);
  });

  app.get("/api/quality-checks/pending", async (_req, res) => {
    const batches = await storage.getPendingQualityChecks();
    res.json(batches);
  });

  app.post("/api/quality-checks", async (req, res) => {
    const data = insertQualityCheckSchema.parse(req.body);
    const check = await storage.insertQualityCheck(data);
    
    // Update batch status based on approval
    const newStatus = data.approved === 1 ? 'APROBADO' : data.approved === -1 ? 'BLOQUEADO' : 'RETENIDO';
    await storage.updateBatch(data.batchId, { status: newStatus });
    
    res.json(check);
  });

  // Shipments
  app.get("/api/shipments", async (_req, res) => {
    const shipments = await storage.getShipments();
    res.json(shipments);
  });

  app.post("/api/shipments", async (req, res) => {
    const data = insertShipmentSchema.parse(req.body);
    const shipment = await storage.insertShipment(data);
    
    // Update batch status to EXPEDIDO
    await storage.updateBatch(data.batchId, { status: 'EXPEDIDO' });
    
    res.json(shipment);
  });

  // Batch History
  app.get("/api/batch-history", async (_req, res) => {
    const history = await storage.getAllBatchHistory();
    res.json(history);
  });

  app.get("/api/batch-history/:batchId", async (req, res) => {
    const history = await storage.getBatchHistory(req.params.batchId);
    res.json(history);
  });

  const httpServer = createServer(app);
  return httpServer;
}
