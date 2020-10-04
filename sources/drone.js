import config from "./config";
import MovieClip from "./movie_clip";
import resources from "./resources";
import state from "./state";
import Utils from "./utils";

export default class Drone extends MovieClip {
    constructor(x, y, path, offset_x, offset_y) {
        super({
            idle: { frames: resources.sprites["characters_drone_idle"], speed: 0.15 },
            activate: { frames: resources.sprites["characters_drone_activate"], speed: 0.2 },
            attack: { frames: resources.sprites["characters_drone_attack"], speed: 0.2 },
        }, "idle");

        this.path = [ { cx: Math.floor((x - offset_x) / config.tile_size), cy: Math.floor((y - offset_y) / config.tile_size) } ].concat(path || []);
        for (const point of this.path) {
            point.cx = (point.cx + 0.5) * config.tile_size + offset_x;
            point.cy = (point.cy + 0.5) * config.tile_size + offset_y;
        }

        this.current_index = 0;
        this.anchor.set(0.5, 0.5);
        this.x = x;
        this.y = y;

        this.play();
    }

    update_normal(elapsed_time) {
        this.pivot.x = Math.cos(state.time / 1000) * 3;
        this.pivot.y = Math.sin(state.time / 400) * 5;

        const next = this.path[(this.current_index + 1) % this.path.length];
        if (Utils.equal(next.cx, this.x) && Utils.equal(next.cy, this.y)) {
            this.current_index = (this.current_index + 1) % this.path.length;
        } else {
            const distance = Utils.distance(this.x, this.y, next.cx, next.cy);
            const speed = Math.min(config.drone.speed * elapsed_time, distance);
            this.x += (next.cx - this.x) / distance * speed;
            this.y += (next.cy - this.y) / distance * speed;
        }
    }
}
