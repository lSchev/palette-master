# ui/palette_finder.py
import streamlit as st
import colorsys
from ui.groups import get_groups, save_groups
from core.image_processor import rgb_to_hex

def classify(rgb: tuple[int, int, int]) -> str:
    """Classifica uma cor RGB em um grupo de tons pré-definidos via regras HSV."""
    r, g, b = [x / 255.0 for x in rgb]
    h_frac, s, v = colorsys.rgb_to_hsv(r, g, b)
    h = h_frac * 360
    
    if s < 0.15 or v < 0.15:
        return "Neutros"
    if 15 <= h < 45 and v < 0.65:
        return "Marrom"
    if h < 15 or h >= 345:
        return "Vermelho"
    if 15 <= h < 40:
        return "Laranja"
    if 40 <= h < 70:
        return "Amarelo"
    if 70 <= h < 170:
        return "Verde"
    if 170 <= h < 260:
        return "Azul"
    if 260 <= h < 310:
        return "Roxo"
    if 310 <= h < 345:
        return "Rosa"
        
    return "Neutros"

def render_palette_finder(plugin: dict | None) -> None:
    """Renderiza a interface do buscador de paletas por tom com grade e sugestões."""
    with st.expander("🔍 Paletas por tom (catálogo ativo)", expanded=False):
        if plugin is None:
            st.caption("Sem catálogo ativo.")
            return
            
        selecao = st.multiselect("Que tons você quer?", ["Vermelho", "Laranja", "Amarelo", "Verde", "Azul", "Roxo", "Rosa", "Marrom", "Neutros"])
        
        if not selecao:
            st.caption("Escolha um ou mais tons para ver sugestões de paletas.")
            return
            
        plugin_colors = plugin.get("colors", [])
        filtered = [c for c in plugin_colors if classify(c["rgb"]) in selecao]
        
        if not filtered:
            st.warning("O catálogo ativo não tem cores nesses tons.")
            return
            
        st.caption(f"{len(filtered)} cor(es) nesses tons no catálogo")
        
        with st.container(height=320):
            html_cards_filtered = []
            for c in filtered:
                r, g, b = c["rgb"]
                card = f'<div class="pm-swatch-card"><div class="pm-swatch-color" style="background: rgb({r}, {g}, {b});"></div><strong>{c["code"]}</strong><br>{c["name"]}</div>'
                html_cards_filtered.append(card)
            st.markdown(f'<div class="pm-palette-grid">{"".join(html_cards_filtered)}</div>', unsafe_allow_html=True)
            
        st.caption("Combos sugeridos")
        
        neutros = [c for c in plugin_colors if classify(c["rgb"]) == "Neutros"]
        neutros_claros = [c for c in neutros if colorsys.rgb_to_hsv(c["rgb"][0]/255, c["rgb"][1]/255, c["rgb"][2]/255)[2] >= 0.8]
        
        suaves = [c for c in filtered if colorsys.rgb_to_hsv(c["rgb"][0]/255, c["rgb"][1]/255, c["rgb"][2]/255)[2] >= 0.65 and colorsys.rgb_to_hsv(c["rgb"][0]/255, c["rgb"][1]/255, c["rgb"][2]/255)[1] <= 0.55][:4]
        if suaves and neutros_claros and neutros_claros[0] not in suaves:
            suaves.append(neutros_claros[0])
            
        vibrantes = [c for c in filtered if colorsys.rgb_to_hsv(c["rgb"][0]/255, c["rgb"][1]/255, c["rgb"][2]/255)[1] >= 0.5 and colorsys.rgb_to_hsv(c["rgb"][0]/255, c["rgb"][1]/255, c["rgb"][2]/255)[2] >= 0.4][:5]
        
        filtered_sorted = sorted(filtered, key=lambda c: colorsys.rgb_to_hsv(c["rgb"][0]/255, c["rgb"][1]/255, c["rgb"][2]/255)[2], reverse=True)
        eq = []
        if len(filtered_sorted) >= 3:
            eq = [filtered_sorted[0], filtered_sorted[len(filtered_sorted)//2], filtered_sorted[-1]]
        elif filtered_sorted:
            eq = list(filtered_sorted)
        if eq and neutros and neutros[0] not in eq:
            eq.append(neutros[0])
            
        paletas = {}
        if len(suaves) >= 2: paletas["Suave pra bebê"] = suaves
        if len(vibrantes) >= 2: paletas["Vibrante"] = vibrantes
        if len(eq) >= 2: paletas["Equilibrada"] = eq
        
        if not paletas:
            st.info("Poucas cores nesses tons no catálogo — selecione mais tons.")
            return
            
        groups = get_groups()
        target = st.selectbox("Salvar paletas em qual grupo?", list(groups.keys())) if groups else None
        
        for nome, paleta in paletas.items():
            st.markdown(f"**{nome}**")
            html_cards = []
            for c in paleta:
                r, g, b = c["rgb"]
                card = f'<div class="pm-swatch-card"><div class="pm-swatch-color" style="background: rgb({r}, {g}, {b});"></div><strong>{c["code"]}</strong><br>{c["name"]}</div>'
                html_cards.append(card)
            st.markdown(f'<div class="pm-palette-grid">{"".join(html_cards)}</div>', unsafe_allow_html=True)
            
            if target:
                if st.button(f"💾 Salvar '{nome}' no grupo", key=f"find_save_{nome}"):
                    new_entry = {
                        "name": nome,
                        "colors": [{"rgb": c["rgb"], "hex": rgb_to_hex(c["rgb"]), "percent": round(100/len(paleta), 1)} for c in paleta]
                    }
                    groups[target].append(new_entry)
                    save_groups(groups)
                    st.success(f"Paleta salva em '{target}'!")
                    st.rerun()