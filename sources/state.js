"use strict";

import config from "./config";

export default {
    stage: null,
    application: null,
    render_target: null,
    render_target_sprite: null,
    root: null,
    window: {
        width: config.window.width,
        height: config.window.height,
        scale: 1,
    },
    time: 0,
    input: null,
    game: null,
    player: null,
};
