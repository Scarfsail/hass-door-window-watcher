import logging
import os

from homeassistant.components.http import StaticPathConfig
from homeassistant.loader import async_get_integration

from .const import (
    CARD_URL,
    CUSTOM_COMPONENTS,
    DOMAIN,
    FRONTEND_COMPILED_FOLDER,
    FRONTEND_URL_BASE,
    INTEGRATION_FOLDER,
)

_LOGGER = logging.getLogger(__name__)


async def async_register_frontend(hass):
    root_dir = os.path.join(hass.config.path(CUSTOM_COMPONENTS), INTEGRATION_FOLDER)
    compiled_dir = os.path.join(root_dir, FRONTEND_COMPILED_FOLDER)

    await hass.http.async_register_static_paths(
        [StaticPathConfig(FRONTEND_URL_BASE, compiled_dir, cache_headers=False)]
    )

    await _async_register_card_resource(hass)


def _get_storage_resources(hass):
    lovelace = hass.data.get("lovelace")
    resources = getattr(lovelace, "resources", None)
    if resources is None or not hasattr(resources, "async_create_item"):
        return None  # YAML-mode dashboards: no storage collection, skip silently
    return resources


async def _async_register_card_resource(hass):
    resources = _get_storage_resources(hass)
    if resources is None:
        return

    integration = await async_get_integration(hass, DOMAIN)
    versioned_url = f"{CARD_URL}?v={integration.version}"

    await resources.async_get_info()  # forces lazy load — async_items() is empty until this runs
    existing = next(
        (item for item in resources.async_items() if item["url"].startswith(CARD_URL)),
        None,
    )
    if existing is not None:
        if existing["url"] != versioned_url:
            await resources.async_update_item(existing["id"], {"url": versioned_url})
        hass.data[DOMAIN]["_card_resource_id"] = existing["id"]
    else:
        created = await resources.async_create_item(
            {"res_type": "module", "url": versioned_url}
        )
        hass.data[DOMAIN]["_card_resource_id"] = created["id"]


async def async_unregister_card_resource(hass):
    resources = _get_storage_resources(hass)
    if resources is None:
        return

    resource_id = hass.data.get(DOMAIN, {}).get("_card_resource_id")
    if resource_id is None:
        return

    try:
        await resources.async_delete_item(resource_id)
    except Exception:  # best-effort cleanup
        _LOGGER.debug("Failed to remove card Lovelace resource", exc_info=True)
