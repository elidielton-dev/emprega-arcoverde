import { calculateProfessionalAts } from "../src/lib/matching/professional-ats.ts";

const candidate = JSON.parse(process.argv[2] || "{}");
const job = JSON.parse(process.argv[3] || "{}");
const result = calculateProfessionalAts(candidate, job);
process.stdout.write(JSON.stringify(result));
