const formatNumber = (value) => new Intl.NumberFormat('es-PE').format(Number(value || 0))

const formatCost = (value) => `$${Number(value || 0).toFixed(6)}`

function UsageMetrics({ usage, isLoading, onRefresh }) {
  const totals = usage.reduce((current, row) => ({
    requestCount: current.requestCount + Number(row.requestCount),
    promptTokens: current.promptTokens + Number(row.promptTokens),
    completionTokens: current.completionTokens + Number(row.completionTokens),
    totalTokens: current.totalTokens + Number(row.totalTokens),
    totalCostUsd: current.totalCostUsd + Number(row.totalCostUsd),
  }), { requestCount: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0, totalCostUsd: 0 })

  return (
    <section className="metrics-view" aria-label="Costos y tokens por modelo">
      <div className="page-heading">
        <div><span className="heading-mark" /><h1>Costos</h1></div>
        <button type="button" className="outline-button" onClick={onRefresh} disabled={isLoading}>Actualizar datos</button>
      </div>

      <section className="cost-hero">
        <div>
          <p className="section-label">Consumo acumulado</p>
          <strong>{formatCost(totals.totalCostUsd)}</strong>
          <p>Calculado desde el costo devuelto por OpenRouter en cada respuesta registrada.</p>
        </div>
        <dl>
          <div><dt>Consultas</dt><dd>{formatNumber(totals.requestCount)}</dd></div>
          <div><dt>Tokens in</dt><dd>{formatNumber(totals.promptTokens)}</dd></div>
          <div><dt>Tokens out</dt><dd>{formatNumber(totals.completionTokens)}</dd></div>
          <div><dt>Total tokens</dt><dd>{formatNumber(totals.totalTokens)}</dd></div>
        </dl>
      </section>

      <section className="usage-table-wrap">
        <div className="table-heading"><div><p className="section-label">Comparativa</p><h2>Uso por modelo</h2></div><span>{usage.length} modelos con registros</span></div>
        {isLoading ? <p className="table-state">Leyendo los registros de PostgreSQL...</p> : usage.length === 0 ? <p className="table-state">Aún no hay consultas registradas. Envía un mensaje o realiza una consulta documental para empezar a comparar.</p> : (
          <div className="table-scroll"><table>
            <thead><tr><th>Modelo</th><th>Consultas</th><th>Tokens in</th><th>Tokens out</th><th>Total</th><th>Costo</th><th>Promedio</th></tr></thead>
            <tbody>{usage.map((row) => <tr key={row.model}><td>{row.model}</td><td>{formatNumber(row.requestCount)}</td><td>{formatNumber(row.promptTokens)}</td><td>{formatNumber(row.completionTokens)}</td><td>{formatNumber(row.totalTokens)}</td><td>{formatCost(row.totalCostUsd)}</td><td>{formatCost(row.averageCostUsd)}</td></tr>)}</tbody>
          </table></div>
        )}
      </section>
    </section>
  )
}

export default UsageMetrics
