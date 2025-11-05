import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertSupplierSchema, insertProductSchema, insertLocationSchema,
  insertCustomerSchema, insertPackageTypeSchema, insertBatchSchema,
  insertProductionRecordSchema, insertQualityCheckSchema, insertShipmentSchema,
  insertBatchHistorySchema, registerSchema, loginSchema, organizations, users
} from "@shared/schema";
import { requireAuth, hashPassword, comparePassword, createSession, deleteSession } from "./auth";
import { db } from "./db";
import { eq } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);

      // Check if user exists
      const [existingUser] = await db.select().from(users).where(eq(users.email, data.email));
      if (existingUser) {
        return res.status(400).json({ message: "El email ya está registrado" });
      }

      // Create organization
      const slug = data.organizationName.toLowerCase().replace(/\s+/g, '-');
      const [org] = await db.insert(organizations).values({
        name: data.organizationName,
        slug,
      }).returning();

      // Create user
      const hashedPassword = await hashPassword(data.password);
      const [user] = await db.insert(users).values({
        username: data.username,
        email: data.email,
        password: hashedPassword,
        organizationId: org.id,
      }).returning();

      const sessionId = createSession(user.id, org.id);
      res.json({ 
        sessionId,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          organizationId: org.id,
          organizationName: org.name,
        }
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log("Login attempt for email:", req.body.email);
      const { email, password } = loginSchema.parse(req.body);

      const [user] = await db.select().from(users).where(eq(users.email, email));
      if (!user) {
        console.log("Login failed: User not found for email:", email);
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      const valid = await comparePassword(password, user.password);
      if (!valid) {
        console.log("Login failed: Invalid password for email:", email);
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      const sessionId = createSession(user.id, user.organizationId);
      console.log("Session created:", sessionId);
      const [org] = await db.select().from(organizations).where(eq(organizations.id, user.organizationId));

      const responseData = {
        sessionId,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          organizationId: user.organizationId,
          organizationName: org?.name || '',
        },
      };
      console.log("Login response:", responseData);
      res.json(responseData);
    } catch (error: any) {
      console.error("Error during login:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/logout", requireAuth, async (req, res) => {
    const sessionId = req.headers.authorization?.replace('Bearer ', '');
    if (sessionId) {
      deleteSession(sessionId);
    }
    res.json({ success: true });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, req.user!.organizationId));
    res.json({
      ...req.user,
      organizationName: org.name,
    });
  });

  // Suppliers
  app.get("/api/suppliers", requireAuth, async (req, res) => {
    const suppliers = await storage.getSuppliers(req.user!.organizationId);
    res.json(suppliers);
  });

  app.post("/api/suppliers", requireAuth, async (req, res) => {
    const { organizationId, ...bodyData } = req.body;
    const data = insertSupplierSchema.omit({ organizationId: true }).parse(bodyData);
    const supplier = await storage.insertSupplier({ ...data, organizationId: req.user!.organizationId });
    res.json(supplier);
  });

  app.put("/api/suppliers/:id", requireAuth, async (req, res) => {
    const supplier = await storage.updateSupplier(req.params.id, req.body);
    res.json(supplier);
  });

  app.delete("/api/suppliers/:id", requireAuth, async (req, res) => {
    await storage.deleteSupplier(req.params.id);
    res.json({ success: true });
  });

  // Products
  app.get("/api/products", requireAuth, async (req, res) => {
    const products = await storage.getProducts(req.user!.organizationId);
    res.json(products);
  });

  app.post("/api/products", requireAuth, async (req, res) => {
    const { organizationId, ...bodyData } = req.body;
    const data = insertProductSchema.omit({ organizationId: true }).parse(bodyData);
    const product = await storage.insertProduct({ ...data, organizationId: req.user!.organizationId });
    res.json(product);
  });

  app.put("/api/products/:id", requireAuth, async (req, res) => {
    const product = await storage.updateProduct(req.params.id, req.body);
    res.json(product);
  });

  app.delete("/api/products/:id", requireAuth, async (req, res) => {
    await storage.deleteProduct(req.params.id);
    res.json({ success: true });
  });

  // Locations
  app.get("/api/locations", requireAuth, async (req, res) => {
    const locations = await storage.getLocations(req.user!.organizationId);
    res.json(locations);
  });

  app.post("/api/locations", requireAuth, async (req, res) => {
    const { organizationId, ...bodyData } = req.body;
    const data = insertLocationSchema.omit({ organizationId: true }).parse(bodyData);
    const location = await storage.insertLocation({ ...data, organizationId: req.user!.organizationId });
    res.json(location);
  });

  app.put("/api/locations/:id", requireAuth, async (req, res) => {
    const location = await storage.updateLocation(req.params.id, req.body);
    res.json(location);
  });

  app.delete("/api/locations/:id", requireAuth, async (req, res) => {
    await storage.deleteLocation(req.params.id);
    res.json({ success: true });
  });

  // Customers
  app.get("/api/customers", requireAuth, async (req, res) => {
    const customers = await storage.getCustomers(req.user!.organizationId);
    res.json(customers);
  });

  app.post("/api/customers", requireAuth, async (req, res) => {
    const { organizationId, ...bodyData } = req.body;
    const data = insertCustomerSchema.omit({ organizationId: true }).parse(bodyData);
    const customer = await storage.insertCustomer({ ...data, organizationId: req.user!.organizationId });
    res.json(customer);
  });

  app.put("/api/customers/:id", requireAuth, async (req, res) => {
    const customer = await storage.updateCustomer(req.params.id, req.body);
    res.json(customer);
  });

  app.delete("/api/customers/:id", requireAuth, async (req, res) => {
    await storage.deleteCustomer(req.params.id);
    res.json({ success: true });
  });

  // Package Types
  app.get("/api/package-types", requireAuth, async (req, res) => {
    const packageTypes = await storage.getPackageTypes(req.user!.organizationId);
    res.json(packageTypes);
  });

  app.post("/api/package-types", requireAuth, async (req, res) => {
    const { organizationId, ...bodyData } = req.body;
    const data = insertPackageTypeSchema.omit({ organizationId: true }).parse(bodyData);
    const packageType = await storage.insertPackageType({ ...data, organizationId: req.user!.organizationId });
    res.json(packageType);
  });

  app.put("/api/package-types/:id", requireAuth, async (req, res) => {
    const packageType = await storage.updatePackageType(req.params.id, req.body);
    res.json(packageType);
  });

  app.delete("/api/package-types/:id", requireAuth, async (req, res) => {
    await storage.deletePackageType(req.params.id);
    res.json({ success: true });
  });

  // Batches
  app.get("/api/batches", requireAuth, async (req, res) => {
    const batches = await storage.getBatches(req.user!.organizationId);
    res.json(batches);
  });

  app.get("/api/batches/code/:code", requireAuth, async (req, res) => {
    const batch = await storage.getBatchByCode(req.params.code);
    res.json(batch);
  });

  app.post("/api/batches", requireAuth, async (req, res) => {
    const { organizationId, ...bodyData } = req.body;
    const data = insertBatchSchema.omit({ organizationId: true }).parse(bodyData);
    const batch = await storage.insertBatch({ ...data, organizationId: req.user!.organizationId });

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

  app.put("/api/batches/:id", requireAuth, async (req, res) => {
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

  app.delete("/api/batches/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteBatch(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Error al eliminar el lote" });
    }
  });

  // Production Records
  app.get("/api/production-records", requireAuth, async (_req, res) => {
    const records = await storage.getProductionRecords();
    res.json(records);
  });

  app.get("/api/production-records/stage/:stage", requireAuth, async (req, res) => {
    const records = await storage.getProductionRecordsByStage(req.params.stage);
    res.json(records);
  });

  app.post("/api/production-records", requireAuth, async (req, res) => {
    const data = insertProductionRecordSchema.parse(req.body);
    const record = await storage.insertProductionRecord(data);
    res.json(record);
  });

  // Quality Checks
  app.get("/api/quality-checks", requireAuth, async (_req, res) => {
    const checks = await storage.getQualityChecks();
    res.json(checks);
  });

  app.get("/api/quality-checks/pending", requireAuth, async (_req, res) => {
    const batches = await storage.getPendingQualityChecks();
    res.json(batches);
  });

  app.post("/api/quality-checks", requireAuth, async (req, res) => {
    const data = insertQualityCheckSchema.parse(req.body);
    const check = await storage.insertQualityCheck(data);

    // Update batch status based on approval
    const newStatus = data.approved === 1 ? 'APROBADO' : data.approved === -1 ? 'BLOQUEADO' : 'RETENIDO';
    await storage.updateBatch(data.batchId, { status: newStatus });

    res.json(check);
  });

  // Shipments
  app.get("/api/shipments", requireAuth, async (_req, res) => {
    const shipments = await storage.getShipments();
    res.json(shipments);
  });

  app.post("/api/shipments", requireAuth, async (req, res) => {
    const data = insertShipmentSchema.parse(req.body);
    const shipment = await storage.insertShipment(data);

    // Update batch status to EXPEDIDO
    await storage.updateBatch(data.batchId, { status: 'EXPEDIDO' });

    res.json(shipment);
  });

  // Batch History
  app.get("/api/batch-history", requireAuth, async (_req, res) => {
    const history = await storage.getAllBatchHistory();
    res.json(history);
  });

  app.get("/api/batch-history/:batchId", requireAuth, async (req, res) => {
    const history = await storage.getBatchHistory(req.params.batchId);
    res.json(history);
  });

  const httpServer = createServer(app);
  return httpServer;
}