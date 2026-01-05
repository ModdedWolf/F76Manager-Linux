#!/bin/bash

# Fallout 76 Manager Linux - v1.0.0 Global Release
# Place this file in the root folder of the extracted manager (next to main.mjs, www/, managers/, etc.)

set -e  # Exit on any error

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "Launcher directory: $DIR"

# Possible binary names (from electron-builder output)
BINARY_NAMES=(
    "fallout-76-manager-linux"
    "Fallout 76 Manager"
    "f76manager"
    "Fallout76Manager"  # fallback variations
)

# Possible locations to search (current dir, parent, unpacked build dirs)
SEARCH_DIRS=(
    "$DIR"
    "$DIR/.."
    "$DIR/linux-unpacked"
    "$DIR/resources/app"          # if running from ASAR
    "$DIR/dist"                    # custom build output
)

FOUND_BINARY=""

echo "Searching for the manager executable..."

for location in "${SEARCH_DIRS[@]}"; do
    if [[ -d "$location" ]]; then
        for name in "${BINARY_NAMES[@]}"; do
            candidate="$location/$name"
            if [[ -x "$candidate" ]] || [[ -f "$candidate" ]]; then
                FOUND_BINARY="$candidate"
                echo "Found executable: $FOUND_BINARY"
                break 2
            fi
        done
    fi
done

# Fallback: try running via Electron directly (development/source mode)
if [[ -z "$FOUND_BINARY" ]] && [[ -f "$DIR/package.json" ]] && [[ -f "$DIR/main.mjs" ]]; then
    if command -v electron >/dev/null 2>&1; then
        echo "No binary found, but package.json detected → running in development mode with electron"
        cd "$DIR"
        exec electron . "$@"
    elif command -v npm >/dev/null 2>&1; then
        echo "No binary found → attempting npm start"
        cd "$DIR"
        exec npm start -- "$@"
    else
        echo "Error: Neither electron nor npm is available for source execution."
        exit 1
    fi
fi

# Final fallback if still nothing found
if [[ -z "$FOUND_BINARY" ]]; then
    echo "Error: Could not find the Fallout 76 Manager executable."
    echo "Make sure you extracted the full archive and that launch.sh is in the correct folder."
    echo "Expected structure: launch.sh, main.mjs, www/, managers/, package.json, etc."
    exit 1
fi

# Ensure executable permission
chmod +x "$FOUND_BINARY" 2>/dev/null || true

# Environment fixes for Bazzite / Fedora / Wayland / Gamescope
export ELECTRON_OZONE_PLATFORM_HINT=auto        # Prefer Wayland, fall back to X11
export ELECTRON_ENABLE_LOGGING=0                # Reduce console spam (optional)
export GDK_BACKEND=wayland                      # Force Wayland when possible

# Launch with recommended flags for modern Fedora kernels and gaming mode
echo "Launching Fallout 76 Manager..."
exec "$FOUND_BINARY" \
    --no-sandbox \
    --disable-gpu-sandbox \
    --enable-features=UseOzonePlatform,WaylandWindowDecorations \
    --ozone-platform-hint=auto \
    "$@"
