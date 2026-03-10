import { db } from './db';

const API_BASE = '/api/sync';
const BATCH_SIZE = 50;

let failCount = 0;

function getBackoffDelay(): number {
  if (failCount === 0) return 60000;
  const delays = [5000, 15000, 30000, 60000];
  return delays[Math.min(failCount - 1, delays.length - 1)];
}

async function syncInBatches<T>(items: T[], endpoint: string): Promise<any> {
  const allResults: any[] = [];
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const res = await fetch(`${API_BASE}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batch),
    });
    if (!res.ok) throw new Error(`Sync failed: ${res.statusText}`);
    const result = await res.json();
    if (result.results) allResults.push(...result.results);
  }
  return { synced: allResults.length, results: allResults };
}

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
      dosageForm: p.dosageForm,
      strength: p.strength,
      requiresPrescription: p.requiresPrescription,
      manufacturer: p.manufacturer,
      serviceTime: p.serviceTime,
      servingSize: p.servingSize,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return await syncInBatches(payload, 'products');
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

    const result = await syncInBatches(payload, 'orders');

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

    return await syncInBatches(payload, 'customers');
  } catch (error) {
    console.error('Customer sync failed:', error);
    throw error;
  }
}

export async function syncBusinessSettings() {
  try {
    const settings = await db.businessSettings.toCollection().first();
    if (!settings || !settings.businessName) return { synced: 0 };

    const res = await fetch(`${API_BASE}/business-settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: settings.businessName,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        logo: settings.logo,
        businessType: settings.businessType,
      }),
    });

    if (!res.ok) throw new Error(`Sync failed: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error('Business settings sync failed:', error);
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
  try { await syncBusinessSettings(); } catch {}

  if (results.errors.length > 0) {
    failCount++;
  } else {
    failCount = 0;
  }

  return results;
}

let syncInterval: ReturnType<typeof setTimeout> | null = null;

export function startAutoSync(intervalMs = 60000) {
  if (syncInterval) return;

  const doSync = async () => {
    if (!navigator.onLine) {
      scheduleNext(intervalMs);
      return;
    }
    try {
      await syncAll();
    } catch {}
    scheduleNext(failCount > 0 ? getBackoffDelay() : intervalMs);
  };

  function scheduleNext(delay: number) {
    syncInterval = setTimeout(doSync, delay);
  }

  setTimeout(doSync, 5000);

  window.addEventListener('online', () => {
    failCount = 0;
    doSync();
  });
}

export function stopAutoSync() {
  if (syncInterval) {
    clearTimeout(syncInterval);
    syncInterval = null;
  }
}
