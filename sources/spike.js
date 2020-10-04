import config from "./config";
import MovieClip from "./movie_clip";
import * as PIXI from "pixi.js";
import resources from "./resources";
import state from "./state";
import Utils from "./utils";

export default class Spike extends PIXI.Container {
    constructor(x, y, width, height) {
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
        this.pending_to_initialize = true;
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
    }
}
