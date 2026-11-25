# FINTRACE-AI
this is my minor project that assists the investigators in the banks to check for any fraud transactions and any anomaly detected during the course of transaction thus assisting the banks and the whole transaction environment . It helps in identifying and flagging out fraud transactions while keeping the human investigator in loop.

React and Vite dashboard for financial transaction monitoring and fraud investigation.

## Run locally

```powershell
npm.cmd ci
npm.cmd run dev
```

Open the local URL printed by Vite. Run `npm.cmd run lint` and `npm.cmd run build` to check the source and produce the static build.

## Data

The dashboard uses a fixed, synthetic monitoring dataset ending 26 November 2026 at noon IST. The INR amounts, alert reasons, scores, and transaction histories are illustrative. The case brief is generated locally from that evidence using a template.

The monitoring boundary is `src/monitoring.js`. To connect a production backend, use its reviewed volume, flagged transactions, and trend buckets in the dashboard. Each case needs a transaction ID, counterparty, transfer channel, city, INR amount, timestamp, risk score, flag reason, previous transfer amounts, and recent transfer count. The chart and case summary should use the same evidence. Generate LLM summaries server-side and return the cited transaction IDs or evidence fields alongside the summary.
