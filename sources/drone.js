import config from "./config";
import MovieClip from "./movie_clip";
import * as PIXI from "pixi.js";
import resources from "./resources";
import state from "./state";
import Utils from "./utils";

export default class Drone extends PIXI.Container {
    constructor(x, y, path, offset_x, offset_y) {
        super();

        resources.sprites["characters_drone_activate_reverse"] =
            resources.sprites["characters_drone_activate_reverse"] || resources.sprites["characters_drone_activate"].slice().reverse();

        this.body = new MovieClip({
            idle: { frames: resources.sprites["characters_drone_idle"], speed: 0.15 },
            activate: { frames: resources.sprites["characters_drone_activate"], speed: 0.2, loop: false },
            deactivate: { frames: resources.sprites["characters_drone_activate_reverse"], speed: 0.2, loop: false },
            attack: { frames: resources.sprites["characters_drone_attack"], speed: 0.2 },
        }, "idle");
        this.body.anchor.set(0.5, 0.5);
        this.body.filters = [];
        this.body.play();
        this.addChild(this.body);

        this.laser = new PIXI.Sprite(resources.sprites["laser_aim"]);
        this.laser.anchor.set(0, 0.5);
        this.laser.visible = false;
        this.addChild(this.laser);

        this.effect = new PIXI.AnimatedSprite(resources.sprites["objects_small_effect_laser"]);
        this.effect.anchor.set(0.5, 0.5);
        this.effect.animationSpeed = 0.2;
        this.effect.visible = false;
        this.effect.play();
        this.addChild(this.effect);

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
            bbox_min_x = Math.min(bbox_min_x, point.cx - config.drone.width / 2);
            bbox_min_y = Math.min(bbox_min_y, point.cy - config.drone.height / 2);
            bbox_max_x = Math.max(bbox_max_x, point.cx + config.drone.width / 2);
            bbox_max_y = Math.max(bbox_max_y, point.cy + config.drone.height / 2);
        }
        this.bbox = {
            x: bbox_min_x,
            y: bbox_min_y,
            width: bbox_max_x - bbox_min_x,
            height: bbox_max_y - bbox_max_y,
        };

        this.current_index = 0;
        this.x = x;
        this.y = y;
        this.shape = {
            x: this.x - config.drone.width / 2,
            y: this.y - config.drone.height / 2,
            width: config.drone.width,
            height: config.drone.height,
            mask: config.collision_types.enemies,
        };
        this.damaged_timeout = 0;
        this.velocity_x = 0;
        this.activation_delay = 0;
        this.activated = false;
        this.activation_timeout = 0;
        this.shooting = false;
        this.shooting_delay = 0;
        this.shooting_timeout = 0;
        this.shooting_angle = 0;
        this.not_seen_timeout = 0;
        this.health = config.drone.health;

        state.game.entity_shapes.push(this.shape);
    }

    update_normal(elapsed_time) {
        // Show white damage notification.
        if (this.damaged_timeout > 1e-8) {
            if (this.body.filters.length === 0) {
                this.body.filters = [ resources.white_tint ];
            }
            this.damaged_timeout -= elapsed_time;
        } else {
            if (this.body.filters.length === 1) {
                this.body.filters = [ ];
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
        if (this.damaged_timeout <= 1e-8 && !state.player.is_dead && state.player.attack_timeout > 1e-8) {
            if (Utils.aabb(state.player.shape.x - config.player.attack_range,
                           state.player.shape.y - config.player.attack_range,
                           state.player.shape.width + config.player.attack_range * 2,
                           state.player.shape.height + config.player.attack_range,
                           this.shape.x, this.shape.y, this.shape.width, this.shape.height)) {
                this.damaged_timeout = Math.max(config.drone.damage_timeout, state.player.attack_timeout);

                this.health--;

                if (state.player.x < this.x) {
                    this.velocity_x = config.drone.damage_velocity;
                } else {
                    this.velocity_x = -config.drone.damage_velocity;
                }
            }
        }

        // Die.
        if (this.health <= 0) {
            if (this.parent) {
                this.shape.mask = config.collision_types.none;
                this.parent.removeChild(this);
            }
            return;
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

        // Attacking hell.
        {
            const laser_x = this.x - this.pivot.x;
            const laser_y = this.y - this.pivot.y - 2;

            const player_x = state.player.x;
            const player_y = state.player.y - config.player.height / 2;

            const distance_to_player = Utils.square_distance(laser_x, laser_y, player_x, player_y);

            const collision_mask = config.collision_types.environment | config.collision_types.spikes;

            this.laser.visible = this.effect.visible = false;

            if (!this.activated) {
                if (distance_to_player <= Utils.sqr(config.drone.activation_radius) && !state.game.physics.raycast_any(laser_x, laser_y, player_x, player_y, collision_mask) && !state.player.is_dead && !state.player.is_god) {
                    this.activation_delay += elapsed_time;
                    if (this.activation_delay >= config.drone.activation_delay) {
                        this.activated = true;
                        this.not_seen_timeout = 0;
                        this.body.gotoAndPlay("activate");
                    }
                } else {
                    this.activation_delay = 0;
                }
            } else {
                if (!this.shooting) {
                    let result = state.game.physics.raycast_closest(laser_x, laser_y, player_x, player_y, collision_mask);
                    if (!result) {
                        result = [ player_x, player_y ];
                    }

                    if (state.player.is_dead || distance_to_player > Utils.sqr(config.drone.shooting_radius)) {
                        this.not_seen_timeout += elapsed_time;
                    } else {
                        this.not_seen_timeout = 0;
                    }

                    if (this.not_seen_timeout > config.drone.not_seen_timeout) {
                        // Turn off if too far away.
                        this.activation_delay = 0;
                        this.activated = false;
                        this.activation_timeout = 0;
                        this.body.gotoAndPlay("deactivate");
                        console.log("quit early by not seen");
                    } else {
                        this.activation_timeout += elapsed_time;
                        if (this.activation_timeout >= config.drone.activation_timeout) {
                            this.shooting = true;
                            this.shooting_delay = 0;
                            this.shooting_timeout = 0;
                            this.shooting_angle = Math.atan2(player_y - laser_y, player_x - laser_x);
                            this.body.gotoAndPlay("attack");
                        }

                        this.laser.texture = resources.sprites["laser_aim"];
                        this.laser.visible = true;
                        this.laser.rotation = Math.atan2(result[1] - laser_y, result[0] - laser_x);
                        this.laser.scale.x = Utils.distance(laser_x, laser_y, result[0], result[1]) / 2;
                        this.laser.alpha = 0.5;
                    }
                } else {
                    const laser_target_x = laser_x + Math.cos(this.shooting_angle) * 1000;
                    const laser_target_y = laser_y + Math.sin(this.shooting_angle) * 1000;

                    let result = state.game.physics.raycast_closest(laser_x, laser_y, laser_target_x, laser_target_y, collision_mask);
                    if (!result) {
                        result = [ laser_target_x, laser_target_y ];
                    } else {
                        if (state.player.is_dead || distance_to_player > Utils.sqr(config.drone.shooting_radius)) {
                            this.not_seen_timeout += elapsed_time;
                        } else {
                            this.not_seen_timeout = 0;
                        }

                        const ending_timeout = config.drone.shooting_timeout - config.drone.shooting_ending;
                        if (this.not_seen_timeout > config.drone.not_seen_timeout && this.shooting_timeout < ending_timeout) {
                            this.shooting_timeout = ending_timeout;

                            console.log("quit by not seen");
                        }
                    }

                    if (this.shooting_delay >= config.drone.shooting_delay) {
                        const target_angle = Math.atan2(player_y - laser_y, player_x - laser_x);
                        const diff = Utils.shortest_angle(this.shooting_angle, target_angle);
                        const speed = Math.min(Utils.lerp(config.drone.laser_min_speed, config.drone.laser_max_speed, this.shooting_timeout / config.drone.shooting_timeout), Math.abs(diff));
                        this.shooting_angle += Utils.sign(diff) * speed;

                        const alpha_coeff = Math.min(Math.min(this.shooting_timeout / config.drone.shooting_ending, 1), (config.drone.shooting_timeout - this.shooting_timeout) / config.drone.shooting_ending);

                        this.laser.texture = resources.sprites["laser_shoot"];
                        this.laser.visible = true;
                        this.laser.rotation = Math.atan2(result[1] - laser_y, result[0] - laser_x);
                        this.laser.scale.x = Utils.distance(laser_x, laser_y, result[0], result[1]) / 2;
                        this.laser.alpha = (0.7 + Math.random() * 0.3) * alpha_coeff;

                        this.effect.x = result[0] - laser_x;
                        this.effect.y = result[1] - laser_y;
                        this.effect.visible = true;
                        this.effect.alpha = this.laser.alpha;

                        if (!state.player.is_dead && !state.player.is_god) {
                            if (Utils.segment_aabb(laser_x, laser_y, result[0], result[1],
                                                   state.player.shape.x + config.player.hitbox_offset, state.player.shape.y + config.player.hitbox_offset,
                                                   state.player.shape.width - config.player.hitbox_offset * 2, state.player.shape.height - config.player.hitbox_offset * 2)) {
                                state.player.is_dead = true;
                                state.player.death_by_energy = true;
                                state.player.death_timeout = config.player.death_by_energy_timeout;
                                state.game.lock_camera = true;
                            }
                        }

                        state.game.lasers.push([ laser_x, laser_y, result[0], result[1] ]);

                        this.shooting_timeout += elapsed_time;
                        if (this.shooting_timeout >= config.drone.shooting_timeout) {
                            console.log("end by timeout");

                            if (distance_to_player <= Utils.sqr(config.drone.activation_radius) && !state.game.physics.raycast_any(laser_x, laser_y, player_x, player_y, collision_mask)) {
                                // Keep activated, but with a little "debuff".
                                this.activated = true;
                                this.activation_timeout = -config.drone.shooting_debuff;
                            } else {
                                // Discard activation as well.
                                this.activation_delay = 0;
                                this.activated = false;
                                this.activation_timeout = 0;
                                this.body.gotoAndPlay("deactivate");
                            }

                            this.shooting = false;
                            this.shooting_delay = 0;
                            this.shooting_timeout = 0;
                            this.shooting_angle = 0;
                            this.not_seen_timeout = 0;
                        }
                    } else {
                        this.shooting_delay += elapsed_time;

                        this.laser.texture = resources.sprites["laser_aim"];
                        this.laser.visible = true;
                        this.laser.rotation = Math.atan2(result[1] - laser_y, result[0] - laser_x);
                        this.laser.scale.x = Utils.distance(laser_x, laser_y, result[0], result[1]) / 2;
                        this.laser.alpha = 0.75;
                    }
                }
            }
        }

        if (!this.body.playing && this.body.animation === "deactivate") {
            this.body.gotoAndPlay("idle");
        }

        // Movement.
        const next = this.path[(this.current_index + 1) % this.path.length];
        if (Utils.equal(next.cx, this.x, 1e-3) && Utils.equal(next.cy, this.y, 1e-3)) {
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
