'use client';

import { useState, useRef } from 'react';
import { uploadSelfie, getSelfies, deleteSelfie, type SelfieMetadata } from '../../../services/uploadService';

/**
 * UploadSelfie Component
 * 
 * Selfie upload with GCS signed URLs.
 * Handles full upload pipeline: init → upload → complete.
 */

interface UploadSelfieProps {
  onComplete: () => void;
}

export default function UploadSelfie({ onComplete }: UploadSelfieProps) {
  const [selfies, setSelfies] = useState<SelfieMetadata[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Load selfies on mount
  useState(() => {
    loadSelfies();
  });
  
  const loadSelfies = async () => {
    try {
      const data = await getSelfies();
      setSelfies(data);
    } catch (err) {
      console.error('Failed to load selfies:', err);
    }
  };
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
      return;
    }
    
    // Create preview
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
    
    // Start upload
    setError(null);
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      await uploadSelfie(file, setUploadProgress);
      
      // Reload selfies
      await loadSelfies();
      
      // Clear preview
      URL.revokeObjectURL(preview);
      setPreviewUrl(null);
      
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload selfie');
      URL.revokeObjectURL(preview);
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  
  const handleDelete = async (selfieId: string) => {
    try {
      await deleteSelfie(selfieId);
      await loadSelfies();
    } catch (err) {
      setError('Failed to delete selfie');
    }
  };
  
  const handleContinue = () => {
    if (selfies.length === 0) {
      setError('Please upload at least one selfie');
      return;
    }
    onComplete();
  };
  
  return (
    <div className="upload-selfie">
      <div className="upload-header">
        <h1>Upload Your Selfie</h1>
        <p>Add photos of yourself to create your AfroMoji identity</p>
      </div>
      
      <div className="upload-content">
        {/* Upload button */}
        <div className="upload-zone">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            disabled={isUploading || selfies.length >= 3}
            style={{ display: 'none' }}
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="upload-btn"
            disabled={isUploading || selfies.length >= 3}
          >
            {isUploading ? (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span>{uploadProgress}%</span>
              </div>
            ) : (
              <>
                <span className="upload-icon">📸</span>
                <span>
                  {selfies.length >= 3 
                    ? 'Maximum selfies reached' 
                    : 'Upload Selfie'}
                </span>
              </>
            )}
          </button>
          
          <p className="upload-hint">
            JPEG, PNG, or WebP • Max 8MB • Min 512x512px
            <br />
            {selfies.length} / 3 selfies uploaded
          </p>
        </div>
        
        {/* Preview during upload */}
        {previewUrl && (
          <div className="upload-preview">
            <img src={previewUrl} alt="Upload preview" />
          </div>
        )}
        
        {/* Selfie grid */}
        {selfies.length > 0 && (
          <div className="selfie-grid">
            {selfies.map((selfie) => (
              <div key={selfie.id} className="selfie-card">
                <div className="selfie-placeholder">
                  ✓ Uploaded
                </div>
                <button
                  onClick={() => handleDelete(selfie.id)}
                  className="delete-btn"
                  type="button"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <button
          onClick={handleContinue}
          className="continue-btn"
          disabled={selfies.length === 0}
        >
          Continue
        </button>
      </div>
      
      <style jsx>{`
        .upload-selfie {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem;
          max-width: 600px;
          margin: 0 auto;
        }
        
        .upload-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .upload-header h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }
        
        .upload-header p {
          font-size: 1rem;
          color: var(--text-secondary);
        }
        
        .upload-content {
          width: 100%;
        }
        
        .upload-zone {
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .upload-btn {
          width: 100%;
          padding: 2rem;
          background: var(--surface);
          border: 2px dashed var(--border);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        
        .upload-btn:hover:not(:disabled) {
          border-color: var(--primary);
          background: var(--surface-hover);
        }
        
        .upload-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .upload-icon {
          font-size: 3rem;
        }
        
        .upload-progress {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          align-items: center;
        }
        
        .progress-bar {
          width: 100%;
          height: 8px;
          background: var(--border);
          border-radius: 4px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background: var(--primary);
          transition: width 0.3s ease;
        }
        
        .upload-hint {
          margin-top: 1rem;
          font-size: 0.875rem;
          color: var(--text-tertiary);
          line-height: 1.5;
        }
        
        .upload-preview {
          margin-bottom: 2rem;
          border-radius: 12px;
          overflow: hidden;
        }
        
        .upload-preview img {
          width: 100%;
          height: auto;
          display: block;
        }
        
        .selfie-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }
        
        .selfie-card {
          position: relative;
          aspect-ratio: 1;
          background: var(--surface);
          border: 2px solid var(--border);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .selfie-placeholder {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }
        
        .delete-btn {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          background: var(--error);
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          opacity: 0;
          transition: opacity 0.2s;
        }
        
        .selfie-card:hover .delete-btn {
          opacity: 1;
        }
        
        .continue-btn {
          width: 100%;
          padding: 1rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1.125rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        
        .continue-btn:hover:not(:disabled) {
          opacity: 0.9;
        }
        
        .continue-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .error-message {
          padding: 0.75rem;
          background: #fee;
          color: #c33;
          border-radius: 8px;
          font-size: 0.875rem;
          margin-bottom: 1rem;
          text-align: center;
        }
      `}</style>
    </div>
  );
}







