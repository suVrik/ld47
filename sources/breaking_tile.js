import config from "./config";
import * as PIXI from "pixi.js";
import resources from "./resources";
import state from "./state";
import Utils from "./utils";

export default class BreakingTile extends PIXI.Sprite {
    constructor(x, y, shapes) {
        super(resources.sprites["objects_small_destructible_stages_0"]);

        this.x = x;
        this.y = y;
        this.shape = {
            x: this.x,
            y: this.y,
            width: config.tile_size,
            height: config.tile_size,
            mask: config.collision_types.environment,
        };
        this.hits = 0;
        this.timeout = 0;

        shapes.push(this.shape);
    }

    update_normal(elapsed_time) {
        if (this.hits < 3) {
            if (this.timeout <= 1e-8 && state.player.attack_timeout > 1e-8) {
                if (Utils.aabb(state.player.bounding_box.x - config.player.attack_range,
                               state.player.bounding_box.y - config.player.attack_range,
                               state.player.bounding_box.width + config.player.attack_range * 2,
                               state.player.bounding_box.height + config.player.attack_range * 2,
                               this.x, this.y, config.tile_size, config.tile_size)) {
                    this.hits++;

                    // Avoid the rest of this hit.
                    this.timeout = state.player.attack_timeout;

                    if (this.hits < 3) {
                        this.texture = resources.sprites[`objects_small_destructible_stages_${this.hits}`];
                    } else {
                        this.visible = false;
                        this.shape.mask = config.collision_types.none;
                    }
                }
            }
            this.timeout -= elapsed_time;
        }
    }
}
