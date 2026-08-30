import math

def match_color(rgb: tuple[int, int, int], plugin_colors: list[dict]) -> dict:
    """Encontra a cor mais próxima no plugin baseado em distância euclidiana RGB."""
    best_match = None
    min_dist = float('inf')
    
    for pc in plugin_colors:
        pr, pg, pb = pc["rgb"]
        dist = math.sqrt((rgb[0] - pr)**2 + (rgb[1] - pg)**2 + (rgb[2] - pb)**2)
        
        if dist < min_dist:
            min_dist = dist
            best_match = pc
            
    confidence = round(max(0.0, 1.0 - (min_dist / 441.67)) * 100, 1)
    
    return {
        "code": best_match.get("code", ""),
        "name": best_match.get("name", ""),
        "rgb": best_match.get("rgb", [0,0,0]),
        "confidence": confidence
    }

def match_palette(extracted: list[dict], plugin: dict) -> list[dict]:
    """Mapeia as cores extraídas contra as cores do catálogo ativo."""
    plugin_colors = plugin.get("colors", [])
    if not plugin_colors:
        return extracted
        
    for item in extracted:
        item["match"] = match_color(item["rgb"], plugin_colors)
        
    return extracted