import allBrands from "../../JSON/brands.json";
import BrandQuiz from "./brands/brands";
import QuizCharacter from "./characters/characters";
import QQuizCharactersManager from "./characters/manager";
import QuizMember from "./members/members.quiz";
import FlagQuiz, { allFlags } from "./flags/flags";

const QuizCharactersManager = new QQuizCharactersManager();
const QuizRankingRefresher = QQuizCharactersManager.refreshRank.bind(QQuizCharactersManager);

export {
  allBrands,
  allFlags,
  BrandQuiz,
  FlagQuiz,
  QuizCharacter,
  QuizCharactersManager,
  QuizRankingRefresher,
  QuizMember,
};