import { create } from 'zustand';
import {
  createGeneration,
  refineGeneration,
  pollGeneration,
  type Generation,
  type CreateGenerationInput,
} from '../services/createService';
import { getSelfies, type SelfieMetadata } from '../services/uploadService';

/**
 * Create Store (Frontend)
 * 
 * Manages AI generation state.
 */

interface CreateState {
  // Current generation
  currentGeneration: Generation | null;
  isGenerating: boolean;
  error: string | null;
  
  // User selfies
  selfies: SelfieMetadata[];
  selectedSelfieIds: string[];
  
  // Generation params
  mode: 'preset' | 'prompt' | 'try_style';
  presetId: string | null;
  prompt: string;
  aspect: '1:1' | '9:16';
  quality: 'standard' | 'high';
  
  // Actions
  loadSelfies: () => Promise<void>;
  setSelectedSelfies: (ids: string[]) => void;
  setMode: (mode: 'preset' | 'prompt' | 'try_style') => void;
  setPreset: (presetId: string) => void;
  setPrompt: (prompt: string) => void;
  setAspect: (aspect: '1:1' | '9:16') => void;
  setQuality: (quality: 'standard' | 'high') => void;
  generate: () => Promise<Generation>;
  refine: (instruction: string) => Promise<Generation>;
  clearError: () => void;
  reset: () => void;
}

export const useCreateStore = create<CreateState>((set, get) => ({
  // Initial state
  currentGeneration: null,
  isGenerating: false,
  error: null,
  selfies: [],
  selectedSelfieIds: [],
  mode: 'preset',
  presetId: null,
  prompt: '',
  aspect: '1:1',
  quality: 'standard',
  
  // Load user's selfies
  loadSelfies: async () => {
    try {
      const selfies = await getSelfies();
      set({ selfies });
      
      // Auto-select first selfie if none selected
      if (selfies.length > 0 && get().selectedSelfieIds.length === 0) {
        set({ selectedSelfieIds: [selfies[0].id] });
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to load selfies' });
    }
  },
  
  // Set selected selfies
  setSelectedSelfies: (ids: string[]) => {
    set({ selectedSelfieIds: ids });
  },
  
  // Set generation mode
  setMode: (mode: 'preset' | 'prompt' | 'try_style') => {
    set({ mode });
  },
  
  // Set preset
  setPreset: (presetId: string) => {
    set({ presetId, mode: 'preset' });
  },
  
  // Set prompt
  setPrompt: (prompt: string) => {
    set({ prompt });
  },
  
  // Set aspect ratio
  setAspect: (aspect: '1:1' | '9:16') => {
    set({ aspect });
  },
  
  // Set quality
  setQuality: (quality: 'standard' | 'high') => {
    set({ quality });
  },
  
  // Generate new image
  generate: async () => {
    const state = get();
    
    if (state.selectedSelfieIds.length === 0) {
      throw new Error('Please select at least one selfie');
    }
    
    set({ isGenerating: true, error: null });
    
    try {
      const input: CreateGenerationInput = {
        selfieIds: state.selectedSelfieIds,
        mode: state.mode,
        presetId: state.presetId || undefined,
        prompt: state.prompt || undefined,
        aspect: state.aspect,
        quality: state.quality,
      };
      
      // Create generation
      const response = await createGeneration(input);
      
      // Poll for completion
      const generation = await pollGeneration(
        response.generationId,
        (gen) => {
          set({ currentGeneration: gen });
        }
      );
      
      set({
        currentGeneration: generation,
        isGenerating: false,
      });
      
      return generation;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Generation failed',
        isGenerating: false,
      });
      throw error;
    }
  },
  
  // Refine current generation
  refine: async (instruction: string) => {
    const { currentGeneration } = get();
    
    if (!currentGeneration) {
      throw new Error('No generation to refine');
    }
    
    set({ isGenerating: true, error: null });
    
    try {
      // Refine generation
      const response = await refineGeneration(currentGeneration.id, instruction);
      
      // Poll for completion
      const generation = await pollGeneration(
        response.generationId,
        (gen) => {
          set({ currentGeneration: gen });
        }
      );
      
      set({
        currentGeneration: generation,
        isGenerating: false,
      });
      
      return generation;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Refinement failed',
        isGenerating: false,
      });
      throw error;
    }
  },
  
  // Clear error
  clearError: () => {
    set({ error: null });
  },
  
  // Reset state
  reset: () => {
    set({
      currentGeneration: null,
      isGenerating: false,
      error: null,
      selectedSelfieIds: [],
      prompt: '',
      presetId: null,
    });
  },
}));







