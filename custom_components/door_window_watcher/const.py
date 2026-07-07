DOMAIN = "door_window_watcher"
NAME = "Door Window Watcher"

CUSTOM_COMPONENTS = "custom_components"
INTEGRATION_FOLDER = DOMAIN

FRONTEND_COMPILED_FOLDER = "frontend_compiled"
FRONTEND_URL_BASE = "/dww_frontend"
CARD_FILENAME = "door-window-watcher-card.js"
CARD_URL = f"{FRONTEND_URL_BASE}/{CARD_FILENAME}"

PANEL_FOLDER = FRONTEND_COMPILED_FOLDER
PANEL_FILENAME = "door-window-watcher-panel.js"

PANEL_URL = "/api/panel_custom/dww"
PANEL_TITLE = NAME
PANEL_ICON = "mdi:window-open-variant"
PANEL_NAME = "door-window-watcher-panel"
