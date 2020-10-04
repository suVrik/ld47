"use strict";

const CopyPlugin = require("copy-webpack-plugin");
const fs = require("fs");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { packAsync } = require("free-tex-packer-core");
const path = require("path");

class TexturePackerPlugin {
    constructor(directory) {
        this.directory = directory;
    }

    apply(compiler) {
        compiler.hooks.emit.tapPromise("TexturePacker", async compilation => {
            let sprites = [];

            fs.readdirSync(this.directory).forEach(file => {
                const absolute_path = path.join(this.directory, file);
                const file_contents = fs.readFileSync(absolute_path);
                sprites.push({ path: file, contents: file_contents });
            });

            const packing_options = {
                textureName: "atlas",
                width: 4096,
                height: 4096,
                allowRotation: false,
                exporter: "Pixi",
                removeFileExtension: true,
                prependFolderName: false,
            };

            const current_time = (new Date()).toLocaleString();
            console.log(`Build texture atlas with ${sprites.length} sprites at:\x1b[32m ${current_time}\x1b[0m`);

            try {
                const files = await packAsync(sprites, packing_options);
                for (const item of files) {
                    let output_buffer = item.buffer;

                    if (item.name.includes(".json")) {
                        const object = JSON.parse(item.buffer);
                        output_buffer = JSON.stringify(object);
                    }

                    compilation.assets[item.name] = {
                        source: () => output_buffer,
                        size: () => output_buffer.length,
                    };
                }
            }
            catch (error) {
                console.error("Texture packer failed!", error);
            }
        });

        compiler.hooks.afterEmit.tapPromise("TexturePacker", async compilation => {
            compilation.contextDependencies.add(this.directory);
        });
    }
}

class LevelPackerPlugin {
    constructor(directory) {
        this.directory = directory;
    }

    apply(compiler) {
        compiler.hooks.emit.tapPromise("LevelPacker", async compilation => {
            let levels = [];

            fs.readdirSync(this.directory).forEach(file => {
                const absolute_path = path.join(this.directory, file);
                const file_contents = fs.readFileSync(absolute_path, "utf8");
                levels.push({ path: file, contents: file_contents });
            });

            const current_time = (new Date()).toLocaleString();
            console.log(`Build ${levels.length} levels at:\x1b[32m ${current_time}\x1b[0m`);

            try {
                for (const level of levels) {
                    const input = JSON.parse(level.contents);

                    const output_levels = {};
                    for (const input_level of input["levels"]) {
                        const output_layers = {};
                        for (const input_layer of input_level["layerInstances"]) {
                            const size = input_layer["__gridSize"];
                            const width = Math.ceil(input_level["pxWid"] / size);
                            const height = Math.ceil(input_level["pxHei"] / size);

                            if (input_layer["__type"] === "IntGrid") {
                                const output_grid = Array.apply(null, Array(height)).map(() => Array(width).fill(-1));
                                for (const input_cell of input_layer["intGrid"]) {
                                    const input_index = input_cell["coordId"];
                                    const x = Math.floor(input_index % width);
                                    const y = Math.floor(input_index / width);
                                    if (x >= 0 && x < width && y >= 0 && y < height) {
                                        output_grid[y][x] = input_cell["v"];
                                    }
                                }

                                // Warning: This is a custom LD47 code that converts 2D integer grid into
                                //   array of rectangles. Taken from skateboard cat prototype.
                                const filled = [];
                                for (let i = 0; i < height; i++) {
                                    filled[i] = Array(width).fill(false);
                                }

                                const rectangles = [];
                                for (let i = 0; i < height; i++) {
                                    for (let j = 0; j < width; j++) {
                                        // Negative number is absence of any integer grid.
                                        if (filled[i][j] === false && output_grid[i][j] >= 0) {
                                            const value = output_grid[i][j];

                                            let max_rows = height;
                                            let max_columns = width;

                                            for (let k = i; k < max_rows; k++) {
                                                for (let l = j; l < max_columns; l++) {
                                                    if (output_grid[k][l] !== value) {
                                                        if (k === i) {
                                                            max_columns = l;
                                                        } else {
                                                            max_rows = k;
                                                        }
                                                        break;
                                                    }
                                                }
                                            }

                                            for (let k = i; k < max_rows; k++) {
                                                for (let l = j; l < max_columns; l++) {
                                                    filled[k][l] = true;
                                                }
                                            }

                                            rectangles.push({ x: j, y: i, width: max_columns - j, height: max_rows - i, value: value });
                                        }
                                    }
                                }

                                output_layers[input_layer["__identifier"]] = rectangles;
                            } else if (input_layer["__type"] === "Tiles") {
                                // Warning: Packing tiles as objects of objects rather than 2D array is a custom
                                //   LD47 code because most tiles are specified via auto tiles.
                                let output_tiles = {};
                                for (const input_tile of input_layer["gridTiles"]) {
                                    const input_index = input_tile["coordId"];
                                    const x = Math.floor(input_index % width);
                                    const y = Math.floor(input_index / width);
                                    if (x >= 0 && x < width && y >= 0 && y < height) {
                                        output_tiles[y] = output_tiles[y] || {};
                                        output_tiles[y][x] = input_tile["tileId"];
                                    }
                                }

                                output_layers[input_layer["__identifier"]] = output_tiles;
                            } else if (input_layer["__type"] === "AutoLayer") {
                                const output_tiles = Array.apply(null, Array(height)).map(() => Array(width).fill(-1));
                                for (const input_auto_tile of input_layer["autoTiles"]) {
                                    for (const input_auto_tile_result of input_auto_tile["results"]) {
                                        const input_index = input_auto_tile_result["coordId"];
                                        const x = Math.floor(input_index % width);
                                        const y = Math.floor(input_index / width);
                                        if (x >= 0 && x < width && y >= 0 && y < height) {
                                            for (const input_auto_tile_tile of input_auto_tile_result["tiles"]) {
                                                if (output_tiles[y][x] === -1) {
                                                    output_tiles[y][x] = input_auto_tile_tile["tileId"];
                                                }
                                            }
                                        }
                                    }
                                }

                                output_layers[input_layer["__identifier"]] = output_tiles;
                            } else if (input_layer["__type"] === "Entities") {
                                const output_entities = [];
                                for (const input_entity of input_layer["entityInstances"]) {
                                    const output_fields = {};
                                    for (const input_field of input_entity["fieldInstances"]) {
                                        output_fields[input_field["__identifier"]] = input_field["__value"];
                                    }

                                    output_entities.push({
                                        name: input_entity["__identifier"],
                                        x: input_entity["x"],
                                        y: input_entity["y"],
                                        fields: output_fields,
                                    });
                                }

                                output_layers[input_layer["__identifier"]] = output_entities;
                            }
                        }

                        // Warning: Division by 16 is custom LD47 code. Does not work in general scenario.
                        output_levels[input_level["identifier"]] = {
                            width: input_level["pxWid"] / 16.0,
                            height: input_level["pxHei"] / 16.0,
                            layers: output_layers,
                        };
                    }

                    const output = JSON.stringify({ levels: output_levels });
                    compilation.assets[path.basename(level.path)] = {
                        source: () => output,
                        size: () => output.length,
                    };
                }
            }
            catch (error) {
                console.error("Level packer failed!", error);
            }
        });

        compiler.hooks.afterEmit.tapPromise("LevelPacker", async compilation => {
            compilation.contextDependencies.add(this.directory);
        });
    }
}

module.exports = {
    entry: "./sources/main.js",
    output: {
        filename: "main.js",
        path: path.join(__dirname, "distributive"),
    },
    mode: "development",
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: "fonts" },
                { from: "sounds" },
            ],
        }),
        new HtmlWebpackPlugin({ title: "ld47" }),
        new TexturePackerPlugin(path.join(__dirname, "sprites")),
        new LevelPackerPlugin(path.join(__dirname, "levels")),
    ],
    module: {
        rules: [
            {
                test: /\.js$/,
                enforce: "pre",
                use: [ "source-map-loader" ],
            },
        ],
    },
};
