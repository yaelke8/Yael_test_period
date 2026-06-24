#!/usr/bin/env python3
"""Convert a file to Markdown using markitdown. Reads a file path from argv[1],
writes the Markdown text to stdout."""

import sys
from markitdown import MarkItDown

def file_to_markdown(filepath: str) -> str:
    md = MarkItDown()
    result = md.convert(filepath)
    return result.text_content

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: file_to_markdown.py <filepath>", file=sys.stderr)
        sys.exit(1)
    print(file_to_markdown(sys.argv[1]))
