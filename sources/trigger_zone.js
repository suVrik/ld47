import config from "./config";
import state from "./state";
import Utils from "./utils";

export default class TriggerZone {
    constructor(x, y, width, height, trigger, mode) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.trigger = trigger;
        this.triggers_left = mode === "Once" ? 1 : Infinity;
    }

    update_normal(elapsed_time) {
        if (this.triggers_left > 0) {
            if (Utils.aabb(state.player.bounding_box.x, state.player.bounding_box.y, state.player.bounding_box.width, state.player.bounding_box.height,
                           this.x, this.y, this.width, this.height)) {
                state.game.trigger_manager.emit(this.trigger);
                this.triggers_left--;
            }
        }
    }
}
