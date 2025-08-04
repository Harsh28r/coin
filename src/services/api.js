import axios from 'axios';

const API_URL = process.env.REACT_APP_API_BASE_URL || ' https://c-back-1.onrender.com';;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const fetchPosts = async () => {
  try {
    const response = await api.get('/posts');
    return response.data;
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
};

export const createPost = async (postData) => {
  try {
    const response = await api.post('/posts', postData);
    return response.data;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

export const updatePost = async (id, postData) => {
  try {
    const response = await api.put(`/posts/${id}`, postData);
    return response.data;
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
};

export const deletePost = async (id) => {
  try {
    await api.delete(`/posts/${id}`);
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};