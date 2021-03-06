import config from "./config";
import MovieClip from "./movie_clip";
import * as PIXI from "pixi.js";
import resources from "./resources";
import state from "./state";
import Utils from "./utils";

export default class Spike extends PIXI.Container {
    constructor(x, y, width, height, is_side) {
        super();

        this.goo = new PIXI.AnimatedSprite(resources.sprites["objects_tall_goo_black"]);
        this.goo.animationSpeed = 0.2;
        this.goo.loop = false;
        this.goo.y = -7;
        this.addChild(this.goo);

        resources.sprites["objects_small_hands_appear_reverse"] =
            resources.sprites["objects_small_hands_appear_reverse"] || resources.sprites["objects_small_hands_appear"].slice().reverse();

        this.hands = new MovieClip({
            show: { frames: resources.sprites["objects_small_hands_appear"], speed: 0.1, loop: false },
            hide: { frames: resources.sprites["objects_small_hands_appear_reverse"], speed: 0.1, loop: false },
            active: { frames: resources.sprites["objects_small_hands_grab"], speed: 0.15 },
        }, "active");
        this.hands.visible = false;
        this.hands.y = -4;
        this.addChild(this.hands);

        if (height > 1) {
            this.rotation = Math.PI / 2;
        }

        this.x = x;
        this.y = y;
        this.bbox = {
            x: this.x,
            y: this.y,
            width: config.tile_size,
            height: config.tile_size,
        };
        this.pending_to_initialize = true;
        this.is_side = is_side;
    }

    update_normal(elapsed_time) {
        // Avoid constructor. Wait for physics.
        if (this.pending_to_initialize) {
            if (this.rotation === 0) {
                if (state.game.physics.point_any(this.x + config.tile_size / 2, this.y - config.tile_size / 2, config.collision_types.environment)) {
                    this.scale.y = -1;
                    this.pivot.y = 25;
                } else {
                    this.pivot.y = 9;
                }
            } else {
                if (state.game.physics.point_any(this.x - config.tile_size / 2, this.y + config.tile_size / 2, config.collision_types.environment)) {
                    this.pivot.x = 0;
                    this.pivot.y = 25;
                } else {
                    this.rotation = -Math.PI / 2;
                    this.pivot.x = 16;
                    this.pivot.y = 9;
                }
            }
            delete this.pending_to_initialize;
        }

        if (!this.goo.playing && Math.random() < 0.01) {
            this.goo.gotoAndPlay(0);
        }

        if (Utils.square_distance(state.player.x, state.player.y - config.player.height / 2, this.x + config.tile_size / 2, this.y + config.tile_size / 2) < Utils.sqr(config.spikes.appear_distance)) {
            if (!this.hands.visible) {
                this.hands.visible = true;
                this.hands.gotoAndPlay("show")
            } else {
                if (!this.hands.playing) {
                    this.hands.gotoAndPlay("active")
                }
            }
        } else {
            if (this.hands.visible) {
                if (this.hands.animation === "hide" && !this.hands.playing) {
                    this.hands.visible = false;
                } else {
                    this.hands.gotoAndPlay("hide")
                }
            }
        }

        if (!state.player.is_dead && !state.player.is_god) {
            const __width = this.is_side ? config.spikes.width : config.tile_size;

            if (this.rotation !== 0) {
                // horizontal

                if (Utils.aabb(this.x - (config.spikes.length - config.tile_size) / 2, this.y + (config.tile_size - __width) / 2, config.spikes.length, __width,
                               state.player.shape.x + config.player.hitbox_offset, state.player.shape.y + config.player.hitbox_offset,
                               state.player.shape.width - config.player.hitbox_offset * 2, state.player.shape.height - config.player.hitbox_offset * 2)) {
                    state.player.is_dead = true;
                    state.player.death_by_spikes = true;
                    state.player.velocity_x = 0;
                    state.player.velocity_y = 0;
                    state.player.y = this.y + config.tile_size / 2;
                    state.player.rotation = this.rotation;
                    if (this.rotation < 0) {
                        state.player.x = this.x + 3;
                    } else {
                        state.player.x = this.x + 13;
                    }
                    state.game.lock_camera = true;
                    state.player.death_timeout = config.player.death_by_spikes_timeout;
                }

                if (state.game.hasOwnProperty("debug_draw_layer")) {
                    state.game.debug_draw_layer.beginFill(0xFF0000);
                    state.game.debug_draw_layer.drawRect(this.x - (config.spikes.length - config.tile_size) / 2, this.y + (config.tile_size - __width) / 2, config.spikes.length, __width);
                    state.game.debug_draw_layer.endFill();
                }
            } else {
                // vertical

                if (Utils.aabb(this.x + (config.tile_size - __width) / 2, this.y - (config.spikes.length - config.tile_size) / 2, __width, config.spikes.length,
                               state.player.shape.x + config.player.hitbox_offset, state.player.shape.y + config.player.hitbox_offset,
                               state.player.shape.width - config.player.hitbox_offset * 2, state.player.shape.height - config.player.hitbox_offset * 2)) {
                    state.player.is_dead = true;
                    state.player.death_by_spikes = true;
                    state.player.velocity_x = 0;
                    state.player.velocity_y = 0;
                    state.player.x = this.x + config.tile_size / 2;
                    if (this.scale.y < 0) {
                        state.player.scale.y = -1;
                        state.player.y = this.y + 13;
                    } else {
                        state.player.y = this.y + 3;
                    }
                    state.game.lock_camera = true;
                    state.player.death_timeout = config.player.death_by_spikes_timeout;
                }

                if (state.game.hasOwnProperty("debug_draw_layer")) {
                    state.game.debug_draw_layer.beginFill(0xFF0000);
                    state.game.debug_draw_layer.drawRect(this.x + (config.tile_size - __width) / 2, this.y - (config.spikes.length - config.tile_size) / 2, __width, config.spikes.length);
                    state.game.debug_draw_layer.endFill();
                }
            }
        }
    }
}
