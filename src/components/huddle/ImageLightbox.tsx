import { useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export function ImageLightbox({
  images,
  index,
  onClose,
  onIndex,
}: {
  images: string[];
  index: number | null;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex((index + 1) % images.length);
      if (e.key === "ArrowLeft") onIndex((index - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, images.length, onClose, onIndex]);

  if (index === null || !images[index]) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true">
      <button onClick={onClose} className="absolute right-4 top-4 border-2 border-white bg-black p-2 shadow-[3px_3px_0_0_#fff]" aria-label="Close">
        <X className="h-5 w-5 text-white" />
      </button>
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onIndex((index - 1 + images.length) % images.length); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 border-2 border-white bg-black p-2 shadow-[3px_3px_0_0_#fff] md:left-6"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onIndex((index + 1) % images.length); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 border-2 border-white bg-black p-2 shadow-[3px_3px_0_0_#fff] md:right-6"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5 text-white" />
          </button>
        </>
      )}
      <img
        src={images[index]}
        alt=""
        className="max-h-[85vh] max-w-full border-2 border-white object-contain shadow-[8px_8px_0_0_var(--primary)]"
        onClick={(e) => e.stopPropagation()}
      />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 border-2 border-white bg-black px-3 py-1 font-mono text-[10px] font-black uppercase tracking-widest text-white">
        {index + 1} / {images.length}
      </div>
    </div>
  );
}
