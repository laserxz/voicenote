import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Stored base64-encoded: bcrypt hashes contain `$`, which Next's
        // .env loader (dotenv-expand) mangles via variable expansion.
        const hashB64 = process.env.ADMIN_PASSWORD_HASH_B64;
        const hash = hashB64
          ? Buffer.from(hashB64, "base64").toString("utf8")
          : undefined;
        if (
          hash &&
          credentials?.email === process.env.ADMIN_EMAIL &&
          typeof credentials?.password === "string" &&
          (await bcrypt.compare(credentials.password, hash))
        ) {
          return { id: "1", email: process.env.ADMIN_EMAIL!, name: "Admin" };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  trustHost: true,
});
