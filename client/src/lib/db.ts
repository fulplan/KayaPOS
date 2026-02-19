import Dexie, { type Table } from 'dexie';

export interface Product {
  id?: number;
  name: string;
  price: number;
  category: string;
  stock: number;
  barcode?: string;
  image?: string;
}

export interface OrderItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  discount?: number; // per item discount
}

export interface Order {
  id?: number;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number; // total order discount
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
  balance: number; // For credit sales
}

export class KayaDatabase extends Dexie {
  products!: Table<Product>;
  orders!: Table<Order>;
  customers!: Table<Customer>;

  constructor() {
    super('KayaPOS');
    this.version(2).stores({
      products: '++id, name, category, barcode',
      orders: '++id, status, createdAt, synced, customerId',
      customers: '++id, name, phone'
    }).upgrade(trans => {
       // Handle migration if needed
    });
  }
}

export const db = new KayaDatabase();

// Seed data if empty
db.on('populate', () => {
  db.products.bulkAdd([
    { name: 'Jollof Rice & Chicken', price: 45, category: 'Food', stock: 50, barcode: '1001' },
    { name: 'Fried Rice & Fish', price: 40, category: 'Food', stock: 45, barcode: '1002' },
    { name: 'Banku & Tilapia', price: 65, category: 'Food', stock: 30, barcode: '1003' },
    { name: 'Waakye Special', price: 35, category: 'Food', stock: 60, barcode: '1004' },
    { name: 'Sobolo (500ml)', price: 10, category: 'Drinks', stock: 100, barcode: '2001' },
    { name: 'Coca Cola (300ml)', price: 8, category: 'Drinks', stock: 100, barcode: '2002' },
    { name: 'Alvaro', price: 10, category: 'Drinks', stock: 80, barcode: '2003' },
    { name: 'Pure Water', price: 2, category: 'Drinks', stock: 500, barcode: '2004' },
  ]);
});
