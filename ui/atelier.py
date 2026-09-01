# ui/atelier.py
import json
import streamlit as st
from ui.groups import get_groups, save_groups, new_group_dialog
from streamlit_js_eval import set_local_storage
from ui.export_utils import generate_png, generate_css

@st.dialog("Renomear captura")
def rename_capture_dialog(group_name: str, index: int, current_name: str):
    new_name = st.text_input("Nome", value=current_name, key=f"rename_{group_name}_{index}")
    c1, c2 = st.columns([1, 1])
    if c1.button("✅ Salvar", type="primary"):
        if new_name.strip():
            groups = get_groups()
            groups[group_name][index]['name'] = new_name.strip()
            save_groups(groups)
            st.rerun()
    if c2.button("❌ Cancelar"):
        st.rerun()

def render_atelier(results: list[dict] | None) -> None:
    st.header("Meu Ateliê 💌")
    st.caption("Organize e exporte suas paletas salvas")
    groups = get_groups()
    
    if st.button("➕ Novo grupo", key="btn_novo_grupo_tab"):
        st.session_state["pm_show_new_group"] = True
        
    if st.session_state.get("pm_show_new_group"):
        new_group_dialog()
        
    if not groups:
        st.info("Nenhum grupo ainda. Crie o primeiro acima para salvar suas paletas.")
    else:
        for group_name, entries in groups.items():
            with st.expander(f"📁 {group_name} ({len(entries)})", expanded=False):
                if results:
                    if st.button(f"💾 Salvar paleta extraída neste grupo", key=f"save_tab_{group_name}"):
                        new_entry = {
                            "name": f"Captura {len(entries) + 1}",
                            "colors": [{"rgb": c["rgb"], "hex": c["hex"], "percent": c.get("percent", 0)} for c in results]
                        }
                        groups[group_name].append(new_entry)
                        save_groups(groups)
                        st.success(f"Paleta salva em '{group_name}'!")
                        st.rerun()
                        
                if not entries:
                    st.caption("Vazio. Salve uma paleta aqui pelas abas.")
                else:
                    for i, entry in enumerate(entries):
                        st.markdown(f"**{entry['name']}**")
                        html_cards = []
                        hex_colors = []
                        for c in entry["colors"]:
                            r, g, b = c["rgb"]
                            hx = c["hex"]
                            hex_colors.append(hx)
                            pct = c.get("percent", "")
                            pct_str = f"{pct}%" if pct else ""
                            card = f'<div class="pm-swatch-card" style="width:60px;font-size:0.65rem;"><div class="pm-swatch-color" style="background: rgb({r},{g},{b});height:32px;margin-bottom:4px;"></div>{hx}<br>{pct_str}</div>'
                            html_cards.append(card)
                        st.markdown(f'<div class="pm-palette-grid">{"".join(html_cards)}</div>', unsafe_allow_html=True)
                        
                        col1, col2, col3, col4 = st.columns([1, 1, 1, 2])
                        png_data = generate_png(f"{group_name} - {entry['name']}", hex_colors)
                        css_data = generate_css(f"{group_name} - {entry['name']}", hex_colors)
                        col1.download_button("🖼️ PNG", data=png_data, file_name=f"paleta_{i}.png", mime="image/png", key=f"png_{group_name}_{i}")
                        col2.download_button("🎨 CSS", data=css_data, file_name=f"paleta_{i}.css", mime="text/css", key=f"css_{group_name}_{i}")
                        
                        if col3.button("✏️ Renomear", key=f"ren_tab_{group_name}_{i}"):
                            rename_capture_dialog(group_name, i, entry['name'])
                            
                        if col4.button("🗑️ Remover", key=f"del_tab_{group_name}_{i}"):
                            groups[group_name].pop(i)
                            save_groups(groups)
                            st.rerun()
                            
                st.write("")
                if st.button(f"🗑️ Excluir grupo '{group_name}'", key=f"delgroup_tab_{group_name}"):
                    del groups[group_name]
                    save_groups(groups)
                    st.success(f"Grupo '{group_name}' excluído!")
                    st.rerun()

    payload = json.dumps(groups, sort_keys=True)
    if st.session_state.get("pm_groups_persisted") != payload:
        st.session_state["pm_groups_persisted"] = payload
        set_local_storage("pm_groups", payload)