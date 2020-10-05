import config from "./config";
import MovieClip from "./movie_clip";
import resources from "./resources";
import state from "./state";
import Utils from "./utils";

export default class Checkpoint extends MovieClip {
    constructor(x, y, radius) {
        super({
            inactive: { frames: resources.sprites["objects_large_checkpoint_inactive"], speed: 0.2 },
            active: { frames: resources.sprites["objects_large_checkpoint_active"], speed: 0.2 },
            activate: { frames: resources.sprites["objects_large_checkpoint_activate"], speed: 0.2, loop: false },
        }, "inactive");

        this.x = x;
        this.y = y;
        this.radius = radius * config.tile_size;
        this.bbox = {
            x: x,
            y: y,
            width: config.tile_size * 2,
            height: config.tile_size * 2,
        };
        this.active = false;
        this.play();
    }

    update_normal(elapsed_time) {
        if (!state.player.is_dead) {
            if (!this.active) {
                if (Utils.aabb(state.player.shape.x, state.player.shape.y, state.player.shape.width, state.player.shape.height,
                               this.x, this.y - this.radius, config.tile_size * 2, config.tile_size * 2 + this.radius)) {
                    state.game.checkpoint.levels = [];
                    for (const level_name in state.game.loaded_levels) {
                        if (state.game.loaded_levels.hasOwnProperty(level_name)) {
                            if (level_name.indexOf("-") >= 0) {
                                const pieces = level_name.split("-");
                                state.game.checkpoint.levels.push({
                                    name: pieces[0],
                                    chunk: pieces[1],
                                    x: state.game.loaded_levels[level_name].x,
                                    y: state.game.loaded_levels[level_name].y,
                                });
                            } else {
                                state.game.checkpoint.levels.push({
                                    name: level_name,
                                    chunk: null,
                                    x: state.game.loaded_levels[level_name].x,
                                    y: state.game.loaded_levels[level_name].y,
                                });
                            }
                        }
                    }
                    state.game.checkpoint.origin = { x: state.game.level_origin.x, y: state.game.level_origin.y };
                    state.game.checkpoint.player = { x: this.x + config.tile_size, y: this.y };

                    this.active = true;

                    this.gotoAndPlay("activate")
                }
            } else {
                if (!this.playing) {
                    this.gotoAndPlay("active")
                }
            }
        }
    }
}
