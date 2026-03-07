import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Container, Row, Col, Card, Button, Badge, Alert } from 'react-bootstrap';
import { ChevronRight, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useNewsTranslation } from '../hooks/useNewsTranslation';

interface InDepthItem {
	article_id: string;
	title: string;
	description: string;
	creator: string[];
	pubDate: string;
	image_url: string;
	link: string;
	content?: string;
	source_name?: string;
	keywords?: string[];
	category?: string[];
}

const InDepthNews: React.FC = () => {
	const navigate = useNavigate();
	const [items, setItems] = useState<InDepthItem[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://c-back-2.onrender.com';

	// Crypto-related fallback images
	const getFallbackImage = (index: number): string => {
		const images = [
			'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=600&fit=crop', // Bitcoin/blockchain tech
			'https://images.unsplash.com/photo-1621416894564-8db3d1a8b8c0?w=800&h=600&fit=crop', // Crypto trading tech
			'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=800&h=600&fit=crop', // Digital currency tech
			'https://images.unsplash.com/photo-1639762681057-408e52174e2b?w=800&h=600&fit=crop', // Blockchain technology
			'https://images.unsplash.com/photo-1621416894564-8db3d1a8b8c0?w=800&h=600&fit=crop', // Cryptocurrency tech
			'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=800&h=600&fit=crop' // Digital finance tech
		];
		return images[index % images.length];
	};

	const { displayItems } = useNewsTranslation(items as any);
	const displayList = useMemo<InDepthItem[]>(
		() => (Array.isArray(displayItems) ? (displayItems as unknown as InDepthItem[]) : items),
		[displayItems, items]
	);

	useEffect(() => {
		let cancelled = false;
		const fetchFeed = async () => {
			setLoading(true);
			setError(null);
			try {
				const CAMIFY = 'https://camify.fun.coinsclarity.com';
				const endpoints = [
					`${CAMIFY}/fetch-beincrypto-rss?limit=8`,
					`${CAMIFY}/fetch-coindesk-rss?limit=8`,
					`${CAMIFY}/fetch-cryptoslate-rss?limit=8`,
					`${CAMIFY}/fetch-blockworks-rss?limit=8`,
					`${CAMIFY}/fetch-finbold-rss?limit=8`,
					`${CAMIFY}/fetch-protos-rss?limit=8`,
					`${CAMIFY}/fetch-unchained-rss?limit=8`,
					`${API_BASE_URL}/fetch-all-rss?limit=16`
				];
				let loaded: any[] | null = null;
				for (const url of endpoints) {
					try {
						const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
						if (!res.ok) continue;
						const data = await res.json();
						const arr = Array.isArray(data?.data) ? data.data : Array.isArray(data?.items) ? data.items : [];
						if (data?.success && arr.length) {
							loaded = arr;
							break;
						}
					} catch {}
				}

				if (!cancelled) {
					if (loaded) {
						const normalized: InDepthItem[] = loaded.map((it: any) => ({
							article_id: it.article_id,
							title: it.title,
							description: it.description,
							creator: Array.isArray(it.creator) ? it.creator : [it.creator || 'Unknown'],
							pubDate: it.pubDate,
							image_url: it.image_url,
							link: it.link,
							content: it.content,
							source_name: it.source_name,
							keywords: it.keywords,
							category: it.category
						}));
						setItems(normalized);
					} else {
						setItems([]);
						setError('No in-depth items available right now.');
					}
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		};
		fetchFeed();
		return () => { cancelled = true; };
	}, [API_BASE_URL]);

	const handleOpen = (item: InDepthItem) => {
		const id = item.article_id || encodeURIComponent(item.link || item.title);
		navigate(`/news/${id}`, { state: { item: { ...item, sectionLabel: 'Beyond the Headlines' } } });
	};

	return (
		<section style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 20px' }}>
			<Helmet>
				<title>Beyond the Headlines | CoinsClarity</title>
				<meta name="description" content="In-depth reads with full on-platform content and clean reading experience." />
				<link rel="canonical" href={`${window.location.origin}/beyond-the-headlines`} />
			</Helmet>

			<div className="cc-section-header">
				<h2>Beyond the Headlines</h2>
				<a href="/beyond-the-headlines" className="cc-view-all" onClick={(e) => { e.preventDefault(); navigate('/beyond-the-headlines'); }}>
					More <ChevronRight size={14} />
				</a>
			</div>

			{error && <Alert variant="warning" className="mb-3" style={{ borderRadius: 10, fontSize: 14 }}>{error}</Alert>}

			<Row xs={1} sm={2} md={3} lg={4} className="g-3">
				{loading ? (
					Array.from({ length: 4 }).map((_, idx) => (
						<Col key={idx}>
							<div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #f0f0f0', background: '#fff' }}>
								<Skeleton height={180} width="100%" baseColor="#f3f4f6" highlightColor="#fafafa" />
								<div style={{ padding: 16 }}>
									<Skeleton width="90%" height={16} baseColor="#f3f4f6" highlightColor="#fafafa" />
									<Skeleton width="70%" height={16} baseColor="#f3f4f6" highlightColor="#fafafa" style={{ marginTop: 8 }} />
								</div>
							</div>
						</Col>
					))
				) : (
					(Array.isArray(displayList) ? displayList : []).map((item: InDepthItem, idx: number) => {
						const isHttp = (u?: string) => typeof u === 'string' && /^https?:\/\//i.test(u) && u.trim().length > 0;
						const hasValidImage = isHttp(item.image_url);
						const src = hasValidImage ? item.image_url : getFallbackImage(idx);
						return (
							<Col key={idx}>
								<div
									className="cc-news-card h-100"
									onClick={() => handleOpen(item)}
									role="button"
									tabIndex={0}
									onKeyDown={(e: any) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpen(item); } }}
								>
									<div style={{ overflow: 'hidden' }}>
										<img
											src={src}
											alt={item.title}
											loading="lazy"
											onError={(e: any) => { if (hasValidImage && !e.target.src.includes('unsplash')) { e.target.src = getFallbackImage(idx); } }}
										/>
									</div>
									<div className="card-body">
										<div className="card-title">{item.title}</div>
										<div className="card-text">{item.description}</div>
										<div className="card-meta">
											<span className="author">{item.creator?.[0] || 'Unknown'}</span>
											<span>{item.source_name || 'Crypto News'}</span>
										</div>
									</div>
								</div>
							</Col>
						);
					})
				)}
			</Row>
		</section>
	);
};

export default InDepthNews;


