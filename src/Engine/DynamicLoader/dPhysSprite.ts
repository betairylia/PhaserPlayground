/** @packageDocumentation @module DynamicLoader */

import { DynamicLoadObject } from './DynamicLoadObject'
import * as dl from './DynamicLoadObject'
import { DynamicLoaderScene } from './DynamicLoaderScene';

interface DSAnimCache
{
    key: string;
    startFrame: number;
}

export class dPhysSprite extends Phaser.Physics.Arcade.Sprite implements DynamicLoadObject
{
    loadComplete: boolean;
    resources: dl.ResourceRequirements[];

    textureToLoad: string;
    frameToLoad: string | integer;
    currentAnim: DSAnimCache;

    scene: Phaser.Scene;

    /**
     * 
     * @param scene scene that this sprite belongs to
     * @param x x coordinate
     * @param y y coordinate
     * @param texture texture to load
     * @param subsTexture Texture that can be used as a substitute when the real texture is loading.
     * @param frame 
     */
    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, subsTexture?: string, frame?: string | integer)
    {
        var textureToLoad: string;
        var frameToLoad: string | integer;

        if (!scene.textures.exists(texture))
        {
            textureToLoad = texture;
            frameToLoad = frame;
            texture = subsTexture || 'DOBJ_LOADING_PLACEHOLDER';
            frame = 0;
        }
        if (!texture)
        {
            texture = 'default';
        }

        super(scene, x, y, texture, frame);

        this.scene = scene;

        // Since we cannot put "super" to the very beginning ...
        this.resources = [];
        this.currentAnim = { 'key': '', 'startFrame': 0 };

        // Set properties to be visible to others
        this.textureToLoad = texture;
        this.frameToLoad = frame;

        if (textureToLoad)
        {
            this.resources.push({ 'key': textureToLoad, 'metadata': {}, 'callback': this.onLoadComplete.bind(this) });
            this.textureToLoad = textureToLoad;
            this.frameToLoad = frameToLoad;
        }
        if (texture == 'default')
        {
            this.setVisible(false);
        }

        DynamicLoaderScene.getSingleton().loadMultiple(this.resources);
    }

    fetchChildren(): DynamicLoadObject[]
    {
        return [];
    }

    onLoadComplete(key: string, type: string, fileObj: any): void
    {
        if (key == this.textureToLoad && this.scene)
        {
            this.loadComplete = true;
            this.setTexture(this.textureToLoad, this.frameToLoad);

            // Play cached animation
            if (this.currentAnim.key)
            {
                this.play(this.currentAnim.key, true, this.currentAnim.startFrame);
            }

            this.setBodyShape();
            this.setVisible(true);
        }
    }

    // override to allow play() calls when not loaded (not sure if without this it will work or not, never tried)
    play(key: string, ignoreIfPlaying?: boolean, startFrame?: number): this
    {
        this.currentAnim.key = key;
        this.currentAnim.startFrame = startFrame;

        if (this.loadComplete == true)
        {
            super.play(key, ignoreIfPlaying, startFrame);
        }

        return this;
    }

    getPosition(): Phaser.Math.Vector2
    {
        return new Phaser.Math.Vector2(this.x, this.y);
    }

    setBodyShape()
    {
        this.body.setSize(this.displayWidth * 0.8, this.displayHeight * 0.8, true);
    }
}