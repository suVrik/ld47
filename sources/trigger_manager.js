export default class TriggerManager {
    constructor() {
        this.subscribers = {};
    }

    subscribe(trigger, callback) {
        this.subscribers[trigger] = this.subscribers[trigger] || [];
        this.subscribers[trigger].push(callback);
    }

    emit(trigger) {
        this.subscribers[trigger] = this.subscribers[trigger] || [];
        for (const callback of this.subscribers[trigger]) {
            callback();
        }
    }
}
