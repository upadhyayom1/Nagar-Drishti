"""
Video reading / writing utilities.

Wraps OpenCV's VideoCapture/VideoWriter with:
  * frame-skip + target-fps sampling
  * automatic resizing
  * support for files, webcam indices, and RTSP URLs
  * clear errors for missing/corrupted/unsupported sources
"""

import os
from typing import Iterator, Optional, Tuple

import cv2

from src.utils.logger import get_logger

logger = get_logger(__name__)


class VideoSourceError(Exception):
    """Raised when a video source cannot be opened or read."""


class VideoReader:
    def __init__(self, source: str, frame_skip: int = 1, target_fps: float = 0, resize_width: int = 0):
        """
        Args:
            source: file path, webcam index (as string, e.g. "0"), or RTSP/HTTP URL.
            frame_skip: process every Nth decoded frame.
            target_fps: if > 0 and lower than source FPS, additional frames are
                        skipped to approximate this rate. 0 disables this behavior.
            resize_width: if > 0, frames are resized to this width (aspect-preserving).
        """
        self.source = source
        self.frame_skip = max(1, int(frame_skip))
        self.target_fps = target_fps
        self.resize_width = resize_width

        self._is_stream = source.startswith("rtsp://") or source.startswith("http://") or source.startswith("https://")

        if not self._is_stream and not source.isdigit() and not os.path.isfile(source):
            raise VideoSourceError(f"Video source not found: {source}")

        cap_source = int(source) if source.isdigit() else source
        self.cap = cv2.VideoCapture(cap_source)

        if not self.cap.isOpened():
            raise VideoSourceError(
                f"Could not open video source '{source}'. The file may be corrupted, "
                f"the codec may be unsupported, or (for RTSP) the stream may be unreachable."
            )

        self.source_fps = self.cap.get(cv2.CAP_PROP_FPS) or 25.0
        self.total_frames = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT)) if not self._is_stream else -1
        self.width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        if self.width == 0 or self.height == 0:
            raise VideoSourceError(f"Video source '{source}' returned invalid dimensions; the file may be corrupted.")

        # Compute the effective sampling stride combining frame_skip and target_fps
        self._fps_stride = 1
        if self.target_fps and self.target_fps > 0 and self.source_fps > self.target_fps:
            self._fps_stride = max(1, round(self.source_fps / self.target_fps))
        self._stride = max(self.frame_skip, self._fps_stride)

        self.effective_fps = self.source_fps / self._stride

        logger.info(
            f"Opened source '{source}' | {self.width}x{self.height} @ {self.source_fps:.1f} fps "
            f"| sampling stride={self._stride} -> effective ~{self.effective_fps:.1f} fps"
        )

    def _resize(self, frame):
        if self.resize_width and frame.shape[1] != self.resize_width:
            scale = self.resize_width / frame.shape[1]
            new_h = int(frame.shape[0] * scale)
            frame = cv2.resize(frame, (self.resize_width, new_h), interpolation=cv2.INTER_AREA)
        return frame

    def frames(self) -> Iterator[Tuple[int, "cv2.Mat"]]:
        """Yield (frame_index, frame) pairs at the configured sampling rate.

        frame_index is the index in the ORIGINAL (unsampled) video, so
        timestamps/frame numbers remain meaningful for reporting.
        """
        idx = -1
        consecutive_failures = 0
        while True:
            ok, frame = self.cap.read()
            idx += 1
            if not ok:
                consecutive_failures += 1
                if self._is_stream and consecutive_failures < 30:
                    # transient network hiccup on a live stream; keep trying
                    continue
                break
            consecutive_failures = 0
            if idx % self._stride != 0:
                continue
            yield idx, self._resize(frame)

    def release(self):
        self.cap.release()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.release()


class VideoWriter:
    """Thin wrapper around cv2.VideoWriter with lazy initialization so the
    first frame's actual (post-resize) dimensions are used."""

    def __init__(self, path: str, fps: float, fourcc: str = "mp4v"):
        self.path = path
        self.fps = max(1.0, fps)
        self.fourcc = cv2.VideoWriter_fourcc(*fourcc)
        self._writer: Optional[cv2.VideoWriter] = None
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)

    def write(self, frame):
        if self._writer is None:
            h, w = frame.shape[:2]
            self._writer = cv2.VideoWriter(self.path, self.fourcc, self.fps, (w, h))
            if not self._writer.isOpened():
                raise VideoSourceError(f"Could not open output video writer for '{self.path}'")
        self._writer.write(frame)

    def release(self):
        if self._writer is not None:
            self._writer.release()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.release()
