// AI Service for cloud-based file analysis
export interface ImageAnalysisResult {
  similarity: number;
  tags: string[];
  dominantColors: string[];
  faces: number;
  objects: string[];
}

export interface ContentCluster {
  id: string;
  name: string;
  files: string[];
  confidence: number;
  type: 'similar_images' | 'related_content' | 'project_files' | 'duplicates';
}

export class AIService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = '/api/ai') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async analyzeImage(imageBlob: Blob): Promise<ImageAnalysisResult> {
    try {
      const formData = new FormData();
      formData.append('image', imageBlob);

      const response = await fetch(`${this.baseUrl}/analyze-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`AI analysis failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Image analysis error:', error);
      // Return fallback result
      return {
        similarity: 0,
        tags: [],
        dominantColors: [],
        faces: 0,
        objects: []
      };
    }
  }

  async findSimilarImages(imageIds: string[]): Promise<Array<{id1: string, id2: string, similarity: number}>> {
    try {
      const response = await fetch(`${this.baseUrl}/find-similar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageIds })
      });

      if (!response.ok) {
        throw new Error(`Similarity search failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Similarity search error:', error);
      return [];
    }
  }

  async clusterContent(fileMetadata: Array<{id: string, type: string, name: string, path: string}>): Promise<ContentCluster[]> {
    try {
      const response = await fetch(`${this.baseUrl}/cluster-content`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ files: fileMetadata })
      });

      if (!response.ok) {
        throw new Error(`Content clustering failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Content clustering error:', error);
      return [];
    }
  }

  async analyzeUsagePatterns(userActions: Array<{action: string, fileId: string, timestamp: number}>): Promise<{suggestions: string[], patterns: string[]}> {
    try {
      const response = await fetch(`${this.baseUrl}/analyze-usage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ actions: userActions })
      });

      if (!response.ok) {
        throw new Error(`Usage analysis failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Usage analysis error:', error);
      return { suggestions: [], patterns: [] };
    }
  }
}

// Mock AI service for development
export class MockAIService extends AIService {
  constructor() {
    super('mock-key');
  }

  async analyzeImage(imageBlob: Blob): Promise<ImageAnalysisResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      similarity: Math.random(),
      tags: ['photo', 'landscape', 'nature'],
      dominantColors: ['#4a90e2', '#7ed321', '#f5a623'],
      faces: Math.floor(Math.random() * 3),
      objects: ['tree', 'sky', 'mountain']
    };
  }

  async findSimilarImages(imageIds: string[]): Promise<Array<{id1: string, id2: string, similarity: number}>> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const similarities = [];
    for (let i = 0; i < imageIds.length; i++) {
      for (let j = i + 1; j < imageIds.length; j++) {
        if (Math.random() > 0.7) { // 30% chance of similarity
          similarities.push({
            id1: imageIds[i],
            id2: imageIds[j],
            similarity: 0.7 + Math.random() * 0.3
          });
        }
      }
    }
    
    return similarities;
  }

  async clusterContent(fileMetadata: Array<{id: string, type: string, name: string, path: string}>): Promise<ContentCluster[]> {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const clusters: ContentCluster[] = [];
    
    // Group by file type
    const imageFiles = fileMetadata.filter(f => f.type.includes('image'));
    const videoFiles = fileMetadata.filter(f => f.type.includes('video'));
    const docFiles = fileMetadata.filter(f => f.type.includes('document'));
    
    if (imageFiles.length > 1) {
      clusters.push({
        id: 'cluster-images',
        name: 'Similar Images',
        files: imageFiles.map(f => f.id),
        confidence: 0.85,
        type: 'similar_images'
      });
    }
    
    if (videoFiles.length > 1) {
      clusters.push({
        id: 'cluster-videos',
        name: 'Video Collection',
        files: videoFiles.map(f => f.id),
        confidence: 0.75,
        type: 'related_content'
      });
    }
    
    return clusters;
  }

  async analyzeUsagePatterns(userActions: Array<{action: string, fileId: string, timestamp: number}>): Promise<{suggestions: string[], patterns: string[]}> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return {
      suggestions: [
        'Consider grouping recent photos by date',
        'You often access documents and images together',
        'Create a workspace for your current project files'
      ],
      patterns: [
        'Frequently accesses images after documents',
        'Prefers organizing by project rather than file type',
        'Most active during afternoon hours'
      ]
    };
  }
}