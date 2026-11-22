import { getSnapshot } from "../lib/wayback";

async function main(): Promise<void> {
  const result = await getSnapshot("geocities.com");
  console.log(result);
}

main();
