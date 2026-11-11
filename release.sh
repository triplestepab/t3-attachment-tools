#!/usr/bin/env bash
set -euo pipefail

if [[ $(git branch --show-current) != main ]]; then
    printf '%s\n' "Run ./release.sh from main." >&2
    exit 1
fi

version=$(jq -r '.version | split(".") | .[-1] |= (tonumber + 1 | tostring) | join(".")' manifest.json)

update_version() {
    local file=$1 filter=$2 updated
    updated=$(jq --indent 4 --arg version "$version" "$filter" "$file")
    printf '%s\n' "$updated" > "$file"
}

update_version manifest.json '.version = $version'
update_version package.json '.version = $version'
update_version package-lock.json '.version = $version | .packages[""].version = $version'

git commit -m "Release $version" -- manifest.json package.json package-lock.json
git push --no-follow-tags origin main
git tag "$version"
git push --no-follow-tags origin "refs/tags/$version"
