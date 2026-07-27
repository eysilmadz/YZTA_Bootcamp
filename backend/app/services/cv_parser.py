import pdfplumber
import io

def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """
    Extracts text from PDF bytes, preserving layout (crucial for modern two-column CV formats).
    """
    text = ""
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            # layout=True helps preserve two-column layouts in modern resumes
            page_text = page.extract_text(layout=True)
            if page_text:
                text += page_text + "\n"
    return text