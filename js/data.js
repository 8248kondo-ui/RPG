const GAME_CONFIG = {
    baseUnitCostCutMultiplier: 1.15, // 兵士雇用コストの指数倍率
    baseQuestCostMultiplier: 1.20,   // クエスト強化コストの指数倍率
    offlineTimeCapSec: 28800,        // オフライン進行の上限時間 (8時間 = 28800秒)
    damageScaleFactor: 1.15,         // ダメージスケーリングの基準値
    stageHpScaling: {
        base: 50,
        scale1: 1.22, // Stage 1~159
        scale2: 1.12, // Stage 160~499
        scale3: 1.08, // Stage 500~799
        scale4: 1.40, // Stage 800~1000 ("The Wall")
        scale5: 1.02  // Stage 1001~
    },
    uiUpdateRateMs: 33 // UI更新・攻撃アニメーションの基準レート (約30fps)
};
const UNIT_TYPES = [
    { id: 'infantry', name: '歩兵', icon: '🗡️', baseAtk: 25, baseCost: 15, unlockAt: 0 },
    { id: 'archer', name: '弓兵', icon: '🏹', baseAtk: 100, baseCost: 100, unlockAt: 0 },
    { id: 'knight', name: '騎士', icon: '🏇', baseAtk: 400, baseCost: 800, unlockAt: 0 },
    { id: 'samurai', name: '侍', icon: '👘', baseAtk: 2000, baseCost: 5000, unlockAt: 0 },
    { id: 'warrior', name: 'ビッグウォーリア', icon: '🛡️', baseAtk: 12000, baseCost: 50000, unlockAt: 100 },
    { id: 'golem', name: 'ゴーレム', icon: '🗿', baseAtk: 65000, baseCost: 500000, unlockAt: 200 },
    { id: 'dragon', name: 'ドラゴンライダー', icon: '🐉', baseAtk: 400000, baseCost: 8000000, unlockAt: 300 },
    { id: 'demon_lord', name: '魔王', icon: '👿', baseAtk: 5000000, baseCost: 500000000, unlockAt: 400 },
    { id: 'god_slayer', name: '神喰らい', icon: '☄️', baseAtk: 100000000, baseCost: 100000000000, unlockAt: 600 },
    { id: 'universe_creator', name: '宇宙の創造主', icon: '🌌', baseAtk: 2000000000, baseCost: 50000000000000, unlockAt: 800 }
];

const RARITIES = {
    L: { name: 'LEGEND', color: '#fbbf24', chance: 0.005 },
    SR: { name: 'SUPER RARE', color: '#a855f7', chance: 0.025 },
    HR: { name: 'HYPER RARE', color: '#3b82f6', chance: 0.07 },
    R: { name: 'RARE', color: '#22c55e', chance: 0.20 },
    N: { name: 'NORMAL', color: '#94a3b8', chance: 0.70 }
};

// スキルIDを日本語名に変換する辞書
const EFFECT_TEXT = {
    'atk_add': '全攻撃力UP',
    'atk_multi': '攻撃速度UP',
    'gold_multi': '獲得ゴールドUP',
    'hp_multi': '最大HP・防御UP',
    'area_damage': '確率で範囲ダメージを与える',
    'holy_regen': '聖なる光でHPが持続回復する',
    'curse_atk': 'HPを削り、攻撃力を極限まで高める',
    'crit_up': '致命的な一撃が出る確率が上昇',
    'pierce_shot': '敵の装甲を貫通してダメージを与える',
    'cheat_death': '死の淵から一度だけ蘇る',
    'reflect_dmg': '受けたダメージの一部を敵に反射する',
    'slow_move': '防御を極めるが、行動がわずかに遅れる',
    'resist_all': 'あらゆる状態異常やデバフを無効化する',
    'absorb_atk': '敵の攻撃を吸収し、自らの力に変える',
    'lucky_drop': '敵がレアアイテムを落としやすくなる',
    'extra_coin': '敵を倒した際、追加でコインを獲得する',
    'pain_coin': 'ダメージを受けるたび、わずかにゴールドを得る',
    'greed_aura': '強欲のオーラを纏い、収入源を増幅させる',
    'boss_rich': 'ボス撃破時の報酬が大幅に増加する',
    'evasion_up': '敵の攻撃を華麗に回避する確率が上昇',
    'double_tap': '一撃で二度のダメージを与える',
    'time_stop': '確率で敵の時間を一時的に停止させる',
    'no_delay': '攻撃の間隔が限界まで短縮される',
    'instant_action': '行動のリキャストタイムが消失する',
    'divine_shred': '神の加護により、ステージが進むほど強くなる',
    'instant_kill': '低確率で敵を一撃のもとに屠る'
};

const ARTIFACT_DATA = [
    // --- [武器系：全攻撃力アップ] ---
    { id: 'wood_stick', rarity: 'N', name: '木の棒', icon: '🦯', effect: 'atk_add', value: 0.05 },
    { id: 'bronze_dagger', rarity: 'N', name: '銅の短剣', icon: '🗡️', effect: 'atk_add', value: 0.10 },
    { id: 'hunter_bow', rarity: 'N', name: '狩人の弓', icon: '🏹', effect: 'atk_add', value: 0.15 },
    { id: 'apprentice_staff', rarity: 'N', name: '見習いの杖', icon: '🪄', effect: 'atk_add', value: 0.15 },
    { id: 'stone_axe', rarity: 'N', name: '石の斧', icon: '🪓', effect: 'atk_add', value: 0.20 },
    { id: 'steel_sword', rarity: 'R', name: '鋼の長剣', icon: '⚔️', effect: 'atk_add', value: 0.35 },
    { id: 'knight_spear', rarity: 'R', name: '騎士の槍', icon: '🔱', effect: 'atk_add', value: 0.40 },
    { id: 'battle_axe', rarity: 'R', name: 'バトルアックス', icon: '🪓', effect: 'atk_add', value: 0.45 },
    { id: 'mage_staff', rarity: 'R', name: '魔道士の杖', icon: '🔮', effect: 'atk_add', value: 0.45 },
    { id: 'cross_bow', rarity: 'R', name: 'クロスボウ', icon: '🏹', effect: 'atk_add', value: 0.50 },
    { id: 'platinum_sword', rarity: 'HR', name: 'プラチナソード', icon: '🗡️', effect: 'atk_add', value: 0.60 },
    { id: 'guren_staff', rarity: 'HR', name: '紅蓮の杖', icon: '🔥', effect: 'atk_add', value: 0.65 },
    { id: 'berserker_axe', rarity: 'HR', name: '狂戦士の斧', icon: '🪓', effect: 'atk_add', value: 0.70 },
    { id: 'sniper_bow', rarity: 'HR', name: 'スナイパーボウ', icon: '🎯', effect: 'atk_add', value: 0.75 },
    { id: 'dragon_spear', rarity: 'HR', name: '竜骨の槍', icon: '🐉', effect: 'atk_add', value: 0.80 },
    { id: 'oric_sword', rarity: 'SR', name: 'オリハルコンの剣', icon: '✨', effect: 'atk_add', value: 0.85 },
    { id: 'holy_spear', rarity: 'SR', name: '聖騎士の槍', icon: '🔱', effect: 'atk_add', value: 0.90 },
    { id: 'stardust_staff', rarity: 'SR', name: '星屑の杖', icon: '🌠', effect: 'atk_add', value: 0.90 },
    { id: 'giant_axe', rarity: 'SR', name: '巨人の斧', icon: '🏚️', effect: 'atk_add', value: 0.95 },
    { id: 'angel_bow', rarity: 'SR', name: '天使の弓', icon: '👼', effect: 'atk_add', value: 1.00 },
    { id: 'excalibur', rarity: 'L', name: '聖剣エクスカリバー', icon: '⚔️', effect: 'atk_add', value: 4.00, special: 'holy_regen' },
    { id: 'muramasa', rarity: 'L', name: '妖刀村正', icon: '🗡️', effect: 'atk_add', value: 4.50, special: 'curse_atk' },
    { id: 'sun_staff', rarity: 'L', name: '太陽の杖', icon: '☀️', effect: 'atk_add', value: 3.50, special: 'area_damage' },
    { id: 'destruct_axe', rarity: 'L', name: '破壊の斧', icon: '🪓', effect: 'atk_add', value: 4.00, special: 'crit_up' },
    { id: 'celestial_bow', rarity: 'L', name: '天穹の弓', icon: '🏹', effect: 'atk_add', value: 3.50, special: 'pierce_shot' },

    // --- [盾系：防御力アップ] ---
    { id: 'wood_buckler', rarity: 'N', name: '木のバックラー', icon: '🛡️', effect: 'hp_multi', value: 0.10 },
    { id: 'leather_shield', rarity: 'N', name: '皮の盾', icon: '🛡️', effect: 'hp_multi', value: 0.15 },
    { id: 'bronze_shield', rarity: 'N', name: '銅の盾', icon: '🛡️', effect: 'hp_multi', value: 0.20 },
    { id: 'pot_lid', rarity: 'N', name: 'なべのふた', icon: '🍳', effect: 'hp_multi', value: 0.05 },
    { id: 'soldier_shield', rarity: 'N', name: '兵士の盾', icon: '🛡️', effect: 'hp_multi', value: 0.20 },
    { id: 'steel_shield', rarity: 'R', name: '鋼の盾', icon: '🛡️', effect: 'hp_multi', value: 0.35 },
    { id: 'silver_shield', rarity: 'R', name: '銀の盾', icon: '🛡️', effect: 'hp_multi', value: 0.40 },
    { id: 'knight_shield', rarity: 'R', name: '騎士の盾', icon: '🛡️', effect: 'hp_multi', value: 0.45 },
    { id: 'round_shield', rarity: 'R', name: 'ラウンドシールド', icon: '🛡️', effect: 'hp_multi', value: 0.40 },
    { id: 'kite_shield', rarity: 'R', name: 'カイトシールド', icon: '🛡️', effect: 'hp_multi', value: 0.50 },
    { id: 'plat_shield', rarity: 'HR', name: 'プラチナの盾', icon: '🛡️', effect: 'hp_multi', value: 0.60 },
    { id: 'mithril_shield', rarity: 'HR', name: 'ミスリルの盾', icon: '🛡️', effect: 'hp_multi', value: 0.65 },
    { id: 'ice_shield', rarity: 'HR', name: '氷結の盾', icon: '❄️', effect: 'hp_multi', value: 0.70 },
    { id: 'dragon_shield', rarity: 'HR', name: '竜鱗の盾', icon: '🛡️', effect: 'hp_multi', value: 0.75 },
    { id: 'tower_shield', rarity: 'HR', name: 'タワーシールド', icon: '🛡️', effect: 'hp_multi', value: 0.80 },
    { id: 'oric_shield', rarity: 'SR', name: 'オリハルコンの盾', icon: '🛡️', effect: 'hp_multi', value: 0.85 },
    { id: 'holy_shield', rarity: 'SR', name: '聖騎士の盾', icon: '🛡️', effect: 'hp_multi', value: 0.90 },
    { id: 'stardust_shield', rarity: 'SR', name: '星屑の盾', icon: '✨', effect: 'hp_multi', value: 0.95 },
    { id: 'giant_shield', rarity: 'SR', name: '巨人の盾', icon: '🛡️', effect: 'hp_multi', value: 0.95 },
    { id: 'spirit_shield', rarity: 'SR', name: '精霊の盾', icon: '🌬️', effect: 'hp_multi', value: 1.00 },
    { id: 'aegis', rarity: 'L', name: '神盾イージス', icon: '🛡️', effect: 'hp_multi', value: 4.00, special: 'cheat_death' },
    { id: 'prydwen', rarity: 'L', name: '聖盾プリトウェン', icon: '🛡️', effect: 'hp_multi', value: 3.50, special: 'reflect_dmg' },
    { id: 'genbu_shell', rarity: 'L', name: '玄武の甲羅', icon: '🐢', effect: 'hp_multi', value: 5.00, special: 'slow_move' },
    { id: 'argos', rarity: 'L', name: '魔盾アルゴス', icon: '🛡️', effect: 'hp_multi', value: 4.50, special: 'resist_all' },
    { id: 'void_shield', rarity: 'L', name: '虚無の盾', icon: '🌑', effect: 'hp_multi', value: 4.00, special: 'absorb_atk' },

    // --- [コイン系：お金獲得量アップ] ---
    { id: 'copper_coin', rarity: 'N', name: '銅貨', icon: '👛', effect: 'gold_multi', value: 0.10 },
    { id: 'old_wallet', rarity: 'N', name: '古びた財布', icon: '👛', effect: 'gold_multi', value: 0.15 },
    { id: 'small_gem', rarity: 'N', name: '小さな宝石', icon: '💎', effect: 'gold_multi', value: 0.15 },
    { id: 'silver_ring', rarity: 'N', name: '銀の指輪', icon: '💍', effect: 'gold_multi', value: 0.20 },
    { id: 'piggy_bank', rarity: 'N', name: '貯金箱', icon: '🐷', effect: 'gold_multi', value: 0.25 },
    { id: 'silver_coin', rarity: 'R', name: '銀貨', icon: '👛', effect: 'gold_multi', value: 0.35 },
    { id: 'gold_coin', rarity: 'R', name: '金貨', icon: '👛', effect: 'gold_multi', value: 0.40 },
    { id: 'gold_bar', rarity: 'R', name: '金の延べ棒', icon: '🧱', effect: 'gold_multi', value: 0.45 },
    { id: 'merchant_wallet', rarity: 'R', name: '商人の財布', icon: '👛', effect: 'gold_multi', value: 0.50 },
    { id: 'pearl_necklace', rarity: 'R', name: '真珠のネックレス', icon: '📿', effect: 'gold_multi', value: 0.50 },
    { id: 'treasure_map', rarity: 'HR', name: '宝の地図', icon: '📜', effect: 'gold_multi', value: 0.60 },
    { id: 'golden_cup', rarity: 'HR', name: '黄金の杯', icon: '🍷', effect: 'gold_multi', value: 0.65 },
    { id: 'kings_crown', rarity: 'HR', name: '王の冠', icon: '👑', effect: 'gold_multi', value: 0.70 },
    { id: 'platinum_ring', rarity: 'HR', name: 'プラチナリング', icon: '💍', effect: 'gold_multi', value: 0.75 },
    { id: 'ruby_eyes', rarity: 'HR', name: 'ルビーの瞳', icon: '👁️', effect: 'gold_multi', value: 0.75 },
    { id: 'infinite_ring', rarity: 'SR', name: '巨富の指輪', icon: '💍', effect: 'gold_multi', value: 0.85 },
    { id: 'eldorado_key', rarity: 'SR', name: '黄金郷の鍵', icon: '🗝️', effect: 'gold_multi', value: 0.90 },
    { id: 'alchemy_book', rarity: 'SR', name: '錬金術の書', icon: '📒', effect: 'gold_multi', value: 0.95 },
    { id: 'treasure_chest', rarity: 'SR', name: '財宝の箱', icon: '🎁', effect: 'gold_multi', value: 1.00 },
    { id: 'sun_stone', rarity: 'SR', name: '太陽の石', icon: '☀️', effect: 'gold_multi', value: 1.00 },
    { id: 'horn_plenty', rarity: 'L', name: '豊穣の角', icon: '🐚', effect: 'gold_multi', value: 3.00, special: 'lucky_drop' },
    { id: 'midas_hand', rarity: 'L', name: 'ミダス王の手', icon: '🖐️', effect: 'gold_multi', value: 4.00, special: 'extra_coin' },
    { id: 'magic_hammer', rarity: 'L', name: '打ち出の小槌', icon: '🔨', effect: 'gold_multi', value: 3.50, special: 'pain_coin' },
    { id: 'mammon_coin', rarity: 'L', name: 'マモンの金貨', icon: '👛', effect: 'gold_multi', value: 5.00, special: 'greed_aura' },
    { id: 'dragon_scale_gold', rarity: 'L', name: '黄金竜の鱗', icon: '🐉', effect: 'gold_multi', value: 4.50, special: 'boss_rich' },

    // --- [スピード系：攻撃速度アップ] ---
    { id: 'light_gloves', rarity: 'N', name: '軽い手袋', icon: '🧤', effect: 'atk_multi', value: 0.10 },
    { id: 'wind_feather', rarity: 'N', name: '風の羽飾り', icon: '🪶', effect: 'atk_multi', value: 0.15 },
    { id: 'old_clock', rarity: 'N', name: '古い時計', icon: '🕒', effect: 'atk_multi', value: 0.15 },
    { id: 'flexible_whip', rarity: 'N', name: 'しなやかな鞭', icon: '🦯', effect: 'atk_multi', value: 0.20 },
    { id: 'agility_ring', rarity: 'N', name: '俊敏のリング', icon: '💍', effect: 'atk_multi', value: 0.25 },
    { id: 'thief_bandana', rarity: 'R', name: '泥棒のバンダナ', icon: '🧣', effect: 'atk_multi', value: 0.35 },
    { id: 'ninja_band', rarity: 'R', name: '忍者の鉢巻き', icon: '🥷', effect: 'atk_multi', value: 0.40 },
    { id: 'wind_talisman', rarity: 'R', name: '風の護符', icon: '🧿', effect: 'atk_multi', value: 0.45 },
    { id: 'speed_ring', rarity: 'R', name: 'スピードリング', icon: '💍', effect: 'atk_multi', value: 0.50 },
    { id: 'acrobat_cloak', rarity: 'R', name: '軽業師の外套', icon: '🧥', effect: 'atk_multi', value: 0.50 },
    { id: 'gale_boots', rarity: 'HR', name: '疾風のブーツ', icon: '🥾', effect: 'atk_multi', value: 0.60 },
    { id: 'lightning_ring', rarity: 'HR', name: '雷光の指輪', icon: '⚡', effect: 'atk_multi', value: 0.65 },
    { id: 'phantom_cloak', rarity: 'HR', name: '幻影の外套', icon: '🧥', effect: 'atk_multi', value: 0.70 },
    { id: 'fairy_wing', rarity: 'HR', name: '妖精の羽', icon: '🧚', effect: 'atk_multi', value: 0.75 },
    { id: 'sand_clock', rarity: 'HR', name: '時の砂時計', icon: '⌛', effect: 'atk_multi', value: 0.75 },
    { id: 'sonic_shoes', rarity: 'SR', name: '音速の靴', icon: '👟', effect: 'atk_multi', value: 0.85 },
    { id: 'god_speed_ring', rarity: 'SR', name: '神速の指輪', icon: '💍', effect: 'atk_multi', value: 0.90 },
    { id: 'swallow_robe', rarity: 'SR', name: '飛燕の羽衣', icon: '👘', effect: 'atk_multi', value: 0.95 },
    { id: 'time_leap', rarity: 'SR', name: '時間跳躍の時計', icon: '⌚', effect: 'atk_multi', value: 1.00 },
    { id: 'star_talisman', rarity: 'SR', name: '星流の護符', icon: '🔖', effect: 'atk_multi', value: 1.00 },
    { id: 'pegasus_boots', rarity: 'L', name: '天馬の靴', icon: '🦄', effect: 'atk_multi', value: 3.00, special: 'evasion_up' },
    { id: 'raijin_drum', rarity: 'L', name: '雷神の太鼓', icon: '🥁', effect: 'atk_multi', value: 4.00, special: 'double_tap' },
    { id: 'chronos_clock', rarity: 'L', name: 'クロノスの時計', icon: '🕰️', effect: 'atk_multi', value: 3.50, special: 'time_stop' },
    { id: 'fuujin_bag', rarity: 'L', name: '風神の袋', icon: '🌬️', effect: 'atk_multi', value: 5.00, special: 'no_delay' },
    { id: 'light_wing', rarity: 'L', name: '光速の翼', icon: '👼', effect: 'atk_multi', value: 4.50, special: 'instant_action' },

    // --- 既存の特殊神器 (互換性のために維持) ---
    { id: 'gungnir', rarity: 'L', name: '神槍グングニル', icon: '🔱', effect: 'atk_add', value: 10.0 },
    { id: 'dainsleif', rarity: 'L', name: '魔剣ダインスレイヴ', icon: '👿', effect: 'atk_add', value: 5.0, special: 'divine_shred' },
    { id: 'death_scythe', rarity: 'L', name: '死神デスサイズ', icon: '💀', effect: 'none', value: 0, special: 'instant_kill' },
];

const GACHA_ITEMS = [
    // --- カテゴリ1: 戦闘・兵種強化 (20種) ---
    { id: 'dragon_scale', rarity: 'R', name: '竜の鱗', icon: '🛡️', desc: '防御HP +5% / 個', max: 50, effect: 'hp_stack', chance: 0.10 },
    { id: 'exe_axe', rarity: 'SR', name: '処刑人の斧', icon: '🪓', desc: 'ボス特攻 +10% / 個', max: 10, effect: 'boss_slayer', chance: 0.05 },
    { id: 'sharp_whetstone', rarity: 'N', name: '鋭い砥石', icon: '🪨', desc: '全兵種攻撃力 +2% / 個', max: 100, effect: 'atk_stack', chance: 0.20 },
    { id: 'crit_gem', rarity: 'HR', name: '会心の魔石', icon: '✨', desc: 'クリティカル率 +1% / 個', max: 50, effect: 'crit_stack', chance: 0.08 },
    { id: 'vampire_fury', rarity: 'SR', name: '吸血鬼の怒り', icon: '🦇', desc: 'HP再生 +0.5% / 個', max: 20, effect: 'regen_stack', chance: 0.04 },
    { id: 'shield_spikes', rarity: 'R', name: '盾のスパイク', icon: '🛡️', desc: 'ダメージ反射 +5% / 個', max: 20, effect: 'reflect_stack', chance: 0.07 },
    { id: 'phantom_boots', rarity: 'HR', name: '幻影のブーツ', icon: '🥾', desc: '回避率 +1% / 個', max: 30, effect: 'evade_stack', chance: 0.06 },
    { id: 'infinite_quiver', rarity: 'R', name: '無限の矢筒', icon: '🏹', desc: '連続攻撃率 +2% / 個', max: 25, effect: 'double_stack', chance: 0.10 },
    { id: 'holy_pendant', rarity: 'SR', name: '聖なるペンダント', icon: '📿', desc: '全ステータス +3% / 個', max: 15, effect: 'all_stats', chance: 0.03 },
    { id: 'war_horn', rarity: 'N', name: '戦いの角笛', icon: '📢', desc: '兵士攻撃力 +1% / 個', max: 200, effect: 'atk_stack_lite', chance: 0.25 },
    { id: 'soul_eater', rarity: 'L', name: 'ソウルイーター', icon: '💀', desc: '即死率 +0.5% / 個', max: 10, effect: 'inst_stack', chance: 0.01 },
    { id: 'fire_brand', rarity: 'HR', name: '焦熱の印', icon: '🔥', desc: '属性攻撃力 +5% / 個', max: 30, effect: 'atk_stack', chance: 0.06 },
    { id: 'clovers_luck', rarity: 'N', name: '四葉のクローバー', icon: '🍀', desc: '命中率・回避率 +0.5% / 個', max: 50, effect: 'luck_stack', chance: 0.15 },
    { id: 'titan_blood', rarity: 'SR', name: '巨人の血', icon: '🩸', desc: '最大HP +15% / 個', max: 10, effect: 'hp_stack_heavy', chance: 0.04 },
    { id: 'berserk_mask', rarity: 'HR', name: '狂戦士の仮面', icon: '👺', desc: '攻撃特化 +8% / 個', max: 20, effect: 'atk_stack', chance: 0.05 },
    { id: 'mirror_armor', rarity: 'SR', name: '鏡の鎧', icon: '🥋', desc: '魔法反射 +10% / 個', max: 10, effect: 'reflect_stack', chance: 0.03 },
    { id: 'wind_step', rarity: 'R', name: '疾風の歩法', icon: '👟', desc: '速さ補正 +3% / 個', max: 30, effect: 'speed_stack', chance: 0.08 },
    { id: 'iron_wall', rarity: 'N', name: '鉄壁の誓い', icon: '🧱', desc: 'HP +2% / 個', max: 100, effect: 'hp_stack_lite', chance: 0.18 },
    { id: 'hero_scarf', rarity: 'HR', name: '英雄のスカーフ', icon: '🧣', desc: 'DPS +4% / 個', max: 40, effect: 'atk_stack', chance: 0.07 },
    { id: 'blessed_water', rarity: 'SR', name: '聖水', icon: '💧', desc: 'デバフ耐性 +10% / 個', max: 5, effect: 'none', chance: 0.02 },

    // --- カテゴリ2: 経済・放置効率 (15種) ---
    { id: 'merch_scale', rarity: 'R', name: '商人の天秤', icon: '⚖️', desc: 'クエスト報酬 +5% / 個', max: 40, effect: 'gold_stack', chance: 0.12 },
    { id: 'cheat_ledger', rarity: 'SR', name: '値切りの裏帳簿', icon: '📋', desc: 'コスト削減 +2% / 個', max: 20, effect: 'cost_stack', chance: 0.05 },
    { id: 'golden_touch', rarity: 'HR', name: '黄金の指先', icon: '✨', desc: 'タップゴールド +20% / 個', max: 50, effect: 'gold_stack', chance: 0.08 },
    { id: 'bank_note', rarity: 'N', name: '銀行の不換紙幣', icon: '💵', desc: 'ゴールド獲得 +1% / 個', max: 250, effect: 'gold_stack_lite', chance: 0.22 },
    { id: 'lucky_cat', rarity: 'R', name: '招き猫', icon: '🐈', desc: 'レア敵出現率 +10% / 個', max: 10, effect: 'rare_spawn', chance: 0.10 },
    { id: 'greed_coin', rarity: 'HR', name: '強欲のコイン', icon: '👛', desc: 'ゴールド倍率 +10% / 個', max: 30, effect: 'gold_stack', chance: 0.07 },
    { id: 'tax_exempt', rarity: 'SR', name: '免税許可証', icon: '🧾', desc: 'ゴールド獲得 +15% / 個', max: 15, effect: 'gold_stack', chance: 0.04 },
    { id: 'bag_of_holding', rarity: 'N', name: '四次元の袋', icon: '🌬️', desc: 'ゴールド獲得 +0.5% / 個', max: 500, effect: 'gold_stack_tiny', chance: 0.30 },
    { id: 'midas_scroll', rarity: 'SR', name: 'ミダスの古文書', icon: '📜', desc: '全収入 +5% / 個', max: 20, effect: 'gold_stack', chance: 0.03 },
    { id: 'pension_fund', rarity: 'HR', name: '年金の権利', icon: '💸', desc: '放置収入 +10% / 個', max: 50, effect: 'gold_stack', chance: 0.06 },
    { id: 'scout_goggles', rarity: 'R', name: 'スカウター', icon: '🥽', desc: '討伐ゴールド +4% / 個', max: 50, effect: 'gold_stack', chance: 0.11 },
    { id: 'diamond_pick', rarity: 'SR', name: 'ダイヤのつるはし', icon: '⛏️', desc: '鉱山収入 +50%', max: 1, effect: 'gold_stack', chance: 0.01 },
    { id: 'crystal_ball', rarity: 'HR', name: '予感の水晶', icon: '🔮', desc: 'ゴールド獲得 +6% / 個', max: 30, effect: 'gold_stack', chance: 0.07 },
    { id: 'monopoly_card', rarity: 'SR', name: '独占カード', icon: '🃏', desc: '収入 +25%', max: 4, effect: 'gold_stack', chance: 0.02 },
    { id: 'infinite_wallet', rarity: 'L', name: '無尽蔵の財布', icon: '👛', desc: 'ゴールド獲得 +100%', max: 1, effect: 'gold_stack_heavy', chance: 0.005 },

    // --- カテゴリ3: 周回の特殊システム (15種) ---
    { id: 'memory_frag', rarity: 'R', name: '記憶의断片', icon: '🧩', desc: '帰還時オーブ +5% / 個', max: 40, effect: 'orb_stack', chance: 0.15 },
    { id: 'time_spring', rarity: 'SR', name: '時空のねじまき', icon: '⌛', desc: '全体速度 +2% / 個', max: 25, effect: 'full_speed', chance: 0.05 },
    { id: 'rebirth_ash', rarity: 'HR', name: '転生の灰', icon: '⚱️', desc: '帰還初期レベル +2 / 個', max: 50, effect: 'init_lv_stack', chance: 0.08 },
    { id: 'warp_engine', rarity: 'SR', name: 'ワープエンジン', icon: '🚀', desc: 'ボススキップ率 +1% / 個', max: 10, effect: 'skip_boss', chance: 0.03 },
    { id: 'broken_clock', rarity: 'N', name: '壊れた時計', icon: '🍇', desc: '全体速度 +0.5% / 個', max: 100, effect: 'speed_lite', chance: 0.20 },
    { id: 'orb_magnet', rarity: 'HR', name: 'オーブ磁石', icon: '🧲', desc: 'オーブ獲得 +2% / 個', max: 50, effect: 'orb_stack', chance: 0.07 },
    { id: 'karma_beads', rarity: 'SR', name: '業の数珠', icon: '📿', desc: 'オーブ倍率 +10% / 個', max: 15, effect: 'orb_stack', chance: 0.04 },
    { id: 'phoenix_feather', rarity: 'L', name: '不死鳥の羽', icon: '🪶', desc: '全滅時ステージ保持 10% / 個', max: 5, effect: 'keep_stage', chance: 0.01 },
    { id: 'exp_gear', rarity: 'N', name: '経験の歯車', icon: '⚙️', desc: '全体速度 +1% / 個', max: 50, effect: 'speed_lite', chance: 0.15 },
    { id: 'prophecy_page', rarity: 'HR', name: '預言者の頁', icon: '📜', desc: 'レア敵出現 +5% / 個', max: 20, effect: 'rare_spawn', chance: 0.06 },
    { id: 'dimension_key', rarity: 'SR', name: '次元の鍵', icon: '🗝️', desc: '帰還時オーブ +20%', max: 5, effect: 'orb_stack_heavy', chance: 0.02 },
    { id: 'soul_anchor', rarity: 'R', name: '魂の錨', icon: '⚓', desc: '帰還時ゴールド 1% 保持', max: 10, effect: 'keep_gold', chance: 0.08 },
    { id: 'accelerator', rarity: 'HR', name: '加速装置', icon: '💨', desc: '倍速効果 +5% / 個', max: 20, effect: 'speed_stack', chance: 0.05 },
    { id: 'paradox_box', rarity: 'SR', name: 'パラドックス箱', icon: '📦', desc: '全ガチャ排出率 +5%', max: 10, effect: 'none', chance: 0.03 },
    { id: 'rainbow_crystal', rarity: 'L', name: '虹のクリスタル', icon: '💎', desc: '全能力大幅UP', max: 1, effect: 'all_stats_mega', chance: 0.01 },
    // 新規：特大バフ
    { id: 'gacha_giant_killer', rarity: 'SR', name: '巨人殺しの剣', icon: '🗡️', desc: 'ボスに対するダメージが別枠で2倍(累積可)', max: 5, effect: 'giant_killer', chance: 0.01 },
    { id: 'gacha_executioner', rarity: 'SR', name: '処刑人の斧', icon: '🪓', desc: '敵HP50%以下時、クリティカルダメージ倍率+100%', max: 10, effect: 'executioner', chance: 0.01 },
    { id: 'gacha_last_stand', rarity: 'HR', name: '背水の陣', icon: '🏰', desc: '所持ユニット種が少ないほど攻撃力UP(Max5倍)', max: 1, effect: 'last_stand', chance: 0.005 }
];
const QUEST_DATA = [
    { id: 'apple', name: 'リンゴ拾い', icon: '🍎', baseGps: 5, baseCost: 100 },
    { id: 'mine', name: '鉱山採掘', icon: '⛏️', baseGps: 50, baseCost: 1500 },
    { id: 'trade', name: '交易所', icon: '⚖️', baseGps: 450, baseCost: 20000 },
    { id: 'tax', name: '徴収所', icon: '🧾', baseGps: 3500, baseCost: 250000 },
    { id: 'bank', name: '王国銀行', icon: '💸', baseGps: 25000, baseCost: 3000000 },
    { id: 'magic_tower', name: '魔術結社', icon: '🔮', baseGps: 500000, baseCost: 500000000 },
    { id: 'space_colony', name: '宇宙開拓', icon: '🚀', baseGps: 15000000, baseCost: 100000000000 }
];

// --- スキルとシナジーのメタデータ ---
const SKILL_DATA = {
    'thunder': { id: 'thunder', name: 'サンダー', icon: '⚡', cooldown: 60, desc: '敵全体に現在攻撃力の100倍の即時ダメージ' },
    'heal': { id: 'heal', name: 'ヒール', icon: '🩹', cooldown: 120, desc: '味方のHPを最大値まで即時回復' },
    'haste': { id: 'haste', name: 'ヘイスト', icon: '⏳', cooldown: 180, desc: '10秒間、全兵士の攻撃速度が2倍になる' }
};

const SYNERGY_DATA = [
    { id: 'bushido', name: '【武士道】', req: ['infantry', 'samurai'], desc: '全軍の攻撃力が常に1.5倍' },
    { id: 'dragon_eye', name: '【飛竜の目】', req: ['archer', 'dragon'], desc: 'クリティカル率 +20%' }
];

const ENEMY_ICONS = ['👹', '💀', '👻', '🦇', '🎃', '🧟', '🧛'];

const DAILY_MISSIONS = [
    { id: 'daily_kill_50', text: '敵を50体討伐する', target: 50, reward: 30, rewardType: 'orbs', icon: '⚔️', trackKey: 'dailyKills' },
    { id: 'daily_kill_200', text: '敵を200体討伐する', target: 200, reward: 100, rewardType: 'orbs', icon: '💀', trackKey: 'dailyKills' },
    { id: 'daily_gold_10k', text: 'ゴールドを10,000獲得', target: 10000, reward: 20, rewardType: 'orbs', icon: '👛', trackKey: 'dailyGoldEarned' },
    { id: 'daily_gacha_3', text: 'ガチャを3回引く', target: 3, reward: 50, rewardType: 'orbs', icon: '🎟️', trackKey: 'dailyGachaPulls' },
    { id: 'daily_stage_10', text: 'ステージ10に到達', target: 10, reward: 40, rewardType: 'orbs', icon: '🚩', trackKey: 'dailyMaxStage' },
    { id: 'daily_unit_buy_5', text: '兵士を5回雇用する', target: 5, reward: 25, rewardType: 'orbs', icon: '🗡️', trackKey: 'dailyUnitBuys' },
    { id: 'daily_boss_1', text: 'ボスを1体討伐する', target: 1, reward: 60, rewardType: 'orbs', icon: '🐉', trackKey: 'dailyBossKills' },
    { id: 'daily_quest_3', text: '内政を3回強化する', target: 3, reward: 30, rewardType: 'orbs', icon: '🧾', trackKey: 'dailyQuestBuys' },
];
