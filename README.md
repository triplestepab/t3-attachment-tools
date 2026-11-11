# Attachment Tools (Obsidian plugin)

## Build

- `npm install`
- `npm run build`
- `npm run watch`

## Dev

Simplest is:

- Place this repo inside the `.obsidian/plugins/pluginname` folder
- Inside Obsidian
  - Install the hot reload plugin <https://github.com/shabegom/obsidian-hot-reload-mobile> to get     autoreload
  - Enable both in settings
- Run `npm run dev`
- See the top right notification inside Obsidian that the change was detected

Also, show the developer console inside obsidian to view `console.log` output

Ps. Obsidian loads the compiled `main.js` from this folder.
