import logging
import os

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import StaticPathConfig

from .const import (
    CUSTOM_COMPONENTS,
    DOMAIN,
    INTEGRATION_FOLDER,
    PANEL_FILENAME,
    PANEL_FOLDER,
    PANEL_ICON,
    PANEL_NAME,
    PANEL_TITLE,
    PANEL_URL,
)

_LOGGER = logging.getLogger(__name__)


async def async_register_panel(hass):
    root_dir = os.path.join(hass.config.path(CUSTOM_COMPONENTS), INTEGRATION_FOLDER)
    panel_dir = os.path.join(root_dir, PANEL_FOLDER)
    file_name = PANEL_FILENAME.replace("{env}", "dev" if hass.config.debug else "prod")
    view_url = os.path.join(panel_dir, file_name)

    await hass.http.async_register_static_paths(
        [StaticPathConfig(PANEL_URL, view_url, cache_headers=False)]
    )

    await panel_custom.async_register_panel(
        hass,
        webcomponent_name=PANEL_NAME,
        frontend_url_path=DOMAIN,
        module_url=PANEL_URL,
        sidebar_title=PANEL_TITLE,
        sidebar_icon=PANEL_ICON,
        require_admin=True,
        config={},
        config_panel_domain=DOMAIN,
    )


def async_unregister_panel(hass):
    frontend.async_remove_panel(hass, DOMAIN)
    _LOGGER.debug("Removing panel")
