import streamlit as st
from core.plugin_manager import PluginManager
from core.theme_manager import inject_theme
from ui.sidebar import render_sidebar, render_theme_switcher
from ui.upload_area import render_upload_area
from core.image_processor import extract_palette
from core.color_matcher import match_palette
from ui.results_area import render_results
from ui.groups import render_groups_sidebar
from ui.palette_finder import render_palette_finder

st.set_page_config(page_title="Palette Master", page_icon="🎨", layout="wide")

def main() -> None:
    """Ponto de entrada principal com suporte a alias de busca, extração e grupos."""
    theme = render_theme_switcher()
    inject_theme(theme)
    
    st.markdown('<style>header[data-testid="stHeader"]{height:0 !important;} div.block-container{padding-top:1.5rem !important;} section[data-testid="stSidebar"]>div{padding-top:1rem !important;} h1{margin-bottom:0.5rem !important;}</style>', unsafe_allow_html=True)
    
    pm = PluginManager()
    pm.load_plugins()
    
    config = render_sidebar(pm.list_plugins(), pm.errors)
    
    st.title("Palette Master")
    
    col_left, col_right = st.columns([3, 2], gap="large")
    
    plugin_data = None
    if config["niche_id"]:
        plugin_data = pm.get_plugin(config["niche_id"])
    
    with col_left:
        work, cropped = render_upload_area()
        
    with col_right:
        results = None
        if cropped is not None and plugin_data:
            extracted = extract_palette(cropped)
            results = match_palette(extracted, plugin_data)
            
        with st.container(height=560):
            if results:
                render_results(results)
            else:
                st.markdown('<div class="pm-placeholder">Envie uma imagem e clique para capturar a paleta ✨</div>', unsafe_allow_html=True)
                
        if plugin_data:
            nome = plugin_data.get("niche_name", "")
            version = plugin_data.get("version", "1.0")
            with st.expander(f"🎨 Catálogo ativo: {nome} (v{version})", expanded=False):
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
                
    render_groups_sidebar(results)

if __name__ == "__main__":
    main()