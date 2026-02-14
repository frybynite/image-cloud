/**
 * ClusterPlacementLayout.ts
 * Generates organic cluster layouts with natural groupings
 */

import type { PlacementLayout, ImageLayout, ContainerBounds, LayoutConfig, ClusterAlgorithmConfig, ImageConfig } from '../config/types';

interface ClusterCenter {
  x: number;
  y: number;
  spread: number; // Actual spread for this cluster (may vary if density='varied')
}

interface ClusterLayoutOptions extends Partial<LayoutConfig> {
  fixedHeight?: number;
}

const DEFAULT_CLUSTER_CONFIG: ClusterAlgorithmConfig = {
  clusterCount: 'auto',
  clusterSpread: 150,
  clusterSpacing: 200,
  density: 'uniform',
  overlap: 0.3,
  distribution: 'gaussian'
};

export class ClusterPlacementLayout implements PlacementLayout {
  private config: LayoutConfig;
  private imageConfig: ImageConfig;

  constructor(config: LayoutConfig, imageConfig: ImageConfig = {}) {
    this.config = config;
    this.imageConfig = imageConfig;
  }

  /**
   * Generate cluster layout positions for images
   * @param imageCount - Number of images to layout
   * @param containerBounds - Container dimensions {width, height}
   * @param options - Optional overrides (includes fixedHeight)
   * @returns Array of layout objects with position, rotation, scale
   */
  generate(
    imageCount: number,
    containerBounds: ContainerBounds,
    options: ClusterLayoutOptions = {}
  ): ImageLayout[] {
    const layouts: ImageLayout[] = [];
    const { width, height } = containerBounds;

    const clusterConfig = { ...DEFAULT_CLUSTER_CONFIG, ...this.config.cluster };
    const padding = this.config.spacing.padding;
    // Use fixedHeight if provided, otherwise use default 200
    const baseImageSize = options.fixedHeight ?? 200;

    // Get rotation config from image config
    const rotationMode = this.imageConfig.rotation?.mode ?? 'none';
    const minRotation = this.imageConfig.rotation?.range?.min ?? -15;
    const maxRotation = this.imageConfig.rotation?.range?.max ?? 15;

    // Get variance config from image config
    const varianceMin = this.imageConfig.sizing?.variance?.min ?? 1.0;
    const varianceMax = this.imageConfig.sizing?.variance?.max ?? 1.0;
    const hasVariance = varianceMin !== 1.0 || varianceMax !== 1.0;

    // Calculate number of clusters
    const clusterCount = this.calculateClusterCount(
      imageCount,
      clusterConfig.clusterCount,
      width,
      height,
      clusterConfig.clusterSpacing
    );

    // Generate cluster centers with spacing constraints
    const clusterCenters = this.generateClusterCenters(
      clusterCount,
      width,
      height,
      padding,
      clusterConfig
    );

    // Assign images to clusters (round-robin for even distribution)
    const imagesPerCluster = new Array(clusterCount).fill(0);
    for (let i = 0; i < imageCount; i++) {
      imagesPerCluster[i % clusterCount]++;
    }

    let imageIndex = 0;

    // Place images in each cluster
    for (let clusterIdx = 0; clusterIdx < clusterCount; clusterIdx++) {
      const cluster = clusterCenters[clusterIdx];
      const imagesInThisCluster = imagesPerCluster[clusterIdx];

      for (let i = 0; i < imagesInThisCluster; i++) {
        // Calculate position within cluster
        let offsetX: number;
        let offsetY: number;

        if (clusterConfig.distribution === 'gaussian') {
          // Gaussian distribution - most images near center, fewer at edges
          offsetX = this.gaussianRandom() * cluster.spread;
          offsetY = this.gaussianRandom() * cluster.spread;
        } else {
          // Uniform distribution within circle
          const angle = this.random(0, Math.PI * 2);
          const distance = this.random(0, cluster.spread);
          offsetX = Math.cos(angle) * distance;
          offsetY = Math.sin(angle) * distance;
        }

        // Apply overlap factor - pulls images closer to center and increases size
        const overlapMultiplier = 1 + clusterConfig.overlap * 0.5;
        const sizeMultiplier = 1 + clusterConfig.overlap * 0.3;

        // Reduce offset based on overlap (images cluster tighter)
        offsetX /= overlapMultiplier;
        offsetY /= overlapMultiplier;

        // Apply variance
        const varianceScale = hasVariance ? this.random(varianceMin, varianceMax) : 1.0;
        const combinedScale = sizeMultiplier * varianceScale;

        // Calculate image size with overlap factor and variance
        const imageSize = baseImageSize * combinedScale;

        // Store center position (not top-left)
        let x = cluster.x + offsetX;
        let y = cluster.y + offsetY;

        // Boundary clamping with center position
        // Use 16:9 aspect ratio (1.78) as maximum to handle most landscape images
        const estAspectRatio = 1.5; // 3:2 - balanced for mixed portrait/landscape
        const halfWidth = (imageSize * estAspectRatio) / 2;
        const halfHeight = imageSize / 2;
        x = Math.max(padding + halfWidth, Math.min(x, width - padding - halfWidth));
        y = Math.max(padding + halfHeight, Math.min(y, height - padding - halfHeight));

        // Rotation - more variance for organic feel (only when mode is random)
        const rotation = rotationMode === 'random' ? this.random(minRotation, maxRotation) : 0;

        // Z-index: images closer to cluster center are on top
        const distanceFromCenter = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
        const normalizedDistance = distanceFromCenter / cluster.spread;
        const zIndex = Math.round((1 - normalizedDistance) * 50) + 1;

        layouts.push({
          id: imageIndex,
          x,
          y,
          rotation,
          scale: combinedScale,
          baseSize: imageSize,
          zIndex
        });

        imageIndex++;
      }
    }

    return layouts;
  }

  /**
   * Calculate optimal number of clusters based on image count and container
   */
  private calculateClusterCount(
    imageCount: number,
    configCount: number | 'auto',
    width: number,
    height: number,
    clusterSpacing: number
  ): number {
    if (configCount !== 'auto') {
      return Math.max(1, Math.min(configCount, imageCount));
    }

    // Auto-calculate based on container size and image count
    // Aim for 5-15 images per cluster
    const idealImagesPerCluster = 8;
    const countByImages = Math.max(1, Math.ceil(imageCount / idealImagesPerCluster));

    // Also consider container size - how many clusters can fit
    const countBySpace = Math.floor(
      (width / clusterSpacing) * (height / clusterSpacing) * 0.6
    );

    return Math.max(1, Math.min(countByImages, countBySpace, 10));
  }

  /**
   * Generate cluster center positions with spacing constraints
   */
  private generateClusterCenters(
    count: number,
    width: number,
    height: number,
    padding: number,
    config: ClusterAlgorithmConfig
  ): ClusterCenter[] {
    const centers: ClusterCenter[] = [];
    const maxAttempts = 100;

    // Available area for cluster centers
    const minX = padding + config.clusterSpread;
    const maxX = width - padding - config.clusterSpread;
    const minY = padding + config.clusterSpread;
    const maxY = height - padding - config.clusterSpread;

    for (let i = 0; i < count; i++) {
      let bestCandidate: ClusterCenter | null = null;
      let bestMinDistance = -1;

      // Try multiple random positions and pick the one with best spacing
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const candidate = {
          x: this.random(minX, maxX),
          y: this.random(minY, maxY),
          spread: this.calculateClusterSpread(config)
        };

        // Calculate minimum distance to existing clusters
        let minDistance = Infinity;
        for (const existing of centers) {
          const dx = candidate.x - existing.x;
          const dy = candidate.y - existing.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          minDistance = Math.min(minDistance, distance);
        }

        // First cluster or better spacing
        if (centers.length === 0 || minDistance > bestMinDistance) {
          bestCandidate = candidate;
          bestMinDistance = minDistance;
        }

        // Good enough spacing found
        if (minDistance >= config.clusterSpacing) {
          break;
        }
      }

      if (bestCandidate) {
        centers.push(bestCandidate);
      }
    }

    return centers;
  }

  /**
   * Calculate spread for a cluster (may vary if density='varied')
   */
  private calculateClusterSpread(config: ClusterAlgorithmConfig): number {
    if (config.density === 'uniform') {
      return config.clusterSpread;
    }

    // Varied density: spread varies between 50% and 150% of config value
    return config.clusterSpread * this.random(0.5, 1.5);
  }

  /**
   * Generate a random number with approximately Gaussian distribution
   * Using Box-Muller transform
   */
  private gaussianRandom(): number {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();

    const value = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);

    // Clamp to reasonable range (-3 to 3 std deviations)
    return Math.max(-3, Math.min(3, value)) / 3;
  }

  /**
   * Utility: Generate random number between min and max
   */
  private random(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }
}
