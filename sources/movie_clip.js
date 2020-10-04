"use strict";

import * as PIXI from "pixi.js";

export default class MovieClip extends PIXI.AnimatedSprite {
    constructor(descriptors, default_animation) {
        super(descriptors[default_animation].frames);
        super.animationSpeed = descriptors[default_animation].speed || 1;
        super.loop = !(descriptors[default_animation].loop === false);

        this.descriptors = descriptors;
        this.animation = default_animation;
    }

    gotoAndPlay(frame_or_animation) {
        if (this.animation !== frame_or_animation) {
            if (this.descriptors && this.descriptors.hasOwnProperty(frame_or_animation)) {
                super.textures = this.descriptors[frame_or_animation].frames;
                super.animationSpeed = this.descriptors[frame_or_animation].speed || 1;
                super.loop = !(this.descriptors[frame_or_animation].loop === false);
                this.animation = frame_or_animation;
                super.gotoAndPlay(0);
            } else {
                super.gotoAndPlay(frame_or_animation);
            }
        }
    }

    gotoAndStop(frame_or_animation) {
        if (this.animation !== frame_or_animation) {
            if (this.descriptors && this.descriptors.hasOwnProperty(frame_or_animation)) {
                super.textures = this.descriptors[frame_or_animation].frames;
                super.animationSpeed = this.descriptors[frame_or_animation].speed || 1;
                super.loop = !(this.descriptors[frame_or_animation].loop === false);
                this.animation = frame_or_animation;
                super.gotoAndStop(0);
            } else {
                super.gotoAndStop(frame_or_animation);
            }
        }
    }
}
