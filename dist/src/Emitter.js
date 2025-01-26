"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEmitter = void 0;
const createEmitter = () => {
    const events = {};
    /**
     * Creates a custom listener for an event.
     *
     * @param eventName The name of the event.
     * @param listener The function that will handle the event.
     */
    const on = (eventName, listener) => {
        if (!events[eventName]) {
            events[eventName] = [];
        }
        events[eventName].push(listener);
    };
    /**
     * Emits a custom event.
     *
     * @param eventName The name of the event.
     * @param data The data to be passed to the listeners.
     */
    const emit = (eventName, data) => {
        const eventListeners = events[eventName];
        if (eventListeners) {
            eventListeners.forEach(listener => listener(data));
        }
    };
    return {
        on,
        emit
    };
};
exports.createEmitter = createEmitter;
