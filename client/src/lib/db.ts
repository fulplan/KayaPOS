import Dexie, { type Table } from 'dexie';

export interface Product {
  id?: number;
  name: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
}

export interface OrderItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id?: number;
  items: OrderItem[];
  total: number;
  status: 'completed' | 'pending' | 'cancelled';
  paymentMethod: 'cash' | 'momo' | 'card';
  createdAt: Date;
  synced: boolean;
}

export class KayaDatabase extends Dexie {
  products!: Table<Product>;
  orders!: Table<Order>;

  constructor() {
    super('KayaPOS');
    this.version(1).stores({
      products: '++id, name, category',
      orders: '++id, status, createdAt, synced'
    });
  }
}

export const db = new KayaDatabase();

// Seed data if empty
db.on('populate', () => {
  db.products.bulkAdd([
    { name: 'Jollof Rice & Chicken', price: 45, category: 'Food', stock: 50 },
    { name: 'Fried Rice & Fish', price: 40, category: 'Food', stock: 45 },
    { name: 'Banku & Tilapia', price: 65, category: 'Food', stock: 30 },
    { name: 'Waakye Special', price: 35, category: 'Food', stock: 60 },
    { name: 'Sobolo (500ml)', price: 10, category: 'Drinks', stock: 100 },
    { name: 'Coca Cola (300ml)', price: 8, category: 'Drinks', stock: 100 },
    { name: 'Alvaro', price: 10, category: 'Drinks', stock: 80 },
    { name: 'Pure Water', price: 2, category: 'Drinks', stock: 500 },
  ]);
});
