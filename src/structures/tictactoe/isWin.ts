export default function isWinTictactoe(state: Record<string, string>, emoji: string) {

  const states = [
    [state["1"], state["2"], state["3"]].every(x => x === emoji),
    [state["4"], state["5"], state["6"]].every(x => x === emoji),
    [state["7"], state["8"], state["9"]].every(x => x === emoji),
    [state["1"], state["4"], state["7"]].every(x => x === emoji),
    [state["2"], state["5"], state["8"]].every(x => x === emoji),
    [state["3"], state["6"], state["9"]].every(x => x === emoji),
    [state["3"], state["5"], state["7"]].every(x => x === emoji),
    [state["1"], state["5"], state["9"]].every(x => x === emoji),
  ];

  return states.some(x => x === true);
}