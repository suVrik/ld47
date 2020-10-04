"use strict";

import config from "./config";
import Game from "./game";
import Input from "./input";
import * as PIXI from "pixi.js";
import resources from "./resources";
import state from "./state";

// Perform all game initialization here.

function initialize() {
    state.input = new Input();

    state.game = new Game();
    state.game.load_level("Intro", 0, 0);
    state.root.addChild(state.game);
}

// Executed every real frame.

let previous_time = 0;

function update_normal() {
    const now = Date.now();
    const elapsed_time = Math.min(Date.now() - previous_time, 100);
    previous_time = now;

    state.time += elapsed_time;
    state.game.update_normal(elapsed_time / 1000);
    state.input.update_normal();

    state.application.renderer.render(state.root, state.render_target);
}

// Update game's scale.

function update_render_target() {
    const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    const height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

    state.window.scale = 1;
    state.window.width = config.window.width;
    state.window.height = config.window.height;

    do {
        const new_physical_width = config.window.width * (state.window.scale + 1);
        const new_physical_height = config.window.height * (state.window.scale + 1);
        if (new_physical_width <= width && new_physical_height <= height) {
            state.window.scale++;
            state.window.width = new_physical_width;
            state.window.height = new_physical_height;
        } else {
            break;
        }
    } while (state.window.scale < 10);

    state.application.view.style.marginLeft = Math.round(-state.window.width / 2) + "px";
    state.application.view.style.marginTop = Math.round(-state.window.height / 2) + "px";

    state.render_target_sprite.scale.x = state.window.width / config.window.width;
    state.render_target_sprite.scale.y = state.window.height / config.window.height;

    state.application.renderer.resize(state.window.width, state.window.height);

    state.game.resize(width, height);
}

// Perform all system initialization here.

function on_resources_loaded() {
    PIXI.settings.ROUND_PIXELS = true;
    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
    PIXI.settings.FAIL_IF_MAJOR_PERFORMANCE_CAVEAT = false;

    state.application = new PIXI.Application({ width: config.window.width, height: config.window.height, backgroundColor: 0x1C3F53 });
    state.application.view.style.position = "absolute";
    state.application.view.style.top = "50%";
    state.application.view.style.left = "50%";
    state.application.view.onselectstart = () => false;
    state.application.view.oncontextmenu = event => event.preventDefault();
    document.body.appendChild(state.application.view);

    state.stage = state.application.stage;
    state.root = new PIXI.Container();

    state.render_target = PIXI.RenderTexture.create(config.window.width, config.window.height);

    state.render_target_sprite = PIXI.Sprite.from(state.render_target);
    state.render_target_sprite.interactive = true;
    state.application.stage.addChild(state.render_target_sprite);

    initialize();

    window.addEventListener("resize", update_render_target);
    update_render_target();

    state.application.ticker.add(update_normal);
}

resources.callback = on_resources_loaded;

// Apply game scale to input.

const original_map_position_to_point = PIXI.InteractionManager.prototype.mapPositionToPoint;
PIXI.InteractionManager.prototype.mapPositionToPoint = function(point, x, y) {
    original_map_position_to_point.call(this, point, x, y);
    point.x /= state.window.scale;
    point.y /= state.window.scale;
};

// Redirect input to actual hierarchy rather than render target sprite.

const original_process_interactive = PIXI.InteractionManager.prototype.processInteractive;
PIXI.InteractionManager.prototype.processInteractive = function(interactionEvent, displayObject, func, hitTest, interactive) {
    return original_process_interactive.call(this, interactionEvent, state.root || displayObject, func, hitTest, interactive);
};

// Game's background style.

document.body.style.backgroundColor = "#000";
document.body.style.padding = "0";
document.body.style.margin = "0";
