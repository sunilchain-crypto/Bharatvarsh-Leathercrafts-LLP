import mysql, { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS } from '../data/initialCatalog';
import { CategoryStructure, Product, Order } from '../types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration based on user credentials
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = Number(process.env.DB_PORT) || 3306;
const DB_NAME = process.env.DB_NAME || 'Name';
const DB_USER = process.env.DB_USER || 'our_username_here';
const DB_PASSWORD = process.env.DB_PASSWORD || 'our_password_here';

// Local storage fallback path for when MySQL is not active
const FALLBACK_DIR = path.resolve(__dirname, '../../data');
const FALLBACK_FILE = path.join(FALLBACK_DIR, 'catalog_storage.json');

export interface DBStatus {
  connected: boolean;
  engine: 'MySQL' | 'Local Disk Fallback';
  host: string;
  port: number;
  database: string;
  user: string;
  error?: string;
  productCount: number;
  categoryCount: number;
}

let pool: Pool | null = null;
let isConnected = false;
let lastError: string | null = null;

// Ensure fallback directory exists
function ensureFallbackStorage() {
  if (!fs.existsSync(FALLBACK_DIR)) {
    fs.mkdirSync(FALLBACK_DIR, { recursive: true });
  }
  if (!fs.existsSync(FALLBACK_FILE)) {
    const initialData = {
      categories: INITIAL_CATEGORIES,
      products: INITIAL_PRODUCTS,
      orders: [] as Order[],
      inquiries: [] as any[]
    };
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  }
}

function readFallbackData() {
  ensureFallbackStorage();
  try {
    const raw = fs.readFileSync(FALLBACK_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[Fallback Storage] Failed reading fallback file:', err);
    return {
      categories: INITIAL_CATEGORIES,
      products: INITIAL_PRODUCTS,
      orders: [],
      inquiries: []
    };
  }
}

function writeFallbackData(data: any) {
  ensureFallbackStorage();
  try {
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Fallback Storage] Failed writing fallback file:', err);
  }
}

// Initialize MySQL Pool and tables
export async function initDatabase(): Promise<boolean> {
  ensureFallbackStorage();

  try {
    pool = mysql.createPool({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 3000,
      dateStrings: true
    });

    // Test ping with timeout
    const testConnection = await Promise.race([
      pool.getConnection(),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Connection timed out after 3000ms')), 3000)
      )
    ]);

    if (!testConnection) {
      throw new Error('Connection failed');
    }

    testConnection.release();
    isConnected = true;
    lastError = null;
    console.log(`[MySQL] Successfully connected to MySQL database '${DB_NAME}' on ${DB_HOST}:${DB_PORT}`);

    // Create tables if they do not exist
    await createTablesIfNotExist();
    return true;
  } catch (err: any) {
    isConnected = false;
    lastError = err.message || 'Unknown database connection error';
    console.warn(`[MySQL Notice] Running in Fallback Data Mode: Could not connect to MySQL at ${DB_HOST}:${DB_PORT} (${lastError}). The application will serve data safely using Hostinger disk storage.`);
    return false;
  }
}

async function createTablesIfNotExist() {
  if (!pool || !isConnected) return;

  const createCategoriesTable = `
    CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      description TEXT,
      product_types JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  const createProductsTable = `
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(50) NOT NULL,
      product_type VARCHAR(100) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      original_price DECIMAL(10,2) NULL,
      short_description TEXT,
      description TEXT,
      leather_type VARCHAR(255),
      hardware VARCHAR(255),
      dimensions VARCHAR(255),
      care_instructions TEXT,
      badge VARCHAR(100),
      in_stock BOOLEAN DEFAULT TRUE,
      is_featured BOOLEAN DEFAULT FALSE,
      monogram_available BOOLEAN DEFAULT TRUE,
      colors JSON,
      images JSON,
      features JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  const createOrdersTable = `
    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(50) PRIMARY KEY,
      order_number VARCHAR(50) NOT NULL,
      customer_name VARCHAR(255) NOT NULL,
      customer_email VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(50),
      shipping_address JSON,
      items JSON,
      subtotal DECIMAL(10,2),
      discount DECIMAL(10,2) DEFAULT 0,
      shipping DECIMAL(10,2) DEFAULT 0,
      tax DECIMAL(10,2) DEFAULT 0,
      total DECIMAL(10,2) NOT NULL,
      payment_method VARCHAR(50),
      payment_status VARCHAR(50),
      payment_id VARCHAR(100),
      status VARCHAR(50) DEFAULT 'Processing',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  const createInquiriesTable = `
    CREATE TABLE IF NOT EXISTS inquiries (
      id VARCHAR(50) PRIMARY KEY,
      type VARCHAR(50) NOT NULL,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      subject VARCHAR(255),
      message TEXT,
      details JSON,
      status VARCHAR(50) DEFAULT 'New',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await pool.query(createCategoriesTable);
    await pool.query(createProductsTable);
    await pool.query(createOrdersTable);
    await pool.query(createInquiriesTable);

    // Seed categories and products if empty
    const [catRows]: any = await pool.query('SELECT COUNT(*) as cnt FROM categories');
    if (catRows[0].cnt === 0) {
      for (const cat of INITIAL_CATEGORIES) {
        await pool.query(
          'INSERT INTO categories (id, name, description, product_types) VALUES (?, ?, ?, ?)',
          [cat.id, cat.name, cat.description, JSON.stringify(cat.productTypes)]
        );
      }
    }

    const [prodRows]: any = await pool.query('SELECT COUNT(*) as cnt FROM products');
    if (prodRows[0].cnt === 0) {
      for (const p of INITIAL_PRODUCTS) {
        await pool.query(
          `INSERT INTO products 
           (id, name, category, product_type, price, original_price, short_description, description, 
            leather_type, hardware, dimensions, care_instructions, badge, in_stock, is_featured, 
            monogram_available, colors, images, features) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            p.id,
            p.name,
            p.category,
            p.productType,
            p.price,
            p.originalPrice || null,
            p.shortDescription || '',
            p.description || '',
            p.leatherType || '',
            p.hardware || '',
            p.dimensions || '',
            p.careInstructions || '',
            p.badge || '',
            p.inStock ? 1 : 0,
            p.isFeatured ? 1 : 0,
            p.monogramAvailable ? 1 : 0,
            JSON.stringify(p.colors || []),
            JSON.stringify(p.images || []),
            JSON.stringify(p.features || [])
          ]
        );
      }
    }
  } catch (e) {
    console.error('[MySQL Error] Error creating or seeding tables:', e);
  }
}

// Database Operations
export const dbService = {
  async getStatus(): Promise<DBStatus> {
    const products = await this.getProducts();
    const categories = await this.getCategories();
    return {
      connected: isConnected,
      engine: isConnected ? 'MySQL' : 'Local Disk Fallback',
      host: DB_HOST,
      port: DB_PORT,
      database: DB_NAME,
      user: DB_USER,
      error: lastError || undefined,
      productCount: products.length,
      categoryCount: categories.length
    };
  },

  async getCategories(): Promise<CategoryStructure[]> {
    if (isConnected && pool) {
      try {
        const [rows]: any = await pool.query('SELECT * FROM categories ORDER BY id ASC');
        return rows.map((r: any) => ({
          id: r.id,
          name: r.name,
          description: r.description || '',
          productTypes: typeof r.product_types === 'string' ? JSON.parse(r.product_types) : (r.product_types || [])
        }));
      } catch (err) {
        console.error('[MySQL] getCategories failed, falling back to disk:', err);
      }
    }
    const data = readFallbackData();
    return data.categories || INITIAL_CATEGORIES;
  },

  async saveCategories(categories: CategoryStructure[]): Promise<boolean> {
    if (isConnected && pool) {
      try {
        for (const cat of categories) {
          await pool.query(
            `INSERT INTO categories (id, name, description, product_types)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             name = VALUES(name), description = VALUES(description), product_types = VALUES(product_types)`,
            [cat.id, cat.name, cat.description, JSON.stringify(cat.productTypes)]
          );
        }
      } catch (err) {
        console.error('[MySQL] saveCategories failed:', err);
      }
    }
    const data = readFallbackData();
    data.categories = categories;
    writeFallbackData(data);
    return true;
  },

  async getProducts(): Promise<Product[]> {
    if (isConnected && pool) {
      try {
        const [rows]: any = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
        return rows.map((r: any) => ({
          id: r.id,
          name: r.name,
          category: r.category,
          productType: r.product_type,
          price: Number(r.price),
          originalPrice: r.original_price ? Number(r.original_price) : undefined,
          shortDescription: r.short_description || '',
          description: r.description || '',
          leatherType: r.leather_type || '',
          hardware: r.hardware || '',
          dimensions: r.dimensions || '',
          careInstructions: r.care_instructions || '',
          badge: r.badge || '',
          inStock: Boolean(r.in_stock),
          isFeatured: Boolean(r.is_featured),
          monogramAvailable: Boolean(r.monogram_available),
          colors: typeof r.colors === 'string' ? JSON.parse(r.colors) : (r.colors || []),
          images: typeof r.images === 'string' ? JSON.parse(r.images) : (r.images || []),
          features: typeof r.features === 'string' ? JSON.parse(r.features) : (r.features || [])
        }));
      } catch (err) {
        console.error('[MySQL] getProducts failed, falling back to disk:', err);
      }
    }
    const data = readFallbackData();
    return data.products || INITIAL_PRODUCTS;
  },

  async saveProduct(p: Product): Promise<Product> {
    if (isConnected && pool) {
      try {
        await pool.query(
          `INSERT INTO products 
           (id, name, category, product_type, price, original_price, short_description, description, 
            leather_type, hardware, dimensions, care_instructions, badge, in_stock, is_featured, 
            monogram_available, colors, images, features) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            category = VALUES(category),
            product_type = VALUES(product_type),
            price = VALUES(price),
            original_price = VALUES(original_price),
            short_description = VALUES(short_description),
            description = VALUES(description),
            leather_type = VALUES(leather_type),
            hardware = VALUES(hardware),
            dimensions = VALUES(dimensions),
            care_instructions = VALUES(care_instructions),
            badge = VALUES(badge),
            in_stock = VALUES(in_stock),
            is_featured = VALUES(is_featured),
            monogram_available = VALUES(monogram_available),
            colors = VALUES(colors),
            images = VALUES(images),
            features = VALUES(features)`,
          [
            p.id,
            p.name,
            p.category,
            p.productType,
            p.price,
            p.originalPrice || null,
            p.shortDescription || '',
            p.description || '',
            p.leatherType || '',
            p.hardware || '',
            p.dimensions || '',
            p.careInstructions || '',
            p.badge || '',
            p.inStock ? 1 : 0,
            p.isFeatured ? 1 : 0,
            p.monogramAvailable ? 1 : 0,
            JSON.stringify(p.colors || []),
            JSON.stringify(p.images || []),
            JSON.stringify(p.features || [])
          ]
        );
      } catch (err) {
        console.error('[MySQL] saveProduct failed:', err);
      }
    }
    const data = readFallbackData();
    const idx = data.products.findIndex((prod: Product) => prod.id === p.id);
    if (idx >= 0) {
      data.products[idx] = p;
    } else {
      data.products.unshift(p);
    }
    writeFallbackData(data);
    return p;
  },

  async deleteProduct(id: string): Promise<boolean> {
    if (isConnected && pool) {
      try {
        await pool.query('DELETE FROM products WHERE id = ?', [id]);
      } catch (err) {
        console.error('[MySQL] deleteProduct failed:', err);
      }
    }
    const data = readFallbackData();
    data.products = data.products.filter((p: Product) => p.id !== id);
    writeFallbackData(data);
    return true;
  },

  async saveOrder(order: Order): Promise<Order> {
    if (isConnected && pool) {
      try {
        await pool.query(
          `INSERT INTO orders 
           (id, order_number, customer_name, customer_email, customer_phone, shipping_address, 
            items, subtotal, discount, shipping, tax, total, payment_method, payment_status, 
            payment_id, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            order.id,
            order.orderNumber,
            order.customer.name,
            order.customer.email,
            order.customer.phone || '',
            JSON.stringify(order.customer),
            JSON.stringify(order.items),
            order.subtotal,
            order.discount || 0,
            order.shipping || 0,
            order.tax || 0,
            order.total,
            order.paymentMethod,
            order.paymentStatus,
            order.paymentId || '',
            order.status
          ]
        );
      } catch (err) {
        console.error('[MySQL] saveOrder failed:', err);
      }
    }
    const data = readFallbackData();
    if (!data.orders) data.orders = [];
    data.orders.unshift(order);
    writeFallbackData(data);
    return order;
  },

  async getOrders(): Promise<Order[]> {
    if (isConnected && pool) {
      try {
        const [rows]: any = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
        return rows.map((r: any) => ({
          id: r.id,
          orderNumber: r.order_number,
          customer: typeof r.shipping_address === 'string' ? JSON.parse(r.shipping_address) : r.shipping_address,
          items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items,
          subtotal: Number(r.subtotal),
          discount: Number(r.discount || 0),
          shipping: Number(r.shipping || 0),
          tax: Number(r.tax || 0),
          total: Number(r.total),
          paymentMethod: r.payment_method,
          paymentStatus: r.payment_status,
          paymentId: r.payment_id,
          status: r.status,
          createdAt: r.created_at
        }));
      } catch (err) {
        console.error('[MySQL] getOrders failed:', err);
      }
    }
    const data = readFallbackData();
    return data.orders || [];
  },

  async saveInquiry(inquiry: any): Promise<any> {
    const record = {
      id: inquiry.id || `inq-${Date.now().toString(36)}`,
      type: inquiry.type || 'General Support',
      name: inquiry.name,
      email: inquiry.email,
      phone: inquiry.phone || '',
      subject: inquiry.subject || 'Customer Inquiry',
      message: inquiry.message || '',
      details: inquiry.details || {},
      status: 'New',
      createdAt: new Date().toISOString()
    };

    if (isConnected && pool) {
      try {
        await pool.query(
          `INSERT INTO inquiries (id, type, name, email, phone, subject, message, details, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            record.id,
            record.type,
            record.name,
            record.email,
            record.phone,
            record.subject,
            record.message,
            JSON.stringify(record.details),
            record.status
          ]
        );
      } catch (err) {
        console.error('[MySQL] saveInquiry failed:', err);
      }
    }
    const data = readFallbackData();
    if (!data.inquiries) data.inquiries = [];
    data.inquiries.unshift(record);
    writeFallbackData(data);
    return record;
  }
};
