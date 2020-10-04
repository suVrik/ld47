"use strict";

export default class Utils {
    static lerp(from, to, factor) {
        return from + (to - from) * factor;
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
