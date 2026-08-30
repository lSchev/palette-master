import json
import streamlit as st
from core.image_processor import rgb_to_hex
from streamlit_js_eval import set_local_storage

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

def render_groups_sidebar(results: list[dict] | None) -> None:
    """Renderiza a seção de grupos na barra lateral com modal e sincronização persistente."""
    st.sidebar.divider()
    st.sidebar.caption("💾 MEUS GRUPOS")
    groups = get_groups()
    
    if st.sidebar.button("➕ Novo grupo", key="btn_novo_grupo"):
        st.session_state["pm_show_new_group"] = True
        
    if st.session_state.get("pm_show_new_group"):
        new_group_dialog()
    
    if not groups:
        st.sidebar.caption("Nenhum grupo ainda. Crie o primeiro acima.")
    else:
        for group_name, colors in groups.items():
            with st.sidebar.expander(f"📁 {group_name} ({len(colors)})", expanded=False):
                if results:
                    if st.button(f"💾 Salvar paleta atual neste grupo", key=f"save_{group_name}"):
                        new_entry = {
                            "name": f"Captura {len(colors) + 1}",
                            "colors": [{"rgb": c["rgb"], "hex": c["hex"], "percent": c["percent"]} for c in results]
                        }
                        groups[group_name].append(new_entry)
                        save_groups(groups)
                        st.success(f"Paleta salva em '{group_name}'!")
                        st.rerun()
                
                if not colors:
                    st.caption("Vazio. Salve uma paleta aqui.")
                else:
                    for i, entry in enumerate(colors):
                        st.markdown(f"**{entry['name']}**")
                        html_cards = []
                        for c in entry["colors"]:
                            r, g, b = c["rgb"]
                            hx = c["hex"]
                            pct = c["percent"]
                            card = f'<div class="pm-swatch-card" style="width:60px;font-size:0.65rem;"><div class="pm-swatch-color" style="background: rgb({r},{g},{b});height:32px;margin-bottom:4px;"></div>{hx}<br>{pct}%</div>'
                            html_cards.append(card)
                        st.markdown(f'<div class="pm-palette-grid">{"".join(html_cards)}</div>', unsafe_allow_html=True)
                        
                        if st.button(f"🗑️ Remover captura {i+1}", key=f"del_{group_name}_{i}"):
                            groups[group_name].pop(i)
                            save_groups(groups)
                            st.rerun()
                
                if st.button(f"🗑️ Excluir grupo", key=f"delgroup_{group_name}"):
                    del groups[group_name]
                    save_groups(groups)
                    st.success(f"Grupo '{group_name}' excluído!")
                    st.rerun()

    payload = json.dumps(groups, sort_keys=True)
    if st.session_state.get("pm_groups_persisted") != payload:
        st.session_state["pm_groups_persisted"] = payload
        set_local_storage("pm_groups", payload)