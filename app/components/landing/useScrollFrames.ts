import { useState, useEffect, useRef, useCallback } from "react";

export function useScrollFrames(totalFrames = 270) {
  const [loadedCount, setLoadedCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const imagesRef = useRef<HTMLImageElement[]>([]);

  useEffect(() => {
    let cancelled = false;
    let loaded = 0;
    let nextFrame = 2;
    const concurrency = 6;
    const loadedImages: HTMLImageElement[] = Array.from(
      { length: totalFrames },
      () => new Image()
    );

    const markLoaded = () => {
      if (cancelled) return;
      loaded++;
      setLoadedCount(loaded);
    };

    const loadFrame = (i: number): Promise<void> => {
      const img = loadedImages[i - 1];
      const frameNum = String(i).padStart(3, "0");

      return new Promise((resolve) => {
        img.onload = () => {
          markLoaded();
          resolve();
        };

        img.onerror = () => {
          markLoaded();
          resolve();
        };

        img.src = `/images/ezgif-frame-${frameNum}.png`;
      });
    };

    const loadRemainingFrames = async () => {
      while (!cancelled && nextFrame <= totalFrames) {
        const frame = nextFrame;
        nextFrame++;
        await loadFrame(frame);
      }
    };

    imagesRef.current = loadedImages;

    loadFrame(1).then(() => {
      if (cancelled) return;
      setIsLoaded(true);

      for (let i = 0; i < concurrency; i++) {
        void loadRemainingFrames();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [totalFrames]);

  const getClosestLoadedImage = useCallback((index: number): string => {
    const images = imagesRef.current;
    if (images.length === 0) return "";
    
    const targetIdx = Math.max(0, Math.min(totalFrames - 1, index));
    if (images[targetIdx]?.complete) return images[targetIdx].src;

    // Outward search for the nearest fully loaded image to avoid blank frames
    for (let offset = 1; offset < totalFrames; offset++) {
      const prev = targetIdx - offset;
      const next = targetIdx + offset;
      if (prev >= 0 && images[prev]?.complete) return images[prev].src;
      if (next < totalFrames && images[next]?.complete) return images[next].src;
    }
    
    return images[0]?.src || "";
  }, [totalFrames]);

  return {
    isLoaded,
    loadedCount,
    getClosestLoadedImage
  };
}
