import { prisma } from "@/lib/prisma";

export async function invalidateLocalizedMediaCache(scopeId: string) {
  const now = new Date();
  await prisma.$transaction([
    prisma.searchCache.deleteMany({ where: { scopeId } }),
    prisma.mediaItem.updateMany({
      where: { scopeId },
      data: {
        expiresAt: now,
        detailsExpiresAt: null,
      },
    }),
  ]);
}
