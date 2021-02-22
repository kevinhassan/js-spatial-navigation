interface IConfiguration {
    /**
     * Elements matching selector are regarded as navigable elements in SpatialNavigation.
     * However, hidden or disabled elements are ignored as they can not be focused in any way.
     */
    selector: Selector,

    /**
     * When it is true, only elements in the straight (vertical or horizontal) direction will be navigated.
     * i.e. SpatialNavigation ignores elements in the oblique directions.
     */
    straightOnly: boolean,

    /**
     * This threshold is used to determine whether an element is considered in the straight (vertical or horizontal) directions.
     * Valid number is between 0 to 1.0.
     * Setting it to 0.3 means that an element is counted in the straight directions only if it overlaps the straight area at least 0.3x of its total area.
     *
     * NB: - Number in the range [0, 1]
     */
    straightOverlapThreshold: number,

    /**
     * When it is true, the previously focused element will have higher priority to be chosen as the next candidate.
     */
    rememberSource: boolean,

    /**
     * When it is true, elements defined in this section are unnavigable. This property is modified by disable() and enable() as well.
     */
    disabled: boolean,

    /**
     * When a section is specified to be the next focused target, e.g. focus('some-section-id') is called, the first element matching defaultElement within this section will be chosen first.
     * NB: Selector (without @)
     */
    defaultElement: Selector,

    /**
     * If the focus comes from another section, you can define which element in this section should be focused first.
     * - 'last-focused': indicates the last focused element before we left this section last time.
     *    If this section has never been focused yet, the default element (if any) will be chosen next.
     * - 'default-element': indicates the element defined in defaultElement.
     * - '': implies following the original rule without any change.
     */
    enterTo?: EnterTo,

    /**
     * This property specifies which element should be focused next when a user presses the corresponding arrow key and intends to leave the current section.
     * It should be a PlainObject consists of four properties: 'left', 'right', 'up' and 'down'.
     * Each property should be a Selector.
     * Any of these properties can be omitted, and SpatialNavigation will follow the original rule to navigate.
     *
     * Note: Assigning an empty string to any of these properties makes SpatialNavigation go nowhere at that direction.
     */
    leaveFor?: LeaveForType,

    /**
     * - 'self-first' implies that elements within the same section will have higher priority to be chosen as the next candidate.
     * - 'self-only' implies that elements in the other sections will never be navigated by arrow keys. (However, you can always focus them by calling focus() manually.)
     * - 'none' implies no restriction.
     */
    restrict: RestrictType,

    /**
     * Elements matching tabIndexIgnoreList will never be affected by makeFocusable().
     * It is usually used to ignore elements that are already focusable.
     */
    tabIndexIgnoreList: string,

    /**
     * A callback function that accepts a DOM element as the first argument.
     *
     * SpatialNavigation calls this function every time when it tries to traverse every single candidate.
     * You can ignore arbitrary elements by returning false.
     */
    navigableFilter?: NavigableFilterCallback
}

type NavigableFilterCallback = ((htmlElement: HTMLElement, sectionId: string) => boolean);

enum EnterTo {
    lastFocused = 'last-focused',
    defaultElement = 'default-element'
}

enum RestrictType {
    selfFirst = 'self-first',
    selfOnly = 'self-only',
    none = 'none'
};

enum FiredEvents {
    willUnFocus = 'willunfocus',
    unFocused = 'unfocused',
    willFocus = 'willfocus',
    focused = 'focused',
    navigateFailed = 'navigatefailed',
    enterDown = 'enter-down',
    enterUp = 'enter-up',
    willMove = 'willmove'
}
enum Direction {
    up = 'up',
    down = 'down',
    left = 'left',
    right = 'right'
};

type LeaveForType = Record<Direction, Selector>

/**
 * String Type:
 * - a valid selector string for "querySelectorAll"
 * - '@sectionId' to indicate the specified section (e.g. '@test-section' indicates the section whose id is test-section.
 * - '@' to indicate the default section
 *
 * Note: Certain methods do not accept the @ syntax (including both @ and @<sectionId>)
 */
type Selector = String | NodeList | Element | Element[]

interface Priority {
    group: IExtendedDOMRect[]
    distance: ((rect: IExtendedDOMRect) => number)[]
}

interface IWillMoveProperties {
    direction: Direction,
    sectionId: String,
    cause: MovementCause
};

type MovementCause = 'api' | 'keydown';

interface ISections {
    disabled: boolean,
    selector: Selector,
    navigableFilter: NavigableFilterCallback,
    defaultElement: HTMLElement,
    lastFocusedElement: HTMLElement
}

interface ISpatialNavigation {
    /**
     * Initializes SpatialNavigation and binds event listeners to the global object.
     * It is a synchronous function, so you don't need to await ready state.
     * Calling init() more than once is possible since SpatialNavigation internally prevents it from reiterating the initialization.
     *
     * Note: It should be called before using any other methods of SpatialNavigation!
     */
    init(): void;

    /**
     * Uninitializes SpatialNavigation, resets the variable state and unbinds the event listeners
     */
    uninit(): void;

    /**
     * Resets the variable state without unbinding the event listeners
     */
    clear(): void;

    /**
     * Adds a section to SpatialNavigation with its own configuration. The config doesn't have to contain all the properties. Those omitted will inherit global ones automatically.
     * A section is a conceptual scope to define a set of elements no matter where they are in DOM structure. You can group elements based on their functions or behaviors (e.g. main, menu, dialog, etc.) into a section.
     * Giving a sectionId to a section enables you to refer to it in other methods but is not required. SpatialNavigation allows you to set it by config.id alternatively, yet it is not allowed in set().
     */
    add(sectionId?: string, config?: object): void;

    /**
     * Removes the section with the specified sectionId from SpatialNavigation.
     * Elements defined in this section will not be navigated anymore.
     */
    remove(sectionId: string): void;

    /**
     * Updates the config of the section with the specified sectionId.
     * If sectionId is omitted, the global configuration will be updated.
     * Omitted properties in config will not affect the original one, which was set by add(), so only properties that you want to update need to be listed.
     * In other words, if you want to delete any previously added properties, you have to explicitly assign undefined to those properties in the config.
     */
    set(sectionId: string, config: IConfiguration): void;
    set(config: IConfiguration): void;

    /**
     * Disables the section with the specified sectionId temporarily.
     * Elements defined in this section will become unnavigable until enable() is called.
     */
    disable(sectionId: string): void;

    /**
     * Enables the section with the specified sectionId.
     * Elements defined in this section, on which if disable() was called earlier, will become navigable again.
     */
    enable(sectionId: string): void;

    /**
     * Makes SpatialNavigation pause until resume() is called.
     * During its pause, SpatialNavigation stops to react to key events and will not trigger any custom events.
     */
    pause(): void;

    /**
     * Resumes SpatialNavigation, so it can react to key events and trigger events which paused because of pause().
     */
    resume(): void;

    /**
     * Focuses the section with the specified sectionId or the first element that matches selector.
     * If the first argument matches any of the existing sectionId, it will be regarded as a sectionId.
     * Otherwise, it will be treated as selector instead.
     * If omitted, the default section, which is set by setDefaultSection(), will be the substitution.
     * Setting silent to true lets you focus an element without triggering any custom events, but note that it does not stop native focus and blur events.
     */
    focus(selector?: Selector, silent?: boolean): void;

    /**
     * Moves the focus to the given direction based on the rule of SpatialNavigation.
     * The first element matching selector is regarded as the origin.
     * If selector is omitted, SpatialNavigation will move the focus based on the currently focused element.
     *
     * NB: - Selector (without @ syntax)
     */
    move(direction: Direction, selector?: Selector): void;

    /**
     * A helper to add tabindex="-1" to elements defined in the specified section to make them focusable.
     * If sectionId is omitted, it applies to all sections.
     * Note: It won't affect elements which have been focusable already or have not been appended to DOM tree yet.
     */
    makeFocusable(sectionId?: string): void;


    /**
     * Assigns the specified section to be the default section.
     * It will be used as a substitution in certain methods, of which if sectionId is omitted.
     * Calling this method without the argument can reset the default section to undefined.
     */
    setDefaultSection(sectionId?: string): void;
}

interface IExtendedDOMRect extends ClientRect {
    x: number,
    y: number,
    left: number,
    top: number,
    right: number,
    bottom: number,
    width: number,
    height: number,
    element: Element,
    center: {
        x: number,
        y: number,
        left: number,
        top: number,
        right: number,
        bottom: number
    }
}


const GLOBAL_CONFIG: IConfiguration = {
    selector: '',
    straightOnly: false,
    straightOverlapThreshold: 0.5,
    rememberSource: false,
    disabled: false,
    defaultElement: '',
    enterTo: undefined,
    leaveFor: undefined,
    restrict: RestrictType.selfFirst,
    tabIndexIgnoreList: 'a, input, select, textarea, button, iframe, [contentEditable=true]',
    navigableFilter: undefined,
};

const KEYMAPPING: Record<string, Direction> = {
    '37': Direction.left,
    '38': Direction.up,
    '39': Direction.right,
    '40': Direction.down
};
const REVERSE: Record<Direction, Direction> = {
    [Direction.left]: Direction.right,
    [Direction.up]: Direction.down,
    [Direction.right]: Direction.left,
    [Direction.down]: Direction.up
};
const EVENT_PREFIX = 'sn:';
const ID_POOL_PREFIX = 'section-';

(function () {
    'use strict';

    /********************/
    /* Private Variable */
    /********************/
    let _idPool = 0;
    let _ready = false;
    let _pause = false;
    let _sections: Record<string, ISections>;
    let _sectionCount = 0;
    let _defaultSectionId = '';
    let _lastSectionId = '';
    let _duringFocusChange = false;
    /************/
    /* Polyfill */
    /************/
    const elementMatchesSelector = Element.prototype.matches
        || (Element.prototype as any).matchesSelector
        || (Element.prototype as any).mozMatchesSelector
        || Element.prototype.webkitMatchesSelector
        || (Element.prototype as any).msMatchesSelector
        || (Element.prototype as any).oMatchesSelector
        || ((selector: Selector) => {
            const matchedNodes = (this.parentNode || this.document).querySelectorAll(selector);
            return [].slice.call(matchedNodes).indexOf(this) >= 0;
        });
    /*****************/
    /* Core Function */
    /*****************/
    function getRect(element: HTMLElement): IExtendedDOMRect {
        let { left, top, right, bottom, height, width } = element.getBoundingClientRect();
        const x = left + Math.floor(width / 2);
        const y = top + Math.floor(height / 2);

        const center = {
            x,
            y,
            left: x,
            right: x,
            top: y,
            bottom: y
        }
        return {
            x,
            y,
            left,
            top,
            right,
            bottom,
            width,
            height,
            element,
            center
        };
    }
    function partition(rects: IExtendedDOMRect[], targetRect: IExtendedDOMRect, straightOverlapThreshold: number) {
        const groups = [new Array<IExtendedDOMRect>(9)];
        for (let i = 0; i < rects.length; i++) {
            let rect = rects[i];
            let center = rect.center;
            let x, y, groupId;
            if (center.x < targetRect.left) {
                x = 0;
            }
            else if (center.x <= targetRect.right) {
                x = 1;
            }
            else {
                x = 2;
            }
            if (center.y < targetRect.top) {
                y = 0;
            }
            else if (center.y <= targetRect.bottom) {
                y = 1;
            }
            else {
                y = 2;
            }
            groupId = y * 3 + x;
            groups[groupId].push(rect);
            if ([0, 2, 6, 8].indexOf(groupId) !== -1) {
                let threshold = straightOverlapThreshold;
                if (rect.left <= targetRect.right - targetRect.width * threshold) {
                    if (groupId === 2) {
                        groups[1].push(rect);
                    }
                    else if (groupId === 8) {

                        groups[7].push(rect);
                    }
                }
                if (rect.right >= targetRect.left + targetRect.width * threshold) {
                    if (groupId === 0) {

                        groups[1].push(rect);
                    }
                    else if (groupId === 6) {

                        groups[7].push(rect);
                    }
                }
                if (rect.top <= targetRect.bottom - targetRect.height * threshold) {
                    if (groupId === 6) {

                        groups[3].push(rect);
                    }
                    else if (groupId === 8) {

                        groups[5].push(rect);
                    }
                }
                if (rect.bottom >= targetRect.top + targetRect.height * threshold) {
                    if (groupId === 0) {

                        groups[3].push(rect);
                    }
                    else if (groupId === 2) {

                        groups[5].push(rect);
                    }
                }
            }
        }
        return groups;
    }
    function generateDistanceFunction(targetRect: IExtendedDOMRect) {
        return {
            nearPlumbLineIsBetter: function (rect: IExtendedDOMRect) {
                let d;
                if (rect.center.x < targetRect.center.x) {
                    d = targetRect.center.x - rect.right;
                }
                else {
                    d = rect.left - targetRect.center.x;
                }
                return d < 0 ? 0 : d;
            },
            nearHorizonIsBetter: function (rect: IExtendedDOMRect) {
                let d;
                if (rect.center.y < targetRect.center.y) {
                    d = targetRect.center.y - rect.bottom;
                }
                else {
                    d = rect.top - targetRect.center.y;
                }
                return d < 0 ? 0 : d;
            },
            nearTargetLeftIsBetter: function (rect: IExtendedDOMRect) {
                let d;
                if (rect.center.x < targetRect.center.x) {
                    d = targetRect.left - rect.right;
                }
                else {
                    d = rect.left - targetRect.left;
                }
                return d < 0 ? 0 : d;
            },
            nearTargetTopIsBetter: function (rect: IExtendedDOMRect) {
                let d;
                if (rect.center.y < targetRect.center.y) {
                    d = targetRect.top - rect.bottom;
                }
                else {
                    d = rect.top - targetRect.top;
                }
                return d < 0 ? 0 : d;
            },
            topIsBetter: function (rect: IExtendedDOMRect) {
                return rect.top;
            },
            bottomIsBetter: function (rect: IExtendedDOMRect) {
                return -1 * rect.bottom;
            },
            leftIsBetter: function (rect: IExtendedDOMRect) {
                return rect.left;
            },
            rightIsBetter: function (rect: IExtendedDOMRect) {
                return -1 * rect.right;
            }
        };
    }
    function prioritize(priorities: Priority[]) {
        let destPriority = null;
        for (let i = 0; i < priorities.length; i++) {
            if (priorities[i].group.length) {
                destPriority = priorities[i];
                break;
            }
        }
        if (!destPriority) {
            return null;
        }
        let destDistance = destPriority.distance;
        destPriority.group.sort(function (a: IExtendedDOMRect, b: IExtendedDOMRect) {
            for (let i = 0; i < destDistance.length; i++) {
                let distance = destDistance[i];
                let delta = distance(a) - distance(b);
                if (delta) {
                    return delta;
                }
            }
            return 0;
        });
        return destPriority.group;
    }
    function navigate(target: any, direction: Direction, candidates: any, config: any) {
        if (!target || !direction || !candidates || !candidates.length) {
            return null;
        }
        let rects = [];
        for (let i = 0; i < candidates.length; i++) {
            let rect = getRect(candidates[i]);
            if (rect) {
                rects.push(rect);
            }
        }
        if (!rects.length) {
            return null;
        }
        let targetRect = getRect(target);
        if (!targetRect) {
            return null;
        }
        let distanceFunction = generateDistanceFunction(targetRect);
        let groups = partition(rects, targetRect, config.straightOverlapThreshold);
        let internalGroups = partition(groups[4], targetRect.center, config.straightOverlapThreshold);
        let priorities: Priority[];
        switch (direction) {
            case Direction.left:
                priorities = [
                    {
                        group: internalGroups[0].concat(internalGroups[3])
                            .concat(internalGroups[6]),
                        distance: [
                            distanceFunction.nearPlumbLineIsBetter,
                            distanceFunction.topIsBetter
                        ]
                    },
                    {
                        group: groups[3],
                        distance: [
                            distanceFunction.nearPlumbLineIsBetter,
                            distanceFunction.topIsBetter
                        ]
                    },
                    {
                        group: groups[0].concat(groups[6]),
                        distance: [
                            distanceFunction.nearHorizonIsBetter,
                            distanceFunction.rightIsBetter,
                            distanceFunction.nearTargetTopIsBetter
                        ]
                    }
                ];
                break;
            case Direction.right:
                priorities = [
                    {
                        group: internalGroups[2].concat(internalGroups[5])
                            .concat(internalGroups[8]),
                        distance: [
                            distanceFunction.nearPlumbLineIsBetter,
                            distanceFunction.topIsBetter
                        ]
                    },
                    {
                        group: groups[5],
                        distance: [
                            distanceFunction.nearPlumbLineIsBetter,
                            distanceFunction.topIsBetter
                        ]
                    },
                    {
                        group: groups[2].concat(groups[8]),
                        distance: [
                            distanceFunction.nearHorizonIsBetter,
                            distanceFunction.leftIsBetter,
                            distanceFunction.nearTargetTopIsBetter
                        ]
                    }
                ];
                break;
            case Direction.up:
                priorities = [
                    {
                        group: internalGroups[0].concat(internalGroups[1])
                            .concat(internalGroups[2]),
                        distance: [
                            distanceFunction.nearHorizonIsBetter,
                            distanceFunction.leftIsBetter
                        ]
                    },
                    {
                        group: groups[1],
                        distance: [
                            distanceFunction.nearHorizonIsBetter,
                            distanceFunction.leftIsBetter
                        ]
                    },
                    {
                        group: groups[0].concat(groups[2]),
                        distance: [
                            distanceFunction.nearPlumbLineIsBetter,
                            distanceFunction.bottomIsBetter,
                            distanceFunction.nearTargetLeftIsBetter
                        ]
                    }
                ];
                break;
            case Direction.down:
                priorities = [
                    {
                        group: internalGroups[6].concat(internalGroups[7])
                            .concat(internalGroups[8]),
                        distance: [
                            distanceFunction.nearHorizonIsBetter,
                            distanceFunction.leftIsBetter
                        ]
                    },
                    {
                        group: groups[7],
                        distance: [
                            distanceFunction.nearHorizonIsBetter,
                            distanceFunction.leftIsBetter
                        ]
                    },
                    {
                        group: groups[6].concat(groups[8]),
                        distance: [
                            distanceFunction.nearPlumbLineIsBetter,
                            distanceFunction.topIsBetter,
                            distanceFunction.nearTargetLeftIsBetter
                        ]
                    }
                ];
                break;
            default:
                return null;
        }
        if (config.straightOnly) {
            priorities.pop();
        }
        let destGroup = prioritize(priorities);
        if (!destGroup) {
            return null;
        }
        let dest = null;
        if (config.rememberSource &&
            config.previous &&
            config.previous.destination === target &&
            config.previous.reverse === direction) {
            for (let j = 0; j < destGroup.length; j++) {
                if (destGroup[j].element === config.previous.target) {
                    dest = destGroup[j].element;
                    break;
                }
            }
        }
        if (!dest) {
            dest = destGroup[0].element;
        }
        return dest;
    }
    /********************/
    /* Private Function */
    /********************/
    function generateId() {
        let id: string;
        while (true) {
            id = ID_POOL_PREFIX + String(++_idPool);

            if (!_sections[id]) {
                break;
            }
        }
        return id;
    }
    function parseSelector(selector: Selector): Selector[] {
        let result: Selector[];
        if (typeof selector === 'string') {
            result = [].slice.call(document.querySelectorAll(selector));
        }
        else if (typeof selector === 'object' && selector.length) {
            result = [].slice.call(selector);
        }
        else if (typeof selector === 'object' && selector.nodeType === 1) {
            result = [selector];
        }
        else {
            result = [];
        }
        return result;
    }
    function matchSelector(elem: HTMLElement, selector: Selector) {
        if (typeof selector === 'string') {
            return elementMatchesSelector.call(elem, selector);
        }
        else if (typeof selector === 'object' && selector.length) {
            return selector.indexOf(elem) >= 0;
        }
        else if (typeof selector === 'object' && selector.nodeType === 1) {
            return elem === selector;
        }
        return false;
    }
    function getCurrentFocusedElement() {
        let activeElement = document.activeElement;
        if (activeElement && activeElement !== document.body) {
            return activeElement;
        }
    }
    function extend(out?: Object, ...elements: Object[]) {
        out = out || {};
        for (let i = 1; i < elements.length; i++) {
            if (!elements[i]) {
                continue;
            }
            for (let key in elements[i]) {
                if (elements[i].hasOwnProperty(key) &&
                    elements[i][key] !== undefined) {
                    out[key] = elements[i][key];
                }
            }
        }
        return out;
    }
    function exclude(elemList: any, excludedElem: any) {
        if (!Array.isArray(excludedElem)) {
            excludedElem = [excludedElem];
        }
        for (let i = 0, index; i < excludedElem.length; i++) {
            index = elemList.indexOf(excludedElem[i]);
            if (index >= 0) {
                elemList.splice(index, 1);
            }
        }
        return elemList;
    }
    function isNavigable(elem?: HTMLElement, sectionId?: string, verifySectionSelector?: any) {
        if (!elem || !sectionId ||

            !_sections[sectionId] || _sections[sectionId].disabled) {
            return false;
        }
        if ((elem.offsetWidth <= 0 && elem.offsetHeight <= 0) ||
            elem.hasAttribute('disabled')) {
            return false;
        }
        if (verifySectionSelector &&

            !matchSelector(elem, _sections[sectionId].selector)) {
            return false;
        }

        if (typeof _sections[sectionId].navigableFilter === 'function') {

            if (_sections[sectionId].navigableFilter(elem, sectionId) === false) {
                return false;
            }
        }
        else if (typeof GLOBAL_CONFIG.navigableFilter === 'function') {

            if (GLOBAL_CONFIG.navigableFilter(elem, sectionId) === false) {
                return false;
            }
        }
        return true;
    }
    function getSectionId(elem: any) {
        for (let id in _sections) {

            if (!_sections[id].disabled &&

                matchSelector(elem, _sections[id].selector)) {
                return id;
            }
        }
    }
    function getSectionNavigableElements(sectionId: string) {

        return parseSelector(_sections[sectionId].selector).filter(function (elem: any) {

            return isNavigable(elem, sectionId);
        });
    }
    function getSectionDefaultElement(sectionId: string) {

        let defaultElement = _sections[sectionId].defaultElement;
        if (!defaultElement) {
            return null;
        }
        if (typeof defaultElement === 'string') {
            defaultElement = parseSelector(defaultElement)[0];
        }
        if (isNavigable(defaultElement, sectionId, true)) {
            return defaultElement;
        }
        return null;
    }
    function getSectionLastFocusedElement(sectionId: string) {

        let lastFocusedElement = _sections[sectionId].lastFocusedElement;
        if (!isNavigable(lastFocusedElement, sectionId, true)) {
            return null;
        }
        return lastFocusedElement;
    }
    function fireEvent(elem: any, type: FiredEvents, details?: any, cancelable: boolean = true) {
        let evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(EVENT_PREFIX + type, true, cancelable, details);
        return elem.dispatchEvent(evt);
    }
    function focusElement(elem: HTMLElement, sectionId?: string, direction?: any) {
        if (!elem) {
            return false;
        }
        let currentFocusedElement = getCurrentFocusedElement();
        let silentFocus = function () {
            if (currentFocusedElement) {
                (currentFocusedElement as any).blur();
            }
            elem.focus();
            focusChanged(elem, sectionId);
        };
        if (_duringFocusChange) {
            silentFocus();
            return true;
        }
        _duringFocusChange = true;
        if (_pause) {
            silentFocus();
            _duringFocusChange = false;
            return true;
        }
        if (currentFocusedElement) {
            let unfocusProperties = {
                nextElement: elem,
                nextSectionId: sectionId,
                direction: direction,
                native: false
            };

            if (!fireEvent(currentFocusedElement, FiredEvents.willUnFocus, unfocusProperties)) {
                _duringFocusChange = false;
                return false;
            }
            (currentFocusedElement as any).blur();
            fireEvent(currentFocusedElement, FiredEvents.unFocused, unfocusProperties, false);
        }
        let focusProperties = {
            previousElement: currentFocusedElement,
            sectionId: sectionId,
            direction: direction,
            native: false
        };

        if (!fireEvent(elem, FiredEvents.willFocus, focusProperties)) {
            _duringFocusChange = false;
            return false;
        }
        elem.focus();
        fireEvent(elem, FiredEvents.focused, focusProperties, false);
        _duringFocusChange = false;
        focusChanged(elem, sectionId);
        return true;
    }
    function focusChanged(elem: any, sectionId?: any) {
        if (!sectionId) {
            sectionId = getSectionId(elem);
        }
        if (sectionId) {

            _sections[sectionId].lastFocusedElement = elem;
            _lastSectionId = sectionId;
        }
    }
    function focusExtendedSelector(selector: Selector, direction?: Direction) {
        if (selector.charAt(0) == '@') {
            if (selector.length == 1) {

                return focusSection();
            }
            else {
                let sectionId = selector.substr(1);
                return focusSection(sectionId);
            }
        }
        else {
            let next = parseSelector(selector)[0];
            if (next) {
                let nextSectionId = getSectionId(next);

                if (isNavigable(next, nextSectionId)) {
                    return focusElement(next, nextSectionId, direction);
                }
            }
        }
        return false;
    }
    function focusSection(sectionId?: string) {
        let range: any = [];
        let addRange = function (id: any) {
            if (id && range.indexOf(id) < 0 &&

                _sections[id] && !_sections[id].disabled) {
                range.push(id);
            }
        };
        if (sectionId) {
            addRange(sectionId);
        }
        else {
            addRange(_defaultSectionId);
            addRange(_lastSectionId);
            Object.keys(_sections).map(addRange);
        }
        for (let i = 0; i < range.length; i++) {
            let id = range[i];
            let next;

            if (_sections[id].enterTo == EnterTo.lastFocused) {
                next = getSectionLastFocusedElement(id) ||
                    getSectionDefaultElement(id) ||
                    getSectionNavigableElements(id)[0];
            }
            else {
                next = getSectionDefaultElement(id) ||
                    getSectionLastFocusedElement(id) ||
                    getSectionNavigableElements(id)[0];
            }
            if (next) {

                return focusElement(next, id);
            }
        }
        return false;
    }
    function fireNavigatefailed(elem: HTMLElement, direction: Direction) {
        fireEvent(elem, FiredEvents.navigateFailed, {
            direction: direction
        }, false);
    }
    function gotoLeaveFor(sectionId: string, direction: Direction) {

        if (_sections[sectionId].leaveFor &&

            _sections[sectionId].leaveFor[direction] !== undefined) {

            let next = _sections[sectionId].leaveFor[direction];
            if (typeof next === 'string') {
                if (next === '') {
                    return null;
                }
                return focusExtendedSelector(next, direction);
            }
            let nextSectionId = getSectionId(next);

            if (isNavigable(next, nextSectionId)) {
                return focusElement(next, nextSectionId, direction);
            }
        }
        return false;
    }
    function focusNext(direction: Direction, currentFocusedElement: any, currentSectionId: any) {
        let extSelector = currentFocusedElement.getAttribute('data-sn-' + direction);
        if (typeof extSelector === 'string') {
            if (extSelector === '' ||
                !focusExtendedSelector(extSelector, direction)) {
                fireNavigatefailed(currentFocusedElement, direction);
                return false;
            }
            return true;
        }
        let sectionNavigableElements = {};
        let allNavigableElements: any = [];
        for (let id in _sections) {

            sectionNavigableElements[id] = getSectionNavigableElements(id);
            allNavigableElements =

                allNavigableElements.concat(sectionNavigableElements[id]);
        }

        let config = extend({}, GLOBAL_CONFIG, _sections[currentSectionId]);
        let next;
        if (config.restrict == 'self-only' || config.restrict == RestrictType.selfFirst) {

            let currentSectionNavigableElements = sectionNavigableElements[currentSectionId];
            next = navigate(currentFocusedElement, direction, exclude(currentSectionNavigableElements, currentFocusedElement), config);
            if (!next && config.restrict == RestrictType.selfFirst) {
                next = navigate(currentFocusedElement, direction, exclude(allNavigableElements, currentSectionNavigableElements), config);
            }
        }
        else {
            next = navigate(currentFocusedElement, direction, exclude(allNavigableElements, currentFocusedElement), config);
        }
        if (next) {

            _sections[currentSectionId].previous = {
                target: currentFocusedElement,
                destination: next,

                reverse: REVERSE[direction]
            };
            let nextSectionId = getSectionId(next);
            if (currentSectionId != nextSectionId) {
                let result = gotoLeaveFor(currentSectionId, direction);
                if (result) {
                    return true;
                }
                else if (result === null) {
                    fireNavigatefailed(currentFocusedElement, direction);
                    return false;
                }
                let enterToElement;

                switch (_sections[nextSectionId].enterTo) {
                    case EnterTo.lastFocused:
                        enterToElement = getSectionLastFocusedElement(nextSectionId) ||
                            getSectionDefaultElement(nextSectionId);
                        break;
                    case EnterTo.defaultElement:
                        enterToElement = getSectionDefaultElement(nextSectionId);
                        break;
                }
                if (enterToElement) {
                    next = enterToElement;
                }
            }
            return focusElement(next, nextSectionId, direction);
        }
        else if (gotoLeaveFor(currentSectionId, direction)) {
            return true;
        }
        fireNavigatefailed(currentFocusedElement, direction);
        return false;
    }
    function onKeyDown(evt: any) {
        if (!_sectionCount || _pause ||
            evt.altKey || evt.ctrlKey || evt.metaKey || evt.shiftKey) {
            return;
        }
        let currentFocusedElement;
        let preventDefault = function () {
            evt.preventDefault();
            evt.stopPropagation();
            return false;
        };

        let direction = KEYMAPPING[evt.keyCode];
        if (!direction) {
            if (evt.keyCode == 13) {
                currentFocusedElement = getCurrentFocusedElement();
                if (currentFocusedElement && getSectionId(currentFocusedElement)) {

                    if (!fireEvent(currentFocusedElement, FiredEvents.enterDown)) {
                        return preventDefault();
                    }
                }
            }
            return;
        }
        currentFocusedElement = getCurrentFocusedElement();
        if (!currentFocusedElement) {
            if (_lastSectionId) {
                currentFocusedElement = getSectionLastFocusedElement(_lastSectionId);
            }
            if (!currentFocusedElement) {

                focusSection();
                return preventDefault();
            }
        }
        let currentSectionId = getSectionId(currentFocusedElement);
        if (!currentSectionId) {
            return;
        }
        let willmoveProperties = {
            direction: direction,
            sectionId: currentSectionId,
            cause: 'keydown'
        };

        if (fireEvent(currentFocusedElement, FiredEvents.willMove, willmoveProperties)) {
            focusNext(direction, currentFocusedElement, currentSectionId);
        }
        return preventDefault();
    }
    function onKeyUp(evt: any) {
        if (evt.altKey || evt.ctrlKey || evt.metaKey || evt.shiftKey) {
            return;
        }
        if (!_pause && _sectionCount && evt.keyCode == 13) {
            let currentFocusedElement = getCurrentFocusedElement();
            if (currentFocusedElement && getSectionId(currentFocusedElement)) {

                if (!fireEvent(currentFocusedElement, FiredEvents.enterUp)) {
                    evt.preventDefault();
                    evt.stopPropagation();
                }
            }
        }
    }
    function onFocus(evt: any) {
        let target = evt.target;
        if (target !== window && target !== document &&
            _sectionCount && !_duringFocusChange) {
            let sectionId = getSectionId(target);
            if (sectionId) {
                if (_pause) {
                    focusChanged(target, sectionId);
                    return;
                }
                let focusProperties = {
                    sectionId: sectionId,
                    native: true
                };

                if (!fireEvent(target, FiredEvents.willFocus, focusProperties)) {
                    _duringFocusChange = true;
                    target.blur();
                    _duringFocusChange = false;
                }
                else {
                    fireEvent(target, FiredEvents.focused, focusProperties, false);
                    focusChanged(target, sectionId);
                }
            }
        }
    }
    function onBlur(evt: any) {
        let target = evt.target;
        if (target !== window && target !== document && !_pause &&
            _sectionCount && !_duringFocusChange && getSectionId(target)) {
            let unfocusProperties = {
                native: true
            };

            if (!fireEvent(target, FiredEvents.willUnFocus, unfocusProperties)) {
                _duringFocusChange = true;
                setTimeout(function () {
                    target.focus();
                    _duringFocusChange = false;
                });
            }
            else {
                fireEvent(target, FiredEvents.unFocused, unfocusProperties, false);
            }
        }
    }
    /*******************/
    /* Public Function */
    /*******************/
    const spatialNavigation: ISpatialNavigation = {
        init: function () {
            if (!_ready) {
                window.addEventListener('keydown', onKeyDown);
                window.addEventListener('keyup', onKeyUp);
                window.addEventListener('focus', onFocus, true);
                window.addEventListener('blur', onBlur, true);
                _ready = true;
            }
        },
        uninit: function () {
            window.removeEventListener('blur', onBlur, true);
            window.removeEventListener('focus', onFocus, true);
            window.removeEventListener('keyup', onKeyUp);
            window.removeEventListener('keydown', onKeyDown);
            spatialNavigation.clear();
            _idPool = 0;
            _ready = false;
        },
        clear: function () {
            _sections = {};
            _sectionCount = 0;
            _defaultSectionId = '';
            _lastSectionId = '';
            _duringFocusChange = false;
        },
        // set(<config>);
        // set(<sectionId>, <config>);
        set: function () {
            let sectionId, config;
            if (typeof arguments[0] === 'object') {
                config = arguments[0];
            }
            else if (typeof arguments[0] === 'string' &&
                typeof arguments[1] === 'object') {
                sectionId = arguments[0];
                config = arguments[1];

                if (!_sections[sectionId]) {
                    throw new Error('Section "' + sectionId + '" doesn\'t exist!');
                }
            }
            else {
                return;
            }
            for (let key in config) {

                if (GLOBAL_CONFIG[key] !== undefined) {
                    if (sectionId) {

                        _sections[sectionId][key] = config[key];
                    }
                    else if (config[key] !== undefined) {

                        GLOBAL_CONFIG[key] = config[key];
                    }
                }
            }
            if (sectionId) {
                // remove "undefined" items

                _sections[sectionId] = extend({}, _sections[sectionId]);
            }
        },
        // add(<config>);
        // add(<sectionId>, <config>);
        add: function () {
            let sectionId;
            let config = {};
            if (typeof arguments[0] === 'object') {
                config = arguments[0];
            }
            else if (typeof arguments[0] === 'string' &&
                typeof arguments[1] === 'object') {
                sectionId = arguments[0];
                config = arguments[1];
            }
            if (!sectionId) {
                sectionId = (typeof (config as any).id === 'string') ? (config as any).id : generateId();
            }

            if (_sections[sectionId]) {
                throw new Error('Section "' + sectionId + '" has already existed!');
            }

            _sections[sectionId] = {};
            _sectionCount++;

            spatialNavigation.set(sectionId, config);
            return sectionId;
        },
        remove: function (sectionId: string) {
            if (!sectionId || typeof sectionId !== 'string') {
                throw new Error('Please assign the "sectionId"!');
            }

            if (_sections[sectionId]) {

                _sections[sectionId] = undefined;

                _sections = extend({}, _sections);
                _sectionCount--;
                if (_lastSectionId === sectionId) {
                    _lastSectionId = '';
                }
                return true;
            }
            return false;
        },
        disable: function (sectionId: string) {

            if (_sections[sectionId]) {

                _sections[sectionId].disabled = true;
                return true;
            }
            return false;
        },
        enable: function (sectionId: string) {

            if (_sections[sectionId]) {

                _sections[sectionId].disabled = false;
                return true;
            }
            return false;
        },
        pause: function () {
            _pause = true;
        },
        resume: function () {
            _pause = false;
        },
        // focus([silent])
        // focus(<sectionId>, [silent])
        // focus(<extSelector>, [silent])
        // Note: "silent" is optional and default to false
        focus: function (elem?: HTMLElement, silent?: boolean) {
            let result = false;
            if (silent === undefined && typeof elem === 'boolean') {
                silent = elem;
                elem = undefined;
            }
            let autoPause = !_pause && silent;
            if (autoPause) {
                spatialNavigation.pause();
            }
            if (!elem) {

                result = focusSection();
            }
            else {
                if (typeof elem === 'string') {

                    if (_sections[elem]) {
                        result = focusSection(elem);
                    }
                    else {

                        result = focusExtendedSelector(elem);
                    }
                }
                else {
                    let nextSectionId = getSectionId(elem);

                    if (isNavigable(elem, nextSectionId)) {

                        result = focusElement(elem, nextSectionId);
                    }
                }
            }
            if (autoPause) {
                spatialNavigation.resume();
            }
            return result;
        },
        // move(<direction>)
        // move(<direction>, <selector>)
        move: function (direction: Direction, selector: Selector) {
            if (!REVERSE[direction]) {
                return false;
            }
            let elem = selector ?
                parseSelector(selector)[0] : getCurrentFocusedElement();
            if (!elem) {
                return false;
            }
            let sectionId = getSectionId(elem);
            if (!sectionId) {
                return false;
            }
            let willmoveProperties: IWillMoveProperties = {
                direction: direction,
                sectionId: sectionId,
                cause: 'api'
            };

            if (!fireEvent(elem, FiredEvents.willMove, willmoveProperties)) {
                return false;
            }
            return focusNext(direction, elem, sectionId);
        },
        // makeFocusable()
        // makeFocusable(<sectionId>)
        makeFocusable: function (sectionId: string) {
            let doMakeFocusable = function (section: any) {
                let tabIndexIgnoreList = section.tabIndexIgnoreList !== undefined ?
                    section.tabIndexIgnoreList : GLOBAL_CONFIG.tabIndexIgnoreList;
                parseSelector(section.selector).forEach(function (elem: any) {
                    if (!matchSelector(elem, tabIndexIgnoreList)) {
                        if (!elem.getAttribute('tabindex')) {
                            elem.setAttribute('tabindex', '-1');
                        }
                    }
                });
            };
            if (sectionId) {

                if (_sections[sectionId]) {

                    doMakeFocusable(_sections[sectionId]);
                }
                else {
                    throw new Error('Section "' + sectionId + '" doesn\'t exist!');
                }
            }
            else {
                for (let id in _sections) {

                    doMakeFocusable(_sections[id]);
                }
            }
        },
        setDefaultSection: function (sectionId: string) {
            if (!sectionId) {
                _defaultSectionId = '';
            }

            else if (!_sections[sectionId]) {
                throw new Error('Section "' + sectionId + '" doesn\'t exist!');
            }
            else {
                _defaultSectionId = sectionId;
            }
        }
    };
    (window as any).SpatialNavigation = spatialNavigation;
    /**********************/
    /* CommonJS Interface */
    /**********************/

    if (typeof module === 'object') {

        module.exports = spatialNavigation;
    }
})();
