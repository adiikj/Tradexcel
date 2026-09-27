import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Sparkline from "./Sparkline";

const lineClass = (container: HTMLElement) => container.querySelector("polyline")?.getAttribute("class") ?? "";

describe("Sparkline", () => {
  it("colours by its own first-to-last move by default", () => {
    expect(lineClass(render(<Sparkline values={[10, 12]} />).container)).toContain("stroke-green");
    expect(lineClass(render(<Sparkline values={[12, 10]} />).container)).toContain("stroke-red");
  });

  it("lets trend override the colour, so a stock up today but down over the month reads green", () => {
    expect(lineClass(render(<Sparkline values={[12, 10]} trend={2.5} />).container)).toContain("stroke-green");
    expect(lineClass(render(<Sparkline values={[10, 12]} trend={-1} />).container)).toContain("stroke-red");
  });
});
