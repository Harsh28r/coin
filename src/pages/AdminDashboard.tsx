import React, { useState } from 'react';
import { Container, Row, Col, Modal } from 'react-bootstrap';
import BlogPost from '../Components/BlogPost';
import BlogForm from '../Components/BlogForm';
import { useBlog } from '../context/BlogContext';
import { BlogPost as BlogPostType } from '../types/blog';
import { PlusCircle } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { posts, addPost, updatePost, deletePost } = useBlog();
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPostType | null>(null);

  const handleSubmit = async (formData: Omit<BlogPostType, 'id'>) => {
    try {
      if (editingPost) {
        await updatePost({ ...editingPost, ...formData });
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

  return (
    <Container>
      <div className="admin-header">
        <Row className="align-items-center">
          <Col>
            <h1 className="display-6 fw-bold mb-0">Admin Dashboard</h1>
          </Col>
          <Col xs="auto">
            <button 
              className="btn btn-primary d-flex align-items-center gap-2"
              onClick={() => {
                setEditingPost(null);
                setShowModal(true);
              }}
            >
              <PlusCircle size={20} />
              Create New Post
            </button>
          </Col>
        </Row>
      </div>

      <Row className="justify-content-center">
        <Col lg={8}>
          {posts.map(post => (
            <div key={post.id} className="mb-4">
              <BlogPost 
                post={post} 
                isAdmin={true}
                onEdit={() => handleEdit(post)}
                onDelete={() => deletePost(post.id)}
              />
            </div>
          ))}
        </Col>
      </Row>

      <Modal show={showModal} onHide={handleCancel} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingPost ? 'Edit Post' : 'Create New Post'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <BlogForm 
            post={editingPost || undefined} 
            onSubmit={handleSubmit} 
            onCancel={handleCancel}
          />
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default AdminDashboard;