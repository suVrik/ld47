"use strict";

export default {
    tile_size: 16,
    window: {
        width: 480,
        height: 270,
    },
    grid: {
        ground: 0,
        spikes: 1,
        platform: 2,
        breaking_tiles: 3,
    },
    collision_types: {
        none: 0x00000000,
        environment: 0x00000001,
        platform: 0x00000002,
        player: 0x00000004,
        enemies: 0x00000008,
    },
    chunks: {
        TopLeft: {
            x: 0,
            y: 0,
            width: 576,
            height: 416,
        },
        TopCenter: {
            x: 576,
            y: 0,
            width: 560,
            height: 416,
        },
        TopRight: {
            x: 1136,
            y: 0,
            width: 576,
            height: 416,
        },
        MiddleLeft: {
            x: 0,
            y: 416,
            width: 576,
            height: 400,
        },
        MiddleCenter: {
            x: 576,
            y: 416,
            width: 560,
            height: 400,
        },
        MiddleRight: {
            x: 1136,
            y: 416,
            width: 576,
            height: 400,
        },
        BottomLeft: {
            x: 0,
            y: 816,
            width: 576,
            height: 416,
        },
        BottomCenter: {
            x: 576,
            y: 816,
            width: 560,
            height: 416,
        },
        BottomRight: {
            x: 1136,
            y: 816,
            width: 576,
            height: 416,
        },
    },
    logic_priority: {
        Player: 0,
        BreakingTile: 1,
        TriggerZone: 2,
    },
    render_priority: {
        BreakingTile: 0,
        Player: 1,
    },
    player: {
        width: 12,
        height: 16,
        acceleration: 300, // px/sec^2
        speed: 150, // px/sec
        jump: 210, // px/sec
        gravity: 800, // px/sec^2
        pressure: 50, // px/sec
        gravity_factor: 0.5,
        attack_timeout: 0.125, // sec
        attack_velocity_short: 18, // px/sec
        attack_velocity_long: 22, // px/sec
        attack_velocity_falling_short: 0.5,
        attack_velocity_falling_long: 0.8,
        attack_slowdown_timeout: 0.6, // sec
        attack_slowdown_factor: 0.35,
        attack_range: 5, // px
    },
    spikes: {
        appear_distance: 100,
    },
    zombie: {
        width: 12,
        height: 16,
        speed: 10, // px/sec
    },
    hazard: {
        width: 16,
        height: 16,
    },
};
