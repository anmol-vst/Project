import { User } from "db/models";
import type { IScore } from "db/models";
import type { AddScoreInput } from "../zodValidation/UserValidation.js";
import type { AdminUpdateScoreInput } from "../zodValidation/AdminValidation.js";

// ─getScores 
export const getScores = async (userId: string): Promise<IScore[]> => {
  const user = await User.findById(userId).select("scores").lean();
  if (!user) throw new Error("User not found");

  return [...user.scores].sort(
    (a, b) =>
      new Date(b.datePlayed).getTime() -
      new Date(a.datePlayed).getTime()
  );
};

// ─addScore 

export const addScore = async (
  userId: string,
  data: AddScoreInput
): Promise<IScore[]> => {
  const user = await User.findById(userId).select("scores");
  if (!user) throw new Error("User not found");

  if (user.scores.length >= 5) {
    const sorted = [...user.scores].sort(
      (a, b) =>
        new Date(a.datePlayed).getTime() -
        new Date(b.datePlayed).getTime()
    );

    const oldest = sorted[0];
    if (!oldest) throw new Error("Unexpected: no oldest score");

    user.scores = user.scores.filter(
      (s) => s._id?.toString() !== oldest._id?.toString()
    ) as typeof user.scores;
  }

  user.scores.push({
    points: data.points,
    datePlayed: new Date(data.datePlayed),
    addedAt: new Date(),
  });

  await user.save();
  return user.toObject().scores as IScore[];
};

// to updateScore 

export const updateScore = async (
  userId: string,
  scoreId: string,
  data: AdminUpdateScoreInput
): Promise<IScore[]> => {
  const user = await User.findById(userId).select("scores");
  if (!user) throw new Error("User not found");

  const score = user.scores.find(
  (s) => s._id?.toString() === scoreId
);
if (!score) throw new Error("Score not found");

  if (data.points !== undefined) score.points = data.points;
  if (data.datePlayed !== undefined)
    score.datePlayed = new Date(data.datePlayed);

  await user.save();
  return user.toObject().scores as IScore[];
};

// to deleteScore

export const deleteScore = async (
  userId: string,
  scoreId: string
): Promise<void> => {
  const user = await User.findById(userId).select("scores");
  if (!user) throw new Error("User not found");

  const exists = user.scores.some(
    (s) => s._id?.toString() === scoreId
  );
  if (!exists) throw new Error("Score not found");

  user.scores = user.scores.filter(
    (s) => s._id?.toString() !== scoreId
  ) as typeof user.scores;

  await user.save();
};