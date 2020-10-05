"use strict";

import {ColorOverlayFilter} from '@pixi/filter-color-overlay';
import config from "./config";
import Level from "./level";
import * as PIXI from "pixi.js";
import Physics from "./physics";
import resources from "./resources";
import state from "./state";
import TriggerManager from "./trigger_manager";
import Utils from "./utils";

export default class Game extends PIXI.Container {
    constructor() {
        super();

        this.layers = new PIXI.Container();
        this.auto_layer = new PIXI.Container();
        this.background_tiles_layer = new PIXI.Container();
        this.entities_layer = new PIXI.Container();
        this.foreground_tiles_layer = new PIXI.Container();
        this.debug_draw_layer = new PIXI.Graphics();

        this.physics = new Physics();
        this.entity_shapes = [];

        // TODO: Come up with a better solution next time.
        const chunk = this.physics.add_chunk(this.entity_shapes);
        chunk.bounding_box.x = -100000;
        chunk.bounding_box.y = -100000;
        chunk.bounding_box.width = 200000;
        chunk.bounding_box.height = 200000;

        this.trigger_manager = new TriggerManager();
        this.entities = [];
        this.level_origin = {
            x: 0,
            y: 0,
        };
        this.loaded_levels = {};
        this.bounding_box = {
            min_x: Infinity,
            min_y: Infinity,
            max_x: -Infinity,
            max_y: -Infinity,
        };

        this.layers.addChild(this.auto_layer);
        this.layers.addChild(this.background_tiles_layer);
        this.layers.addChild(this.entities_layer);
        this.layers.addChild(this.foreground_tiles_layer);
        this.layers.addChild(this.debug_draw_layer);
        this.addChild(this.layers);

        this.cache_tile_textures();

        resources.white_tint = new ColorOverlayFilter(0xFFFFFF);
    }

    update_normal(elapsed_time) {
        for (const entity of this.entities) {
            entity.update_normal(elapsed_time);
        }

        // TODO: Cooler camera code
        if (state.player) {
            this.layers.x = -state.player.x + config.window.width / 2;
            this.layers.y = -state.player.y + config.window.height / 2;

            this.layers.x = Utils.clamp(this.layers.x, -this.bounding_box.max_x + config.window.width, -this.bounding_box.min_x);
            this.layers.y = Utils.clamp(this.layers.y, -this.bounding_box.max_y + config.window.height, -this.bounding_box.min_y);
        }
    }

    resize(width, height) {
        // Might be needed for UI or something...
    }

    add_entity(entity) {
        if (entity instanceof PIXI.DisplayObject) {
            this.entities_layer.addChild(entity);
            this.entities_layer.children.sort((a, b) => {
                return (config.render_priority[a.constructor.name] || 0) - (config.render_priority[b.constructor.name] || 0);
            });
        }

        this.entities.push(entity);
        this.entities.sort((a, b) => {
            return (config.logic_priority[a.constructor.name] || 0) - (config.logic_priority[b.constructor.name] || 0);
        });
    }

    load_level(level_name, x, y) {
        if (!this.loaded_levels.hasOwnProperty(level_name)) {
            if (resources.levels.hasOwnProperty(level_name)) {
                console.log(`Loading level ${level_name}...`);

                const chunk = {
                    x: 0,
                    y: 0,
                    width: resources.levels[level_name].width * config.tile_size,
                    height: resources.levels[level_name].height * config.tile_size,
                }

                this.loaded_levels[level_name] = new Level(resources.levels[level_name], x, y, chunk);

                this.recompute_bounding_box();
            } else {
                console.error(`Invalid level ${level_name} specified`);
            }
        }
    }

    load_level_chunk(level_name, chunk_name) {
        const complete_name = `${level_name}-${chunk_name}`;
        if (!this.loaded_levels.hasOwnProperty(complete_name)) {
            if (resources.levels.hasOwnProperty(level_name) && config.chunks.hasOwnProperty(chunk_name)) {
                console.log(`Loading level chunk ${level_name}-${chunk_name}...`);

                this.loaded_levels[complete_name] = new Level(resources.levels[level_name], this.level_origin.x, this.level_origin.y, config.chunks[chunk_name]);

                this.recompute_bounding_box();
            } else {
                console.error(`Invalid level chunk ${level_name}-${chunk_name} specified`);
            }
        }
    }

    unload_level(level_name) {
        if (this.loaded_levels.hasOwnProperty(level_name)) {
            console.log(`Unload level ${level_name}...`);

            this.loaded_levels[level_name].unload();
            delete this.loaded_levels[level_name];

            this.recompute_bounding_box();

            const before = this.entities.length;
            const before_2 = state.game.entity_shapes.length;
            for (let i = 0; i < this.entities.length; i++) {
                if (this.entities[i].hasOwnProperty("shape")) {
                    let ok = false;
                    for (const level in this.loaded_levels) {
                        if (this.loaded_levels.hasOwnProperty(level)) {
                            const entity = this.entities[i].shape;
                            const box = this.loaded_levels[level].bounding_box;
                            if (Utils.aabb(entity.x, entity.y, entity.width, entity.height, box.min_x, box.min_y, box.max_x - box.min_x, box.max_y - box.min_y)) {
                                ok = true;
                                break;
                            }
                        }
                    }
                    if (!ok) {
                        if (this.entities[i].hasOwnProperty("parent")) {
                            this.entities[i].parent.removeChild(this.entities[i]);
                        }
                        if (typeof this.entities[i] === "function") {
                            this.entities[i].destroy({ children: true });
                        }
                        if (this.entities[i].shape.hasOwnProperty("mask")) {
                            const index = state.game.entity_shapes.indexOf(this.entities[i].shape);
                            if (index >= 0) {
                                state.game.entity_shapes.splice(index, 1);
                            }
                        }
                        this.entities.splice(i, 1);
                        i--;
                    }
                } else {
                    console.error("Every entity must have a shape property for clean up")
                }
            }
            console.log(`${before - this.entities.length} entities cleaned up, ${this.entities.length} are left`);
            console.log(`${before_2 - state.game.entity_shapes.length} entity shapes cleaned up, ${state.game.entity_shapes.length} are left`);
        }
    }

    unload_all_levels() {
        const level_names = [];
        for (const level_name in this.loaded_levels) {
            if (this.loaded_levels.hasOwnProperty(level_name)) {
                level_names.push(level_name);
            }
        }
        for (const level_name of level_names) {
            this.unload_level(level_name);
        }
    }

    cache_tile_textures() {
        resources.tiles = [];

        const tileset = resources.sprites["tileset"];
        const tileset_width = tileset.width / config.tile_size;
        const tileset_height = tileset.height / config.tile_size;
        for (let y = 0; y < tileset_height; y++) {
            for (let x = 0; x < tileset_width; x++) {
                const texture = new PIXI.Texture(tileset, tileset.frame.clone());
                texture.frame.x += x * config.tile_size;
                texture.frame.y += y * config.tile_size;
                texture.frame.width = texture.frame.height = config.tile_size;
                texture.updateUvs();

                resources.tiles.push(texture);
            }
        }
    }

    recompute_bounding_box() {
        this.bounding_box.min_x = Infinity;
        this.bounding_box.min_y = Infinity;
        this.bounding_box.max_x = -Infinity;
        this.bounding_box.max_y = -Infinity;

        for (const level in this.loaded_levels) {
            if (this.loaded_levels.hasOwnProperty(level)) {
                this.bounding_box.min_x = Math.min(this.bounding_box.min_x, this.loaded_levels[level].bounding_box.min_x);
                this.bounding_box.min_y = Math.min(this.bounding_box.min_y, this.loaded_levels[level].bounding_box.min_y);
                this.bounding_box.max_x = Math.max(this.bounding_box.max_x, this.loaded_levels[level].bounding_box.max_x);
                this.bounding_box.max_y = Math.max(this.bounding_box.max_y, this.loaded_levels[level].bounding_box.max_y);
            }
        }
    }
}
