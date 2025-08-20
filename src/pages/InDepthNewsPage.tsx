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
			
			{/* Enhanced introduction section for better text-to-HTML ratio */}
			<div className="mb-5 p-4" style={{ 
				backgroundColor: '#f8f9fa', 
				borderRadius: '12px', 
				border: '1px solid #e9ecef' 
			}}>
				<h2 className="h4 mb-3" style={{ color: '#495057', fontWeight: '600' }}>
					Deep Dive into Cryptocurrency's Most Important Stories
				</h2>
				<p className="mb-3" style={{ color: '#6c757d', lineHeight: '1.6' }}>
					Go beyond the surface-level headlines and explore the deeper implications of cryptocurrency news. 
					Our in-depth analysis section provides comprehensive coverage of complex topics, regulatory developments, 
					and technological innovations that shape the future of digital assets.
				</p>
				<p className="mb-0" style={{ color: '#6c757d', lineHeight: '1.6' }}>
					From blockchain scalability solutions and DeFi protocol analysis to regulatory frameworks and 
					institutional adoption trends, we break down complex concepts into digestible insights that 
					help you understand the bigger picture of the crypto ecosystem.
				</p>
			</div>

			{/* Analysis categories and focus areas */}
			<div className="mb-4 p-3" style={{ 
				backgroundColor: '#e7f3ff', 
				borderRadius: '8px', 
				border: '1px solid #b3d9ff' 
			}}>
				<div className="row text-center">
					<div className="col-md-3">
						<div className="p-2">
							<strong className="d-block text-primary">Technical Analysis</strong>
							<small className="text-muted">Blockchain & protocols</small>
						</div>
					</div>
					<div className="col-md-3">
						<div className="p-2">
							<strong className="d-block text-primary">Regulatory Insights</strong>
							<small className="text-muted">Legal & compliance</small>
						</div>
					</div>
					<div className="col-md-3">
						<div className="p-2">
							<strong className="d-block text-primary">Market Trends</strong>
							<small className="text-muted">Institutional adoption</small>
						</div>
					</div>
					<div className="col-md-3">
						<div className="p-2">
							<strong className="d-block text-primary">Innovation Focus</strong>
							<small className="text-muted">New technologies</small>
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
								const src = isHttp(item.image_url) ? item.image_url : '/image.png';
								return <Card.Img variant="top" src={src} alt={item.title} loading="lazy" style={{ height: 180, objectFit: 'cover' }} onError={(e: any) => { e.currentTarget.src = '/image.png'; }} referrerPolicy="no-referrer" />
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


