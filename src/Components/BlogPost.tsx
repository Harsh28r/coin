import React, { useState } from 'react';
import { Card, Button, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { format } from 'date-fns';
import { 
  Pencil, 
  Trash2, 
  User, 
  Calendar, 
  Eye, 
  Heart, 
  Share2, 
  Bookmark,
  Clock,
  Tag,
  ExternalLink
} from 'lucide-react';
import { BlogPost as BlogPostType } from '../types/blog';
import PropTypes from 'prop-types';

interface BlogPostProps {
  post: BlogPostType;
  isAdmin?: boolean;
  onEdit?: (post: BlogPostType) => Promise<{ success: boolean; message: string }>;
  onDelete?: (id: string) => Promise<{ success: boolean; message: string }>;
  showActions?: boolean;
  variant?: 'default' | 'compact' | 'featured' | 'full';
}

const BlogPost: React.FC<BlogPostProps> = ({ 
  post, 
  isAdmin = false, 
  onEdit, 
  onDelete, 
  showActions = true,
  variant = 'default'
}: BlogPostProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isExpandedFull, setIsExpandedFull] = useState(false);

  const formattedDate = format(new Date(post.date), 'MMMM dd, yyyy');
  const timeAgo = format(new Date(post.date), 'MMM dd');

  // Enhanced action handlers with feedback
  const handleEdit = async () => {
    if (!onEdit) return;
    
    setIsLoading(true);
    try {
      const result = await onEdit(post);
      setActionMessage(result.message);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (error) {
      setActionMessage('Failed to edit post');
      setTimeout(() => setActionMessage(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    if (!window.confirm(`Are you sure you want to delete "${post.title}"?`)) {
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await onDelete(post.id);
      setActionMessage(result.message);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (error) {
      setActionMessage('Failed to delete post');
      setTimeout(() => setActionMessage(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setActionMessage(isLiked ? 'Post unliked' : 'Post liked!');
    setTimeout(() => setActionMessage(null), 2000);
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    setActionMessage(isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks!');
    setTimeout(() => setActionMessage(null), 2000);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: post.content.substring(0, 100) + '...',
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setActionMessage('Link copied to clipboard!');
        setTimeout(() => setActionMessage(null), 2000);
      }
    } catch (error) {
      setActionMessage('Failed to share post');
      setTimeout(() => setActionMessage(null), 2000);
    }
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Technology': 'primary',
      'Crypto': 'warning',
      'Finance': 'success',
      'News': 'info',
      'Tutorial': 'secondary',
      'Analysis': 'dark'
    };
    return colors[category] || 'light';
  };

  const getNormalizedHtml = (htmlOrText?: string): string => {
    const raw = (htmlOrText || '').trim();
    if (!raw) return '';
    const looksLikeHtml = /<[^>]+>/.test(raw);
    if (looksLikeHtml) return raw;
    return raw
      .split(/\n{2,}/)
      .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
      .join('');
  };

  // Render different variants
  if (variant === 'compact') {
    return (
      <Card className="h-100 border-0 shadow-sm hover-lift transition-all">
        <div className="position-relative">
          <Card.Img 
            variant="top" 
            src={post.imageUrl} 
            alt={post.title}
            className="object-fit-cover"
            style={{ height: '160px' }}
            onError={(e) => {
              e.currentTarget.src = 'https://placehold.co/400x160?text=Blog+Post';
            }}
          />
          <div className="position-absolute top-0 start-0 m-2">
            <Badge 
              bg={getCategoryColor((post as any).category || 'General')}
              className="px-2 py-1"
            >
              {(post as any).category || 'General'}
            </Badge>
          </div>
        </div>
        
        <Card.Body className="d-flex flex-column p-3">
          <Card.Title className="h6 fw-bold mb-2 line-clamp-2" style={{ minHeight: '2.5rem' }}>
            {post.title}
          </Card.Title>
          
          <Card.Text className="text-muted small mb-3 line-clamp-2" style={{ minHeight: '2.5rem' }}>
            {post.content}
          </Card.Text>
          
          <div className="mt-auto">
            <div className="d-flex justify-content-between align-items-center text-muted small">
              <div className="d-flex align-items-center">
                <User size={14} className="me-1" />
                <span>{post.author}</span>
              </div>
              <div className="d-flex align-items-center">
                <Clock size={14} className="me-1" />
                <span>{timeAgo}</span>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (variant === 'featured') {
    return (
      <Card className="h-100 border-0 shadow-lg hover-lift transition-all featured-post">
        <div className="position-relative overflow-hidden">
          <Card.Img 
            variant="top" 
            src={post.imageUrl} 
            alt={post.title}
            className="object-fit-cover"
            style={{ height: '280px' }}
            onError={(e) => {
              e.currentTarget.src = 'https://placehold.co/600x280?text=Featured+Post';
            }}
          />
          <div className="position-absolute top-0 start-0 m-3">
            <Badge 
              bg="warning"
              className="px-3 py-2 fw-bold"
              style={{ fontSize: '0.8rem' }}
            >
              ⭐ Featured
            </Badge>
          </div>
          <div className="position-absolute bottom-0 start-0 w-100 p-3"
               style={{
                 background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 100%)'
               }}>
            <Card.Title className="h4 fw-bold text-white mb-2">
              {post.title}
            </Card.Title>
            <div className="d-flex align-items-center text-white-50 small">
              <User size={16} className="me-2" />
              <span>{post.author}</span>
              <span className="mx-2">•</span>
              <Calendar size={16} className="me-2" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>
        
        <Card.Body className="p-4">
          <Card.Text className="text-muted mb-4 line-clamp-3" style={{ minHeight: '4.5rem' }}>
            {post.content}
          </Card.Text>
          
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex gap-2">
              <Button 
                variant="outline-primary" 
                size="sm"
                className="rounded-pill"
                onClick={handleLike}
              >
                <Heart size={16} className={`me-1 ${isLiked ? 'text-danger fill-current' : ''}`} />
                {isLiked ? 'Liked' : 'Like'}
              </Button>
              <Button 
                variant="outline-secondary" 
                size="sm"
                className="rounded-pill"
                onClick={handleBookmark}
              >
                <Bookmark size={16} className={`me-1 ${isBookmarked ? 'text-warning fill-current' : ''}`} />
                {isBookmarked ? 'Saved' : 'Save'}
              </Button>
            </div>
            
            <Button 
              variant="primary" 
              size="sm"
              className="rounded-pill"
              onClick={handleShare}
            >
              <Share2 size={16} className="me-1" />
              Share
            </Button>
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (variant === 'full') {
    const normalizedHtml = getNormalizedHtml(post.content);
    const truncateHtmlByParagraphs = (html: string, maxParagraphs: number, maxCharsFallback: number) => {
      if (!html) return '';
      const parts = html.split(/<\/p>/i).map((s) => s.trim()).filter(Boolean);
      if (parts.length > 0) {
        const limited = parts.slice(0, maxParagraphs).map((p) => `${p}</p>`).join('');
        return limited;
      }
      // Fallback if no paragraphs found
      const sliced = html.slice(0, maxCharsFallback);
      return sliced + (html.length > maxCharsFallback ? '…' : '');
    };

    const collapsedHtml = truncateHtmlByParagraphs(normalizedHtml, 3, 800);
    const needsToggle = normalizedHtml.length > collapsedHtml.length + 10;

    return (
      <Card className="border-0 shadow-sm mb-5">
        {post.imageUrl && (
          <Card.Img
            variant="top"
            src={post.imageUrl}
            alt={post.title}
            className="object-fit-cover"
            style={{ maxHeight: '360px' }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/800x360?text=Blog'; }}
          />
        )}
        <Card.Body className="p-4">
          <h1 className="fw-bold mb-3" style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2.25rem)' }}>{post.title}</h1>
          <div className="d-flex align-items-center text-muted mb-4" style={{ gap: 16 }}>
            <div className="d-flex align-items-center">
              <User size={16} className="me-2" />
              <small>{post.author}</small>
            </div>
            <div className="d-flex align-items-center">
              <Calendar size={16} className="me-2" />
              <small>{formattedDate}</small>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <div
              className="prose"
              style={{ lineHeight: 1.8, fontSize: '1rem', color: '#374151', maxHeight: isExpandedFull ? 'none' : '28rem', overflow: 'hidden' }}
              dangerouslySetInnerHTML={{ __html: isExpandedFull ? normalizedHtml : collapsedHtml }}
            />
            {!isExpandedFull && needsToggle && (
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '4rem', background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, #ffffff 60%)' }} />
            )}
          </div>
          {needsToggle && (
            <Button
              variant={isExpandedFull ? 'outline-secondary' : 'outline-warning'}
              size="sm"
              className="mt-3 rounded-pill"
              onClick={() => setIsExpandedFull((v) => !v)}
              style={isExpandedFull ? undefined : { background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', border: 'none', color: 'white' }}
            >
              {isExpandedFull ? 'Read Less' : 'Read More'}
            </Button>
          )}
        </Card.Body>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className="h-100 border-0 shadow-sm hover-lift transition-all">
      <div className="position-relative">
        <Card.Img 
          variant="top" 
          src={post.imageUrl} 
          alt={post.title}
          className="object-fit-cover"
          style={{ height: '200px' }}
          onError={(e) => {
            e.currentTarget.src = 'https://placehold.co/400x200?text=Blog+Post';
          }}
        />
        <div className="position-absolute top-0 start-0 m-3">
          <Badge 
            bg={getCategoryColor((post as any).category || 'General')}
            className="px-2 py-1"
          >
            {(post as any).category || 'General'}
          </Badge>
        </div>
        
        {/* Action buttons overlay */}
        {showActions && (
          <div className="position-absolute top-0 end-0 m-3 d-flex gap-1">
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>Like this post</Tooltip>}
            >
              <Button
                variant="light"
                size="sm"
                className="rounded-circle p-1"
                onClick={handleLike}
                style={{ width: '32px', height: '32px' }}
              >
                <Heart size={16} className={isLiked ? 'text-danger fill-current' : ''} />
              </Button>
            </OverlayTrigger>
            
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>Bookmark this post</Tooltip>}
            >
              <Button
                variant="light"
                size="sm"
                className="rounded-circle p-1"
                onClick={handleBookmark}
                style={{ width: '32px', height: '32px' }}
              >
                <Bookmark size={16} className={isBookmarked ? 'text-warning fill-current' : ''} />
              </Button>
            </OverlayTrigger>
            
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>Share this post</Tooltip>}
            >
              <Button
                variant="light"
                size="sm"
                className="rounded-circle p-1"
                onClick={handleShare}
                style={{ width: '32px', height: '32px' }}
              >
                <Share2 size={16} />
              </Button>
            </OverlayTrigger>
          </div>
        )}
      </div>
      
      <Card.Body className="d-flex flex-column p-4">
        <Card.Title className="h5 fw-bold mb-3 line-clamp-2" style={{ minHeight: '2.5rem' }}>
          {post.title}
        </Card.Title>
        
        <div className="meta-info text-muted mb-3">
          <div className="d-flex align-items-center mb-2">
            <div className="d-flex align-items-center me-3">
              <div 
                className="rounded-circle me-2 d-flex align-items-center justify-content-center"
                style={{
                  width: '24px',
                  height: '24px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontSize: '0.7rem',
                  fontWeight: '600'
                }}
              >
                {post.author.charAt(0).toUpperCase()}
              </div>
              <small className="fw-semibold">{post.author}</small>
            </div>
            <div className="d-flex align-items-center">
              <Calendar size={16} className="me-2" />
              <small>{formattedDate}</small>
            </div>
          </div>
        </div>

        <Card.Text className="text-muted flex-grow-1 line-clamp-3 mb-4" style={{ minHeight: '4.5rem' }}>
          {post.content}
        </Card.Text>

        {/* Action Message */}
        {actionMessage && (
          <div className="alert alert-info alert-dismissible fade show py-2 mb-3" role="alert">
            <small>{actionMessage}</small>
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setActionMessage(null)}
            />
          </div>
        )}

        {/* Admin Actions */}
        {isAdmin && (
          <div className="d-flex gap-2 mt-auto">
            <Button 
              variant="outline-primary" 
              size="sm"
              className="d-flex align-items-center rounded-pill"
              onClick={handleEdit}
              disabled={isLoading}
            >
              <Pencil size={14} className="me-2" />
              {isLoading ? 'Editing...' : 'Edit'}
            </Button>
            <Button 
              variant="outline-danger" 
              size="sm"
              className="d-flex align-items-center rounded-pill"
              onClick={handleDelete}
              disabled={isLoading}
            >
              <Trash2 size={14} className="me-2" />
              {isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        )}

        {/* Read More Button */}
        {!isAdmin && (
          <Button 
            variant="outline-warning" 
            size="sm"
            className="mt-auto rounded-pill"
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              border: 'none',
              color: 'white'
            }}
          >
            Read Full Article <ExternalLink size={16} className="ms-2" />
          </Button>
        )}
      </Card.Body>
    </Card>
  );
};

BlogPost.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    imageUrl: PropTypes.string.isRequired,
    author: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
  }).isRequired,
  isAdmin: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  showActions: PropTypes.bool,
  variant: PropTypes.oneOf(['default', 'compact', 'featured', 'full'])
};

export default BlogPost;

// Enhanced Styling
const enhancedStyles = `
  .hover-lift {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .hover-lift:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15) !important;
  }
  
  .transition-all {
    transition: all 0.3s ease;
  }
  
  .line-clamp-2 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  
  .line-clamp-3 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }
  
  .featured-post {
    border: 2px solid transparent;
    background: linear-gradient(white, white) padding-box,
                linear-gradient(135deg, #667eea 0%, #764ba2 100%) border-box;
  }
  
  .featured-post:hover {
    transform: translateY(-12px);
    box-shadow: 0 25px 50px rgba(102, 126, 234, 0.2) !important;
  }
  
  .object-fit-cover {
    object-fit: cover;
  }
  
  /* Enhanced button hover effects */
  .btn-outline-primary:hover {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-color: transparent;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
  }
  
  .btn-outline-warning:hover {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    border-color: transparent;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(245, 158, 11, 0.3);
  }
  
  /* Smooth image transitions */
  .card-img-top {
    transition: transform 0.3s ease;
  }
  
  .hover-lift:hover .card-img-top {
    transform: scale(1.05);
  }
  
  /* Enhanced badge styling */
  .badge {
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    font-size: 0.7rem;
  }
  
  /* Professional typography */
  .card-title {
    line-height: 1.4;
    color: #1f2937;
  }
  
  .card-text {
    line-height: 1.6;
    color: #6b7280;
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .hover-lift:hover {
      transform: translateY(-4px);
    }
    
    .featured-post:hover {
      transform: translateY(-6px);
    }
  }
  
  /* Loading states */
  .btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  /* Enhanced alert styling */
  .alert-info {
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    border: 1px solid #93c5fd;
    color: #1e40af;
  }
  
  /* Smooth focus states */
  .btn:focus,
  .form-control:focus {
    box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
    border-color: #667eea;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleId = 'blog-post-enhanced-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = enhancedStyles;
    document.head.appendChild(style);
  }
}