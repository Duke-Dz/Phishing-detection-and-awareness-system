import React, { useCallback, useState } from 'react';

/**
 * Common FileUpload component for drag-and-drop file selection.
 * Handles images, PDFs, and EML files for reports.
 */
const FileUpload = ({ onFileSelect, accept, maxFileSizeMB = 5 }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // Validate and pass file to parent
      const file = e.dataTransfer.files[0];
      // Validation logic goes here...
      onFileSelect(file);
    }
  }, [onFileSelect]);

  return (
    <div 
      className={`border-2 border-dashed p-6 text-center ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <p>Drag and drop your file here, or click to browse</p>
      {/* File input element goes here */}
    </div>
  );
};

export default FileUpload;
