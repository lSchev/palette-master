# ui/export_utils.py
import io
from PIL import Image, ImageDraw, ImageFont

def generate_css(palette_name: str, hex_colors: list[str]) -> str:
    """Gera o conteúdo CSS com variáveis para as cores da paleta."""
    css = f"/* Paleta: {palette_name} */\n:root {{\n"
    for i, hx in enumerate(hex_colors):
        css += f"    --cor-{i+1}: {hx};\n"
    css += "}\n"
    return css

def generate_png(palette_name: str, hex_colors: list[str]) -> bytes:
    """Gera uma imagem PNG de apresentação da paleta."""
    width, height = 800, 400
    img = Image.new("RGB", (width, height))
    draw = ImageDraw.Draw(img)

    # Gradiente vertical de #FFF7FB para #FFF0F6
    c1 = (255, 247, 251)
    c2 = (255, 240, 246)
    for y in range(height):
        r = int(c1[0] + (c2[0] - c1[0]) * y / height)
        g = int(c1[1] + (c2[1] - c1[1]) * y / height)
        b = int(c1[2] + (c2[2] - c1[2]) * y / height)
        draw.line([(0, y), (width, y)], fill=(r, g, b))

    try:
        font_title = ImageFont.truetype("assets/fonts/Quicksand-Bold.ttf", 28)
        font_sub = ImageFont.truetype("assets/fonts/Quicksand-Bold.ttf", 18)
        font_hex = ImageFont.truetype("assets/fonts/Quicksand-Bold.ttf", 16)
        font_foot = ImageFont.truetype("assets/fonts/Quicksand-Bold.ttf", 12)
    except Exception:
        font_title = ImageFont.load_default()
        font_sub = ImageFont.load_default()
        font_hex = ImageFont.load_default()
        font_foot = ImageFont.load_default()

    draw.text((40, 40), palette_name, fill="#6B5B7B", font=font_title)
    draw.text((40, 75), "Pontinhos & Ratinhos — ateliê pastel", fill="#9A8C98", font=font_sub)

    n_colors = len(hex_colors)
    if n_colors > 0:
        spacing = min(140, (800 - 120) // n_colors)
        total_w = n_colors * 112 + (n_colors - 1) * (spacing - 112)
        start_x = (width - total_w) // 2
        start_y = 160

        for i, hx in enumerate(hex_colors):
            cx = start_x + i * spacing
            # Círculo r=56 (diametro 112) com borda branca
            draw.ellipse([cx, start_y, cx + 112, start_y + 112], fill=hx, outline="#FFFFFF", width=6)
            # Hex embaixo
            draw.text((cx + 25, start_y + 130), hx, fill="#6B5B7B", font=font_hex)

    draw.text((40, 360), "Feito com 💖 e sementinhas por ratinhos bordadeiros 🐹", fill="#9A8C98", font=font_foot)

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()