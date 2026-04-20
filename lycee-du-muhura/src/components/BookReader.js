import React, { useState, useEffect } from 'react';
import { BookOpen, X, ChevronLeft, ChevronRight, Download, Eye } from 'lucide-react';
import './BookReader.css';

const BookReader = ({ book, onClose }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [fontSize, setFontSize] = useState(16);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (book?._id) {
      fetch(`/api/books/${book._id}/view`, { method: 'POST' });
    }
    setIsLoading(false);
  }, [book]);

  if (!book) return null;

  const pages = book.content ? book.content.split('\n\n') : ['No content available'];
  const totalPages = pages.length;

  const nextPage = () => {
    if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };

  return (
    <div className="book-reader-overlay">
      <div className="book-reader">
        <div className="reader-header">
          <div className="reader-title">
            <BookOpen size={20} />
            <h3>{book.title}</h3>
            <span className="author">by {book.author}</span>
          </div>
          <div className="reader-controls">
            <button onClick={() => setFontSize(s => Math.max(12, s - 2))}>A-</button>
            <span>{fontSize}px</span>
            <button onClick={() => setFontSize(s => Math.min(24, s + 2))}>A+</button>
            {book.fileUrl && (
              <button className="download-btn" onClick={() => window.open(book.fileUrl, '_blank')}>
                <Download size={18} />
              </button>
            )}
            <button className="close-btn" onClick={onClose}>
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="reader-content" style={{ fontSize: `${fontSize}px` }}>
          {isLoading ? (
            <div className="loading">Loading book...</div>
          ) : (
            <div className="page-content">
              <h4>{book.subject}</h4>
              <p>{pages[currentPage]}</p>
            </div>
          )}
        </div>

        <div className="reader-footer">
          <button onClick={prevPage} disabled={currentPage === 0}>
            <ChevronLeft size={20} /> Previous
          </button>
          <span className="page-number">
            Page {currentPage + 1} of {totalPages}
          </span>
          <button onClick={nextPage} disabled={currentPage === totalPages - 1}>
            Next <ChevronRight size={20} />
          </button>
        </div>

        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default BookReader;
