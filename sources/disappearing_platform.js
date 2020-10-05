import config from "./config";
import MovieClip from "./movie_clip";
import resources from "./resources";
import state from "./state";
import Utils from "./utils";

export default class DisappearingPlatform extends MovieClip {
    constructor(x, y, shapes) {
        resources.sprites["objects_small_platform_disappear_reverse"] =
            resources.sprites["objects_small_platform_disappear_reverse"] || resources.sprites["objects_small_platform_disappear"].slice().reverse();

        super({
            hide: { frames: resources.sprites["objects_small_platform_disappear"], speed: 0.15, loop: false },
            show: { frames: resources.sprites["objects_small_platform_disappear_reverse"], speed: 0.15, loop: false },
        }, "show");

        this.x = x;
        this.y = y;
        this.shape = {
            x: this.x,
            y: this.y,
            width: config.tile_size,
            height: config.tile_size,
            mask: config.collision_types.platform,
        };
        this.timeout_1 = 0;
        this.timeout_2 = 0;

        shapes.push(this.shape);

        this.play();
    }

    update_normal(elapsed_time) {
        if (this.timeout_1 > 1e-8) {
            this.timeout_1 -= elapsed_time;
            if (this.timeout_1 <= 1e-8) {
                this.gotoAndPlay("hide");
                this.timeout_2 = config.disappearing_platform.timeout_2;
                this.shape.mask = 0;
            }
        }

        if (this.timeout_2 > 1e-8) {
            this.timeout_2 -= elapsed_time;
            if (this.timeout_2 <= 1e-8) {
                this.gotoAndPlay("show");
                this.timeout_2 = 0;
                this.shape.mask = config.collision_types.platform;
            }
        }

        if (this.timeout_1 < 1e-8 && this.timeout_2 < 1e-8) {
            if (Utils.aabb(this.shape.x, this.shape.y, this.shape.width, this.shape.height, state.player.shape.x, state.player.shape.y, state.player.shape.width, state.player.shape.height + 1e-5)) {
                if (state.player.shape.y + state.player.shape.height - 1e-5 <= this.shape.y) {
                    this.timeout_1 = config.disappearing_platform.timeout_1;
                }
            }
        }
    }
}
