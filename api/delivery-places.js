import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const clean = v => typeof v === "string" ? v.trim() : "";

function valid(body) {
  const pincode = clean(body.pincode);
  const office_name = clean(body.office_name);
  const delivery_places = clean(body.delivery_places);

  if (!/^\d{6}$/.test(pincode))
    throw new Error("PIN Code 6 ಅಂಕಿಗಳಿರಬೇಕು.");

  if (!office_name || !delivery_places)
    throw new Error("Office Name ಮತ್ತು Delivery Place ಕಡ್ಡಾಯ.");

  return {
    pincode,
    office_name,
    delivery_places,
    delivery_beat: clean(body.delivery_beat) || null,
    office_type: clean(body.office_type) || null,
    located_village: clean(body.located_village) || null,
    remarks: clean(body.remarks) || null
  };
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    if (req.method === "GET") {
      const id = req.query.id ? Number(req.query.id) : null;

      if (id) {
        const rows = await sql`
          SELECT id,pincode,office_name,delivery_places,
          delivery_beat,office_type,located_village,remarks
          FROM hubballi_delivery_places
          WHERE id=${id} LIMIT 1
        `;
        return res.status(200).json({ row: rows[0] || null });
      }

      const q = String(req.query.q || "").trim().slice(0,100);
      const pattern = `%${q}%`;

      const rows = await sql`
        SELECT id,pincode,office_name,delivery_places,
        delivery_beat,office_type,located_village,remarks
        FROM hubballi_delivery_places
        WHERE (
          ${q}='' OR pincode ILIKE ${pattern}
          OR office_name ILIKE ${pattern}
          OR delivery_places ILIKE ${pattern}
          OR located_village ILIKE ${pattern}
        )
        ORDER BY pincode,office_name,delivery_places
        LIMIT 100
      `;

      return res.status(200).json({ rows });
    }

    if (req.method === "POST") {
      const d = valid(req.body || {});

      const rows = await sql`
        INSERT INTO hubballi_delivery_places
        (pincode,office_name,delivery_places,delivery_beat,
         office_type,located_village,remarks)
        VALUES
        (${d.pincode},${d.office_name},${d.delivery_places},
         ${d.delivery_beat},${d.office_type},
         ${d.located_village},${d.remarks})
        RETURNING id
      `;

      return res.status(201).json({ id: rows[0].id });
    }

    if (req.method === "PATCH") {
      const id = Number(req.query.id);

      if (!Number.isSafeInteger(id) || id < 1)
        return res.status(400).json({ error: "Invalid record ID" });

      const d = valid(req.body || {});

      const rows = await sql`
        UPDATE hubballi_delivery_places
        SET pincode=${d.pincode},
        office_name=${d.office_name},
        delivery_places=${d.delivery_places},
        delivery_beat=${d.delivery_beat},
        office_type=${d.office_type},
        located_village=${d.located_village},
        remarks=${d.remarks},
        updated_at=NOW()
        WHERE id=${id}
        RETURNING id
      `;

      if (!rows.length)
        return res.status(404).json({ error: "Record not found" });

      return res.status(200).json({ id: rows[0].id });
    }

    res.setHeader("Allow", "GET, POST, PATCH, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });

  } catch (e) {
    return res.status(400).json({
      error: e.message || "Request failed"
    });
  }
}
