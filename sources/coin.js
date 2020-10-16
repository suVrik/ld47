import config from "./config";
import * as PIXI from "pixi.js";
import resources from "./resources";
import state from "./state";
import Utils from "./utils";

export default class Coin extends PIXI.AnimatedSprite {
    constructor(x, y) {
        super(resources.sprites["objects_small_coin"]);

        this.x = x;
        this.y = y;
        this.animationSpeed = 0.15;
        this.anchor.set(0.5, 0.5);
        this.bbox = {
            x: x - config.tile_size / 2,
            y: y - config.tile_size / 2,
            width: config.tile_size,
            height: config.tile_size,
        };

        this.play();
    }

    update_normal(elapsed_time) {
        this.pivot.y = Math.sin(state.time / 100) * 2 + 3;

        if (!state.player.is_dead) {
            if (Utils.circle_rectangle(this.x, this.y, config.coin.radius, state.player.shape.x, state.player.shape.y, state.player.shape.width, state.player.shape.height)) {
                this.visible = false;
            }
        }
    }
}
