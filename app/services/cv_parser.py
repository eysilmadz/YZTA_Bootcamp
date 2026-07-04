import pdfplumber
import tkinter as tk
from tkinter import filedialog
import os

def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Verilen dosya yolundaki PDF'i düzenini (özellikle çift sütunları)
    koruyarak metne çevirir.
    """
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            # layout=True parametresi iki sütunlu modern CV şablonları için hayati önem taşır
            page_text = page.extract_text(layout=True)
            if page_text:
                text += page_text + "\n"
    return text

def select_file_and_test():
    """
    Ekrana bir dosya seçme penceresi açar ve seçilen PDF üzerinde
    pdfplumber kütüphanesini test eder.
    """
    root = tk.Tk()
    root.withdraw()
    root.attributes('-topmost', True) # Pencereyi en öne getirir

    print("🖥️ Dosya seçme ekranı açılıyor... Lütfen bir PDF CV seçin.")
    
    # Sadece PDF dosyalarını seçtirecek filtreyi koyuyoruz
    file_path = filedialog.askopenfilename(
        title="Test Etmek İçin Bir PDF CV Seçin",
        filetypes=[("PDF Dosyaları", "*.pdf")]
    )

    if not file_path:
        print("❌ Dosya seçimi iptal edildi.")
        return

    print(f"📂 Seçilen Dosya: {os.path.basename(file_path)}")
    print("🔄 pdfplumber NLP motoru çalıştırılıyor, lütfen bekleyin...\n")

    try:
        extracted_text = extract_text_from_pdf(file_path)
        
        print("==================================================")
        print("✅ BAŞARIYLA OKUNAN METİN (İLK 800 KARAKTER):")
        print("==================================================")
        print(extracted_text[:800])
        print("==================================================")
        
        if len(extracted_text) > 800:
            print(f"... [Metnin kalan kısmı gizlendi]")
            
        print(f"\n📊 Analiz Sonucu:")
        print(f"👉 Toplam Karakter Sayısı: {len(extracted_text)}")
        print(f"👉 Toplam Kelime Sayısı: {len(extracted_text.split())}")
        
    except Exception as e:
        print(f"❌ PDF okunurken bir hata oluştu: {str(e)}")

if __name__ == "__main__":
    select_file_and_test()