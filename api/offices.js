import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const q = String(req.query.q || "").trim().slice(0,100);
    const p = `%${q}%`;

    const rows = await sql`
      SELECT id,pincode,office_name,office_type
      FROM hubballi_office_master
      WHERE (
        ${q}='' OR pincode ILIKE ${p}
        OR office_name ILIKE ${p}
      )
      ORDER BY pincode,office_name
      LIMIT 100
    `;

    return res.status(200).json({ rows });

  } catch (e) {
    return res.status(400).json({
      error: e.message || "Search failed"
    });
  }
}
