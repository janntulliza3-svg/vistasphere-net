const TEMPLATE = `হ্যালো এডমিন, আমি আমার অ্যাকাউন্টটি একটিভ করতে চাই।\n\nপ্ল্যান: {plan}\nদাম: {price}\n\nআমি কিভাবে টাকা পাঠাবো দয়া করে জানাবেন।`;

export function buyPlanLink(opts: { bot: string; plan: string; price: string }) {
  const bot = (opts.bot || "vipdesi_bot").replace(/^@/, "");
  const text = TEMPLATE.replace("{plan}", opts.plan).replace("{price}", opts.price);
  return `https://t.me/${bot}?text=${encodeURIComponent(text)}`;
}