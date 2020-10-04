"use strict";

import BreakingTile from "./breaking_tile";
import config from "./config";
import * as PIXI from "pixi.js";
import Player from "./player";
import resources from "./resources";
import state from "./state";
import TriggerZone from "./trigger_zone";
import Utils from "./utils";

export default class Level {
    // `chunk` is specified in level space.
    constructor(prototype, x, y, chunk_x, chunk_y, chunk_width, chunk_height) {
        this.x = x;
        this.y = y;
        this.shapes = [];
        this.bounding_box = {
            min_x: x + chunk_x,
            min_y: y + chunk_y,
            max_x: x + chunk_x + chunk_width,
            max_y: y + chunk_y + chunk_height,
        };

        this.auto_layer = new PIXI.Container();
        this.background_tiles_layer = new PIXI.Container();
        this.foreground_tiles_layer = new PIXI.Container();

        this.load_grid(prototype.layers["Grid"], chunk_x, chunk_y, chunk_width, chunk_height);
        this.load_auto_layer(prototype.layers["AutoLayer"], chunk_x, chunk_y, chunk_width, chunk_height);
        this.load_tile_layer(prototype.layers["BackgroundTiles"], this.background_tiles_layer, chunk_x, chunk_y, chunk_width, chunk_height);
        this.load_entities(prototype.layers["Entities"], chunk_x, chunk_y, chunk_width, chunk_height);
        this.load_tile_layer(prototype.layers["ForegroundTiles"], this.foreground_tiles_layer, chunk_x, chunk_y, chunk_width, chunk_height);

        this.auto_layer.x = x;
        this.auto_layer.y = y;
        this.background_tiles_layer.x = x;
        this.background_tiles_layer.y = y;
        this.foreground_tiles_layer.x = x;
        this.foreground_tiles_layer.y = y;

        state.game.auto_layer.addChild(this.auto_layer);
        state.game.background_tiles_layer.addChild(this.background_tiles_layer);
        state.game.foreground_tiles_layer.addChild(this.foreground_tiles_layer);

        state.game.physics.add_chunk(this.shapes);
    }

    update_normal(elapsed_time) {
        // TODO: Perhaps perform culling?
    }

    load_grid(layer_prototype, chunk_x, chunk_y, chunk_width, chunk_height) {
        for (const rectangle of layer_prototype) {
            const shape = {
                x: this.x + rectangle.x * config.tile_size,
                y: this.y + rectangle.y * config.tile_size,
                width: rectangle.width * config.tile_size,
                height: rectangle.height * config.tile_size,
                mask: config.collision_types.environment,
            };

            if (Utils.aabb(shape.x, shape.y, shape.width, shape.height,
                           this.x + chunk_x, this.y + chunk_y, chunk_width, chunk_height)) {
                this.shapes.push(shape);
            }
        }
    }

    load_auto_layer(layer_prototype, chunk_x, chunk_y, chunk_width, chunk_height) {
        const x_min = chunk_x / config.tile_size;
        const y_min = chunk_y / config.tile_size;
        const x_max = x_min + chunk_width / config.tile_size;
        const y_max = y_min + chunk_height / config.tile_size;
        for (let y = y_min; y < y_max; y++) {
            for (let x = x_min; x < x_max; x++) {
                const tile_index = layer_prototype[y][x];
                if (tile_index >= 0) {
                    const sprite = new PIXI.Sprite(resources.tiles[tile_index]);
                    sprite.x = x * config.tile_size;
                    sprite.y = y * config.tile_size;
                    this.auto_layer.addChild(sprite);
                }
            }
        }
    }

    load_tile_layer(layer_prototype, layer, chunk_x, chunk_y, chunk_width, chunk_height) {
        for (let y in layer_prototype) {
            if (layer_prototype.hasOwnProperty(y)) {
                for (let x in layer_prototype[y]) {
                    if (layer_prototype[y].hasOwnProperty(x)) {
                        const local_x = x * config.tile_size;
                        const local_y = y * config.tile_size;
                        if (local_x >= chunk_x && local_y >= chunk_y && local_x < chunk_x + chunk_width && local_y < chunk_y + chunk_height) {
                            const tile_index = layer_prototype[y][x];
                            if (tile_index >= 0) {
                                const sprite = new PIXI.Sprite(resources.tiles[tile_index]);
                                sprite.x = local_x;
                                sprite.y = local_y;
                                layer.addChild(sprite);
                            }
                        }
                    }
                }
            }
        }
    }

    load_entities(layer_prototype, chunk_x, chunk_y, chunk_width, chunk_height) {
        for (const entity_prototype of layer_prototype) {
            if (entity_prototype.x >= chunk_x && entity_prototype.y >= chunk_y &&
                entity_prototype.x < chunk_x + chunk_width && entity_prototype.y < chunk_y + chunk_height) {
                switch (entity_prototype.name) {
                    case "Platform":
                        this.shapes.push({
                            x: this.x + entity_prototype.x,
                            y: this.y + entity_prototype.y,
                            width: entity_prototype.fields["Width"] * config.tile_size,
                            height: config.tile_size,
                            mask: config.collision_types.platform,
                        });
                        break;
                    case "BreakingTiles":
                        const width = entity_prototype.fields["Width"];
                        const height = entity_prototype.fields["Height"];
                        for (let y = 0; y < height; y++) {
                            for (let x = 0; x < width; x++) {
                                state.game.add_entity(new BreakingTile(
                                    this.x + entity_prototype.x + x * config.tile_size,
                                    this.y + entity_prototype.y + y * config.tile_size,
                                    this.shapes
                                ));
                            }
                        }
                        break;
                    case "Player":
                        state.game.add_entity(new Player(entity_prototype.x, entity_prototype.y));
                        break;
                    case "TriggerZone":
                        state.game.add_entity(new TriggerZone(
                            this.x + entity_prototype.x,
                            this.y + entity_prototype.y,
                            entity_prototype.fields["Width"] * config.tile_size,
                            entity_prototype.fields["Height"] * config.tile_size,
                            entity_prototype.fields["Trigger"],
                            entity_prototype.fields["Mode"]
                        ));
                        break;
                    case "LoadLevel":
                        state.game.trigger_manager.subscribe(entity_prototype.fields["Trigger"], () => {
                            state.game.load_level(
                                entity_prototype.fields["LevelName"],
                                this.x + entity_prototype.x + entity_prototype.fields["HorizontalOffset"] * config.tile_size,
                                this.y + entity_prototype.y + entity_prototype.fields["VerticalOffset"] * config.tile_size
                            );
                        });
                        break;
                    case "UnloadLevel":
                        state.game.trigger_manager.subscribe(entity_prototype.fields["Trigger"], () => {
                            state.game.unload_level(entity_prototype.fields["LevelName"]);
                        });
                        break;
                    case "LoadLevelChunk":
                        state.game.trigger_manager.subscribe(entity_prototype.fields["Trigger"], () => {
                            state.game.load_level_chunk(entity_prototype.fields["LevelName"], entity_prototype.fields["LevelChunk"]);
                        });
                        break;
                    case "UnloadLevelChunk":
                        state.game.trigger_manager.subscribe(entity_prototype.fields["Trigger"], () => {
                            state.game.unload_level(`${entity_prototype.fields["LevelName"]}-${entity_prototype.fields["LevelChunk"]}`);
                        });
                        break;
                    case "DefineLevelOrigin":
                        state.game.level_origin.x = this.x + entity_prototype.x + entity_prototype.fields["HorizontalOffset"] * config.tile_size;
                        state.game.level_origin.y = this.y + entity_prototype.y + entity_prototype.fields["VerticalOffset"] * config.tile_size;
                        break;
                    default:
                        console.warn(`Unknown entity type ${entity_prototype.name}`)
                }
            }
        }
    }

    unload() {
        state.game.physics.remove_chunk(this.shapes);

        this.auto_layer.parent.removeChild(this.auto_layer);
        this.background_tiles_layer.parent.removeChild(this.background_tiles_layer);
        this.foreground_tiles_layer.parent.removeChild(this.foreground_tiles_layer);

        // Entities are managed by Game.
    }
}
