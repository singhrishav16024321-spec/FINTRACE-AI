const day = 86_400_000
export const anchor = Date.parse('2026-11-26T12:00:00+05:30')
export const windows = [
  ['24 hours', 1], ['1 week', 7], ['2 weeks', 14],
  ['1 month', 30], ['3 months', 90], ['1 year', 365],
]
const examples = [
  ['Apex Trading Co.', 'RTGS', 'Mumbai', 485000, 96, 'Unusual amount', 0.08],
  ['Northstar Exports', 'NEFT', 'Delhi', 275000, 91, 'New beneficiary', 0.19],
  ['Meridian Logistics', 'IMPS', 'Bengaluru', 96000, 84, 'Transfer velocity', 0.35],
  ['Orion Retail Group', 'UPI', 'Pune', 49500, 76, 'Unusual amount', 0.47],
  ['Vertex Infrastructure', 'NEFT', 'Chennai', 182000, 68, 'Location change', 0.64],
  ['Cedar Financial', 'RTGS', 'Hyderabad', 310000, 58, 'New beneficiary', 0.9],
]

export const sample = Array.from({ length: 365 }, (_, index) => {
  const count = index === 0 ? 6 : 1 + (index * 13 % 7)
  const reviewedVolume = 235 + (index * 79 % 315)
  const records = Array.from({ length: count }, (_, offset) => {
    const [name, rail, city, amount, risk, signal, age] = examples[(index + offset) % examples.length]
    const value = index === 0 ? amount : amount + ((index * 17 + offset * 23) % 83) * 1000
    const ratio = signal === 'Unusual amount' ? 5.8 : 1.3
    const baseline = Math.round(value / ratio)
    return {
      id: 'TX-' + (49281 - index * 10 - offset),
      name, rail, city, amount: value, signal,
      risk: index === 0 ? risk : Math.max(41, Math.min(99, risk + (index * 7 % 23) - 11)),
      timestamp: anchor - (index + (index === 0 ? age : (offset + 1) / (count + 1))) * day,
      history: [0.8, 1.1, 0.9, 1.2, 0.95, 1.05].map(factor => Math.round(baseline * factor)),
      recentCount: signal === 'Transfer velocity' ? 8 : 2,
    }
  })
  return { reviewedVolume, records }
})

export function getWindow(days) {
  const daysInRange = sample.slice(0, days)
  const records = daysInRange.flatMap(bucket => bucket.records)
  const bucketCount = days === 1 ? 12 : Math.min(days, 14)
  const bucketWidth = days * day / bucketCount
  const beginning = anchor - days * day
  return {
    records,
    volume: daysInRange.reduce((total, bucket) => total + bucket.reviewedVolume, 0),
    trend: Array.from({ length: bucketCount }, (_, index) => {
      const start = beginning + index * bucketWidth
      const end = beginning + (index + 1) * bucketWidth
      const matches = records.filter(record => record.timestamp > start && record.timestamp <= end)
      return { end, flagged: matches.length, critical: matches.filter(record => record.risk >= 90).length }
    }),
  }
}

export const number = value => new Intl.NumberFormat('en-IN').format(value)
export const money = value => '₹' + number(value)
export const date = (value, options = { day: '2-digit', month: 'short' }) =>
  new Intl.DateTimeFormat('en-IN', { ...options, timeZone: 'Asia/Kolkata' }).format(value)
export const riskBand = score => score >= 90 ? 'Critical' : score >= 70 ? 'High' : 'Elevated'

export function evidenceFor(record) {
  const average = record.history.reduce((total, value) => total + value, 0) / record.history.length
  const ratio = record.amount / average
  const percent = Math.round((ratio - 1) * 100)
  return { average, ratio, percent }
}
