import { browser } from "$app/environment";
import { getStoredBool, getStoredNumber, getStoredString } from "$lib/storage";

const K_FONT_SIZE = "sqlpg:ui:editorFontSize";
const K_FONT_FAMILY = "sqlpg:ui:editorFontFamily";
const K_TAB_SIZE = "sqlpg:ui:editorTabSize";
const K_WORD_WRAP = "sqlpg:ui:editorWordWrap";
const K_LINE_NUMBERS = "sqlpg:ui:editorLineNumbers";
const K_MINIMAP = "sqlpg:ui:editorMinimap";
const K_KEYWORD_CASE = "sqlpg:ui:formatKeywordCase";
const K_FORMAT_TAB_WIDTH = "sqlpg:ui:formatTabWidth";
const K_DEFAULT_LIMIT = "sqlpg:ui:defaultQueryLimit";
const K_TABLE_DENSITY = "sqlpg:ui:tableDensity";
const K_NULL_TEXT = "sqlpg:ui:nullDisplayText";
const K_CELL_MAX_WIDTH = "sqlpg:ui:cellMaxWidth";
const K_CSV_DELIMITER = "sqlpg:ui:csvDelimiter";

type KeywordCase = "upper" | "lower" | "preserve";
type Density = "compact" | "normal" | "comfortable";

function createUiSettings() {
    let _editorFontSize = $state(getStoredNumber(K_FONT_SIZE, 14));
    let _editorFontFamily = $state(
        getStoredString(K_FONT_FAMILY, "'Cascadia Code', 'Fira Code', 'Consolas', monospace"),
    );
    let _editorTabSize = $state(getStoredNumber(K_TAB_SIZE, 4));
    let _editorWordWrap = $state(getStoredBool(K_WORD_WRAP, true));
    let _editorLineNumbers = $state(getStoredBool(K_LINE_NUMBERS, true));
    let _editorMinimap = $state(getStoredBool(K_MINIMAP, false));
    let _formatKeywordCase = $state(getStoredString(K_KEYWORD_CASE, "upper") as KeywordCase);
    let _formatTabWidth = $state(getStoredNumber(K_FORMAT_TAB_WIDTH, 4));
    let _defaultQueryLimit = $state(getStoredNumber(K_DEFAULT_LIMIT, 1000));
    let _tableDensity = $state(getStoredString(K_TABLE_DENSITY, "normal") as Density);
    let _nullDisplayText = $state(getStoredString(K_NULL_TEXT, "NULL"));
    let _cellMaxWidth = $state(getStoredNumber(K_CELL_MAX_WIDTH, 300));
    let _csvDelimiter = $state(getStoredString(K_CSV_DELIMITER, ","));

    return {
        get editorFontSize() {
            return _editorFontSize;
        },
        set editorFontSize(v: number) {
            _editorFontSize = v;
            if (browser) localStorage.setItem(K_FONT_SIZE, String(v));
        },
        get editorFontFamily() {
            return _editorFontFamily;
        },
        set editorFontFamily(v: string) {
            _editorFontFamily = v;
            if (browser) localStorage.setItem(K_FONT_FAMILY, v);
        },
        get editorTabSize() {
            return _editorTabSize;
        },
        set editorTabSize(v: number) {
            _editorTabSize = v;
            if (browser) localStorage.setItem(K_TAB_SIZE, String(v));
        },
        get editorWordWrap() {
            return _editorWordWrap;
        },
        set editorWordWrap(v: boolean) {
            _editorWordWrap = v;
            if (browser) localStorage.setItem(K_WORD_WRAP, String(v));
        },
        get editorLineNumbers() {
            return _editorLineNumbers;
        },
        set editorLineNumbers(v: boolean) {
            _editorLineNumbers = v;
            if (browser) localStorage.setItem(K_LINE_NUMBERS, String(v));
        },
        get editorMinimap() {
            return _editorMinimap;
        },
        set editorMinimap(v: boolean) {
            _editorMinimap = v;
            if (browser) localStorage.setItem(K_MINIMAP, String(v));
        },
        get formatKeywordCase() {
            return _formatKeywordCase;
        },
        set formatKeywordCase(v: KeywordCase) {
            _formatKeywordCase = v;
            if (browser) localStorage.setItem(K_KEYWORD_CASE, v);
        },
        get formatTabWidth() {
            return _formatTabWidth;
        },
        set formatTabWidth(v: number) {
            _formatTabWidth = v;
            if (browser) localStorage.setItem(K_FORMAT_TAB_WIDTH, String(v));
        },
        get defaultQueryLimit() {
            return _defaultQueryLimit;
        },
        set defaultQueryLimit(v: number) {
            _defaultQueryLimit = v;
            if (browser) localStorage.setItem(K_DEFAULT_LIMIT, String(v));
        },
        get tableDensity() {
            return _tableDensity;
        },
        set tableDensity(v: Density) {
            _tableDensity = v;
            if (browser) localStorage.setItem(K_TABLE_DENSITY, v);
        },
        get nullDisplayText() {
            return _nullDisplayText;
        },
        set nullDisplayText(v: string) {
            _nullDisplayText = v;
            if (browser) localStorage.setItem(K_NULL_TEXT, v);
        },
        get cellMaxWidth() {
            return _cellMaxWidth;
        },
        set cellMaxWidth(v: number) {
            _cellMaxWidth = v;
            if (browser) localStorage.setItem(K_CELL_MAX_WIDTH, String(v));
        },
        get csvDelimiter() {
            return _csvDelimiter;
        },
        set csvDelimiter(v: string) {
            _csvDelimiter = v;
            if (browser) localStorage.setItem(K_CSV_DELIMITER, v);
        },
    };
}

export const uiSettings = createUiSettings();
