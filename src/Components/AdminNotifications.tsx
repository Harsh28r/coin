import React, { useEffect, useState } from 'react';
import { Dropdown, Badge, Spinner } from 'react-bootstrap';
import { Bell } from 'lucide-react';

interface NotificationItem {
  _id: string;
  type: string;
  uid?: string;
  email?: string;
  name?: string | null;
  ip?: string;
  country?: string;
  createdAt: string;
  seen: boolean;
}

const AdminNotifications: React.FC = () => {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unseen, setUnseen] = useState(0);
  const [loading, setLoading] = useState(false);
  const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL) || 'https://c-back-seven.vercel.app';
  const getBases = (): string[] => {
    const list: string[] = [];
    const env = (process.env.REACT_APP_API_BASE_URL) || '';
    if (env) list.push(env);
    if (typeof window !== 'undefined') {
      list.push(window.location.origin);
      list.push(`${window.location.origin}/api`);
    }
    list.push('http://localhost:5000');
    return Array.from(new Set(list.filter(Boolean)));
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      let payload: any[] | null = null;
      for (const base of getBases()) {
        try {
          const res = await fetch(`${base}/admin/user-events?limit=50`);
          if (!res.ok) continue;
          const data = await res.json();
          const items = Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data)
              ? data
              : Array.isArray((data as any)?.items)
                ? (data as any).items
                : null;
          if (Array.isArray(items)) {
            const onlyAuth = items.filter((e: any) => e.type === 'user_registered' || e.type === 'user_login');
            payload = onlyAuth;
            break;
          }
        } catch {}
      }
      if (Array.isArray(payload)) {
        setItems(payload);
        try {
          const key = 'admin_bell_last_open';
          const last = localStorage.getItem(key);
          if (last) {
            const lastTs = new Date(last).getTime();
            const count = payload.filter((e: any) => new Date(e.createdAt).getTime() > lastTs).length;
            setUnseen(count);
          } else {
            setUnseen(payload.length);
          }
        } catch {}
      } else {
        setItems([]);
        setUnseen(0);
      }
    } catch (_) {
      // no-op
    } finally {
      setLoading(false);
    }
  };

  const markSeen = async () => {
    try {
      localStorage.setItem('admin_bell_last_open', new Date().toISOString());
    } catch {}
    setUnseen(0);
  };

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <Dropdown align="end" onToggle={(isOpen) => { if (isOpen) { fetchNotifications(); markSeen(); } }}>
      <Dropdown.Toggle variant="light" id="admin-notifications">
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <Bell size={20} />
          {unseen > 0 && (
            <Badge bg="danger" pill style={{ position: 'absolute', top: -6, right: -6, fontSize: 10 }}>
              {unseen}
            </Badge>
          )}
        </div>
      </Dropdown.Toggle>
      <Dropdown.Menu style={{ minWidth: 320 }}>
        <div className="px-3 py-2 d-flex justify-content-between align-items-center">
          <strong>Notifications</strong>
          {loading && <Spinner animation="border" size="sm" />}
        </div>
        <Dropdown.Divider />
        {items.length === 0 ? (
          <div className="px-3 py-2 text-muted">No notifications</div>
        ) : (
          items.slice(0, 10).map((n) => (
            <Dropdown.Item key={n._id} className="py-2">
              {n.type === 'user_registered' ? (
                <div>
                  <div><strong>New user</strong> {n.email}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>{new Date(n.createdAt).toLocaleString()}</div>
                  {(n.ip || n.country) && <div className="text-muted" style={{ fontSize: 12 }}>IP: {n.ip || '-'}{n.country ? ` · ${n.country}` : ''}</div>}
                </div>
              ) : n.type === 'user_login' ? (
                <div>
                  <div><strong>User login</strong> {n.email}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>{new Date(n.createdAt).toLocaleString()}</div>
                  {(n.ip || n.country) && <div className="text-muted" style={{ fontSize: 12 }}>IP: {n.ip || '-'}{n.country ? ` · ${n.country}` : ''}</div>}
                </div>
              ) : (
                <div>
                  <div>{n.type}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>{new Date(n.createdAt).toLocaleString()}</div>
                  {(n.ip || n.country) && <div className="text-muted" style={{ fontSize: 12 }}>IP: {n.ip || '-'}{n.country ? ` · ${n.country}` : ''}</div>}
                </div>
              )}
            </Dropdown.Item>
          ))
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default AdminNotifications;


