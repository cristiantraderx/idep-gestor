import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Button } from "../button";

describe("Button", () => {
  // Rendering
  it("renders children text", () => {
    render(<Button>Clique aqui</Button>);
    expect(screen.getByText("Clique aqui")).toBeInTheDocument();
  });

  it("renders with icon and text", () => {
    render(<Button><span data-testid="icon" />Salvar</Button>);
    expect(screen.getByText("Salvar")).toBeInTheDocument();
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  // Variants
  it("applies default variant classes", () => {
    render(<Button>Default</Button>);
    const button = screen.getByText("Default");
    expect(button.className).toContain("bg-idep-700");
  });

  it("applies destructive variant classes", () => {
    render(<Button variant="destructive">Excluir</Button>);
    const button = screen.getByText("Excluir");
    expect(button.className).toContain("bg-destructive");
  });

  it("applies outline variant classes", () => {
    render(<Button variant="outline">Cancelar</Button>);
    const button = screen.getByText("Cancelar");
    expect(button.className).toContain("border-input");
  });

  it("applies secondary variant classes", () => {
    render(<Button variant="secondary">Secundário</Button>);
    const button = screen.getByText("Secundário");
    expect(button.className).toContain("bg-secondary");
  });

  it("applies ghost variant classes", () => {
    render(<Button variant="ghost">Ghost</Button>);
    const button = screen.getByText("Ghost");
    expect(button.className).toContain("hover:bg-accent");
  });

  it("applies link variant classes", () => {
    render(<Button variant="link">Link</Button>);
    const button = screen.getByText("Link");
    expect(button.className).toContain("underline-offset-4");
  });

  it("applies success variant classes", () => {
    render(<Button variant="success">Sucesso</Button>);
    const button = screen.getByText("Sucesso");
    expect(button.className).toContain("bg-rondonia-700");
  });

  // Sizes
  it("applies default size classes", () => {
    render(<Button>Default</Button>);
    const button = screen.getByText("Default");
    expect(button.className).toContain("h-9");
  });

  it("applies sm size classes", () => {
    render(<Button size="sm">Pequeno</Button>);
    const button = screen.getByText("Pequeno");
    expect(button.className).toContain("h-8");
    expect(button.className).toContain("text-xs");
  });

  it("applies lg size classes", () => {
    render(<Button size="lg">Grande</Button>);
    const button = screen.getByText("Grande");
    expect(button.className).toContain("h-10");
    expect(button.className).toContain("px-8");
  });

  it("applies xl size classes", () => {
    render(<Button size="xl">Extra Grande</Button>);
    const button = screen.getByText("Extra Grande");
    expect(button.className).toContain("h-12");
  });

  it("applies icon size classes", () => {
    render(<Button size="icon" aria-label="Ícone"><span>+</span></Button>);
    const button = screen.getByLabelText("Ícone");
    expect(button.className).toContain("h-9");
    expect(button.className).toContain("w-9");
  });

  it("applies icon-sm size classes", () => {
    render(<Button size="icon-sm" aria-label="Ícone pequeno"><span>+</span></Button>);
    const button = screen.getByLabelText("Ícone pequeno");
    expect(button.className).toContain("h-8");
    expect(button.className).toContain("w-8");
  });

  // States
  it("disables the button when disabled prop is true", () => {
    render(<Button disabled>Desabilitado</Button>);
    const button = screen.getByText("Desabilitado") as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it("applies disabled styling classes", () => {
    render(<Button disabled>Desabilitado</Button>);
    const button = screen.getByText("Desabilitado");
    expect(button.className).toContain("disabled:opacity-50");
  });

  it("is not disabled by default", () => {
    render(<Button>Ativo</Button>);
    const button = screen.getByText("Ativo") as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });

  // Events
  it("calls onClick handler when clicked", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Clicar</Button>);
    await user.click(screen.getByText("Clicar"));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick} disabled>Desabilitado</Button>);
    await user.click(screen.getByText("Desabilitado"));

    expect(handleClick).not.toHaveBeenCalled();
  });

  // Type attribute
  it("has button type by default", () => {
    render(<Button>Submit</Button>);
    const button = screen.getByText("Submit") as HTMLButtonElement;
    expect(button.type).toBe("submit");
  });

  it("accepts custom type", () => {
    render(<Button type="button">Botão</Button>);
    const button = screen.getByText("Botão") as HTMLButtonElement;
    expect(button.type).toBe("button");
  });

  it("accepts reset type", () => {
    render(<Button type="reset">Resetar</Button>);
    const button = screen.getByText("Resetar") as HTMLButtonElement;
    expect(button.type).toBe("reset");
  });

  // Custom className
  it("merges custom className with variant classes", () => {
    render(<Button className="my-custom-class">Custom</Button>);
    const button = screen.getByText("Custom");
    expect(button.className).toContain("my-custom-class");
    expect(button.className).toContain("bg-idep-700");
  });

  // Ref forwarding
  it("forwards ref to the button element", () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<Button ref={ref}>Ref</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current?.textContent).toBe("Ref");
  });

  // Accessibility
  it("accepts aria-label for accessibility", () => {
    render(<Button aria-label="Fechar"><span>X</span></Button>);
    expect(screen.getByLabelText("Fechar")).toBeInTheDocument();
  });

  it("can be focused with tab key", async () => {
    const user = userEvent.setup();
    render(<Button>Focar</Button>);
    const button = screen.getByText("Focar") as HTMLButtonElement;

    await user.tab();
    expect(document.activeElement).toBe(button);
  });

  // All variants render without error
  it("renders all variants without crashing", () => {
    const variants = ["default", "destructive", "outline", "secondary", "ghost", "link", "success"] as const;
    variants.forEach((variant) => {
      const { unmount } = render(<Button variant={variant}>{variant}</Button>);
      expect(screen.getByText(variant)).toBeInTheDocument();
      unmount();
    });
  });

  // All sizes render without error
  it("renders all sizes without crashing", () => {
    const sizes = ["default", "sm", "lg", "xl", "icon", "icon-sm"] as const;
    sizes.forEach((size) => {
      const label = `size-${size}`;
      const { unmount } = render(<Button size={size} aria-label={label}>{label}</Button>);
      expect(screen.getByLabelText(label)).toBeInTheDocument();
      unmount();
    });
  });
});
