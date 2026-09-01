# ui/groups.py
import json
import streamlit as st

def get_groups() -> dict:
    """Retorna os grupos armazenados no cache da sessão."""
    if "pm_groups_cache" not in st.session_state:
        st.session_state["pm_groups_cache"] = {}
    return st.session_state["pm_groups_cache"]

def save_groups(groups: dict) -> None:
    """Atualiza o estado dos grupos na sessão antes da persistência local."""
    st.session_state["pm_groups_cache"] = groups

@st.dialog("📁 Novo grupo")
def new_group_dialog():
    """Modal suspenso para criação de um novo grupo de paletas."""
    new_name = st.text_input("Nome do grupo", key="pm_dialog_new_name", placeholder="Ex: Toalha da vovó")
    c1, c2 = st.columns([1, 1])
    
    if c1.button("✅ Criar", type="primary", key="dlg_criar"):
        if new_name.strip():
            groups = get_groups()
            groups[new_name.strip()] = []
            save_groups(groups)
            st.success(f"Grupo '{new_name.strip()}' criado!")
            st.session_state["pm_show_new_group"] = False
            st.rerun()
            
    if c2.button("❌ Cancelar", key="dlg_cancelar"):
        st.session_state["pm_show_new_group"] = False
        st.rerun()