import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  Doughnut,
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
  }).format(value || 0);

const sectionLabels = {
  dashboard: 'Dashboard',
  comparison: 'Comparação',
  reports: 'Relatórios',
};

export default function App() {
  const [report, setReport] = useState(null);
  const [products, setProducts] = useState([]);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [productsRes, reportRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/report'),
      ]);

      if (!productsRes.ok || !reportRes.ok) {
        throw new Error('Não foi possível carregar os dados.');
      }

      const productsData = await productsRes.json();
      const reportData = await reportRes.json();

      setProducts(productsData);
      setReport(reportData);
    } catch (err) {
      setError(err.message || 'Erro ao carregar dados.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
      alert(err.message || 'Erro ao importar o arquivo.');
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

  if (isLoading) {
    return <div className="loading-shell">Carregando painel...</div>;
  }

  if (error) {
    return (
      <div className="loading-shell error-shell">
        <h2>Ops!</h2>
        <p>{error}</p>
        <button className="primary-btn" onClick={loadData}>
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
          <button className="primary-btn" type="button" onClick={handleReset}>
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
            <span className="status-pill">Versão profissional</span>
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
                      <YAxis stroke="#cbd5e1" tickFormatter={(v) => `R$${v}`} />
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
                        innerRadius={38}
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

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Marca</th>
                    <th>Apresentação</th>
                    <th>Fornecedor</th>
                    <th>Preço unit.</th>
                    <th>Qtd.</th>
                    <th>Subtotal</th>
                    <th>Mais barato</th>
                  </tr>
                </thead>
                <tbody>
                  {report?.bestOffers?.map((item) => (
                    <tr key={`${item.product}-${item.supplier}`}>
                      <td>{item.product}</td>
                      <td>{item.brand}</td>
                      <td>{item.presentation}</td>
                      <td>{item.supplier}</td>
                      <td>{currency(item.price)}</td>
                      <td>{item.quantity}</td>
                      <td>{currency(item.subtotal)}</td>
                      <td>
                        <span className="badge best">Mais barato</span>
                      </td>
                    </tr>
                  ))}
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
      </main>
    </div>
  );
}
