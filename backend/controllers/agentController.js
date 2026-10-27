const Groq = require("groq-sdk");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const Bill = require("../models/Bill");
const mongoose = require("mongoose");

const DEFAULT_MODELS = [
  process.env.GROQ_MODEL,
  "qwen/qwen3.8-27b",
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "openai/gpt-oss-120b",
].filter(Boolean);

async function fetchShopContext(userId) {
  const uid = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId)
    : userId;

  const [products, customers, recentBills] = await Promise.all([
    Product.find({ user: uid }).lean(),
    Customer.find({ user: uid }).select("name phone address debt").lean(),
    Bill.find({ user: uid })
      .populate("customer", "name phone")
      .populate("items.product", "name category purchasePrice price unit")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
  ]);

  const totalSales = recentBills.reduce((s, b) => s + (b.totalAmount || 0), 0);
  const totalPaid = recentBills.reduce((s, b) => s + (b.paidAmount || 0), 0);
  const totalBillPending = totalSales - totalPaid;

  const outOfStockProducts = products.filter((p) => (p.quantity || 0) <= 0);
  const lowStockProducts = products.filter(
    (p) => (p.quantity || 0) > 0 && (p.quantity || 0) <= 10
  );

  const totalInventoryCost = products.reduce(
    (sum, p) => sum + (p.purchasePrice || 0) * (p.quantity || 0),
    0
  );
  const totalInventoryRetail = products.reduce(
    (sum, p) => sum + (p.price || 0) * (p.quantity || 0),
    0
  );

  const totalCustomerDebt = customers.reduce(
    (sum, c) => sum + (c.debt || 0),
    0
  );
  const debtCustomers = customers
    .filter((c) => (c.debt || 0) > 0)
    .sort((a, b) => (b.debt || 0) - (a.debt || 0));

  const productStats = {};
  recentBills.forEach((bill) => {
    (bill.items || []).forEach((item) => {
      const pname = item.product?.name || "Unknown";
      if (!productStats[pname]) {
        productStats[pname] = { qtySold: 0, revenue: 0, profit: 0, category: item.product?.category || "General" };
      }
      const qty = item.quantity || 0;
      const sp = item.price || 0;
      const pp = item.product?.purchasePrice || 0;
      productStats[pname].qtySold += qty;
      productStats[pname].revenue += sp * qty;
      productStats[pname].profit += (sp - pp) * qty;
    });
  });

  const topProducts = Object.entries(productStats)
    .sort((a, b) => b[1].qtySold - a[1].qtySold)
    .slice(0, 10)
    .map(([name, s]) => ({ name, ...s }));

  return {
    products,
    customers,
    recentBills,
    summary: {
      totalProducts: products.length,
      totalCustomers: customers.length,
      totalBillsAnalyzed: recentBills.length,
      totalSales: totalSales.toFixed(2),
      totalPaid: totalPaid.toFixed(2),
      totalBillPending: totalBillPending.toFixed(2),
      totalCustomerDebt: totalCustomerDebt.toFixed(2),
      totalInventoryCost: totalInventoryCost.toFixed(2),
      totalInventoryRetail: totalInventoryRetail.toFixed(2),
    },
    outOfStockProducts,
    lowStockProducts,
    debtCustomers,
    topProducts,
  };
}

function buildSystemPrompt(ctx) {
  return `You are a helpful, smart AI Business Advisor for a Ration & Grocery Shop.
You have real-time access to the shop's live inventory, customer ledgers, and billing database.

Guidelines:
1. Always use "Rs." for Indian Rupees.
2. Structure your answers with clean markdown headers (### Header Title), bold text (**word**), and bullet points (-). Do not output emoji characters (like 💡, ⚠️, ✅) in headers because our frontend renders native Lucide SVG icons instead.
3. Be direct, clear, and actionable. Highlight urgent issues (e.g., out of stock products, high pending customer debts).
4. You understand and reply in English, Hindi, or Hinglish depending on how the shopkeeper asks.
5. If the shopkeeper asks for recommendations (what to reorder, who to follow up with, profit ideas), give practical advice based on the data.

=== LIVE SHOP DATA ===

OVERVIEW:
- Total Products in inventory: ${ctx.summary.totalProducts}
- Total Registered Customers: ${ctx.summary.totalCustomers}
- Recent Bills analyzed: ${ctx.summary.totalBillsAnalyzed}
- Total Revenue (recent bills): Rs.${ctx.summary.totalSales}
- Total Cash/Amount Received: Rs.${ctx.summary.totalPaid}
- Total Outstanding Customer Debt (Ledger): Rs.${ctx.summary.totalCustomerDebt}
- Current Inventory Stock Value (Purchase Cost): Rs.${ctx.summary.totalInventoryCost}
- Estimated Inventory Retail Value: Rs.${ctx.summary.totalInventoryRetail}

OUT OF STOCK (0 units left):
${
  ctx.outOfStockProducts.length > 0
    ? ctx.outOfStockProducts.map((p) => `- ${p.name} (${p.category}): 0 left (REORDER NEEDED)`).join("\n")
    : "None - all registered items have some stock."
}

LOW STOCK ALERTS (10 units or less):
${
  ctx.lowStockProducts.length > 0
    ? ctx.lowStockProducts
        .map((p) => `- ${p.name}: only ${p.quantity} ${p.unit} remaining | Sell: Rs.${p.price}`)
        .join("\n")
    : "None - stock is sufficient."
}

FULL INVENTORY:
${
  ctx.products.length > 0
    ? ctx.products
        .map(
          (p) =>
            `- ${p.name} | Category: ${p.category} | Stock: ${p.quantity} ${p.unit} | Buy: Rs.${p.purchasePrice} | Sell: Rs.${p.price}`
        )
        .join("\n")
    : "No products added yet."
}

CUSTOMERS WITH PENDING DUES (Highest Debt First):
${
  ctx.debtCustomers.length > 0
    ? ctx.debtCustomers
        .map((c) => `- ${c.name} (${c.phone || "No phone"}): owes Rs.${c.debt}`)
        .join("\n")
    : "All customers have 0 pending dues."
}

TOP SELLING PRODUCTS (by units sold):
${
  ctx.topProducts.length > 0
    ? ctx.topProducts
        .map(
          (p) =>
            `- ${p.name}: ${p.qtySold} sold | Revenue: Rs.${p.revenue.toFixed(2)} | Profit: Rs.${p.profit.toFixed(2)}`
        )
        .join("\n")
    : "No sales recorded yet."
}

RECENT BILLS (Sample):
${
  ctx.recentBills.slice(0, 15).map(
    (b) =>
      `- Customer: ${b.customer?.name || b.customerName || "Customer"} | Total: Rs.${b.totalAmount} | Paid: Rs.${b.paidAmount} | Date: ${new Date(b.createdAt).toLocaleDateString("en-IN")}`
  ).join("\n") || "No recent bills."
}

=== END OF DATA ===`;
}

async function callGroqWithFallback(groq, messages) {
  let lastError = null;

  for (const model of DEFAULT_MODELS) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages,
        temperature: 0.5,
        max_tokens: 1024,
      });

      const reply = completion.choices[0]?.message?.content;
      if (reply) {
        return { reply, modelUsed: model };
      }
    } catch (err) {
      console.warn(`Groq model ${model} failed: ${err.message}. Trying next fallback...`);
      lastError = err;
    }
  }

  throw lastError || new Error("All Groq models failed");
}

const chatWithAgent = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        error: "GROQ_API_KEY is not configured in your backend environment variables (Add it in Render Dashboard > Environment).",
      });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User authentication missing" });
    }

    const ctx = await fetchShopContext(userId);

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const validHistory = (Array.isArray(history) ? history : [])
      .slice(-6)
      .filter((h) => h && h.text && h.role)
      .map((h) => ({
        role: h.role === "assistant" || h.role === "ai" ? "assistant" : "user",
        content: String(h.text),
      }));

    const messages = [
      { role: "system", content: buildSystemPrompt(ctx) },
      ...validHistory,
      { role: "user", content: message.trim() },
    ];

    const { reply, modelUsed } = await callGroqWithFallback(groq, messages);

    res.json({
      reply,
      model: modelUsed,
      summary: ctx.summary,
    });
  } catch (error) {
    console.error("Groq Agent Error:", error);
    res.status(500).json({
      error: error.message || "Failed to generate AI response. Please try again.",
    });
  }
};

module.exports = { chatWithAgent };
