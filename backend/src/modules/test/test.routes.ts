import { Router } from "express";
import { Prisma } from "@prisma/client";
import { getDatabase } from "../../shared/database";

const testRouter = Router();

/** Test rotasından oluşan kullanıcılar; gerçek şifre girişi yoksa bu placeholder kalır. */
const TEST_USER_PASSWORD_PLACEHOLDER = "__INFLUENCEHUB_TEST_ROUTE_NO_LOGIN__";

/** Test kullanıcıları için benzersiz e-posta (userId içindeki özel karakterler çakışmayı azaltır). */
const testUserEmail = (userId: string): string => {
  const safe = String(userId).replace(/[^a-zA-Z0-9._+-]/g, "_");
  return `${safe}@test.influencehub.local`;
};

testRouter.post("/save-credentials", async (req, res) => {
  const { userId, accessToken, businessAccountId } = req.body;

  if (!userId || !accessToken || !businessAccountId) {
    res
      .status(400)
      .json({ error: "userId, accessToken ve businessAccountId gerekli" });
    return;
  }

  const uid = String(userId);

  try {
    const db = getDatabase();

    await db.user.upsert({
      where: { id: uid },
      create: {
        id: uid,
        email: testUserEmail(uid),
        password: TEST_USER_PASSWORD_PLACEHOLDER,
      },
      update: {},
    });

    const tokenExpiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

    const account = await db.instagramAccount.upsert({
      where: {
        userId_instagramUserId: {
          userId: uid,
          instagramUserId: businessAccountId,
        },
      },
      update: { accessToken, businessAccountId, tokenExpiresAt },
      create: {
        userId: uid,
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
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      const hint =
        err.code === "P2002"
          ? "Bu e-posta veya id başka bir kayıtla çakışıyor; farklı userId deneyin."
          : err.code === "P2011"
            ? "users.password zorunlu; şema ve migrate güncel mi kontrol edin."
            : undefined;
      res.status(409).json({
        error: err.message,
        code: err.code,
        meta: err.meta,
        ...(hint ? { hint } : {}),
      });
      return;
    }
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

export { testRouter };
