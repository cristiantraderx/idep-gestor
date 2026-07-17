import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Avatar, AvatarImage, AvatarFallback } from "../avatar";

describe("Avatar", () => {
  it("renders children", () => {
    render(<Avatar><AvatarFallback>AB</AvatarFallback></Avatar>);
    expect(screen.getByText("AB")).toBeInTheDocument();
  });

  it("applies avatar styling classes", () => {
    render(<Avatar data-testid="avatar"><AvatarFallback>AB</AvatarFallback></Avatar>);
    const avatar = screen.getByTestId("avatar");
    expect(avatar.className).toContain("rounded-full");
    expect(avatar.className).toContain("h-10");
    expect(avatar.className).toContain("w-10");
  });

  it("merges custom className", () => {
    render(<Avatar className="custom-avatar" data-testid="avatar"><AvatarFallback>AB</AvatarFallback></Avatar>);
    const avatar = screen.getByTestId("avatar");
    expect(avatar.className).toContain("custom-avatar");
  });

  it("renders as a div element", () => {
    render(<Avatar data-testid="avatar"><AvatarFallback>AB</AvatarFallback></Avatar>);
    const avatar = screen.getByTestId("avatar");
    expect(avatar.tagName).toBe("DIV");
  });

  it("has overflow-hidden class for image containment", () => {
    render(<Avatar data-testid="avatar"><AvatarFallback>AB</AvatarFallback></Avatar>);
    const avatar = screen.getByTestId("avatar");
    expect(avatar.className).toContain("overflow-hidden");
  });
});

describe("AvatarImage", () => {
  it("renders as img element", () => {
    render(<AvatarImage src="https://example.com/photo.jpg" alt="Foto" data-testid="img" />);
    const img = screen.getByTestId("img");
    expect(img.tagName).toBe("IMG");
  });

  it("renders with correct src attribute", () => {
    render(<AvatarImage src="https://example.com/photo.jpg" alt="Foto" data-testid="img" />);
    const img = screen.getByTestId("img");
    expect(img).toHaveAttribute("src", "https://example.com/photo.jpg");
  });

  it("renders with correct alt text", () => {
    render(<AvatarImage src="https://example.com/photo.jpg" alt="Foto do perfil" />);
    expect(screen.getByAltText("Foto do perfil")).toBeInTheDocument();
  });

  it("applies image styling classes", () => {
    render(<AvatarImage src="https://example.com/photo.jpg" alt="Foto" data-testid="img" />);
    const img = screen.getByTestId("img");
    expect(img.className).toContain("aspect-square");
    expect(img.className).toContain("object-cover");
  });

  it("handles missing alt gracefully", () => {
    const { container } = render(<AvatarImage src="https://example.com/photo.jpg" data-testid="img" />);
    const img = container.querySelector("[data-testid='img']");
    expect(img).toBeInTheDocument();
  });
});

describe("AvatarFallback", () => {
  it("renders initials text", () => {
    render(<AvatarFallback>CM</AvatarFallback>);
    expect(screen.getByText("CM")).toBeInTheDocument();
  });

  it("renders longer text", () => {
    render(<AvatarFallback>AB</AvatarFallback>);
    expect(screen.getByText("AB")).toBeInTheDocument();
  });

  it("applies fallback styling classes", () => {
    render(<AvatarFallback data-testid="fallback">CM</AvatarFallback>);
    const fallback = screen.getByTestId("fallback");
    expect(fallback.className).toContain("rounded-full");
    expect(fallback.className).toContain("bg-muted");
    expect(fallback.className).toContain("font-medium");
  });

  it("merges custom className", () => {
    render(<AvatarFallback className="custom-fallback" data-testid="fallback">CM</AvatarFallback>);
    const fallback = screen.getByTestId("fallback");
    expect(fallback.className).toContain("custom-fallback");
  });

  it("renders as a div element", () => {
    render(<AvatarFallback data-testid="fallback">CM</AvatarFallback>);
    const fallback = screen.getByTestId("fallback");
    expect(fallback.tagName).toBe("DIV");
  });
});

describe("Avatar composition", () => {
  it("renders Avatar with Image and Fallback together", () => {
    render(
      <Avatar data-testid="avatar-composed">
        <AvatarImage src="https://example.com/photo.jpg" alt="User" />
        <AvatarFallback>CM</AvatarFallback>
      </Avatar>
    );

    expect(screen.getByAltText("User")).toBeInTheDocument();
    expect(screen.getByText("CM")).toBeInTheDocument();
  });

  it("renders fallback when image has no src", () => {
    render(
      <Avatar>
        <AvatarImage alt="User" />
        <AvatarFallback data-testid="fallback-only">JD</AvatarFallback>
      </Avatar>
    );

    expect(screen.getByTestId("fallback-only")).toBeInTheDocument();
  });

  it("renders with just fallback (no image)", () => {
    render(
      <Avatar data-testid="avatar-fallback-only">
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    );

    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("wraps image inside the avatar container", () => {
    render(
      <Avatar data-testid="avatar-wrapper">
        <AvatarImage src="https://example.com/photo.jpg" alt="User" />
      </Avatar>
    );

    const avatar = screen.getByTestId("avatar-wrapper");
    const img = screen.getByAltText("User");
    expect(avatar.contains(img)).toBe(true);
  });
});
