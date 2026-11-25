import { API_BASE_URL } from '../../config/api';
import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Calendar,
  Image as ImageIcon
} from 'lucide-react';
import { EditorialCard, StatusPill } from '../Shared/EditorialUI';

interface Article {
  article_id: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  image_url?: string;
  author?: string;
  published_date: string;
}

const ArticleManagement: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Sustainability',
    excerpt: '',
    content: '',
    image_url: '',
    author: '',
    published_date: new Date().toISOString().split('T')[0]
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/articles`);
      const data = await response.json();
      setArticles(data.articles || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
      alert('Failed to fetch articles');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (article?: Article) => {
    if (article) {
      setEditingArticle(article);
      setFormData({
        title: article.title,
        category: article.category,
        excerpt: article.excerpt,
        content: article.content,
        image_url: article.image_url || '',
        author: article.author || '',
        published_date: article.published_date
      });
    } else {
      setEditingArticle(null);
      setFormData({
        title: '',
        category: 'Sustainability',
        excerpt: '',
        content: '',
        image_url: '',
        author: '',
        published_date: new Date().toISOString().split('T')[0]
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingArticle(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, image_url: reader.result as string });
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.excerpt || !formData.content) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const url = editingArticle
        ? `${API_BASE_URL}/api/articles/${editingArticle.article_id}`
        : `${API_BASE_URL}/api/articles`;
      
      const method = editingArticle ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert(editingArticle ? 'Article updated successfully!' : 'Article created successfully!');
        handleCloseModal();
        fetchArticles();
      } else {
        const error = await response.json();
        alert('Failed to save article: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving article:', error);
      alert('Failed to save article');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/articles/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('Article deleted successfully!');
        fetchArticles();
      } else {
        const error = await response.json();
        alert('Failed to delete article: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting article:', error);
      alert('Failed to delete article');
    }
  };

  const getCategoryTone = (category: string): 'success' | 'info' | 'warning' | 'neutral' => {
    switch (category) {
      case 'Sustainability':
        return 'success';
      case 'Success Stories':
        return 'info';
      case 'Education':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-[#047857] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <EditorialCard
        title="Article Management"
        subtitle="Manage news articles and educational content"
        badge={articles.length}
        actions={
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl transition-colors text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            New Article
          </button>
        }
      >
        {/* Articles List */}
        {articles.length === 0 ? (
          <div className="text-center py-14 bg-[#F8F9FA] rounded-2xl border border-dashed border-gray-300">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="font-serif text-lg font-bold text-gray-900 mb-1">No articles yet</p>
            <p className="text-sm text-gray-500 mb-5">Publish news and educational guides for farmers and buyers.</p>
            <button
              type="button"
              onClick={() => handleOpenModal()}
              className="px-5 py-2.5 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl transition-colors text-sm font-semibold"
            >
              Create First Article
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {articles.map((article) => (
              <div
                key={article.article_id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col"
              >
                {/* Image */}
                {article.image_url ? (
                  <div className="h-44 overflow-hidden bg-gray-100 border-b border-gray-100">
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-44 bg-[#F8F9FA] border-b border-gray-100 flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-gray-300" />
                  </div>
                )}

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Category & Date */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <StatusPill tone={getCategoryTone(article.category)}>{article.category}</StatusPill>
                      <span className="text-xs text-gray-500 flex items-center tabular-nums">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-gray-400" />
                        {new Date(article.published_date).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-serif text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                      {article.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {article.excerpt}
                    </p>

                    {/* Author */}
                    {article.author && (
                      <p className="text-xs text-gray-500 mb-4">By {article.author}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2.5 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => handleOpenModal(article)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-xs font-semibold"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(article.article_id)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-red-200 text-red-700 rounded-xl hover:bg-red-50 transition-colors text-xs font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </EditorialCard>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white px-6 py-5 border-b border-gray-200 z-10 flex justify-between items-center">
              <h3 className="font-serif text-xl font-bold text-gray-900">
                {editingArticle ? 'Edit Article' : 'Create New Article'}
              </h3>
              <button
                type="button"
                aria-label="Close article modal"
                onClick={handleCloseModal}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857] focus:border-[#047857] text-sm"
                    placeholder="Enter article title"
                    required
                  />
                </div>

                {/* Category & Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857] focus:border-[#047857] text-sm bg-white"
                      required
                    >
                      <option value="Sustainability">Sustainability</option>
                      <option value="Success Stories">Success Stories</option>
                      <option value="Education">Education</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Published Date
                    </label>
                    <input
                      type="date"
                      value={formData.published_date}
                      onChange={(e) => setFormData({ ...formData, published_date: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857] focus:border-[#047857] text-sm tabular-nums"
                    />
                  </div>
                </div>

                {/* Author */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Author
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857] focus:border-[#047857] text-sm"
                    placeholder="Enter author name"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Cover Image
                  </label>
                  <div className="flex items-start gap-4">
                    {formData.image_url && (
                      <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                        <img
                          src={formData.image_url}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, image_url: '' })}
                          className="absolute top-1 right-1 p-1 bg-white border border-gray-200 text-red-600 rounded-full hover:bg-red-50 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857] focus:border-[#047857] text-sm"
                        disabled={uploadingImage}
                      />
                      <p className="text-xs text-gray-500 mt-1.5">
                        Max size: 5MB. Formats: JPG, PNG, GIF
                      </p>
                    </div>
                  </div>
                </div>

                {/* Excerpt */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Excerpt <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    rows={3}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857] focus:border-[#047857] text-sm"
                    placeholder="Brief summary of the article (shown in preview)"
                    required
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={10}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857] focus:border-[#047857] text-sm"
                    placeholder="Full article content"
                    required
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl transition-colors text-sm font-semibold inline-flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingArticle ? 'Update Article' : 'Create Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleManagement;
