import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ChatMarkdown from "./ChatMarkdown";

describe("ChatMarkdown", () => {
  it("renders bold, italic, lists and paragraphs", () => {
    const { container } = render(<ChatMarkdown text={"You get **₹1,00,000**.\nTap *Use password instead*.\n\n- one\n- **two**\n1. first\n2. second"} />);
    expect(container.querySelector("strong")?.textContent).toBe("₹1,00,000");
    expect(container.querySelector("em")?.textContent).toBe("Use password instead");
    expect([...container.querySelectorAll("ul li")].map((li) => li.textContent)).toEqual(["one", "two"]);
    expect([...container.querySelectorAll("ol li")].map((li) => li.textContent)).toEqual(["first", "second"]);
    expect(container.querySelectorAll("p")).toHaveLength(1);
    expect(container.querySelector("p br")).not.toBeNull();
  });

  it("never renders HTML from the text", () => {
    const { container } = render(<ChatMarkdown text={'<img src=x onerror="alert(1)"> **hi**'} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain('<img src=x onerror="alert(1)">');
  });
});
