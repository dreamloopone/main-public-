import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FileSystemPanel } from './components/FileSystemPanel';
import { FileDetailsPanel } from './components/FileDetailsPanel';
import { FileSystemAccessPanel } from './components/FileSystemAccessPanel';
import { createSampleFileSystem } from './data/sampleFileSystem';
import { FileNode, FileSystemState } from './types/FileSystem';
import { getFileColor, findNodeById, toggleNodeExpansion, flattenFileTree } from './utils/fileSystemUtils';
import { convertRealFilesToFileNodes, performRealFileOperation } from './utils/realFileSystemUtils';
import { useFileSystemAPI } from './hooks/useFileSystemAPI';

interface Vector3 {
  x: number;
  y: number;
  z: number;
}

interface ASCIINode {
  char: string;
  pos: Vector3;
  color: string;
  isRoot: boolean;
  shimmerPhase: number;
  hoverOffset: number;
  fileNode?: FileNode;
  depth?: number;
  parentPos?: Vector3;
}

interface Camera {
  position: Vector3;
  rotation: { x: number; y: number };
}

interface GridLine {
  start: Vector3;
  end: Vector3;
  color: string;
  opacity: number;
  axis: 'x' | 'z';
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileSystemAPI = useFileSystemAPI();
  
  const [camera, setCamera] = useState<Camera>({
    position: { x: 0, y: 2, z: -1.2 }, // MUCH closer - almost touching the tree structure
    rotation: { x: -0.2, y: 0 }
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const [treeStructure, setTreeStructure] = useState<ASCIINode[]>([]);
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [animationTime, setAnimationTime] = useState(0);
  const animationRef = useRef<number>();

  // File System State
  const [fileSystem, setFileSystem] = useState<FileNode | null>(null);
  const [isRealFileSystem, setIsRealFileSystem] = useState(false);
  const [fileSystemState, setFileSystemState] = useState<FileSystemState>({
    currentPath: '/',
    selectedNode: null,
    expandedDirectories: new Set(['root', 'documents', 'projects']),
    searchQuery: '',
    viewMode: 'tree'
  });

  // Navigation state
  const [currentNavigationNode, setCurrentNavigationNode] = useState<string>('root');

  // Handle real directory selection
  const handleDirectorySelected = useCallback((dirHandle: FileSystemDirectoryHandle, files: any[]) => {
    console.log('Directory selected:', dirHandle.name);
    console.log('Files found:', files.length);
    
    // Convert real files to our file system structure
    const convertedFileSystem = convertRealFilesToFileNodes(files, dirHandle.name);
    setFileSystem(convertedFileSystem);
    setIsRealFileSystem(true);
    setCurrentNavigationNode(convertedFileSystem.id);
    
    // Update file system state
    setFileSystemState(prev => ({
      ...prev,
      currentPath: `/${dirHandle.name}`,
      selectedNode: null,
      expandedDirectories: new Set([convertedFileSystem.id])
    }));
  }, []);

  // Generate 2D floor grid (X-Z plane only)
  const generateFloorGrid = useCallback((): GridLine[] => {
    const lines: GridLine[] = [];
    const gridSize = 15;
    const step = 1;
    const floorY = 0;

    // X-axis lines running along Z direction
    for (let x = -gridSize; x <= gridSize; x += step) {
      const isMainLine = x === 0;
      lines.push({
        start: { x, y: floorY, z: -gridSize },
        end: { x, y: floorY, z: gridSize },
        color: isMainLine ? '#10b981' : '#10b981',
        opacity: isMainLine ? 0.2 : 0.075,
        axis: 'x'
      });
    }

    // Z-axis lines running along X direction
    for (let z = -gridSize; z <= gridSize; z += step) {
      const isMainLine = z === 0;
      lines.push({
        start: { x: -gridSize, y: floorY, z },
        end: { x: gridSize, y: floorY, z },
        color: isMainLine ? '#10b981' : '#10b981',
        opacity: isMainLine ? 0.2 : 0.075,
        axis: 'z'
      });
    }

    return lines;
  }, []);

  // Convert file system to 3D tree visualization - SIMPLE 3D branching
  const generateFileSystemTree = useCallback((rootNode: FileNode): ASCIINode[] => {
    const nodes: ASCIINode[] = [];
    const nodePositions = new Map<string, Vector3>();
    const usedPositions = new Set<string>(); // Track used positions to prevent overlaps
    
    // Helper function to check if a position is too close to existing ones
    const isPositionTooClose = (pos: Vector3, minDistance: number = 0.8): boolean => {
      const key = `${Math.round(pos.x * 3)}_${Math.round(pos.y * 3)}_${Math.round(pos.z * 3)}`;
      return usedPositions.has(key);
    };
    
    // Helper function to mark a position as used
    const markPositionUsed = (pos: Vector3): void => {
      const key = `${Math.round(pos.x * 3)}_${Math.round(pos.y * 3)}_${Math.round(pos.z * 3)}`;
      usedPositions.add(key);
    };
    
    // Simple 3D distribution - children spread around parent in 3D space
    const generateChildPositions = (parentPos: Vector3, childCount: number, depth: number): Vector3[] => {
      const positions: Vector3[] = [];
      const baseRadius = 1.5 + depth * 0.3; // Radius increases slightly with depth
      
      for (let i = 0; i < childCount; i++) {
        // Simple circular distribution with 3D variation
        const angle = (i / childCount) * Math.PI * 2;
        const radiusVariation = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
        const radius = baseRadius * radiusVariation;
        
        // Add some Y variation for 3D effect
        const yVariation = (Math.random() - 0.5) * 1.0; // -0.5 to 0.5
        
        // Add some Z variation for true 3D
        const zVariation = (Math.random() - 0.5) * 1.5; // -0.75 to 0.75
        
        let position = {
          x: parentPos.x + Math.cos(angle) * radius,
          y: parentPos.y - 1.2 + yVariation, // Generally go down but with variation
          z: parentPos.z + Math.sin(angle) * radius + zVariation
        };
        
        // Ensure no positions are too close to existing ones
        let attempts = 0;
        while (isPositionTooClose(position) && attempts < 10) {
          const offset = 0.3 + attempts * 0.2;
          const offsetAngle = Math.random() * Math.PI * 2;
          
          position = {
            x: position.x + Math.cos(offsetAngle) * offset,
            y: position.y + (Math.random() - 0.5) * offset,
            z: position.z + Math.sin(offsetAngle) * offset
          };
          attempts++;
        }
        
        markPositionUsed(position);
        positions.push(position);
      }
      
      return positions;
    };
    
    const processNode = (node: FileNode, depth: number, parentPos?: Vector3, siblingIndex: number = 0, totalSiblings: number = 1) => {
      const isDirectory = node.type === 'directory';
      
      // Calculate position based on tree structure
      let position: Vector3;
      
      if (depth === 0) {
        // Root node at center
        position = { x: 0, y: 2, z: 0 };
        markPositionUsed(position);
      } else {
        // Get pre-calculated position for this child
        const childPositions = generateChildPositions(parentPos!, totalSiblings, depth);
        position = childPositions[siblingIndex] || {
          x: (parentPos?.x || 0) + (Math.random() - 0.5) * 2,
          y: (parentPos?.y || 2) - 1.2,
          z: (parentPos?.z || 0) + (Math.random() - 0.5) * 2
        };
      }
      
      nodePositions.set(node.id, position);
      
      // Choose character based on file type
      let char = '●';
      if (isDirectory) {
        char = node.isExpanded ? '📂' : '📁';
      } else {
        switch (node.extension) {
          case 'md': char = '📝'; break;
          case 'tsx':
          case 'jsx':
          case 'ts':
          case 'js': char = '⚛️'; break;
          case 'html': char = '🌐'; break;
          case 'css': char = '🎨'; break;
          case 'pdf': char = '📄'; break;
          case 'xlsx':
          case 'xls': char = '📊'; break;
          case 'jpg':
          case 'jpeg':
          case 'png':
          case 'gif': char = '🖼️'; break;
          case 'mp4':
          case 'avi':
          case 'mov': char = '🎬'; break;
          case 'json': char = '⚙️'; break;
          case 'log': char = '📋'; break;
          default: char = '📄'; break;
        }
      }
      
      nodes.push({
        char,
        pos: position,
        color: getFileColor(node),
        isRoot: depth === 0,
        shimmerPhase: Math.random() * Math.PI * 2,
        hoverOffset: Math.random() * Math.PI * 2,
        fileNode: node,
        depth,
        parentPos
      });
      
      // Process children if directory is expanded
      if (isDirectory && node.isExpanded && node.children) {
        node.children.forEach((child, index) => {
          processNode(child, depth + 1, position, index, node.children!.length);
        });
      }
    };
    
    processNode(rootNode, 0);
    return nodes;
  }, []);

  // 3D projection with camera position and rotation
  const project3D = useCallback((point: Vector3, width: number, height: number) => {
    const distance = 8; // Reduced from 15 to 8 for closer projection
    const cosX = Math.cos(camera.rotation.x);
    const sinX = Math.sin(camera.rotation.x);
    const cosY = Math.cos(camera.rotation.y);
    const sinY = Math.sin(camera.rotation.y);

    // Translate by camera position
    let x = point.x - camera.position.x;
    let y = point.y - camera.position.y;
    let z = point.z - camera.position.z;

    // Apply rotation transformations
    const x1 = x * cosY - z * sinY;
    const z1 = x * sinY + z * cosY;

    const y2 = y * cosX - z1 * sinX;
    const z2 = y * sinX + z1 * cosX;

    // Perspective projection with larger scale multiplier
    const scale = distance / (distance + z2);
    return {
      x: width / 2 + x1 * scale * 120, // Increased from 45 to 120 for much larger nodes
      y: height / 2 - y2 * scale * 120, // Increased from 45 to 120 for much larger nodes
      scale,
      depth: z2
    };
  }, [camera]);

  // WASD movement update function
  const updateCameraMovement = useCallback(() => {
    if (keys.size === 0) return;

    const moveSpeed = 0.08;
    const cosY = Math.cos(camera.rotation.y);
    const sinY = Math.sin(camera.rotation.y);

    setCamera(prev => {
      const newPosition = { ...prev.position };

      if (keys.has('KeyW')) {
        newPosition.x += sinY * moveSpeed;
        newPosition.z += cosY * moveSpeed;
      }
      if (keys.has('KeyS')) {
        newPosition.x -= sinY * moveSpeed;
        newPosition.z -= cosY * moveSpeed;
      }
      if (keys.has('KeyA')) {
        newPosition.x -= cosY * moveSpeed;
        newPosition.z += sinY * moveSpeed;
      }
      if (keys.has('KeyD')) {
        newPosition.x += cosY * moveSpeed;
        newPosition.z -= sinY * moveSpeed;
      }
      if (keys.has('KeyQ')) {
        newPosition.y += moveSpeed;
      }
      if (keys.has('KeyE')) {
        newPosition.y -= moveSpeed;
      }

      return { ...prev, position: newPosition };
    });
  }, [keys, camera.rotation.y]);

  // Calculate shimmer and hover effects
  const calculateNodeEffects = useCallback((node: ASCIINode, time: number) => {
    const shimmerSpeed = node.isRoot ? 1.5 : 2.0;
    const shimmerIntensity = node.isRoot ? 0.3 : 0.2;
    const shimmer = Math.sin(time * shimmerSpeed + node.shimmerPhase) * shimmerIntensity + 1;
    
    const hoverSpeed = node.isRoot ? 0.8 : 1.2;
    const hoverIntensity = node.isRoot ? 0.08 : 0.05;
    const hover = Math.sin(time * hoverSpeed + node.hoverOffset) * hoverIntensity;
    
    const isSpecialChar = ['📂', '📁', '📝', '⚛️', '🌐', '🎨', '📄', '📊', '🖼️', '🎬', '⚙️', '📋'].some(char => node.char.includes(char));
    const specialShimmer = isSpecialChar ? 1.2 : 1.0;
    
    return {
      shimmer: shimmer * specialShimmer,
      hover,
      isSpecial: isSpecialChar
    };
  }, []);

  // Auto-expand folder function
  const autoExpandFolder = useCallback((nodeId: string) => {
    const node = findNodeById(fileSystem, nodeId);
    if (node && node.type === 'directory' && !node.isExpanded) {
      setFileSystem(prev => toggleNodeExpansion(prev, nodeId));
    }
  }, [fileSystem]);

  // Handle node clicks in 3D view
  const handleNodeClick = useCallback((clickX: number, clickY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !fileSystem) return;

    // Find the closest node to the click position
    let closestNode: ASCIINode | null = null;
    let closestDistance = Infinity;

    treeStructure.forEach(node => {
      if (node.fileNode) {
        const effects = calculateNodeEffects(node, animationTime);
        const animatedPos = {
          x: node.pos.x,
          y: node.pos.y + effects.hover,
          z: node.pos.z
        };
        
        const projected = project3D(animatedPos, canvas.width, canvas.height);
        if (projected.scale > 0.1) {
          const distance = Math.sqrt(
            Math.pow(projected.x - clickX, 2) + 
            Math.pow(projected.y - clickY, 2)
          );
          
          if (distance < 30 && distance < closestDistance) {
            closestDistance = distance;
            closestNode = node;
          }
        }
      }
    });

    if (closestNode && closestNode.fileNode) {
      setFileSystemState(prev => ({
        ...prev,
        selectedNode: closestNode!.fileNode!.id,
        currentPath: closestNode!.fileNode!.path
      }));
      setCurrentNavigationNode(closestNode.fileNode.id);
      
      // Auto-expand folder if it's a directory
      autoExpandFolder(closestNode.fileNode.id);
    }
  }, [treeStructure, calculateNodeEffects, animationTime, project3D, autoExpandFolder, fileSystem]);

  // Spatial navigation functions based on camera perspective
  const findClosestNodeInDirection = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const currentNode = treeStructure.find(node => 
      node.fileNode && node.fileNode.id === currentNavigationNode
    );
    
    if (!currentNode) return null;

    const currentProjected = project3D(currentNode.pos, canvas.width, canvas.height);
    let bestNode: ASCIINode | null = null;
    let bestScore = Infinity;

    treeStructure.forEach(node => {
      if (!node.fileNode || node.fileNode.id === currentNavigationNode) return;

      const projected = project3D(node.pos, canvas.width, canvas.height);
      if (projected.scale < 0.1) return; // Skip nodes that are too far away

      const dx = projected.x - currentProjected.x;
      const dy = projected.y - currentProjected.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      let isInDirection = false;
      let directionalScore = 0;

      switch (direction) {
        case 'up':
          isInDirection = dy < -20; // Must be significantly above
          directionalScore = Math.abs(dx) + (-dy); // Prefer more upward and less horizontal offset
          break;
        case 'down':
          isInDirection = dy > 20; // Must be significantly below
          directionalScore = Math.abs(dx) + dy; // Prefer more downward and less horizontal offset
          break;
        case 'left':
          isInDirection = dx < -20; // Must be significantly to the left
          directionalScore = Math.abs(dy) + (-dx); // Prefer more leftward and less vertical offset
          break;
        case 'right':
          isInDirection = dx > 20; // Must be significantly to the right
          directionalScore = Math.abs(dy) + dx; // Prefer more rightward and less vertical offset
          break;
      }

      if (isInDirection && directionalScore < bestScore) {
        bestScore = directionalScore;
        bestNode = node;
      }
    });

    return bestNode;
  }, [treeStructure, currentNavigationNode, project3D]);

  const navigateInDirection = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    const targetNode = findClosestNodeInDirection(direction);
    
    if (targetNode && targetNode.fileNode) {
      setCurrentNavigationNode(targetNode.fileNode.id);
      setFileSystemState(prev => ({
        ...prev,
        selectedNode: targetNode.fileNode!.id,
        currentPath: targetNode.fileNode!.path
      }));
      
      // Auto-expand folder if it's a directory
      autoExpandFolder(targetNode.fileNode.id);
    }
  }, [findClosestNodeInDirection, autoExpandFolder]);

  // Handle real file operations
  const handleRealFileOperation = useCallback(async (operation: string, nodeId: string) => {
    if (!fileSystem || !isRealFileSystem) return;
    
    try {
      const updatedFileSystem = await performRealFileOperation(operation, nodeId, fileSystem, fileSystemAPI);
      if (updatedFileSystem) {
        setFileSystem(updatedFileSystem);
      }
    } catch (error) {
      console.error('File operation failed:', error);
    }
  }, [fileSystem, isRealFileSystem, fileSystemAPI]);

  // Simple camera recentering function - just zoom in closer to current node
  const recenterCameraOnCurrentNode = useCallback(() => {
    const currentNode = treeStructure.find(node => 
      node.fileNode && node.fileNode.id === currentNavigationNode
    );
    
    if (currentNode) {
      // Calculate optimal camera position for closer inspection
      const targetPos = currentNode.pos;
      const optimalDistance = 1.5; // Even closer viewing distance
      
      // Position camera behind and slightly above the target
      const cameraOffset = {
        x: -Math.sin(camera.rotation.y) * optimalDistance,
        y: 1.0,
        z: -Math.cos(camera.rotation.y) * optimalDistance
      };
      
      const targetCameraPosition = {
        x: targetPos.x + cameraOffset.x,
        y: targetPos.y + cameraOffset.y,
        z: targetPos.z + cameraOffset.z
      };

      // Instantly move camera to new position (no animation to avoid lockup)
      setCamera(prev => ({
        ...prev,
        position: targetCameraPosition
      }));
    }
  }, [treeStructure, currentNavigationNode, camera.rotation.y]);

  // Render the floor grid and tree structure
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Pure black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Generate and render floor grid
    const gridLines = generateFloorGrid();
    
    gridLines.forEach(line => {
      const startProj = project3D(line.start, canvas.width, canvas.height);
      const endProj = project3D(line.end, canvas.width, canvas.height);
      
      if (startProj.scale > 0.1 && endProj.scale > 0.1) {
        ctx.strokeStyle = line.color;
        ctx.globalAlpha = line.opacity * Math.min(startProj.scale, endProj.scale);
        ctx.lineWidth = line.opacity > 0.15 ? 2 : 1;
        
        ctx.beginPath();
        ctx.moveTo(startProj.x, startProj.y);
        ctx.lineTo(endProj.x, endProj.y);
        ctx.stroke();
      }
    });

    ctx.globalAlpha = 1;

    // Project and sort tree nodes by depth with animation effects
    const projected = treeStructure
      .map(node => {
        const effects = calculateNodeEffects(node, animationTime);
        
        const animatedPos = {
          x: node.pos.x,
          y: node.pos.y + effects.hover,
          z: node.pos.z
        };
        
        return {
          ...node,
          projected: project3D(animatedPos, canvas.width, canvas.height),
          effects,
          animatedPos
        };
      })
      .sort((a, b) => a.projected.depth - b.projected.depth);

    // Render connecting branches first (behind nodes) - SIMPLE straight lines
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.4;
    
    projected.forEach(node => {
      if (node.parentPos && node.projected.scale > 0.1) {
        const parentAnimatedPos = {
          x: node.parentPos.x,
          y: node.parentPos.y,
          z: node.parentPos.z
        };
        
        const parentProj = project3D(parentAnimatedPos, canvas.width, canvas.height);
        
        if (parentProj.scale > 0.1) {
          // Simple straight line connection
          ctx.beginPath();
          ctx.moveTo(parentProj.x, parentProj.y);
          ctx.lineTo(node.projected.x, node.projected.y);
          ctx.stroke();
        }
      }
    });

    ctx.globalAlpha = 1;

    // Render file system nodes
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    projected.forEach(node => {
      if (node.projected.scale > 0.1) {
        const baseAlpha = Math.min(node.projected.scale * 1.3, 1);
        const shimmerAlpha = baseAlpha * node.effects.shimmer;
        
        // Highlight selected node
        const isSelected = node.fileNode && fileSystemState.selectedNode === node.fileNode.id;
        const isCurrentNav = node.fileNode && currentNavigationNode === node.fileNode.id;
        
        let renderColor = node.color;
        if (isSelected) {
          renderColor = '#60a5fa'; // Blue highlight for selected
          ctx.shadowColor = '#60a5fa';
          ctx.shadowBlur = 15;
        } else if (isCurrentNav) {
          renderColor = '#fbbf24'; // Yellow highlight for current navigation
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 12;
        } else if (node.effects.isSpecial) {
          ctx.shadowColor = node.color;
          ctx.shadowBlur = node.effects.shimmer * 8;
        } else {
          ctx.shadowColor = renderColor;
          ctx.shadowBlur = 3 * node.effects.shimmer;
        }
        
        ctx.fillStyle = renderColor;
        ctx.globalAlpha = shimmerAlpha;
        
        const size = Math.max(24, 32 * node.projected.scale); // Increased base size from 16,20 to 24,32
        ctx.font = `${size}px "Segoe UI Emoji", "Apple Color Emoji", monospace`;
        
        ctx.fillText(node.char, node.projected.x, node.projected.y);
        
        // Add selection ring
        if (isSelected) {
          ctx.strokeStyle = '#60a5fa';
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.6;
          ctx.beginPath();
          ctx.arc(node.projected.x, node.projected.y, size * 0.8, 0, Math.PI * 2);
          ctx.stroke();
        }
        
        // Add navigation ring
        if (isCurrentNav && !isSelected) {
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 3;
          ctx.globalAlpha = 0.8;
          ctx.beginPath();
          ctx.arc(node.projected.x, node.projected.y, size * 0.9, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    });

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }, [treeStructure, project3D, generateFloorGrid, calculateNodeEffects, animationTime, fileSystemState.selectedNode, currentNavigationNode]);

  // Animation loop
  useEffect(() => {
    const animate = (timestamp: number) => {
      setAnimationTime(timestamp * 0.001);
      updateCameraMovement();
      render();
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [updateCameraMovement, render]);

  // File system event handlers
  const handleFileNodeClick = (nodeId: string) => {
    if (!fileSystem) return;
    
    setFileSystemState(prev => ({
      ...prev,
      selectedNode: nodeId,
      currentPath: findNodeById(fileSystem, nodeId)?.path || prev.currentPath
    }));
    setCurrentNavigationNode(nodeId);
    
    // Auto-expand folder if it's a directory
    autoExpandFolder(nodeId);
  };

  const handleFileNodeExpand = (nodeId: string) => {
    if (!fileSystem) return;
    setFileSystem(prev => toggleNodeExpansion(prev, nodeId));
  };

  const handleSearchChange = (query: string) => {
    setFileSystemState(prev => ({
      ...prev,
      searchQuery: query
    }));
  };

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        // Toggle between real and sample file system
        if (isRealFileSystem) {
          setFileSystem(createSampleFileSystem());
          setIsRealFileSystem(false);
          setCurrentNavigationNode('root');
        } else {
          setFileSystem(null);
          setIsRealFileSystem(false);
        }
        return;
      }

      // Camera recentering with Numpad0 or Insert key
      if (e.code === 'Numpad0' || e.code === 'Insert') {
        e.preventDefault();
        recenterCameraOnCurrentNode();
        return;
      }

      // Delete key for file deletion
      if (e.code === 'Delete' && isRealFileSystem) {
        e.preventDefault();
        const currentNode = findNodeById(fileSystem!, currentNavigationNode);
        if (currentNode && currentNode.type === 'file') {
          if (confirm(`Delete ${currentNode.name}?`)) {
            handleRealFileOperation('delete', currentNavigationNode);
          }
        }
        return;
      }

      // Enter key to expand/collapse current folder
      if (e.code === 'Enter') {
        e.preventDefault();
        const currentNode = findNodeById(fileSystem!, currentNavigationNode);
        if (currentNode && currentNode.type === 'directory') {
          setFileSystem(prev => toggleNodeExpansion(prev, currentNavigationNode));
        }
        return;
      }

      // Arrow key spatial navigation
      if (e.code === 'ArrowUp') {
        e.preventDefault();
        navigateInDirection('up');
        return;
      }

      if (e.code === 'ArrowDown') {
        e.preventDefault();
        navigateInDirection('down');
        return;
      }

      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        navigateInDirection('left');
        return;
      }

      if (e.code === 'ArrowRight') {
        e.preventDefault();
        navigateInDirection('right');
        return;
      }

      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE'].includes(e.code)) {
        e.preventDefault();
        setKeys(prev => new Set(prev).add(e.code));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE'].includes(e.code)) {
        e.preventDefault();
        setKeys(prev => {
          const newKeys = new Set(prev);
          newKeys.delete(e.code);
          return newKeys;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [navigateInDirection, recenterCameraOnCurrentNode, currentNavigationNode, fileSystem, isRealFileSystem, handleRealFileOperation]);

  // Mouse interaction handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      // Shift+click for panning
      setIsPanning(true);
    } else {
      // Regular click for rotation
      setIsDragging(true);
    }
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging && !isPanning) return;

    const deltaX = e.clientX - lastMouse.x;
    const deltaY = e.clientY - lastMouse.y;

    if (isPanning) {
      // Panning mode - move camera position
      const panSpeed = 0.02;
      const cosY = Math.cos(camera.rotation.y);
      const sinY = Math.sin(camera.rotation.y);
      
      setCamera(prev => ({
        ...prev,
        position: {
          x: prev.position.x - (deltaX * cosY + deltaY * sinY * Math.sin(prev.rotation.x)) * panSpeed,
          y: prev.position.y + deltaY * Math.cos(prev.rotation.x) * panSpeed,
          z: prev.position.z + (deltaX * sinY - deltaY * cosY * Math.sin(prev.rotation.x)) * panSpeed
        }
      }));
    } else {
      // Rotation mode
      setCamera(prev => ({
        ...prev,
        rotation: {
          x: Math.max(-Math.PI/2.5, Math.min(Math.PI/2.5, prev.rotation.x + deltaY * 0.008)),
          y: prev.rotation.y + deltaX * 0.008
        }
      }));
    }

    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsPanning(false);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!isDragging && !isPanning) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        handleNodeClick(clickX, clickY);
      }
    }
  };

  // Mouse wheel zoom handler with much finer granularity - ALWAYS WORKS
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    // Much smaller zoom speed for fine control
    const zoomSpeed = 0.05; // Reduced from 0.3 to 0.05 (6x more granular)
    const cosY = Math.cos(camera.rotation.y);
    const sinY = Math.sin(camera.rotation.y);
    
    // Calculate zoom direction based on camera orientation
    const zoomDirection = e.deltaY > 0 ? -1 : 1; // Negative deltaY = zoom in
    
    setCamera(prev => ({
      ...prev,
      position: {
        x: prev.position.x + sinY * zoomDirection * zoomSpeed,
        y: prev.position.y,
        z: prev.position.z + cosY * zoomDirection * zoomSpeed
      }
    }));
  }, [camera.rotation.y]);

  // Update tree structure when file system changes
  useEffect(() => {
    if (fileSystem) {
      setTreeStructure(generateFileSystemTree(fileSystem));
    }
  }, [fileSystem, generateFileSystemTree]);

  // Canvas setup and resize handling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const selectedFileNode = fileSystemState.selectedNode && fileSystem
    ? findNodeById(fileSystem, fileSystemState.selectedNode) 
    : null;

  const currentNavNode = fileSystem ? findNodeById(fileSystem, currentNavigationNode) : null;

  // Show file system access panel if no file system is loaded
  if (!fileSystem) {
    return <FileSystemAccessPanel onDirectorySelected={handleDirectorySelected} />;
  }

  return (
    <div className="w-full h-screen bg-black overflow-hidden flex">
      {/* File System Panel */}
      <FileSystemPanel
        fileSystem={fileSystem}
        state={fileSystemState}
        onNodeClick={handleFileNodeClick}
        onNodeExpand={handleFileNodeExpand}
        onSearchChange={handleSearchChange}
      />

      {/* 3D Visualization */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-grab active:cursor-grabbing focus:outline-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleCanvasClick}
          onWheel={handleWheel}
          tabIndex={0}
        />
        
        {/* Header */}
        <div className="absolute top-4 left-4 text-emerald-400 font-mono text-sm bg-black/90 px-3 py-2 rounded border border-emerald-800/30">
          <div className="font-bold">
            {isRealFileSystem ? '🖥️ Real File System' : '📁 Sample Files'} - 3D Explorer
          </div>
          <div className="text-xs text-emerald-300/80 mt-1">
            {isRealFileSystem 
              ? '🔗 Connected to Windows • 📂 Real Operations • ⚡ Live Updates'
              : '🗂️ Demo Mode • 🎯 Spatial Navigation • 📁 Sample Data'
            }
          </div>
        </div>
        
        {/* Controls */}
        <div className="absolute bottom-4 left-4 text-gray-400 font-mono text-xs bg-black/90 px-3 py-2 rounded border border-gray-700/30">
          <div className="space-y-1">
            <div>🖱️ Drag to rotate • <span className="text-purple-400">Shift+Drag</span> to pan • <span className="text-cyan-400">Mouse wheel</span> to zoom</div>
            <div><span className="text-emerald-400">WASD</span> to move • <span className="text-emerald-400">Q/E</span> up/down (backup)</div>
            <div><span className="text-cyan-400">Arrow Keys</span> for spatial navigation • <span className="text-orange-400">Enter</span> to expand/collapse</div>
            <div><span className="text-orange-400">Numpad 0/Ins</span> to focus closer • <span className="text-emerald-400">Space</span> to {isRealFileSystem ? 'demo mode' : 'file picker'}</div>
            {isRealFileSystem && (
              <div><span className="text-red-400">Delete</span> to remove file • <span className="text-blue-400">Real operations</span> on your files</div>
            )}
          </div>
        </div>

        {/* Current Navigation */}
        {currentNavNode && (
          <div className="absolute top-4 right-4 text-white font-mono text-sm bg-black/90 px-3 py-2 rounded border border-yellow-500/30">
            <div className="font-bold text-yellow-400">Navigating:</div>
            <div className="text-xs mt-1">{currentNavNode.name}</div>
            <div className="text-xs text-gray-400">{currentNavNode.path}</div>
            {currentNavNode.type === 'directory' && (
              <div className="text-xs text-green-400 mt-1">
                {currentNavNode.isExpanded ? '📂 Expanded' : '📁 Collapsed'}
              </div>
            )}
          </div>
        )}

        {/* Current Selection */}
        {selectedFileNode && selectedFileNode.id !== currentNavigationNode && (
          <div className="absolute top-32 right-4 text-white font-mono text-sm bg-black/90 px-3 py-2 rounded border border-blue-500/30">
            <div className="font-bold text-blue-400">Selected:</div>
            <div className="text-xs mt-1">{selectedFileNode.name}</div>
            <div className="text-xs text-gray-400">{selectedFileNode.path}</div>
          </div>
        )}
      </div>

      {/* File Details Panel */}
      <FileDetailsPanel 
        selectedNode={selectedFileNode} 
        isRealFileSystem={isRealFileSystem}
        onFileOperation={handleRealFileOperation}
      />
    </div>
  );
}

export default App;