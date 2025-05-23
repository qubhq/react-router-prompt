import { useCallback, useEffect } from "react"
import {
  useBeforeUnload,
  useBlocker,
  Blocker,
  BlockerFunction,
  Location,
} from "react-router"
import { DefaultBehaviour } from "../types"

// You can abstract `useBlocker` to use the browser's `window.confirm` dialog to
// determine whether or not the user should navigate within the current origin.
// `useBlocker` can also be used in conjunction with `useBeforeUnload` to
// prevent navigation away from the current origin.
//
// IMPORTANT: There are edge cases with this behavior in which React Router
// cannot reliably access the correct location in the history stack. In such
// cases the user may attempt to stay on the page but the app navigates anyway,
// or the app may stay on the correct page but the browser's history stack gets
// out of whack. You should test your own implementation thoroughly to make sure
// the tradeoffs are right for your users.
function usePrompt(
  when: boolean | BlockerFunction,
  onNavigate?: (nextLocation: Location) => void,
  defaultBehaviour?: DefaultBehaviour,
): Blocker {
  const blocker = useBlocker(when)
  useEffect(() => {
    if (blocker.state === "blocked" && blocker.location && onNavigate) {
      onNavigate(blocker.location)
    }
    if (blocker.state === "blocked" && !when) {
      if (defaultBehaviour === "proceed") setTimeout(blocker.proceed, 0)
      else blocker.reset()
    }
  }, [blocker, defaultBehaviour, when, onNavigate])

  useBeforeUnload(
    useCallback(
      (event) => {
        if (
          (typeof when === "boolean" && when === true) ||
          // @ts-expect-error Reload case -- No location present
          (typeof when === "function" && when())
        ) {
          event.preventDefault()
          // eslint-disable-next-line no-param-reassign
          event.returnValue = "Changes that you made may not be saved."
        }
      },
      [when],
    ),
    { capture: true },
  )

  return blocker
}

export default usePrompt
