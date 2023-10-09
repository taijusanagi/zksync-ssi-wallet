import nextAppSession from "next-app-session";

type Session = {
  state?: string;
};

export const session = nextAppSession<Session>({});
