import { redirect } from "next/navigation";
import { Container } from "@/src/server/container";
import { MessageBus, GetUserCountQuery } from "@next-phish/backend";

export default async function Home() {
  const bus = Container.get(MessageBus);
  const handler = Container.get(GetUserCountQuery);
  const count = await bus.query(handler, {});

  if (count === 0) redirect("/setup");
  redirect("/login");
}
