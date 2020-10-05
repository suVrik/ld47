import config from "./config";
import * as PIXI from "pixi.js";
import resources from "./resources";
import state from "./state";
import Utils from "./utils";

export default class MovingPlatform extends PIXI.AnimatedSprite {
    constructor(x, y, path, speed, wait_time, start_idx, end_idx, offset_x, offset_y) {
        super(resources.sprites["characters_platform_moving"]);

        this.path = [];
        this.path.push({ cx: x, cy: y + config.tile_size / 2 });
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
            bbox_min_x = Math.min(bbox_min_x, point.cx - config.tile_size);
            bbox_min_y = Math.min(bbox_min_y, point.cy);
            bbox_max_x = Math.max(bbox_max_x, point.cx + config.tile_size);
            bbox_max_y = Math.max(bbox_max_y, point.cy + config.tile_size);
        }
        this.bbox = {
            x: bbox_min_x,
            y: bbox_min_y,
            width: bbox_max_x - bbox_min_x,
            height: bbox_max_y - bbox_max_y,
        };

        this.start_idx = start_idx;
        this.end_idx = end_idx;
        this.current_index = 0;
        this.animationSpeed = 0.1;
        this.anchor.set(0.5, 0);
        this.speed = speed;
        this.wait_time = wait_time;
        this.timeout = 0;
        this.shape = {
            x: this.x - config.tile_size,
            y: this.y,
            width: config.tile_size * 2,
            height: config.tile_size,
            mask: config.collision_types.platform,
        };
        this.x = x;
        this.y = y;

        state.game.entity_shapes.push(this.shape);

        this.play();
    }

    update_normal(elapsed_time) {
        if (this.timeout > 1e-8) {
            this.timeout -= elapsed_time;
            return;
        }

        const next = this.path[(this.current_index + 1) % this.path.length];
        if (Utils.equal(next.cx, this.x) && Utils.equal(next.cy, this.y)) {
            this.current_index = (this.current_index + 1) % this.path.length;
            if (this.current_index === this.start_idx || this.current_index === this.end_idx) {
                this.timeout = this.wait_time;
            }
        } else {
            const distance = Utils.distance(this.x, this.y, next.cx, next.cy);
            const speed = Math.min(this.speed * elapsed_time, distance);
            const dx = (next.cx - this.x) / distance * speed;
            const dy = (next.cy - this.y) / distance * speed;
            if (!state.player.is_god) {
                if (Utils.aabb(this.shape.x, this.shape.y, this.shape.width, this.shape.height, state.player.shape.x, state.player.shape.y, state.player.shape.width, state.player.shape.height + 1)) {
                    if (state.player.shape.y + state.player.shape.height - 1 <= this.shape.y) {
                        state.player.x += dx;
                        state.player.y += dy;
                        state.player.update_shape();
                    }
                }
            }
            this.x += dx;
            this.y += dy;
        }

        this.shape.x = this.x - config.tile_size;
        this.shape.y = this.y;
    }
}
