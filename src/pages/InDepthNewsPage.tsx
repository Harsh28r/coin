import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';
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
}

const InDepthNewsPage: React.FC = () => {
	const [items, setItems] = useState<InDepthItem[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://c-back-2.onrender.com';
	const navigate = useNavigate();

	// Crypto-related fallback images
	const getFallbackImage = (index: number): string => {
		const images = [
			'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=600&fit=crop', // Bitcoin/blockchain
			'https://images.unsplash.com/photo-1621416894564-8db3d1a8b8c0?w=800&h=600&fit=crop', // Crypto trading
			'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=800&h=600&fit=crop', // Digital currency
			'https://images.unsplash.com/photo-1639762681057-408e52174e2b?w=800&h=600&fit=crop', // Blockchain technology
			'https://images.unsplash.com/photo-1621416894564-8db3d1a8b8c0?w=800&h=600&fit=crop', // Cryptocurrency concept
			'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=800&h=600&fit=crop'  // Digital finance
		];
		return images[index % images.length];
	};

	const { displayItems } = useNewsTranslation(items as any);
	const list = useMemo<InDepthItem[]>(() => (Array.isArray(displayItems) ? (displayItems as unknown as InDepthItem[]) : items), [displayItems, items]);

	useEffect(() => {
		let cancelled = false;
		const run = async () => {
			setLoading(true);
			try {
				const endpoints = [
					`${API_BASE_URL}/fetch-beincrypto-rss?limit=24`,
					`${API_BASE_URL}/fetch-coindesk-rss?limit=24`,
					`${API_BASE_URL}/fetch-cryptoslate-rss?limit=24`,
					`${API_BASE_URL}/fetch-ambcrypto-rss?limit=24`,
					`${API_BASE_URL}/fetch-dailycoin-rss?limit=24`,
					`${API_BASE_URL}/fetch-cryptopotato-rss?limit=24`,
					`${API_BASE_URL}/fetch-utoday-rss?limit=24`,
					`${API_BASE_URL}/fetch-all-rss?limit=24&source=BeInCrypto`,
					`${API_BASE_URL}/fetch-all-rss?limit=24`
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
				if (!cancelled && loaded) setItems(loaded);
			} finally { if (!cancelled) setLoading(false); }
		};
		run();
		return () => { cancelled = true; };
	}, [API_BASE_URL]);

	const open = (item: InDepthItem) => {
		const id = item.article_id || encodeURIComponent(item.link || item.title);
		navigate(`/news/${id}`, { state: { item } });
	};

	return (
		<Container className="mt-4" style={{ maxWidth: 1200 }}>
			<h1 className="mb-4 text-center" style={{ 
				fontSize: '2.5rem', 
				fontWeight: 'bold', 
				color: '#1f2937',
				borderBottom: '3px solid #f59e0b',
				paddingBottom: '1rem'
			}}>
				Beyond the Headlines
			</h1>

			{/* Analysis categories and focus areas */}
			<div className="mb-4 p-4" style={{ 
				background: 'linear-gradient(135deg, #ff7a00 0%, #ff9500 100%)',
				borderRadius: '16px',
				border: 'none',
				boxShadow: '0 8px 25px rgba(255, 122, 0, 0.2)',
				position: 'relative',
				overflow: 'hidden'
			}}>
				<div style={{
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
					opacity: 0.3
				}}></div>
				<div className="row text-center" style={{ position: 'relative', zIndex: 1 }}>
					<div className="col-md-3">
						<div className="p-3">
							<strong className="d-block text-white mb-2" style={{ fontSize: '1.1rem', textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>Technical Analysis</strong>
							<small className="text-white-75" style={{ fontSize: '0.9rem', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>Blockchain & protocols</small>
						</div>
					</div>
					<div className="col-md-3">
						<div className="p-3">
							<strong className="d-block text-white mb-2" style={{ fontSize: '1.1rem', textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>Regulatory Insights</strong>
							<small className="text-white-75" style={{ fontSize: '0.9rem', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>Legal & compliance</small>
						</div>
					</div>
					<div className="col-md-3">
						<div className="p-3">
							<strong className="d-block text-white mb-2" style={{ fontSize: '1.1rem', textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>Market Trends</strong>
							<small className="text-white-75" style={{ fontSize: '0.9rem', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>Institutional adoption</small>
						</div>
					</div>
					<div className="col-md-3">
						<div className="p-3">
							<strong className="d-block text-white mb-2" style={{ fontSize: '1.1rem', textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>Innovation Focus</strong>
							<small className="text-white-75" style={{ fontSize: '0.9rem', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>New technologies</small>
						</div>
					</div>
				</div>
			</div>

			<div className="d-flex justify-content-between align-items-center mb-3">
				<Button variant="outline-secondary" size="sm" onClick={() => navigate(-1)}>Back</Button>
			</div>
			<Row xs={1} sm={2} md={3} lg={4} className="g-4">
				{loading ? Array.from({ length: 12 }).map((_, i) => (
					<Col key={i}><Skeleton height={220} /></Col>
				)) : list.map((item, i) => (
					<Col key={i}>
						<Card className="h-100 border-0 rounded-4 shadow-sm">
							{(() => {
								const isHttp = (u?: string) => typeof u === 'string' && /^https?:\/\//i.test(u) && u.trim().length > 0;
								const src = isHttp(item.image_url) ? item.image_url : getFallbackImage(i);
								return <Card.Img variant="top" src={src} alt={item.title} loading="lazy" style={{ height: 180, objectFit: 'cover' }} onError={(e: any) => { e.currentTarget.src = getFallbackImage(i); }} referrerPolicy="no-referrer" />
							})()}
							<Card.Body className="d-flex flex-column">
								<Card.Title className="fs-6 mb-2" style={{ fontWeight: 700, lineHeight: 1.3 }}>
									<a href={`/news/${item.article_id || encodeURIComponent(item.link || item.title)}`} className="text-decoration-none text-dark" onClick={(e) => { e.preventDefault(); open(item); }}>{item.title}</a>
								</Card.Title>
								<Card.Text className="text-muted" style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3, overflow: 'hidden' }}>{item.description}</Card.Text>
								<div className="mt-auto d-flex justify-content-between align-items-center">
									<Badge bg="light" text="dark">{item.creator?.[0] || 'Unknown'}</Badge>
								</div>
							</Card.Body>
						</Card>
					</Col>
				))}
			</Row>

			

			
		</Container>
	);
};

export default InDepthNewsPage;


