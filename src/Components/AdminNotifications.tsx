import React, { useEffect, useState } from 'react';
import { Dropdown, Badge, Spinner } from 'react-bootstrap';
import { Bell } from 'lucide-react';

interface NotificationItem {
  _id: string;
  type: string;
  uid?: string;
  email?: string;
  name?: string | null;
  createdAt: string;
  seen: boolean;
}

const AdminNotifications: React.FC = () => {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unseen, setUnseen] = useState(0);
  const [loading, setLoading] = useState(false);
  const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL ) || 'https://c-back-2.onrender.com';

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/admin/notifications?limit=20`);
      const data = await res.json();
      if (data.success) {
        setItems(data.data || []);
        setUnseen(data.unseenCount || 0);
      }
    } catch (_) {
      // no-op
    } finally {
      setLoading(false);
    }
  };

  const markSeen = async () => {
    try {
      await fetch(`${API_BASE_URL}/admin/notifications/mark-seen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      setUnseen(0);
      fetchNotifications();
    } catch (_) {}
  };

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <Dropdown align="end">
      <Dropdown.Toggle variant="light" id="admin-notifications" onClick={markSeen}>
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
          items.map((n) => (
            <Dropdown.Item key={n._id} className="py-2">
              {n.type === 'user_registered' ? (
                <div>
                  <div><strong>New user</strong> {n.email}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>{new Date(n.createdAt).toLocaleString()}</div>
                </div>
              ) : (
                <div>
                  <div>{n.type}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>{new Date(n.createdAt).toLocaleString()}</div>
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


