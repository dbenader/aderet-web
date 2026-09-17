# Aderet local CRM

A small, private CRM stored entirely in this directory. It is independent from the public Aderet site and is intended to run only on the local workstation.

```bash
cd crm
npm install
npm run dev
```

Records are saved to `data.json`. Uploaded contracts are saved under `contracts/<record-id>/`. The **Import prospects** action reads `../prospects/*/prospect.json` and imports records that are not already linked by prospect ID.

This directory can contain contact, revenue, and signed-contract information. Keep the repository private and review changes before pushing them to a remote.
