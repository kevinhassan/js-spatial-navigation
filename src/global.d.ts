interface Element {
    matchesSelector(selectors: string): boolean;
    mozMatchesSelector(selectors: string): boolean;
    msMatchesSelector(selectors: string): boolean;
    oMatchesSelector(selectors: string): boolean;
}
