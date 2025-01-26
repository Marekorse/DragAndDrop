"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 *
 * Auto scroller.
 *
 * Extension that ensures smooth scrolling of the screen and elements while dragging the element.
 *
 */
class AutoScroller {
    /**
     * Constructor
     *
     * @param speed
     * @param threshold
     */
    constructor(speed = 100, threshold = 50) {
        this.scrollToPositionThreshold = threshold;
        this.scrollSpeed = speed;
        this.startTime = null;
        this.scrollAnimationState = null;
        this.scrollDirection = null;
        this.scrollAxis = null;
        this.scrollableElement = null;
    }
    /**
     * Check if auto-scrolling is required based on the current position and thresholds,
     * and trigger the auto-scroller if necessary.
     *
     * @param x
     * @param y
     */
    shouldEnableAutoScroller(x, y) {
        const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
        const el = document.elementFromPoint(x, y);
        if (el) {
            const elRect = el.getBoundingClientRect();
            if (x > vw - this.scrollToPositionThreshold || x - elRect.x > elRect.width - this.scrollToPositionThreshold) { // X axis →
                this.handleScroll('x', 'f', el, x > vw - this.scrollToPositionThreshold);
            }
            else if (x < this.scrollToPositionThreshold || x - elRect.x < this.scrollToPositionThreshold) { // X axis ←
                this.handleScroll('x', 'b', el, x < this.scrollToPositionThreshold);
            }
            else if (y < this.scrollToPositionThreshold || y - elRect.y < this.scrollToPositionThreshold) { // Y axis  ↑
                this.handleScroll('y', 'b', el, y < this.scrollToPositionThreshold);
            }
            else if (y > vh - this.scrollToPositionThreshold || y - elRect.y > elRect.height - this.scrollToPositionThreshold) { // Y axis ↓
                this.handleScroll('y', 'f', el, y > vh - this.scrollToPositionThreshold);
            }
            else {
                this.stopScroller();
            }
        }
    }
    handleScroll(axis, direction, currentEl, SetDocScrollingElAsFallback) {
        var _a;
        if (!this.scrollableElement || this.scrollerAxisAndDirectionResetRequired(axis, direction)) {
            this.setupScrollerAxisAndDirection(axis, direction);
            this.scrollableElement = SetDocScrollingElAsFallback
                ? ((_a = this.getFirstScrollableElementOnAxis(axis, direction, currentEl)) !== null && _a !== void 0 ? _a : document.scrollingElement)
                : this.getFirstScrollableElementOnAxis(axis, direction, currentEl);
            if (this.scrollableElement) {
                this.startScroller();
            }
        }
    }
    getFirstScrollableElementOnAxis(axis, direction, el) {
        let currentEl = el;
        let parentEl = el.parentElement;
        let elRect = el.getBoundingClientRect();
        let fullyVisibleEl = null;
        while (parentEl) {
            let parentElRect = parentEl.getBoundingClientRect();
            if (this.overflowedInAxisAndDirection(axis, direction, elRect, parentElRect)) {
                currentEl = parentEl;
                elRect = currentEl.getBoundingClientRect();
                fullyVisibleEl = parentEl;
            }
            parentEl = parentEl.parentElement;
        }
        const searchedEl = fullyVisibleEl !== null && fullyVisibleEl !== void 0 ? fullyVisibleEl : el;
        return axis === 'x'
            ? (searchedEl.scrollWidth > searchedEl.clientWidth ? searchedEl : null)
            : (searchedEl.scrollHeight > searchedEl.clientHeight ? searchedEl : null);
    }
    setupScrollerAxisAndDirection(axis, direction) {
        this.scrollDirection = direction;
        this.scrollAxis = axis;
    }
    scrollerAxisAndDirectionResetRequired(axis, direction) {
        return this.scrollDirection !== direction || this.scrollAxis !== axis;
    }
    /**
     * calculate distance and start scrolling
     *
     * @param distance
     */
    startScroller(distance = 0) {
        if (this.scrollAnimationState === null) {
            this.scrollAnimationState = requestAnimationFrame((timestamp) => {
                if (!this.startTime) {
                    this.startTime = timestamp;
                }
                let timestampDiff = timestamp - this.startTime;
                this.startTime = timestamp;
                distance += ((timestampDiff / 1000) * this.scrollSpeed);
                if (distance > 1) {
                    distance = this.scrollDirection === 'f' ? distance : -distance;
                    if (this.scrollAxis === 'y') {
                        this.scrollableElement.scrollBy({ left: 0, top: distance, behavior: 'instant' });
                    }
                    else if (this.scrollAxis === 'x') {
                        this.scrollableElement.scrollBy({ left: distance, top: 0, behavior: 'instant' });
                    }
                    distance = 0;
                }
                this.scrollAnimationState = null;
                this.startScroller(distance);
            });
        }
    }
    /**
     * Check if element overflowing by selected axis and direction
     *
     * @param axis
     * @param direction
     * @param elRect
     * @param parentRect
     */
    overflowedInAxisAndDirection(axis, direction, elRect, parentRect) {
        const isForward = direction === 'f';
        const isBackward = direction === 'b';
        if (axis === 'x') {
            return isForward ? elRect.right > parentRect.right : isBackward ? elRect.left < parentRect.left : false;
        }
        else if (axis === 'y') {
            return isForward ? elRect.bottom > parentRect.bottom : isBackward ? elRect.top < parentRect.top : false;
        }
        return false;
    }
    /**
     * stop scroller
     */
    stopScroller() {
        if (this.scrollAnimationState) {
            cancelAnimationFrame(this.scrollAnimationState);
        }
        this.startTime = null;
        this.scrollAnimationState = null;
        this.scrollDirection = null;
        this.scrollAxis = null;
        this.scrollableElement = null;
    }
}
exports.default = AutoScroller;
