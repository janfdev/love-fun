import os
import subprocess

src_svg = "/root/beauty-booth/public/brand/concepts/concept-a-twin-shutter.svg"
out_dir = "/root/beauty-booth/public"
brand_a_dir = "/root/beauty-booth/public/brand/a"

# Copy master SVG
with open(src_svg, "r") as f:
    svg_content = f.read()

with open(f"{brand_a_dir}/logo-a-master.svg", "w") as f:
    f.write(svg_content)

with open(f"{out_dir}/favicon.svg", "w") as f:
    f.write(svg_content)

sizes = [16, 32, 48, 180, 192, 512]

for sz in sizes:
    png_path = f"{out_dir}/icon-{sz}.png"
    if sz == 180:
        png_path = f"{out_dir}/apple-touch-icon.png"
    
    cmd = [
        "/usr/local/bin/chromium",
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        f"--window-size={sz},{sz}",
        f"--screenshot={png_path}",
        src_svg
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    # also copy to brand_a_dir
    subprocess.run(["cp", png_path, f"{brand_a_dir}/icon-{sz}.png"], stdout=subprocess.DEVNULL)

# Generate favicon.ico using icon-32.png
subprocess.run(["cp", f"{out_dir}/icon-32.png", f"{out_dir}/favicon.ico"], stdout=subprocess.DEVNULL)
subprocess.run(["cp", f"{out_dir}/icon-32.png", f"{brand_a_dir}/favicon.ico"], stdout=subprocess.DEVNULL)

print("Icons built successfully")
