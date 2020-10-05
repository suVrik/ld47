import config from "./config";
import state from "./state";
import Utils from "./utils";

export default class TriggerZone {
    constructor(x, y, width, height, trigger, mode) {
        this.bbox = {
            x: x,
            y: y,
            width: width,
            height: height,
        };
        this.trigger = trigger;
        this.triggers_left = mode === "Once" ? 1 : Infinity;
    }

    update_normal(elapsed_time) {
        if (this.triggers_left > 0) {
            if (Utils.aabb(state.player.shape.x, state.player.shape.y, state.player.shape.width, state.player.shape.height,
                           this.bbox.x, this.bbox.y, this.bbox.width, this.bbox.height)) {
                state.game.trigger_manager.emit(this.trigger);
                this.triggers_left--;
            }
        }
    }
}
