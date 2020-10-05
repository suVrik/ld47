"use strict";

export default class Utils {
    static lerp(from, to, factor) {
        return from + (to - from) * factor;
    }

    static sign(value) {
        return value < 0 ? -1 : 1;
    }

    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    static length(x, y) {
        return Math.sqrt(x * x + y * y);
    }

    static distance(x1, y1, x2, y2) {
        return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
    }

    static square_distance(x1, y1, x2, y2) {
        return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
    }

    static sqr(x) {
        return x * x;
    }

    static point(x, y, width, height, px, py) {
        return px > x && px < x + width && py > y && py < y + height;
    }

    static aabb(ax, ay, aw, ah, bx, by, bw, bh, epsilon = 1e-8) {
        return ax < bx + bw - epsilon && ax + aw - epsilon > bx && ay < by + bh - epsilon && ay + ah - epsilon > by;
    }

    static segment(x1, y1, x2, y2, x3, y3, x4, y4, epsilon = 1e-8) {
        function area(_x1, _y1, _x2, _y2, _x3, _y3) {
            return (_x2 - _x1) * (_y3 - _y1) - (_y2 - _y1) * (_x3 - _x1);
        }

        function intersect_1(a, b, c, d) {
            if (a > b) {
                const temp = a;
                a = b;
                b = temp;
            }
            if (c > d) {
                const temp = c;
                c = d;
                d = temp;
            }
            return Math.max(a, c) < Math.min(b, d);
        }

        return intersect_1(x1, x2, x3, x4) &&
               intersect_1(y1, y2, y3, y4) &&
               area(x1, y1, x2, y2, x3, y3) * area(x1, y1, x2, y2, x4, y4) < epsilon &&
               area(x3, y3, x4, y4, x1, y1) * area(x3, y3, x4, y4, x2, y2) < epsilon;
    }

    static segment_aabb(x1, y1, x2, y2, rx, ry, rw, rh) {
        return Utils.segment(x1, y1, x2, y2, rx, ry, rx + rw, ry + rh) ||
               Utils.segment(x1, y1, x2, y2, rx + rw, ry, rx, ry + rh) ||
               Utils.point(rx, ry, rw, rh, x1, y1) ||
               Utils.point(rx, ry, rw, rh, x2, y2);
    }

    /** Returns array of 3 elements: x, y, square distance. Not an object! */
    static segment_aabb_point(x1, y1, x2, y2, rx1, ry1, rw, rh) {
        function get_intersection(dist_1, dist_2) {
            if (dist_1 * dist_2 >= 0) {
                return null;
            }

            if (Math.abs(dist_1 - dist_2) < 1e-8) {
                return null;
            }

            const coeff = -dist_1 / (dist_2 - dist_1);
            const x = x1 + (x2 - x1) * coeff;
            const y = y1 + (y2 - y1) * coeff;
            return [ x, y, Utils.square_distance(x1, y1, x, y) ];
        }

        const rx2 = rx1 + rw;
        const ry2 = ry1 + rh;

        function in_box_x(point) {
            return point && point[0] > rx1 && point[0] < rx2 ? point : null;
        }

        function in_box_y(point) {
            return point && point[1] > ry1 && point[1] < ry2 ? point : null;
        }

        function shorter(a, b) {
            if (a && b) {
                return a[2] < b[2] ? a : b;
            }
            return a || b;
        }

        if (x1 < rx1 && x2 < rx1) {
            return false;
        }

        if (x1 > rx2 && x2 > rx2) {
            return false;
        }

        if (y1 < ry1 && y2 < ry1) {
            return false;
        }

        if (y1 > ry2 && y2 > ry2) {
            return false;
        }

        if (x1 > rx1 && x1 < rx2 && y1 > ry1 && y1 < ry2) {
            return [ x1, y1 ];
        }

        return shorter(shorter(shorter(in_box_y(get_intersection(x1 - rx1, x2 - rx2)),
                                       in_box_x(get_intersection(y1 - ry1, y2 - ry1))),
                               in_box_y(get_intersection(x1 - rx2, x2 - rx2))),
                       in_box_x(get_intersection(y1 - ry2, y2 - ry2)));
    }

    static circle_rectangle(cx, cy, cr, rx, ry, rw, rh) {
        let test_x = cx;
        let test_y = cy;

        if (cx < rx) {
            test_x = rx;
        } else if (cx > rx + rw) {
            test_x = rx + rw;
        }

        if (cy < ry) {
            test_y = ry;
        } else if (cy > ry + rh) {
            test_y = ry + rh;
        }

        return Utils.square_distance(cx, cy, test_x, test_y) <= Utils.sqr(cr);
    }

    static equal(source, target = 0, epsilon = 1e-8) {
        return Math.abs(source - target) < epsilon;
    }

    static shortest_angle(from, to) {
        if (to > from) {
            const straight_way = to - from;
            const opposite_way = 2 * Math.PI - straight_way;
            return straight_way < opposite_way ? straight_way : -opposite_way;
        } else {
            const straight_way = from - to;
            const opposite_way = 2 * Math.PI - straight_way;
            return straight_way < opposite_way ? -straight_way : opposite_way;
        }
    }

    static rgb_to_hex(r, g, b) {
        r = Math.round(Utils.clamp(r, 0, 1) * 255);
        g = Math.round(Utils.clamp(g, 0, 1) * 255);
        b = Math.round(Utils.clamp(b, 0, 1) * 255);
        return (r << 16) | (g << 8) | b;
    }

    static pad(string, length) {
        while (string.length < length) {
            string = "0" + string;
        }
        return string;
    }
}
