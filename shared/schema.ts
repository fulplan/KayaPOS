import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, numeric, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const syncedProducts = pgTable("synced_products", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  name: text("name").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  stock: integer("stock").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(10),
  barcode: text("barcode"),
  sku: text("sku"),
  image: text("image"),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const syncedOrders = pgTable("synced_orders", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  items: jsonb("items").notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: numeric("tax", { precision: 10, scale: 2 }).notNull(),
  taxRuleName: text("tax_rule_name"),
  taxRate: numeric("tax_rate", { precision: 5, scale: 4 }),
  discount: numeric("discount", { precision: 10, scale: 2 }).notNull().default("0"),
  discountType: text("discount_type"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("completed"),
  paymentMethods: jsonb("payment_methods").notNull(),
  customerId: integer("customer_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const syncedCustomers = pgTable("synced_customers", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  balance: numeric("balance", { precision: 10, scale: 2 }).notNull().default("0"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
