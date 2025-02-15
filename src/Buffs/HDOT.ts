/** @packageDocumentation @module Buffs */

import { Buff } from "../Engine/Core/Buff";
import { mRTypes } from "../Engine/Core/mRTypes";
import { Mob } from "../Engine/GameObjects/Mob";
import { MobData } from "../Engine/Core/MobData";
import { GameData } from "../Engine/Core/GameData";
import { getRandomFloat, getRandomInt } from "../Engine/Core/Helper";
import { SpellFlags } from "../Engine/GameObjects/Spell";
import { _ } from "../Engine/UI/Localization";

export class HDOT extends Buff
{
    vMin: number;
    vMax: number;
    vGap: number;
    typeStr: string;

    timer: number;
    vCount: number;
    vType: GameData.Elements;

    constructor(settings: mRTypes.Settings.Buff, type: GameData.Elements, vMin: number = 1, vMax: number = 3, vGap: number = 0.57)
    {
        settings.name = settings.name || 'XOT';
        settings.popupName = settings.popupName || settings.name || 'XOT!';
        settings.color = settings.color || GameData.ElementColors[type] || Phaser.Display.Color.HexStringToColor('#0066ff');
        //settings.iconId

        super(settings);

        //this.toolTip

        this.vMin = vMin;
        this.vMax = vMax;
        this.vGap = vGap; // do not use cooldown for accurate timing
        this.vType = type;
        this.typeStr = _(this.vType);
        this.timer = 0;
        this.vCount = -1; // Initial tick
    }

    onAdded(mob: MobData, source: MobData)
    {
        this.listen(mob, 'update', this.onUpdate);
    }

    onUpdate(mob: MobData, dt: number)
    {
        this.timer += dt;
        for (; this.vCount < Math.floor(this.timer / this.vGap); this.vCount++)
        {
            this.source.parentMob.dealDamageHeal(mob.parentMob, {
                'value': getRandomInt(this.vMin, this.vMax) * this.stacks,
                'type': this.vType,
                'spell': { 'name': this.name, 'flags': new Set([SpellFlags.overTime]) },
                'popUp': true,
            });
        }
    }

    preToolTip(): mRTypes.HTMLToolTip
    {
        let tt = super.preToolTip();
        tt.text += "<br>";
        tt.text += eval("`" + _("_tt_HDOT") + "`");

        return tt;
    }
}
