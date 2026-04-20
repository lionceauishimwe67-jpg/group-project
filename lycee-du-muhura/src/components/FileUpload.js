import React, { useState, useRef } from 'react';
import { Upload, File, X, Download, CheckCircle, AlertCircle } from 'lucide-react';
import './FileUpload.css';

const FileUpload = ({ userRole = 'student', onFileUpload }) => {
  const [files, setFiles] = useState([
    {
      id: 1,
      name: 'Assignment_Math_Term2.pdf',
      size: '2.5 MB',
      type: 'application/pdf',
      uploadedBy: 'John Smith',
      date: '2024-01-15',
      status: 'approved'
    },
    {
      id: 2,
      name: 'Science_Project_Document.docx',
      size: '1.8 MB',
      type: 'application/docx',
      uploadedBy: 'Mary Johnson',
      date: '2024-01-14',
      status: 'pending'
    }
  ]);
  
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const allowedTypes = {
    student: ['.pdf', '.doc', '.docx', '.jpg', '.png'],
    teacher: ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.zip'],
    admin: ['.pdf', '.doc', '.docx', '.jpg', '.png', '.zip', '.csv']
  };

  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  };

  const handleFiles = (newFiles) => {
    newFiles.forEach(file => {
      // Check file size
      if (file.size > maxFileSize) {
        alert(`File ${file.name} is too large. Max size is 10MB.`);
        return;
      }

      // Check file type
      const extension = '.' + file.name.split('.').pop().toLowerCase();
      if (!allowedTypes[userRole].includes(extension)) {
        alert(`File type ${extension} not allowed for ${userRole}`);
        return;
      }

      // Simulate upload
      setIsUploading(true);
      
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        
        if (progress >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setUploadProgress(0);
          
          // Add file to list
          const newFile = {
            id: Date.now(),
            name: file.name,
            size: formatFileSize(file.size),
            type: file.type,
            uploadedBy: 'Current User',
            date: new Date().toISOString().split('T')[0],
            status: 'pending'
          };
          
          setFiles(prev => [newFile, ...prev]);
          
          if (onFileUpload) {
            onFileUpload(newFile);
          }
        }
      }, 200);
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const deleteFile = (id) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      setFiles(prev => prev.filter(f => f.id !== id));
    }
  };

  const downloadFile = (file) => {
    // Simulate download
    alert(`Downloading ${file.name}...`);
  };

  const getFileIcon = (type) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('doc')) return '📝';
    if (type.includes('image')) return '🖼️';
    if (type.includes('zip')) return '📦';
    return '📎';
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved':
        return <span className="status-badge approved"><CheckCircle size={12} /> Approved</span>;
      case 'pending':
        return <span className="status-badge pending">⏳ Pending</span>;
      case 'rejected':
        return <span className="status-badge rejected"><AlertCircle size={12} /> Rejected</span>;
      default:
        return null;
    }
  };

  return (
    <div className="file-upload">
      <h3><File size={20} /> Document Management</h3>

      {/* Upload Area */}
      <div 
        className={`upload-area ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload size={48} className="upload-icon" />
        <p className="upload-text">
          {isDragging ? 'Drop files here' : 'Drag & drop files here or click to browse'}
        </p>
        <p className="upload-hint">
          Allowed: {allowedTypes[userRole].join(', ')} (Max 10MB)
        </p>
        
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          accept={allowedTypes[userRole].join(',')}
          style={{ display: 'none' }}
        />
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <span>{uploadProgress}%</span>
        </div>
      )}

      {/* File List */}
      <div className="file-list">
        <h4>Uploaded Files ({files.length})</h4>
        
        {files.length === 0 ? (
          <div className="no-files">
            <p>No files uploaded yet</p>
          </div>
        ) : (
          files.map(file => (
            <div key={file.id} className="file-item">
              <div className="file-icon">{getFileIcon(file.type)}</div>
              
              <div className="file-info">
                <p className="file-name">{file.name}</p>
                <p className="file-meta">
                  {file.size} • Uploaded by {file.uploadedBy} • {file.date}
                </p>
              </div>
              
              <div className="file-status">
                {getStatusBadge(file.status)}
              </div>
              
              <div className="file-actions">
                <button 
                  className="btn-download"
                  onClick={() => downloadFile(file)}
                  title="Download"
                >
                  <Download size={16} />
                </button>
                
                {(userRole === 'admin' || userRole === 'teacher') && (
                  <button 
                    className="btn-delete"
                    onClick={() => deleteFile(file.id)}
                    title="Delete"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FileUpload;
