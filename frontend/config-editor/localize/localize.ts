import * as cs from './translations/cs.json';
import * as en from './translations/en.json';
import type { HomeAssistant } from '../types';

const languages: Record<string, any> = {
    cs: cs,
    en: en,
};

export type LocalizeFunction = (key: string, values?: Record<string, string | number>) => string;

export function getLocalizeFunction(hass: HomeAssistant): LocalizeFunction {
    const lang = getLanguage(hass?.language);
    return (string: string, values?: Record<string, string | number>) => localize(string, lang, values);
}

function lookup(string: string, language: string): string | undefined {
    try {
        return string.split('.').reduce((o, i) => o[i], languages[language]);
    } catch (e) {
        return undefined;
    }
}

function localize(
    string: string,
    language: string,
    values?: Record<string, string | number>,
): string {
    let translated = lookup(string, language) ?? lookup(string, 'en') ?? string;

    // Replace placeholders if values are provided
    if (values) {
        Object.keys(values).forEach(key => {
            translated = translated.replace(`{${key}}`, String(values[key]));
        });
    }

    return translated;
}

/** Czech when HA runs in Czech, English for every other language. */
export function getLanguage(language?: string): string {
    return language?.substring(0, 2) === 'cs' ? 'cs' : 'en';
}
