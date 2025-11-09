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
				const endpoints = [
					`${API_BASE_URL}/fetch-beincrypto-rss?limit=8`,
					`${API_BASE_URL}/fetch-coindesk-rss?limit=8`,
					`${API_BASE_URL}/fetch-cryptoslate-rss?limit=8`,
					`${API_BASE_URL}/fetch-ambcrypto-rss?limit=8`,
					`${API_BASE_URL}/fetch-dailycoin-rss?limit=8`,
					`${API_BASE_URL}/fetch-cryptopotato-rss?limit=8`,
					`${API_BASE_URL}/fetch-utoday-rss?limit=8`,
					`${API_BASE_URL}/fetch-all-rss?limit=8&source=BeInCrypto`,
					`${API_BASE_URL}/fetch-all-rss?limit=16`
				];
				let loaded: any[] | null = null;
				for (const url of endpoints) {
					try {
						const res = await fetch(url);
						if (!res.ok) continue;
						const data = await res.json();
						if (data && Array.isArray(data.data) && data.data.length) {
							loaded = data.data;
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
		<Container fluid className="mt-5" style={{ width: '92%' }}>
			<Helmet>
				<title>Beyond the Headlines | CoinsClarity</title>
				<meta name="description" content="In-depth reads with full on-platform content and clean reading experience." />
				<link rel="canonical" href={`${window.location.origin}/beyond-the-headlines`} />
			</Helmet>
			<div className="d-flex justify-content-between align-items-center mb-3">
				<h4 className="m-0" style={{ fontWeight: 800, letterSpacing: '0.02em' }}>
					<span style={{ color: '#fb923c' }}><BookOpen size={20} className="me-2" /></span>
					Beyond the Headlines
				</h4>
				<Button variant="link" className="text-decoration-none" style={{ color: '#fb923c' }} onClick={() => navigate('/beyond-the-headlines')}>
					More <ChevronRight size={16} />
				</Button>
			</div>

			{error && (
				<Alert variant="warning" className="mb-3">
					{error}
				</Alert>
			)}

			<Row xs={1} sm={2} md={3} lg={4} className="g-4">
				{loading ? (
					Array.from({ length: 8 }).map((_, idx) => (
						<Col key={idx}>
							<Card className="h-100 border-0 rounded-4 shadow-sm">
								<Skeleton height={160} />
								<Card.Body>
									<Skeleton height={18} width="80%" className="mb-2" />
									<Skeleton count={2} />
								</Card.Body>
							</Card>
						</Col>
					))
				) : (
					(Array.isArray(displayList) ? displayList : []).map((item: InDepthItem, idx: number) => (
						<Col key={idx}>
							<Card
								className="h-100 border-0 rounded-4 shadow-sm position-relative"
								onClick={() => handleOpen(item)}
								role="button"
								tabIndex={0}
								onKeyDown={(e: any) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpen(item); } }}
								style={{ cursor: 'pointer' }}
							>
								{(() => {
									const isHttp = (u?: string) => typeof u === 'string' && /^https?:\/\//i.test(u) && u.trim().length > 0;
									const hasValidImage = isHttp(item.image_url) && item.image_url.trim().length > 0;
									const src = hasValidImage ? item.image_url : getFallbackImage(idx);
									return (
										<Card.Img
											variant="top"
											src={src}
											alt={item.title}
											className="rounded-4"
											loading="lazy"
											onError={(e: any) => { 
												// Only use fallback if the original image failed and we don't already have a fallback
												if (hasValidImage && !e.target.src.includes('unsplash')) {
													e.target.src = getFallbackImage(idx);
												}
											}}
											style={{ height: '200px', objectFit: 'cover' }}
										/>
									);
								})()}
								<Card.Body className="d-flex flex-column">
									<Card.Title className="fs-6 mb-2" style={{ fontWeight: 700, lineHeight: 1.3 }}>
										<a
											href={`/news/${item.article_id || encodeURIComponent(item.link || item.title)}`}
											className="text-decoration-none text-dark stretched-link"
											onClick={(e) => { e.preventDefault(); handleOpen(item); }}
										>
											{item.title}
										</a>
									</Card.Title>
									<Card.Text className="text-muted" style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3, overflow: 'hidden' }}>
										{item.description}
									</Card.Text>
									<div className="mt-auto d-flex justify-content-between align-items-center gap-2">
										<Badge
											bg="light"
											text="dark"
											style={{ color: 'rgb(253, 118, 7)', backgroundColor: 'rgb(253, 118, 7)', border: '1px solid rgba(251,146,60,0.25)' }}
										>
											{item.creator?.[0] || 'Unknown'}
										</Badge>
										
									</div>
								</Card.Body>
							</Card>
						</Col>
					))
				)}
			</Row>
		</Container>
	);
};

export default InDepthNews;


