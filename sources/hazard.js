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

        let bbox_min_x = Infinity;
        let bbox_min_y = Infinity;
        let bbox_max_x = -Infinity;
        let bbox_max_y = -Infinity;
        for (const point of this.path) {
            bbox_min_x = Math.min(bbox_min_x, point.cx - config.hazard.width / 2);
            bbox_min_y = Math.min(bbox_min_y, point.cy - config.hazard.height / 2);
            bbox_max_x = Math.max(bbox_max_x, point.cx + config.hazard.width / 2);
            bbox_max_y = Math.max(bbox_max_y, point.cy + config.hazard.height / 2);
        }
        this.bbox = {
            x: bbox_min_x,
            y: bbox_min_y,
            width: bbox_max_x - bbox_min_x,
            height: bbox_max_y - bbox_max_y,
        };

        this.current_index = 0;
        this.animationSpeed = 0.2;
        this.anchor.set(0.5, 0.5);
        this.speed = speed;
        this.x = x;
        this.y = y;

        this.play();
    }

    update_normal(elapsed_time) {
        this.pivot.x = Math.random() * 4 - 2;
        this.pivot.y = Math.random() * 4 - 2;

        const next = this.path[(this.current_index + 1) % this.path.length];
        if (Utils.equal(next.cx, this.x) && Utils.equal(next.cy, this.y)) {
            this.current_index = (this.current_index + 1) % this.path.length;
        } else {
            const distance = Utils.distance(this.x, this.y, next.cx, next.cy);
            const speed = Math.min(this.speed * elapsed_time, distance);
            this.x += (next.cx - this.x) / distance * speed;
            this.y += (next.cy - this.y) / distance * speed;
        }

        if (!state.player.is_dead && !state.player.is_god) {
            if (Utils.circle_rectangle(this.x, this.y, config.hazard.radius,
                                       state.player.shape.x + config.player.hitbox_offset, state.player.shape.y + config.player.hitbox_offset,
                                       state.player.shape.width - config.player.hitbox_offset * 2, state.player.shape.height - config.player.hitbox_offset * 2)) {
                state.player.is_dead = true;
                state.player.death_by_energy = true;
                state.player.death_timeout = config.player.death_by_energy_timeout;
                state.game.lock_camera = true;
            }

            if (state.game.hasOwnProperty("debug_draw_layer")) {
                state.game.debug_draw_layer.beginFill(0xFF0000);
                state.game.debug_draw_layer.drawCircle(this.x, this.y, config.hazard.radius);
                state.game.debug_draw_layer.endFill();
            }
        }
    }
}
