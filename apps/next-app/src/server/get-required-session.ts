import { redirect } from "next/navigation";
import { getRequestAuthSnapshot } from "./request-auth";

export async function getRequiredSession() {
  const { session, userState } = await getRequestAuthSnapshot();

  if (!session) {
    redirect("/login");
  }

  if (!userState || userState.disabledAt) {
    redirect("/signout");
  }

  return { ...session, userState };
}
