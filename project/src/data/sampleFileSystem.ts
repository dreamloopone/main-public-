import { FileNode } from '../types/FileSystem';

export const createSampleFileSystem = (): FileNode => {
  return {
    id: 'root',
    name: 'System',
    type: 'directory',
    path: '/',
    lastModified: new Date('2024-01-15'),
    isExpanded: true,
    children: [
      {
        id: 'documents',
        name: 'Documents',
        type: 'directory',
        path: '/Documents',
        lastModified: new Date('2024-01-14'),
        isExpanded: true,
        children: [
          {
            id: 'projects',
            name: 'Projects',
            type: 'directory',
            path: '/Documents/Projects',
            lastModified: new Date('2024-01-13'),
            isExpanded: true,
            children: [
              {
                id: 'hackathon',
                name: 'Hackathon2024',
                type: 'directory',
                path: '/Documents/Projects/Hackathon2024',
                lastModified: new Date('2024-01-12'),
                children: [
                  {
                    id: 'readme',
                    name: 'README.md',
                    type: 'file',
                    extension: 'md',
                    size: 2048,
                    path: '/Documents/Projects/Hackathon2024/README.md',
                    lastModified: new Date('2024-01-12')
                  },
                  {
                    id: 'app',
                    name: 'app.tsx',
                    type: 'file',
                    extension: 'tsx',
                    size: 15360,
                    path: '/Documents/Projects/Hackathon2024/app.tsx',
                    lastModified: new Date('2024-01-11')
                  }
                ]
              },
              {
                id: 'portfolio',
                name: 'Portfolio',
                type: 'directory',
                path: '/Documents/Projects/Portfolio',
                lastModified: new Date('2024-01-10'),
                children: [
                  {
                    id: 'index-html',
                    name: 'index.html',
                    type: 'file',
                    extension: 'html',
                    size: 4096,
                    path: '/Documents/Projects/Portfolio/index.html',
                    lastModified: new Date('2024-01-09')
                  },
                  {
                    id: 'styles',
                    name: 'styles.css',
                    type: 'file',
                    extension: 'css',
                    size: 8192,
                    path: '/Documents/Projects/Portfolio/styles.css',
                    lastModified: new Date('2024-01-08')
                  }
                ]
              }
            ]
          },
          {
            id: 'reports',
            name: 'Reports',
            type: 'directory',
            path: '/Documents/Reports',
            lastModified: new Date('2024-01-07'),
            children: [
              {
                id: 'quarterly',
                name: 'Q4_Report.pdf',
                type: 'file',
                extension: 'pdf',
                size: 1048576,
                path: '/Documents/Reports/Q4_Report.pdf',
                lastModified: new Date('2024-01-06')
              },
              {
                id: 'analysis',
                name: 'Data_Analysis.xlsx',
                type: 'file',
                extension: 'xlsx',
                size: 524288,
                path: '/Documents/Reports/Data_Analysis.xlsx',
                lastModified: new Date('2024-01-05')
              }
            ]
          }
        ]
      },
      {
        id: 'media',
        name: 'Media',
        type: 'directory',
        path: '/Media',
        lastModified: new Date('2024-01-04'),
        children: [
          {
            id: 'photos',
            name: 'Photos',
            type: 'directory',
            path: '/Media/Photos',
            lastModified: new Date('2024-01-03'),
            children: [
              {
                id: 'vacation',
                name: 'vacation.jpg',
                type: 'file',
                extension: 'jpg',
                size: 2097152,
                path: '/Media/Photos/vacation.jpg',
                lastModified: new Date('2024-01-02')
              },
              {
                id: 'profile',
                name: 'profile.png',
                type: 'file',
                extension: 'png',
                size: 1048576,
                path: '/Media/Photos/profile.png',
                lastModified: new Date('2024-01-01')
              }
            ]
          },
          {
            id: 'videos',
            name: 'Videos',
            type: 'directory',
            path: '/Media/Videos',
            lastModified: new Date('2023-12-31'),
            children: [
              {
                id: 'demo',
                name: 'demo.mp4',
                type: 'file',
                extension: 'mp4',
                size: 52428800,
                path: '/Media/Videos/demo.mp4',
                lastModified: new Date('2023-12-30')
              }
            ]
          }
        ]
      },
      {
        id: 'system',
        name: 'System',
        type: 'directory',
        path: '/System',
        lastModified: new Date('2023-12-29'),
        children: [
          {
            id: 'config',
            name: 'config.json',
            type: 'file',
            extension: 'json',
            size: 1024,
            path: '/System/config.json',
            lastModified: new Date('2023-12-28')
          },
          {
            id: 'logs',
            name: 'system.log',
            type: 'file',
            extension: 'log',
            size: 16384,
            path: '/System/system.log',
            lastModified: new Date('2023-12-27')
          }
        ]
      }
    ]
  };
};