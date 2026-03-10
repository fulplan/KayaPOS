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
  dosageForm?: string;
  strength?: string;
  requiresPrescription?: boolean;
  manufacturer?: string;
  serviceTime?: number;
  servingSize?: string;
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

export interface TaxRule {
  id?: number;
  name: string;
  rate: number;
  isDefault: boolean;
  isActive: boolean;
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
  taxRuleName?: string;
  taxRate?: number;
  discount: number;
  discountType?: 'flat' | 'percentage';
  total: number;
  status: 'completed' | 'pending' | 'cancelled' | 'refunded' | 'draft';
  paymentMethods: { method: 'cash' | 'momo' | 'card' | 'credit'; amount: number }[];
  customerId?: number;
  createdAt: Date;
  synced: boolean;
  notes?: string;
}

export interface Quote {
  id?: number;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  taxRuleName?: string;
  taxRate?: number;
  discount: number;
  discountType?: 'flat' | 'percentage';
  total: number;
  customerId?: number;
  customerName?: string;
  notes?: string;
  validUntil?: Date;
  status: 'active' | 'converted' | 'expired';
  createdAt: Date;
}

export interface Customer {
  id?: number;
  name: string;
  phone: string;
  balance: number;
}

export interface BusinessSettings {
  id?: number;
  businessName: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  businessType: 'pharmacy' | 'salon' | 'restaurant' | 'retail' | 'wholesale' | 'other';
  updatedAt: Date;
}

export class KayaDatabase extends Dexie {
  products!: Table<Product>;
  orders!: Table<Order>;
  customers!: Table<Customer>;
  categories!: Table<Category>;
  variants!: Table<ProductVariant>;
  batches!: Table<Batch>;
  taxRules!: Table<TaxRule>;
  quotes!: Table<Quote>;
  businessSettings!: Table<BusinessSettings>;

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

    this.version(4).stores({
      products: '++id, name, category, categoryId, barcode, sku, isActive',
      orders: '++id, status, createdAt, synced, customerId',
      customers: '++id, name, phone',
      categories: '++id, name',
      variants: '++id, productId, name, sku, barcode',
      batches: '++id, productId, variantId, batchNumber, expiryDate',
      taxRules: '++id, name, isDefault, isActive',
      quotes: '++id, status, createdAt, customerId'
    });

    this.version(5).stores({
      products: '++id, name, category, categoryId, barcode, sku, isActive',
      orders: '++id, status, createdAt, synced, customerId',
      customers: '++id, name, phone',
      categories: '++id, name',
      variants: '++id, productId, name, sku, barcode',
      batches: '++id, productId, variantId, batchNumber, expiryDate',
      taxRules: '++id, name, isDefault, isActive',
      quotes: '++id, status, createdAt, customerId',
      businessSettings: '++id'
    }).upgrade(async trans => {
      const categories = trans.table('categories');
      await categories.where('name').anyOf(['Food', 'Drinks', 'food', 'drinks']).delete();
    });
  }
}

export const db = new KayaDatabase();

db.on('populate', () => {
  db.categories.bulkAdd([
    { name: 'General', description: 'General products', color: '#6b7280', createdAt: new Date() },
  ]);

  db.taxRules.bulkAdd([
    { name: 'VAT (15%)', rate: 0.15, isDefault: true, isActive: true, createdAt: new Date() },
    { name: 'No Tax', rate: 0, isDefault: false, isActive: true, createdAt: new Date() },
  ]);

  db.businessSettings.add({
    businessName: '',
    businessType: 'retail',
    updatedAt: new Date(),
  });
});

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await db.products.count();
    return true;
  } catch {
    return false;
  }
}
