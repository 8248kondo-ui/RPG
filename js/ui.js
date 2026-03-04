const DOM = {};

function cacheDOM() {
    DOM.battleScreen = document.getElementById('battle-screen');
    DOM.speedControls = document.getElementById('speed-controls');
    DOM.stageNum = document.getElementById('stage-num');
    DOM.goldVal = document.getElementById('gold-val');
    DOM.orbVal = document.getElementById('orb-val');
    DOM.gpsVal = document.getElementById('gps-val');
    DOM.dpsVal = document.getElementById('dps-val');
    DOM.multiVal = document.getElementById('multi-val');
    DOM.allyHpBar = document.getElementById('ally-hp-bar');
    DOM.enemyHpBar = document.getElementById('enemy-hp-bar');
    DOM.enemyEntity = document.getElementById('enemy-entity');
    DOM.allyEntity = document.getElementById('ally-entity');
    DOM.synergyList = document.getElementById('synergy-list');
    DOM.enemyAvatar = document.getElementById('enemy-avatar');
    DOM.missionSummaryText = document.getElementById('mission-summary-text');
    DOM.missionRewardVal = document.getElementById('mission-reward-val');
}

// --- UI 関数群 ---
function showTab(t) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`${t}-tab`).classList.add('active');
    if (typeof event !== 'undefined' && event && event.currentTarget) event.currentTarget.classList.add('active');

    if (t === 'daily') renderDailyMissions();
}

function toggleBuyMode() {
    if (game.buyMode === 1) game.buyMode = 10;
    else if (game.buyMode === 10) game.buyMode = -1;
    else game.buyMode = 1;
    document.getElementById('buy-mode-btn').textContent = `購入: ${game.buyMode === -1 ? 'MAX' : 'x' + game.buyMode}`;
    updateUI();
}

function toggleQuestBuyMode() {
    if (game.questBuyMode === 1) game.questBuyMode = 10;
    else if (game.questBuyMode === 10) game.questBuyMode = -1;
    else game.questBuyMode = 1;
    document.getElementById('quest-buy-mode-btn').textContent = `強化: ${game.questBuyMode === -1 ? 'MAX' : 'x' + game.questBuyMode}`;
    updateUI();
}

function setSpeed(val) {
    game.gameSpeed = val;
    document.querySelectorAll('.speed-btn').forEach(btn => btn.classList.remove('active'));
    if (val === 1) document.querySelector('.speed-controls button:nth-child(1)').classList.add('active');
    if (val === 2) document.getElementById('speed-x2').classList.add('active');
    if (val === 3) document.getElementById('speed-x3').classList.add('active');
}

function initUI() {
    const list = document.getElementById('unit-list');
    list.innerHTML = '';
    UNIT_TYPES.forEach(type => {
        const card = document.createElement('div');
        card.id = `unit-card-${type.id}`;
        card.className = 'item-card';
        card.style.display = game.stage >= type.unlockAt ? 'flex' : 'none';
        card.innerHTML = `
            <div class="item-icon-wrapper">
                <div class="item-icon">${type.icon}</div>
                <div class="unit-label">${type.name}</div>
            </div>
            <div class="item-info">
                <span class="item-name">${type.name} (Lv <span id="lv-${type.id}">0</span>)</span>
                <span class="item-desc">Atk: ${formatNumber(type.baseAtk)} / Cost: <span id="cost-${type.id}">0</span></span>
            </div>
            <button class="buy-btn" id="btn-${type.id}" onclick="buyUnit('${type.id}')">雇用</button>
        `;
        list.appendChild(card);
    });

    const mList = document.getElementById('mission-list-full');
    mList.innerHTML = '';
    game.missions.forEach(m => {
        const el = document.createElement('div');
        el.id = `mission-full-${m.id}`;
        el.className = 'mission-item';
        el.innerHTML = `
            <div class="mission-info-top">
                <span style="font-weight:bold;">${m.text}</span>
                <span style="color:var(--orb); font-size:0.8rem;">🎁 ${m.reward} Orbs</span>
            </div>
            <div class="mission-progress-container">
                <div class="mission-progress-fill" id="m-full-prog-${m.id}"></div>
            </div>
            <div style="font-size:0.75rem; color:var(--text-dim); text-align:right;">
                <span id="m-full-val-${m.id}">0</span> / ${m.target}
            </div>
        `;
        mList.appendChild(el);
    });

    filterArtifacts();
    updateGachaOwned();
    initQuests();
    initSkills();
}

function initQuests() {
    const list = document.getElementById('quest-list');
    list.innerHTML = '';
    QUEST_DATA.forEach(q => {
        const card = document.createElement('div');
        card.id = `quest-card-${q.id}`;
        card.className = 'item-card';
        card.innerHTML = `
            <div class="item-icon-wrapper">
                <div class="item-icon">${q.icon}</div>
                <div class="unit-label">LEVEL <span id="qlv-${q.id}">0</span></div>
            </div>
            <div class="item-info">
                <div style="display:flex; align-items:center; justify-content:space-between;">
                    <span class="item-name">${q.name}</span>
                    <span class="gps-increase" id="qinc-${q.id}">+${formatNumber(q.baseGps)}</span>
                </div>
                <span class="item-desc">GPS: +${formatNumber(q.baseGps)} / Cost: <span id="qcost-${q.id}">0</span></span>
            </div>
            <button class="buy-btn" id="qbtn-${q.id}" onclick="buyQuest('${q.id}')">強化</button>
            <div class="quest-progress-bg"><div class="quest-progress-fill" id="qprog-${q.id}"></div></div>
        `;
        list.appendChild(card);
    });
}

function initSkills() {
    const container = document.getElementById('skill-list');
    if (!container) return;
    container.innerHTML = '';
    Object.keys(SKILL_DATA).forEach(id => {
        const s = SKILL_DATA[id];
        const card = document.createElement('div');
        card.className = 'skill-card';
        card.onclick = () => useSkill(id);
        card.innerHTML = `
            <div class="skill-icon">${s.icon}</div>
            <div class="skill-info">
                <div class="skill-name">${s.name}</div>
                <div class="skill-desc">${s.desc}</div>
            </div>
            <div class="skill-cooldown-overlay" id="skill-cd-${id}"></div>
        `;
        container.appendChild(card);
    });
}

function filterArtifacts() {
    const rarity = document.getElementById('rarity-filter').value;
    const artGrid = document.getElementById('artifact-list');
    artGrid.innerHTML = '';
    artGrid.style.display = 'grid';
    artGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(60px, 1fr))';
    artGrid.style.gap = '10px';
    artGrid.style.padding = '10px';

    ARTIFACT_DATA.forEach(art => {
        if (rarity !== 'ALL' && art.rarity !== rarity) return;
        const slot = document.createElement('div');
        slot.id = `art-slot-${art.id}`;
        slot.className = 'res-art-slot';
        const isOwned = game.artMgr.owned[art.id] > 0;
        if (isOwned) {
            slot.classList.add(`rarity-${art.rarity.toLowerCase()}`, 'owned');
            slot.innerHTML = `<div style="font-size:1.8rem;">${art.icon}</div>`;
            if (art.rarity === 'L') {
                slot.onclick = () => showLegendDetail(art);
                slot.style.cursor = 'pointer';
            }
        } else {
            slot.style.opacity = '0.2';
            slot.style.filter = 'grayscale(1)';
            slot.innerHTML = `<div style="font-size:1.8rem;">🔒</div>`;
        }
        slot.onmouseenter = (e) => { if (isOwned) showTooltip(e, art); };
        slot.onmouseleave = hideTooltip;
        artGrid.appendChild(slot);
    });
}

function showLegendDetail(art) {
    const lv = game.artMgr.owned[art.id] || 0;
    const popup = document.getElementById('legend-detail');
    const content = document.getElementById('legend-detail-content');
    content.innerHTML = `
        <div style="font-size:3rem; margin-bottom:10px;">${art.icon}</div>
        <div style="color:var(--gold); font-weight:bold; letter-spacing:2px;">LEGENDARY ARTIFACT</div>
        <div style="font-size:1.5rem; font-weight:bold; margin:10px 0;">${art.name}</div>
        <div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:8px; font-size:0.85rem; text-align:left; color:var(--text-dim);">
            <b>固有スキル: ${EFFECT_TEXT[art.special] || 'なし'}</b><br>
            効果: ${EFFECT_TEXT[art.effect] || art.effect.replace('_', ' ')} (+${(art.value * 100).toFixed(1)}%/Lv)<br><br>
            <span style="color:var(--text-main)">現在レベル: ${lv}</span><br>
            <span style="color:var(--accent-secondary)">この秘宝を持ち続けるだけであなたの魂を永続的に強化します。</span>
        </div>
    `;
    popup.style.display = 'block';
}

function closeLegend() { document.getElementById('legend-detail').style.display = 'none'; }

function showTooltip(e, art) {
    const lv = game.artMgr.owned[art.id] || 0;
    const r = RARITIES[art.rarity];
    const tt = document.getElementById('custom-tooltip');
    tt.innerHTML = `
        <div style="color:${r.color}; font-size:0.7rem; font-weight:bold;">${r.name}</div>
        <div style="font-weight:bold; font-size:1rem; margin:4px 0;">${art.name}</div>
        <div style="color:var(--accent-secondary);">Level: ${lv.toLocaleString()}</div>
        <div style="font-size:0.75rem; color:var(--text-dim); margin-top:8px;">
            効果: ${EFFECT_TEXT[art.effect] || art.effect.replace('_', ' ')} (+${(art.value * 100).toFixed(1)}%/Lv)
            ${art.special ? `<br><span style="color:var(--gold)">★特殊: ${EFFECT_TEXT[art.special] || art.special}</span>` : ''}
        </div>
    `;
    tt.style.display = 'block';
    moveTooltip(e);
}

function moveTooltip(e) {
    const tt = document.getElementById('custom-tooltip');
    const ttWidth = tt.offsetWidth || 250;
    const ttHeight = tt.offsetHeight || 150;
    const margin = 15;
    let leftPos = e.clientX + margin;
    let topPos = e.clientY + margin;
    if (leftPos + ttWidth > window.innerWidth) leftPos = e.clientX - ttWidth - margin;
    if (topPos + ttHeight > window.innerHeight) topPos = e.clientY - ttHeight - margin;
    leftPos = Math.max(margin, leftPos);
    topPos = Math.max(margin, topPos);
    tt.style.left = leftPos + 'px';
    tt.style.top = topPos + 'px';
}

function hideTooltip() { document.getElementById('custom-tooltip').style.display = 'none'; }

function updateGachaOwned() {
    const list = document.getElementById('gacha-owned-list');
    if (!list) return;
    list.innerHTML = '';
    for (const [id, count] of Object.entries(game.gachaMgr.owned)) {
        if (count <= 0) continue;
        const data = GACHA_ITEMS.find(i => i.id === id);
        if (!data) continue;
        const el = document.createElement('div');
        el.className = 'gacha-item';
        el.innerHTML = `
            <div style="font-size:1.5rem;">${data.icon}</div>
            <div style="display:flex; flex-direction:column; text-align:left;">
                <div style="font-weight:bold;">${data.name} x${count}</div>
                <div style="font-size:0.7rem; color:var(--text-dim);">${data.desc}</div>
            </div>
        `;
        list.appendChild(el);
    }
}

function updateUI() {
    const s = game.getStats();
    const screen = document.getElementById('battle-screen');
    const now = Date.now();

    screen.className = 'battle-screen';
    if (battle.isBoss) screen.classList.add('bg-boss');
    else screen.classList.add(game.stage < 10 ? 'bg-plains' : (game.stage < 20 ? 'bg-ruins' : 'bg-plains'));

    if (game.totalKills >= 50) DOM.speedControls.style.display = 'flex';
    DOM.stageNum.innerHTML = battle.isBoss ? `<span style="color:var(--danger)">BOSS</span> ${game.stage}` : game.stage;
    DOM.goldVal.textContent = formatNumber(game.gold);
    DOM.orbVal.textContent = game.orbs.toLocaleString();
    DOM.gpsVal.textContent = formatNumber(game.getGps());
    DOM.dpsVal.textContent = formatNumber(s.dps);

    DOM.multiVal.textContent = `x${s.totalMultiplier.toFixed(1)}`;

    DOM.allyHpBar.style.width = Math.max(0, (battle.allyHp / battle.allyMaxHp) * 100) + '%';
    DOM.enemyHpBar.style.width = Math.max(0, (battle.enemyHp / battle.enemyMaxHp) * 100) + '%';

    UNIT_TYPES.forEach(type => {
        const lv = game.units[type.id] || 0;
        const maxBuyCount = game.getMaxBuy(type.id);
        const bCount = game.buyMode === -1 ? Math.max(1, maxBuyCount) : game.buyMode;
        const cost = game.getUnitCost(type.id, bCount);
        const lvEl = document.getElementById(`lv-${type.id}`);
        const costEl = document.getElementById(`cost-${type.id}`);
        const btn = document.getElementById(`btn-${type.id}`);
        if (lvEl) lvEl.textContent = lv.toLocaleString();
        if (costEl) costEl.textContent = formatNumber(cost);
        if (btn) btn.disabled = (game.buyMode === -1 && maxBuyCount === 0) || (game.gold < cost);
        const card = document.getElementById(`unit-card-${type.id}`);
        if (card) card.style.display = game.stage >= type.unlockAt ? 'flex' : 'none';
    });

    QUEST_DATA.forEach(q => {
        let actualQCount = game.getMaxQuestBuy(q.id, game.questBuyMode);
        if (game.questBuyMode === -1) actualQCount = game.getMaxQuestBuy(q.id, 999);
        if (actualQCount === 0) actualQCount = 1;

        const cost = game.getQuestCost(q.id, actualQCount);
        const qlvEl = document.getElementById(`qlv-${q.id}`);
        const qcostEl = document.getElementById(`qcost-${q.id}`);
        const qbtn = document.getElementById(`qbtn-${q.id}`);
        const qincEl = document.getElementById(`qinc-${q.id}`);
        if (qlvEl) qlvEl.textContent = (game.quests[q.id] || 0).toLocaleString();
        if (qcostEl) qcostEl.textContent = formatNumber(cost);
        if (qbtn) {
            qbtn.disabled = game.gold < cost;
            const modeText = game.questBuyMode === -1 ? 'MAX' : 'x' + game.questBuyMode;
            qbtn.textContent = `強化 (${modeText})`;
        }
        if (qincEl) qincEl.textContent = `+${formatNumber(q.baseGps * s.goldMulti * actualQCount)}`;
    });

    Object.keys(SKILL_DATA).forEach(id => {
        const s = SKILL_DATA[id];
        const last = game.skills[id].lastUsed;
        const elapsed = (now - last) / 1000;
        const cdOverlay = document.getElementById(`skill-cd-${id}`);
        if (cdOverlay) {
            const h = Math.max(0, 1 - (elapsed / s.cooldown)) * 100;
            cdOverlay.style.height = h + '%';
        }
    });

    const gbtn1 = document.querySelector('.gacha-btn-1');
    const gbtn10 = document.querySelector('.gacha-btn-10');
    if (gbtn1) gbtn1.disabled = game.orbs < 100;
    if (gbtn10) gbtn10.disabled = game.orbs < 1000;

    let activeMission = game.missions.find(m => !m.done) || game.missions[game.missions.length - 1];
    if (DOM.missionSummaryText) DOM.missionSummaryText.textContent = `🏆 ${activeMission.text} (${Math.min(game.totalKills, activeMission.target)}/${activeMission.target})${activeMission.done ? ' ✔' : ''}`;
    if (DOM.missionRewardVal) DOM.missionRewardVal.textContent = activeMission.reward;

    game.missions.forEach(m => {
        const el = document.getElementById(`mission-full-${m.id}`);
        const prog = document.getElementById(`m-full-prog-${m.id}`);
        const val = document.getElementById(`m-full-val-${m.id}`);
        if (el) el.className = 'mission-item' + (m.done ? ' done' : '');
        if (prog) prog.style.width = (Math.min(game.totalKills / m.target, 1) * 100) + '%';
        if (val) val.textContent = Math.min(game.totalKills, m.target).toLocaleString();
    });

    // === シナジー描画 ===
    if (DOM.synergyList) {
        DOM.synergyList.innerHTML = '';
        SYNERGY_DATA.forEach(syn => {
            const isActive = syn.req.every(unitId => (game.units[unitId] || 0) > 0);
            const badge = document.createElement('div');
            badge.className = 'synergy-badge' + (isActive ? ' active' : '');
            const reqNames = syn.req.map(uid => {
                const u = UNIT_TYPES.find(t => t.id === uid);
                return u ? u.name : uid;
            }).join(' + ');
            badge.innerHTML = `<span style="font-weight:bold;">${syn.name}</span> <span style="font-size:0.65rem; opacity:0.8;">${reqNames}</span><br><span style="font-size:0.6rem;">${syn.desc}</span>`;
            badge.title = `${syn.name} ${syn.desc} (必要: ${reqNames})`;
            DOM.synergyList.appendChild(badge);
        });
    }

    const pendingOrbs = Math.floor((game.stage / 10) * s.orbStack); // orbStack is from Stats in full version
    const pendingEl = document.getElementById('pending-orbs');
    if (pendingEl) pendingEl.textContent = isNaN(pendingOrbs) ? "0" : pendingOrbs.toLocaleString();
    const returnEl = document.getElementById('return-btn');
    if (returnEl) returnEl.disabled = game.stage < 10;
}

function openMissions() { document.getElementById('mission-modal').style.display = 'flex'; }
function closeMissions() { document.getElementById('mission-modal').style.display = 'none'; }

function createAtkUpPop(targetEl) {
    const rect = targetEl.getBoundingClientRect();
    const pop = document.createElement('div');
    pop.className = 'atk-up-pop';
    pop.textContent = '攻撃力UP!';
    pop.style.left = (rect.left + rect.width / 2) + 'px';
    pop.style.top = (rect.top + window.scrollY) - 20 + 'px';
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 600);
}

function buyUnit(id) {
    let bCount = game.buyMode === -1 ? game.getMaxBuy(id) : game.buyMode;
    if (bCount < 1) return;
    const cost = game.getUnitCost(id, bCount);
    if (game.gold >= cost) {
        game.gold -= cost; game.units[id] += bCount;
        game.dailyData.dailyUnitBuys = (game.dailyData.dailyUnitBuys || 0) + bCount;
        if (event && event.currentTarget) createAtkUpPop(event.currentTarget);
        updateUI(); game.save();
    }
}

function buyQuest(id) {
    let qCount = game.questBuyMode === -1 ? game.getMaxQuestBuy(id, 999) : game.questBuyMode;
    let actualCount = game.getMaxQuestBuy(id, qCount);
    if (actualCount < 1) return;
    const cost = game.getQuestCost(id, actualCount);
    if (game.gold >= cost) {
        game.gold -= cost;
        game.quests[id] = (game.quests[id] || 0) + actualCount;
        game.dailyData.dailyQuestBuys = (game.dailyData.dailyQuestBuys || 0) + actualCount;
        if (event && event.currentTarget) createAtkUpPop(event.currentTarget);
        updateUI(); game.save();
    }
}

function pullGacha() {
    if (game.orbs >= 100) {
        game.orbs -= 100;
        game.dailyData.dailyGachaPulls = (game.dailyData.dailyGachaPulls || 0) + 1;
        const res = game.gachaMgr.pull();
        if (res) showGachaResults([res]);
        else alert('所持上限です。');
        updateGachaOwned(); updateUI(); game.save();
    } else alert('オーブが足りません。');
}

function pullGacha10() {
    if (game.orbs >= 1000) {
        game.orbs -= 1000;
        game.dailyData.dailyGachaPulls = (game.dailyData.dailyGachaPulls || 0) + 10;
        const results = [];
        for (let i = 0; i < 10; i++) {
            const res = game.gachaMgr.pull();
            if (res) results.push(res);
        }
        if (results.length > 0) showGachaResults(results);
        else alert('所持上限です。');
        updateGachaOwned(); updateUI(); game.save();
    } else alert('1000 Orbs必要です。');
}

function showGachaResults(items) {
    const resTitle = document.getElementById('res-title');
    const resStats = document.getElementById('res-stats-area');
    const resArtList = document.getElementById('res-art-list');
    resTitle.textContent = "ガチャ結果";
    resTitle.style.color = "var(--orb)";
    resStats.style.display = "none";
    const counts = {};
    items.forEach(it => counts[it.id] = (counts[it.id] || 0) + 1);
    const rarityOrder = { 'L': 5, 'SR': 4, 'HR': 3, 'R': 2, 'N': 1 };
    const sortedIds = Object.keys(counts).sort((a, b) => {
        const d1 = GACHA_ITEMS.find(it => it.id === a);
        const d2 = GACHA_ITEMS.find(it => it.id === b);
        return rarityOrder[d2.rarity] - rarityOrder[d1.rarity];
    });
    resArtList.innerHTML = '';
    sortedIds.forEach(id => {
        const item = GACHA_ITEMS.find(it => it.id === id);
        const count = counts[id];
        const slot = document.createElement('div');
        slot.className = `res-art-slot rarity-${item.rarity.toLowerCase()}`;
        slot.innerHTML = `<div style="font-size:1.8rem;">${item.icon}</div>${count > 1 ? `<div class="art-multi">×${count}</div>` : ''}`;
        slot.onmouseenter = (e) => {
            const tt = document.getElementById('custom-tooltip');
            tt.innerHTML = `<div style="color:${RARITIES[item.rarity].color}; font-weight:bold;">${RARITIES[item.rarity].name}</div><div style="font-weight:bold;">${item.name}</div><div style="font-size:0.75rem; color:var(--text-dim); margin-top:5px;">${item.desc}</div>`;
            tt.style.display = 'block';
            moveTooltip(e);
        };
        slot.onmouseleave = hideTooltip;
        resArtList.appendChild(slot);
    });
    document.getElementById('result-overlay').style.display = 'flex';
}

function createPop(val, isGold = false, isCrit = false) {
    const el = document.createElement('div');
    el.className = 'damage-popup';
    el.textContent = typeof val === 'string' ? val : (isGold ? `+${formatNumber(val)}G` : `-${formatNumber(val)}`);
    if (isCrit) { el.style.color = '#ffeb3b'; el.style.fontSize = '1.8rem'; el.style.zIndex = '150'; }
    else el.style.color = isGold ? 'var(--gold)' : 'var(--danger)';
    el.style.left = `calc(50% + ${(Math.random() * 80 - 40)}px)`;
    el.style.top = `45%`;
    DOM.battleScreen.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

function spawnEnemy() {
    try {
        game.stage++;
        const isBoss = (game.stage % 10 === 0);
        battle.isBoss = isBoss;
        let hp;
        if (game.stage < 160) hp = 50 * Math.pow(1.22, Math.max(0, game.stage - 1));
        else if (game.stage < 500) hp = 50 * Math.pow(1.22, 159) * Math.pow(1.12, game.stage - 160);
        else hp = 50 * Math.pow(1.22, 159) * Math.pow(1.12, 340) * Math.pow(1.08, game.stage - 500);

        if (!Number.isFinite(hp)) hp = 1e300;
        if (isBoss) {
            hp *= 10;
            const banner = document.getElementById('boss-banner');
            banner.classList.add('show');
            DOM.battleScreen.classList.add('edge-flash-red');
            setTimeout(() => { banner.classList.remove('show'); DOM.battleScreen.classList.remove('edge-flash-red'); }, 2000);
        }
        const isRare = !isBoss && Math.random() < 0.05;
        if (isRare) hp *= 0.5;
        battle.enemyMaxHp = Math.max(10, Math.floor(hp));
        battle.enemyHp = battle.enemyMaxHp;
        battle.isRare = isRare;
        DOM.enemyAvatar.textContent = isRare ? '💰' : (isBoss ? '🐉' : ENEMY_ICONS[Math.floor(Math.random() * ENEMY_ICONS.length)]);
        DOM.enemyAvatar.style.filter = isRare ? 'drop-shadow(0 0 10px gold)' : '';
    } catch (e) { console.error("Enemy spawn error:", e); }
}

function handleReturn() {
    if (!confirm("帰還しますか？ステージとゴールドはリセットされます。")) return;
    try {
        const s = game.getStats();
        const orbs = Math.floor((game.stage / 10) * (s.orbStack || 1));
        const artifactCount = game.stage;
        const acquiredArts = game.artMgr.draw(artifactCount);

        document.getElementById('res-title').textContent = "帰還成功";
        document.getElementById('res-title').style.color = "var(--accent-primary)";
        document.getElementById('res-stats-area').style.display = "block";
        document.getElementById('res-stage').textContent = game.stage;
        document.getElementById('res-orbs').textContent = orbs;

        const resArtList = document.getElementById('res-art-list');
        resArtList.innerHTML = '';
        if (acquiredArts.length > 0) {
            const counts = {};
            acquiredArts.forEach(art => counts[art.id] = (counts[art.id] || 0) + 1);
            const rarityOrder = { 'L': 5, 'SR': 4, 'HR': 3, 'R': 2, 'N': 1 };
            const sortedIds = Object.keys(counts).sort((a, b) => rarityOrder[ARTIFACT_DATA.find(x => x.id === b).rarity] - rarityOrder[ARTIFACT_DATA.find(x => x.id === a).rarity]);
            sortedIds.forEach(id => {
                const art = ARTIFACT_DATA.find(a => a.id === id);
                const count = counts[id];
                const slot = document.createElement('div');
                slot.className = `res-art-slot rarity-${art.rarity.toLowerCase()}`;
                slot.innerHTML = `<div style="font-size:1.8rem;">${art.icon}</div>${count > 1 ? `<div class="art-multi">×${count}</div>` : ''}`;
                slot.onmouseenter = (e) => showTooltip(e, art);
                slot.onmouseleave = hideTooltip;
                resArtList.appendChild(slot);
            });
        } else resArtList.innerHTML = '<div style="padding:20px;">なし</div>';

        game.orbs += orbs;
        game.stage = 0;
        game.gold = 0;
        game.killsInSession = 0;
        const g = game.gachaMgr.getBonuses();
        UNIT_TYPES.forEach(t => game.units[t.id] = g.initialLv || 0);
        battle.enemyHp = 50; battle.enemyMaxHp = 50; battle.isBoss = false;
        game.save();
        document.getElementById('result-overlay').style.display = 'flex';
        initUI(); updateUI();
    } catch (e) { console.error("Return error:", e); }
}

function openHelp() { document.getElementById('help-modal').style.display = 'flex'; }
function closeHelp() { document.getElementById('help-modal').style.display = 'none'; }
function closeResult() {
    document.getElementById('result-overlay').style.display = 'none';
    spawnEnemy();
    initUI(); updateUI(); game.save();
}

function closeLegend() { document.getElementById('legend-detail').style.display = 'none'; }
