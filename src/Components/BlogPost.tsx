import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { format } from 'date-fns';
import { Pencil, Trash2, User, Calendar } from 'lucide-react';
import { BlogPost as BlogPostType } from '../types/blog';
import PropTypes from 'prop-types';
// import './BlogPost.css'; // Ensure you import the CSS file

interface BlogPostProps {
  post: BlogPostType;
  isAdmin?: boolean;
  onEdit?: (post: BlogPostType) => void;
  onDelete?: (id: string) => void;
}

const BlogPost: React.FC<BlogPostProps> = ({ post, isAdmin = false, onEdit, onDelete }: BlogPostProps) => {
  const formattedDate = format(new Date(post.date), 'MMMM dd, yyyy');

  return (
    <Card className="h-100 shadow-sm hover-shadow border-0">
      <Card.Img 
        variant="top" 
        src={post.imageUrl} 
        className="blog-post-img" 
        alt={post.title}
      />
      <Card.Body className="d-flex flex-column p-4">
        <Card.Title className="h4 fw-bold mb-3">{post.title}</Card.Title>
        
        <div className="meta-info text-muted mb-3">
          <div className="d-flex align-items-center mb-2">
            <User size={16} className="me-2" />
            <small>{post.author}</small>
          </div>
          <div className="d-flex align-items-center">
            <Calendar size={16} className="me-2" />
            <small>{formattedDate}</small>
          </div>
        </div>

        <Card.Text className="text-muted flex-grow-1" style={{ 
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical'
        }}>
          {post.content}
        </Card.Text>

        {isAdmin && (
          <div className="d-flex gap-2 mt-3">
            <Button 
              variant="outline-primary" 
              size="sm"
              className="d-flex align-items-center"
              onClick={() => onEdit && onEdit(post)}
            >
              <Pencil size={14} className="me-2" />
              Edit
            </Button>
            <Button 
              variant="outline-danger" 
              size="sm"
              className="d-flex align-items-center"
              onClick={() => onDelete && onDelete(post.id)}
            >
              <Trash2 size={14} className="me-2" />
              Delete
            </Button>
          </div>
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
};

export default BlogPost;