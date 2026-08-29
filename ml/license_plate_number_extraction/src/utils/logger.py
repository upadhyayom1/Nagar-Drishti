"""
Centralized logging configuration for the ANPR system.

Every module obtains its logger via `get_logger(__name__)` after
`setup_logging(...)` has been called once from main.py.
"""

import logging
import os
import sys
from typing import Optional

_CONFIGURED = False


def setup_logging(level: str = "INFO", log_file: Optional[str] = None, console: bool = True) -> None:
    """Configure the root 'anpr' logger. Safe to call multiple times (idempotent)."""
    global _CONFIGURED

    root = logging.getLogger("anpr")
    root.setLevel(getattr(logging, level.upper(), logging.INFO))
    root.handlers.clear()

    fmt = logging.Formatter(
        fmt="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    if console:
        stream_handler = logging.StreamHandler(sys.stdout)
        stream_handler.setFormatter(fmt)
        root.addHandler(stream_handler)

    if log_file:
        os.makedirs(os.path.dirname(log_file) or ".", exist_ok=True)
        file_handler = logging.FileHandler(log_file, mode="a", encoding="utf-8")
        file_handler.setFormatter(fmt)
        root.addHandler(file_handler)

    root.propagate = False
    _CONFIGURED = True


def get_logger(name: str) -> logging.Logger:
    """Return a namespaced logger under the 'anpr' hierarchy."""
    if not _CONFIGURED:
        # Fallback so importing modules never crashes if setup_logging()
        # has not been called yet (e.g. in unit tests).
        setup_logging()
    if not name.startswith("anpr"):
        name = f"anpr.{name}"
    return logging.getLogger(name)
