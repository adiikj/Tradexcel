import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Testing Library only auto-cleans with vitest globals enabled; unmount
// rendered trees between tests explicitly instead.
afterEach(() => cleanup());
