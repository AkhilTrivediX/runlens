# Product

<!-- impeccable:product-schema 1 -->

## Platform
web

## Users
Repository evidence: developers working with Puppeteer, Playwright and custom browser automation. The operating priority is inferred from the requested redesign and existing features: find unreliable runs and inspect their failure evidence. The user has not yet confirmed the relative priority of investigation and overall monitoring.

## Product Purpose
RunLens stores local automation runs, steps, events, issues and captured artifacts. It helps developers understand reliability and why a workflow failed.

## Operating Context
The dashboard reads a local SQLite trace store. It ships with the npm SDK and runs on the local machine. It also has a Vite development mode.

## Capabilities and Constraints
Existing API routes expose runs, metrics, selected trace details and local artifacts. Browser adapters observe pages. The redesign must preserve real data and existing inspection features. There is no team account, cloud ingest or AI diagnosis service.

## Brand Commitments
RunLens is the product name. The user requests a modern dashboard with a distinct product identity and clearer product sense. Author email is akhiltrivedix@gmail.com.

## Evidence on Hand
README.md, packages/sdk, packages/core, apps/dashboard and real local traces in lab/test-runs/runlens.db. No commercial proof or customer claims are supplied.

## Product Principles
Lead developers from a run to its steps and evidence. Keep reliability measures grounded in stored data. Make selected context and data scope explicit. Keep local operation understandable.
