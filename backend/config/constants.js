const VISION_MODEL_PRIMARY = process.env.VISION_MODEL_PRIMARY || "meta-llama/llama-4-scout-17b-16e-instruct";
const VISION_MODEL_FALLBACK = process.env.VISION_MODEL_FALLBACK || "llama-3.2-11b-vision-preview";

module.exports = {
  VISION_MODEL_PRIMARY,
  VISION_MODEL_FALLBACK
};
