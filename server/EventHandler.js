class EventHandler {

    constructor() {
        this.callbacks = [];
    }

    on(eventName, callback) {
        for (var i in this.callbacks) {
            if (this.callbacks[i].eventName === eventName) {
                this.callbacks[i].callbacks.push(callback);
            }
        }
    }

    dispatch(ev) {
    }

}
