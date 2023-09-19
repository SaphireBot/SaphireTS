import Idjsn, { idjsn } from "./Idjsn";
import Interpolator from "./Interpolator";
import PostProcessor from "./PostProcessor";
import Translator from "./Translator";

export * from "./@types";
export * from "./Idjsn";

export default idjsn;

export const t = idjsn.t;

export {
  Idjsn,
  Interpolator,
  PostProcessor,
  Translator
};
