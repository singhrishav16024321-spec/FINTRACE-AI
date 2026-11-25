import { useMemo, useState } from 'react'
import {
  Activity, ArrowDownLeft, ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays,
  ChevronDown, Download, Flag, IndianRupee, LayoutDashboard, ListFilter, Search,
  ShieldCheck, ShieldAlert, Sparkles, Workflow,
} from 'lucide-react'
import {
  Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'
import { anchor, date, evidenceFor, getWindow, money, number, riskBand, windows } from './monitoring'

function Risk({ value }) {
  const band = riskBand(value)
  return <span className={'risk ' + band.toLowerCase()}><i />{value} <span>{band}</span></span>
}

function Chart({ data, detail = false }) {
  const ChartType = detail ? LineChart : AreaChart
  const x = detail ? 'label' : 'end'
  return <div className="chart" role="img" aria-label={detail
    ? 'Previous transfer amounts compared with selected transfer. Exact values are listed below.'
    : 'Flagged and critical transactions over time. Exact counts are listed below.'}>
    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
      <ChartType data={data} margin={{ top: 12, right: 12, left: -6, bottom: 0 }}>
        <defs><linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#388766" stopOpacity={0.32} /><stop offset="100%" stopColor="#388766" stopOpacity={0.025} /></linearGradient></defs>
        <CartesianGrid vertical={false} stroke="#e3e9e1" strokeDasharray="3 4" />
        <XAxis dataKey={x} tickFormatter={value => detail ? value : date(value, data.length === 12 ? { hour: 'numeric', hourCycle: 'h23' } : undefined) + (data.length === 12 ? ':00' : '')} tickLine={false} axisLine={false} tickMargin={10} minTickGap={24} />
        <YAxis width={52} tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={value => detail ? '₹' + Math.round(value / 1000) + 'k' : value} />
        <Tooltip labelFormatter={value => detail ? value : date(value, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} formatter={value => detail ? money(value) : number(value)} contentStyle={{ borderRadius: 10, borderColor: '#dfe6dc' }} />
        {detail
          ? <Line name="Transfer amount" type="monotone" dataKey="amount" stroke="#317454" strokeWidth={3} dot={{ r: 4, fill: '#317454' }} />
          : <>
              <Area name="Flagged" type="monotone" dataKey="flagged" stroke="#317454" strokeWidth={2.5} fill="url(#trend-fill)" />
              <Area name="Critical" type="monotone" dataKey="critical" stroke="#ad5342" strokeWidth={2} strokeDasharray="5 4" fill="none" />
            </>}
      </ChartType>
    </ResponsiveContainer>
  </div>
}

function CaseTable({ records, onOpen }) {
  return <div className="table-scroll"><table>
    <thead><tr><th scope="col">Transaction</th><th scope="col">Channel</th><th scope="col">Amount</th><th scope="col">Risk score</th><th scope="col">Primary signal</th><th scope="col"><span className="sr-only">Open</span></th></tr></thead>
    <tbody>{records.map(record => <tr key={record.id}>
      <td><button className="record" onClick={() => onOpen(record)}><span className="record-icon"><ArrowDownLeft size={17} /></span><span><strong>{record.name}</strong><small>{record.id} · {date(record.timestamp)}</small></span></button></td>
      <td><span className="rail">{record.rail}</span></td><td className="numeric">{money(record.amount)}</td>
      <td><Risk value={record.risk} /></td><td>{record.signal}</td>
      <td><button className="icon-button" onClick={() => onOpen(record)} aria-label={'Investigate ' + record.id}><ArrowUpRight size={17} /></button></td>
    </tr>)}</tbody>
  </table>{records.length === 0 && <p className="empty">No transactions match your filters.</p>}</div>
}

function Investigation({ record, onBack }) {
  const { average, ratio, percent } = evidenceFor(record)
  const history = record.history.map((amount, index) => ({ label: 'Prior ' + (index + 1), amount }))
  const data = [...history, { label: 'Selected', amount: record.amount }]
  return <>
    <button className="back" onClick={onBack}><ArrowLeft size={16} /> Flagged transactions</button>
    <div className="page-heading"><div><h1>{record.name}</h1><p>{record.id} · {date(record.timestamp, { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} IST · {record.city}</p></div><Risk value={record.risk} /></div>
    <div className="metrics">
      <div><span>Transfer amount</span><strong>{money(record.amount)}</strong><small>{record.rail} transfer</small></div>
      <div><span>Historical mean</span><strong>{money(Math.round(average))}</strong><small>Previous six sample transfers</small></div>
      <div><span>Amount change</span><strong>{percent > 0 ? '+' : ''}{percent}%</strong><small>Compared with historical mean</small></div>
      <div><span>Recent frequency</span><strong>{record.recentCount}</strong><small>Transfers in the preceding hour</small></div>
    </div>
    <div className="analysis-grid">
      <section className="panel chart-panel"><div className="panel-heading"><div><h2>Amount history</h2><p>Prior transfers and the selected transaction</p></div></div>
        <Chart data={data} detail />
        <details><summary>View chart values</summary><ul>{data.map(point => <li key={point.label}>{point.label} · {money(point.amount)}</li>)}</ul></details>
      </section>
      <section className="panel brief"><Sparkles size={21} /><h2>Investigation brief</h2><span className="demo-tag">Rule-based preview</span>
        <p>{record.id} was marked for review because of {record.signal.toLowerCase()}. The {money(record.amount)} transfer was {ratio.toFixed(1)}× the prior-transfer mean, with {record.recentCount} transfers recorded in the preceding hour.</p>
        <div className="brief-foot"><strong>Evidence</strong><span>{record.signal} · {record.rail} · {record.city}</span><span>Based on the six sample transfers and the selected transaction.</span></div>
      </section>
    </div>
  </>
}

function exportRows(rows) {
  const lines = [['Transaction ID', 'Counterparty', 'Channel', 'Amount INR', 'Risk score', 'Signal', 'Timestamp UTC'],
    ...rows.map(r => [r.id, r.name, r.rail, r.amount, r.risk, r.signal, new Date(r.timestamp).toISOString()])]
  const contents = lines.map(row => row.map(value => '"' + String(value).replaceAll('"', '""') + '"').join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([contents], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'fintrace-flagged-transactions.csv'
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function App() {
  const [view, setView] = useState('overview')
  const [days, setDays] = useState(7)
  const [selected, setSelected] = useState(null)
  const [query, setQuery] = useState('')
  const [band, setBand] = useState('All risk levels')
  const [page, setPage] = useState(0)
  const { records, volume, trend } = useMemo(() => getWindow(days), [days])
  const critical = records.filter(record => record.risk >= 90)
  const exposure = records.reduce((total, record) => total + record.amount, 0)
  const filtered = records.filter(record => (band === 'All risk levels' || riskBand(record.risk) === band) &&
    [record.name, record.id, record.rail, record.signal, record.city].some(value => value.toLowerCase().includes(query.trim().toLowerCase())))
  const signalCounts = Object.entries(records.reduce((counts, record) => {
    counts[record.signal] = (counts[record.signal] ?? 0) + 1
    return counts
  }, {})).sort((a, b) => b[1] - a[1])
  const period = windows.find(([, value]) => value === days)[0]
  const go = next => { setSelected(null); setView(next); window.scrollTo(0, 0) }
  const open = record => { setSelected(record); setView('detail'); window.scrollTo(0, 0) }
  const metrics = [
    [Activity, 'Monitored transactions', number(volume), 'Sample transfer volume', 'green'],
    [Flag, 'Flagged transactions', number(records.length), (records.length / volume * 100).toFixed(2) + '% of monitored volume', 'gold'],
    [ShieldAlert, 'Critical risk', number(critical.length), 'Risk score of 90 or higher', 'red'],
    [IndianRupee, 'Flagged exposure', money(exposure), 'Total value of flagged transfers', 'green'],
  ]

  return <div className="shell">
    <aside className="sidebar">
      <button className="brand" onClick={() => go('overview')}><span className="brand-icon"><Workflow size={24} /></span><span>FINTRACE<span className="brand-ai">AI</span><small>Financial Intelligence</small></span></button>
      <nav aria-label="Workspace">
        <span className="nav-caption">Workspace</span>
        <button className={view === 'overview' ? 'active' : ''} aria-current={view === 'overview' ? 'page' : undefined} onClick={() => go('overview')}><LayoutDashboard size={18} /> Risk overview</button>
        <button className={view !== 'overview' ? 'active' : ''} aria-current={view !== 'overview' ? 'page' : undefined} onClick={() => go('queue')}><Flag size={18} /> Flagged transactions</button>
      </nav>
      <div className="side-footer"><ShieldCheck size={19} /><span><strong>Analyst workspace</strong><small>Synthetic dataset · INR</small></span></div>
    </aside>
    <main>
      <header className="toolbar"><div className="breadcrumb">Monitoring <ChevronDown size={13} /> <strong>{view === 'overview' ? 'Risk overview' : view === 'queue' ? 'Flagged transactions' : selected.id}</strong></div><span className="demo-tag"><i /> Demo data</span></header>
      <div className="content">
        {view === 'detail' ? <Investigation record={selected} onBack={() => go('queue')} /> : <>
          <div className="page-heading">
            <div><h1>{view === 'overview' ? 'Risk overview' : 'Flagged transactions'}</h1><p>{view === 'overview' ? 'Monitor payment activity and investigate suspicious transfers.' : 'Review marked transfers and open the underlying evidence.'}</p></div>
            <button className="outline" disabled={(view === 'queue' ? filtered : records).length === 0} onClick={() => exportRows(view === 'queue' ? filtered : records)}><Download size={16} /> Export CSV</button>
          </div>
          <div className="period-bar"><span><CalendarDays size={17} /> Monitoring period</span><div className="periods" aria-label="Monitoring period">{windows.map(([label, value]) =>
            <button key={value} aria-pressed={value === days} onClick={() => { setDays(value); setPage(0); setBand('All risk levels'); setQuery(''); go('queue') }}>{label}</button>)}</div><small>As of {date(anchor, { day: '2-digit', month: 'short', year: 'numeric' })} IST</small></div>
          {view === 'overview' ? <>
            <section className="metrics" aria-label="Risk metrics">{metrics.map(([Icon, label, value, note, color]) => <div key={label}><span><i className={'metric-icon ' + color}><Icon size={17} /></i>{label}</span><strong>{value}</strong><small>{note}</small></div>)}</section>
            <div className="analysis-grid">
              <section className="panel chart-panel"><div className="panel-heading"><div><h2>Flagged activity</h2><p>Transaction counts · {period}</p></div><div className="legend"><span><i /> Flagged</span><span><i /> Critical</span></div></div>
                <Chart data={trend} />
                <details><summary>View chart values</summary><ul>{trend.map(point => <li key={point.end}>{date(point.end, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} · {point.flagged} flagged · {point.critical} critical</li>)}</ul></details>
              </section>
              <section className="panel signals"><div className="panel-heading"><div><h2>Risk signals</h2><p>Primary reason for each flag</p></div><Activity size={19} /></div>
                <div className="signal-list">{signalCounts.map(([signal, count]) => <div key={signal}><div><span>{signal}</span><strong>{number(count)}</strong></div><meter aria-label={signal} value={count} min={0} max={records.length} /></div>)}</div>
                <button className="text-button" onClick={() => go('queue')}>Open investigation queue <ArrowRight size={16} /></button>
              </section>
            </div>
          </> : null}
          <section className="panel queue">
            <div className="panel-heading"><div><h2>{view === 'queue' ? 'Investigation queue' : 'Recent flagged transactions'}</h2><p>{view === 'queue' ? number(filtered.length) + ' matching records · ' + period : 'Latest transfers marked for review'}</p></div>
              {view === 'overview' && <button className="text-button" onClick={() => go('queue')}>View all <ArrowRight size={16} /></button>}
            </div>
            {view === 'queue' && <div className="filters">
              <label><Search size={16} /><input value={query} placeholder="Search by name, ID, or channel" onChange={event => { setQuery(event.target.value); setPage(0) }} aria-label="Search flagged transactions" /></label>
              <label><ListFilter size={16} /><select value={band} onChange={event => { setBand(event.target.value); setPage(0) }} aria-label="Risk level">{['All risk levels', 'Critical', 'High', 'Elevated'].map(value => <option key={value}>{value}</option>)}</select></label>
            </div>}
            <CaseTable records={view === 'overview' ? records.slice(0, 5) : filtered.slice(page * 12, (page + 1) * 12)} onOpen={open} />
            {view === 'queue' && filtered.length > 12 && <div className="pagination"><span>Page {page + 1} of {Math.ceil(filtered.length / 12)}</span><button className="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button><button className="outline" disabled={(page + 1) * 12 >= filtered.length} onClick={() => setPage(page + 1)}>Next</button></div>}
          </section>
        </>}
        <footer>FINTRACE AI <span>Transaction monitoring · INR · Asia/Kolkata</span></footer>
      </div>
    </main>
  </div>
}
