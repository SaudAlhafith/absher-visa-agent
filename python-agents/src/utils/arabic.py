"""
Arabic text processing utilities.
Handles RTL text reshaping and bidirectional text.
"""

from typing import Optional


class ArabicTextProcessor:
    """
    Processor for Arabic text to handle RTL and character reshaping.
    Uses arabic-reshaper and python-bidi for proper rendering.
    """

    def __init__(self):
        self._reshaper = None
        self._bidi = None
        self._init_libraries()

    def _init_libraries(self) -> None:
        """Initialize Arabic text processing libraries."""
        try:
            import arabic_reshaper
            self._reshaper = arabic_reshaper
        except ImportError:
            pass

        try:
            from bidi.algorithm import get_display
            self._bidi = get_display
        except ImportError:
            pass

    def reshape(self, text: str) -> str:
        """
        Reshape Arabic text for proper display.
        Connects characters and handles RTL.
        """
        if not text:
            return text

        result = text

        # Reshape Arabic characters
        if self._reshaper:
            result = self._reshaper.reshape(result)

        # Apply bidirectional algorithm
        if self._bidi:
            result = self._bidi(result)

        return result

    def is_arabic(self, text: str) -> bool:
        """Check if text contains Arabic characters."""
        if not text:
            return False

        # Arabic Unicode ranges
        arabic_ranges = [
            (0x0600, 0x06FF),  # Arabic
            (0x0750, 0x077F),  # Arabic Supplement
            (0x08A0, 0x08FF),  # Arabic Extended-A
            (0xFB50, 0xFDFF),  # Arabic Presentation Forms-A
            (0xFE70, 0xFEFF),  # Arabic Presentation Forms-B
        ]

        for char in text:
            code = ord(char)
            for start, end in arabic_ranges:
                if start <= code <= end:
                    return True

        return False

    def get_direction(self, text: str) -> str:
        """Get text direction (rtl or ltr)."""
        if self.is_arabic(text):
            return "rtl"
        return "ltr"

    def normalize(self, text: str) -> str:
        """
        Normalize Arabic text.
        - Remove diacritics (tashkeel)
        - Normalize alef variations
        - Normalize yaa/alef maksura
        """
        if not text:
            return text

        # Diacritics to remove
        diacritics = [
            '\u064B',  # Fathatan
            '\u064C',  # Dammatan
            '\u064D',  # Kasratan
            '\u064E',  # Fatha
            '\u064F',  # Damma
            '\u0650',  # Kasra
            '\u0651',  # Shadda
            '\u0652',  # Sukun
        ]

        result = text
        for d in diacritics:
            result = result.replace(d, '')

        # Normalize alef variations to plain alef
        alef_variations = {
            '\u0622': '\u0627',  # Alef with madda
            '\u0623': '\u0627',  # Alef with hamza above
            '\u0625': '\u0627',  # Alef with hamza below
            '\u0671': '\u0627',  # Alef wasla
        }

        for var, norm in alef_variations.items():
            result = result.replace(var, norm)

        # Normalize yaa to alef maksura at end of words
        # (This is a simplified version)

        return result
