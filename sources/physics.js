"use strict";

import Utils from "./utils";

export default class Physics {
    constructor() {
        this.chunks = [];
    }

    add_chunk(shapes) {
        let min_x = Infinity;
        let min_y = Infinity;
        let max_x = -Infinity;
        let max_y = -Infinity;

        for (const shape of shapes) {
            if (shape.x < min_x) {
                min_x = shape.x;
            }
            if (shape.x + shape.width > max_x) {
                max_x = shape.x + shape.width;
            }
            if (shape.y < min_y) {
                min_y = shape.y;
            }
            if (shape.y + shape.height > max_y) {
                max_y = shape.y + shape.height;
            }
        }

        const chunk = {
            shapes: shapes,
            bounding_box: {
                x: min_x,
                y: min_y,
                width: max_x - min_x,
                height: max_y - min_y,
            },
        };

        this.chunks.push(chunk);

        return chunk;
    }

    remove_chunk(shapes) {
        for (let i = 0; i < this.chunks.length; i++) {
            if (this.chunks[i].shapes === shapes) {
                this.chunks.splice(i, 1);
                return;
            }
        }
    }

    point_all(x, y, mask, callback) {
        for (const chunk of this.chunks) {
            if (Utils.point(chunk.bounding_box.x, chunk.bounding_box.y, chunk.bounding_box.width, chunk.bounding_box.height, x, y)) {
                for (const shape of chunk.shapes) {
                    if ((shape.mask & mask) !== 0) {
                        if (Utils.point(shape.x, shape.y, shape.width, shape.height, x, y)) {
                            callback(shape);
                        }
                    }
                }
            }
        }
    }

    point_any(x, y, mask) {
        for (const chunk of this.chunks) {
            if (Utils.point(chunk.bounding_box.x, chunk.bounding_box.y, chunk.bounding_box.width, chunk.bounding_box.height, x, y)) {
                for (const shape of chunk.shapes) {
                    if ((shape.mask & mask) !== 0) {
                        if (Utils.point(shape.x, shape.y, shape.width, shape.height, x, y)) {
                            return shape;
                        }
                    }
                }
            }
        }
        return null;
    }

    overlap_all(x, y, width, height, mask, callback) {
        for (const chunk of this.chunks) {
            if (Utils.aabb(x, y, width, height, chunk.bounding_box.x, chunk.bounding_box.y, chunk.bounding_box.width, chunk.bounding_box.height)) {
                for (const shape of chunk.shapes) {
                    if ((shape.mask & mask) !== 0) {
                        if (Utils.aabb(x, y, width, height, shape.x, shape.y, shape.width, shape.height)) {
                            callback(shape);
                        }
                    }
                }
            }
        }
    }

    overlap_any(x, y, width, height, mask) {
        for (const chunk of this.chunks) {
            if (Utils.aabb(x, y, width, height, chunk.bounding_box.x, chunk.bounding_box.y, chunk.bounding_box.width, chunk.bounding_box.height)) {
                for (const shape of chunk.shapes) {
                    if ((shape.mask & mask) !== 0) {
                        if (Utils.aabb(x, y, width, height, shape.x, shape.y, shape.width, shape.height)) {
                            return shape;
                        }
                    }
                }
            }
        }
        return null;
    }

    raycast_all(x1, y1, x2, y2, mask, callback) {
        this.overlap_all(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x1 - x2), Math.abs(y1 - y2), mask, shape => {
            if (Utils.segment_aabb(x1, y1, x2, y2, shape.x, shape.y, shape.width, shape.height)) {
                callback(shape);
            }
        });
    }

    raycast_any(x1, y1, x2, y2, mask) {
        const x = Math.min(x1, x2);
        const y = Math.min(y1, y2);
        const width = Math.abs(x1 - x2);
        const height = Math.abs(y1 - y2);

        for (const chunk of this.chunks) {
            if (Utils.aabb(x, y, width, height, chunk.bounding_box.x, chunk.bounding_box.y, chunk.bounding_box.width, chunk.bounding_box.height)) {
                for (const shape of chunk.shapes) {
                    if ((shape.mask & mask) !== 0) {
                        if (Utils.aabb(x, y, width, height, shape.x, shape.y, shape.width, shape.height)) {
                            if (Utils.segment_aabb(x1, y1, x2, y2, shape.x, shape.y, shape.width, shape.height)) {
                                return shape;
                            }
                        }
                    }
                }
            }
        }

        return null;
    }

    move_x(x, y, width, height, mask, offset, filter) {
        const result = {
            left: false,
            right: false,
            offset: offset,
            shape: null,
        };

        this.overlap_all(x - Math.max(-offset, 0), y, width + Math.abs(offset), height, mask, shape => {
            if (Utils.aabb(x - Math.max(-result.offset, 0), y, width + Math.abs(result.offset), height, shape.x, shape.y, shape.width, shape.height)) {
                if (filter === undefined || filter(shape) === true) {
                    if (x < shape.x) {
                        result.left = false;
                        result.right = true;
                        result.offset = shape.x - (x + width);
                    } else {
                        result.left = true;
                        result.right = false;
                        result.offset = (shape.x + shape.width) - x;
                    }
                    result.object = shape;
                }
            }
        });

        return result;
    }

    move_y(x, y, width, height, mask, offset, filter) {
        const result = {
            top: false,
            bottom: false,
            offset: offset,
            shape: null,
        };

        this.overlap_all(x, y - Math.max(-offset, 0), width, height + Math.abs(offset), mask, shape => {
            if (Utils.aabb(x, y - Math.max(-result.offset, 0), width, height + Math.abs(result.offset), shape.x, shape.y, shape.width, shape.height)) {
                if (filter === undefined || filter(shape) === true) {
                    if (y < shape.y) {
                        result.top = false;
                        result.bottom = true;
                        result.offset = shape.y - (y + height);
                    } else {
                        result.top = true;
                        result.bottom = false;
                        result.offset = (shape.y + shape.height) - y;
                    }
                    result.object = shape;
                }
            }
        });

        return result;
    }
}
