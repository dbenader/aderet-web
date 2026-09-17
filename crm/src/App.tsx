import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import './index.css';
import './controls.css';

type Stage = 'lead' | 'qualified' | 'proposal' | 'contract-sent' | 'won' | 'lost';
type ContractStatus = 'none' | 'draft' | 'sent' | 'signed';

type ContractFile = {
  id: string;
  name: string;
  path: string;
  mimeType: string;
  uploadedAt: string;
};

type CrmRecord = {
  id: string;
  company: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  stage: Stage;
  contractStatus: ContractStatus;
  projectValue: number;
  recurringRevenue: number;
  revenueReceived: number;
  sourceProspectId: string;
  notes: string;
  contracts: ContractFile[];
  createdAt: string;
  updatedAt: string;
  convertedAt?: string;
};

type CrmData = { version: number; updatedAt: string; records: CrmRecord[] };
type RecordDraft = Omit<CrmRecord, 'id' | 'contracts' | 'createdAt' | 'updatedAt' | 'convertedAt'>;

const emptyDraft: RecordDraft = {
  company: '', contactName: '', email: '', phone: '', website: '', stage: 'lead', contractStatus: 'none',
  projectValue: 0, recurringRevenue: 0, revenueReceived: 0, sourceProspectId: '', notes: '',
};
const noRecords: CrmRecord[] = [];

const stages: { value: Stage; label: string }[] = [
  { value: 'lead', label: 'Lead' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'contract-sent', label: 'Contract sent' },
  { value: 'won', label: 'Client' },
  { value: 'lost', label: 'Lost' },
];

const contractStatuses: { value: ContractStatus; label: string }[] = [
  { value: 'none', label: 'No contract' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'signed', label: 'Signed' },
];

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

function normalizeWebsite(value: string) {
  if (!value.trim()) return '';
  return /^https?:\/\//i.test(value) ? value.trim() : `https://${value.trim()}`;
}

function hostLabel(value: string) {
  try { return new URL(normalizeWebsite(value)).hostname.replace(/^www\./, ''); }
  catch { return value; }
}

function recordToDraft(record: CrmRecord): RecordDraft {
  return {
    company: record.company, contactName: record.contactName, email: record.email, phone: record.phone,
    website: record.website, stage: record.stage, contractStatus: record.contractStatus,
    projectValue: record.projectValue, recurringRevenue: record.recurringRevenue,
    revenueReceived: record.revenueReceived, sourceProspectId: record.sourceProspectId, notes: record.notes,
  };
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article className="crm-metric"><span>{label}</span><strong>{value}</strong><p>{detail}</p></article>;
}

function RecordForm({ initial, onCancel, onSave }: { initial?: CrmRecord; onCancel: () => void; onSave: (draft: RecordDraft) => Promise<void> }) {
  const [draft, setDraft] = useState<RecordDraft>(initial ? recordToDraft(initial) : emptyDraft);
  const [saving, setSaving] = useState(false);
  function field(name: keyof RecordDraft, value: string | number) { setDraft((current) => ({ ...current, [name]: value })); }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try { await onSave({ ...draft, website: normalizeWebsite(draft.website) }); }
    finally { setSaving(false); }
  }
  return <form className="crm-record-form" onSubmit={submit}>
    <div className="crm-form-head"><div><span>{initial ? 'EDIT RECORD' : 'NEW RELATIONSHIP'}</span><h2>{initial ? initial.company : 'Add a prospect'}</h2></div><button type="button" className="crm-icon-button" onClick={onCancel} aria-label="Close">×</button></div>
    <div className="crm-form-grid">
      <label className="crm-wide"><span>Company *</span><input required autoFocus value={draft.company} onChange={(event) => field('company', event.target.value)} /></label>
      <label><span>Contact name</span><input value={draft.contactName} onChange={(event) => field('contactName', event.target.value)} /></label>
      <label><span>Stage</span><select value={draft.stage} onChange={(event) => field('stage', event.target.value)}>{stages.map((stage) => <option key={stage.value} value={stage.value}>{stage.label}</option>)}</select></label>
      <label><span>Email</span><input type="email" value={draft.email} onChange={(event) => field('email', event.target.value)} /></label>
      <label><span>Phone</span><input type="tel" value={draft.phone} onChange={(event) => field('phone', event.target.value)} /></label>
      <label className="crm-wide"><span>Website</span><input inputMode="url" placeholder="example.com" value={draft.website} onChange={(event) => field('website', event.target.value)} /></label>
      <label><span>Project value</span><div className="crm-money-input"><i>$</i><input type="number" min="0" step="1" value={draft.projectValue || ''} onChange={(event) => field('projectValue', Number(event.target.value))} /></div></label>
      <label><span>Monthly recurring</span><div className="crm-money-input"><i>$</i><input type="number" min="0" step="1" value={draft.recurringRevenue || ''} onChange={(event) => field('recurringRevenue', Number(event.target.value))} /></div></label>
      <label><span>Revenue received</span><div className="crm-money-input"><i>$</i><input type="number" min="0" step="1" value={draft.revenueReceived || ''} onChange={(event) => field('revenueReceived', Number(event.target.value))} /></div></label>
      <label><span>Contract status</span><select value={draft.contractStatus} onChange={(event) => field('contractStatus', event.target.value)}>{contractStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
      <label className="crm-wide"><span>Prospect ID</span><input placeholder="Optional link to generated prospect" value={draft.sourceProspectId} onChange={(event) => field('sourceProspectId', event.target.value)} /></label>
      <label className="crm-wide"><span>Notes</span><textarea rows={6} value={draft.notes} onChange={(event) => field('notes', event.target.value)} placeholder="Next step, context, preferences…" /></label>
    </div>
    <div className="crm-form-actions"><button type="button" className="crm-button crm-button-muted" onClick={onCancel}>Cancel</button><button className="crm-button crm-button-primary" disabled={saving}>{saving ? 'Saving…' : initial ? 'Save changes' : 'Add record'} <span>↗</span></button></div>
  </form>;
}

function RecordDetail({ record, onEdit, onDelete, onUpload }: { record: CrmRecord; onEdit: () => void; onDelete: () => void; onUpload: (event: ChangeEvent<HTMLInputElement>) => Promise<void> }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const stage = stages.find((entry) => entry.value === record.stage)?.label || record.stage;
  return <aside className="crm-detail">
    <div className="crm-detail-head"><div><span className={`crm-stage crm-stage-${record.stage}`}>{stage}</span><h2>{record.company}</h2>{record.contactName && <p>{record.contactName}</p>}</div><button className="crm-button crm-button-muted" onClick={onEdit}>Edit</button></div>
    <div className="crm-contact-block">
      {record.email && <a href={`mailto:${record.email}`}><small>EMAIL</small><strong>{record.email}</strong><span>↗</span></a>}
      {record.phone && <a href={`tel:${record.phone}`}><small>PHONE</small><strong>{record.phone}</strong><span>↗</span></a>}
      {record.website && <a href={normalizeWebsite(record.website)} target="_blank" rel="noreferrer"><small>WEBSITE</small><strong>{hostLabel(record.website)}</strong><span>↗</span></a>}
    </div>
    <div className="crm-detail-section"><div className="crm-detail-title"><span>FINANCIALS</span></div><dl className="crm-financials"><div><dt>Project value</dt><dd>{money.format(record.projectValue)}</dd></div><div><dt>Monthly recurring</dt><dd>{money.format(record.recurringRevenue)}</dd></div><div><dt>Received</dt><dd>{money.format(record.revenueReceived)}</dd></div><div><dt>Outstanding</dt><dd>{money.format(Math.max(0, record.projectValue - record.revenueReceived))}</dd></div></dl></div>
    <div className="crm-detail-section"><div className="crm-detail-title"><span>CONTRACTS · {record.contractStatus.toUpperCase()}</span><button type="button" onClick={() => fileRef.current?.click()}>+ Add file</button><input ref={fileRef} hidden type="file" accept=".pdf,.doc,.docx,image/*" onChange={onUpload} /></div>
      {record.contracts.length ? <div className="crm-contracts">{record.contracts.map((contract) => <a key={contract.id} href={`/api/crm/contracts/${contract.path}`} target="_blank" rel="noreferrer"><span>DOC</span><div><strong>{contract.name}</strong><small>{shortDate.format(new Date(contract.uploadedAt))}</small></div><i>↗</i></a>)}</div> : <p className="crm-empty-copy">No signed documents attached.</p>}
    </div>
    {record.sourceProspectId && <div className="crm-detail-section"><div className="crm-detail-title"><span>PROSPECT</span></div><code>{record.sourceProspectId}</code></div>}
    <div className="crm-detail-section"><div className="crm-detail-title"><span>NOTES</span></div><p className="crm-notes">{record.notes || 'No notes yet.'}</p></div>
    <div className="crm-detail-footer"><span>Updated {shortDate.format(new Date(record.updatedAt))}</span><button onClick={onDelete}>Delete record</button></div>
  </aside>;
}

export default function Crm() {
  const [data, setData] = useState<CrmData | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<'new' | 'edit' | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'clients' | 'lost'>('all');
  const [message, setMessage] = useState('');

  async function load() {
    const response = await fetch('/api/crm', { cache: 'no-store' });
    if (!response.ok) throw new Error('Start the local CRM with npm run crm.');
    setData(await response.json() as CrmData);
  }
  useEffect(() => { load().catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Could not load CRM.')); }, []);

  const records = data?.records || noRecords;
  const selected = records.find((record) => record.id === selectedId) || null;
  const filtered = useMemo(() => records.filter((record) => {
    const textMatch = `${record.company} ${record.contactName} ${record.email} ${record.website}`.toLowerCase().includes(query.toLowerCase());
    const filterMatch = filter === 'all' || (filter === 'active' && !['won', 'lost'].includes(record.stage)) || (filter === 'clients' && record.stage === 'won') || (filter === 'lost' && record.stage === 'lost');
    return textMatch && filterMatch;
  }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [records, query, filter]);

  const clients = records.filter((record) => record.stage === 'won');
  const active = records.filter((record) => !['won', 'lost'].includes(record.stage));
  const pipeline = active.reduce((sum, record) => sum + record.projectValue, 0);
  const booked = clients.reduce((sum, record) => sum + record.projectValue, 0);
  const collected = records.reduce((sum, record) => sum + record.revenueReceived, 0);
  const monthly = clients.reduce((sum, record) => sum + record.recurringRevenue, 0);

  async function persist(nextRecords: CrmRecord[]) {
    const response = await fetch('/api/crm', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), records: nextRecords }) });
    const result = await response.json() as CrmData & { error?: string };
    if (!response.ok) throw new Error(result.error || 'Could not save CRM.');
    setData(result);
  }

  async function saveRecord(draft: RecordDraft) {
    const now = new Date().toISOString();
    if (selected && editing === 'edit') {
      const next = { ...selected, ...draft, updatedAt: now, convertedAt: draft.stage === 'won' ? selected.convertedAt || now : undefined };
      await persist(records.map((record) => record.id === selected.id ? next : record));
      setEditing(null);
      return;
    }
    const id = `crm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const record: CrmRecord = { ...draft, id, contracts: [], createdAt: now, updatedAt: now, convertedAt: draft.stage === 'won' ? now : undefined };
    await persist([record, ...records]);
    setSelectedId(id);
    setEditing(null);
  }

  async function deleteRecord() {
    if (!selected || !window.confirm(`Delete ${selected.company}? Attached files will remain on disk.`)) return;
    await persist(records.filter((record) => record.id !== selected.id));
    setSelectedId(null);
  }

  async function uploadContract(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !selected) return;
    if (file.size > 10 * 1024 * 1024) { setMessage('Contract files must be 10 MB or smaller.'); return; }
    const base64 = await new Promise<string>((resolveFile, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolveFile(String(reader.result).split(',')[1] || '');
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const response = await fetch('/api/crm/contracts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recordId: selected.id, fileName: file.name, mimeType: file.type, data: base64 }) });
    const result = await response.json() as { data?: CrmData; error?: string };
    if (!response.ok || !result.data) { setMessage(result.error || 'Upload failed.'); return; }
    setData(result.data);
    event.target.value = '';
  }

  async function importProspects() {
    const response = await fetch('/api/crm/import-prospects', { method: 'POST' });
    const result = await response.json() as { imported?: number; data?: CrmData; error?: string };
    if (!response.ok || !result.data) { setMessage(result.error || 'Could not import prospects.'); return; }
    setData(result.data);
    setMessage(result.imported ? `Imported ${result.imported} generated prospect${result.imported === 1 ? '' : 's'}.` : 'All generated prospects are already in the CRM.');
  }

  return <main className="crm-app">
    <header className="crm-topbar"><a href="/" className="crm-brand"><span>A</span><div><strong>ADERET</strong><small>RELATIONSHIPS</small></div></a><div className="crm-local"><i /> LOCAL · REPO-BACKED</div><button className="crm-button crm-button-primary" onClick={() => { setSelectedId(null); setEditing('new'); }}>+ Add relationship</button></header>
    {message && <button className="crm-message" onClick={() => setMessage('')}>{message}<span>×</span></button>}
    <section className="crm-shell">
      <div className="crm-heading"><div><p>BUSINESS CONTROL DESK</p><h1>Relationships,<br /><em>clearly tracked.</em></h1></div><span>{shortDate.format(new Date())}</span></div>
      <div className="crm-metrics"><Metric label="OPEN PIPELINE" value={money.format(pipeline)} detail={`${active.length} active relationship${active.length === 1 ? '' : 's'}`} /><Metric label="BOOKED REVENUE" value={money.format(booked)} detail={`${clients.length} converted client${clients.length === 1 ? '' : 's'}`} /><Metric label="COLLECTED" value={money.format(collected)} detail="Total revenue received" /><Metric label="MONTHLY RECURRING" value={money.format(monthly)} detail="Active client MRR" /></div>
      <section className="crm-register">
        <div className="crm-register-head"><div><p>RELATIONSHIP REGISTER</p><h2>Pipeline</h2></div><div className="crm-tools"><button className="crm-import" onClick={importProspects}>↳ Import prospects</button><label><span>⌕</span><input aria-label="Search relationships" placeholder="Search company or contact" value={query} onChange={(event) => setQuery(event.target.value)} /></label><div className="crm-filters">{(['all', 'active', 'clients', 'lost'] as const).map((value) => <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{value}</button>)}</div></div></div>
        <div className="crm-table-wrap"><table className="crm-table"><thead><tr><th>Company</th><th>Contact</th><th>Stage</th><th>Project</th><th>Received</th><th>Contract</th><th>Updated</th><th /></tr></thead><tbody>
          {filtered.map((record) => <tr key={record.id} className={selectedId === record.id ? 'selected' : ''} onClick={() => { setSelectedId(record.id); setEditing(null); }}><td><strong>{record.company}</strong>{record.website && <small>{hostLabel(record.website)}</small>}</td><td><span>{record.contactName || '—'}</span><small>{record.email}</small></td><td><span className={`crm-stage crm-stage-${record.stage}`}>{stages.find((entry) => entry.value === record.stage)?.label}</span></td><td>{money.format(record.projectValue)}</td><td>{money.format(record.revenueReceived)}</td><td><span className={`crm-contract-status crm-contract-${record.contractStatus}`}>{record.contractStatus}</span></td><td>{shortDate.format(new Date(record.updatedAt))}</td><td>→</td></tr>)}
        </tbody></table>{!filtered.length && <div className="crm-zero"><span>Ø</span><h3>{records.length ? 'No matching relationships.' : 'Your relationship register is empty.'}</h3><p>{records.length ? 'Try another search or filter.' : 'Add the first prospect, proposal, or client to get started.'}</p><button className="crm-button crm-button-primary" onClick={() => setEditing('new')}>Add the first record</button></div>}</div>
      </section>
    </section>
    {(editing || selected) && <div className="crm-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) { setEditing(null); setSelectedId(null); } }}><div className="crm-panel">{editing ? <RecordForm initial={editing === 'edit' ? selected || undefined : undefined} onCancel={() => setEditing(null)} onSave={saveRecord} /> : selected ? <RecordDetail record={selected} onEdit={() => setEditing('edit')} onDelete={deleteRecord} onUpload={uploadContract} /> : null}</div></div>}
  </main>;
}
