# ui/upload_area.py
import streamlit as st
from PIL import Image, ImageDraw
from streamlit_image_coordinates import streamlit_image_coordinates

def render_upload_area() -> tuple[Image.Image | None, Image.Image | None]:
    """Renderiza a área de upload, controles de tamanho, imagem lado a lado e captura de clique."""
    uploaded_file = st.file_uploader("Envie uma imagem", type=["png", "jpg", "jpeg", "webp"])
    
    if uploaded_file is None:
        return None, None
        
    file_id = f"{uploaded_file.name}_{uploaded_file.size}"
    if st.session_state.get("pm_file_id") != file_id:
        st.session_state["pm_file_id"] = file_id
        st.session_state["pm_center"] = None
        st.session_state["pm_last_click"] = None
        
    if "pm_tam" not in st.session_state:
        st.session_state["pm_tam"] = "M"
        
    c_btn1, c_btn2, c_btn3, _ = st.columns([1, 1, 1, 9])
    
    lbl_p = "P ●" if st.session_state["pm_tam"] == "P" else "P"
    lbl_m = "M ●" if st.session_state["pm_tam"] == "M" else "M"
    lbl_g = "G ●" if st.session_state["pm_tam"] == "G" else "G"
    
    if c_btn1.button(lbl_p):
        st.session_state["pm_tam"] = "P"
        st.rerun()
    if c_btn2.button(lbl_m):
        st.session_state["pm_tam"] = "M"
        st.rerun()
    if c_btn3.button(lbl_g):
        st.session_state["pm_tam"] = "G"
        st.rerun()
        
    original = Image.open(uploaded_file).convert("RGB")
    work = original.copy()
    work.thumbnail((700, 700))
    
    props = {"P": 0.15, "M": 0.30, "G": 0.50}
    prop = props[st.session_state["pm_tam"]]
    
    bw = int(work.width * prop)
    bh = int(work.height * prop)
    
    if st.session_state.get("pm_center") is not None:
        cx, cy = st.session_state["pm_center"]
    else:
        cx, cy = work.width // 2, work.height // 2
        
    x0 = max(0, min(cx - bw // 2, work.width - bw))
    y0 = max(0, min(cy - bh // 2, work.height - bh))
    x1 = x0 + bw
    y1 = y0 + bh
    
    st.caption("Clique na imagem para posicionar a área de captura")
    
    display_img = work.copy()
    draw = ImageDraw.Draw(display_img)
    draw.rectangle([x0, y0, x1, y1], outline="#FF0000", width=2)
    
    c1, c2 = st.columns([3, 1])
    
    with c1:
        coords = streamlit_image_coordinates(display_img, key="pm_click")
        
    if coords is not None and coords != st.session_state.get("pm_last_click"):
        st.session_state["pm_last_click"] = coords
        st.session_state["pm_center"] = (coords["x"], coords["y"])
        st.rerun()
        
    cropped = work.crop((x0, y0, x1, y1))
    
    with c2:
        if cropped:
            st.image(cropped, caption="Área", use_container_width=True)
            
    return work, cropped