#!/bin/bash

# Path to the JSON file
json_file="unimported.json"

# Check if the JSON file exists
if [ ! -f "$json_file" ]; then
    echo "❌ JSON file not found: $json_file"
    exit 1
fi

# Read and clean each line manually
# Strip brackets, quotes, commas
grep -o '".*"' "$json_file" | sed 's/[",]//g' | while read -r raw_path; do
    # Convert Windows-style backslashes to Unix-style slashes (if needed)
    path="${raw_path//\\//}"

    # Optional: convert D:/path to /d/path for WSL (only if using WSL)
    # path=$(echo "$path" | sed 's|^\([A-Za-z]\):|/\L\1|')

    if [ -f "$path" ]; then
        echo "🗑️ Deleting: $path"
        rm "$path"
    else
        echo "⚠️ File not found: $path"
    fi
done
