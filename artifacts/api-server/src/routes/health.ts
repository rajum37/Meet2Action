import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

router.get("/healthz", async (req, res) => {
  let db: "ok" | "error" | "unconfigured" = "unconfigured";
  let dbDetail: string | undefined;

  if (!supabase) {
    db = "unconfigured";
  } else {
    try {
      const { error } = await supabase.from("meetings").select("id").limit(0);
      if (error) {
        db = "error";
        dbDetail = error.message;
        req.log.warn({ supabaseError: error.message, code: error.code }, "Supabase health check failed");
      } else {
        db = "ok";
        req.log.info("Supabase connection OK");
      }
    } catch (err) {
      db = "error";
      dbDetail = err instanceof Error ? err.message : String(err);
      req.log.error({ err }, "Supabase health check threw");
    }
  }

  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json({ ...data, db, ...(dbDetail ? { dbDetail } : {}) });
});

export default router;
