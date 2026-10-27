"""
MannuMitra - Leaf Image Quality & Robustness Pre-Screening (Phase 18)
Checks for blur, extreme brightness/underexposure, low resolution, and leaf visibility.
Rejects degraded images before forwarding to deep learning disease models.
"""

import io
from typing import Dict, Any, Tuple
from PIL import Image, ImageStat
import numpy as np

MIN_WIDTH = 120
MIN_HEIGHT = 120

class FieldImageQualityValidator:
    @staticmethod
    def inspect_image_quality(image_bytes: bytes) -> Tuple[bool, str, Dict[str, Any]]:
        try:
            img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except Exception:
            return False, "Image file is corrupted or could not be decoded.", {}

        w, h = img.size
        if w < MIN_WIDTH or h < MIN_HEIGHT:
            return False, f"Image resolution ({w}x{h}) is too low for disease pathology analysis. Minimum required is {MIN_WIDTH}x{MIN_HEIGHT}.", {"resolution": f"{w}x{h}"}

        # Grayscale stats for brightness & contrast
        gray = img.convert("L")
        stat = ImageStat.Stat(gray)
        mean_brightness = stat.mean[0]
        stddev_contrast = stat.stddev[0]

        # Brightness thresholds (0 - 255)
        if mean_brightness < 25.0:
            return False, "Image is excessively dark / underexposed. Please capture with adequate lighting.", {"brightness": round(mean_brightness, 1)}
        if mean_brightness > 235.0:
            return False, "Image is excessively bright / overexposed with glare. Please capture in diffuse light.", {"brightness": round(mean_brightness, 1)}

        # Contrast threshold
        if stddev_contrast < 12.0:
            return False, "Image has insufficient contrast. Leaf details cannot be distinguished.", {"contrast": round(stddev_contrast, 1)}

        # Approximate Laplacian blur metric
        arr = np.array(gray, dtype=np.float32)
        # Compute gradient variances as fast sharpness measure
        gy, gx = np.gradient(arr)
        sharpness = np.var(gx) + np.var(gy)
        if sharpness < 18.0:
            return False, "Image is blurry or out of focus. Please upload a sharp, focused leaf image.", {"sharpness": round(float(sharpness), 2)}

        return True, "Image quality passed all diagnostic pre-checks.", {
            "resolution": f"{w}x{h}",
            "brightness": round(mean_brightness, 1),
            "contrast": round(stddev_contrast, 1),
            "sharpness_score": round(float(sharpness), 2)
        }
