import { writable } from 'svelte/store';
import type { Theme } from './gui/theme';

export const storeTheme = writable<Theme>("Dark");
