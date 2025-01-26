"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 *
 * Auto scroller.
 *
 * Extension that ensures smooth scrolling of the screen and elements while dragging the element.
 *
 */
var AutoScroller = /** @class */ (function () {
    /**
     * Constructor
     *
     * @param speed
     * @param threshold
     */
    function AutoScroller(speed, threshold) {
        if (speed === void 0) { speed = 100; }
        if (threshold === void 0) { threshold = 50; }
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
    AutoScroller.prototype.shouldEnableAutoScroller = function (x, y) {
        var vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        var vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
        var el = document.elementFromPoint(x, y);
        if (el) {
            var elRect = el.getBoundingClientRect();
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
    };
    AutoScroller.prototype.handleScroll = function (axis, direction, currentEl, SetDocScrollingElAsFallback) {
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
    };
    AutoScroller.prototype.getFirstScrollableElementOnAxis = function (axis, direction, el) {
        var currentEl = el;
        var parentEl = el.parentElement;
        var elRect = el.getBoundingClientRect();
        var fullyVisibleEl = null;
        while (parentEl) {
            var parentElRect = parentEl.getBoundingClientRect();
            if (this.overflowedInAxisAndDirection(axis, direction, elRect, parentElRect)) {
                currentEl = parentEl;
                elRect = currentEl.getBoundingClientRect();
                fullyVisibleEl = parentEl;
            }
            parentEl = parentEl.parentElement;
        }
        var searchedEl = fullyVisibleEl !== null && fullyVisibleEl !== void 0 ? fullyVisibleEl : el;
        return axis === 'x'
            ? (searchedEl.scrollWidth > searchedEl.clientWidth ? searchedEl : null)
            : (searchedEl.scrollHeight > searchedEl.clientHeight ? searchedEl : null);
    };
    AutoScroller.prototype.setupScrollerAxisAndDirection = function (axis, direction) {
        this.scrollDirection = direction;
        this.scrollAxis = axis;
    };
    AutoScroller.prototype.scrollerAxisAndDirectionResetRequired = function (axis, direction) {
        return this.scrollDirection !== direction || this.scrollAxis !== axis;
    };
    /**
     * calculate distance and start scrolling
     *
     * @param distance
     */
    AutoScroller.prototype.startScroller = function (distance) {
        var _this = this;
        if (distance === void 0) { distance = 0; }
        if (this.scrollAnimationState === null) {
            this.scrollAnimationState = requestAnimationFrame(function (timestamp) {
                if (!_this.startTime) {
                    _this.startTime = timestamp;
                }
                var timestampDiff = timestamp - _this.startTime;
                _this.startTime = timestamp;
                distance += ((timestampDiff / 1000) * _this.scrollSpeed);
                if (distance > 1) {
                    distance = _this.scrollDirection === 'f' ? distance : -distance;
                    if (_this.scrollAxis === 'y') {
                        _this.scrollableElement.scrollBy({ left: 0, top: distance, behavior: 'instant' });
                    }
                    else if (_this.scrollAxis === 'x') {
                        _this.scrollableElement.scrollBy({ left: distance, top: 0, behavior: 'instant' });
                    }
                    distance = 0;
                }
                _this.scrollAnimationState = null;
                _this.startScroller(distance);
            });
        }
    };
    /**
     * Check if element overflowing by selected axis and direction
     *
     * @param axis
     * @param direction
     * @param elRect
     * @param parentRect
     */
    AutoScroller.prototype.overflowedInAxisAndDirection = function (axis, direction, elRect, parentRect) {
        var isForward = direction === 'f';
        var isBackward = direction === 'b';
        if (axis === 'x') {
            return isForward ? elRect.right > parentRect.right : isBackward ? elRect.left < parentRect.left : false;
        }
        else if (axis === 'y') {
            return isForward ? elRect.bottom > parentRect.bottom : isBackward ? elRect.top < parentRect.top : false;
        }
        return false;
    };
    /**
     * stop scroller
     */
    AutoScroller.prototype.stopScroller = function () {
        if (this.scrollAnimationState) {
            cancelAnimationFrame(this.scrollAnimationState);
        }
        this.startTime = null;
        this.scrollAnimationState = null;
        this.scrollDirection = null;
        this.scrollAxis = null;
        this.scrollableElement = null;
    };
    return AutoScroller;
}());
exports.default = AutoScroller;
