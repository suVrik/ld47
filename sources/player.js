"use strict";

import config from "./config";
import resources from "./resources";
import state from "./state";
import MovieClip from "./movie_clip";

export default class Player extends MovieClip {
    constructor(x, y, shapes) {
        super({
            idle: { frames: resources.sprites["characters_player_idle"], speed: 0.15 },
            run: { frames: resources.sprites["characters_player_run"], speed: 0.2 },
            jump_up: { frames: resources.sprites["characters_player_jump_up"], speed: 0.15 },
            jump_down: { frames: resources.sprites["characters_player_jump_down"], speed: 0.15 },
            attack_1: { frames: resources.sprites["characters_player_attack_1"], speed: 0.3, loop: false },
            attack_2: { frames: resources.sprites["characters_player_attack_2"], speed: 0.3, loop: false },
        }, "idle");

        this.anchor.set(0.5, 1.0);
        this.x = x;
        this.y = y;
        this.shape = {
            x: this.x - config.player.width / 2,
            y: this.y - config.player.height,
            width: config.player.width,
            height: config.player.height,
            mask: config.collision_types.player,
        };
        this.velocity_x = 0;
        this.velocity_y = 0;
        this.is_grounded = false;
        this.attack_animation = 0;
        this.attack_timeout = 0;
        this.attack_slowdown_timeout = 0;

        state.player = this;

        this.play();

        shapes.push(this.shape);
    }

    update_normal(elapsed_time) {
        this.process_fighting(elapsed_time);
        this.process_movement(elapsed_time);
        this.process_gravity_and_jump(elapsed_time);
        this.process_animation();
    }

    process_fighting(elapsed_time) {
        const is_attack_pressed = state.input.is_pressed("KeyX", 88) || state.input.is_pressed("Enter", 13);
        const is_left_down = state.input.is_down("ArrowLeft", 37) || state.input.is_down("KeyA", 65);
        const is_right_down = state.input.is_down("ArrowRight", 39) || state.input.is_down("KeyD", 68);

        if (this.attack_timeout < 1e-8 && is_attack_pressed) {
            // Attack during attack slowdown reduces the attack velocity as well.
            const attack_slowdown_weight = this.attack_slowdown_timeout / config.player.attack_slowdown_timeout;
            const velocity_factor = 1 - attack_slowdown_weight * (1 - config.player.attack_slowdown_factor);

            this.attack_timeout = config.player.attack_timeout;
            this.attack_slowdown_timeout = config.player.attack_slowdown_timeout;
            this.attack_animation = this.attack_animation % 2 + 1;

            if (this.scale.x > 0) {
                if (is_right_down) {
                    this.velocity_x = velocity_factor * config.player.attack_velocity_long;
                } else {
                    this.velocity_x = velocity_factor * config.player.attack_velocity_short;
                }
            } else {
                if (is_left_down) {
                    this.velocity_x = -velocity_factor * config.player.attack_velocity_long;
                } else {
                    this.velocity_x = -velocity_factor * config.player.attack_velocity_short;
                }
            }
        } else {
            if (this.attack_timeout > 1e-8) {
                this.attack_timeout = Math.max(this.attack_timeout - elapsed_time, 0);
            }
            if (this.attack_slowdown_timeout > 1e-8) {
                this.attack_slowdown_timeout = Math.max(this.attack_slowdown_timeout - elapsed_time, 0);
            }
        }
    }

    process_movement(elapsed_time) {
        const is_left_down = state.input.is_down("ArrowLeft", 37) || state.input.is_down("KeyA", 65);
        const is_right_down = state.input.is_down("ArrowRight", 39) || state.input.is_down("KeyD", 68);

        if (this.attack_timeout < 1e-8) {
            const attack_slowdown_weight = this.attack_slowdown_timeout / config.player.attack_slowdown_timeout;
            const speed_factor = 1 - attack_slowdown_weight * (1 - config.player.attack_slowdown_factor);

            if (is_left_down && !is_right_down) {
                this.velocity_x = Math.max(-speed_factor * config.player.speed * elapsed_time, this.velocity_x - config.player.acceleration * elapsed_time);
            } else if (!is_left_down && is_right_down) {
                this.velocity_x = Math.min(speed_factor * config.player.speed * elapsed_time, this.velocity_x + config.player.acceleration * elapsed_time);
            } else {
                if (this.velocity_x > 0) {
                    this.velocity_x = Math.max(0, this.velocity_x - config.player.acceleration * elapsed_time);
                } else {
                    this.velocity_x = Math.min(0, this.velocity_x + config.player.acceleration * elapsed_time);
                }
            }
        } else {
            if (this.scale.x > 0) {
                if (is_right_down) {
                    this.velocity_x *= config.player.attack_velocity_falling_long;
                } else {
                    this.velocity_x *= config.player.attack_velocity_falling_short;
                }
            } else {
                if (is_left_down) {
                    this.velocity_x *= config.player.attack_velocity_falling_long;
                } else {
                    this.velocity_x *= config.player.attack_velocity_falling_short;
                }
            }
        }

        const result = state.game.physics.move_x(
            this.shape.x, this.shape.y, this.shape.width, this.shape.height,
            config.collision_types.environment | config.collision_types.enemies, this.velocity_x
        );

        this.x += result.offset;

        this.update_shape();

        if ((result.left && this.velocity_x < -1e-8) || (result.right && this.velocity_x > 1e-8)) {
            this.velocity_x = 0;
        }
    }

    process_gravity_and_jump(elapsed_time) {
        const is_jump_down = state.input.is_down("KeyZ", 90) || state.input.is_down("Space", 32);
        const is_jump_pressed = state.input.is_pressed("KeyZ", 90) || state.input.is_pressed("Space", 32);
        const is_down_pressed = state.input.is_pressed("ArrowDown", 40) || state.input.is_pressed("KeyS", 83);

        if (this.is_grounded && is_jump_pressed) {
            this.velocity_y = -config.player.jump;
        } else {
            if (is_jump_down && this.velocity_y < -1e-8) {
                this.velocity_y += config.player.gravity * config.player.gravity_factor * elapsed_time;
            } else {
                this.velocity_y += config.player.gravity * elapsed_time;
            }
        }

        let collision_mask = config.collision_types.environment | config.collision_types.enemies;
        if (!is_down_pressed) {
            collision_mask |= config.collision_types.platform;
        }

        const result = state.game.physics.move_y(this.shape.x, this.shape.y, this.shape.width, this.shape.height, collision_mask, this.velocity_y * elapsed_time, shape => {
            if ((shape.mask & config.collision_types.platform) !== 0) {
                return shape.y > this.y - 1e-8;
            }
            return true;
        });

        this.y += result.offset;

        this.update_shape();

        if (result.bottom) {
            this.is_grounded = true;

            this.velocity_y = config.player.pressure;
        } else {
            this.is_grounded = false;

            if (result.top && this.velocity_y < 0) {
                this.velocity_y = 0;
            }
        }
    }

    process_animation() {
        if (this.velocity_x > 1e-8) {
            this.scale.x = 1;
        } else if (this.velocity_x < -1e-8) {
            this.scale.x = -1;
        }

        if (this.attack_timeout > 1e-8) {
            this.gotoAndPlay(`attack_${this.attack_animation}`);
        } else {
            if (!this.is_grounded) {
                if (this.velocity_y < 0) {
                    this.gotoAndPlay("jump_up");
                } else {
                    this.gotoAndPlay("jump_down");
                }
            } else {
                if (Math.abs(this.velocity_x) > 1e-8) {
                    this.gotoAndPlay("run");
                } else {
                    this.gotoAndPlay("idle");
                }
            }
        }
    }

    update_shape() {
        this.shape.x = this.x - config.player.width / 2;
        this.shape.y = this.y - config.player.height;
    }
}
