/**
 * Fundo "Padrão" da aplicação.
 *
 * Preenche o elemento pai (quem usa define o posicionamento), para servir tanto
 * ao fundo em tela cheia quanto ao card de preview das configurações.
 *
 * Usa gradientes radiais em vez de divs com blur fixo em px: as medidas são
 * relativas ao container, então o mesmo visual sai em 1920px ou em 112px.
 */
export function SilkBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{
        background: [
          "radial-gradient(62% 58% at 6% -8%, hsl(217 91% 55% / 0.20), transparent 70%)",
          "radial-gradient(58% 62% at 97% 106%, hsl(263 70% 65% / 0.16), transparent 70%)",
          "radial-gradient(46% 46% at 58% 40%, hsl(213 90% 62% / 0.12), transparent 70%)",
          "hsl(222 47% 5%)",
        ].join(", "),
      }}
    />
  );
}
