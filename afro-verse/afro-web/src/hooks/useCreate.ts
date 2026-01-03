'use client';

import { useState, useCallback } from 'react';
import {
  createGeneration,
  refineGeneration,
  pollGeneration,
  type Generation,
  type CreateGenerationInput,
} from '../services/createService';
import { uploadSelfie, getSelfies, deleteSelfie, type SelfieMetadata } from '../services/uploadService';

export const useCreate = () => {
  const [generation, setGeneration] = useState<Generation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');

  const generate = useCallback(async (input: CreateGenerationInput) => {
    setLoading(true);
    setError(null);
    setProgress('Creating generation...');

    try {
      const response = await createGeneration(input);
      
      setProgress('Generating image...');
      
      // Poll for completion
      const completedGeneration = await pollGeneration(
        response.generationId,
        (gen) => {
          setGeneration(gen);
          if (gen.status === 'running') {
            setProgress('Generating your AfroMoji...');
          }
        }
      );

      setGeneration(completedGeneration);
      setProgress('');
      
      if (completedGeneration.status === 'failed') {
        throw new Error(completedGeneration.error?.message || 'Generation failed');
      }
      
      return completedGeneration;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to generate';
      setError(message);
      setProgress('');
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const refine = useCallback(async (generationId: string, instruction: string) => {
    setLoading(true);
    setError(null);
    setProgress('Refining generation...');

    try {
      const response = await refineGeneration(generationId, instruction);
      
      setProgress('Processing refinement...');
      
      // Poll for completion
      const completedGeneration = await pollGeneration(
        response.generationId,
        (gen) => {
          setGeneration(gen);
          if (gen.status === 'running') {
            setProgress('Refining your AfroMoji...');
          }
        }
      );

      setGeneration(completedGeneration);
      setProgress('');
      
      if (completedGeneration.status === 'failed') {
        throw new Error(completedGeneration.error?.message || 'Refinement failed');
      }
      
      return completedGeneration;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to refine';
      setError(message);
      setProgress('');
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setGeneration(null);
    setError(null);
    setProgress('');
  }, []);

  return {
    generation,
    loading,
    error,
    progress,
    generate,
    refine,
    reset,
  };
};

export const useSelfies = () => {
  const [selfies, setSelfies] = useState<SelfieMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const loadSelfies = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getSelfies();
      setSelfies(data);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to load selfies';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const upload = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const selfie = await uploadSelfie(file, (progress) => {
        setUploadProgress(progress);
      });

      setSelfies(prev => [...prev, selfie]);
      setUploadProgress(0);
      
      return selfie;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to upload';
      setError(message);
      setUploadProgress(0);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (selfieId: string) => {
    try {
      await deleteSelfie(selfieId);
      setSelfies(prev => prev.filter(s => s.id !== selfieId));
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to delete';
      setError(message);
      throw new Error(message);
    }
  }, []);

  return {
    selfies,
    loading,
    error,
    uploadProgress,
    loadSelfies,
    upload,
    remove,
  };
};





