import React, { useState, useEffect } from 'react';
import { announcementApi } from '../../services/api';
import { Announcement } from '../../types';

interface AvailableImage {
  filename: string;
  path: string;
  url: string;
  size: number;
}

const AnnouncementsManager: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageBrowserOpen, setIsImageBrowserOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [availableImages, setAvailableImages] = useState<AvailableImage[]>([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    image: null as File | null,
    display_order: 0,
    expires_at: '',
  });

  useEffect(() => {
    loadAnnouncements();
    loadAvailableImages();
  }, []);

  // Image compression function
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate new dimensions (max 800x600)
          const maxWidth = 800;
          const maxHeight = 600;
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            height = (maxWidth / width) * height;
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = (maxHeight / height) * width;
            height = maxHeight;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            
            // Compress to JPEG with 0.7 quality
            canvas.toBlob((blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            }, 'image/jpeg', 0.7);
          } else {
            resolve(file);
          }
        };
      };
    });
  };

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await announcementApi.getAllAdmin();
      setAnnouncements(response.data.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      image: null,
      display_order: 0,
      expires_at: '',
    });
    setPreviewImage(null);
    setSelectedImageUrl(null);
    setIsModalOpen(true);
  };

  const loadAvailableImages = async () => {
    try {
      const response = await announcementApi.getAvailableImages();
      setAvailableImages(response.data.data || []);
    } catch (err) {
      console.error('Failed to load available images:', err);
    }
  };

  const openImageBrowser = () => {
    loadAvailableImages();
    setIsImageBrowserOpen(true);
  };

  const selectImageFromBrowser = (image: AvailableImage) => {
    setSelectedImageUrl(image.url);
    setPreviewImage(image.url);
    setFormData({ ...formData, image: null });
    setIsImageBrowserOpen(false);
  };

  const openEditModal = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    
    // Format expires_at for datetime-local input (yyyy-MM-ddThh:mm)
    let formattedExpiresAt = '';
    if (announcement.expires_at) {
      try {
        const date = new Date(announcement.expires_at);
        // Format to yyyy-MM-ddThh:mm
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        formattedExpiresAt = `${year}-${month}-${day}T${hours}:${minutes}`;
      } catch (e) {
        formattedExpiresAt = '';
      }
    }
    
    setFormData({
      title: announcement.title,
      image: null,
      display_order: announcement.display_order,
      expires_at: formattedExpiresAt,
    });
    setPreviewImage(announcement.image_url);
    setIsModalOpen(true);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      try {
        // Compress image
        const compressedFile = await compressImage(file);
        setFormData({ ...formData, image: compressedFile });
        
        // Show preview
        const reader = new FileReader();
        reader.onloadend = () => setPreviewImage(reader.result as string);
        reader.readAsDataURL(compressedFile);
      } catch (err) {
        console.error('Compression failed:', err);
        // Fallback to original file
        setFormData({ ...formData, image: file });
        const reader = new FileReader();
        reader.onloadend = () => setPreviewImage(reader.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = new FormData();
    data.append('title', formData.title);
    data.append('display_order', String(formData.display_order));
    if (formData.expires_at) data.append('expires_at', formData.expires_at);
    if (formData.image) data.append('image', formData.image);
    if (selectedImageUrl && !formData.image) data.append('image_url', selectedImageUrl);

    try {
      if (editingAnnouncement) {
        await announcementApi.update(editingAnnouncement.id, data);
      } else {
        if (!formData.image && !selectedImageUrl) {
          alert('Please select an image');
          return;
        }
        await announcementApi.create(data);
      }
      setIsModalOpen(false);
      loadAnnouncements();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;

    try {
      await announcementApi.delete(id);
      loadAnnouncements();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete');
    }
  };

  const handleToggleActive = async (announcement: Announcement) => {
    const data = new FormData();
    data.append('is_active', String(!announcement.is_active));
    
    try {
      await announcementApi.update(announcement.id, data);
      loadAnnouncements();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update');
    }
  };

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;

  return (
    <div>
      <div className="admin-header">
        <h1 className="page-title">Manage Announcements</h1>
        <div className="header-actions">
          <button onClick={openAddModal} className="btn btn-primary">
            <span>➕</span> Upload Image
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: 16, background: '#fee2e2', color: '#dc2626', borderRadius: 8, marginBottom: 20 }}>
          {error}
        </div>
      )}

      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              style={{
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#fff',
                opacity: announcement.is_active && !announcement.is_expired ? 1 : 0.6,
              }}
            >
              <div style={{ height: '180px', overflow: 'hidden', background: '#f3f4f6' }}>
                <img
                  src={announcement.image_url}
                  alt={announcement.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#9ca3af;font-size:3rem;">📷</div>';
                  }}
                />
              </div>
              <div style={{ padding: '16px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>
                  {announcement.title}
                </h3>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <span className={`badge ${announcement.is_active && !announcement.is_expired ? 'badge-success' : 'badge-warning'}`}>
                    {announcement.is_expired ? 'Expired' : announcement.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="badge badge-info">Order: {announcement.display_order}</span>
                </div>
                {announcement.expires_at && (
                  <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '12px' }}>
                    Expires: {new Date(announcement.expires_at).toLocaleString()}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleToggleActive(announcement)} className="btn btn-secondary btn-sm">
                    {announcement.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => openEditModal(announcement)} className="btn btn-secondary btn-sm">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(announcement.id)} className="btn btn-danger btn-sm">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {announcements.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
            No announcements. Click "Upload Image" to create one.
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingAnnouncement ? 'Edit Announcement' : 'Upload Announcement'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="modal-close">×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter announcement title"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Image</label>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={openImageBrowser}
                      className="btn btn-secondary"
                    >
                      📁 Browse
                    </button>
                  </div>
                  {previewImage && (
                    <div style={{ marginTop: '12px', borderRadius: '8px', overflow: 'hidden' }}>
                      <img 
                        src={previewImage} 
                        alt="Preview" 
                        style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }}
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:200px;color:#9ca3af;font-size:2rem;">📷</div>';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Display Order</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Expires At (optional)</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={formData.expires_at}
                      onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingAnnouncement ? 'Update' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Browser Modal */}
      {isImageBrowserOpen && (
        <div className="modal-overlay" onClick={() => setIsImageBrowserOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '80vh' }}>
            <div className="modal-header">
              <h3 className="modal-title">📁 Choose Image from Gallery</h3>
              <button onClick={() => setIsImageBrowserOpen(false)} className="modal-close">×</button>
            </div>
            
            <div className="modal-body" style={{ overflowY: 'auto', maxHeight: '60vh' }}>
              {availableImages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📂</div>
                  <p>No images found in uploads folder.</p>
                  <p style={{ fontSize: '0.9rem', marginTop: '8px' }}>Upload images first to see them here.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
                  {availableImages.map((image) => (
                    <div
                      key={image.filename}
                      onClick={() => selectImageFromBrowser(image)}
                      style={{
                        cursor: 'pointer',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: selectedImageUrl === image.url ? '3px solid #e94560' : '2px solid #e5e7eb',
                        transition: 'all 0.2s ease',
                        boxShadow: selectedImageUrl === image.url ? '0 4px 20px rgba(233, 69, 96, 0.4)' : '0 2px 8px rgba(0,0,0,0.1)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = selectedImageUrl === image.url ? '0 4px 20px rgba(233, 69, 96, 0.4)' : '0 2px 8px rgba(0,0,0,0.1)';
                      }}
                    >
                      <img
                        src={image.url}
                        alt={image.filename}
                        style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:120px;color:#9ca3af;font-size:2rem;">📷</div>';
                        }}
                      />
                      <div style={{ padding: '8px', background: '#fff', fontSize: '0.8rem' }}>
                        <p style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {image.filename}
                        </p>
                        <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '0.75rem' }}>
                          {(image.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => setIsImageBrowserOpen(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setIsImageBrowserOpen(false)}
                className="btn btn-primary"
                disabled={!selectedImageUrl}
              >
                Select Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsManager;
