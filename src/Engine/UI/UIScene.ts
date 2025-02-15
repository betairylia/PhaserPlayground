/**
 * @packageDocumentation
 * @module UI
 */

import { PopUpManager } from "./PopUpManager";
import { UnitFrame, BuffFrame } from "./UnitFrame";
import { UnitManager } from "../Core/UnitManager";
import { Mob } from "../GameObjects/Mob";
import { Localization, _ } from "./Localization";
import { MonitorFrame, MonitorRow } from "./MonitorFrame";
import { BattleMonitor } from "../Core/BattleMonitor";
import { mRTypes } from "../Core/mRTypes";
import { GameData } from "../Core/GameData";
import { Game, DOM } from "phaser";

export class UIScene extends Phaser.Scene
{
    static instance: UIScene;
    loaded: boolean = false;
    orgMainFont: string;
    orgMainFont_o: string;
    orgPopUpFont: string;
    unitFrames: UnitFrame[] = [];
    playerCache: Mob[];

    mainCanvas: HTMLElement;
    prevLeft: number;

    toolTip: { toolTip: HTMLElement, title: HTMLElement, body: HTMLElement };

    static getSingleton(): UIScene
    {
        if (!UIScene.instance)
        {
            UIScene.instance = new UIScene({ key: 'UIScene' });
            console.log("registering UI Scene...");
        }
        return UIScene.instance;
    }

    preload()
    {
        this.add.existing(PopUpManager.register(this));
    }

    create()
    {
        let tT = document.getElementById("tooltip");
        this.toolTip = {
            toolTip: tT,
            title: tT.querySelector("#title"),
            body: tT.querySelector("#body"),
        };

        if (GameData.mainLanguage !== mRTypes.Languages.ENG || GameData.popUpBuffLanguage !== mRTypes.Languages.ENG)
        {
            this.orgMainFont = Localization.data.main.UIFont[GameData.mainLanguage];
            this.orgMainFont_o = Localization.data.main.UIFont_o[GameData.mainLanguage];
            this.orgPopUpFont = Localization.data.popUpBuff.buffFont[GameData.popUpBuffLanguage];
            Localization.data.main.UIFont[GameData.mainLanguage] = 'smallPx';
            Localization.data.main.UIFont_o[GameData.mainLanguage] = 'smallPx';
            Localization.data.popUpBuff.buffFont[GameData.popUpBuffLanguage] = 'smallPx';

            let txt = this.add.bitmapText(10, 10, 'smallPx', "HUD / UI: Loading Unicode Fonts ... ");

            if (GameData.mainLanguage === mRTypes.Languages.CHS || GameData.popUpBuffLanguage === mRTypes.Languages.CHS)
            {
                this.load.bitmapFont('simsun', './assets/fonts/simsun_0.png', './assets/fonts/simsun.fnt');
                this.load.bitmapFont('simsun_o', './assets/fonts/simsun_outlined_0.png', './assets/fonts/simsun_outlined.fnt');
            }
            if (GameData.mainLanguage === mRTypes.Languages.JPN || GameData.popUpBuffLanguage === mRTypes.Languages.JPN)
            {
                this.load.bitmapFont('mspgothic', './assets/fonts/mspgothic_0.png', './assets/fonts/mspgothic.fnt');
                this.load.bitmapFont('mspgothic_o', './assets/fonts/mspgothic_o_0.png', './assets/fonts/mspgothic_o.fnt');
            }

            this.load.on('complete', () => { this.loadComplete(); });
            this.load.on('progress', (value: number) => { txt.text = `[${(value * 100).toFixed(1)}%] HUD / UI: Loading Unicode Fonts ... `; });
            this.load.start();
        }

        this.loaded = true;
        PopUpManager.getSingleton().hasLoaded();

        this.setupScene();

        // Used for checking window size changes
        this.mainCanvas = document.getElementById('GameFrame');
        this.prevLeft = this.mainCanvas.offsetLeft;
    }

    loadComplete()
    {
        Localization.data.main.UIFont[GameData.mainLanguage] = this.orgMainFont;
        Localization.data.main.UIFont_o[GameData.mainLanguage] = this.orgMainFont_o;
        Localization.data.popUpBuff.buffFont[GameData.popUpBuffLanguage] = this.orgPopUpFont;
        this.setupScene();
    }

    setupScene()
    {
        if (this.children.length > 0)
        {
            for (let child of this.children.getAll())
            {
                child.destroy();
            }
        }

        // Background
        this.add.rectangle(512, 586, 1024, 148, 0x222222);
        this.add.rectangle(512, 510, 1024, 4, 0xd3cfc2);

        this.initUnitFrames();
        // this.add.rectangle(750 + 61, 520 + 8, 122, 16, 0x948779);
        let bt = this.add.bitmapText(755, 530, _("UIFont"), _("Damage Done (DPS)"));
        bt.setOrigin(0, 1);

        // this.add.rectangle(880 + 61, 520 + 8, 122, 16, 0x948779);
        bt = this.add.bitmapText(885, 530, _("UIFont"), _("Healing Done (HPS)"));
        bt.setOrigin(0, 1);

        this.add.existing(new MonitorFrame(this, 750, 534, () => { return BattleMonitor.getSingleton().getDamageList(); }, 122, 114, MonitorRow.getDamageToolTip));
        this.add.existing(new MonitorFrame(this, 880, 534, () => { return BattleMonitor.getSingleton().getHealList(); }, 122, 114, MonitorRow.getHealToolTip));

        this.add.existing(PopUpManager.register(this));
        PopUpManager.getSingleton().hasLoaded();
        PopUpManager.getSingleton().depth = 100000;
    }

    clearUnitFrame()
    {
        for (let u of this.unitFrames)
        {
            u.destroy();
        }
        this.unitFrames = [];
    }

    resetPlayers()
    {
        this.clearUnitFrame();

        this.playerCache = Array.from(UnitManager.getCurrent().player.values());
        if (this.loaded)
        {
            this.initUnitFrames();
        }
    }

    initUnitFrames()
    {
        if (this.playerCache === undefined) { return; }
        let cnt = 0;
        for (let player of this.playerCache)
        {
            let x = 35 + (cnt % 4) * 180;
            let y = 522 + Math.floor(cnt / 4) * 70;

            let tmp = new UnitFrame(this, x, y, player);
            // let bF = new BuffFrame(this, x - 28, y + 37, x - 28, y + 37, 160, 30, player.mobData);
            // let tmp = new UnitFrame(this, 20, 20 + cnt * 70, player);
            // this.add.existing(bF);
            this.add.existing(tmp);
            this.unitFrames.push(tmp);
            cnt += 1;
        }
    }

    update(time: number, dt: number)
    {
        // Check if offsets are changed
        if (this.mainCanvas.offsetLeft !== this.prevLeft)
        {
            this.prevLeft = this.mainCanvas.offsetLeft;
            this.scale.updateBounds();
        }

        this.children.each((item: Phaser.GameObjects.GameObject) => { item.update(time / 1000.0, dt / 1000.0); });
    }

    showToolTip(tip: mRTypes.HTMLToolTip)
    {
        // change text
        this.toolTip.title.innerHTML = tip.title;
        this.toolTip.body.innerHTML = tip.text;

        // change color
        this.toolTip.title.style.color = tip.color;

        if (tip.bodyStyle)
        {
            this.toolTip.body.style.cssText = tip.bodyStyle;
        }
        else
        {
            this.toolTip.body.style.cssText = "";
        }

        // set it visible
        this.toolTip.toolTip.style.display = "inherit";
        this.toolTip.toolTip.lang = GameData.mainLanguage;
    }

    hideToolTip()
    {
        // set it invisible
        this.toolTip.toolTip.style.display = "none";
    }
}
