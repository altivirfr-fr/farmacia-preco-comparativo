import express from 'express';
import cors from 'cors';
import multer from 'multer';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = 3001;
const DATA_DIR = path.join(__dirname, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const SUPPLIERS_FILE = path.join(DATA_DIR, 'suppliers.json');
const upload = multer({ storage: multer.memoryStorage() });

const fallbackSuppliers = [
  { id: 'sup-alpha', name: 'Distribuidora Alpha', contact: '(11) 3000-1001', notes: 'Entrega em 24h' },
  { id: 'sup-central', name: 'Farmácia Central', contact: '(11) 3000-1002', notes: 'Melhor custo por volume' },
  { id: 'sup-saude', name: 'Rede Saúde Distrib.', contact: '(11) 3000-1003', notes: 'Atendimento regional' },
];

const fallbackProducts = [
  { id: 'prod-1', name: 'Dipirona Sódica', brand: 'EMS', category: 'Analgesico', dose: '500mg', presentation: 'comprimido', supplier: 'Distribuidora Alpha', supplierId: 'sup-alpha', price: 18.9, quantity: 60, code: 'DS-500-EMS' },
  { id: 'prod-2', name: 'Dipirona Sódica', brand: 'EMS', category: 'Analgesico', dose: '500mg', presentation: 'comprimido', supplier: 'Farmácia Central', supplierId: 'sup-central', price: 16.4, quantity: 60, code: 'DS-500-FC' },
  { id: 'prod-3', name: 'Dipirona Sódica', brand: 'EMS', category: 'Analgesico', dose: '500mg', presentation: 'comprimido', supplier: 'Rede Saúde Distrib.', supplierId: 'sup-saude', price: 17.15, quantity: 60, code: 'DS-500-RS' },
  { id: 'prod-4', name: 'Paracetamol', brand: 'Genérico', category: 'Analgesico', dose: '750mg', presentation: 'comprimido', supplier: 'Distribuidora Alpha', supplierId: 'sup-alpha', price: 11.5, quantity: 80, code: 'PAR-750-GEN' },
  { id: 'prod-5', name: 'Paracetamol', brand: 'Genérico', category: 'Analgesico', dose: '750mg', presentation: 'comprimido', supplier: 'Farmácia Central', supplierId: 'sup-central', price: 10.2, quantity: 80, code: 'PAR-750-FC' },
  { id: 'prod-6', name: 'Paracetamol', brand: 'Genérico', category: 'Analgesico', dose: '750mg', presentation: 'comprimido', supplier: 'Rede Saúde Distrib.', supplierId: 'sup-saude', price: 12.4, quantity: 80, code: 'PAR-750-RS' },
  { id: 'prod-7', name: 'Amoxicilina', brand: 'Eurofarma', category: 'Antibiotico', dose: '500mg', presentation: 'capsula', supplier: 'Distribuidora Alpha', supplierId: 'sup-alpha', price: 28.7, quantity: 40, code: 'AMX-500-EUR' },
  { id: 'prod-8', name: 'Amoxicilina', brand: 'Eurofarma', category: 'Antibiotico', dose: '500mg', presentation: 'capsula', supplier: 'Farmácia Central', supplierId: 'sup-central', price: 25.9, quantity: 40, code: 'AMX-500-FC' },
  { id: 'prod-9', name: 'Amoxicilina', brand: 'Eurofarma', category: 'Antibiotico', dose: '500mg', presentation: 'capsula', supplier: 'Rede Saúde Distrib.', supplierId: 'sup-saude', price: 26.4, quantity: 40, code: 'AMX-500-RS' },
  { id: 'prod-10', name: 'Omeprazol', brand: 'Teuto', category: 'Antiácido', dose: '20mg', presentation: 'capsula', supplier: 'Distribuidora Alpha', supplierId: 'sup-alpha', price: 21.8, quantity: 50, code: 'OME-20-TEU' },
  { id: 'prod-11', name: 'Omeprazol', brand: 'Teuto', category: 'Antiácido', dose: '20mg', presentation: 'capsula', supplier: 'Farmácia Central', supplierId: 'sup-central', price: 19.6, quantity: 50, code: 'OME-20-FC' },
  { id: 'prod-12', name: 'Omeprazol', brand: 'Teuto', category: 'Antiácido', dose: '20mg', presentation: 'capsula', supplier: 'Rede Saúde Distrib.', supplierId: 'sup-saude', price: 20.5, quantity: 50, code: 'OME-20-RS' },
  { id: 'prod-13', name: 'Ibuprofeno', brand: 'Bayer', category: 'Analgesico', dose: '600mg', presentation: 'comprimido', supplier: 'Distribuidora Alpha', supplierId: 'sup-alpha', price: 14.3, quantity: 70, code: 'IBU-600-BAY' },
  { id: 'prod-14', name: 'Ibuprofeno', brand: 'Bayer', category: 'Analgesico', dose: '600mg', presentation: 'comprimido', supplier: 'Farmácia Central', supplierId: 'sup-central', price: 13.9, quantity: 70, code: 'IBU-600-FC' },
  { id: 'prod-15', name: 'Ibuprofeno', brand: 'Bayer', category: 'Analgesico', dose: '600mg', presentation: 'comprimido', supplier: 'Rede Saúde Distrib.', supplierId: 'sup-saude', price: 15.8, quantity: 70, code: 'IBU-600-RS' },
  { id: 'prod-16', name: 'Vitamina C', brand: 'Natura', category: 'Suplemento', dose: '500mg', presentation: 'comprimido', supplier: 'Distribuidora Alpha', supplierId: 'sup-alpha', price: 9.8, quantity: 90, code: 'VITC-500-NAT' },
  { id: 'prod-17', name: 'Vitamina C', brand: 'Natura', category: 'Suplemento', dose: '500mg', presentation: 'comprimido', supplier: 'Farmácia Central', supplierId: 'sup-central', price: 8.6, quantity: 90, code: 'VITC-500-FC' },
  { id: 'prod-18', name: 'Vitamina C', brand: 'Natura', category: 'Suplemento', dose: '500mg', presentation: 'comprimido', supplier: 'Rede Saúde Distrib.', supplierId: 'sup-saude', price: 9.3, quantity: 90, code: 'VITC-500-RS' },
];

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function ensureFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(SUPPLIERS_FILE)) {
    fs.writeFileSync(SUPPLIERS_FILE, JSON.stringify(fallbackSuppliers, null, 2));
  }

  if (!fs.existsSync(PRODUCTS_FILE)) {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(fallbackProducts, null, 2));
  }
}

function readSuppliers() {
  ensureFiles();
  return JSON.parse(fs.readFileSync(SUPPLIERS_FILE, 'utf8'));
}

function writeSuppliers(suppliers) {
  ensureFiles();
  fs.writeFileSync(SUPPLIERS_FILE, JSON.stringify(suppliers, null, 2));
}

function readProducts() {
  ensureFiles();
  return JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
}

function writeProducts(products) {
  ensureFiles();
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

function ensureSupplierByName(suppliers, supplierName) {
  const trimmed = (supplierName || '').trim();
  if (!trimmed) return null;

  let supplier = suppliers.find((entry) => entry.name.toLowerCase() === trimmed.toLowerCase());
  if (!supplier) {
    supplier = { id: randomUUID(), name: trimmed, contact: '', notes: 'Gerado automaticamente' };
    suppliers.push(supplier);
  }

  return supplier;
}

function groupByProduct(items) {
  const groups = new Map();

  items.forEach((item) => {
    const key = normalizeText(`${item.name || item.product || ''} ${item.brand || ''} ${item.dose || ''} ${item.presentation || ''}`);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });

  return Array.from(groups.values()).map((group) => {
    const cheapest = group.reduce((best, current) => (current.price < best.price ? current : best), group[0]);
    const highest = group.reduce((max, current) => (current.price > max.price ? current : max), group[0]);

    return {
      product: group[0].name || group[0].product,
      brand: group[0].brand,
      dose: group[0].dose,
      presentation: group[0].presentation,
      supplier: cheapest.supplier,
      price: Number(cheapest.price),
      quantity: Number(group[0].quantity || 1),
      subtotal: Number(cheapest.price) * Number(group[0].quantity || 1),
      cheapest,
      highest,
      difference: Number(highest.price) - Number(cheapest.price),
    };
  });
}

function supplierTotals(items) {
  const totals = new Map();

  items.forEach((item) => {
    const supplier = item.supplier || 'Fornecedor sem nome';
    const value = Number(item.price) * Number(item.quantity || 1);
    totals.set(supplier, (totals.get(supplier) || 0) + value);
  });

  return Array.from(totals.entries())
    .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
    .sort((a, b) => a.value - b.value);
}

function parseFileRows(rows) {
  const headerMap = (header) => {
    const normalized = normalizeText(header);

    if (['produto', 'product', 'nome', 'item', 'descricao', 'medicamento'].includes(normalized)) return 'name';
    if (['marca', 'brand', 'fabricante', 'laboratorio'].includes(normalized)) return 'brand';
    if (['categoria', 'category', 'tipo'].includes(normalized)) return 'category';
    if (['dose', 'dosagem', 'concentracao', 'mg'].includes(normalized)) return 'dose';
    if (['apresentacao', 'apresentação', 'forma', 'unidade', 'embalagem'].includes(normalized)) return 'presentation';
    if (['fornecedor', 'supplier', 'distribuidora', 'empresa'].includes(normalized)) return 'supplier';
    if (['preco', 'price', 'valor', 'preco_unitario', 'valor_unitario', 'unitario'].includes(normalized)) return 'price';
    if (['quantidade', 'qty', 'qtd'].includes(normalized)) return 'quantity';
    if (['codigo', 'code', 'cod', 'codigo_interno'].includes(normalized)) return 'code';
    return null;
  };

  return rows
    .map((row) => {
      const normalizedRow = {};
      Object.entries(row).forEach(([key, value]) => {
        const mappedKey = headerMap(key);
        if (mappedKey) normalizedRow[mappedKey] = value;
      });

      if (!normalizedRow.name || !normalizedRow.supplier || normalizedRow.price === undefined || normalizedRow.price === null || normalizedRow.price === '') {
        return null;
      }

      return {
        id: randomUUID(),
        name: String(normalizedRow.name),
        brand: String(normalizedRow.brand || 'Genérico'),
        category: String(normalizedRow.category || 'Geral'),
        dose: String(normalizedRow.dose || 'N/A'),
        presentation: String(normalizedRow.presentation || 'unidade'),
        supplier: String(normalizedRow.supplier),
        price: Number(String(normalizedRow.price).replace(',', '.').replace(/[^\d.]/g, '')) || 0,
        quantity: Number(normalizedRow.quantity || 1),
        code: String(normalizedRow.code || `IMP-${Date.now()}`),
      };
    })
    .filter(Boolean);
}

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'API funcionando.' });
});

app.get('/api/suppliers', (_req, res) => {
  res.json(readSuppliers());
});

app.post('/api/suppliers', (req, res) => {
  const { name, contact = '', notes = '' } = req.body || {};

  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Nome do fornecedor obrigatório.' });
  }

  const suppliers = readSuppliers();
  const existing = suppliers.find((item) => item.name.toLowerCase() === String(name).trim().toLowerCase());

  if (existing) {
    return res.json(existing);
  }

  const supplier = {
    id: randomUUID(),
    name: String(name).trim(),
    contact: String(contact).trim(),
    notes: String(notes).trim(),
  };

  suppliers.push(supplier);
  writeSuppliers(suppliers);
  return res.status(201).json(supplier);
});

app.get('/api/products', (_req, res) => {
  res.json(readProducts());
});

app.post('/api/products', (req, res) => {
  const payload = req.body || {};
  const suppliers = readSuppliers();
  const supplier = ensureSupplierByName(suppliers, payload.supplier || payload.supplierName || 'Fornecedor sem nome');

  if (!payload.name || !String(payload.name).trim()) {
    return res.status(400).json({ error: 'Nome do produto obrigatório.' });
  }

  const product = {
    id: payload.id || randomUUID(),
    name: String(payload.name).trim(),
    brand: String(payload.brand || 'Genérico').trim(),
    category: String(payload.category || 'Geral').trim(),
    dose: String(payload.dose || 'N/A').trim(),
    presentation: String(payload.presentation || 'unidade').trim(),
    supplier: supplier ? supplier.name : 'Fornecedor sem nome',
    supplierId: supplier ? supplier.id : payload.supplierId || randomUUID(),
    price: Number(payload.price || 0),
    quantity: Number(payload.quantity || 1),
    code: String(payload.code || `PROD-${Date.now()}`),
  };

  if (supplier) writeSuppliers(suppliers);

  const products = readProducts();
  products.push(product);
  writeProducts(products);
  return res.status(201).json(product);
});

app.post('/api/products/reset', (_req, res) => {
  writeSuppliers(fallbackSuppliers);
  writeProducts(fallbackProducts);
  res.json({ ok: true, count: fallbackProducts.length });
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Arquivo obrigatório.' });
  }

  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    const imported = parseFileRows(rows);

    if (!imported.length) {
      return res.status(400).json({ error: 'Nenhum dado válido foi encontrado no arquivo.' });
    }

    const suppliers = readSuppliers();
    const normalizedProducts = imported.map((item) => {
      const supplier = ensureSupplierByName(suppliers, item.supplier);
      return {
        ...item,
        id: item.id || randomUUID(),
        supplier: supplier ? supplier.name : item.supplier,
        supplierId: supplier ? supplier.id : randomUUID(),
        category: item.category || 'Geral',
      };
    });

    writeSuppliers(suppliers);
    writeProducts(normalizedProducts);
    return res.json({ ok: true, imported: normalizedProducts.length });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao processar a planilha. Verifique o arquivo.' });
  }
});

app.get('/api/report', (_req, res) => {
  const products = readProducts();
  const grouped = groupByProduct(products);
  const totals = supplierTotals(products);
  const lowestSupplier = totals[0];
  const highestSupplier = [...totals].sort((a, b) => b.value - a.value)[0];
  const lowestTotalCost = lowestSupplier ? lowestSupplier.value : 0;
  const savings = highestSupplier && lowestSupplier ? Number((highestSupplier.value - lowestSupplier.value).toFixed(2)) : 0;

  const bestOffers = grouped.map((item) => ({
    product: item.product,
    brand: item.brand,
    presentation: `${item.dose} / ${item.presentation}`,
    supplier: item.supplier,
    price: Number(item.price),
    quantity: Number(item.quantity || 1),
    subtotal: Number((item.quantity || 1) * item.price).toFixed(2),
  }));

  const ranking = grouped
    .map((item) => ({
      product: item.product,
      brand: item.brand,
      supplier: item.supplier,
      price: Number(item.price),
    }))
    .sort((a, b) => a.price - b.price)
    .slice(0, 6);

  const priceByProduct = grouped
    .map((item) => ({
      product: `${item.product} - ${item.brand}`,
      price: Number(item.price),
    }))
    .slice(0, 6);

  const topProduct = grouped.reduce((best, current) => {
    if (!best) return current;
    return current.price < best.price ? current : best;
  }, null);

  res.json({
    productsCount: grouped.length,
    cheapestSupplier: lowestSupplier ? { name: lowestSupplier.name, value: lowestSupplier.value } : null,
    totalCost: Number(lowestTotalCost.toFixed(2)),
    lowestTotalCost: Number(lowestTotalCost.toFixed(2)),
    highestTotalCost: highestSupplier ? Number(highestSupplier.value.toFixed(2)) : 0,
    savings: Number(savings.toFixed(2)),
    bestOffers,
    ranking,
    supplierTotals: totals,
    priceByProduct,
    topProduct: topProduct ? { product: topProduct.product, brand: topProduct.brand, price: Number(topProduct.price) } : null,
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
