import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { syncedProducts, syncedOrders, syncedCustomers } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/sync/products", async (req, res) => {
    try {
      const products = req.body;
      if (!Array.isArray(products)) {
        return res.status(400).json({ error: "Expected array of products" });
      }

      const results = [];
      for (const product of products) {
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
            createdAt: product.createdAt ? new Date(product.createdAt) : new Date(),
            updatedAt: new Date(),
          });
          results.push({ clientId: product.clientId, action: "created" });
        }
      }
      res.json({ synced: results.length, results });
    } catch (error: any) {
      console.error("Sync products error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sync/orders", async (req, res) => {
    try {
      const orders = req.body;
      if (!Array.isArray(orders)) {
        return res.status(400).json({ error: "Expected array of orders" });
      }

      const results = [];
      for (const order of orders) {
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
      res.json({ synced: results.filter(r => r.action === "created").length, results });
    } catch (error: any) {
      console.error("Sync orders error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sync/customers", async (req, res) => {
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
