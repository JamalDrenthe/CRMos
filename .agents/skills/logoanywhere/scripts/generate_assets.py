#!/usr/bin/env python3
"""
LogoAnywhere - Digital Brand Asset Generator
Transforms a single high-resolution master logo into a complete, production-ready
digital asset pack (favicons, touch icons, PWA icons, OG previews, social avatars, and webmanifest).
"""

import os
import sys
import shutil
import argparse

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit(
        "❌ Fout: Pillow is niet geïnstalleerd.\n"
        "Voer het volgende commando uit om het te installeren:\n"
        "    pip install Pillow"
    )


def hex_to_rgba(hex_color: str) -> tuple:
    hex_color = hex_color.lstrip("#")
    if len(hex_color) == 6:
        r, g, b = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
        return (r, g, b, 255)
    elif len(hex_color) == 8:
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4, 6))
    return (255, 255, 255, 255)


def generate_webmanifest(output_directory: str, brand_name: str = "Website", theme_color: str = "#FFFFFF"):
    """Genereert automatisch een geldig site.webmanifest bestand als dat nog niet bestaat."""
    manifest_path = os.path.join(output_directory, "site.webmanifest")
    content = f"""{{
  "name": "{brand_name}",
  "short_name": "{brand_name}",
  "description": "{brand_name} Web Application",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "{theme_color}",
  "theme_color": "{theme_color}",
  "icons": [
    {{
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    }},
    {{
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }}
  ]
}}
"""
    with open(manifest_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("  ✓ site.webmanifest aangemaakt")


def load_master_image(source_path: str):
    """Laadt de afbeelding in met foutafhandeling voor SVG of ongeldige formaten."""
    if not os.path.exists(source_path):
        sys.exit(f"❌ Fout: Bronbestand '{source_path}' niet gevonden.")

    ext = os.path.splitext(source_path)[1].lower()

    if ext == ".svg":
        # Pillow ondersteunt standaard geen SVG zonder CairoSVG
        try:
            import cairosvg
            import io
            png_bytes = cairosvg.svg2png(url=source_path, output_width=2048, output_height=2048)
            return Image.open(io.BytesIO(png_bytes)).convert("RGBA")
        except (ImportError, Exception):
            sys.exit(
                f"⚠️ Let op: '{source_path}' is een SVG-bestand.\n"
                "Pillow kan standaard geen SVG renderen zonder 'cairosvg'.\n"
                "👉 Advies: Exporteer je SVG eenmalig naar een transparante PNG van hoge resolutie\n"
                "   (bijv. 2000x2000 px) en voer het script daarmee uit."
            )

    try:
        return Image.open(source_path).convert("RGBA")
    except Exception as e:
        sys.exit(f"❌ Fout bij het openen van '{source_path}': {e}")


def create_brand_assets(
    source_image_path: str,
    output_directory: str = "public",
    bg_hex: str = "#FFFFFF",
    brand_name: str = "Website"
):
    master = load_master_image(source_image_path)
    os.makedirs(output_directory, exist_ok=True)
    bg_rgba = hex_to_rgba(bg_hex)

    print(f"🎨 LogoAnywhere: Verwerken van '{source_image_path}'...")
    print(f"📁 Uitvoermap: '{output_directory}' (Achtergrondkleur: {bg_hex})")

    # Als de bron een SVG is, kopieer deze ook direct als favicon.svg
    if source_image_path.lower().endswith(".svg"):
        svg_dest = os.path.join(output_directory, "favicon.svg")
        try:
            shutil.copyfile(source_image_path, svg_dest)
            print("  ✓ favicon.svg gekopieerd vanuit bron-SVG")
        except Exception:
            pass

    # -------------------------------------------------------------
    # 1. Klassieke Favicon (favicon.ico: 16x16, 32x32, 48x48)
    # -------------------------------------------------------------
    ico_sizes = [(16, 16), (32, 32), (48, 48)]
    ico_layers = [master.resize(size, Image.Resampling.LANCZOS) for size in ico_sizes]
    ico_path = os.path.join(output_directory, "favicon.ico")
    ico_layers[0].save(ico_path, format="ICO", sizes=ico_sizes)
    print("  ✓ favicon.ico gegenereerd (16x16, 32x32, 48x48)")

    # -------------------------------------------------------------
    # 2. Apple Touch Icon (180x180 - GEEN transparantie toegestaan)
    # -------------------------------------------------------------
    apple_canvas = Image.new("RGBA", (180, 180), bg_rgba)
    apple_logo = ImageOps.contain(master, (140, 140), method=Image.Resampling.LANCZOS)
    apple_pos = ((180 - apple_logo.width) // 2, (180 - apple_logo.height) // 2)
    apple_canvas.paste(apple_logo, apple_pos, mask=apple_logo)
    apple_path = os.path.join(output_directory, "apple-touch-icon.png")
    apple_canvas.convert("RGB").save(apple_path, format="PNG")
    print("  ✓ apple-touch-icon.png gegenereerd (180x180, dekkende achtergrond)")

    # -------------------------------------------------------------
    # 3. Android / PWA Icons (192x192 en 512x512)
    # -------------------------------------------------------------
    for size in [192, 512]:
        pwa_canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        inner_bound = int(size * 0.8)
        pwa_logo = ImageOps.contain(master, (inner_bound, inner_bound), method=Image.Resampling.LANCZOS)
        pwa_pos = ((size - pwa_logo.width) // 2, (size - pwa_logo.height) // 2)
        pwa_canvas.paste(pwa_logo, pwa_pos, mask=pwa_logo)
        pwa_path = os.path.join(output_directory, f"android-chrome-{size}x{size}.png")
        pwa_canvas.save(pwa_path, format="PNG")
        print(f"  ✓ android-chrome-{size}x{size}.png gegenereerd")

    # -------------------------------------------------------------
    # 4. Social Media Avatar (1000x1000 - Cirkel Safe Zone)
    # -------------------------------------------------------------
    avatar_canvas = Image.new("RGBA", (1000, 1000), bg_rgba)
    avatar_logo = ImageOps.contain(master, (700, 700), method=Image.Resampling.LANCZOS)
    avatar_pos = ((1000 - avatar_logo.width) // 2, (1000 - avatar_logo.height) // 2)
    avatar_canvas.paste(avatar_logo, avatar_pos, mask=avatar_logo)
    avatar_path = os.path.join(output_directory, "social-avatar.png")
    avatar_canvas.save(avatar_path, format="PNG")
    print("  ✓ social-avatar.png gegenereerd (1000x1000, 20% safe-margin)")

    # -------------------------------------------------------------
    # 5. Open Graph Image (1200x630 - Link Previews)
    # -------------------------------------------------------------
    og_canvas = Image.new("RGBA", (1200, 630), bg_rgba)
    og_logo = ImageOps.contain(master, (600, 320), method=Image.Resampling.LANCZOS)
    og_pos = ((1200 - og_logo.width) // 2, (630 - og_logo.height) // 2)
    og_canvas.paste(og_logo, og_pos, mask=og_logo)
    og_path = os.path.join(output_directory, "og-image.png")
    og_canvas.convert("RGB").save(og_path, format="PNG")
    print("  ✓ og-image.png gegenereerd (1200x630, safe zone centered)")

    # -------------------------------------------------------------
    # 6. Web Manifest
    # -------------------------------------------------------------
    generate_webmanifest(output_directory, brand_name=brand_name, theme_color=bg_hex)

    print("\n✨ Alle brand assets succesvol gegenereerd in:", output_directory)


def main():
    parser = argparse.ArgumentParser(
        description="LogoAnywhere: Genereer alle web-, PWA-, en social media brand assets vanuit één master logo."
    )
    parser.add_argument(
        "input",
        nargs="?",
        default="logo.png",
        help="Pad naar het bronbestand (hoge resolutie PNG of RGBA afbeelding). Standaard: logo.png",
    )
    parser.add_argument(
        "-o",
        "--output",
        default="public",
        help="Doelmap voor gegenereerde bestanden (bijv. public of assets/icons). Standaard: public",
    )
    parser.add_argument(
        "-b",
        "--bg",
        default="#FFFFFF",
        help="Achtergrondkleur in HEX voor niet-transparante assets. Standaard: #FFFFFF",
    )
    parser.add_argument(
        "-n",
        "--name",
        default="Website",
        help="Bedrijfs- of sitenaam voor site.webmanifest. Standaard: Website",
    )

    args = parser.parse_args()
    create_brand_assets(
        args.input,
        output_directory=args.output,
        bg_hex=args.bg,
        brand_name=args.name
    )


if __name__ == "__main__":
    main()
