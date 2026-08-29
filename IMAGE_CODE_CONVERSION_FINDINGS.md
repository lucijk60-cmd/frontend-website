# Logo and Hero Code Conversion Findings

The requested logo is a 640×640 WebP raster asset containing detailed car, PPF film, metallic lettering, highlights, and several small text labels. Recreating it as hand-authored SVG paths would not preserve the photographic detail and would be a new approximation rather than a faithful conversion.

The English hero asset is a 2560×1440 WebP photograph of a black vehicle being wrapped with PPF. It contains complex lighting, reflections, skin, fabric, transparent film, and vehicle detail. It is not a practical vector/SVG candidate. The optimized WebP is approximately 156.5 KB and should remain an external storage asset for fidelity and deployment safety.

Safe implementation decision: keep the two raster visuals as optimized WebP storage references, and create code-based SVG only for simple brand marks or decorative shapes if needed. Embedding either detailed visual as Base64 would move binary bytes into the JavaScript bundle and increase the initial payload; it would not make loading faster. Any experiment must remain reversible and must not place large binaries inside the project source.
