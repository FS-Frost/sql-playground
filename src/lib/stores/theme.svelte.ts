import { browser } from "$app/environment";

const KEY = "sqlpg:theme";

function createThemeStore() {
    let _theme = $state<"dark" | "light">("dark");

    function init() {
        if (!browser) return;
        const saved = localStorage.getItem(KEY) as "dark" | "light" | null;
        _theme = saved ?? "dark";
        document.documentElement.dataset.theme = _theme;
    }

    function set(t: "dark" | "light") {
        _theme = t;
        if (browser) {
            document.documentElement.dataset.theme = t;
            localStorage.setItem(KEY, t);
        }
    }

    function toggle() {
        set(_theme === "dark" ? "light" : "dark");
    }

    return {
        get theme() {
            return _theme;
        },
        get monacoTheme() {
            return _theme === "dark" ? "vs-dark" : "vs";
        },
        init,
        set,
        toggle,
    };
}

export const themeStore = createThemeStore();
