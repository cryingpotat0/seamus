import { createContext, ReactNode, useContext } from 'react';

export type MediaContextValue = {
  uploadMedia: (file: File) => Promise<{ storageId: string; storageUrl: string }>;
  downloadMedia: (storageId: string) => Promise<{ storageUrl: string }>;
};

const MediaContext = createContext<MediaContextValue | null>(null);

export function MediaProvider({ 
  children,
  uploadMedia,
  downloadMedia 
}: { 
  children: ReactNode;
  uploadMedia: MediaContextValue['uploadMedia'];
  downloadMedia: MediaContextValue['downloadMedia'];
}): JSX.Element {
  return (
    <MediaContext.Provider value={{ uploadMedia, downloadMedia }}>
      {children}
    </MediaContext.Provider>
  );
}

export function useMedia(): MediaContextValue {
  const context = useContext(MediaContext);
  if (!context) {
    throw new Error('useMedia must be used within a MediaProvider');
  }
  return context;
} 