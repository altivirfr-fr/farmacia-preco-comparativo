import express from 'express';
import cors from 'cors';
import multer from 'multer';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'data', 'products.json');
const upload = multer({ storage: multer.memoryStorage() });

const fallbackProducts = [
  { product: 'Dipirona Sódica', brand: 'EMS', dose: '500mg', presentation: 'comprimido', supplier: 'Distribuidora Alpha', price: 18.9, quantity: 60 },
  { product: 'Dipirona Sódica', brand: 'EMS', dose: '500mg', presentation: 'comprimido', supplier: 'Farmácia Central', price: 16.4, quantity: 60 },
  { product: 'Dipirona Sódica', brand: 'EMS', dose: '500mg', presentation: 'comprimido', supplier: 'Rede Saúde Distrib.', price: 17.15, quantity: 60 },
  { product: 'Paracetamol', brand: 'Genérico', dose: '750mg', presentation: 'comprimido', supplier: 'Distribuidora Alpha', price: 11.5, quantity: 80 },
  { product: 'Paracetamol', brand: 'Genérico', dose: '750mg', presentation: 'comprimido', supplier: 'Farmácia Central', price: 10.2, quantity: 80 },
  { product: 'Paracetamol', brand: 'Genérico', dose: '750mg', presentation: 'comprimido', supplier: 'Rede Saúde Distrib.', price: 12.4, quantity: 80 },
  { product: 'Amoxicilina', brand: 'Eurofarma', dose: '500mg', presentation: 'capsula', supplier: 'Distribuidora Alpha', price: 28.7, quantity: 40 },
  { product: 'Amoxicilina', brand: 'Eurofarma', dose: '500mg', presentation: 'capsula', supplier: 'Farmácia Central', price: 25.9, quantity: 40 },
  { product: 'Amoxicilina', brand: 'Eurofarma', dose: '500mg', presentation: 'capsula', supplier: 'Rede Saúde Distrib.', price: 26.4, quantity: 40 },
  { product: 'Omeprazol', brand: 'Teuto', dose: '20mg', presentation: 'capsula', supplier: 'Distribuidora Alpha', price: 21.8, quantity: 50 },
  { product: 'Omeprazol', brand: 'Teuto', dose: '20mg', presentation: 'capsula', supplier: 'Farmácia Central', price: 19.6, quantity: 50 },
  { product: 'Omeprazol', brand: 'Teuto', dose: '20mg', presentation: 'capsula', supplier: 'Rede Saúde Distrib.', price: 20.5, quantity: 50 },
  { product: 'Ibuprofeno', brand: 'Bayer', dose: '600mg', presentation: 'comprimido', supplier: 'Distribuidora Alpha', price: 14.3, quantity: 70 },
  { product: 'Ibuprofeno', brand: 'Bayer', dose: '600mg', presentation: 'comprimido', supplier: 'Farmácia Central', price: 13.9, quantity: 70 },
  { product: 'Ibuprofeno', brand: 'Bayer', dose: '600mg', presentation: 'comprimido', supplier: 'Rede Saúde Distrib.', price: 15.8, quantity: 70 },
  { product: 'Vitamina C', brand: 'Natura', dose: '500mg', presentation: 'comprimido', supplier: 'Distribuidora Alpha', price: 9.8, quantity: 90 },
  { product: 'Vitamina C', brand: 'Natura', dose: '500mg', presentation: 'comprimido', supplier: 'Farmácia Central', price: 8.6, quantity: 90 },
  { product: 'Vitamina C', brand: 'Natura', dose: '500mg', presentation: 'comprimido', supplier: 'Rede Saúde Distrib.', price: 9.3, quantity: 90 },
];

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(fallbackProducts, null, 2));
  }
}

function readProducts() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(raw);
}

function writeProducts(products) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2));
}

function groupByProduct(items) {
  const groups = new Map();

  items.forEach((item) => {
    const key = normalizeText(`${item.product || ''} ${item.brand || ''} ${item.dose || ''} ${item.presentation || ''}`);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(item);
  });

  return Array.from(groups.values()).map((group) => {
    const cheapest = group.reduce((best, current) => (current.price < best.price ? current : best), group[0]);
    const highest = group.reduce((max, current) => (current.price > max.price ? current : max), group[0]);

    return {
      product: group[0].product,
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

    if (['produto', 'product', 'nome', 'item', 'descricao', 'medicamento'].includes(normalized)) return 'product';
    if (['marca', 'brand', 'fabricante', 'laboratorio'].includes(normalized)) return 'brand';
    if (['dose', 'dosagem', 'concentracao', 'mg'].includes(normalized)) return 'dose';
    if (['apresentacao', 'apresentação', 'forma', 'unidade', 'embalagem'].includes(normalized)) return 'presentation';
    if (['fornecedor', 'supplier', 'distribuidora', 'empresa'].includes(normalized)) return 'supplier';
    if (['preco', 'price', 'valor', 'preco_unitario', 'valor_unitario', 'unitario'].includes(normalized)) return 'price';
    if (['quantidade', 'qty', 'qtd'].includes(normalized)) return 'quantity';
    return null;
  };

  return rows
    .map((row) => {
      const normalizedRow = {};
      Object.entries(row).forEach(([key, value]) => {
        const mappedKey = headerMap(key);
        if (mappedKey) normalizedRow[mappedKey] = value;
      });

      if (!normalizedRow.product || !normalizedRow.supplier || normalizedRow.price === undefined || normalizedRow.price === null || normalizedRow.price === '') {
        return null;
      }

      return {
        product: String(normalizedRow.product),
        brand: String(normalizedRow.brand || 'Genérico'),
        dose: String(normalizedRow.dose || 'N/A'),
        presentation: String(normalizedRow.presentation || 'unidade'),
        supplier: String(normalizedRow.supplier),
        price: Number(String(normalizedRow.price).replace(',', '.').replace(/[^\d.]/g, '')) || 0,
        quantity: Number(normalizedRow.quantity || 1),
      };
    })
    .filter(Boolean);
}

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'API funcionando.' });
});

app.get('/api/products', (_req, res) => {
  res.json(readProducts());
});

app.post('/api/products/reset', (_req, res) => {
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

    writeProducts(imported);
    return res.json({ ok: true, imported: imported.length });
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
