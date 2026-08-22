import { prisma } from "../../common/db/prisma.js";

export const authRepository = {
  findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  },

  findUserByLoginId(loginId: string) {
    return prisma.user.findUnique({ where: { loginId: loginId.toUpperCase() } });
  },

  findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { employee: true, company: true },
    });
  },

  findUserByIdentifier(identifier: string) {
    const value = identifier.trim();
    if (value.includes("@")) {
      return prisma.user.findUnique({
        where: { email: value.toLowerCase() },
        include: { employee: true, company: true },
      });
    }
    return prisma.user.findUnique({
      where: { loginId: value.toUpperCase() },
      include: { employee: true, company: true },
    });
  },

  createToken(data: {
    userId: string;
    token: string;
    type: "EMAIL_VERIFY" | "PASSWORD_RESET" | "REFRESH";
    expiresAt: Date;
  }) {
    return prisma.token.create({ data });
  },

  findValidToken(token: string, type: "EMAIL_VERIFY" | "PASSWORD_RESET" | "REFRESH") {
    return prisma.token.findFirst({
      where: {
        token,
        type,
        used: false,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });
  },

  markTokenUsed(id: string) {
    return prisma.token.update({ where: { id }, data: { used: true } });
  },

  revokeUserTokens(userId: string, type: "EMAIL_VERIFY" | "PASSWORD_RESET" | "REFRESH") {
    return prisma.token.updateMany({
      where: { userId, type, used: false },
      data: { used: true },
    });
  },
};
