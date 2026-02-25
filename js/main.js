function useSkill(skillId) {
    const now = Date.now();
    const skillMeta = SKILL_DATA[skillId];
    if (!skillMeta) return;

    const lastUsed = game.skills[skillId].lastUsed;
    const elapsedSec = (now - lastUsed) / 1000;

    if (elapsedSec < skillMeta.cooldown) {
        // まだクールダウン中なので発動不可
        return;
    }

    // スキル効果の適用
    const s = game.getStats();

    if (skillId === 'thunder') {
        // 敵全体に現在攻撃力の100倍の即時ダメージ
        const dmg = s.dps * 100;
        battle.enemyHp -= dmg;
        createPop(`⚡サンダー! ${formatNumber(dmg)}`, false, true);

        // エフェクト
        DOM.battleScreen.classList.add('death-flash');
        setTimeout(() => DOM.battleScreen.classList.remove('death-flash'), 200);

    } else if (skillId === 'heal') {
        // 味方HP最大回復
        battle.allyHp = battle.allyMaxHp;
        createPop(`🩹ヒール! MAX HP`, true, false);
        DOM.allyEntity.classList.add('hit-flash'); // 絆などに光らせる代用
        setTimeout(() => DOM.allyEntity.classList.remove('hit-flash'), 200);

    } else if (skillId === 'haste') {
        // 10秒間ヘイスト状態
        game.activeBuffs.hasteEndTime = now + (10 * 1000);
        createPop(`⏳ヘイスト! 速度2倍`, true, false);
    }

    // クールダウン開始設定
    game.skills[skillId].lastUsed = now;
    updateUI();
    game.save();
}

function updateEconomy(delta, now) {
    const gps = game.getGps();
    game.gold += gps * delta * game.gameSpeed;

    // 内政プログレスバーの更新（視覚的な演出）
    QUEST_DATA.forEach(q => {
        const prog = document.getElementById(`qprog-${q.id}`);
        if (prog) {
            const lv = game.quests[q.id] || 0;
            if (lv > 0) {
                const cycle = (now % 1000) / 1000;
                prog.style.width = (cycle * 100) + '%';
            } else {
                prog.style.width = '0%';
            }
        }
    });
}

function updateCombat(dt, now, s) {
    battle.allyMaxHp = 200 * s.hpMulti;

    // HP再生
    if (battle.allyHp < battle.allyMaxHp) {
        battle.allyHp += (battle.allyMaxHp * s.regen) * dt;
    }

    // 即死判定
    if (!battle.isBoss && Math.random() < (s.instantKill * dt)) {
        battle.enemyHp = 0;
        DOM.enemyEntity.classList.add('death-flash');
        setTimeout(() => DOM.enemyEntity.classList.remove('death-flash'), 400);
    }

    let dps = s.dps;
    if (Math.random() < s.extraAttack) dps *= 2.0;

    let isCrit = false;
    if (Math.random() < s.critRate) {
        let critMulti = 3.0;
        if (battle.enemyMaxHp > 0 && battle.enemyHp / battle.enemyMaxHp <= 0.5) {
            critMulti *= (1.0 + (s.executioner * 4.0));
        }
        critMulti = Math.pow(critMulti, 2);
        dps *= critMulti;
        isCrit = true;
    }

    if (Number.isNaN(dps) || !Number.isFinite(dps) || dps < 0) dps = 0;
    battle.enemyHp -= dps * dt;

    // ヒット演出表示
    if (now % Math.floor(600 / game.gameSpeed) < 35 && dps > 0) {
        const popVal = isCrit ? `CRITICAL! ${formatNumber(dps / 2)}` : formatNumber(dps / 2);
        createPop(popVal, false, isCrit);
        DOM.enemyEntity.classList.add('hit-flash');
        setTimeout(() => DOM.enemyEntity.classList.remove('hit-flash'), 100);
    }
}

function checkEnemyDeath(s) {
    if (battle.enemyHp > 0) return;

    game.totalKills++;
    game.killsInSession++;
    game.dailyData.dailyKills = (game.dailyData.dailyKills || 0) + 1;
    if (battle.isBoss) game.dailyData.dailyBossKills = (game.dailyData.dailyBossKills || 0) + 1;
    game.checkMissions();

    let g = 10 * Math.pow(1.2, Math.max(0, game.stage - 1)) * s.goldMulti;
    if (battle.isBoss) g *= (5 * s.bossCoin);
    if (battle.isRare) g *= 20;
    if (Math.random() < s.tripleGold) g *= 3;
    if (Math.random() < s.doubleReward) g *= 2;

    if (Number.isNaN(g) || !Number.isFinite(g) || g < 0) g = 0;

    game.gold += g;
    game.dailyData.dailyGoldEarned = (game.dailyData.dailyGoldEarned || 0) + g;
    if (game.stage > (game.dailyData.dailyMaxStage || 0)) game.dailyData.dailyMaxStage = game.stage;
    createPop(g, true);
    spawnEnemy();
}

function checkPlayerDeath(dt, s) {
    let dmg = Math.max(0, (2 + game.stage * 1.5) * dt);
    if (Number.isNaN(dmg) || !Number.isFinite(dmg)) dmg = 1;

    if (Math.random() >= s.evade) {
        battle.allyHp -= dmg;
        if (s.reflect > 0) battle.enemyHp -= (dmg * s.reflect * 10);
    }

    if (battle.allyHp <= 0) {
        const crack = document.getElementById('stage-down-crack');
        DOM.battleScreen.classList.add('shake-screen');
        crack.style.display = 'block';
        crack.style.opacity = '1';

        setTimeout(() => {
            DOM.battleScreen.classList.remove('shake-screen');
            crack.style.opacity = '0';
            setTimeout(() => crack.style.display = 'none', 300);
        }, 1000);

        let currentStage = isNaN(game.stage) ? 1 : game.stage;
        game.stage = Math.max(0, currentStage - 2);
        spawnEnemy();
        battle.allyHp = isNaN(battle.allyMaxHp) || battle.allyMaxHp <= 0 ? 200 : battle.allyMaxHp;
    }
}

function loop() {
    try {
        const now = Date.now();
        let delta = (now - battle.lastTick) / 1000;
        battle.lastTick = now;

        if (delta > GAME_CONFIG.offlineTimeCapSec) delta = GAME_CONFIG.offlineTimeCapSec;

        let battleDelta = Math.min(delta, 1.0);
        if (now < game.activeBuffs.hasteEndTime) battleDelta *= 2.0;
        const dt = battleDelta * game.gameSpeed;

        const s = game.getStats();

        updateEconomy(delta, now);
        updateCombat(dt, now, s);
        checkEnemyDeath(s);
        checkPlayerDeath(dt, s);

        updateUI();
    } catch (e) {
        console.error("Critical Loop Error:", e);
    }
    requestAnimationFrame(loop);
}

// === デイリー実績の描画関数 ===
function renderDailyMissions() {
    const container = document.getElementById('daily-mission-list');
    if (!container) return;
    container.innerHTML = '';

    game.checkDailyReset();

    DAILY_MISSIONS.forEach(dm => {
        const current = game.dailyData[dm.trackKey] || 0;
        const progress = Math.min(current / dm.target, 1);
        const isCompleted = current >= dm.target;
        const isClaimed = game.dailyData.claimed[dm.id] === true;

        const card = document.createElement('div');
        card.className = 'daily-mission-card' + (isClaimed ? ' claimed' : (isCompleted ? ' completed' : ''));

        let btnHtml = '';
        if (isClaimed) {
            btnHtml = '<button class="claim-btn claimed-btn" disabled>✔ 受け取り済み</button>';
        } else if (isCompleted) {
            btnHtml = `<button class="claim-btn available" onclick="claimDailyReward('${dm.id}')">🎁 報酬を受け取る (${dm.reward} Orbs)</button>`;
        } else {
            btnHtml = `<button class="claim-btn locked" disabled>未達成 (${Math.floor(progress * 100)}%)</button>`;
        }

        card.innerHTML = `
            <div class="daily-mission-header">
                <span class="daily-mission-title">${dm.icon} ${dm.text}</span>
                <span class="daily-mission-reward">🎁 ${dm.reward} Orbs</span>
            </div>
            <div class="daily-progress-bar">
                <div class="daily-progress-fill" style="width:${(progress * 100).toFixed(1)}%"></div>
            </div>
            <div class="daily-progress-text">${Math.min(current, dm.target).toLocaleString()} / ${dm.target.toLocaleString()}</div>
            ${btnHtml}
        `;
        container.appendChild(card);
    });

    updateDailyResetTimer();
}

function claimDailyReward(missionId) {
    const dm = DAILY_MISSIONS.find(m => m.id === missionId);
    if (!dm) return;
    if (game.dailyData.claimed[missionId]) return;
    const current = game.dailyData[dm.trackKey] || 0;
    if (current < dm.target) return;

    game.dailyData.claimed[missionId] = true;
    game.orbs += dm.reward;
    game.save();
    renderDailyMissions();
    updateUI();
}

function updateDailyResetTimer() {
    game.checkDailyReset(); // 0時またぎ自動リセット適応
    const el = document.getElementById('daily-reset-timer');
    if (!el) return;
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const diff = tomorrow - now;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    el.textContent = `次のリセットまで: ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Global scope initialization
const game = new Game();
const battle = {
    enemyHp: 50,
    enemyMaxHp: 50,
    allyHp: 200,
    allyMaxHp: 200,
    isBoss: false,
    isRare: false,
    lastTick: Date.now()
};

game.load();
cacheDOM();
initUI();
renderDailyMissions();
updateUI();
window.addEventListener('mousemove', moveTooltip);
requestAnimationFrame(loop);
setInterval(() => game.save(), 5000);
setInterval(updateDailyResetTimer, 1000);
