import streamlit as st

def render_results(results: list[dict]) -> None:
    """Renderiza a grade de resultados do pareamento de cores usando HTML em linha única."""
    if not results:
        return
        
    html_cards = []
    for item in results:
        r, g, b = item["rgb"]
        hx = item["hex"]
        pct = item["percent"]
        m = item.get("match", {})
        code = m.get("code", "")
        name = m.get("name", "")
        conf = m.get("confidence", 0.0)
        card = f'<div class="pm-swatch-card"><div class="pm-swatch-color" style="background: rgb({r}, {g}, {b});"></div><strong>{hx}</strong> {pct}%<br>→ {code} {name} ({conf}%)</div>'
        html_cards.append(card)
        
    grid_html = f'<div class="pm-palette-grid">{"".join(html_cards)}</div>'
    st.markdown(grid_html, unsafe_allow_html=True)