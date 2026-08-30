import numpy as np
import math
from PIL import Image

def rgb_to_hex(rgb: tuple[int, int, int]) -> str:
    """Converte uma tupla de valores RGB para uma string HEX maiúscula."""
    return f"#{rgb[0]:02X}{rgb[1]:02X}{rgb[2]:02X}"

def extract_palette(image: Image.Image, max_colors: int = 10) -> list[dict]:
    """Extrai cores via binning com resgate preciso de cores vivas e claras."""
    img_rgb = image.convert("RGB")
    img_rgb.thumbnail((200, 200))
    arr = np.array(img_rgb).reshape(-1, 3).astype(int)
    total_pixels = len(arr)
    
    binned = (arr // 32) * 32 + 16
    unique_colors, counts = np.unique(binned, axis=0, return_counts=True)
    
    sorted_idx = np.argsort(-counts)
    unique_colors = unique_colors[sorted_idx]
    counts = counts[sorted_idx]
    
    chosen = []
    chosen_counts = []
    
    num_coverage = min(len(unique_colors), max_colors - 3)
    for i in range(num_coverage):
        chosen.append(tuple(unique_colors[i]))
        chosen_counts.append(counts[i])
        
    maxc = arr.max(axis=1)
    minc = arr.min(axis=1)
    sat = (maxc - minc) / np.maximum(maxc, 1)
    
    mask_vivid = (sat > 0.45) & (maxc > 60)
    if mask_vivid.sum() > 50:
        vivid_arr = arr[mask_vivid]
        vivid_binned = (vivid_arr // 32) * 32 + 16
        v_unique, v_counts = np.unique(vivid_binned, axis=0, return_counts=True)
        v_sorted_idx = np.argsort(-v_counts)
        v_unique = v_unique[v_sorted_idx]
        v_counts = v_counts[v_sorted_idx]
        
        added = 0
        for i in range(len(v_unique)):
            if added >= 2 or len(chosen) >= max_colors:
                break
            candidate = tuple(v_unique[i])
            is_dup = any(math.sqrt(sum((a - b)**2 for a, b in zip(candidate, c))) < 60 for c in chosen)
            if not is_dup:
                chosen.append(candidate)
                chosen_counts.append(v_counts[i])
                added += 1
                
    mask_light = (sat < 0.30) & (maxc > 200)
    if mask_light.sum() > 100:
        light_arr = arr[mask_light]
        light_binned = (light_arr // 32) * 32 + 16
        l_unique, l_counts = np.unique(light_binned, axis=0, return_counts=True)
        l_sorted_idx = np.argsort(-l_counts)
        l_unique = l_unique[l_sorted_idx]
        l_counts = l_counts[l_sorted_idx]
        
        added = 0
        for i in range(len(l_unique)):
            if added >= 1 or len(chosen) >= max_colors:
                break
            percent_candidate = (l_counts[i] / total_pixels) * 100
            if percent_candidate < 1.5:
                continue
            candidate = tuple(l_unique[i])
            is_dup = any(math.sqrt(sum((a - b)**2 for a, b in zip(candidate, c))) < 60 for c in chosen)
            if not is_dup:
                chosen.append(candidate)
                chosen_counts.append(l_counts[i])
                added += 1
                
    results = []
    for i in range(len(chosen)):
        r, g, b = int(chosen[i][0]), int(chosen[i][1]), int(chosen[i][2])
        percent = round((chosen_counts[i] / total_pixels) * 100, 1)
        results.append({
            "rgb": (r, g, b),
            "hex": rgb_to_hex((r, g, b)),
            "percent": percent
        })
        
    results.sort(key=lambda x: x["percent"], reverse=True)
    return results