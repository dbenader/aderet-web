import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { basename, join, resolve } from 'node:path';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

const dataFile = resolve('data.json');
const contractsRoot = resolve('contracts');
const prospectsRoot = resolve('..', 'prospects');

type ContractFile = { id: string; name: string; path: string; mimeType: string; uploadedAt: string };
type CrmRecord = { id: string; contracts?: ContractFile[]; updatedAt?: string; sourceProspectId?: string; [key: string]: unknown };
type CrmData = { version: number; updatedAt: string; records: CrmRecord[] };

function readData(): CrmData {
  mkdirSync(contractsRoot, { recursive: true });
  try { return JSON.parse(readFileSync(dataFile, 'utf8')) as CrmData; }
  catch { return { version: 1, updatedAt: new Date().toISOString(), records: [] }; }
}

function writeData(data: CrmData) {
  data.updatedAt = new Date().toISOString();
  writeFileSync(dataFile, `${JSON.stringify(data, null, 2)}\n`);
}

function sendJson(response: ServerResponse, status: number, value: unknown) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(value));
}

function readBody(request: IncomingMessage, limit = 16 * 1024 * 1024): Promise<string> {
  return new Promise((resolveBody, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    request.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > limit) { reject(new Error('Request is too large.')); request.destroy(); return; }
      chunks.push(chunk);
    });
    request.on('end', () => resolveBody(Buffer.concat(chunks).toString('utf8')));
    request.on('error', reject);
  });
}

function safeSegment(value: string) {
  return basename(value).replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 120);
}

const localApi = {
  name: 'local-crm-api',
  configureServer(server: { middlewares: { use: (handler: (request: IncomingMessage, response: ServerResponse, next: () => void) => void) => void } }) {
    server.middlewares.use(async (request, response, next) => {
      const url = new URL(request.url || '/', 'http://127.0.0.1');
      if (!url.pathname.startsWith('/api/crm')) return next();
      try {
        if (request.method === 'GET' && url.pathname === '/api/crm') return sendJson(response, 200, readData());

        if (request.method === 'PUT' && url.pathname === '/api/crm') {
          const incoming = JSON.parse(await readBody(request)) as CrmData;
          if (!incoming || !Array.isArray(incoming.records)) return sendJson(response, 400, { error: 'Invalid CRM data.' });
          const data: CrmData = { version: 1, updatedAt: new Date().toISOString(), records: incoming.records };
          writeData(data);
          return sendJson(response, 200, data);
        }

        if (request.method === 'POST' && url.pathname === '/api/crm/import-prospects') {
          const data = readData();
          let imported = 0;
          if (existsSync(prospectsRoot)) {
            for (const prospectId of readdirSync(prospectsRoot)) {
              const file = join(prospectsRoot, prospectId, 'prospect.json');
              if (!existsSync(file) || data.records.some((record) => record.sourceProspectId === prospectId)) continue;
              const prospect = JSON.parse(readFileSync(file, 'utf8')) as { id?: string; businessName?: string; sourceUrl?: string; status?: string; createdAt?: string; updatedAt?: string };
              const now = new Date().toISOString();
              const won = prospect.status === 'won';
              data.records.push({
                id: `crm-${Date.now().toString(36)}-${prospectId}`,
                company: prospect.businessName || prospectId,
                contactName: '', email: '', phone: '', website: prospect.sourceUrl || '',
                stage: won ? 'won' : 'lead', contractStatus: 'none', projectValue: 0,
                recurringRevenue: 0, revenueReceived: 0, sourceProspectId: prospect.id || prospectId,
                notes: '', contracts: [], createdAt: prospect.createdAt || now, updatedAt: prospect.updatedAt || now,
                ...(won ? { convertedAt: prospect.updatedAt || now } : {}),
              });
              imported += 1;
            }
          }
          writeData(data);
          return sendJson(response, 200, { imported, data });
        }

        if (request.method === 'POST' && url.pathname === '/api/crm/contracts') {
          const payload = JSON.parse(await readBody(request)) as { recordId?: string; fileName?: string; mimeType?: string; data?: string };
          const recordId = safeSegment(payload.recordId || '');
          const fileName = safeSegment(payload.fileName || '');
          if (!recordId || !fileName || !payload.data) return sendJson(response, 400, { error: 'Missing contract upload fields.' });
          const data = readData();
          const record = data.records.find((entry) => entry.id === recordId);
          if (!record) return sendJson(response, 404, { error: 'CRM record not found.' });
          const contractId = `contract-${Date.now().toString(36)}`;
          const storedName = `${contractId}-${fileName}`;
          const recordRoot = join(contractsRoot, recordId);
          mkdirSync(recordRoot, { recursive: true });
          writeFileSync(join(recordRoot, storedName), Buffer.from(payload.data, 'base64'));
          const contract: ContractFile = { id: contractId, name: payload.fileName || fileName, path: `${recordId}/${storedName}`, mimeType: payload.mimeType || 'application/octet-stream', uploadedAt: new Date().toISOString() };
          record.contracts = [...(record.contracts || []), contract];
          record.updatedAt = new Date().toISOString();
          writeData(data);
          return sendJson(response, 201, { contract, data });
        }

        if (request.method === 'GET' && url.pathname.startsWith('/api/crm/contracts/')) {
          const relativePath = url.pathname.slice('/api/crm/contracts/'.length).split('/').map(safeSegment).join('/');
          const fullPath = resolve(contractsRoot, relativePath);
          if (!fullPath.startsWith(`${contractsRoot}/`)) return sendJson(response, 400, { error: 'Invalid contract path.' });
          const data = readData();
          const contract = data.records.flatMap((record) => record.contracts || []).find((entry) => entry.path === relativePath);
          if (!contract) return sendJson(response, 404, { error: 'Contract not found.' });
          response.writeHead(200, { 'Content-Type': contract.mimeType, 'Content-Disposition': `inline; filename="${safeSegment(contract.name)}"`, 'Cache-Control': 'no-store' });
          response.end(readFileSync(fullPath));
          return;
        }

        return sendJson(response, 404, { error: 'Unknown CRM endpoint.' });
      } catch (error) {
        return sendJson(response, 500, { error: error instanceof Error ? error.message : 'CRM request failed.' });
      }
    });
  },
};

export default defineConfig({ plugins: [react(), localApi] });
