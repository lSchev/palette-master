import streamlit as st
from pathlib import Path

def inject_theme(theme_name: str) -> None:
    """Lê e injeta o CSS do tema escolhido no Streamlit."""
    theme_map = {
        "Claro": "theme_light.css",
        "Escuro": "theme_dark.css",
        "Pastel": "theme_pastel.css"
    }
    
    css_file = theme_map.get(theme_name, "theme_light.css")
    base_dir = Path(__file__).resolve().parent.parent
    target_file = base_dir / "assets" / "css" / css_file
    
    if target_file.exists():
        try:
            with open(target_file, "r", encoding="utf-8") as f:
                css_content = f.read()
            st.markdown(f"<style>{css_content}</style>", unsafe_allow_html=True)
        except Exception as e:
            st.warning(f"Erro ao carregar o tema {theme_name}: {e}")
    else:
        st.warning(f"Arquivo de tema ausente: {target_file}")