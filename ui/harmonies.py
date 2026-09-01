# ui/harmonies.py
import streamlit as st
import colorsys
from core.image_processor import rgb_to_hex
from ui.export_utils import generate_png, generate_css

def rgb_to_hsl(r, g, b):
    h, l, s = colorsys.rgb_to_hls(r / 255.0, g / 255.0, b / 255.0)
    return h * 360, s * 100, l * 100

def hsl_to_rgb(h, s, l):
    r, g, b = colorsys.hls_to_rgb(h / 360.0, l / 100.0, s / 100.0)
    return int(r * 255), int(g * 255), int(b * 255)

def apply_pastel(h, s, l, t_val):
    t = t_val / 100.0
    s_new = max(10.0, s * (1.0 - 0.75 * t))
    l_new = min(90.0, l + t * (84.0 - l))
    return h % 360, s_new, l_new

def render_harmonies(plugin_data):
    st.header("Harmonias Pastel 🎨")
    
    col_input1, col_input2 = st.columns([1, 2])
    with col_input1:
        base_hex = st.color_picker("Escolha a cor base:", "#FFD6E0")
    with col_input2:
        pastel_val = st.slider("Modo pastel ☁️ (aplica em todas as abas)", 0, 100, 0, key="pastel_slider")
        
    h_hex = base_hex.lstrip('#')
    r, g, b = tuple(int(h_hex[i:i+2], 16) for i in (0, 2, 4))
    base_h, base_s, base_l = rgb_to_hsl(r, g, b)
    
    harmonies = {
        "Mimi & Mimo (Complementar)": [
            (base_h, base_s, base_l),
            (base_h + 180, base_s, base_l)
        ],
        "Irmãs Bigodes (Análogas)": [
            (base_h - 30, base_s, base_l),
            (base_h, base_s, base_l),
            (base_h + 30, base_s, base_l)
        ],
        "Trio Soneca (Tríade)": [
            (base_h, base_s, base_l),
            (base_h + 120, base_s, base_l),
            (base_h + 240, base_s, base_l)
        ],
        "Família Bolota (Quadrada)": [
            (base_h, base_s, base_l),
            (base_h + 90, base_s, base_l),
            (base_h + 180, base_s, base_l),
            (base_h + 270, base_s, base_l)
        ],
        "Nuvem de Pelo (Monocromática)": [
            (base_h, base_s, base_l),
            (base_h, base_s, min(92.0, base_l + 20)),
            (base_h, base_s, max(20.0, base_l - 15))
        ],
        "Amigas p/ bordar": [
            (base_h, base_s, min(92.0, base_l + 20)),
            (base_h, base_s, max(20.0, base_l - 15)),
            (base_h + 15, base_s, base_l),
            (base_h - 15, base_s, base_l)
        ]
    }
    
    for name, hls_list in harmonies.items():
        st.markdown(f"**{name}**")
        hex_colors = []
        html_cards = []
        for (h, s, l) in hls_list:
            h_p, s_p, l_p = apply_pastel(h, s, l, pastel_val)
            nr, ng, nb = hsl_to_rgb(h_p, s_p, l_p)
            hx = rgb_to_hex((nr, ng, nb))
            hex_colors.append(hx)
            card = f'<div class="pm-swatch-card" style="width:100px; cursor:pointer;" title="Clique para copiar {hx}"><div class="pm-swatch-color" style="background: rgb({nr},{ng},{nb});"></div><strong>{hx}</strong></div>'
            html_cards.append(card)
            
        st.markdown(f'<div class="pm-palette-grid">{"".join(html_cards)}</div>', unsafe_allow_html=True)
        
        c1, c2, _ = st.columns([1, 1, 5])
        png_data = generate_png(name, hex_colors)
        css_data = generate_css(name, hex_colors)
        c1.download_button("🖼️ PNG", data=png_data, file_name=f"{name}.png", mime="image/png", key=f"png_{name}")
        c2.download_button("🎨 CSS", data=css_data, file_name=f"{name}.css", mime="text/css", key=f"css_{name}")
        st.divider()