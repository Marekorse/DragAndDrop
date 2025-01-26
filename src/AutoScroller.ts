export interface AutoScrollerInterface {
    speed?: number;
    direction?: string;

    shouldEnableAutoScroller(x: number, y: number): void;

    handleScroll(axis: string, direction: string, currentEl: HTMLElement, SetDocScrollingElAsFallback: boolean): void;

    getFirstScrollableElementOnAxis(axis: string, direction: string, el: HTMLElement): HTMLElement | null;

    setupScrollerAxisAndDirection(axis: string, direction: string): void;

    scrollerAxisAndDirectionResetRequired(axis: string, direction: string): boolean;

    startScroller(distance: number): void;

    overflowedInAxisAndDirection(axis: string, direction: string, elRect: DOMRect, parentRect: DOMRect): boolean;

    stopScroller(): void


}


/**
 *
 * Auto scroller.
 *
 * Extension that ensures smooth scrolling of the screen and elements while dragging the element.
 *
 */

export default class AutoScroller implements AutoScrollerInterface {
    private readonly scrollToPositionThreshold: number;
    private readonly scrollSpeed: number;
    private startTime: DOMHighResTimeStamp | null;
    private scrollDirection: string | null;
    private scrollAxis: string | null;
    private scrollableElement: null | HTMLElement;
    private scrollAnimationState: number | null;

    /**
     * Constructor
     *
     * @param speed
     * @param threshold
     */
    constructor(speed: number = 100, threshold: number = 50) {

        this.scrollToPositionThreshold = threshold
        this.scrollSpeed = speed;
        this.startTime = null;
        this.scrollAnimationState = null;
        this.scrollDirection = null;
        this.scrollAxis = null;
        this.scrollableElement = null
    }

    /**
     * Check if auto-scrolling is required based on the current position and thresholds,
     * and trigger the auto-scroller if necessary.
     *
     * @param x
     * @param y
     */
    shouldEnableAutoScroller(x: number, y: number): void {
        const vw: number = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
        const vh: number = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
        const el: HTMLElement | null = document.elementFromPoint(x, y) as HTMLElement | null;
        if (el) {
            const elRect: DOMRect = el.getBoundingClientRect()

            if (x > vw - this.scrollToPositionThreshold || x - elRect.x > elRect.width - this.scrollToPositionThreshold) { // X axis →
                this.handleScroll('x', 'f', el, x > vw - this.scrollToPositionThreshold)
            } else if (x < this.scrollToPositionThreshold || x - elRect.x < this.scrollToPositionThreshold) { // X axis ←
                this.handleScroll('x', 'b', el, x < this.scrollToPositionThreshold)
            } else if (y < this.scrollToPositionThreshold || y - elRect.y < this.scrollToPositionThreshold) { // Y axis  ↑
                this.handleScroll('y', 'b', el, y < this.scrollToPositionThreshold)
            } else if (y > vh - this.scrollToPositionThreshold || y - elRect.y > elRect.height - this.scrollToPositionThreshold) { // Y axis ↓
                this.handleScroll('y', 'f', el, y > vh - this.scrollToPositionThreshold)
            } else {
                this.stopScroller()
            }
        }
    }

    handleScroll(axis: string, direction: string, currentEl: HTMLElement, SetDocScrollingElAsFallback: boolean): void {

        if (!this.scrollableElement || this.scrollerAxisAndDirectionResetRequired(axis, direction)) {
            this.setupScrollerAxisAndDirection(axis, direction)

            this.scrollableElement = SetDocScrollingElAsFallback
                ? (this.getFirstScrollableElementOnAxis(axis, direction, currentEl) ?? document.scrollingElement) as HTMLElement | null
                : this.getFirstScrollableElementOnAxis(axis, direction, currentEl) as HTMLElement | null;


            if (this.scrollableElement) {
                this.startScroller();
            }
        }

    }

    getFirstScrollableElementOnAxis(axis: string, direction: string, el: HTMLElement): HTMLElement | null {

        let currentEl: HTMLElement = el as HTMLElement;
        let parentEl: HTMLElement | null = el.parentElement
        let elRect: DOMRect = el.getBoundingClientRect()
        let fullyVisibleEl: HTMLElement | null = null;

        while (parentEl) {
            let parentElRect = parentEl.getBoundingClientRect()

            if (this.overflowedInAxisAndDirection(axis, direction, elRect, parentElRect)) {
                currentEl = parentEl
                elRect = currentEl.getBoundingClientRect()
                fullyVisibleEl = parentEl
            }

            parentEl = parentEl.parentElement

        }

        const searchedEl = fullyVisibleEl ?? el

        return axis === 'x'
            ? (searchedEl.scrollWidth > searchedEl.clientWidth ? searchedEl : null)
            : (searchedEl.scrollHeight > searchedEl.clientHeight ? searchedEl : null)

    }

    setupScrollerAxisAndDirection(axis: string, direction: string): void {
        this.scrollDirection = direction;
        this.scrollAxis = axis;
    }

    scrollerAxisAndDirectionResetRequired(axis: string, direction: string): boolean {
        return this.scrollDirection !== direction || this.scrollAxis !== axis;
    }

    /**
     * calculate distance and start scrolling
     *
     * @param distance
     */

    startScroller(distance: number = 0): void {

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
                        (this.scrollableElement as HTMLElement).scrollBy({left: 0, top: distance, behavior: 'instant'});
                    } else if (this.scrollAxis === 'x') {
                        (this.scrollableElement as HTMLElement).scrollBy({left: distance, top: 0, behavior: 'instant'});
                    }

                    distance = 0

                }

                this.scrollAnimationState = null
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
    overflowedInAxisAndDirection(axis: string, direction: string, elRect: DOMRect, parentRect: DOMRect): boolean {

        const isForward: boolean = direction === 'f';
        const isBackward: boolean = direction === 'b';

        if (axis === 'x') {
            return isForward ? elRect.right > parentRect.right : isBackward ? elRect.left < parentRect.left : false;
        } else if (axis === 'y') {
            return isForward ? elRect.bottom > parentRect.bottom : isBackward ? elRect.top < parentRect.top : false;
        }

        return false;
    }

    /**
     * stop scroller
     */
    stopScroller(): void {

        if (this.scrollAnimationState) {
            cancelAnimationFrame(this.scrollAnimationState);
        }

        this.startTime = null
        this.scrollAnimationState = null
        this.scrollDirection = null;
        this.scrollAxis = null;
        this.scrollableElement = null

    }

}
