'use client';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AbuseReport, api, AuditLog, getToken, OrgSummary, Paginated } from '@/lib/api';

type Tab = 'pending' | 'organizations' | 'abuse' | 'audit';

export default function PlatformPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('pending');
  const [pending, setPending] = useState<Paginated<OrgSummary>>();
  const [orgs, setOrgs] = useState<Paginated<OrgSummary>>();
  const [abuse, setAbuse] = useState<Paginated<AbuseReport>>();
  const [audit, setAudit] = useState<Paginated<AuditLog>>();
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      if (tab === 'pending') setPending(await api.pendingOrgs());
      if (tab === 'organizations') setOrgs(await api.adminOrgs());
      if (tab === 'abuse') setAbuse(await api.abuseReports());
      if (tab === 'audit') setAudit(await api.auditLogs());
    } catch (e) {
      setError((e as Error).message);
    }
  }, [tab]);

  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return; }
    void load();
  }, [load, router]);

  const decide = async (id: string, action: 'approve' | 'reject' | 'suspend' | 'reinstate') => {
    const notes = action === 'reject' ? window.prompt('Rejection reason (optional):') ?? undefined : undefined;
    await api.decideOrg(id, action, notes);
    await load();
  };

  return (
    <>
      <h2>Platform administration</h2>
      <nav className="tabs">
        {(['pending', 'organizations', 'abuse', 'audit'] as Tab[]).map((t) => (
          <a key={t} href="#" className={tab === t ? 'active' : ''}
             onClick={(e) => { e.preventDefault(); setTab(t); }}>
            {t === 'pending' ? 'Review queue' : t === 'organizations' ? 'All organizations' : t === 'abuse' ? 'Abuse reports' : 'Audit logs'}
          </a>
        ))}
      </nav>
      {error && <p className="error">{error}</p>}

      {(tab === 'pending' || tab === 'organizations') && (
        <div className="card">
          <table>
            <thead><tr><th>Name</th><th>Type</th><th>City</th><th>Status</th><th>Docs</th><th>Actions</th></tr></thead>
            <tbody>
              {(tab === 'pending' ? pending?.items : orgs?.items)?.map((o) => (
                <tr key={o.id}>
                  <td>{o.name}</td>
                  <td>{o.type}</td>
                  <td>{o.city}, {o.state}</td>
                  <td><span className={`badge ${o.status}`}>{o.status}</span></td>
                  <td>{o.documents?.length ?? 0}</td>
                  <td className="row">
                    {o.status !== 'APPROVED' && <button className="btn" onClick={() => decide(o.id, 'approve')}>Approve</button>}
                    {o.status !== 'REJECTED' && <button className="btn secondary" onClick={() => decide(o.id, 'reject')}>Reject</button>}
                    {o.status === 'APPROVED' && <button className="btn danger" onClick={() => decide(o.id, 'suspend')}>Suspend</button>}
                    {o.status === 'SUSPENDED' && <button className="btn" onClick={() => decide(o.id, 'reinstate')}>Reinstate</button>}
                  </td>
                </tr>
              ))}
              {(tab === 'pending' ? pending : orgs)?.items.length === 0 && (
                <tr><td colSpan={6} className="muted">Nothing here.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'abuse' && (
        <div className="card">
          <table>
            <thead><tr><th>Reason</th><th>Status</th><th>Reported</th></tr></thead>
            <tbody>
              {abuse?.items.map((r) => (
                <tr key={r.id}><td>{r.reason}</td><td><span className={`badge ${r.status}`}>{r.status}</span></td><td>{new Date(r.createdAt).toLocaleString()}</td></tr>
              ))}
              {abuse?.items.length === 0 && <tr><td colSpan={3} className="muted">No reports.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'audit' && (
        <div className="card">
          <table>
            <thead><tr><th>Action</th><th>Resource</th><th>Actor</th><th>Time</th></tr></thead>
            <tbody>
              {audit?.items.map((l) => (
                <tr key={l.id}><td>{l.action}</td><td>{l.resourceType}</td><td className="muted">{l.actorId?.slice(0, 8)}…</td><td>{new Date(l.createdAt).toLocaleString()}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
