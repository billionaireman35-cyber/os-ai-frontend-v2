import os
from PIL import Image, ImageDraw

# Ensure output directory exists
os.makedirs('public', exist_ok=True)

def draw_icon(size):
    # Dark background
    img = Image.new('RGB', (size, size), '#0E1318')
    draw = ImageDraw.Draw(img)

    # Chevron shape (gold #FDF8EE)
    margin = size // 6
    points = [
        (margin, size - margin),
        (size // 2, margin),
        (size - margin, size - margin),
        (size // 2, size - margin - margin // 2),
    ]
    draw.polygon(points, fill='#FDF8EE')
    return img

# Generate required sizes
for size in [192, 512]:
    img = draw_icon(size)
    img.save(f'public/icon-{size}.png')

# Also generate apple‑touch icon (180)
img = draw_icon(180)
img.save('public/icon-180.png')

print('Icons generated successfully!')
