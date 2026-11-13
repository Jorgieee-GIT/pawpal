// Batch 13: Mission Center. All rewards and progress are server-authoritative.
type MissionKind = "daily" | "weekly" | "milestone";

type MissionDef = {
    id: string;
    kind: MissionKind;
    title: string;
    metric: string;
    target: number;
    coins: number;
    xp: number;
};

const missionDefs: MissionDef[] = [];

const missionMetrics: [string, string, number[]][] = [
    ["feed", "Feed your pet", [1, 2, 3, 4, 5, 7, 10, 12, 15, 20]],
    ["play", "Play with your pet", [1, 2, 3, 4, 5, 7, 10, 12, 15, 20]],
    ["sleep", "Help your pet rest", [1, 2, 3, 4, 5, 7, 10, 12, 15, 20]],
    ["bathe", "Give your pet a bath", [1, 2, 3, 4, 5, 7, 10, 12, 15, 20]],
    ["cuddle", "Cuddle your pet", [1, 2, 3, 4, 5, 7, 10, 12, 15, 20]],
    ["arcade", "Play an arcade game", [1, 2, 3, 4, 5, 7, 10, 12, 15, 20]],
    ["plant", "Plant a garden seed", [1, 2, 3, 4, 5, 7, 10, 12, 15, 20]],
    ["harvest", "Harvest a flower", [1, 2, 3, 4, 5, 7, 10, 12, 15, 20]],
    ["water", "Water a flower", [1, 2, 3, 4, 5, 7, 10, 12, 15, 20]],
    ["cook", "Finish a recipe", [1, 2, 3, 4, 5, 7, 10, 12, 15, 20]],
    ["serve", "Serve a cooked meal", [1, 2, 3, 4, 5, 7, 10, 12, 15, 20]],
    ["buy", "Make a shop purchase", [1, 2, 3, 4, 5, 7, 10, 12, 15, 20]],
    ["claw", "Try Paw Claw", [1, 2, 3, 4, 5, 7, 10, 12, 15, 20]],
    ["meal_buy", "Buy a ready-made meal", [1, 2, 3, 4, 5, 7, 10, 12, 15, 20]],
    ["friend", "Make a new friend", [1, 2, 3, 4, 5, 7, 10, 12, 15, 20]],
    ["mail", "Send PawMail", [1, 2, 3, 4, 5, 7, 10, 12, 15, 20]],
    ["outfit", "Change your pet outfit", [1, 2, 3, 4, 5, 7, 10, 12, 15, 20]],
    ["atmosphere", "Change room atmosphere", [1, 2, 3, 4, 5, 7, 10, 12, 15, 20]],
    ["furniture", "Place room furniture", [1, 2, 3, 4, 5, 7, 10, 12, 15, 20]],
    ["room", "Visit a room", [1, 2, 3, 4, 5, 7, 10, 12, 15, 20]],
    ["brawl", "Finish a Paw Brawl", [1, 2, 3, 4, 5, 7, 10, 12, 15, 20]],
    ["memory", "Play Memory Tiles", [1, 2, 3, 4, 5, 7, 10, 12, 15, 20]],
    ["dino", "Play Cactus Jump", [1, 2, 3, 4, 5, 7, 10, 12, 15, 20]],
    ["runner", "Play Paw Run", [1, 2, 3, 4, 5, 7, 10, 12, 15, 20]],
    ["pattern", "Play Heart Color Match", [1, 2, 3, 4, 5, 7, 10, 12, 15, 20]],
    ["mole", "Play Whack-a-Mole", [1, 2, 3, 4, 5, 7, 10, 12, 15, 20]],
    ["gift", "Send a friend gift", [1, 2, 3, 4, 5, 7, 10, 12, 15, 20]],
    ["note", "Write a pet note", [1, 2, 3, 4, 5, 7, 10, 12, 15, 20]],
    ["daily_surprise", "Claim your daily surprise", [1, 2, 3, 4, 5, 7, 10, 12, 15, 20]]
];

// Permanent milestones across every tracked activity. Existing mission IDs stay intact.
for (const [metric, label, targets] of missionMetrics) {
    for (let i = 0; i < targets.length; i++) {
        const target = targets[i];
        missionDefs.push({
            id: `m_${metric}_${i + 1}`,
            kind: "milestone",
            title: `${label} ${target} ${target === 1 ? "time" : "times"}`,
            metric,
            target,
            // Milestones are permanent and stack across thresholds: keep the
            // early rewards modest so a single action cannot flood Paw Coins/EXP.
            // The last tier remains a meaningful bonus without eclipsing shops.
            coins: 20 + (i + 1) * 10,
            xp: 8 + (i + 1) * 4
        });
    }
}

// Daily missions are sampled from low-friction actions, across the live features.
const dailyMetrics = [
    "feed",
    "play",
    "bathe",
    "cuddle",
    "arcade",
    "plant",
    "harvest",
    "water",
    "cook",
    "serve",
    "buy",
    "claw",
    "meal_buy",
    "outfit",
    "atmosphere"
];

for (const metric of dailyMetrics) {
    for (let i = 0; i < (["outfit", "atmosphere"].includes(metric) ? 1 : 4); i++) {
        missionDefs.push({
            id: `d_${metric}_${i + 1}`,
            kind: "daily",
            title: `${missionMetrics.find((m) => m[0] === metric)?.[1]} ${i + 1} ${i === 0 ? "time" : "times"} today`,
            metric,
            target: i + 1,
            coins: 30 + (i + 1) * 25,
            xp: 10 + (i + 1) * 10
        });
    }
}

// Weekly missions rotate across the full gameplay catalog.
const weeklyMetrics = [
    "feed",
    "play",
    "sleep",
    "bathe",
    "cuddle",
    "arcade",
    "claw",
    "plant",
    "harvest",
    "water",
    "cook",
    "serve",
    "buy",
    "meal_buy",
    "mail",
    "outfit",
    "atmosphere",
    "furniture",
    "room",
    "memory",
    "dino",
    "runner",
    "pattern",
    "mole",
    "brawl",
    "gift",
    "note",
    "daily_surprise"
];

for (const metric of weeklyMetrics) {
    for (let i = 0; i < 3; i++) {
        const target = ["outfit", "atmosphere", "room", "furniture", "note", "gift"].includes(
            metric
        )
            ? [1, 3, 5][i]
            : metric === "daily_surprise"
                ? [1, 3, 5][i]
                : [3, 7, 12][i];
        missionDefs.push({
            id: `w_${metric}_${i + 1}`,
            kind: "weekly",
            title: `${missionMetrics.find((m) => m[0] === metric)?.[1]} ${target} times this week`,
            metric,
            target,
            coins: 140 + i * 100,
            xp: 50 + i * 35
        });
    }
}

/*
 * DOCU: Handle manila day behavior for this feature.
 * @param {unknown} d - d value used by this function
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
function manilaDay(d = new Date()) {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(d);
}

/*
 * DOCU: Handle manila week behavior for this feature.
 * @param {unknown} d - d value used by this function
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
function manilaWeek(d = new Date()) {
    const day = manilaDay(d);
    const utc = new Date(day + "T00:00:00Z");
    const weekday = utc.getUTCDay();
    utc.setUTCDate(utc.getUTCDate() - ((weekday + 6) % 7));
    return utc.toISOString().slice(0, 10);
}

/*
 * DOCU: Select the missions available for the current schedule.
 * @param {MissionKind} kind - kind value used by this function
 * @param {string} userId - userId value used by this function
 * @param {string} period - period value used by this function
 * @param {number} count - count value used by this function
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
function pickMissions(kind: MissionKind, userId: string, period: string, count: number) {
    const choices = missionDefs.filter((m) => m.kind === kind);
    let seed = 2166136261;
    for (const ch of userId + kind + period) {
        seed = Math.imul(seed ^ ch.charCodeAt(0), 16777619) >>> 0;
    }
    const result = [...choices];
    for (let i = result.length - 1; i > 0; i--) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const j = seed % (i + 1);
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result.slice(0, count);
}

/*
 * DOCU: Update mission progress for a recorded player action.
 * @param {any} client - client value used by this function
 * @param {string} userId - userId value used by this function
 * @param {string} metric - metric value used by this function
 * @param {unknown} amount - amount value used by this function
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export async function recordMissionEvent(client: any, userId: string, metric: string, amount = 1) {
    // Cosmetic changes and room visits should not be farmed by tapping a toggle repeatedly.
    // Once per Manila day is also attainable for the corresponding daily and weekly goals.
    if (["room", "outfit", "atmosphere", "furniture", "note"].includes(metric)) {
        await client.query(
            `INSERT INTO mission_events(user_id,metric,amount)
    SELECT $1,$2,$3 WHERE NOT EXISTS(
    SELECT 1 FROM mission_events WHERE user_id=$1 AND metric=$2
    AND (created_at AT TIME ZONE 'Asia/Manila')::date=(NOW() AT TIME ZONE 'Asia/Manila')::date
    )`,
            [userId, metric, amount]
        );
    } else {
        await client.query("INSERT INTO mission_events(user_id,metric,amount) VALUES($1,$2,$3)", [
            userId,
            metric,
            amount
        ]);
    }
}

/*
 * DOCU: Handle mission view behavior for this feature.
 * @param {any} client - client value used by this function
 * @param {string} userId - userId value used by this function
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export async function missionView(client: any, userId: string) {
    const today = manilaDay(),
        week = manilaWeek();
    const chosen = [
        ...pickMissions("daily", userId, today, 5),
        ...pickMissions("weekly", userId, week, 10),
        ...missionDefs.filter((m) => m.kind === "milestone")
    ];
    const [counts, claims] = await Promise.all([
        client.query(
            `SELECT metric,COALESCE(SUM(amount),0)::int AS total,COALESCE(SUM(amount) FILTER (WHERE (created_at AT TIME ZONE 'Asia/Manila')::date=$2::date),0)::int AS today,COALESCE(SUM(amount) FILTER (WHERE (created_at AT TIME ZONE 'Asia/Manila')::date >= $3::date),0)::int AS week FROM mission_events WHERE user_id=$1 GROUP BY metric`,
            [userId, today, week]
        ),
        client.query("SELECT mission_id,period FROM mission_claims WHERE user_id=$1", [userId])
    ]);
    const values = new Map<string, any>(counts.rows.map((r: any) => [r.metric, r]));
    const claimed = new Set(claims.rows.map((r: any) => r.mission_id + "|" + r.period));
    const missions = chosen.map((m) => {
        const period = m.kind === "daily" ? today : m.kind === "weekly" ? week : "lifetime";
        const row = values.get(m.metric);
        const progress = Math.min(
            m.target,
            Number(
                row?.[m.kind === "daily" ? "today" : m.kind === "weekly" ? "week" : "total"] || 0
            )
        );
        return {
            ...m,
            progress,
            claimed: claimed.has(m.id + "|" + period),
            period
        };
    });
    return {
        missions,
        totals: {
            daily: missionDefs.filter((m) => m.kind === "daily").length,
            weekly: missionDefs.filter((m) => m.kind === "weekly").length,
            milestone: missionDefs.filter((m) => m.kind === "milestone").length
        },
        active: {
            daily: 5,
            weekly: 10,
            milestone: missionDefs.filter((m) => m.kind === "milestone").length
        },
        today,
        week
    };
}
