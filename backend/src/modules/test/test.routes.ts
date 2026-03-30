import { Router } from "express";
import { getDatabase } from "../../shared/database";

const testRouter = Router();

testRouter.post("/save-credentials", async (req, res) => {
  const { userId, accessToken, businessAccountId } = req.body;

  if (!userId || !accessToken || !businessAccountId) {
    res.status(400).json({ error: "userId, accessToken ve businessAccountId gerekli" });
    return;
  }

  const db = getDatabase();

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    await db.user.create({
      data: { id: userId, email: `${userId}@test.com` },
    });
  }

  const tokenExpiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

  const account = await db.instagramAccount.upsert({
    where: {
      userId_instagramUserId: {
        userId,
        instagramUserId: businessAccountId,
      },
    },
    update: { accessToken, businessAccountId, tokenExpiresAt },
    create: {
      userId,
      instagramUserId: businessAccountId,
      businessAccountId,
      accessToken,
      tokenExpiresAt,
    },
  });

  res.status(200).json({
    data: {
      message: "Credentials kaydedildi",
      accountId: account.id,
      expiresAt: account.tokenExpiresAt,
    },
  });
});

export { testRouter };
