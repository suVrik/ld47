"use strict";

export default class Input {
    constructor() {
        this.keys = {};
        this.previous_keys = {};

        document.body.onkeydown = event => {
            this.keys[event.code || event.which || event.keyCode] = true;

            // We must toggle fullscreen only on user input.
            if (event.code === "KeyF" || event.which === 70 || event.keyCode === 70) {
                // TODO: Toggle fullscreen.
            }

            // We don't want to scroll the page in any direction.
            const is_space = event.code === "Space" || event.which === 32 || event.keyCode === 32;
            const is_left = event.code === "ArrowLeft" || event.which === 37 || event.keyCode === 37;
            const is_up = event.code === "ArrowUp" || event.which === 38 || event.keyCode === 38;
            const is_right = event.code === "ArrowRight" || event.which === 39 || event.keyCode === 39;
            const is_down = event.code === "ArrowDown" || event.which === 40 || event.keyCode === 40;

            return !is_space && !is_left && !is_up && !is_right && !is_down;
        };

        document.body.onkeyup = event => delete this.keys[event.code || event.which || event.keyCode];
    }

    update_normal() {
        for (let key in this.keys) {
            if (this.keys.hasOwnProperty(key)) {
                this.previous_keys[key] = this.keys[key];
            }
        }
        for (let key in this.previous_keys) {
            if (this.previous_keys.hasOwnProperty(key) && !this.keys.hasOwnProperty(key)) {
                delete this.previous_keys[key];
            }
        }
    }

    is_down(code, which) {
        return this.keys.hasOwnProperty(code) || this.keys.hasOwnProperty(which);
    }

    is_pressed(code, which) {
        return (this.keys.hasOwnProperty(code) && !this.previous_keys.hasOwnProperty(code)) ||
               (this.keys.hasOwnProperty(which) && !this.previous_keys.hasOwnProperty(which));
    }

    is_released(code, which) {
        return (!this.keys.hasOwnProperty(code) && this.previous_keys.hasOwnProperty(code)) ||
               (!this.keys.hasOwnProperty(which) && this.previous_keys.hasOwnProperty(which));
    }
}
