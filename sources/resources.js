"use strict";

import * as PIXI from "pixi.js";
import { Howl, Howler } from "howler";

const resources = {
    sprites: {},
    sounds: {},
    levels: {},
    callback: null,
};

function resources_loaded() {
    if (resources.callback !== null) {
        resources.callback();
        delete resources.callback;
    }
}

let is_sprites_loaded = false;
let is_sounds_loaded = false;
let is_levels_loaded = false;

function sprites_loaded(loader, loaded) {
    for (const key in loaded) {
        if (loaded.hasOwnProperty(key) === true) {
            if (loaded[key].hasOwnProperty("spritesheet") === true) {
                for (const name in loaded[key].spritesheet.textures) {
                    if (loaded[key].spritesheet.textures.hasOwnProperty(name) === true) {
                        resources.sprites[name] = loaded[key].spritesheet.textures[name];

                        if (name.endsWith("_0")) {
                            const base_name = name.substr(0, name.length - 2);
                            const animation = [];

                            let index = 0;
                            while (index < 64) {
                                if (loaded[key].spritesheet.textures.hasOwnProperty(`${base_name}_${index}`) === false) {
                                    break;
                                }

                                const frame = loaded[key].spritesheet.textures[`${base_name}_${index}`];
                                animation.push(frame);

                                index++;
                            }

                            resources.sprites[base_name] = animation;
                        }
                    }
                }
            }
        }
    }

    is_sprites_loaded = true;
    if (is_sprites_loaded === true && is_sounds_loaded === true && is_levels_loaded === true) {
        resources_loaded();
    }
}

PIXI.Loader.shared
    .add("upheaval", "font.xml")
    .add("atlas.json")
    .load(sprites_loaded);

function sounds_loaded() {
    is_sounds_loaded = true;
    if (is_sprites_loaded === true && is_sounds_loaded === true && is_levels_loaded === true) {
        resources_loaded();
    }
}

let total_sounds = 0;
let loaded_sounds = 0;

function load_sound(name, volume = 1.0, extension = "wav", loop = false) {
    total_sounds++;
    resources.sounds[name] = new Howl({
        src: [ `${name}.${extension}` ],
        autoplay: loop,
        loop: loop,
        volume: volume,
        onload: function() {
            if (++loaded_sounds === total_sounds) {
                sounds_loaded();
            }
        },
    });
}

load_sound("test", 1.0);

function load_level(path) {
    const client = new XMLHttpRequest();
    client.open("GET", path);
    client.onload = function() {
        resources.levels = JSON.parse(client.responseText).levels;

        is_levels_loaded = true;
        if (is_sprites_loaded === true && is_sounds_loaded === true && is_levels_loaded === true) {
            resources_loaded();
        }
    };
    client.send();
}

load_level("levels.json");

export default resources;
