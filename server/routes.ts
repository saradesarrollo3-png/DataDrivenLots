import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertSupplierSchema,
  insertProductSchema,
  insertLocationSchema,
  insertCustomerSchema,
  insertPackageTypeSchema,
  insertBatchSchema,
  insertProductionRecordSchema,
  insertQualityCheckSchema,
  insertShipmentSchema,
  insertBatchHistorySchema,
  registerSchema,
  loginSchema,
  organizations,
  users,
  insertQualityChecklistTemplateSchema,
  insertTraceabilityEventSchema,
} from "@shared/schema";
import {
  requireAuth,
  hashPassword,
  comparePassword,
  createSession,
  deleteSession,
} from "./auth";
import { db } from "./db";
import { eq } from "drizzle-orm";
import PDFDocument from "pdfkit";
import {
  initBlockchain,
  recordBatchOnChain,
  certifyBatchOnChain,
  generateTraceabilityQR,
  getBatchHistory,
} from "./blockchain";

// Inicializar al arrancar
initBlockchain();
export async function registerRoutes(app: Express): Promise<Server> {
  await initBlockchain(); // <--- AÑADIR ESTA LÍNEA
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);

      // Check if user exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, data.email));
      if (existingUser) {
        return res.status(400).json({ message: "El email ya está registrado" });
      }

      // Create organization
      const slug = data.organizationName.toLowerCase().replace(/\s+/g, "-");
      const [org] = await db
        .insert(organizations)
        .values({
          name: data.organizationName,
          slug,
        })
        .returning();

      // Create user
      const hashedPassword = await hashPassword(data.password);
      const [user] = await db
        .insert(users)
        .values({
          username: data.username,
          email: data.email,
          password: hashedPassword,
          organizationId: org.id,
        })
        .returning();

      const sessionId = createSession(user.id, org.id);
      res.json({
        sessionId,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          organizationId: org.id,
          organizationName: org.name,
        },
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log("Login attempt for email:", req.body.email);
      const { email, password } = loginSchema.parse(req.body);

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
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
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, user.organizationId));

      const responseData = {
        sessionId,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          organizationId: user.organizationId,
          organizationName: org?.name || "",
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
    const sessionId = req.headers.authorization?.replace("Bearer ", "");
    if (sessionId) {
      deleteSession(sessionId);
    }
    res.json({ success: true });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, req.user!.organizationId));
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
    const data = insertSupplierSchema
      .omit({ organizationId: true })
      .parse(bodyData);
    const supplier = await storage.insertSupplier({
      ...data,
      organizationId: req.user!.organizationId,
    });
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
    const data = insertProductSchema
      .omit({ organizationId: true })
      .parse(bodyData);
    const product = await storage.insertProduct({
      ...data,
      organizationId: req.user!.organizationId,
    });
    res.json(product);
  });

  app.put("/api/products/:id", requireAuth, async (req, res) => {
    const product = await storage.updateProduct(
      req.params.id,
      req.body,
      req.user!.organizationId,
    );
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
    const data = insertLocationSchema
      .omit({ organizationId: true })
      .parse(bodyData);
    const location = await storage.insertLocation({
      ...data,
      organizationId: req.user!.organizationId,
    });
    res.json(location);
  });

  app.put("/api/locations/:id", requireAuth, async (req, res) => {
    const location = await storage.updateLocation(
      req.params.id,
      req.body,
      req.user!.organizationId,
    );
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
    const data = insertCustomerSchema
      .omit({ organizationId: true })
      .parse(bodyData);
    const customer = await storage.insertCustomer({
      ...data,
      organizationId: req.user!.organizationId,
    });
    res.json(customer);
  });

  app.put("/api/customers/:id", requireAuth, async (req, res) => {
    const customer = await storage.updateCustomer(
      req.params.id,
      req.body,
      req.user!.organizationId,
    );
    res.json(customer);
  });

  app.delete("/api/customers/:id", requireAuth, async (req, res) => {
    await storage.deleteCustomer(req.params.id, req.user!.organizationId);
    res.json({ success: true });
  });

  // Package Types
  app.get("/api/package-types", requireAuth, async (req, res) => {
    const packageTypes = await storage.getPackageTypes(
      req.user!.organizationId,
    );
    res.json(packageTypes);
  });

  app.post("/api/package-types", requireAuth, async (req, res) => {
    const { organizationId, ...bodyData } = req.body;
    const data = insertPackageTypeSchema
      .omit({ organizationId: true })
      .parse(bodyData);
    const packageType = await storage.insertPackageType({
      ...data,
      organizationId: req.user!.organizationId,
    });
    res.json(packageType);
  });

  app.put("/api/package-types/:id", requireAuth, async (req, res) => {
    const packageType = await storage.updatePackageType(
      req.params.id,
      req.body,
      req.user!.organizationId,
    );
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
    const batch = await storage.getBatchByCode(
      req.params.code,
      req.user!.organizationId,
    );
    res.json(batch);
  });

  app.get("/api/batches/status/:status", requireAuth, async (req, res) => {
    const batches = await storage.getBatchesByStatus(
      req.params.status,
      req.user!.organizationId,
    );
    res.json(batches);
  });

  app.post("/api/batches", requireAuth, async (req, res) => {
    const { organizationId, ...bodyData } = req.body;
    const data = insertBatchSchema
      .omit({ organizationId: true })
      .parse(bodyData);

    // Convert processedDate string to Date object if provided
    const batchData: any = {
      ...data,
      organizationId: req.user!.organizationId,
    };
    if (data.processedDate) {
      batchData.processedDate = new Date(data.processedDate);
    }

    const batch = await storage.insertBatch(batchData);

    // --- INICIO BLOQUE BLOCKCHAIN ---
    const pName = batch.productId
      ? (
          await storage.getProductById(
            batch.productId,
            req.user!.organizationId,
          )
        )?.name || "Producto"
      : "Materia Prima";

    // Esperamos a recibir el hash (puede tardar 2-3 segundos extra)
    const txHash = await recordBatchOnChain(
      batch.batchCode,
      pName,
      "RECEPCION",
    );
    // --- FIN BLOQUE BLOCKCHAIN ---

    // Create history entry
    await storage.insertBatchHistory({
      batchId: batch.id,
      action: "created",
      toStatus: batch.status,
      toLocation: batch.locationId,
      notes: "Batch created",
      organizationId: req.user!.organizationId,
    });

    // Get additional details for traceability event
    const supplier = batch.supplierId
      ? await storage.getSupplierById(
          batch.supplierId,
          req.user!.organizationId,
        )
      : null;
    const product = batch.productId
      ? await storage.getProductById(batch.productId, req.user!.organizationId)
      : null;

    // Registrar evento de trazabilidad para RECEPCION
    await storage.insertTraceabilityEvent({
      organizationId: req.user!.organizationId,
      eventType: "RECEPCION",
      toStage: "RECEPCION",
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
      notes: `Recepción de materia prima. Matrícula: ${batch.truckPlate || "-"}`,
      performedBy: req.user!.id,
      performedAt: batch.arrivedAt || new Date(),
      processedDate: batch.processedDate || batch.arrivedAt || new Date(),
      txHash: txHash || null,
    });

    // Update product stock
    if (batch.productId && batch.quantity && batch.unit) {
      const quantityValue =
        typeof batch.quantity === "string"
          ? parseFloat(batch.quantity)
          : Number(batch.quantity);

      await storage.updateProductStock(
        req.user!.organizationId,
        batch.productId,
        batch.unit,
        quantityValue,
      );
    }

    res.json(batch);
  });

  app.put("/api/batches/:id", requireAuth, async (req, res) => {
    const oldBatch = await storage.getBatchById(
      req.params.id,
      req.user!.organizationId,
    );

    // Convert processedDate string to Date object if provided
    const updateData: any = { ...req.body };
    if (updateData.processedDate) {
      updateData.processedDate = new Date(updateData.processedDate);
    }

    const batch = await storage.updateBatch(req.params.id, updateData);

    // Update stock if quantity, unit, or product changed
    // Solo actualizar stock si el lote está en RECEPCION (es materia prima)
    if (
      oldBatch &&
      oldBatch.batch.productId &&
      oldBatch.batch.quantity &&
      oldBatch.batch.unit
    ) {
      const oldQuantity = parseFloat(oldBatch.batch.quantity);
      const newQuantity = batch.quantity
        ? parseFloat(batch.quantity)
        : oldQuantity;
      const oldProductId = oldBatch.batch.productId;
      const newProductId = batch.productId || oldProductId;
      const oldUnit = oldBatch.batch.unit;
      const newUnit = batch.unit || oldUnit;
      const oldStatus = oldBatch.batch.status;
      const newStatus = batch.status || oldStatus;

      // Solo actualizar stock para lotes en RECEPCION
      if (oldStatus === "RECEPCION" && newStatus === "RECEPCION") {
        // If product or unit changed, we need to subtract from old and add to new
        if (oldProductId !== newProductId || oldUnit !== newUnit) {
          // Subtract old quantity from old product/unit
          await storage.updateProductStock(
            req.user!.organizationId,
            oldProductId,
            oldUnit,
            -oldQuantity,
          );
          // Add new quantity to new product/unit
          await storage.updateProductStock(
            req.user!.organizationId,
            newProductId,
            newUnit,
            newQuantity,
          );
        } else if (oldQuantity !== newQuantity) {
          // Same product/unit, just update the difference
          const quantityDifference = newQuantity - oldQuantity;
          await storage.updateProductStock(
            req.user!.organizationId,
            oldProductId,
            oldUnit,
            quantityDifference,
          );
        }
      }
    }

    // Create history entry if status or location changed
    if (
      oldBatch &&
      (oldBatch.batch.status !== batch.status ||
        oldBatch.batch.locationId !== batch.locationId)
    ) {
      await storage.insertBatchHistory({
        batchId: batch.id,
        action: "moved",
        fromStatus: oldBatch.batch.status,
        toStatus: batch.status,
        fromLocation: oldBatch.batch.locationId,
        toLocation: batch.locationId,
        notes: "Batch updated",
        organizationId: req.user!.organizationId,
      });
    }

    res.json(batch);
  });

  app.delete("/api/batches/:id", requireAuth, async (req, res) => {
    try {
      // Get batch data before deleting to update stock
      const batchData = await storage.getBatchById(
        req.params.id,
        req.user!.organizationId,
      );

      // Delete traceability events associated with this batch first
      await storage.deleteTraceabilityEventsByBatch(req.params.id);

      await storage.deleteBatch(req.params.id);

      // Reduce stock when batch is deleted
      if (
        batchData?.batch.productId &&
        batchData.batch.quantity &&
        batchData.batch.unit
      ) {
        await storage.updateProductStock(
          req.user!.organizationId,
          batchData.batch.productId,
          batchData.batch.unit,
          -parseFloat(batchData.batch.quantity),
        );
      }

      res.json({ success: true });
    } catch (error: any) {
      res
        .status(400)
        .json({ message: error.message || "Error al eliminar el lote" });
    }
  });

  // Production Records
  app.get("/api/production-records", requireAuth, async (req, res) => {
    const records = await storage.getProductionRecords(
      req.user!.organizationId,
    );
    res.json(records);
  });

  app.get(
    "/api/production-records/stage/:stage",
    requireAuth,
    async (req, res) => {
      const records = await storage.getProductionRecordsByStage(
        req.params.stage,
        req.user!.organizationId,
      );
      res.json(records);
    },
  );

  app.get(
    "/api/production-records/batch/:batchId",
    requireAuth,
    async (req, res) => {
      const records = await storage.getProductionRecordsByBatch(
        req.params.batchId,
        req.user!.organizationId,
      );
      res.json(records);
    },
  );

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

      // --- INICIO BLOQUE BLOCKCHAIN ---
      // Obtenemos info del lote para saber el nombre del producto
      const batchInfo = await storage.getBatchById(
        data.batchId,
        req.user!.organizationId,
      );
      const prodName = batchInfo?.product?.name || "Procesado";
      // Registramos la etapa actual (ASADO, PELADO, etc.)
      recordBatchOnChain(data.outputBatchCode, prodName, data.stage);
      // --- FIN BLOQUE BLOCKCHAIN ---
      // Crear historial con el estado específico de la etapa
      const stageStatusMap: Record<string, string> = {
        ASADO: "ASADO",
        PELADO: "PELADO",
        ENVASADO: "ENVASADO",
        ESTERILIZADO: "ESTERILIZADO",
      };
      const toStatus = stageStatusMap[data.stage] || "EN_PROCESO";

      // Preparar notas con detalles de materias primas si es ASADO
      let historyNotes = `Procesado en etapa: ${data.stage}`;

      if (data.stage === "ASADO" && data.inputBatchDetails) {
        try {
          const inputDetails = JSON.parse(data.inputBatchDetails);
          const materiaPrimaInfo = inputDetails
            .map((detail: any) => `${detail.batchCode}: ${detail.quantity} kg`)
            .join(", ");
          historyNotes += ` | Materias primas: ${materiaPrimaInfo} | Total entrada: ${data.inputQuantity} kg → Salida: ${data.outputQuantity} kg`;
        } catch (e) {
          console.error("Error parsing inputBatchDetails for history:", e);
        }
      }

      await storage.insertBatchHistory({
        batchId: data.batchId,
        action: "processed",
        fromStatus: "RECEPCION",
        toStatus: toStatus as any,
        notes: historyNotes,
        organizationId: req.user!.organizationId,
      });

      // Registrar evento de trazabilidad
      const batch = await storage.getBatchById(
        data.batchId,
        req.user!.organizationId,
      );
      const product = batch?.batch.productId
        ? await storage.getProductById(
            batch.batch.productId,
            req.user!.organizationId,
          )
        : null;

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
            unit: batch?.batch.unit || data.unit,
          }));
        } catch (e) {
          console.error("Error parsing inputBatchDetails:", e);
        }
      } else if (data.inputBatchCode) {
        inputBatchCodes = data.inputBatchCode
          .split(",")
          .map((c: string) => c.trim());
      }

      // Determinar fromStage según el tipo de proceso
      let fromStage: string = "RECEPCION";
      if (data.stage === "PELADO") {
        fromStage = "ASADO";
      } else if (data.stage === "ENVASADO") {
        fromStage = "PELADO";
      } else if (data.stage === "ESTERILIZADO") {
        fromStage = "ENVASADO";
      }

      await storage.insertTraceabilityEvent({
        organizationId: req.user!.organizationId,
        eventType: data.stage,
        fromStage: fromStage as any,
        toStage: toStatus as any,
        inputBatchIds:
          inputBatchIds.length > 0 ? JSON.stringify(inputBatchIds) : null,
        inputBatchCodes:
          inputBatchCodes.length > 0 ? JSON.stringify(inputBatchCodes) : null,
        outputBatchId: data.batchId,
        outputBatchCode: data.outputBatchCode,
        inputQuantities:
          inputQuantitiesData.length > 0
            ? JSON.stringify(inputQuantitiesData)
            : null,
        outputQuantity: data.outputQuantity,
        outputUnit: data.unit,
        productId: batch?.batch.productId,
        productName: product?.name || null,
        packageType: data.outputBatchCode.includes("-")
          ? data.outputBatchCode.split("-").pop()
          : null,
        notes: data.notes || historyNotes,
        performedBy: req.user!.id,
        performedAt: recordData.processedDate || recordData.completedAt,
        processedDate: recordData.processedDate || recordData.completedAt,
        txHash: txHash || null,
      });

      res.json(record);
    } catch (error: any) {
      res.status(400).json({
        message: error.message || "Error al crear el registro de producción",
      });
    }
  });

  // Quality Checklist Templates
  app.get("/api/quality-checklist-templates", requireAuth, async (req, res) => {
    const templates = await storage.getQualityChecklistTemplates(
      req.user!.organizationId,
    );
    res.json(templates);
  });

  app.post(
    "/api/quality-checklist-templates",
    requireAuth,
    async (req, res) => {
      const { organizationId, ...bodyData } = req.body;
      const data = insertQualityChecklistTemplateSchema
        .omit({ organizationId: true })
        .parse(bodyData);
      const template = await storage.insertQualityChecklistTemplate({
        ...data,
        organizationId: req.user!.organizationId,
      });
      res.json(template);
    },
  );

  app.put(
    "/api/quality-checklist-templates/:id",
    requireAuth,
    async (req, res) => {
      const template = await storage.updateQualityChecklistTemplate(
        req.params.id,
        req.body,
      );
      res.json(template);
    },
  );

  app.delete(
    "/api/quality-checklist-templates/:id",
    requireAuth,
    async (req, res) => {
      await storage.deleteQualityChecklistTemplate(req.params.id);
      res.json({ success: true });
    },
  );

  // Quality Checks
  app.get("/api/quality-checks", requireAuth, async (req, res) => {
    const checks = await storage.getQualityChecks(req.user!.organizationId);
    res.json(checks);
  });

  app.get("/api/quality-checks/pending", requireAuth, async (req, res) => {
    const batches = await storage.getPendingQualityChecks(
      req.user!.organizationId,
    );
    res.json(batches);
  });

  app.post("/api/quality-checks", requireAuth, async (req, res) => {
    const data = insertQualityCheckSchema.parse(req.body);

    // Convert processedDate string to Date object if provided
    const checkData: any = {
      ...data,
      organizationId: req.user!.organizationId,
      checkedBy: req.user!.id,
    };

    if (data.processedDate) {
      checkData.processedDate = new Date(data.processedDate);
    }

    const check = await storage.insertQualityCheck(checkData);

    // --- INICIO BLOQUE BLOCKCHAIN ---
    const bInfo = await storage.getBatchById(
      data.batchId,
      req.user!.organizationId,
    );
    let txHash: string | null = null; // 1. Creamos la variable vacía

    if (bInfo) {
      // 2. Esperamos (await) a que la blockchain nos dé el recibo y lo guardamos
      txHash = await certifyBatchOnChain(
        bInfo.batch.batchCode,
        data.approved === 1,
      );
    }
    // --- FIN BLOQUE BLOCKCHAIN ---
    // Update batch status and expiry date based on approval
    const newStatus =
      data.approved === 1
        ? "APROBADO"
        : data.approved === -1
          ? "BLOQUEADO"
          : "RETENIDO";
    const updateData: any = { status: newStatus };

    // If approved, save the expiry date from the request body
    if (data.approved === 1 && req.body.expiryDate) {
      updateData.expiryDate = new Date(req.body.expiryDate);
    }

    await storage.updateBatch(data.batchId, updateData);

    // Create history entry
    await storage.insertBatchHistory({
      batchId: data.batchId,
      action: "quality_check",
      fromStatus: "ESTERILIZADO",
      toStatus: newStatus as any,
      notes:
        data.approved === 1
          ? "Lote aprobado para venta"
          : data.approved === -1
            ? "Lote bloqueado"
            : "Lote en revisión",
      performedBy: req.user!.id,
      organizationId: req.user!.organizationId,
    });

    // Registrar evento de trazabilidad para CALIDAD
    const batch = await storage.getBatchById(
      data.batchId,
      req.user!.organizationId,
    );
    const product = batch?.batch.productId
      ? await storage.getProductById(
          batch.batch.productId,
          req.user!.organizationId,
        )
      : null;

    await storage.insertTraceabilityEvent({
      organizationId: req.user!.organizationId,
      eventType: "CALIDAD",
      fromStage: "ESTERILIZADO",
      toStage: newStatus as any,
      outputBatchId: data.batchId,
      outputBatchCode: batch?.batch.batchCode,
      outputQuantity: batch?.batch.quantity,
      outputUnit: batch?.batch.unit,
      productId: batch?.batch.productId,
      productName: product?.name || null,
      qualityCheckId: check.id,
      qualityApproved: data.approved,
      notes:
        data.notes ||
        (data.approved === 1
          ? "Lote aprobado"
          : data.approved === -1
            ? "Lote rechazado"
            : "Lote en revisión"),
      performedBy: req.user!.id,
      performedAt: new Date(),
      processedDate: batch?.batch.processedDate || new Date(),
      txHash: txHash || null,
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
      const data = insertShipmentSchema
        .omit({ organizationId: true })
        .parse(bodyData);
      const shipment = await storage.insertShipment({
        ...data,
        organizationId: req.user!.organizationId,
      });

      // Get batch data
      const batchData = await storage.getBatchById(
        data.batchId,
        req.user!.organizationId,
      );

      if (batchData) {
        const currentQuantity = parseFloat(batchData.batch.quantity);
        const shippedQuantity = parseFloat(data.quantity);
        const remainingQuantity = currentQuantity - shippedQuantity;

        // Update batch quantity - reduce by shipped amount
        if (remainingQuantity > 0) {
          // Partial shipment - keep batch in APROBADO status with reduced quantity
          await storage.updateBatch(data.batchId, {
            quantity: remainingQuantity.toFixed(2),
          });
        } else {
          // Full shipment - mark as EXPEDIDO
          await storage.updateBatch(data.batchId, {
            quantity: "0",
            status: "EXPEDIDO",
          });
        }

        // Reduce product stock
        if (batchData.batch.productId && data.quantity && data.unit) {
          await storage.updateProductStock(
            req.user!.organizationId,
            batchData.batch.productId,
            data.unit,
            -shippedQuantity,
          );
        }

        // Create history entry
        await storage.insertBatchHistory({
          batchId: data.batchId,
          action: "shipped",
          fromStatus: batchData.batch.status,
          toStatus: remainingQuantity > 0 ? batchData.batch.status : "EXPEDIDO",
          notes: `Expedición parcial: ${shippedQuantity} ${data.unit}. Restante: ${remainingQuantity.toFixed(2)} ${data.unit}`,
          organizationId: req.user!.organizationId,
        });

        // Registrar evento de trazabilidad para EXPEDICION
        const customer = await storage.getCustomerById(
          data.customerId,
          req.user!.organizationId,
        );
        const product = batchData.batch.productId
          ? await storage.getProductById(
              batchData.batch.productId,
              req.user!.organizationId,
            )
          : null;

        await storage.insertTraceabilityEvent({
          organizationId: req.user!.organizationId,
          eventType: "EXPEDICION",
          fromStage: "APROBADO",
          toStage: "EXPEDIDO",
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
          notes: `Expedición de ${shippedQuantity} ${data.unit}. Matrícula: ${data.truckPlate || "-"}. Restante: ${remainingQuantity.toFixed(2)} ${data.unit}`,
          performedBy: req.user!.id,
          performedAt: new Date(),
          processedDate: batchData.batch.processedDate || new Date(),
          txHash: txHash || null,
        });
      }

      res.json(shipment);
    } catch (error: any) {
      // Manejar error de código duplicado
      if (
        error.code === "23505" &&
        error.constraint === "shipments_shipment_code_unique"
      ) {
        return res.status(400).json({
          message: `El código de expedición "${req.body.shipmentCode}" ya existe. Por favor, usa un código diferente.`,
        });
      }
      res
        .status(400)
        .json({ message: error.message || "Error al crear la expedición" });
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
    const history = await storage.getBatchHistory(
      req.params.batchId,
      req.user!.organizationId,
    );
    res.json(history);
  });

  // Traceability Events
  app.get("/api/traceability-events", requireAuth, async (req, res) => {
    const events = await storage.getTraceabilityEvents(
      req.user!.organizationId,
    );
    res.json(events);
  });

  app.get(
    "/api/traceability-events/batch/:batchCode",
    requireAuth,
    async (req, res) => {
      const events = await storage.getTraceabilityEventsByBatch(
        req.params.batchCode,
        req.user!.organizationId,
      );
      res.json(events);
    },
  );

  app.get(
    "/api/traceability-events/shipment/:shipmentId",
    requireAuth,
    async (req, res) => {
      const events = await storage.getTraceabilityEventsByShipment(
        req.params.shipmentId,
        req.user!.organizationId,
      );
      res.json(events);
    },
  );

  // Admin - User Management
  app.get("/api/admin/users", requireAuth, async (req, res) => {
    const orgUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.organizationId, req.user!.organizationId));
    res.json(orgUsers);
  });

  // NUEVA RUTA: Obtener historial de blockchain (real o simulado)
  app.get("/api/traceability/:code", async (req, res) => {
    try {
      const history = await getBatchHistory(req.params.code);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ message: "Error obteniendo trazabilidad" });
    }
  });

  app.post("/api/admin/users", requireAuth, async (req, res) => {
    try {
      const { username, email, password } = req.body;

      // Check if user exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
      if (existingUser) {
        return res.status(400).json({ message: "El email ya está registrado" });
      }

      // Create user
      const hashedPassword = await hashPassword(password);
      const [newUser] = await db
        .insert(users)
        .values({
          username,
          email,
          password: hashedPassword,
          organizationId: req.user!.organizationId,
        })
        .returning({
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
        return res
          .status(400)
          .json({ message: "No puedes eliminar tu propio usuario" });
      }

      await db.delete(users).where(eq(users.id, req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Admin - Audit Excel Generation
  app.get("/api/admin/audit/excel", requireAuth, async (req, res) => {
    try {
      const ExcelJS = await import("exceljs");
      const { type, startDate, endDate } = req.query;

      // Create workbook and worksheet
      const workbook = new ExcelJS.default.Workbook();
      const worksheet = workbook.addWorksheet("Reporte de Auditoría");

      // Set response headers
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=auditoria_${type}_${new Date().toISOString().split("T")[0]}.xlsx`,
      );

      // Get organization info
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, req.user!.organizationId));

      // Add title and metadata
      worksheet.mergeCells("A1:F1");
      worksheet.getCell("A1").value = "Reporte de Auditoría";
      worksheet.getCell("A1").font = { size: 16, bold: true };
      worksheet.getCell("A1").alignment = { horizontal: "center" };

      worksheet.getCell("A2").value = `Organización: ${org.name}`;
      worksheet.getCell("A3").value =
        `Fecha de generación: ${new Date().toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}`;

      if (startDate) {
        worksheet.getCell("A4").value =
          `Desde: ${new Date(startDate as string).toLocaleDateString("es-ES")}`;
      }
      if (endDate) {
        worksheet.getCell("A5").value =
          `Hasta: ${new Date(endDate as string).toLocaleDateString("es-ES")}`;
      }

      worksheet.getCell("A6").value = getReportTitle(type as string);
      worksheet.getCell("A6").font = { size: 14, bold: true };

      let startRow = 8;

      // Get data based on report type
      switch (type) {
        case "batches":
          const batches = await storage.getAllBatchHistory(
            req.user!.organizationId,
          );
          worksheet.getRow(startRow).values = [
            "#",
            "Lote",
            "Acción",
            "Fecha",
            "Estado Origen",
            "Estado Destino",
            "Notas",
          ];
          worksheet.getRow(startRow).font = { bold: true };

          batches.forEach((item, index) => {
            const history = item.history || item;
            const batch = item.batch;
            worksheet.addRow([
              index + 1,
              batch?.batchCode || item.batchCode || "-",
              history.action || "-",
              new Date(history.createdAt || item.timestamp).toLocaleDateString(
                "es-ES",
              ),
              history.fromStatus || "-",
              history.toStatus || "-",
              history.notes || "",
            ]);
          });
          break;

        case "production":
          const records = await storage.getProductionRecords(
            req.user!.organizationId,
          );
          worksheet.getRow(startRow).values = [
            "#",
            "Lote",
            "Etapa",
            "Fecha",
            "Entrada",
            "Salida",
            "Unidad",
            "Notas",
          ];
          worksheet.getRow(startRow).font = { bold: true };

          records.forEach((item, index) => {
            const record = item.record || item;
            const batch = item.batch;
            worksheet.addRow([
              index + 1,
              batch?.batchCode || item.batchCode || "-",
              record.stage || "-",
              new Date(
                record.completedAt || record.createdAt,
              ).toLocaleDateString("es-ES"),
              record.inputQuantity || "0",
              record.outputQuantity || "0",
              record.unit || "-",
              record.notes || "",
            ]);
          });
          break;

        case "quality":
          const checks = await storage.getQualityChecks(
            req.user!.organizationId,
          );
          worksheet.getRow(startRow).values = [
            "#",
            "Lote",
            "Producto",
            "Estado",
            "Fecha",
            "Notas",
          ];
          worksheet.getRow(startRow).font = { bold: true };

          checks.forEach((item, index) => {
            const check = item.check || item.qualityCheck || item;
            const batch = item.batch || {};
            const product = item.product || {};
            const approved =
              check.approved === 1
                ? "Aprobado"
                : check.approved === -1
                  ? "Rechazado"
                  : "Pendiente";

            worksheet.addRow([
              index + 1,
              batch.batchCode || "-",
              product.name || "-",
              approved,
              new Date(check.checkedAt || check.createdAt).toLocaleDateString(
                "es-ES",
              ),
              check.notes || "",
            ]);
          });
          break;

        case "shipments":
          const shipments = await storage.getShipments(
            req.user!.organizationId,
          );
          worksheet.getRow(startRow).values = [
            "#",
            "Código",
            "Cliente",
            "Lote",
            "Cantidad",
            "Unidad",
            "Fecha",
            "Albarán",
          ];
          worksheet.getRow(startRow).font = { bold: true };

          shipments.forEach((item, index) => {
            const shipment = item.shipment || item;
            const customer = item.customer;
            const batch = item.batch;

            worksheet.addRow([
              index + 1,
              shipment.shipmentCode || "-",
              customer?.name || item.customerName || "-",
              batch?.batchCode || item.batchCode || "-",
              shipment.quantity || "0",
              shipment.unit || "-",
              new Date(
                shipment.shippedAt || shipment.createdAt,
              ).toLocaleDateString("es-ES"),
              shipment.deliveryNote || "",
            ]);
          });
          break;

        case "traceability":
          const events = await storage.getTraceabilityEvents(
            req.user!.organizationId,
          );
          worksheet.getRow(startRow).values = [
            "#",
            "Tipo",
            "Etapa Origen",
            "Etapa Destino",
            "Lote",
            "Producto",
            "Fecha",
            "Notas",
          ];
          worksheet.getRow(startRow).font = { bold: true };

          events.forEach((event, index) => {
            worksheet.addRow([
              index + 1,
              event.eventType,
              event.fromStage || "-",
              event.toStage || "-",
              event.outputBatchCode || "-",
              event.productName || "-",
              new Date(event.performedAt).toLocaleDateString("es-ES"),
              event.notes || "",
            ]);
          });
          break;

        case "delivery_notes":
          const batchesWithDN = await storage.getBatches(
            req.user!.organizationId,
          );

          // Recepciones
          worksheet.getRow(startRow).values = ["RECEPCIONES CON ALBARÁN"];
          worksheet.getRow(startRow).font = { bold: true, size: 12 };
          startRow++;

          worksheet.getRow(startRow).values = [
            "#",
            "Albarán",
            "Lote",
            "Producto",
            "Proveedor",
            "Cantidad",
            "Unidad",
            "Fecha",
          ];
          worksheet.getRow(startRow).font = { bold: true };
          startRow++;

          let receptionIndex = 0;
          batchesWithDN.forEach((item) => {
            if (item.batch.deliveryNote) {
              receptionIndex++;
              worksheet.addRow([
                receptionIndex,
                item.batch.deliveryNote,
                item.batch.batchCode,
                item.product?.name || "-",
                item.supplier?.name || "-",
                item.batch.quantity,
                item.batch.unit,
                new Date(
                  item.batch.arrivedAt || item.batch.createdAt,
                ).toLocaleDateString("es-ES"),
              ]);
            }
          });

          if (receptionIndex === 0) {
            worksheet.addRow(["No hay recepciones con albarán registrado"]);
          }

          // Expediciones
          startRow = worksheet.lastRow.number + 2;
          worksheet.getRow(startRow).values = [
            "EXPEDICIONES CON CÓDIGO DE ALBARÁN",
          ];
          worksheet.getRow(startRow).font = { bold: true, size: 12 };
          startRow++;

          worksheet.getRow(startRow).values = [
            "#",
            "Código Albarán",
            "Lote",
            "Producto",
            "Cliente",
            "Cantidad",
            "Unidad",
            "Fecha",
          ];
          worksheet.getRow(startRow).font = { bold: true };
          startRow++;

          const shipmentsWithDN = await storage.getShipments(
            req.user!.organizationId,
          );
          let shipmentIndex = 0;
          shipmentsWithDN.forEach((item) => {
            // Usar shipmentCode en lugar de deliveryNote para expediciones
            if (item.shipment.shipmentCode) {
              shipmentIndex++;
              worksheet.addRow([
                shipmentIndex,
                item.shipment.shipmentCode,
                item.batch?.batchCode || "-",
                item.product?.name || "-",
                item.customer?.name || "-",
                item.shipment.quantity,
                item.shipment.unit,
                new Date(
                  item.shipment.shippedAt || item.shipment.createdAt,
                ).toLocaleDateString("es-ES"),
              ]);
            }
          });

          if (shipmentIndex === 0) {
            worksheet.addRow([
              "No hay expediciones con código de albarán registrado",
            ]);
          }
          break;

        case "stock":
          const stockBatches = await storage.getBatches(
            req.user!.organizationId,
          );
          const stockProductionRecords = await storage.getProductionRecords(
            req.user!.organizationId,
          );

          const productMovements = new Map();

          // Recepciones
          stockBatches.forEach((item) => {
            if (item.batch.status === "RECEPCION" && item.product?.name) {
              const productName = item.product.name;
              if (!productMovements.has(productName)) {
                productMovements.set(productName, []);
              }
              productMovements.get(productName).push({
                type: "Recepción",
                date: new Date(item.batch.arrivedAt || item.batch.createdAt),
                batchCode: item.batch.batchCode,
                quantity: parseFloat(
                  item.batch.initialQuantity || item.batch.quantity,
                ),
                unit: item.batch.unit,
                supplier: item.supplier?.name || "-",
              });
            }
          });

          // Consumos en ASADO
          stockProductionRecords.forEach((item) => {
            if (item.record.stage === "ASADO" && item.product?.name) {
              const productName = item.product.name;
              if (!productMovements.has(productName)) {
                productMovements.set(productName, []);
              }
              productMovements.get(productName).push({
                type: "Consumo en Asado",
                date: new Date(
                  item.record.completedAt || item.record.createdAt,
                ),
                batchCode: item.batch?.batchCode || "-",
                quantity: -parseFloat(item.record.inputQuantity || "0"),
                unit: item.record.unit,
                notes: `Entrada: ${item.record.inputQuantity} kg → Salida: ${item.record.outputQuantity} kg`,
              });
            }
          });

          let productIndex = 0;
          productMovements.forEach((movements, productName) => {
            productIndex++;
            movements.sort((a, b) => a.date - b.date);
            const totalBalance = movements.reduce(
              (sum, mov) => sum + mov.quantity,
              0,
            );

            const titleRow = worksheet.addRow([
              `${productIndex}. ${productName}`,
              "",
              "",
              `Balance total: ${totalBalance.toFixed(2)} ${movements[0]?.unit || ""}`,
            ]);
            titleRow.font = { bold: true };

            worksheet.addRow([
              "#",
              "Tipo",
              "Fecha",
              "Lote",
              "Cantidad",
              "Proveedor/Notas",
            ]);

            movements.forEach((mov, idx) => {
              worksheet.addRow([
                idx + 1,
                mov.type,
                mov.date.toLocaleDateString("es-ES"),
                mov.batchCode,
                `${mov.quantity >= 0 ? "+" : ""}${mov.quantity.toFixed(2)} ${mov.unit}`,
                mov.supplier || mov.notes || "",
              ]);
            });

            worksheet.addRow([]);
          });

          if (productMovements.size === 0) {
            worksheet.addRow(["No hay movimientos de stock registrados"]);
          }
          break;
      }

      // Auto-fit columns
      worksheet.columns.forEach((column) => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const cellLength = cell.value ? cell.value.toString().length : 10;
          if (cellLength > maxLength) {
            maxLength = cellLength;
          }
        });
        column.width = maxLength < 10 ? 10 : maxLength + 2;
      });

      // Write to response
      await workbook.xlsx.write(res);
      res.end();
    } catch (error: any) {
      console.error("Error generating Excel:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Admin - Audit PDF Generation
  app.get("/api/admin/audit/pdf", requireAuth, async (req, res) => {
    try {
      const { type, startDate, endDate } = req.query;

      // Create PDF document
      const doc = new PDFDocument({ margin: 50 });

      // Set response headers
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=auditoria_${type}_${new Date().toISOString().split("T")[0]}.pdf`,
      );

      // Pipe PDF to response
      doc.pipe(res);

      // Add content
      doc.fontSize(20).text("Reporte de Auditoría", { align: "center" });
      doc.moveDown();

      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, req.user!.organizationId));
      doc.fontSize(12).text(`Organización: ${org.name}`);
      doc.text(
        `Fecha de generación: ${new Date().toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}`,
      );

      if (startDate) {
        doc.text(
          `Desde: ${new Date(startDate as string).toLocaleDateString("es-ES")}`,
        );
      }
      if (endDate) {
        doc.text(
          `Hasta: ${new Date(endDate as string).toLocaleDateString("es-ES")}`,
        );
      }

      doc.moveDown();
      doc.fontSize(16).text(getReportTitle(type as string));
      doc.moveDown();

      // Get data based on report type
      let data: any[] = [];
      switch (type) {
        case "batches":
          const batches = await storage.getAllBatchHistory(
            req.user!.organizationId,
          );
          doc.fontSize(12);
          batches.forEach((item, index) => {
            const history = item.history || item;
            const batch = item.batch;

            const batchCode = batch?.batchCode || item.batchCode || "-";
            const action = history.action || "-";
            const timestamp = history.createdAt || item.timestamp;
            const fromStatus = history.fromStatus || "-";
            const toStatus = history.toStatus || "-";
            const notes = history.notes;

            doc.text(
              `${index + 1}. Lote ${batchCode} - ${action} - ${new Date(timestamp).toLocaleDateString("es-ES")}`,
            );
            doc.fontSize(10).text(`   Estado: ${fromStatus} → ${toStatus}`);
            if (notes) doc.text(`   Notas: ${notes}`);
            doc.fontSize(12).moveDown(0.5);
          });
          break;

        case "production":
          const records = await storage.getProductionRecords(
            req.user!.organizationId,
          );
          doc.fontSize(12);
          records.forEach((item, index) => {
            const record = item.record || item;
            const batch = item.batch;

            const batchCode = batch?.batchCode || item.batchCode || "-";
            const stage = record.stage || "-";
            const completedAt = record.completedAt || record.createdAt;
            const inputQuantity = record.inputQuantity || "0";
            const outputQuantity = record.outputQuantity || "0";
            const unit = record.unit || "-";
            const notes = record.notes;

            doc.text(`${index + 1}. Lote ${batchCode} - ${stage}`);
            doc
              .fontSize(10)
              .text(
                `   Fecha: ${new Date(completedAt).toLocaleDateString("es-ES")}`,
              );
            doc.text(
              `   Entrada: ${inputQuantity} ${unit} → Salida: ${outputQuantity} ${unit}`,
            );
            if (notes) doc.text(`   Notas: ${notes}`);
            doc.fontSize(12).moveDown(0.5);
          });
          break;

        case "quality":
          const checks = await storage.getQualityChecks(
            req.user!.organizationId,
          );
          doc.fontSize(12);
          checks.forEach((item, index) => {
            const check = item.check || item.qualityCheck || item;
            const batch = item.batch || {};
            const product = item.product || {};

            const approved =
              check.approved === 1
                ? "Aprobado"
                : check.approved === -1
                  ? "Rechazado"
                  : "Pendiente";
            const batchCode = batch.batchCode || "-";
            const productName = product.name || "-";
            const checkedAt = check.checkedAt || check.createdAt;
            const notes = check.notes || "";

            doc.text(`${index + 1}. Lote ${batchCode} - ${approved}`);
            doc.fontSize(10).text(`   Producto: ${productName}`);
            doc.text(
              `   Fecha: ${new Date(checkedAt).toLocaleDateString("es-ES")}`,
            );
            if (notes) doc.text(`   Notas: ${notes}`);
            doc.fontSize(12).moveDown(0.5);
          });
          break;

        case "shipments":
          const shipments = await storage.getShipments(
            req.user!.organizationId,
          );
          doc.fontSize(12);
          shipments.forEach((item, index) => {
            const shipment = item.shipment || item;
            const customer = item.customer;
            const batch = item.batch;

            const shipmentCode = shipment.shipmentCode || "-";
            const customerName = customer?.name || item.customerName || "-";
            const batchCode = batch?.batchCode || item.batchCode || "-";
            const quantity = shipment.quantity || "0";
            const unit = shipment.unit || "-";
            const shippedAt = shipment.shippedAt || shipment.createdAt;
            const deliveryNote = shipment.deliveryNote;

            doc.text(
              `${index + 1}. ${shipmentCode} - Cliente: ${customerName}`,
            );
            doc.fontSize(10).text(`   Lote: ${batchCode}`);
            doc.text(`   Cantidad: ${quantity} ${unit}`);
            doc.text(
              `   Fecha: ${new Date(shippedAt).toLocaleDateString("es-ES")}`,
            );
            if (deliveryNote) doc.text(`   Albarán: ${deliveryNote}`);
            doc.fontSize(12).moveDown(0.5);
          });
          break;

        case "traceability":
          const events = await storage.getTraceabilityEvents(
            req.user!.organizationId,
          );
          doc.fontSize(12);
          events.forEach((event, index) => {
            doc.text(
              `${index + 1}. ${event.eventType} - ${new Date(event.performedAt).toLocaleDateString("es-ES")}`,
            );
            doc
              .fontSize(10)
              .text(
                `   Etapa: ${event.fromStage || "-"} → ${event.toStage || "-"}`,
              );
            if (event.outputBatchCode)
              doc.text(`   Lote: ${event.outputBatchCode}`);
            if (event.productName)
              doc.text(`   Producto: ${event.productName}`);
            if (event.notes) doc.text(`   Notas: ${event.notes}`);
            doc.fontSize(12).moveDown(0.5);
          });
          break;

        case "delivery_notes":
          // Get batches with delivery notes (receptions)
          const batchesWithDN = await storage.getBatches(
            req.user!.organizationId,
          );
          doc.fontSize(12);

          doc
            .fontSize(14)
            .text("Recepciones con Albarán:", { underline: true });
          doc.fontSize(12).moveDown(0.5);

          let receptionIndex = 0;
          batchesWithDN.forEach((item) => {
            if (item.batch.deliveryNote) {
              receptionIndex++;
              doc.text(
                `${receptionIndex}. Albarán: ${item.batch.deliveryNote}`,
              );
              doc.fontSize(10).text(`   Lote: ${item.batch.batchCode}`);
              doc.text(`   Producto: ${item.product?.name || "-"}`);
              doc.text(`   Proveedor: ${item.supplier?.name || "-"}`);
              doc.text(
                `   Cantidad: ${item.batch.quantity} ${item.batch.unit}`,
              );
              doc.text(
                `   Fecha: ${new Date(item.batch.arrivedAt || item.batch.createdAt).toLocaleDateString("es-ES")}`,
              );
              doc.fontSize(12).moveDown(0.5);
            }
          });

          if (receptionIndex === 0) {
            doc.text("No hay recepciones con albarán registrado");
          }

          doc.moveDown();
          doc
            .fontSize(14)
            .text("Expediciones con Código de Albarán:", { underline: true });
          doc.fontSize(12).moveDown(0.5);

          const shipmentsWithDN = await storage.getShipments(
            req.user!.organizationId,
          );
          let shipmentIndex = 0;
          shipmentsWithDN.forEach((item) => {
            // Usar shipmentCode en lugar de deliveryNote para expediciones
            if (item.shipment.shipmentCode) {
              shipmentIndex++;
              doc.text(
                `${shipmentIndex}. Código Albarán: ${item.shipment.shipmentCode}`,
              );
              doc.fontSize(10).text(`   Lote: ${item.batch?.batchCode || "-"}`);
              doc.text(`   Producto: ${item.product?.name || "-"}`);
              doc.text(`   Cliente: ${item.customer?.name || "-"}`);
              doc.text(
                `   Cantidad: ${item.shipment.quantity} ${item.shipment.unit}`,
              );
              doc.text(
                `   Fecha: ${new Date(item.shipment.shippedAt || item.shipment.createdAt).toLocaleDateString("es-ES")}`,
              );
              doc.fontSize(12).moveDown(0.5);
            }
          });

          if (shipmentIndex === 0) {
            doc.text("No hay expediciones con código de albarán registrado");
          }
          break;

        case "stock":
          // Obtener recepciones y registros de producción de asado
          const stockBatches = await storage.getBatches(
            req.user!.organizationId,
          );
          const stockProductionRecords = await storage.getProductionRecords(
            req.user!.organizationId,
          );

          // Agrupar movimientos por producto
          const productMovements = new Map();

          // 1. Recepciones (entradas de materia prima)
          stockBatches.forEach((item) => {
            if (item.batch.status === "RECEPCION" && item.product?.name) {
              const productName = item.product.name;
              if (!productMovements.has(productName)) {
                productMovements.set(productName, []);
              }
              productMovements.get(productName).push({
                type: "Recepción",
                date: new Date(item.batch.arrivedAt || item.batch.createdAt),
                batchCode: item.batch.batchCode,
                quantity: parseFloat(
                  item.batch.initialQuantity || item.batch.quantity,
                ),
                unit: item.batch.unit,
                supplier: item.supplier?.name || "-",
              });
            }
          });

          // 2. Consumos en ASADO únicamente
          stockProductionRecords.forEach((item) => {
            if (item.record.stage === "ASADO" && item.product?.name) {
              const productName = item.product.name;
              if (!productMovements.has(productName)) {
                productMovements.set(productName, []);
              }
              productMovements.get(productName).push({
                type: "Consumo en Asado",
                date: new Date(
                  item.record.completedAt || item.record.createdAt,
                ),
                batchCode: item.batch?.batchCode || "-",
                quantity: -parseFloat(item.record.inputQuantity || "0"),
                unit: item.record.unit,
                notes: `Entrada: ${item.record.inputQuantity} kg → Salida: ${item.record.outputQuantity} kg`,
              });
            }
          });

          doc.fontSize(12);

          // Imprimir movimientos por producto
          let productIndex = 0;
          productMovements.forEach((movements, productName) => {
            productIndex++;

            // Ordenar movimientos por fecha
            movements.sort((a, b) => a.date - b.date);

            // Calcular balance total
            const totalBalance = movements.reduce(
              (sum, mov) => sum + mov.quantity,
              0,
            );

            doc
              .fontSize(14)
              .fillColor("#000000")
              .text(`${productIndex}. ${productName}`, { underline: true });
            doc
              .fontSize(10)
              .fillColor("#666666")
              .text(
                `   Balance total: ${totalBalance.toFixed(2)} ${movements[0]?.unit || ""}`,
              );
            doc.moveDown(0.3);

            // Imprimir cada movimiento
            movements.forEach((mov, idx) => {
              const sign = mov.quantity >= 0 ? "+" : "";
              const color = mov.quantity >= 0 ? "#006400" : "#8B0000";

              doc
                .fontSize(9)
                .fillColor("#000000")
                .text(
                  `   ${idx + 1}. ${mov.type} - ${mov.date.toLocaleDateString("es-ES")}`,
                );
              doc
                .fillColor(color)
                .text(
                  `      Cantidad: ${sign}${mov.quantity.toFixed(2)} ${mov.unit}`,
                );
              doc.fillColor("#000000").text(`      Lote: ${mov.batchCode}`);

              if (mov.supplier) doc.text(`      Proveedor: ${mov.supplier}`);
              if (mov.notes) doc.text(`      ${mov.notes}`);

              doc.moveDown(0.2);
            });

            doc.moveDown(0.5);
          });

          if (productMovements.size === 0) {
            doc.text("No hay movimientos de stock registrados");
          }
          break;
      }

      // Finalize PDF
      doc.end();
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  function getReportTitle(type: string): string {
    const titles: Record<string, string> = {
      batches: "Historial de Lotes",
      production: "Registros de Producción",
      quality: "Controles de Calidad",
      shipments: "Expediciones",
      traceability: "Trazabilidad Completa",
      delivery_notes: "Reportes por Albarán",
      stock: "Stock de Productos",
    };
    return titles[type] || "Reporte";
  }

  const httpServer = createServer(app);
  // Endpoint público para generar QR
  app.get("/api/batches/:id/qr", requireAuth, async (req, res) => {
    const batchData = await storage.getBatchById(
      req.params.id,
      req.user!.organizationId,
    );
    if (!batchData)
      return res.status(404).json({ message: "Lote no encontrado" });

    const result = await generateTraceabilityQR(batchData.batch.batchCode);
    res.json(result);
  });
  return httpServer;
}
