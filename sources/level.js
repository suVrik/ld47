"use strict";

import BreakingTile from "./breaking_tile";
import Checkpoint from "./checkpoint";
import Coin from "./coin";
import config from "./config";
import DisappearingPlatform from "./disappearing_platform";
import Drone from "./drone";
import Hazard from "./hazard";
import MovingPlatform from "./moving_platform";
import * as PIXI from "pixi.js";
import Player from "./player";
import resources from "./resources";
import Spike from "./spike";
import state from "./state";
import TriggerZone from "./trigger_zone";
import Zombie from "./zombie";

export default class Level {
    // `chunk` is specified in level space.
    constructor(prototype, x, y, chunk) {
        this.x = x;
        this.y = y;
        this.shapes = [];
        this.bounding_box = {
            min_x: x + chunk.x,
            min_y: y + chunk.y,
            max_x: x + chunk.x + chunk.width,
            max_y: y + chunk.y + chunk.height,
        };

        this.auto_layer = new PIXI.Container();
        this.background_tiles_layer = new PIXI.Container();
        this.foreground_tiles_layer = new PIXI.Container();

        this.load_grid(prototype.layers["Grid"], chunk);
        this.load_auto_layer(prototype.layers["AutoLayer"], chunk);
        this.load_tile_layer(prototype.layers["BackgroundTiles"], this.background_tiles_layer, chunk);
        this.load_entities(prototype.layers["Entities"], chunk);
        this.load_tile_layer(prototype.layers["ForegroundTiles"], this.foreground_tiles_layer, chunk);

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

    load_grid(layer_prototype, chunk) {
        for (const rectangle of layer_prototype) {
            switch (rectangle.value) {
                case config.grid.ground:
                    this.add_physics(rectangle, config.collision_types.environment, chunk);
                    break;
                case config.grid.spikes:
                    this.for_each_tile(rectangle, chunk, (x, y, is_side) => {
                        state.game.add_entity(new Spike(x, y, rectangle.width, rectangle.height, is_side));
                    });
                    this.add_physics(rectangle, config.collision_types.spikes, chunk);
                    break;
                case config.grid.platform:
                    this.add_physics(rectangle, config.collision_types.platform, chunk);
                    break;
                case config.grid.breaking_tiles:
                    this.for_each_tile(rectangle, chunk, (x, y) => {
                        state.game.add_entity(new BreakingTile(x, y));
                    });
                    break;
                case config.grid.disappearing_platforms:
                    this.for_each_tile(rectangle, chunk, (x, y) => {
                        state.game.add_entity(new DisappearingPlatform(x, y));
                    });
                    break;
                default:
                    console.warn(`Unknown grid type ${rectangle.value}`)
            }
        }
    }

    load_auto_layer(layer_prototype, chunk) {
        const x_min = chunk.x / config.tile_size;
        const y_min = chunk.y / config.tile_size;
        const x_max = x_min + chunk.width / config.tile_size;
        const y_max = y_min + chunk.height / config.tile_size;
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

    load_tile_layer(layer_prototype, layer, chunk) {
        for (let y in layer_prototype) {
            if (layer_prototype.hasOwnProperty(y)) {
                for (let x in layer_prototype[y]) {
                    if (layer_prototype[y].hasOwnProperty(x)) {
                        const local_x = x * config.tile_size;
                        const local_y = y * config.tile_size;
                        if (local_x >= chunk.x && local_y >= chunk.y && local_x < chunk.x + chunk.width && local_y < chunk.y + chunk.height) {
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

    load_entities(layer_prototype, chunk) {
        for (const entity_prototype of layer_prototype) {
            if (entity_prototype.x >= chunk.x && entity_prototype.y >= chunk.y &&
                entity_prototype.x < chunk.x + chunk.width && entity_prototype.y < chunk.y + chunk.height) {
                switch (entity_prototype.name) {
                    case "Player":
                        state.game.add_entity(new Player(this.x + entity_prototype.x, this.y + entity_prototype.y));
                        break;
                    case "Zombie":
                        state.game.add_entity(new Zombie(
                            this.x + entity_prototype.x,
                            this.y + entity_prototype.y,
                            entity_prototype.fields["Destination"],
                            entity_prototype.fields["InitialPosition"],
                            entity_prototype.fields["IdleDuration"],
                            entity_prototype.fields["FaceRight"],
                            this.x
                        ));
                        break;
                    case "Hazard":
                        state.game.add_entity(new Hazard(
                            this.x + entity_prototype.x,
                            this.y + entity_prototype.y,
                            entity_prototype.fields["Path"],
                            entity_prototype.fields["Speed"],
                            this.x,
                            this.y
                        ));
                        break;
                    case "Drone":
                        state.game.add_entity(new Drone(
                            this.x + entity_prototype.x,
                            this.y + entity_prototype.y,
                            entity_prototype.fields["Path"],
                            this.x,
                            this.y
                        ));
                        break;
                    case "Coin":
                        state.game.add_entity(new Coin(
                            this.x + entity_prototype.x,
                            this.y + entity_prototype.y
                        ));
                        break;
                    case "MovingPlatform":
                        state.game.add_entity(new MovingPlatform(
                            this.x + entity_prototype.x,
                            this.y + entity_prototype.y,
                            entity_prototype.fields["Path"],
                            entity_prototype.fields["Speed"],
                            entity_prototype.fields["WaitTime"],
                            entity_prototype.fields["StartIdx"],
                            entity_prototype.fields["EndIdx"],
                            this.x,
                            this.y
                        ));
                        break;
                    case "Checkpoint":
                        state.game.add_entity(new Checkpoint(
                            this.x + entity_prototype.x,
                            this.y + entity_prototype.y,
                            entity_prototype.fields["Radius"]
                        ));
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

        this.auto_layer.destroy({ children: true });
        this.background_tiles_layer.destroy({ children: true });
        this.foreground_tiles_layer.destroy({ children: true });

        // Entities are managed by Game.
    }

    add_physics(rectangle, mask, chunk) {
        const min_x = Math.max(rectangle.x * config.tile_size, chunk.x);
        const min_y = Math.max(rectangle.y * config.tile_size, chunk.y);
        const max_x = Math.min((rectangle.x + rectangle.width) * config.tile_size, chunk.x + chunk.width);
        const max_y = Math.min((rectangle.y + rectangle.height) * config.tile_size, chunk.y + chunk.height);

        if (min_x < max_x && min_y < max_y) {
            const shape = {
                x: this.x + min_x,
                y: this.y + min_y,
                width: max_x - min_x,
                height: max_y - min_y,
                mask: mask,
            };

            this.shapes.push(shape);
        }
    }

    for_each_tile(rectangle, chunk, callback) {
        for (let y = 0; y < rectangle.height; y++) {
            for (let x = 0; x < rectangle.width; x++) {
                const local_x = (rectangle.x + x) * config.tile_size;
                const local_y = (rectangle.y + y) * config.tile_size;
                if (local_x >= chunk.x && local_y >= chunk.y && local_x < chunk.x + chunk.width && local_y < chunk.y + chunk.height) {
                    callback(this.x + local_x, this.y + local_y,
                        rectangle.width > 1 ? (x === 0 || x + 1 === rectangle.width) : (y === 0 || y + 1 === rectangle.height));
                }
            }
        }
    }
}
