import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useState } from "react";
import { useAsyncEffect } from "./useAsyncEffect";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

describe("useAsyncEffect", () => {
  it("drops a slow response that arrives after the deps changed", async () => {
    const responses: Record<string, ReturnType<typeof deferred<string>>> = {
      global: deferred(),
      friends: deferred(),
    };

    const { result, rerender } = renderHook(
      ({ scope }) => {
        const [shown, setShown] = useState<string | null>(null);
        useAsyncEffect(
          (isActive) =>
            responses[scope].promise.then((data) => {
              if (isActive()) setShown(data);
            }),
          [scope]
        );
        return shown;
      },
      { initialProps: { scope: "global" } }
    );

    rerender({ scope: "friends" });
    responses.friends.resolve("friends data");
    await waitFor(() => expect(result.current).toBe("friends data"));

    // The stale "global" response lands last but must not overwrite.
    responses.global.resolve("global data");
    await Promise.resolve();
    expect(result.current).toBe("friends data");
  });
});
