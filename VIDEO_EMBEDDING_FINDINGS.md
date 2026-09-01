# Video Embedding Findings

The owner-provided `44749.mp4` was converted without changing its visual content to a browser-compatible H.264/AAC MP4. The source is a 20.805-second vertical 1080×1920 video using HEVC video and AAC audio at 19,723,046 bytes. The browser-compatible output is 9,823,716 bytes and is embedded as a `data:video/mp4;base64,...` source.

The embedded Base64 module is approximately 13 MB of source text. The production JavaScript bundle increased to approximately 18.2 MB uncompressed and 13.4 MB gzip. This satisfies the requested code-only loading path for the uploaded video, but it is not the recommended performance configuration for mobile users. The remaining three video cards still use their existing fallback source because no corresponding video binaries were supplied.

`44749.mp4` is assigned to the first `PPF Installation` video slot. Its poster remains the existing embedded installation image. The original upload is not committed to the repository; only the deterministic generated data module and source mapping are tracked.
