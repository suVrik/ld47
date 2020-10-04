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
        this.filters = [];

        shapes.push(this.shape);
    }

    update_normal(elapsed_time) {
        // Show damage notification.
        if (this.timeout > 1e-8) {
            if (this.filters.length === 0) {
                this.filters = [ resources.white_tint ];
            }
        } else {
            if (this.filters.length === 1) {
                this.filters = [ ];
            }
        }

        // Logic.
        if (this.hits < 3) {
            if (this.timeout <= 1e-8 && state.player.attack_timeout > 1e-8) {
                if (Utils.aabb(state.player.shape.x - config.player.attack_range,
                               state.player.shape.y - config.player.attack_range,
                               state.player.shape.width + config.player.attack_range * 2,
                               state.player.shape.height + config.player.attack_range,
                               this.shape.x, this.shape.y, this.shape.width, this.shape.height)) {
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