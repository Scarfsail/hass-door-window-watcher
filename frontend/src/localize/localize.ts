import * as cs from './translations/cs.json';
import type { HomeAssistant } from '../../hass-frontend/src/types';

const languages: Record<string, any> = {
    cs: cs,
};

export type LocalizeFunction = (key: string, values?: Record<string, string | number>) => string;

export function getLocalizeFunction(hass: HomeAssistant): LocalizeFunction {
    const lang = getLanguage(hass?.language || 'cs');
    return (string: string, values?: Record<string, string | number>) => localize(string, lang, values);
}

function localize(
    string: string,
    language: string = 'cs',
    values?: Record<string, string | number>,
): string {
    const selectedLanguage = language.replace(/['"]+/g, '').replace('_', '-');
    let translated: string;

    try {
        translated = string.split('.').reduce((o, i) => o[i], languages[selectedLanguage]);
    } catch (e) {
        try {
            translated = string.split('.').reduce((o, i) => o[i], languages['cs']);
        } catch (e) {
            translated = string;
        }
    }

    if (translated === undefined) {
        try {
            translated = string.split('.').reduce((o, i) => o[i], languages['cs']);
        } catch (e) {
            translated = string;
        }
    }

    // Replace placeholders if values are provided
    if (values && typeof translated === 'string') {
        Object.keys(values).forEach(key => {
            translated = translated.replace(`{${key}}`, String(values[key]));
        });
    }

    return translated;
}

export function getLanguage(language?: string): string {
    return language ? language.substring(0, 2) : 'cs';
}
