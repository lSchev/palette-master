# ui/sidebar.py
import json
import streamlit as st
from streamlit_js_eval import streamlit_js_eval, get_local_storage, set_local_storage

def render_theme_switcher() -> str:
    """Renderiza os botões de troca de tema usando ícones Material e persistência."""
    if "theme" not in st.session_state:
        saved = get_local_storage("pm_theme")
        if saved in ("Claro", "Escuro", "Pastel"):
            st.session_state["theme"] = saved
        else:
            dark = streamlit_js_eval(
                js_expressions="window.matchMedia('(prefers-color-scheme: dark)').matches", 
                want_output=True, 
                key="pm_dark_detect"
            )
            st.session_state["theme"] = "Escuro" if dark in (True, "true", None) else "Claro"
            
    col1, col2, col3, col4 = st.columns([50, 1, 1, 1], gap="small")
    
    if col2.button(":material/light_mode:", key="btn_claro"):
        st.session_state["theme"] = "Claro"
        set_local_storage("pm_theme", "Claro")
        st.rerun()
    if col3.button(":material/dark_mode:", key="btn_escuro"):
        st.session_state["theme"] = "Escuro"
        set_local_storage("pm_theme", "Escuro")
        st.rerun()
    if col4.button(":material/local_florist:", key="btn_pastel"):
        st.session_state["theme"] = "Pastel"
        set_local_storage("pm_theme", "Pastel")
        st.rerun()
        
    return st.session_state["theme"]

def render_sidebar(plugins: list[dict], load_errors: list[str]) -> dict:
    """Renderiza a barra lateral principal, plugins e carrega cache de grupos persistido."""
    if not st.session_state.get("pm_groups_from_storage"):
        saved_groups = get_local_storage("pm_groups", component_key="pm_load_groups_init")
        if saved_groups is not None:
            try:
                st.session_state["pm_groups_cache"] = json.loads(saved_groups)
            except Exception:
                st.session_state["pm_groups_cache"] = {}
            st.session_state["pm_groups_from_storage"] = True
        elif "pm_groups_cache" not in st.session_state:
            st.session_state["pm_groups_cache"] = {}

    st.sidebar.markdown('<div class="pm-logo">🐹 Pontinhos & Ratinhos</div>', unsafe_allow_html=True)
    st.sidebar.caption("CATÁLOGOS (DLCs)")
    
    if load_errors:
        for error in load_errors:
            st.sidebar.warning(error)
            
    if not plugins:
        st.sidebar.error("Nenhum plugin carregado.")
        return {"niche_id": None}
        
    if "niche_id" not in st.session_state or not any(p["niche_id"] == st.session_state["niche_id"] for p in plugins):
        st.session_state["niche_id"] = plugins[0]["niche_id"]
        
    for plugin in plugins:
        niche_id = plugin["niche_id"]
        name = plugin.get("niche_name", niche_id)
        icon = plugin.get("icon", "🎨")
        
        label = f"{icon} {name}"
        if st.session_state["niche_id"] == niche_id:
            label += " ●"
            
        if st.sidebar.button(label, key=f"plug_{niche_id}"):
            st.session_state["niche_id"] = niche_id
            st.rerun()
            
    st.sidebar.divider()
    st.sidebar.button("🕘 Histórico (em breve)", disabled=True)
    st.sidebar.button("⚙️ Configurações (em breve)", disabled=True)
    
    return {"niche_id": st.session_state["niche_id"]}