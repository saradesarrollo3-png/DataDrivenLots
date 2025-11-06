import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertSupplierSchema, insertProductSchema, insertLocationSchema,
  insertCustomerSchema, insertPackageTypeSchema, insertBatchSchema,
  insertProductionRecordSchema, insertQualityCheckSchema, insertShipmentSchema,
  insertBatchHistorySchema, registerSchema, loginSchema, organizations, users,
  insertQualityChecklistTemplateSchema, insertTraceabilityEventSchema
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
    const product = await storage.updateProduct(req.params.id, req.body, req.user!.organizationId);
    res.json(product);
  });

  app.delete("/api/products/:id", requireAuth, async (req, res) => {
    await storage.deleteProduct(req.params.id, req.user!.organizationId);
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
    const location = await storage.updateLocation(req.params.id, req.body, req.user!.organizationId);
    res.json(location);
  });

  app.delete("/api/locations/:id", requireAuth, async (req, res) => {
    await storage.deleteLocation(req.params.id, req.user!.organizationId);
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
    const customer = await storage.updateCustomer(req.params.id, req.body, req.user!.organizationId);
    res.json(customer);
  });

  app.delete("/api/customers/:id", requireAuth, async (req, res) => {
    await storage.deleteCustomer(req.params.id, req.user!.organizationId);
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
    const packageType = await storage.updatePackageType(req.params.id, req.body, req.user!.organizationId);
    res.json(packageType);
  });

  app.delete("/api/package-types/:id", requireAuth, async (req, res) => {
    await storage.deletePackageType(req.params.id, req.user!.organizationId);
    res.json({ success: true });
  });

  // Batches
  app.get("/api/batches", requireAuth, async (req, res) => {
    const batches = await storage.getBatches(req.user!.organizationId);
    res.json(batches);
  });

  app.get("/api/batches/code/:code", requireAuth, async (req, res) => {
    const batch = await storage.getBatchByCode(req.params.code, req.user!.organizationId);
    res.json(batch);
  });

  app.get("/api/batches/status/:status", requireAuth, async (req, res) => {
    const batches = await storage.getBatchesByStatus(req.params.status, req.user!.organizationId);
    res.json(batches);
  });

  app.post("/api/batches", requireAuth, async (req, res) => {
    const { organizationId, ...bodyData } = req.body;
    const data = insertBatchSchema.omit({ organizationId: true }).parse(bodyData);
    
    // Convert processedDate string to Date object if provided
    const batchData: any = { ...data, organizationId: req.user!.organizationId };
    if (data.processedDate) {
      batchData.processedDate = new Date(data.processedDate);
    }
    
    const batch = await storage.insertBatch(batchData);

    // Create history entry
    await storage.insertBatchHistory({
      batchId: batch.id,
      action: 'created',
      toStatus: batch.status,
      toLocation: batch.locationId,
      notes: 'Batch created',
      organizationId: req.user!.organizationId
    });

    // Get additional details for traceability event
    const supplier = batch.supplierId ? await storage.getSupplierById(batch.supplierId, req.user!.organizationId) : null;
    const product = batch.productId ? await storage.getProductById(batch.productId, req.user!.organizationId) : null;

    // Registrar evento de trazabilidad para RECEPCION
    await storage.insertTraceabilityEvent({
      organizationId: req.user!.organizationId,
      eventType: 'RECEPCION',
      toStage: 'RECEPCION',
      outputBatchId: batch.id,
      outputBatchCode: batch.batchCode,
      outputQuantity: batch.quantity,
      outputUnit: batch.unit,
      supplierId: batch.supplierId,
      supplierName: supplier?.name || null,
      productId: batch.productId,
      productName: product?.name || null,
      temperature: batch.temperature,
      deliveryNote: batch.deliveryNote,
      notes: `Recepción de materia prima. Matrícula: ${batch.truckPlate || '-'}`,
      performedBy: req.user!.id,
      performedAt: batch.arrivedAt || new Date(),
    });

    // Update product stock
    if (batch.productId && batch.quantity && batch.unit) {
      const quantityValue = typeof batch.quantity === 'string' 
        ? parseFloat(batch.quantity) 
        : Number(batch.quantity);
      
      await storage.updateProductStock(
        req.user!.organizationId,
        batch.productId,
        batch.unit,
        quantityValue
      );
    }

    res.json(batch);
  });

  app.put("/api/batches/:id", requireAuth, async (req, res) => {
    const oldBatch = await storage.getBatchById(req.params.id, req.user!.organizationId);
    
    // Convert processedDate string to Date object if provided
    const updateData: any = { ...req.body };
    if (updateData.processedDate) {
      updateData.processedDate = new Date(updateData.processedDate);
    }
    
    const batch = await storage.updateBatch(req.params.id, updateData);

    // Update stock if quantity, unit, or product changed
    // Solo actualizar stock si el lote está en RECEPCION (es materia prima)
    if (oldBatch && oldBatch.batch.productId && oldBatch.batch.quantity && oldBatch.batch.unit) {
      const oldQuantity = parseFloat(oldBatch.batch.quantity);
      const newQuantity = batch.quantity ? parseFloat(batch.quantity) : oldQuantity;
      const oldProductId = oldBatch.batch.productId;
      const newProductId = batch.productId || oldProductId;
      const oldUnit = oldBatch.batch.unit;
      const newUnit = batch.unit || oldUnit;
      const oldStatus = oldBatch.batch.status;
      const newStatus = batch.status || oldStatus;

      // Solo actualizar stock para lotes en RECEPCION
      if (oldStatus === 'RECEPCION' && newStatus === 'RECEPCION') {
        // If product or unit changed, we need to subtract from old and add to new
        if (oldProductId !== newProductId || oldUnit !== newUnit) {
          // Subtract old quantity from old product/unit
          await storage.updateProductStock(
            req.user!.organizationId,
            oldProductId,
            oldUnit,
            -oldQuantity
          );
          // Add new quantity to new product/unit
          await storage.updateProductStock(
            req.user!.organizationId,
            newProductId,
            newUnit,
            newQuantity
          );
        } else if (oldQuantity !== newQuantity) {
          // Same product/unit, just update the difference
          const quantityDifference = newQuantity - oldQuantity;
          await storage.updateProductStock(
            req.user!.organizationId,
            oldProductId,
            oldUnit,
            quantityDifference
          );
        }
      }
    }

    // Create history entry if status or location changed
    if (oldBatch && (oldBatch.batch.status !== batch.status || oldBatch.batch.locationId !== batch.locationId)) {
      await storage.insertBatchHistory({
        batchId: batch.id,
        action: 'moved',
        fromStatus: oldBatch.batch.status,
        toStatus: batch.status,
        fromLocation: oldBatch.batch.locationId,
        toLocation: batch.locationId,
        notes: 'Batch updated',
        organizationId: req.user!.organizationId
      });
    }

    res.json(batch);
  });

  app.delete("/api/batches/:id", requireAuth, async (req, res) => {
    try {
      // Get batch data before deleting to update stock
      const batchData = await storage.getBatchById(req.params.id, req.user!.organizationId);
      
      await storage.deleteBatch(req.params.id);
      
      // Reduce stock when batch is deleted
      if (batchData?.batch.productId && batchData.batch.quantity && batchData.batch.unit) {
        await storage.updateProductStock(
          req.user!.organizationId,
          batchData.batch.productId,
          batchData.batch.unit,
          -parseFloat(batchData.batch.quantity)
        );
      }
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Error al eliminar el lote" });
    }
  });

  // Production Records
  app.get("/api/production-records", requireAuth, async (req, res) => {
    const records = await storage.getProductionRecords(req.user!.organizationId);
    res.json(records);
  });

  app.get("/api/production-records/stage/:stage", requireAuth, async (req, res) => {
    const records = await storage.getProductionRecordsByStage(req.params.stage, req.user!.organizationId);
    res.json(records);
  });

  app.get("/api/production-records/batch/:batchId", requireAuth, async (req, res) => {
    const records = await storage.getProductionRecordsByBatch(req.params.batchId, req.user!.organizationId);
    res.json(records);
  });

  app.post("/api/production-records", requireAuth, async (req, res) => {
    try {
      const { organizationId, ...bodyData } = req.body;
      const data = insertProductionRecordSchema.parse(bodyData);
      const recordData: any = {
        ...data,
        completedAt: data.completedAt ? new Date(data.completedAt) : new Date(),
        organizationId: req.user!.organizationId,
      };
      
      // Convert processedDate string to Date object if provided
      if (data.processedDate) {
        recordData.processedDate = new Date(data.processedDate);
      }
      
      const record = await storage.insertProductionRecord(recordData);
      
      // Crear historial con el estado específico de la etapa
      const stageStatusMap: Record<string, string> = {
        'ASADO': 'ASADO',
        'PELADO': 'PELADO',
        'ENVASADO': 'ENVASADO',
        'ESTERILIZADO': 'ESTERILIZADO',
      };
      const toStatus = stageStatusMap[data.stage] || 'EN_PROCESO';
      
      // Preparar notas con detalles de materias primas si es ASADO
      let historyNotes = `Procesado en etapa: ${data.stage}`;
      
      if (data.stage === 'ASADO' && data.inputBatchDetails) {
        try {
          const inputDetails = JSON.parse(data.inputBatchDetails);
          const materiaPrimaInfo = inputDetails.map((detail: any) => 
            `${detail.batchCode}: ${detail.quantity} kg`
          ).join(', ');
          historyNotes += ` | Materias primas: ${materiaPrimaInfo} | Total entrada: ${data.inputQuantity} kg → Salida: ${data.outputQuantity} kg`;
        } catch (e) {
          console.error('Error parsing inputBatchDetails for history:', e);
        }
      }
      
      await storage.insertBatchHistory({
        batchId: data.batchId,
        action: 'processed',
        fromStatus: 'RECEPCION',
        toStatus: toStatus as any,
        notes: historyNotes,
        organizationId: req.user!.organizationId,
      });

      // Registrar evento de trazabilidad
      const batch = await storage.getBatchById(data.batchId, req.user!.organizationId);
      const product = batch?.batch.productId ? await storage.getProductById(batch.batch.productId, req.user!.organizationId) : null;

      // Parsear input details para obtener IDs y códigos
      let inputBatchIds: string[] = [];
      let inputBatchCodes: string[] = [];
      let inputQuantitiesData: any[] = [];
      
      if (data.inputBatchDetails) {
        try {
          const inputDetails = JSON.parse(data.inputBatchDetails);
          inputBatchIds = inputDetails.map((d: any) => d.batchId);
          inputBatchCodes = inputDetails.map((d: any) => d.batchCode);
          inputQuantitiesData = inputDetails.map((d: any) => ({
            batchId: d.batchId,
            batchCode: d.batchCode,
            quantity: d.quantity,
            unit: batch?.batch.unit || data.unit
          }));
        } catch (e) {
          console.error('Error parsing inputBatchDetails:', e);
        }
      } else if (data.inputBatchCode) {
        inputBatchCodes = data.inputBatchCode.split(',').map((c: string) => c.trim());
      }

      // Determinar fromStage según el tipo de proceso
      let fromStage: string = 'RECEPCION';
      if (data.stage === 'PELADO') {
        fromStage = 'ASADO';
      } else if (data.stage === 'ENVASADO') {
        fromStage = 'PELADO';
      } else if (data.stage === 'ESTERILIZADO') {
        fromStage = 'ENVASADO';
      }

      await storage.insertTraceabilityEvent({
        organizationId: req.user!.organizationId,
        eventType: data.stage,
        fromStage: fromStage as any,
        toStage: toStatus as any,
        inputBatchIds: inputBatchIds.length > 0 ? JSON.stringify(inputBatchIds) : null,
        inputBatchCodes: inputBatchCodes.length > 0 ? JSON.stringify(inputBatchCodes) : null,
        outputBatchId: data.batchId,
        outputBatchCode: data.outputBatchCode,
        inputQuantities: inputQuantitiesData.length > 0 ? JSON.stringify(inputQuantitiesData) : null,
        outputQuantity: data.outputQuantity,
        outputUnit: data.unit,
        productId: batch?.batch.productId,
        productName: product?.name || null,
        packageType: data.outputBatchCode.includes('-') ? data.outputBatchCode.split('-').pop() : null,
        notes: data.notes || historyNotes,
        performedBy: req.user!.id,
        performedAt: recordData.processedDate || recordData.completedAt,
      });
      
      res.json(record);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Error al crear el registro de producción" });
    }
  });

  // Quality Checklist Templates
  app.get("/api/quality-checklist-templates", requireAuth, async (req, res) => {
    const templates = await storage.getQualityChecklistTemplates(req.user!.organizationId);
    res.json(templates);
  });

  app.post("/api/quality-checklist-templates", requireAuth, async (req, res) => {
    const { organizationId, ...bodyData } = req.body;
    const data = insertQualityChecklistTemplateSchema.omit({ organizationId: true }).parse(bodyData);
    const template = await storage.insertQualityChecklistTemplate({ 
      ...data, 
      organizationId: req.user!.organizationId 
    });
    res.json(template);
  });

  app.put("/api/quality-checklist-templates/:id", requireAuth, async (req, res) => {
    const template = await storage.updateQualityChecklistTemplate(req.params.id, req.body);
    res.json(template);
  });

  app.delete("/api/quality-checklist-templates/:id", requireAuth, async (req, res) => {
    await storage.deleteQualityChecklistTemplate(req.params.id);
    res.json({ success: true });
  });

  // Quality Checks
  app.get("/api/quality-checks", requireAuth, async (req, res) => {
    const checks = await storage.getQualityChecks(req.user!.organizationId);
    res.json(checks);
  });

  app.get("/api/quality-checks/pending", requireAuth, async (req, res) => {
    const batches = await storage.getPendingQualityChecks(req.user!.organizationId);
    res.json(batches);
  });

  app.post("/api/quality-checks", requireAuth, async (req, res) => {
    const data = insertQualityCheckSchema.parse(req.body);
    const check = await storage.insertQualityCheck({
      ...data,
      organizationId: req.user!.organizationId,
      checkedBy: req.user!.id,
    });

    // Update batch status and expiry date based on approval
    const newStatus = data.approved === 1 ? 'APROBADO' : data.approved === -1 ? 'BLOQUEADO' : 'RETENIDO';
    const updateData: any = { status: newStatus };
    
    // If approved, save the expiry date from the request body
    if (data.approved === 1 && req.body.expiryDate) {
      updateData.expiryDate = new Date(req.body.expiryDate);
    }
    
    await storage.updateBatch(data.batchId, updateData);

    // Create history entry
    await storage.insertBatchHistory({
      batchId: data.batchId,
      action: 'quality_check',
      fromStatus: 'ESTERILIZADO',
      toStatus: newStatus as any,
      notes: data.approved === 1 ? 'Lote aprobado para venta' : data.approved === -1 ? 'Lote bloqueado' : 'Lote en revisión',
      performedBy: req.user!.id,
      organizationId: req.user!.organizationId,
    });

    // Registrar evento de trazabilidad para CALIDAD
    const batch = await storage.getBatchById(data.batchId, req.user!.organizationId);
    const product = batch?.batch.productId ? await storage.getProductById(batch.batch.productId, req.user!.organizationId) : null;

    await storage.insertTraceabilityEvent({
      organizationId: req.user!.organizationId,
      eventType: 'CALIDAD',
      fromStage: 'ESTERILIZADO',
      toStage: newStatus as any,
      outputBatchId: data.batchId,
      outputBatchCode: batch?.batch.batchCode,
      outputQuantity: batch?.batch.quantity,
      outputUnit: batch?.batch.unit,
      productId: batch?.batch.productId,
      productName: product?.name || null,
      qualityCheckId: check.id,
      qualityApproved: data.approved,
      notes: data.notes || (data.approved === 1 ? 'Lote aprobado' : data.approved === -1 ? 'Lote rechazado' : 'Lote en revisión'),
      performedBy: req.user!.id,
      performedAt: new Date(),
    });

    res.json(check);
  });

  // Shipments
  app.get("/api/shipments", requireAuth, async (req, res) => {
    const shipments = await storage.getShipments(req.user!.organizationId);
    res.json(shipments);
  });

  app.post("/api/shipments", requireAuth, async (req, res) => {
    try {
      const { organizationId, ...bodyData } = req.body;
      const data = insertShipmentSchema.omit({ organizationId: true }).parse(bodyData);
      const shipment = await storage.insertShipment({ ...data, organizationId: req.user!.organizationId });

      // Get batch data
      const batchData = await storage.getBatchById(data.batchId, req.user!.organizationId);
      
      if (batchData) {
        const currentQuantity = parseFloat(batchData.batch.quantity);
        const shippedQuantity = parseFloat(data.quantity);
        const remainingQuantity = currentQuantity - shippedQuantity;

        // Update batch quantity - reduce by shipped amount
        if (remainingQuantity > 0) {
          // Partial shipment - keep batch in APROBADO status with reduced quantity
          await storage.updateBatch(data.batchId, { 
            quantity: remainingQuantity.toFixed(2)
          });
        } else {
          // Full shipment - mark as EXPEDIDO
          await storage.updateBatch(data.batchId, { 
            quantity: "0",
            status: 'EXPEDIDO' 
          });
        }

        // Reduce product stock
        if (batchData.batch.productId && data.quantity && data.unit) {
          await storage.updateProductStock(
            req.user!.organizationId,
            batchData.batch.productId,
            data.unit,
            -shippedQuantity
          );
        }

        // Create history entry
        await storage.insertBatchHistory({
          batchId: data.batchId,
          action: 'shipped',
          fromStatus: batchData.batch.status,
          toStatus: remainingQuantity > 0 ? batchData.batch.status : 'EXPEDIDO',
          notes: `Expedición parcial: ${shippedQuantity} ${data.unit}. Restante: ${remainingQuantity.toFixed(2)} ${data.unit}`,
          organizationId: req.user!.organizationId,
        });

        // Registrar evento de trazabilidad para EXPEDICION
        const customer = await storage.getCustomerById(data.customerId, req.user!.organizationId);
        const product = batchData.batch.productId ? await storage.getProductById(batchData.batch.productId, req.user!.organizationId) : null;

        await storage.insertTraceabilityEvent({
          organizationId: req.user!.organizationId,
          eventType: 'EXPEDICION',
          fromStage: 'APROBADO',
          toStage: 'EXPEDIDO',
          outputBatchId: data.batchId,
          outputBatchCode: batchData.batch.batchCode,
          outputQuantity: data.quantity,
          outputUnit: data.unit,
          productId: batchData.batch.productId,
          productName: product?.name || null,
          shipmentId: shipment.id,
          shipmentCode: data.shipmentCode,
          customerId: data.customerId,
          customerName: customer?.name || null,
          deliveryNote: data.deliveryNote,
          notes: `Expedición de ${shippedQuantity} ${data.unit}. Matrícula: ${data.truckPlate || '-'}. Restante: ${remainingQuantity.toFixed(2)} ${data.unit}`,
          performedBy: req.user!.id,
          performedAt: new Date(),
        });
      }

      res.json(shipment);
    } catch (error: any) {
      // Manejar error de código duplicado
      if (error.code === '23505' && error.constraint === 'shipments_shipment_code_unique') {
        return res.status(400).json({ 
          message: `El código de expedición "${req.body.shipmentCode}" ya existe. Por favor, usa un código diferente.` 
        });
      }
      res.status(400).json({ message: error.message || "Error al crear la expedición" });
    }
  });

  // Product Stock
  app.get("/api/product-stock", requireAuth, async (req, res) => {
    const stock = await storage.getProductStock(req.user!.organizationId);
    res.json(stock);
  });

  // Batch History
  app.get("/api/batch-history", requireAuth, async (req, res) => {
    const history = await storage.getAllBatchHistory(req.user!.organizationId);
    res.json(history);
  });

  app.get("/api/batch-history/:batchId", requireAuth, async (req, res) => {
    const history = await storage.getBatchHistory(req.params.batchId, req.user!.organizationId);
    res.json(history);
  });

  // Traceability Events
  app.get("/api/traceability-events", requireAuth, async (req, res) => {
    const events = await storage.getTraceabilityEvents(req.user!.organizationId);
    res.json(events);
  });

  app.get("/api/traceability-events/batch/:batchCode", requireAuth, async (req, res) => {
    const events = await storage.getTraceabilityEventsByBatch(req.params.batchCode, req.user!.organizationId);
    res.json(events);
  });

  app.get("/api/traceability-events/shipment/:shipmentId", requireAuth, async (req, res) => {
    const events = await storage.getTraceabilityEventsByShipment(req.params.shipmentId, req.user!.organizationId);
    res.json(events);
  });

  // Admin - User Management
  app.get("/api/admin/users", requireAuth, async (req, res) => {
    const orgUsers = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      createdAt: users.createdAt,
    }).from(users).where(eq(users.organizationId, req.user!.organizationId));
    res.json(orgUsers);
  });

  app.post("/api/admin/users", requireAuth, async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      // Check if user exists
      const [existingUser] = await db.select().from(users).where(eq(users.email, email));
      if (existingUser) {
        return res.status(400).json({ message: "El email ya está registrado" });
      }

      // Create user
      const hashedPassword = await hashPassword(password);
      const [newUser] = await db.insert(users).values({
        username,
        email,
        password: hashedPassword,
        organizationId: req.user!.organizationId,
      }).returning({
        id: users.id,
        username: users.username,
        email: users.email,
        createdAt: users.createdAt,
      });

      res.json(newUser);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/users/:id", requireAuth, async (req, res) => {
    try {
      // Prevent deleting yourself
      if (req.params.id === req.user!.id) {
        return res.status(400).json({ message: "No puedes eliminar tu propio usuario" });
      }

      await db.delete(users).where(eq(users.id, req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Admin - Audit PDF Generation
  app.get("/api/admin/audit/pdf", requireAuth, async (req, res) => {
    try {
      const { type, startDate, endDate } = req.query;
      
      // For now, return a simple text response
      // In production, you would use a PDF library like pdfkit or puppeteer
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=auditoria_${type}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      // Simple placeholder - in production, generate actual PDF
      const pdfContent = `Reporte de Auditoría
Tipo: ${type}
Fecha de generación: ${new Date().toLocaleDateString('es-ES')}
${startDate ? `Desde: ${startDate}` : ''}
${endDate ? `Hasta: ${endDate}` : ''}

Este es un reporte de ejemplo.
En producción, aquí se generaría un PDF completo con los datos solicitados.`;
      
      res.send(Buffer.from(pdfContent));
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}