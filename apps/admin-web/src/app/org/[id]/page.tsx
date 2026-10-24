'use client';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api, getToken, Membership, Paginated, Vehicle } from '@/lib/api';

type Tab = 'members' | 'vehicles' | 'invitations';

export default function OrgAdminPage() {
  const { id: orgId } = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('members');
  const [members, setMembers] = useState<Paginated<Membership>>();
  const [vehicles, setVehicles] = useState<Paginated<Vehicle>>();
  const [invite, setInvite] = useState<{ code: string; role: string } | null>(null);
  const [inviteRole, setInviteRole] = useState('SECURITY_GUARD');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      if (tab === 'members') setMembers(await api.orgMembers(orgId));
      if (tab === 'vehicles') setVehicles(await api.orgVehicles(orgId));
    } catch (e) { setError((e as Error).message); }
  }, [tab, orgId]);

  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return; }
    void load();
  }, [load, router]);

  const decideMember = async (mid: string, action: 'approve' | 'reject' | 'remove') => {
    await api.decideMembership(orgId, mid, action);
    await load();
  };
  const decideVehicle = async (vid: string, action: 'approve' | 'reject' | 'deactivate') => {
    await api.decideVehicle(vid, action);
    await load();
  };
  const makeInvite = async () => {
    const inv = await api.createInvitation(orgId, inviteRole);
    setInvite({ code: inv.code, role: inviteRole });
  };

  return (
    <>
      <h2>Organization management</h2>
      <nav className="tabs">
        {(['members', 'vehicles', 'invitations'] as Tab[]).map((t) => (
          <a key={t} href="#" className={tab === t ? 'active' : ''}
             onClick={(e) => { e.preventDefault(); setTab(t); }}>
            {t[0].toUpperCase() + t.slice(1)}
          </a>
        ))}
      </nav>
      {error && <p className="error">{error}</p>}

      {tab === 'members' && (
        <div className="card">
          <table>
            <thead><tr><th>Member</th><th>Phone</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {members?.items.map((m) => (
                <tr key={m.id}>
                  <td>{m.user.fullName ?? '—'}</td>
                  <td>{m.user.phone}</td>
                  <td>{m.role}</td>
                  <td><span className={`badge ${m.status}`}>{m.status}</span></td>
                  <td className="row">
                    {m.status === 'PENDING' && <>
                      <button className="btn" onClick={() => decideMember(m.id, 'approve')}>Approve</button>
                      <button className="btn secondary" onClick={() => decideMember(m.id, 'reject')}>Reject</button>
                    </>}
                    {m.status === 'APPROVED' && m.role !== 'ORGANIZATION_OWNER' && (
                      <button className="btn danger" onClick={() => decideMember(m.id, 'remove')}>Remove</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'vehicles' && (
        <div className="card">
          <table>
            <thead><tr><th>Reg. number</th><th>Type</th><th>Owner</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {vehicles?.items.map((v) => (
                <tr key={v.id}>
                  <td>{v.registrationNumber}</td>
                  <td>{v.vehicleType}</td>
                  <td>{v.memberships[0]?.user?.fullName ?? '—'}</td>
                  <td><span className={`badge ${v.status}`}>{v.status}</span></td>
                  <td className="row">
                    {v.status === 'PENDING_APPROVAL' && <>
                      <button className="btn" onClick={() => decideVehicle(v.id, 'approve')}>Approve</button>
                      <button className="btn secondary" onClick={() => decideVehicle(v.id, 'reject')}>Reject</button>
                    </>}
                    {v.status === 'ACTIVE' && <button className="btn danger" onClick={() => decideVehicle(v.id, 'deactivate')}>Deactivate</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'invitations' && (
        <div className="card">
          <p className="muted">Create a single-purpose invitation code for a staff role.</p>
          <div className="row">
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} style={{ width: 240 }}>
              <option value="SECURITY_GUARD">Security guard</option>
              <option value="ORGANIZATION_ADMIN">Organization admin</option>
              <option value="VEHICLE_OWNER">Resident / vehicle owner</option>
            </select>
            <button className="btn" onClick={makeInvite}>Generate code</button>
          </div>
          {invite && (
            <p>Invitation code for <strong>{invite.role}</strong>: <code>{invite.code}</code></p>
          )}
        </div>
      )}
    </>
  );
}
