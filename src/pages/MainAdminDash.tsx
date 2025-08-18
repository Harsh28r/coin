import React, { useState } from 'react';
import {
  Container, Row, Col, Nav, Navbar, Card, Button, Form, ListGroup, Badge,
  ProgressBar, Dropdown, Table, Modal, Pagination
} from 'react-bootstrap';
import { BarChart2, Users, FileText, Settings, Bell, User, Search, Plus, BookOpen, Mail, Activity, Send } from 'lucide-react';
import 'bootstrap/dist/css/bootstrap.min.css';
import BlogPost from '../Components/BlogPost';
import { useBlog } from '../context/BlogContext';
import { BlogPost as BlogPostType } from '../types/blog';
import BlogForm from '../Components/BlogForm';
import NewsletterAdmin from '../Components/NewsletterAdmin';
// Single API base (admin side) with multi-base fallback
const API_BASE_URL: string = (process.env.REACT_APP_API_BASE_URL) || 'https://c-back-2.onrender.com';
const getAdminApiBases = (): string[] => {
  const bases: string[] = [];
  const env = (process.env.REACT_APP_API_BASE_URL ) || '';
  if (env) bases.push(env);
  if (typeof window !== 'undefined') {
    bases.push(window.location.origin);
    bases.push(`${window.location.origin}/api`);
  }
  bases.push('http://localhost:5000');
  return Array.from(new Set(bases.filter(Boolean)));
};
const fetchJson = async (path: string, init?: RequestInit): Promise<any> => {
  let lastErr: any;
  for (const base of getAdminApiBases()) {
    try {
      const res = await fetch(`${base}${path}`, init);
      const data = await safeJson(res);
      try { (window as any).__adminOkBase = base; } catch {}
      return data;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
};
// Shared JSON helper
const safeJson = async <T = any>(res: Response): Promise<T> => {
  const contentType = res.headers.get('content-type') || '';
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    throw new Error(`Expected JSON, got: ${text.slice(0, 160)}`);
  }
  return res.json();
};
// Inline admin notifications to avoid module resolution issues
const AdminNotifications: React.FC = () => {
  const [items, setItems] = React.useState<Array<{ _id: string; type: string; email?: string; ip?: string; country?: string; createdAt: string; seen: boolean }>>([]);
  const [unseen, setUnseen] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await fetchJson(`/admin/user-events?limit=50`);
      if (data?.success) {
        const onlyAuth = (data.data || []).filter((e: any) => e.type === 'user_registered' || e.type === 'user_login');
        setItems(onlyAuth);
        try {
          const key = 'admin_bell_last_open';
          const last = localStorage.getItem(key);
          if (last) {
            const lastTs = new Date(last).getTime();
            const count = onlyAuth.filter((e: any) => new Date(e.createdAt).getTime() > lastTs).length;
            setUnseen(count);
          } else {
            setUnseen(onlyAuth.length);
          }
        } catch {}
      }
    } catch (_) {
      // no-op
    } finally {
      setLoading(false);
    }
  };

  const markSeen = () => {
    try { localStorage.setItem('admin_bell_last_open', new Date().toISOString()); } catch {}
    setUnseen(0);
  };

  React.useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <Dropdown align="end" onToggle={(isOpen) => {
      setOpen(!!isOpen);
      if (isOpen) {
        fetchNotifications();
        markSeen();
      }
    }}>
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
          {loading && <span className="spinner-border spinner-border-sm" role="status" />}
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

const MainDashboard: React.FC = () => {
  const { posts, addPost, updatePost, deletePost } = useBlog();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPostType | null>(null);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleSubmit = async (formData: Omit<BlogPostType, 'id'>) => {
    try {
      if (editingPost) {
        await updatePost({ ...editingPost, ...formData } as BlogPostType);
      } else {
        await addPost({ ...formData, date: new Date().toISOString() });
      }
      setShowModal(false);
      setEditingPost(null);
    } catch (err) {
      console.error('Error saving post:', err);
    }
  };

  const handleEdit = (post: BlogPostType) => {
    setEditingPost(post);
    setShowModal(true);
  };

  const handleCancel = () => {
    setShowModal(false);
    setEditingPost(null);
  };

  const handleCreateNewPost = () => {
    setEditingPost(null);
    setShowModal(true);
  };
  // Social posting section
  const SocialSection: React.FC = () => {
    const [text, setText] = React.useState('');
    const [imageUrl, setImageUrl] = React.useState('');
    const [toX, setToX] = React.useState(true);
    const [toIG, setToIG] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [result, setResult] = React.useState<any>(null);
    const [error, setError] = React.useState<string | null>(null);

    const postSocial = async () => {
      const payload = { text, imageUrl, platforms: { x: toX, instagram: toIG } };
      return fetchJson(`/admin/social/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setResult(null);
      if (!text.trim()) { setError('Post text is required'); return; }
      if (toIG && !imageUrl.trim()) { setError('Instagram requires an image URL'); return; }
      try {
        setLoading(true);
        const data = await postSocial();
        if (!data?.success) throw new Error(data?.message || 'Failed to post');
        setResult(data.results);
        setText('');
        setImageUrl('');
      } catch (err: any) {
        setError(err.message || 'Failed to post');
      } finally {
        setLoading(false);
      }
    };

    const chars = text.length;
    const xWarn = chars > 280 && toX;

    return (
      <div className="p-3">
        <h4 className="mb-3">Social Posting</h4>
        {error && <div className="alert alert-danger">{error}</div>}
        {result && (
          <div className="alert alert-success">
            <div className="mb-1"><strong>Posted:</strong></div>
            <div className="small">X: {result?.x?.success ? `ok (id: ${result?.x?.id || 'n/a'})` : `fail (${result?.x?.error || 'n/a'})`}</div>
            <div className="small">Instagram: {result?.instagram?.success ? `ok (id: ${result?.instagram?.id || 'n/a'})` : `fail (${result?.instagram?.error || 'n/a'})`}</div>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Post Text</label>
            <textarea className="form-control" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="What's happening?" />
            <div className="form-text">Chars: {chars}{xWarn ? ' (X may truncate)' : ''}</div>
          </div>
          <div className="mb-3">
            <label className="form-label">Image URL (optional, required for Instagram)</label>
            <input className="form-control" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="mb-3 d-flex gap-3 align-items-center">
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="post-x" checked={toX} onChange={(e) => setToX(e.target.checked)} />
              <label className="form-check-label" htmlFor="post-x">Post to X (Twitter)</label>
            </div>
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="post-ig" checked={toIG} onChange={(e) => setToIG(e.target.checked)} />
              <label className="form-check-label" htmlFor="post-ig">Post to Instagram</label>
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? <span className="spinner-border spinner-border-sm me-2" role="status" /> : <Send size={16} className="me-2" />}Post
          </button>
        </form>
      </div>
    );
  };

  const UsersSection: React.FC = () => {
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [stats, setStats] = React.useState<any>(null);
    const [users, setUsers] = React.useState<any[]>([]);
    const [events, setEvents] = React.useState<any[]>([]);
    const [search, setSearch] = React.useState('');
    const [country, setCountry] = React.useState('all');
    const [registeredOnly, setRegisteredOnly] = React.useState(false);
    const [minLogins, setMinLogins] = React.useState<string>('');
    const [minVisits, setMinVisits] = React.useState<string>('');
    const [dateFrom, setDateFrom] = React.useState<string>('');
    const [dateTo, setDateTo] = React.useState<string>('');
    const [sortKey, setSortKey] = React.useState<string>('lastSeen');
    const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('desc');
    const [page, setPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(10);

    const [eventType, setEventType] = React.useState('all');
    const [eventSearch, setEventSearch] = React.useState('');
    const [eventPage, setEventPage] = React.useState(1);
    const [eventPageSize, setEventPageSize] = React.useState(10);

    type StatsRes = { success: boolean; data: any; message?: string };
    type UsersRes = { success: boolean; data: any[]; message?: string };
    type EventsRes = { success: boolean; data: Array<{ _id: string; type: string; email?: string; ip?: string; createdAt: string }>; message?: string };

    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);
        const [s, u, e]: [StatsRes, UsersRes, EventsRes] = await Promise.all([
          fetchJson(`/admin/user-stats`),
          fetchJson(`/admin/users`),
          fetchJson(`/admin/user-events?limit=50`),
        ]);
        if (!s.success) throw new Error(s.message || 'Stats failed');
        if (!u.success) throw new Error(u.message || 'Users failed');
        if (!e.success) throw new Error(e.message || 'Events failed');
        setStats(s.data);
        setUsers(u.data);
        setEvents(e.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load user analytics');
      } finally {
        setLoading(false);
      }
    };

    React.useEffect(() => {
      fetchAll();
    }, []);

    // Derived country options
    const countryOptions = React.useMemo(() => {
      const set = new Set<string>();
      users.forEach(u => { if (u.country) set.add(String(u.country)); });
      return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [users]);

    // Filtering and sorting
    const filteredUsers = React.useMemo(() => {
      let list = users.slice();
      const s = search.trim().toLowerCase();
      if (s) {
        list = list.filter(u => (u.email || '').toLowerCase().includes(s) || (u.name || '').toLowerCase().includes(s));
      }
      if (country !== 'all') {
        list = list.filter(u => String(u.country || '') === country);
      }
      if (registeredOnly) {
        list = list.filter(u => Number(u.registerCount || 0) > 0);
      }
      const minL = Number(minLogins);
      if (!Number.isNaN(minL) && minLogins !== '') list = list.filter(u => Number(u.loginCount || 0) >= minL);
      const minV = Number(minVisits);
      if (!Number.isNaN(minV) && minVisits !== '') list = list.filter(u => Number(u.visitCount || 0) >= minV);
      if (dateFrom) {
        const fromTs = new Date(dateFrom).getTime();
        list = list.filter(u => new Date(u.lastSeen).getTime() >= fromTs);
      }
      if (dateTo) {
        const toTs = new Date(dateTo).getTime();
        list = list.filter(u => new Date(u.lastSeen).getTime() <= toTs + 24*60*60*1000 - 1);
      }

      list.sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1;
        switch (sortKey) {
          case 'email': return String(a.email || '').localeCompare(String(b.email || '')) * dir;
          case 'name': return String(a.name || '').localeCompare(String(b.name || '')) * dir;
          case 'country': return String(a.country || '').localeCompare(String(b.country || '')) * dir;
          case 'loginCount': return (Number(a.loginCount || 0) - Number(b.loginCount || 0)) * dir;
          case 'registerCount': return (Number(a.registerCount || 0) - Number(b.registerCount || 0)) * dir;
          case 'visitCount': return (Number(a.visitCount || 0) - Number(b.visitCount || 0)) * dir;
          case 'lastSeen':
          default:
            return (new Date(a.lastSeen).getTime() - new Date(b.lastSeen).getTime()) * dir;
        }
      });
      return list;
    }, [users, search, country, registeredOnly, minLogins, minVisits, dateFrom, dateTo, sortKey, sortDir]);

    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const pagedUsers = React.useMemo(() => {
      const start = (currentPage - 1) * pageSize;
      return filteredUsers.slice(start, start + pageSize);
    }, [filteredUsers, currentPage, pageSize]);

    const resetFilters = () => {
      setSearch('');
      setCountry('all');
      setRegisteredOnly(false);
      setMinLogins('');
      setMinVisits('');
      setDateFrom('');
      setDateTo('');
      setSortKey('lastSeen');
      setSortDir('desc');
      setPage(1);
    };

    const toggleSort = (key: string) => {
      if (sortKey === key) {
        setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
      } else {
        setSortKey(key);
        setSortDir('asc');
      }
    };

    const exportCsv = () => {
      const headers = ['Email','Name','Country','Last Seen','Logins','Registered','Visits'];
      const rows = filteredUsers.map(u => [
        u.email || '-',
        u.name || '-',
        u.country || '-',
        new Date(u.lastSeen).toISOString(),
        String(u.loginCount ?? 0),
        String(u.registerCount ?? 0),
        String(u.visitCount ?? 0)
      ]);
      const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    };

    const filteredEvents = React.useMemo(() => {
      const s = eventSearch.trim().toLowerCase();
      return events.filter(ev => (
        (eventType === 'all' || ev.type === eventType) &&
        (!s || (String(ev.email || '').toLowerCase().includes(s) || String(ev.type || '').toLowerCase().includes(s)))
      ));
    }, [events, eventType, eventSearch]);

    const totalEventPages = Math.max(1, Math.ceil(filteredEvents.length / eventPageSize));
    const currentEventPage = Math.min(eventPage, totalEventPages);
    const pagedEvents = React.useMemo(() => {
      const start = (currentEventPage - 1) * eventPageSize;
      return filteredEvents.slice(start, start + eventPageSize);
    }, [filteredEvents, currentEventPage, eventPageSize]);

    return (
      <div className="p-3">
        <h4 className="mb-3">User Analytics</h4>
        {error && <div className="alert alert-danger">{error}</div>}
        {/* Filters */}
        <div className="card mb-3">
          <div className="card-body">
            <div className="row g-3 align-items-end">
              <div className="col-md-3">
                <label className="form-label">Search</label>
                <Form.Control placeholder="email or name" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
              </div>
              <div className="col-md-2">
                <label className="form-label">Country</label>
                <Form.Select value={country} onChange={(e) => { setCountry(e.target.value); setPage(1); }}>
                  <option value="all">All</option>
                  {countryOptions.map(c => (<option key={c} value={c}>{c}</option>))}
                </Form.Select>
              </div>
              <div className="col-md-2">
                <label className="form-label">Min Logins</label>
                <Form.Control type="number" min={0} value={minLogins} onChange={(e) => { setMinLogins(e.target.value); setPage(1); }} />
              </div>
              <div className="col-md-2">
                <label className="form-label">Min Visits</label>
                <Form.Control type="number" min={0} value={minVisits} onChange={(e) => { setMinVisits(e.target.value); setPage(1); }} />
              </div>
              <div className="col-md-3">
                <div className="form-check mt-4">
                  <input className="form-check-input" type="checkbox" id="registered-only" checked={registeredOnly} onChange={(e) => { setRegisteredOnly(e.target.checked); setPage(1); }} />
                  <label className="form-check-label" htmlFor="registered-only">Registered users only</label>
                </div>
              </div>
              <div className="col-md-2">
                <label className="form-label">From</label>
                <Form.Control type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
              </div>
              <div className="col-md-2">
                <label className="form-label">To</label>
                <Form.Control type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
              </div>
              <div className="col-md-2">
                <label className="form-label">Page Size</label>
                <Form.Select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
                  {[10, 25, 50, 100].map(n => (<option key={n} value={n}>{n}</option>))}
                </Form.Select>
              </div>
              <div className="col-md-6 text-end">
                <Button variant="outline-secondary" className="me-2" onClick={resetFilters}>Clear</Button>
                <Button variant="outline-primary" className="me-2" onClick={fetchAll} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</Button>
                <Button variant="outline-success" onClick={exportCsv}>Export CSV</Button>
              </div>
            </div>
          </div>
        </div>
        <div className="row g-3 mb-3">
          <div className="col-md-3"><div className="card"><div className="card-body"><div className="text-muted">Total Visits</div><div className="h4 mb-0">{stats?.totalVisits ?? '-'}</div></div></div></div>
          <div className="col-md-3"><div className="card"><div className="card-body"><div className="text-muted">Visits (24h)</div><div className="h4 mb-0">{stats?.visits24h ?? '-'}</div></div></div></div>
          <div className="col-md-3"><div className="card"><div className="card-body"><div className="text-muted">Logins</div><div className="h4 mb-0">{stats?.totalLogins ?? '-'}</div></div></div></div>
          <div className="col-md-3"><div className="card"><div className="card-body"><div className="text-muted">Registered</div><div className="h4 mb-0">{stats?.totalRegistered ?? '-'}</div></div></div></div>
        </div>
        <div className="row g-3">
          <div className="col-lg-7">
            <div className="card h-100">
              <div className="card-header d-flex justify-content-between align-items-center"><strong>Users</strong><div className="small text-muted">{filteredUsers.length} results</div></div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table mb-0">
                    <thead>
                      <tr>
                        <th role="button" onClick={() => toggleSort('email')}>Email {sortKey==='email' ? (sortDir==='asc'?'▲':'▼') : ''}</th>
                        <th role="button" onClick={() => toggleSort('name')}>Name {sortKey==='name' ? (sortDir==='asc'?'▲':'▼') : ''}</th>
                        <th role="button" onClick={() => toggleSort('country')}>Country {sortKey==='country' ? (sortDir==='asc'?'▲':'▼') : ''}</th>
                        <th role="button" onClick={() => toggleSort('lastSeen')}>Last Seen {sortKey==='lastSeen' ? (sortDir==='asc'?'▲':'▼') : ''}</th>
                        <th role="button" onClick={() => toggleSort('loginCount')}>Logins {sortKey==='loginCount' ? (sortDir==='asc'?'▲':'▼') : ''}</th>
                        <th role="button" onClick={() => toggleSort('registerCount')}>Registered {sortKey==='registerCount' ? (sortDir==='asc'?'▲':'▼') : ''}</th>
                        <th role="button" onClick={() => toggleSort('visitCount')}>Visits {sortKey==='visitCount' ? (sortDir==='asc'?'▲':'▼') : ''}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedUsers.map(u => (
                        <tr key={`${u.uid || ''}-${u.email || ''}`}>
                          <td>{u.email || '-'}</td>
                          <td>{u.name || '-'}</td>
                          <td>{u.country || '-'}</td>
                          <td>{new Date(u.lastSeen).toLocaleString()}</td>
                          <td>{u.loginCount}</td>
                          <td>{u.registerCount}</td>
                          <td>{u.visitCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="d-flex justify-content-between align-items-center p-2">
                  <div className="text-muted small">Page {currentPage} of {totalPages}</div>
                  <Pagination className="mb-0">
                    <Pagination.First onClick={() => setPage(1)} disabled={currentPage===1} />
                    <Pagination.Prev onClick={() => setPage(Math.max(1, currentPage-1))} disabled={currentPage===1} />
                    <Pagination.Item active>{currentPage}</Pagination.Item>
                    <Pagination.Next onClick={() => setPage(Math.min(totalPages, currentPage+1))} disabled={currentPage===totalPages} />
                    <Pagination.Last onClick={() => setPage(totalPages)} disabled={currentPage===totalPages} />
                  </Pagination>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-5">
            <div className="card h-100">
              <div className="card-header">
                <div className="d-flex justify-content-between align-items-center">
                  <strong>Recent Events</strong>
                  <div className="d-flex gap-2">
                    <Form.Select size="sm" value={eventType} onChange={(e) => setEventType(e.target.value)}>
                      <option value="all">All</option>
                      <option value="user_registered">user_registered</option>
                      <option value="user_login">user_login</option>
                      <option value="visit">visit</option>
                    </Form.Select>
                    <Form.Control size="sm" placeholder="Search" value={eventSearch} onChange={(e) => { setEventSearch(e.target.value); setEventPage(1); }} />
                    <Form.Select size="sm" value={eventPageSize} onChange={(e) => { setEventPageSize(Number(e.target.value)); setEventPage(1); }}>
                      {[10, 25, 50].map(n => (<option key={n} value={n}>{n}/page</option>))}
                    </Form.Select>
                  </div>
                </div>
              </div>
              <div className="card-body p-0">
                <div className="list-group list-group-flush">
                  {pagedEvents.map(ev => (
                    <div key={ev._id} className="list-group-item">
                      <div className="d-flex justify-content-between">
                        <div><strong>{ev.type}</strong> {ev.email || ''}</div>
                        <div className="text-muted" style={{ fontSize: 12 }}>{new Date(ev.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="text-muted" style={{ fontSize: 12 }}>{ev.path || ''}{ev.ip ? ` · IP: ${ev.ip}` : ''}</div>
                    </div>
                  ))}
                </div>
                <div className="d-flex justify-content-between align-items-center p-2">
                  <div className="text-muted small">Page {currentEventPage} of {totalEventPages}</div>
                  <Pagination className="mb-0">
                    <Pagination.First onClick={() => setEventPage(1)} disabled={currentEventPage===1} />
                    <Pagination.Prev onClick={() => setEventPage(Math.max(1, currentEventPage-1))} disabled={currentEventPage===1} />
                    <Pagination.Item active>{currentEventPage}</Pagination.Item>
                    <Pagination.Next onClick={() => setEventPage(Math.min(totalEventPages, currentEventPage+1))} disabled={currentEventPage===totalEventPages} />
                    <Pagination.Last onClick={() => setEventPage(totalEventPages)} disabled={currentEventPage===totalEventPages} />
                  </Pagination>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  const renderContent = () => {
    switch (activeSection) {
      case 'social':
        return <SocialSection />;
      case 'users':
        return <UsersSection />;
      case 'newsletter':
        return <NewsletterAdmin />;
      case 'blog':
        return (
          <>
            <Button 
              variant="dark"
              onClick={handleCreateNewPost} 
              style={{ position: 'absolute', top: '10px', right: '10px', color: 'white' }}
            >
              Create New Post
            </Button>

            <Row xs={1} md={2} lg={3} className="g-4">
              {posts.map((post, index) => (
                <Col key={post._id || index}>
                  <Card style={{ height: '100%' }}>
                    <Card.Body>
                      <BlogPost 
                        post={post} 
                        isAdmin={true}
                        onEdit={async (post: BlogPostType) => {
                          handleEdit(post);
                          return { success: true, message: 'Edit mode activated' };
                        }}
                        onDelete={async (id: string) => {
                          if (post._id) {
                            console.log('Attempting to delete post with ID:', post._id);
                            try {
                              const result = await deletePost(post._id);
                              return result;
                            } catch (error) {
                              return { success: false, message: 'Failed to delete post' };
                            }
                          } else {
                            console.error('Post ID is undefined for post:', post);
                            return { success: false, message: 'Post ID not found' };
                          }
                        }}
                      />
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>

            <Modal show={showModal} onHide={handleCancel} size="lg">
              <Modal.Header closeButton>
                <Modal.Title>{editingPost ? 'Edit Post' : 'Create New Post'}</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {/* Assuming you have a BlogForm component for creating/editing posts */}
                <BlogForm 
                  post={editingPost || undefined} 
                  onSubmit={handleSubmit} 
                  onCancel={handleCancel}
                />
              </Modal.Body>
            </Modal>
          </>
        );
      default:
        return (
          <>
            <Row className="mb-4">
              <Col md={3}>
                <Card className="shadow-sm">
                  <Card.Body>
                    <h5 className="mb-2">Total Users</h5>
                    <h2>1,234</h2>
                    <ProgressBar now={70} label={`${70}%`} className="mt-2" />
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="shadow-sm">
                  <Card.Body>
                    <h5 className="mb-2">Total Posts</h5>
                    <h2>567</h2>
                    <ProgressBar now={50} label={`${50}%`} className="mt-2" />
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="shadow-sm">
                  <Card.Body>
                    <h5 className="mb-2">Comments</h5>
                    <h2>2,345</h2>
                    <ProgressBar now={80} label={`${80}%`} className="mt-2" />
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="shadow-sm">
                  <Card.Body>
                    <h5 className="mb-2">Page Views</h5>
                    <h2>10,234</h2>
                    <ProgressBar now={60} label={`${60}%`} className="mt-2" />
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Row>
              <Col md={8}>
                <Card className="shadow-sm mb-4">
                  <Card.Body>
                    <h5 className="mb-3">Recent Activity</h5>
                    <ListGroup>
                      <ListGroup.Item className="d-flex justify-content-between align-items-center">
                        New user registered
                        <Badge bg="primary" pill>
                          Just now
                        </Badge>
                      </ListGroup.Item>
                      <ListGroup.Item className="d-flex justify-content-between align-items-center">
                        New post published
                        <Badge bg="primary" pill>
                          2 hours ago
                        </Badge>
                      </ListGroup.Item>
                      <ListGroup.Item className="d-flex justify-content-between align-items-center">
                        Comment approved
                        <Badge bg="primary" pill>
                          3 hours ago
                        </Badge>
                      </ListGroup.Item>
                      <ListGroup.Item className="d-flex justify-content-between align-items-center">
                        New page created
                        <Badge bg="primary" pill>
                          5 hours ago
                        </Badge>
                      </ListGroup.Item>
                    </ListGroup>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="shadow-sm mb-4">
                  <Card.Body>
                    <h5 className="mb-3">Quick Post</h5>
                    <Form>
                      <Form.Group className="mb-3" controlId="formBasicEmail">
                        <Form.Control type="text" placeholder="Post Title" />
                      </Form.Group>
                      <Form.Group className="mb-3" controlId="formBasicPassword">
                        <Form.Control as="textarea" rows={3} placeholder="Post Content" />
                      </Form.Group>
                      <Button variant="primary" type="submit">
                        <Plus size={20} className="me-2" /> Create Post
                      </Button>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        );
    }
  };

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <Nav className={`flex-column bg-dark text-white p-3 ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`} style={{minHeight: '100vh', width: sidebarOpen ? '250px' : '60px'}}>
        <h3 className="mb-4 text-center">CMS Admin</h3>
        <Nav.Link 
          className={`text-white mb-2 d-flex align-items-center ${activeSection === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveSection('dashboard')}
        >
          <BarChart2 size={20} className="me-2" /> <span>Dashboard</span>
        </Nav.Link>
        <Nav.Link 
          className={`text-white mb-2 d-flex align-items-center ${activeSection === 'users' ? 'active' : ''}`}
          onClick={() => setActiveSection('users')}
        >
          <Users size={20} className="me-2" /> <span>Users</span>
        </Nav.Link>
        <Nav.Link 
          className={`text-white mb-2 d-flex align-items-center ${activeSection === 'content' ? 'active' : ''}`}
          onClick={() => setActiveSection('content')}
        >
          <FileText size={20} className="me-2" /> <span>Content</span>
        </Nav.Link>
        <Nav.Link 
          className={`text-white mb-2 d-flex align-items-center ${activeSection === 'blog' ? 'active' : ''}`}
          onClick={() => setActiveSection('blog')}
        >
          <BookOpen size={20} className="me-2" /> <span>Blog</span>
        </Nav.Link>
        <Nav.Link 
          className={`text-white mb-2 d-flex align-items-center ${activeSection === 'newsletter' ? 'active' : ''}`}
          onClick={() => setActiveSection('newsletter')}
        >
          <Mail size={20} className="me-2" /> <span>Newsletter</span>
        </Nav.Link>
        <Nav.Link 
          className={`text-white mb-2 d-flex align-items-center ${activeSection === 'social' ? 'active' : ''}`}
          onClick={() => setActiveSection('social')}
        >
          <Send size={20} className="me-2" /> <span>Social</span>
        </Nav.Link>
        <Nav.Link 
          className={`text-white mb-2 d-flex align-items-center ${activeSection === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveSection('settings')}
        >
          <Settings size={20} className="me-2" /> <span>Settings</span>
        </Nav.Link>
      </Nav>

      {/* Main content */}
      <div className="flex-grow-1 bg-light">
        {/* Header */}
        <Navbar bg="white" className="mb-4 shadow-sm">
          <Container fluid>
            <Button variant="outline-dark" onClick={toggleSidebar}>
              ☰
            </Button>
            <Form className="d-flex mx-auto">
              <Form.Control
                type="search"
                placeholder="Search"
                className="me-2"
                aria-label="Search"
              />
              <Button variant="outline-success"><Search /></Button>
            </Form>
            <AdminNotifications />
            <Dropdown align="end">
              <Dropdown.Toggle variant="light" id="dropdown-basic">
                <User size={20} />
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item href="#/action-1">Profile</Dropdown.Item>
                <Dropdown.Item href="#/action-2">Settings</Dropdown.Item>
                <Dropdown.Item href="#/action-3">Logout</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Container>
        </Navbar>

        {/* Dashboard content */}
        <Container fluid>
          {renderContent()}
        </Container>
      </div>
{/* 
      <style jsx>{`
        .sidebar-open {
          transition: width 0.3s ease-in-out;
        }
        .sidebar-closed {
          transition: width 0.3s ease-in-out;
          overflow: hidden;
        }
        .sidebar-closed span {
          display: none;
        }
        .nav-link.active {
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 5px;
        }
      `}</style> */}
    </div>
  );
};

export default MainDashboard;