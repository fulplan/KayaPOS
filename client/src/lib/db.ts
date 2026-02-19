import Dexie, { type Table } from 'dexie';

export interface Category {
  id?: number;
  name: string;
  description?: string;
  color?: string;
  createdAt: Date;
}

export interface Product {
  id?: number;
  name: string;
  price: number;
  category: string;
  categoryId?: number;
  stock: number;
  lowStockThreshold: number;
  barcode?: string;
  sku?: string;
  image?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariant {
  id?: number;
  productId: number;
  name: string;
  sku?: string;
  barcode?: string;
  price: number;
  stock: number;
  attributes: Record<string, string>;
}

export interface Batch {
  id?: number;
  productId: number;
  variantId?: number;
  batchNumber: string;
  quantity: number;
  remainingQuantity: number;
  costPrice: number;
  expiryDate?: Date;
  manufacturingDate?: Date;
  supplier?: string;
  notes?: string;
  createdAt: Date;
}

export interface OrderItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  discount?: number;
}

export interface Order {
  id?: number;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'completed' | 'pending' | 'cancelled' | 'refunded';
  paymentMethods: { method: 'cash' | 'momo' | 'card' | 'credit'; amount: number }[];
  customerId?: number;
  createdAt: Date;
  synced: boolean;
}

export interface Customer {
  id?: number;
  name: string;
  phone: string;
  balance: number;
}

export class KayaDatabase extends Dexie {
  products!: Table<Product>;
  orders!: Table<Order>;
  customers!: Table<Customer>;
  categories!: Table<Category>;
  variants!: Table<ProductVariant>;
  batches!: Table<Batch>;

  constructor() {
    super('KayaPOS');

    this.version(2).stores({
      products: '++id, name, category, barcode',
      orders: '++id, status, createdAt, synced, customerId',
      customers: '++id, name, phone'
    });

    this.version(3).stores({
      products: '++id, name, category, categoryId, barcode, sku, isActive',
      orders: '++id, status, createdAt, synced, customerId',
      customers: '++id, name, phone',
      categories: '++id, name',
      variants: '++id, productId, name, sku, barcode',
      batches: '++id, productId, variantId, batchNumber, expiryDate'
    }).upgrade(trans => {
      return trans.table('products').toCollection().modify(product => {
        if (product.lowStockThreshold === undefined) product.lowStockThreshold = 10;
        if (product.isActive === undefined) product.isActive = true;
        if (!product.createdAt) product.createdAt = new Date();
        if (!product.updatedAt) product.updatedAt = new Date();
      });
    });
  }
}

export const db = new KayaDatabase();

db.on('populate', () => {
  db.categories.bulkAdd([
    { name: 'Food', description: 'Prepared meals and dishes', color: '#f97316', createdAt: new Date() },
    { name: 'Drinks', description: 'Beverages and refreshments', color: '#3b82f6', createdAt: new Date() },
  ]);

  db.products.bulkAdd([
    { name: 'Jollof Rice & Chicken', price: 45, category: 'Food', stock: 50, lowStockThreshold: 10, barcode: '1001', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { name: 'Fried Rice & Fish', price: 40, category: 'Food', stock: 45, lowStockThreshold: 10, barcode: '1002', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { name: 'Banku & Tilapia', price: 65, category: 'Food', stock: 30, lowStockThreshold: 10, barcode: '1003', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { name: 'Waakye Special', price: 35, category: 'Food', stock: 60, lowStockThreshold: 10, barcode: '1004', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { name: 'Sobolo (500ml)', price: 10, category: 'Drinks', stock: 100, lowStockThreshold: 20, barcode: '2001', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { name: 'Coca Cola (300ml)', price: 8, category: 'Drinks', stock: 100, lowStockThreshold: 20, barcode: '2002', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { name: 'Alvaro', price: 10, category: 'Drinks', stock: 80, lowStockThreshold: 20, barcode: '2003', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { name: 'Pure Water', price: 2, category: 'Drinks', stock: 500, lowStockThreshold: 50, barcode: '2004', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  ]);
});
