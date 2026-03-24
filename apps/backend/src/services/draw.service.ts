import { Draw, Winner, User } from "db/models";
import { DrawStatus, WinTier, WinnerVerificationStatus } from "db/models";
import type { CreateDrawInput } from "../zodValidation/AdminValidation.js";

//prize pool ratios 

const POOL_RATIOS = { jackpot: 0.4, fourMatch: 0.35, threeMatch: 0.25 };


const POOL_CONTRIBUTION_PER_USER = Number(process.env.POOL_CONTRIBUTION_PER_USER || 5);

//createDraw

export const createDraw = async (data: CreateDrawInput) => {
  const existing = await Draw.findOne({ month: data.month, year: data.year });
  if (existing) throw new Error("A draw already exists for this month and year");

  const draw = await Draw.create({
    title: data.title,
    month: data.month,
    year: data.year,
    mode: data.mode,
  });

  return draw;
};

// getAllDraws 

export const getAllDraws = async () => {
  return Draw.find().sort({ year: -1, month: -1 }).select("-entries");
};

// getDrawById 

export const getDrawById = async (drawId: string) => {
  const draw = await Draw.findById(drawId);
  if (!draw) throw new Error("Draw not found");
  return draw;
};

export const simulateDraw = async (drawId: string) => {
  const draw = await Draw.findById(drawId);
  if (!draw) throw new Error("Draw not found");
  if (draw.status === DrawStatus.Published) throw new Error("Draw is already published");

  const numbers = generateNumbers(draw.mode, await getAllUserScores());
  const preview = await computeEntries(numbers);

  draw.drawnNumbers = numbers;
  draw.simulatedAt = new Date();
  draw.status = DrawStatus.Simulated;
  await draw.save();

  return { draw, preview };
};


export const publishDraw = async (drawId: string, adminId: string) => {
  const draw = await Draw.findById(drawId);
  if (!draw) throw new Error("Draw not found");
  if (draw.status === DrawStatus.Published) throw new Error("Draw is already published");

  const numbers =
    draw.drawnNumbers.length === 5
      ? draw.drawnNumbers
      : generateNumbers(draw.mode, await getAllUserScores());

  const activeUsers = await User.find({ "subscription.status": "active" }).select(
    "scores drawsEntered"
  );

  const previousDraw = await Draw.findOne({ status: DrawStatus.Published })
    .sort({ year: -1, month: -1 })
    .select("prizePool");

  const rolloverIn = previousDraw?.prizePool?.rolloverCarriedOut ?? 0;
  const totalPool = activeUsers.length * POOL_CONTRIBUTION_PER_USER;
  const jackpotTier = totalPool * POOL_RATIOS.jackpot + rolloverIn;
  const fourMatchTier = totalPool * POOL_RATIOS.fourMatch;
  const threeMatchTier = totalPool * POOL_RATIOS.threeMatch;

  // Compute all entries
  const entries = activeUsers.map((user) => {
    const userScores = user.scores.map((s) => s.points);
    const matchCount = userScores.filter((p) => numbers.includes(p)).length;
    const tier =
      matchCount === 5
        ? WinTier.Match5
        : matchCount === 4
        ? WinTier.Match4
        : matchCount === 3
        ? WinTier.Match3
        : null;

    return { userId: user._id, scoresAtDraw: userScores, matchCount, tier, prizeAmount: 0 };
  });

  // Count winners per tier
  const fiveWinners = entries.filter((e) => e.tier === WinTier.Match5);
  const fourWinners = entries.filter((e) => e.tier === WinTier.Match4);
  const threeWinners = entries.filter((e) => e.tier === WinTier.Match3);

  // Jackpot rollover if no 5-match winner
  const rolloverOut = fiveWinners.length === 0 ? jackpotTier : 0;

  // Split prize equally among tier winners
  if (fiveWinners.length > 0) {
    const share = jackpotTier / fiveWinners.length;
    fiveWinners.forEach((e) => (e.prizeAmount = share));
  }
  if (fourWinners.length > 0) {
    const share = fourMatchTier / fourWinners.length;
    fourWinners.forEach((e) => (e.prizeAmount = share));
  }
  if (threeWinners.length > 0) {
    const share = threeMatchTier / threeWinners.length;
    threeWinners.forEach((e) => (e.prizeAmount = share));
  }

  // Persist
  draw.drawnNumbers = numbers;
  draw.status = DrawStatus.Published;
  draw.publishedBy = adminId as any;
  draw.publishedAt = new Date();
  draw.entries = entries as any;
  draw.prizePool = {
    totalPool,
    jackpotTier,
    fourMatchTier,
    threeMatchTier,
    rolloverCarriedIn: rolloverIn,
    rolloverCarriedOut: rolloverOut,
    activeSubscriberCount: activeUsers.length,
  };
  draw.winnerCounts = {
    fiveMatch: fiveWinners.length,
    fourMatch: fourWinners.length,
    threeMatch: threeWinners.length,
  };
  await draw.save();

  const winnerEntries = entries.filter((e) => e.tier !== null);
  for (const entry of winnerEntries) {
    await Winner.create({
      userId: entry.userId,
      drawId: draw._id,
      matchedNumbers: entry.scoresAtDraw.filter((p) => numbers.includes(p)),
      scoresAtDraw: entry.scoresAtDraw,
      prizeAmount: entry.prizeAmount,
      verificationStatus: WinnerVerificationStatus.PendingProof,
    });
  }

  await User.updateMany(
    { _id: { $in: activeUsers.map((u) => u._id) } },
    { $addToSet: { drawsEntered: draw._id } }
  );

  return draw;
};

const generateNumbers = (mode: string, allScores: number[]): number[] => {
  if (mode === "algorithmic" && allScores.length > 0) {
    return generateWeighted(allScores);
  }
  return generateRandom();
};

const generateRandom = (): number[] => {
  const nums = new Set<number>();
  while (nums.size < 5) {
    nums.add(Math.floor(Math.random() * 45) + 1);
  }
  return [...nums];
};

const generateWeighted = (allScores: number[]): number[] => {
  const freq = new Map<number, number>();
  allScores.forEach((s) => freq.set(s, (freq.get(s) || 0) + 1));

  const pool: number[] = [];
  freq.forEach((count, score) => {
    for (let i = 0; i < count; i++) pool.push(score);
  });

  const nums = new Set<number>();
  let attempts = 0;

  while (nums.size < 5 && attempts < 1000) {
    if (pool.length > 0) {
      const index = Math.floor(Math.random() * pool.length);
      const value = pool[index];
      if (value !== undefined) nums.add(value);
    }
    attempts++;
  }

  while (nums.size < 5) {
    nums.add(Math.floor(Math.random() * 45) + 1);
  }

  return [...nums];
};

const getAllUserScores = async (): Promise<number[]> => {
  const users = await User.find({ "subscription.status": "active" }).select("scores");
  return users.flatMap((u) => u.scores.map((s) => s.points));
};

const computeEntries = async (numbers: number[]) => {
  const users = await User.find({ "subscription.status": "active" }).select("scores");
  return users.map((user) => {
    const userScores = user.scores.map((s) => s.points);
    const matchCount = userScores.filter((p) => numbers.includes(p)).length;
    const tier =
      matchCount >= 5 ? "5-match" : matchCount === 4 ? "4-match" : matchCount === 3 ? "3-match" : null;
    return { userId: user._id, matchCount, tier };
  });
};