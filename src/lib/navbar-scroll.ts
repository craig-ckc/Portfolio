export type NavbarScrollState = {
  y: number
  turnY: number
  direction: number
  mode: 'flow' | 'hidden' | 'peek'
}

export function initialNavbarScroll(y: number, height: number, revealed = false): NavbarScrollState {
  y = Math.max(0, y)
  return { y, turnY: y, direction: 0, mode: y > 0 && revealed ? 'peek' : y >= height ? 'hidden' : 'flow' }
}

/** Direction changes need a little travel, so trackpad noise cannot flicker the nav. */
export function advanceNavbarScroll(state: NavbarScrollState, y: number, height: number, focused = false): NavbarScrollState {
  y = Math.max(0, y)
  if (y === 0) return initialNavbarScroll(0, height)
  if (focused) return state.mode === 'peek' && state.y === y ? state : { ...state, y, turnY: y, mode: 'peek' }
  if (Math.abs(y - state.y) < 0.5) return state

  const direction = Math.sign(y - state.y)
  const turnY = direction === state.direction ? state.turnY : state.y
  const travel = Math.abs(y - turnY)
  let mode = state.mode
  if (direction < 0 && travel >= 6) mode = 'peek'
  else if (direction > 0 && mode === 'peek' && travel >= 12) mode = 'hidden'
  else if (mode === 'flow' && y >= height) mode = 'hidden'
  return { y, turnY, direction, mode }
}
