import config from "./config";
import MovieClip from "./movie_clip";
import resources from "./resources";
import state from "./state";
import Utils from "./utils";

export default class Zombie extends MovieClip {
    constructor(x, y, shapes, destination, initial, idle_duration, face_right, x_offset) {
        super({
            idle: { frames: resources.sprites["characters_zombie_idle"], speed: 0.1 },
            walk: { frames: resources.sprites["characters_zombie_walk"], speed: 0.1 },
            attack: { frames: resources.sprites["characters_zombie_attack"], speed: 0.1 },
        }, "idle");

        this.source = x;
        this.destination = (destination ? destination.cx * config.tile_size : this.source) + x_offset;
        this.idle_duration = idle_duration;
        this.wait_timeout = 0;
        this.shape = {
            x: this.x - config.zombie.width / 2,
            y: this.y - config.zombie.height,
            width: config.tile_size,
            height: config.tile_size,
            mask: config.collision_types.enemies,
        };
        this.anchor.set(0.5, 1.0);
        this.x = x + (this.destination - x) * initial;
        this.y = y;

        if (!face_right) {
            this.scale.x = -1;
        }

        shapes.push(this.shape);

        this.play();
    }

    update_normal(elapsed_time) {
        if (this.wait_timeout > 1e-8 || this.source === this.destination) {
            this.wait_timeout -= elapsed_time;
            this.gotoAndPlay("idle");
        } else {
            if (this.x < this.destination) {
                const result = state.game.physics.move_x(
                    this.shape.x, this.shape.y, this.shape.width, this.shape.height,
                    config.collision_types.environment | config.collision_types.player,
                    config.zombie.speed * elapsed_time
                );

                this.x += result.offset;
                if (this.x > this.destination) {
                    this.swap();
                }
                this.scale.x = 1;
            } else if (this.x > this.destination) {
                const result = state.game.physics.move_x(
                    this.shape.x, this.shape.y, this.shape.width, this.shape.height,
                    config.collision_types.environment | config.collision_types.player,
                    -config.zombie.speed * elapsed_time
                );

                this.x += result.offset;
                if (this.x < this.destination) {
                    this.swap();
                }
                this.scale.x = -1;
            }
            this.gotoAndPlay("walk");
        }

        this.shape.x = this.x - config.zombie.width / 2;
        this.shape.y = this.y - config.zombie.height;
    }

    swap() {
        this.x = this.destination;
        this.destination = this.source;
        this.source = this.x;
        this.wait_timeout = this.idle_duration;
    }
}
