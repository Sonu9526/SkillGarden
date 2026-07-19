import React from "react";

interface ScrollFramePlayerProps {
  isLoaded: boolean;
  imgRef: React.RefObject<HTMLImageElement | null>;
}

export const ScrollFramePlayer = React.memo(function ScrollFramePlayer({
  isLoaded,
  imgRef
}: ScrollFramePlayerProps) {
  if (!isLoaded) return null;

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none">
      <img
        ref={imgRef}
        alt="Skill garden scroll animation frame"
        className="w-full h-full object-cover"
        style={{ width: "100vw", height: "100vh" }}
      />
    </div>
  );
});
