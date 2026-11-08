import re
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill_hex)
    tcPr.append(shd)

def markdown_to_docx(md_path: str, docx_path: str):
    doc = Document()

    # Set Margins
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Base Styles
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(11)
    normal_style.font.color.rgb = RGBColor(0x1F, 0x29, 0x37)

    with open(md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    in_code_block = False
    code_lines = []

    for line in lines:
        raw = line.rstrip('\n')
        
        # Code block handling
        if raw.startswith('```'):
            if in_code_block:
                in_code_block = False
                code_text = '\n'.join(code_lines)
                p = doc.add_paragraph()
                p.paragraph_format.left_indent = Inches(0.3)
                p.paragraph_format.space_before = Pt(4)
                p.paragraph_format.space_after = Pt(4)
                run = p.add_run(code_text)
                run.font.name = 'Consolas'
                run.font.size = Pt(9.5)
                run.font.color.rgb = RGBColor(0x37, 0x41, 0x51)
                code_lines = []
            else:
                in_code_block = True
                code_lines = []
            continue

        if in_code_block:
            code_lines.append(raw)
            continue

        # Header 1
        if raw.startswith('# '):
            h = doc.add_heading(raw[2:], level=1)
            h.paragraph_format.space_before = Pt(14)
            h.paragraph_format.space_after = Pt(6)
            for r in h.runs:
                r.font.name = 'Calibri'
                r.font.bold = True
                r.font.color.rgb = RGBColor(0x11, 0x18, 0x27)
            continue

        # Header 2
        if raw.startswith('## '):
            h = doc.add_heading(raw[3:], level=2)
            h.paragraph_format.space_before = Pt(12)
            h.paragraph_format.space_after = Pt(4)
            for r in h.runs:
                r.font.name = 'Calibri'
                r.font.bold = True
                r.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
            continue

        # Header 3
        if raw.startswith('### '):
            h = doc.add_heading(raw[4:], level=3)
            h.paragraph_format.space_before = Pt(8)
            h.paragraph_format.space_after = Pt(3)
            for r in h.runs:
                r.font.name = 'Calibri'
                r.font.bold = True
                r.font.color.rgb = RGBColor(0x37, 0x41, 0x51)
            continue

        # Bullet list
        if raw.startswith('- ') or raw.startswith('* '):
            p = doc.add_paragraph(style='List Bullet')
            p.paragraph_format.space_after = Pt(2)
            clean_text = raw[2:]
            # parse bold
            parts = re.split(r'(\*\*.*?\*\*)', clean_text)
            for pt in parts:
                if pt.startswith('**') and pt.endswith('**'):
                    run = p.add_run(pt[2:-2])
                    run.bold = True
                else:
                    p.add_run(pt)
            continue

        # Empty line
        if not raw.strip():
            continue

        # Regular paragraph
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(4)
        parts = re.split(r'(\*\*.*?\*\*)', raw)
        for pt in parts:
            if pt.startswith('**') and pt.endswith('**'):
                run = p.add_run(pt[2:-2])
                run.bold = True
            else:
                p.add_run(pt)

    doc.save(docx_path)
    print(f"Generated Word TDD at: {docx_path}")

if __name__ == '__main__':
    markdown_to_docx('TECHNICAL_DESIGN_DOCUMENT.md', 'Technical_Design_Document.docx')

