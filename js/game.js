function formatNumber(num) {
    if (num === undefined || num === null || Number.isNaN(Number(num))) return "0";
    num = Number(num);
    if (!Number.isFinite(num)) return "MAX";
    if (num < 1000) return Math.floor(Math.max(0, num)).toString();

    if (num >= 1e15) {
        return num.toExponential(2).replace('+', '');
    }

    const suffixes = ["", "K", "M", "B", "T", "P"];
    const i = Math.floor(Math.log10(num) / 3);
    if (i < suffixes.length) {
        const val = num / Math.pow(10, i * 3);
        return (val < 10 ? val.toFixed(2) : val.toFixed(1)) + suffixes[i];
    } else {
        return num.toExponential(2).replace('+', '');
    }
}

// --- マネージャー ---
// アーティファクト（恒久強化）を管理するクラス
class ArtifactManager {
    constructor() { this.owned = {}; }
    draw(count) {
        const results = [];
        for (let i = 0; i < count; i++) {
            const r = Math.random();
            let cumulative = 0;
            let selectedRarity = 'N';
            for (const [key, meta] of Object.entries(RARITIES)) {
                cumulative += meta.chance;
                if (r <= cumulative) { selectedRarity = key; break; }
            }

            // Box Gacha Logic: Filter out items that are at a reasonable 'max' (e.g. 1000 for N, 500 for R, etc.)
            const pool = ARTIFACT_DATA.filter(a => a.rarity === selectedRarity && (this.owned[a.id] || 0) < 1000);
            if (pool.length === 0) continue;
            const picked = pool[Math.floor(Math.random() * pool.length)];
            this.owned[picked.id] = (this.owned[picked.id] || 0) + 1;
            results.push(picked);
        }
        return results;
    }
    getBonuses(stage) {
        let stats = {
            atkAdd: 0, atkMulti: 1.0, goldMulti: 1.0, hpMulti: 1.0, instantKill: 0,
            regen: 0, reflect: 0, critRate: 0, bossCoin: 1.0, evade: 0, doubleTap: 0
        };
        for (const [id, lv] of Object.entries(this.owned)) {
            const data = ARTIFACT_DATA.find(a => a.id === id);
            if (!data) continue;
            let val = data.value * lv;

            if (data.special === 'divine_shred') val *= (1 + (stage * 0.02));
            if (data.special === 'instant_kill') stats.instantKill += 0.05 * lv;
            if (data.special === 'holy_regen') stats.regen += 0.01 * lv;
            if (data.special === 'curse_atk') stats.hpMulti *= Math.pow(0.9, lv);
            if (data.special === 'crit_up') stats.critRate += 0.10 * lv;
            if (data.special === 'reflect_dmg') stats.reflect += 0.10 * lv;
            if (data.special === 'boss_rich') stats.bossCoin += 1.0 * lv;
            if (data.special === 'evasion_up') stats.evade += 0.10 * lv;
            if (data.special === 'double_tap') stats.doubleTap += 0.15 * lv;

            if (data.effect === 'atk_add') stats.atkAdd += val;
            else if (data.effect === 'atk_multi') stats.atkMulti += val;
            else if (data.effect === 'gold_multi') stats.goldMulti += val;
            else if (data.effect === 'hp_multi') stats.hpMulti += val;
        }
        return stats;
    }
}

class GachaManager {
    constructor() { this.owned = {}; }

    // ボックスガチャ仕様の完全化：抽選テーブルから完了済みを除外
    pull() {
        try {
            const validItems = GACHA_ITEMS.filter(item => {
                const count = this.owned[item.id] || 0;
                return count < item.max;
            });

            if (validItems.length === 0) return null;

            const totalChance = validItems.reduce((acc, item) => acc + item.chance, 0);
            const r = Math.random() * totalChance;
            let cumulative = 0;

            for (const item of validItems) {
                cumulative += item.chance;
                if (r <= cumulative) {
                    this.owned[item.id] = (this.owned[item.id] || 0) + 1;
                    return item;
                }
            }
            return validItems[validItems.length - 1];
        } catch (e) {
            console.error("Gacha pull error:", e);
            return null;
        }
    }
    getBonuses() {
        try {
            let b = {
                goldStack: 0, tripleGold: 0, doubleReward: 0, costCut: 1.0,
                extraAttack: 0, initialLv: 0, hpStack: 1.0, bossAtk: 1.0,
                atkStack: 1.0, critStack: 0, regenStack: 0, reflectStack: 0,
                evadeStack: 0, doubleStack: 0, orbStack: 1.0, speedStack: 1.0,
                giantKiller: 1.0, executioner: 0, lastStand: false,
                luckStack: 0, rareSpawn: 0, instStack: 0, allStats: 0,
                orbStackHeavy: 0, keepStage: 0, keepGold: 0, allStatsMega: 0
            };

            for (const [id, count] of Object.entries(this.owned)) {
                const data = GACHA_ITEMS.find(i => i.id === id);
                if (!data) continue;

                if (data.effect === 'hp_stack') b.hpStack += count * 0.05;
                if (data.effect === 'hp_stack_heavy') b.hpStack += count * 0.15;
                if (data.effect === 'hp_stack_lite') b.hpStack += count * 0.02;
                if (data.effect === 'boss_slayer') b.bossAtk += count * 0.10;
                if (data.effect === 'atk_stack') b.atkStack += count * 0.04;
                if (data.effect === 'atk_stack_lite') b.atkStack += count * 0.01;
                if (data.effect === 'crit_stack') b.critStack += count * 0.01;
                if (data.effect === 'regen_stack') b.regenStack += count * 0.005;
                if (data.effect === 'reflect_stack') b.reflectStack += count * 0.05;
                if (data.effect === 'evade_stack') b.evadeStack += count * 0.01;
                if (data.effect === 'double_stack') b.doubleStack += count * 0.02;
                if (data.effect === 'gold_stack') b.goldStack += count * 0.05;
                if (data.effect === 'gold_stack_lite') b.goldStack += count * 0.01;
                if (data.effect === 'gold_stack_tiny') b.goldStack += count * 0.005;
                if (data.effect === 'cost_stack') b.costCut *= Math.pow(0.98, count);
                if (data.effect === 'orb_stack') b.orbStack += count * 0.05;
                if (data.effect === 'orb_stack_heavy') b.orbStack += count * 0.20;
                if (data.effect === 'speed_lite') b.speedStack += count * 0.005;
                if (data.effect === 'full_speed') b.speedStack += count * 0.02;
                if (data.effect === 'init_lv_stack') b.initialLv += count * 2;
                if (data.effect === 'all_stats') b.allStats += count * 0.03;
                if (data.effect === 'all_stats_mega') b.allStatsMega += count * 1;
                if (data.effect === 'inst_stack') b.instStack += count * 0.005;
                if (data.effect === 'rare_spawn') b.rareSpawn += count * 0.05;
                if (data.effect === 'keep_stage') b.keepStage += count * 0.10;
                if (data.effect === 'keep_gold') b.keepGold += count * 0.01;

                if (data.effect === 'giant_killer') b.giantKiller *= Math.pow(2.0, count);
                if (data.effect === 'executioner') b.executioner += (1.0 * count);
                if (data.effect === 'last_stand' && count > 0) b.lastStand = true;
            }
            return b;
        } catch (e) {
            console.error("Gacha bonus calculation error:", e);
            return { goldStack: 0, costCut: 1.0, hpStack: 1.0, atkStack: 1.0, giantKiller: 1.0, executioner: 0, lastStand: false };
        }
    }
}

class Game {
    constructor() {
        this.stage = 1; this.gold = 0; this.orbs = 0; this.units = {};
        UNIT_TYPES.forEach(t => this.units[t.id] = 0);
        this.artMgr = new ArtifactManager();
        this.gachaMgr = new GachaManager();
        this.buyMode = 1;
        this.questBuyMode = 1;
        this.totalKills = 0;
        this.killsInSession = 0;
        this.gameSpeed = 1.0;
        this.quests = {};
        QUEST_DATA.forEach(q => this.quests[q.id] = 0);

        this.missions = [
            { id: 'kill_100', text: '敵を100体討伐', target: 100, reward: 50, done: false },
            { id: 'kill_500', text: '敵を500体討伐', target: 500, reward: 200, done: false },
            { id: 'kill_2000', text: '敵を2000体討伐', target: 2000, reward: 1000, done: false }
        ];

        this.dailyData = {
            date: new Date().toDateString(),
            dailyKills: 0,
            dailyGoldEarned: 0,
            dailyGachaPulls: 0,
            dailyMaxStage: 1,
            dailyUnitBuys: 0,
            dailyBossKills: 0,
            dailyQuestBuys: 0,
            claimed: {}
        };

        // スキルクールダウン管理
        this.skills = {
            'thunder': { lastUsed: 0 },
            'heal': { lastUsed: 0 },
            'haste': { lastUsed: 0 }
        };
        this.activeBuffs = {
            hasteEndTime: 0
        };
    }
    checkDailyReset() {
        const today = new Date().toDateString();
        if (this.dailyData.date !== today) {
            this.dailyData = {
                date: today,
                dailyKills: 0,
                dailyGoldEarned: 0,
                dailyGachaPulls: 0,
                dailyMaxStage: this.stage,
                dailyUnitBuys: 0,
                dailyBossKills: 0,
                dailyQuestBuys: 0,
                claimed: {}
            };
            this.save();
        }
    }
    _getCost(baseCost, currentLv, count, costMultiplier, costCut) {
        let total = 0;
        for (let i = 0; i < count; i++) {
            let nextCost = Math.floor(baseCost * Math.pow(costMultiplier, currentLv + i) * costCut);
            if (Number.isNaN(nextCost) || !Number.isFinite(nextCost)) nextCost = Infinity;
            total += nextCost;
            if (!Number.isFinite(total)) return Infinity;
        }
        return total;
    }

    _getMaxBuy(baseCost, currentLv, maxLimit, costMultiplier, costCut, currentGold) {
        let count = 0;
        let tempGold = currentGold;
        if (!Number.isFinite(tempGold) || Number.isNaN(tempGold)) return 0;

        while (count < maxLimit) {
            let nextCost = baseCost * Math.pow(costMultiplier, currentLv + count) * costCut;
            if (Number.isNaN(nextCost) || nextCost <= 0 || !Number.isFinite(nextCost)) break;
            let cost = Math.floor(nextCost);

            if (tempGold >= cost && cost > 0) {
                tempGold -= cost;
                count++;
            } else break;
        }
        return count;
    }

    getUnitCost(id, count = 1) {
        const type = UNIT_TYPES.find(u => u.id === id);
        if (!type) return 0;
        const costCut = this.gachaMgr.getBonuses().costCut;
        let lv = this.units[id] || 0;
        return this._getCost(type.baseCost, lv, count, 1.15, costCut);
    }

    getMaxBuy(id) {
        const type = UNIT_TYPES.find(u => u.id === id);
        if (!type) return 0;
        const costCut = this.gachaMgr.getBonuses().costCut;
        let lv = this.units[id] || 0;
        return this._getMaxBuy(type.baseCost, lv, 1000, 1.15, costCut, this.gold);
    }

    getQuestCost(id, count = 1) {
        const q = QUEST_DATA.find(x => x.id === id);
        if (!q) return 0;
        let lv = this.quests[id] || 0;
        return this._getCost(q.baseCost, lv, count, 1.2, 1.0);
    }

    getMaxQuestBuy(id, maxLimit) {
        const q = QUEST_DATA.find(x => x.id === id);
        if (!q) return 0;
        let lv = this.quests[id] || 0;
        return this._getMaxBuy(q.baseCost, lv, maxLimit, 1.2, 1.0, this.gold);
    }

    getGps() {
        let total = 0;
        QUEST_DATA.forEach(q => {
            const lv = this.quests[q.id] || 0;
            total += q.baseGps * lv;
        });
        const s = this.getStats();
        let gps = total * s.goldMulti;
        if (Number.isNaN(gps) || !Number.isFinite(gps)) gps = 0;
        return gps;
    }

    calculateDamage(baseAtk, lv, a, g, orbs, totalArtifacts, currentStage) {
        if (Number.isNaN(baseAtk) || baseAtk == null) baseAtk = 10;
        const milestoneCount = Math.floor(lv / 50);
        const milestoneMultiplier = Math.pow(1.5, Math.max(0, milestoneCount - 1));
        const comboMultiplier = Math.pow(Math.min(1.05, 1.01 + (totalArtifacts * 0.0001)), totalArtifacts || 0);
        const stageMultiplier = Math.pow(1.005, currentStage || 1);

        const groupA_Sum = (2.0 + (a.atkAdd || 0)) * (g.atkStack || 1);
        const groupB_Sum = Math.max(1.0, (a.atkMulti || 1));
        const groupC_Sum = 1.0 + ((orbs || 0) * 0.05);

        let finalDamage = baseAtk * milestoneMultiplier * comboMultiplier * stageMultiplier * groupA_Sum * groupB_Sum * groupC_Sum;

        if (battle && battle.isBoss) {
            finalDamage *= ((g.bossAtk || 1) * (g.giantKiller || 1));
        }

        if (Number.isNaN(finalDamage) || finalDamage <= 0 || !Number.isFinite(finalDamage)) finalDamage = baseAtk;
        if (finalDamage > 1e300) finalDamage = 1e300;

        return finalDamage;
    }

    getStats() {
        try {
            const a = this.artMgr.getBonuses(this.stage);
            const g = this.gachaMgr.getBonuses();

            let totalArtifacts = 0;
            Object.values(this.artMgr.owned).forEach(v => totalArtifacts += v);
            Object.values(this.gachaMgr.owned).forEach(v => totalArtifacts += v);

            let baseAtk = 0;
            let activeUnitTypes = 0;

            UNIT_TYPES.forEach(t => {
                const lv = this.units[t.id] || 0;
                if (lv > 0) {
                    activeUnitTypes++;
                    let unitBase = t.baseAtk * lv;
                    let unitDps = this.calculateDamage(unitBase, lv, a, g, this.orbs, totalArtifacts, this.stage);
                    baseAtk += unitDps;
                }
            });

            if (Number.isNaN(baseAtk) || baseAtk <= 0) baseAtk = 10;

            let lastStandMulti = 1.0;
            if (g.lastStand && activeUnitTypes > 0) {
                lastStandMulti = Math.max(1.0, 6.0 - activeUnitTypes);
            }
            baseAtk *= lastStandMulti;

            return {
                dps: baseAtk,
                hpMulti: a.hpMulti * g.hpStack,
                goldMulti: a.goldMulti * (1 + g.goldStack),
                critRate: a.critRate + g.critStack,
                evade: a.evade + g.evadeStack,
                regen: a.regen + g.regenStack,
                tripleGold: g.tripleGold,
                extraAttack: g.extraAttack + a.doubleTap + g.doubleStack,
                reflect: a.reflect + g.reflectStack,
                instantKill: a.instantKill + g.instStack,
                doubleReward: g.doubleReward,
                bossCoin: a.bossCoin,
                giantKiller: g.giantKiller,
                executioner: g.executioner,
                lastStand: g.lastStand,
                orbStack: g.orbStack || 1
            };
        } catch (e) {
            console.error("Stats calculation error:", e);
            return { dps: 10, goldMulti: 1, hpMulti: 1 };
        }
    }
    checkMissions() {
        this.missions.forEach(m => {
            if (!m.done && this.totalKills >= m.target) {
                m.done = true;
                this.orbs += m.reward;
                createPop(`実績達成: ${m.text}\n報酬: ${m.reward} Orbs`, false, true);
            }
        });
    }
    save() {
        const data = {
            s: this.stage, g: this.gold, o: this.orbs, u: this.units, q: this.quests,
            a: this.artMgr.owned, ga: this.gachaMgr.owned, tk: this.totalKills,
            ks: this.killsInSession,
            md: this.missions.map(m => m.done),
            dd: this.dailyData,
            sk: this.skills
        };
        localStorage.setItem('RPG_SAVE_PRO_V2', JSON.stringify(data));
    }
    load() {
        try {
            const raw = localStorage.getItem('RPG_SAVE_PRO_V2');
            if (raw) {
                const d = JSON.parse(raw);
                this.stage = d.s || 1;
                this.gold = Number.isFinite(d.g) ? d.g : 0;
                this.orbs = Number.isFinite(d.o) ? d.o : 0;
                this.totalKills = d.tk || 0;
                this.killsInSession = d.ks || 0;

                if (this.gold < 0 || Number.isNaN(this.gold)) this.gold = 0;
                if (this.orbs < 0 || Number.isNaN(this.orbs)) this.orbs = 0;

                if (d.u) {
                    Object.keys(d.u).forEach(id => {
                        if (this.units.hasOwnProperty(id)) {
                            let lv = Number(d.u[id]);
                            this.units[id] = (Number.isNaN(lv) || !Number.isFinite(lv) || lv < 0) ? 0 : lv;
                        }
                    });
                }
                if (d.q) {
                    Object.keys(d.q).forEach(id => {
                        if (this.quests.hasOwnProperty(id)) {
                            let lv = Number(d.q[id]);
                            this.quests[id] = (Number.isNaN(lv) || !Number.isFinite(lv) || lv < 0) ? 0 : lv;
                        }
                    });
                }
                if (d.a) {
                    Object.keys(d.a).forEach(id => {
                        if (ARTIFACT_DATA.find(i => i.id === id)) this.artMgr.owned[id] = d.a[id];
                    });
                }
                if (d.ga) {
                    Object.keys(d.ga).forEach(id => {
                        if (GACHA_ITEMS.find(i => i.id === id)) this.gachaMgr.owned[id] = d.ga[id];
                    });
                }
                if (d.md) this.missions.forEach((m, i) => m.done = !!d.md[i]);
                if (d.dd) this.dailyData = { ...this.dailyData, ...d.dd };
                if (d.sk) this.skills = { ...this.skills, ...d.sk };
            }
            this.checkDailyReset();
        } catch (e) { console.error("Save load error:", e); }
    }
}
