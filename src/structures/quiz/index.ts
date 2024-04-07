import allBrands from "../../JSON/brands.json";
import BrandQuiz from "./brands/brands";
import QuizCharacter from "./characters/characters";
import QQuizCharactersManager from "./characters/manager";
import FlagQuiz, { allFlags } from "./flags/flags";

const QuizCharactersManager = new QQuizCharactersManager();

export {
  allBrands,
  allFlags,
  BrandQuiz,
  FlagQuiz,
  QuizCharacter,
  QuizCharactersManager
};