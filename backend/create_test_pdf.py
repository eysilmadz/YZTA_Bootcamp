#!/usr/bin/env python
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

doc = SimpleDocTemplate("test_cv.pdf", pagesize=letter)
elements = []
styles = getSampleStyleSheet()

elements.append(Paragraph("Ahmet Yilmaz", styles["Heading1"]))
elements.append(Paragraph("Backend Developer", styles["Heading2"]))
elements.append(Spacer(1, 12))

elements.append(Paragraph("<b>Contact</b>", styles["Heading3"]))
elements.append(Paragraph("Email: ahmet@gmail.com | Phone: +90 555 123 4567", styles["Normal"]))
elements.append(Paragraph("GitHub: https://github.com/ahmet-yilmaz", styles["Normal"]))
elements.append(Spacer(1, 12))

elements.append(Paragraph("<b>Experience</b>", styles["Heading3"]))
elements.append(Paragraph("<b>Senior Backend Developer</b> @ Tech Company (2021 - Present)", styles["Normal"]))
elements.append(Paragraph("Developed REST APIs using FastAPI and Django. Worked with PostgreSQL and Redis.", styles["Normal"]))
elements.append(Spacer(1, 6))

elements.append(Paragraph("<b>Education</b>", styles["Heading3"]))
elements.append(Paragraph("Bachelor's in Computer Engineering - Istanbul Technical University (2015 - 2019)", styles["Normal"]))
elements.append(Spacer(1, 12))

elements.append(Paragraph("<b>Skills</b>", styles["Heading3"]))
elements.append(Paragraph("Languages: Python, JavaScript, TypeScript, Go", styles["Normal"]))
elements.append(Paragraph("Frameworks: FastAPI, Django, Flask, React, Node.js", styles["Normal"]))
elements.append(Paragraph("Databases: PostgreSQL, MongoDB, SQLite, Redis", styles["Normal"]))

doc.build(elements)
print("Test PDF created successfully")
