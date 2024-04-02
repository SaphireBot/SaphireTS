import allBrands from "../../JSON/brands.json";
import BrandQuiz from "./brands/brands";
import QuizCharacters from "./characters/manager";
import FlagQuiz, { allFlags } from "./flags/flags";

const QuizCharactersManager = new QuizCharacters();

export {
  allBrands,
  allFlags,
  BrandQuiz,
  FlagQuiz,
  QuizCharacters,
  QuizCharactersManager
};