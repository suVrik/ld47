import config from "./config";
import state from "./state";
import Utils from "./utils";

export default class TriggerZone {
    constructor(x, y, width, height, trigger, mode) {
        this.shape = {
            x: x,
            y: y,
            width: width,
            height: height,
            // No mask, because this shape is just a bounding box.
        };
        this.trigger = trigger;
        this.triggers_left = mode === "Once" ? 1 : Infinity;
    }

    update_normal(elapsed_time) {
        if (this.triggers_left > 0) {
            if (Utils.aabb(state.player.shape.x, state.player.shape.y, state.player.shape.width, state.player.shape.height,
                           this.shape.x, this.shape.y, this.shape.width, this.shape.height)) {
                state.game.trigger_manager.emit(this.trigger);
                this.triggers_left--;
            }
        }
    }
}
