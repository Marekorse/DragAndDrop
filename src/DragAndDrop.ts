/**
 * Drag and drop
 *
 * library intended for simple implementation of drag and drop functionality.
 *
 * @author    Marek Koršepa <marek.korsepa@gmail.com>
 * @license   MIT
 */

export interface SDDList {
    id: string
    dragDisabled: boolean,
    dropDisabled: boolean,
    actionButton: string,
    shared: string,

}

interface DragAndDropInterface {
    lists: Array<SDDList>;
    animationDuration: number;

    init(): void;

    initList(el: HTMLElement, list: SDDList): void;

    clearEventListeners(): void;

    onTouchStart(event: TouchEvent): void;

    onTouchMove(event: TouchEvent): void;

    onDragStart(event: MouseEvent): void;

    onDragOver(event: MouseEvent): void;

    dragOver(draggedElement: HTMLElement, target: EventTarget, x: number, y: number): void;

    placeDraggedElementToList(draggedElement: HTMLElement, y: number, list: HTMLElement): void;

    replaceDraggedElement(clientY: number, target: HTMLElement, draggedElement: HTMLElement): void;

    move(
        parent: HTMLElement,
        insertBeforeElement: HTMLElement | null,
        draggedElement: HTMLElement,
        fromIndex: number,
        toIndex: number
    ): void;

    setDraggedPropertiesForElement(target: HTMLElement): void;

    resetDraggedPropertiesForElement(): void;

    emitChanges(): void;

    insertListItem(listId: string, index: number, el: HTMLElement): void;

    removeItemFromLIst(list: HTMLElement, index: number): void;

    insertNewList(el: HTMLElement, listAttributes: SDDList): void;

    setAnimationState(listItems: HTMLElement[], fromIndex: number, toIndex: number): void;

    animateList(listItems: HTMLElement[]): void;

    getActualPosition(target: HTMLElement): object | null;

    removeTransition(target: HTMLElement): void;

    isMoved(...el: HTMLElement[]): boolean;

    createRangeFromIndexes(start: number, end: number): number[];

    getChildIndex(el: HTMLElement): number;

    getDraggedElement(): HTMLElement | null;

    createGhostElement(target: HTMLElement, hideElement?: boolean): HTMLElement;

    moveGhostElement(x: number, y: number): void;

    removeGhostElement(): void;

    getHtmlChildNodes(el: HTMLElement): HTMLElement[];

    updateListItemPositions(list: HTMLElement, from?: number, to?: number | null): void;

    getList(id: string): HTMLElement | null;

    isList(el: HTMLElement): boolean;

    isFromSameList(draggedEl: HTMLElement, targetEl: HTMLElement): boolean;

    isFromSameSharedGroup(draggedEl: HTMLElement, targetEl: HTMLElement): boolean;

    dragEnterToAnotherEl(draggedEl: HTMLElement, targetEl: HTMLElement): void;

    isDragDisabled(list: SDDList): boolean;

    isDropDisabled(listId: string): boolean;

    isActionButtonValid(list: SDDList, element: HTMLElement): boolean;

    getFirstListItemElement(target: EventTarget): HTMLElement | null;

    getListElement(element: HTMLElement): HTMLElement | null;

}

import AutoScroller from './AutoScroller';
import {createEmitter, EmitterInterface} from "./Emitter";


export class DragAndDrop implements DragAndDropInterface, EmitterInterface {
    public lists: SDDList[];
    public readonly animationDuration: number;
    private ghostElement: HTMLElement | null;
    private enteredTarget: HTMLElement | null;
    private touchedPointInnerOffset: { x: number; y: number };
    private readonly draggedElementAttribute: string;
    private readonly draggedElementCurrentIndexAttribute: string;
    private readonly draggedElementOriginalIndexAttribute: string;
    private readonly draggedElementOriginalListAttribute: string;
    private readonly listSharedAttribute: string;
    private readonly listAttribute: string;
    private readonly listIdAttribute: string;
    private readonly listItemAttribute: string;
    private readonly listItemPosition: string;
    private readonly oldPositionAttribute: string;
    private readonly animationAttribute: string;
    private readonly isMovedAttribute: string;
    private readonly ghostElementAttribute: string;
    private autoScroller: AutoScroller;
    private elementsWithListeners: any[];

    on!: (event: string, listener: (...args: any[]) => void) => void;
    emit!: (event: string, ...args: any[]) => void;


    /**
     * Constructor
     *
     * @param lists
     * @param animationDuration
     */
    constructor(lists: Array<SDDList>, animationDuration: number = 500) {

        //BASE STATE
        this.lists = lists
        this.animationDuration = animationDuration;
        this.ghostElement = null
        this.enteredTarget = null
        this.touchedPointInnerOffset = {x: 0, y: 0};

        //DATA ATTRIBUTES
        this.draggedElementAttribute = 'data-dragging'
        this.draggedElementCurrentIndexAttribute = 'data-dragging-index'
        this.draggedElementOriginalIndexAttribute = 'data-dragging-original-index'
        this.draggedElementOriginalListAttribute = 'data-dragging-original-list'
        this.listSharedAttribute = 'data-shared'
        this.listAttribute = 'data-list'
        this.listIdAttribute = 'data-list-id'
        this.listItemAttribute = 'data-list-item'
        this.listItemPosition = 'data-list-item-position'
        this.oldPositionAttribute = 'data-old-position'
        this.animationAttribute = 'data-animation'
        this.listItemPosition = 'data-list-item-position'
        this.isMovedAttribute = 'data-moved'
        this.ghostElementAttribute = 'data-ghost'
        this.ghostElementAttribute = 'data-positions'

        //AUTO SCROLLER
        this.autoScroller = new AutoScroller(500, 50)

        //EVENTS
        Object.assign(this as DragAndDropInterface, createEmitter());
        this.elementsWithListeners = []


        this.init()
    }


    /**
     * Initialization
     *
     * Setup all attributes for HTML elements and event listeners.
     */
    init() {

        //SETUP LIST ATTRIBUTES
        this.lists.forEach(list => {
            const el = document.getElementById(list.id);

            if (el) {
                this.initList(el, list)
            }
        })


        //CREATE EVENT LISTENERS
        const onDragStart = (e: MouseEvent) => this.onDragStart(e);
        document.addEventListener('mousedown', onDragStart);

        const mouseUp = () => this.resetDraggedPropertiesForElement();
        document.addEventListener('mouseup', mouseUp);

        const onDragEnd = () => this.emitChanges();
        document.addEventListener('dragend', onDragEnd);

        const onDragOver = (e: MouseEvent) => this.onDragOver(e);
        document.addEventListener('dragover', onDragOver, {passive: false});

        const onTouchStart = (e: TouchEvent) => this.onTouchStart(e);
        document.addEventListener('touchstart', onTouchStart, {passive: false});

        const onTouchEnd = () => this.emitChanges();
        document.addEventListener('touchend', onTouchEnd);

        const onTouchMove = (e: TouchEvent) => this.onTouchMove(e);
        document.addEventListener('touchmove', onTouchMove, {passive: false});


        //SAVE LISTENERS REFERENCE TO VARIABLE
        this.elementsWithListeners.push({
            el: document, events: {
                mousedown: onDragStart,
                dragend: onDragEnd,
                dragover: onDragOver,
                touchstart: onTouchStart,
                touchend: onTouchEnd,
                onTouchmove: onTouchMove,
            }
        })

    }

    /**
     * Setup all attributes for list and list items
     *
     * @param el
     * @param list
     */
    initList(el: HTMLElement, list: SDDList) {
        //SET ATTRIBUTES FOR LIST
        el.setAttribute(this.listAttribute, '');

        if (list.hasOwnProperty('shared')) {
            el.setAttribute(this.listSharedAttribute, list.shared);
        }

        //SET ATTRIBUTES FOR LIST ITEMS
        this.getHtmlChildNodes(el).forEach((child, index) => {
            if (child.nodeType === 1) {
                child.setAttribute(this.listIdAttribute, list.id);
                child.setAttribute(this.listItemAttribute, '');
                child.setAttribute(this.listItemPosition, String(index + 1));
            }
        })
    }

    /**
     * Remove all event listeners.
     */
    clearEventListeners() {
        this.elementsWithListeners.forEach((listener,) => {
            for (const [key, value] of Object.entries(listener.events)) {
                listener.el.removeEventListener(key, value)
            }

        })
    }

    /**
     * Validate dragged item and Setup base attributes for dragged item
     *
     * @param event
     */
    onTouchStart(event: TouchEvent) {
        const target = event.target

        if (target instanceof HTMLElement) {
            const listItem = this.getFirstListItemElement(target)
            const list = !listItem ? null : this.lists.find(el => `${el.id}` === listItem.getAttribute(this.listIdAttribute))

            if (listItem && list && this.isActionButtonValid(list, target)) {
                event.preventDefault();

                if (!this.isMoved(listItem) && !this.isDragDisabled(list)) {
                    const x = event.touches[0].clientX
                    const y = event.touches[0].clientY

                    this.setDraggedPropertiesForElement(listItem)

                    this.ghostElement = this.createGhostElement(listItem, false)
                    this.enteredTarget = listItem;
                    const targetRect = listItem.getBoundingClientRect()
                    this.touchedPointInnerOffset = {x: x - targetRect.x, y: y - targetRect.y}

                    this.ghostElement.style.transform = `translate(${x - this.touchedPointInnerOffset.x}px, ${y - this.touchedPointInnerOffset.y}px)`;
                    document.body.appendChild(this.ghostElement)
                }
            }
        }
    }

    /**
     * Handle drag move
     *
     * @param event
     */
    onTouchMove(event: TouchEvent) {

        const draggedElement = this.getDraggedElement()

        if (draggedElement) {
            event.preventDefault();
            const touch = event.touches[0];
            const x = touch.clientX;
            const y = touch.clientY;

            this.moveGhostElement(x - this.touchedPointInnerOffset.x, y - this.touchedPointInnerOffset.y)

            let target = document.elementFromPoint(touch.clientX, touch.clientY);

            if (target) {
                this.dragOver(draggedElement, target, x, y);
            }

        }

    }

    /**
     * Validate dragged item and Setup base attributes for dragged item
     *
     * @param event
     */
    onDragStart(event: MouseEvent) {
        const target = event.target

        if (target instanceof HTMLElement) {

            const listItem = this.getFirstListItemElement(target)

            if (listItem) {
                const list: SDDList = this.lists.find(el => `${el.id}` === listItem.getAttribute(this.listIdAttribute))!

                //VALIDATE IF ELEMENT CAN BE DRAGGED
                if (this.isMoved(target) || event && event?.button !== 0) {
                    return
                }

                if (event.button === 0 && this.isActionButtonValid(list, target) && !this.isMoved(listItem) && !this.isDragDisabled(list)) {
                    this.setDraggedPropertiesForElement(listItem)
                    this.enteredTarget = target
                }
            }
        }

    }

    /**
     * Handle drag move
     *
     * @param event
     */
    onDragOver(event: MouseEvent) {

        event.preventDefault();
        const draggedElement = this.getDraggedElement()
        const target = event.target

        if (draggedElement && target) {
            this.dragOver(draggedElement, target, event.clientX, event.clientY)
        }
    }


    /**
     * Basic Function for determining whether and where the dragged element should be placed
     *
     * @param draggedElement
     * @param target
     * @param x
     * @param y
     */
    dragOver(draggedElement: HTMLElement, target: EventTarget, x: number, y: number) {

        const item = this.getFirstListItemElementForDraggedElement(draggedElement, target)

        if (item && item !== draggedElement) {
            const dragEnter = this.dragEnterToAnotherEl(draggedElement, item)
            const draggedElParent = draggedElement.parentElement!
            const itemElParent = item.parentElement!
            //SIMULATION OF DRAGENTER EVENT
            if (dragEnter) {
                if (this.isList(item) && !this.isMoved(item) && !this.isDropDisabled(item.id) && this.isFromSameSharedGroup(draggedElParent, item)) {
                    const list: HTMLElement = this.getListElement(item)!
                    this.placeDraggedElementToList(draggedElement, y, list)
                } else if (item && !this.isMoved(item) && !this.isDropDisabled(item.getAttribute(this.listIdAttribute)!)) {
                    if (this.isFromSameList(draggedElement, item)) {
                        this.replaceDraggedElement(y, item, draggedElement)
                    } else if (this.isFromSameSharedGroup(draggedElParent, itemElParent)) {
                        this.replaceDraggedElement(y, item, draggedElement)
                    }
                }

                //SIMULATION OF DRAGOVER EVENT
            } else if (item && !this.isMoved(draggedElement, item) && this.isFromSameSharedGroup(draggedElParent, itemElParent) && !this.isDropDisabled(itemElParent.id)) {
                this.replaceDraggedElement(y, item, draggedElement)
            }
        }


        this.autoScroller.shouldEnableAutoScroller(x, y)
    }


    /**
     * calculation of where the element should be placed in the list
     *
     * @param draggedElement
     * @param y
     * @param list
     */
    placeDraggedElementToList(draggedElement: HTMLElement, y: number, list: HTMLElement) {

        const listItems: HTMLElement[] = this.getHtmlChildNodes(list)
        const fromIndex = Number(draggedElement.getAttribute(this.draggedElementCurrentIndexAttribute))
        const toIndex = 0

        //WHEN IS LIST EMPTY PLACE ITEM TO FIRST PLACE
        if (listItems.length === 0) {
            this.move(list, null, draggedElement, fromIndex, toIndex)
            return;
        }

        const firstElementPosition = this.getActualPosition(listItems[0])
        const lastElementPosition = this.getActualPosition(listItems[listItems.length - 1])

        //dragged element does not meet the 2 and 3 condition
        if (y > firstElementPosition.y && y < (lastElementPosition.y + lastElementPosition.h)) {
            return
        }

        //position of the first element is higher than the position of the dragged element
        if (y < firstElementPosition.y) {
            this.move(list, listItems[0] ?? null, draggedElement, fromIndex, toIndex)
        }
        //position of the last element is lower than the position of the dragged element
        else {
            this.move(list, null, draggedElement, fromIndex, toIndex)
        }

    }

    /**
     *  Placing the dragged element in the list based on direction and position
     *
     * @param clientY
     * @param target
     * @param draggedElement
     */
    replaceDraggedElement(clientY: number, target: HTMLElement, draggedElement: HTMLElement) {
        const parent = target.parentNode as HTMLElement
        const childNodes = this.getHtmlChildNodes(parent);


        //GET TARGET INDEXES
        const targetIndex = this.getChildIndex(target)


        //ELEMENT FROM ANOTHER LIST DOES NOT REQUIRE CALCULATION
        if (draggedElement.parentElement !== target.parentNode) {
            this.move(parent, childNodes[targetIndex], draggedElement, null, targetIndex)
            return
        }

        const draggedItemIndex = Number(draggedElement.getAttribute(this.draggedElementCurrentIndexAttribute))


        //CALCULATE CENTER POINT OF ELEMENT
        const targetRect = target.getBoundingClientRect();
        const targetCenterPoint = targetRect.y + targetRect.height / 2

        if (clientY > targetCenterPoint) {
            if (targetIndex > Number(draggedItemIndex)) {

                this.move(parent, (childNodes[targetIndex].nextSibling as HTMLElement), draggedElement, draggedItemIndex, targetIndex)
            } else {
                this.move(parent, childNodes[targetIndex], draggedElement, draggedItemIndex, targetIndex)
            }
        } else if (clientY < targetCenterPoint) {
            if (targetIndex < Number(draggedItemIndex)) {
                this.move(parent, childNodes[targetIndex], draggedElement, draggedItemIndex, targetIndex)
            } else if (targetIndex >= 0 && targetIndex < childNodes.length) {
                this.move(parent, (childNodes[targetIndex].nextSibling as HTMLElement), draggedElement, draggedItemIndex, targetIndex)
            }
        }
    }

    /**
     * moving an element
     *  -setup animation
     *  -insert element to list
     *  -update list id
     *
     * @param targetParent
     * @param insertBeforeElement
     * @param draggedElement
     * @param fromIndex
     * @param toIndex
     */
    move(targetParent: HTMLElement, insertBeforeElement: HTMLElement | null, draggedElement: HTMLElement, fromIndex: number | null, toIndex: number) {

        let draggedElementList: HTMLElement[] | null = null
        let targetList: HTMLElement[] | null = null

        //ANIMATIONS
        if (this.animationDuration && this.animationDuration > 0) {
            const parentChildNodes = this.getHtmlChildNodes(targetParent)


            //GET ACTUAL ELEMENTS POSITIONS AND CLEAR ALL TRANSITIONS
            if (draggedElement.getAttribute(this.listIdAttribute) !== targetParent.id) {

                const draggedElParent = draggedElement.parentNode as HTMLElement
                const draggedElParentChildNodes = this.getHtmlChildNodes(draggedElParent)
                draggedElementList = this.setAnimationState(draggedElParentChildNodes, Number(draggedElement.getAttribute(this.draggedElementCurrentIndexAttribute)), draggedElParentChildNodes.length - 1)

                //PREPARE ANIMATIONS WHEN LIST IS NOT EMPTY
                if (parentChildNodes.length >= 1) {

                    fromIndex = toIndex
                    toIndex = parentChildNodes.length === 0 ? 0 : parentChildNodes.length - 1
                    targetList = this.setAnimationState(parentChildNodes, fromIndex, toIndex,)
                }

            } else {
                targetList = this.setAnimationState(parentChildNodes, fromIndex!, toIndex)
            }

            //PLACE ITEM TO LIST
            targetParent.insertBefore(draggedElement, insertBeforeElement)

            //MOVE ELEMENTS TO PREVIOUS POSITION AND START ANIMATIONS
            if (draggedElementList) {
                this.animateList(draggedElementList)
            }

            if (targetList) {
                this.animateList(targetList)
            }
        } else {
            //PLACE ITEM TO LIST
            targetParent.insertBefore(draggedElement, insertBeforeElement)
        }

        //SET NEW ATTRIBUTES FOR DRAGGED ITEM
        draggedElement.setAttribute(this.listIdAttribute, targetParent.id)
        draggedElement.setAttribute(this.draggedElementCurrentIndexAttribute, String(this.getChildIndex(draggedElement)))
    }

    /**
     * Set attributes for dragged item
     *
     * @param target
     */
    setDraggedPropertiesForElement(target: HTMLElement) {

        window.getSelection()?.removeAllRanges()

        const index = this.getChildIndex(target)
        target.draggable = true;
        target.setAttribute(this.draggedElementOriginalListAttribute, target.getAttribute(this.listIdAttribute)!)
        target.setAttribute(this.draggedElementCurrentIndexAttribute, String(index))
        target.setAttribute(this.draggedElementOriginalIndexAttribute, String(index))
        target.setAttribute(this.draggedElementAttribute, '')

    }

    /**
     * Reset Dragged item attributes
     *
     */
    resetDraggedPropertiesForElement() {
        let el = this.getDraggedElement()

        this.ghostElement = null
        this.enteredTarget = null
        this.touchedPointInnerOffset = {x: 0, y: 0};

        if (el) {
            el.draggable = false;
            el.removeAttribute(this.draggedElementOriginalListAttribute);
            el.removeAttribute(this.draggedElementCurrentIndexAttribute)
            el.removeAttribute(this.draggedElementOriginalIndexAttribute)
            el.removeAttribute(this.draggedElementAttribute);
            el.removeAttribute(this.animationAttribute);
        }
    }

    /**
     * Checks whether the positions of the items have been changed and fire "updated" event
     *
     */
    emitChanges() {

        this.autoScroller.stopScroller()

        const draggedElement = this.getDraggedElement()

        if (this.ghostElement) {
            this.removeGhostElement()
        }

        //CHECK IF ITEM POSITIONS WAS CHANGED
        if (draggedElement) {
            let updatedList = null;
            const list = this.getList(draggedElement.getAttribute(this.listIdAttribute)!) as HTMLElement
            const draggedElementOriginalListAttribute = draggedElement.getAttribute(this.draggedElementOriginalListAttribute) as string;


            if (list?.id !== draggedElement.getAttribute(this.draggedElementOriginalListAttribute)) {

                const draggedList = this.updateListItemPositions(this.getList(draggedElementOriginalListAttribute)!)
                const targetList = this.updateListItemPositions(list)

                updatedList = draggedList.concat(targetList)

            } else if (draggedElement.getAttribute(this.draggedElementCurrentIndexAttribute) !== draggedElement.getAttribute(this.draggedElementOriginalIndexAttribute)) {

                const from = Number(draggedElement.getAttribute(this.draggedElementOriginalIndexAttribute))
                const to = Number(draggedElement.getAttribute(this.draggedElementCurrentIndexAttribute))

                updatedList = this.updateListItemPositions(list, from, to)
            }

            //FIRE EVENT
            if (updatedList !== null) {
                this.emit('updated', updatedList);
            }

            this.resetDraggedPropertiesForElement()
        }

    }


    /**
     * Insert new item to list
     *
     * @param listId
     * @param index
     * @param el
     */
    insertListItem(listId: string, index: number, el: HTMLElement) {
        const list = document.getElementById(listId)

        if (!list) {
            console.error('List element not exist!')
            return
        }

        el.setAttribute(this.listIdAttribute, list.id);
        el.setAttribute(this.listItemAttribute, '');

        let listItems = this.getHtmlChildNodes(list)
        listItems = this.setAnimationState(listItems, index, listItems.length - 1)

        //REPAINT
        el.offsetHeight;

        this.animateList(listItems)

        const updatedList = {
            [list.id]: this.updateListItemPositions(list, index)
        }

        this.emit("list-item-added", updatedList)
    }

    /**
     * Remove Item from list
     *
     * @param list
     * @param index
     */
    removeItemFromLIst(list: HTMLElement, index: number) {

        let listItems = this.getHtmlChildNodes(list)
        listItems = this.setAnimationState(listItems, index, listItems.length - 1)

        setTimeout(() => {
            this.animateList(listItems)
        }, this.animationDuration)


        const updatedList = {
            [list.id]: this.updateListItemPositions(list, index)
        }

        this.emit("updated", updatedList)
    }

    /**
     * add new list
     *
     * @param el
     * @param listAttributes
     */
    insertNewList(el: HTMLElement, listAttributes: SDDList) {
        this.initList(el, listAttributes)
        this.emit("list-initialized", el)
    }


    /**  ----- Animations functions ----- **/

    /**
     * save the current position of the elements
     *
     * @param listItems
     * @param fromIndex
     * @param toIndex
     */
    setAnimationState(listItems: HTMLElement[], fromIndex: number, toIndex: number) {

        //CREATE RANGE FROM ELEMENTS WHICH WILL BE MOVED
        const changedElementsIndexes: number[] = this.createRangeFromIndexes(fromIndex, toIndex);
        let list: HTMLElement[] = []

        //SAVE ACTUAL POSITIONS
        changedElementsIndexes.forEach(index => {

            let target = listItems[index];
            target.setAttribute(this.oldPositionAttribute, JSON.stringify(this.getActualPosition(target)))
            this.removeTransition(target)
            list.push(target)

        })

        return list
    }

    /**
     * Animate list items
     *
     * @param listItems
     */
    animateList(listItems: HTMLElement[]) {
        //set animations for selected elements
        listItems.forEach(target => {

            target.setAttribute(this.isMovedAttribute, '')
            const position = this.getActualPosition(target)

            //calculate the position from where the animation will start
            const oldPosition = JSON.parse(target.getAttribute(this.oldPositionAttribute)!)
            target.style.transform = `translate3d(${oldPosition.x - position.x}px, ${oldPosition.y - position.y}px, 0px)`;

            //repaint
            target.offsetHeight;

            //start animation
            target.style.transition = `transform ${this.animationDuration}ms ease`;
            target.style.transform = `translate3d(0px, 0px, 0px)`;

            //reset animation state after end
            if (target.hasAttribute(this.animationAttribute)) {
                const animationState = Number(target.getAttribute(this.animationAttribute)!)
                clearTimeout(animationState)
            }

            const animation = setTimeout(() => {
                this.removeTransition(target)
                target.removeAttribute(this.oldPositionAttribute)
                target.removeAttribute(this.isMovedAttribute)
                target.removeAttribute(this.animationAttribute)
            }, this.animationDuration)

            target.setAttribute(this.animationAttribute, String(animation))
        })
    }

    /**
     * Get element bounding client rect
     *
     * @param target
     */
    getActualPosition(target: HTMLElement) {
        const position = target.getBoundingClientRect()
        return {x: position.left, y: position.top, w: position.width, h: position.height}
    }

    /**
     * Reset element animations
     *
     * @param target
     */
    removeTransition(target: HTMLElement) {
        target.style.transition = "";
        target.style.transform = "";
    }


    /** ----- Helper functions ----- **/


    /**
     * Check if the element is moving
     *
     * @param el
     */
    isMoved(...el: HTMLElement[]) {
        let moved = false;

        el.forEach(el => {
            if (el.hasAttribute(this.isMovedAttribute)) {
                moved = true
            }
        })

        return moved
    }

    /**
     * Create an array containing a sequence of numbers between start and end
     *
     * @param start
     * @param end
     */
    createRangeFromIndexes(start: number, end: number) {
        if (start > end) {
            [start, end] = [end, start];
        }

        let rangeArray = [];

        for (let i = start; i <= end; i++) {
            rangeArray.push(i);
        }

        return rangeArray;
    }

    /**
     * Get element index in parent node
     *
     * @param el
     */
    getChildIndex(el: HTMLElement) {

        const parentElement: HTMLElement | null = el.parentNode instanceof HTMLElement ? el.parentNode : null;

        if (parentElement) {
            const list = this.getHtmlChildNodes(parentElement);
            const parentArray = Array.prototype.slice.call(list);
            return parentArray.indexOf(el);
        } else return -1

    }

    /**
     * Get actually dragged element
     *
     */
    getDraggedElement(): HTMLElement | null {
        return document.querySelector(`[${this.draggedElementAttribute}]`);
    }

    /**
     * Create ghost element
     *
     * @param target
     * @param hideElement
     */
    createGhostElement(target: HTMLElement, hideElement: boolean = true) {
        const ghostElement: HTMLElement = target.cloneNode(true) as HTMLElement
        const rect: DOMRect = target.getBoundingClientRect()

        ghostElement.style.setProperty('position', 'fixed', 'important');
        ghostElement.style.width = `${rect.width}px`
        ghostElement.style.height = `${rect.height}px`
        ghostElement.removeAttribute(this.draggedElementAttribute)
        ghostElement.setAttribute(this.ghostElementAttribute, '');
        ghostElement.style.opacity = '0.7';
        ghostElement.style.touchAction = 'none';
        ghostElement.style.pointerEvents = 'none';

        if (hideElement) {
            ghostElement.style.left = `${0 - rect.width}px`
            ghostElement.style.top = `${0 - rect.height}px`
        } else {
            ghostElement.style.left = String(0)
            ghostElement.style.top = String(0)
        }

        return ghostElement
    }

    /**
     * Move ghost element
     *
     * @param x
     * @param y
     */
    moveGhostElement(x: number, y: number) {
        if (this.ghostElement) {
            this.ghostElement.style.transform = `translate(${x}px, ${y}px)`;
        }
    };

    /**
     * remove ghost element.
     */
    removeGhostElement() {
        if (this.ghostElement) {
            this.ghostElement.remove()
            this.ghostElement = null
        }
    }

    /**
     * Get html element child nodes.
     *
     * @param el
     */
    getHtmlChildNodes(el: HTMLElement): HTMLElement[] {
        const nodes: HTMLElement[] = [];

        el.childNodes.forEach((child) => {
            if (child.nodeType === Node.ELEMENT_NODE && child instanceof HTMLElement) {
                nodes.push(child);
            }
        });

        return nodes;
    }

    /**
     * Update list item position attribute
     *
     * @param list
     * @param from
     * @param to
     */
    updateListItemPositions(list: HTMLElement, from: number = 0, to: number | null = null) {
        const nodes: ChildNode[] = this.getHtmlChildNodes(list)
        const updatedNodes: ChildNode[] = [];

        if (nodes.length === 0) {
            return []
        }

        if (to === null) {
            to = nodes.length - 1
        }

        const range = this.createRangeFromIndexes(from, to)

        range.forEach(index => {
            const node = nodes[index] as HTMLElement
            node.setAttribute(this.listItemPosition, String(index + 1))
            updatedNodes.push(node)
        })

        return updatedNodes
    }

    /**
     * Get list element
     *
     * @param id
     */
    getList(id: string): HTMLElement | null {
        return document.getElementById(id)
    }

    /**
     * validate list element
     *
     * @param el
     */
    isList(el: HTMLElement): boolean {
        return el?.hasAttribute(this.listAttribute) ?? false
    }

    /**
     * validate list item element
     *
     * @param el
     */
    isListItem(el: HTMLElement | null) {
        return el?.hasAttribute(this.listItemAttribute)
    }

    /**
     * check if element has same list id attribute
     *
     * @param draggedEl
     * @param targetEl
     */
    isFromSameList(draggedEl: HTMLElement, targetEl: HTMLElement) {
        return draggedEl.hasAttribute(this.listIdAttribute) && targetEl.hasAttribute(this.listIdAttribute) && draggedEl.getAttribute(this.listIdAttribute) === targetEl.getAttribute(this.listIdAttribute)
    }

    /**
     * check if element has same shared group attribute
     *
     * @param draggedElParent
     * @param targetElParent
     */
    isFromSameSharedGroup(draggedElParent: HTMLElement, targetElParent: HTMLElement) {
        return draggedElParent === targetElParent ||
            (draggedElParent.hasAttribute(this.listSharedAttribute)
                && targetElParent.hasAttribute(this.listSharedAttribute)
                && targetElParent.getAttribute(this.listSharedAttribute) === targetElParent.getAttribute(this.listSharedAttribute))
    }

    /**
     * Simulate drag enter event.
     *
     * @param draggedEl
     * @param targetEl
     */
    dragEnterToAnotherEl(draggedEl: HTMLElement, targetEl: HTMLElement) {
        const isDifferentEl = draggedEl !== targetEl && this.enteredTarget !== targetEl;
        this.enteredTarget = targetEl;
        return isDifferentEl;
    }

    /**
     * check if list drag functionality is disabled.
     *
     * @param list
     */
    isDragDisabled(list: SDDList) {
        return list.dragDisabled ?? false
    }

    /**
     * check if list drop functionality is disabled.
     *
     * @param listId
     */
    isDropDisabled(listId: string) {
        return this.lists.find(el => el.id === listId)?.dropDisabled ?? false
    }

    /**
     * check if list drop functionality is disabled.
     *
     * @param list
     * @param element
     */
    isActionButtonValid(list: SDDList, element: HTMLElement) {
        if (!list.actionButton || element.hasAttribute(list.actionButton)) {
            return true
        }

        let currentElement: HTMLElement | null = element;

        while (currentElement && !currentElement.hasAttribute(this.listItemAttribute)) {
            if (currentElement.hasAttribute(list.actionButton)) {
                return true;
            }

            currentElement = (currentElement as HTMLElement).parentElement;
        }

        return false;
    }

    /**
     * get/search list item
     *
     * @param target
     */
    getFirstListItemElement(target: EventTarget): HTMLElement | null {
        let currentTarget: EventTarget | null = target;

        while (currentTarget) {

            console.log(currentTarget)
            if (currentTarget instanceof HTMLElement && this.isListItem(currentTarget)) {
                return currentTarget;
            }

            currentTarget = (currentTarget as HTMLElement).parentElement;
        }

        return null;
    }

    /**
     * get/search list item
     *
     * @param draggedElement
     * @param target
     */
    getFirstListItemElementForDraggedElement(draggedElement: HTMLElement, target: EventTarget): HTMLElement | null {
        let currentTarget: EventTarget | null = target;

        while (currentTarget) {

            if (currentTarget instanceof HTMLElement && this.isListItem(currentTarget)
                && (this.isFromSameList(draggedElement, currentTarget)
                    || draggedElement.parentElement && currentTarget.parentElement && this.isFromSameSharedGroup(draggedElement.parentElement, currentTarget.parentElement))
            ) {
                return currentTarget;
            }

            currentTarget = (currentTarget as HTMLElement).parentElement;
        }

        return null;
    }


    /**
     * get/search list
     *
     * @param element
     */
    getListElement(element: HTMLElement): HTMLElement | null {
        return element && element.hasAttribute(this.listAttribute) ? element : null
    }
}
