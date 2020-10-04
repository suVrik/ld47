import config from "./config";
import * as PIXI from "pixi.js";
import resources from "./resources";
import state from "./state";
import Utils from "./utils";

export default class Hazard extends PIXI.AnimatedSprite {
    constructor(x, y, path, speed, offset_x, offset_y) {
        super(resources.sprites["characters_flying_hazard"]);

        this.path = [ { cx: Math.floor((x - offset_x) / config.tile_size), cy: Math.floor((y - offset_y) / config.tile_size) } ].concat(path);
        for (const point of this.path) {
            point.cx = (point.cx + 0.5) * config.tile_size + offset_x;
            point.cy = (point.cy + 0.5) * config.tile_size + offset_y;
        }

        this.current_index = 0;
        this.animationSpeed = 0.2;
        this.source = x;
        this.anchor.set(0.5, 0.5);
        this.speed = speed;
        this.x = x;
        this.y = y;

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
    }
}
