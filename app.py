# app.py
import streamlit as st
from core.plugin_manager import PluginManager
from core.theme_manager import inject_theme
from ui.sidebar import render_sidebar, render_theme_switcher
from ui.upload_area import render_upload_area
from core.image_processor import extract_palette
from core.color_matcher import match_palette, match_color
from ui.results_area import render_results
from ui.palette_finder import render_palette_finder
from ui.harmonies import render_harmonies
from ui.ninhos import render_ninhos
from ui.atelier import render_atelier

st.set_page_config(page_title="Pontinhos & Ratinhos", page_icon="🐹", layout="wide")

def main() -> None:
    """Ponto de entrada principal com suporte a alias de busca, extração e grupos."""
    theme = render_theme_switcher()
    inject_theme(theme)
    
    st.markdown('<style>header[data-testid="stHeader"]{height:0 !important;} div.block-container{padding-top:1.5rem !important;} section[data-testid="stSidebar"]>div{padding-top:1rem !important;} h1{margin-bottom:0.5rem !important;}</style>', unsafe_allow_html=True)
    
    pm = PluginManager()
    pm.load_plugins()
    
    config = render_sidebar(pm.list_plugins(), pm.errors)
    
    st.title("Pontinhos & Ratinhos 🐹")
    
    plugin_data = None
    if config["niche_id"]:
        plugin_data = pm.get_plugin(config["niche_id"])
    
    tab_extrator, tab_harmonias, tab_ninhos, tab_dmc, tab_atelie = st.tabs([
        "Extrator 🖼️", "Harmonias 🎨", "Ninhos 🪺", "DMC 🧵", "Meu Ateliê 💌"
    ])
    
    results = None
    
    with tab_extrator:
        col_left, col_right = st.columns([3, 2], gap="large")
        
        with col_left:
            work, cropped = render_upload_area()
            
        with col_right:
            if cropped is not None and plugin_data:
                extracted = extract_palette(cropped)
                results = match_palette(extracted, plugin_data)
                
            with st.container(height=560):
                if results:
                    render_results(results)
                else:
                    st.markdown('<div class="pm-placeholder">Envie uma imagem e clique para capturar a paleta ✨</div>', unsafe_allow_html=True)
                    
    with tab_harmonias:
        render_harmonies(plugin_data)
        
    with tab_ninhos:
        render_ninhos(plugin_data)
        
    with tab_dmc:
        if plugin_data:
            nome = plugin_data.get("niche_name", "")
            version = plugin_data.get("version", "1.0")
            st.subheader(f"🎨 Catálogo ativo: {nome} (v{version})")
            
            st.markdown("### A linha perfeita 🎯")
            user_color = st.color_picker("Escolha uma cor para achar a linha mais próxima do catálogo:", "#FFD6E0")
            h_hex = user_color.lstrip('#')
            rgb_user = tuple(int(h_hex[i:i+2], 16) for i in (0, 2, 4))
            
            if plugin_data.get("colors"):
                best_line = match_color(rgb_user, plugin_data["colors"])
                st.markdown(f"**Resultado:** {best_line['code']} - {best_line['name']} (Confiança: {best_line['confidence']}%)")
                br, bg, bb = best_line["rgb"]
                st.markdown(f'<div class="pm-swatch-card"><div class="pm-swatch-color" style="background: rgb({br}, {bg}, {bb});"></div><strong>{best_line["code"]}</strong></div>', unsafe_allow_html=True)
            
            st.divider()
            
            busca = st.text_input("🔎 Buscar por nome ou código", key="pm_busca_cor")
            
            cores_lista = plugin_data.get("colors", [])
            if busca:
                ALIASES = {"ciano": "turquoise", "cyan": "turquoise", "vermelho": "red", "rosa": "rose", "roxo": "violet", "lilas": "lavender", "azul": "blue", "verde": "green", "amarelo": "yellow", "laranja": "orange", "marrom": "brown", "bege": "beige", "cinza": "grey", "branco": "white", "preto": "black", "dourado": "gold"}
                termo = busca.lower()
                termos = [termo] + ([ALIASES[termo]] if termo in ALIASES else [])
                
                cores_lista = [c for c in cores_lista if any(t in c.get("name", "").lower() or t in c.get("code", "").lower() for t in termos)]
                st.caption(f"{len(cores_lista)} cor(es) encontrada(s)")
                
            with st.container(height=320):
                html_cards = []
                for color in cores_lista:
                    r, g, b = color["rgb"]
                    card = f'<div class="pm-swatch-card"><div class="pm-swatch-color" style="background: rgb({r}, {g}, {b});"></div><strong>{color["code"]}</strong><br>{color["name"]}</div>'
                    html_cards.append(card)
                grid_html = f'<div class="pm-palette-grid">{"".join(html_cards)}</div>'
                st.markdown(grid_html, unsafe_allow_html=True)
                
            render_palette_finder(plugin_data)
            
    with tab_atelie:
        render_atelier(results)

    st.markdown(
        '<div style="position: fixed; bottom: 0; left: 0; width: 100%; background-color: rgba(255, 247, 251, 0.95); text-align: center; padding: 10px; font-size: 12px; color: #9A8C98; border-top: 1px solid #FFE6EF; z-index: 9999;">'
        'Feito com 💖 e sementinhas por ratinhos bordadeiros 🐹</div>',
        unsafe_allow_html=True
    )

if __name__ == "__main__":
    main()