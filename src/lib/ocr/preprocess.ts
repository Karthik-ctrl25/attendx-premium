/**
 * Client-side image preprocessing for CMR University ERP attendance screenshots.
 *
 * Goals: crop away browser chrome / whitespace around the attendance table,
 * lift contrast so faint ERP grid text reads cleanly, and cap the resolution
 * so the upload to the vision model stays fast.
 */

const MAX_EDGE = 1800;
const MIN_EDGE = 320;

export interface PreprocessResult {
  /** `data:image/...;base64,...` ready to send to a vision model. */
  dataUrl: string;
  width: number;
  height: number;
  cropped: boolean;
}

export interface PreprocessOptions {
  /** Longest edge of the produced image. Smaller = faster upload. */
  maxEdge?: number;
  /** "image/png" keeps every pixel; "image/jpeg" is far smaller and faster. */
  format?: "image/png" | "image/jpeg";
  /** JPEG quality, 0-1. Ignored for PNG. */
  quality?: number;
  /** Sample step for the content-bounds scan. 2-3 is visually identical but much faster. */
  scanStep?: number;
}

/** Small in-memory cache so re-uploading the same file never re-encodes it. */
const cache = new Map<string, PreprocessResult>();
const cacheKey = (file: File, o: Required<PreprocessOptions>) =>
  `${file.name}:${file.size}:${file.lastModified}:${o.maxEdge}:${o.format}:${o.quality}`;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not decode the image."));
    };
    img.src = url;
  });
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}

/**
 * Finds the bounding box of non-background content. ERP pages are white, so
 * anything meaningfully darker than white is treated as content.
 */
function contentBounds(data: Uint8ClampedArray, w: number, h: number, step = 1) {
  const threshold = 238;
  let top = h;
  let bottom = 0;
  let left = w;
  let right = 0;

  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const i = (y * w + x) * 4;
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (lum < threshold) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }

  if (bottom <= top || right <= left) return null;
  return { top, bottom, left, right };
}

/** Contrast + slight brightness lift, applied in place. */
function enhance(data: Uint8ClampedArray) {
  const contrast = 1.35;
  const intercept = 128 * (1 - contrast);
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c += 1) {
      const v = data[i + c] * contrast + intercept;
      data[i + c] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
  }
}

export async function preprocessScreenshot(file: File): Promise<PreprocessResult> {
  if (typeof document === "undefined") {
    const dataUrl = await fileToDataUrl(file);
    return { dataUrl, width: 0, height: 0, cropped: false };
  }

  try {
    const img = await loadImage(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("no canvas context");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    const frame = ctx.getImageData(0, 0, w, h);
    const bounds = contentBounds(frame.data, w, h);

    let cropped = false;
    let out = canvas;

    if (bounds) {
      const pad = Math.round(Math.min(w, h) * 0.01);
      const left = Math.max(0, bounds.left - pad);
      const top = Math.max(0, bounds.top - pad);
      const right = Math.min(w, bounds.right + pad);
      const bottom = Math.min(h, bounds.bottom + pad);
      const cw = right - left;
      const ch = bottom - top;
      if (cw >= MIN_EDGE && ch >= MIN_EDGE && (cw < w * 0.98 || ch < h * 0.98)) {
        const crop = document.createElement("canvas");
        crop.width = cw;
        crop.height = ch;
        const cctx = crop.getContext("2d", { willReadFrequently: true });
        if (cctx) {
          cctx.drawImage(canvas, left, top, cw, ch, 0, 0, cw, ch);
          out = crop;
          cropped = true;
        }
      }
    }

    const octx = out.getContext("2d", { willReadFrequently: true });
    if (octx) {
      const pixels = octx.getImageData(0, 0, out.width, out.height);
      enhance(pixels.data);
      octx.putImageData(pixels, 0, 0);
    }

    return {
      dataUrl: out.toDataURL("image/png"),
      width: out.width,
      height: out.height,
      cropped,
    };
  } catch {
    const dataUrl = await fileToDataUrl(file);
    return { dataUrl, width: 0, height: 0, cropped: false };
  }
}
