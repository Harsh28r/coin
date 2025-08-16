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
				const res = await fetch(`${API_BASE_URL}/fetch-beincrypto-rss?limit=24`);
				const data = await res.json();
				if (!cancelled && data.success && Array.isArray(data.data)) {
					setItems(data.data);
				}
			} catch {}
			finally { if (!cancelled) setLoading(false); }
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
			<div className="d-flex justify-content-between align-items-center mb-3">
				<h3 className="m-0">Beyond the Headlines</h3>
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


