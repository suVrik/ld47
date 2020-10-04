import config from "./config";
import MovieClip from "./movie_clip";
import resources from "./resources";
import state from "./state";
import Utils from "./utils";

export default class Drone extends MovieClip {
    constructor(x, y, shapes, path, offset_x, offset_y) {
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
        this.shape = {
            x: this.x - config.drone.width / 2,
            y: this.y - config.drone.height / 2,
            width: config.drone.width,
            height: config.drone.height,
            mask: config.collision_types.enemies,
        };
        this.filters = [];
        this.damaged_timeout = 0;
        this.velocity_x = 0;

        shapes.push(this.shape);

        this.play();
    }

    update_normal(elapsed_time) {
        // Show white damage notification.
        if (this.damaged_timeout > 1e-8) {
            if (this.filters.length === 0) {
                this.filters = [ resources.white_tint ];
            }
            this.damaged_timeout -= elapsed_time;
        } else {
            if (this.filters.length === 1) {
                this.filters = [ ];
            }
        }

        // Pretty flying.
        const dpx = Math.cos(state.time / 1000) * 3 - this.pivot.x;
        const dpy = Math.sin(state.time / 400) * 5 - this.pivot.y;

        this.pivot.x += dpx;
        this.pivot.y += dpy;

        let dx = 0;
        let dy = 0;

        // Receive damage from player.
        if (this.damaged_timeout <= 1e-8 && state.player.attack_timeout > 1e-8) {
            if (Utils.aabb(state.player.shape.x - config.player.attack_range,
                           state.player.shape.y - config.player.attack_range,
                           state.player.shape.width + config.player.attack_range * 2,
                           state.player.shape.height + config.player.attack_range,
                           this.shape.x, this.shape.y, this.shape.width, this.shape.height)) {
                this.damaged_timeout = Math.max(config.drone.damage_timeout, state.player.attack_timeout);

                if (state.player.x < this.x) {
                    this.velocity_x = config.drone.damage_velocity;
                } else {
                    this.velocity_x = -config.drone.damage_velocity;
                }
            }
        }

        // Apply velocity from player damage.
        if (Math.abs(this.velocity_x) > 1e-5) {
            const result = state.game.physics.move_x(
                this.shape.x, this.shape.y, this.shape.width, this.shape.height,
                config.collision_types.environment | config.collision_types.player,
                this.velocity_x * elapsed_time
            );

            this.x += result.offset;

            this.update_shape();

            this.velocity_x *= config.drone.velocity_falling;
        }

        // Movement.
        const next = this.path[(this.current_index + 1) % this.path.length];
        if (Utils.equal(next.cx, this.x, 1e-5) && Utils.equal(next.cy, this.y, 1e-5)) {
            this.current_index = (this.current_index + 1) % this.path.length;
        } else {
            const distance = Utils.distance(this.x, this.y, next.cx, next.cy);
            const speed = Math.min(config.drone.speed * elapsed_time, distance);
            dx = (next.cx - this.x) / distance * speed;
            dy = (next.cy - this.y) / distance * speed;
        }

        // If player is on top, make it fly.
        if (Utils.aabb(this.shape.x, this.shape.y, this.shape.width, this.shape.height, state.player.shape.x, state.player.shape.y, state.player.shape.width, state.player.shape.height + 1e-5)) {
            if (state.player.shape.y + state.player.shape.height - 1e-5 <= this.shape.y) {
                state.player.velocity_y = -config.drone.player_jump;
                state.player.x += dx - dpx;
                state.player.y += dy - dpy;
                state.player.update_shape();
            }
        }

        this.x += dx;
        this.y += dy;

        // Player must not go through.
        this.update_shape();
    }

    update_shape() {
        this.shape.x = this.x - this.pivot.x - config.drone.width / 2;
        this.shape.y = this.y - this.pivot.y - config.drone.height / 2;
    }
}
