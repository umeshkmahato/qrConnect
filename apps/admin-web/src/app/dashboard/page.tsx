'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, getToken, setToken } from '@/lib/api';

export default function Dashboard() {
  const router = useRouter();
  const [me, setMe] = useState<{ id: string; platformRole: string | null } | null>(null);
  const [orgs, setOrgs] = useState<{ org: { id: string; name: string; status: string }; role: string; status: string }[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return; }
    Promise.all([api.me(), api.myOrgs()])
      .then(([m, o]) => { setMe(m); setOrgs(o); })
      .catch((e) => setError(e.message));
  }, [router]);

  const logout = () => { setToken(null); router.replace('/login'); };

  if (error) return <p className="error">{error}</p>;
  if (!me) return <p className="muted">Loading…</p>;

  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2>Dashboard</h2>
        <button className="btn secondary" onClick={logout}>Sign out</button>
      </div>
      {me.platformRole === 'PLATFORM_SUPER_ADMIN' && (
        <div className="card">
          <h3>Platform administration</h3>
          <Link href="/platform">Organization review queue, abuse reports, audit logs →</Link>
        </div>
      )}
      <div className="card">
        <h3>My organizations</h3>
        {orgs.length === 0 && <p className="muted">No organization memberships.</p>}
        <table>
          <thead><tr><th>Organization</th><th>Status</th><th>My role</th><th>Membership</th><th /></tr></thead>
          <tbody>
            {orgs.map((m) => (
              <tr key={m.org.id}>
                <td>{m.org.name}</td>
                <td><span className={`badge ${m.org.status}`}>{m.org.status}</span></td>
                <td>{m.role}</td>
                <td>{m.status}</td>
                <td>
                  {m.status === 'APPROVED' && ['ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN'].includes(m.role) && (
                    <Link href={`/org/${m.org.id}`}>Manage →</Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
