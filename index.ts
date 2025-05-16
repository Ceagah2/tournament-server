import { PrismaClient } from "@prisma/client";
import cors from "cors";
import express, { type Request, type Response } from "express";

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

const nordicNames = [
  "Bjorn", "Erik", "Freya", "Astrid", "Leif", "Ragnar", "Sigrid", "Tor", "Ulf",
  "Einar", "Hilda", "Knut", "Ivar", "Solveig", "Sven", "Gudrun", "Arne", "Ylva",
  "Olav", "Thora", "Sigurd", "Runa", "Harald", "Ingrid", "Fenrir", "Alva",
  "Skadi", "Bragi", "Trygve", "Vidar", "Odin", "Loki", "Frigg", "Helga", "Tyr",
  "Balder", "Njord", "Hodur", "Magnus", "Gunnar", "Torsten", "Dag", "Halvard",
  "Ragnhild", "Kari", "Eydis", "Bodil", "Agni", "Yrsa", "Jorund", "Viggo",
  "Steinar", "Geir", "Eivor", "Hakon", "Snorri", "Sigyn", "Alrek", "Ingvar"
];

app.post("/register", async (req: Request, res: Response) => {
  const { nickname, discordId } = req.body;

  if (!nickname || !discordId) {
    return res.status(400).json({ error: "nickname and discordId are required" });
  }

  const usedNames = await prisma.player.findMany();
  const availableNames = nordicNames.filter(
    (name) => !usedNames.find((p) => p.name === name)
  );

  if (availableNames.length === 0) {
    return res.status(400).json({ error: "No names available" });
  }

  const randomName = availableNames[Math.floor(Math.random() * availableNames.length)];

  const player = await prisma.player.create({
    data: {
      nickname,
      discordId,
      name: randomName,
    },
  });

  res.status(201).json(player);
});

// ✅ Rota para listar nomes usados e disponíveis
app.get("/names", async (_req: Request, res: Response) => {
  const players = await prisma.player.findMany();

  const usedNamesWithDiscordId = players.map((p) => ({
    name: p.name,
    discordId: p.discordId,
    nickname: p.nickname,
  }));

  const availableNames = nordicNames.filter(
    (name) => !players.find((p) => p.name === name)
  );

  res.json({ usedNamesWithDiscordId, availableNames });
});

app.delete("/remove", async (req: Request, res: Response) => {
  const { nickname } = req.body;

  if (!nickname) {
    return res.status(400).json({ error: "Nickname is required" });
  }

  await prisma.player.deleteMany({
    where: { nickname },
  });

  res.json({ message: "Player removed successfully" });
});

app.get("/available-count", async (_req: Request, res: Response) => {
  const usedNames = await prisma.player.findMany({ select: { name: true } });
  const usedSet = new Set(usedNames.map((p) => p.name));
  const availableCount = nordicNames.filter((name) => !usedSet.has(name)).length + 1;

  res.json({ availableCount });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
