import Ijsn, { ijsn } from "./Ijsn";
import Interpolator from "./Interpolator";
import PostProcessor from "./PostProcessor";
import Translator from "./Translator";

export * from "./@types";
export * from "./Ijsn";
export * from "./utils";

export default ijsn;

export const t = ijsn.t;

export {
  Ijsn,
  Interpolator,
  PostProcessor,
  Translator
};
