import React, { useState, SyntheticEvent, useEffect } from 'react';
import { Form, Button } from 'react-bootstrap';
import { BlogPost } from '../types/blog'; // Import the BlogPost type

interface BlogFormProps {
  post?: BlogPost; // Use the imported BlogPost type
  onSubmit: (data: Omit<BlogPost, 'id'>) => void;
  onCancel: () => void;
}

const BlogForm: React.FC<BlogFormProps> = ({ post, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Omit<BlogPost, 'id'>>({
    title: '',
    content: '',
    author: '',
    imageUrl: '',
    date: new Date().toISOString(), // Set the current date
  });

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title,
        content: post.content,
        author: post.author,
        imageUrl: post.imageUrl,
        date: post.date, // Use the existing date when editing
      });
    }
  }, [post]);

  const handleSubmit = (e: SyntheticEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Label>Title</Form.Label>
        <Form.Control
          type="text"
          placeholder="Enter article title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Content</Form.Label>
        <Form.Control
          as="textarea"
          rows={5}
          placeholder="Write your article content..."
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Author</Form.Label>
        <Form.Control
          type="text"
          placeholder="Enter author name"
          value={formData.author}
          onChange={(e) => setFormData({ ...formData, author: e.target.value })}
          required
        />
      </Form.Group>

      <Form.Group className="mb-4">
        <Form.Label>Image URL</Form.Label>
        <Form.Control
          type="url"
          placeholder="Enter image URL"
          value={formData.imageUrl}
          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          required
        />
        <Form.Text className="text-muted">
          Provide a valid image URL (e.g., from Unsplash)
        </Form.Text>
      </Form.Group>

      <div className="d-flex gap-2">
        <Button variant="primary" type="submit">
          {post ? 'Update Article' : 'Publish Article'}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Form>
  );
};

export default BlogForm;