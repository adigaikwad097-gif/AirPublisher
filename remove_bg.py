air shpu#!/usr/bin/env python3
"""
Remove background from an image using rembg or PIL fallback
"""
import sys
from pathlib import Path

try:
    from rembg import remove
    from PIL import Image
    import io
    
    def remove_background_rembg(input_path, output_path):
        """Remove background using rembg library"""
        with open(input_path, 'rb') as input_file:
            input_data = input_file.read()
        
        output_data = remove(input_data)
        
        with open(output_path, 'wb') as output_file:
            output_file.write(output_data)
        
        print(f"✅ Background removed using rembg: {output_path}")
        return True
except ImportError:
    try:
        from PIL import Image
        import numpy as np
        
        def remove_background_pil(input_path, output_path):
            """Remove background using PIL (basic threshold method)"""
            img = Image.open(input_path).convert("RGBA")
            data = np.array(img)
            
            # Simple method: make white/light pixels transparent
            # This is a basic approach - rembg would be better
            threshold = 240
            r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]
            
            # Create mask for white/light background
            mask = (r > threshold) & (g > threshold) & (b > threshold)
            data[:,:,3] = np.where(mask, 0, 255)  # Make background transparent
            
            result = Image.fromarray(data, 'RGBA')
            result.save(output_path, 'PNG')
            print(f"✅ Background removed using PIL (basic method): {output_path}")
            print("⚠️  Note: For better results, install rembg: pip3 install rembg")
            return True
    except ImportError:
        print("❌ Error: PIL/Pillow not installed. Install with: pip3 install Pillow")
        print("   For better results: pip3 install rembg")
        return False

if __name__ == "__main__":
    input_file = "public/airpublisher-logo.png"
    output_file = "public/airpublisher-logo-no-bg.png"
    
    if not Path(input_file).exists():
        print(f"❌ Error: {input_file} not found")
        sys.exit(1)
    
    # Try rembg first, fallback to PIL
    try:
        from rembg import remove
        remove_background_rembg(input_file, output_file)
        # Replace original
        Path(output_file).replace(input_file)
        print(f"✅ Original file replaced: {input_file}")
    except ImportError:
        try:
            from PIL import Image
            import numpy as np
            remove_background_pil(input_file, output_file)
            # Replace original
            Path(output_file).replace(input_file)
            print(f"✅ Original file replaced: {input_file}")
        except Exception as e:
            print(f"❌ Error: {e}")
            sys.exit(1)


