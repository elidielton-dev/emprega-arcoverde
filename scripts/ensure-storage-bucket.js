const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

const env = {};
for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#") || !line.includes("=")) continue;
  const i = line.indexOf("=");
  let v = line.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  env[line.slice(0, i).trim()] = v;
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = env.STORAGE_BUCKET || "emprega-arcoverde-docs";

if (!url || !key) {
  console.error("Missing Supabase URL or SERVICE_ROLE_KEY");
  process.exit(1);
}

const c = createClient(url, key, { auth: { persistSession: false } });

(async () => {
  const list = await c.storage.listBuckets();
  if (list.error) {
    console.error("list error", list.error);
    process.exit(1);
  }
  console.log(
    "buckets:",
    list.data.map((b) => b.name).join(", ") || "(none)",
  );
  if (!list.data.some((b) => b.name === bucket)) {
    const r = await c.storage.createBucket(bucket, {
      public: false,
      fileSizeLimit: 10485760,
    });
    console.log("create:", r.error ? r.error.message : "ok");
  } else {
    console.log("exists:", bucket);
  }
  const path = `healthcheck/${Date.now()}.txt`;
  const up = await c.storage.from(bucket).upload(path, Buffer.from("ok"), {
    contentType: "text/plain",
    upsert: true,
  });
  console.log("upload:", up.error ? up.error.message : up.data.path);
})();
