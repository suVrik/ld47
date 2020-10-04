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

        this.source_y = y;
        this.source_x = x;
        this.destination_x = (destination ? destination.cx * config.tile_size : this.source_x) + x_offset;
        this.idle_duration = idle_duration;
        this.wait_timeout = 0;
        this.shape = {
            x: this.x - config.zombie.width / 2,
            y: this.y - config.zombie.height,
            width: config.zombie.width,
            height: config.zombie.height,
            mask: config.collision_types.enemies,
        };
        this.x = x + (this.destination_x - x) * initial;
        this.y = y;
        this.anchor.set(0.5, 1.0);
        this.velocity_x = 0;
        this.velocity_y = config.zombie.pressure;
        this.filters = [];
        this.damaged_timeout = 0;

        if (!face_right) {
            this.scale.x = -1;
        }

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

        // Receive damage from player.
        if (this.damaged_timeout <= 1e-8 && state.player.attack_timeout > 1e-8) {
            if (Utils.aabb(state.player.shape.x - config.player.attack_range,
                           state.player.shape.y - config.player.attack_range,
                           state.player.shape.width + config.player.attack_range * 2,
                           state.player.shape.height + config.player.attack_range,
                           this.shape.x, this.shape.y, this.shape.width, this.shape.height)) {
                this.damaged_timeout = Math.max(config.zombie.damage_timeout, state.player.attack_timeout);

                if (state.player.x < this.x) {
                    this.velocity_x = config.zombie.damage_velocity;
                } else {
                    this.velocity_x = -config.zombie.damage_velocity;
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

            this.velocity_x *= config.zombie.velocity_falling;
        }

        // Movement.
        if (this.wait_timeout > 1e-8 || this.source_x === this.destination_x) {
            this.wait_timeout -= elapsed_time;

            this.gotoAndPlay("idle");
        } else {
            if (this.x < this.destination_x) {
                const result = state.game.physics.move_x(
                    this.shape.x, this.shape.y, this.shape.width, this.shape.height,
                    config.collision_types.environment | config.collision_types.player,
                    Math.min(config.zombie.speed * elapsed_time, this.destination_x - this.x)
                );

                this.x += result.offset;
                if (this.x >= this.destination_x) {
                    this.swap();
                }

                this.scale.x = 1;
            } else if (this.x > this.destination_x) {
                const result = state.game.physics.move_x(
                    this.shape.x, this.shape.y, this.shape.width, this.shape.height,
                    config.collision_types.environment | config.collision_types.player,
                    Math.min(-config.zombie.speed * elapsed_time, this.x - this.destination_x)
                );

                this.x += result.offset;
                if (this.x <= this.destination_x) {
                    this.swap();
                }

                this.scale.x = -1;
            }

            this.update_shape();

            this.gotoAndPlay("walk");
        }

        // Gravity.
        {
            const result = state.game.physics.move_y(
                this.shape.x, this.shape.y, this.shape.width, this.shape.height,
                config.collision_types.environment | config.collision_types.platform | config.collision_types.player,
                this.velocity_y * elapsed_time, shape => {
                    if ((shape.mask & config.collision_types.platform) !== 0) {
                        return shape.y > this.y - 1e-8;
                    }
                    return true;
                }
            );

            this.y += result.offset;

            this.velocity_y += config.zombie.gravity * elapsed_time;
            if (result.bottom) {
                this.velocity_y = config.zombie.pressure;
            }

            this.update_shape();
        }

        // When we're lost, stop following any predefined rules.
        if (this.source_y !== this.y) {
            this.source_x = this.destination_x = this.x;
        }
    }

    swap() {
        this.destination_x = this.source_x;
        this.source_x = this.x;
        this.wait_timeout = this.idle_duration;
    }

    update_shape() {
        this.shape.x = this.x - config.zombie.width / 2;
        this.shape.y = this.y - config.zombie.height;
    }
}
