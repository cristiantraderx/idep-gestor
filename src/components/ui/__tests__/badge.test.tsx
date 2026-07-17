import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Badge } from "../badge";

describe("Badge", () => {
  // Rendering
  it("renders children text", () => {
    render(<Badge>Novo</Badge>);
    expect(screen.getByText("Novo")).toBeInTheDocument();
  });

  it("renders number as children", () => {
    render(<Badge>42</Badge>);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders with icon and text", () => {
    render(<Badge><span data-testid="icon" />Ativo</Badge>);
    expect(screen.getByText("Ativo")).toBeInTheDocument();
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("renders as a div element", () => {
    render(<Badge>Tag</Badge>);
    const badge = screen.getByText("Tag");
    expect(badge.tagName).toBe("DIV");
  });

  // Variants
  it("applies default variant by default", () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText("Default");
    expect(badge.className).toContain("bg-primary");
    expect(badge.className).toContain("text-primary-foreground");
  });

  it("applies secondary variant classes", () => {
    render(<Badge variant="secondary">Secundário</Badge>);
    const badge = screen.getByText("Secundário");
    expect(badge.className).toContain("bg-secondary");
  });

  it("applies destructive variant classes", () => {
    render(<Badge variant="destructive">Erro</Badge>);
    const badge = screen.getByText("Erro");
    expect(badge.className).toContain("bg-destructive");
    expect(badge.className).toContain("text-destructive-foreground");
  });

  it("applies outline variant classes", () => {
    render(<Badge variant="outline">Rascunho</Badge>);
    const badge = screen.getByText("Rascunho");
    expect(badge.className).toContain("text-foreground");
  });

  it("applies success variant classes", () => {
    render(<Badge variant="success">Concluído</Badge>);
    const badge = screen.getByText("Concluído");
    expect(badge.className).toContain("bg-rondonia-700");
    expect(badge.className).toContain("text-white");
  });

  it("applies warning variant classes", () => {
    render(<Badge variant="warning">Atenção</Badge>);
    const badge = screen.getByText("Atenção");
    expect(badge.className).toContain("bg-amber-500");
    expect(badge.className).toContain("text-white");
  });

  // Custom className
  it("merges custom className with variant classes", () => {
    render(<Badge className="custom-badge">Custom</Badge>);
    const badge = screen.getByText("Custom");
    expect(badge.className).toContain("custom-badge");
    expect(badge.className).toContain("bg-primary");
  });

  // Styling
  it("has rounded-full shape", () => {
    render(<Badge>Shape</Badge>);
    const badge = screen.getByText("Shape");
    expect(badge.className).toContain("rounded-full");
  });

  it("has small text size", () => {
    render(<Badge>Texto</Badge>);
    const badge = screen.getByText("Texto");
    expect(badge.className).toContain("text-xs");
  });

  it("has font-semibold weight", () => {
    render(<Badge>Peso</Badge>);
    const badge = screen.getByText("Peso");
    expect(badge.className).toContain("font-semibold");
  });

  // All variants render without error
  it("renders all variants without crashing", () => {
    const variants = ["default", "secondary", "destructive", "outline", "success", "warning"] as const;
    variants.forEach((variant) => {
      const { unmount } = render(<Badge variant={variant}>{variant}</Badge>);
      expect(screen.getByText(variant)).toBeInTheDocument();
      unmount();
    });
  });

  // HTML attributes
  it("passes additional HTML attributes", () => {
    render(<Badge data-testid="test-badge" id="badge-1">Test</Badge>);
    const badge = screen.getByTestId("test-badge");
    expect(badge).toHaveAttribute("id", "badge-1");
  });

  it("passes style prop", () => {
    render(<Badge style={{ backgroundColor: "red" }}>Estilizado</Badge>);
    const badge = screen.getByText("Estilizado");
    expect(badge.style.backgroundColor).toBe("red");
  });
});
