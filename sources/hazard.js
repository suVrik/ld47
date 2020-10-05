import config from "./config";
import * as PIXI from "pixi.js";
import resources from "./resources";
import state from "./state";
import Utils from "./utils";

export default class Hazard extends PIXI.AnimatedSprite {
    constructor(x, y, path, speed, offset_x, offset_y) {
        super(resources.sprites["characters_flying_hazard"]);

        this.path = [];
        this.path.push({ cx: x, cy: y });
        if (path) {
            for (const point of path) {
                this.path.push({
                    cx: (point.cx + 0.5) * config.tile_size + offset_x,
                    cy: (point.cy + 0.5) * config.tile_size + offset_y,
                });
            }
        }

        this.current_index = 0;
        this.animationSpeed = 0.2;
        this.anchor.set(0.5, 0.5);
        this.speed = speed;
        this.x = x;
        this.y = y;
        this.shape = {
            x: this.x - config.hazard.width / 2,
            y: this.y - config.hazard.height / 2,
            width: config.hazard.width,
            height: config.hazard.height,
            // No mask, because this shape is just a bounding box.
        };

        this.play();
    }

    update_normal(elapsed_time) {
        const next = this.path[(this.current_index + 1) % this.path.length];
        if (Utils.equal(next.cx, this.x) && Utils.equal(next.cy, this.y)) {
            this.current_index = (this.current_index + 1) % this.path.length;
        } else {
            const distance = Utils.distance(this.x, this.y, next.cx, next.cy);
            const speed = Math.min(this.speed * elapsed_time, distance);
            this.x += (next.cx - this.x) / distance * speed;
            this.y += (next.cy - this.y) / distance * speed;
        }

        this.update_shape();

        if (!state.player.is_dead) {
            if (Utils.circle_rectangle(this.x, this.y, config.hazard.radius,
                                       state.player.shape.x + config.player.hitbox_offset, state.player.shape.y + config.player.hitbox_offset,
                                       state.player.shape.width - config.player.hitbox_offset * 2, state.player.shape.height - config.player.hitbox_offset * 2)) {
                state.player.is_dead = true;
                state.player.death_by_energy = true;
                state.player.death_timeout = config.player.death_by_energy_timeout;
            }

            if (state.game.hasOwnProperty("debug_draw_layer")) {
                state.game.debug_draw_layer.beginFill(0xFF0000);
                state.game.debug_draw_layer.drawCircle(this.x, this.y, config.hazard.radius);
                state.game.debug_draw_layer.endFill();
            }
        }
    }

    update_shape() {
        this.shape.x = this.x - config.hazard.width / 2;
        this.shape.y = this.y - config.hazard.height / 2;
    }
}
