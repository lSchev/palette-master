# ui/ninhos.py
import streamlit as st
from ui.export_utils import generate_png, generate_css
from core.image_processor import rgb_to_hex
from ui.groups import get_groups, save_groups
from ui.harmonies import rgb_to_hsl, hsl_to_rgb, apply_pastel

NINHOS = [
    {"id": "mimi", "nome": "Soneca da Mimi", "emoji": "😴", "cores": ["#FFD6E0", "#FFE5D9", "#D8E2DC", "#9A8C98"]},
    {"id": "bochecha", "nome": "Bochecha de Hamster", "emoji": "🐹", "cores": ["#FFB5A7", "#FEC89A", "#E0AFA0", "#F8EDEB"]},
    {"id": "ninho", "nome": "Ninho Quentinho", "emoji": "🪺", "cores": ["#D6CCC2", "#EDEDE9", "#D5BDAF", "#E3D5CA"]},
    {"id": "jardim", "nome": "Jardim dos Bigodes", "emoji": "🌿", "cores": ["#C7E9B0", "#A8DADC", "#B5E48C", "#D9ED92"]},
    {"id": "cha", "nome": "Chá da Tardinha Ratinho", "emoji": "🍵", "cores": ["#E2D6FF", "#C7CEEA", "#B5EAD7", "#FFDAC1"]},
    {"id": "filhotes", "nome": "Filhotes Pastel", "emoji": "👶", "cores": ["#FFACC7", "#FFBFA9", "#FFEB99", "#B8E0D2"]},
    {"id": "dorminhoco", "nome": "Ratinho Dorminhoco", "emoji": "💤", "cores": ["#B5C6E0", "#C9ADA7", "#EAC7CC", "#F2E8CF"]},
    {"id": "bolota", "nome": "Bolotinha Fofa", "emoji": "🍡", "cores": ["#F8C8DC", "#E0BBE4", "#C1CEFE", "#C4FAF8"]}
]

def hex_to_rgb(hx):
    hx = hx.lstrip('#')
    return tuple(int(hx[i:i+2], 16) for i in (0, 2, 4))

def render_ninhos(plugin_data):
    st.header("Ninhos 🪺")
    pastel_val = st.session_state.get("pastel_slider", 0)
    
    groups = get_groups()
    group_options = list(groups.keys())

    for ninho in NINHOS:
        st.markdown(f"### {ninho['emoji']} {ninho['nome']}")
        
        hex_colors = []
        html_cards = []
        
        for hx in ninho['cores']:
            r, g, b = hex_to_rgb(hx)
            h, s, l = rgb_to_hsl(r, g, b)
            h_p, s_p, l_p = apply_pastel(h, s, l, pastel_val)
            nr, ng, nb = hsl_to_rgb(h_p, s_p, l_p)
            new_hx = rgb_to_hex((nr, ng, nb))
            hex_colors.append(new_hx)
            
            card = f'<div class="pm-swatch-card" style="width:100px;"><div class="pm-swatch-color" style="background: rgb({nr},{ng},{nb});"></div><strong>{new_hx}</strong></div>'
            html_cards.append(card)
        
        st.markdown(f'<div class="pm-palette-grid">{"".join(html_cards)}</div>', unsafe_allow_html=True)
        
        c1, c2, c3, c4 = st.columns([1, 1, 2, 4])
        png_data = generate_png(ninho['nome'], hex_colors)
        css_data = generate_css(ninho['nome'], hex_colors)
        c1.download_button("🖼️ PNG", data=png_data, file_name=f"{ninho['id']}.png", mime="image/png", key=f"png_{ninho['id']}")
        c2.download_button("🎨 CSS", data=css_data, file_name=f"{ninho['id']}.css", mime="text/css", key=f"css_{ninho['id']}")
        
        if group_options:
            selected_group = c3.selectbox("Salvar no grupo:", group_options, key=f"sel_{ninho['id']}", label_visibility="collapsed")
            if c4.button("💌 Salvar no Ateliê", key=f"save_{ninho['id']}"):
                new_entry = {
                    "name": ninho['nome'],
                    "colors": [{"rgb": hex_to_rgb(hx), "hex": hx, "percent": 25.0} for hx in hex_colors]
                }
                groups[selected_group].append(new_entry)
                save_groups(groups)
                st.success(f"Salvo em '{selected_group}'!")
        st.divider()