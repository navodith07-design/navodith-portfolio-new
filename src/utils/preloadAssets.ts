// Asset Preloader to ensure all videos and images are decoded and ready before showing the site

import cinematicVideo from "../Video_20260826_225908_127.mp4";
import navoImg from "../navo.webp";
import projectBg from "../project-bg.png";
import salletImg from "../Sallet-img.png";
import farinaImg from "../Farina&fuoco-img.png";
import lawImg from "../law-card-img.png";
import worksImg from "../WORKS.png";
import selectedProjectsImg from "../Selected projects.png";

const IMAGE_ASSETS = [
  navoImg,
  projectBg,
  salletImg,
  farinaImg,
  lawImg,
  worksImg,
  selectedProjectsImg,
];

const VIDEO_ASSETS = [
  cinematicVideo,
];

export function preloadAllAssets(onProgress: (percent: number) => void): Promise<void> {
  return new Promise((resolve) => {
    let loadedCount = 0;
    const totalItems = IMAGE_ASSETS.length + VIDEO_ASSETS.length;

    const update = () => {
      loadedCount++;
      const pct = Math.min(100, Math.round((loadedCount / totalItems) * 100));
      onProgress(pct);
      if (loadedCount >= totalItems) {
        resolve();
      }
    };

    // Preload Images
    IMAGE_ASSETS.forEach((src) => {
      const img = new Image();
      img.onload = update;
      img.onerror = update;
      img.src = src;
    });

    // Preload & buffer Videos
    VIDEO_ASSETS.forEach((src) => {
      const video = document.createElement("video");
      video.preload = "auto";
      video.muted = true;
      (video as any).playsInline = true;
      video.setAttribute("playsinline", "true");
      video.setAttribute("webkit-playsinline", "true");
      
      let isDone = false;
      const onVideoReady = () => {
        if (!isDone) {
          isDone = true;
          update();
        }
      };

      video.addEventListener("canplaythrough", onVideoReady, { once: true });
      video.addEventListener("loadeddata", onVideoReady, { once: true });
      video.addEventListener("canplay", onVideoReady, { once: true });
      video.addEventListener("error", onVideoReady, { once: true });

      video.src = src;
      video.load();

      // Timeout fallback in case network throttles video
      setTimeout(onVideoReady, 3500);
    });
  });
}
