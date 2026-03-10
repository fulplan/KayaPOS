import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { storage } from "./storage";
import { syncedProducts, syncedOrders, syncedCustomers, syncedBusinessSettings } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import pg from "pg";

const PgSession = connectPg(session);

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}


export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  const sessionPool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });

  app.use(
    session({
      store: new PgSession({
        pool: sessionPool,
        tableName: "sessions",
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "kaya-pos-session-secret-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      },
    })
  );

  await ensureDefaultAdmin();

  app.post("/api/auth/register", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ error: "Only admins can register new users" });
      }

      const { username, password, fullName, role } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(400).json({ error: "Username already taken" });
      }

      const validRoles = ["admin", "manager", "cashier"];
      const safeRole = validRoles.includes(role) ? role : "cashier";

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        fullName: fullName || username,
        role: safeRole,
      });

      res.json({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
      });
    } catch (error: any) {
      console.error("Register error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      if (!user.isActive) {
        return res.status(403).json({ error: "Account has been deactivated. Contact your admin." });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      req.session.userId = user.id;
      res.json({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user || !user.isActive) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: "Not authenticated" });
    }

    res.json({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
    });
  });

  app.get("/api/admin/users", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const allUsers = await storage.getAllUsers();
      res.json(allUsers.map(u => ({
        id: u.id,
        username: u.username,
        fullName: u.fullName,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
      })));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/users", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { username, password, fullName, role } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }

      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(400).json({ error: "Username already taken" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        fullName: fullName || username,
        role: role || "cashier",
      });

      res.json({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/admin/users/:id", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { fullName, role, isActive, password } = req.body;
      const updateData: any = {};
      if (fullName !== undefined) updateData.fullName = fullName;
      if (role !== undefined) updateData.role = role;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (password) updateData.password = await bcrypt.hash(password, 10);

      const updated = await storage.updateUser(req.params.id, updateData);
      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        id: updated.id,
        username: updated.username,
        fullName: updated.fullName,
        role: updated.role,
        isActive: updated.isActive,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sync/products", requireAuth, async (req, res) => {
    try {
      const products = req.body;
      if (!Array.isArray(products)) {
        return res.status(400).json({ error: "Expected array of products" });
      }

      const BATCH_SIZE = 50;
      const results = [];
      for (let i = 0; i < products.length; i += BATCH_SIZE) {
        const batch = products.slice(i, i + BATCH_SIZE);
        for (const product of batch) {
          const existing = await db.select().from(syncedProducts).where(eq(syncedProducts.clientId, product.clientId)).limit(1);
          if (existing.length > 0) {
            await db.update(syncedProducts).set({
              name: product.name,
              price: product.price.toString(),
              category: product.category,
              stock: product.stock,
              lowStockThreshold: product.lowStockThreshold,
              barcode: product.barcode || null,
              sku: product.sku || null,
              image: product.image || null,
              description: product.description || null,
              isActive: product.isActive,
              dosageForm: product.dosageForm || null,
              strength: product.strength || null,
              requiresPrescription: product.requiresPrescription || false,
              manufacturer: product.manufacturer || null,
              serviceTime: product.serviceTime || null,
              servingSize: product.servingSize || null,
              updatedAt: new Date(),
            }).where(eq(syncedProducts.clientId, product.clientId));
            results.push({ clientId: product.clientId, action: "updated" });
          } else {
            await db.insert(syncedProducts).values({
              clientId: product.clientId,
              name: product.name,
              price: product.price.toString(),
              category: product.category,
              stock: product.stock,
              lowStockThreshold: product.lowStockThreshold,
              barcode: product.barcode || null,
              sku: product.sku || null,
              image: product.image || null,
              description: product.description || null,
              isActive: product.isActive,
              dosageForm: product.dosageForm || null,
              strength: product.strength || null,
              requiresPrescription: product.requiresPrescription || false,
              manufacturer: product.manufacturer || null,
              serviceTime: product.serviceTime || null,
              servingSize: product.servingSize || null,
              createdAt: product.createdAt ? new Date(product.createdAt) : new Date(),
              updatedAt: new Date(),
            });
            results.push({ clientId: product.clientId, action: "created" });
          }
        }
      }
      res.json({ synced: results.length, results });
    } catch (error: any) {
      console.error("Sync products error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sync/orders", requireAuth, async (req, res) => {
    try {
      const orders = req.body;
      if (!Array.isArray(orders)) {
        return res.status(400).json({ error: "Expected array of orders" });
      }

      const results = [];
      const BATCH_SIZE = 50;
      for (let i = 0; i < orders.length; i += BATCH_SIZE) {
        const batch = orders.slice(i, i + BATCH_SIZE);
        for (const order of batch) {
          const existing = await db.select().from(syncedOrders).where(eq(syncedOrders.clientId, order.clientId)).limit(1);
          if (existing.length === 0) {
            await db.insert(syncedOrders).values({
              clientId: order.clientId,
              items: order.items,
              subtotal: order.subtotal.toString(),
              tax: order.tax.toString(),
              taxRuleName: order.taxRuleName || null,
              taxRate: order.taxRate?.toString() || null,
              discount: order.discount.toString(),
              discountType: order.discountType || null,
              total: order.total.toString(),
              status: order.status,
              paymentMethods: order.paymentMethods,
              customerId: order.customerId || null,
              notes: order.notes || null,
              createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
            });
            results.push({ clientId: order.clientId, action: "created" });
          } else {
            results.push({ clientId: order.clientId, action: "exists" });
          }
        }
      }
      res.json({ synced: results.filter(r => r.action === "created").length, results });
    } catch (error: any) {
      console.error("Sync orders error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sync/customers", requireAuth, async (req, res) => {
    try {
      const customers = req.body;
      if (!Array.isArray(customers)) {
        return res.status(400).json({ error: "Expected array of customers" });
      }

      const results = [];
      for (const customer of customers) {
        const existing = await db.select().from(syncedCustomers).where(eq(syncedCustomers.clientId, customer.clientId)).limit(1);
        if (existing.length > 0) {
          await db.update(syncedCustomers).set({
            name: customer.name,
            phone: customer.phone,
            balance: customer.balance.toString(),
          }).where(eq(syncedCustomers.clientId, customer.clientId));
          results.push({ clientId: customer.clientId, action: "updated" });
        } else {
          await db.insert(syncedCustomers).values({
            clientId: customer.clientId,
            name: customer.name,
            phone: customer.phone,
            balance: customer.balance.toString(),
          });
          results.push({ clientId: customer.clientId, action: "created" });
        }
      }
      res.json({ synced: results.length, results });
    } catch (error: any) {
      console.error("Sync customers error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sync/business-settings", requireAuth, async (req, res) => {
    try {
      const settings = req.body;
      const existing = await db.select().from(syncedBusinessSettings).limit(1);
      if (existing.length > 0) {
        await db.update(syncedBusinessSettings).set({
          businessName: settings.businessName || "",
          address: settings.address || null,
          phone: settings.phone || null,
          email: settings.email || null,
          logo: settings.logo || null,
          businessType: settings.businessType || "retail",
          updatedAt: new Date(),
        }).where(eq(syncedBusinessSettings.id, existing[0].id));
      } else {
        await db.insert(syncedBusinessSettings).values({
          businessName: settings.businessName || "",
          address: settings.address || null,
          phone: settings.phone || null,
          email: settings.email || null,
          logo: settings.logo || null,
          businessType: settings.businessType || "retail",
        });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Sync business settings error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/sync/status", async (_req, res) => {
    try {
      const products = await db.select().from(syncedProducts);
      const orders = await db.select().from(syncedOrders);
      const customers = await db.select().from(syncedCustomers);
      res.json({
        products: products.length,
        orders: orders.length,
        customers: customers.length,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}

async function ensureDefaultAdmin() {
  try {
    const existing = await storage.getUserByUsername("admin");
    if (!existing) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await storage.createUser({
        username: "admin",
        password: hashedPassword,
        fullName: "Administrator",
        role: "admin",
      });
      console.log("Default admin account created (username: admin, password: admin123)");
    }
  } catch (error) {
    console.error("Failed to create default admin:", error);
  }
}
