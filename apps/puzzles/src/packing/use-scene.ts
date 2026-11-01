import { useReducer } from "react";
import { initialScene, type Scene } from "./model.ts";

type History = {
  future: Scene[];
  past: Scene[];
  scene: Scene;
  time: number;
};
type Action =
  | {
      type: "edit";
      scene: Scene;
      time: number;
      isolated: boolean;
    }
  | {
      type: "undo";
    }
  | {
      type: "redo";
    };
const HISTORY_LIMIT = 60;
const GESTURE_INTERVAL = 500;
const reducer = (state: History, action: Action): History => {
  switch (action.type) {
    case "edit":
      return {
        future: [],
        past:
          !action.isolated && action.time - state.time < GESTURE_INTERVAL
            ? state.past
            : [
                ...state.past,
                state.scene,
              ].slice(-HISTORY_LIMIT),
        scene: action.scene,
        time: action.isolated ? 0 : action.time,
      };
    case "undo": {
      const previous = state.past.at(-1);
      return previous
        ? {
            future: [
              state.scene,
              ...state.future,
            ],
            past: state.past.slice(0, -1),
            scene: previous,
            time: 0,
          }
        : state;
    }
    case "redo": {
      const next = state.future[0];
      return next
        ? {
            future: state.future.slice(1),
            past: [
              ...state.past,
              state.scene,
            ],
            scene: next,
            time: 0,
          }
        : state;
    }
    default:
      return state;
  }
};
const useScene = () => {
  const [history, dispatch] = useReducer(reducer, undefined, () => ({
    future: [],
    past: [],
    scene: initialScene(),
    time: 0,
  }));
  return {
    canRedo: history.future.length > 0,
    canUndo: history.past.length > 0,
    change: (scene: Scene, isolated = false) =>
      dispatch({
        isolated,
        scene,
        time: Date.now(),
        type: "edit",
      }),
    redo: () =>
      dispatch({
        type: "redo",
      }),
    scene: history.scene,
    undo: () =>
      dispatch({
        type: "undo",
      }),
  };
};

export { useScene };
