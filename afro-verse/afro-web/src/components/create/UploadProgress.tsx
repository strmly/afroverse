'use client';

import React, { useState, useEffect } from 'react';

interface UploadProgressFile {
  id: string;
  previewUrl: string;
  status: 'uploading' | 'uploaded' | 'error';
  progress?: number;
  uploadStartTime?: number;
}

interface UploadProgressProps {
  show: boolean;
  files: UploadProgressFile[];
  isRemix?: boolean; // For "Try This Style" flow
  onRetry?: (fileId: string) => void;
  onRemove?: (fileId: string) => void;
}

export const UploadProgress: React.FC<UploadProgressProps> = (props) => {
  const { show, files, isRemix = false, onRetry, onRemove } = props;
  const [uploadStartTime] = useState(Date.now());

  console.log('📊 UploadProgress render:', { show, filesCount: files.length, isRemix });

  if (!show || files.length === 0) {
    console.log('⏭️ UploadProgress: Not showing (show:', show, ', files:', files.length, ')');
    return null;
  }

  console.log('✅ UploadProgress: SHOWING overlay');

  const uploadingCount = files.filter((f) => f.status === 'uploading').length;
  const uploadedCount = files.filter((f) => f.status === 'uploaded').length;
  const totalProgress = files.reduce((sum, f) => sum + (f.progress || 0), 0) / files.length;
  const elapsedTime = Date.now() - uploadStartTime;
  const isSlowUpload = uploadingCount > 0 && elapsedTime > 5000;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(10, 10, 10, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        zIndex: 999,
        animation: 'fadeIn 0.3s ease-out',
        padding: '32px',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '32px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: '600px',
        }}
      >
        {files.map((file) => (
          <div
            key={file.id}
            style={{
              position: 'relative',
              width: '120px',
              height: '160px',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundImage: `url(${file.previewUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: file.status === 'uploading' ? 'blur(2px)' : 'none',
              border:
                file.status === 'uploaded'
                  ? '2px solid gold'
                  : file.status === 'error'
                  ? '2px solid #EF4444'
                  : '2px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.3s ease',
            }}
          >
            {file.status === 'uploading' && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                  animation: 'shimmer 2s infinite',
                }}
              />
            )}

            <div
              style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                padding: '4px 8px',
                borderRadius: '12px',
                background: 'rgba(10, 10, 10, 0.8)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: 600,
                color: 'white',
              }}
            >
              {file.status === 'uploading' && <><span>⬆️</span><span>Uploading…</span></>}
              {file.status === 'uploaded' && <><span>✓</span><span>Uploaded</span></>}
              {file.status === 'error' && <><span>⚠️</span><span>Failed</span></>}
            </div>

            {file.status === 'error' && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'rgba(10, 10, 10, 0.9)',
                }}
              >
                <button
                  onClick={() => onRetry && onRetry(file.id)}
                  style={{
                    padding: '8px 16px',
                    background: '#FFFFFF',
                    color: '#0A0A0A',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Retry upload
                </button>
                <button
                  onClick={() => onRemove && onRemove(file.id)}
                  style={{
                    padding: '8px 16px',
                    background: 'transparent',
                    color: '#999',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Remove image
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h2
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'white',
            margin: 0,
            marginBottom: '8px',
          }}
        >
          {isRemix ? 'Preparing this style for you' : 'Uploading your images'}
        </h2>

        <p
          style={{
            fontSize: '16px',
            color: '#999',
            margin: 0,
            marginBottom: '24px',
          }}
        >
          {uploadingCount > 0 
            ? (isSlowUpload ? 'Large images take a little longer — we\'re on it' : 'Preparing them for transformation')
            : 'Almost ready'}
        </p>

        <div
          style={{
            width: '100%',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${totalProgress}%`,
              background: 'gold',
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
          {uploadedCount} of {files.length} uploaded
        </p>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};



