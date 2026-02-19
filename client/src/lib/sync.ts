import { db } from './db';

const API_BASE = '/api/sync';

export async function syncProducts() {
  try {
    const products = await db.products.toArray();
    if (products.length === 0) return { synced: 0 };

    const payload = products.map(p => ({
      clientId: p.id!,
      name: p.name,
      price: p.price,
      category: p.category,
      stock: p.stock,
      lowStockThreshold: p.lowStockThreshold,
      barcode: p.barcode,
      sku: p.sku,
      image: p.image,
      description: p.description,
      isActive: p.isActive,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`Sync failed: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error('Product sync failed:', error);
    throw error;
  }
}

export async function syncOrders() {
  try {
    const orders = await db.orders
      .where('synced').equals(0)
      .and(o => o.status !== 'draft')
      .toArray();

    if (orders.length === 0) return { synced: 0 };

    const payload = orders.map(o => ({
      clientId: o.id!,
      items: o.items,
      subtotal: o.subtotal,
      tax: o.tax,
      taxRuleName: o.taxRuleName,
      taxRate: o.taxRate,
      discount: o.discount,
      discountType: o.discountType,
      total: o.total,
      status: o.status,
      paymentMethods: o.paymentMethods,
      customerId: o.customerId,
      notes: o.notes,
      createdAt: o.createdAt,
    }));

    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`Sync failed: ${res.statusText}`);
    const result = await res.json();

    for (const r of result.results) {
      if (r.action === 'created' || r.action === 'exists') {
        await db.orders.update(r.clientId, { synced: true });
      }
    }

    return result;
  } catch (error) {
    console.error('Order sync failed:', error);
    throw error;
  }
}

export async function syncCustomers() {
  try {
    const customers = await db.customers.toArray();
    if (customers.length === 0) return { synced: 0 };

    const payload = customers.map(c => ({
      clientId: c.id!,
      name: c.name,
      phone: c.phone,
      balance: c.balance,
    }));

    const res = await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`Sync failed: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error('Customer sync failed:', error);
    throw error;
  }
}

export async function syncAll() {
  const results = {
    products: null as any,
    orders: null as any,
    customers: null as any,
    errors: [] as string[],
  };

  try { results.products = await syncProducts(); } catch (e: any) { results.errors.push(`Products: ${e.message}`); }
  try { results.orders = await syncOrders(); } catch (e: any) { results.errors.push(`Orders: ${e.message}`); }
  try { results.customers = await syncCustomers(); } catch (e: any) { results.errors.push(`Customers: ${e.message}`); }

  return results;
}

let syncInterval: ReturnType<typeof setInterval> | null = null;

export function startAutoSync(intervalMs = 60000) {
  if (syncInterval) return;

  const doSync = async () => {
    if (!navigator.onLine) return;
    try {
      await syncAll();
    } catch {
    }
  };

  setTimeout(doSync, 5000);

  syncInterval = setInterval(doSync, intervalMs);

  window.addEventListener('online', doSync);
}

export function stopAutoSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}
