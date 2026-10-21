import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const currency = (value) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0));

const sectionLabels = {
  dashboard: 'Dashboard',
  comparison: 'Comparação',
  reports: 'Relatórios',
  catalog: 'Catálogo',
  suppliers: 'Fornecedores',
};

const emptyProduct = {
  name: '',
  brand: '',
  category: '',
  dose: '',
  presentation: '',
  supplierId: '',
  price: '',
  quantity: '',
  code: '',
};

const emptySupplier = {
  name: '',
  contact: '',
  notes: '',
};

export default function App() {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [report, setReport] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [filterSupplier, setFilterSupplier] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [maxPrice, setMaxPrice] = useState('');
  const [productForm, setProductForm] = useState(emptyProduct);
  const [supplierForm, setSupplierForm] = useState(emptySupplier);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [productsRes, suppliersRes, reportRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/suppliers'),
        fetch('/api/report'),
      ]);

      if (!productsRes.ok || !suppliersRes.ok || !reportRes.ok) {
        throw new Error('Não foi possível carregar os dados do sistema.');
      }

      const [productsData, suppliersData, reportData] = await Promise.all([
        productsRes.json(),
        suppliersRes.json(),
        reportRes.json(),
      ]);

      setProducts(productsData);
      setSuppliers(suppliersData);
      setReport(reportData);
    } catch (err) {
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProductSubmit = async (event) => {
    event.preventDefault();
    const supplier = suppliers.find((item) => item.id === productForm.supplierId);

    if (!supplier) {
      alert('Selecione um fornecedor válido.');
      return;
    }

    const payload = {
      ...productForm,
      supplier: supplier.name,
      supplierId: supplier.id,
      price: Number(productForm.price),
      quantity: Number(productForm.quantity || 1),
      name: productForm.name.trim(),
      code: productForm.code.trim() || `PROD-${Date.now()}`,
    };

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Erro ao cadastrar o produto.');
      }

      setProductForm(emptyProduct);
      await loadData();
      alert('Produto cadastrado com sucesso.');
    } catch (err) {
      alert(err.message || 'Erro ao cadastrar produto.');
    }
  };

  const handleSupplierSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...supplierForm,
          name: supplierForm.name.trim(),
          contact: supplierForm.contact.trim(),
          notes: supplierForm.notes.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao cadastrar fornecedor.');
      }

      setSupplierForm(emptySupplier);
      await loadData();
      alert('Fornecedor cadastrado com sucesso.');
    } catch (err) {
      alert(err.message || 'Erro ao cadastrar fornecedor.');
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Falha ao importar a planilha.');
      }

      const payload = await response.json();
      alert(`${payload.imported} produtos importados com sucesso.`);
      await loadData();
    } catch (err) {
      alert(err.message || 'Erro ao importar a planilha.');
    } finally {
      event.target.value = '';
    }
  };

  const handleReset = async () => {
    try {
      const response = await fetch('/api/products/reset', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Não foi possível restaurar os dados.');
      }

      await loadData();
      alert('Dados fictícios restaurados com sucesso.');
    } catch (err) {
      alert(err.message || 'Erro ao restaurar os dados.');
    }
  };

  const brands = useMemo(
    () => [...new Set(products.map((item) => item.brand).filter(Boolean))],
    [products]
  );

  const categories = useMemo(
    () => [...new Set(products.map((item) => item.category).filter(Boolean))],
    [products]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const supplierMatch =
        filterSupplier === 'all' || item.supplierId === filterSupplier || item.supplier === filterSupplier;
      const brandMatch = filterBrand === 'all' || item.brand === filterBrand;
      const categoryMatch = filterCategory === 'all' || item.category === filterCategory;
      const priceMatch = !maxPrice || Number(item.price) <= Number(maxPrice);
      return supplierMatch && brandMatch && categoryMatch && priceMatch;
    });
  }, [products, filterSupplier, filterBrand, filterCategory, maxPrice]);

  const supplierChartData = useMemo(
    () =>
      report?.supplierTotals?.map((entry) => ({
        name: entry.name,
        value: Number(entry.value),
      })) || [],
    [report]
  );

  const priceChartData = useMemo(
    () =>
      report?.priceByProduct?.map((entry) => ({
        name: entry.product,
        value: Number(entry.price),
      })) || [],
    [report]
  );

  const pieColors = ['#34d399', '#60a5fa', '#fbbf24', '#f472b6', '#a78bfa'];

  if (loading) {
    return <div className="loading-shell">Carregando painel...</div>;
  }

  if (error) {
    return (
      <div className="loading-shell error-shell">
        <h2>Ops!</h2>
        <p>{error}</p>
        <button type="button" className="primary-btn" onClick={loadData}>
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">P</div>
          <div>
            <h1>PharmCompare Pro</h1>
          </div>
        </div>

        <nav className="menu">
          {Object.entries(sectionLabels).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`nav-item ${activeSection === key ? 'active' : ''}`}
              onClick={() => setActiveSection(key)}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-card">
          <p className="eyebrow">Ação rápida</p>
          <button type="button" className="primary-btn" onClick={handleReset}>
            Restaurar dados fictícios
          </button>
        </div>

        <div className="sidebar-card">
          <p className="eyebrow">Importar Excel</p>
          <label className="upload-btn">
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} />
            Selecionar planilha
          </label>
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Painel de compras</p>
            <h2>Comparativo de preços para farmácias</h2>
          </div>
          <div className="topbar-actions">
            <span className="status-pill">Versão final</span>
          </div>
        </header>

        {activeSection === 'dashboard' && (
          <section className="panel active">
            <div className="stats-grid">
              <div className="stat-card">
                <span className="label">Produtos comparados</span>
                <strong>{report?.productsCount ?? 0}</strong>
                <small>itens avaliados</small>
              </div>

              <div className="stat-card">
                <span className="label">Fornecedor mais barato</span>
                <strong>{report?.cheapestSupplier?.name || '-'}</strong>
                <small>{report?.cheapestSupplier ? currency(report.cheapestSupplier.value) : 'Sem dados'}</small>
              </div>

              <div className="stat-card">
                <span className="label">Custo do pedido</span>
                <strong>{currency(report?.lowestTotalCost)}</strong>
                <small>menor custo estimado</small>
              </div>

              <div className="stat-card">
                <span className="label">Economia</span>
                <strong>{currency(report?.savings)}</strong>
                <small>vs. maior custo</small>
              </div>
            </div>

            <div className="chart-grid">
              <div className="chart-card wide">
                <div className="card-head">
                  <h3>Preço por produto</h3>
                </div>
                <div className="chart-box">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={priceChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.28)" />
                      <XAxis dataKey="name" stroke="#cbd5e1" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#cbd5e1" tickFormatter={(value) => `R$${value}`} />
                      <Tooltip
                        formatter={(value) => currency(Number(value))}
                        contentStyle={{
                          background: '#0f172a',
                          border: '1px solid rgba(148,163,184,0.28)',
                          borderRadius: 12,
                        }}
                      />
                      <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#34d399" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-card">
                <div className="card-head">
                  <h3>Distribuidoras</h3>
                </div>
                <div className="chart-box pie-box">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={supplierChartData}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={80}
                        innerRadius={40}
                        paddingAngle={3}
                      >
                        {supplierChartData.map((entry, index) => (
                          <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => currency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeSection === 'comparison' && (
          <section className="panel active">
            <div className="section-header">
              <h3>Comparação de produtos</h3>
            </div>

            <div className="filter-panel">
              <select value={filterSupplier} onChange={(e) => setFilterSupplier(e.target.value)}>
                <option value="all">Todos os fornecedores</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>

              <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)}>
                <option value="all">Todas as marcas</option>
                {brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>

              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                <option value="all">Todas as categorias</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Preço máximo"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Marca</th>
                    <th>Categoria</th>
                    <th>Fornecedor</th>
                    <th>Preço unit.</th>
                    <th>Qtd.</th>
                    <th>Subtotal</th>
                    <th>Mais barato</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((item) => {
                    const isBest = Number(item.price) === Math.min(...filteredProducts.map((entry) => Number(entry.price)));
                    return (
                      <tr key={item.id || `${item.name}-${item.supplier}`}>
                        <td>{item.name}</td>
                        <td>{item.brand}</td>
                        <td>{item.category}</td>
                        <td>{item.supplier}</td>
                        <td>{currency(item.price)}</td>
                        <td>{item.quantity}</td>
                        <td>{currency(Number(item.price) * Number(item.quantity))}</td>
                        <td>
                          <span className={`badge ${isBest ? 'best' : 'other'}`}>
                            {isBest ? 'Mais barato' : 'Comparar'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeSection === 'reports' && (
          <section className="panel active">
            <div className="section-header">
              <h3>Relatórios e análise</h3>
            </div>

            <div className="report-grid">
              <div className="report-card">
                <h4>Ranking dos mais baratos</h4>
                <ul>
                  {report?.ranking?.map((item, index) => (
                    <li key={`${item.product}-${item.supplier}`}>
                      <span>
                        {index + 1}. {item.product}
                      </span>
                      <strong>{currency(item.price)}</strong>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="report-card">
                <h4>Resumo por distribuidora</h4>
                <ul>
                  {report?.supplierTotals?.map((item) => (
                    <li key={item.name}>
                      <span>{item.name}</span>
                      <strong>{currency(item.value)}</strong>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="report-card">
                <h4>Observações</h4>
                <ul>
                  <li>
                    <span>Produto destaque</span>
                    <strong>{report?.topProduct?.product || '-'}</strong>
                  </li>
                  <li>
                    <span>Melhor fornecedor</span>
                    <strong>{report?.cheapestSupplier?.name || '-'}</strong>
                  </li>
                  <li>
                    <span>Economia estimada</span>
                    <strong>{currency(report?.savings)}</strong>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {activeSection === 'catalog' && (
          <section className="panel active">
            <div className="section-header">
              <h3>Cadastro de produtos</h3>
            </div>

            <form className="form-grid" onSubmit={handleProductSubmit}>
              <input
                type="text"
                placeholder="Nome do produto"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              />
              <input
                type="text"
                placeholder="Marca"
                value={productForm.brand}
                onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
              />
              <input
                type="text"
                placeholder="Categoria"
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
              />
              <input
                type="text"
                placeholder="Dose"
                value={productForm.dose}
                onChange={(e) => setProductForm({ ...productForm, dose: e.target.value })}
              />
              <input
                type="text"
                placeholder="Apresentação"
                value={productForm.presentation}
                onChange={(e) => setProductForm({ ...productForm, presentation: e.target.value })}
              />
              <select
                value={productForm.supplierId}
                onChange={(e) => setProductForm({ ...productForm, supplierId: e.target.value })}
              >
                <option value="">Selecione o fornecedor</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Preço unitário"
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
              />
              <input
                type="number"
                min="0"
                placeholder="Quantidade"
                value={productForm.quantity}
                onChange={(e) => setProductForm({ ...productForm, quantity: e.target.value })}
              />
              <input
                type="text"
                placeholder="Código interno"
                value={productForm.code}
                onChange={(e) => setProductForm({ ...productForm, code: e.target.value })}
              />
              <button type="submit" className="primary-btn submit-btn">
                Salvar produto
              </button>
            </form>
          </section>
        )}

        {activeSection === 'suppliers' && (
          <section className="panel active">
            <div className="section-header">
              <h3>Cadastro de fornecedores</h3>
            </div>

            <form className="form-grid" onSubmit={handleSupplierSubmit}>
              <input
                type="text"
                placeholder="Nome do fornecedor"
                value={supplierForm.name}
                onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
              />
              <input
                type="text"
                placeholder="Contato"
                value={supplierForm.contact}
                onChange={(e) => setSupplierForm({ ...supplierForm, contact: e.target.value })}
              />
              <textarea
                rows="4"
                placeholder="Observações"
                value={supplierForm.notes}
                onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })}
              />
              <button type="submit" className="primary-btn submit-btn">
                Salvar fornecedor
              </button>
            </form>

            <div className="table-wrap supplier-list-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Fornecedor</th>
                    <th>Contato</th>
                    <th>Observações</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((supplier) => (
                    <tr key={supplier.id}>
                      <td>{supplier.name}</td>
                      <td>{supplier.contact}</td>
                      <td>{supplier.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
