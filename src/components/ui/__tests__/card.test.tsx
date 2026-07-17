import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../card";

describe("Card", () => {
  it("renders children content", () => {
    render(<Card>Conteúdo do card</Card>);
    expect(screen.getByText("Conteúdo do card")).toBeInTheDocument();
  });

  it("applies card styling classes", () => {
    render(<Card>Card</Card>);
    const card = screen.getByText("Card");
    expect(card.className).toContain("rounded-xl");
    expect(card.className).toContain("border");
    expect(card.className).toContain("bg-card");
  });

  it("merges custom className", () => {
    render(<Card className="custom-card">Custom</Card>);
    const card = screen.getByText("Custom");
    expect(card.className).toContain("custom-card");
  });

  it("renders as a div element", () => {
    render(<Card>Div</Card>);
    const card = screen.getByText("Div");
    expect(card.tagName).toBe("DIV");
  });

  it("renders nested subcomponents", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Título</CardTitle>
          <CardDescription>Descrição</CardDescription>
        </CardHeader>
        <CardContent>Conteúdo</CardContent>
        <CardFooter>Rodapé</CardFooter>
      </Card>
    );

    expect(screen.getByText("Título")).toBeInTheDocument();
    expect(screen.getByText("Descrição")).toBeInTheDocument();
    expect(screen.getByText("Conteúdo")).toBeInTheDocument();
    expect(screen.getByText("Rodapé")).toBeInTheDocument();
  });
});

describe("CardHeader", () => {
  it("renders children", () => {
    render(<CardHeader>Cabeçalho</CardHeader>);
    expect(screen.getByText("Cabeçalho")).toBeInTheDocument();
  });

  it("applies flex column layout", () => {
    render(<CardHeader>Cabeçalho</CardHeader>);
    const header = screen.getByText("Cabeçalho");
    expect(header.className).toContain("flex");
    expect(header.className).toContain("p-6");
  });

  it("merges custom className", () => {
    render(<CardHeader className="custom-header">Cabeçalho</CardHeader>);
    const header = screen.getByText("Cabeçalho");
    expect(header.className).toContain("custom-header");
  });
});

describe("CardTitle", () => {
  it("renders as h3 element", () => {
    render(<CardTitle>Título</CardTitle>);
    const title = screen.getByText("Título");
    expect(title.tagName).toBe("H3");
  });

  it("renders title text", () => {
    render(<CardTitle>Título do Card</CardTitle>);
    expect(screen.getByText("Título do Card")).toBeInTheDocument();
  });

  it("applies title styling", () => {
    render(<CardTitle>Título</CardTitle>);
    const title = screen.getByText("Título");
    expect(title.className).toContain("font-semibold");
    expect(title.className).toContain("tracking-tight");
  });
});

describe("CardDescription", () => {
  it("renders as paragraph element", () => {
    render(<CardDescription>Descrição</CardDescription>);
    const description = screen.getByText("Descrição");
    expect(description.tagName).toBe("P");
  });

  it("renders description text", () => {
    render(<CardDescription>Uma descrição detalhada</CardDescription>);
    expect(screen.getByText("Uma descrição detalhada")).toBeInTheDocument();
  });

  it("applies muted text styling", () => {
    render(<CardDescription>Descrição</CardDescription>);
    const description = screen.getByText("Descrição");
    expect(description.className).toContain("text-muted-foreground");
  });
});

describe("CardContent", () => {
  it("renders children", () => {
    render(<CardContent>Conteúdo</CardContent>);
    expect(screen.getByText("Conteúdo")).toBeInTheDocument();
  });

  it("applies padding styling", () => {
    render(<CardContent>Conteúdo</CardContent>);
    const content = screen.getByText("Conteúdo");
    expect(content.className).toContain("p-6");
    expect(content.className).toContain("pt-0");
  });
});

describe("CardFooter", () => {
  it("renders children", () => {
    render(<CardFooter>Rodapé</CardFooter>);
    expect(screen.getByText("Rodapé")).toBeInTheDocument();
  });

  it("applies flex layout for actions", () => {
    render(<CardFooter>Rodapé</CardFooter>);
    const footer = screen.getByText("Rodapé");
    expect(footer.className).toContain("flex");
    expect(footer.className).toContain("items-center");
  });

  it("renders multiple children", () => {
    render(
      <CardFooter>
        <button>Cancelar</button>
        <button>Salvar</button>
      </CardFooter>
    );
    expect(screen.getByText("Cancelar")).toBeInTheDocument();
    expect(screen.getByText("Salvar")).toBeInTheDocument();
  });
});
