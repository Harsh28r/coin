import React, { useState } from 'react';
import {
  Container, Row, Col, Nav, Navbar, Card, Button, Form, ListGroup, Badge,
  ProgressBar, Dropdown, Table, Modal
} from 'react-bootstrap';
import { BarChart2, Users, FileText, Settings, Bell, User, Search, Plus, BookOpen } from 'lucide-react';
import 'bootstrap/dist/css/bootstrap.min.css';
import BlogPost from '../Components/BlogPost';
import { useBlog } from '../context/BlogContext';
import { BlogPost as BlogPostType } from '../types/blog';
import BlogForm from '../Components/BlogForm';

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

  const renderContent = () => {
    switch (activeSection) {
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
            <Dropdown align="end">
              <Dropdown.Toggle variant="light" id="dropdown-basic">
                <Bell size={20} />
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item href="#/action-1">Notification 1</Dropdown.Item>
                <Dropdown.Item href="#/action-2">Notification 2</Dropdown.Item>
                <Dropdown.Item href="#/action-3">Notification 3</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
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