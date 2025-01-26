export interface EmitterInterface {
    on(eventName: string, listener: (data: any) => void): void;
    emit(eventName: string, data: any): void;
}

interface EmitterEvent {
    [key: string]: ((data: any) => void)[];
}

export const createEmitter = (): EmitterInterface => {

    const events: EmitterEvent = {};

    /**
     * Creates a custom listener for an event.
     *
     * @param eventName The name of the event.
     * @param listener The function that will handle the event.
     */
    const on = (eventName: string, listener: (data: any) => void): void => {

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
    const emit = (eventName: string, data: any): void => {

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
