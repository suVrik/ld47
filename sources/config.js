"use strict";

export default {
    tile_size: 16,
    window: {
        width: 480,
        height: 270,
    },
    collision_types: {
        none: 0x00000000,
        environment: 0x00000001,
        platform: 0x00000002,
    },
    chunks: {
        TopLeft: {
            x: 0,
            y: 0,
            width: 36,
            height: 26,
        },
        TopCenter: {
            x: 36,
            y: 0,
            width: 35,
            height: 26,
        },
        TopRight: {
            x: 71,
            y: 0,
            width: 36,
            height: 26,
        },
        MiddleLeft: {
            x: 0,
            y: 26,
            width: 36,
            height: 25,
        },
        MiddleCenter: {
            x: 36,
            y: 26,
            width: 35,
            height: 25,
        },
        MiddleRight: {
            x: 71,
            y: 26,
            width: 36,
            height: 25,
        },
        BottomLeft: {
            x: 0,
            y: 51,
            width: 36,
            height: 26,
        },
        BottomCenter: {
            x: 36,
            y: 51,
            width: 35,
            height: 26,
        },
        BottomRight: {
            x: 71,
            y: 51,
            width: 36,
            height: 26,
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
};
