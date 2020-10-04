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
            if (Utils.aabb(state.player.shape.x, state.player.shape.y, state.player.shape.width, state.player.shape.height,
                           this.x, this.y, this.width, this.height)) {
                state.game.trigger_manager.emit(this.trigger);
                this.triggers_left--;
            }
        }
    }
}
